import styles from '../SocialImage.module.css';
import type { SocialImageData } from '../socialImageTypes';

export default function StatDriven({ data }: { data: SocialImageData }) {
  const { product, copy, accent } = data;
  const stat = copy.stat || '12 ANOS';
  const statLabel = copy.statLabel || 'DE GARANTIA REAL';
  return (
    <>
      <div className={styles.sdTop}>
        <div className={styles.wordmark}>NZPPF</div>
        <div className={styles.lineBadge} style={{ borderColor: accent, color: accent }}>{product.shortName}</div>
      </div>
      <div className={styles.sdCenter}>
        <div className={styles.sdStat} style={{ color: accent }}>{stat}</div>
        <div className={styles.sdLabel}>{statLabel}</div>
        {copy.subline && <div className={styles.sdSubline}>{copy.subline}</div>}
      </div>
      <div className={styles.sdBottom}>
        <div className={styles.url}>nzgroup.com.br</div>
        <div className={styles.sdCta} style={{ color: accent }}>→ {copy.cta}</div>
      </div>
    </>
  );
}
