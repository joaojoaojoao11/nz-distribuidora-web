import { motion } from 'framer-motion';
import { staggerContainer, fadeUpItem, cardStagger, scaleReveal } from './variants';
import styles from './ApplicationGrid.module.css';

const segments = [
  { key: 'res', label: 'RESIDENCIAL', title: 'Alto padrão residencial', desc: 'Cozinhas, quartos, closets, home offices. Renovação sem obra em projetos premium.', img: '/assets/images/decor/decor_seg_residencial.jpg' },
  { key: 'corp', label: 'CORPORATIVO', title: 'Ambientes de trabalho', desc: 'Salas de reunião, recepção, retrofit rápido de escritório. Sem parada operacional.', img: '/assets/images/decor/decor_seg_corporativo.jpg' },
  { key: 'hot', label: 'HOTELARIA', title: 'Hospitalidade', desc: 'Quartos, corredores, lobby. Vinil antifúngico e atóxico compatível com giro hoteleiro.', img: '/assets/images/decor/decor_seg_hotelaria.jpg' },
  { key: 'ret', label: 'RETAIL', title: 'Franquias e varejo', desc: 'Padronização em escala nacional. Controle de código e lote para múltiplas praças.', img: '/assets/images/decor/decor_seg_retail.jpg' },
];

export default function ApplicationGrid() {
  return (
    <section className={styles.segmentsSection}>
      <motion.div
        className={`container ${styles.segmentsContainer}`}
        variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}
      >
        <motion.div className={styles.segmentsHeader} variants={fadeUpItem}>
          <span className={styles.segmentsTag}>SEGMENTOS DE APLICAÇÃO</span>
          <h2 className={styles.segmentsTitle}>Onde a NZDecor atua</h2>
        </motion.div>

        <motion.div className={styles.segmentsGrid} variants={cardStagger}>
          {segments.map(s => (
            <motion.div key={s.key} className={styles.segmentCard} variants={scaleReveal}>
              <img src={s.img} alt={s.title} className={styles.segmentImage} loading="lazy" />
              <div className={styles.segmentOverlay}></div>
              <div className={styles.segmentContent}>
                <span className={styles.segmentLabel}>{s.label}</span>
                <h3 className={styles.segmentName}>{s.title}</h3>
                <p className={styles.segmentDesc}>{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
