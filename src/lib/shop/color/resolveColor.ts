// Resolução de cor — combina família declarada pelo fabricante, tokens do nome
// e bucketing de hex numa única resposta.
//
// Precedência: declarada > nome (specificity >= 2) > hex > nome fraco > hex
// inferido de imagem. A regra que mais importa na prática: quando o nome e o
// hex discordam, o hex ENTRA como família secundária em vez de substituir a do
// nome. É o que faz 'MYSTIC TEAL' (#008080) e 'BLUE CHARM GREEN' aparecerem
// tanto em "azul" quanto em "verde" — que é o comportamento correto para
// camaleão, e o que um resolvedor ingênuo erra.

import { bucketFromHex, type HslBucket } from './hsl';
import {
  ACHROMATIC,
  COLOR_PARENT,
  matchLexicon,
  type ColorFamilyId,
  type ColorSubfamilyId,
} from './lexicon';
import { normalize } from '../types';
import type { ColorConfidence } from '../types';

export interface ResolveColorInput {
  name: string;
  code?: string | null;
  /** Hex publicado pelo fabricante. */
  hex?: string | null;
  /** Família já publicada pela fonte (a M7 publica), mapeada para o nosso enum. */
  declaredFamily?: ColorFamilyId | null;
  /**
   * Hex extraído de imagem (chips MCX). Só entra como último recurso e marca
   * a resolução como 'inferida' — nunca vira swatch visível.
   */
  inferredHex?: string | null;
  /** Filme transparente: o hex publicado não representa a aparência real. */
  transparent?: boolean;
  /** Acabamento já normalizado; 'camaleao' força multicolor. */
  finishes?: readonly string[];
}

export interface ColorResolution {
  /** Ordenada; a primária é `[0]`. */
  families: ColorFamilyId[];
  subfamilies: ColorSubfamilyId[];
  tone: 'claro' | 'medio' | 'escuro' | null;
  confidence: ColorConfidence | null;
}

const EMPTY: ColorResolution = {
  families: [],
  subfamilies: [],
  tone: null,
  confidence: null,
};

function unique<T>(list: T[]): T[] {
  return [...new Set(list)];
}

export function resolveColor(input: ResolveColorInput): ColorResolution {
  const families: ColorFamilyId[] = [];
  const subfamilies: ColorSubfamilyId[] = [];
  let confidence: ColorConfidence | null = null;

  const nameHits = matchLexicon(normalize(`${input.name} ${input.code ?? ''}`));
  const hexBucket: HslBucket | null = input.hex ? bucketFromHex(input.hex) : null;
  const softBucket: HslBucket | null =
    !hexBucket && input.inferredHex ? bucketFromHex(input.inferredHex) : null;

  if (input.declaredFamily) {
    // A família publicada pelo fabricante é lei no nível do pai. Nome e hex só
    // refinam a subfamília, e apenas quando o pai bate.
    families.push(input.declaredFamily);
    confidence = 'declarada';

    for (const hit of nameHits) {
      if (hit.subfamily && COLOR_PARENT[hit.subfamily] === input.declaredFamily) {
        subfamilies.unshift(hit.subfamily);
      }
    }
    if (
      hexBucket?.subfamily &&
      COLOR_PARENT[hexBucket.subfamily] === input.declaredFamily &&
      !subfamilies.includes(hexBucket.subfamily)
    ) {
      subfamilies.push(hexBucket.subfamily);
    }
  } else {
    const strong = nameHits.filter((h) => h.specificity >= 2 && !h.weak);

    if (strong.length) {
      families.push(...strong.map((h) => h.family));
      subfamilies.push(...strong.flatMap((h) => (h.subfamily ? [h.subfamily] : [])));
      confidence = 'nome';
      // Discordância nome × hex: soma, não substitui.
      if (hexBucket && !families.includes(hexBucket.family)) families.push(hexBucket.family);
    } else if (hexBucket) {
      families.push(hexBucket.family, ...hexBucket.secondary);
      if (hexBucket.subfamily) subfamilies.push(hexBucket.subfamily);
      confidence = 'hex';
      // Token fraco de família ('steel', 'ferrari') entra como secundária.
      const weak = nameHits.find((h) => h.specificity <= 1);
      if (weak && !families.includes(weak.family)) families.push(weak.family);
    } else if (nameHits.length) {
      families.push(nameHits[0].family);
      if (nameHits[0].subfamily) subfamilies.push(nameHits[0].subfamily);
      confidence = 'nome';
    } else if (softBucket) {
      families.push(softBucket.family);
      if (softBucket.subfamily) subfamilies.push(softBucket.subfamily);
      confidence = 'inferida';
    }
  }

  if (!families.length) return EMPTY;

  // Transparente é aditivo: um filme clear ainda tem tonalidade de fundo.
  if (input.transparent) families.unshift('transparente');

  // Fecho ascendente: quem tem subfamília tem a família dela.
  for (const sub of subfamilies) {
    const parent = COLOR_PARENT[sub];
    if (!families.includes(parent)) families.push(parent);
  }

  // Multicolor: 3+ famílias cromáticas distintas, ou acabamento camaleão.
  const chromatic = families.filter((f) => !ACHROMATIC.has(f));
  const isChameleon = input.finishes?.includes('camaleao') ?? false;
  if (chromatic.length >= 3 || (isChameleon && chromatic.length >= 2)) {
    families.push('multicolor');
  }

  return {
    families: unique(families),
    subfamilies: unique(subfamilies),
    tone: hexBucket?.tone ?? softBucket?.tone ?? null,
    confidence,
  };
}
