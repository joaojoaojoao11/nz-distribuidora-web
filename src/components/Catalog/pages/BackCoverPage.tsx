import CatalogPage from '../CatalogPage';
import styles from '../Catalog.module.css';
import { catalogMeta } from '../data/catalogData';

interface BackCoverPageProps {
  qrDataUrl: string;
}

export default function BackCoverPage({ qrDataUrl }: BackCoverPageProps) {
  return (
    <CatalogPage pageNumber={14} hideFooter noBg>
      <div className={styles.safeArea}>
        <div className={styles.backCoverContent}>
          <div>
            <img
              src="/assets/logos/logo-nz-ppf.svg"
              alt="NZPPF"
              className={styles.backCoverLogo}
            />
            <div className={styles.backCoverEyebrow}>VISITE O SITE OFICIAL</div>
            <div className={styles.backCoverTagline}>
              SUA OBRA-PRIMA<br />
              MERECE O <span style={{ color: '#D4AF37' }}>PPF</span><br />
              QUE FOI FEITO PRA ELA.
            </div>
          </div>

          <div className={styles.backCoverQr}>
            {qrDataUrl ? <img src={qrDataUrl} alt="QR Code" /> : null}
          </div>

          <div className={styles.backCoverContact}>
            <div className={styles.url}>{catalogMeta.url}</div>
            <div style={{
              marginTop: 24,
              paddingTop: 24,
              borderTop: '1px solid rgba(212,175,55,0.25)',
              fontFamily: 'Inter',
              fontSize: 24,
              letterSpacing: 5,
              textTransform: 'uppercase',
              color: 'rgba(245,245,247,0.4)'
            }}>
              {catalogMeta.company}  ·  CATÁLOGO NZPPF 2026
            </div>
          </div>
        </div>
      </div>
    </CatalogPage>
  );
}
