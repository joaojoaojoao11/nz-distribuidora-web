import { createContext, useContext } from 'react';
import type { SocialFieldKey } from './socialImageTypes';

/**
 * Contexto que carrega o estado e callbacks do "edit mode" (manipulação
 * direta no canvas estilo Canva) pros EditableElements de dentro dos
 * layouts. AdminSocialCarousel envolve a coluna VISÍVEL do preview com
 * o provider; a coluna off-screen (usada pra exportar PNG) renderiza SEM
 * o provider, então EditableElement enxerga `null` e cai em "plain render".
 *
 * Isso garante que:
 *   1. Os offsets/scale persistidos no override são aplicados em ambos
 *      preview e export (porque o transform é dirigido pelos props do
 *      EditableElement, não pelo contexto).
 *   2. Os outlines / cursores / pointer listeners SÓ aparecem no preview
 *      visível (controlado por contexto).
 */
export interface EditModeValue {
  /** True quando o toggle "🎨 Editar canvas" está ligado. */
  editable: boolean;
  /** Escala do preview onde este SocialImageDocument está sendo renderizado. */
  previewScale: number;
  /** Campo atualmente selecionado (highlight + abre painel lateral). */
  selectedFieldKey: SocialFieldKey | null;
  /** Callback chamado quando o usuário clica num elemento. */
  onSelectField: (key: SocialFieldKey | null) => void;
  /**
   * Callback chamado durante o drag — recebe os novos offsets já clampados
   * e em pixels do canvas 1080 (não do preview escalado).
   */
  onUpdateOffset: (key: SocialFieldKey, offsetX: number, offsetY: number) => void;
}

const EditModeContext = createContext<EditModeValue | null>(null);

export const EditModeProvider = EditModeContext.Provider;

export function useEditMode(): EditModeValue | null {
  return useContext(EditModeContext);
}
