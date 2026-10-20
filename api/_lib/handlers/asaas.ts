// POST /api/nz/asaas — webhook do Asaas (cobranças da loja).
//
// Regras que vêm da doc do Asaas e do jeito que a fila deles funciona:
//   · autentica pelo cabeçalho `asaas-access-token` (comparação em tempo
//     constante com ASAAS_WEBHOOK_TOKEN); só 401 quando o token não bate;
//   · entrega "pelo menos uma vez": o `id` do evento é gravado em
//     asaas_eventos antes de processar; repetido → 200 e nada;
//   · 15 falhas seguidas pausam a fila inteira da conta — por isso QUALQUER
//     falha interna responde 200 e deixa o evento com `erro` para o cron
//     reprocessar. Só erro de autenticação ou de corpo devolve ≠ 200;
//   · o payload não é a verdade: antes de marcar pago o servidor reconsulta a
//     cobrança no Asaas e confere pedido (externalReference) e valor.
//
// O NZERP tem o webhook dele na mesma conta Asaas (baixa do contas a receber);
// as cobranças da loja não têm título lá, então ele as ignora. Este aqui
// ignora, do mesmo jeito, cobranças que não conhece.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { consultarCobranca, sanitizarPagamento, type AsaasPayment } from '../asaas/cliente.js';
import { aplicarStatus, estornoParcial, statusDoEvento, valorConfere, type PagamentoRow } from '../asaas/pagamento.js';
import type { Db } from '../papel.js';

function tokensEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

interface EventoAsaas {
  id?: string;
  event?: string;
  dateCreated?: string;
  payment?: AsaasPayment;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  const esperado = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!esperado) {
    res.status(500).json({ error: 'ENV ausente', hasWebhookToken: false });
    return;
  }
  const header = req.headers['asaas-access-token'];
  const recebido = typeof header === 'string' ? header : '';
  if (!recebido || !tokensEqual(recebido, esperado)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const siteUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const siteKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!siteUrl || !siteKey) {
    res.status(500).json({ error: 'ENV ausente', hasSiteUrl: !!siteUrl, hasSiteKey: !!siteKey });
    return;
  }
  const site = createClient(siteUrl, siteKey);

  const body = (typeof req.body === 'string' ? safeJson(req.body) : req.body) as EventoAsaas | null;
  const eventoId = typeof body?.id === 'string' ? body.id : '';
  const evento = typeof body?.event === 'string' ? body.event : '';
  if (!eventoId || !evento) {
    res.status(400).json({ error: 'payload-invalido' });
    return;
  }
  const payment = body?.payment && typeof body.payment === 'object' ? body.payment : null;

  // ---------------------------------------------------------- idempotência
  const { data: inserido, error: insErr } = await site
    .from('asaas_eventos')
    .insert({ id: eventoId, evento, asaas_payment_id: payment?.id ?? null, payload: { ...body, payment: payment ? sanitizarPagamento(payment) : null } })
    .select('id');
  if (insErr && /duplicate|unique/i.test(insErr.message)) {
    res.status(200).json({ ok: true, repetido: true });
    return;
  }
  if (insErr || !inserido?.length) {
    // Sem a trava de idempotência não dá para processar com segurança; mas
    // falhar aqui pausaria a fila. Registra e deixa o Asaas seguir.
    console.error('[asaas-webhook] não gravou evento:', insErr?.message);
    res.status(200).json({ ok: false, motivo: 'evento não gravado' });
    return;
  }

  try {
    const resultado = await processar(site, evento, payment);
    await site.from('asaas_eventos').update({ processado_em: new Date().toISOString(), pedido_id: resultado.pedidoId ?? null, erro: resultado.erro ?? null }).eq('id', eventoId);
    res.status(200).json({ ok: true, ...resultado });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[asaas-webhook] falhou:', evento, msg);
    await site.from('asaas_eventos').update({ erro: msg }).eq('id', eventoId);
    res.status(200).json({ ok: false, motivo: 'processamento adiado' });
  }
}

/**
 * Aplica um evento a um pagamento da loja. Exportado para o cron reprocessar
 * eventos que ficaram com `erro`.
 */
export async function processar(site: Db, evento: string, payment: AsaasPayment | null): Promise<{ pedidoId?: string; status?: string; ignorado?: string; erro?: string; parcela?: number | null }> {
  if (evento.startsWith('ACCESS_TOKEN_')) {
    // Chave desabilitada/expirando: o painel admin lê asaas_eventos e mostra.
    return { ignorado: 'evento de chave, só registrado' };
  }
  if (!payment?.id) return { ignorado: 'sem cobrança' };

  const p = await pagamentoDaCobranca(site, payment);
  if (!p) return { ignorado: 'cobrança não é da loja' };
  const parcelas = Math.max(1, Number(p.parcelas) || 1);

  const novo = statusDoEvento(evento, p.forma);
  if (evento === 'PAYMENT_PARTIALLY_REFUNDED') {
    // Continua pago; só registra quanto voltou. Parcelado: a cobrança que
    // chegou vale uma parcela, e o que voltou dela se soma ao acumulado.
    const atual = await consultarCobranca(payment.id);
    const cheio = parcelas > 1 ? Math.round((Number(p.valor) / parcelas) * 100) / 100 : Number(p.valor);
    const voltou = Math.max(0, cheio - Number(atual.value ?? cheio));
    const estornado = parcelas > 1 ? Math.round((Number(p.estornado_valor ?? 0) + voltou) * 100) / 100 : voltou;
    await site.from('pagamentos').update({ estornado_valor: estornado, ultimo_evento: evento, status_asaas: atual.status, atualizado_em: new Date().toISOString() }).eq('id', p.id);
    return { pedidoId: p.pedido_id, status: p.status };
  }
  if (evento === 'PAYMENT_CHARGEBACK_REQUESTED' || evento === 'PAYMENT_CHARGEBACK_DISPUTE' || evento === 'PAYMENT_AWAITING_CHARGEBACK_REVERSAL') {
    await site.from('pagamentos').update({ ultimo_evento: evento, atualizado_em: new Date().toISOString() }).eq('id', p.id);
    const { data: ped } = await site.from('pedidos').select('observacoes').eq('id', p.pedido_id).maybeSingle();
    const obs = (ped as { observacoes?: string | null } | null)?.observacoes ?? '';
    await site.from('pedidos').update({ observacoes: `${obs ? obs + '\n' : ''}[ASAAS ${evento} em ${new Date().toISOString()}]` }).eq('id', p.pedido_id);
    return { pedidoId: p.pedido_id, status: p.status };
  }
  if (!novo) {
    await site.from('pagamentos').update({ ultimo_evento: evento, status_asaas: payment.status ?? p.status_asaas, atualizado_em: new Date().toISOString() }).eq('id', p.id);
    return { pedidoId: p.pedido_id, status: p.status, ignorado: `evento ${evento} sem transição` };
  }

  // Verdade vem do Asaas, não do corpo do POST.
  let confirmado: AsaasPayment;
  try {
    confirmado = await consultarCobranca(payment.id);
  } catch (err) {
    throw new Error(`reconsulta falhou: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (novo === 'pago') {
    if (confirmado.externalReference && confirmado.externalReference !== p.pedido_id) {
      return { pedidoId: p.pedido_id, erro: `externalReference ${confirmado.externalReference} ≠ pedido ${p.pedido_id}` };
    }
    // Parcelado: cada cobrança do Asaas vale UMA parcela, não o total.
    const recebido = Number(confirmado.value ?? 0);
    if (!valorConfere(p, recebido)) {
      const esperado = parcelas > 1 ? `${Math.round((Number(p.valor) / parcelas) * 100) / 100} (parcela de ${parcelas})` : String(Number(p.valor));
      return { pedidoId: p.pedido_id, erro: `valor ${recebido} ≠ esperado ${esperado}` };
    }
    const s = confirmado.status;
    if (!['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH'].includes(s)) {
      return { pedidoId: p.pedido_id, erro: `Asaas diz ${s}, evento dizia pago` };
    }
  }
  if (novo === 'estornado' && parcelas > 1) {
    // O Asaas estorna parcela a parcela: só vira "estornado" quando todas voltaram.
    const atualizado = await estornoParcial(site, p, Number(confirmado.value ?? 0), evento, confirmado);
    return { pedidoId: p.pedido_id, status: atualizado.status, parcela: confirmado.installmentNumber ?? payment.installmentNumber ?? null };
  }
  const atualizado = await aplicarStatus(site, p, novo, evento, confirmado);
  return { pedidoId: p.pedido_id, status: atualizado.status, parcela: parcelas > 1 ? (confirmado.installmentNumber ?? payment.installmentNumber ?? null) : undefined };
}

/**
 * A linha de `pagamentos` a que uma cobrança do Asaas pertence.
 *
 * Cobrança única: pelo próprio `pay_`. Cartão parcelado: a loja grava só a
 * 1ª parcela; as irmãs chegam com outro `pay_` e o mesmo `installment`. Para
 * pagamento gravado antes de a coluna existir, casa pelo pedido
 * (`externalReference`) e já guarda o id para a próxima.
 */
async function pagamentoDaCobranca(site: Db, payment: AsaasPayment): Promise<PagamentoRow | null> {
  const { data } = await site.from('pagamentos').select('*').eq('asaas_payment_id', payment.id).maybeSingle();
  if (data) return data as PagamentoRow;
  if (!payment.installment) return null;

  const { data: irma } = await site.from('pagamentos').select('*').eq('asaas_installment_id', payment.installment).maybeSingle();
  if (irma) return irma as PagamentoRow;

  if (!payment.externalReference) return null;
  const { data: doPedido } = await site
    .from('pagamentos')
    .select('*')
    .eq('pedido_id', payment.externalReference)
    .eq('forma', 'CREDIT_CARD')
    .order('criado_em', { ascending: false })
    .limit(1)
    .maybeSingle();
  const cand = doPedido as PagamentoRow | null;
  if (!cand || Number(cand.parcelas) <= 1 || cand.asaas_installment_id) return null;
  await site.from('pagamentos').update({ asaas_installment_id: payment.installment }).eq('id', cand.id);
  return { ...cand, asaas_installment_id: payment.installment };
}

function safeJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
