import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import SEO from '../../components/SEO/SEO';
import { staggerContainer, fadeUpItem, cardStagger } from './variants';
import {
  getEthernaProductBySlug,
  getEthernaFamilyBySlug,
  ethernaProducts,
} from './ethernaProducts';
import styles from './EthernaProduct.module.css';

const WHATSAPP_NUMBER = '5511920707565';

export default function EthernaProduct() {
  const { slug } = useParams<{ slug: string }>();
  const product = getEthernaProductBySlug(slug);

  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    setActiveIndex(0);
    setLightboxOpen(false);
  }, [slug]);

  const gallery = product ? [product.images.texture, ...product.images.ambient] : [];

  const nextImage = useCallback(
    () => setActiveIndex((i) => (i + 1) % gallery.length),
    [gallery.length]
  );
  const prevImage = useCallback(
    () => setActiveIndex((i) => (i - 1 + gallery.length) % gallery.length),
    [gallery.length]
  );

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, nextImage, prevImage]);

  if (!product) {
    return (
      <div className={styles.notFound}>
        <SEO
          title="Padrão não encontrado"
          description="O padrão Etherna Decor buscado não existe no catálogo NZDecor."
          canonicalUrl="/decor/etherna"
        />
        <div className="container">
          <h1>Padrão não encontrado</h1>
          <p>A página que você procura não existe ou foi movida.</p>
          <Link to="/decor/etherna" className={styles.backLink}>
            ← Voltar ao catálogo Etherna Decor
          </Link>
        </div>
      </div>
    );
  }

  const family = getEthernaFamilyBySlug(product.family);
  const badges = product.badges;

  const related = [
    ...ethernaProducts.filter((p) => p.family === product.family && p.slug !== product.slug),
    ...ethernaProducts.filter((p) => p.family !== product.family),
  ].slice(0, 4);

  const whatsappMsg = `Olá Daniela! Tenho interesse no padrão *${product.name}*${product.code ? ` (cód. ${product.code})` : ''} da linha Etherna Decor e gostaria de um orçamento.`;
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMsg)}`;

  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${product.name} — Vinil Adesivo Decorativo Etherna Decor`,
    sku: product.code || undefined,
    brand: { '@type': 'Brand', name: 'Etherna Decor' },
    category: `Revestimento Decorativo / ${family?.name ?? ''}`,
    description: product.description,
    image: gallery.map((g) => `https://agencianz.com${g}`),
    url: `https://agencianz.com/decor/etherna/${product.slug}`,
  });

  return (
    <div className={styles.page}>
      <SEO
        title={product.seo.title}
        description={product.seo.description}
        keywords={product.seo.keywords}
        canonicalUrl={`/decor/etherna/${product.slug}`}
        schema={schema}
        type="product"
        imageUrl={`https://agencianz.com${product.images.texture}`}
      />

      {/* BLOCO PRINCIPAL */}
      <section className={styles.mainSection}>
        <div className={styles.backdrop} aria-hidden="true">
          <AnimatePresence mode="wait">
            <motion.img
              key={activeIndex}
              src={gallery[activeIndex]}
              alt=""
              className={styles.backdropImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            />
          </AnimatePresence>
          <div className={styles.backdropOverlay}></div>
        </div>
        <motion.div
          className={`container ${styles.mainContainer}`}
          initial="hidden"
          animate="show"
          variants={staggerContainer}
        >
          <motion.div className={styles.breadcrumb} variants={fadeUpItem}>
            <Link to="/decor">NZDECOR</Link>
            <span className={styles.breadcrumbSep}>·</span>
            <Link to="/decor/etherna">ETHERNA DECOR</Link>
            <span className={styles.breadcrumbSep}>·</span>
            <span className={styles.breadcrumbCurrent}>{product.name}</span>
          </motion.div>

          <div className={styles.mainGrid}>
            {/* GALERIA */}
            <motion.div className={styles.gallery} variants={fadeUpItem}>
              <button
                type="button"
                className={styles.mainImageWrap}
                onClick={() => setLightboxOpen(true)}
                aria-label="Ampliar imagem"
              >
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeIndex}
                    src={gallery[activeIndex]}
                    alt={`${product.name} — imagem ${activeIndex + 1}`}
                    className={styles.mainImage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  />
                </AnimatePresence>
                <span className={styles.zoomHint}>⛶</span>
              </button>
              {gallery.length > 1 && (
                <div className={styles.thumbTrack}>
                  {gallery.map((img, i) => (
                    <button
                      key={img}
                      type="button"
                      className={`${styles.thumb} ${i === activeIndex ? styles.thumbActive : ''}`}
                      onClick={() => setActiveIndex(i)}
                      aria-label={`Imagem ${i + 1}`}
                    >
                      <img src={img} alt="" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* PAINEL DE INFO */}
            <motion.div className={styles.infoPanel} variants={fadeUpItem}>
              <span className={styles.familyTag}>{family?.name.toUpperCase()}</span>
              <h1 className={styles.productTitle}>{product.name}</h1>
              {product.code && <span className={styles.productCode}>CÓD. {product.code}</span>}

              <div className={styles.badges}>
                {badges.map((b) => (
                  <span key={b} className={styles.badge}>
                    {b}
                  </span>
                ))}
              </div>

              <p className={styles.description}>{product.description}</p>

              <a
                href={whatsappUrl}
                className={styles.ctaPrimary}
                target="_blank"
                rel="noopener noreferrer"
              >
                SOLICITAR ORÇAMENTO
              </a>
              <p className={styles.priceNote}>
                Valores sob consulta · atendimento direto NZDecor
              </p>

              <div className={styles.specsBlock}>
                <span className={styles.specsKicker}>FICHA TÉCNICA</span>
                <dl className={styles.specsList}>
                  {product.specs.map((spec) => (
                    <div key={spec.label} className={styles.specRow}>
                      <dt className={styles.specLabel}>{spec.label}</dt>
                      <dd className={styles.specValue}>{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* RELATED */}
      {related.length > 0 && (
        <section className={styles.relatedSection}>
          <motion.div
            className={`container ${styles.relatedContainer}`}
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
          >
            <motion.div className={styles.relatedHeader} variants={fadeUpItem}>
              <span className={styles.relatedKicker}>EXPLORE TAMBÉM</span>
              <h2 className={styles.relatedTitle}>
                Mais padrões {family ? `da família ${family.name}` : 'Etherna Decor'}
              </h2>
            </motion.div>
            <motion.div className={styles.relatedGrid} variants={cardStagger}>
              {related.map((rel) => (
                <motion.div key={rel.slug} variants={fadeUpItem}>
                  <Link to={`/decor/etherna/${rel.slug}`} className={styles.relatedCard}>
                    <div className={styles.relatedImageWrap}>
                      <img
                        src={rel.images.texture}
                        alt={`Padrão ${rel.name}`}
                        loading="lazy"
                      />
                    </div>
                    <div className={styles.relatedInfo}>
                      <h4 className={styles.relatedName}>{rel.name}</h4>
                      {rel.code && <span className={styles.relatedCode}>CÓD. {rel.code}</span>}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
            <motion.div className={styles.relatedFooter} variants={fadeUpItem}>
              <Link to="/decor/etherna" className={styles.backToCatalog}>
                ← Ver catálogo completo
              </Link>
            </motion.div>
          </motion.div>
        </section>
      )}

      {/* LIGHTBOX */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            className={styles.lightbox}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxOpen(false)}
            onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchStartX === null) return;
              const dx = e.changedTouches[0].clientX - touchStartX;
              if (dx < -50) nextImage();
              if (dx > 50) prevImage();
              setTouchStartX(null);
            }}
          >
            <button
              type="button"
              className={styles.lightboxClose}
              onClick={() => setLightboxOpen(false)}
              aria-label="Fechar"
            >
              ✕
            </button>
            {gallery.length > 1 && (
              <button
                type="button"
                className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                aria-label="Imagem anterior"
              >
                ‹
              </button>
            )}
            <img
              src={gallery[activeIndex]}
              alt={`${product.name} ampliado`}
              className={styles.lightboxImage}
              onClick={(e) => e.stopPropagation()}
            />
            {gallery.length > 1 && (
              <button
                type="button"
                className={`${styles.lightboxNav} ${styles.lightboxNext}`}
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                aria-label="Próxima imagem"
              >
                ›
              </button>
            )}
            <span className={styles.lightboxCounter}>
              {activeIndex + 1} / {gallery.length}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
