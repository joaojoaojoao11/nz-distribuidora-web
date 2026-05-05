import CatalogPage from '../CatalogPage';
import styles from '../Catalog.module.css';
import { catalogMeta } from '../data/catalogData';
import {
  usePageScale,
} from '../useCatalogOverrides';
import EditableText from '../EditableText';

const PAGE_ID = 'ceoletter';

interface CEOLetterPageProps {
  pageNumber?: number;
  totalPages?: number;
}

export default function CEOLetterPage({
  pageNumber = 20,
  totalPages,
}: CEOLetterPageProps = {}) {
  const scale = usePageScale(PAGE_ID);

  return (
    <CatalogPage
      pageNumber={pageNumber}
      totalPages={totalPages}
      hideFooter
      style={{ ['--user-scale' as string]: scale }}
    >
      <div className={styles.safeArea}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ marginBottom: 60 }}>
            <EditableText
              pageId={PAGE_ID}
              fieldKey="wordmark"
              defaultValue="NZPPF"
              as="div"
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 800,
                fontSize: 42,
                letterSpacing: 8,
                color: '#D4AF37',
                textTransform: 'uppercase',
                marginBottom: 36,
              }}
            />
            <div className={styles.h2}>
              <EditableText pageId={PAGE_ID} fieldKey="h2.l1" defaultValue="UMA" />
              <br />
              <EditableText
                pageId={PAGE_ID}
                fieldKey="h2.l2"
                defaultValue="PALAVRA FINAL."
                style={{ color: '#D4AF37' }}
              />
            </div>
            <div style={{ width: 110, height: 2, background: '#D4AF37', marginTop: 32 }} />
          </div>

          <EditableText
            pageId={PAGE_ID}
            fieldKey="pullQuote"
            defaultValue="É como a película do celular — só que protege o seu carro inteiro."
            as="div"
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 700,
              fontSize: 56,
              lineHeight: 1.25,
              color: '#D4AF37',
              paddingLeft: 60,
              borderLeft: '5px solid #D4AF37',
              marginBottom: 60,
              maxWidth: 1400,
            }}
          />

          <div style={{ maxWidth: 1400, marginBottom: 80 }}>
            <EditableText
              pageId={PAGE_ID}
              fieldKey="paragraph.0"
              defaultValue="NZPPF nasceu de uma recusa: vender quase isso como se fosse aquilo. Película que defendemos em qualquer pista."
              as="p"
              className={styles.body}
              style={{ marginTop: 0 }}
            />
            <EditableText
              pageId={PAGE_ID}
              fieldKey="paragraph.1"
              defaultValue="Cada linha aqui passou pelo mesmo crivo: resiste à pergunta de um cliente exigente? Cobre o que promete?"
              as="p"
              className={styles.body}
              style={{ marginTop: 36 }}
            />
            <EditableText
              pageId={PAGE_ID}
              fieldKey="paragraph.2"
              defaultValue="As garantias que assinamos não vivem no papel. Vivem na rua, no carro do cliente. Obrigado por chegar até aqui."
              as="p"
              className={styles.body}
              style={{ marginTop: 36 }}
            />
          </div>

          <div style={{
            marginTop: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}>
            <div style={{
              width: 280,
              height: 1,
              background: '#D4AF37',
              opacity: 0.5,
              marginBottom: 32,
            }} />
            <img
              src="/assets/logos/logo-nzppf-tamanho-certo.svg"
              alt="NZPPF"
              style={{
                /* Wordmark horizontal — antes 260px num logo 1:1.
                   47px → ~260px de largura, mesmo footprint. */
                height: 47,
                width: 'auto',
                display: 'block',
                filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.4))',
              }}
            />
            <EditableText
              pageId={PAGE_ID}
              fieldKey="tagline"
              defaultValue={catalogMeta.tagline}
              as="div"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 42,
                letterSpacing: 5,
                textTransform: 'uppercase',
                color: '#D4AF37',
                marginTop: 28,
              }}
            />
            <EditableText
              pageId={PAGE_ID}
              fieldKey="footer"
              defaultValue={`EDIÇÃO MMXXVI  ·  ${catalogMeta.url}`}
              as="div"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: 38,
                letterSpacing: 4,
                textTransform: 'uppercase',
                color: 'rgba(245,245,247,0.75)',
                marginTop: 20,
              }}
            />
          </div>
        </div>
      </div>
    </CatalogPage>
  );
}
