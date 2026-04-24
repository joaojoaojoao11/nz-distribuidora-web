import CatalogPage from '../CatalogPage';
import styles from '../Catalog.module.css';
import { catalogMeta } from '../data/catalogData';

export default function CoverPage() {
  return (
    <CatalogPage pageNumber={1} hideFooter noBg>
      <div
        className={styles.coverHero}
        style={{ backgroundImage: "url('/assets/images/luxury_lambo.png')" }}
      />
      <div className={styles.coverOverlay} />

      <div className={styles.coverContent}>
        <div className={styles.coverTop}>
          <img src="/assets/logos/logo-nz-ppf.svg" alt="NZPPF" className={styles.coverLogo} />
          <div className={styles.coverEdition}>
            CATÁLOGO<br />OFICIAL<br />2026
          </div>
        </div>

        <div>
          <div className={styles.coverHeadline}>
            PROTEÇÃO<br />
            FEITA PARA<br />
            <span style={{ color: '#D4AF37' }}>O MUNDO REAL.</span>
          </div>
        </div>

        <div className={styles.coverFooterLine}>
          <div>
            <div className={styles.captionMono} style={{ marginBottom: 10 }}>FILMES PPF AUTOMOTIVOS</div>
            <div style={{ fontFamily: 'Outfit', fontWeight: 600, fontSize: 32, color: '#fff', letterSpacing: 1 }}>
              6 LINHAS  ·  ATÉ 12 ANOS DE GARANTIA
            </div>
          </div>
          <div className={styles.coverYear}>{catalogMeta.url}</div>
        </div>
      </div>
    </CatalogPage>
  );
}
