// Uso consumido de um cupom por pedido (`cupom_usos`). É o que faz valer o
// limite POR CLIENTE (super cupom = 1 compra por indicado, D22). Chamado nos
// dois pontos em que o uso é consumido: pagamento no checkout (marcarPago) e
// faturamento do orçamento (sync). Idempotente: (cupom, pedido) é único.

import type { Db } from '../papel.js';

export async function registrarUsoCupom(site: Db, codigo: string, userId: string | null, pedidoId: string): Promise<void> {
  if (!codigo || !userId || !pedidoId) return;
  await site
    .from('cupom_usos')
    .upsert({ cupom_codigo: codigo, user_id: userId, pedido_id: pedidoId }, { onConflict: 'cupom_codigo,pedido_id', ignoreDuplicates: true })
    .then(
      () => undefined,
      (e: unknown) => console.warn('[cupom] uso não registrado:', e instanceof Error ? e.message : e)
    );
}

/** Quantas vezes ESTE cliente já consumiu o cupom (pedidos pagos/faturados). */
export async function usosDoCliente(site: Db, codigo: string, userId: string): Promise<number> {
  const { count } = await site.from('cupom_usos').select('id', { count: 'exact', head: true }).eq('cupom_codigo', codigo).eq('user_id', userId);
  return Number(count ?? 0);
}

/** Pedidos em aberto DESTE cliente com o cupom (reserva, mesma régua de usosReservados). */
export async function reservasDoCliente(site: Db, codigo: string, userId: string): Promise<number> {
  const { count } = await site
    .from('pedidos')
    .select('id', { count: 'exact', head: true })
    .eq('cupom', codigo)
    .eq('user_id', userId)
    .is('cupom_consumido_em', null)
    .neq('status', 'CANCELADO')
    .or('pagamento_status.is.null,pagamento_status.not.in.(recusado,expirado,vencido,estornado,cancelado)');
  return Number(count ?? 0);
}

/** O cliente já tem compra paga ou faturada? (regra "só conta nova", D2/D22.) */
export async function jaComprou(site: Db, userId: string): Promise<boolean> {
  const { count } = await site
    .from('pedidos')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .or('pagamento_status.eq.pago,status.in.(FATURADO,FATURADO_PARCIAL,PREPARANDO_ENVIO,PRONTO_ENVIO,ENVIADO,ENTREGUE)');
  return Number(count ?? 0) > 0;
}
