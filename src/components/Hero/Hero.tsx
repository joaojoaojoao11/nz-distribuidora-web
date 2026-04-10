import styles from './Hero.module.css';

export default function Hero() {
  return (
    <section className={styles.heroSection}>
      <div className={styles.heroBackground}>
        <div className={styles.overlay}></div>
      </div>
      
      <div className={`container ${styles.heroContent}`}>
        <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <span className={styles.badge}>Premium PPF & Wrap</span>
          <h1 className={styles.title}>
            MUITO MAIS QUE UMA <br />
            <span className={styles.highlight}>MARCA DE ADESIVOS</span>
          </h1>
          <p className={styles.subtitle}>
            A NZ Distribuidora é referência nacional em materiais premium para o segmento automotivo. Nossa prioridade é o seu crescimento.
          </p>
          
          <div className={styles.ctaGroup}>
            <a href="https://wa.me/message/3DBGPIZF4EMWO1" target="_blank" rel="noreferrer" className={styles.primaryBtn}>
              Seja um Lojista Parceiro
            </a>
            <a href="#linhas" className={styles.secondaryBtn}>
              Conheça as Linhas
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
