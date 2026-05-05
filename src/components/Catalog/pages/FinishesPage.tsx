import CatalogPage from '../CatalogPage';
import styles from '../Catalog.module.css';
import type { ProductLine, FinishItem, ArchitectureItem } from '../data/catalogData';
import { usePageScale, useElementHidden } from '../useCatalogOverrides';
import EditableText from '../EditableText';

interface FinishesPageProps {
  pageNumber: number;
  totalPages: number;
  /** Índice 1-based da linha (01..06) — usado no eyebrow "0X · ESTRUTURA + ACABAMENTOS" */
  lineIndex: number;
  product: ProductLine;
}

/**
 * Página combinada "Estrutura + Acabamentos" (1 por linha que tem
 * acabamentos cadastrados). Layout vertical 50/50:
 *
 *   • Topo: "ESTRUTURA DO PPF" — 4 cards 2×2 com ícone + título + desc
 *           (mesmo formato da antiga seção `ARQUITETURA DO FILME` que
 *           ficava na página de detalhe).
 *   • Base: "ACABAMENTOS" — cards horizontais compactos com nome,
 *           frase âncora e descrição. Imagens menores (deemphasis
 *           visual proposital — o conteúdo crítico é a Estrutura).
 *
 * Quando a linha não tem `finishes` (ex: Windshield), o consumer
 * (CatalogDocument) não renderiza esta página — a Estrutura volta a
 * aparecer no ProductDetailPage.
 */
export default function FinishesPage({
  pageNumber,
  totalPages,
  lineIndex,
  product,
}: FinishesPageProps) {
  const PAGE_ID = `finishes:${product.slug}`;
  const scale = usePageScale(PAGE_ID);
  const taglineHidden = useElementHidden(PAGE_ID, 'tagline');
  const estruturaHeaderHidden = useElementHidden(PAGE_ID, 'estruturaHeader');
  const acabamentosHeaderHidden = useElementHidden(PAGE_ID, 'acabamentosHeader');

  if (!product.finishes) return null;

  const { items, heroIndex } = product.finishes;
  const pad2 = (n: number) => String(n).padStart(2, '0');

  // Para o grid de acabamentos compacto: ordena com hero na frente
  // (preserva ênfase editorial relativa) mas todos os cards têm o
  // mesmo tamanho — diferente do layout antigo que tinha 1 hero grande
  // + 2 secundários menores. Aqui: grid simétrico horizontal.
  const isHeroLayout = items.length === 3;
  const orderedItems = (() => {
    if (!isHeroLayout) return items;
    const safeHero = Math.max(0, Math.min(items.length - 1, heroIndex ?? 0));
    if (safeHero === 0) return items;
    return [items[safeHero], ...items.filter((_, i) => i !== safeHero)];
  })();

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
              defaultValue={`${pad2(lineIndex)}  ·  ESTRUTURA + ACABAMENTOS`}
              as="div"
              className={styles.pageSection}
            />
            <div className={styles.h2} style={{ marginTop: 16 }}>
              <EditableText pageId={PAGE_ID} fieldKey="h2.l1" defaultValue="ESTRUTURA &" />
              <br />
              <EditableText
                pageId={PAGE_ID}
                fieldKey="h2.l2"
                defaultValue={`ACABAMENTOS ${product.shortName}`}
                style={{ color: product.accent }}
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

        {/* ───── Metade superior: ESTRUTURA DO PPF ───── */}
        <div className={styles.combinedSection}>
          {!estruturaHeaderHidden && (
            <EditableText
              pageId={PAGE_ID}
              fieldKey="estruturaHeader"
              defaultValue="ESTRUTURA DO PPF"
              as="div"
              className={styles.combinedSectionHeader}
            />
          )}
          <div className={styles.estruturaGrid}>
            {product.architecture.map((item, i) => (
              <EstruturaCard
                key={item.num}
                pageId={PAGE_ID}
                index={i}
                item={item}
                accent={product.accent}
              />
            ))}
          </div>
        </div>

        {/* ───── Metade inferior: ACABAMENTOS ───── */}
        <div className={styles.combinedSection}>
          {!acabamentosHeaderHidden && (
            <EditableText
              pageId={PAGE_ID}
              fieldKey="acabamentosHeader"
              defaultValue="ACABAMENTOS"
              as="div"
              className={styles.combinedSectionHeader}
            />
          )}
          {!taglineHidden && (
            <EditableText
              pageId={PAGE_ID}
              fieldKey="tagline"
              defaultValue={product.finishes.tagline}
              as="div"
              className={styles.combinedTagline}
            />
          )}
          <div
            className={styles.acabamentosGrid}
            style={{
              gridTemplateColumns: `repeat(${orderedItems.length}, 1fr)`,
            }}
          >
            {orderedItems.map((item, i) => (
              <FinishCardCompact
                key={`${item.name}-${i}`}
                pageId={PAGE_ID}
                originalIndex={items.indexOf(item)}
                item={item}
                accent={product.accent}
              />
            ))}
          </div>
        </div>
      </div>
    </CatalogPage>
  );
}

/* ─── Card de Estrutura (idêntico ao antigo ArchItem do ProductDetailPage) ─── */

interface EstruturaCardProps {
  pageId: string;
  index: number;
  item: ArchitectureItem;
  accent: string;
}

function EstruturaCard({ pageId, index, item, accent }: EstruturaCardProps) {
  const titleHidden = useElementHidden(pageId, `arch.${index}.title`);
  const descHidden = useElementHidden(pageId, `arch.${index}.desc`);
  if (titleHidden && descHidden) return null;
  return (
    <div
      className={styles.archItem}
      style={{ ['--line-accent' as string]: accent }}
    >
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

/* ─── Card de Acabamento compacto (versão menor, half-page layout) ─── */

interface FinishCardCompactProps {
  pageId: string;
  originalIndex: number;
  item: FinishItem;
  accent: string;
}

function FinishCardCompact({ pageId, originalIndex, item, accent }: FinishCardCompactProps) {
  const nameHidden = useElementHidden(pageId, `item.${originalIndex}.name`);
  const anchorHidden = useElementHidden(pageId, `item.${originalIndex}.anchor`);
  const descHidden = useElementHidden(pageId, `item.${originalIndex}.desc`);
  if (nameHidden && anchorHidden && descHidden) return null;

  return (
    <div className={styles.finishCardCompact}>
      <div
        className={styles.finishImageCompact}
        style={{ backgroundImage: `url('${item.image}')` }}
      />
      <div className={styles.finishBodyCompact}>
        <EditableText
          pageId={pageId}
          fieldKey={`item.${originalIndex}.name`}
          defaultValue={item.name}
          as="div"
          className={styles.finishNameCompact}
          style={{ color: accent }}
        />
        <EditableText
          pageId={pageId}
          fieldKey={`item.${originalIndex}.anchor`}
          defaultValue={item.anchor}
          as="div"
          className={styles.finishAnchorCompact}
        />
        <EditableText
          pageId={pageId}
          fieldKey={`item.${originalIndex}.desc`}
          defaultValue={item.desc}
          as="div"
          className={styles.finishDescCompact}
        />
        <div
          className={styles.finishSwatchCompact}
          style={{ background: item.swatch, borderColor: accent }}
          aria-hidden
        />
      </div>
    </div>
  );
}
