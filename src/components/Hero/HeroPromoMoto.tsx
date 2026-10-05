import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import styles from './HeroPromoMoto.module.css';

// Anúncio da Ação envelopamento de moto no hero da home (João, 04/10/2026).
// Fotos: miniaturas leves das fotos de moto da loja (public/assets/images/home/acao-moto-N.webp).
// Leva para a loja no modo da ação — o mesmo destino do link da bio (/acao-moto).
const FOTOS = [1, 2, 3, 4, 5].map((n) => `/assets/images/home/acao-moto-${n}.webp`);
const TROCA_MS = 3200;

export default function HeroPromoMoto() {
  const [atual, setAtual] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setAtual((i) => (i + 1) % FOTOS.length), TROCA_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <motion.div
      className={styles.wrap}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link to="/loja?promo=moto" className={styles.card} aria-label="Ação envelopamento de moto: ver as cores na loja">
        <div className={styles.fotos} aria-hidden="true">
          {FOTOS.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              className={`${styles.foto} ${i === atual ? styles.fotoAtiva : ''}`}
              loading={i === 0 ? 'eager' : 'lazy'}
              decoding="async"
            />
          ))}
        </div>

        <div className={styles.texto}>
          <span className={styles.eyebrow}>AÇÃO</span>
          <strong className={styles.titulo}>Envelopamento de moto</strong>
          <span className={styles.sub}>Cores selecionadas com condição especial no metro.</span>
          <span className={styles.selo}>Material importado · 3 anos de garantia</span>
          <span className={styles.cta}>
            VER AS CORES <span aria-hidden="true">→</span>
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
