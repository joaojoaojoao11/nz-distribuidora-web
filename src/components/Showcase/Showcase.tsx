import { Link } from 'react-router-dom';
import styles from './Showcase.module.css';

const lines = [
  {
    id: 'ppf',
    title: 'NZ PPF',
    subtitle: 'Linha de Proteção de Pintura',
    description: 'A barreira definitiva contra riscos, pedras e desgaste diário. Alta performance com acabamento invisível.',
    image: '/assets/logos/logo-nz-ppf.svg',
    isLogo: true,
    link: '/ppf'
  },
  {
    id: 'wrap',
    title: 'NZ WRAP',
    subtitle: 'Materiais para Envelopamento',
    description: 'Cores profundas, texturas ultrarrealistas e aplicação premium. Para projetos que demandam perfeição.',
    image: '/assets/logos/logo-nz-wrap.svg',
    isLogo: true,
    link: '/wrap'
  }
];

export default function Showcase() {
  return (
    <section id="linhas" className={`section ${styles.showcaseSection}`}>
      <div className="container">
        <div className={styles.header}>
          <h2 className={styles.sectionTitle}>
            O que podemos <span className="highlight-text">te oferecer</span>
          </h2>
          <p className={styles.sectionSubtitle}>
            Soluções completas e certificadas para lojistas e aplicadores.
          </p>
        </div>

        <div className={styles.grid}>
          {lines.map((line) => (
            <Link key={line.id} to={line.link} className={styles.card}>
              <div className={styles.imageWrapper}>
                <img 
                  src={line.image} 
                  alt={line.title} 
                  className={`${styles.image} ${line.isLogo ? styles.imageLogo : ''}`} 
                />
                {!line.isLogo && <div className={styles.overlay}></div>}
              </div>
              <div className={styles.content}>
                <span className={styles.eyebrow}>{line.subtitle}</span>
                <h3 className={styles.cardTitle}>{line.title}</h3>
                <p className={styles.cardDesc}>{line.description}</p>
                <div className={styles.actionBtn}>
                  Saiba mais
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
