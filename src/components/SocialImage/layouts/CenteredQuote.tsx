import styles from '../SocialImage.module.css';
import type { SocialImageData } from '../socialImageTypes';
import { field } from '../resolveField';
import Wordmark from '../Wordmark';
import EditableElement from '../EditableElement';

export default function CenteredQuote({ data }: { data: SocialImageData }) {
  const { copy, accent } = data;

  const headline = field(data, 'headline', copy.headline);
  const subline = field(data, 'subline', copy.subline);
  const footer = field(data, 'footer', 'nzgroup.com.br');

  const ov = data.fieldOverrides;

  return (
    <>
      <div className={styles.cqTop}>
        <Wordmark data={data} />
      </div>
      <div className={styles.cqCenter}>
        {headline.visible && (
          <div className={styles.cqMark} style={{ color: accent }}>"</div>
        )}
        {headline.visible && (
          <EditableElement
            fieldKey="headline"
            className={styles.cqHeadline}
            override={ov?.headline}
          >
            {headline.text}
          </EditableElement>
        )}
        {subline.visible && (
          <EditableElement
            fieldKey="subline"
            className={styles.cqAttribution}
            style={{ color: accent }}
            override={ov?.subline}
          >
            {subline.text}
          </EditableElement>
        )}
      </div>
      <div className={styles.cqBottom}>
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
