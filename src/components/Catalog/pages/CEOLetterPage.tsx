import CatalogPage from '../CatalogPage';
import styles from '../Catalog.module.css';
import { catalogMeta } from '../data/catalogData';
import { sanitizeCatalogText } from '../textHelpers';

interface CEOLetterPageProps {
  pageNumber?: number;
  totalPages?: number;
}

const pullQuote =
  'É como a película do celular — só que protege o seu carro inteiro.';

const letterParagraphs: string[] = [
  'O NZPPF nasceu de uma recusa: a de vender quase isso como se fosse aquilo. Película que pudéssemos defender em qualquer pista — do showroom à rodovia.',
  'Este catálogo é essa recusa transformada em método. Cada linha aqui passou pelo mesmo crivo: resiste à pergunta de um cliente exigente? Cobre o que promete?',
  'As garantias que assinamos não vivem no papel. Vivem na rua, no carro do cliente, no teste do tempo. Obrigado por chegar até aqui.',
];

/**
 * Verso da capa — versão MINIMAL DEFENSIVA.
 *
 * Usa APENAS classes/padrões que outras páginas do catálogo já usam
 * com sucesso (.h2, .body, inline styles), evitando classes novas que
 * possam estar causando o html2canvas falhar.
 *
 * Estrutura idêntica à BackCoverPage (que renderiza sem erros), só com
 * conteúdo diferente.
 */
export default function CEOLetterPage({
  pageNumber = 20,
  totalPages,
}: CEOLetterPageProps = {}) {
  return (
    <CatalogPage pageNumber={pageNumber} totalPages={totalPages} hideFooter>
      <div className={styles.safeArea}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ marginBottom: 60 }}>
            <div style={{
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 800,
              fontSize: 32,
              letterSpacing: 8,
              color: '#D4AF37',
              textTransform: 'uppercase',
              marginBottom: 36
            }}>
              NZPPF
            </div>
            <div className={styles.h2}>
              UMA<br />
              <span style={{ color: '#D4AF37' }}>PALAVRA FINAL.</span>
            </div>
            <div style={{ width: 110, height: 2, background: '#D4AF37', marginTop: 32 }} />
          </div>

          <div style={{
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 700,
            fontSize: 56,
            lineHeight: 1.25,
            color: '#D4AF37',
            paddingLeft: 60,
            borderLeft: '5px solid #D4AF37',
            marginBottom: 60,
            maxWidth: 1400
          }}>
            {sanitizeCatalogText(pullQuote)}
          </div>

          <div style={{ maxWidth: 1400, marginBottom: 80 }}>
            {letterParagraphs.map((p, i) => (
              <p
                key={i}
                className={styles.body}
                style={{ marginTop: i === 0 ? 0 : 36 }}
              >
                {sanitizeCatalogText(p)}
              </p>
            ))}
          </div>

          <div style={{
            marginTop: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <div style={{
              width: 280,
              height: 1,
              background: '#D4AF37',
              opacity: 0.5,
              marginBottom: 32
            }} />
            <img
              src="/assets/logos/logo-nz-ppf.svg"
              alt="NZPPF"
              style={{
                height: 260,
                width: 'auto',
                display: 'block',
                filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.4))'
              }}
            />
            <div style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: 32,
              letterSpacing: 5,
              textTransform: 'uppercase',
              color: '#D4AF37',
              marginTop: 28
            }}>
              {sanitizeCatalogText(catalogMeta.tagline)}
            </div>
            <div style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 400,
              fontSize: 28,
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: 'rgba(245,245,247,0.75)',
              marginTop: 20
            }}>
              EDIÇÃO MMXXVI {' '} · {' '} {catalogMeta.url}
            </div>
          </div>
        </div>
      </div>
    </CatalogPage>
  );
}
