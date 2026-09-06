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
import { aplicarStatus, statusDoEvento, type PagamentoRow } from '../asaas/pagamento.js';
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
export async function processar(site: Db, evento: string, payment: AsaasPayment | null): Promise<{ pedidoId?: string; status?: string; ignorado?: string; erro?: string }> {
  if (evento.startsWith('ACCESS_TOKEN_')) {
    // Chave desabilitada/expirando: o painel admin lê asaas_eventos e mostra.
    return { ignorado: 'evento de chave, só registrado' };
  }
  if (!payment?.id) return { ignorado: 'sem cobrança' };

  const { data } = await site.from('pagamentos').select('*').eq('asaas_payment_id', payment.id).maybeSingle();
  const p = data as PagamentoRow | null;
  if (!p) return { ignorado: 'cobrança não é da loja' };

  const novo = statusDoEvento(evento, p.forma);
  if (evento === 'PAYMENT_PARTIALLY_REFUNDED') {
    // Continua pago; só registra quanto voltou.
    const atual = await consultarCobranca(payment.id);
    const estornado = Math.max(0, Number(p.valor) - Number(atual.value ?? p.valor));
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
    const esperado = Number(p.valor);
    const recebido = Number(confirmado.value ?? 0);
    if (Math.abs(esperado - recebido) > 0.01) {
      return { pedidoId: p.pedido_id, erro: `valor ${recebido} ≠ esperado ${esperado}` };
    }
    const s = confirmado.status;
    if (!['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH'].includes(s)) {
      return { pedidoId: p.pedido_id, erro: `Asaas diz ${s}, evento dizia pago` };
    }
  }
  const atualizado = await aplicarStatus(site, p, novo, evento, confirmado);
  return { pedidoId: p.pedido_id, status: atualizado.status };
}

function safeJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
