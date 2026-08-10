// Gera src/lib/data/metamarkMcxColors.ts e src/lib/data/metamark7Colors.ts
// a partir de scripts/data/metamark/*.json. Determinístico e validado contra o disco:
// dá throw se o chip de alguma cor MCX não existir em public/.
//
// Uso: node scripts/generate-metamark.mjs
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.resolve('scripts/data/metamark');
const CHIP_DIR = path.resolve('public/assets/images/metamark/mcx/chips');
const PHOTO_DIR = path.resolve('public/assets/images/metamark/mcx/aplicacao');
const OUT_MCX = path.resolve('src/lib/data/metamarkMcxColors.ts');
const OUT_M7 = path.resolve('src/lib/data/metamark7Colors.ts');

const HEADER = (fonte) =>
  `// GERADO por scripts/generate-metamark.mjs — não editar à mão.\n` +
  `// Fonte: ${fonte}\n` +
  `// Metamark®, MetaCast®, MetaGlide®, MetaSure™ e Inspire Colours™ são marcas\n` +
  `// registradas da Metamark (UK) Limited.\n\n`;

const slugify = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const q = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const tally = (arr, key) =>
  arr.reduce((acc, item) => ((acc[item[key]] = (acc[item[key]] ?? 0) + 1), acc), {});

/* ============================ MetaCast MCX ============================ */

const FINISH_LABELS = {
  'matt-metallic': ['Matt Metallic', 'metálico fosco'],
  'gloss-metallic': ['Gloss Metallic', 'metálico brilhante'],
  'satin-metallic': ['Satin Metallic', 'metálico acetinado'],
  'gloss-solid': ['Gloss Solid', 'sólido brilhante'],
  'satin-solid': ['Satin Solid', 'sólido acetinado'],
};

const mcxRaw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'mcx-colors.json'), 'utf8'));
const BLACK_CODES = mcxRaw._recortes.blacks;

const mcx = mcxRaw.colors.map((c) => {
  const slug = `${slugify(c.code)}-${slugify(c.name)}`;
  const file = `${slug}.jpg`;
  if (!fs.existsSync(path.join(CHIP_DIR, file))) {
    throw new Error(`${c.code} ${c.name}: chip ausente em disco (${file}). Rode scripts/scrape-metamark.mjs.`);
  }
  if (!FINISH_LABELS[c.finish]) throw new Error(`${c.code}: acabamento desconhecido "${c.finish}"`);
  // foto de aplicação: opcional, existe só para as cores presentes na brochure oficial
  const photoFile = `${slug}.jpg`;
  const photo = fs.existsSync(path.join(PHOTO_DIR, photoFile))
    ? `/assets/images/metamark/mcx/aplicacao/${photoFile}`
    : null;
  return { ...c, slug, chip: `/assets/images/metamark/mcx/chips/${file}`, photo };
});

const dupCodes = mcx.map((c) => c.code).filter((c, i, a) => a.indexOf(c) !== i);
if (dupCodes.length) throw new Error(`códigos MCX duplicados: ${dupCodes.join(', ')}`);

const mcxTs =
  HEADER('https://metamark.co.uk/pages/mcx (painéis de acabamento do HTML oficial)') +
  `export type McxFinish = ${Object.keys(FINISH_LABELS).map(q).join(' | ')};\n\n` +
  `export interface MetamarkMcxColor {\n` +
  `  /** Código oficial do mostruário, ex.: 'MCX-54'. */\n  code: string;\n` +
  `  /** Nome oficial da cor, sem o código. */\n  name: string;\n` +
  `  /** Identificador de URL (?cor=). */\n  slug: string;\n` +
  `  finish: McxFinish;\n` +
  `  /** Inspire Colours™ — desenvolvida para reproduzir um tom de pintura OEM. */\n  inspire: boolean;\n` +
  `  /** Foto oficial do filme (400x400). A MetaCast MCX não publica valor hexadecimal por cor. */\n  chip: string;\n` +
  `  /** Foto de veículo aplicado, da brochure oficial. Nem toda cor tem. */\n  photo: string | null;\n` +
  `}\n\n` +
  `export const MCX_FINISHES: { id: McxFinish; label: string; labelPt: string }[] = [\n` +
  Object.entries(FINISH_LABELS)
    .map(([id, [label, labelPt]]) => `  { id: ${q(id)}, label: ${q(label)}, labelPt: ${q(labelPt)} },`)
    .join('\n') +
  `\n];\n\n` +
  `/** Recorte transversal "Blacks" do mostruário oficial — não é um acabamento. */\n` +
  `export const MCX_BLACK_CODES: readonly string[] = [${BLACK_CODES.map(q).join(', ')}];\n\n` +
  `export const MCX_COLORS: MetamarkMcxColor[] = [\n` +
  mcx
    .map(
      (c) =>
        `  { code: ${q(c.code)}, name: ${q(c.name)}, slug: ${q(c.slug)}, finish: ${q(c.finish)}, inspire: ${c.inspire}, chip: ${q(c.chip)}, photo: ${c.photo ? q(c.photo) : 'null'} },`,
    )
    .join('\n') +
  `\n];\n\n` +
  `/** Ficha técnica oficial da linha (Technical Data Sheet MetaCast® MCX). */\n` +
  `export const MCX_SPECS: { label: string; value: string }[] = [\n` +
  [
    ['Face film', '100 micras cast premium (dupla camada)'],
    ['Adesivo', 'MetaGlide® micro canal, cinza, base solvente, reposicionável'],
    ['Liner', 'PE layflat 140 g/m² com micro canais estruturados'],
    ['Durabilidade', '12 anos preto e branco · 10 anos cores · 5 anos metálicos'],
    ['Largura do rolo', '1.525 mm'],
    ['Comprimento do rolo', '15 m / 30 m'],
    ['Validade em estoque', '2 anos'],
    ['Reação ao fogo', 'Autoextinguível'],
    ['Garantia', 'MetaSure™ — até 12 anos'],
  ]
    .map(([label, value]) => `  { label: ${q(label)}, value: ${q(value)} },`)
    .join('\n') +
  `\n];\n`;

fs.writeFileSync(OUT_MCX, mcxTs);

/* =========================== Metamark 7 Series =========================== */

const FAMILY_LABELS = {
  white: ['White', 'Brancos'],
  black: ['Black', 'Pretos'],
  grey: ['Grey', 'Cinzas'],
  blue: ['Blue', 'Azuis'],
  green: ['Green', 'Verdes'],
  red: ['Red', 'Vermelhos'],
  orange: ['Orange', 'Laranjas'],
  yellow: ['Yellow', 'Amarelos'],
  brown: ['Brown', 'Marrons'],
  purple: ['Purple', 'Roxos'],
  pink: ['Pink', 'Rosas'],
  peach: ['Peach', 'Pêssego'],
  gold: ['Gold', 'Dourados'],
};

const m7Raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'm7-colors.json'), 'utf8'));

const hex = ([r, g, b]) => `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;

const m7 = m7Raw.colors.map((c) => {
  if (!FAMILY_LABELS[c.family]) throw new Error(`${c.code}: família desconhecida "${c.family}"`);
  if (!Array.isArray(c.rgb) || c.rgb.length !== 3) throw new Error(`${c.code}: rgb inválido`);
  return { ...c, slug: `${slugify(c.code)}-${slugify(c.name)}`, hex: hex(c.rgb) };
});

const dupM7 = m7.map((c) => c.code).filter((c, i, a) => a.indexOf(c) !== i);
if (dupM7.length) throw new Error(`códigos M7 duplicados: ${dupM7.join(', ')}`);

// só as famílias efetivamente usadas, na ordem de FAMILY_LABELS
const usedFamilies = Object.keys(FAMILY_LABELS).filter((f) => m7.some((c) => c.family === f));

const m7Ts =
  HEADER('https://metamark.co.uk/products/metamark-7-series (tabela de cores do HTML oficial)') +
  `export type M7Family = ${usedFamilies.map(q).join(' | ')};\n\n` +
  `export interface Metamark7Color {\n` +
  `  /** Código oficial da cor, ex.: 'M7-108'. O SKU do fabricante (M7-108-610) inclui a largura. */\n  code: string;\n` +
  `  name: string;\n` +
  `  /** Grafia oficial completa, ex.: 'M7-108 Imitation Gold'. */\n  fullName: string;\n` +
  `  slug: string;\n` +
  `  family: M7Family;\n` +
  `  /** Derivado do RGB publicado pela Metamark. */\n  hex: string;\n` +
  `  rgb: [number, number, number];\n` +
  `  /** Valor CMYK oficial; null quando o fabricante não publica. */\n  cmyk: string | null;\n` +
  `  /** Referência Pantone® oficial; null quando o fabricante não publica. */\n  pantone: string | null;\n` +
  `  /** Acabamento fosco — indicado pelo sufixo 'M' no código oficial. */\n  matt: boolean;\n` +
  `  /** Filme transparente: o RGB publicado não representa a aparência real. */\n  transparent: boolean;\n` +
  `  /** Disponível também em bobina de 1.600 mm. */\n  wide: boolean;\n` +
  `}\n\n` +
  `export const M7_FAMILIES: { id: M7Family; label: string; labelPt: string }[] = [\n` +
  usedFamilies
    .map((id) => `  { id: ${q(id)}, label: ${q(FAMILY_LABELS[id][0])}, labelPt: ${q(FAMILY_LABELS[id][1])} },`)
    .join('\n') +
  `\n];\n\n` +
  `export const M7_WIDTHS_MM = [380, 610, 760, 1220, 1600] as const;\n\n` +
  `export const M7_COLORS: Metamark7Color[] = [\n` +
  m7
    .map(
      (c) =>
        `  { code: ${q(c.code)}, name: ${q(c.name)}, fullName: ${q(`${c.code} ${c.name}`)}, slug: ${q(c.slug)}, family: ${q(c.family)}, hex: ${q(c.hex)}, rgb: [${c.rgb.join(', ')}], cmyk: ${c.cmyk ? q(c.cmyk) : 'null'}, pantone: ${c.pantone ? q(c.pantone) : 'null'}, matt: ${c.matt}, transparent: ${c.transparent}, wide: ${c.wide} },`,
    )
    .join('\n') +
  `\n];\n\n` +
  `/** Ficha técnica oficial da linha (Technical Data Sheet Metamark 7 Series). */\n` +
  `export const M7_SPECS: { label: string; value: string }[] = [\n` +
  [
    ['Face film', '70 micras PVC polimérico calandrado'],
    ['Adesivo', 'Apex permanente, acrílico base solvente'],
    ['Liner', 'Kraft layflat clay coated, sem solvente'],
    ['Durabilidade', '8 anos preto e branco · 7 anos cores · 5 anos metálicos'],
    ['Larguras', '380 · 610 · 760 · 1.220 · 1.600 mm'],
    ['Reação ao fogo', 'Classe B'],
    ['Observação', '1.600 mm disponível apenas em White Gloss, White Matt, Black Gloss e Black Matt'],
  ]
    .map(([label, value]) => `  { label: ${q(label)}, value: ${q(value)} },`)
    .join('\n') +
  `\n];\n`;

fs.writeFileSync(OUT_M7, m7Ts);

/* ================================ Relatório ================================ */

console.log(`\n${mcx.length} cores MCX`, tally(mcx, 'finish'));
console.log(`  Inspire Colours™: ${mcx.filter((c) => c.inspire).length} · Blacks: ${BLACK_CODES.length}`);
console.log(
  `  com foto de aplicação: ${mcx.filter((c) => c.photo).length} · só amostra: ${mcx.filter((c) => !c.photo).length}`,
);
console.log(`${m7.length} cores M7`, tally(m7, 'family'));
console.log(
  `  com Pantone: ${m7.filter((c) => c.pantone).length} · fosco: ${m7.filter((c) => c.matt).length} · 1.600 mm: ${m7.filter((c) => c.wide).length}`,
);
console.log(`\nGerado:\n  ${path.relative(process.cwd(), OUT_MCX)}\n  ${path.relative(process.cwd(), OUT_M7)}`);
