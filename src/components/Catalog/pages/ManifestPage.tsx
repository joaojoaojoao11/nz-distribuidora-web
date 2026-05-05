import CatalogPage from '../CatalogPage';
import styles from '../Catalog.module.css';
import { catalogMeta } from '../data/catalogData';
import { usePageScale, useElementHidden } from '../useCatalogOverrides';
import EditableText from '../EditableText';

const PAGE_ID = 'manifest';

interface ManifestPageProps {
  pageNumber?: number;
  totalPages?: number;
  qrDataUrl?: string;
}

export default function ManifestPage({
  pageNumber = 2,
  totalPages,
  qrDataUrl,
}: ManifestPageProps = {}) {
  const scale = usePageScale(PAGE_ID);
  // Quando o usuário oculta os 3 parágrafos, o container `.manifestText`
  // some também — a regra de hide aqui é por parágrafo individual via
  // EditableText (cada `<p>` tem seu próprio fieldKey).
  const qrHidden = useElementHidden(PAGE_ID, 'qr.label');
  const qrUrlHidden = useElementHidden(PAGE_ID, 'qr.url');

  return (
    <CatalogPage
      pageNumber={pageNumber}
      totalPages={totalPages}
      pageId={PAGE_ID}
      className={styles.manifestPage}
      style={{ ['--user-scale' as string]: scale }}
    >
      <div className={styles.manifestContent}>
        <EditableText
          pageId={PAGE_ID}
          fieldKey="eyebrow"
          defaultValue="MANIFESTO  ·  NZPPF"
          as="div"
          className={styles.eyebrow}
        />

        <div className={styles.manifestTitle}>
          <EditableText pageId={PAGE_ID} fieldKey="title.l1" defaultValue="NASCEU" />
          <br />
          <EditableText pageId={PAGE_ID} fieldKey="title.l2" defaultValue="NA PRÁTICA." />
        </div>

        <div className={styles.manifestText}>
          <EditableText
            pageId={PAGE_ID}
            fieldKey="paragraph.0"
            defaultValue="A maioria nasce em laboratório. NZ PPF nasceu na rua."
            as="p"
          />
          <EditableText
            pageId={PAGE_ID}
            fieldKey="paragraph.1"
            defaultValue="Validado em carro real. Sob calor real. Sem suposições."
            as="p"
          />
          <EditableText
            pageId={PAGE_ID}
            fieldKey="paragraph.2"
            defaultValue="Por isso entrega exatamente o que promete — proteção que você não vê, acabamento que você sente."
            as="p"
          />
        </div>

        <EditableText
          pageId={PAGE_ID}
          fieldKey="signature"
          defaultValue={`${catalogMeta.company}  —  ${catalogMeta.url}`}
          as="div"
          className={styles.manifestSignature}
        />

        {qrDataUrl && !(qrHidden && qrUrlHidden) && (
          <div
            className={styles.sectionQrBlock}
            data-page-link-url={catalogMeta.manifestUrl}
            style={{ marginTop: 60 }}
          >
            <div className={styles.sectionQrImg}>
              <img src={qrDataUrl} alt="QR manifesto NZPPF" />
            </div>
            <div className={styles.sectionQrCaption}>
              <EditableText
                pageId={PAGE_ID}
                fieldKey="qr.label"
                defaultValue="LEIA O MANIFESTO"
                as="div"
                className={styles.sectionQrLabel}
              />
              <EditableText
                pageId={PAGE_ID}
                fieldKey="qr.url"
                defaultValue="nzgroup.com.br/manifesto"
                as="div"
                className={styles.sectionQrUrl}
              />
            </div>
          </div>
        )}
      </div>
    </CatalogPage>
  );
}
