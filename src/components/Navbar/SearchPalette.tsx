import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { shDecorProducts, shDecorFamilies } from '../../pages/Decor/shDecorProducts';
import { ethernaProducts, ethernaFamilies } from '../../pages/Decor/ethernaProducts';
import { averyFamilies } from '../../pages/Sign/averyLines';
import { NZWRAP_COLORS } from '../../lib/data/nzwrapColors';
import styles from './SearchPalette.module.css';

type SearchItem = {
  label: string;
  sublabel: string;
  group: string;
  path: string;
  thumb?: string;
  swatch?: string;
  keywords?: string;
};

// busca sem acentos/caixa: "formica" encontra "Fórmica"
const normalize = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

const STATIC_PAGES: SearchItem[] = [
  { label: 'NZPPF', sublabel: 'Proteção de pintura', group: 'PÁGINA', path: '/ppf', keywords: 'ppf pelicula protecao pintura' },
  { label: 'Luxury Gloss', sublabel: 'Linha NZPPF', group: 'NZPPF', path: '/ppf/luxury-gloss', keywords: 'ppf luxury' },
  { label: 'Prime Gloss', sublabel: 'Linha NZPPF', group: 'NZPPF', path: '/ppf/prime-gloss', keywords: 'ppf prime' },
  { label: 'Flow Gloss', sublabel: 'Linha NZPPF', group: 'NZPPF', path: '/ppf/flow-gloss', keywords: 'ppf flow' },
  { label: 'Core Gloss', sublabel: 'Linha NZPPF', group: 'NZPPF', path: '/ppf/core-gloss', keywords: 'ppf core' },
  { label: 'Headlight', sublabel: 'PPF para faróis', group: 'NZPPF', path: '/ppf/headlight', keywords: 'farol pelicula' },
  { label: 'Windshield', sublabel: 'PPF para para-brisa', group: 'NZPPF', path: '/ppf/windshield', keywords: 'parabrisa para-brisa vidro' },
  { label: 'NZWRAP', sublabel: 'Envelopamento automotivo', group: 'PÁGINA', path: '/wrap', keywords: 'wrap envelopamento adesivo automotivo' },
  { label: 'NZWrap Premium', sublabel: 'Linha premium de cores', group: 'NZWRAP', path: '/wrap/nzwrap-premium', keywords: 'cores premium tpu' },
  { label: 'SH Wrapping Colors', sublabel: 'Catálogo de cores SH', group: 'NZWRAP', path: '/wrap/sh-colors', keywords: 'sh colors cores' },
  { label: 'Oracal 970RA', sublabel: 'Wrapping premium Orafol', group: 'NZWRAP', path: '/wrap/oracal-970ra', keywords: 'oracal orafol 970' },
  { label: 'Oracal 670RA', sublabel: 'Wrapping film Orafol', group: 'NZWRAP', path: '/wrap/oracal-670ra', keywords: 'oracal orafol 670' },
  { label: 'Oracal 651', sublabel: 'Vinil intermediário Orafol', group: 'NZWRAP', path: '/wrap/oracal-651', keywords: 'oracal orafol 651' },
  { label: 'NZSIGN', sublabel: 'Comunicação visual Avery Dennison', group: 'PÁGINA', path: '/sign', keywords: 'sign avery dennison comunicacao visual impressao' },
  { label: 'NZDECOR', sublabel: 'Envelopamento arquitetônico', group: 'PÁGINA', path: '/decor', keywords: 'decor decorativo arquitetonico moveis parede' },
  { label: 'Catálogo SH Decor', sublabel: '55 padrões de vinil decorativo', group: 'NZDECOR', path: '/decor/sh', keywords: 'sh decor catalogo padroes' },
  { label: 'Catálogo Etherna Decor', sublabel: '159 padrões de vinil adesivo', group: 'NZDECOR', path: '/decor/etherna', keywords: 'etherna catalogo padroes' },
  { label: 'Empresa', sublabel: 'Quem é a NZ Group', group: 'PÁGINA', path: '/sobre', keywords: 'sobre historia nz group' },
  { label: 'Blog', sublabel: 'Conteúdo e novidades', group: 'PÁGINA', path: '/blog', keywords: 'blog artigos noticias' },
  { label: 'Encontre um Aplicador', sublabel: 'Rede credenciada NZ', group: 'PÁGINA', path: '/encontre-aplicador', keywords: 'aplicador instalador credenciado' },
  { label: 'Registro de Garantia', sublabel: 'Registre sua aplicação', group: 'PÁGINA', path: '/registro-garantia', keywords: 'garantia registro' },
  { label: 'Validar Garantia', sublabel: 'Consulte um certificado', group: 'PÁGINA', path: '/validar-garantia', keywords: 'garantia validar certificado' },
];

const buildIndex = (): SearchItem[] => [
  ...STATIC_PAGES,
  ...averyFamilies.map((f) => ({
    label: f.shortName,
    sublabel: f.subtitle,
    group: 'NZSIGN',
    path: `/sign/${f.slug}`,
    keywords: `avery ${f.name}`,
  })),
  ...NZWRAP_COLORS.map((c) => ({
    label: c.name.replace(/^NZWRAP /, ''),
    sublabel: `${c.sku} · ${c.finish}`,
    group: 'NZWRAP',
    path: `/wrap/nzwrap-premium/${c.sku}`,
    swatch: c.hex,
    keywords: 'cor nzwrap premium',
  })),
  ...shDecorProducts.map((p) => ({
    label: p.name,
    sublabel: `${p.code} · ${shDecorFamilies.find((f) => f.slug === p.family)?.name ?? ''}`,
    group: 'SH DECOR',
    path: `/decor/sh/${p.slug}`,
    thumb: p.images.texture,
    keywords: 'padrao vinil decorativo',
  })),
  ...ethernaProducts.map((p) => ({
    label: p.name,
    sublabel: `${p.code ? `CÓD. ${p.code} · ` : ''}${ethernaFamilies.find((f) => f.slug === p.family)?.name ?? ''}`,
    group: 'ETHERNA',
    path: `/decor/etherna/${p.slug}`,
    thumb: p.images.texture,
    keywords: 'padrao vinil adesivo',
  })),
];

const QUICK_LINKS = STATIC_PAGES.filter((p) =>
  ['/ppf', '/wrap', '/sign', '/decor', '/encontre-aplicador', '/registro-garantia'].includes(p.path)
);

export default function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const index = useMemo(buildIndex, []);

  const results = useMemo(() => {
    const nq = normalize(query);
    if (!nq) return QUICK_LINKS;
    const scored: { item: SearchItem; score: number }[] = [];
    for (const item of index) {
      const label = normalize(item.label);
      const rest = normalize(`${item.sublabel} ${item.keywords ?? ''} ${item.group}`);
      let score: number | null = null;
      if (label.startsWith(nq)) score = 0;
      else if (label.includes(nq)) score = 1;
      else if (rest.includes(nq)) score = 2;
      if (score !== null) scored.push({ item, score });
    }
    return scored
      .sort((a, b) => a.score - b.score)
      .slice(0, 9)
      .map((s) => s.item);
  }, [index, query]);

  useEffect(() => setActiveIndex(0), [query]);

  // foco + trava o scroll do body enquanto aberto
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIndex(0);
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(t);
      document.body.style.overflow = '';
    };
  }, [open]);

  const go = (item: SearchItem) => {
    onClose();
    navigate(item.path);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === 'Enter' && results[activeIndex]) go(results[activeIndex]);
  };

  // mantém o item ativo visível na lista
  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
        >
          <motion.div
            className={styles.panel}
            initial={{ opacity: 0, y: -14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Busca no site"
          >
            <div className={styles.inputRow}>
              <svg
                className={styles.inputIcon}
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
                ref={inputRef}
                type="text"
                className={styles.input}
                placeholder="Buscar linha, página, padrão ou cor…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                aria-label="Buscar no site"
              />
              <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Fechar busca">
                ESC
              </button>
            </div>

            {!query && <p className={styles.quickTitle}>ACESSO RÁPIDO</p>}

            <div className={styles.results} ref={listRef}>
              {results.map((item, i) => (
                <button
                  key={item.path}
                  type="button"
                  data-index={i}
                  className={`${styles.resultItem} ${i === activeIndex ? styles.resultActive : ''}`}
                  onClick={() => go(item)}
                  onMouseEnter={() => setActiveIndex(i)}
                >
                  {item.thumb && <img src={item.thumb} alt="" className={styles.resultThumb} loading="lazy" />}
                  {item.swatch && <span className={styles.resultSwatch} style={{ background: item.swatch }} />}
                  <span className={styles.resultText}>
                    <span className={styles.resultLabel}>{item.label}</span>
                    <span className={styles.resultSub}>{item.sublabel}</span>
                  </span>
                  <span className={styles.resultGroup}>{item.group}</span>
                </button>
              ))}
              {query && results.length === 0 && (
                <p className={styles.empty}>
                  Nada encontrado para “{query}”. Tente o nome de uma linha, padrão ou página.
                </p>
              )}
            </div>

            <div className={styles.footer}>
              <span><kbd>↑</kbd><kbd>↓</kbd> navegar</span>
              <span><kbd>Enter</kbd> abrir</span>
              <span><kbd>Esc</kbd> fechar</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
