// Fase 3 do plano de indicação (21/10/2026): usar o saldo da carteira no checkout.
//
//   · `calcularUsoDeSaldo` decide quanto do saldo entra num pedido: tudo que
//     der, mas o que sobrar para o Asaas nunca fica abaixo da cobrança mínima
//     (se sobraria menos que o mínimo, usa-se menos saldo);
//   · a reserva é um débito `uso_compra` feito pela RPC `carteira_reservar_uso`
//     (lock por pessoa: dois checkouts ao mesmo tempo não gastam o mesmo real);
//   · pagamento expirado/recusado/vencido/cancelado/estornado ou pedido
//     cancelado no ERP devolve a reserva (`devolverSaldoDoPedido`, idempotente);
//   · saldo cobre tudo → o pedido nasce PAGO (forma SALDO), sem cobrança no
//     Asaas, e segue o mesmo caminho do pago: cupom, ERP, aviso à NZ.
//
// A contabilidade do "cashback usado" no ERP (baixa do recebível com meio
// Cashback, 2.1.05.003) fica para a Fase 6, com o ok do Davi. Por ora o ERP
// recebe `cashback_usado` no pedido e o valor que o Asaas de fato cobrou.

import type { Db } from '../papel.js';
import { r2 } from '../pedido/dinheiro.js';
import { despacharAoErp, type ResultadoDespacho } from '../pedido/despachoErp.js';
import { avisarPagamentoConfirmado, type ClienteAviso } from '../avisos.js';
import { registrarUsoCupom } from './cupomUsos.js';
import { apagarReserva, devolverDebito, reservarSaldo } from './carteira.js';

/** Quanto do saldo entra e quanto sobra para cobrar. Regra pura, testada em scripts/test-checkout.mjs. */
export function calcularUsoDeSaldo(total: number, disponivel: number, cobrancaMinima: number): { usar: number; cobrar: number } {
  const t = r2(Math.max(0, Number(total) || 0));
  const d = r2(Math.max(0, Number(disponivel) || 0));
  const min = r2(Math.max(0, Number(cobrancaMinima) || 0));
  if (t <= 0 || d <= 0) return { usar: 0, cobrar: t };
  let usar = Math.min(d, t);
  let cobrar = r2(t - usar);
  // Sobrou pouco para o Asaas: segura parte do saldo para a cobrança valer o mínimo.
  if (cobrar > 0 && cobrar < min) {
    usar = r2(Math.max(0, t - min));
    cobrar = r2(t - usar);
  }
  return { usar: r2(usar), cobrar };
}

interface PedidoSaldo {
  id: string;
  numero: number | null;
  user_id: string | null;
  saldo_usado: number | null;
  saldo_movimento_id: number | null;
  saldo_devolvido_em: string | null;
}

const CAMPOS = 'id, numero, user_id, saldo_usado, saldo_movimento_id, saldo_devolvido_em';

/** Reserva `valor` da carteira para o pedido e grava no pedido. */
export async function reservarSaldoDoPedido(site: Db, pedido: { id: string; numero: number; userId: string }, valor: number): Promise<{ ok: true; movimentoId: number } | { ok: false; erro: string }> {
  const r = await reservarSaldo(site, pedido.userId, valor, pedido.id, `Pedido #${pedido.numero}`);
  if (r.movimentoId == null) return { ok: false, erro: r.erro ?? 'nao-reservou' };
  const { error } = await site.from('pedidos').update({ saldo_usado: r2(valor), saldo_movimento_id: r.movimentoId, saldo_devolvido_em: null }).eq('id', pedido.id);
  if (error) {
    await apagarReserva(site, r.movimentoId);
    return { ok: false, erro: error.message };
  }
  return { ok: true, movimentoId: r.movimentoId };
}

/** O pedido não vai existir (cobrança falhou): a reserva some sem deixar rastro. */
export async function apagarReservaDoPedido(site: Db, pedidoId: string): Promise<void> {
  const { data } = await site.from('pedidos').select(CAMPOS).eq('id', pedidoId).maybeSingle();
  const p = data as PedidoSaldo | null;
  if (p?.saldo_movimento_id != null) await apagarReserva(site, p.saldo_movimento_id);
}

/** Devolve a reserva do pedido à carteira (uma vez só). Devolve true se devolveu agora. */
export async function devolverSaldoDoPedido(site: Db, pedidoId: string, motivo: string): Promise<boolean> {
  const { data } = await site.from('pedidos').select(CAMPOS).eq('id', pedidoId).maybeSingle();
  const p = data as PedidoSaldo | null;
  if (!p || p.saldo_movimento_id == null || p.saldo_devolvido_em || Number(p.saldo_usado ?? 0) <= 0) return false;
  const devolveu = await devolverDebito(site, p.saldo_movimento_id, motivo);
  if (!devolveu) return false;
  await site.from('pedidos').update({ saldo_devolvido_em: new Date().toISOString() }).eq('id', pedidoId);
  return true;
}

/**
 * Saldo cobriu o pedido inteiro: marca pago (forma SALDO) e faz o que o
 * pagamento do Asaas faria — consome o cupom, avisa o ERP, avisa a NZ.
 * Idempotente: pedido já pago só reenvia ao ERP se faltou.
 */
export async function marcarPagoComSaldo(site: Db, pedidoId: string): Promise<ResultadoDespacho> {
  const agora = new Date().toISOString();
  const { data } = await site.from('pedidos').select('id, numero, user_id, cupom, cupom_consumido_em, pagamento_status, saldo_usado').eq('id', pedidoId).maybeSingle();
  const pedido = data as { id: string; numero: number; user_id: string | null; cupom: string | null; cupom_consumido_em: string | null; pagamento_status: string; saldo_usado: number | null } | null;
  if (!pedido) return { ok: false, estado: 'erro', message: 'pedido-nao-encontrado' };
  if (pedido.pagamento_status !== 'pago') {
    const { data: marcado } = await site
      .from('pedidos')
      .update({ pagamento_status: 'pago', pago_em: agora, forma_pagamento: 'SALDO' })
      .eq('id', pedido.id)
      .neq('pagamento_status', 'pago')
      .select('id');
    if ((marcado ?? []).length && pedido.cupom && !pedido.cupom_consumido_em) {
      await site.rpc('cupom_consumir', { p_codigo: pedido.cupom });
      await site.from('pedidos').update({ cupom_consumido_em: agora }).eq('id', pedido.id).is('cupom_consumido_em', null);
      await registrarUsoCupom(site, pedido.cupom, pedido.user_id, pedido.id);
    }
  }
  const d = await despacharAoErp(site, pedido.id, 'pago');
  if (!d.ok && d.estado === 'erro') console.warn('[checkout] ERP não avisado do pedido pago com saldo (cron tenta de novo):', d.message);

  const { data: cli } = pedido.user_id ? await site.from('user_profiles').select('full_name, company_name, email, phone, address_city, address_state').eq('id', pedido.user_id).maybeSingle() : { data: null };
  await avisarPagamentoConfirmado(site, {
    pagamentoId: `saldo:${pedido.id}`,
    numero: pedido.numero,
    cliente: (cli as ClienteAviso | null) ?? null,
    valor: Number(pedido.saldo_usado ?? 0),
    forma: 'SALDO',
    parcelas: 1,
    erp: { ok: d.ok, estado: d.estado, quoteNumber: d.quoteNumber ?? null },
  }).catch(() => undefined);
  return d;
}
