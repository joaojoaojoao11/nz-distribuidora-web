import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import SEO from '../../components/SEO/SEO';
import styles from './Wrap.module.css';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.1 } }
};

const fadeUpItem = {
  hidden: { opacity: 0, y: 40, filter: 'blur(8px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } }
};

const cardStagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } }
};

const scaleReveal = {
  hidden: { opacity: 0, scale: 0.92, y: 20, filter: 'blur(6px)' },
  show: { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } }
};

const productLines = [
  {
    slug: 'nzwrap-premium',
    title: 'NZWRAP PREMIUM',
    subtitle: 'PVC Alto Brilho | Linha Proprietária NZ',
    description: 'Adesivo PVC de alta performance com acabamento ultra glossy. Curadoria exclusiva de cores, suporte direto NZ e performance garantida.',
    image: '/assets/images/wrap_nzwrap_card.png',
    cardLogo: '/assets/logos/logo-nz-wrap.svg',
    badge1: 'CATÁLOGO DIGITAL',
    badge2: '3 ANOS',
    badge3: 'EXCLUSIVO NZ',
    available: true
  },
  {
    slug: 'sh-colors',
    title: 'SH WRAPPING COLORS',
    subtitle: 'PVC Multidirecional | VINIL DE ALTA PERFORMANCE',
    description: 'Linha de adesivos automotivos com cola anti-bolhas, acabamentos Gloss, Matte, Color Shift e Metallic. Referência no Brasil em variedade.',
    image: '/assets/images/wrap_sh_card.png',
    cardLogo: '/assets/logos/logo-sh-colors.svg',
    badge1: 'CATÁLOGO DIGITAL',
    badge2: '180μ',
    badge3: '',
    available: true
  },
  {
    slug: 'oracal-670ra',
    title: 'ORACAL 670RA',
    subtitle: 'Wrapping Film | O 651 Evoluído para Envelopamento',
    description: 'A evolução do lendário 651 para aplicações de envelopamento completo. Mesma qualidade ORAFOL agora com largura de 1,52m e tecnologia RapidAir® anti-bolhas.',
    image: '/assets/images/wrap_670ra_card.png',
    cardLogo: '/assets/logos/logo-orafol.svg',
    badge1: '70μ',
    badge2: '1,52m',
    badge3: '',
    available: true
  },
  {
    slug: 'oracal-651',
    title: 'ORACAL 651',
    subtitle: 'Intermediário Versátil | 77+ Cores',
    description: 'O vinil intermediário mais popular do mundo. Ideal para recortes, sinalização automotiva e detalhes de alta precisão com durabilidade de 6 anos.',
    image: '/assets/images/wrap_651_card.png',
    cardLogo: '/assets/logos/logo-orafol.svg',
    badge1: '63μ',
    badge2: '6 ANOS',
    badge3: '',
    available: true
  }
];

const comparisonData = [
  {
    id: 'nzwrap',
    name: 'NZWRAP',
    highlight: 'Linha própria NZ com PVC alto brilho de alta performance e curadoria exclusiva de cores.',
    thickness: 'PVC Premium',
    warranty: 'Premium',
    warrantyLabel: 'GARANTIA',
    warrantyLabelShort: 'GAR',
    metrics: [
      { label: 'Brilho & Acabamento', value: 95 },
      { label: 'Conformabilidade', value: 88 },
      { label: 'Resistência UV', value: 85 },
      { label: 'Facilidade de Aplicação', value: 90 },
      { label: 'Custo-Benefício', value: 92 }
    ]
  },
  {
    id: 'sh',
    name: 'SH COLORS',
    highlight: 'Maior variedade de cores do Brasil com cola anti-bolhas e acabamentos especiais.',
    thickness: '180μ',
    warranty: '3 Anos',
    warrantyLabel: 'DURABILIDADE',
    warrantyLabelShort: 'DUR',
    metrics: [
      { label: 'Brilho & Acabamento', value: 88 },
      { label: 'Conformabilidade', value: 85 },
      { label: 'Resistência UV', value: 82 },
      { label: 'Facilidade de Aplicação', value: 92 },
      { label: 'Custo-Benefício', value: 95 }
    ]
  },
  {
    id: '651',
    name: 'ORACAL 651',
    highlight: 'O intermediário mais popular do mundo. Ideal para recortes, sinalização e detalhes de alta precisão.',
    thickness: '63μ',
    warranty: '6 Anos',
    warrantyLabel: 'DURABILIDADE',
    warrantyLabelShort: 'DUR',
    metrics: [
      { label: 'Brilho & Acabamento', value: 82 },
      { label: 'Conformabilidade', value: 70 },
      { label: 'Resistência UV', value: 88 },
      { label: 'Facilidade de Aplicação', value: 85 },
      { label: 'Custo-Benefício', value: 97 }
    ]
  },
  {
    id: '670ra',
    name: 'ORACAL 670RA',
    highlight: 'A evolução do 651 para wrapping: mesma qualidade, agora com largura profissional de 1,52m e sistema RapidAir® para instalações sem bolhas.',
    thickness: '70μ',
    warranty: '5 Anos',
    warrantyLabel: 'DURABILIDADE',
    warrantyLabelShort: 'DUR',
    metrics: [
      { label: 'Brilho & Acabamento', value: 84 },
      { label: 'Conformabilidade', value: 82 },
      { label: 'Resistência UV', value: 88 },
      { label: 'Facilidade de Aplicação', value: 93 },
      { label: 'Custo-Benefício', value: 96 }
    ]
  }
];

export default function Wrap() {
  const navigate = useNavigate();
  const [activeCompareId, setActiveCompareId] = useState<string>('nzwrap');

  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Catálogo de Adesivos Automotivos e Vinil Premium - NZ Distribuidora",
    "description": "Veja nossa linha de Vinil Automotivo: NZWrap Premium, Oracal 651, Oracal 670RA e SH Colors. Alta performance para envelopamento.",
    "url": "https://agencianz.com/wrap"
  });

  return (
    <div className={styles.page}>
      <SEO 
        title="Adesivo Automotivo Premium | Catálogo de Envelopamento"
        description="Encontre o melhor adesivo automotivo e vinil para envelopamento na NZ Distribuidora. Marcas líderes como Oracal e NZWrap com centenas de cores."
        keywords="adesivo automotivo, vinil automotivo, oracal 651, oracal 670ra, nzwrap, sh colors, envelopamento"
        canonicalUrl="/wrap"
        schema={schema}
      />
      {/* HERO */}
      <header className={styles.hero}>
        <img src="/assets/images/wrap_hero.png" alt="" className={styles.heroImage} />
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroBottomShadow}></div>
        <div className={`container ${styles.heroContainer}`}>
          <motion.div
            className={styles.heroTextContent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
          >
            <motion.img
              src="/assets/logos/logo-nz-wrap.svg"
              alt="NZ WRAP"
              className={styles.pageTitleImage}
              variants={fadeUpItem}
            />
            <motion.p className={styles.heroSubtitle} variants={fadeUpItem}>
              A única empresa da América Latina que garante acesso a qualquer cor de envelopamento disponível no mundo. Liberdade criativa total e materiais com performance sólida.
            </motion.p>
            <motion.p className={styles.heroSubtitleWarning} variants={fadeUpItem}>
              Não vendemos apenas vinil — entregamos resultado, variedade e confiança.
            </motion.p>
          </motion.div>
        </div>
      </header>

      {/* BLACK SPACER */}
      <div className={styles.blackSpacer}></div>

      {/* PRODUCT CARDS */}
      <section className={styles.productsSection}>
        <div className={styles.productsSectionBackground}></div>
        <motion.div
          className={`container ${styles.productsContainer}`}
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.div className={styles.productsSectionHeader} variants={fadeUpItem}>
            <h2 className={styles.productsSectionTitle}>NOSSAS LINHAS</h2>
            <p className={styles.productsSectionSub}>Selecione uma linha para explorar em detalhes</p>
          </motion.div>

          <motion.div
            className={styles.productsGrid}
            variants={cardStagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
          >
            {productLines.map((product) => (
              <motion.div
                key={product.slug}
                variants={scaleReveal}
                className={styles.productCard}
                whileHover={{ scale: 1.03, transition: { duration: 0.3 } }}
                onClick={() => product.available && navigate(`/wrap/${product.slug}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && product.available && navigate(`/wrap/${product.slug}`)}
              >
                <img src={product.image} alt={product.title} className={styles.productCardImage} />
                <div className={styles.productCardOverlay}></div>
                <div className={styles.productCardContent}>
                  <div className={styles.productCardBadgesContainer}>
                    {product.badge1 && <span className={styles.productCardBadge}>{product.badge1}</span>}
                    {product.badge2 && <span className={styles.productCardBadge}>{product.badge2}</span>}
                    {product.badge3 && <span className={styles.productCardBadge}>{product.badge3}</span>}
                  </div>
                  {product.cardLogo && (
                    <img src={product.cardLogo} alt={`${product.title} Logo`} className={styles.productCardBrandLogo} />
                  )}
                  <h3 className={styles.productCardTitle}>{product.title}</h3>
                  <p className={styles.productCardSubtitle}>{product.subtitle}</p>
                  <p className={styles.productCardDescription}>{product.description}</p>
                  <div className={styles.productCardCta}>
                    EXPLORAR <span className={styles.ctaArrow}>→</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* COMPARISON */}
      <section className={styles.comparisonSection}>
        <motion.div
          className={`container ${styles.comparisonContainer}`}
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.div className={styles.productsSectionHeader} variants={fadeUpItem}>
            <h2 className={styles.productsSectionTitle}>COMPARE AS LINHAS</h2>
            <p className={styles.productsSectionSub}>Telemetria de Performance e Propriedades Técnicas</p>
          </motion.div>

          <div className={styles.comparisonMatrix}>
            <div className={styles.comparisonTabs}>
              {comparisonData.map(item => (
                <button
                  key={item.id}
                  className={`${styles.compareTab} ${activeCompareId === item.id ? styles.activeTab : ''}`}
                  onClick={() => setActiveCompareId(item.id)}
                >
                  {item.name}
                </button>
              ))}
              <button
                className={`${styles.compareTab} ${activeCompareId === 'all' ? styles.activeTab : ''}`}
                onClick={() => setActiveCompareId('all')}
              >
                TODAS
              </button>
            </div>

            <div className={styles.comparisonContent}>
              {activeCompareId === 'all' ? (
                <motion.div
                  key="all"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className={styles.allLinesGrid}
                >
                  {comparisonData.map(item => (
                    <div key={item.id} className={styles.allLineCard}>
                      <div className={styles.allLineCardTitle}>{item.name}</div>
                      <div className={styles.compareBadges} style={{ marginBottom: '0.5rem' }}>
                        <span className={styles.compareBadge} style={{ fontSize: '0.65rem', padding: '0.25rem 0.5rem' }}>
                          <strong>ESP:</strong> {item.thickness}
                        </span>
                        <span className={styles.compareBadge} style={{ fontSize: '0.65rem', padding: '0.25rem 0.5rem' }}>
                          <strong>{item.warrantyLabelShort}:</strong> {item.warranty}
                        </span>
                      </div>
                      {item.metrics.map(metric => (
                        <div key={metric.label} className={styles.allLineMetricRow}>
                          <div className={styles.allLineMetricLabel}>{metric.label}</div>
                          <div className={styles.allLineBarBg}>
                            <motion.div
                              className={styles.allLineBarFill}
                              initial={{ width: 0 }}
                              animate={{ width: `${metric.value}%` }}
                              transition={{ duration: 0.6, ease: "easeOut" }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </motion.div>
              ) : (
                comparisonData.map(item => item.id === activeCompareId && (
                  <motion.div
                    key={item.id}
                    className={styles.activeComparePanel}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <p className={styles.compareHighlight}>{item.highlight}</p>
                    <div className={styles.compareBadges}>
                      <span className={styles.compareBadge}><strong>ESPESSURA:</strong> {item.thickness}</span>
                      <span className={styles.compareBadge}><strong>{item.warrantyLabel}:</strong> {item.warranty}</span>
                    </div>

                    <div className={styles.metricsGrid}>
                      {item.metrics.map(metric => (
                        <div key={metric.label} className={styles.metricRow}>
                          <div className={styles.metricLabel}>{metric.label}</div>
                          <div className={styles.metricBarBg}>
                            <motion.div
                              className={styles.metricBarFill}
                              initial={{ width: 0 }}
                              animate={{ width: `${metric.value}%` }}
                              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                            >
                              <span className={styles.metricValue}>{metric.value}%</span>
                            </motion.div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </motion.div>
        <div className={styles.comparisonBottomShadow}></div>
      </section>
    </div>
  );
}
