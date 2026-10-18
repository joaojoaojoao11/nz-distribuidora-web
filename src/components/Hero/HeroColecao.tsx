import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LANCAMENTO, imagemCla } from '../../pages/Colecao/colecaoConfig';
import styles from './HeroColecao.module.css';

// Aviso da Coleção NZPPF 2026 · Os Clãs no hero da home (João, 17/10/2026).
// Convive com o anúncio da ação de moto: no computador fica no canto inferior
// direito (acima do WhatsApp); em tela menor, faixa compacta no alto do hero.
// Antes de 29/10 18h chama para a lista de espera; depois, para escolher o clã.
// utm_source=home vira a "origem" do cadastro na lista (leads_colecao_2026).
const FOTOS = ([1, 2, 3, 4, 5] as const).map((n) => imagemCla(n, 'costas'));
const TROCA_MS = 2800;

export default function HeroColecao() {
  const [atual, setAtual] = useState(0);
  const [lancado, setLancado] = useState(() => Date.now() >= LANCAMENTO.getTime());

  useEffect(() => {
    const id = window.setInterval(() => setAtual((i) => (i + 1) % FOTOS.length), TROCA_MS);
    return () => window.clearInterval(id);
  }, []);

  // Vira sozinho na hora do lançamento, mesmo com a página aberta.
  useEffect(() => {
    if (lancado) return;
    const falta = LANCAMENTO.getTime() - Date.now();
    if (falta > 2 ** 31 - 1) return;
    const id = window.setTimeout(() => setLancado(true), Math.max(0, falta));
    return () => window.clearTimeout(id);
  }, [lancado]);

  return (
    <motion.div
      className={styles.wrap}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        to="/colecao?utm_source=home"
        className={styles.card}
        aria-label={
          lancado
            ? 'Coleção NZPPF 2026 · Os Clãs: já disponível, escolha o seu clã'
            : 'Coleção NZPPF 2026 · Os Clãs: lançamento quinta, 29/10, às 18h. Entrar na lista'
        }
      >
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
          <span className={styles.eyebrow}>{lancado ? 'JÁ DISPONÍVEL' : 'NOVA COLEÇÃO'}</span>
          <strong className={styles.titulo}>NZPPF 2026 · Os Clãs</strong>
          <span className={styles.sub}>
            {lancado
              ? 'Cinco camisetas, cinco clãs. Qual é o seu?'
              : 'Cinco camisetas, cinco clãs. Lançamento quinta, 29/10, às 18h.'}
          </span>
          <span className={styles.cta}>
            {lancado ? 'ESCOLHA O SEU CLÃ' : 'ENTRAR NA LISTA'} <span aria-hidden="true">→</span>
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
