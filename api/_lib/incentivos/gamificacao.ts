// Gamificação G1 (§11 do plano): níveis, conquistas e "momentos".
//
// Tudo é calculado AQUI, no servidor, a partir da carteira e dos perfis —
// nunca no navegador. Idempotente: conquista é chave (user_id, codigo); bônus
// em dinheiro passa pelo teto mensal (D18) e vira movimento na carteira.
// Nada de sorteio, nada de urgência falsa (D20).

import type { Db } from '../papel.js';
import { r2 } from '../pedido/dinheiro.js';
import { creditar, estornarMovimentos } from './carteira.js';
import type { ConfigIncentivos } from './config.js';

export type Publico = 'indicador' | 'afiliado';

export interface Nivel {
  id: number;
  publico: Publico;
  ordem: number;
  nome: string;
  icone: string | null;
  criterio_tipo: 'indicados_12m' | 'faturamento_12m';
  criterio_valor: number;
  multiplicador: number;
  ativo: boolean;
}

export interface SituacaoNivel {
  publico: Publico;
  atual: Nivel | null;
  proximo: Nivel | null;
  /** o número que decide (indicados que compraram em 12 meses, ou R$ gerado) */
  metrica: number;
  /** 0–100 até o próximo nível (100 = último) */
  progressoPct: number;
  faltam: number;
  multiplicador: number;
}

const CREDITOS = ['cashback_indicacao', 'comissao_ativacao', 'comissao_recorrencia'];

export async function niveis(site: Db, publico: Publico): Promise<Nivel[]> {
  const { data } = await site.from('niveis_programa').select('*').eq('publico', publico).eq('ativo', true).order('ordem');
  return ((data ?? []) as Nivel[]).map((n) => ({ ...n, criterio_valor: Number(n.criterio_valor), multiplicador: Number(n.multiplicador) || 1 }));
}

/** A métrica do nível, dos últimos 12 meses. */
export async function metricaDe(site: Db, userId: string, publico: Publico): Promise<number> {
  const desde = new Date();
  desde.setMonth(desde.getMonth() - 12);
  const { data } = await site
    .from('carteira_movimentos')
    .select('origem_user_id, base_valor, status')
    .eq('user_id', userId)
    .in('tipo', CREDITOS)
    .in('status', ['a_liberar', 'disponivel'])
    .gte('criado_em', desde.toISOString());
  const rows = (data ?? []) as { origem_user_id: string | null; base_valor: number | null }[];
  if (publico === 'afiliado') return r2(rows.reduce((s, r) => s + Number(r.base_valor ?? 0), 0));
  return new Set(rows.map((r) => r.origem_user_id).filter(Boolean)).size;
}

export async function situacaoNivel(site: Db, userId: string, publico: Publico): Promise<SituacaoNivel> {
  const lista = await niveis(site, publico);
  const metrica = await metricaDe(site, userId, publico);
  let atual: Nivel | null = null;
  let proximo: Nivel | null = null;
  for (const n of lista) {
    if (metrica >= n.criterio_valor) atual = n;
    else if (!proximo) proximo = n;
  }
  const base = atual?.criterio_valor ?? 0;
  const alvo = proximo?.criterio_valor ?? base;
  const progressoPct = proximo ? Math.min(100, Math.max(0, Math.round(((metrica - base) / Math.max(1e-9, alvo - base)) * 100))) : 100;
  return { publico, atual, proximo, metrica, progressoPct, faltam: proximo ? r2(Math.max(0, alvo - metrica)) : 0, multiplicador: atual?.multiplicador ?? 1 };
}

export async function registrarEvento(site: Db, userId: string, tipo: string, payload: Record<string, unknown> = {}): Promise<void> {
  await site
    .from('eventos_programa')
    .insert({ user_id: userId, tipo, payload })
    .then(
      () => undefined,
      () => undefined
    );
}

export interface Conquista {
  codigo: string;
  nome: string;
  descricao: string | null;
  icone: string | null;
  publico: 'indicador' | 'afiliado' | 'todos';
  bonus_valor: number;
  ativa: boolean;
  ordem: number;
}

/** Quanto já saiu em bônus de gamificação neste mês (teto D18). */
async function bonusDoMes(site: Db): Promise<number> {
  const inicio = new Date();
  inicio.setDate(1);
  inicio.setHours(0, 0, 0, 0);
  // Bônus do mês menos o que já foi estornado (um bônus "disponível" estornado
  // vira um movimento negativo apontando para ele).
  const { data } = await site.from('carteira_movimentos').select('id, valor, tipo, referencia_id, status').in('tipo', ['bonus_campanha', 'bonus_meta', 'estorno']).gte('criado_em', inicio.toISOString());
  const rows = (data ?? []) as { id: number; valor: number; tipo: string; referencia_id: number | null; status: string }[];
  const bonus = rows.filter((r) => r.tipo !== 'estorno' && r.status !== 'estornado');
  const ids = new Set(bonus.map((r) => r.id));
  const estornos = rows.filter((r) => r.tipo === 'estorno' && r.referencia_id != null && ids.has(r.referencia_id));
  return r2([...bonus, ...estornos].reduce((s, r) => s + Number(r.valor), 0));
}

/** Os fatos que decidem as conquistas, lidos do banco (carteira + perfis). */
async function fatosDe(site: Db, userId: string, ehAfiliado: boolean): Promise<Record<string, boolean>> {
  const [{ data: filiados }, { data: creditos }] = await Promise.all([
    site.from('user_profiles').select('id, is_approved, faixa_id, created_at').eq('indicado_por', userId),
    site.from('carteira_movimentos').select('origem_user_id, criado_em, tipo').eq('user_id', userId).in('tipo', CREDITOS).in('status', ['a_liberar', 'disponivel']),
  ]);
  const fil = (filiados ?? []) as { id: string; is_approved: boolean; faixa_id: number | null }[];
  const cred = (creditos ?? []) as { origem_user_id: string | null; criado_em: string; tipo: string }[];
  const indicados = new Set<string>([...fil.map((f) => f.id), ...cred.map((c) => c.origem_user_id).filter((x): x is string => Boolean(x))]);
  const compradores = new Set(cred.map((c) => c.origem_user_id).filter(Boolean));

  // Platinum: faixa chamada "Platinum" (qualquer tipo).
  let temPlatinum = false;
  const faixasIds = [...new Set(fil.map((f) => f.faixa_id).filter((x): x is number => Boolean(x)))];
  if (faixasIds.length) {
    const { data: fx } = await site.from('faixas_preco').select('id, nome').in('id', faixasIds);
    temPlatinum = ((fx ?? []) as { nome: string }[]).some((f) => /platinum/i.test(f.nome));
  }
  // 3 indicados distintos comprando no mesmo mês.
  const porMes = new Map<string, Set<string>>();
  for (const c of cred) {
    if (!c.origem_user_id) continue;
    const k = c.criado_em.slice(0, 7);
    (porMes.get(k) ?? porMes.set(k, new Set()).get(k)!).add(c.origem_user_id);
  }
  const tresNoMes = [...porMes.values()].some((s) => s.size >= 3);
  // 3 meses seguidos com compra de indicado.
  const meses = [...porMes.keys()].sort();
  let seq = 0;
  let melhorSeq = 0;
  for (let i = 0; i < meses.length; i++) {
    if (i > 0) {
      const [a1, m1] = meses[i - 1].split('-').map(Number);
      const [a2, m2] = meses[i].split('-').map(Number);
      seq = a2 * 12 + m2 === a1 * 12 + m1 + 1 ? seq + 1 : 1;
    } else seq = 1;
    melhorSeq = Math.max(melhorSeq, seq);
  }
  const nivel = await situacaoNivel(site, userId, ehAfiliado ? 'afiliado' : 'indicador');

  return {
    primeira_indicacao: indicados.size >= 1,
    primeiro_aprovado: fil.some((f) => f.is_approved) || compradores.size >= 1,
    primeira_venda: cred.length >= 1,
    tres_no_mes: tresNoMes,
    indicou_platinum: temPlatinum,
    sequencia_3: melhorSeq >= 3,
    nivel_campeao: Boolean(nivel.atual && !nivel.proximo && nivel.atual.ordem > 1),
    // primeiro_saque: Fase 4.
  };
}

/**
 * Confere as conquistas de uma pessoa e grava as novas. Os fatos vêm do banco;
 * a conquista nasce uma vez (chave primária). Bônus em dinheiro só dentro do
 * teto mensal; passou, a conquista sai SEM o bônus, com aviso no obs.
 * `pedidoId` = o pedido faturado que disparou a avaliação: fica na conquista
 * para o cancelamento poder devolvê-la (D29).
 */
export async function avaliarConquistas(site: Db, userId: string, cfg: ConfigIncentivos, ehAfiliado: boolean, pedidoId: string | null = null): Promise<string[]> {
  const [{ data: lista }, { data: minhas }, fatos] = await Promise.all([
    site.from('conquistas').select('*').eq('ativa', true),
    site.from('conquistas_usuario').select('codigo').eq('user_id', userId),
    fatosDe(site, userId, ehAfiliado),
  ]);
  const conquistas = ((lista ?? []) as Conquista[]).filter((c) => c.publico === 'todos' || (c.publico === 'afiliado' ? ehAfiliado : !ehAfiliado || true));
  const tenho = new Set(((minhas ?? []) as { codigo: string }[]).map((m) => m.codigo));

  const novas: string[] = [];
  for (const c of conquistas) {
    if (tenho.has(c.codigo) || !fatos[c.codigo]) continue;
    let bonusId: number | null = null;
    let obs: string | null = null;
    const bonus = r2(Number(c.bonus_valor) || 0);
    if (bonus > 0) {
      const teto = cfg.tetoMensalPremios;
      const gasto = await bonusDoMes(site);
      if (teto != null && gasto + bonus <= teto) {
        const r = await creditar(site, { userId, tipo: 'bonus_campanha', valor: bonus, obs: `Conquista ${c.nome}`, criadoPor: 'gamificacao' });
        bonusId = r.movimento?.id ?? null;
      } else {
        obs = teto == null ? 'sem teto mensal configurado: conquista sem bônus' : 'teto mensal de prêmios atingido: conquista sem bônus';
      }
    }
    const { error } = await site.from('conquistas_usuario').insert({ user_id: userId, codigo: c.codigo, bonus_movimento_id: bonusId, pedido_id: pedidoId });
    if (error) continue;
    novas.push(c.codigo);
    await registrarEvento(site, userId, 'conquista', { codigo: c.codigo, nome: c.nome, icone: c.icone, bonus: bonusId ? bonus : 0, obs, pedidoId });
  }
  return novas;
}

/**
 * D29 — pedido cancelado: as conquistas que ESSE pedido fez nascer são
 * reavaliadas (a comissão dele já foi estornada). Fato que ainda vale (ex.:
 * "primeira indicação", o filiado continua lá) só perde o vínculo com o
 * pedido; fato que caiu (ex.: "primeira venda") volta — a pessoa pode ganhar
 * de novo — e o bônus em dinheiro dela é estornado. Devolve quantas voltaram.
 */
export async function devolverConquistasDoPedido(site: Db, pedidoId: string, motivo: string): Promise<number> {
  const { data } = await site.from('conquistas_usuario').select('user_id, codigo, bonus_movimento_id').eq('pedido_id', pedidoId);
  const lista = (data ?? []) as { user_id: string; codigo: string; bonus_movimento_id: number | null }[];
  if (!lista.length) return 0;
  const { data: nomes } = await site.from('conquistas').select('codigo, nome').in('codigo', [...new Set(lista.map((c) => c.codigo))]);
  const nome = new Map(((nomes ?? []) as { codigo: string; nome: string }[]).map((n) => [n.codigo, n.nome]));
  let devolvidas = 0;
  for (const userId of new Set(lista.map((c) => c.user_id))) {
    const { data: af } = await site.from('afiliados').select('status').eq('user_id', userId).maybeSingle();
    const fatos = await fatosDe(site, userId, (af as { status?: string } | null)?.status === 'aprovado');
    for (const c of lista.filter((x) => x.user_id === userId)) {
      if (fatos[c.codigo]) {
        await site.from('conquistas_usuario').update({ pedido_id: null }).eq('user_id', userId).eq('codigo', c.codigo);
        continue;
      }
      if (c.bonus_movimento_id != null) await estornarMovimentos(site, [c.bonus_movimento_id], `conquista devolvida: ${motivo}`);
      const { error } = await site.from('conquistas_usuario').delete().eq('user_id', userId).eq('codigo', c.codigo);
      if (error) continue;
      devolvidas++;
      await registrarEvento(site, userId, 'conquista_devolvida', { codigo: c.codigo, nome: nome.get(c.codigo) ?? c.codigo, motivo, pedidoId });
    }
  }
  return devolvidas;
}

export interface ResumoGamificacao {
  nivel: SituacaoNivel;
  conquistas: (Conquista & { obtida_em: string | null; vista_em: string | null })[];
  momentos: { id: number; tipo: string; payload: Record<string, unknown>; criado_em: string; visto_em: string | null }[];
  naoVistos: number;
}

export async function resumoGamificacao(site: Db, userId: string, ehAfiliado: boolean): Promise<ResumoGamificacao> {
  const [nivel, { data: lista }, { data: minhas }, { data: eventos }] = await Promise.all([
    situacaoNivel(site, userId, ehAfiliado ? 'afiliado' : 'indicador'),
    site.from('conquistas').select('*').eq('ativa', true).order('ordem'),
    site.from('conquistas_usuario').select('codigo, obtida_em, vista_em').eq('user_id', userId),
    site.from('eventos_programa').select('id, tipo, payload, criado_em, visto_em').eq('user_id', userId).order('criado_em', { ascending: false }).limit(30),
  ]);
  const minhasMap = new Map(((minhas ?? []) as { codigo: string; obtida_em: string; vista_em: string | null }[]).map((m) => [m.codigo, m]));
  const conquistas = ((lista ?? []) as Conquista[])
    .filter((c) => c.publico === 'todos' || (c.publico === 'afiliado') === ehAfiliado || c.publico === 'indicador')
    .map((c) => ({ ...c, bonus_valor: Number(c.bonus_valor), obtida_em: minhasMap.get(c.codigo)?.obtida_em ?? null, vista_em: minhasMap.get(c.codigo)?.vista_em ?? null }));
  const momentos = (eventos ?? []) as ResumoGamificacao['momentos'];
  return { nivel, conquistas, momentos, naoVistos: momentos.filter((m) => !m.visto_em).length };
}

/** A comemoração foi vista: marca eventos e conquistas, para não repetir. */
export async function marcarVistos(site: Db, userId: string): Promise<void> {
  const agora = new Date().toISOString();
  await site.from('eventos_programa').update({ visto_em: agora }).eq('user_id', userId).is('visto_em', null);
  await site.from('conquistas_usuario').update({ vista_em: agora }).eq('user_id', userId).is('vista_em', null);
}
