import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import SEO from '../../components/SEO/SEO';
import { SITE_URL } from '../../lib/siteConfig';
import { staggerContainer, fadeUpItem } from './variants';
import {
  imprimaxFamilies,
  imprimaxProducts,
  IMPRIMAX_HERO_BADGES,
  type ImprimaxFamilySlug,
} from './imprimaxProducts';
// Mesmo layout do catálogo Etherna: reaproveita o CSS em vez de duplicá-lo.
import styles from './EthernaCatalog.module.css';
import extras from './ImprimaxExtras.module.css';
import { DECOR, linkWhatsApp } from '../../lib/contatos';

const WHATSAPP_URL = linkWhatsApp(DECOR, 'Olá, estou vendo o catálogo Imprimax DecorMax no site da NZDecor e quero um orçamento.');

// Mosaico do hero: texturas intercaladas por família, como na Etherna.
const heroMosaicTextures = (() => {
  const byFamily = new Map<string, string[]>();
  for (const p of imprimaxProducts) {
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

export default function ImprimaxCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);

  const familiaParam = searchParams.get('familia');
  const activeFamily = imprimaxFamilies.find((f) => f.slug === familiaParam) ?? null;
  const query = searchParams.get('q') ?? '';
  const nq = normalize(query);

  const familyName = (slug: ImprimaxFamilySlug) =>
    imprimaxFamilies.find((f) => f.slug === slug)?.name ?? slug;

  const visibleProducts = imprimaxProducts.filter((p) => {
    if (activeFamily && p.family !== activeFamily.slug) return false;
    if (!nq) return true;
    return (
      normalize(p.name).includes(nq) ||
      normalize(p.code).includes(nq) ||
      normalize(p.collection).includes(nq) ||
      normalize(familyName(p.family)).includes(nq)
    );
  });

  const familyCount = (slug: ImprimaxFamilySlug) =>
    imprimaxProducts.filter((p) => p.family === slug).length;

  const updateParams = (familia: string | null, q: string) => {
    const params: Record<string, string> = {};
    if (familia) params.familia = familia;
    if (q) params.q = q;
    setSearchParams(params, { replace: true });
  };

  const setFamily = (slug: ImprimaxFamilySlug | null) => updateParams(slug, query);
  const setQuery = (q: string) => updateParams(activeFamily?.slug ?? null, q);

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
    name: 'Catálogo Imprimax DecorMax — Vinil Adesivo Decorativo',
    description:
      'Catálogo dos padrões Imprimax DecorMax distribuídos pela NZDecor. Indústria nacional, antimofo e antibacteriano.',
    url: `${SITE_URL}/decor/imprimax`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: imprimaxProducts.length,
      itemListElement: imprimaxProducts.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE_URL}/decor/imprimax/${p.slug}`,
        name: p.name,
      })),
    },
  });

  return (
    <div className={styles.page}>
      <SEO
        title="Catálogo Imprimax DecorMax — Vinil Adesivo Decorativo | NZDECOR"
        description="Todos os padrões Imprimax DecorMax: madeiras, mármores, pedras, fórmicas, tecidos, couros e piso vinílico. Indústria nacional, antimofo e antibacteriano, rolo 1,22 × 25 m. Distribuição NZDecor."
        keywords="imprimax decormax, vinil adesivo imprimax, adesivo madeira imprimax, adesivo marmore imprimax, decormax gold, imprimax nz"
        canonicalUrl="/decor/imprimax"
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
              <span className={styles.breadcrumbCurrent}>IMPRIMAX DECORMAX</span>
            </motion.div>

            <motion.img
              src="/assets/logos/nzdecor/logo-imprimax-branco.webp"
              alt="Imprimax"
              className={`${styles.heroLogo} ${extras.heroLogo}`}
              variants={fadeUpItem}
            />

            <motion.h1 className={styles.heroTitle} variants={fadeUpItem}>
              DecorMax · Catálogo de Padrões
            </motion.h1>

            <motion.p className={styles.heroSubtitle} variants={fadeUpItem}>
              Vinil adesivo decorativo de indústria nacional: madeiras, mármores, fórmicas e tecidos com
              textura realista. Distribuição e consultoria técnica NZDecor.
            </motion.p>

            <motion.div className={styles.heroBadges} variants={fadeUpItem}>
              {IMPRIMAX_HERO_BADGES.map((b) => (
                <span key={b} className={styles.heroBadge}>
                  {b}
                </span>
              ))}
            </motion.div>

            <motion.div className={styles.heroCounter} variants={fadeUpItem}>
              <span className={styles.counterNumber}>{imprimaxProducts.length}</span>
              <span className={styles.counterLabel}>PADRÕES</span>
              <span className={styles.counterDivider} />
              <span className={styles.counterNumber}>
                {imprimaxFamilies.filter((f) => familyCount(f.slug) > 0).length}
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
                TODOS <span className={styles.pillCount}>{imprimaxProducts.length}</span>
              </button>
              {imprimaxFamilies.map(
                (f) =>
                  familyCount(f.slug) > 0 && (
                    <button
                      key={f.slug}
                      type="button"
                      className={`${styles.familyPill} ${activeFamily?.slug === f.slug ? styles.familyPillActive : ''}`}
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
            <>
              <p className={styles.familyDescription}>{activeFamily.description}</p>
              {/* Ambientes da FAMÍLIA: ficam aqui, nunca na galeria de um padrão. */}
              {activeFamily.ambient.length > 0 && (
                <div className={extras.familyAmbient}>
                  {activeFamily.ambient.slice(0, 4).map((src) => (
                    <img key={src} src={src} alt={`Ambiente com vinil Imprimax da família ${activeFamily.name}`} loading="lazy" />
                  ))}
                </div>
              )}
            </>
          )}

          <div className={styles.productGrid} key={activeFamily?.slug ?? 'todos'}>
            {visibleProducts.map((p) => (
              <Link key={p.slug} to={`/decor/imprimax/${p.slug}`} className={styles.productCard}>
                <div className={styles.productImageWrap}>
                  <img
                    src={p.images.texture}
                    alt={`Padrão ${p.name} — vinil adesivo Imprimax DecorMax`}
                    className={`${styles.productImage} ${extras.capaTopo}`}
                    loading="lazy"
                  />
                  <span className={styles.productHoverCta}>VER PADRÃO →</span>
                </div>
                <div className={styles.productInfo}>
                  <span className={styles.productFamily}>{p.collection.toUpperCase()}</span>
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
                completo da Imprimax.
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
            Nossa equipe indica o padrão certo, envia amostras e fecha a especificação técnica com
            você. Preço na loja para clientes com cadastro aprovado.
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
