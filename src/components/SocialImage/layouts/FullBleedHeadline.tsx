import styles from '../SocialImage.module.css';
import type { SocialImageData } from '../socialImageTypes';

export default function FullBleedHeadline({ data }: { data: SocialImageData }) {
  const { product, copy, accent } = data;
  return (
    <>
      <div className={styles.fbTop}>
        <div className={styles.wordmark}>NZPPF</div>
        <div className={styles.lineBadge} style={{ borderColor: accent, color: accent }}>{product.shortName}</div>
      </div>
      <div className={styles.fbCenter}>
        <div className={styles.fbHeadline}>{copy.headline}</div>
      </div>
      <div className={styles.fbBottom}>
        <div className={styles.url}>nzgroup.com.br</div>
      </div>
    </>
  );
}
