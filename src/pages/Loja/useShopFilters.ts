// Estado dos filtros da LOJA, inteiramente na URL.
//
// Mesma escolha do ShDecorCatalog: `useSearchParams` com `{ replace: true }`.
// Isso dá link compartilhável ("me manda os azuis foscos"), botão voltar
// funcionando e a possibilidade de indexar `/loja?cor=azul` como página de
// intenção. Multi-valor vai separado por vírgula, não repetindo a chave, para a
// URL não ficar quilométrica com 6 filtros ativos.

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { FilterState, SortMode } from '../../lib/shop/search/match';
import { COLOR_LABEL, type ColorFamilyId } from '../../lib/shop/color/lexicon';
import { BRAND_LABEL, LINE_LABEL } from '../../lib/shop/facets';
import { FINISH_LABEL } from '../../lib/shop/finish/tree';
import { PATTERN_LABEL } from '../../lib/shop/pattern/taxonomy';
import { isFinishId, type FinishId } from '../../lib/shop/finish/tree';
import { isPatternFamilyId, type PatternFamilyId } from '../../lib/shop/pattern/taxonomy';
import type { BrandKey, ItemKind, LineKey, NivelEstoque, Vertical } from '../../lib/shop/types';
import { ESTOQUE_LABEL } from '../../lib/shop/facets';
import { LINHA_LABEL } from '../../lib/shop/erp/mapa';

const PARAM = {
  q: 'q',
  vertical: 'v',
  color: 'cor',
  finish: 'acab',
  brand: 'marca',
  line: 'linha',
  pattern: 'padrao',
  kind: 'tipo',
  estoque: 'estoque',
  sort: 'sort',
  /** Slugs removidos à mão durante a curadoria. Some quando vira seleção. */
  out: 'fora',
  /** Seleção CONGELADA: quando presente, é ela que manda, e os filtros somem. */
  selection: 'sel',
} as const;

/** Rótulo dos chips de tipo — o da sidebar é plural, o do chip é singular. */
const KIND_CHIP: Record<ItemKind, string> = {
  cor: 'Cores',
  padrao: 'Padrões',
  linha: 'Linhas técnicas',
};

const VERTICALS: Vertical[] = ['PPF', 'WRAP', 'SIGN', 'DECOR'];
const BRAND_KEYS: BrandKey[] = ['nz', 'sh', 'metamark', 'orafol', 'avery', 'etherna', 'speed', 'nar', 'outro'];
const LINE_KEYS = Object.keys(LINHA_LABEL) as LineKey[];
const KINDS: ItemKind[] = ['cor', 'padrao', 'linha'];
const SORTS: SortMode[] = ['relevancia', 'nome', 'marca'];

function readList(params: URLSearchParams, key: string): string[] {
  const raw = params.get(key);
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export interface UseShopFilters {
  filters: FilterState;
  /** Slugs tirados da lista pelo × no card. */
  excluded: string[];
  /**
   * Seleção congelada vinda de `?sel=`. Vazia na navegação normal.
   * Quando existe, a página mostra exatamente estes itens, nesta ordem, e
   * ignora os filtros — é o link que foi enviado para o cliente.
   */
  selection: string[];
  removeItem: (slug: string) => void;
  restoreItem: (slug: string) => void;
  clearExcluded: () => void;
  setQuery: (q: string) => void;
  toggle: (group: FilterGroup, id: string) => void;
  setSort: (sort: SortMode) => void;
  clearGroup: (group: FilterGroup) => void;
  clearAll: () => void;
  activeChips: ActiveChip[];
  activeCount: number;
}

export type FilterGroup =
  | 'verticals'
  | 'colors'
  | 'finishes'
  | 'lines'
  | 'brands'
  | 'patterns'
  | 'kinds'
  | 'estoque';

export interface ActiveChip {
  group: FilterGroup | 'q';
  id: string;
  label: string;
}

export function useShopFilters(): UseShopFilters {
  const [params, setParams] = useSearchParams();

  const excluded = useMemo(() => readList(params, PARAM.out), [params]);
  const selection = useMemo(() => readList(params, PARAM.selection), [params]);

  const filters = useMemo<FilterState>(() => {
    const sortRaw = params.get(PARAM.sort) as SortMode | null;
    return {
      q: params.get(PARAM.q) ?? '',
      verticals: readList(params, PARAM.vertical).filter((v): v is Vertical =>
        VERTICALS.includes(v as Vertical)
      ),
      colors: readList(params, PARAM.color).filter(
        (c): c is ColorFamilyId => c in COLOR_LABEL
      ),
      finishes: readList(params, PARAM.finish).filter((f): f is FinishId => isFinishId(f)),
      brands: readList(params, PARAM.brand).filter((b): b is BrandKey =>
        BRAND_KEYS.includes(b as BrandKey)
      ),
      lines: readList(params, PARAM.line).filter((l): l is LineKey =>
        LINE_KEYS.includes(l as LineKey)
      ),
      patterns: readList(params, PARAM.pattern).filter((p): p is PatternFamilyId =>
        isPatternFamilyId(p)
      ),
      kinds: readList(params, PARAM.kind).filter((k): k is ItemKind => KINDS.includes(k as ItemKind)),
      estoque: readList(params, PARAM.estoque).filter((e): e is NivelEstoque => e in ESTOQUE_LABEL),
      sort: sortRaw && SORTS.includes(sortRaw) ? sortRaw : 'relevancia',
    };
  }, [params]);

  const commit = useCallback(
    (next: FilterState) => {
      const out = new URLSearchParams();
      if (next.q.trim()) out.set(PARAM.q, next.q.trim());
      if (next.verticals.length) out.set(PARAM.vertical, next.verticals.join(','));
      if (next.colors.length) out.set(PARAM.color, next.colors.join(','));
      if (next.finishes.length) out.set(PARAM.finish, next.finishes.join(','));
      if (next.brands.length) out.set(PARAM.brand, next.brands.join(','));
      if (next.lines.length) out.set(PARAM.line, next.lines.join(','));
      if (next.patterns.length) out.set(PARAM.pattern, next.patterns.join(','));
      if (next.kinds.length) out.set(PARAM.kind, next.kinds.join(','));
      if (next.estoque.length) out.set(PARAM.estoque, next.estoque.join(','));
      if (next.sort !== 'relevancia') out.set(PARAM.sort, next.sort);
      // A curadoria sobrevive à troca de filtro: quem tirou um item continua
      // sem ele ao estreitar a busca.
      if (excluded.length) out.set(PARAM.out, excluded.join(','));
      setParams(out, { replace: true });
    },
    [setParams, excluded]
  );

  const setQuery = useCallback((q: string) => commit({ ...filters, q }), [commit, filters]);

  const toggle = useCallback(
    (group: FilterGroup, id: string) => {
      const current = filters[group] as string[];
      const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
      commit({ ...filters, [group]: next } as FilterState);
    },
    [commit, filters]
  );

  const setSort = useCallback((sort: SortMode) => commit({ ...filters, sort }), [commit, filters]);

  const clearGroup = useCallback(
    (group: FilterGroup) => commit({ ...filters, [group]: [] } as FilterState),
    [commit, filters]
  );

  const clearAll = useCallback(() => {
    const out = new URLSearchParams();
    // Mesma regra do commit(): a curadoria (?fora=) sobrevive. "LIMPAR TUDO"
    // limpa filtros, não a lista que o vendedor montou — antes descartava os
    // itens ocultos em silêncio.
    if (excluded.length) out.set(PARAM.out, excluded.join(','));
    setParams(out, { replace: true });
  }, [setParams, excluded]);

  const setExcluded = useCallback(
    (slugs: string[]) => {
      const out = new URLSearchParams(params);
      if (slugs.length) out.set(PARAM.out, slugs.join(','));
      else out.delete(PARAM.out);
      setParams(out, { replace: true });
    },
    [params, setParams]
  );

  const removeItem = useCallback(
    (slug: string) => {
      if (!excluded.includes(slug)) setExcluded([...excluded, slug]);
    },
    [excluded, setExcluded]
  );

  const restoreItem = useCallback(
    (slug: string) => setExcluded(excluded.filter((s) => s !== slug)),
    [excluded, setExcluded]
  );

  const clearExcluded = useCallback(() => setExcluded([]), [setExcluded]);

  const activeChips = useMemo<ActiveChip[]>(() => {
    const chips: ActiveChip[] = [];
    if (filters.q.trim()) chips.push({ group: 'q', id: filters.q, label: `“${filters.q}”` });
    for (const v of filters.verticals) chips.push({ group: 'verticals', id: v, label: v });
    for (const c of filters.colors) {
      chips.push({ group: 'colors', id: c, label: COLOR_LABEL[c] });
    }
    for (const f of filters.finishes) {
      chips.push({ group: 'finishes', id: f, label: FINISH_LABEL[f] ?? f });
    }
    for (const l of filters.lines) {
      chips.push({ group: 'lines', id: l, label: LINE_LABEL[l] ?? l });
    }
    for (const b of filters.brands) {
      chips.push({ group: 'brands', id: b, label: BRAND_LABEL[b] ?? b });
    }
    for (const p of filters.patterns) {
      chips.push({ group: 'patterns', id: p, label: PATTERN_LABEL[p] ?? p });
    }
    for (const k of filters.kinds) chips.push({ group: 'kinds', id: k, label: KIND_CHIP[k] });
    for (const e of filters.estoque) chips.push({ group: 'estoque', id: e, label: ESTOQUE_LABEL[e] });
    return chips;
  }, [filters]);

  const activeCount =
    filters.verticals.length +
    filters.colors.length +
    filters.finishes.length +
    filters.brands.length +
    filters.lines.length +
    filters.patterns.length +
    filters.kinds.length +
    filters.estoque.length;

  return {
    filters,
    excluded,
    selection,
    removeItem,
    restoreItem,
    clearExcluded,
    setQuery,
    toggle,
    setSort,
    clearGroup,
    clearAll,
    activeChips,
    activeCount,
  };
}
