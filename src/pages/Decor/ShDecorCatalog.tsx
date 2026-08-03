import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import SEO from '../../components/SEO/SEO';
import { staggerContainer, fadeUpItem } from './variants';
import {
  shDecorFamilies,
  shDecorProducts,
  SH_DEFAULT_BADGES,
  type ShDecorFamilySlug,
} from './shDecorProducts';
import styles from './ShDecorCatalog.module.css';

const WHATSAPP_URL =
  'https://wa.me/5511920707565?text=Ol%C3%A1%2C%20estou%20vendo%20o%20cat%C3%A1logo%20SH%20Decor%20no%20site%20da%20NZDecor%20e%20quero%20um%20or%C3%A7amento.';

// Mosaico do hero: texturas reais do catálogo, intercaladas por família.
// São os mesmos arquivos do grid — o navegador reaproveita o download.
const heroMosaicTextures = (() => {
  const byFamily = new Map<string, string[]>();
  for (const p of shDecorProducts) {
    const list = byFamily.get(p.family) ?? [];
    list.push(p.images.texture);
    byFamily.set(p.family, list);
  }
  const pools = [...byFamily.values()];
  const picks: string[] = [];
  for (let round = 0; picks.length < 18 && round < 6; round++) {
    for (const pool of pools) {
      if (pool[round] && picks.length < 18) picks.push(pool[round]);
    }
  }
  return picks;
})();

export default function ShDecorCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const familiaParam = searchParams.get('familia');
  const activeFamily = shDecorFamilies.find((f) => f.slug === familiaParam)?.slug ?? null;

  const visibleProducts = activeFamily
    ? shDecorProducts.filter((p) => p.family === activeFamily)
    : shDecorProducts;

  const familyCount = (slug: ShDecorFamilySlug) =>
    shDecorProducts.filter((p) => p.family === slug).length;

  const setFamily = (slug: ShDecorFamilySlug | null) => {
    if (slug) setSearchParams({ familia: slug });
    else setSearchParams({});
  };

  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Catálogo SH Decor — Vinil Decorativo',
    description:
      'Catálogo completo de revestimentos de vinil autoadesivo SH Decor distribuídos pela NZDecor.',
    url: 'https://agencianz.com/decor/sh',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: shDecorProducts.length,
      itemListElement: shDecorProducts.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `https://agencianz.com/decor/sh/${p.slug}`,
        name: p.name,
      })),
    },
  });

  return (
    <div className={styles.page}>
      <SEO
        title="Catálogo SH Decor — Vinil Decorativo | NZDECOR"
        description="Todos os padrões SH Decor: madeira, pedra, cimento, couro, tecido, sólido, piso e tijolo. Vinil autoadesivo atóxico, lavável, Bubble Free. Orçamento via NZDecor."
        keywords="catalogo sh decor, vinil decorativo, revestimento adesivo madeira, adesivo pedra, sh decor nz"
        canonicalUrl="/decor/sh"
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
              <span className={styles.breadcrumbCurrent}>SH DECOR</span>
            </motion.div>

            <motion.img
              src="/assets/logos/nzdecor/logo-sh-decor-branco.svg"
              alt="SH Decor"
              className={styles.heroLogo}
              variants={fadeUpItem}
            />

            <motion.h1 className={styles.heroTitle} variants={fadeUpItem}>
              Catálogo de Padrões
            </motion.h1>

            <motion.p className={styles.heroSubtitle} variants={fadeUpItem}>
              Revestimento de vinil autoadesivo com realismo até no toque. Distribuição e
              consultoria técnica NZDecor — valores sob consulta.
            </motion.p>

            <motion.div className={styles.heroBadges} variants={fadeUpItem}>
              {[...SH_DEFAULT_BADGES, 'USO INTERNO'].map((b) => (
                <span key={b} className={styles.heroBadge}>
                  {b}
                </span>
              ))}
            </motion.div>

            <motion.div className={styles.heroCounter} variants={fadeUpItem}>
              <span className={styles.counterNumber}>{shDecorProducts.length}</span>
              <span className={styles.counterLabel}>PADRÕES</span>
              <span className={styles.counterDivider} />
              <span className={styles.counterNumber}>
                {shDecorFamilies.filter((f) => familyCount(f.slug) > 0).length}
              </span>
              <span className={styles.counterLabel}>FAMÍLIAS</span>
            </motion.div>
          </motion.div>
        </div>
      </header>

      {/* FILTRO + GRID */}
      <section className={styles.catalogSection}>
        <div className={`container ${styles.catalogContainer}`}>
          <div className={styles.familyFilter}>
            <button
              type="button"
              className={`${styles.familyPill} ${!activeFamily ? styles.familyPillActive : ''}`}
              onClick={() => setFamily(null)}
            >
              TODOS <span className={styles.pillCount}>{shDecorProducts.length}</span>
            </button>
            {shDecorFamilies.map(
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

          {activeFamily && (
            <p className={styles.familyDescription}>
              {shDecorFamilies.find((f) => f.slug === activeFamily)?.description}
            </p>
          )}

          <div className={styles.productGrid} key={activeFamily ?? 'todos'}>
            {visibleProducts.map((p) => (
              <Link key={p.slug} to={`/decor/sh/${p.slug}`} className={styles.productCard}>
                <div className={styles.productImageWrap}>
                  <img
                    src={p.images.texture}
                    alt={`Padrão ${p.name} — vinil SH Decor`}
                    className={styles.productImage}
                    loading="lazy"
                  />
                  <span className={styles.productCodeChip}>{p.code}</span>
                  <span className={styles.productHoverCta}>VER PADRÃO →</span>
                </div>
                <div className={styles.productInfo}>
                  <span className={styles.productFamily}>
                    {shDecorFamilies.find((f) => f.slug === p.family)?.name.toUpperCase()}
                  </span>
                  <h3 className={styles.productName}>{p.name}</h3>
                  <span className={styles.productCode}>{p.code}</span>
                </div>
              </Link>
            ))}
          </div>

          {visibleProducts.length === 0 && (
            <p className={styles.emptyState}>Nenhum padrão nesta família ainda.</p>
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
            técnica com você. Valores sob consulta.
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
