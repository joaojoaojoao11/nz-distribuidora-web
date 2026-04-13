import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import styles from './Showcase.module.css';

const blurReveal = {
  hidden: { opacity: 0, y: 25, filter: 'blur(8px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 1, ease: [0.22, 1, 0.36, 1] } }
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.1 } }
};

export default function Showcase() {
  return (
    <section id="linhas" className={styles.section}>
      <div className={styles.sectionInner}>
        <motion.div
          className={styles.header}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.5 }}
          variants={stagger}
        >
          <motion.span className={styles.eyebrow} variants={blurReveal}>NOSSAS VERTICAIS</motion.span>
          <motion.h2 className={styles.title} variants={blurReveal}>
            Duas linhas. <span className={styles.gold}>Uma missão.</span>
          </motion.h2>
        </motion.div>

        <div className={styles.splitGrid}>
          <Link to="/ppf" className={styles.splitCard}>
            <div className={styles.splitImageWrapper}>
              <img src="/assets/images/wrap_nzwrap_hero.png" alt="NZ PPF" className={styles.splitImage} />
              <div className={styles.splitOverlay} />
            </div>
            <div className={styles.splitContent}>
              <img src="/assets/logos/logo-nz-ppf.svg" alt="NZ PPF" className={styles.splitLogo} />
              <span className={styles.splitSub}>PROTEÇÃO DE PINTURA PREMIUM</span>
              <p className={styles.splitDesc}>
                A barreira definitiva contra riscos, pedras e desgaste diário. Acabamento invisível com performance de fábrica.
              </p>
              <span className={styles.splitCta}>
                EXPLORAR
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </span>
            </div>
          </Link>

          <Link to="/wrap" className={styles.splitCard}>
            <div className={styles.splitImageWrapper}>
              <img src="/assets/images/wrap_hero.png" alt="NZ WRAP" className={styles.splitImage} />
              <div className={styles.splitOverlay} />
            </div>
            <div className={styles.splitContent}>
              <img src="/assets/logos/logo-nz-wrap.svg" alt="NZ WRAP" className={styles.splitLogo} />
              <span className={styles.splitSub}>ENVELOPAMENTO AUTOMOTIVO</span>
              <p className={styles.splitDesc}>
                Cores profundas, texturas ultrarrealistas e aplicação premium. Para projetos que demandam perfeição.
              </p>
              <span className={styles.splitCta}>
                EXPLORAR
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
