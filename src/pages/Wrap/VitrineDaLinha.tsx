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

import { useMemo, useRef, type ReactNode } from 'react';
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import type { LineKey } from '../../lib/shop/types';
import { ShopCard } from '../Loja/ShopCard';
import { useLimiteNome } from '../Loja/useLimiteNome';
import styles from './MetamarkColorCatalog.module.css';
import own from './VitrineDaLinha.module.css';
import { grupoDoAnuncio, normalizar, useAnunciosDaLinha, type GrupoDe } from './useAnunciosDaLinha';

interface Props {
  lineKey: LineKey;
  /** Nome da linha nos rótulos ("Metamark 7 Series"). */
  lineLabel: string;
  /** Sem título, a vitrine entra direto no filtro (páginas que já têm o título no herói). */
  title?: string;
  subtitle?: (total: number) => string;
  searchPlaceholder: string;
  disclaimer?: string;
  /** Ordem dos grupos do filtro; os que não estão aqui vêm depois, em ordem alfabética. */
  ordemGrupos?: string[];
  /** Rótulos que mudam com o gênero do item: "cor encontrada" × "padrão encontrado". */
  rotulos?: { um: string; varios: string; todos: string };
  /** Abaixo do subtítulo (ex.: botão do datasheet da Oracal 651). */
  extra?: ReactNode;
  /** Classe da <section>, para a página manter o próprio fundo. */
  classeSecao?: string;
  /**
   * Grupo de cada anúncio quando a página tem famílias próprias (Decor: a família
   * do catálogo, não a coleção do subtítulo). Função estável, definida fora do componente.
   */
  grupoDe?: GrupoDe;
  /** Acima da grade com um grupo escolhido: descrição da família, fotos de ambiente. */
  topoDoGrupo?: (grupo: string) => ReactNode;
}

const ROTULOS_COR = { um: 'cor encontrada', varios: 'cores encontradas', todos: 'TODAS' };

const ESQUELETO = Array.from({ length: 12 }, (_, i) => i);

export default function VitrineDaLinha({
  lineKey,
  lineLabel,
  title,
  subtitle,
  searchPlaceholder,
  disclaimer,
  ordemGrupos = [],
  rotulos = ROTULOS_COR,
  extra,
  classeSecao,
  grupoDe,
  topoDoGrupo,
}: Props) {
  const { itens, pronto } = useAnunciosDaLinha(lineKey, lineLabel, grupoDe);
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const gridRef = useRef<HTMLDivElement>(null);
  const limiteNome = useLimiteNome(gridRef);

  const query = params.get('q') ?? '';
  const grupoAtivo = params.get('g');
  const corAntiga = params.get('cor');

  const grupoDoItem = useMemo<GrupoDe>(() => grupoDe ?? ((i) => grupoDoAnuncio(i, lineLabel)), [grupoDe, lineLabel]);

  const grupos = useMemo(() => {
    const contagem = new Map<string, number>();
    for (const i of itens) {
      const g = grupoDoItem(i);
      if (g) contagem.set(g, (contagem.get(g) ?? 0) + 1);
    }
    const pos = (g: string) => {
      const n = ordemGrupos.indexOf(g);
      return n === -1 ? ordemGrupos.length : n;
    };
    return [...contagem].sort((a, b) => pos(a[0]) - pos(b[0]) || a[0].localeCompare(b[0], 'pt-BR'));
  }, [itens, ordemGrupos, grupoDoItem]);

  const nq = normalizar(query);
  const visiveis = itens.filter((i) => {
    if (grupoAtivo && grupoDoItem(i) !== grupoAtivo) return false;
    if (!nq) return true;
    // A ficha entra na busca: é onde mora o Pantone ("447C") da Metamark 7.
    const ficha = i.specs.map((s) => s.value).join(' ');
    return normalizar(`${i.code ?? ''} ${i.name} ${i.subtitle ?? ''} ${grupoDoItem(i) ?? ''} ${i.searchText} ${ficha}`).includes(nq);
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
    <section className={classeSecao ?? styles.catalog} id="cores">
      <div className={`container ${styles.container}`}>
        {title && (
          <header className={styles.header}>
            <h2 className={styles.title}>{title}</h2>
            {subtitle && <p className={styles.subtitle}>{pronto ? subtitle(itens.length) : ' '}</p>}
            {extra && <div className={own.extra}>{extra}</div>}
          </header>
        )}

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
              aria-label={`Buscar em ${lineLabel}`}
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

          {pronto && grupos.length > 1 && (
            <div className={styles.groupFilter} role="group" aria-label="Filtrar por grupo">
              <button
                type="button"
                className={`${styles.groupPill} ${!grupoAtivo ? styles.groupPillActive : ''}`}
                onClick={() => escrever({ g: null })}
              >
                {rotulos.todos} <span className={styles.pillCount}>{itens.length}</span>
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
            {visiveis.length} {visiveis.length === 1 ? rotulos.um : rotulos.varios} para “{query}”
          </p>
        )}

        {pronto && grupoAtivo && topoDoGrupo?.(grupoAtivo)}

        {pronto ? (
          <div className={own.grid} ref={gridRef}>
            {visiveis.map((item) => (
              <ShopCard key={item.slug} item={item} limiteNome={limiteNome} from={origem} />
            ))}
          </div>
        ) : (
          <div className={own.grid} aria-busy="true" aria-label="Carregando os anúncios">
            {ESQUELETO.map((n) => (
              <div key={n} className={own.esqueleto} />
            ))}
          </div>
        )}

        {pronto && visiveis.length === 0 && (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>
              Nada encontrado{query ? ` para “${query}”` : ' neste filtro'}.
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

        {disclaimer && <p className={styles.disclaimer}>{disclaimer}</p>}
      </div>
    </section>
  );
}
