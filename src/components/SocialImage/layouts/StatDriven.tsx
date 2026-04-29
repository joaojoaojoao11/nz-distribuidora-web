import styles from '../SocialImage.module.css';
import type { SocialImageData } from '../socialImageTypes';
import { field } from '../resolveField';
import Wordmark from '../Wordmark';
import EditableElement from '../EditableElement';

export default function StatDriven({ data }: { data: SocialImageData }) {
  const { product, copy, accent } = data;

  const lineBadge = field(data, 'lineBadge', product.shortName);
  const stat = field(data, 'stat', copy.stat || '12 ANOS');
  const statLabel = field(data, 'statLabel', copy.statLabel || 'DE GARANTIA REAL');
  const subline = field(data, 'subline', copy.subline);
  const cta = field(data, 'cta', copy.cta);
  const footer = field(data, 'footer', 'nzgroup.com.br');

  const ov = data.fieldOverrides;

  return (
    <>
      <div className={styles.sdTop}>
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
      <div className={styles.sdCenter}>
        {stat.visible && (
          <EditableElement
            fieldKey="stat"
            className={styles.sdStat}
            style={{ color: accent }}
            override={ov?.stat}
          >
            {stat.text}
          </EditableElement>
        )}
        {statLabel.visible && (
          <EditableElement
            fieldKey="statLabel"
            className={styles.sdLabel}
            override={ov?.statLabel}
          >
            {statLabel.text}
          </EditableElement>
        )}
        {subline.visible && (
          <EditableElement
            fieldKey="subline"
            className={styles.sdSubline}
            override={ov?.subline}
          >
            {subline.text}
          </EditableElement>
        )}
      </div>
      <div className={styles.sdBottom}>
        {footer.visible && (
          <EditableElement
            fieldKey="footer"
            className={styles.url}
            override={ov?.footer}
          >
            {footer.text}
          </EditableElement>
        )}
        {cta.visible && (
          <EditableElement
            fieldKey="cta"
            className={styles.sdCta}
            style={{ color: accent }}
            override={ov?.cta}
          >
            → {cta.text}
          </EditableElement>
        )}
      </div>
    </>
  );
}
