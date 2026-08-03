// Auditoria do catálogo Etherna Decor gerado.
// Uso: node scripts/audit-etherna.mjs
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.resolve('scripts/data/etherna');
const IMG_DIR = path.resolve('public/assets/images/decor/etherna');
const TS_FILE = path.resolve('src/pages/Decor/ethernaProducts.ts');
const SLUGS_FILE = path.resolve('api/_lib/ethernaSlugs.ts');

let errors = 0;
const fail = (msg) => { console.error('ERRO:', msg); errors++; };

const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json') && !f.startsWith('_'));
const products = files.map((f) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8')));

// slugs únicos
const slugs = new Set();
for (const p of products) {
  if (slugs.has(p.slug)) fail(`slug duplicado: ${p.slug}`);
  slugs.add(p.slug);
}

// códigos únicos quando presentes
const codes = new Map();
for (const p of products) {
  if (!p.code) continue;
  if (codes.has(p.code)) fail(`código ${p.code} duplicado: ${codes.get(p.code)} e ${p.slug}`);
  codes.set(p.code, p.slug);
}

// imagens em disco
let ambients = 0;
for (const p of products) {
  const tex = path.join(IMG_DIR, p.slug, 'texture.jpg');
  if (!fs.existsSync(tex)) fail(`${p.slug}: texture.jpg ausente`);
  else if (fs.statSync(tex).size < 1024) fail(`${p.slug}: texture.jpg < 1KB`);
  for (let i = 1; i <= 3; i++) {
    const amb = path.join(IMG_DIR, p.slug, `ambient-${i}.jpg`);
    if (fs.existsSync(amb)) {
      ambients++;
      if (fs.statSync(amb).size < 1024) fail(`${p.slug}: ambient-${i}.jpg < 1KB`);
    }
  }
}

// pastas órfãs (imagem sem JSON)
for (const dir of fs.readdirSync(IMG_DIR)) {
  if (!slugs.has(dir)) fail(`pasta órfã em public: ${dir}`);
}

// TS gerado consistente
const ts = fs.readFileSync(TS_FILE, 'utf8');
const tsCount = (ts.match(/"slug":/g) || []).length;
if (tsCount !== products.length) fail(`TS tem ${tsCount} produtos, JSONs têm ${products.length}`);
if (/R\$|"price"|preço:/i.test(ts)) fail('referência a preço no TS gerado');
const slugsTs = fs.readFileSync(SLUGS_FILE, 'utf8');
const slugsCount = (slugsTs.match(/"/g) || []).length / 2;
if (slugsCount !== products.length) fail(`ethernaSlugs tem ${slugsCount}, esperado ${products.length}`);

// resumo
const byFamily = {};
let noCode = 0;
for (const p of products) {
  byFamily[p.family] = (byFamily[p.family] ?? 0) + 1;
  if (!p.code) noCode++;
}
console.log('produtos:', products.length);
console.log('por família:', byFamily);
console.log('com ambient extra:', ambients);
console.log('sem código (aguardando numeração oficial):', noCode);
console.log(errors === 0 ? 'AUDIT OK' : `AUDIT FALHOU: ${errors} erro(s)`);
process.exit(errors === 0 ? 0 : 1);
