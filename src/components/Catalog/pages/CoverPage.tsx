import CatalogPage from '../CatalogPage';
import styles from '../Catalog.module.css';
import { catalogMeta } from '../data/catalogData';
import { usePageScale } from '../useCatalogOverrides';
import EditableText from '../EditableText';
import EditableElement from '../EditableElement';

const PAGE_ID = 'cover';

interface CoverPageProps {
  pageNumber?: number;
  totalPages?: number;
}

export default function CoverPage({ pageNumber = 1, totalPages }: CoverPageProps = {}) {
  const scale = usePageScale(PAGE_ID);

  return (
    <CatalogPage
      pageNumber={pageNumber}
      totalPages={totalPages}
      hideFooter
      noBg
      style={{ ['--user-scale' as string]: scale }}
    >
      <div
        className={styles.coverHero}
        style={{ backgroundImage: "url('/assets/images/luxury_lambo.png')" }}
      />
      <div className={styles.coverOverlay} />

      <div className={styles.coverContent}>
        <div className={styles.coverTop}>
          <EditableElement pageId={PAGE_ID} fieldKey="logo">
            <img src="/assets/logos/logo-nzppf-tamanho-certo.svg" alt="NZPPF" className={styles.coverLogo} />
          </EditableElement>
          <EditableText
            pageId={PAGE_ID}
            fieldKey="edition"
            defaultValue={'CATÁLOGO\nOFICIAL\n2026'}
            as="div"
            className={styles.coverEdition}
            multiline
          />
        </div>

        <div>
          <div className={styles.coverHeadline}>
            <EditableText pageId={PAGE_ID} fieldKey="headline.l1" defaultValue="PROTEÇÃO" />
            <br />
            <EditableText pageId={PAGE_ID} fieldKey="headline.l2" defaultValue="FEITA PARA" />
            <br />
            <EditableText
              pageId={PAGE_ID}
              fieldKey="headline.l3"
              defaultValue="O MUNDO REAL."
              style={{ color: '#D4AF37' }}
            />
          </div>
        </div>

        <div className={styles.coverFooterLine}>
          <div>
            <EditableText
              pageId={PAGE_ID}
              fieldKey="footer.left"
              defaultValue="FILMES PPF AUTOMOTIVOS"
              as="div"
              className={styles.captionMono}
              style={{ marginBottom: 'var(--space-2)' }}
            />
            <EditableText
              pageId={PAGE_ID}
              fieldKey="footer.left2"
              defaultValue="6 LINHAS · ATÉ 12 ANOS DE GARANTIA"
              as="div"
              className={styles.coverFooterTagline}
            />
          </div>
          <EditableText
            pageId={PAGE_ID}
            fieldKey="footer.url"
            defaultValue={catalogMeta.url}
            as="div"
            className={styles.coverYear}
          />
        </div>
      </div>
    </CatalogPage>
  );
}
