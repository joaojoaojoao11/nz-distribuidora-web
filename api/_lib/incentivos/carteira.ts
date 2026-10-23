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
  /** Esperando a ENTREGA do pedido no NZERP (23/10/2026): não libera antes dela. */
  libera_apos_entrega: boolean;
}

export const COLUNAS_MOVIMENTO =
  'id, user_id, tipo, valor, status, libera_em, expira_em, pedido_id, origem_user_id, cupom_codigo, periodo, percentual_aplicado, multiplicador, base_valor, referencia_id, obs, criado_por, criado_em, liberado_em, estornado_em, expirado_em, libera_apos_entrega';

export interface Saldo {
  disponivel: number;
  aLiberar: number;
  total: number;
}

export interface NovoCredito {
  userId: string;
  tipo: TipoMovimento;
  valor: number;
  /** Nulo = já disponível. Com `aguardaEntrega`, é o "não antes de". */
  liberaEm?: Date | null;
  /** Crédito de pedido: só libera depois da ENTREGA + carência (#10, 23/10/2026). */
  aguardaEntrega?: boolean;
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
  const aLiberar = c.aguardaEntrega === true || Boolean(c.liberaEm && c.liberaEm.getTime() > Date.now());
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
    libera_apos_entrega: c.aguardaEntrega === true,
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

/**
 * Reserva saldo para um pedido (Fase 3): débito `uso_compra` pela RPC
 * `carteira_reservar_uso`, que trava por pessoa e confere o disponível na
 * mesma transação. `erro` = 'saldo-insuficiente' quando não dá.
 */
export async function reservarSaldo(site: Db, userId: string, valor: number, pedidoId: string, obs?: string | null): Promise<{ movimentoId: number | null; erro?: string }> {
  const v = r2(Number(valor) || 0);
  if (v <= 0) return { movimentoId: null, erro: 'valor-zero' };
  const { data, error } = await site.rpc('carteira_reservar_uso', { p_user_id: userId, p_valor: v, p_pedido_id: pedidoId, p_obs: obs ?? null });
  if (error) return { movimentoId: null, erro: /saldo-insuficiente/.test(error.message) ? 'saldo-insuficiente' : error.message };
  const id = Number(data);
  return Number.isFinite(id) && id > 0 ? { movimentoId: id } : { movimentoId: null, erro: 'rpc-sem-id' };
}

/**
 * Devolve um débito (uso em compra) à carteira: movimento `estorno` POSITIVO
 * apontando o débito. Um por débito, nunca dois. Devolve true se devolveu agora.
 */
export async function devolverDebito(site: Db, movimentoId: number, motivo: string): Promise<boolean> {
  const { data } = await site.from('carteira_movimentos').select(COLUNAS_MOVIMENTO).eq('id', movimentoId).maybeSingle();
  const m = data as Movimento | null;
  // Débitos que podem voltar: uso em compra (pedido morto) e saque (título cancelado).
  if (!m || (m.tipo !== 'uso_compra' && m.tipo !== 'saque') || Number(m.valor) >= 0) return false;
  const { data: ja } = await site.from('carteira_movimentos').select('id').eq('referencia_id', m.id).eq('tipo', 'estorno').limit(1);
  if ((ja ?? []).length) return false;
  const { error } = await site
    .from('carteira_movimentos')
    .insert({ user_id: m.user_id, tipo: 'estorno', valor: Math.abs(Number(m.valor)), status: 'disponivel', liberado_em: new Date().toISOString(), pedido_id: m.pedido_id, referencia_id: m.id, obs: `saldo devolvido: ${motivo}`, criado_por: 'checkout' });
  return !error;
}

/**
 * Apaga uma reserva cujo pedido não chegou a existir (a cobrança falhou e o
 * pedido foi apagado). É a única exceção ao "nunca apagar, estornar": um
 * débito e um estorno de um pedido inexistente só sujariam o extrato.
 */
export async function apagarReserva(site: Db, movimentoId: number): Promise<void> {
  const { data: ja } = await site.from('carteira_movimentos').select('id').eq('referencia_id', movimentoId).limit(1);
  if ((ja ?? []).length) return;
  await site.from('carteira_movimentos').delete().eq('id', movimentoId).eq('tipo', 'uso_compra');
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

/** Créditos que perdem a validade (D11). Débitos e estornos nunca. */
export const TIPOS_QUE_EXPIRAM: TipoMovimento[] = ['cashback_indicacao', 'comissao_ativacao', 'comissao_recorrencia', 'bonus_meta', 'bonus_campanha', 'resgate_pontos', 'ajuste'];

/**
 * Cron diário: libera os "a liberar" vencidos e expira os disponíveis antigos (D11).
 *
 * Expiração em FIFO (varredura 22/10): o que a pessoa gastou saiu dos créditos
 * MAIS ANTIGOS, então do crédito vencido só expira o que sobrou dele — num
 * movimento `expiracao` negativo (carteira_expirar_usuario, com a mesma trava
 * do checkout). Antes o crédito inteiro virava "expirado" mesmo já gasto em
 * parte, e o saldo ficava negativo.
 */
export async function manutencaoCarteira(site: Db, mesesValidade: number): Promise<{ liberados: number; semEntrega: number; expirados: number; valorExpirado: number; erros: string[] }> {
  const agora = new Date();
  const erros: string[] = [];
  // Pedido que o NZERP nunca marca como entregue: depois de DIAS_SEM_ENTREGA o
  // crédito deixa de esperar a entrega e segue a carência que já tinha.
  const limiteEntrega = new Date(agora.getTime() - DIAS_SEM_ENTREGA * 86_400_000).toISOString();
  const { data: semEntrega } = await site
    .from('carteira_movimentos')
    .update({ libera_apos_entrega: false })
    .eq('status', 'a_liberar')
    .eq('libera_apos_entrega', true)
    .lte('criado_em', limiteEntrega)
    .select('id');
  const { data: lib } = await site
    .from('carteira_movimentos')
    .update({ status: 'disponivel', liberado_em: agora.toISOString() })
    .eq('status', 'a_liberar')
    .eq('libera_apos_entrega', false)
    .lte('libera_em', agora.toISOString())
    .select('id');
  const limite = new Date(agora);
  limite.setMonth(limite.getMonth() - Math.max(1, mesesValidade));
  const { data: candidatos } = await site
    .from('carteira_movimentos')
    .select('user_id')
    .eq('status', 'disponivel')
    .gt('valor', 0)
    .is('expirado_em', null)
    .in('tipo', TIPOS_QUE_EXPIRAM)
    .lte('liberado_em', limite.toISOString())
    .limit(1000);
  let expirados = 0;
  let valorExpirado = 0;
  for (const userId of new Set(((candidatos ?? []) as { user_id: string }[]).map((c) => c.user_id))) {
    const { data, error } = await site.rpc('carteira_expirar_usuario', { p_user_id: userId, p_limite: limite.toISOString(), p_tipos: TIPOS_QUE_EXPIRAM });
    if (error) {
      erros.push(`${userId}: ${error.message}`);
      continue;
    }
    const linha = (Array.isArray(data) ? data[0] : data) as { expirados?: number; valor?: number } | null;
    expirados += Number(linha?.expirados ?? 0);
    valorExpirado = r2(valorExpirado + Number(linha?.valor ?? 0));
  }
  return { liberados: (lib ?? []).length, semEntrega: (semEntrega ?? []).length, expirados, valorExpirado, erros };
}

/** Crédito esperando uma entrega que o NZERP nunca marca: depois disto, segue a carência que já tinha. */
export const DIAS_SEM_ENTREGA = 60;

/**
 * O NZERP marcou o pedido como ENTREGUE (#10, 23/10/2026): os créditos dele
 * que esperavam a entrega passam a liberar em entrega + carência — ou no
 * "não antes de" que já tinham (fim do período da recorrência), o que vier
 * depois. Devolve quantos créditos ganharam data.
 */
export async function liberarAposEntrega(site: Db, pedidoId: string, entregueEm: Date, diasCarencia: number): Promise<number> {
  const { data } = await site.from('carteira_movimentos').select('id, libera_em').eq('pedido_id', pedidoId).eq('status', 'a_liberar').eq('libera_apos_entrega', true);
  const aposEntrega = new Date(entregueEm.getTime() + Math.max(0, diasCarencia) * 86_400_000);
  let n = 0;
  for (const m of (data ?? []) as { id: number; libera_em: string | null }[]) {
    const antes = m.libera_em ? new Date(m.libera_em) : null;
    const libera = antes && antes.getTime() > aposEntrega.getTime() ? antes : aposEntrega;
    const { error } = await site.from('carteira_movimentos').update({ libera_em: libera.toISOString(), libera_apos_entrega: false }).eq('id', m.id).eq('libera_apos_entrega', true);
    if (!error) n++;
  }
  return n;
}

export interface DevolucaoParcial {
  /** id da devolução no NZERP (pedido_cancelamentos) */
  id: string;
  pedidoId: string;
  /** valor do material devolvido (sem frete) */
  valorMaterial: number;
}

/**
 * Devolução PARCIAL concluída no NZERP (#10, 23/10/2026): a comissão sobre o
 * valor devolvido sai do crédito do pedido. Uma vez por devolução — a linha em
 * `carteira_devolucoes` é a vez. Crédito ainda a liberar perde o valor ali
 * mesmo (a observação guarda o rastro); crédito já liberado NÃO é mexido: a
 * pessoa pode ter usado ou sacado, e a equipe decide (ocorrência). Devolve o
 * que fez, ou null se a devolução já tinha sido aplicada.
 */
export async function aplicarDevolucaoParcial(site: Db, d: DevolucaoParcial): Promise<{ descontado: number; paraEquipe: number; creditos: unknown[] } | null> {
  const valorMaterial = r2(Math.max(0, Number(d.valorMaterial) || 0));
  const { data: creditosData } = await site
    .from('carteira_movimentos')
    .select(COLUNAS_MOVIMENTO)
    .eq('pedido_id', d.pedidoId)
    .in('tipo', ['cashback_indicacao', 'comissao_ativacao', 'comissao_recorrencia'])
    .in('status', ['a_liberar', 'disponivel']);
  const creditos = (creditosData ?? []) as Movimento[];
  const plano = creditos
    .map((m) => ({ m, desconto: r2(Math.min(Number(m.valor), (valorMaterial * Number(m.percentual_aplicado ?? 0)) / 100)) }))
    .filter((x) => x.desconto > 0);
  const registro = plano.map((x) => ({ movimentoId: x.m.id, userId: x.m.user_id, status: x.m.status, valor: Number(x.m.valor), desconto: x.desconto }));
  // A vez: quem grava a devolução aplica; a segunda rodada para aqui.
  const { error: eVez } = await site.from('carteira_devolucoes').insert({ cancelamento_id: d.id, pedido_id: d.pedidoId, valor_material: valorMaterial, creditos: registro });
  if (eVez) return null;

  let descontado = 0;
  let paraEquipe = 0;
  const agora = new Date().toISOString();
  for (const { m, desconto } of plano) {
    if (m.status === 'a_liberar') {
      const novo = r2(Number(m.valor) - desconto);
      const obs = [m.obs, `devolução parcial no NZERP: −${desconto.toFixed(2)} (de ${Number(m.valor).toFixed(2)})`].filter(Boolean).join(' · ');
      const patch = novo > 0 ? { valor: novo, obs } : { status: 'estornado', estornado_em: agora, obs };
      const { data: mudou } = await site.from('carteira_movimentos').update(patch).eq('id', m.id).eq('status', 'a_liberar').select('id');
      // Liberou no meio do caminho: vai para a equipe como qualquer crédito liberado.
      if ((mudou ?? []).length) descontado = r2(descontado + desconto);
      else paraEquipe = r2(paraEquipe + desconto);
    } else {
      paraEquipe = r2(paraEquipe + desconto);
    }
  }
  return { descontado, paraEquipe, creditos: registro };
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
