import CatalogPage from '../CatalogPage';
import styles from '../Catalog.module.css';
import { sanitizeCatalogText } from '../textHelpers';

const closingBlocks = [
  {
    title: 'O QUE NOS SEPARA',
    body: 'Domínio sobre a camada química do material. Sabemos como uma resina específica se comporta combinada com um adesivo específico e com um coating específico — e como essa expertise em compounds garante a entrega prometida.'
  },
  {
    title: 'NOSSO COMPROMISSO',
    body: 'Cada cliente protegido é um carro com PPF que faz parte da realização de um sonho. E nós nos tornamos esse compromisso parte do nosso também — não negociamos integridade técnica para vencer no preço.'
  },
  {
    title: 'NOSSAS MATÉRIAS-PRIMAS',
    body: 'Confiáveis e robustas. Sem mistura de "quase isso" com "quase aquilo" — só compounds rastreáveis, com ficha técnica e respaldo de fabricante.'
  },
  {
    title: 'ATENDIMENTO 360°',
    body: 'Nosso compromisso não termina na venda. Você encontra um aplicador qualificado próximo, tira dúvidas sobre o produto e recebe suporte oficial sempre que precisar.'
  }
];

export default function ClosingPage() {
  return (
    <CatalogPage pageNumber={13} className={styles.closingPage}>
      <div className={styles.safeArea}>
        <div className={styles.pageHeader}>
          <div>
            <div className={styles.pageSection}>13  ·  POSICIONAMENTO</div>
            <div className={styles.h2} style={{ marginTop: 16 }}>
              NOSSOS<br />
              <span style={{ color: '#D4AF37' }}>DIFERENCIAIS.</span>
            </div>
          </div>
          <div className={styles.darkBadge}>POR QUE NZPPF</div>
        </div>

        <div className={styles.closingContent}>
          <div className={styles.closingBlocks}>
            {closingBlocks.map((b, i) => (
              <div key={i} className={styles.closingBlock}>
                <h4>{sanitizeCatalogText(b.title)}</h4>
                <p>{sanitizeCatalogText(b.body)}</p>
              </div>
            ))}
          </div>

          <div className={styles.closingQuote}>
            “Nossos diferenciais vão além de entregar um produto<br />
            de qualidade — isso é obrigação.”
          </div>
        </div>
      </div>
    </CatalogPage>
  );
}
