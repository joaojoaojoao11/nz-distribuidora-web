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
import { asaasConfigurado, type AsaasPayment } from './cliente.js';
import { expirarSeVencido, sincronizarComAsaas, type PagamentoRow } from './pagamento.js';
import { despacharAoErp } from '../pedido/despachoErp.js';
import { processar } from '../handlers/asaas.js';

export interface ResultadoManutencao {
  eventosReprocessados: number;
  pixExpirados: number;
  pagamentosConsultados: number;
  erpReenviados: number;
  erros: string[];
}

export async function manutencaoCheckout(site: Db): Promise<ResultadoManutencao> {
  const r: ResultadoManutencao = { eventosReprocessados: 0, pixExpirados: 0, pagamentosConsultados: 0, erpReenviados: 0, erros: [] };
  if (!asaasConfigurado()) return r;
  const agora = new Date().toISOString();

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
