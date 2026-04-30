import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import SellerModal from '../../components/SellerModal/SellerModal';
import styles from './NzGroupPromo.module.css';

type Brand = {
  name: string;
  tag: string;
  logo: string;
  to: string;
  external?: boolean;
};

const brands: Brand[] = [
  {
    name: 'NZ PPF',
    tag: 'Proteção de pintura · 6 linhas',
    logo: '/assets/logos/logo-nzppf-2026.svg',
    to: '/ppf-promo',
  },
  {
    name: 'NZ Wrap Premium',
    tag: 'PVC alto brilho · 30 cores',
    logo: '/assets/logos/logo-nz-wrap.svg',
    to: '/wrap/nzwrap-premium',
  },
  {
    name: 'Oracal 970RA',
    tag: 'Cast alemão · 80+ cores · 10 anos',
    logo: '/assets/logos/logo-orafol.svg',
    to: '/wrap/oracal-970ra',
  },
  {
    name: 'Oracal 651',
    tag: 'Plotter & sinalização · 62 cores',
    logo: '/assets/logos/logo-orafol.svg',
    to: '/wrap/oracal-651',
  },
  {
    name: 'Oracal 670RA',
    tag: 'Wrapping econômico · 18 cores',
    logo: '/assets/logos/logo-orafol.svg',
    to: '/wrap/oracal-670ra',
  },
  {
    name: 'SH Colors',
    tag: 'Variedade máxima · 180μ',
    logo: '/assets/logos/logo-sh-colors.svg',
    to: '/wrap/sh-colors',
  },
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

export default function NzGroupPromo() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    const prevTitle = document.title;
    document.title = 'NZ Group · Marcas e Vendas';
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
              src="/assets/logos/logo-nz-group-base.svg"
              alt="NZ Group"
              className={styles.logo}
            />
          </div>
          <p className={styles.kicker}>GRUPO OFICIAL</p>
          <h1 className={styles.title}>Soluções automotivas premium</h1>
          <p className={styles.subtitle}>
            Marcas próprias e parceiros globais sob curadoria NZ.
          </p>
        </motion.header>

        {/* BRAND BUTTONS */}
        <motion.section className={styles.brands} variants={item}>
          <div className={styles.sectionLabel}>
            <span className={styles.sectionLabelDot} />
            <span>NOSSAS MARCAS</span>
          </div>

          <div className={styles.brandList}>
            {brands.map((brand) => (
              <motion.button
                key={brand.to}
                className={styles.brandBtn}
                variants={item}
                onClick={() => navigate(brand.to)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.985 }}
              >
                <span className={styles.brandGlow} aria-hidden />
                <span className={styles.brandLogoBox}>
                  <img src={brand.logo} alt={brand.name} className={styles.brandLogo} />
                </span>
                <span className={styles.brandContent}>
                  <span className={styles.brandName}>{brand.name}</span>
                  <span className={styles.brandTag}>{brand.tag}</span>
                </span>
                <ArrowRight size={20} className={styles.brandArrow} />
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
          <span>NZ Group</span>
          <span className={styles.footerSep}>·</span>
          <span>Tecnologia que protege.</span>
        </motion.footer>
      </motion.main>

      <SellerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        messageContext="os produtos NZ Group"
      />
    </div>
  );
}
