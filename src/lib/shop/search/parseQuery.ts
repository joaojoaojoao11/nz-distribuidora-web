// Parser da busca da LOJA.
//
// Tokeniza a consulta com n-grama guloso (3 → 2 → 1) e classifica cada token em
// cor, subcor, acabamento, marca, vertical, padrão, código ou texto livre.
//
// O n-grama guloso é o que faz 'azul marinho fosco' casar 'azul marinho' antes
// de 'azul' — sem isso, 'marinho' viraria texto livre e a busca falharia.
//
// A expansão hierárquica de acabamento é o coração do requisito:
//   'azul'           → todos os azuis
//   'azul fosco'     → azuis foscos E acetinados  (fosco é pai de acetinado)
//   'azul acetinado' → só os acetinados           (acetinado é folha)

import {
  COLOR_INDEX,
  COLOR_MAX_NGRAM,
  COLOR_PARENT,
  type ColorFamilyId,
  type ColorSubfamilyId,
} from '../color/lexicon';
import { finishDescendants, FINISH_LABEL, type FinishId } from '../finish/tree';
import { PATTERN_SYNONYMS, type PatternFamilyId } from '../pattern/taxonomy';
import { normalize, type BrandKey, type LineKey, type Vertical } from '../types';

export type TokenKind =
  | 'cor'
  | 'subcor'
  | 'acabamento'
  | 'marca'
  | 'linha'
  | 'vertical'
  | 'padrao'
  | 'codigo'
  | 'livre';

export interface ParsedToken {
  raw: string;
  kind: TokenKind;
  id?: string;
  /** Palavras consumidas por este token. */
  span: number;
}

export interface ParsedQuery {
  raw: string;
  tokens: ParsedToken[];
  colors: ColorFamilyId[];
  subcolors: ColorSubfamilyId[];
  /** O que o usuário digitou. */
  finishesExact: FinishId[];
  /** O digitado + descendentes. É isso que o matcher usa como filtro. */
  finishesExpanded: FinishId[];
  brands: BrandKey[];
  lines: LineKey[];
  verticals: Vertical[];
  patterns: PatternFamilyId[];
  codes: string[];
  free: string[];
  /** Houve ao menos um token classificado como faceta. */
  hasStructure: boolean;
  isEmpty: boolean;
}

/** Termos de acabamento aceitos na busca, além dos próprios ids. */
const FINISH_SYNONYMS: Record<string, FinishId> = {
  brilhante: 'brilhante',
  brilho: 'brilhante',
  brilhoso: 'brilhante',
  gloss: 'brilhante',
  glossy: 'brilhante',
  fosco: 'fosco',
  fosca: 'fosco',
  matte: 'fosco',
  matt: 'fosco',
  acetinado: 'acetinado',
  acetinada: 'acetinado',
  cetim: 'acetinado',
  satin: 'acetinado',
  metalico: 'metalico',
  metalica: 'metalico',
  metallic: 'metalico',
  cromado: 'cromado',
  chrome: 'cromado',
  escovado: 'escovado',
  brushed: 'escovado',
  perolado: 'perolado',
  pearl: 'perolado',
  camaleao: 'camaleao',
  chameleon: 'camaleao',
  'color shift': 'camaleao',
  carbono: 'carbono',
  carbon: 'carbono',
  texturizado: 'texturizado',
  transparente: 'transparente',
  clear: 'transparente',
  solido: 'solido',
  refletivo: 'refletivo',
};

/**
 * Fabricante digitado → `brandKey`. Só o nome do FABRICANTE entra aqui; a
 * linha comercial tem índice próprio (LINE_SYNONYMS), porque a SH fabrica duas
 * linhas de negócios diferentes e a Metamark, três.
 */
const BRAND_SYNONYMS: Record<string, BrandKey> = {
  oracal: 'orafol',
  orafol: 'orafol',
  metamark: 'metamark',
  avery: 'avery',
  dennison: 'avery',
  'avery dennison': 'avery',
  etherna: 'etherna',
  sh: 'sh',
  nz: 'nz',
  'nz group': 'nz',
  'speed wrapping': 'speed',
  nar: 'nar',
};

/**
 * Linha comercial digitada → `lineKey`. É o índice mais específico e vence o de
 * marca no n-grama guloso: "sh decor" casa a linha decorativa inteira antes de
 * "sh" casar o fabricante. Sem isso, quem busca SH Decor recebia também os 30
 * vinis automotivos da SH Wrapping.
 */
const LINE_SYNONYMS: Record<string, LineKey> = {
  'sh decor': 'sh-decor',
  'sh wrapping': 'sh-wrapping',
  'sh colors': 'sh-wrapping',
  'etherna decor': 'etherna',
  'nzwrap premium': 'nzwrap',
  nzwrap: 'nzwrap',
  'metacast mcx': 'mcx',
  metacast: 'mcx',
  mcx: 'mcx',
  '7 series': 'm7',
  'metamark 7': 'm7',
  m7: 'm7',
  'md 80': 'md80',
  md80: 'md80',
  'oracal 651': 'oracal-651',
  'oracal 670': 'oracal-670',
  'oracal 670ra': 'oracal-670',
  '670ra': 'oracal-670',
  nzppf: 'ppf',
  'speed wrapping': 'speed-wrapping',
  speedwrapping: 'speed-wrapping',
  speed: 'speed-wrapping',
  nar: 'nar',
  shnext: 'next',
  'sh next': 'next',
  'ad pro': 'avery-adpro',
  adpro: 'avery-adpro',
  farol: 'nz-farol',
  'pelicula de farol': 'nz-farol',
  headlight: 'nz-farol',
};

const VERTICAL_SYNONYMS: Record<string, Vertical> = {
  ppf: 'PPF',
  'protecao de pintura': 'PPF',
  pelicula: 'PPF',
  wrap: 'WRAP',
  envelopamento: 'WRAP',
  automotivo: 'WRAP',
  sign: 'SIGN',
  'comunicacao visual': 'SIGN',
  sinalizacao: 'SIGN',
  recorte: 'SIGN',
  decor: 'DECOR',
  decorativo: 'DECOR',
  arquitetonico: 'DECOR',
  movel: 'DECOR',
};

const FINISH_INDEX = new Map<string, FinishId>([
  ...Object.entries(FINISH_SYNONYMS),
  ...(Object.keys(FINISH_LABEL) as FinishId[]).map((id) => [id, id] as [string, FinishId]),
]);
const BRAND_INDEX = new Map(Object.entries(BRAND_SYNONYMS));
const LINE_INDEX = new Map(Object.entries(LINE_SYNONYMS));
const VERTICAL_INDEX = new Map(Object.entries(VERTICAL_SYNONYMS));
const PATTERN_INDEX = new Map(Object.entries(PATTERN_SYNONYMS));

const MAX_NGRAM = Math.max(
  COLOR_MAX_NGRAM,
  ...[
    ...FINISH_INDEX.keys(),
    ...BRAND_INDEX.keys(),
    ...LINE_INDEX.keys(),
    ...VERTICAL_INDEX.keys(),
  ].map((k) => k.split(' ').length)
);

/** 'm7-108', '651', 'nzw201', 'mcx-54' — código de mostruário, não texto livre. */
const CODE_RE = /^[a-z]{0,4}-?\d{2,4}[a-z]?$/;

const EMPTY: ParsedQuery = {
  raw: '',
  tokens: [],
  colors: [],
  subcolors: [],
  finishesExact: [],
  finishesExpanded: [],
  brands: [],
  lines: [],
  verticals: [],
  patterns: [],
  codes: [],
  free: [],
  hasStructure: false,
  isEmpty: true,
};

function unique<T>(list: T[]): T[] {
  return [...new Set(list)];
}

export function parseShopQuery(raw: string): ParsedQuery {
  const words = normalize(raw).split(/\s+/).filter(Boolean);
  if (!words.length) return { ...EMPTY, raw };

  const tokens: ParsedToken[] = [];
  const colors: ColorFamilyId[] = [];
  const subcolors: ColorSubfamilyId[] = [];
  const finishesExact: FinishId[] = [];
  const brands: BrandKey[] = [];
  const lines: LineKey[] = [];
  const verticals: Vertical[] = [];
  const patterns: PatternFamilyId[] = [];
  const codes: string[] = [];
  const free: string[] = [];

  let i = 0;
  while (i < words.length) {
    let matched = false;

    // Guloso: o n-grama mais longo vence, para 'azul marinho' não virar 'azul'.
    for (let n = Math.min(MAX_NGRAM, words.length - i); n >= 1 && !matched; n--) {
      const gram = words.slice(i, i + n).join(' ');

      const colorHit = COLOR_INDEX.get(gram);
      if (colorHit) {
        if (colorHit.subfamily) {
          subcolors.push(colorHit.subfamily);
          tokens.push({ raw: gram, kind: 'subcor', id: colorHit.subfamily, span: n });
        } else {
          tokens.push({ raw: gram, kind: 'cor', id: colorHit.family, span: n });
        }
        colors.push(colorHit.family);
        i += n;
        matched = true;
        break;
      }

      const finishHit = FINISH_INDEX.get(gram);
      if (finishHit) {
        finishesExact.push(finishHit);
        tokens.push({ raw: gram, kind: 'acabamento', id: finishHit, span: n });
        i += n;
        matched = true;
        break;
      }

      const lineHit = LINE_INDEX.get(gram);
      if (lineHit) {
        lines.push(lineHit);
        tokens.push({ raw: gram, kind: 'linha', id: lineHit, span: n });
        i += n;
        matched = true;
        break;
      }

      const brandHit = BRAND_INDEX.get(gram);
      if (brandHit) {
        brands.push(brandHit);
        tokens.push({ raw: gram, kind: 'marca', id: brandHit, span: n });
        i += n;
        matched = true;
        break;
      }

      const verticalHit = VERTICAL_INDEX.get(gram);
      if (verticalHit) {
        verticals.push(verticalHit);
        tokens.push({ raw: gram, kind: 'vertical', id: verticalHit, span: n });
        i += n;
        matched = true;
        break;
      }

      const patternHit = PATTERN_INDEX.get(gram);
      if (patternHit) {
        patterns.push(patternHit);
        tokens.push({ raw: gram, kind: 'padrao', id: patternHit, span: n });
        i += n;
        matched = true;
        break;
      }
    }

    if (!matched) {
      const word = words[i];
      if (CODE_RE.test(word)) {
        codes.push(word);
        tokens.push({ raw: word, kind: 'codigo', span: 1 });
      } else {
        free.push(word);
        tokens.push({ raw: word, kind: 'livre', span: 1 });
      }
      i += 1;
    }
  }

  // Subfamília implica família: 'turquesa' também é 'azul'.
  for (const sub of subcolors) {
    const parent = COLOR_PARENT[sub];
    if (!colors.includes(parent)) colors.push(parent);
  }

  const finishesExpanded = unique(finishesExact.flatMap(finishDescendants));

  const hasStructure =
    colors.length > 0 ||
    finishesExact.length > 0 ||
    brands.length > 0 ||
    lines.length > 0 ||
    verticals.length > 0 ||
    patterns.length > 0;

  return {
    raw,
    tokens,
    colors: unique(colors),
    subcolors: unique(subcolors),
    finishesExact: unique(finishesExact),
    finishesExpanded,
    brands: unique(brands),
    lines: unique(lines),
    verticals: unique(verticals),
    patterns: unique(patterns),
    codes: unique(codes),
    free,
    hasStructure,
    isEmpty: false,
  };
}
