// Extrai um hex representativo de cada chip da MetaCast MCX.
//
// Por que existe: a Metamark não publica valor hexadecimal por cor da linha MCX
// (só a foto oficial do chip 400x400). Sem hex, o bucketing de cor da LOJA não
// consegue classificar as cores cujo nome não carrega token de cor —
// 'Carbon Steel', 'Urban Steel', 'Plum Crazy'.
//
// O valor extraído é uma ESTIMATIVA nossa e é usado apenas para bucketing
// (resolveColor marca essas resoluções como confidence:'inferida'). Ele nunca
// é exibido como swatch nem apresentado como dado do fabricante.
//
// Amostra o centro do chip (50% central), evitando bordas, sombra e marca
// d'água, e tira a mediana por canal — a mediana ignora reflexo especular, que
// a média não ignora.
//
// Uso: node scripts/extract-chip-hex.mjs

import { readdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHIPS_DIR = join(ROOT, 'public/assets/images/metamark/mcx/chips');
const OUT_FILE = join(ROOT, 'src/lib/shop/generated/mcxChipHex.ts');

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

async function chipHex(path) {
  const image = sharp(path);
  const { width, height } = await image.metadata();
  if (!width || !height) return null;

  // 50% central do chip.
  const left = Math.floor(width * 0.25);
  const top = Math.floor(height * 0.25);
  const w = Math.max(1, Math.floor(width * 0.5));
  const h = Math.max(1, Math.floor(height * 0.5));

  const { data, info } = await image
    .extract({ left, top, width: w, height: h })
    // Reduz o custo e já suaviza ruído de compressão.
    .resize(24, 24, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  const r = [];
  const g = [];
  const b = [];
  for (let i = 0; i < data.length; i += channels) {
    // Pixel transparente não representa a cor do filme.
    if (channels === 4 && data[i + 3] < 200) continue;
    r.push(data[i]);
    g.push(data[i + 1]);
    b.push(data[i + 2]);
  }
  if (!r.length) return null;

  const toHex = (n) => n.toString(16).padStart(2, '0');
  return `#${toHex(median(r))}${toHex(median(g))}${toHex(median(b))}`;
}

const files = (await readdir(CHIPS_DIR)).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
files.sort();

const entries = [];
for (const file of files) {
  const slug = file.replace(/\.(jpe?g|png|webp)$/i, '');
  try {
    const hex = await chipHex(join(CHIPS_DIR, file));
    if (hex) entries.push([slug, hex]);
    else console.warn(`[chip-hex] sem pixels utilizáveis: ${file}`);
  } catch (err) {
    console.warn(`[chip-hex] falhou em ${file}: ${err.message}`);
  }
}

const body = entries.map(([slug, hex]) => `  '${slug}': '${hex}',`).join('\n');

await writeFile(
  OUT_FILE,
  `// GERADO por scripts/extract-chip-hex.mjs — não editar à mão.
//
// Hex ESTIMADO a partir da mediana do centro de cada chip oficial da MetaCast
// MCX. A Metamark não publica hex para essa linha; este valor existe apenas
// para o bucketing de família de cor da LOJA e é marcado como
// confidence:'inferida'. Nunca exibir como swatch nem como dado do fabricante.
//
// Regerar: node scripts/extract-chip-hex.mjs

export const MCX_CHIP_HEX: Record<string, string> = {
${body}
};
`,
  'utf8'
);

console.log(`[chip-hex] ${entries.length} de ${files.length} chips processados → ${OUT_FILE}`);
