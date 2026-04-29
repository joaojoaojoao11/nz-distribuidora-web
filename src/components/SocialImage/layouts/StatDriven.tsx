import styles from '../SocialImage.module.css';
import type { SocialImageData } from '../socialImageTypes';
import { field } from '../resolveField';
import Wordmark from '../Wordmark';

export default function StatDriven({ data }: { data: SocialImageData }) {
  const { product, copy, accent } = data;

  const lineBadge = field(data, 'lineBadge', product.shortName);
  const stat = field(data, 'stat', copy.stat || '12 ANOS');
  const statLabel = field(data, 'statLabel', copy.statLabel || 'DE GARANTIA REAL');
  const subline = field(data, 'subline', copy.subline);
  const cta = field(data, 'cta', copy.cta);
  const footer = field(data, 'footer', 'nzgroup.com.br');

  return (
    <>
      <div className={styles.sdTop}>
        <Wordmark data={data} />
        {lineBadge.visible && (
          <div className={styles.lineBadge} style={{ borderColor: accent, color: accent }}>
            {lineBadge.text}
          </div>
        )}
      </div>
      <div className={styles.sdCenter}>
        {stat.visible && <div className={styles.sdStat} style={{ color: accent }}>{stat.text}</div>}
        {statLabel.visible && <div className={styles.sdLabel}>{statLabel.text}</div>}
        {subline.visible && <div className={styles.sdSubline}>{subline.text}</div>}
      </div>
      <div className={styles.sdBottom}>
        {footer.visible && <div className={styles.url}>{footer.text}</div>}
        {cta.visible && (
          <div className={styles.sdCta} style={{ color: accent }}>→ {cta.text}</div>
        )}
      </div>
    </>
  );
}
