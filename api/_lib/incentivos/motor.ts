// O MOTOR: um pedido do site foi FATURADO no ERP → quem ganha o quê.
//
// Três fontes de incentivo, a mesma carteira:
//   · SUPER CUPOM (D22): o comprador usou o super cupom de outro cliente →
//     o dono ganha cashback (% × multiplicador do nível), uma compra só.
//   · AFILIADO (D23–D25): o comprador é filiado a um afiliado aprovado →
//     1ª compra faturada = comissão de ATIVAÇÃO; as seguintes = RECORRÊNCIA,
//     apurada por período (mensal/quinzenal) e liberada no fim dele.
//   · (campanhas, metas e multiplicadores extras: Fase 5)
//
// Base = itens já com o desconto, SEM frete (D4). Carência: D3. Trava: §5
// (só quando ligada e com imposto/comissão embutida configurados). Idempotente
// pelo índice único da carteira e por pedidos.incentivos_processados_em.

import type { Db } from '../papel.js';
import { r2 } from '../pedido/dinheiro.js';
import { carregarRegras, papelDePreco, regraPara } from '../precos/regraAcesso.js';
import { creditar, estornarPorPedido, type Movimento } from './carteira.js';
import { carregarConfigIncentivos, type ConfigIncentivos } from './config.js';
import { avaliarConquistas, devolverConquistasDoPedido, registrarEvento, situacaoNivel } from './gamificacao.js';
import { chavePeriodo, fimPeriodo } from './periodos.js';
import { limitarIncentivo } from './trava.js';

export interface EntradaMotor {
  pedidoId: string;
  /** total do orçamento no ERP (o que o cliente paga) */
  totalErp: number;
  /** frete cobrado (vem na view pedidos_site) */
  freteErp: number;
  faturadoEm: Date;
}

export interface SaidaMotor {
  ignorado?: string;
  creditos: Movimento[];
  cortes: string[];
}

interface PedidoRow {
  id: string;
  user_id: string | null;
  cupom: string | null;
  desconto: number | null;
  incentivos_processados_em: string | null;
}

interface PerfilRow {
  id: string;
  role: string;
  faixa_id: number | null;
  indicado_por: string | null;
  filiado_em: string | null;
}

interface CupomRow {
  codigo: string;
  tipo: string;
  dono_user_id: string | null;
  afiliado_user_id: string | null;
  comissao_pct: number | null;
}

interface AfiliadoRow {
  user_id: string;
  status: string;
  ativo: boolean;
  percentual: number | null;
  pct_ativacao: number | null;
  pct_recorrencia: number | null;
  periodicidade: 'mensal' | 'quinzenal';
}

const somarDias = (d: Date, dias: number) => new Date(d.getTime() + dias * 86400000);

/** Filia a conta ao afiliado se ainda não tem ninguém (1 afiliado por cliente, o primeiro). */
export async function filiarSeFaltar(site: Db, userId: string, afiliadoUserId: string): Promise<boolean> {
  if (!userId || !afiliadoUserId || userId === afiliadoUserId) return false;
  const { data } = await site
    .from('user_profiles')
    .update({ indicado_por: afiliadoUserId, filiado_em: new Date().toISOString() })
    .eq('id', userId)
    .is('indicado_por', null)
    .select('id');
  const filiou = (data ?? []).length > 0;
  if (filiou) await registrarEvento(site, afiliadoUserId, 'indicado_cadastrou', { origem: 'cupom-na-compra' });
  return filiou;
}

export async function processarPedidoFaturado(site: Db, e: EntradaMotor, cfg: ConfigIncentivos): Promise<SaidaMotor> {
  const { data: pd } = await site.from('pedidos').select('id, user_id, cupom, desconto, incentivos_processados_em').eq('id', e.pedidoId).maybeSingle();
  const pedido = pd as PedidoRow | null;
  if (!pedido || !pedido.user_id) return { ignorado: 'pedido-sem-usuario', creditos: [], cortes: [] };
  if (pedido.incentivos_processados_em) return { ignorado: 'ja-processado', creditos: [], cortes: [] };

  const base = r2(Math.max(0, Number(e.totalErp) - Number(e.freteErp || 0)));
  const marcar = async () => site.from('pedidos').update({ incentivos_processados_em: new Date().toISOString() }).eq('id', pedido.id);
  if (base <= 0) {
    await marcar();
    return { ignorado: 'base-zero', creditos: [], cortes: [] };
  }

  const { data: pf } = await site.from('user_profiles').select('id, role, faixa_id, indicado_por, filiado_em').eq('id', pedido.user_id).maybeSingle();
  const perfil = (pf as PerfilRow | null) ?? { id: pedido.user_id, role: 'client', faixa_id: null, indicado_por: null, filiado_em: null };

  let cupom: CupomRow | null = null;
  if (pedido.cupom) {
    const { data: c } = await site.from('cupons').select('codigo, tipo, dono_user_id, afiliado_user_id, comissao_pct').eq('codigo', pedido.cupom).maybeSingle();
    cupom = (c as CupomRow | null) ?? null;
  }
  // Cupom de afiliado na compra de quem ainda não tinha afiliado: filia agora.
  if (cupom?.tipo === 'afiliado' && cupom.afiliado_user_id && !perfil.indicado_por && cupom.afiliado_user_id !== perfil.id) {
    if (await filiarSeFaltar(site, perfil.id, cupom.afiliado_user_id)) perfil.indicado_por = cupom.afiliado_user_id;
  }

  // Candidatos ------------------------------------------------------------
  type Candidato = { quem: string; tipo: 'cashback_indicacao' | 'comissao_ativacao' | 'comissao_recorrencia'; pct: number; mult: number; periodo: string | null; liberaEm: Date; obs: string[] };
  const candidatos: Candidato[] = [];
  const liberaPadrao = somarDias(e.faturadoEm, cfg.diasLiberacao);

  if (cupom?.tipo === 'super' && cupom.dono_user_id && cupom.dono_user_id !== perfil.id && cfg.superCupomAtivo) {
    const nivel = await situacaoNivel(site, cupom.dono_user_id, 'indicador');
    candidatos.push({ quem: cupom.dono_user_id, tipo: 'cashback_indicacao', pct: cupom.comissao_pct ?? cfg.pctCashbackIndicador, mult: nivel.multiplicador, periodo: null, liberaEm: liberaPadrao, obs: [`super cupom ${cupom.codigo}`] });
  }

  if (perfil.indicado_por && perfil.indicado_por !== perfil.id) {
    const { data: a } = await site.from('afiliados').select('user_id, status, ativo, percentual, pct_ativacao, pct_recorrencia, periodicidade').eq('user_id', perfil.indicado_por).maybeSingle();
    const af = a as AfiliadoRow | null;
    if (af && af.ativo && af.status === 'aprovado') {
      const { count } = await site
        .from('carteira_movimentos')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', af.user_id)
        .eq('origem_user_id', perfil.id)
        .in('tipo', ['comissao_ativacao', 'comissao_recorrencia'])
        .neq('status', 'estornado');
      const primeira = Number(count ?? 0) === 0;
      const nivel = await situacaoNivel(site, af.user_id, 'afiliado');
      if (primeira) {
        candidatos.push({ quem: af.user_id, tipo: 'comissao_ativacao', pct: af.pct_ativacao ?? cfg.pctAtivacaoAfiliado, mult: nivel.multiplicador, periodo: null, liberaEm: liberaPadrao, obs: ['1ª compra do filiado'] });
      } else {
        const per = af.periodicidade === 'quinzenal' ? 'quinzenal' : 'mensal';
        const fim = fimPeriodo(e.faturadoEm, per);
        candidatos.push({
          quem: af.user_id,
          tipo: 'comissao_recorrencia',
          pct: af.pct_recorrencia ?? af.percentual ?? cfg.pctRecorrenciaAfiliado,
          mult: nivel.multiplicador,
          periodo: chavePeriodo(e.faturadoEm, per),
          liberaEm: fim.getTime() > liberaPadrao.getTime() ? fim : liberaPadrao,
          obs: [`recorrência ${per}`],
        });
      }
    }
  }

  if (!candidatos.length) {
    await marcar();
    return { ignorado: 'sem-incentivo', creditos: [], cortes: [] };
  }

  // Trava de margem (§5) ----------------------------------------------------
  const cortes: string[] = [];
  for (const c of candidatos) c.pct = r2(Math.max(0, Number(c.pct) || 0) * (Number(c.mult) || 1));
  if (cfg.travaAtiva && cfg.impostoPct != null && cfg.comissaoEmbutidaPct != null) {
    const regras = await carregarRegras(site);
    const acrescimo = regraPara(regras, papelDePreco(perfil.role), null, null, perfil.faixa_id).percentual;
    const desconto = Number(pedido.desconto ?? 0);
    const descontoPct = desconto > 0 ? r2((desconto / (base + desconto)) * 100) : 0;
    const total = r2(candidatos.reduce((s, c) => s + c.pct, 0));
    const t = limitarIncentivo({ acrescimoPct: acrescimo, descontoPct, impostoPct: cfg.impostoPct, comissaoEmbutidaPct: cfg.comissaoEmbutidaPct, incentivoPct: total });
    if (t.cortou) {
      // Corta primeiro o super cupom, depois o afiliado — o desconto do cliente não muda.
      let sobra = r2(total - t.incentivoPct);
      const ordem = [...candidatos].sort((x, y) => (x.tipo === 'cashback_indicacao' ? -1 : 1) - (y.tipo === 'cashback_indicacao' ? -1 : 1));
      for (const c of ordem) {
        if (sobra <= 0) break;
        const corte = Math.min(c.pct, sobra);
        c.pct = r2(c.pct - corte);
        sobra = r2(sobra - corte);
        c.obs.push(`trava de margem: ${(c.pct + corte).toFixed(2)}% → ${c.pct.toFixed(2)}% (teto ${t.tetoPct.toFixed(2)}%)`);
        cortes.push(`${c.tipo} ${c.quem}: cortado para ${c.pct}%`);
      }
    }
  }

  // Créditos ----------------------------------------------------------------
  const creditos: Movimento[] = [];
  for (const c of candidatos) {
    const valor = r2((base * c.pct) / 100);
    if (valor <= 0) continue;
    const r = await creditar(site, {
      userId: c.quem,
      tipo: c.tipo,
      valor,
      liberaEm: c.liberaEm,
      pedidoId: pedido.id,
      origemUserId: perfil.id,
      cupomCodigo: pedido.cupom,
      periodo: c.periodo,
      percentualAplicado: c.pct,
      multiplicador: c.mult,
      baseValor: base,
      obs: c.obs.join(' · '),
    });
    if (r.movimento) creditos.push(r.movimento);
    if (r.movimento && !r.repetido) {
      await registrarEvento(site, c.quem, 'indicado_comprou', { tipo: c.tipo, valor, liberaEm: c.liberaEm.toISOString() });
      await avaliarConquistas(site, c.quem, cfg, c.tipo !== 'cashback_indicacao', pedido.id).catch(() => []);
    }
  }
  await marcar();
  return { creditos, cortes };
}

/** O pedido foi cancelado/devolvido no ERP: estorna o que ainda não saiu. */
export async function estornarPedido(site: Db, pedidoId: string, motivo: string, cfg?: ConfigIncentivos): Promise<number> {
  const n = await estornarPorPedido(site, pedidoId, motivo);
  // D29: a conquista que nasceu deste pedido volta (e o bônus dela sai) se o fato caiu.
  const c = cfg ?? (await carregarConfigIncentivos(site));
  if (c.estornarConquistaCancelamento) await devolverConquistasDoPedido(site, pedidoId, motivo).catch(() => 0);
  await site.from('pedidos').update({ incentivos_estornados_em: new Date().toISOString() }).eq('id', pedidoId);
  return n;
}
