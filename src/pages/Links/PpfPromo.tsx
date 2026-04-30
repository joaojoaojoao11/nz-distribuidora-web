import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MessageCircle, X, ShoppingBag, Phone } from 'lucide-react';
import styles from './PpfPromo.module.css';

const lines = [
  { slug: 'luxury-gloss', name: 'NZPPF Luxury Gloss', tag: '12 ANOS · 190μ' },
  { slug: 'prime-gloss',  name: 'NZPPF Prime Gloss',  tag: '10 ANOS · 190μ' },
  { slug: 'flow-gloss',   name: 'NZPPF Flow Gloss',   tag: '4 ANOS · 175μ'  },
  { slug: 'core-gloss',   name: 'NZPPF Core Gloss',   tag: '3 ANOS · 175μ'  },
  { slug: 'headlight',    name: 'NZPPF Headlight',    tag: '10 ANOS · UV'   },
  { slug: 'windshield',   name: 'NZPPF Windshield',   tag: '2 ANOS · 190μ'  },
];

const sellers = [
  { name: 'JOÃO',    phone: '5511918907565', display: '+55 11 91890-7565' },
  { name: 'DANILLO', phone: '5511953037391', display: '+55 11 95303-7391' },
  { name: 'ERICK',   phone: '5511916777565', display: '+55 11 91677-7565' },
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

  const openWhatsApp = (phone: string, sellerName: string) => {
    const message = encodeURIComponent(
      `Olá ${sellerName}, vim pelo link e quero saber sobre as linhas de NZ PPF.`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

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

      {/* SELLER MODAL */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.92, y: 30, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.96, y: 20, filter: 'blur(6px)' }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className={styles.modalClose}
                onClick={() => setModalOpen(false)}
                aria-label="Fechar"
              >
                <X size={20} />
              </button>

              <div className={styles.modalHeader}>
                <div className={styles.modalBadge}>
                  <MessageCircle size={14} />
                  <span>WHATSAPP</span>
                </div>
                <h2 className={styles.modalTitle}>Fale com um consultor</h2>
                <p className={styles.modalSubtitle}>
                  Escolha um vendedor para iniciar a conversa direto pelo WhatsApp.
                </p>
              </div>

              <div className={styles.sellerList}>
                {sellers.map((s, i) => (
                  <motion.button
                    key={s.phone}
                    className={styles.sellerBtn}
                    onClick={() => openWhatsApp(s.phone, s.name)}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
                    whileHover={{ x: 4 }}
                  >
                    <div className={styles.sellerAvatar}>
                      <span>{s.name.charAt(0)}</span>
                      <span className={styles.sellerStatus} />
                    </div>
                    <div className={styles.sellerInfo}>
                      <span className={styles.sellerName}>{s.name}</span>
                      <span className={styles.sellerPhone}>
                        <Phone size={11} /> {s.display}
                      </span>
                    </div>
                    <div className={styles.sellerWhats}>
                      <MessageCircle size={18} />
                    </div>
                  </motion.button>
                ))}
              </div>

              <p className={styles.modalFootnote}>
                Horário comercial · Seg–Sex · 09h–18h
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
