import CatalogPage from '../CatalogPage';
import styles from '../Catalog.module.css';
import { type ProductLine, catalogMeta } from '../data/catalogData';
import { sanitizeCatalogText } from '../textHelpers';

interface ProductDetailPageProps {
  pageNumber: number;
  product: ProductLine;
  imageSide: 'left' | 'right';
  qrDataUrl: string;
}

/**
 * Divide o título em "brand" + "display lines".
 * "NZ PPF LUXURY GLOSS"  → brand="NZ PPF", lines=["LUXURY", "GLOSS"]
 * "NZ PPF PRIME GLOSS"   → brand="NZ PPF", lines=["PRIME", "GLOSS"]
 * "NZ PPF HEADLIGHT"     → brand="NZ PPF", lines=["HEADLIGHT"]
 * "NZ PPF WINDSHIELD"    → brand="NZ PPF", lines=["WINDSHIELD"]
 * Render fixo em N linhas = zero risco de wrap acidental.
 */
function splitTitle(raw: string): { brand: string; lines: string[] } {
  const parts = raw.trim().split(/\s+/);
  // Detecta prefixo "NZ PPF" ou "NZPPF"
  if (parts[0] === 'NZ' && parts[1] === 'PPF') {
    return { brand: 'NZ PPF', lines: parts.slice(2) };
  }
  if (parts[0] === 'NZPPF') {
    return { brand: 'NZ PPF', lines: parts.slice(1) };
  }
  return { brand: parts[0] || '', lines: parts.slice(1) };
}

export default function ProductDetailPage({
  pageNumber,
  product,
  imageSide,
  qrDataUrl
}: ProductDetailPageProps) {
  const textSide = imageSide === 'left' ? 'right' : 'left';
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const { brand, lines: displayLines } = splitTitle(product.title);

  return (
    <CatalogPage pageNumber={pageNumber}>
      {/* Background giant thickness watermark — mantido, fica no canto da imagem */}
      <div
        className={styles.productThicknessTag}
        style={{
          position: 'absolute',
          [textSide === 'left' ? 'right' : 'left']: 80,
          top: 90,
          zIndex: 1
        }}
      >
        {product.thickness}
      </div>

      <div
        className={`${styles.productHero} ${styles[imageSide]}`}
        style={{ backgroundImage: `url('${product.image}')` }}
      />

      {/* QR Code para a página oficial do produto */}
      <div className={`${styles.productQrBlock} ${styles[imageSide]}`}>
        <div className={styles.qrImg}>
          {qrDataUrl ? <img src={qrDataUrl} alt={`QR ${product.shortName}`} /> : null}
        </div>
        <div className={styles.qrCaption}>
          <div className={styles.qrLabel}>VEJA NO SITE</div>
          <div className={styles.qrUrl} style={{ color: product.accent }}>
            {catalogMeta.url}/ppf/{product.slug}
          </div>
        </div>
      </div>

      <div className={`${styles.productSide} ${styles[textSide]}`}>
        <div className={styles.productEyebrow} style={{ color: product.accent }}>
          {pad2(pageNumber)}  ·  LINHA NZPPF
        </div>

        {/* Título em linhas explícitas — impede wrap acidental do html2canvas */}
        <h2 className={styles.productTitle}>
          <span className={styles.productTitleBrand}>{brand}</span>
          {displayLines.map((word, i) => (
            <span
              key={i}
              className={styles.productTitleLine}
              style={i === displayLines.length - 1 ? { color: product.accent } : undefined}
            >
              {word}
            </span>
          ))}
        </h2>

        <div className={styles.productSubtitle} style={{ color: product.accent }}>
          {sanitizeCatalogText(product.subtitle)}
        </div>

        <h3 className={styles.productSectionTitle}>
          {sanitizeCatalogText(product.sectionTitle)}
        </h3>

        <div className={styles.productBody}>
          {product.bodyParagraphs.map((paragraph, i) => (
            <p key={i}>{sanitizeCatalogText(paragraph)}</p>
          ))}
        </div>

        <div className={styles.productSpecs}>
          {product.highlights.map((h, i) => (
            <div key={i} className={styles.specChip}>
              <div className={styles.label}>{sanitizeCatalogText(h.label)}</div>
              <div className={styles.value} style={{ color: product.accent }}>
                {sanitizeCatalogText(h.value)}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.productArchitectureTitle}>ARQUITETURA DO FILME</div>
        <div className={styles.productArchitecture}>
          {product.architecture.map((item) => (
            <div key={item.num} className={styles.archItem}>
              <div className={styles.archNum} style={{ color: product.accent }}>{item.num}</div>
              <div className={styles.archBody}>
                <div className={styles.archTitle}>{sanitizeCatalogText(item.title)}</div>
                <div className={styles.archDesc}>{sanitizeCatalogText(item.desc)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </CatalogPage>
  );
}
