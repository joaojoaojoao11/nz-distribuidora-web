import styles from '../SocialImage.module.css';
import type { SocialImageData } from '../socialImageTypes';
import { field } from '../resolveField';

export default function AnnounceBadge({ data }: { data: SocialImageData }) {
  const { product, copy, accent, brandName } = data;

  const wordmark = field(data, 'wordmark', brandName);
  const badge = field(data, 'badge', copy.badge || 'NOVO');
  const headline = field(data, 'headline', copy.headline);
  const subline = field(data, 'subline', copy.subline);
  const lineBadge = field(data, 'lineBadge', product.shortName);
  const cta = field(data, 'cta', copy.cta);
  const footer = field(data, 'footer', 'nzgroup.com.br');

  return (
    <>
      <div className={styles.abTop}>
        {wordmark.visible && <div className={styles.wordmark}>{wordmark.text}</div>}
      </div>
      <div className={styles.abCenter}>
        {badge.visible && (
          <div className={styles.abBadge} style={{ background: accent }}>{badge.text}</div>
        )}
        {headline.visible && <div className={styles.abHeadline}>{headline.text}</div>}
        {subline.visible && <div className={styles.abSubline}>{subline.text}</div>}
        {lineBadge.visible && (
          <div
            className={styles.lineBadge}
            style={{ borderColor: accent, color: accent, marginTop: 30 }}
          >
            {lineBadge.text}
          </div>
        )}
      </div>
      <div className={styles.abBottom}>
        {cta.visible && (
          <div className={styles.abCta} style={{ borderColor: accent, color: accent }}>
            → {cta.text}
          </div>
        )}
        {footer.visible && <div className={styles.url}>{footer.text}</div>}
      </div>
    </>
  );
}
