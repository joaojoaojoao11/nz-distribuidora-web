// Ordem natural do catálogo da LOJA.
//
// Três regras, nesta ordem de prioridade:
//
// 1. CAPA PRIMEIRO. Item sem foto de capa vai para o fim da lista. Não é uma
//    penalidade permanente: `coverRank` olha o item, então no instante em que
//    alguém sobe a foto pelo painel o produto volta sozinho para o lugar dele
//    na ordem normal — não há flag, campo de banco nem reindexação envolvida.
//    O meio-termo existe porque metade do catálogo é cor sem foto: quem tem
//    hex ainda renderiza um swatch legítimo e fica ANTES de quem não tem nada
//    além do nome da marca no lugar da imagem.
//
// 2. MARCA E LINHA. Sem busca digitada, o catálogo é um mostruário: os 62
//    Oracal 651 juntos, os 92 Metamark 7 Series juntos. Ordem alfabética
//    espalhava a mesma linha por toda a página. A ordem é a curada de
//    BRAND_ORDER/LINE_ORDER — a mesma da sidebar, com a NZ na frente.
//
// 3. CÓDIGO. Dentro da linha, o SKU é a ordem do mostruário físico
//    (651-010, 651-011…), com comparação numérica para 651-9 não cair depois
//    de 651-10.
//
// Este módulo é a fonte única dessas listas: facets.ts monta as facetas a
// partir delas, e match.ts ordena por elas. Só depende de tipos e do léxico de
// cor, então nem facets.ts nem match.ts entram em ciclo ao importá-lo.

import { COLOR_LABEL, type ColorFamilyId } from '../color/lexicon';
import type { BrandKey, LineKey, NivelEstoque, ShopItem } from '../types';

/** FABRICANTE, na ordem em que a casa apresenta o portfólio. */
export const BRAND_ORDER: BrandKey[] = [
  'nz',
  'metamark',
  'orafol',
  'sh',
  'etherna',
  'avery',
  'speed',
  'nar',
  'outro',
];

/** LINHA comercial. Agrupada por fabricante, seguindo BRAND_ORDER. */
export const LINE_ORDER: LineKey[] = [
  'nzwrap',
  'nzwrap-import',
  'ppf',
  'nz-farol',
  'm7',
  'mcx',
  'md80',
  'oracal-651',
  'oracal-670',
  'sh-wrapping',
  'sh-decor',
  'next',
  'etherna',
  'avery',
  'avery-adpro',
  'speed-wrapping',
  'nar',
  'diversos',
];

/** Espectro de cor, na mesma sequência do grid de swatches da sidebar. */
const COLOR_ORDER = Object.keys(COLOR_LABEL) as ColorFamilyId[];

function rank<T extends string>(order: readonly T[], value: T | null | undefined): number {
  const i = value ? order.indexOf(value) : -1;
  return i === -1 ? order.length : i;
}

export const COLLATOR = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });

/**
 * 0 = tem capa fotografada · 1 = só swatch de cor · 2 = nada.
 *
 * Derivado do item a cada ordenação, de propósito: é o que faz o produto
 * voltar sozinho para a ordem normal assim que ganha foto.
 */
export function coverRank(item: ShopItem): 0 | 1 | 2 {
  if (item.image) return 0;
  if (item.hex) return 1;
  return 2;
}

const ESTOQUE_RANK: Record<NivelEstoque, number> = {
  'pronta-entrega': 0,
  'ultimas-unidades': 1,
  'sob-encomenda': 2,
};

export function estoqueRank(item: ShopItem): number {
  return ESTOQUE_RANK[item.nivelEstoque ?? 'sob-encomenda'];
}

/**
 * Luminância aproximada (0 preto … 1 branco), para escalonar do claro ao
 * escuro dentro de uma mesma família. Coeficientes sRGB, sem correção de gama:
 * é ordenação visual, não colorimetria.
 */
function luminancia(hex: string): number {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  if (full.length !== 6) return 0.5;
  const n = Number.parseInt(full, 16);
  if (Number.isNaN(n)) return 0.5;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/** Marca → linha → código → nome. A ordem do mostruário. */
export function compareCatalogo(a: ShopItem, b: ShopItem): number {
  return (
    rank(BRAND_ORDER, a.brandKey) - rank(BRAND_ORDER, b.brandKey) ||
    rank(LINE_ORDER, a.lineKey) - rank(LINE_ORDER, b.lineKey) ||
    compareCodigo(a, b)
  );
}

/** Código natural. Item sem código vai depois de quem tem, nunca no meio. */
export function compareCodigo(a: ShopItem, b: ShopItem): number {
  const ca = a.code ?? '';
  const cb = b.code ?? '';
  if (!ca !== !cb) return ca ? -1 : 1;
  return COLLATOR.compare(ca, cb) || COLLATOR.compare(a.name, b.name);
}

/** Família de cor no espectro, e dentro dela do mais claro ao mais escuro. */
export function compareCor(a: ShopItem, b: ShopItem): number {
  const fa = rank(COLOR_ORDER, a.colorFamilies[0]);
  const fb = rank(COLOR_ORDER, b.colorFamilies[0]);
  if (fa !== fb) return fa - fb;
  const la = a.hex ? luminancia(a.hex) : -1;
  const lb = b.hex ? luminancia(b.hex) : -1;
  // Sem hex não há como escalonar: vai para o fim da própria família.
  if (la < 0 || lb < 0) return la === lb ? compareCatalogo(a, b) : la < 0 ? 1 : -1;
  return lb - la || compareCatalogo(a, b);
}
