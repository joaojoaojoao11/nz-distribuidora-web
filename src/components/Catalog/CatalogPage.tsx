import type { ReactNode } from 'react';
import styles from './Catalog.module.css';
import { TOTAL_PAGES, catalogMeta } from './data/catalogData';

interface CatalogPageProps {
  pageNumber: number;
  children: ReactNode;
  bare?: boolean;
  hideFooter?: boolean;
  /** Quando true, remove o background.png (usar em capa/contracapa que têm imagem própria) */
  noBg?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function CatalogPage({ pageNumber, children, bare = false, hideFooter = false, noBg = false, className = '', style }: CatalogPageProps) {
  return (
    <div
      className={`${styles.page} ${noBg ? styles.pageNoBg : ''} ${className}`}
      data-catalog-page={pageNumber}
      style={style}
    >
      {children}

      {!hideFooter && !bare && (
        <div className={styles.footer}>
          <span>{catalogMeta.brand}  •  {catalogMeta.url}</span>
          <span className={styles.pageNum}>
            {String(pageNumber).padStart(2, '0')} / {String(TOTAL_PAGES).padStart(2, '0')}
          </span>
        </div>
      )}
    </div>
  );
}
