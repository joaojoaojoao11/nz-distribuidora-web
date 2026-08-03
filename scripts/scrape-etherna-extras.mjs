// Baixa as texturas quadradas limpas (1200×1200, sem branding) do carrossel
// oficial da Etherna Decor e salva como ambient-1 dos padrões correspondentes.
// Mapeamento manual: só entram matches inequívocos (Verona/Corten têm 3
// variações cada e o carrossel não distingue; Taj Mahal saiu de linha).
// Uso: node scripts/scrape-etherna-extras.mjs  (depois: converter PNG→JPG e regenerar)
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://ethernaprodutos.com.br/wp-content/uploads/2024/09';
const OUT = path.resolve('scripts/data/etherna/_originals');

const CLEAN_TEXTURES = {
  'marmore-quartzo-cinza': `${BASE}/Marmore-Quartzo_1200x1200.png`,
  'madeira-figueira-ocre': `${BASE}/Madeira-Figueira-Ocre_1200x1200.png`,
  'madeira-figueira-marfim': `${BASE}/Madeira-Figueira-Marfim_1200x1200.png`,
  'madeira-ebano-avela': `${BASE}/Madeira-Ebano-Avela_1200x1200.png`,
  'madeira-cerejeira-cacau': `${BASE}/Madeira-Cerejeira-Cacau2_1200x1200.png`,
  'granilite-bege': `${BASE}/Granilite-Bege_1200x1200.png`,
  'marmore-claro-ouro': `${BASE}/Marmore-Claro-Ouro_1200x1200.png`,
  'marmore-carrara-ocre': `${BASE}/Marmore-Carrara-Ocre2_1200x1200.png`,
  'marmore-carrara-bege': `${BASE}/Marmore-Carrara-Bege_1200x1200.png`,
  'marmore-carrara-preto': `${BASE}/Marmore-Carrara-Preto_1200x1200.png`,
  'madeira-ripada-marfim': `${BASE}/Madeira-Ripada2_1200x1200.png`,
  'madeira-classica-cinza': `${BASE}/Madeira-Classica-Cinza2_1200x1200.png`,
};

fs.mkdirSync(OUT, { recursive: true });
let ok = 0;
for (const [slug, url] of Object.entries(CLEAN_TEXTURES)) {
  if (!fs.existsSync(path.resolve(`scripts/data/etherna/${slug}.json`))) {
    console.error(`AVISO: ${slug} não existe no catálogo — pulando`);
    continue;
  }
  const dest = path.join(OUT, `${slug}--ambient-1.png`);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 20_000) { ok++; continue; }
  const res = await fetch(url);
  if (!res.ok) { console.error(`FALHA ${slug}: HTTP ${res.status}`); continue; }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 20_000) { console.error(`FALHA ${slug}: ${buf.length} bytes`); continue; }
  fs.writeFileSync(dest, buf);
  ok++;
}
console.log(`texturas limpas baixadas: ${ok}/${Object.keys(CLEAN_TEXTURES).length}`);
