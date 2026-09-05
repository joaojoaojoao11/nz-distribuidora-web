// Resolução de cor — combina família declarada pelo fabricante, tokens do nome
// e bucketing de hex numa única resposta.
//
// Precedência: declarada > nome > hex > hex inferido de imagem.
//
// A REGRA CENTRAL: se o fabricante escreveu a cor no nome, o nome manda e o
// hex NÃO acrescenta família. Antes o hex somava, e como o bucketing erra nas
// fronteiras de matiz, "LUXURY BRITISH PINK" (#ffb6c1, matiz 351°) virava
// vermelho+rosa e aparecia numa busca por vermelho; "Black" (#0D0E11) virava
// azul+preto; "Yellow" virava dourado+amarelo. Eram 34 itens assim.
//
// A exceção é o filme CAMALEÃO, que muda de cor conforme o ângulo: nele o hex
// é uma segunda verdade, não uma contradição. É o que mantém 'MYSTIC TEAL' e
// 'BLUE CHARM GREEN' em azul e em verde ao mesmo tempo.
//
// Duplos legítimos que não são camaleão ('Orange Red', turquesa, 'Silver
// Grey') são declarados no léxico, em `secondary` — lá a segunda família é
// afirmação sobre a palavra, não subproduto de arredondamento de matiz.

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

/** Filme que muda de cor com o ângulo: nome e hex podem ser ambos verdade. */
function isChameleon(input: ResolveColorInput): boolean {
  return input.finishes?.includes('camaleao') ?? false;
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
    // Qualquer palavra de cor do nome que não seja apelido comercial. Inclui
    // 'pink', 'orange', 'black', 'yellow' — famílias de uma palavra, que antes
    // ficavam de fora por terem especificidade 1 e perdiam para o hex.
    const nomeados = nameHits.filter((h) => !h.weak);

    if (nomeados.length) {
      families.push(...nomeados.map((h) => h.family));
      subfamilies.push(...nomeados.flatMap((h) => (h.subfamily ? [h.subfamily] : [])));
      // Duplos declarados no léxico ('Orange Red' → laranja + vermelho).
      families.push(...nomeados.flatMap((h) => (h.secondary ? [h.secondary] : [])));
      confidence = 'nome';

      if (isChameleon(input)) {
        // Camaleão: o hex é o outro ângulo do mesmo filme, não uma contradição.
        if (hexBucket && !families.includes(hexBucket.family)) families.push(hexBucket.family);
      } else if (hexBucket && families.includes(hexBucket.family) && hexBucket.subfamily) {
        // Fora do camaleão o hex não cria família — no máximo refina a
        // subfamília DENTRO da família que o nome já estabeleceu.
        subfamilies.push(hexBucket.subfamily);
      }
    } else if (hexBucket) {
      families.push(hexBucket.family, ...hexBucket.secondary);
      if (hexBucket.subfamily) subfamilies.push(hexBucket.subfamily);
      confidence = 'hex';
      // Token fraco de família ('steel', 'silver', 'ferrari') entra como
      // secundária: sem palavra de cor firme, ele é o melhor indício do nome.
      const weak = nameHits.find((h) => h.weak);
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
  if (chromatic.length >= 3 || (isChameleon(input) && chromatic.length >= 2)) {
    families.push('multicolor');
  }

  return {
    families: unique(families),
    subfamilies: unique(subfamilies),
    tone: hexBucket?.tone ?? softBucket?.tone ?? null,
    confidence,
  };
}
