import { motion } from 'framer-motion';
import styles from './Differentials.module.css';

const blurReveal = {
  hidden: { opacity: 0, y: 20, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } }
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.15 } }
};

const cards = [
  {
    title: 'Curadoria Nacional',
    desc: 'Acesso a qualquer cor de envelopamento do mundo. O maior portfólio do Brasil à sua disposição.',
    icon: '/assets/simbolos/simbolo-escudo-vazio.svg',
    accent: 'Exclusividade',
    large: true
  },
  {
    title: 'Consultoria Técnica',
    desc: 'Suporte especializado gratuito para lojistas e aplicadores profissionais.',
    icon: '/assets/simbolos/simbolo-certo.svg',
    accent: 'Suporte'
  },
  {
    title: 'Logística Nacional',
    desc: 'Entrega rápida para todo o Brasil com rastreamento em tempo real.',
    icon: '/assets/simbolos/simbolo-repelencia.svg',
    accent: 'Velocidade'
  },
  {
    title: 'Formação Profissional',
    desc: 'Treinamentos e workshops para elevar o padrão técnico da sua equipe.',
    icon: '/assets/simbolos/simbolo-regeneracao.svg',
    accent: 'Educação'
  },
  {
    title: 'Portfólio Completo',
    desc: 'PPF, Wrap, Películas e materiais auxiliares em um único fornecedor.',
    icon: '/assets/simbolos/simbolo-camada.svg',
    accent: 'One-Stop-Shop',
    large: true
  },
  {
    title: 'Garantia de Qualidade',
    desc: 'Materiais certificados com garantia de fábrica e procedência comprovada.',
    icon: '/assets/simbolos/simbolo-presente.svg',
    accent: 'Certificação'
  }
];

export default function Differentials() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <motion.div
          className={styles.header}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.5 }}
          variants={stagger}
        >
          <motion.span className={styles.eyebrow} variants={blurReveal}>POR QUE A NZ</motion.span>
          <motion.h2 className={styles.title} variants={blurReveal}>
            Diferenciais que <span className={styles.gold}>movem o mercado</span>
          </motion.h2>
        </motion.div>

        <motion.div
          className={styles.bentoGrid}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          variants={stagger}
        >
          {cards.map((card, i) => (
            <motion.div
              key={i}
              className={`${styles.bentoCard} ${card.large ? styles.bentoLarge : ''}`}
              variants={blurReveal}
            >
              <div className={styles.cardIcon}>
                <img src={card.icon} alt="" />
              </div>
              <span className={styles.cardAccent}>{card.accent}</span>
              <h3 className={styles.cardTitle}>{card.title}</h3>
              <p className={styles.cardDesc}>{card.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
