import styles from '../SocialImage.module.css';
import type { SocialImageData } from '../socialImageTypes';
import { field } from '../resolveField';
import Wordmark from '../Wordmark';
import EditableElement from '../EditableElement';

export default function HeroBottomCta({ data }: { data: SocialImageData }) {
  const { product, copy, accent } = data;

  const lineBadge = field(data, 'lineBadge', product.shortName);
  const eyebrow = field(data, 'eyebrow', product.subtitle);
  const headline = field(data, 'headline', copy.headline);
  const subline = field(data, 'subline', copy.subline);
  const cta = field(data, 'cta', copy.cta);
  const footer = field(data, 'footer', 'nzgroup.com.br');

  const ov = data.fieldOverrides;

  return (
    <>
      <div className={styles.hbcTop}>
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
      </div>
      <div className={styles.hbcCenter}>
        {eyebrow.visible && (
          <EditableElement
            fieldKey="eyebrow"
            className={styles.hbcEyebrow}
            style={{ color: accent }}
            override={ov?.eyebrow}
          >
            {eyebrow.text}
          </EditableElement>
        )}
        {headline.visible && (
          <EditableElement
            fieldKey="headline"
            className={styles.hbcHeadline}
            override={ov?.headline}
          >
            {headline.text}
          </EditableElement>
        )}
        {subline.visible && (
          <EditableElement
            fieldKey="subline"
            className={styles.hbcSubline}
            override={ov?.subline}
          >
            {subline.text}
          </EditableElement>
        )}
      </div>
      <div className={styles.hbcBottom}>
        {cta.visible && (
          <EditableElement
            fieldKey="cta"
            className={styles.hbcCta}
            style={{ borderColor: accent }}
            override={ov?.cta}
          >
            <span className={styles.hbcCtaArrow} style={{ color: accent }}>→</span>
            <span className={styles.hbcCtaText}>{cta.text}</span>
          </EditableElement>
        )}
        {footer.visible && (
          <EditableElement
            fieldKey="footer"
            className={styles.url}
            override={ov?.footer}
          >
            {footer.text}
          </EditableElement>
        )}
      </div>
    </>
  );
}
