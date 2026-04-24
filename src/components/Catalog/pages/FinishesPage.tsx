import CatalogPage from '../CatalogPage';
import styles from '../Catalog.module.css';
import type { ProductLine } from '../data/catalogData';
import { sanitizeCatalogText } from '../textHelpers';

interface FinishesPageProps {
  pageNumber: number;
  totalPages: number;
  /** Índice 1-based da linha (01..06) — usado no eyebrow "0X · ACABAMENTOS" */
  lineIndex: number;
  product: ProductLine;
}

export default function FinishesPage({
  pageNumber,
  totalPages,
  lineIndex,
  product,
}: FinishesPageProps) {
  if (!product.finishes) return null;

  const { tagline, items, heroIndex } = product.finishes;
  const pad2 = (n: number) => String(n).padStart(2, '0');

  // ── Layout adaptativo ───────────────────────────────────────────────
  // 4 itens → grid 2×2 simétrico (.finishesGrid2)
  // 3 itens → layout editorial herói + 2 secundários (.finishesGridHero)
  //   • O item destacado é definido por finishes.heroIndex (default: 0).
  //   • Reordenamos para que o herói seja sempre o primeiro card renderizado,
  //     o que permite ao CSS aplicar o tratamento via :first-child.
  const isHeroLayout = items.length === 3;
  const orderedItems = (() => {
    if (!isHeroLayout) return items;
    const safeHero = Math.max(0, Math.min(items.length - 1, heroIndex ?? 0));
    if (safeHero === 0) return items;
    return [items[safeHero], ...items.filter((_, i) => i !== safeHero)];
  })();

  const gridClass =
    items.length === 4
      ? `${styles.finishesGrid} ${styles.finishesGrid2}`
      : `${styles.finishesGrid} ${styles.finishesGridHero}`;

  return (
    <CatalogPage pageNumber={pageNumber} totalPages={totalPages}>
      <div className={styles.safeArea}>
        <div className={styles.pageHeader}>
          <div>
            <div className={styles.pageSection}>
              {pad2(lineIndex)}  ·  ACABAMENTOS
            </div>
            <div className={styles.h2} style={{ marginTop: 16 }}>
              ACABAMENTOS<br />
              <span style={{ color: product.accent }}>
                {sanitizeCatalogText(product.shortName)}
              </span>
            </div>
          </div>
          <div className={styles.darkBadge}>NZPPF / 2026</div>
        </div>

        <div className={styles.finishesTagline}>
          {sanitizeCatalogText(tagline)}
        </div>

        <div className={gridClass}>
          {orderedItems.map((item, i) => {
            const heroClass =
              isHeroLayout && i === 0 ? ` ${styles.finishHero}` : '';
            return (
              <div key={`${item.name}-${i}`} className={`${styles.finishCard}${heroClass}`}>
                <div
                  className={styles.finishImage}
                  style={{ backgroundImage: `url('${item.image}')` }}
                />
                <div className={styles.finishBody}>
                  <div className={styles.finishName} style={{ color: product.accent }}>
                    {sanitizeCatalogText(item.name)}
                  </div>
                  <div className={styles.finishAnchor}>
                    {sanitizeCatalogText(item.anchor)}
                  </div>
                  <div className={styles.finishDesc}>
                    {sanitizeCatalogText(item.desc)}
                  </div>
                  <div
                    className={styles.finishSwatch}
                    style={{ background: item.swatch, borderColor: product.accent }}
                    aria-hidden
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </CatalogPage>
  );
}
