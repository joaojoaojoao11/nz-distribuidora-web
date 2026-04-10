import { Link } from 'react-router-dom';
import styles from './About.module.css';

export default function About() {
  return (
    <section id="sobre" className={`section ${styles.aboutSection}`}>
      <div className="container">
        <div className={styles.grid}>
          <div className={styles.content}>
            <span className={styles.eyebrow}>Sobre a NZ</span>
            <h2 className={styles.title}>
              Referência nacional em materiais <span className="highlight-text">premium</span>
            </h2>
            <p className={styles.description}>
              A NZ Distribuidora atua com expertise em PPF, envelopamento, películas automotivas e formação profissional. Nossa essência é simples e sólida: entregar produtos de alto padrão e orientação estratégica para que aplicadores e lojistas cresçam com confiança e consistência.
            </p>
            <p className={styles.description}>
              Ao longo da nossa trajetória, conhecemos de perto as dores, desafios e oportunidades do setor automotivo.
            </p>
            
            <div style={{ marginTop: '2rem', marginBottom: '3rem' }}>
              <Link to="/sobre" className={styles.eyebrow} style={{ textDecoration: 'none', color: '#fff', border: '1px solid var(--accent-red)', padding: '12px 24px', borderRadius: '4px' }}>
                Conhecer História Completa →
              </Link>
            </div>
            
            <div className={styles.statsGroup}>
              <div className={styles.statBox}>
                <h4 className={styles.statNumber}>+ 48 Milhões</h4>
                <p className={styles.statLabel}>Vendas Impulsionadas</p>
              </div>
              <div className={styles.statBox}>
                <h4 className={styles.statNumber}>+ 1200</h4>
                <p className={styles.statLabel}>Lojas Atendidas no BR</p>
              </div>
            </div>
          </div>
          
          <div className={styles.imageCol}>
            <img 
              src="/assets/logos/logo-nz-group-base.svg" 
              alt="NZ GROUP Base" 
              className={styles.aboutImage}
              style={{ objectFit: 'contain', padding: '4rem', backgroundColor: 'var(--bg-tertiary)', width: '100%', maxWidth: '350px', maxHeight: '500px' }}
            />
            {/* Efeito de Vidro por cima */}
            <div className={styles.glassEffect}></div>
          </div>
        </div>
      </div>
    </section>
  );
}
