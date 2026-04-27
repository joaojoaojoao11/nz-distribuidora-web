import { forwardRef } from 'react';
import styles from './SocialImage.module.css';
import HeroBottomCta from './layouts/HeroBottomCta';
import CenteredQuote from './layouts/CenteredQuote';
import SplitPhoto from './layouts/SplitPhoto';
import FullBleedHeadline from './layouts/FullBleedHeadline';
import StatDriven from './layouts/StatDriven';
import AnnounceBadge from './layouts/AnnounceBadge';
import { FORMAT_DIMENSIONS, type SocialImageData } from './socialImageTypes';

interface Props {
  data: SocialImageData;
}

const SocialImageDocument = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  const dims = FORMAT_DIMENSIONS[data.format];
  const formatClass = data.format === 'story-9x16' ? styles.formatStory : styles.formatFeed;

  let layout;
  switch (data.layout) {
    case 'centered-quote':       layout = <CenteredQuote data={data} />; break;
    case 'split-photo':          layout = <SplitPhoto data={data} />; break;
    case 'full-bleed-headline':  layout = <FullBleedHeadline data={data} />; break;
    case 'stat-driven':          layout = <StatDriven data={data} />; break;
    case 'announce-badge':       layout = <AnnounceBadge data={data} />; break;
    case 'hero-bottom-cta':
    default:                     layout = <HeroBottomCta data={data} />;
  }

  return (
    <div ref={ref} className={styles.documentRoot}>
      <div
        data-social-image
        data-layout={data.layout}
        className={`${styles.surface} ${formatClass}`}
        style={{ width: dims.width, height: dims.height }}
      >
        <div
          className={styles.bgImage}
          style={{ backgroundImage: `url('${data.aiBackground || data.product.image}')` }}
        />
        <div className={styles.overlay} />
        <div className={styles.layoutSlot}>{layout}</div>
      </div>
    </div>
  );
});

SocialImageDocument.displayName = 'SocialImageDocument';
export default SocialImageDocument;
