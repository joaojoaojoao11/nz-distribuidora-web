import { motion } from 'framer-motion';
import { staggerContainer, fadeUpItem, cardStagger } from './variants';
import styles from './TechFeatures.module.css';

const features = [
  { numeral: '160μ', label: 'ESPESSURA DUPLA CAMADA', desc: 'Estrutura polimérica com camada de proteção. Padrão premium para uso arquitetônico de longa duração.' },
  { numeral: '8 anos', label: 'VIDA ÚTIL INDOOR', desc: 'Durabilidade certificada em ambiente interno. Estabilidade dimensional e resistência a UV controlado.' },
  { numeral: '48h', label: 'ENTREGA NACIONAL', desc: 'Fábrica Etherna em SP. Prazo padrão de 48h para capitais e principais praças.' },
  { numeral: '40+', label: 'PADRÕES ATIVOS', desc: '40+ padrões Etherna. Curadoria SH Decor com mais famílias e variações premium.' },
  { numeral: '0', label: 'OBRA · QUEBRA · TINTA', desc: 'Aplicação sem intervenção estrutural. Sobre superfície existente. Reversível sem dano.' },
  { numeral: 'AB+AF+AC', label: 'TECNOLOGIA SHIELD®', desc: 'Antibacteriano · Antifúngico · Anti-chamas. Certificação para hospitais, hotéis e corporativo.' },
];

export default function TechFeatures() {
  return (
    <section className={styles.techSection}>
      <motion.div
        className={`container ${styles.techContainer}`}
        variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}
      >
        <motion.div className={styles.techHeader} variants={fadeUpItem}>
          <span className={styles.techTag}>ESPECIFICAÇÃO TÉCNICA</span>
          <h2 className={styles.techTitle}>Sistema de Superfície</h2>
        </motion.div>

        <motion.div className={styles.techGrid} variants={cardStagger}>
          {features.map(f => (
            <motion.div key={f.label} className={styles.techCard} variants={fadeUpItem}>
              <div className={styles.techNumeral}>{f.numeral}</div>
              <div className={styles.techLabel}>{f.label}</div>
              <div className={styles.techDesc}>{f.desc}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
