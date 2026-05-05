import { type CSSProperties, type ReactNode } from 'react';
import { useElementFontScale, useElementHidden } from './useCatalogOverrides';

/**
 * Wrapper para elementos NÃO-textuais editáveis pelo PageEditor
 * (logos, ícones, QRs, imagens decorativas).
 *
 * Funções:
 *  • Lê `useElementHidden` — quando true, retorna null.
 *  • Lê `useElementFontScale` (reutilizado como escala genérica de tamanho)
 *    e expõe via `--element-scale` no inline style. O CSS do filho consome
 *    a var em `width`/`height`/`max-width` etc.
 *  • Marca data-edit-key={pageId}|{fieldKey} pra click-to-focus do PageEditor.
 *
 * Diferente de EditableText, não troca conteúdo — só envelopa o filho.
 *
 * Uso:
 *   <EditableElement pageId="cover" fieldKey="logo">
 *     <img className={styles.coverLogo} src="..." alt="..." />
 *   </EditableElement>
 */

interface EditableElementProps {
  pageId: string;
  fieldKey: string;
  children: ReactNode;
  /** Quando false, ignora hide flag (para elementos críticos). */
  allowHide?: boolean;
  /** Estilos extras no wrapper. */
  style?: CSSProperties;
  /** Classe extra no wrapper. */
  className?: string;
}

export default function EditableElement({
  pageId,
  fieldKey,
  children,
  allowHide = true,
  style,
  className,
}: EditableElementProps) {
  const hidden = useElementHidden(pageId, fieldKey);
  const scale = useElementFontScale(pageId, fieldKey);

  if (allowHide && hidden) return null;

  const mergedStyle: CSSProperties = {
    display: 'inline-block',
    ...style,
    ['--element-scale' as string]: scale,
  };

  return (
    <span
      data-edit-key={`${pageId}|${fieldKey}`}
      className={className}
      style={mergedStyle}
    >
      {children}
    </span>
  );
}
