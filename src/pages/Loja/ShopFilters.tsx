// Painel de filtros — sidebar no desktop e bottom-sheet no mobile, mesmo
// componente com `mode`. Duas implementações divergiriam com o tempo.
//
// O grupo de acabamento é renderizado como árvore, com o filho indentado sob o
// pai. Isso torna a hierarquia visível: quem vê "Acetinado" recuado embaixo de
// "Fosco" entende sem explicação por que marcar Fosco também traz acetinados.

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { COLOR_SWATCH, type FacetOption, type Facets } from '../../lib/shop/facets';
import type { FilterState } from '../../lib/shop/search/match';
import type { FilterGroup } from './useShopFilters';
import styles from './ShopFilters.module.css';

interface Props {
  facets: Facets;
  filters: FilterState;
  mode: 'sidebar' | 'sheet';
  resultCount: number;
  activeCount: number;
  onToggle: (group: FilterGroup, id: string) => void;
  onClearAll: () => void;
  /** Só no modo sheet. */
  open?: boolean;
  onClose?: () => void;
}

function Group({
  title,
  options,
  group,
  selected,
  onToggle,
}: {
  title: string;
  options: FacetOption[];
  group: FilterGroup;
  selected: readonly string[];
  onToggle: (group: FilterGroup, id: string) => void;
}) {
  if (!options.length) return null;

  return (
    <div className={styles.group}>
      <h3 className={styles.groupTitle}>{title}</h3>
      <ul className={styles.optionList}>
        {options.map((o) => {
          const active = selected.includes(o.id);
          return (
            <li key={o.id}>
              <button
                type="button"
                className={`${styles.option} ${active ? styles.optionActive : ''} ${
                  o.parent ? styles.optionChild : ''
                }`}
                onClick={() => onToggle(group, o.id)}
                aria-pressed={active}
              >
                <span className={styles.optionBox} aria-hidden="true" />
                <span className={styles.optionLabel}>{o.label}</span>
                <span className={styles.optionCount}>{o.count}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ColorGroup({
  options,
  selected,
  onToggle,
}: {
  options: FacetOption[];
  selected: readonly string[];
  onToggle: (group: FilterGroup, id: string) => void;
}) {
  if (!options.length) return null;

  return (
    <div className={styles.group}>
      <h3 className={styles.groupTitle}>Cor</h3>
      <ul className={styles.colorGrid}>
        {options.map((o) => {
          const active = selected.includes(o.id);
          const swatch = COLOR_SWATCH[o.id as keyof typeof COLOR_SWATCH];
          return (
            <li key={o.id}>
              <button
                type="button"
                className={`${styles.colorChip} ${active ? styles.colorChipActive : ''}`}
                onClick={() => onToggle('colors', o.id)}
                aria-pressed={active}
                title={`${o.label} (${o.count})`}
              >
                <span
                  className={`${styles.colorSwatch} ${
                    o.id === 'transparente' ? styles.colorSwatchClear : ''
                  }`}
                  style={swatch === 'transparent' ? undefined : { background: swatch }}
                  aria-hidden="true"
                />
                <span className={styles.colorName}>{o.label}</span>
                <span className={styles.colorCount}>{o.count}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Body({ facets, filters, onToggle }: Pick<Props, 'facets' | 'filters' | 'onToggle'>) {
  return (
    <>
      <Group
        title="Segmento"
        options={facets.verticals}
        group="verticals"
        selected={filters.verticals}
        onToggle={onToggle}
      />
      <ColorGroup options={facets.colors} selected={filters.colors} onToggle={onToggle} />
      <Group
        title="Acabamento"
        options={facets.finishes}
        group="finishes"
        selected={filters.finishes}
        onToggle={onToggle}
      />
      <Group
        title="Linha"
        options={facets.lines}
        group="lines"
        selected={filters.lines}
        onToggle={onToggle}
      />
      <Group
        title="Fabricante"
        options={facets.brands}
        group="brands"
        selected={filters.brands}
        onToggle={onToggle}
      />
      <Group
        title="Tipo"
        options={facets.kinds}
        group="kinds"
        selected={filters.kinds}
        onToggle={onToggle}
      />
      <Group
        title="Padrão"
        options={facets.patterns}
        group="patterns"
        selected={filters.patterns}
        onToggle={onToggle}
      />
    </>
  );
}

export default function ShopFilters({
  facets,
  filters,
  mode,
  resultCount,
  activeCount,
  onToggle,
  onClearAll,
  open = false,
  onClose,
}: Props) {
  // Trava o scroll do fundo enquanto a sheet está aberta — mesmo padrão do
  // SearchPalette. Sem isso o mobile rola a página atrás do painel.
  useEffect(() => {
    if (mode !== 'sheet' || !open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mode, open]);

  useEffect(() => {
    if (mode !== 'sheet' || !open || !onClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, open, onClose]);

  if (mode === 'sidebar') {
    return (
      <aside className={styles.sidebar} aria-label="Filtros">
        <div className={styles.sidebarHead}>
          <span className={styles.sidebarTitle}>FILTRAR</span>
          {activeCount > 0 && (
            <button type="button" className={styles.clearLink} onClick={onClearAll}>
              limpar
            </button>
          )}
        </div>
        <Body facets={facets} filters={filters} onToggle={onToggle} />
      </aside>
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.div
            className={styles.sheet}
            role="dialog"
            aria-modal="true"
            aria-label="Filtros"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
          >
            <span className={styles.sheetHandle} aria-hidden="true" />
            <Body facets={facets} filters={filters} onToggle={onToggle} />
            <div className={styles.sheetFooter}>
              <button type="button" className={styles.sheetClear} onClick={onClearAll}>
                LIMPAR
              </button>
              <button type="button" className={styles.sheetApply} onClick={onClose}>
                VER {resultCount} {resultCount === 1 ? 'PRODUTO' : 'PRODUTOS'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
