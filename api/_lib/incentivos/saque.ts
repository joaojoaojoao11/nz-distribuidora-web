// Fase 4 (mínima) do plano de indicação (21/10/2026): saque por Pix como
// SOLICITAÇÃO. O cliente cadastra a chave Pix, pede o saque; o site debita a
// carteira (RPC `carteira_solicitar_saque`, atômica) e manda a solicitação ao
// NZERP como título em aberto no Contas a Pagar (`site_solicitar_saque`). O
// financeiro paga como paga qualquer título; o sync lê `saques_site` e marca
// pago — ou devolve o saldo, se o título for cancelado/apagado.
//
// Sem automação de Pix, sem lançamento contábil automático (Fase 6, Davi).

import type { Db } from '../papel.js';
import { clienteErp } from '../pedido/despachoErp.js';
import { devolverDebito } from './carteira.js';
import { registrarEvento } from './gamificacao.js';
import type { PixTipo } from './saqueRegras.js';

export { calcularVencimentoSaque, PIX_TIPOS, validarChavePix, type PixTipo } from './saqueRegras.js';

export const COLUNAS_SAQUE = 'id, user_id, valor, pix_tipo, pix_chave, status, erp_ap_id, erp_erro, erp_enviado_em, vencimento, pago_em, cancelado_em, cancelado_motivo, criado_em';

export interface SaqueRow {
  id: string;
  user_id: string;
  valor: number;
  pix_tipo: PixTipo;
  pix_chave: string;
  status: 'solicitado' | 'enviado' | 'pago' | 'cancelado';
  movimento_id?: number | null;
  erp_ap_id: string | null;
  erp_erro: string | null;
  erp_enviado_em: string | null;
  vencimento: string | null;
  pago_em: string | null;
  cancelado_em: string | null;
  cancelado_motivo: string | null;
  criado_em: string;
}

/** Manda (ou remanda) a solicitação ao NZERP como conta a pagar. Idempotente lá (SAQ-<id>). */
export async function enviarSaqueAoErp(site: Db, saqueId: string): Promise<{ ok: boolean; apId?: string; erro?: string }> {
  const erp = await clienteErp();
  if (!erp) return { ok: false, erro: 'sem-erp' };
  const { data } = await site.from('saques').select(COLUNAS_SAQUE).eq('id', saqueId).maybeSingle();
  const s = data as SaqueRow | null;
  if (!s) return { ok: false, erro: 'saque-nao-encontrado' };
  if (s.erp_ap_id) return { ok: true, apId: s.erp_ap_id };
  if (s.status !== 'solicitado') return { ok: false, erro: `status ${s.status}` };
  const { data: pf } = await site.from('user_profiles').select('full_name, company_name, email, cpf_cnpj').eq('id', s.user_id).maybeSingle();
  const p = pf as { full_name: string | null; company_name: string | null; email: string | null; cpf_cnpj: string | null } | null;
  const { data: r, error } = await erp.rpc('site_solicitar_saque', {
    p: {
      site_saque_id: s.id,
      nome: p?.full_name || p?.company_name || p?.email || 'cliente do site',
      email: p?.email ?? '',
      cpf_cnpj: p?.cpf_cnpj ?? '',
      valor: Number(s.valor),
      pix_tipo: s.pix_tipo,
      pix_chave: s.pix_chave,
      vencimento: s.vencimento,
    },
  });
  if (error) {
    await site.from('saques').update({ erp_erro: error.message.slice(0, 300), atualizado_em: new Date().toISOString() }).eq('id', s.id);
    return { ok: false, erro: error.message };
  }
  const apId = String((r as { ap_id?: string } | null)?.ap_id ?? '');
  if (!apId) return { ok: false, erro: 'erp-sem-id' };
  await site.from('saques').update({ status: 'enviado', erp_ap_id: apId, erp_enviado_em: new Date().toISOString(), erp_erro: null, atualizado_em: new Date().toISOString() }).eq('id', s.id).eq('status', 'solicitado');
  return { ok: true, apId };
}

/**
 * Cron/botão: remanda o que ficou `solicitado` (ERP fora na hora) e espelha a
 * situação dos títulos enviados: pago → saque pago; cancelado/apagado → saque
 * cancelado e o saldo volta à carteira (uma vez só).
 */
export async function sincronizarSaques(site: Db, erp: Db): Promise<{ reenviados: number; pagos: number; cancelados: number; erros: string[] }> {
  const r = { reenviados: 0, pagos: 0, cancelados: 0, erros: [] as string[] };
  const agora = new Date().toISOString();

  const { data: pend } = await site.from('saques').select('id').eq('status', 'solicitado').order('criado_em').limit(50);
  for (const s of (pend ?? []) as { id: string }[]) {
    const e = await enviarSaqueAoErp(site, s.id);
    if (e.ok) r.reenviados++;
    else r.erros.push(`saque ${s.id}: ${e.erro}`);
  }

  const { data: env } = await site.from('saques').select('id, user_id, valor, movimento_id, erp_ap_id').eq('status', 'enviado').limit(500);
  const enviados = (env ?? []) as { id: string; user_id: string; valor: number; movimento_id: number | null; erp_ap_id: string | null }[];
  if (!enviados.length) return r;
  const ids = enviados.map((s) => s.erp_ap_id).filter((x): x is string => Boolean(x));
  const { data: aps, error } = await erp.from('saques_site').select('id, situacao, saldo, valor_pago, data_liquidacao, deleted_at').in('id', ids);
  if (error) {
    r.erros.push('saques_site: ' + error.message);
    return r;
  }
  type Ap = { id: string; situacao: string | null; saldo: number | null; valor_pago: number | null; data_liquidacao: string | null; deleted_at: string | null };
  const porId = new Map(((aps ?? []) as Ap[]).map((a) => [a.id, a]));
  for (const s of enviados) {
    const ap = s.erp_ap_id ? porId.get(s.erp_ap_id) : undefined;
    // Título sumiu de vez (apagado no ERP) = cancelado.
    const sit = (ap?.situacao ?? '').toLowerCase();
    const cancelado = !ap || Boolean(ap.deleted_at) || sit === 'cancelado';
    const pago = Boolean(ap) && !cancelado && (sit === 'pago' || sit === 'paga' || (Number(ap!.saldo ?? 0) <= 0.01 && Number(ap!.valor_pago ?? 0) > 0));
    try {
      if (cancelado) {
        if (s.movimento_id != null) await devolverDebito(site, s.movimento_id, 'saque cancelado no NZERP');
        await site.from('saques').update({ status: 'cancelado', cancelado_em: agora, cancelado_motivo: !ap ? 'título apagado no NZERP' : 'título cancelado no NZERP', atualizado_em: agora }).eq('id', s.id).eq('status', 'enviado');
        await registrarEvento(site, s.user_id, 'saque_cancelado', { valor: Number(s.valor), saqueId: s.id });
        r.cancelados++;
      } else if (pago) {
        const pagoEm = ap!.data_liquidacao ? `${ap!.data_liquidacao}T12:00:00-03:00` : agora;
        await site.from('saques').update({ status: 'pago', pago_em: pagoEm, atualizado_em: agora }).eq('id', s.id).eq('status', 'enviado');
        await registrarEvento(site, s.user_id, 'saque_pago', { valor: Number(s.valor), saqueId: s.id });
        r.pagos++;
      }
    } catch (e) {
      r.erros.push(`saque ${s.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return r;
}
