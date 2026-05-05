import CatalogPage from '../CatalogPage';
import styles from '../Catalog.module.css';
import { benchmarkLines, catalogMeta } from '../data/catalogData';
import { sanitizeCatalogText } from '../textHelpers';
import {
  usePageScale,
  useElementHidden,
  useEditableText,
} from '../useCatalogOverrides';
import EditableText from '../EditableText';

const PAGE_ID = 'benchmark';

interface BenchmarkPageProps {
  pageNumber?: number;
  totalPages?: number;
  qrDataUrl?: string;
}

export default function BenchmarkPage({
  pageNumber = 10,
  totalPages,
  qrDataUrl,
}: BenchmarkPageProps = {}) {
  const scale = usePageScale(PAGE_ID);
  const qrLabelHidden = useElementHidden(PAGE_ID, 'qr.label');
  const qrUrlHidden = useElementHidden(PAGE_ID, 'qr.url');

  return (
    <CatalogPage
      pageNumber={pageNumber}
      totalPages={totalPages}
      pageId={PAGE_ID}
      hideBrand
      style={{ ['--user-scale' as string]: scale }}
    >
      <div className={styles.safeArea} style={{ paddingBottom: 40 }}>
        <div className={styles.pageHeader}>
          <div>
            <EditableText
              pageId={PAGE_ID}
              fieldKey="pageSection"
              defaultValue="10  ·  COMPARATIVO"
              as="div"
              className={styles.pageSection}
            />
            <div className={styles.h2} style={{ marginTop: 16 }}>
              <EditableText pageId={PAGE_ID} fieldKey="h2.l1" defaultValue="PERFORMANCE" />
              <br />
              <EditableText
                pageId={PAGE_ID}
                fieldKey="h2.l2"
                defaultValue="COMPARADA."
                style={{ color: '#D4AF37' }}
              />
            </div>
          </div>
          <EditableText
            pageId={PAGE_ID}
            fieldKey="badge"
            defaultValue="BENCHMARK INTERNO"
            as="div"
            className={styles.darkBadge}
          />
        </div>

        <EditableText
          pageId={PAGE_ID}
          fieldKey="intro"
          defaultValue="Métricas internas, escala 0–100. 100 = topo de cada categoria."
          as="p"
          className={styles.body}
          style={{ maxWidth: 1100, marginTop: 16 }}
        />

        <div className={styles.benchmarkGrid}>
          {benchmarkLines.map((line) => (
            <BenchmarkCard key={line.id} line={line} />
          ))}
        </div>

        {qrDataUrl && !(qrLabelHidden && qrUrlHidden) && (
          <div
            className={styles.sectionQrBlock}
            data-page-link-url={catalogMeta.benchmarkUrl}
            style={{ marginTop: 28 }}
          >
            <div className={styles.sectionQrImg}>
              <img src={qrDataUrl} alt="QR comparativo NZPPF" />
            </div>
            <div className={styles.sectionQrCaption}>
              <EditableText
                pageId={PAGE_ID}
                fieldKey="qr.label"
                defaultValue="FICHA TÉCNICA COMPLETA"
                as="div"
                className={styles.sectionQrLabel}
              />
              <EditableText
                pageId={PAGE_ID}
                fieldKey="qr.url"
                defaultValue="nzgroup.com.br/comparativo"
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

/* ── Card de um benchmark line ── */

interface BenchmarkCardProps {
  line: typeof benchmarkLines[number];
}

function BenchmarkCard({ line }: BenchmarkCardProps) {
  return (
    <div className={styles.benchmarkCard}>
      <div className={styles.benchmarkHeader}>
        <EditableText
          pageId={PAGE_ID}
          fieldKey={`line.${line.id}.name`}
          defaultValue={line.name}
          as="div"
          className={styles.benchmarkName}
          style={{ color: line.accent }}
        />
        <div className={styles.benchmarkSpec}>
          <EditableText
            pageId={PAGE_ID}
            fieldKey={`line.${line.id}.spec`}
            defaultValue={`${line.thickness} · ${line.warranty}`}
            as="span"
            style={{ display: 'block', color: '#D4AF37', fontWeight: 600, marginTop: 2 }}
          />
        </div>
      </div>

      {line.metrics.map((m, i) => (
        <MetricRow key={i} index={i} metric={m} accent={line.accent} />
      ))}

      <EditableText
        pageId={PAGE_ID}
        fieldKey={`line.${line.id}.highlight`}
        defaultValue={line.highlight}
        as="div"
        className={styles.benchmarkHighlight}
        // eslint-disable-next-line react/no-children-prop
        children={(text) => <>“{text}”</>}
      />
    </div>
  );
}

/* ── Linha de métrica (label compartilhado entre os 4 cards + value por linha) ── */

interface MetricRowProps {
  index: number;
  metric: { label: string; value: number };
  accent: string;
}

function MetricRow({ index, metric, accent }: MetricRowProps) {
  // Label de métrica é compartilhado: vem do override `metric.{i}.label` da
  // página, ou do default da própria métrica em data.
  const sharedLabel = useEditableText(PAGE_ID, `metric.${index}.label`, metric.label);
  return (
    <div className={styles.metricRow}>
      <div className={styles.metricLabel}>
        <span data-edit-key={`${PAGE_ID}|metric.${index}.label`}>
          {sanitizeCatalogText(sharedLabel)}
        </span>
        <span className={styles.metricValue} style={{ color: accent }}>
          {metric.value}
        </span>
      </div>
      <div className={styles.metricBar}>
        <div
          className={styles.metricFill}
          style={{
            width: `${metric.value}%`,
            background: `linear-gradient(90deg, rgba(212,175,55,0.4) 0%, ${accent} 100%)`,
          }}
        />
      </div>
    </div>
  );
}
