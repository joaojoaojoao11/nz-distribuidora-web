// Gera src/pages/Decor/shDecorProducts.ts e api/_lib/shDecorSlugs.ts
// a partir de scripts/data/sh-decor/*.json. Determinístico (família → nome).
// Uso: node scripts/generate-sh-decor.mjs
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.resolve('scripts/data/sh-decor');
const IMG_DIR = path.resolve('public/assets/images/decor/sh');
const OUT_TS = path.resolve('src/pages/Decor/shDecorProducts.ts');
const OUT_SLUGS = path.resolve('api/_lib/shDecorSlugs.ts');

const FAMILY_ORDER = ['madeira', 'pedra', 'cimento', 'couro', 'tecido', 'solido', 'piso', 'tijolo'];
const FAMILY_NAMES = {
  madeira: 'Madeira', pedra: 'Pedra', cimento: 'Cimento', couro: 'Couro',
  tecido: 'Tecido', solido: 'Sólido', piso: 'Piso', tijolo: 'Tijolo',
};

const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json') && !f.startsWith('_'));
const products = files.map((f) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8')));

products.sort((a, b) => {
  const fo = FAMILY_ORDER.indexOf(a.family) - FAMILY_ORDER.indexOf(b.family);
  if (fo !== 0) return fo;
  return a.name.localeCompare(b.name, 'pt');
});

const entries = products.map((p) => {
  const dir = path.join(IMG_DIR, p.slug);
  const texture = `/assets/images/decor/sh/${p.slug}/texture.jpg`;
  if (!fs.existsSync(path.join(dir, 'texture.jpg'))) {
    throw new Error(`${p.slug}: texture.jpg ausente em disco`);
  }
  const ambient = [];
  for (let i = 1; i <= 3; i++) {
    if (fs.existsSync(path.join(dir, `ambient-${i}.jpg`))) {
      ambient.push(`/assets/images/decor/sh/${p.slug}/ambient-${i}.jpg`);
    }
  }
  const famName = FAMILY_NAMES[p.family] ?? p.family;
  // corrige palavras coladas vindas do scrape (ex.: "CouroNatural")
  const cleanDescription = (p.description || '').replace(/([a-zà-ú])([A-ZÀ-Ú])/g, '$1 $2');
  const description =
    cleanDescription ||
    `Padrão ${p.name}, da família ${famName}. Revestimento de vinil autoadesivo SH Decor para ambientes internos, termo moldável, com aplicação em móveis, paredes, portas e superfícies de alta complexidade.`;

  return {
    slug: p.slug,
    name: p.name,
    code: p.code,
    family: p.family,
    description,
    specs: p.specs,
    images: { texture, ambient },
    seo: {
      title: `${p.name} — Vinil Decorativo SH Decor${p.code ? ` (${p.code})` : ''}`,
      description: `Revestimento de vinil autoadesivo ${p.name}${p.code ? ` (${p.code})` : ''}, família ${famName}. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.`,
      keywords: `${p.name.toLowerCase()} vinil adesivo, sh decor ${p.name.toLowerCase()}, revestimento ${famName.toLowerCase()} adesivo${p.code ? `, ${p.code}` : ''}`,
    },
    sourceUrl: p.sourceUrl,
  };
});

const header = `// Catálogo SH Decor — GERADO a partir de scripts/data/sh-decor/*.json
// (scripts/generate-sh-decor.mjs). Edite os JSONs e regenere; não edite à mão.

export type ShDecorFamilySlug =
  | 'madeira'
  | 'pedra'
  | 'cimento'
  | 'couro'
  | 'tecido'
  | 'solido'
  | 'piso'
  | 'tijolo';

export type ShDecorFamily = {
  slug: ShDecorFamilySlug;
  name: string;
  description: string;
};

export type ShDecorSpec = { label: string; value: string };

export type ShDecorProduct = {
  slug: string;
  name: string;
  code: string;
  family: ShDecorFamilySlug;
  description: string;
  specs: ShDecorSpec[];
  badges?: string[];
  images: {
    texture: string;
    ambient: string[];
  };
  seo: { title: string; description: string; keywords: string };
  sourceUrl?: string;
};

export const SH_DEFAULT_BADGES = ['ATÓXICO', 'BUBBLE FREE', 'LAVÁVEL', 'REALISMO ATÉ NO TOQUE'];

export const shDecorFamilies: ShDecorFamily[] = [
  { slug: 'madeira', name: 'Madeira', description: 'Carvalhos, freijós, freixos e madeiras nobres com veio e toque realistas.' },
  { slug: 'pedra', name: 'Pedra', description: 'Mármores, travertinos e pedras naturais para bancadas, paredes e painéis.' },
  { slug: 'cimento', name: 'Cimento', description: 'Cimento queimado e concreto para o acabamento industrial contemporâneo.' },
  { slug: 'couro', name: 'Couro', description: 'Texturas de couro para cabeceiras, painéis e mobiliário de alto padrão.' },
  { slug: 'tecido', name: 'Tecido', description: 'Linhos e tramas têxteis que aquecem ambientes residenciais e corporativos.' },
  { slug: 'solido', name: 'Sólido', description: 'Cores sólidas e fórmicas para padronização limpa de móveis e superfícies.' },
  { slug: 'piso', name: 'Piso', description: 'Padrões desenvolvidos para renovação de pisos internos.' },
  { slug: 'tijolo', name: 'Tijolo', description: 'Tijolinhos aparentes para composições rústicas e industriais.' },
];

export const shDecorProducts: ShDecorProduct[] = `;

const footer = `;

export const getShProductBySlug = (slug?: string) =>
  shDecorProducts.find((p) => p.slug === slug);

export const getShProductsByFamily = (family: ShDecorFamilySlug) =>
  shDecorProducts.filter((p) => p.family === family);

export const getShFamilyBySlug = (slug?: string) =>
  shDecorFamilies.find((f) => f.slug === slug);
`;

const body = JSON.stringify(entries, null, 2)
  // aspas simples estilo do repo: só troca as chaves/strings via JSON não é trivial;
  // mantemos JSON válido (subset de TS) — o tsc aceita.
  ;

fs.writeFileSync(OUT_TS, header + body + footer);

fs.mkdirSync(path.dirname(OUT_SLUGS), { recursive: true });
fs.writeFileSync(
  OUT_SLUGS,
  `// GERADO por scripts/generate-sh-decor.mjs — não editar à mão\nexport const shDecorSlugs: string[] = ${JSON.stringify(entries.map((e) => e.slug))};\n`
);

const byFamily = {};
for (const e of entries) byFamily[e.family] = (byFamily[e.family] ?? 0) + 1;
console.log(`gerado: ${entries.length} produtos`, byFamily);
