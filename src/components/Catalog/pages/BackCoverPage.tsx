import CatalogPage from '../CatalogPage';
import styles from '../Catalog.module.css';
import { catalogMeta } from '../data/catalogData';
import {
  usePageScale,
  useEditableText,
} from '../useCatalogOverrides';
import EditableText from '../EditableText';

const PAGE_ID = 'backcover';

interface BackCoverPageProps {
  qrDataUrl: string;
  pageNumber?: number;
  totalPages?: number;
}

export default function BackCoverPage({
  qrDataUrl,
  pageNumber = 14,
  totalPages,
}: BackCoverPageProps) {
  const scale = usePageScale(PAGE_ID);
  // L2 da tagline mantém "PPF" em dourado quando o usuário inclui o token.
  const taglineL2 = useEditableText(PAGE_ID, 'tagline.l2', 'MERECE O PPF');

  const renderTaglineL2 = () => {
    const idx = taglineL2.indexOf('PPF');
    if (idx === -1) return taglineL2;
    return (
      <>
        {taglineL2.slice(0, idx)}
        <span style={{ color: '#D4AF37' }}>PPF</span>
        {taglineL2.slice(idx + 3)}
      </>
    );
  };

  return (
    <CatalogPage
      pageNumber={pageNumber}
      totalPages={totalPages}
      hideFooter
      noBg
      style={{ ['--user-scale' as string]: scale }}
    >
      <div className={styles.safeArea}>
        <div className={styles.backCoverContent}>
          <div>
            <img
              src="/assets/logos/logo-nzppf-tamanho-certo.svg"
              alt="NZPPF"
              className={styles.backCoverLogo}
            />
            <div className={styles.backCoverDivider} aria-hidden />
            <EditableText
              pageId={PAGE_ID}
              fieldKey="eyebrow"
              defaultValue="VISITE O SITE OFICIAL"
              as="div"
              className={styles.backCoverEyebrow}
            />
            <div className={styles.backCoverTagline}>
              <EditableText pageId={PAGE_ID} fieldKey="tagline.l1" defaultValue="SUA OBRA-PRIMA" />
              <br />
              {/* L2 com renderização especial pra manter "PPF" dourado */}
              <span data-edit-key={`${PAGE_ID}|tagline.l2`}>
                {renderTaglineL2()}
              </span>
              <br />
              <EditableText pageId={PAGE_ID} fieldKey="tagline.l3" defaultValue="QUE FOI FEITO PRA ELA." />
            </div>
          </div>

          <EditableText
            pageId={PAGE_ID}
            fieldKey="warranty.badge"
            defaultValue="ATÉ 12 ANOS DE GARANTIA"
            as="div"
            className={styles.backCoverWarranty}
          />

          <div className={styles.backCoverCtaBlock}>
            <EditableText
              pageId={PAGE_ID}
              fieldKey="cta.label"
              defaultValue="ESCANEIE PARA EXPLORAR"
              as="div"
              className={styles.backCoverCtaLabel}
            />
            <div
              className={styles.backCoverCtaQr}
              data-page-link-url={catalogMeta.baseUrl}
            >
              {qrDataUrl ? <img src={qrDataUrl} alt="QR Code" /> : null}
            </div>
            <EditableText
              pageId={PAGE_ID}
              fieldKey="cta.url"
              defaultValue={catalogMeta.url}
              as="div"
              className={styles.backCoverCtaUrl}
            />
          </div>

          <div className={styles.backCoverFootV2}>
            <EditableText
              pageId={PAGE_ID}
              fieldKey="footer.company"
              defaultValue={catalogMeta.company}
              as="div"
              className={styles.backCoverFootCompany}
            />
            <EditableText
              pageId={PAGE_ID}
              fieldKey="footer.edition"
              defaultValue="CATÁLOGO NZPPF · EDIÇÃO 2026"
              as="div"
              className={styles.backCoverFootEdition}
            />
          </div>
        </div>
      </div>
    </CatalogPage>
  );
}
