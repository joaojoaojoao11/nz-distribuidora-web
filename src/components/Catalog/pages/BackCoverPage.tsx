import CatalogPage from '../CatalogPage';
import styles from '../Catalog.module.css';
import { catalogMeta } from '../data/catalogData';

interface BackCoverPageProps {
  qrDataUrl: string;
  pageNumber?: number;
  totalPages?: number;
}

/**
 * Contracapa.
 * Redesign:
 *   • Badge dourada "ATÉ 12 ANOS DE GARANTIA" reforça o ativo principal.
 *   • Bloco unificado de CTA (label + QR + URL) substitui os 3 elementos
 *     soltos no meio da página.
 *   • Footer com hierarquia: NZGROUP em destaque + edição menor.
 *   • Divider dourado curto após o logo cria ritmo visual.
 */
export default function BackCoverPage({
  qrDataUrl,
  pageNumber = 14,
  totalPages,
}: BackCoverPageProps) {
  return (
    <CatalogPage pageNumber={pageNumber} totalPages={totalPages} hideFooter noBg>
      <div className={styles.safeArea}>
        <div className={styles.backCoverContent}>
          <div>
            <img
              src="/assets/logos/logo-nz-ppf.svg"
              alt="NZPPF"
              className={styles.backCoverLogo}
            />
            <div className={styles.backCoverDivider} aria-hidden />
            <div className={styles.backCoverEyebrow}>VISITE O SITE OFICIAL</div>
            <div className={styles.backCoverTagline}>
              SUA OBRA-PRIMA<br />
              MERECE O <span style={{ color: '#D4AF37' }}>PPF</span><br />
              QUE FOI FEITO PRA ELA.
            </div>
          </div>

          <div className={styles.backCoverWarranty}>
            ATÉ 12 ANOS DE GARANTIA
          </div>

          <div className={styles.backCoverCtaBlock}>
            <div className={styles.backCoverCtaLabel}>
              ESCANEIE PARA EXPLORAR
            </div>
            <div className={styles.backCoverCtaQr}>
              {qrDataUrl ? <img src={qrDataUrl} alt="QR Code" /> : null}
            </div>
            <div className={styles.backCoverCtaUrl}>{catalogMeta.url}</div>
          </div>

          <div className={styles.backCoverFootV2}>
            <div className={styles.backCoverFootCompany}>
              {catalogMeta.company}
            </div>
            <div className={styles.backCoverFootEdition}>
              CATÁLOGO NZPPF · EDIÇÃO 2026
            </div>
          </div>
        </div>
      </div>
    </CatalogPage>
  );
}
