import { createElement, type CSSProperties, type ReactNode } from 'react';
import {
  useEditableText,
  useElementHidden,
  useElementFontScale,
  useElementLetterSpacing,
  useElementOffset,
} from './useCatalogOverrides';
import { sanitizeCatalogText } from '../../utils/sanitize';

/**
 * Componente-helper para textos editáveis pelo PageEditor.
 *
 * Funções:
 *  • Lê o override do usuário (texto ou hidden) via Provider.
 *  • Aplica `data-edit-key={pageId}|{fieldKey}` para permitir clique no
 *    preview do PageEditor focar o campo correspondente.
 *  • Quando hidden=true (e allowHide=true), retorna null.
 *  • Quando o texto contém quebras de linha (`\n`) e `multiline=true`,
 *    converte em <br/> intercalados.
 *
 * Uso:
 *   <EditableText
 *     pageId="manifest"
 *     fieldKey="paragraph.0"
 *     defaultValue="A maioria nasce em laboratório..."
 *     as="p"
 *     className={styles.body}
 *   />
 */

type ElementTagName = 'div' | 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'strong' | 'em' | 'b' | 'i';

interface EditableTextProps {
  pageId: string;
  fieldKey: string;
  defaultValue: string;
  /** Tag HTML a renderizar. Default: 'span'. */
  as?: ElementTagName;
  className?: string;
  style?: CSSProperties;
  /** Renderiza children no lugar do texto — útil pra envolver com markup extra. */
  children?: (text: string) => ReactNode;
  /** Quando true, transforma '\n' em <br/>. */
  multiline?: boolean;
  /** Quando false, ignora a flag hidden — útil pra textos críticos sem opção de ocultar. */
  allowHide?: boolean;
  /** Atributos extras a passar pra o elemento. */
  ariaHidden?: boolean;
}

export default function EditableText({
  pageId,
  fieldKey,
  defaultValue,
  as = 'span',
  className,
  style,
  children,
  multiline = false,
  allowHide = true,
  ariaHidden,
}: EditableTextProps) {
  const rawText = useEditableText(pageId, fieldKey, defaultValue);
  const hidden = useElementHidden(pageId, fieldKey);
  const fontScale = useElementFontScale(pageId, fieldKey);
  const letterSpacing = useElementLetterSpacing(pageId, fieldKey);
  const offset = useElementOffset(pageId, fieldKey);

  if (allowHide && hidden) return null;

  // Roda a sanitização também na render-path: garante que overrides
  // digitados pelo usuário passem pelas regras anti-html2canvas (NBSP
  // após siglas, hífens compostos, etc) — mesmo tratamento que o
  // `deepSanitize` já dá aos defaults em catalogData.ts.
  const text = sanitizeCatalogText(rawText);
  const dataKey = `${pageId}|${fieldKey}`;

  // Compõe o style final:
  //   • Quando há fontScale ≠ 1, expõe `--field-scale` no inline style.
  //     Os tokens tipográficos no CSS multiplicam por esse var(), então
  //     o ajuste se compõe com `--user-scale` da página.
  //   • Quando o style do consumer já traz `fontSize` numérico inline
  //     (ex: pull quotes do CEOLetter com fontSize: 56), também
  //     multiplica diretamente — esses casos não passam por tokens.
  //   • Quando há letterSpacing ≠ 0, sobrescreve o letter-spacing herdado
  //     da classe pai diretamente no inline. Em em pra escalar com a
  //     fonte; mesmo ratio visual no preview e no PDF.
  let mergedStyle: CSSProperties | undefined = style;
  const hasOffset = offset.x !== 0 || offset.y !== 0;
  if (fontScale !== 1 || letterSpacing !== 0 || hasOffset) {
    const next: Record<string, unknown> = { ...(style ?? {}) };
    if (fontScale !== 1) {
      next['--field-scale'] = fontScale;
      if (typeof next.fontSize === 'number') {
        next.fontSize = (next.fontSize as number) * fontScale;
      }
    }
    if (letterSpacing !== 0) {
      next.letterSpacing = `${letterSpacing}em`;
    }
    if (hasOffset) {
      // translate em px no referencial da página real (1819×2551). O preview
      // do PageEditor já está dentro de um transform: scale(...), mas como o
      // translate é em px na coordenada do contexto local, o escalamento
      // acompanha automaticamente (translate(20px) escalado em 0.4 = 8px
      // visuais no preview, mas mantém 20px reais no PDF).
      const existingTransform =
        typeof next.transform === 'string' ? next.transform + ' ' : '';
      next.transform = `${existingTransform}translate(${offset.x}px, ${offset.y}px)`;
      // display: inline-block garante que o translate funcione em spans
      // inline (default do EditableText) sem afetar o fluxo dos vizinhos.
      if (!next.display) next.display = 'inline-block';
    }
    mergedStyle = next as CSSProperties;
  }

  let content: ReactNode;
  if (children) {
    content = children(text);
  } else if (multiline && text.includes('\n')) {
    const lines = text.split('\n');
    content = lines.flatMap((line, i) =>
      i === 0 ? [line] : [createElement('br', { key: `br-${i}` }), line]
    );
  } else {
    content = text;
  }

  return createElement(
    as,
    {
      'data-edit-key': dataKey,
      className,
      style: mergedStyle,
      'aria-hidden': ariaHidden,
    },
    content
  );
}
