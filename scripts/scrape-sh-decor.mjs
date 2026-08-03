// Scraper do catálogo SH Decor (shdecorbrasil.com.br).
// Percorre as listagens por família, extrai cada produto e baixa as imagens.
// Saída: scripts/data/sh-decor/<slug>.json + public/assets/images/decor/sh/<slug>/*.png
// Uso: node scripts/scrape-sh-decor.mjs [--family=madeira] [--limit=N]
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://www.shdecorbrasil.com.br';
const DATA_DIR = path.resolve('scripts/data/sh-decor');
const IMG_DIR = path.resolve('public/assets/images/decor/sh');
const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' };

const FAMILIES = ['madeira', 'pedra', 'cimento', 'couro', 'tecido', 'solido', 'piso', 'tijolo'];

const argFamily = process.argv.find((a) => a.startsWith('--family='))?.split('=')[1];
const argLimit = Number(process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1] || 0);

fs.mkdirSync(DATA_DIR, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchHtml(url) {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
  return res.text();
}

function stripTags(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// ---- listagem: coleta URLs de produto de uma família (paginada) ----
async function listFamily(family) {
  const urls = new Set();
  for (let page = 1; page <= 10; page++) {
    const url = `${BASE}/produto/em/${family}/${page}`;
    let html;
    try {
      html = await fetchHtml(url);
    } catch {
      break;
    }
    const before = urls.size;
    for (const m of html.matchAll(/href="(?:https?:\/\/www\.shdecorbrasil\.com\.br)?\/produto\/([a-z0-9-]+)"/g)) {
      const slug = m[1];
      if (slug.startsWith('em') || slug.startsWith('tag') || slug.startsWith('buscar')) continue;
      if (slug.startsWith('amostra')) continue;
      if (!slug.includes('revestimento')) continue; // exclui acessórios/leques
      urls.add(slug);
    }
    if (urls.size === before) break; // página sem novidade = acabou a paginação
    await sleep(250);
  }
  return [...urls];
}

// ---- página de produto: extrai os campos ----
function parseProduct(html, siteSlug, family) {
  const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/)?.[1]?.trim();
  if (!h1) throw new Error('sem h1');
  const name = h1.replace(/\s*Revestimento de Vinil Autoadesivo\s*/i, '').trim();

  const code = (html.match(/C[óo]digo:<\/span>\s*([^<]+)/)?.[1] ?? '').replace(/\s+/g, ' ').trim();

  const descMatch = html.match(/Utilize os revestimentos[\s\S]*?<\/p>/);
  const description = descMatch ? stripTags(descMatch[0]) : '';

  const specs = [];
  for (const m of html.matchAll(
    /<td class="font-weight-bolder">([^<]+)<\/td>\s*<td>([^<]+)<\/td>/g
  )) {
    specs.push({ label: stripTags(m[1]), value: stripTags(m[2]) });
  }

  const imgs = [];
  for (const m of html.matchAll(
    /https:\/\/www\.shdecorbrasil\.com\.br\/storage\/images\/cache\/[^"'\s)]+-600-[0-9a-f]+\.(?:png|jpe?g)/g
  )) {
    if (!imgs.includes(m[0])) imgs.push(m[0]);
  }
  if (imgs.length === 0) throw new Error('sem imagens -600-');

  return {
    slug: siteSlug.replace(/-revestimento-de-vinil-autoadesivo$/, ''),
    name,
    code,
    family,
    description,
    specs,
    imageUrls: { texture: imgs[0], ambient: imgs.slice(1, 4) },
    sourceUrl: `${BASE}/produto/${siteSlug}`,
  };
}

async function downloadImages(product) {
  const dir = path.join(IMG_DIR, product.slug);
  fs.mkdirSync(dir, { recursive: true });
  const targets = [
    [product.imageUrls.texture, 'texture.png'],
    ...product.imageUrls.ambient.map((u, i) => [u, `ambient-${i + 1}.png`]),
  ];
  for (const [url, file] of targets) {
    const dest = path.join(dir, file);
    const destJpg = dest.replace(/\.png$/, '.jpg');
    if (fs.existsSync(dest) || fs.existsSync(destJpg)) continue;
    const res = await fetch(url, { headers: UA });
    if (!res.ok) {
      console.log(`  ! imagem ${file} HTTP ${res.status}`);
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 10 * 1024) {
      console.log(`  ! imagem ${file} muito pequena (${buf.length}b) — ignorada`);
      continue;
    }
    fs.writeFileSync(dest, buf);
    await sleep(120);
  }
}

// ---- main ----
const families = argFamily ? [argFamily] : FAMILIES;
const urlsByFamily = {};
let done = 0;

for (const family of families) {
  process.stdout.write(`[${family}] listando... `);
  const slugs = await listFamily(family);
  urlsByFamily[family] = slugs;
  console.log(`${slugs.length} produtos`);

  for (const siteSlug of slugs) {
    if (argLimit && done >= argLimit) break;
    const shortSlug = siteSlug.replace(/-revestimento-de-vinil-autoadesivo$/, '');
    const jsonPath = path.join(DATA_DIR, `${shortSlug}.json`);
    if (fs.existsSync(jsonPath)) {
      console.log(`  = ${shortSlug} (já existe)`);
      continue;
    }
    try {
      const html = await fetchHtml(`${BASE}/produto/${siteSlug}`);
      const product = parseProduct(html, siteSlug, family);
      await downloadImages(product);
      fs.writeFileSync(jsonPath, JSON.stringify(product, null, 2) + '\n');
      console.log(`  + ${shortSlug} (${product.code || 'SEM CÓDIGO'}, ${product.imageUrls.ambient.length + 1} imgs)`);
      done++;
    } catch (e) {
      console.log(`  ! ${shortSlug}: ${e.message}`);
    }
    await sleep(300);
  }
}

fs.writeFileSync(
  path.join(DATA_DIR, '_urls-by-family.json'),
  JSON.stringify(urlsByFamily, null, 2) + '\n'
);
console.log('concluído.');
