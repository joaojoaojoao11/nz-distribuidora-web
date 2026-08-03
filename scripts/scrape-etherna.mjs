// Importa o catálogo Etherna Decor a partir da galeria oficial
// https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/
// A página não tem página por produto: cada padrão é um card 16:9 na galeria
// da sua família (seções h2). Nome/código saem do nome do arquivo.
// Uso: node scripts/scrape-etherna.mjs [--family=madeira] [--limit=N]
// Saída: scripts/data/etherna/<slug>.json + originais em _originals/<slug>.jpg
import fs from 'node:fs';
import path from 'node:path';

const PAGE_URL = 'https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/';
const DATA_DIR = path.resolve('scripts/data/etherna');
const ORIG_DIR = path.join(DATA_DIR, '_originals');

const SECTION_FAMILY = {
  Madeiras: 'madeira',
  Marmorizados: 'marmorizado',
  'Fórmica e Wood': 'formica',
  Pedras: 'pedra',
  Metais: 'metal',
  Tecidos: 'tecido',
  Estampados: 'estampado',
  'Geométricos': 'geometrico',
  Patterns: 'geometrico', // chevrons entram em geométricos
};

// nomes dos arquivos vêm sem acento; os cards oficiais mostram a grafia correta
const ACCENTS = {
  Classica: 'Clássica', Rustica: 'Rústica', Marmore: 'Mármore', Ebano: 'Ébano',
  Pinhao: 'Pinhão', Jacaranda: 'Jacarandá', Demolicao: 'Demolição',
  Formica: 'Fórmica', Algodao: 'Algodão', Egipcio: 'Egípcio', Nevoa: 'Névoa',
  Cromio: 'Crômio', Geometrico: 'Geométrico', Avela: 'Avelã', Bordo: 'Bordô',
  Ceramica: 'Cerâmica',
};

const args = process.argv.slice(2);
const familyFilter = args.find((a) => a.startsWith('--family='))?.split('=')[1] ?? null;
const limit = Number(args.find((a) => a.startsWith('--limit='))?.split('=')[1] ?? Infinity);

fs.mkdirSync(ORIG_DIR, { recursive: true });

const html = await (await fetch(PAGE_URL)).text();

// posições das seções h2 delimitam as galerias
const headings = [];
const hRx = /<h2[^>]*>([^<]+)<\/h2>/g;
let hm;
while ((hm = hRx.exec(html))) headings.push({ title: hm[1].trim(), index: hm.index });

const sections = [];
for (let i = 0; i < headings.length; i++) {
  const fam = SECTION_FAMILY[headings[i].title];
  if (!fam) continue;
  const end = headings[i + 1]?.index ?? html.length;
  sections.push({ family: fam, slice: html.slice(headings[i].index, end) });
}

const URL_RX = /https:\/\/ethernaprodutos\.com\.br\/wp-content\/uploads\/[^"'\\ )]+\.jpe?g/gi;
const isThumb = (u) => /-\d+x\d+\.jpe?g$/i.test(u);

const parseFilename = (url) => {
  let base = decodeURIComponent(url.split('/').pop()).replace(/\.jpe?g$/i, '');
  base = base.replace(/-scaled$/i, '').replace(/-\d$/, ''); // sufixos do WordPress
  let code = '';
  const numbered = base.match(/^(\d{1,3})-(.+)$/);
  if (numbered) {
    code = numbered[1].replace(/^0+/, '');
    base = numbered[2];
  }
  base = base.replace(/^Etherna-Adesivos-Etherna-Decor-/i, '').replace(/^Adesivo-/i, '');
  // código estilo pantone das fórmicas: "...-4137-C"
  const pantone = base.match(/^(.+?)-(\d{2,4}-C)$/i);
  if (pantone) {
    base = pantone[1];
    code = code || pantone[2].toUpperCase();
  }
  const words = base.split('-').filter(Boolean);
  const name = words.map((w) => ACCENTS[w] ?? w).join(' ');
  const slug = words.join('-').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
  return { name, slug, code };
};

const products = [];
const seen = new Set();
for (const { family, slice } of sections) {
  if (familyFilter && family !== familyFilter) continue;
  const urls = [...new Set((slice.match(URL_RX) ?? []).filter((u) => !isThumb(u)))];
  for (const url of urls) {
    const { name, slug, code } = parseFilename(url);
    if (seen.has(slug)) continue;
    seen.add(slug);
    products.push({ slug, name, code, family, collection: name.split(' ')[0], imageUrl: url });
    if (products.length >= limit) break;
  }
  if (products.length >= limit) break;
}

console.log(`padrões encontrados: ${products.length}`);

const download = async (p) => {
  const dest = path.join(ORIG_DIR, `${p.slug}.jpg`);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 20_000) return 'cache';
  const res = await fetch(p.imageUrl);
  if (!res.ok) throw new Error(`${p.slug}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 20_000) throw new Error(`${p.slug}: imagem suspeita (${buf.length} bytes)`);
  fs.writeFileSync(dest, buf);
  return 'ok';
};

let done = 0;
const queue = [...products];
const workers = Array.from({ length: 6 }, async () => {
  while (queue.length) {
    const p = queue.shift();
    try {
      await download(p);
      fs.writeFileSync(
        path.join(DATA_DIR, `${p.slug}.json`),
        JSON.stringify({ ...p, sourceUrl: PAGE_URL }, null, 2)
      );
      done++;
      if (done % 20 === 0) console.log(`${done}/${products.length}...`);
    } catch (e) {
      console.error('FALHA', p.slug, e.message);
    }
  }
});
await Promise.all(workers);

const byFamily = {};
for (const p of products) byFamily[p.family] = (byFamily[p.family] ?? 0) + 1;
console.log(`concluído: ${done}/${products.length}`, byFamily);
