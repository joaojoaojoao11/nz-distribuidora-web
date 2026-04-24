import CatalogPage from '../CatalogPage';
import styles from '../Catalog.module.css';
import { productLines } from '../data/catalogData';
import { safeSpacing, sanitizeCatalogText } from '../textHelpers';

export default function LinesOverviewPage() {
  return (
    <CatalogPage pageNumber={3}>
      <div className={styles.safeArea}>
        <div className={styles.pageHeader}>
          <div>
            <div className={styles.pageSection}>03  ·  AS LINHAS</div>
            <div className={styles.h2} style={{ marginTop: 16 }}>
              SEIS LINHAS<br />
              <span style={{ color: '#D4AF37' }}>UMA FILOSOFIA.</span>
            </div>
          </div>
          <div className={styles.darkBadge}>NZPPF / 2026</div>
        </div>

        <p className={styles.body} style={{ maxWidth: 1100, marginTop: 16 }}>
          {safeSpacing('Da proteção essencial ao acabamento absoluto: cada linha foi projetada para um perfil de uso e necessidade específicos.')}
        </p>

        <div className={styles.linesGrid}>
          {productLines.map((line) => (
            <div key={line.slug} className={styles.lineCard}>
              <div
                className={styles.lineCardImg}
                style={{ backgroundImage: `url('${line.image}')` }}
              />
              <div className={styles.lineCardBody}>
                <div>
                  <div className={styles.lineCardTitle}>{sanitizeCatalogText(line.title.replace('NZPPF ', '').replace('NZ PPF ', ''))}</div>
                  <div className={styles.lineCardSub}>{sanitizeCatalogText(line.subtitle)}</div>
                </div>
                <div className={styles.lineCardFooter}>
                  <div className={styles.lineCardWarranty}>{sanitizeCatalogText(line.warranty)}</div>
                  <div className={styles.lineCardThickness}>{sanitizeCatalogText(line.thickness)} TPU</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </CatalogPage>
  );
}
