import styles from '../SocialImage.module.css';
import type { SocialImageData } from '../socialImageTypes';
import { field } from '../resolveField';
import Wordmark from '../Wordmark';
import EditableElement from '../EditableElement';

export default function SplitPhoto({ data }: { data: SocialImageData }) {
  const { product, copy, accent } = data;

  const lineBadge = field(data, 'lineBadge', product.shortName);
  const headline = field(data, 'headline', copy.headline);
  const subline = field(data, 'subline', copy.subline);
  const cta = field(data, 'cta', copy.cta);

  const ov = data.fieldOverrides;

  return (
    <div className={styles.spWrap}>
      <div className={styles.spPhoto} style={{ backgroundImage: `url('${product.image}')` }} />
      <div className={styles.spContent}>
        <Wordmark data={data} />
        {lineBadge.visible && (
          <EditableElement
            fieldKey="lineBadge"
            className={styles.lineBadge}
            style={{ borderColor: accent, color: accent }}
            override={ov?.lineBadge}
          >
            {lineBadge.text}
          </EditableElement>
        )}
        {headline.visible && (
          <EditableElement
            fieldKey="headline"
            className={styles.spHeadline}
            override={ov?.headline}
          >
            {headline.text}
          </EditableElement>
        )}
        {subline.visible && (
          <EditableElement
            fieldKey="subline"
            className={styles.spSubline}
            override={ov?.subline}
          >
            {subline.text}
          </EditableElement>
        )}
        {cta.visible && (
          <EditableElement
            fieldKey="cta"
            className={styles.spCta}
            style={{ color: accent }}
            override={ov?.cta}
          >
            → {cta.text}
          </EditableElement>
        )}
      </div>
    </div>
  );
}
