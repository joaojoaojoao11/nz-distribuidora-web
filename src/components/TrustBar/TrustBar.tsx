import styles from './TrustBar.module.css';

const partners = [
  { name: 'ORACAL', logo: '/assets/logos/logo-nz-wrap.svg' },
  { name: 'SH Wrapping', logo: '/assets/logos/logo-nz-ppf.svg' },
  { name: 'NZ PPF', logo: '/assets/logos/logo-nz-ppf.svg' },
  { name: 'NZ WRAP', logo: '/assets/logos/logo-nz-wrap.svg' },
  { name: 'ORACAL', logo: '/assets/logos/logo-nz-wrap.svg' },
  { name: 'SH Wrapping', logo: '/assets/logos/logo-nz-ppf.svg' },
];

export default function TrustBar() {
  const doubledPartners = [...partners, ...partners];

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <span className={styles.eyebrow}>MARCAS QUE TRABALHAMOS</span>
      </div>
      <div className={styles.marqueeWrapper}>
        <div className={styles.marqueeTrack}>
          {doubledPartners.map((p, i) => (
            <div key={i} className={styles.marqueeLogo}>
              <img src={p.logo} alt={p.name} />
            </div>
          ))}
        </div>
      </div>
      <div className={styles.container}>
        <div className={styles.badges}>
          <div className={styles.badge}>
            <img src="/assets/simbolos/simbolo-certo.svg" alt="" className={styles.badgeIcon} />
            <span>Distribuidor Oficial</span>
          </div>
          <div className={styles.badge}>
            <img src="/assets/simbolos/simbolo-escudo-vazio.svg" alt="" className={styles.badgeIcon} />
            <span>Garantia de Fábrica</span>
          </div>
          <div className={styles.badge}>
            <img src="/assets/simbolos/simbolo-repelencia.svg" alt="" className={styles.badgeIcon} />
            <span>Envio Nacional</span>
          </div>
        </div>
      </div>
    </section>
  );
}
