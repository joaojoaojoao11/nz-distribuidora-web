import CatalogPage from '../CatalogPage';
import styles from '../Catalog.module.css';
import { productLines } from '../data/catalogData';
import { usePageScale } from '../useCatalogOverrides';
import EditableText from '../EditableText';

const PAGE_ID = 'lines-overview';

interface LinesOverviewPageProps {
  pageNumber?: number;
  totalPages?: number;
}

export default function LinesOverviewPage({ pageNumber = 3, totalPages }: LinesOverviewPageProps = {}) {
  const scale = usePageScale(PAGE_ID);

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
              defaultValue="03  ·  AS LINHAS"
              as="div"
              className={styles.pageSection}
            />
            <div className={styles.h2} style={{ marginTop: 16 }}>
              <EditableText pageId={PAGE_ID} fieldKey="h2.l1" defaultValue="SEIS LINHAS" />
              <br />
              <EditableText
                pageId={PAGE_ID}
                fieldKey="h2.l2"
                defaultValue="UMA FILOSOFIA."
                style={{ color: '#D4AF37' }}
              />
            </div>
          </div>
          <EditableText
            pageId={PAGE_ID}
            fieldKey="badge"
            defaultValue="NZPPF / 2026"
            as="div"
            className={styles.darkBadge}
          />
        </div>

        <EditableText
          pageId={PAGE_ID}
          fieldKey="intro"
          defaultValue="Da proteção essencial ao acabamento absoluto: cada linha foi projetada para um perfil de uso e necessidade específicos."
          as="p"
          className={styles.body}
          style={{ maxWidth: 1100, marginTop: 16 }}
        />

        <div className={styles.linesGrid}>
          {productLines.map((line) => {
            const cleanTitle = line.title.replace(/^NZ ?PPF /, '');
            return (
              <div key={line.slug} className={styles.lineCard}>
                <div
                  className={styles.lineCardImg}
                  style={{ backgroundImage: `url('${line.image}')` }}
                />
                <div className={styles.lineCardBody}>
                  <div>
                    <EditableText
                      pageId={PAGE_ID}
                      fieldKey={`card.${line.slug}.title`}
                      defaultValue={cleanTitle}
                      as="div"
                      className={styles.lineCardTitle}
                    />
                    <EditableText
                      pageId={PAGE_ID}
                      fieldKey={`card.${line.slug}.subtitle`}
                      defaultValue={line.subtitle}
                      as="div"
                      className={styles.lineCardSub}
                    />
                  </div>
                  <div className={styles.lineCardFooter}>
                    <EditableText
                      pageId={PAGE_ID}
                      fieldKey={`card.${line.slug}.warranty`}
                      defaultValue={line.warranty}
                      as="div"
                      className={styles.lineCardWarranty}
                    />
                    <EditableText
                      pageId={PAGE_ID}
                      fieldKey={`card.${line.slug}.thickness`}
                      defaultValue={`${line.thickness} TPU`}
                      as="div"
                      className={styles.lineCardThickness}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </CatalogPage>
  );
}
