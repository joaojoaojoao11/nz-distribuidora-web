import type { ReactNode } from 'react';
import styles from './Catalog.module.css';
import { TOTAL_PAGES, catalogMeta } from './data/catalogData';
import {
  useEditableText,
  useElementHidden,
} from './useCatalogOverrides';

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
  /**
   * pageId no sistema de overrides. Quando definido, o footer (brand +
   * número) fica editável no PageEditor via fieldKeys "footer.brand" e
   * "footer.pageNum". O hide do "footer" oculta o rodapé inteiro.
   */
  pageId?: string;
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
  style,
  pageId,
}: CatalogPageProps) {
  // Defaults dinâmicos: brand combina com `catalogMeta`, número formatado
  // como "01 / 14" e cresce com o totalPages.
  const defaultBrand = `${catalogMeta.brand}  •  ${catalogMeta.url}`;
  const defaultPageNum = `${String(pageNumber).padStart(2, '0')} / ${String(totalPages).padStart(2, '0')}`;

  // Hooks só fazem sentido quando há pageId; quando ausente (preview de
  // teste, contextos sem Provider), caímos nos defaults sem usar hooks.
  // Como as Rules of Hooks proíbem chamadas condicionais, sempre chamamos
  // mas com pageId fallback "__nopage" — esse pageId nunca é usado pelo
  // editor então os overrides em cima dele permanecem vazios.
  const safePageId = pageId || '__nopage';
  const brandText = useEditableText(safePageId, 'footer.brand', defaultBrand);
  // Default vazio para pageNum no override → quando o usuário deixa em
  // branco, cai no `defaultPageNum` computado dinamicamente (auto).
  // Quando ele digita algo, sobrescreve.
  const pageNumOverride = useEditableText(safePageId, 'footer.pageNum', '');
  const pageNumText = pageNumOverride.trim() || defaultPageNum;
  const footerHidden = useElementHidden(safePageId, 'footer');
  const brandHidden = useElementHidden(safePageId, 'footer.brand');
  const pageNumHidden = useElementHidden(safePageId, 'footer.pageNum');

  const renderFooter = !hideFooter && !bare && !footerHidden;
  const dataKeyPrefix = pageId || '';

  return (
    <div
      className={`${styles.page} ${noBg ? styles.pageNoBg : ''} ${className}`}
      data-catalog-page={pageNumber}
      style={style}
    >
      {children}

      {renderFooter && (
        <div className={styles.footer}>
          {!brandHidden && (
            <span data-edit-key={pageId ? `${dataKeyPrefix}|footer.brand` : undefined}>
              {hideBrand ? '' : brandText}
            </span>
          )}
          {!pageNumHidden && (
            <span
              className={styles.pageNum}
              data-edit-key={pageId ? `${dataKeyPrefix}|footer.pageNum` : undefined}
            >
              {pageNumText}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
