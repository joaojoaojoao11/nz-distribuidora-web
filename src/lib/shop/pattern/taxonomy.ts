// Famílias de padrão decorativo, unificando os dois catálogos de DECOR.
//
// Etherna publica: madeira, marmorizado, formica, pedra, metal, tecido,
//                  estampado, geometrico
// SH Decor publica: madeira, pedra, cimento, couro, tecido, solido, piso, tijolo
//
// 'marmorizado' e 'pedra' são conceitos distintos para a Etherna e a mesma
// coisa para a SH, então mantemos as duas e ligamos mármore como filho
// conceitual de pedra na hora de contar facetas.

export type PatternFamilyId =
  | 'madeira'
  | 'pedra'
  | 'marmore'
  | 'cimento'
  | 'couro'
  | 'tecido'
  | 'formica'
  | 'metal'
  | 'estampado'
  | 'geometrico'
  | 'piso'
  | 'tijolo'
  | 'solido';

export const PATTERN_LABEL: Record<PatternFamilyId, string> = {
  madeira: 'Madeira',
  pedra: 'Pedra',
  marmore: 'Mármore',
  cimento: 'Cimento',
  couro: 'Couro',
  tecido: 'Tecido',
  formica: 'Fórmica',
  metal: 'Metal',
  estampado: 'Estampado',
  geometrico: 'Geométrico',
  piso: 'Piso',
  tijolo: 'Tijolo',
  solido: 'Sólido',
};

export const PATTERN_ORDER: PatternFamilyId[] = [
  'madeira',
  'pedra',
  'marmore',
  'cimento',
  'tijolo',
  'couro',
  'tecido',
  'formica',
  'metal',
  'geometrico',
  'estampado',
  'piso',
  'solido',
];

/** Slug da Etherna → família unificada. */
const ETHERNA_MAP: Record<string, PatternFamilyId> = {
  madeira: 'madeira',
  marmorizado: 'marmore',
  formica: 'formica',
  pedra: 'pedra',
  metal: 'metal',
  tecido: 'tecido',
  estampado: 'estampado',
  geometrico: 'geometrico',
};

/** Slug da SH Decor → família unificada. */
const SH_DECOR_MAP: Record<string, PatternFamilyId> = {
  madeira: 'madeira',
  pedra: 'pedra',
  cimento: 'cimento',
  couro: 'couro',
  tecido: 'tecido',
  solido: 'solido',
  piso: 'piso',
  tijolo: 'tijolo',
};

export function patternFromEtherna(family: string): PatternFamilyId | null {
  return ETHERNA_MAP[family] ?? null;
}

export function patternFromShDecor(family: string): PatternFamilyId | null {
  return SH_DECOR_MAP[family] ?? null;
}

/**
 * Sinônimos de FAMÍLIA aceitos na busca.
 *
 * Contém apenas nomes de família — nunca espécies ou variedades. 'carvalho',
 * 'nogueira', 'carrara' e 'granito' ficam de fora de propósito: se 'carvalho'
 * virasse sinônimo de 'madeira', a busca por "madeira carvalho" devolveria
 * todas as 52 madeiras em vez dos carvalhos, porque os dois tokens colapsariam
 * na mesma faceta e nenhum sobraria como texto para casar com o nome.
 * Como texto livre, esses termos casam com o nome do produto e restringem.
 */
export const PATTERN_SYNONYMS: Record<string, PatternFamilyId> = {
  madeira: 'madeira',
  madeiras: 'madeira',
  wood: 'madeira',
  pedra: 'pedra',
  pedras: 'pedra',
  stone: 'pedra',
  marmore: 'marmore',
  marmores: 'marmore',
  marble: 'marmore',
  marmorizado: 'marmore',
  cimento: 'cimento',
  concreto: 'cimento',
  concrete: 'cimento',
  cement: 'cimento',
  couro: 'couro',
  leather: 'couro',
  tecido: 'tecido',
  tecidos: 'tecido',
  fabric: 'tecido',
  formica: 'formica',
  laminado: 'formica',
  metal: 'metal',
  estampado: 'estampado',
  geometrico: 'geometrico',
  geometric: 'geometrico',
  piso: 'piso',
  floor: 'piso',
  tijolo: 'tijolo',
  tijolinho: 'tijolo',
  brick: 'tijolo',
};

export function isPatternFamilyId(value: string): value is PatternFamilyId {
  return value in PATTERN_LABEL;
}
