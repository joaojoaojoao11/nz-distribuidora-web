// Uso consumido de um cupom por pedido (`cupom_usos`). É o que faz valer o
// limite POR CLIENTE (super cupom = 1 compra por indicado, D22). Chamado nos
// dois pontos em que o uso é consumido: pagamento no checkout (marcarPago) e
// faturamento do orçamento (sync). Idempotente: (cupom, pedido) é único.

import type { Db } from '../papel.js';
import { documentoComMascara, somenteDigitos, validarCpfCnpj } from '../conta/documento.js';

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
    // Boleto VENCIDO ainda se paga (multa e juros): o pedido continua segurando o
    // cupom (varredura 22/10). Antes ele soltava, e um 2º pedido com o mesmo
    // cupom de uso único passava — e os dois podiam ser pagos.
    .or('pagamento_status.is.null,pagamento_status.not.in.(recusado,expirado,estornado,cancelado)');
  return Number(count ?? 0);
}

/**
 * O cliente já comprou na NZ? (regra "só conta nova" do super cupom, D2/D22.)
 * Pedido pago/faturado no site OU pedido entregue no NZERP — pelo vínculo da
 * conta ou pelo documento (varredura 22/10). Antes só o site contava, e um
 * cliente de anos que abria a conta agora usava o cupom de "primeira compra" e
 * ainda dava cashback ao indicador.
 */
export async function jaComprou(site: Db, userId: string): Promise<boolean> {
  const { count } = await site
    .from('pedidos')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .or('pagamento_status.eq.pago,status.in.(FATURADO,FATURADO_PARCIAL,PREPARANDO_ENVIO,PRONTO_ENVIO,ENVIADO,ENTREGUE)');
  if (Number(count ?? 0) > 0) return true;

  const { data: pf } = await site.from('user_profiles').select('erp_client_id, cpf_cnpj').eq('id', userId).maybeSingle();
  const perfil = pf as { erp_client_id: string | null; cpf_cnpj: string | null } | null;
  const doc = somenteDigitos(perfil?.cpf_cnpj);
  const chaves: string[] = [];
  if (perfil?.erp_client_id && /^[0-9a-f-]{36}$/i.test(perfil.erp_client_id)) chaves.push(`id.eq.${perfil.erp_client_id}`);
  if (validarCpfCnpj(doc)) chaves.push(`cpf_cnpj.eq.${doc}`, `cpf_cnpj.eq.${documentoComMascara(doc)}`);
  if (!chaves.length) return false;
  // Conexão direta (só leitura da view clientes_site): este módulo fica leve, sem o despacho ao ERP.
  const url = process.env.ERP_SUPABASE_URL;
  const key = process.env.ERP_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return false;
  const { createClient } = await import('@supabase/supabase-js');
  const erp = createClient(url, key);
  const { data } = await erp.from('clientes_site').select('id').or(chaves.join(',')).gt('pedidos_entregues', 0).limit(1);
  return ((data ?? []) as unknown[]).length > 0;
}
