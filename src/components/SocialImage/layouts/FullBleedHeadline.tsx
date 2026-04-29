import styles from '../SocialImage.module.css';
import type { SocialImageData } from '../socialImageTypes';
import { field } from '../resolveField';

export default function FullBleedHeadline({ data }: { data: SocialImageData }) {
  const { product, copy, accent, brandName } = data;

  const wordmark = field(data, 'wordmark', brandName);
  const lineBadge = field(data, 'lineBadge', product.shortName);
  const headline = field(data, 'headline', copy.headline);
  const footer = field(data, 'footer', 'nzgroup.com.br');

  return (
    <>
      <div className={styles.fbTop}>
        {wordmark.visible && <div className={styles.wordmark}>{wordmark.text}</div>}
        {lineBadge.visible && (
          <div className={styles.lineBadge} style={{ borderColor: accent, color: accent }}>
            {lineBadge.text}
          </div>
        )}
      </div>
      <div className={styles.fbCenter}>
        {headline.visible && <div className={styles.fbHeadline}>{headline.text}</div>}
      </div>
      <div className={styles.fbBottom}>
        {footer.visible && <div className={styles.url}>{footer.text}</div>}
      </div>
    </>
  );
}
