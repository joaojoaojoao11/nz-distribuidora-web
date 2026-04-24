import CatalogPage from '../CatalogPage';
import styles from '../Catalog.module.css';
import { benchmarkLines } from '../data/catalogData';
import { safeSpacing, sanitizeCatalogText } from '../textHelpers';

export default function BenchmarkPage() {
  return (
    <CatalogPage pageNumber={10}>
      <div className={styles.safeArea}>
        <div className={styles.pageHeader}>
          <div>
            <div className={styles.pageSection}>10  ·  COMPARATIVO</div>
            <div className={styles.h2} style={{ marginTop: 16 }}>
              PERFORMANCE<br />
              <span style={{ color: '#D4AF37' }}>COMPARADA.</span>
            </div>
          </div>
          <div className={styles.darkBadge}>BENCHMARK INTERNO</div>
        </div>

        <p className={styles.body} style={{ maxWidth: 1100, marginTop: 16 }}>
          Métricas de laboratório medidas em condições padronizadas. Escala 0–100,
          onde 100 representa o desempenho máximo observado em cada métrica.
        </p>

        <div className={styles.benchmarkGrid}>
          {benchmarkLines.map((line) => (
            <div key={line.id} className={styles.benchmarkCard}>
              <div className={styles.benchmarkHeader}>
                <div className={styles.benchmarkName} style={{ color: line.accent }}>{sanitizeCatalogText(line.name)}</div>
                <div className={styles.benchmarkSpec}>
                  ESPESSURA <strong>{sanitizeCatalogText(line.thickness)}</strong>
                  GARANTIA <strong>{sanitizeCatalogText(line.warranty)}</strong>
                </div>
              </div>

              {line.metrics.map((m, i) => (
                <div key={i} className={styles.metricRow}>
                  <div className={styles.metricLabel}>
                    <span>{sanitizeCatalogText(m.label)}</span>
                    <span className={styles.metricValue} style={{ color: line.accent }}>{m.value}</span>
                  </div>
                  <div className={styles.metricBar}>
                    <div
                      className={styles.metricFill}
                      style={{
                        width: `${m.value}%`,
                        background: `linear-gradient(90deg, rgba(212,175,55,0.4) 0%, ${line.accent} 100%)`
                      }}
                    />
                  </div>
                </div>
              ))}

              <div className={styles.benchmarkHighlight}>
                “{safeSpacing(line.highlight)}”
              </div>
            </div>
          ))}
        </div>
      </div>
    </CatalogPage>
  );
}
