// Scoring e filtro da LOJA.
//
// Duas regras estruturais:
//
// 1. Cor, acabamento, marca, vertical e padrão são FILTROS DUROS: se o usuário
//    pediu e o item não tem, o item sai. Texto livre é SOFT quando já existe
//    estrutura — 'azul fosco metamark xyz' continua devolvendo azuis foscos da
//    Metamark em vez de zero resultado por causa do 'xyz'.
//
// 2. Filtro da sidebar e texto digitado percorrem o MESMO caminho: a seleção da
//    sidebar é injetada no ParsedQuery antes do scoring. Sem isso, "digitou
//    azul" e "clicou no chip Azul" divergiriam com o tempo.

import { parseShopQuery, type ParsedQuery } from './parseQuery';
import type { ColorFamilyId } from '../color/lexicon';
import type { FinishId } from '../finish/tree';
import { finishDescendants } from '../finish/tree';
import type { PatternFamilyId } from '../pattern/taxonomy';
import { normalize, type BrandKey, type ItemKind, type LineKey, type ShopItem, type Vertical } from '../types';

export type SortMode = 'relevancia' | 'nome' | 'marca';

export interface FilterState {
  q: string;
  verticals: Vertical[];
  /** Fabricante. Casa por igualdade em `brandKey`, nunca por texto. */
  brands: BrandKey[];
  /** Linha comercial. É o filtro mais preciso — 'SH Decor' ≠ 'SH Wrapping'. */
  lines: LineKey[];
  colors: ColorFamilyId[];
  finishes: FinishId[];
  patterns: PatternFamilyId[];
  kinds: ItemKind[];
  sort: SortMode;
}

export const EMPTY_FILTERS: FilterState = {
  q: '',
  verticals: [],
  brands: [],
  lines: [],
  colors: [],
  finishes: [],
  patterns: [],
  kinds: [],
  sort: 'relevancia',
};

export function hasActiveFilters(f: FilterState): boolean {
  return (
    f.q.trim().length > 0 ||
    f.verticals.length > 0 ||
    f.brands.length > 0 ||
    f.lines.length > 0 ||
    f.colors.length > 0 ||
    f.finishes.length > 0 ||
    f.patterns.length > 0 ||
    f.kinds.length > 0
  );
}

function intersects<T>(a: readonly T[], b: readonly T[]): boolean {
  return a.some((x) => b.includes(x));
}

/**
 * Funde a seleção da sidebar dentro do ParsedQuery. A sidebar expande o
 * acabamento pela mesma árvore, então marcar "Fosco" no painel traz acetinados
 * exatamente como digitar "fosco" na busca.
 */
export function toParsedQuery(f: FilterState): ParsedQuery {
  const parsed = parseShopQuery(f.q);

  const finishesExact = [...new Set([...parsed.finishesExact, ...f.finishes])];
  const finishesExpanded = [...new Set(finishesExact.flatMap(finishDescendants))];

  return {
    ...parsed,
    colors: [...new Set([...parsed.colors, ...f.colors])],
    verticals: [...new Set([...parsed.verticals, ...f.verticals])],
    brands: [...new Set([...parsed.brands, ...f.brands])],
    lines: [...new Set([...parsed.lines, ...f.lines])],
    patterns: [...new Set([...parsed.patterns, ...f.patterns])],
    finishesExact,
    finishesExpanded,
    hasStructure: parsed.hasStructure || hasActiveFilters({ ...f, q: '' }),
  };
}

/**
 * Pontua um item contra a consulta. `null` = descartado.
 * Sem consulta e sem filtro, todos empatam em 0 e vale a ordem natural.
 */
export function scoreItem(
  item: ShopItem,
  pq: ParsedQuery,
  kinds: ItemKind[] = [],
  /**
   * Quando true, a subfamília de cor filtra em vez de só reordenar. Quem chama
   * é `applyFilters`, que primeiro verifica se existe algum item da subfamília
   * — sem isso, buscar 'azul marinho' num catálogo sem nenhum marinho
   * classificado devolveria zero em vez dos azuis.
   */
  strictSubcolor = false
): number | null {
  if (kinds.length && !kinds.includes(item.kind)) return null;

  const noQuery =
    !pq.colors.length &&
    !pq.finishesExpanded.length &&
    !pq.brands.length &&
    !pq.lines.length &&
    !pq.verticals.length &&
    !pq.patterns.length &&
    !pq.codes.length &&
    !pq.free.length;
  if (noQuery) return 0;

  let score = 0;

  // ---- cor
  if (pq.colors.length) {
    if (!intersects(pq.colors, item.colorFamilies)) return null;
    score += 40;
    // Primária x secundária. Os duplos que sobraram são legítimos ('Orange
    // Red' é laranja E vermelho), mas quem busca "vermelho" quer os vermelhos
    // primeiro: a diferença de 40 pontos joga os duplos para o fim da lista
    // em vez de espalhá-los no meio dos primários.
    if (item.colorFamilies[0] && pq.colors.includes(item.colorFamilies[0])) score += 15;
    else score -= 25;
    if (item.colorConfidence === 'declarada') score += 6;
    else if (item.colorConfidence === 'nome') score += 4;
    else if (item.colorConfidence === 'inferida') score -= 4;
  }

  if (pq.subcolors.length) {
    if (intersects(pq.subcolors, item.colorSubfamilies)) score += 25;
    // Restringe quando existe o que restringir; senão só empurra para baixo,
    // preservando os azuis como resposta útil para 'azul marinho'.
    else if (strictSubcolor) return null;
    else score -= 12;
  }

  // ---- acabamento (filtro duro, via árvore expandida)
  if (pq.finishesExpanded.length) {
    if (!intersects(pq.finishesExpanded, item.finishes)) return null;
    score += 30;
    // 'azul fosco' põe o fosco puro acima do acetinado, sem excluir o acetinado.
    if (intersects(pq.finishesExact, item.finishes)) score += 12;
  }

  // ---- marca / linha / vertical / padrão
  //
  // Igualdade exata, não substring. A versão anterior fazia
  // `searchText.includes('sh')`, e por isso o filtro "SH" trazia 'Marrakesh',
  // 'Windshield', 'Shadow', 'Grasshopper' e 'British' junto com os produtos SH.
  if (pq.brands.length) {
    if (!pq.brands.includes(item.brandKey)) return null;
    score += 20;
  }
  if (pq.lines.length) {
    if (!pq.lines.includes(item.lineKey)) return null;
    score += 28;
  }
  if (pq.verticals.length) {
    if (!pq.verticals.includes(item.vertical)) return null;
    score += 15;
  }
  if (pq.patterns.length) {
    if (!item.patternFamily || !pq.patterns.includes(item.patternFamily)) return null;
    score += 25;
  }

  // ---- código: filtro duro. Digitar '651' junto de 'oracal' tem que devolver
  // as 62 cores da linha 651, não as 86 de todas as linhas Oracal.
  for (const code of pq.codes) {
    const itemCode = item.code ? normalize(item.code) : '';
    if (itemCode.includes(code)) score += 60;
    else if (item.searchText.includes(code)) score += 20;
    else return null;
  }

  // ---- texto livre
  const name = normalize(item.name);
  for (const word of pq.free) {
    if (name.startsWith(word)) score += 35;
    else if (name.includes(word)) score += 22;
    else if (item.searchText.includes(word)) score += 8;
    else if (!pq.hasStructure) return null;
    else score -= 6;
  }

  // ---- desempate estável
  if (item.image) score += 3;
  if (item.legacyPath) score += 1;

  return score;
}

const COLLATOR = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });

export function applyFilters(items: readonly ShopItem[], f: FilterState): ShopItem[] {
  const pq = toParsedQuery(f);

  // Só restringe pela subfamília se ela existir no catálogo filtrado — senão
  // 'azul marinho' num acervo sem marinhos daria zero em vez dos azuis.
  const strictSubcolor =
    pq.subcolors.length > 0 &&
    items.some((i) => pq.subcolors.some((s) => i.colorSubfamilies.includes(s)));

  const scored: { item: ShopItem; score: number }[] = [];
  for (const item of items) {
    const score = scoreItem(item, pq, f.kinds, strictSubcolor);
    if (score !== null) scored.push({ item, score });
  }

  switch (f.sort) {
    case 'nome':
      scored.sort((a, b) => COLLATOR.compare(a.item.name, b.item.name));
      break;
    case 'marca':
      scored.sort(
        (a, b) =>
          COLLATOR.compare(a.item.brand, b.item.brand) ||
          COLLATOR.compare(a.item.line ?? '', b.item.line ?? '') ||
          COLLATOR.compare(a.item.name, b.item.name)
      );
      break;
    default:
      scored.sort((a, b) => b.score - a.score || COLLATOR.compare(a.item.name, b.item.name));
  }

  return scored.map((s) => s.item);
}
