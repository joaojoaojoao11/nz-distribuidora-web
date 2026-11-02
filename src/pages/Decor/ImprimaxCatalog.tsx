import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SEO from '../../components/SEO/SEO';
import { SITE_URL } from '../../lib/siteConfig';
import { staggerContainer, fadeUpItem } from './variants';
import {
  imprimaxFamilies,
  imprimaxProducts,
  IMPRIMAX_HERO_BADGES,
} from './imprimaxProducts';
// Mesmo layout do catálogo Etherna: reaproveita o CSS em vez de duplicá-lo.
import styles from './EthernaCatalog.module.css';
import extras from './ImprimaxExtras.module.css';
import { DECOR, linkWhatsApp } from '../../lib/contatos';
import VitrineDaLinha from '../Wrap/VitrineDaLinha';
import { useAnunciosDaLinha } from '../Wrap/useAnunciosDaLinha';
import { familiaPeloCatalogo } from './familiaDoAnuncio';

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

// A vitrine filtra pela família do catálogo; com uma família escolhida, mostra a
// descrição e as fotos de ambiente dela acima dos anúncios.
const familiaDoAnuncio = familiaPeloCatalogo(imprimaxFamilies, imprimaxProducts, '/decor/imprimax/', 'imprimax-');
const ORDEM_FAMILIAS = imprimaxFamilies.map((f) => f.name);
const topoDaFamilia = (nome: string) => {
  const f = imprimaxFamilies.find((x) => x.name === nome);
  if (!f) return null;
  return (
    <>
      <p className={styles.familyDescription}>{f.description}</p>
      {/* Ambientes da FAMÍLIA: ficam aqui, nunca na galeria de um padrão. */}
      {f.ambient.length > 0 && (
        <div className={extras.familyAmbient}>
          {f.ambient.slice(0, 4).map((src) => (
            <img key={src} src={src} alt={`Ambiente com vinil Imprimax da família ${f.name}`} loading="lazy" />
          ))}
        </div>
      )}
    </>
  );
};

export default function ImprimaxCatalog() {
  // Contador, grade e lista do schema = anúncios da linha na NZSTORE (01/11/2026).
  const { itens, familias, pronto } = useAnunciosDaLinha('imprimax', 'Imprimax', familiaDoAnuncio);

  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Catálogo Imprimax DecorMax — Vinil Adesivo Decorativo',
    description:
      'Catálogo dos padrões Imprimax DecorMax distribuídos pela NZDecor. Indústria nacional, antimofo e antibacteriano.',
    url: `${SITE_URL}/decor/imprimax`,
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
        lineKey="imprimax"
        lineLabel="Imprimax"
        searchPlaceholder="Buscar padrão ou código…"
        rotulos={{ um: 'padrão encontrado', varios: 'padrões encontrados', todos: 'TODOS' }}
        classeSecao={styles.catalogSection}
        grupoDe={familiaDoAnuncio}
        ordemGrupos={ORDEM_FAMILIAS}
        topoDoGrupo={topoDaFamilia}
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
