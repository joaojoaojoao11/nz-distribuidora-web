// Léxico de cor — tokens de nome comercial → família/subfamília.
//
// Por que existe: metade do catálogo não publica hex (a MetaCast MCX não
// divulga valor hexadecimal por cor) e a outra metade publica um hex que às
// vezes discorda do nome ('MYSTIC TEAL' com #008080, 'BLUE CHARM GREEN').
// O nome comercial carrega a intenção do fabricante, então tem precedência
// sobre o bucketing de HSL — ver resolveColor.ts.

export type ColorFamilyId =
  | 'branco'
  | 'preto'
  | 'cinza'
  | 'prata'
  | 'vermelho'
  | 'laranja'
  | 'amarelo'
  | 'verde'
  | 'azul'
  | 'roxo'
  | 'rosa'
  | 'marrom'
  | 'bege'
  | 'dourado'
  | 'bronze'
  | 'transparente'
  | 'multicolor';

export type ColorSubfamilyId =
  | 'azul-claro'
  | 'azul-royal'
  | 'azul-marinho'
  | 'azul-bebe'
  | 'turquesa'
  | 'verde-limao'
  | 'verde-agua'
  | 'verde-militar'
  | 'verde-escuro'
  | 'vermelho-vinho'
  | 'vermelho-coral'
  | 'cinza-claro'
  | 'grafite'
  | 'chumbo'
  | 'rosa-claro'
  | 'magenta'
  | 'lilas'
  | 'violeta'
  | 'pessego'
  | 'creme'
  | 'caramelo'
  | 'chocolate'
  | 'off-white'
  | 'gelo';

export const COLOR_PARENT: Record<ColorSubfamilyId, ColorFamilyId> = {
  'azul-claro': 'azul',
  'azul-royal': 'azul',
  'azul-marinho': 'azul',
  'azul-bebe': 'azul',
  turquesa: 'azul',
  'verde-limao': 'verde',
  'verde-agua': 'verde',
  'verde-militar': 'verde',
  'verde-escuro': 'verde',
  'vermelho-vinho': 'vermelho',
  'vermelho-coral': 'vermelho',
  'cinza-claro': 'cinza',
  grafite: 'cinza',
  chumbo: 'cinza',
  'rosa-claro': 'rosa',
  magenta: 'rosa',
  lilas: 'roxo',
  violeta: 'roxo',
  pessego: 'laranja',
  creme: 'bege',
  caramelo: 'marrom',
  chocolate: 'marrom',
  'off-white': 'branco',
  gelo: 'branco',
};

export const COLOR_LABEL: Record<ColorFamilyId, string> = {
  branco: 'Branco',
  preto: 'Preto',
  cinza: 'Cinza',
  prata: 'Prata',
  vermelho: 'Vermelho',
  laranja: 'Laranja',
  amarelo: 'Amarelo',
  verde: 'Verde',
  azul: 'Azul',
  roxo: 'Roxo',
  rosa: 'Rosa',
  marrom: 'Marrom',
  bege: 'Bege',
  dourado: 'Dourado',
  bronze: 'Bronze',
  transparente: 'Transparente',
  multicolor: 'Multicolor',
};

export const SUBFAMILY_LABEL: Record<ColorSubfamilyId, string> = {
  'azul-claro': 'Azul claro',
  'azul-royal': 'Azul royal',
  'azul-marinho': 'Azul marinho',
  'azul-bebe': 'Azul bebê',
  turquesa: 'Turquesa',
  'verde-limao': 'Verde limão',
  'verde-agua': 'Verde água',
  'verde-militar': 'Verde militar',
  'verde-escuro': 'Verde escuro',
  'vermelho-vinho': 'Vinho',
  'vermelho-coral': 'Coral',
  'cinza-claro': 'Cinza claro',
  grafite: 'Grafite',
  chumbo: 'Chumbo',
  'rosa-claro': 'Rosa claro',
  magenta: 'Magenta',
  lilas: 'Lilás',
  violeta: 'Violeta',
  pessego: 'Pêssego',
  creme: 'Creme',
  caramelo: 'Caramelo',
  chocolate: 'Chocolate',
  'off-white': 'Off-white',
  gelo: 'Gelo',
};

/** Cores sem matiz — não contam para a heurística de "multicolor". */
export const ACHROMATIC: ReadonlySet<ColorFamilyId> = new Set<ColorFamilyId>([
  'branco',
  'preto',
  'cinza',
  'prata',
  'transparente',
]);

export interface LexEntry {
  /** Todos normalizados: minúsculo, sem acento. Podem ser n-gramas ('azul marinho'). */
  tokens: string[];
  family: ColorFamilyId;
  subfamily?: ColorSubfamilyId;
  /**
   * 3 = n-grama específico ('azul marinho') · 2 = subfamília de uma palavra
   * ('turquesa') · 1 = família ('azul') · 0 = indício fraco.
   * Empate no parser e no matcher é resolvido pela maior especificidade.
   */
  specificity: 0 | 1 | 2 | 3;
  /**
   * Token que costuma ser nome comercial, não a cor real: 'rose gold' é
   * dourado, não rosa; 'silver arrow' é prata, mas 'blue silver' é azul.
   * Entradas fracas não decidem sozinhas a família quando há hex disponível.
   */
  weak?: boolean;
}

// Ordem não importa para o matching (o parser indexa por token e resolve por
// n-grama mais longo), mas ajuda a manutenção agrupar por família.
export const COLOR_LEXICON: LexEntry[] = [
  // ---------------------------------------------------------------- AZUL
  { tokens: ['azul marinho', 'navy blue', 'midnight blue', 'deep blue'], family: 'azul', subfamily: 'azul-marinho', specificity: 3 },
  { tokens: ['azul royal', 'royal blue', 'cobalt blue'], family: 'azul', subfamily: 'azul-royal', specificity: 3 },
  { tokens: ['azul claro', 'light blue', 'sky blue', 'azul ceu'], family: 'azul', subfamily: 'azul-claro', specificity: 3 },
  { tokens: ['azul bebe', 'baby blue', 'powder blue'], family: 'azul', subfamily: 'azul-bebe', specificity: 3 },
  { tokens: ['azul petroleo', 'petrol blue'], family: 'azul', subfamily: 'azul-marinho', specificity: 3 },
  { tokens: ['navy', 'marinho'], family: 'azul', subfamily: 'azul-marinho', specificity: 2 },
  { tokens: ['cobalto', 'cobalt'], family: 'azul', subfamily: 'azul-royal', specificity: 2 },
  { tokens: ['turquesa', 'turquoise', 'teal', 'ciano', 'cyan', 'aqua'], family: 'azul', subfamily: 'turquesa', specificity: 2 },
  { tokens: ['celeste', 'cornflour', 'cornflower'], family: 'azul', subfamily: 'azul-claro', specificity: 2 },
  { tokens: ['azul', 'blue', 'bleu', 'abyss'], family: 'azul', specificity: 1 },
  { tokens: ['bavarian', 'santorini'], family: 'azul', specificity: 0, weak: true },

  // --------------------------------------------------------------- VERDE
  { tokens: ['verde limao', 'lime green', 'sub lime'], family: 'verde', subfamily: 'verde-limao', specificity: 3 },
  { tokens: ['verde militar', 'army green', 'military green'], family: 'verde', subfamily: 'verde-militar', specificity: 3 },
  { tokens: ['verde agua', 'water green', 'mint green'], family: 'verde', subfamily: 'verde-agua', specificity: 3 },
  { tokens: ['verde escuro', 'dark green', 'forest green'], family: 'verde', subfamily: 'verde-escuro', specificity: 3 },
  { tokens: ['lime', 'limao'], family: 'verde', subfamily: 'verde-limao', specificity: 2 },
  { tokens: ['oliva', 'olive', 'khaki', 'caqui'], family: 'verde', subfamily: 'verde-militar', specificity: 2 },
  { tokens: ['menta', 'mint'], family: 'verde', subfamily: 'verde-agua', specificity: 2 },
  { tokens: ['esmeralda', 'emerald'], family: 'verde', subfamily: 'verde-escuro', specificity: 2 },
  { tokens: ['verde', 'green'], family: 'verde', specificity: 1 },

  // ------------------------------------------------------------ VERMELHO
  { tokens: ['vermelho escuro', 'dark red', 'deep red'], family: 'vermelho', subfamily: 'vermelho-vinho', specificity: 3 },
  { tokens: ['vinho', 'wine', 'bordo', 'bordeaux', 'burgundy', 'maroon'], family: 'vermelho', subfamily: 'vermelho-vinho', specificity: 2 },
  { tokens: ['coral', 'salmao', 'salmon'], family: 'vermelho', subfamily: 'vermelho-coral', specificity: 2 },
  { tokens: ['carmim', 'carmine', 'escarlate', 'scarlet', 'rubi', 'ruby'], family: 'vermelho', specificity: 2 },
  { tokens: ['vermelho', 'red', 'rosso', 'rouge', 'volcano'], family: 'vermelho', specificity: 1 },
  { tokens: ['ferrari', 'firefox'], family: 'vermelho', specificity: 0, weak: true },

  // -------------------------------------------------------------- LARANJA
  { tokens: ['laranja queimado', 'burnt orange'], family: 'laranja', specificity: 3 },
  { tokens: ['pessego', 'peach'], family: 'laranja', subfamily: 'pessego', specificity: 2 },
  { tokens: ['tangerina', 'tangerine', 'terracota', 'terracotta'], family: 'laranja', specificity: 2 },
  { tokens: ['laranja', 'orange'], family: 'laranja', specificity: 1 },

  // -------------------------------------------------------------- AMARELO
  { tokens: ['amarelo ouro', 'golden yellow'], family: 'amarelo', specificity: 3 },
  { tokens: ['mostarda', 'mustard', 'canario', 'canary'], family: 'amarelo', specificity: 2 },
  { tokens: ['amarelo', 'yellow', 'jaune'], family: 'amarelo', specificity: 1 },

  // ----------------------------------------------------------------- ROXO
  { tokens: ['violeta', 'violet', 'purpura', 'purple'], family: 'roxo', subfamily: 'violeta', specificity: 2 },
  { tokens: ['lilas', 'lilac', 'lavanda', 'lavender'], family: 'roxo', subfamily: 'lilas', specificity: 2 },
  { tokens: ['ameixa', 'plum', 'berinjela', 'eggplant'], family: 'roxo', specificity: 2 },
  { tokens: ['roxo', 'uva', 'grape'], family: 'roxo', specificity: 1 },

  // ----------------------------------------------------------------- ROSA
  { tokens: ['rosa claro', 'light pink', 'rosa bebe'], family: 'rosa', subfamily: 'rosa-claro', specificity: 3 },
  { tokens: ['magenta', 'fucsia', 'fuchsia', 'pink shock'], family: 'rosa', subfamily: 'magenta', specificity: 2 },
  { tokens: ['rosa', 'pink'], family: 'rosa', specificity: 1 },

  // --------------------------------------------------------------- MARROM
  { tokens: ['marrom escuro', 'dark brown'], family: 'marrom', subfamily: 'chocolate', specificity: 3 },
  { tokens: ['chocolate', 'cafe', 'coffee', 'expresso', 'espresso'], family: 'marrom', subfamily: 'chocolate', specificity: 2 },
  { tokens: ['caramelo', 'caramel', 'conhaque', 'cognac', 'tabaco', 'tobacco'], family: 'marrom', subfamily: 'caramelo', specificity: 2 },
  { tokens: ['marrom', 'brown', 'castanho', 'nogueira', 'walnut'], family: 'marrom', specificity: 1 },

  // ----------------------------------------------------------------- BEGE
  { tokens: ['off white', 'offwhite'], family: 'branco', subfamily: 'off-white', specificity: 3 },
  { tokens: ['creme', 'cream', 'marfim', 'ivory', 'baunilha', 'vanilla'], family: 'bege', subfamily: 'creme', specificity: 2 },
  { tokens: ['bege', 'beige', 'areia', 'sand', 'nude', 'linho', 'linen'], family: 'bege', specificity: 1 },

  // -------------------------------------------------------- BRANCO / PRETO
  { tokens: ['branco', 'white', 'blanc', 'neve', 'snow'], family: 'branco', specificity: 1 },
  { tokens: ['gelo', 'ice'], family: 'branco', subfamily: 'gelo', specificity: 2 },
  { tokens: ['preto', 'black', 'noir', 'ebano', 'ebony', 'onix', 'onyx'], family: 'preto', specificity: 1 },

  // ---------------------------------------------------------------- CINZA
  { tokens: ['cinza claro', 'light grey', 'light gray'], family: 'cinza', subfamily: 'cinza-claro', specificity: 3 },
  { tokens: ['cinza escuro', 'dark grey', 'dark gray'], family: 'cinza', subfamily: 'grafite', specificity: 3 },
  { tokens: ['grafite', 'graphite', 'antracite', 'anthracite'], family: 'cinza', subfamily: 'grafite', specificity: 2 },
  { tokens: ['chumbo', 'concreto', 'concrete', 'cimento', 'cement'], family: 'cinza', subfamily: 'chumbo', specificity: 2 },
  { tokens: ['cinza', 'grey', 'gray', 'gris'], family: 'cinza', specificity: 1 },
  { tokens: ['steel', 'aco'], family: 'cinza', specificity: 0, weak: true },

  // -------------------------------------------------- PRATA / DOURADO / BRONZE
  { tokens: ['rose gold', 'ouro rosa'], family: 'dourado', specificity: 3 },
  { tokens: ['dourado', 'gold', 'golden', 'ouro', 'champagne'], family: 'dourado', specificity: 1 },
  { tokens: ['bronze', 'cobre', 'copper', 'latao', 'brass'], family: 'bronze', specificity: 1 },
  { tokens: ['prata', 'silver', 'aluminio', 'aluminium', 'aluminum'], family: 'prata', specificity: 1, weak: true },

  // --------------------------------------------------------- TRANSPARENTE
  { tokens: ['transparente', 'transparent', 'clear', 'cristal', 'crystal'], family: 'transparente', specificity: 1 },
];

/**
 * Índice token → entrada, construído uma vez. É o que o parser de query e o
 * resolvedor de cor consultam; ambos precisam do mesmo vocabulário.
 */
export const COLOR_INDEX: ReadonlyMap<string, LexEntry> = (() => {
  const map = new Map<string, LexEntry>();
  for (const entry of COLOR_LEXICON) {
    for (const token of entry.tokens) {
      const existing = map.get(token);
      // Em caso de token repetido entre entradas, a mais específica vence.
      if (!existing || entry.specificity > existing.specificity) map.set(token, entry);
    }
  }
  return map;
})();

/** Maior número de palavras entre os tokens — o parser usa para dimensionar o n-grama. */
export const COLOR_MAX_NGRAM: number = COLOR_LEXICON.reduce(
  (max, entry) => Math.max(max, ...entry.tokens.map((t) => t.split(' ').length)),
  1
);

export interface LexHit extends LexEntry {
  /** O token que casou, para depuração. */
  matched: string;
}

/**
 * Varre um texto já normalizado e devolve os acertos do léxico, do mais
 * específico para o menos. Um n-grama que casa impede que suas palavras sejam
 * reaproveitadas — é isso que faz 'azul marinho' não gerar também 'azul' solto.
 */
export function matchLexicon(normalizedText: string): LexHit[] {
  const words = normalizedText.split(/\s+/).filter(Boolean);
  const hits: LexHit[] = [];
  const consumed = new Set<number>();

  for (let size = Math.min(COLOR_MAX_NGRAM, words.length); size >= 1; size--) {
    for (let i = 0; i + size <= words.length; i++) {
      let overlaps = false;
      for (let k = i; k < i + size; k++) {
        if (consumed.has(k)) {
          overlaps = true;
          break;
        }
      }
      if (overlaps) continue;

      const gram = words.slice(i, i + size).join(' ');
      const entry = COLOR_INDEX.get(gram);
      if (!entry) continue;

      hits.push({ ...entry, matched: gram });
      for (let k = i; k < i + size; k++) consumed.add(k);
    }
  }

  return hits.sort((a, b) => b.specificity - a.specificity);
}
