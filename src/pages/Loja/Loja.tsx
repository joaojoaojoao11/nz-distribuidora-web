// /loja — índice único do portfólio NZ.
//
// Mobile-first: a barra de busca é sticky logo abaixo do menu, os filtros vivem
// num bottom-sheet e o grid começa em 2 colunas. A sidebar só aparece a partir
// de 1024px.
//
// Os 505 itens ficam todos no DOM, revelados em lotes de 60 e com
// `content-visibility: auto` no card. Virtualização foi descartada: exigiria
// nova dependência, fixaria o número de colunas (matando o `auto-fill`
// responsivo), quebraria o Ctrl+F do navegador e complicaria a restauração de
// scroll ao voltar de um produto.

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigationType } from 'react-router-dom';
import { SCROLL_KEY_PREFIX } from '../../components/ScrollToTop';
import SEO from '../../components/SEO/SEO';
import { SITE_URL } from '../../lib/siteConfig';
import { getShopItem, useShopCatalog } from '../../lib/shop/store';
import { usePrecosLote } from '../../lib/shop/precos';
import type { ShopItem } from '../../lib/shop/types';
import { computeFacets } from '../../lib/shop/facets';
import { applyFilters, hasActiveFilters, type SortMode } from '../../lib/shop/search/match';
import { ShopCard } from './ShopCard';
import ShopFilters from './ShopFilters';
import { useShopFilters, type FilterGroup } from './useShopFilters';
import styles from './Loja.module.css';

const PAGE_SIZE = 60;
/** Nome do parâmetro da seleção congelada — espelha PARAM.selection do hook. */
const PARAM_SEL = 'sel';
/**
 * Acima disso o link fica longo demais para colar em WhatsApp e e-mail sem
 * quebrar. Quem passa daqui não curou — filtrou.
 */
const MAX_SELECAO = 120;
/** Cards com imagem prioritária — o suficiente para preencher a primeira dobra. */
const EAGER_COUNT = 8;

const WHATSAPP_URL =
  'https://wa.me/5511920707565?text=Ol%C3%A1%2C%20estou%20na%20loja%20do%20site%20da%20NZ%20e%20quero%20um%20or%C3%A7amento.';

const SORT_LABEL: Record<SortMode, string> = {
  relevancia: 'Relevância',
  nome: 'Nome',
  marca: 'Marca',
};

/** Pausa entre a última tecla e a atualização da URL/lista. */
const DEBOUNCE_BUSCA_MS = 150;
/** Navbar (64) + barra sticky (~56) + folga: onde o topo dos resultados fica visível. */
const OFFSET_TOPO_RESULTADOS = 128;
/** Arrasto horizontal maior que isso nos chips não é toque. */
const SLOP_ARRASTO_PX = 8;

/** Posição salva ao sair para um produto, para o "voltar" devolver ao mesmo ponto. */
interface ScrollSalvo {
  y: number;
  visible: number;
}

function lerScroll(chave: string): ScrollSalvo | null {
  try {
    const raw = sessionStorage.getItem(chave);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<ScrollSalvo>;
    return typeof v.y === 'number' && typeof v.visible === 'number'
      ? { y: v.y, visible: v.visible }
      : null;
  } catch {
    return null;
  }
}

function gravarScroll(chave: string, dados: ScrollSalvo) {
  try {
    sessionStorage.setItem(chave, JSON.stringify(dados));
  } catch {
    // Storage bloqueado (janela anônima, cota): o voltar cai no topo, como antes.
  }
}

export default function Loja() {
  const {
    filters,
    excluded,
    selection,
    removeItem,
    restoreItem,
    clearExcluded,
    setQuery,
    toggle,
    setSort,
    clearAll,
    activeChips,
    activeCount,
  } = useShopFilters();

  const location = useLocation();
  const navType = useNavigationType();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [curando, setCurando] = useState(false);
  const [copiado, setCopiado] = useState<'ok' | 'erro' | null>(null);

  // Voltar de um produto (POP) devolve o usuário ao mesmo ponto da lista, com
  // os mesmos lotes carregados. Lido UMA vez, no inicializador: é decisão de
  // montagem, não de render.
  const chaveScroll = `${SCROLL_KEY_PREFIX}${location.pathname}${location.search}`;
  const [restauro] = useState(() => (navType === 'POP' ? lerScroll(chaveScroll) : null));

  // A paginação só cresce dentro da sessão da página. Antes ela voltava a 60 a
  // cada troca de filtro: o documento encolhia milhares de px e o navegador
  // reancorava a rolagem — "troquei um filtro e caí em outro lugar". Os cards
  // já estão no DOM e o content-visibility cobre o custo de pintar.
  const [visible, setVisible] = useState(() => Math.max(PAGE_SIZE, restauro?.visible ?? 0));
  const searchRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const chaveAoAbrir = useRef('');
  const rolarAoTopoDosResultados = useRef(false);
  const timerBusca = useRef<number | undefined>(undefined);
  const pointerX = useRef(0);

  // Uma seleção congelada (?sel=) manda em tudo: é exatamente a lista que foi
  // enviada ao cliente, na ordem em que foi montada. Filtros não se aplicam —
  // se aplicassem, o link deixaria de ser o que o vendedor aprovou.
  const emSelecao = selection.length > 0;

  // Catálogo do banco (produtos ⨝ erp_produtos). Começa no estático e troca
  // quando o JSON chega — ver src/lib/shop/store.ts.
  const SHOP_ITEMS = useShopCatalog();

  const results = useMemo(() => {
    if (emSelecao) {
      return selection.map((slug) => getShopItem(slug)).filter((i): i is ShopItem => Boolean(i));
    }
    const base = applyFilters(SHOP_ITEMS, filters);
    return excluded.length ? base.filter((i) => !excluded.includes(i.slug)) : base;
  }, [emSelecao, selection, filters, excluded, SHOP_ITEMS]);

  const facets = useMemo(() => computeFacets(SHOP_ITEMS, filters), [filters, SHOP_ITEMS]);
  const filtering = hasActiveFilters(filters);

  // Itens removidos que ainda pertencem ao filtro atual — são os que dá para
  // devolver. Um item que saiu do filtro por outro motivo não deve reaparecer.
  const removidosVisiveis = useMemo(() => {
    if (emSelecao || !excluded.length) return [];
    const noFiltro = new Set(applyFilters(SHOP_ITEMS, filters).map((i) => i.slug));
    return excluded
      .filter((slug) => noFiltro.has(slug))
      .map((slug) => getShopItem(slug))
      .filter((i): i is ShopItem => Boolean(i));
  }, [emSelecao, excluded, filters, SHOP_ITEMS]);

  const copiarSelecao = async () => {
    const slugs = results.map((i) => i.slug);
    const url = `${window.location.origin}/loja?${PARAM_SEL}=${slugs.join(',')}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiado('ok');
    } catch {
      setCopiado('erro');
    }
    setTimeout(() => setCopiado(null), 2600);
  };

  const chaveFiltros = JSON.stringify(filters);

  const abrirSheet = () => {
    chaveAoAbrir.current = chaveFiltros;
    setSheetOpen(true);
  };
  const fecharSheet = () => {
    // Filtros mudaram com o painel aberto: "VER N PRODUTOS" pede o início da
    // lista, não o ponto em que o usuário estava numa lista que já não existe.
    if (chaveAoAbrir.current !== chaveFiltros) rolarAoTopoDosResultados.current = true;
    setSheetOpen(false);
  };

  // Roda no mesmo flush em que a trava do painel devolve o scroll antigo —
  // cleanups do filho antes dos efeitos do pai — então este scrollTo é o que
  // fica. Nenhum setState aqui.
  useEffect(() => {
    if (sheetOpen || !rolarAoTopoDosResultados.current) return;
    rolarAoTopoDosResultados.current = false;
    const topo =
      (mainRef.current?.getBoundingClientRect().top ?? 0) + window.scrollY - OFFSET_TOPO_RESULTADOS;
    window.scrollTo(0, Math.max(0, topo));
  }, [sheetOpen]);

  // Busca com pausa: cada tecla reescrevia a URL, re-filtrava 505 itens e
  // recalculava todas as facetas — com o teclado aberto num Android
  // intermediário isso derrubava quadros e enfileirava toques. O input é
  // controlado localmente e a URL só muda depois da pausa.
  const [texto, setTexto] = useState(filters.q);
  const [ultimoCommit, setUltimoCommit] = useState(filters.q);
  const [qSync, setQSync] = useState(filters.q);
  if (qSync !== filters.q) {
    // A URL mudou por fora (✕ do chip, LIMPAR TUDO, voltar): o input segue. Se
    // foi o nosso próprio commit chegando, não sobrescreve o que o usuário já
    // digitou depois dele.
    setQSync(filters.q);
    if (filters.q !== ultimoCommit) setTexto(filters.q);
  }
  const digitar = (v: string) => {
    setTexto(v);
    window.clearTimeout(timerBusca.current);
    timerBusca.current = window.setTimeout(() => {
      setUltimoCommit(v);
      setQuery(v);
    }, DEBOUNCE_BUSCA_MS);
  };
  const limparBusca = () => {
    window.clearTimeout(timerBusca.current);
    setTexto('');
    setUltimoCommit('');
    setQuery('');
  };
  useEffect(() => () => window.clearTimeout(timerBusca.current), []);

  // Restauração de posição ao voltar de um produto. useLayoutEffect roda antes
  // do efeito passivo do ScrollToTop; como ele pula em POP quando há posição
  // salva, o scrollTo daqui é o que fica.
  useLayoutEffect(() => {
    if (restauro) window.scrollTo(0, restauro.y);
  }, [restauro]);

  // Revelação progressiva. rootMargin generoso para o lote seguinte já estar
  // pronto quando o usuário chegar nele.
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || visible >= results.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible((v) => Math.min(v + PAGE_SIZE, results.length));
        }
      },
      { rootMargin: '900px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible, results.length]);

  // Atalho "/" foca a busca, igual aos catálogos existentes.
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

  const shown = results.slice(0, visible);
  // Uma requisição de preço por página de cards, não uma por card.
  usePrecosLote(shown.map((i) => i.slug));

  const schema = useMemo(
    () =>
      JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Loja NZ — catálogo completo',
        description:
          'Catálogo completo da NZ Group: envelopamento automotivo, vinil decorativo, comunicação visual e PPF.',
        url: `${SITE_URL}/loja`,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: SHOP_ITEMS.length,
          // Limitado para não inflar o HTML da página com 505 entradas.
          itemListElement: SHOP_ITEMS.slice(0, 100).map((item, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `${SITE_URL}/loja/${item.slug}`,
            name: item.name,
          })),
        },
      }),
    [SHOP_ITEMS]
  );

  // Higiene de indexação: uma faceta é intenção legítima de busca
  // (/loja?cor=azul); duas ou mais, ou qualquer texto, é combinação infinita.
  const noindex = activeCount >= 2 || filters.q.trim().length > 0;

  return (
    <div className={styles.page}>
      <SEO
        title="Loja — Catálogo Completo"
        description="Todo o portfólio NZ num só lugar: cores de envelopamento, padrões decorativos, vinil de comunicação visual e linhas PPF. Filtre por cor, acabamento e marca."
        keywords="loja nz, catalogo vinil, cores envelopamento, adesivo decorativo, comunicacao visual"
        canonicalUrl="/loja"
        schema={schema}
        noindex={noindex}
      />

      {!emSelecao && (
      <header className={styles.hero}>
        <div className="container">
          <div className={styles.breadcrumb}>
            <Link to="/">NZ GROUP</Link>
            <span className={styles.breadcrumbSep}>·</span>
            <span className={styles.breadcrumbCurrent}>LOJA</span>
          </div>
          {/* Continua sendo o h1 da página: o texto que o Google lê vem do
              alt, não do conteúdo do elemento. */}
          <h1 className={styles.heroTitle}>
            <img
              src="/assets/logos/logo-nzstore-branco.png"
              alt="NZSTORE — Loja NZ"
              className={styles.heroLogo}
              width={836}
              height={126}
            />
          </h1>
          <p className={styles.heroSubtitle}>
            Todo o portfólio num só lugar — cores, padrões e linhas técnicas. Valores sob consulta.
          </p>
          <div className={styles.heroCounter}>
            <span className={styles.counterNumber}>{SHOP_ITEMS.length}</span>
            <span className={styles.counterLabel}>PRODUTOS</span>
            <span className={styles.counterDivider} />
            <span className={styles.counterNumber}>{facets.brands.length}</span>
            <span className={styles.counterLabel}>MARCAS</span>
            <span className={styles.counterDivider} />
            <span className={styles.counterNumber}>{facets.verticals.length}</span>
            <span className={styles.counterLabel}>LINHAS</span>
          </div>
        </div>
      </header>
      )}

      {emSelecao && (
        <div className={`container ${styles.selecaoBanner}`}>
          <div>
            <span className={styles.selecaoTitulo}>Seleção da NZ para você</span>
            <p className={styles.selecaoTexto}>
              {results.length} {results.length === 1 ? 'produto escolhido' : 'produtos escolhidos'} pela
              nossa equipe. Valores sob consulta.
            </p>
          </div>
          <Link to="/loja" className={styles.selecaoVerTudo}>
            VER O CATÁLOGO COMPLETO →
          </Link>
        </div>
      )}

      {!emSelecao && (
      <div className={styles.searchBar}>
        <div className={`container ${styles.searchInner}`}>
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
              placeholder="Busque por cor, acabamento, marca ou código…"
              value={texto}
              onChange={(e) => digitar(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  limparBusca();
                  e.currentTarget.blur();
                }
              }}
              aria-label="Buscar na loja"
            />
            {texto ? (
              <button
                type="button"
                className={styles.searchClear}
                onClick={limparBusca}
                aria-label="Limpar busca"
              >
                ✕
              </button>
            ) : (
              <kbd className={styles.searchKbd}>/</kbd>
            )}
          </div>

          <button
            type="button"
            className={styles.filterBtn}
            onClick={abrirSheet}
            aria-label="Abrir filtros"
          >
            FILTROS
            {activeCount > 0 && <span className={styles.filterBadge}>{activeCount}</span>}
          </button>

          <button
            type="button"
            className={`${styles.curarBtn} ${curando ? styles.curarBtnAtivo : ''} ${
              excluded.length > 0 ? styles.curarBtnAlerta : ''
            }`}
            onClick={() => setCurando((v) => !v)}
            aria-pressed={curando}
            title={
              excluded.length > 0
                ? `${excluded.length} item(ns) oculto(s) da lista`
                : 'Monte uma lista para enviar ao cliente'
            }
          >
            {curando ? 'CONCLUIR' : 'MONTAR SELEÇÃO'}
            {excluded.length > 0 && (
              <span className={styles.curarBadge}>{excluded.length}</span>
            )}
          </button>

          <label className={styles.sortWrap}>
            <span className="sr-only">Ordenar por</span>
            <select
              className={styles.sortSelect}
              value={filters.sort}
              onChange={(e) => setSort(e.target.value as SortMode)}
              aria-label="Ordenar por"
            >
              {(Object.keys(SORT_LABEL) as SortMode[]).map((s) => (
                <option key={s} value={s}>
                  {SORT_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      )}

      <div className={`container ${styles.shell} ${emSelecao ? styles.shellSemSidebar : ''}`}>
        {!emSelecao && (
        <ShopFilters
          facets={facets}
          filters={filters}
          mode="sidebar"
          resultCount={results.length}
          activeCount={activeCount}
          onToggle={toggle}
          onClearAll={clearAll}
        />
        )}

        <main className={styles.main} ref={mainRef}>
          {!emSelecao && activeChips.length > 0 && (
            <div className={styles.chipsRow}>
              {/* A fila rola na horizontal. Um arrasto menor que o "slop" do
                  navegador era entregue como clique e removia o filtro sob o
                  dedo; agora o clique só vale se o ponteiro ficou parado. */}
              <div
                className={styles.chips}
                onPointerDown={(e) => {
                  pointerX.current = e.clientX;
                }}
                onClickCapture={(e) => {
                  // detail 0 = teclado: passa direto.
                  if (e.detail !== 0 && Math.abs(e.clientX - pointerX.current) > SLOP_ARRASTO_PX) {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
              >
                {activeChips.map((chip) => (
                  <button
                    key={`${chip.group}-${chip.id}`}
                    type="button"
                    className={styles.chip}
                    onClick={() =>
                      chip.group === 'q' ? limparBusca() : toggle(chip.group as FilterGroup, chip.id)
                    }
                  >
                    {chip.label}
                    <span className={styles.chipX} aria-hidden="true">
                      ✕
                    </span>
                  </button>
                ))}
              </div>
              {/* Fora do scroller: no fim da fila, arrastar até o final e soltar
                  limpava tudo. */}
              {activeChips.length > 1 && (
                <button type="button" className={styles.chipClearAll} onClick={clearAll}>
                  LIMPAR TUDO
                </button>
              )}
            </div>
          )}

          {!emSelecao && excluded.length > 0 && (
            <div className={styles.alertaOcultos} role="alert">
              <span className={styles.alertaIcone} aria-hidden="true">
                ⚠
              </span>
              <span className={styles.alertaTexto}>
                <strong>
                  {excluded.length} {excluded.length === 1 ? 'item está oculto' : 'itens estão ocultos'}
                </strong>{' '}
                desta lista. Quem receber o link não {excluded.length === 1 ? 'o' : 'os'} verá.
              </span>
              <button type="button" className={styles.alertaAcao} onClick={clearExcluded}>
                MOSTRAR TODOS
              </button>
            </div>
          )}

          {curando && !emSelecao && (
            <div className={styles.curadoria}>
              <div className={styles.curadoriaInfo}>
                <strong>{results.length}</strong> {results.length === 1 ? 'item' : 'itens'} na seleção
                {' · '}toque no × para tirar
              </div>

              <div className={styles.curadoriaAcoes}>
                {results.length > MAX_SELECAO ? (
                  <span className={styles.curadoriaAviso}>
                    Reduza para {MAX_SELECAO} itens ou menos para gerar o link.
                  </span>
                ) : (
                  <button
                    type="button"
                    className={styles.curadoriaCopiar}
                    onClick={copiarSelecao}
                    disabled={results.length === 0}
                  >
                    {copiado === 'ok'
                      ? 'LINK COPIADO ✓'
                      : copiado === 'erro'
                        ? 'NÃO CONSEGUI COPIAR'
                        : `COPIAR LINK DA SELEÇÃO (${results.length})`}
                  </button>
                )}
              </div>
            </div>
          )}

          {curando && removidosVisiveis.length > 0 && (
            <div className={styles.removidos}>
              <span className={styles.removidosTitulo}>Fora da seleção:</span>
              {removidosVisiveis.map((i) => (
                <button
                  key={i.slug}
                  type="button"
                  className={styles.removidoChip}
                  onClick={() => restoreItem(i.slug)}
                  title="Devolver à seleção"
                >
                  {i.name}
                  <span aria-hidden="true">＋</span>
                </button>
              ))}
            </div>
          )}

          <p className={styles.resultCount} role="status" aria-live="polite">
            {emSelecao ? (
              <>
                <strong>{results.length}</strong>{' '}
                {results.length === 1 ? 'produto nesta seleção' : 'produtos nesta seleção'}
              </>
            ) : filtering || excluded.length > 0 ? (
              <>
                <strong>{results.length}</strong>{' '}
                {results.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
                {excluded.length > 0 && (
                  <span className={styles.resultOcultos}> · {excluded.length} oculto{excluded.length === 1 ? '' : 's'}</span>
                )}
              </>
            ) : (
              <>
                <strong>{SHOP_ITEMS.length}</strong> produtos no catálogo
              </>
            )}
          </p>

          {results.length > 0 ? (
            <>
              {/* Ao sair para um produto, guarda onde estava e quantos lotes
                  já tinha. Sobrescrita a cada clique e lida só em POP — não
                  precisa apagar. */}
              <div
                className={styles.grid}
                onClickCapture={() => gravarScroll(chaveScroll, { y: window.scrollY, visible })}
              >
                {shown.map((item, i) => (
                  <ShopCard
                    key={item.slug}
                    item={item}
                    eager={i < EAGER_COUNT}
                    onRemove={curando && !emSelecao ? removeItem : undefined}
                    from={`${location.pathname}${location.search}`}
                  />
                ))}
              </div>

              {visible < results.length && (
                <div ref={sentinelRef} className={styles.loadMoreWrap}>
                  <button
                    type="button"
                    className={styles.loadMore}
                    onClick={() => setVisible((v) => Math.min(v + PAGE_SIZE, results.length))}
                  >
                    CARREGAR MAIS ({results.length - visible} restantes)
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>
                Nenhum produto encontrado{filters.q ? ` para “${filters.q}”` : ' com esses filtros'}.
              </p>
              <p className={styles.emptyHint}>
                Tente uma cor ("azul fosco"), uma marca ("metamark") ou um código. Se não achar,
                fale com a gente — temos acesso ao portfólio completo dos nossos fornecedores.
              </p>
              <div className={styles.emptyActions}>
                <button type="button" className={styles.emptyClear} onClick={clearAll}>
                  LIMPAR FILTROS
                </button>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.emptyWhats}
                >
                  FALAR COM A NZ →
                </a>
              </div>
            </div>
          )}
        </main>
      </div>

      {!emSelecao && (
      <ShopFilters
        facets={facets}
        filters={filters}
        mode="sheet"
        resultCount={results.length}
        activeCount={activeCount}
        onToggle={toggle}
        onClearAll={clearAll}
        open={sheetOpen}
        onClose={fecharSheet}
      />
      )}
    </div>
  );
}
