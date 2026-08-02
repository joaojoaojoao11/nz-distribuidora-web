import { motion } from 'framer-motion';
import { staggerContainer, fadeUpItem, cardStagger, scaleReveal } from './variants';
import { decorBrands } from './brandData';
import styles from './BrandCards.module.css';

export default function BrandCards() {
  return (
    <section className={styles.brandsSection}>
      <motion.div
        className={`container ${styles.brandsContainer}`}
        variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}
      >
        <motion.div className={styles.brandsHeader} variants={fadeUpItem}>
          <span className={styles.brandsTag}>DUAS LINHAS · UMA CURADORIA</span>
          <h2 className={styles.brandsTitle}>Marcas Distribuídas</h2>
        </motion.div>

        <motion.div className={styles.brandsGrid} variants={cardStagger}>
          {decorBrands.map(b => (
            <motion.article key={b.slug} className={styles.brandCard} variants={scaleReveal}>
              <div className={styles.brandCardImage}>
                <img src={b.image} alt={b.name} loading="lazy" />
              </div>
              <div className={styles.brandCardContent}>
                <div className={styles.brandOrigin}>{b.origin}</div>
                <h3 className={styles.brandName}>{b.name}</h3>
                <p className={styles.brandTagline}>{b.tagline}</p>
                <p className={styles.brandDescription}>{b.description}</p>
                <div className={styles.brandBadges}>
                  {b.badges.map(bd => (
                    <span key={bd} className={styles.brandBadge}>{bd}</span>
                  ))}
                </div>
                <a href={b.officialSite} target="_blank" rel="noopener noreferrer" className={styles.brandLink}>
                  Ver catálogo oficial →
                </a>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
