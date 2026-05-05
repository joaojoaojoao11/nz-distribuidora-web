import CatalogPage from '../CatalogPage';
import styles from '../Catalog.module.css';
import { type ProductLine, catalogMeta } from '../data/catalogData';
import { usePageScale, useElementHidden } from '../useCatalogOverrides';
import EditableText from '../EditableText';

interface ProductDetailPageProps {
  pageNumber: number;
  totalPages?: number;
  product: ProductLine;
  imageSide: 'left' | 'right';
  qrDataUrl: string;
}

export default function ProductDetailPage({
  pageNumber,
  totalPages,
  product,
  imageSide,
  qrDataUrl,
}: ProductDetailPageProps) {
  const PAGE_ID = `product:${product.slug}`;
  const textSide = imageSide === 'left' ? 'right' : 'left';
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const titleParts = product.title.replace(/^NZ ?PPF /, '').split(/\s+/);

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
      <div
        className={styles.productThicknessTag}
        style={{
          position: 'absolute',
          [textSide === 'left' ? 'right' : 'left']: 80,
          top: 90,
          zIndex: 1,
        }}
      >
        {product.thickness}
      </div>

      <div
        className={`${styles.productHero} ${styles[imageSide]}`}
        style={{ backgroundImage: `url('${product.image}')` }}
      />

      {!(qrLabelHidden && qrUrlHidden) && (
        <div
          className={`${styles.productQrBlock} ${styles[imageSide]}`}
          data-page-link-url={`${catalogMeta.baseUrl}${catalogMeta.ppfPath}/${product.slug}`}
        >
          <div className={styles.qrImg}>
            {qrDataUrl ? <img src={qrDataUrl} alt={`QR ${product.shortName}`} /> : null}
          </div>
          <div className={styles.qrCaption}>
            <EditableText
              pageId={PAGE_ID}
              fieldKey="qr.label"
              defaultValue="VEJA NO SITE"
              as="div"
              className={styles.qrLabel}
              style={{ color: product.accent }}
            />
            <EditableText
              pageId={PAGE_ID}
              fieldKey="qr.url"
              defaultValue={`nzgroup.com.br/${product.slug}`}
              as="div"
              className={styles.qrUrl}
              style={{ color: product.accent }}
            />
          </div>
        </div>
      )}

      <div className={`${styles.productSide} ${styles[textSide]}`}>
        <EditableText
          pageId={PAGE_ID}
          fieldKey="eyebrow"
          defaultValue={`${pad2(pageNumber)}  ·  LINHA NZPPF`}
          as="div"
          className={styles.productEyebrow}
          style={{ color: product.accent }}
        />

        <h2 className={styles.productTitle}>
          <EditableText
            pageId={PAGE_ID}
            fieldKey="titleBrand"
            defaultValue="NZ PPF"
            className={styles.productTitleBrand}
          />
          {titleParts.map((word, i) => (
            <EditableText
              key={i}
              pageId={PAGE_ID}
              fieldKey={`titleLine.${i}`}
              defaultValue={word}
              className={styles.productTitleLine}
              style={i === titleParts.length - 1 ? { color: product.accent } : undefined}
            />
          ))}
        </h2>

        <EditableText
          pageId={PAGE_ID}
          fieldKey="subtitle"
          defaultValue={product.subtitle}
          as="div"
          className={styles.productSubtitle}
          style={{ color: product.accent }}
        />

        <EditableText
          pageId={PAGE_ID}
          fieldKey="sectionTitle"
          defaultValue={product.sectionTitle}
          as="h3"
          className={styles.productSectionTitle}
        />

        <div className={styles.productBody}>
          {product.bodyParagraphs.map((paragraph, i) => (
            <EditableText
              key={i}
              pageId={PAGE_ID}
              fieldKey={`body.${i}`}
              defaultValue={paragraph}
              as="p"
            />
          ))}
        </div>

        <div className={styles.productSpecs}>
          {product.highlights.map((h, i) => (
            <SpecChip
              key={i}
              pageId={PAGE_ID}
              index={i}
              defaultLabel={h.label}
              defaultValue={h.value}
              accent={product.accent}
            />
          ))}
        </div>

        {(product.closingTagline || product.closingLine) && (
          <div className={styles.productClosing}>
            <div
              className={styles.productClosingDivider}
              style={{ background: product.accent }}
              aria-hidden
            />
            {product.closingTagline && (
              <EditableText
                pageId={PAGE_ID}
                fieldKey="closingTagline"
                defaultValue={product.closingTagline}
                as="div"
                className={styles.productClosingTagline}
                style={{ color: product.accent }}
              />
            )}
            {product.closingLine && (
              <EditableText
                pageId={PAGE_ID}
                fieldKey="closingLine"
                defaultValue={product.closingLine}
                as="div"
                className={styles.productClosingLine}
              />
            )}
          </div>
        )}

        {/* Estrutura do PPF (antiga "Arquitetura do Filme"): renderizada
            só quando a linha NÃO tem página de acabamentos própria. As
            5 linhas com `finishes` cadastrados (Luxury, Prime, Flow,
            Core, Headlight) movem essa seção para a respectiva página
            de "Estrutura + Acabamentos" (FinishesPage). Apenas Windshield
            cai aqui — não há acabamentos para o parabrisa, então a
            estrutura volta a ocupar este card.                          */}
        {!product.finishes && (
          <>
            <EditableText
              pageId={PAGE_ID}
              fieldKey="archHeader"
              defaultValue="ESTRUTURA DO PPF"
              as="div"
              className={styles.productArchitectureTitle}
            />
            <div className={styles.productArchitecture}>
              {product.architecture.map((item, i) => (
                <ArchItem
                  key={item.num}
                  pageId={PAGE_ID}
                  index={i}
                  item={item}
                  accent={product.accent}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </CatalogPage>
  );
}

/* ── Sub-componente: chip de spec (label + value) ── */

interface SpecChipProps {
  pageId: string;
  index: number;
  defaultLabel: string;
  defaultValue: string;
  accent: string;
}

function SpecChip({ pageId, index, defaultLabel, defaultValue, accent }: SpecChipProps) {
  // O chip é visível se label OU value não estão ocultos.
  const labelHidden = useElementHidden(pageId, `highlight.${index}.label`);
  const valueHidden = useElementHidden(pageId, `highlight.${index}.value`);
  if (labelHidden && valueHidden) return null;
  return (
    <div className={styles.specChip}>
      <EditableText
        pageId={pageId}
        fieldKey={`highlight.${index}.label`}
        defaultValue={defaultLabel}
        as="div"
        className={styles.label}
      />
      <EditableText
        pageId={pageId}
        fieldKey={`highlight.${index}.value`}
        defaultValue={defaultValue}
        as="div"
        className={styles.value}
        style={{ color: accent }}
      />
    </div>
  );
}

/* ── Sub-componente: card de Arquitetura do Filme ── */

interface ArchItemProps {
  pageId: string;
  index: number;
  item: { num: string; title: string; desc: string; icon: string };
  accent: string;
}

function ArchItem({ pageId, index, item, accent }: ArchItemProps) {
  const titleHidden = useElementHidden(pageId, `arch.${index}.title`);
  const descHidden = useElementHidden(pageId, `arch.${index}.desc`);
  // Se ambos os textos estiverem ocultos, o card inteiro some.
  if (titleHidden && descHidden) return null;
  return (
    <div className={styles.archItem}>
      <img src={item.icon} alt="" aria-hidden className={styles.archIcon} />
      <div className={styles.archBody}>
        <div className={styles.archNum} style={{ color: accent }}>{item.num}</div>
        <EditableText
          pageId={pageId}
          fieldKey={`arch.${index}.title`}
          defaultValue={item.title}
          as="div"
          className={styles.archTitle}
        />
        <EditableText
          pageId={pageId}
          fieldKey={`arch.${index}.desc`}
          defaultValue={item.desc}
          as="div"
          className={styles.archDesc}
        />
      </div>
    </div>
  );
}

