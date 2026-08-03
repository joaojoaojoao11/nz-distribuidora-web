// Audita o catálogo SH Decor gerado: imagens em disco, unicidade, sem preço.
// Uso: node scripts/audit-sh-decor.mjs
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.resolve('scripts/data/sh-decor');
const IMG_DIR = path.resolve('public/assets/images/decor/sh');
const TS_FILE = path.resolve('src/pages/Decor/shDecorProducts.ts');

let errors = 0;
const warn = (msg) => console.log(`  AVISO: ${msg}`);
const fail = (msg) => {
  console.log(`  ERRO: ${msg}`);
  errors++;
};

const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json') && !f.startsWith('_'));
const products = files.map((f) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8')));
console.log(`${products.length} produtos nos JSONs`);

// unicidade
const slugs = new Set();
const codes = new Map();
for (const p of products) {
  if (slugs.has(p.slug)) fail(`slug duplicado: ${p.slug}`);
  slugs.add(p.slug);
  if (p.code) {
    if (codes.has(p.code)) warn(`código repetido: ${p.code} (${codes.get(p.code)} e ${p.slug})`);
    codes.set(p.code, p.slug);
  } else warn(`${p.slug} sem código`);
  if (!p.name) fail(`${p.slug} sem nome`);
  if (!p.specs?.length) warn(`${p.slug} sem ficha técnica`);
  if (!p.description) warn(`${p.slug} sem descrição`);
}

// imagens em disco
for (const p of products) {
  const dir = path.join(IMG_DIR, p.slug);
  const tex = path.join(dir, 'texture.jpg');
  if (!fs.existsSync(tex)) fail(`${p.slug}: texture.jpg ausente`);
  else if (fs.statSync(tex).size < 1024) fail(`${p.slug}: texture.jpg < 1KB`);
  const ambients = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => f.startsWith('ambient-')).length
    : 0;
  if (ambients === 0) warn(`${p.slug}: sem foto de ambiente`);
}

// TS gerado consistente e sem preço
const ts = fs.readFileSync(TS_FILE, 'utf8');
const tsCount = (ts.match(/"slug":/g) || []).length;
if (tsCount !== products.length) fail(`TS tem ${tsCount} produtos; JSONs têm ${products.length}`);
if (/R\$|"price"|preço:/i.test(ts)) fail('TS gerado contém referência a preço');

// contagem por família
const byFamily = {};
for (const p of products) byFamily[p.family] = (byFamily[p.family] ?? 0) + 1;
console.log('por família:', byFamily);

console.log(errors ? `FALHOU com ${errors} erro(s)` : 'OK');
process.exit(errors ? 1 : 0);
