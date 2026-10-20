// Preço por TIPO DE ACESSO — a regra única da loja (decisão do João, 20/10/2026).
//
//   preço = arredondar( BASE × (1 + percentual ÷ 100) )
//   BASE  = atacado do ERP (preco_rolo / preco_metro) ou, se o tipo escolher,
//           o varejo do ERP (preco_*_varejo). Promoção (preço de saída)
//           substitui a base: o tipo paga saída + o seu percentual.
//   percentual = o da LINHA do produto para aquele tipo, se houver; senão o
//           GERAL do tipo. Nunca negativo: ninguém vê abaixo do atacado.
//
// Quem chama: /api/nz/precos (vitrine), pedido/precificar.ts (pedido e
// checkout — o que cobra), promo-moto (público = cliente final). Os três
// passam por aqui, e é por isso que a vitrine e o checkout não divergem
// (npm run precos:test compara os dois).
//
// Admin NÃO passa por aqui: vê e compra pela base (atacado), como sempre.
// Seleção enviada pelo vendedor também não: o acréscimo dela é o preço
// negociado e substitui o do tipo (handlers/precos.ts).

import type { Db, Papel } from '../papel.js';
import { aplicarAcrescimo, r2 } from '../pedido/dinheiro.js';

export type PapelPreco = 'client' | 'lojista' | 'reseller';
export const PAPEIS_PRECO: readonly PapelPreco[] = ['reseller', 'lojista', 'client'];
export type BaseRegra = 'atacado' | 'varejo';

export interface RegraAcesso {
  papel: PapelPreco;
  /** null = regra geral do tipo. */
  linha_key: string | null;
  base: BaseRegra;
  percentual: number;
}

export interface Regras {
  geral: Record<PapelPreco, RegraAcesso>;
  /** chave `${papel}|${linha_key}` */
  porLinha: Map<string, RegraAcesso>;
}

const chave = (papel: PapelPreco, linha: string) => `${papel}|${linha}`;

/** Sem nada gravado: revendedor e lojista no atacado, cliente final no varejo publicado. */
export function regrasPadrao(): Regras {
  return {
    geral: {
      reseller: { papel: 'reseller', linha_key: null, base: 'atacado', percentual: 0 },
      lojista: { papel: 'lojista', linha_key: null, base: 'atacado', percentual: 0 },
      client: { papel: 'client', linha_key: null, base: 'varejo', percentual: 0 },
    },
    porLinha: new Map(),
  };
}

export function montarRegras(linhas: readonly Partial<RegraAcesso>[]): Regras {
  const r = regrasPadrao();
  for (const l of linhas) {
    if (!l.papel || !PAPEIS_PRECO.includes(l.papel)) continue;
    const limpa: RegraAcesso = {
      papel: l.papel,
      linha_key: l.linha_key ? String(l.linha_key) : null,
      base: l.base === 'varejo' ? 'varejo' : 'atacado',
      percentual: Math.max(0, Number(l.percentual) || 0),
    };
    if (limpa.linha_key) r.porLinha.set(chave(limpa.papel, limpa.linha_key), limpa);
    else r.geral[limpa.papel] = limpa;
  }
  return r;
}

/** Lê `precos_acesso`. Falhou? Padrão — a vitrine nunca fica sem preço por causa da regra. */
export async function carregarRegras(site: Db): Promise<Regras> {
  try {
    const { data, error } = await site.from('precos_acesso').select('papel, linha_key, base, percentual');
    if (error) throw error;
    return montarRegras((data ?? []) as Partial<RegraAcesso>[]);
  } catch (err) {
    console.warn('[precos] regras de acesso não carregaram; usando o padrão:', err instanceof Error ? err.message : err);
    return regrasPadrao();
  }
}

/** Papel do JWT → tipo de preço. Anônimo (promoção pública) e desconhecido = cliente final. */
export function papelDePreco(papel: Papel | string | null | undefined): PapelPreco {
  return papel === 'reseller' || papel === 'lojista' ? papel : 'client';
}

/** A regra que vale para um tipo numa linha: a linha só muda o percentual; a base é do tipo. */
export function regraPara(regras: Regras, papel: PapelPreco, linhaKey: string | null | undefined): RegraAcesso {
  const geral = regras.geral[papel];
  const daLinha = linhaKey ? regras.porLinha.get(chave(papel, linhaKey)) : undefined;
  return daLinha ? { ...daLinha, base: geral.base } : geral;
}

export interface BasePreco {
  /** ATACADO do ERP (preco_rolo / preco_metro). */
  atacado: number | null | undefined;
  /** VAREJO do ERP (preco_*_varejo). Ausente → cai no atacado. */
  varejo?: number | null | undefined;
}

const positivo = (v: unknown): number | null => (Number(v) > 0 ? Number(v) : null);

/**
 * O preço que este papel vê/paga. `promo` é o preço de saída da Promoção Moto
 * (substitui a base). `null` = o ERP não precificou — o produto fica sem preço.
 */
export function precoParaAcesso(regras: Regras, papel: Papel | PapelPreco | string, base: BasePreco, linhaKey: string | null | undefined, promo?: number | null): number | null {
  const r = regraPara(regras, papelDePreco(papel), linhaKey);
  const atacado = positivo(base.atacado);
  const varejo = positivo(base.varejo);
  const b = positivo(promo) ?? (r.base === 'varejo' ? (varejo ?? atacado) : atacado);
  if (b == null) return null;
  return r.percentual > 0 ? aplicarAcrescimo(b, r.percentual) : r2(b);
}

/** O mesmo produto nos três tipos — o simulador da tela de preços (só admin). */
export function precosPorTipo(regras: Regras, base: BasePreco, linhaKey: string | null | undefined, promo?: number | null): Record<PapelPreco, number | null> {
  return {
    reseller: precoParaAcesso(regras, 'reseller', base, linhaKey, promo),
    lojista: precoParaAcesso(regras, 'lojista', base, linhaKey, promo),
    client: precoParaAcesso(regras, 'client', base, linhaKey, promo),
  };
}
