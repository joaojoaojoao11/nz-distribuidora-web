import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SEO from '../../components/SEO/SEO';
import { SITE_URL } from '../../lib/siteConfig';
import { staggerContainer, fadeUpItem } from './variants';
import {
  ethernaProducts,
  ETHERNA_HERO_BADGES,
} from './ethernaProducts';
import styles from './EthernaCatalog.module.css';
import { DECOR, linkWhatsApp } from '../../lib/contatos';
import VitrineDaLinha from '../Wrap/VitrineDaLinha';
import { useAnunciosDaLinha } from '../Wrap/useAnunciosDaLinha';

const WHATSAPP_URL = linkWhatsApp(DECOR, 'Olá, estou vendo o catálogo Etherna Decor no site da NZDecor e quero um orçamento.');

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

export default function EthernaCatalog() {
  // Contador, grade e lista do schema = anúncios da linha na NZSTORE (01/11/2026).
  const { itens, familias, pronto } = useAnunciosDaLinha('etherna', 'Etherna Decor');

  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Catálogo Etherna Decor — Vinil Adesivo Decorativo',
    description:
      'Catálogo completo dos padrões Etherna Decor distribuídos pela NZDecor. Indústria nacional com tecnologia Shield®.',
    url: `${SITE_URL}/decor/etherna`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: itens.length,
      itemListElement: itens.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE_URL}/loja/${p.slug}`,
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
              <span className={styles.counterNumber}>{pronto ? itens.length : '—'}</span>
              <span className={styles.counterLabel}>PADRÕES</span>
              <span className={styles.counterDivider} />
              <span className={styles.counterNumber}>
                {pronto ? familias : '—'}
              </span>
              <span className={styles.counterLabel}>FAMÍLIAS</span>
            </motion.div>
          </motion.div>
        </div>
      </header>

      {/* ANÚNCIOS DA LINHA NA NZSTORE (01/11/2026) */}
      <VitrineDaLinha
        lineKey="etherna"
        lineLabel="Etherna Decor"
        searchPlaceholder="Buscar padrão ou código…"
        rotulos={{ um: 'padrão encontrado', varios: 'padrões encontrados', todos: 'TODOS' }}
        classeSecao={styles.catalogSection}
      />

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
