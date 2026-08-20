import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import SellerModal from '../../components/SellerModal/SellerModal';
import styles from './PpfPromo.module.css';

const lines = [
  { slug: 'luxury-gloss', name: 'NZPPF Luxury Gloss', tag: '12 ANOS · 190μ' },
  { slug: 'prime-gloss',  name: 'NZPPF Prime Gloss',  tag: '10 ANOS · 190μ' },
  { slug: 'flow-gloss',   name: 'NZPPF Flow Gloss',   tag: '7 ANOS · 185μ'  },
  { slug: 'core-gloss',   name: 'NZPPF Core Gloss',   tag: '3 ANOS · 175μ'  },
  { slug: 'headlight',    name: 'NZPPF Headlight',    tag: '10 ANOS · UV'   },
  { slug: 'windshield',   name: 'NZPPF Windshield',   tag: '2 ANOS · 190μ'  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
};

const item = {
  hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

export default function PpfPromo() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    const prevTitle = document.title;
    document.title = 'NZ PPF · Linhas e Vendas';
    return () => {
      document.head.removeChild(meta);
      document.title = prevTitle;
    };
  }, []);

  return (
    <div className={styles.page}>
      {/* AURORA BACKGROUND */}
      <div className={styles.aurora} aria-hidden>
        <div className={`${styles.blob} ${styles.blobA}`} />
        <div className={`${styles.blob} ${styles.blobB}`} />
        <div className={`${styles.blob} ${styles.blobC}`} />
      </div>
      <div className={styles.grain} aria-hidden />
      <div className={styles.vignette} aria-hidden />

      <motion.main
        className={styles.shell}
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* HEADER */}
        <motion.header className={styles.header} variants={item}>
          <div className={styles.logoHalo}>
            <img
              src="/assets/logos/logo-nzppf-2026.svg"
              alt="NZ PPF"
              className={styles.logo}
            />
          </div>
          <p className={styles.kicker}>CATÁLOGO OFICIAL</p>
          <h1 className={styles.title}>Conheça nossas linhas</h1>
          <p className={styles.subtitle}>
            Selecione uma linha para explorar ou fale direto com um consultor.
          </p>
        </motion.header>

        {/* LINE BUTTONS */}
        <motion.section className={styles.lines} variants={item}>
          <div className={styles.sectionLabel}>
            <span className={styles.sectionLabelDot} />
            <span>LINHAS NZ PPF</span>
          </div>

          <div className={styles.lineList}>
            {lines.map((line) => (
              <motion.button
                key={line.slug}
                className={styles.lineBtn}
                variants={item}
                onClick={() => navigate(`/ppf/${line.slug}`)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.985 }}
              >
                <span className={styles.lineGlow} aria-hidden />
                <span className={styles.lineContent}>
                  <span className={styles.lineName}>{line.name}</span>
                  <span className={styles.lineTag}>{line.tag}</span>
                </span>
                <ArrowRight size={20} className={styles.lineArrow} />
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* SALES CTA */}
        <motion.section className={styles.sales} variants={item}>
          <div className={styles.divider}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerLabel}>Departamento de Vendas</span>
            <span className={styles.dividerLine} />
          </div>

          <motion.button
            className={styles.cta}
            onClick={() => setModalOpen(true)}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className={styles.ctaConic} aria-hidden />
            <span className={styles.ctaInner}>
              <span className={styles.ctaShimmer} aria-hidden />
              <ShoppingBag size={22} className={styles.ctaIcon} />
              <span className={styles.ctaLabel}>COMPRE AGORA</span>
              <ArrowRight size={20} className={styles.ctaArrow} />
            </span>
          </motion.button>

          <p className={styles.ctaHint}>
            Atendimento direto pelo WhatsApp · Resposta rápida
          </p>

          <motion.button
            className={styles.aboutLink}
            onClick={() => navigate('/sobre')}
            variants={item}
            whileHover={{ x: 2 }}
          >
            <span>Conheça a NZ</span>
            <ArrowRight size={14} />
          </motion.button>
        </motion.section>

        <motion.footer className={styles.footer} variants={item}>
          <span>NZ Distribuidora · NZ PPF</span>
          <span className={styles.footerSep}>·</span>
          <span>Tecnologia que protege.</span>
        </motion.footer>
      </motion.main>

      <SellerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        messageContext="as linhas de NZ PPF"
      />
    </div>
  );
}
