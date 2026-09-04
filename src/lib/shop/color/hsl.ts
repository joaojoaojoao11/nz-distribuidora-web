// Bucketing de hex → família de cor, via HSL.
//
// A ordem das regras importa: marrom, bege, dourado e bronze são exatamente o
// que um bucketing por matiz puro sempre erra (todos caem na faixa do laranja
// e do amarelo, e só se distinguem por luminosidade e saturação). Por isso os
// casos especiais são testados ANTES da tabela de matiz.

import type { ColorFamilyId, ColorSubfamilyId } from './lexicon';

export type Tone = 'claro' | 'medio' | 'escuro';

export interface HslBucket {
  family: ColorFamilyId;
  subfamily: ColorSubfamilyId | null;
  /**
   * Famílias adjacentes legítimas. Faixas de fronteira (verde-água, turquesa,
   * azul-violeta) emitem duas: é o que faz "azul" achar o Blue Abyss e "verde"
   * achar o Carbon Green sem que nenhum dos dois seja injustiçado.
   */
  secondary: ColorFamilyId[];
  tone: Tone;
}

export function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.trim().replace(/^#/, '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

export interface Hsl {
  /** 0–360 */
  h: number;
  /** 0–1 */
  s: number;
  /** 0–1 */
  l: number;
}

export function rgbToHsl(r: number, g: number, b: number): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const l = (max + min) / 2;

  if (delta === 0) return { h: 0, s: 0, l };

  const s = delta / (1 - Math.abs(2 * l - 1));

  let h: number;
  if (max === rn) h = 60 * (((gn - bn) / delta) % 6);
  else if (max === gn) h = 60 * ((bn - rn) / delta + 2);
  else h = 60 * ((rn - gn) / delta + 4);

  if (h < 0) h += 360;
  return { h, s, l };
}

export function hexToHsl(hex: string): Hsl | null {
  const rgb = hexToRgb(hex);
  return rgb ? rgbToHsl(rgb[0], rgb[1], rgb[2]) : null;
}

export function isAchromatic(s: number, l: number): boolean {
  return s < 0.1 || l < 0.045 || l > 0.965;
}

function toneOf(l: number): Tone {
  if (l < 0.32) return 'escuro';
  if (l > 0.68) return 'claro';
  return 'medio';
}

function bucket(
  family: ColorFamilyId,
  subfamily: ColorSubfamilyId | null,
  l: number,
  secondary: ColorFamilyId[] = []
): HslBucket {
  return { family, subfamily, secondary, tone: toneOf(l) };
}

/**
 * Classifica um HSL numa família. Ver a ordem das regras no cabeçalho —
 * acromático → marrom → bege → dourado → bronze → matiz.
 */
export function bucketFromHsl(h: number, s: number, l: number): HslBucket {
  // 1. Sem matiz utilizável: decide só pela luminosidade.
  if (isAchromatic(s, l)) {
    if (l < 0.1) return bucket('preto', null, l);
    if (l < 0.3) return bucket('cinza', 'grafite', l);
    if (l < 0.62) return bucket('cinza', 'chumbo', l);
    if (l < 0.88) return bucket('cinza', 'cinza-claro', l);
    if (l < 0.94) return bucket('branco', 'off-white', l);
    return bucket('branco', null, l);
  }

  // 2. Marrom: laranja escuro e pouco saturado.
  if (h >= 10 && h < 45 && l < 0.42 && s < 0.75) {
    return bucket('marrom', l < 0.25 ? 'chocolate' : 'caramelo', l);
  }

  // 3. Bege: amarelo-laranja claro e dessaturado.
  if (h >= 18 && h < 58 && s >= 0.08 && s <= 0.45 && l >= 0.66) {
    return bucket('bege', l > 0.85 ? 'creme' : null, l);
  }

  // 4. Dourado: amarelo saturado de luminosidade média.
  if (h >= 38 && h < 58 && s >= 0.35 && l >= 0.32 && l <= 0.68) {
    return bucket('dourado', null, l);
  }

  // 5. Bronze/cobre: laranja médio, saturação média.
  if (h >= 18 && h < 38 && s >= 0.3 && s <= 0.75 && l >= 0.3 && l <= 0.55) {
    return bucket('bronze', null, l);
  }

  // 6. Tabela de matiz.
  if (h >= 345 || h < 10) {
    if (l < 0.32) return bucket('vermelho', 'vermelho-vinho', l);
    if (l > 0.68) return bucket('vermelho', 'vermelho-coral', l);
    return bucket('vermelho', null, l);
  }
  if (h < 20) return bucket('vermelho', null, l);
  if (h < 45) return bucket('laranja', l > 0.72 ? 'pessego' : null, l);
  if (h < 66) return bucket('amarelo', null, l);
  if (h < 86) return bucket('verde', 'verde-limao', l);
  if (h < 150) return bucket('verde', l < 0.28 ? 'verde-escuro' : null, l);
  if (h < 176) return bucket('verde', 'verde-agua', l, ['azul']);
  if (h < 200) return bucket('azul', 'turquesa', l, ['verde']);
  if (h < 215) return bucket('azul', l > 0.7 ? 'azul-bebe' : 'azul-claro', l);
  if (h < 240) {
    if (l < 0.28) return bucket('azul', 'azul-marinho', l);
    if (l < 0.5) return bucket('azul', 'azul-royal', l);
    return bucket('azul', 'azul-claro', l);
  }
  if (h < 262) return bucket('azul', 'azul-royal', l, ['roxo']);
  if (h < 290) return bucket('roxo', 'violeta', l);
  if (h < 320) return bucket('roxo', l > 0.72 ? 'lilas' : null, l);

  // 320–345: rosa
  if (s > 0.55 && l < 0.58) return bucket('rosa', 'magenta', l);
  if (l > 0.75) return bucket('rosa', 'rosa-claro', l);
  return bucket('rosa', null, l);
}

/** Atalho: hex direto para bucket. `null` se o hex for inválido. */
export function bucketFromHex(hex: string): HslBucket | null {
  const hsl = hexToHsl(hex);
  return hsl ? bucketFromHsl(hsl.h, hsl.s, hsl.l) : null;
}
