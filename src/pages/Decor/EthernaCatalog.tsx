import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import SEO from '../../components/SEO/SEO';
import { SITE_URL } from '../../lib/siteConfig';
import { staggerContainer, fadeUpItem } from './variants';
import {
  ethernaFamilies,
  ethernaProducts,
  ETHERNA_HERO_BADGES,
  type EthernaFamilySlug,
} from './ethernaProducts';
import styles from './EthernaCatalog.module.css';

const WHATSAPP_URL =
  'https://wa.me/5511920707565?text=Ol%C3%A1%2C%20estou%20vendo%20o%20cat%C3%A1logo%20Etherna%20Decor%20no%20site%20da%20NZDecor%20e%20quero%20um%20or%C3%A7amento.';

// Mosaico do hero: cards oficiais do catálogo, intercalados por família.
// São os mesmos arquivos do grid — o navegador reaproveita o download.
const heroMosaicTextures = (() => {
  const byFamily = new Map<string, string[]>();
  for (const p of ethernaProducts) {
    const list = byFamily.get(p.family) ?? [];
    list.push(p.images.texture);
    byFamily.set(p.family, list);
  }
  const pools = [...byFamily.values()];
  const picks: string[] = [];
  for (let round = 0; picks.length < 12 && round < 6; round++) {
    for (const pool of pools) {
      if (pool[round] && picks.length < 12) picks.push(pool[round]);
    }
  }
  return picks;
})();

// busca sem acentos/caixa: "formica" encontra "Fórmica"
const normalize = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export default function EthernaCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);

  const familiaParam = searchParams.get('familia');
  const activeFamily = ethernaFamilies.find((f) => f.slug === familiaParam)?.slug ?? null;
  const query = searchParams.get('q') ?? '';
  const nq = normalize(query);

  const familyName = (slug: EthernaFamilySlug) =>
    ethernaFamilies.find((f) => f.slug === slug)?.name ?? slug;

  const visibleProducts = ethernaProducts.filter((p) => {
    if (activeFamily && p.family !== activeFamily) return false;
    if (!nq) return true;
    return (
      normalize(p.name).includes(nq) ||
      normalize(p.code).includes(nq) ||
      normalize(p.collection).includes(nq) ||
      normalize(familyName(p.family)).includes(nq)
    );
  });

  const familyCount = (slug: EthernaFamilySlug) =>
    ethernaProducts.filter((p) => p.family === slug).length;

  const updateParams = (familia: string | null, q: string) => {
    const params: Record<string, string> = {};
    if (familia) params.familia = familia;
    if (q) params.q = q;
    setSearchParams(params, { replace: true });
  };

  const setFamily = (slug: EthernaFamilySlug | null) => updateParams(slug, query);
  const setQuery = (q: string) => updateParams(activeFamily, q);

  // atalho "/" foca a busca em qualquer ponto da página
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

  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Catálogo Etherna Decor — Vinil Adesivo Decorativo',
    description:
      'Catálogo completo dos padrões Etherna Decor distribuídos pela NZDecor. Indústria nacional com tecnologia Shield®.',
    url: `${SITE_URL}/decor/etherna`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: ethernaProducts.length,
      itemListElement: ethernaProducts.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE_URL}/decor/etherna/${p.slug}`,
        name: p.name,
      })),
    },
  });

  return (
    <div className={styles.page}>
      <SEO
        title="Catálogo Etherna Decor — Vinil Adesivo Decorativo | NZDECOR"
        description="Todos os padrões Etherna Decor: madeiras, marmorizados, fórmicas, pedras, metais, tecidos e geométricos. Indústria nacional, Sistema Shield®, entrega rápida. Orçamento via NZDecor."
        keywords="catalogo etherna decor, vinil adesivo etherna, adesivo madeira etherna, adesivo marmore, etherna decor nz"
        canonicalUrl="/decor/etherna"
        schema={schema}
      />

      {/* HERO COMPACTO */}
      <header className={styles.hero}>
        <div className={styles.heroMosaic} aria-hidden="true">
          {heroMosaicTextures.map((src) => (
            <img key={src} src={src} alt="" />
          ))}
        </div>
        <div className={styles.heroOverlay} aria-hidden="true"></div>
        <div className={`container ${styles.heroContainer}`}>
          <motion.div initial="hidden" animate="show" variants={staggerContainer}>
            <motion.div className={styles.breadcrumb} variants={fadeUpItem}>
              <Link to="/decor">NZDECOR</Link>
              <span className={styles.breadcrumbSep}>·</span>
              <span className={styles.breadcrumbCurrent}>ETHERNA DECOR</span>
            </motion.div>

            <motion.img
              src="/assets/logos/nzdecor/logo-etherna.webp"
              alt="Etherna Decor"
              className={styles.heroLogo}
              variants={fadeUpItem}
            />

            <motion.h1 className={styles.heroTitle} variants={fadeUpItem}>
              Catálogo de Padrões
            </motion.h1>

            <motion.p className={styles.heroSubtitle} variants={fadeUpItem}>
              Vinil adesivo decorativo de indústria nacional com tecnologia Shield®.
              Distribuição e consultoria técnica NZDecor — valores sob consulta.
            </motion.p>

            <motion.div className={styles.heroBadges} variants={fadeUpItem}>
              {ETHERNA_HERO_BADGES.map((b) => (
                <span key={b} className={styles.heroBadge}>
                  {b}
                </span>
              ))}
            </motion.div>

            <motion.div className={styles.heroCounter} variants={fadeUpItem}>
              <span className={styles.counterNumber}>{ethernaProducts.length}</span>
              <span className={styles.counterLabel}>PADRÕES</span>
              <span className={styles.counterDivider} />
              <span className={styles.counterNumber}>
                {ethernaFamilies.filter((f) => familyCount(f.slug) > 0).length}
              </span>
              <span className={styles.counterLabel}>FAMÍLIAS</span>
            </motion.div>
          </motion.div>
        </div>
      </header>

      {/* FILTRO + GRID */}
      <section className={styles.catalogSection}>
        <div className={`container ${styles.catalogContainer}`}>
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
                placeholder="Buscar padrão, código ou família…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setQuery('');
                    e.currentTarget.blur();
                  }
                }}
                aria-label="Buscar padrão"
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

            <div className={styles.familyFilter}>
              <button
                type="button"
                className={`${styles.familyPill} ${!activeFamily ? styles.familyPillActive : ''}`}
                onClick={() => setFamily(null)}
              >
                TODOS <span className={styles.pillCount}>{ethernaProducts.length}</span>
              </button>
              {ethernaFamilies.map(
                (f) =>
                  familyCount(f.slug) > 0 && (
                    <button
                      key={f.slug}
                      type="button"
                      className={`${styles.familyPill} ${activeFamily === f.slug ? styles.familyPillActive : ''}`}
                      onClick={() => setFamily(f.slug)}
                    >
                      {f.name.toUpperCase()} <span className={styles.pillCount}>{familyCount(f.slug)}</span>
                    </button>
                  )
              )}
            </div>
          </div>

          {query && (
            <p className={styles.searchMeta}>
              {visibleProducts.length}{' '}
              {visibleProducts.length === 1 ? 'padrão encontrado' : 'padrões encontrados'} para
              “{query}”
            </p>
          )}

          {activeFamily && (
            <p className={styles.familyDescription}>
              {ethernaFamilies.find((f) => f.slug === activeFamily)?.description}
            </p>
          )}

          <div className={styles.productGrid} key={activeFamily ?? 'todos'}>
            {visibleProducts.map((p) => (
              <Link key={p.slug} to={`/decor/etherna/${p.slug}`} className={styles.productCard}>
                <div className={styles.productImageWrap}>
                  <img
                    src={p.images.texture}
                    alt={`Padrão ${p.name} — vinil adesivo Etherna Decor`}
                    className={styles.productImage}
                    loading="lazy"
                  />
                  {p.code && <span className={styles.productCodeChip}>{p.code}</span>}
                  <span className={styles.productHoverCta}>VER PADRÃO →</span>
                </div>
                <div className={styles.productInfo}>
                  <span className={styles.productFamily}>
                    {ethernaFamilies.find((f) => f.slug === p.family)?.name.toUpperCase()}
                  </span>
                  <h3 className={styles.productName}>{p.name}</h3>
                  {p.code && <span className={styles.productCode}>CÓD. {p.code}</span>}
                </div>
              </Link>
            ))}
          </div>

          {visibleProducts.length === 0 && (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>
                Nenhum padrão encontrado{query ? ` para “${query}”` : ' nesta família'}.
              </p>
              <p className={styles.emptyHint}>
                Tente outro nome ou código — ou fale com a gente: temos acesso ao portfólio
                completo da Etherna Decor.
              </p>
              <div className={styles.emptyActions}>
                {query && (
                  <button type="button" className={styles.emptyClear} onClick={() => setQuery('')}>
                    LIMPAR BUSCA
                  </button>
                )}
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.emptyWhats}>
                  FALAR COM A NZDECOR →
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className={styles.ctaSection}>
        <motion.div
          className={`container ${styles.ctaContainer}`}
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.h2 className={styles.ctaTitle} variants={fadeUpItem}>
            NÃO ACHOU O PADRÃO DO SEU PROJETO?
          </motion.h2>
          <motion.p className={styles.ctaSubtitle} variants={fadeUpItem}>
            Nossa equipe indica o padrão certo, envia amostras físicas e fecha a especificação
            técnica com você. Fábrica em SP, entrega rápida. Valores sob consulta.
          </motion.p>
          <motion.div className={styles.ctaButtons} variants={fadeUpItem}>
            <a href={WHATSAPP_URL} className={styles.ctaPrimary} target="_blank" rel="noopener noreferrer">
              FALAR COM A NZDECOR
            </a>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
