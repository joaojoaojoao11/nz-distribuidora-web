import CatalogPage from '../CatalogPage';
import styles from '../Catalog.module.css';
import { exclusiveDifferentials, catalogMeta } from '../data/catalogData';
import {
  usePageScale,
  useElementHidden,
} from '../useCatalogOverrides';
import EditableText from '../EditableText';

const PAGE_ID = 'differentials';

interface DifferentiatorsPageProps {
  pageNumber?: number;
  totalPages?: number;
  qrDataUrl?: string;
}

export default function DifferentiatorsPage({
  pageNumber = 11,
  totalPages,
  qrDataUrl,
}: DifferentiatorsPageProps = {}) {
  const scale = usePageScale(PAGE_ID);
  const qrLabelHidden = useElementHidden(PAGE_ID, 'qr.label');
  const qrUrlHidden = useElementHidden(PAGE_ID, 'qr.url');

  return (
    <CatalogPage
      pageNumber={pageNumber}
      totalPages={totalPages}
      pageId={PAGE_ID}
      style={{ ['--user-scale' as string]: scale }}
    >
      <div className={styles.safeArea}>
        <div className={styles.pageHeader}>
          <div>
            <EditableText
              pageId={PAGE_ID}
              fieldKey="pageSection"
              defaultValue="11  ·  DIFERENCIAIS"
              as="div"
              className={styles.pageSection}
            />
            <div className={styles.h2} style={{ marginTop: 16 }}>
              <EditableText pageId={PAGE_ID} fieldKey="h2.l1" defaultValue="DIFERENCIAIS" />
              <br />
              <EditableText
                pageId={PAGE_ID}
                fieldKey="h2.l2"
                defaultValue="EXCLUSIVOS"
                style={{ color: '#D4AF37' }}
              />
            </div>
          </div>
          <EditableText
            pageId={PAGE_ID}
            fieldKey="badge"
            defaultValue="NZPPF · ENGINEERED"
            as="div"
            className={styles.darkBadge}
          />
        </div>

        <EditableText
          pageId={PAGE_ID}
          fieldKey="intro"
          defaultValue="O que torna um filme NZ PPF reconhecível mesmo sem rótulo: quatro decisões de engenharia presentes em todas as linhas — do Core ao Luxury."
          as="p"
          className={styles.body}
          style={{ maxWidth: 1100, marginTop: 16 }}
        />

        <div className={styles.exclusiveGrid}>
          {exclusiveDifferentials.map((d, i) => (
            <DifferentialCard key={i} index={i} d={d} />
          ))}
        </div>

        {qrDataUrl && !(qrLabelHidden && qrUrlHidden) && (
          <div
            className={styles.sectionQrBlock}
            data-page-link-url={catalogMeta.differentialsUrl}
            style={{ marginTop: 32 }}
          >
            <div className={styles.sectionQrImg}>
              <img src={qrDataUrl} alt="QR diferenciais NZPPF" />
            </div>
            <div className={styles.sectionQrCaption}>
              <EditableText
                pageId={PAGE_ID}
                fieldKey="qr.label"
                defaultValue="DETALHAMENTO TÉCNICO"
                as="div"
                className={styles.sectionQrLabel}
              />
              <EditableText
                pageId={PAGE_ID}
                fieldKey="qr.url"
                defaultValue="nzgroup.com.br/diferenciais"
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

interface DiffCardProps {
  index: number;
  d: typeof exclusiveDifferentials[number];
}

function DifferentialCard({ index, d }: DiffCardProps) {
  const numStr = String(index + 1).padStart(2, '0');
  const titleHidden = useElementHidden(PAGE_ID, `diff.${index}.title`);
  const chipHidden = useElementHidden(PAGE_ID, `diff.${index}.chip`);
  const descHidden = useElementHidden(PAGE_ID, `diff.${index}.desc`);
  if (titleHidden && chipHidden && descHidden) return null;

  const chipDefault = (d.line || '')
    .replace(/^PRESENTE EM:\s*/i, '')
    .replace(/^EXCLUSIVO DA LINHA:\s*/i, 'EXCLUSIVO · ')
    .replace(/^PRESENTE EM\s+/i, '')
    .trim();

  return (
    <div className={styles.exclusiveCardV2}>
      <div className={styles.exclusiveCardNumBg} aria-hidden>
        {numStr}
      </div>
      <img src={d.icon} alt="" className={styles.exclusiveCardIconV2} />
      <EditableText
        pageId={PAGE_ID}
        fieldKey={`diff.${index}.title`}
        defaultValue={d.title}
        as="h3"
        className={styles.exclusiveCardTitleV2}
      />
      {chipDefault && (
        <EditableText
          pageId={PAGE_ID}
          fieldKey={`diff.${index}.chip`}
          defaultValue={chipDefault}
          as="div"
          className={styles.exclusiveCardChip}
        />
      )}
      <EditableText
        pageId={PAGE_ID}
        fieldKey={`diff.${index}.desc`}
        defaultValue={d.desc}
        as="p"
        className={styles.exclusiveCardDescV2}
      />
    </div>
  );
}
