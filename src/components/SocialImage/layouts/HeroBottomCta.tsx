import styles from '../SocialImage.module.css';
import type { SocialImageData } from '../socialImageTypes';
import { field } from '../resolveField';

export default function HeroBottomCta({ data }: { data: SocialImageData }) {
  const { product, copy, accent, brandName } = data;

  const wordmark = field(data, 'wordmark', brandName);
  const lineBadge = field(data, 'lineBadge', product.shortName);
  const eyebrow = field(data, 'eyebrow', product.subtitle);
  const headline = field(data, 'headline', copy.headline);
  const subline = field(data, 'subline', copy.subline);
  const cta = field(data, 'cta', copy.cta);
  const footer = field(data, 'footer', 'nzgroup.com.br');

  return (
    <>
      <div className={styles.hbcTop}>
        {wordmark.visible && <div className={styles.wordmark}>{wordmark.text}</div>}
        {lineBadge.visible && (
          <div className={styles.lineBadge} style={{ borderColor: accent, color: accent }}>
            {lineBadge.text}
          </div>
        )}
      </div>
      <div className={styles.hbcCenter}>
        {eyebrow.visible && (
          <div className={styles.hbcEyebrow} style={{ color: accent }}>
            {eyebrow.text}
          </div>
        )}
        {headline.visible && <div className={styles.hbcHeadline}>{headline.text}</div>}
        {subline.visible && <div className={styles.hbcSubline}>{subline.text}</div>}
      </div>
      <div className={styles.hbcBottom}>
        {cta.visible && (
          <div className={styles.hbcCta} style={{ borderColor: accent }}>
            <span className={styles.hbcCtaArrow} style={{ color: accent }}>→</span>
            <span className={styles.hbcCtaText}>{cta.text}</span>
          </div>
        )}
        {footer.visible && <div className={styles.url}>{footer.text}</div>}
      </div>
    </>
  );
}
