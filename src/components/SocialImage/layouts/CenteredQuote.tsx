import styles from '../SocialImage.module.css';
import type { SocialImageData } from '../socialImageTypes';
import { field } from '../resolveField';

export default function CenteredQuote({ data }: { data: SocialImageData }) {
  const { copy, accent, brandName } = data;

  const wordmark = field(data, 'wordmark', brandName);
  const headline = field(data, 'headline', copy.headline);
  const subline = field(data, 'subline', copy.subline);
  const footer = field(data, 'footer', 'nzgroup.com.br');

  return (
    <>
      <div className={styles.cqTop}>
        {wordmark.visible && <div className={styles.wordmark}>{wordmark.text}</div>}
      </div>
      <div className={styles.cqCenter}>
        {headline.visible && <div className={styles.cqMark} style={{ color: accent }}>"</div>}
        {headline.visible && <div className={styles.cqHeadline}>{headline.text}</div>}
        {subline.visible && (
          <div className={styles.cqAttribution} style={{ color: accent }}>{subline.text}</div>
        )}
      </div>
      <div className={styles.cqBottom}>
        {footer.visible && <div className={styles.url}>{footer.text}</div>}
      </div>
    </>
  );
}
