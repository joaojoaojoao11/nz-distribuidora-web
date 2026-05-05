import CatalogPage from '../CatalogPage';
import styles from '../Catalog.module.css';
import {
  usePageScale,
  useElementHidden,
} from '../useCatalogOverrides';
import EditableText from '../EditableText';

const PAGE_ID = 'closing';

const closingDefaults = [
  { title: 'O QUE NOS SEPARA',         body: 'Domínio sobre a química. Resina, adesivo e coating alinhados.' },
  { title: 'NOSSO COMPROMISSO',        body: 'Cada cliente é um sonho protegido. Não negociamos integridade no preço.' },
  { title: 'NOSSAS MATÉRIAS-PRIMAS',   body: 'Compounds rastreáveis com ficha técnica. Sem "quase isso, quase aquilo".' },
  { title: 'ATENDIMENTO 360°',         body: 'Aplicador qualificado próximo, suporte oficial sempre que precisar.' },
];

interface ClosingPageProps {
  pageNumber?: number;
  totalPages?: number;
}

export default function ClosingPage({
  pageNumber = 13,
  totalPages,
}: ClosingPageProps = {}) {
  const scale = usePageScale(PAGE_ID);
  const quoteHidden = useElementHidden(PAGE_ID, 'quote');
  const quoteAuthorHidden = useElementHidden(PAGE_ID, 'quote.author');

  return (
    <CatalogPage
      pageNumber={pageNumber}
      totalPages={totalPages}
      pageId={PAGE_ID}
      className={styles.closingPage}
      style={{ ['--user-scale' as string]: scale }}
    >
      <div className={styles.safeArea}>
        <div className={styles.pageHeader}>
          <div>
            <EditableText
              pageId={PAGE_ID}
              fieldKey="pageSection"
              defaultValue="13  ·  POSICIONAMENTO"
              as="div"
              className={styles.pageSection}
            />
            <div className={styles.h2} style={{ marginTop: 16 }}>
              <EditableText pageId={PAGE_ID} fieldKey="h2.l1" defaultValue="NOSSOS" />
              <br />
              <EditableText
                pageId={PAGE_ID}
                fieldKey="h2.l2"
                defaultValue="DIFERENCIAIS"
                style={{ color: '#D4AF37' }}
              />
            </div>
          </div>
          <EditableText
            pageId={PAGE_ID}
            fieldKey="badge"
            defaultValue="POR QUE NZPPF"
            as="div"
            className={styles.darkBadge}
          />
        </div>

        <div className={styles.closingContent}>
          {!quoteHidden && (
            <div className={styles.closingQuoteTop}>
              <span className={styles.closingQuoteMark} aria-hidden>
                “
              </span>
              <EditableText
                pageId={PAGE_ID}
                fieldKey="quote"
                defaultValue="Nossos diferenciais vão além de entregar um produto de qualidade — isso é obrigação."
                as="span"
              />
              {!quoteAuthorHidden && (
                <EditableText
                  pageId={PAGE_ID}
                  fieldKey="quote.author"
                  defaultValue="— NZ Group"
                  as="span"
                  className={styles.closingQuoteAuthor}
                />
              )}
            </div>
          )}

          <div className={styles.closingGridV2}>
            {closingDefaults.map((b, i) => (
              <ClosingBlock key={i} index={i} title={b.title} body={b.body} />
            ))}
          </div>
        </div>
      </div>
    </CatalogPage>
  );
}

interface ClosingBlockProps {
  index: number;
  title: string;
  body: string;
}

function ClosingBlock({ index, title, body }: ClosingBlockProps) {
  const numStr = String(index + 1).padStart(2, '0');
  const titleHidden = useElementHidden(PAGE_ID, `block.${index}.title`);
  const bodyHidden = useElementHidden(PAGE_ID, `block.${index}.body`);
  if (titleHidden && bodyHidden) return null;
  return (
    <div className={styles.closingBlockV2}>
      <div className={styles.closingBlockNum} aria-hidden>
        {numStr}
      </div>
      <div className={styles.closingBlockBody}>
        <EditableText
          pageId={PAGE_ID}
          fieldKey={`block.${index}.title`}
          defaultValue={title}
          as="h4"
        />
        <EditableText
          pageId={PAGE_ID}
          fieldKey={`block.${index}.body`}
          defaultValue={body}
          as="p"
        />
      </div>
    </div>
  );
}
