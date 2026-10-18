// Unidade de VENDA da loja: rolo fechado, metro linear ou peça.
//
// Até 17/10/2026 a loja só vendia filme, e cada tela tinha o seu
// `unidade === 'rolo' ? … : …` (passo 1 ou 0,5, "rolo fechado" ou "m"). A
// Coleção NZPPF 2026 trouxe a camiseta, vendida por PEÇA ('un'): quantidade
// inteira, sem rolo nem metro. Esta é a régua única — carrinho, mini carrinho,
// checkout e painel leem daqui.
//
// Módulo PURO, sem import: a regra do servidor é a mesma (api/_lib/pedido/
// precificar.ts — teto MAX_UN, peça inteira) e precisa continuar batendo.

export type UnidadeVenda = 'rolo' | 'metro' | 'un';

/** Teto de peças por item (por tamanho) num pedido. Igual a MAX_UN do servidor. */
export const MAX_UN = 10;

export const PASSO: Record<UnidadeVenda, number> = { rolo: 1, metro: 0.5, un: 1 };
export const MINIMO: Record<UnidadeVenda, number> = { rolo: 1, metro: 0.5, un: 1 };
export const MAXIMO: Record<UnidadeVenda, number> = { rolo: 50, metro: 500, un: MAX_UN };

/** A unidade do ERP ('UN') que vende por peça. */
export function vendePorUnidade(unidadeErp: string | null | undefined): boolean {
  return (unidadeErp ?? '').trim().toUpperCase() === 'UN';
}

/** Limita e arredonda: rolo e peça são inteiros; metro anda de 0,5 em 0,5. */
export function ajustarQtd(u: UnidadeVenda, valor: number): number {
  const v = Number.isFinite(valor) ? valor : MINIMO[u];
  const limitado = Math.min(MAXIMO[u], Math.max(MINIMO[u], v));
  return u === 'metro' ? Math.round(limitado * 2) / 2 : Math.round(limitado);
}

/** "1 rolo fechado", "2 rolos fechados", "3,5 m", "1 unidade", "2 unidades" — sem o número. */
export function rotuloQtd(u: UnidadeVenda, qtd: number): string {
  if (u === 'rolo') return qtd > 1 ? 'rolos fechados' : 'rolo fechado';
  if (u === 'un') return qtd > 1 ? 'unidades' : 'unidade';
  return 'm';
}

/** Sufixo do preço unitário: "/ rolo", "/ m", "/ un.". */
export function sufixoPreco(u: UnidadeVenda): string {
  if (u === 'rolo') return 'rolo';
  if (u === 'un') return 'un.';
  return 'm';
}

/**
 * Preço unitário da linha do carrinho a partir do `/api/nz/precos`. Peça usa o
 * preço "de rolo" do ERP (é o que o checkout cobra: preco_rolo por peça).
 */
export function precoUnitario(
  u: UnidadeVenda,
  p: { rolo?: number | null; metro?: number | null } | null | undefined
): number | null | undefined {
  if (!p) return undefined;
  return u === 'metro' ? p.metro : p.rolo;
}

/** Quantas "coisas" a linha vale no crachá: rolo e peça contam a quantidade; metro conta 1. */
export function contaNoCracha(u: UnidadeVenda, qtd: number): number {
  return u === 'metro' ? 1 : Math.max(1, Math.round(qtd));
}
