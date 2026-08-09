import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './MetamarkColorCatalog.module.css';

/** Swatch fotográfico (MetaCast MCX) ou cor chapada a partir do valor oficial (Metamark 7). */
export type CatalogSwatch =
  | { type: 'image'; src: string; alt: string }
  | { type: 'color'; hex: string; transparent?: boolean };

export interface CatalogItem {
  /** Identificador de URL — vai para ?cor= */
  id: string;
  code: string;
  name: string;
  /** Grupo do filtro principal: acabamento (MCX) ou família (M7). */
  groupId: string;
  swatch: CatalogSwatch;
  /** Micro-selos no card, ex.: ['INSPIRE™'] ou ['FOSCO']. */
  chips?: string[];
  /** Linhas técnicas do painel — montadas pela página, para o catálogo não conhecer a linha. */
  details: { label: string; value: string }[];
  /** Texto já normalizado (sem acento) para a busca. */
  searchTerms: string;
}

interface Props {
  /** Nome da linha, usado nos rótulos e no aria-label do painel. */
  lineLabel: string;
  title: string;
  subtitle: string;
  items: CatalogItem[];
  groups: { id: string; label: string }[];
  /** Recortes transversais (Blacks, Inspire Colours™) que não são grupos. */
  extraFilters?: { id: string; label: string; test: (item: CatalogItem) => boolean }[];
  /** Largura mínima do card no grid, em px. */
  cardMinPx: number;
  searchPlaceholder: string;
  /** Aviso de fidelidade de cor, exibido sob o grid e dentro do painel. */
  disclaimer: string;
  whatsappUrl: (item: CatalogItem) => string;
}

const normalize = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/* Bottom sheet no celular, painel lateral no desktop — a direção da animação muda,
   então a largura precisa ser lida em JS e não só no CSS. */
const MOBILE_QUERY = '(max-width: 768px)';
const subscribeToWidth = (onChange: () => void) => {
  const mql = window.matchMedia(MOBILE_QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
};
const useIsMobile = () =>
  useSyncExternalStore(
    subscribeToWidth,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  );

const FOCUSABLE = 'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';

export default function MetamarkColorCatalog({
  lineLabel,
  title,
  subtitle,
  items,
  groups,
  extraFilters = [],
  cardMinPx,
  searchPlaceholder,
  disclaimer,
  whatsappUrl,
}: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const isMobile = useIsMobile();

  const query = searchParams.get('q') ?? '';
  const groupParam = searchParams.get('g');
  const openId = searchParams.get('cor');

  const allFilters = useMemo(
    () => [
      ...groups.map((g) => ({ ...g, test: (i: CatalogItem) => i.groupId === g.id })),
      ...extraFilters,
    ],
    [groups, extraFilters],
  );

  const activeFilter = allFilters.find((f) => f.id === groupParam) ?? null;
  const nq = normalize(query);

  const visible = items.filter((item) => {
    if (activeFilter && !activeFilter.test(item)) return false;
    if (!nq) return true;
    return item.searchTerms.includes(nq);
  });

  const countOf = (test: (i: CatalogItem) => boolean) => items.filter(test).length;

  /* O item aberto é derivado da URL, nunca um estado paralelo: mantém o link
     compartilhável e elimina a chance de painel e URL divergirem. */
  const activeItem = openId ? (items.find((i) => i.id === openId) ?? null) : null;

  const writeParams = useCallback(
    (next: { g?: string | null; q?: string; cor?: string | null }, replace: boolean) => {
      const params: Record<string, string> = {};
      const g = next.g !== undefined ? next.g : groupParam;
      const q = next.q !== undefined ? next.q : query;
      const cor = next.cor !== undefined ? next.cor : openId;
      if (g) params.g = g;
      if (q) params.q = q;
      if (cor) params.cor = cor;
      setSearchParams(params, { replace });
    },
    [groupParam, query, openId, setSearchParams],
  );

  const setFilter = (id: string | null) => writeParams({ g: id }, true);
  const setQuery = (q: string) => writeParams({ q }, true);
  /* Entrada do painel empilha no histórico de propósito: no Android o botão
     Voltar fecha o painel em vez de sair da página. */
  const openItem = (id: string) => writeParams({ cor: id }, false);
  const closePanel = useCallback(() => writeParams({ cor: null }, true), [writeParams]);

  // atalho "/" foca a busca
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(target.tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // com o painel aberto: trava o scroll do fundo, Esc fecha, Tab não escapa
  useEffect(() => {
    if (!activeItem) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closePanel();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const nodes = panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    const t = setTimeout(() => closeRef.current?.focus(), 80);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      // devolve o foco ao card de origem
      document.getElementById(`swatch-${openId}`)?.focus();
    };
    // openId identifica o item; activeItem muda junto e não precisa ser dependência
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId, closePanel]);

  // ao chegar com ?g= na URL, centraliza o filtro ativo na régua horizontal
  useEffect(() => {
    if (!groupParam) return;
    document
      .getElementById(`filter-${groupParam}`)
      ?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [groupParam]);

  return (
    <section className={styles.catalog} id="cores">
      <div className={`container ${styles.container}`}>
        <header className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.subtitle}>{subtitle}</p>
        </header>

        <div className={styles.filterBar}>
          <div className={styles.searchWrap}>
            <svg
              className={styles.searchIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.5" y2="16.5" />
            </svg>
            <input
              ref={searchRef}
              type="search"
              className={styles.searchInput}
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setQuery('');
                  e.currentTarget.blur();
                }
              }}
              aria-label={`Buscar cor ${lineLabel}`}
            />
            {query ? (
              <button
                type="button"
                className={styles.searchClear}
                onClick={() => setQuery('')}
                aria-label="Limpar busca"
              >
                ✕
              </button>
            ) : (
              <kbd className={styles.searchKbd}>/</kbd>
            )}
          </div>

          <div className={styles.groupFilter} role="group" aria-label="Filtrar por acabamento">
            <button
              type="button"
              className={`${styles.groupPill} ${!activeFilter ? styles.groupPillActive : ''}`}
              onClick={() => setFilter(null)}
            >
              TODAS <span className={styles.pillCount}>{items.length}</span>
            </button>
            {allFilters.map((f) => {
              const count = countOf(f.test);
              if (!count) return null;
              return (
                <button
                  key={f.id}
                  id={`filter-${f.id}`}
                  type="button"
                  className={`${styles.groupPill} ${activeFilter?.id === f.id ? styles.groupPillActive : ''}`}
                  onClick={() => setFilter(f.id)}
                >
                  {f.label.toUpperCase()} <span className={styles.pillCount}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {query && (
          <p className={styles.searchMeta}>
            {visible.length} {visible.length === 1 ? 'cor encontrada' : 'cores encontradas'} para “{query}”
          </p>
        )}

        <div
          className={styles.grid}
          style={{ ['--card-min' as string]: `${cardMinPx}px` }}
          key={activeFilter?.id ?? 'todas'}
        >
          {visible.map((item) => (
            <button
              key={item.id}
              id={`swatch-${item.id}`}
              type="button"
              className={styles.card}
              onClick={() => openItem(item.id)}
              aria-label={`${item.code} ${item.name} — ver detalhes`}
            >
              <span className={styles.swatchWrap}>
                <Swatch swatch={item.swatch} />
                {!!item.chips?.length && (
                  <span className={styles.cardChips}>
                    {item.chips.map((c) => (
                      <span key={c} className={styles.cardChip}>
                        {c}
                      </span>
                    ))}
                  </span>
                )}
              </span>
              <span className={styles.cardCode}>{item.code}</span>
              <span className={styles.cardName}>{item.name}</span>
            </button>
          ))}
        </div>

        {visible.length === 0 && (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>
              Nenhuma cor encontrada{query ? ` para “${query}”` : ' neste filtro'}.
            </p>
            <p className={styles.emptyHint}>
              Tente o código ({items[0]?.code}) ou o nome da cor. Se você procura um tom específico,
              fale com a gente — temos acesso ao portfólio completo da {lineLabel}.
            </p>
            <button
              type="button"
              className={styles.emptyClear}
              onClick={() => {
                setSearchParams({}, { replace: true });
              }}
            >
              LIMPAR FILTROS
            </button>
          </div>
        )}

        <p className={styles.disclaimer}>{disclaimer}</p>
      </div>

      <AnimatePresence>
        {activeItem && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={closePanel}
          >
            <motion.div
              ref={panelRef}
              className={styles.panel}
              role="dialog"
              aria-modal="true"
              aria-labelledby="metamark-panel-title"
              initial={isMobile ? { y: '100%' } : { x: '100%' }}
              animate={isMobile ? { y: 0 } : { x: 0 }}
              exit={isMobile ? { y: '100%' } : { x: '100%' }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              drag={isMobile ? 'y' : false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.y > 110) closePanel();
              }}
            >
              <span className={styles.grabber} aria-hidden="true" />

              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.panelLine}>{lineLabel}</span>
                  <h3 className={styles.panelTitle} id="metamark-panel-title">
                    {activeItem.code} <span>{activeItem.name}</span>
                  </h3>
                </div>
                <button
                  ref={closeRef}
                  type="button"
                  className={styles.panelClose}
                  onClick={closePanel}
                  aria-label="Fechar detalhes da cor"
                >
                  ✕
                </button>
              </div>

              <div className={styles.panelBody}>
                <div className={styles.panelSwatch}>
                  <Swatch swatch={activeItem.swatch} />
                </div>

                <dl className={styles.panelSpecs}>
                  {activeItem.details.map((d) => (
                    <div key={d.label} className={styles.panelSpecRow}>
                      <dt>{d.label}</dt>
                      <dd>{d.value}</dd>
                    </div>
                  ))}
                </dl>

                <p className={styles.panelDisclaimer}>{disclaimer}</p>
              </div>

              <div className={styles.panelFooter}>
                <a
                  href={whatsappUrl(activeItem)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.panelCta}
                >
                  SOLICITAR ORÇAMENTO
                </a>
                <span className={styles.panelNote}>Valores sob consulta</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function Swatch({ swatch }: { swatch: CatalogSwatch }) {
  if (swatch.type === 'image') {
    return <img src={swatch.src} alt={swatch.alt} className={styles.swatchImage} loading="lazy" decoding="async" />;
  }
  return (
    <span
      className={`${styles.swatchColor} ${swatch.transparent ? styles.swatchTransparent : ''}`}
      style={{ ['--swatch' as string]: swatch.hex }}
    />
  );
}
