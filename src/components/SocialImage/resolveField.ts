import type {
  SocialFieldKey,
  SocialFieldOverrides,
  SocialImageData,
} from './socialImageTypes';

export interface ResolvedField {
  text: string;
  hidden: boolean;
  /** True quando o campo pode ser renderizado (não-oculto e com texto). */
  visible: boolean;
}

/**
 * Centraliza a regra "qual texto exibir + esconder?" pra todos os layouts.
 * Cada layout chama `resolve(data, key, defaultText)` e renderiza só se
 * `.visible` for true.
 *
 * Override.value sobrescreve o default. Override.hidden=true esconde mesmo
 * que tenha texto. Sem override: usa o default (comportamento legado).
 */
export function resolveField(
  overrides: SocialFieldOverrides | undefined,
  key: SocialFieldKey,
  defaultText: string
): ResolvedField {
  const o = overrides?.[key];
  const text = (o?.value ?? defaultText) || '';
  const hidden = o?.hidden === true;
  return {
    text,
    hidden,
    visible: !hidden && text.length > 0,
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
