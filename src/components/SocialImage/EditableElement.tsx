import { type CSSProperties, type PointerEvent, type ReactNode } from 'react';
import styles from './SocialImage.module.css';
import { TRANSFORM_LIMITS, type SocialFieldKey, type SocialFieldOverride } from './socialImageTypes';
import { useEditMode } from './EditModeContext';

/**
 * Wrapper genérico pros elementos textuais/visuais dos layouts. Aplica
 * sempre o `transform` (translate + scale) vindo do override — pra que
 * preview e export PNG fiquem consistentes.
 *
 * Quando há um `EditModeProvider` ancestral (preview visível em modo
 * edição), adiciona seleção via clique e drag-to-move via pointer events
 * nativos. O drag converte coordenadas do preview escalado pro espaço do
 * canvas 1080 dividindo pelo `previewScale` do contexto.
 *
 * Coordenadas: o offset persistido é SEMPRE em pixels do canvas 1080.
 * Isso garante que o PNG exportado (off-screen sem scale) tenha a mesma
 * posição relativa do que o preview escalado mostra.
 */
export interface EditableElementProps {
  /** Chave do campo (wordmark, headline, etc) — usada como data-attribute e
   *  pra identificar seleção no contexto de edit mode. */
  fieldKey: SocialFieldKey;
  className?: string;
  /** Estilos extras (cores, border etc) — preservados e mesclados com transform. */
  style?: CSSProperties;
  /** Override atual do campo. O transform é calculado a partir daqui. */
  override?: SocialFieldOverride;
  children?: ReactNode;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export default function EditableElement({
  fieldKey,
  className,
  style,
  override,
  children,
}: EditableElementProps) {
  const ctx = useEditMode();
  const editable = ctx?.editable ?? false;
  const isSelected = ctx?.selectedFieldKey === fieldKey;
  const previewScale = ctx?.previewScale ?? 1;

  const ox = override?.offsetX ?? 0;
  const oy = override?.offsetY ?? 0;
  const sc = override?.scale ?? 1;
  const hasTransform = ox !== 0 || oy !== 0 || sc !== 1;

  const transformParts: string[] = [];
  if (ox !== 0 || oy !== 0) transformParts.push(`translate(${ox}px, ${oy}px)`);
  if (sc !== 1) transformParts.push(`scale(${sc})`);

  const finalStyle: CSSProperties = {
    ...style,
    ...(hasTransform
      ? { transform: transformParts.join(' '), transformOrigin: 'center center' }
      : {}),
  };

  // Modo preview puro (sem provider OU edit mode desligado): render plain.
  // Inclui o off-screen do export → garante que PNG sai com transforms.
  if (!editable || !ctx) {
    return (
      <div data-field-key={fieldKey} className={className} style={finalStyle}>
        {children}
      </div>
    );
  }

  // Edit mode: clique seleciona + drag move. setPointerCapture mantém o
  // drag mesmo se o cursor sair do elemento.
  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    e.stopPropagation();
    ctx?.onSelectField(fieldKey);

    const target = e.currentTarget;
    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startOx = ox;
    const startOy = oy;
    const pointerId = e.pointerId;
    target.setPointerCapture(pointerId);

    const handleMove = (ev: globalThis.PointerEvent) => {
      const dx = (ev.clientX - startClientX) / previewScale;
      const dy = (ev.clientY - startClientY) / previewScale;
      const nx = clamp(startOx + dx, TRANSFORM_LIMITS.offsetMin, TRANSFORM_LIMITS.offsetMax);
      const ny = clamp(startOy + dy, TRANSFORM_LIMITS.offsetMin, TRANSFORM_LIMITS.offsetMax);
      ctx?.onUpdateOffset(fieldKey, nx, ny);
    };

    const cleanup = () => {
      try {
        target.releasePointerCapture(pointerId);
      } catch {
        /* já liberado */
      }
      target.removeEventListener('pointermove', handleMove);
      target.removeEventListener('pointerup', cleanup);
      target.removeEventListener('pointercancel', cleanup);
    };

    target.addEventListener('pointermove', handleMove);
    target.addEventListener('pointerup', cleanup);
    target.addEventListener('pointercancel', cleanup);
  }

  const editClassName = [
    className,
    styles.editable,
    isSelected ? styles.editableSelected : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      data-field-key={fieldKey}
      className={editClassName}
      style={finalStyle}
      onPointerDown={handlePointerDown}
    >
      {children}
    </div>
  );
}
