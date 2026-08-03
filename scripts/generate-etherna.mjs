// Gera src/pages/Decor/ethernaProducts.ts e api/_lib/ethernaSlugs.ts
// a partir de scripts/data/etherna/*.json. Determinístico (família → nome).
// Uso: node scripts/generate-etherna.mjs
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.resolve('scripts/data/etherna');
const IMG_DIR = path.resolve('public/assets/images/decor/etherna');
const OUT_TS = path.resolve('src/pages/Decor/ethernaProducts.ts');
const OUT_SLUGS = path.resolve('api/_lib/ethernaSlugs.ts');

const FAMILY_ORDER = ['madeira', 'marmorizado', 'formica', 'pedra', 'metal', 'tecido', 'estampado', 'geometrico'];
const FAMILY_NAMES = {
  madeira: 'Madeira', marmorizado: 'Marmorizado', formica: 'Fórmica & Wood',
  pedra: 'Pedra & Cimento', metal: 'Metal', tecido: 'Tecido',
  estampado: 'Estampado', geometrico: 'Geométrico',
};

// exceções oficiais ao Sistema Shield® e às espessuras da linha
const NO_SHIELD = new Set(['Linem', 'Fórmica', 'Wood', 'Escovado']);
const THICKNESS = { 'Fórmica': '140 micras', Wood: '140 micras', Escovado: '100 micras' };
const DEFAULT_THICKNESS = '160 micras (dupla camada)';

const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json') && !f.startsWith('_'));
const products = files.map((f) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8')));

products.sort((a, b) => {
  const fo = FAMILY_ORDER.indexOf(a.family) - FAMILY_ORDER.indexOf(b.family);
  if (fo !== 0) return fo;
  return a.name.localeCompare(b.name, 'pt');
});

const entries = products.map((p) => {
  const dir = path.join(IMG_DIR, p.slug);
  const texture = `/assets/images/decor/etherna/${p.slug}/texture.jpg`;
  if (!fs.existsSync(path.join(dir, 'texture.jpg'))) {
    throw new Error(`${p.slug}: texture.jpg ausente em disco`);
  }
  const ambient = [];
  for (let i = 1; i <= 3; i++) {
    if (fs.existsSync(path.join(dir, `ambient-${i}.jpg`))) {
      ambient.push(`/assets/images/decor/etherna/${p.slug}/ambient-${i}.jpg`);
    }
  }

  const famName = FAMILY_NAMES[p.family] ?? p.family;
  const collection = p.collection ?? p.name.split(' ')[0];
  const shield = !NO_SHIELD.has(collection);
  const thickness = THICKNESS[collection] ?? DEFAULT_THICKNESS;
  const durability = collection === 'Escovado'
    ? '08 anos interno · 02 anos externo'
    : '08 anos interno · 04 anos externo';

  const description =
    `Padrão ${p.name}, da família ${famName} da linha Etherna Decor. ` +
    `Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de ${thickness.replace(' (dupla camada)', '')}` +
    (shield ? ' e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas.' : '.') +
    ' Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.';

  const specs = [
    { label: 'Espessura frontal', value: thickness },
    { label: 'Dimensões do rolo', value: '1,22 m × 25 m' },
    { label: 'Liner', value: 'Papel couché 120 g/m² siliconado' },
    { label: 'Adesivo', value: 'Cola acrílica aquosa permanente de alta adesão' },
    { label: 'Durabilidade', value: durability },
  ];
  if (shield) {
    specs.push({
      label: 'Proteção',
      value: 'Sistema Shield® — antifúngico, bactericida, não propaga fogo',
    });
  }

  const badges = shield
    ? ['SISTEMA SHIELD®', 'ANTIFÚNGICO · BACTERICIDA', 'NÃO PROPAGA FOGO', 'INDÚSTRIA NACIONAL']
    : ['INDÚSTRIA NACIONAL', 'NÃO PROPAGA FOGO', 'RESISTE A MOFO', 'ALTA ADESÃO'];

  return {
    slug: p.slug,
    name: p.name,
    code: p.code ?? '',
    family: p.family,
    collection,
    description,
    specs,
    badges,
    images: { texture, ambient },
    seo: {
      title: `${p.name} — Vinil Adesivo Etherna Decor${p.code ? ` (cód. ${p.code})` : ''}`,
      description: `Revestimento vinílico autoadesivo ${p.name}, família ${famName}, linha Etherna Decor. Indústria nacional${shield ? ', Sistema Shield®' : ''}, rolo 1,22 m × 25 m. Orçamento com a NZDecor.`,
      keywords: `${p.name.toLowerCase()} adesivo, etherna decor ${p.name.toLowerCase()}, vinil ${famName.toLowerCase()} etherna${p.code ? `, ${p.code}` : ''}`,
    },
    sourceUrl: p.sourceUrl,
  };
});

const header = `// Catálogo Etherna Decor — GERADO a partir de scripts/data/etherna/*.json
// (scripts/generate-etherna.mjs). Edite os JSONs e regenere; não edite à mão.

export type EthernaFamilySlug =
  | 'madeira'
  | 'marmorizado'
  | 'formica'
  | 'pedra'
  | 'metal'
  | 'tecido'
  | 'estampado'
  | 'geometrico';

export type EthernaFamily = {
  slug: EthernaFamilySlug;
  name: string;
  description: string;
};

export type EthernaSpec = { label: string; value: string };

export type EthernaProduct = {
  slug: string;
  name: string;
  code: string;
  family: EthernaFamilySlug;
  collection: string;
  description: string;
  specs: EthernaSpec[];
  badges: string[];
  images: {
    texture: string;
    ambient: string[];
  };
  seo: { title: string; description: string; keywords: string };
  sourceUrl?: string;
};

export const ETHERNA_HERO_BADGES = [
  'INDÚSTRIA NACIONAL',
  'SISTEMA SHIELD®',
  'NÃO PROPAGA FOGO',
  'ENTREGA EM 48H',
];

export const ethernaFamilies: EthernaFamily[] = [
  { slug: 'madeira', name: 'Madeira', description: 'Carvalhos, ébanos, nogueiras e painéis ripados com veio realista para móveis e paredes.' },
  { slug: 'marmorizado', name: 'Marmorizado', description: 'Carraras, calacattas e travertinos para bancadas, painéis e superfícies de destaque.' },
  { slug: 'formica', name: 'Fórmica & Wood', description: 'Cores sólidas Fórmica e linha Wood para padronização limpa de móveis e ambientes.' },
  { slug: 'pedra', name: 'Pedra & Cimento', description: 'Granilites, cimentos, tijolos e miracema para composições urbanas e industriais.' },
  { slug: 'metal', name: 'Metal', description: 'Escovados e aço corten para acabamentos metálicos contemporâneos.' },
  { slug: 'tecido', name: 'Tecido', description: 'Linho telado e as tramas Avalon, Flow, Amalfi e Rivera para aquecer ambientes.' },
  { slug: 'estampado', name: 'Estampado', description: 'Estampas exclusivas para pontos de cor e personalidade.' },
  { slug: 'geometrico', name: 'Geométrico', description: 'Cubos marmorizados e chevrons para composições gráficas sofisticadas.' },
];

export const ethernaProducts: EthernaProduct[] = `;

const footer = `;

export const getEthernaProductBySlug = (slug?: string) =>
  ethernaProducts.find((p) => p.slug === slug);

export const getEthernaProductsByFamily = (family: EthernaFamilySlug) =>
  ethernaProducts.filter((p) => p.family === family);

export const getEthernaFamilyBySlug = (slug?: string) =>
  ethernaFamilies.find((f) => f.slug === slug);
`;

fs.writeFileSync(OUT_TS, header + JSON.stringify(entries, null, 2) + footer);

fs.mkdirSync(path.dirname(OUT_SLUGS), { recursive: true });
fs.writeFileSync(
  OUT_SLUGS,
  `// GERADO por scripts/generate-etherna.mjs — não editar à mão\nexport const ethernaSlugs: string[] = ${JSON.stringify(entries.map((e) => e.slug))};\n`
);

const byFamily = {};
for (const e of entries) byFamily[e.family] = (byFamily[e.family] ?? 0) + 1;
console.log(`gerado: ${entries.length} produtos`, byFamily);
