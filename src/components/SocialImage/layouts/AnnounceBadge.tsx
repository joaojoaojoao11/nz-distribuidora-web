import styles from '../SocialImage.module.css';
import type { SocialImageData } from '../socialImageTypes';

export default function AnnounceBadge({ data }: { data: SocialImageData }) {
  const { product, copy, accent } = data;
  const badge = copy.badge || 'NOVO';
  return (
    <>
      <div className={styles.abTop}>
        <div className={styles.wordmark}>NZPPF</div>
      </div>
      <div className={styles.abCenter}>
        <div className={styles.abBadge} style={{ background: accent }}>{badge}</div>
        <div className={styles.abHeadline}>{copy.headline}</div>
        {copy.subline && <div className={styles.abSubline}>{copy.subline}</div>}
        <div className={styles.lineBadge} style={{ borderColor: accent, color: accent, marginTop: 30 }}>{product.shortName}</div>
      </div>
      <div className={styles.abBottom}>
        <div className={styles.abCta} style={{ borderColor: accent, color: accent }}>→ {copy.cta}</div>
        <div className={styles.url}>nzgroup.com.br</div>
      </div>
    </>
  );
}
