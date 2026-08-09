/* Ponte do NZSIGN para a Metamark 7 Series.
 *
 * A 7 Series é vinil de recorte, então cabe aqui tanto quanto na aba de
 * envelopamento — mas a página vive só em /wrap/metamark-7-series. Este bloco é
 * resumo e link: sem <h1>, sem <SEO> e sem canonical próprio, para não criar
 * uma segunda URL disputando a mesma busca.
 *
 * Reaproveita AveryBlock.module.css: mesma linguagem visual, zero CSS duplicado.
 */
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { M7_COLORS } from '../../lib/data/metamark7Colors';
import styles from './AveryBlock.module.css';
import own from './MetamarkBlock.module.css';

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

const BADGES = ['FABRICAÇÃO NO REINO UNIDO', 'ISO 9001 · 14001 · 45001 · 50001', 'ECOVADIS PLATINUM', 'GRUPO UPM'];

export default function MetamarkBlock() {
  return (
    <section className={`${styles.averySection} ${own.section}`}>
      <motion.div
        className={`container ${styles.averyContainer}`}
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
      >
        <motion.div className={styles.averyHeader} variants={fadeUpItem}>
          <img
            src="/assets/logos/metamark/logo-metamark.svg"
            alt="Metamark"
            className={own.logo}
            loading="lazy"
          />
          <span className={styles.averySubtitle}>TAMBÉM DISTRIBUÍMOS</span>
          <p className={styles.averyDescription}>
            Fabricante britânico de materiais autoadesivos desde 1992, com planta própria em
            Lancaster e distribuição em mais de cinquenta países. Certificações ISO 9001, 14001,
            45001 e 50001, selo EcoVadis Platinum e, desde 2025, parte do grupo finlandês UPM.
          </p>
          <div className={styles.averyBadges}>
            {BADGES.map((b) => (
              <span key={b} className={styles.averyBadge}>
                {b}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div className={own.cardWrap} variants={fadeUpItem}>
          <Link to="/wrap/metamark-7-series" className={styles.familyCard}>
            <div className={styles.familyCardBadges}>
              <span className={styles.familyBadge}>{M7_COLORS.length} CORES</span>
              {/* "micras" por extenso: o badge é uppercase no CSS e μ vira Μ (Mu maiúsculo) */}
              <span className={styles.familyBadge}>70 MICRAS POLIMÉRICO</span>
              <span className={styles.familyBadge}>CLASSE B</span>
              <span className={styles.familyBadge}>380 A 1.600 mm</span>
            </div>
            <h4 className={styles.familyName}>METAMARK 7 SERIES</h4>
            <p className={styles.familySubtitle}>Vinil de recorte para sinalização e gráfico veicular</p>
            <p className={styles.familyDescription}>
              Filme calandrado de 70 micras com adesivo Apex permanente e liner lay-flat. Cada uma
              das {M7_COLORS.length} cores tem valor Pantone® e CMYK publicado pelo fabricante — a
              referência objetiva que fecha identidade de marca e de frota sem aprovação no olho.
            </p>
            <span className={styles.familyCta}>
              VER CATÁLOGO DE CORES <span className={styles.familyCtaArrow}>→</span>
            </span>
          </Link>
        </motion.div>

        <motion.p className={own.trademark} variants={fadeUpItem}>
          Metamark® é marca registrada da Metamark (UK) Limited.
        </motion.p>
      </motion.div>
    </section>
  );
}
