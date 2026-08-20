import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO/SEO';
import { SITE_URL } from '../../lib/siteConfig';
import styles from './Ppf.module.css';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.1 }
  }
};

const fadeUpItem = {
  hidden: { opacity: 0, y: 40, filter: 'blur(8px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } }
};

const scaleReveal = {
  hidden: { opacity: 0, scale: 0.92, y: 20, filter: 'blur(6px)' },
  show: { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } }
};

const cardStagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.15 } }
};

const productLines = [
  {
    slug: 'luxury-gloss',
    title: 'NZPPF LUXURY GLOSS',
    subtitle: 'TPU de Última Geração | +32% Mais Brilho',
    description: 'TPU Alifático de 190 micras com Nano-Revestimento japonês. Regeneração térmica, autolimpeza e 12 anos de garantia.',
    image: '/assets/images/luxury_lambo.png',
    thickness: '190μ',
    warranty: '12 ANOS',
    available: true
  },
  {
    slug: 'prime-gloss',
    title: 'NZPPF PRIME GLOSS',
    subtitle: 'TPU de Alta Qualidade | Proteção Confiável',
    description: 'TPU 100% virgem de 190 micras com revestimento nano-dúplex. Regeneração térmica, repelência e 10 anos de garantia.',
    image: '/assets/images/nzppf_prime_hero.png',
    thickness: '190μ',
    warranty: '10 ANOS',
    available: true
  },
  {
    slug: 'flow-gloss',
    title: 'NZPPF FLOW GLOSS',
    subtitle: 'Nova Formulação G2 | Performance Intermediária',
    description: 'Reformulada: TPU Técnico G2 com top coat nano-hidrofóbico, agora em 185 micras. Mais absorção de impacto, auto-cura acelerada e 7 anos de garantia.',
    image: '/assets/images/flow_haval.png',
    thickness: '185μ',
    warranty: '7 ANOS',
    available: true
  },
  {
    slug: 'core-gloss',
    title: 'NZPPF CORE GLOSS',
    subtitle: 'Combinação Híbrida Inteligente | Alta Rentabilidade',
    description: 'O melhor custo-benefício. Híbrido projetado para máxima rentabilidade da base sem retorno por bolhas ou trincas fortes. 3 Anos de Garantia.',
    image: '/assets/images/core_catalog_car.png',
    thickness: '175μ',
    warranty: '3 ANOS',
    available: true
  },
  {
    slug: 'headlight',
    title: 'NZ PPF HEADLIGHT',
    subtitle: 'Estética e Proteção para Faróis | 3 Tonalidades',
    description: 'TPU com estabilização UV em 3 tonalidades exclusivas. Personaliza o farol sem comprometer a luminosidade nem a segurança. 10 anos de garantia.',
    image: '/assets/images/nzppf_headlight_light_black.png',
    thickness: '—',
    warranty: '10 ANOS',
    available: true
  },
  {
    slug: 'windshield',
    title: 'NZ PPF WINDSHIELD',
    subtitle: 'TPU 190μ para Parabrisa | Absorção de Impacto',
    description: 'Película externa de 190 micras em TPU de alta performance. Absorve pedras e detritos, preserva o vidro original e mantém compatibilidade total com sensores/ADAS. 2 anos de garantia.',
    image: '/assets/images/nzppf_windshield_hero.png',
    thickness: '190μ',
    warranty: '2 ANOS',
    available: true
  }
  // Futuros produtos:
  // { slug: 'luxury-matte', title: 'NZPPF LUXURY MATTE', ... },
  // { slug: 'luxury-black', title: 'NZPPF LUXURY BLACK', ... },
];

const comparisonData = [
  {
    id: 'core',
    name: 'CORE',
    thickness: '175μ',
    warranty: '3 Anos',
    metrics: [
      { label: 'Brilho', value: 70 },
      { label: 'Durabilidade', value: 60 },
      { label: 'Regeneração', value: 50 },
      { label: 'Repelência', value: 65 },
      { label: 'Custo-Benefício', value: 100 }
    ],
    highlight: 'O melhor custo-benefício para máxima rentabilidade da base. Ideal para alto volume comercial.'
  },
  {
    id: 'flow',
    name: 'FLOW',
    thickness: '185μ',
    warranty: '7 Anos',
    metrics: [
      { label: 'Brilho', value: 89 },
      { label: 'Durabilidade', value: 85 },
      { label: 'Regeneração', value: 82 },
      { label: 'Repelência', value: 87 },
      { label: 'Custo-Benefício', value: 90 }
    ],
    highlight: 'Reformulada com o TPU Técnico G2: a linha intermediária de performance. Agora com 185 micras de corpo.'
  },
  {
    id: 'prime',
    name: 'PRIME',
    thickness: '190μ',
    warranty: '10 Anos',
    metrics: [
      { label: 'Brilho', value: 92 },
      { label: 'Durabilidade', value: 90 },
      { label: 'Regeneração', value: 85 },
      { label: 'Repelência', value: 90 },
      { label: 'Custo-Benefício', value: 75 }
    ],
    highlight: 'TPU Virgem avançado com proteção confiável inigualável. O padrão de qualidade do mercado.'
  },
  {
    id: 'luxury',
    name: 'LUXURY',
    thickness: '190μ',
    warranty: '12 Anos',
    metrics: [
      { label: 'Brilho', value: 100 },
      { label: 'Durabilidade', value: 100 },
      { label: 'Regeneração', value: 100 },
      { label: 'Repelência', value: 95 },
      { label: 'Custo-Benefício', value: 60 }
    ],
    highlight: 'A excelência absoluta. TPU Alifático de base superior com +32% de Brilho. Estética e proteção extremas.'
  }
];

export default function Ppf() {
  const navigate = useNavigate();
  const [activeCompareId, setActiveCompareId] = useState('flow');
  // Renderiza só o vídeo do formato atual — antes os dois (desktop + mobile)
  // eram baixados juntos, mesmo com um escondido via CSS.
  const [isMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
  );

  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Catálogo de Envelopamento PPF Premium - NZPPF",
    "description": "Descubra as linhas de PPF automotivo da NZ Distribuidora. Tecnologias Luxury Gloss, Prime, Flow e Core com alta durabilidade, regeneração térmica (self-healing) e repelência.",
    "url": `${SITE_URL}/ppf`
  });

  return (
    <div className={styles.page}>
      <SEO 
        title="Envelopamento PPF Premium | Catálogo Completo"
        description="As melhores linhas de Envelopamento PPF do Brasil. Proteção veicular com regeneração térmica, hidrofobia e até 12 anos de garantia."
        keywords="ppf automotivo, envelopamento ppf, ppf transparente, película ppf, nzppf, self-healing, proteção de pintura"
        canonicalUrl="/ppf"
        schema={schema}
      />
      {/* HERO */}
      <header className={styles.hero}>
        {isMobile ? (
          <video className={`${styles.heroVideo} ${styles.heroVideoMobile}`} autoPlay muted loop playsInline preload="metadata">
            <source src="/assets/videos/HERO-NZPPF-CELULAR.mp4" type="video/mp4" />
          </video>
        ) : (
          <video className={`${styles.heroVideo} ${styles.heroVideoDesktop}`} autoPlay muted loop playsInline preload="metadata">
            <source src="/assets/videos/NOVO-VIDEO-HERO-NZPPF-WEB-SITE.mp4" type="video/mp4" />
          </video>
        )}
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
              src="/assets/logos/logo-nz-ppf.svg" 
              alt="NZ PPF" 
              className={styles.pageTitleImage} 
              variants={fadeUpItem} 
            />
            <motion.p className={styles.heroSubtitle} variants={fadeUpItem}>
              A maioria dos PPFs são desenvolvidos em laboratório, por quem nunca instalou um metro de filme sequer.<br /><br />
              A NZ PPF nasceu dentro da operação. No calor de 40 graus, na curva que exige precisão milimétrica, no carro que o cliente volta para buscar no dia seguinte.<br /><br />
              Cada produto passa primeiro pela bancada — testado por aplicadores experientes, em veículos reais, sob condições reais — antes de chegar até você.<br /><br />
              Por isso, quando você abre o rolo, o material responde exatamente como deveria.
            </motion.p>
          </motion.div>
        </div>
      </header>

      {/* BLACK SPACER */}
      <div className={styles.blackSpacer}></div>

      {/* PRODUCT CARDS SECTION */}
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
                onClick={() => product.available && navigate(`/ppf/${product.slug}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && product.available && navigate(`/ppf/${product.slug}`)}
              >
                <img src={product.image} alt={product.title} className={styles.productCardImage} loading="lazy" decoding="async" />
                <div className={styles.productCardOverlay}></div>
                <div className={styles.productCardContent}>
                  <div className={styles.productCardBadgesContainer}>
                    {product.thickness && <span className={styles.productCardBadge}>{product.thickness}</span>}
                    {product.warranty && <span className={styles.productCardBadge}>{product.warranty}</span>}
                  </div>

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

      {/* COMPARISON SECTION */}
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
                          <strong>GAR:</strong> {item.warranty}
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
                      <span className={styles.compareBadge}><strong>GARANTIA:</strong> {item.warranty}</span>
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
