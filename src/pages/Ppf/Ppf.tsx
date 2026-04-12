import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import styles from './Ppf.module.css';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const fadeUpItem = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } }
};

const productLines = [
  {
    slug: 'luxury-gloss',
    title: 'NZPPF LUXURY GLOSS',
    subtitle: 'TPU de Última Geração | +32% Mais Brilho',
    description: 'TPU Alifático de 190 micras com Nano-Revestimento japonês. Regeneração térmica, autolimpeza e 12 anos de garantia.',
    image: '/assets/images/nzppf_super_brilho.png',
    badge: '190μ',
    available: true
  },
  {
    slug: 'prime-gloss',
    title: 'NZPPF PRIME GLOSS',
    subtitle: 'TPU de Alta Qualidade | Proteção Confiável',
    description: 'TPU 100% virgem de 190 micras com revestimento nano-dúplex. Regeneração térmica, repelência e 10 anos de garantia.',
    image: '/assets/images/nzppf_prime_hero.png',
    badge: '190μ',
    available: true
  },
  {
    slug: 'flow-gloss',
    title: 'NZPPF FLOW GLOSS',
    subtitle: 'TPU de Base Técnica | Desempenho Confiável',
    description: 'Material de tecnologia real, acabamento impecável e valor acessível. TPU técnico com revestimento hidrofóbico e 4 anos de garantia.',
    image: '/assets/images/flow_catalog_car.png',
    badge: '175μ',
    available: true
  }
  // Futuros produtos:
  // { slug: 'luxury-matte', title: 'NZPPF LUXURY MATTE', ... },
  // { slug: 'luxury-black', title: 'NZPPF LUXURY BLACK', ... },
];

export default function Ppf() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      {/* HERO */}
      <header className={styles.hero}>
        <video className={`${styles.heroVideo} ${styles.heroVideoDesktop}`} autoPlay muted loop playsInline>
          <source src="/assets/videos/NOVO-VIDEO-HERO-NZPPF-WEB-SITE.mp4" type="video/mp4" />
        </video>
        <video className={`${styles.heroVideo} ${styles.heroVideoMobile}`} autoPlay muted loop playsInline>
          <source src="/assets/videos/HERO-NZPPF-CELULAR.mp4" type="video/mp4" />
        </video>
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroBottomShadow}></div>
        <div className={`container ${styles.heroContainer}`}>
          <motion.div 
            className={styles.heroTextContent}
            initial="hidden"
            animate="show"
            variants={staggerContainer}
            viewport={{ once: true }}
          >
            <motion.img 
              src="/assets/logos/logo-nz-ppf.svg" 
              alt="NZ PPF" 
              className={styles.pageTitleImage} 
              variants={fadeUpItem} 
            />
            <motion.p className={styles.heroSubtitle} variants={fadeUpItem}>
              Criada por profissionais que vivem o mercado na prática, a NZ PPF nasceu para oferecer performance real, com materiais testados diariamente em carros, lojas e ambientes de uso intenso. Cada produto é desenvolvido para atender tanto a rotina pesada das lojas quanto o padrão de exigência dos aplicadores mais criteriosos do Brasil.
            </motion.p>
            <motion.p className={styles.heroSubtitleWarning} variants={fadeUpItem}>
              Aqui, não existe promessa vazia — existe tecnologia, consistência e resultado.
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

          <div className={styles.productsGrid}>
            {productLines.map((product) => (
              <motion.div
                key={product.slug}
                variants={fadeUpItem}
                className={styles.productCard}
                onClick={() => product.available && navigate(`/ppf/${product.slug}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && product.available && navigate(`/ppf/${product.slug}`)}
              >
                <img src={product.image} alt={product.title} className={styles.productCardImage} />
                <div className={styles.productCardOverlay}></div>
                <div className={styles.productCardContent}>
                  {product.badge && (
                    <span className={styles.productCardBadge}>{product.badge}</span>
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
          </div>
        </motion.div>
      </section>
    </div>
  );
}
