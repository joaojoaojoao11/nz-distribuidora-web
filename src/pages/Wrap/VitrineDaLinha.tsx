// Vitrine de uma linha dentro da página dela: os mesmos anúncios da NZSTORE,
// com o mesmo card, e o clique vai para /loja/<slug>. Pedido do João em
// 01/11/2026: "as cores que aparecem ali devem ser as cores e os anúncios da
// nzstore, não ter outras páginas de produtos que não são da loja".
//
// A lista é a do catálogo da loja (banco), filtrada pela linha. Enquanto o
// banco não responde, esqueleto no formato do card: o índice estático tem
// outra contagem e trocar os cards na frente do visitante parece defeito.
//
// Link antigo do painel (?cor=<slug>, que o Google e o WhatsApp ainda têm)
// vai direto para o anúncio.

import { useMemo, useRef } from 'react';
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { useCatalogoEstado, useShopCatalog } from '../../lib/shop/store';
import type { LineKey, ShopItem } from '../../lib/shop/types';
import { ShopCard } from '../Loja/ShopCard';
import { useLimiteNome } from '../Loja/useLimiteNome';
import styles from './MetamarkColorCatalog.module.css';
import own from './VitrineDaLinha.module.css';

interface Props {
  lineKey: LineKey;
  /** Nome da linha nos rótulos ("Metamark 7 Series"). */
  lineLabel: string;
  title: string;
  subtitle: (total: number) => string;
  searchPlaceholder: string;
  disclaimer: string;
  /** Ordem dos grupos do filtro (o que vem depois do " · " no subtítulo do anúncio). */
  ordemGrupos?: string[];
}

const normalize = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** "Metamark 7 Series · Azuis" → "Azuis". Anúncio sem grupo só aparece em TODAS. */
const grupoDe = (item: ShopItem) => item.subtitle?.split(' · ')[1]?.trim() || null;

const ESQUELETO = Array.from({ length: 12 }, (_, i) => i);

export default function VitrineDaLinha({
  lineKey,
  lineLabel,
  title,
  subtitle,
  searchPlaceholder,
  disclaimer,
  ordemGrupos = [],
}: Props) {
  const catalogo = useShopCatalog();
  const estado = useCatalogoEstado();
  const pronto = estado === 'banco' || estado === 'falhou';
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const gridRef = useRef<HTMLDivElement>(null);
  const limiteNome = useLimiteNome(gridRef);

  const query = params.get('q') ?? '';
  const grupoAtivo = params.get('g');
  const corAntiga = params.get('cor');

  const itens = useMemo(
    () =>
      catalogo
        .filter((i) => i.lineKey === lineKey)
        .sort((a, b) => (a.code ?? a.name).localeCompare(b.code ?? b.name, 'pt-BR', { numeric: true })),
    [catalogo, lineKey],
  );

  const grupos = useMemo(() => {
    const contagem = new Map<string, number>();
    for (const i of itens) {
      const g = grupoDe(i);
      if (g) contagem.set(g, (contagem.get(g) ?? 0) + 1);
    }
    const pos = (g: string) => {
      const n = ordemGrupos.indexOf(g);
      return n === -1 ? ordemGrupos.length : n;
    };
    return [...contagem].sort((a, b) => pos(a[0]) - pos(b[0]));
  }, [itens, ordemGrupos]);

  const nq = normalize(query);
  const visiveis = itens.filter((i) => {
    if (grupoAtivo && grupoDe(i) !== grupoAtivo) return false;
    if (!nq) return true;
    return normalize(`${i.code ?? ''} ${i.name} ${i.searchText}`).includes(nq);
  });

  const escrever = (next: { q?: string; g?: string | null }) => {
    const p = new URLSearchParams();
    const q = next.q !== undefined ? next.q : query;
    const g = next.g !== undefined ? next.g : grupoAtivo;
    if (q) p.set('q', q);
    if (g) p.set('g', g);
    setParams(p, { replace: true });
  };

  if (corAntiga && pronto) {
    const alvo = itens.find((i) => i.slug === corAntiga.toLowerCase());
    if (alvo) return <Navigate to={`/loja/${alvo.slug}`} replace />;
  }

  const origem = `${location.pathname}${location.search}`;

  return (
    <section className={styles.catalog} id="cores">
      <div className={`container ${styles.container}`}>
        <header className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.subtitle}>{pronto ? subtitle(itens.length) : ' '}</p>
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
              type="search"
              className={styles.searchInput}
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => escrever({ q: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  escrever({ q: '' });
                  e.currentTarget.blur();
                }
              }}
              aria-label={`Buscar cor ${lineLabel}`}
            />
            {query && (
              <button
                type="button"
                className={styles.searchClear}
                onClick={() => escrever({ q: '' })}
                aria-label="Limpar busca"
              >
                ✕
              </button>
            )}
          </div>

          {pronto && grupos.length > 0 && (
            <div className={styles.groupFilter} role="group" aria-label="Filtrar por família">
              <button
                type="button"
                className={`${styles.groupPill} ${!grupoAtivo ? styles.groupPillActive : ''}`}
                onClick={() => escrever({ g: null })}
              >
                TODAS <span className={styles.pillCount}>{itens.length}</span>
              </button>
              {grupos.map(([g, n]) => (
                <button
                  key={g}
                  type="button"
                  className={`${styles.groupPill} ${grupoAtivo === g ? styles.groupPillActive : ''}`}
                  onClick={() => escrever({ g })}
                >
                  {g.toUpperCase()} <span className={styles.pillCount}>{n}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {query && pronto && (
          <p className={styles.searchMeta}>
            {visiveis.length} {visiveis.length === 1 ? 'cor encontrada' : 'cores encontradas'} para “{query}”
          </p>
        )}

        {pronto ? (
          <div className={own.grid} ref={gridRef}>
            {visiveis.map((item) => (
              <ShopCard key={item.slug} item={item} limiteNome={limiteNome} from={origem} />
            ))}
          </div>
        ) : (
          <div className={own.grid} aria-busy="true" aria-label="Carregando as cores">
            {ESQUELETO.map((n) => (
              <div key={n} className={own.esqueleto} />
            ))}
          </div>
        )}

        {pronto && visiveis.length === 0 && (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>
              Nenhuma cor encontrada{query ? ` para “${query}”` : ' neste filtro'}.
            </p>
            <button type="button" className={styles.emptyClear} onClick={() => setParams({}, { replace: true })}>
              LIMPAR FILTROS
            </button>
          </div>
        )}

        {pronto && itens.length > 0 && (
          <p className={own.naLoja}>
            <Link to={`/loja?linha=${lineKey}`} className={own.naLojaLink}>
              VER A LINHA NA NZSTORE <span aria-hidden="true">→</span>
            </Link>
          </p>
        )}

        <p className={styles.disclaimer}>{disclaimer}</p>
      </div>
    </section>
  );
}
