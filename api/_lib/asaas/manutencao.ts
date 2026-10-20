// Manutenção do checkout — roda no cron diário (handlers/sync.ts) e no botão
// do painel admin. Tudo idempotente; rodar duas vezes seguidas não muda nada.
//
//   1. eventos do webhook que ficaram com `erro` (Asaas fora, ERP fora):
//      reprocessa;
//   2. Pix "aguardando" que passou do prazo: remove no Asaas e marca expirado
//      (o cliente que não voltou à página nunca disparou a expiração);
//   3. pagamentos "aguardando"/"em_analise" com mais de 1 h: reconsulta o
//      Asaas — cobre webhook perdido (boleto compensado, análise concluída);
//   4. pedidos PAGOS que o ERP ainda não sabe: despacha. Pedido não pago
//      nunca entra nesta fila — o ERP só recebe o que foi aprovado.

import type { Db } from '../papel.js';
import { asaasConfigurado, consultarCobranca, type AsaasPayment } from './cliente.js';
import { expirarSeVencido, liquidoDoPagamento, sincronizarComAsaas, type PagamentoRow } from './pagamento.js';
import { despacharAoErp } from '../pedido/despachoErp.js';
import { processar } from '../handlers/asaas.js';

export interface ResultadoManutencao {
  eventosReprocessados: number;
  pixExpirados: number;
  pagamentosConsultados: number;
  erpReenviados: number;
  parceladosCorrigidos: number;
  erros: string[];
}

export async function manutencaoCheckout(site: Db): Promise<ResultadoManutencao> {
  const r: ResultadoManutencao = { eventosReprocessados: 0, pixExpirados: 0, pagamentosConsultados: 0, erpReenviados: 0, parceladosCorrigidos: 0, erros: [] };
  if (!asaasConfigurado()) return r;
  const agora = new Date().toISOString();

  // 0. cartão parcelado gravado sem o id do parcelamento, ou com o líquido só
  //    da 1ª parcela (bug até 20/10/2026): busca o id na cobrança e soma o
  //    líquido das N parcelas. Uma vez por linha; depois a linha sai do filtro.
  const { data: parcelados } = await site.from('pagamentos').select('*').eq('status', 'pago').gt('parcelas', 1).limit(50);
  for (const p of (parcelados ?? []) as PagamentoRow[]) {
    const parcela = Number(p.valor) / Math.max(1, Number(p.parcelas));
    const liquidoSuspeito = p.valor_liquido == null || Number(p.valor_liquido) < parcela * 1.5;
    if (p.asaas_installment_id && !liquidoSuspeito) continue;
    try {
      let installment = p.asaas_installment_id;
      if (!installment && p.asaas_payment_id) installment = (await consultarCobranca(p.asaas_payment_id)).installment ?? null;
      if (!installment) continue;
      const liquido = await liquidoDoPagamento({ ...p, asaas_installment_id: installment });
      if (liquido == null) continue;
      await site.from('pagamentos').update({ asaas_installment_id: installment, valor_liquido: liquido, atualizado_em: agora }).eq('id', p.id);
      r.parceladosCorrigidos++;
    } catch (err) {
      r.erros.push(`parcelado ${p.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 1. eventos pendentes (até 50 por rodada, mais antigos primeiro)
  const { data: eventos } = await site
    .from('asaas_eventos')
    .select('id, evento, payload')
    .is('processado_em', null)
    .order('recebido_em', { ascending: true })
    .limit(50);
  for (const ev of (eventos ?? []) as { id: string; evento: string; payload: { payment?: AsaasPayment } }[]) {
    try {
      const res = await processar(site, ev.evento, ev.payload?.payment ?? null);
      await site.from('asaas_eventos').update({ processado_em: agora, erro: res.erro ?? null, pedido_id: res.pedidoId ?? null }).eq('id', ev.id);
      r.eventosReprocessados++;
    } catch (err) {
      r.erros.push(`evento ${ev.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 1b. eventos da loja que ficaram com `erro` na última semana e ninguém
  //     marcou como resolvidos: reprocessa (é idempotente). Se agora passa,
  //     o erro some sozinho — foi o caso das parcelas do cartão.
  const seteDias = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data: comErro } = await site
    .from('asaas_eventos')
    .select('id, evento, payload')
    .not('erro', 'is', null)
    .is('resolvido_em', null)
    .not('pedido_id', 'is', null)
    .gte('recebido_em', seteDias)
    .order('recebido_em', { ascending: true })
    .limit(50);
  for (const ev of (comErro ?? []) as { id: string; evento: string; payload: { payment?: AsaasPayment } }[]) {
    try {
      const res = await processar(site, ev.evento, ev.payload?.payment ?? null);
      await site.from('asaas_eventos').update({ processado_em: agora, erro: res.erro ?? null, pedido_id: res.pedidoId ?? null }).eq('id', ev.id);
      if (!res.erro) r.eventosReprocessados++;
    } catch (err) {
      r.erros.push(`evento ${ev.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 2 e 3. pagamentos em aberto
  const { data: abertos } = await site.from('pagamentos').select('*').in('status', ['aguardando', 'em_analise']).order('criado_em', { ascending: true }).limit(200);
  for (const p of (abertos ?? []) as PagamentoRow[]) {
    try {
      if (p.forma === 'PIX' && p.expira_em && new Date(p.expira_em).getTime() < Date.now()) {
        const depois = await expirarSeVencido(site, p);
        if (depois.status === 'expirado') r.pixExpirados++;
        continue;
      }
      if (Date.now() - new Date(p.criado_em).getTime() > 60 * 60_000) {
        await sincronizarComAsaas(site, p, 30 * 60);
        r.pagamentosConsultados++;
      }
    } catch (err) {
      r.erros.push(`pagamento ${p.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 4. ERP atrasado — SÓ pedido pago. Um Pix gerado e nunca pago não vira
  //    orçamento nem aqui: a fila é "pago e o ERP ainda não sabe".
  const { data: pendentesErp } = await site
    .from('pedidos')
    .select('id')
    .eq('pagamento_status', 'pago')
    .neq('status', 'CANCELADO')
    .or('erp_envio.neq.enviado,erp_pago_em.is.null')
    .limit(100);
  for (const ped of (pendentesErp ?? []) as { id: string }[]) {
    try {
      const d = await despacharAoErp(site, ped.id, 'pago');
      if (d.ok) r.erpReenviados++;
      else if (d.estado === 'erro') r.erros.push(`erp ${ped.id}: ${d.message ?? 'falhou'}`);
    } catch (err) {
      r.erros.push(`erp ${ped.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return r;
}
