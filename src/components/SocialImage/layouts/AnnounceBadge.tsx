import styles from '../SocialImage.module.css';
import type { SocialImageData } from '../socialImageTypes';
import { field } from '../resolveField';
import Wordmark from '../Wordmark';
import EditableElement from '../EditableElement';

export default function AnnounceBadge({ data }: { data: SocialImageData }) {
  const { product, copy, accent } = data;

  const badge = field(data, 'badge', copy.badge || 'NOVO');
  const headline = field(data, 'headline', copy.headline);
  const subline = field(data, 'subline', copy.subline);
  const lineBadge = field(data, 'lineBadge', product.shortName);
  const cta = field(data, 'cta', copy.cta);
  const footer = field(data, 'footer', 'nzgroup.com.br');

  const ov = data.fieldOverrides;

  return (
    <>
      <div className={styles.abTop}>
        <Wordmark data={data} />
      </div>
      <div className={styles.abCenter}>
        {badge.visible && (
          <EditableElement
            fieldKey="badge"
            className={styles.abBadge}
            style={{ background: accent }}
            override={ov?.badge}
          >
            {badge.text}
          </EditableElement>
        )}
        {headline.visible && (
          <EditableElement
            fieldKey="headline"
            className={styles.abHeadline}
            override={ov?.headline}
          >
            {headline.text}
          </EditableElement>
        )}
        {subline.visible && (
          <EditableElement
            fieldKey="subline"
            className={styles.abSubline}
            override={ov?.subline}
          >
            {subline.text}
          </EditableElement>
        )}
        {lineBadge.visible && (
          <EditableElement
            fieldKey="lineBadge"
            className={styles.lineBadge}
            style={{ borderColor: accent, color: accent, marginTop: 30 }}
            override={ov?.lineBadge}
          >
            {lineBadge.text}
          </EditableElement>
        )}
      </div>
      <div className={styles.abBottom}>
        {cta.visible && (
          <EditableElement
            fieldKey="cta"
            className={styles.abCta}
            style={{ borderColor: accent, color: accent }}
            override={ov?.cta}
          >
            → {cta.text}
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
