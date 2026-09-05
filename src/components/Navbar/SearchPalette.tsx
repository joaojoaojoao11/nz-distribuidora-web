import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { closeModal, useModalLock } from '../../hooks/useModalLock';
import { SOURCE_LABEL } from '../../lib/shop/catalog';
import { useShopCatalog } from '../../lib/shop/store';
import { applyFilters, EMPTY_FILTERS } from '../../lib/shop/search/match';
import { normalize } from '../../lib/shop/types';
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

// Páginas do site. Os PRODUTOS não vivem mais aqui: vêm do catálogo unificado
// de src/lib/shop, que é a mesma fonte que a LOJA usa. Antes esta lista
// duplicava seis blocos de mapeamento à mão e, por construção, deixava de fora
// as 116 cores que só existem no banco (Oracal 651/670, SH Wrapping).
const STATIC_PAGES: SearchItem[] = [
  { label: 'Loja', sublabel: 'Catálogo completo · todos os produtos', group: 'PÁGINA', path: '/loja', keywords: 'loja catalogo completo produtos comprar' },
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
  { label: 'MetaCast MCX', sublabel: 'Cast premium Metamark · 37 cores', group: 'NZWRAP', path: '/wrap/metamark-mcx', keywords: 'metamark metacast mcx cast envelopamento inspire colours metaglide metasure reino unido' },
  { label: 'Metamark 7 Series', sublabel: 'Vinil de recorte · 92 cores', group: 'NZWRAP', path: '/wrap/metamark-7-series', keywords: 'metamark m7 7 series recorte sinalizacao vinil sign pantone plotter' },
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

const QUICK_LINKS = STATIC_PAGES.filter((p) =>
  ['/loja', '/ppf', '/wrap', '/sign', '/decor', '/encontre-aplicador'].includes(p.path)
);

const MAX_PAGES = 3;
const MAX_PRODUCTS = 6;

export default function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const SHOP_ITEMS = useShopCatalog();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const results = useMemo<SearchItem[]>(() => {
    const nq = normalize(query);
    if (!nq) return QUICK_LINKS;

    // Páginas: match textual simples, como antes.
    const pages: { item: SearchItem; score: number }[] = [];
    for (const page of STATIC_PAGES) {
      const label = normalize(page.label);
      const rest = normalize(`${page.sublabel} ${page.keywords ?? ''} ${page.group}`);
      let score: number | null = null;
      if (label.startsWith(nq)) score = 0;
      else if (label.includes(nq)) score = 1;
      else if (rest.includes(nq)) score = 2;
      if (score !== null) pages.push({ item: page, score });
    }
    pages.sort((a, b) => a.score - b.score);

    // Produtos: o MESMO motor da LOJA, então "azul fosco" funciona aqui igual.
    const products = applyFilters(SHOP_ITEMS, { ...EMPTY_FILTERS, q: query })
      .slice(0, MAX_PRODUCTS)
      .map<SearchItem>((item) => ({
        label: item.name,
        sublabel: [item.code, item.finishLabel ?? item.line].filter(Boolean).join(' · '),
        group: SOURCE_LABEL[item.source].toUpperCase(),
        path: `/loja/${item.slug}`,
        thumb: item.image ?? undefined,
        swatch: item.image ? undefined : item.hex ?? undefined,
      }));

    return [...pages.slice(0, MAX_PAGES).map((p) => p.item), ...products];
  }, [query, SHOP_ITEMS]);

  // Total real da busca, para oferecer "ver todos na loja".
  const totalProducts = useMemo(() => {
    if (!query.trim()) return 0;
    return applyFilters(SHOP_ITEMS, { ...EMPTY_FILTERS, q: query }).length;
  }, [query, SHOP_ITEMS]);

  // Reset por comparação com o valor anterior, ajustado durante o render. O
  // efeito equivalente causaria um render extra a cada tecla digitada.
  const [prev, setPrev] = useState({ open, query });
  if (prev.open !== open || prev.query !== query) {
    setPrev({ open, query });
    if (prev.open !== open && open) setQuery('');
    setActiveIndex(0);
  }

  // Trava de scroll (iOS), Voltar do Android, Escape e o sinal para o WhatsApp
  // flutuante sumir — tudo no hook.
  useModalLock(open, onClose);

  // Foco programático só com mouse. No toque ele é o "autoFocus" que o quiz do
  // Interlagos teve que tirar: o iOS ignora foco fora de um gesto, e o Android
  // abria o teclado, redimensionava a viewport e movia as linhas de resultado
  // sob o dedo antes de o usuário ler os atalhos.
  useEffect(() => {
    if (!open || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [open]);

  const go = (path: string) => {
    onClose();
    // `replace`: substitui a entrada sentinela que o hook empilhou ao abrir.
    // Sem isso o "voltar" seguinte cairia numa entrada morta da mesma página.
    navigate(path, { replace: true });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Escape é tratado pelo hook (no window): tratar aqui também fecharia duas
    // vezes pelo histórico e voltaria uma página a mais.
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === 'Enter') {
      // Sem item ativo válido, Enter leva à loja com a busca aplicada.
      if (results[activeIndex]) go(results[activeIndex].path);
      else if (query.trim()) go(`/loja?q=${encodeURIComponent(query)}`);
    }
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
          onClick={() => closeModal(onClose)}
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
                placeholder="Buscar produto, cor, acabamento ou página…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                aria-label="Buscar no site"
              />
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => closeModal(onClose)}
                aria-label="Fechar busca"
              >
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
                  onClick={() => go(item.path)}
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

              {query && totalProducts > MAX_PRODUCTS && (
                <button
                  type="button"
                  className={styles.resultItem}
                  onClick={() => go(`/loja?q=${encodeURIComponent(query)}`)}
                >
                  <span className={styles.resultText}>
                    <span className={styles.resultLabel}>
                      Ver os {totalProducts} resultados na Loja →
                    </span>
                    <span className={styles.resultSub}>Com filtros de cor, acabamento e marca</span>
                  </span>
                  <span className={styles.resultGroup}>LOJA</span>
                </button>
              )}

              {query && results.length === 0 && (
                <p className={styles.empty}>
                  Nada encontrado para “{query}”. Tente uma cor (“azul fosco”), uma marca ou um código.
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
