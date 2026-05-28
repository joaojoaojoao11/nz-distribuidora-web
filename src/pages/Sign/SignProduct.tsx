import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import SEO from '../../components/SEO/SEO';
import { getFamilyBySlug, averyFamilies } from './averyLines';
import styles from './SignProduct.module.css';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.18, delayChildren: 0.1 } },
};

const fadeUpItem = {
  hidden: { opacity: 0, y: 40, filter: 'blur(8px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const cardStagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

const WHATSAPP_URL = 'https://wa.me/message/3DBGPIZF4EMWO1';

export default function SignProduct() {
  const { slug } = useParams<{ slug: string }>();
  const family = getFamilyBySlug(slug);

  if (!family) {
    return (
      <div className={styles.notFound}>
        <SEO
          title="Linha não encontrada"
          description="A linha de comunicação visual buscada não existe no catálogo NZSIGN."
          canonicalUrl="/sign"
        />
        <div className="container">
          <h1>Linha não encontrada</h1>
          <p>A página que você procura não existe ou foi movida.</p>
          <Link to="/sign" className={styles.backLink}>
            ← Voltar para NZSIGN
          </Link>
        </div>
      </div>
    );
  }

  const relatedFamilies = averyFamilies.filter((f) => f.slug !== family.slug).slice(0, 3);

  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: family.name,
    description: family.longDescription,
    brand: {
      '@type': 'Brand',
      name: 'Avery Dennison',
    },
    category: 'Comunicação Visual / Vinil Adesivo',
    url: `https://agencianz.com/sign/${family.slug}`,
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      priceCurrency: 'BRL',
      seller: {
        '@type': 'Organization',
        name: 'NZSIGN — NZ Group',
      },
    },
  });

  return (
    <div className={styles.page}>
      <SEO
        title={family.seo.title}
        description={family.seo.description}
        keywords={family.seo.keywords}
        canonicalUrl={`/sign/${family.slug}`}
        schema={schema}
        type="product"
      />

      {/* HERO */}
      <header className={styles.hero}>
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroBottomShadow}></div>
        <div className={`container ${styles.heroContainer}`}>
          <motion.div
            className={styles.heroTextContent}
            initial="hidden"
            animate="show"
            variants={staggerContainer}
          >
            <motion.div className={styles.heroBrandMark} variants={fadeUpItem}>
              <img
                src="/assets/logos/nzsign/logo-avery-dennison.png"
                alt="Avery Dennison"
                className={styles.heroBrandLogo}
              />
              <div className={styles.heroBrandText}>
                <span className={styles.heroBrandKicker}>LINHA ORIGINAL</span>
                <span className={styles.heroBrandName}>AVERY DENNISON</span>
              </div>
            </motion.div>

            <motion.div className={styles.heroBreadcrumb} variants={fadeUpItem}>
              <Link to="/sign">NZSIGN</Link>
              <span className={styles.breadcrumbSep}>·</span>
              <span className={styles.breadcrumbCurrent}>{family.shortName}</span>
            </motion.div>

            <motion.h1 className={styles.heroTitle} variants={fadeUpItem}>
              {family.name}
            </motion.h1>

            <motion.p className={styles.heroSubtitle} variants={fadeUpItem}>
              {family.subtitle}
            </motion.p>

            <motion.div className={styles.heroBadges} variants={fadeUpItem}>
              {family.badges.map((b) => (
                <span key={b} className={styles.heroBadge}>
                  {b}
                </span>
              ))}
            </motion.div>

            <motion.div className={styles.heroCta} variants={fadeUpItem}>
              <a
                href={WHATSAPP_URL}
                className={styles.ctaPrimary}
                target="_blank"
                rel="noopener noreferrer"
              >
                FALAR COM O TIME NZSIGN
              </a>
              <a href="#detalhes" className={styles.ctaSecondary}>
                VER DETALHES TÉCNICOS
              </a>
            </motion.div>
          </motion.div>
        </div>
      </header>

      {/* DESCRIÇÃO LONGA + BRAND PANEL */}
      <section className={styles.descSection} id="detalhes">
        <motion.div
          className={`container ${styles.descContainer}`}
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.div className={styles.descGrid} variants={fadeUpItem}>
            <div className={styles.descTextCol}>
              <span className={styles.sectionKicker}>SOBRE A LINHA</span>
              <h2 className={styles.sectionTitle}>O que é o {family.shortName}</h2>
              <p className={styles.descParagraph}>{family.longDescription}</p>
            </div>

            <aside className={styles.brandPanel}>
              <img
                src="/assets/logos/nzsign/logo-avery-dennison.png"
                alt="Avery Dennison"
                className={styles.brandPanelLogo}
              />
              <div className={styles.brandPanelDivider}></div>
              <p className={styles.brandPanelStatement}>
                Linha original Avery Dennison — padrão global em comunicação visual desde 1935.
              </p>
              <ul className={styles.brandPanelFacts}>
                <li>
                  <span className={styles.brandFactValue}>1935</span>
                  <span className={styles.brandFactLabel}>Fundação · EUA</span>
                </li>
                <li>
                  <span className={styles.brandFactValue}>90+</span>
                  <span className={styles.brandFactLabel}>Países atendidos</span>
                </li>
                <li>
                  <span className={styles.brandFactValue}>ICS</span>
                  <span className={styles.brandFactLabel}>Sistema integrado</span>
                </li>
              </ul>
            </aside>
          </motion.div>
        </motion.div>
      </section>

      {/* APLICAÇÕES + ESPECIFICAÇÕES */}
      <section className={styles.specsSection}>
        <motion.div
          className={`container ${styles.specsContainer}`}
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
        >
          <div className={styles.specsGrid}>
            <motion.div className={styles.specsCol} variants={fadeUpItem}>
              <span className={styles.sectionKicker}>APLICAÇÕES</span>
              <h3 className={styles.colTitle}>Onde usar</h3>
              <ul className={styles.applicationsList}>
                {family.applications.map((app) => (
                  <li key={app} className={styles.applicationItem}>
                    <span className={styles.bullet}>▸</span>
                    <span>{app}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div className={styles.specsCol} variants={fadeUpItem}>
              <span className={styles.sectionKicker}>FICHA TÉCNICA</span>
              <h3 className={styles.colTitle}>Especificações</h3>
              <dl className={styles.specsList}>
                {family.specs.map((spec) => (
                  <div key={spec.label} className={styles.specRow}>
                    <dt className={styles.specLabel}>{spec.label}</dt>
                    <dd className={styles.specValue}>{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* DIFERENCIAIS */}
      <section className={styles.featuresSection}>
        <motion.div
          className={`container ${styles.featuresContainer}`}
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
        >
          <motion.div className={styles.sectionHeader} variants={fadeUpItem}>
            <span className={styles.sectionKicker}>DIFERENCIAIS</span>
            <h2 className={styles.sectionTitle}>Por que escolher essa linha</h2>
          </motion.div>

          <motion.div
            className={styles.featuresGrid}
            variants={cardStagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
          >
            {family.features.map((feature, i) => (
              <motion.div key={feature.title} className={styles.featureCard} variants={fadeUpItem}>
                <span className={styles.featureNumber}>{String(i + 1).padStart(2, '0')}</span>
                <h4 className={styles.featureTitle}>{feature.title}</h4>
                <p className={styles.featureText}>{feature.text}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* SUB-LINHAS (só renderiza se existirem) */}
      {family.subLines && family.subLines.length > 0 && (
        <section className={styles.subLinesSection}>
          <motion.div
            className={`container ${styles.subLinesContainer}`}
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
          >
            <motion.div className={styles.sectionHeader} variants={fadeUpItem}>
              <span className={styles.sectionKicker}>SUB-LINHAS</span>
              <h2 className={styles.sectionTitle}>Variantes disponíveis</h2>
            </motion.div>

            <motion.div className={styles.subLinesGrid} variants={cardStagger}>
              {family.subLines.map((sub) => (
                <motion.div key={sub.code} className={styles.subLineCard} variants={fadeUpItem}>
                  <div className={styles.subLineCode}>{sub.code}</div>
                  <div className={styles.subLineName}>{sub.name}</div>
                  <p className={styles.subLineDesc}>{sub.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>
      )}

      {/* CTA FINAL */}
      <section className={styles.ctaSection}>
        <motion.div
          className={`container ${styles.ctaContainer}`}
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.span className={styles.sectionKicker} variants={fadeUpItem}>
            COTAÇÃO E SUPORTE TÉCNICO
          </motion.span>
          <motion.h2 className={styles.ctaTitle} variants={fadeUpItem}>
            Precisa de {family.shortName} para um projeto?
          </motion.h2>
          <motion.p className={styles.ctaSubtitle} variants={fadeUpItem}>
            Atendimento direto com nosso time NZSIGN. Cotações por bobina, pedidos recortados, especificação técnica e suporte de aplicação.
          </motion.p>
          <motion.div className={styles.ctaButtons} variants={fadeUpItem}>
            <a
              href={WHATSAPP_URL}
              className={styles.ctaPrimary}
              target="_blank"
              rel="noopener noreferrer"
            >
              ENTRAR EM CONTATO
            </a>
            <Link to="/sign" className={styles.ctaSecondary}>
              VER TODAS AS LINHAS
            </Link>
          </motion.div>

          <motion.div className={styles.ctaAuthBadge} variants={fadeUpItem}>
            <img
              src="/assets/logos/nzsign/logo-avery-dennison.png"
              alt="Avery Dennison"
              className={styles.ctaAuthLogo}
            />
            <span className={styles.ctaAuthText}>
              NZSIGN · Distribuição autorizada Avery Dennison no Brasil
            </span>
          </motion.div>
        </motion.div>
      </section>

      {/* OUTRAS LINHAS */}
      <section className={styles.relatedSection}>
        <motion.div
          className={`container ${styles.relatedContainer}`}
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
        >
          <motion.div className={styles.sectionHeader} variants={fadeUpItem}>
            <span className={styles.sectionKicker}>EXPLORE TAMBÉM</span>
            <h2 className={styles.sectionTitle}>Outras linhas Avery na NZSIGN</h2>
          </motion.div>

          <motion.div className={styles.relatedGrid} variants={cardStagger}>
            {relatedFamilies.map((rel) => (
              <motion.div key={rel.slug} variants={fadeUpItem}>
                <Link to={`/sign/${rel.slug}`} className={styles.relatedCard}>
                  <div className={styles.relatedBadges}>
                    {rel.badges.slice(0, 2).map((b) => (
                      <span key={b} className={styles.relatedBadge}>
                        {b}
                      </span>
                    ))}
                  </div>
                  <h4 className={styles.relatedName}>{rel.name}</h4>
                  <p className={styles.relatedSubtitle}>{rel.subtitle}</p>
                  <div className={styles.relatedCta}>
                    EXPLORAR <span>→</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
