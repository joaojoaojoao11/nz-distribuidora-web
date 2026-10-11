// Espaço de cor perceptual (CIELAB, iluminante D65) e distância ΔE2000.
//
// Por que não RGB nem HSL: a distância euclidiana em RGB e o matiz do HSL erram
// justamente nos cinzas, nos azuis escuros e nos beges — as famílias que
// `hsl.ts` já precisou tratar como caso especial. CIELAB foi desenhado para que
// a mesma distância numérica seja a mesma diferença percebida, e ΔE2000 corrige
// o que ainda sobra (azuis e cinzas neutros). É a métrica padrão da indústria de
// tintas e é o que a busca por imagem usa para dizer "parecida".
//
// Módulo PURO: sem DOM, sem React. Roda no navegador (Lente) e no node
// (scripts/amostrar-hex-fotos.mjs, scripts/test-lente.mjs).

import { hexToRgb } from './hsl';

export interface Lab {
  /** Luminosidade 0–100. */
  L: number;
  /** Verde (−) ↔ vermelho (+). */
  a: number;
  /** Azul (−) ↔ amarelo (+). */
  b: number;
}

// Branco de referência D65 (observador 2°).
const XN = 0.95047;
const YN = 1.0;
const ZN = 1.08883;
const EPS = 216 / 24389;
const KAPPA = 24389 / 27;

function linear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function gamma(v: number): number {
  const c = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(c * 255)));
}

function f(t: number): number {
  return t > EPS ? Math.cbrt(t) : (KAPPA * t + 16) / 116;
}

function fInv(t: number): number {
  const t3 = t * t * t;
  return t3 > EPS ? t3 : (116 * t - 16) / KAPPA;
}

export function rgbToLab(r: number, g: number, b: number): Lab {
  const rl = linear(r);
  const gl = linear(g);
  const bl = linear(b);
  const x = (0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl) / XN;
  const y = (0.2126729 * rl + 0.7151522 * gl + 0.072175 * bl) / YN;
  const z = (0.0193339 * rl + 0.119192 * gl + 0.9503041 * bl) / ZN;
  const fx = f(x);
  const fy = f(y);
  const fz = f(z);
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

export function labToRgb(lab: Lab): [number, number, number] {
  const fy = (lab.L + 16) / 116;
  const fx = fy + lab.a / 500;
  const fz = fy - lab.b / 200;
  const x = fInv(fx) * XN;
  const y = fInv(fy) * YN;
  const z = fInv(fz) * ZN;
  const rl = 3.2404542 * x - 1.5371385 * y - 0.4985314 * z;
  const gl = -0.969266 * x + 1.8760108 * y + 0.041556 * z;
  const bl = 0.0556434 * x - 0.2040259 * y + 1.0572252 * z;
  return [gamma(rl), gamma(gl), gamma(bl)];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const h = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

/** `null` se o hex for inválido. Aceita com ou sem `#`, 3 ou 6 dígitos. */
export function hexToLab(hex: string): Lab | null {
  const rgb = hexToRgb(hex);
  return rgb ? rgbToLab(rgb[0], rgb[1], rgb[2]) : null;
}

export function labToHex(lab: Lab): string {
  const [r, g, b] = labToRgb(lab);
  return rgbToHex(r, g, b);
}

/** Croma (saturação em Lab): distância do eixo neutro. */
export function chroma(lab: Lab): number {
  return Math.hypot(lab.a, lab.b);
}

const rad = (deg: number) => (deg * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const POW25_7 = Math.pow(25, 7);

function hueOf(a: number, b: number): number {
  if (a === 0 && b === 0) return 0;
  let h = deg(Math.atan2(b, a));
  if (h < 0) h += 360;
  return h;
}

/**
 * ΔE2000 (Sharma, Wu & Dalal, 2005), com kL = kC = kH = 1.
 *
 * Escala de referência para a Lente: ≤ 2 indistinguível a olho, ≤ 10 "muito
 * parecida", ≤ 20 "parecida", ≤ 28 "mesma vizinhança". Preto × branco = 100.
 */
export function deltaE2000(p: Lab, q: Lab): number {
  const C1 = Math.hypot(p.a, p.b);
  const C2 = Math.hypot(q.a, q.b);
  const Cm = (C1 + C2) / 2;
  const Cm7 = Math.pow(Cm, 7);
  const G = 0.5 * (1 - Math.sqrt(Cm7 / (Cm7 + POW25_7)));

  const a1p = (1 + G) * p.a;
  const a2p = (1 + G) * q.a;
  const C1p = Math.hypot(a1p, p.b);
  const C2p = Math.hypot(a2p, q.b);
  const h1p = hueOf(a1p, p.b);
  const h2p = hueOf(a2p, q.b);

  const dLp = q.L - p.L;
  const dCp = C2p - C1p;

  let dhp: number;
  if (C1p * C2p === 0) dhp = 0;
  else {
    dhp = h2p - h1p;
    if (dhp > 180) dhp -= 360;
    else if (dhp < -180) dhp += 360;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(rad(dhp / 2));

  const Lmp = (p.L + q.L) / 2;
  const Cmp = (C1p + C2p) / 2;

  let hmp: number;
  if (C1p * C2p === 0) hmp = h1p + h2p;
  else {
    const soma = h1p + h2p;
    if (Math.abs(h1p - h2p) <= 180) hmp = soma / 2;
    else hmp = soma < 360 ? (soma + 360) / 2 : (soma - 360) / 2;
  }

  const T =
    1 -
    0.17 * Math.cos(rad(hmp - 30)) +
    0.24 * Math.cos(rad(2 * hmp)) +
    0.32 * Math.cos(rad(3 * hmp + 6)) -
    0.2 * Math.cos(rad(4 * hmp - 63));
  const dTheta = 30 * Math.exp(-Math.pow((hmp - 275) / 25, 2));
  const Cmp7 = Math.pow(Cmp, 7);
  const RC = 2 * Math.sqrt(Cmp7 / (Cmp7 + POW25_7));
  const Lm50 = Math.pow(Lmp - 50, 2);
  const SL = 1 + (0.015 * Lm50) / Math.sqrt(20 + Lm50);
  const SC = 1 + 0.045 * Cmp;
  const SH = 1 + 0.015 * Cmp * T;
  const RT = -Math.sin(rad(2 * dTheta)) * RC;

  const tL = dLp / SL;
  const tC = dCp / SC;
  const tH = dHp / SH;
  return Math.sqrt(tL * tL + tC * tC + tH * tH + RT * tC * tH);
}

/** Atalho: dois hex → ΔE2000. `null` se algum for inválido. */
export function deltaEHex(a: string, b: string): number | null {
  const la = hexToLab(a);
  const lb = hexToLab(b);
  return la && lb ? deltaE2000(la, lb) : null;
}
