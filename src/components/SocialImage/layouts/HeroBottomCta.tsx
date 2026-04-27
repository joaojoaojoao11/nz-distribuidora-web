import styles from '../SocialImage.module.css';
import type { SocialImageData } from '../socialImageTypes';

export default function HeroBottomCta({ data }: { data: SocialImageData }) {
  const { product, copy, accent } = data;
  return (
    <>
      <div className={styles.hbcTop}>
        <div className={styles.wordmark}>NZPPF</div>
        <div className={styles.lineBadge} style={{ borderColor: accent, color: accent }}>
          {product.shortName}
        </div>
      </div>
      <div className={styles.hbcCenter}>
        <div className={styles.hbcEyebrow} style={{ color: accent }}>
          {product.subtitle}
        </div>
        <div className={styles.hbcHeadline}>{copy.headline}</div>
        {copy.subline && <div className={styles.hbcSubline}>{copy.subline}</div>}
      </div>
      <div className={styles.hbcBottom}>
        <div className={styles.hbcCta} style={{ borderColor: accent }}>
          <span className={styles.hbcCtaArrow} style={{ color: accent }}>→</span>
          <span className={styles.hbcCtaText}>{copy.cta}</span>
        </div>
        <div className={styles.url}>nzgroup.com.br</div>
      </div>
    </>
  );
}
