import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { averyFamilies } from './averyLines';
import styles from './AveryBlock.module.css';

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

const scaleReveal = {
  hidden: { opacity: 0, scale: 0.94, y: 18, filter: 'blur(6px)' },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const diffs = [
  {
    n: '01',
    title: 'Easy Apply RS · Aplicação sem refugo.',
    text: 'Adesivo reposicionável que desliza sobre a superfície e libera bolhas de ar — reduz tempo de instalação e perda de material.',
  },
  {
    n: '02',
    title: 'Sistema ICS · Garantia integrada.',
    text: 'Quando o filme MPI é aplicado com seu sobrelaminado DOL correspondente, a Avery cobre o conjunto completo conforme especificação técnica de fábrica.',
  },
  {
    n: '03',
    title: 'Receptividade a impressão.',
    text: 'Linhas MPI/SLP aceitam impressão eco-solvente, solvente, látex HP e UV — com topcoat preparado pra cores vivas e definição alta.',
  },
  {
    n: '04',
    title: 'Cobertura sob medida.',
    text: 'Calandrado (5–7 anos) para CV plana e curvas suaves, Cast (até 10 anos) para envelopamento total, refletivos para sinalização viária.',
  },
];

export default function AveryBlock() {
  return (
    <section className={styles.averySection}>
      <div className={styles.averySectionBackground}></div>

      <motion.div
        className={`container ${styles.averyContainer}`}
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
      >
        <motion.div className={styles.averyHeader} variants={fadeUpItem}>
          <img
            src="/assets/logos/nzsign/logo-avery-dennison.png"
            alt="Avery Dennison"
            className={styles.averyBrandLogo}
          />
          <h2 className={styles.averyTitle}>AVERY DENNISON</h2>
          <p className={styles.averySubtitle}>Padrão global em comunicação visual há 90 anos.</p>
        </motion.div>

        <motion.p className={styles.averyDescription} variants={fadeUpItem}>
          A Avery Dennison é a referência mundial em adesivos para comunicação visual. Fundada nos Estados Unidos em 1935, é a empresa que estabeleceu o padrão técnico do setor — com tecnologias proprietárias como Easy Apply RS (adesivo reposicionável que libera bolhas de ar) e o sistema ICS, que cobre o conjunto filme + sobrelaminado aplicados conforme especificação. No Brasil, a NZSIGN é parte da rede de distribuição autorizada.
        </motion.p>

        <motion.div className={styles.averyBadges} variants={fadeUpItem}>
          <span className={styles.averyBadge}>+90 ANOS DE MERCADO</span>
          <span className={styles.averyBadge}>EASY APPLY RS</span>
          <span className={styles.averyBadge}>SISTEMA ICS · COBERTURA TOTAL</span>
          <span className={styles.averyBadge}>90+ PAÍSES</span>
        </motion.div>

        <motion.div
          className={styles.averyDiffs}
          variants={cardStagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          {diffs.map((d) => (
            <motion.div key={d.n} className={styles.averyDiff} variants={fadeUpItem}>
              <span className={styles.averyDiffNumber}>{d.n}</span>
              <div>
                <h4 className={styles.averyDiffTitle}>{d.title}</h4>
                <p className={styles.averyDiffText}>{d.text}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div className={styles.familiesHeader} variants={fadeUpItem}>
          <h3 className={styles.familiesTitle}>AS 6 FAMÍLIAS QUE ATENDEMOS</h3>
          <p className={styles.familiesSub}>Cada linha tem seu uso ideal. Nosso time ajuda a especificar.</p>
        </motion.div>

        <motion.div
          className={styles.familiesGrid}
          variants={cardStagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
        >
          {averyFamilies.map((family) => (
            <motion.div key={family.slug} variants={scaleReveal}>
              <Link to={`/sign/${family.slug}`} className={styles.familyCard}>
                <div className={styles.familyCardBadges}>
                  {family.badges.map((b) => (
                    <span key={b} className={styles.familyBadge}>
                      {b}
                    </span>
                  ))}
                </div>
                <h4 className={styles.familyName}>{family.name}</h4>
                <p className={styles.familySubtitle}>{family.subtitle}</p>
                <p className={styles.familyDescription}>{family.description}</p>
                <span className={styles.familyCta}>
                  VER DETALHES <span className={styles.familyCtaArrow}>→</span>
                </span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
