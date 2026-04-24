import type { ReactNode } from 'react';
import styles from './Catalog.module.css';
import { TOTAL_PAGES, catalogMeta } from './data/catalogData';

interface CatalogPageProps {
  pageNumber: number;
  children: ReactNode;
  bare?: boolean;
  hideFooter?: boolean;
  /** Omite a metade esquerda do footer (brand + url), mantém o número da página */
  hideBrand?: boolean;
  /** Quando true, remove o background.png (usar em capa/contracapa que têm imagem própria) */
  noBg?: boolean;
  /** Total de páginas do catálogo (varia com o modo: 14 padrão, 19 completo) */
  totalPages?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function CatalogPage({
  pageNumber,
  children,
  bare = false,
  hideFooter = false,
  hideBrand = false,
  noBg = false,
  totalPages = TOTAL_PAGES,
  className = '',
  style
}: CatalogPageProps) {
  return (
    <div
      className={`${styles.page} ${noBg ? styles.pageNoBg : ''} ${className}`}
      data-catalog-page={pageNumber}
      style={style}
    >
      {children}

      {!hideFooter && !bare && (
        <div className={styles.footer}>
          <span>{hideBrand ? '' : `${catalogMeta.brand}  •  ${catalogMeta.url}`}</span>
          <span className={styles.pageNum}>
            {String(pageNumber).padStart(2, '0')} / {String(totalPages).padStart(2, '0')}
          </span>
        </div>
      )}
    </div>
  );
}
