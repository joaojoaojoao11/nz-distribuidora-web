import styles from '../SocialImage.module.css';
import type { SocialImageData } from '../socialImageTypes';

export default function SplitPhoto({ data }: { data: SocialImageData }) {
  const { product, copy, accent } = data;
  return (
    <div className={styles.spWrap}>
      <div className={styles.spPhoto} style={{ backgroundImage: `url('${product.image}')` }} />
      <div className={styles.spContent}>
        <div className={styles.wordmark}>NZPPF</div>
        <div className={styles.lineBadge} style={{ borderColor: accent, color: accent }}>{product.shortName}</div>
        <div className={styles.spHeadline}>{copy.headline}</div>
        {copy.subline && <div className={styles.spSubline}>{copy.subline}</div>}
        <div className={styles.spCta} style={{ color: accent }}>→ {copy.cta}</div>
      </div>
    </div>
  );
}
