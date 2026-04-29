import styles from '../SocialImage.module.css';
import type { SocialImageData } from '../socialImageTypes';
import { field } from '../resolveField';
import Wordmark from '../Wordmark';
import EditableElement from '../EditableElement';

export default function FullBleedHeadline({ data }: { data: SocialImageData }) {
  const { product, copy, accent } = data;

  const lineBadge = field(data, 'lineBadge', product.shortName);
  const headline = field(data, 'headline', copy.headline);
  const footer = field(data, 'footer', 'nzgroup.com.br');

  const ov = data.fieldOverrides;

  return (
    <>
      <div className={styles.fbTop}>
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
      <div className={styles.fbCenter}>
        {headline.visible && (
          <EditableElement
            fieldKey="headline"
            className={styles.fbHeadline}
            override={ov?.headline}
          >
            {headline.text}
          </EditableElement>
        )}
      </div>
      <div className={styles.fbBottom}>
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
