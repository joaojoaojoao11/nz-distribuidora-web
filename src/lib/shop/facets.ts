// Contagem de facetas para a sidebar.
//
// Contagem CONTEXTUAL: a contagem de cada faceta é calculada aplicando todos os
// filtros ativos EXCETO o da própria faceta. É o comportamento padrão de
// e-commerce e o que evita o "clicar num filtro e receber zero": se a contagem
// de "Fosco" já considerasse o próprio "Fosco" não marcado, ela mostraria o
// total do catálogo e mentiria sobre o resultado do clique.

import { applyFilters, type FilterState } from './search/match';
import { COLOR_LABEL, type ColorFamilyId } from './color/lexicon';
import { FINISH_LABEL, FINISH_ORDER, FINISH_PARENT, type FinishId } from './finish/tree';
import { PATTERN_LABEL, PATTERN_ORDER, type PatternFamilyId } from './pattern/taxonomy';
import { SOURCE_LABEL, VERTICAL_LABEL, VERTICAL_ORDER } from './catalog';
import { BRAND_ORDER, LINE_ORDER } from './search/ordem';
import { LINHA_LABEL } from './erp/mapa';
import type {
  BrandKey,
  ItemKind,
  LineKey,
  MapaPatio,
  NivelEstoque,
  ShopItem,
  SinalPatio,
  Vertical,
} from './types';

export interface FacetOption<T extends string = string> {
  id: T;
  label: string;
  count: number;
  /** Filho na árvore de acabamentos — renderizado indentado. */
  parent?: FinishId;
}

export interface Facets {
  verticals: FacetOption<Vertical>[];
  colors: FacetOption<ColorFamilyId>[];
  finishes: FacetOption<FinishId>[];
  /** Linha comercial — o filtro mais específico, e o que o cliente usa. */
  lines: FacetOption<LineKey>[];
  brands: FacetOption<BrandKey>[];
  patterns: FacetOption<PatternFamilyId>[];
  kinds: FacetOption<ItemKind>[];
  estoque: FacetOption<NivelEstoque>[];
  /** As duas bolinhas do card. Vem vazio para quem não é admin. */
  patio: FacetOption<SinalPatio>[];
}

/** Swatch de cada família, para o grid de cores da sidebar. */
export const COLOR_SWATCH: Record<ColorFamilyId, string> = {
  branco: '#f2f4f7',
  preto: '#141416',
  cinza: '#8b8d91',
  prata: '#c7ccd1',
  vermelho: '#c0182b',
  laranja: '#e2621d',
  amarelo: '#f0c000',
  verde: '#2e8b45',
  azul: '#1f63b8',
  roxo: '#6b3fa0',
  rosa: '#d9528f',
  marrom: '#6b4327',
  bege: '#cdb79a',
  dourado: '#c69b36',
  bronze: '#9a6b3f',
  transparente: 'transparent',
  multicolor: 'linear-gradient(135deg,#c0182b,#f0c000,#2e8b45,#1f63b8)',
};

export const ESTOQUE_LABEL: Record<NivelEstoque, string> = {
  'pronta-entrega': 'Pronta entrega · SP',
  'ultimas-unidades': 'Últimas unidades',
  'sob-encomenda': 'Sob encomenda',
};

/**
 * As duas bolinhas do card, em texto. "Rolo fechado" e "ponta" é como o pátio
 * fala — quem usa este filtro é vendedor, não visitante.
 */
export const PATIO_LABEL: Record<SinalPatio, string> = {
  'rolo-fechado': 'Com rolo fechado',
  'ponta-aberta': 'Com ponta aberta',
};

const KIND_LABEL: Record<ItemKind, string> = {
  cor: 'Cores',
  padrao: 'Padrões',
  linha: 'Linhas técnicas',
};

/**
 * FABRICANTE. Deliberadamente curto: agrupa quem faz, não o que é.
 * Quem quer "SH Decor" e não "SH Wrapping" usa a faceta Linha, abaixo.
 */
const BRAND_TEXT: Record<BrandKey, string> = {
  nz: 'NZ Group',
  metamark: 'Metamark',
  orafol: 'Orafol / Oracal',
  sh: 'SH',
  etherna: 'Etherna',
  avery: 'Avery Dennison',
  speed: 'Speed Wrapping',
  nar: 'NAR',
  outro: 'Outras',
};

// A ORDEM vem de ./search/ordem, não daqui: é a mesma lista que ordena o
// catálogo. Duas listas paralelas divergiriam na primeira marca nova.
const BRAND_OPTIONS: { id: BrandKey; label: string }[] = BRAND_ORDER.map((id) => ({
  id,
  label: BRAND_TEXT[id],
}));

/**
 * LINHA comercial. Esta é a faceta precisa: a SH fabrica duas linhas de
 * negócios distintas (SH Wrapping automotiva, SH Decor decorativa) e a Metamark
 * três. Agrupar tudo sob a marca misturava vinil de carro com revestimento de
 * parede na mesma lista.
 */
const LINE_OPTIONS: { id: LineKey; label: string }[] = LINE_ORDER.map((id) => ({
  id,
  label: LINHA_LABEL[id],
}));

function countWith(
  items: readonly ShopItem[],
  filters: FilterState,
  patio?: MapaPatio | null
): number {
  return applyFilters(items, filters, patio).length;
}

/**
 * Calcula todas as facetas. Cada grupo é contado com os demais filtros
 * aplicados e o próprio grupo zerado.
 */
export function computeFacets(
  items: readonly ShopItem[],
  f: FilterState,
  patio?: MapaPatio | null
): Facets {
  const withoutVertical = { ...f, verticals: [] };
  const withoutColor = { ...f, colors: [] };
  const withoutFinish = { ...f, finishes: [] };
  const withoutBrand = { ...f, brands: [] };
  const withoutLine = { ...f, lines: [] };
  const withoutPattern = { ...f, patterns: [] };
  const withoutKind = { ...f, kinds: [] };
  const withoutEstoque = { ...f, estoque: [] };
  const withoutPatio = { ...f, patio: [] };

  const verticals = VERTICAL_ORDER.map((v) => ({
    id: v,
    label: VERTICAL_LABEL[v],
    count: countWith(items, { ...withoutVertical, verticals: [v] }, patio),
  })).filter((o) => o.count > 0);

  const colors = (Object.keys(COLOR_LABEL) as ColorFamilyId[])
    .map((c) => ({
      id: c,
      label: COLOR_LABEL[c],
      count: countWith(items, { ...withoutColor, colors: [c] }, patio),
    }))
    .filter((o) => o.count > 0)
    .sort((a, b) => b.count - a.count);

  const finishes = FINISH_ORDER.map((id) => ({
    id,
    label: FINISH_LABEL[id],
    parent: FINISH_PARENT[id],
    count: countWith(items, { ...withoutFinish, finishes: [id] }, patio),
  })).filter((o) => o.count > 0);

  const lines = LINE_OPTIONS.map((l) => ({
    id: l.id,
    label: l.label,
    count: countWith(items, { ...withoutLine, lines: [l.id] }, patio),
  })).filter((o) => o.count > 0);

  const brands = BRAND_OPTIONS.map((b) => ({
    id: b.id,
    label: b.label,
    count: countWith(items, { ...withoutBrand, brands: [b.id] }, patio),
  })).filter((o) => o.count > 0);

  const patterns = PATTERN_ORDER.map((p) => ({
    id: p,
    label: PATTERN_LABEL[p],
    count: countWith(items, { ...withoutPattern, patterns: [p] }, patio),
  })).filter((o) => o.count > 0);

  const kinds = (Object.keys(KIND_LABEL) as ItemKind[])
    .map((k) => ({
      id: k,
      label: KIND_LABEL[k],
      count: countWith(items, { ...withoutKind, kinds: [k] }, patio),
    }))
    .filter((o) => o.count > 0);

  // Só o nível que vale como filtro: "pronta entrega" é pergunta real do
  // instalador; "sob encomenda" ninguém filtra para achar.
  const estoque = (['pronta-entrega'] as NivelEstoque[])
    .map((n) => ({
      id: n,
      label: ESTOQUE_LABEL[n],
      count: countWith(items, { ...withoutEstoque, estoque: [n] }, patio),
    }))
    .filter((o) => o.count > 0);

  // Sem o mapa (todo mundo que não é admin) o grupo não existe: um filtro que
  // não tem como ser aplicado não pode aparecer na sidebar.
  const patioOpcoes: FacetOption<SinalPatio>[] = patio
    ? (['rolo-fechado', 'ponta-aberta'] as SinalPatio[])
        .map((sinal) => ({
          id: sinal,
          label: PATIO_LABEL[sinal],
          count: countWith(items, { ...withoutPatio, patio: [sinal] }, patio),
        }))
        .filter((o) => o.count > 0)
    : [];

  return {
    verticals,
    colors,
    finishes,
    lines,
    brands,
    patterns,
    kinds,
    estoque,
    patio: patioOpcoes,
  };
}

/** Rótulo público de cada linha e fabricante — usado nos chips de filtro ativo. */
export const LINE_LABEL: Record<string, string> = Object.fromEntries(
  LINE_OPTIONS.map((l) => [l.id, l.label])
);

export const BRAND_LABEL: Record<string, string> = Object.fromEntries(
  BRAND_OPTIONS.map((b) => [b.id, b.label])
);

export { SOURCE_LABEL };
