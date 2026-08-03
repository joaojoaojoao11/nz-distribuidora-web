import { motion } from 'framer-motion';
import { staggerContainer, fadeUpItem, cardStagger, scaleReveal } from './variants';
import styles from './EnterpriseProjects.module.css';

const WHATSAPP_PROJETOS_URL = 'https://wa.me/5511920707565?text=Ol%C3%A1%2C%20tenho%20um%20projeto%20de%20hotelaria%20ou%20franquia%20e%20quero%20execu%C3%A7%C3%A3o%20com%20garantia%20total%20NZDecor.';

const pillars = [
  {
    num: '01',
    title: 'Mão de obra homologada',
    desc: 'Aplicadores treinados e credenciados pela NZ. A mesma qualidade de execução no quarto 101 e no quarto 1201 — em qualquer praça do país.',
  },
  {
    num: '02',
    title: 'Padrão internacional',
    desc: 'Corte, junção e acabamento auditados por checklist técnico. Seu produto entregue no nível de acabamento das redes globais.',
  },
  {
    num: '03',
    title: 'Garantia total',
    desc: 'Material fornecido e mão de obra cobertos na mesma garantia. Um contrato, um responsável — zero disputa entre fornecedor e instalador.',
  },
];

export default function EnterpriseProjects() {
  return (
    <section className={styles.enterpriseSection}>
      <motion.div
        className={`container ${styles.enterpriseContainer}`}
        variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}
      >
        <div className={styles.enterpriseGrid}>
          <motion.div className={styles.enterpriseText} variants={fadeUpItem}>
            <span className={styles.enterpriseTag}>PROJETOS EM ESCALA</span>
            <h2 className={styles.enterpriseTitle}>
              Hotelaria e franquias não toleram improviso.
            </h2>
            <p className={styles.enterpriseParagraph}>
              Em grandes projetos, o material é metade da equação. A outra metade é quem aplica. Um quarto refeito fora do padrão, uma loja entregue fora do prazo — o custo da mão de obra desqualificada aparece depois, quando corrigir é caro.
            </p>
            <p className={styles.enterpriseParagraph}>
              Com a NZDecor, o projeto sai completo: vinil especificado + aplicadores qualificados + <strong>garantia total cobrindo material fornecido e mão de obra</strong>. Seu produto entregue com padrão internacional, do piloto à escala nacional.
            </p>
            <a href={WHATSAPP_PROJETOS_URL} target="_blank" rel="noopener noreferrer" className={styles.enterpriseLink}>
              Falar com a equipe de projetos →
            </a>
          </motion.div>

          <motion.div className={styles.pillarList} variants={cardStagger}>
            {pillars.map(p => (
              <motion.div key={p.num} className={styles.pillarCard} variants={scaleReveal}>
                <div className={styles.pillarNum}>{p.num}</div>
                <div className={styles.pillarContent}>
                  <h3 className={styles.pillarTitle}>{p.title}</h3>
                  <p className={styles.pillarDesc}>{p.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
