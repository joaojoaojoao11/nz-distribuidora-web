// Enriquece a galeria dos padrões Etherna com imagens oficiais extras.
// Fonte: biblioteca de mídia do WordPress oficial (REST API aberta) — contém
// as fotos originais SEM o texto/logo dos cards (lotes 2024/06 PNG e 2024/10 JPG)
// e swatches quadrados 1200×1200 do carrossel.
// Match: nome canônico do arquivo === slug do padrão (sem fuzzy, sem substring).
// Uso: node scripts/scrape-etherna-extras.mjs
// Depois: converter com o passo PowerShell (extras + crop de detalhe) e regenerar.
import fs from 'node:fs';
import path from 'node:path';

const API = 'https://ethernaprodutos.com.br/wp-json/wp/v2/media';
const DATA_DIR = path.resolve('scripts/data/etherna');
const ORIG_DIR = path.join(DATA_DIR, '_originals');
// baixa até 4 candidatos distintos por padrão; o passo PowerShell filtra por
// hash perceptual (descarta quase-idênticos ao card) e usa no máximo 2
const MAX_EXTRAS = 4;

// squares do carrossel com nome abreviado/ambíguo no arquivo
const ALIASES = {
  'marmore-quartzo': 'marmore-quartzo-cinza',
  'madeira-ripada': 'madeira-ripada-marfim',
  // 'corten' e 'madeira-verona' têm 3 variações cada — ambíguos, ficam de fora
};

const canon = (fname) => {
  let b = decodeURIComponent(fname).replace(/\.(jpe?g|png|webp)$/i, '');
  b = b.replace(/_1200x1200$/i, '').replace(/-scaled$/i, '').replace(/-\d$/, '');
  b = b.replace(/^\d{1,3}-/, '').replace(/^Etherna-Adesivos-Etherna-Decor-/i, '').replace(/^Adesivo-/i, '');
  b = b.replace(/-(\d{2,4}-C)$/i, '');
  b = b.replace(/(\D)\d$/, '$1'); // "Cacau2", "Ocre2" → sem o dígito colado
  const slug = b.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
  return ALIASES[slug] ?? slug;
};

const products = fs.readdirSync(DATA_DIR)
  .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
  .map((f) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8')));
const bySlug = new Map(products.map((p) => [p.slug, p]));

// índice completo da biblioteca de mídia (com retry — o WP falha esporadicamente)
const fetchPage = async (page) => {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(`${API}?per_page=100&page=${page}&_fields=source_url`);
      if (res.ok) return res;
      console.error(`page ${page}: HTTP ${res.status} (tentativa ${attempt})`);
    } catch (e) {
      console.error(`page ${page}: ${e.message} (tentativa ${attempt})`);
    }
    await new Promise((r) => setTimeout(r, 1500 * attempt));
  }
  throw new Error(`page ${page}: esgotou tentativas`);
};

const first = await fetchPage(1);
const totalPages = Number(first.headers.get('x-wp-totalpages') ?? 1);
const media = (await first.json()).map((m) => m.source_url);
for (let page = 2; page <= totalPages; page++) {
  const res = await fetchPage(page);
  media.push(...(await res.json()).map((m) => m.source_url));
}
console.log(`mídia indexada: ${media.length} (${totalPages} páginas)`);

const extras = new Map(); // slug -> [urls]
for (const url of media) {
  const fname = url.split('/').pop();
  if (/-\d+x\d+\.(jpe?g|png|webp)$/i.test(fname)) continue; // thumbs do WP
  const slug = canon(fname);
  const p = bySlug.get(slug);
  if (!p) continue;
  if (fname === p.imageUrl.split('/').pop()) continue; // o próprio card
  const list = extras.get(slug) ?? [];
  list.push(url);
  extras.set(slug, list);
}

// fotos limpas primeiro, squares por último; no máximo MAX_EXTRAS DISTINTOS
// por padrão (re-uploads "-1"/"-2" do WP costumam ser o mesmo arquivo — dedupe
// por md5 do conteúdo; quase-idênticos são filtrados depois por hash perceptual)
import { createHash } from 'node:crypto';
const isSquare = (u) => /_1200x1200/i.test(u);
let downloaded = 0;
fs.mkdirSync(ORIG_DIR, { recursive: true });
for (const [slug, urls] of extras) {
  const candidates = [...new Set(urls)]
    .sort((a, b) => Number(isSquare(a)) - Number(isSquare(b)));
  const seenMd5 = new Set();
  let slot = 0;
  for (const url of candidates) {
    if (slot >= MAX_EXTRAS) break;
    const res = await fetch(url);
    if (!res.ok) { console.error(`FALHA ${slug}: HTTP ${res.status}`); continue; }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 20_000) { console.error(`FALHA ${slug}: ${buf.length} bytes`); continue; }
    const md5 = createHash('md5').update(buf).digest('hex');
    if (seenMd5.has(md5)) continue; // re-upload idêntico
    seenMd5.add(md5);
    slot++;
    const ext = url.match(/\.(png|webp)$/i) ? 'png' : 'jpg';
    fs.writeFileSync(path.join(ORIG_DIR, `${slug}--extra-${slot}.${ext}`), buf);
    downloaded++;
  }
}
console.log(`padrões com extras: ${extras.size} | arquivos distintos baixados: ${downloaded}`);
