// Autoteste das taxonomias, executado só em DEV (chamado por catalog.ts).
//
// O projeto não tem runner de teste. Este bloco cobre os casos que definem se a
// classificação está certa — todos tirados de dados reais do catálogo, incluindo
// os degenerados (sem hex, sem token de cor, nome que discorda do hex).
// Sem isso, um erro de bucketing só apareceria como "a busca não acha o azul".

import { resolveColor } from './color/resolveColor';
import type { ColorFamilyId } from './color/lexicon';
import {
  finishFromM7,
  finishFromMcx,
  normalizeFinishString,
} from './finish/normalizeFinish';
import { finishDescendants, type FinishId } from './finish/tree';

interface Failure {
  caso: string;
  esperado: string;
  obtido: string;
}

function includesAll<T>(actual: readonly T[], expected: readonly T[]): boolean {
  return expected.every((e) => actual.includes(e));
}

function checkColors(): Failure[] {
  const fails: Failure[] = [];

  const cases: {
    nome: string;
    input: Parameters<typeof resolveColor>[0];
    families: ColorFamilyId[];
    /** Se definido, exige que a resolução NÃO contenha estas famílias. */
    notFamilies?: ColorFamilyId[];
    confidence?: string;
  }[] = [
    {
      nome: 'M7-114 Maroon (família declarada red)',
      input: { name: 'Maroon', code: 'M7-114', hex: '#891627', declaredFamily: 'vermelho' },
      families: ['vermelho'],
      confidence: 'declarada',
    },
    {
      nome: 'M7-108 Imitation Gold (declarada gold)',
      input: { name: 'Imitation Gold', code: 'M7-108', hex: '#c69b36', declaredFamily: 'dourado' },
      families: ['dourado'],
      confidence: 'declarada',
    },
    {
      nome: 'M7-105 Clear (transparente)',
      input: { name: 'Clear', code: 'M7-105', hex: '#e1e2d8', declaredFamily: 'branco', transparent: true },
      families: ['transparente', 'branco'],
    },
    {
      nome: 'NZW205 MYSTIC TEAL (nome teal + hex teal, camaleão)',
      input: { name: 'NZWRAP MYSTIC TEAL', code: 'NZW205', hex: '#008080', finishes: ['camaleao'] },
      families: ['azul'],
    },
    {
      nome: 'MCX-59 Blue Abyss (sem hex, token forte no nome)',
      input: { name: 'Blue Abyss', code: 'MCX-59' },
      families: ['azul'],
      confidence: 'nome',
    },
    {
      nome: 'MCX-73 Capri Bronze (sem hex)',
      input: { name: 'Capri Bronze', code: 'MCX-73' },
      families: ['bronze'],
      confidence: 'nome',
    },
    {
      nome: 'Fórmica Azul Petróleo (padrão decor, sem hex)',
      input: { name: 'Fórmica Azul Petróleo' },
      families: ['azul'],
      confidence: 'nome',
    },
    {
      nome: 'MCX-97 Carbon Steel (sem hex publicado, hex inferido do chip)',
      input: { name: 'Carbon Steel', code: 'MCX-97', inferredHex: '#4a4f54' },
      families: ['cinza'],
    },
    {
      nome: 'Oracal 651 Golden Yellow (hex dourado)',
      input: { name: 'Oracal 651 Golden Yellow', hex: '#FBAA00' },
      families: ['amarelo'],
    },
    {
      nome: 'NZW202 Stuttgart Sport Grey (hex acinzentado)',
      input: { name: 'NZWRAP STUTTGART SPORT GREY', code: 'NZW202', hex: '#5c5f63' },
      families: ['cinza'],
    },
    {
      nome: 'M7-110 Black Gloss (preto quase puro)',
      input: { name: 'Black Gloss', code: 'M7-110', hex: '#000008', declaredFamily: 'preto' },
      families: ['preto'],
    },
    {
      nome: 'NZW204 Luxury British Pink (hex rosa claro)',
      input: { name: 'NZWRAP LUXURY BRITISH PINK', code: 'NZW204', hex: '#ffb6c1' },
      families: ['rosa'],
    },
    {
      nome: 'Madeira Carvalho Areia (padrão sem cor comercial)',
      input: { name: 'Madeira Carvalho Areia' },
      families: ['bege'],
    },
    {
      nome: 'M7-115 Cornflour (azul claro declarado)',
      input: { name: 'Cornflour', code: 'M7-115', hex: '#3aa9e0', declaredFamily: 'azul' },
      families: ['azul'],
    },

    // ---- O NOME MANDA ----------------------------------------------------
    // Todos estes vinham com uma segunda família tirada do hex, que contradizia
    // a palavra que o fabricante escreveu no nome. Era o que fazia uma busca
    // por "vermelho" devolver um Range Rover rosa. As asserções são NEGATIVAS
    // de propósito: o que importa é o que NÃO pode estar lá.
    {
      nome: 'NZW204 LUXURY BRITISH PINK (hex #ffb6c1 cai em vermelho)',
      input: { name: 'NZWRAP LUXURY BRITISH PINK', code: 'NZW204', hex: '#ffb6c1' },
      families: ['rosa'],
      notFamilies: ['vermelho'],
    },
    {
      nome: 'NZW222 SPICY ORANGE (hex #ff4500, matiz 16°)',
      input: { name: 'NZWRAP SPICY ORANGE METALLIC', code: 'NZW222', hex: '#ff4500' },
      families: ['laranja'],
      notFamilies: ['vermelho'],
    },
    {
      nome: 'Oracal 070 Black (#0D0E11: 4/255 de croma)',
      input: { name: 'Black', code: '070', hex: '#0D0E11' },
      families: ['preto'],
      notFamilies: ['azul', 'cinza'],
    },
    {
      nome: 'Oracal 010 White (#E6E9EE)',
      input: { name: 'White', code: '010', hex: '#E6E9EE' },
      families: ['branco'],
      notFamilies: ['azul'],
    },
    {
      nome: 'Oracal 021 Yellow (#FEC500 — amarelo puro, não ouro)',
      input: { name: 'Yellow', code: '021', hex: '#FEC500' },
      families: ['amarelo'],
      notFamilies: ['dourado'],
    },
    {
      nome: 'Oracal 404 Purple (#412773 na fronteira do azul)',
      input: { name: 'Purple', code: '404', hex: '#412773' },
      families: ['roxo'],
      notFamilies: ['azul'],
    },
    {
      nome: 'Oracal 061 Green (#00784B na fronteira verde-água)',
      input: { name: 'Green', code: '061', hex: '#00784B' },
      families: ['verde'],
      notFamilies: ['azul'],
    },
    {
      nome: 'Oracal 056 Ice Blue (n-grama vence "ice" isolado)',
      input: { name: 'Ice Blue', code: '056', hex: '#3DA1D2' },
      families: ['azul'],
      notFamilies: ['branco'],
    },
    {
      nome: 'Oracal 023 Cream (#EBD494 cai em laranja)',
      input: { name: 'Cream', code: '023', hex: '#EBD494' },
      families: ['bege'],
      notFamilies: ['laranja'],
    },
    {
      nome: 'Oracal 091 Gold (#756232 cai em marrom)',
      input: { name: 'Gold', code: '091', hex: '#756232' },
      families: ['dourado'],
      notFamilies: ['marrom'],
    },
    {
      nome: 'Oracal 518 Steel Blue (n-grama; "steel" sozinho é cinza fraco)',
      input: { name: 'Steel Blue', code: '518', hex: '#13133E' },
      families: ['azul'],
      notFamilies: ['roxo', 'cinza'],
    },
    {
      nome: 'SHSM-106 Crystal White ("crystal" não é transparência)',
      input: { name: 'Crystal White', code: 'SHSM-106', hex: '#f0f2f5' },
      families: ['branco'],
      notFamilies: ['azul', 'transparente'],
    },
    {
      nome: 'NZW223 METALLIC ONYX PEARL (hex #353839 é cinza)',
      input: { name: 'NZWRAP METALLIC ONYX PEARL', code: 'NZW223', hex: '#353839' },
      families: ['preto'],
      notFamilies: ['cinza'],
    },
    {
      nome: 'NZW225 COSMIC GREY PEARL (hex #8c92ac puxa para azul)',
      input: { name: 'NZWRAP COSMIC GREY PEARL', code: 'NZW225', hex: '#8c92ac' },
      families: ['cinza'],
      notFamilies: ['azul'],
    },

    // ---- DUPLOS LEGÍTIMOS: a segunda família é afirmação, não erro --------
    {
      nome: 'Oracal 047 Orange Red (n-grama declara as duas)',
      input: { name: 'Orange Red', code: '047', hex: '#D33100' },
      families: ['laranja', 'vermelho'],
    },
    {
      nome: '670RA-066G Turquoise (turquesa é azul-esverdeado)',
      input: { name: 'Turquoise G', code: '670RA-066G', hex: '#00a396' },
      families: ['azul', 'verde'],
    },
    {
      nome: 'Oracal 064 Yellow Green',
      input: { name: 'Yellow Green', code: '064', hex: '#289901' },
      families: ['verde', 'amarelo'],
    },
    {
      nome: 'Imitation Gold #c69b36 continua ouro (s=0,57)',
      input: { name: 'Imitation Gold', code: 'M7-108', hex: '#c69b36', declaredFamily: 'dourado' },
      families: ['dourado'],
    },
  ];

  for (const c of cases) {
    const result = resolveColor(c.input);
    if (!includesAll(result.families, c.families)) {
      fails.push({
        caso: c.nome,
        esperado: `famílias ⊇ [${c.families.join(', ')}]`,
        obtido: `[${result.families.join(', ')}]`,
      });
    }
    if (c.notFamilies && c.notFamilies.some((f) => result.families.includes(f))) {
      fails.push({
        caso: c.nome,
        esperado: `famílias sem [${c.notFamilies.join(', ')}]`,
        obtido: `[${result.families.join(', ')}]`,
      });
    }
    if (c.confidence && result.confidence !== c.confidence) {
      fails.push({
        caso: c.nome,
        esperado: `confiança = ${c.confidence}`,
        obtido: String(result.confidence),
      });
    }
  }

  return fails;
}

function checkFinishes(): Failure[] {
  const fails: Failure[] = [];

  const cases: { nome: string; got: FinishId[]; want: FinishId[] }[] = [
    {
      nome: "'Sólido/Metálico Brilhante'",
      got: normalizeFinishString('Sólido/Metálico Brilhante').ids,
      want: ['brilhante', 'metalico', 'solido'],
    },
    { nome: "'Metálico Fosco'", got: normalizeFinishString('Metálico Fosco').ids, want: ['fosco', 'metalico'] },
    { nome: "'Camaleão'", got: normalizeFinishString('Camaleão').ids, want: ['camaleao'] },
    {
      nome: "'Camaleão Bilhante' (typo real em produção)",
      got: normalizeFinishString('Camaleão Bilhante').ids,
      want: ['camaleao', 'brilhante'],
    },
    { nome: "finish_type 'Gloss'", got: normalizeFinishString('Gloss').ids, want: ['brilhante'] },
    { nome: "MCX 'matt-metallic'", got: finishFromMcx('matt-metallic').ids, want: ['metalico', 'fosco'] },
    { nome: "MCX 'satin-solid'", got: finishFromMcx('satin-solid').ids, want: ['solido', 'acetinado'] },
    { nome: 'M7 matt=true', got: finishFromM7(true, false).ids, want: ['fosco'] },
    { nome: 'M7 matt=false', got: finishFromM7(false, false).ids, want: ['brilhante'] },
  ];

  for (const c of cases) {
    if (!includesAll(c.got, c.want) || c.got.length !== c.want.length) {
      fails.push({
        caso: `acabamento ${c.nome}`,
        esperado: `[${c.want.join(', ')}]`,
        obtido: `[${c.got.join(', ')}]`,
      });
    }
  }

  // O requisito hierárquico, verificado explicitamente.
  const fosco = finishDescendants('fosco').sort().join(',');
  if (fosco !== 'acetinado,fosco') {
    fails.push({ caso: "expansão de 'fosco'", esperado: 'acetinado,fosco', obtido: fosco });
  }
  const acetinado = finishDescendants('acetinado').join(',');
  if (acetinado !== 'acetinado') {
    fails.push({ caso: "expansão de 'acetinado'", esperado: 'acetinado (folha)', obtido: acetinado });
  }
  const brilhante = finishDescendants('brilhante').join(',');
  if (brilhante !== 'brilhante') {
    fails.push({ caso: "expansão de 'brilhante'", esperado: 'brilhante (folha)', obtido: brilhante });
  }

  return fails;
}

/** Roda tudo e loga no console. Devolve o número de falhas. */
export function runShopSelfTest(): number {
  const fails = [...checkColors(), ...checkFinishes()];

  if (fails.length === 0) {
    console.info('%c[shop] autoteste de taxonomia: OK', 'color:#4ade80');
  } else {
    console.warn(`[shop] autoteste de taxonomia: ${fails.length} divergência(s)`);
    console.table(fails);
  }

  return fails.length;
}
