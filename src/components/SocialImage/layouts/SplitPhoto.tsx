import styles from '../SocialImage.module.css';
import type { SocialImageData } from '../socialImageTypes';
import { field } from '../resolveField';
import Wordmark from '../Wordmark';

export default function SplitPhoto({ data }: { data: SocialImageData }) {
  const { product, copy, accent } = data;

  const lineBadge = field(data, 'lineBadge', product.shortName);
  const headline = field(data, 'headline', copy.headline);
  const subline = field(data, 'subline', copy.subline);
  const cta = field(data, 'cta', copy.cta);

  return (
    <div className={styles.spWrap}>
      <div className={styles.spPhoto} style={{ backgroundImage: `url('${product.image}')` }} />
      <div className={styles.spContent}>
        <Wordmark data={data} />
        {lineBadge.visible && (
          <div className={styles.lineBadge} style={{ borderColor: accent, color: accent }}>
            {lineBadge.text}
          </div>
        )}
        {headline.visible && <div className={styles.spHeadline}>{headline.text}</div>}
        {subline.visible && <div className={styles.spSubline}>{subline.text}</div>}
        {cta.visible && (
          <div className={styles.spCta} style={{ color: accent }}>→ {cta.text}</div>
        )}
      </div>
    </div>
  );
}
