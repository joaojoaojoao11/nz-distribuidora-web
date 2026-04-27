import styles from '../SocialImage.module.css';
import type { SocialImageData } from '../socialImageTypes';

export default function CenteredQuote({ data }: { data: SocialImageData }) {
  const { copy, accent } = data;
  return (
    <>
      <div className={styles.cqTop}>
        <div className={styles.wordmark}>NZPPF</div>
      </div>
      <div className={styles.cqCenter}>
        <div className={styles.cqMark} style={{ color: accent }}>"</div>
        <div className={styles.cqHeadline}>{copy.headline}</div>
        {copy.subline && (
          <div className={styles.cqAttribution} style={{ color: accent }}>{copy.subline}</div>
        )}
      </div>
      <div className={styles.cqBottom}>
        <div className={styles.url}>nzgroup.com.br</div>
      </div>
    </>
  );
}
