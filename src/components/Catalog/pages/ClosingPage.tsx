import CatalogPage from '../CatalogPage';
import styles from '../Catalog.module.css';
import { sanitizeCatalogText } from '../textHelpers';

const closingBlocks = [
  {
    title: 'O QUE NOS SEPARA',
    body: 'Domínio sobre a química do material. Resina, adesivo e coating combinados para garantir a entrega prometida.',
  },
  {
    title: 'NOSSO COMPROMISSO',
    body: 'Cada cliente protegido é parte da realização de um sonho. Não negociamos integridade técnica para vencer no preço.',
  },
  {
    title: 'NOSSAS MATÉRIAS-PRIMAS',
    body: 'Confiáveis e robustas. Sem mistura de "quase isso" com "quase aquilo" — só compounds rastreáveis com ficha técnica.',
  },
  {
    title: 'ATENDIMENTO 360°',
    body: 'Nosso compromisso não termina na venda. Aplicador qualificado próximo, suporte oficial sempre que precisar.',
  },
];

interface ClosingPageProps {
  pageNumber?: number;
  totalPages?: number;
}

/**
 * Página "Nossos Diferenciais" (posicionamento de marca).
 * Redesign:
 *   • Quote de abertura agora aparece NO TOPO como manifesto
 *     (substitui o uso decorativo do rodapé).
 *   • Os 4 blocos viram grid 2×2 com numerais 01–04 dourados gigantes
 *     como elemento gráfico — quebra a monotonia da lista vertical e
 *     diferencia visualmente da página "Diferenciais Exclusivos".
 */
export default function ClosingPage({
  pageNumber = 13,
  totalPages,
}: ClosingPageProps = {}) {
  return (
    <CatalogPage
      pageNumber={pageNumber}
      totalPages={totalPages}
      className={styles.closingPage}
    >
      <div className={styles.safeArea}>
        <div className={styles.pageHeader}>
          <div>
            <div className={styles.pageSection}>13  ·  POSICIONAMENTO</div>
            <div className={styles.h2} style={{ marginTop: 16 }}>
              NOSSOS<br />
              <span style={{ color: '#D4AF37' }}>DIFERENCIAIS</span>
            </div>
          </div>
          <div className={styles.darkBadge}>POR QUE NZPPF</div>
        </div>

        <div className={styles.closingContent}>
          <div className={styles.closingQuoteTop}>
            <span className={styles.closingQuoteMark} aria-hidden>
              “
            </span>
            Nossos diferenciais vão além de entregar um produto de qualidade —
            isso é obrigação.
            <span className={styles.closingQuoteAuthor}>— NZ Group</span>
          </div>

          <div className={styles.closingGridV2}>
            {closingBlocks.map((b, i) => {
              const numStr = String(i + 1).padStart(2, '0');
              return (
                <div key={i} className={styles.closingBlockV2}>
                  <div className={styles.closingBlockNum} aria-hidden>
                    {numStr}
                  </div>
                  <div className={styles.closingBlockBody}>
                    <h4>{sanitizeCatalogText(b.title)}</h4>
                    <p>{sanitizeCatalogText(b.body)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </CatalogPage>
  );
}
