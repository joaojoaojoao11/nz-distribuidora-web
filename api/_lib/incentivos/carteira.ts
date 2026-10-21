// Carteira em R$ — o razão (`carteira_movimentos`). Só o servidor escreve.
//
//   · crédito nasce "a_liberar" (com libera_em) ou "disponivel";
//   · débito (uso em compra, saque) é um movimento NEGATIVO "disponivel";
//   · estorno de crédito ainda a liberar = marca "estornado"; de crédito já
//     disponível = movimento negativo "estorno" apontando o original;
//   · expiração = marca "expirado" (sai da soma);
//   · saldo = soma por status. Nunca se apaga nada.

import type { Db } from '../papel.js';
import { r2 } from '../pedido/dinheiro.js';

export type TipoMovimento =
  | 'cashback_indicacao'
  | 'comissao_ativacao'
  | 'comissao_recorrencia'
  | 'bonus_meta'
  | 'bonus_campanha'
  | 'resgate_pontos'
  | 'uso_compra'
  | 'saque'
  | 'estorno'
  | 'expiracao'
  | 'ajuste';

export type StatusMovimento = 'a_liberar' | 'disponivel' | 'estornado' | 'expirado';

export interface Movimento {
  id: number;
  user_id: string;
  tipo: TipoMovimento;
  valor: number;
  status: StatusMovimento;
  libera_em: string | null;
  expira_em: string | null;
  pedido_id: string | null;
  origem_user_id: string | null;
  cupom_codigo: string | null;
  periodo: string | null;
  percentual_aplicado: number | null;
  multiplicador: number | null;
  base_valor: number | null;
  referencia_id: number | null;
  obs: string | null;
  criado_por: string | null;
  criado_em: string;
  liberado_em: string | null;
  estornado_em: string | null;
  expirado_em: string | null;
}

export const COLUNAS_MOVIMENTO =
  'id, user_id, tipo, valor, status, libera_em, expira_em, pedido_id, origem_user_id, cupom_codigo, periodo, percentual_aplicado, multiplicador, base_valor, referencia_id, obs, criado_por, criado_em, liberado_em, estornado_em, expirado_em';

export interface Saldo {
  disponivel: number;
  aLiberar: number;
  total: number;
}

export interface NovoCredito {
  userId: string;
  tipo: TipoMovimento;
  valor: number;
  /** Nulo = já disponível. */
  liberaEm?: Date | null;
  pedidoId?: string | null;
  origemUserId?: string | null;
  cupomCodigo?: string | null;
  periodo?: string | null;
  percentualAplicado?: number | null;
  multiplicador?: number | null;
  baseValor?: number | null;
  obs?: string | null;
  criadoPor?: string | null;
}

/**
 * Credita. Idempotente para créditos de pedido: o índice único
 * (tipo, pedido_id, user_id) recusa a segunda vez e devolvemos o que já existe.
 */
export async function creditar(site: Db, c: NovoCredito): Promise<{ movimento: Movimento | null; repetido: boolean; erro?: string }> {
  const valor = r2(Number(c.valor) || 0);
  if (valor <= 0) return { movimento: null, repetido: false, erro: 'valor-zero' };
  const aLiberar = Boolean(c.liberaEm && c.liberaEm.getTime() > Date.now());
  const linha = {
    user_id: c.userId,
    tipo: c.tipo,
    valor,
    status: aLiberar ? 'a_liberar' : 'disponivel',
    libera_em: c.liberaEm ? c.liberaEm.toISOString() : null,
    liberado_em: aLiberar ? null : new Date().toISOString(),
    pedido_id: c.pedidoId ?? null,
    origem_user_id: c.origemUserId ?? null,
    cupom_codigo: c.cupomCodigo ?? null,
    periodo: c.periodo ?? null,
    percentual_aplicado: c.percentualAplicado ?? null,
    multiplicador: c.multiplicador ?? null,
    base_valor: c.baseValor != null ? r2(c.baseValor) : null,
    obs: c.obs ?? null,
    criado_por: c.criadoPor ?? 'motor',
  };
  const { data, error } = await site.from('carteira_movimentos').insert(linha).select(COLUNAS_MOVIMENTO).single();
  if (error) {
    if (String(error.code) === '23505' && c.pedidoId) {
      const { data: existente } = await site
        .from('carteira_movimentos')
        .select(COLUNAS_MOVIMENTO)
        .eq('tipo', c.tipo)
        .eq('pedido_id', c.pedidoId)
        .eq('user_id', c.userId)
        .maybeSingle();
      return { movimento: (existente as Movimento | null) ?? null, repetido: true };
    }
    return { movimento: null, repetido: false, erro: error.message };
  }
  return { movimento: data as Movimento, repetido: false };
}

/** Débito (uso em compra, saque, ajuste negativo): movimento negativo já disponível. */
export async function debitar(site: Db, d: { userId: string; tipo: 'uso_compra' | 'saque' | 'ajuste'; valor: number; pedidoId?: string | null; obs?: string | null; criadoPor?: string | null }): Promise<{ movimento: Movimento | null; erro?: string }> {
  const valor = r2(Math.abs(Number(d.valor) || 0));
  if (valor <= 0) return { movimento: null, erro: 'valor-zero' };
  const { data, error } = await site
    .from('carteira_movimentos')
    .insert({ user_id: d.userId, tipo: d.tipo, valor: -valor, status: 'disponivel', liberado_em: new Date().toISOString(), pedido_id: d.pedidoId ?? null, obs: d.obs ?? null, criado_por: d.criadoPor ?? 'motor' })
    .select(COLUNAS_MOVIMENTO)
    .single();
  if (error) return { movimento: null, erro: error.message };
  return { movimento: data as Movimento };
}

export async function saldoDe(site: Db, userId: string): Promise<Saldo> {
  const { data } = await site.from('carteira_saldos').select('disponivel, a_liberar, total').eq('user_id', userId).maybeSingle();
  const s = data as { disponivel?: number; a_liberar?: number; total?: number } | null;
  return { disponivel: r2(Number(s?.disponivel ?? 0)), aLiberar: r2(Number(s?.a_liberar ?? 0)), total: r2(Number(s?.total ?? 0)) };
}

export async function extratoDe(site: Db, userId: string, limite = 200): Promise<Movimento[]> {
  const { data } = await site.from('carteira_movimentos').select(COLUNAS_MOVIMENTO).eq('user_id', userId).order('criado_em', { ascending: false }).limit(limite);
  return (data ?? []) as Movimento[];
}

/**
 * Estorna os créditos de um pedido (cancelado/devolvido no ERP). A liberar →
 * "estornado"; disponível → movimento negativo "estorno". Idempotente: o que
 * já foi estornado não volta a ser. Devolve quantos movimentos tocou.
 */
export async function estornarPorPedido(site: Db, pedidoId: string, motivo: string): Promise<number> {
  const { data } = await site
    .from('carteira_movimentos')
    .select(COLUNAS_MOVIMENTO)
    .eq('pedido_id', pedidoId)
    .in('tipo', ['cashback_indicacao', 'comissao_ativacao', 'comissao_recorrencia'])
    .in('status', ['a_liberar', 'disponivel']);
  return estornarLista(site, (data ?? []) as Movimento[], motivo, pedidoId);
}

/** Estorna movimentos pelo id (bônus de conquista devolvida, D29). Mesma regra do estorno por pedido. */
export async function estornarMovimentos(site: Db, ids: number[], motivo: string): Promise<number> {
  if (!ids.length) return 0;
  const { data } = await site.from('carteira_movimentos').select(COLUNAS_MOVIMENTO).in('id', ids).in('status', ['a_liberar', 'disponivel']);
  return estornarLista(site, (data ?? []) as Movimento[], motivo, null);
}

async function estornarLista(site: Db, creditos: Movimento[], motivo: string, pedidoId: string | null): Promise<number> {
  let tocados = 0;
  const agora = new Date().toISOString();
  for (const m of creditos) {
    if (m.status === 'a_liberar') {
      const { error } = await site.from('carteira_movimentos').update({ status: 'estornado', estornado_em: agora, obs: [m.obs, `estornado: ${motivo}`].filter(Boolean).join(' · ') }).eq('id', m.id).eq('status', 'a_liberar');
      if (!error) tocados++;
      continue;
    }
    // Já disponível: um estorno por original (referencia_id), nunca dois.
    const { data: ja } = await site.from('carteira_movimentos').select('id').eq('referencia_id', m.id).eq('tipo', 'estorno').limit(1);
    if ((ja ?? []).length) continue;
    const { error } = await site
      .from('carteira_movimentos')
      .insert({ user_id: m.user_id, tipo: 'estorno', valor: -Math.abs(Number(m.valor)), status: 'disponivel', liberado_em: agora, pedido_id: pedidoId ?? m.pedido_id, origem_user_id: m.origem_user_id, referencia_id: m.id, obs: `estorno: ${motivo}`, criado_por: 'motor' });
    if (!error) tocados++;
  }
  return tocados;
}

/** Cron diário: libera os "a liberar" vencidos e expira os disponíveis antigos (D11). */
export async function manutencaoCarteira(site: Db, mesesValidade: number): Promise<{ liberados: number; expirados: number }> {
  const agora = new Date();
  const { data: lib } = await site
    .from('carteira_movimentos')
    .update({ status: 'disponivel', liberado_em: agora.toISOString() })
    .eq('status', 'a_liberar')
    .lte('libera_em', agora.toISOString())
    .select('id');
  const limite = new Date(agora);
  limite.setMonth(limite.getMonth() - Math.max(1, mesesValidade));
  // Só CRÉDITOS expiram (valor > 0); débitos nunca.
  const { data: exp } = await site
    .from('carteira_movimentos')
    .update({ status: 'expirado', expirado_em: agora.toISOString() })
    .eq('status', 'disponivel')
    .gt('valor', 0)
    .in('tipo', ['cashback_indicacao', 'comissao_ativacao', 'comissao_recorrencia', 'bonus_meta', 'bonus_campanha', 'resgate_pontos', 'ajuste'])
    .lte('liberado_em', limite.toISOString())
    .select('id');
  return { liberados: (lib ?? []).length, expirados: (exp ?? []).length };
}

/** Rótulo em português de cada tipo (painel e admin). */
export const ROTULO_TIPO: Record<TipoMovimento, string> = {
  cashback_indicacao: 'Cashback de indicação',
  comissao_ativacao: 'Comissão de ativação',
  comissao_recorrencia: 'Comissão de recorrência',
  bonus_meta: 'Bônus de meta',
  bonus_campanha: 'Bônus de campanha',
  resgate_pontos: 'Resgate de pontos',
  uso_compra: 'Usado em compra',
  saque: 'Saque',
  estorno: 'Estorno',
  expiracao: 'Expirado',
  ajuste: 'Ajuste da NZ',
};
