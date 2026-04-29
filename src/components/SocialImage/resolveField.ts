import type {
  SocialFieldKey,
  SocialFieldOverrides,
  SocialImageData,
  ResolvedTransform,
} from './socialImageTypes';

export interface ResolvedField {
  text: string;
  hidden: boolean;
  /** True quando o campo pode ser renderizado (não-oculto e com texto). */
  visible: boolean;
  /** Transform manual (drag offset + scale). null quando neutro. */
  transform: ResolvedTransform | null;
}

/**
 * Centraliza a regra "qual texto exibir + esconder + transform manual?"
 * pra todos os layouts. Cada layout chama `resolve(data, key, defaultText)`
 * e renderiza só se `.visible` for true; aplica `.transform` quando não-null.
 *
 * Override.value sobrescreve o default. Override.hidden=true esconde mesmo
 * que tenha texto. Override.offsetX/offsetY/scale viram um ResolvedTransform
 * usado pelos layouts pra montar o `style.transform`.
 */
export function resolveField(
  overrides: SocialFieldOverrides | undefined,
  key: SocialFieldKey,
  defaultText: string
): ResolvedField {
  const o = overrides?.[key];
  const text = (o?.value ?? defaultText) || '';
  const hidden = o?.hidden === true;
  const visible = !hidden && text.length > 0;

  // Só monta transform se houver alguma componente não-neutra. Mantém o
  // JSX limpo (sem inline style desnecessário) quando o usuário não tocou.
  const ox = o?.offsetX ?? 0;
  const oy = o?.offsetY ?? 0;
  const sc = o?.scale ?? 1;
  const hasTransform = ox !== 0 || oy !== 0 || sc !== 1;

  return {
    text,
    hidden,
    visible,
    transform: hasTransform ? { offsetX: ox, offsetY: oy, scale: sc } : null,
  };
}

/** Atalho que recebe o data inteiro (mais ergonômico no JSX). */
export function field(
  data: SocialImageData,
  key: SocialFieldKey,
  defaultText: string
): ResolvedField {
  return resolveField(data.fieldOverrides, key, defaultText);
}

/**
 * Converte um ResolvedTransform em string CSS pra inline style.transform.
 * Vazio quando neutro. transformOrigin=center pra que scale não desloque
 * o elemento sozinho.
 */
export function transformToCss(t: ResolvedTransform | null): string {
  if (!t) return '';
  const parts: string[] = [];
  if (t.offsetX !== 0 || t.offsetY !== 0) {
    parts.push(`translate(${t.offsetX}px, ${t.offsetY}px)`);
  }
  if (t.scale !== 1) parts.push(`scale(${t.scale})`);
  return parts.join(' ');
}
