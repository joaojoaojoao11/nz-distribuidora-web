import CatalogPage from '../CatalogPage';
import styles from '../Catalog.module.css';
import { exclusiveDifferentials } from '../data/catalogData';
import { safeSpacing, sanitizeCatalogText } from '../textHelpers';

interface DifferentiatorsPageProps {
  pageNumber?: number;
  totalPages?: number;
}

/**
 * Página "Diferenciais Exclusivos".
 * Redesign:
 *   • Card com numeral gigante decorativo no canto (apenas visual).
 *   • "PRESENTE EM:" vira chip dourado destacado (informação-âncora
 *     da página é a cobertura de cada diferencial pelas linhas).
 *   • Desc com tipografia maior, ícone com glow dourado.
 */
export default function DifferentiatorsPage({
  pageNumber = 11,
  totalPages,
}: DifferentiatorsPageProps = {}) {
  return (
    <CatalogPage pageNumber={pageNumber} totalPages={totalPages}>
      <div className={styles.safeArea}>
        <div className={styles.pageHeader}>
          <div>
            <div className={styles.pageSection}>11  ·  DIFERENCIAIS</div>
            <div className={styles.h2} style={{ marginTop: 16 }}>
              DIFERENCIAIS<br />
              <span style={{ color: '#D4AF37' }}>EXCLUSIVOS</span>
            </div>
          </div>
          <div className={styles.darkBadge}>NZPPF · ENGINEERED</div>
        </div>

        <p className={styles.body} style={{ maxWidth: 1100, marginTop: 16 }}>
          {safeSpacing(
            'O que torna um filme NZ PPF reconhecível mesmo sem rótulo: quatro decisões de engenharia presentes em todas as linhas — do Core ao Luxury.'
          )}
        </p>

        <div className={styles.exclusiveGrid}>
          {exclusiveDifferentials.map((d, i) => {
            const numStr = String(i + 1).padStart(2, '0');
            // Chip exibe apenas a parte de cobertura (sem o prefixo
            // "PRESENTE EM:" / "EXCLUSIVO DA LINHA:" — fica mais limpo)
            const chipText = (d.line || '')
              .replace(/^PRESENTE EM:\s*/i, '')
              .replace(/^EXCLUSIVO DA LINHA:\s*/i, 'EXCLUSIVO · ')
              .replace(/^PRESENTE EM\s+/i, '')
              .trim();

            return (
              <div key={i} className={styles.exclusiveCardV2}>
                <div className={styles.exclusiveCardNumBg} aria-hidden>
                  {numStr}
                </div>
                <img src={d.icon} alt="" className={styles.exclusiveCardIconV2} />
                <h3 className={styles.exclusiveCardTitleV2}>
                  {sanitizeCatalogText(d.title)}
                </h3>
                {d.line && (
                  <div className={styles.exclusiveCardChip}>
                    {sanitizeCatalogText(chipText)}
                  </div>
                )}
                <p className={styles.exclusiveCardDescV2}>{safeSpacing(d.desc)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </CatalogPage>
  );
}
