import CatalogPage from '../CatalogPage';
import styles from '../Catalog.module.css';
import { exclusiveDifferentials } from '../data/catalogData';
import { safeSpacing, sanitizeCatalogText } from '../textHelpers';

export default function DifferentiatorsPage() {
  return (
    <CatalogPage pageNumber={11}>
      <div className={styles.safeArea}>
        <div className={styles.pageHeader}>
          <div>
            <div className={styles.pageSection}>11  ·  DIFERENCIAIS</div>
            <div className={styles.h2} style={{ marginTop: 16 }}>
              DIFERENCIAIS<br />
              <span style={{ color: '#D4AF37' }}>EXCLUSIVOS.</span>
            </div>
          </div>
          <div className={styles.darkBadge}>NZPPF · ENGINEERED</div>
        </div>

        <p className={styles.body} style={{ maxWidth: 1100, marginTop: 16 }}>
          {safeSpacing('O que torna um filme NZ PPF reconhecível mesmo sem rótulo: quatro decisões de engenharia presentes em todas as linhas — do Core ao Luxury.')}
        </p>

        <div className={styles.exclusiveGrid}>
          {exclusiveDifferentials.map((d, i) => (
            <div key={i} className={styles.exclusiveCard}>
              <div>
                <img src={d.icon} alt="" className={styles.exclusiveCardIcon} />
                <h3 className={styles.exclusiveCardTitle}>{sanitizeCatalogText(d.title)}</h3>
                <p className={styles.exclusiveCardDesc}>{safeSpacing(d.desc)}</p>
              </div>
              <div style={{
                marginTop: 30,
                paddingTop: 20,
                borderTop: '1px solid rgba(212,175,55,0.18)',
                fontFamily: 'Inter',
                fontSize: 16,
                letterSpacing: 4,
                textTransform: 'uppercase',
                color: '#D4AF37',
                fontWeight: 500
              }}>
                0{i + 1} / 04
              </div>
            </div>
          ))}
        </div>
      </div>
    </CatalogPage>
  );
}
