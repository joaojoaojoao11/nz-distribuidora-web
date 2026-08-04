// Converte os PNGs pesados de public/assets/images para WebP (qualidade 82).
// NÃO substitui referências no código — gera os .webp ao lado dos .png para
// migração supervisionada (trocar referências aos poucos e testar o visual).
//
// Uso:
//   npm i -D sharp        (uma vez)
//   node scripts/convert-webp.mjs [--min-kb 150]
//
// Saída: relatório de economia por arquivo + total.

import { readdir, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error('sharp não instalado. Rode: npm i -D sharp');
  process.exit(1);
}

const ROOT = new URL('../public/assets/images', import.meta.url).pathname
  .replace(/^\/([A-Za-z]:)/, '$1'); // fix caminho Windows
const MIN_KB = Number(process.argv.find((a, i, arr) => arr[i - 1] === '--min-kb') || 150);

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

let totalBefore = 0;
let totalAfter = 0;
let count = 0;

for await (const file of walk(ROOT)) {
  if (extname(file).toLowerCase() !== '.png') continue;
  const { size } = await stat(file);
  if (size < MIN_KB * 1024) continue;

  const out = file.replace(/\.png$/i, '.webp');
  try {
    const info = await sharp(file).webp({ quality: 82 }).toFile(out);
    totalBefore += size;
    totalAfter += info.size;
    count++;
    console.log(`${file.replace(ROOT, '')}: ${(size / 1024).toFixed(0)}KB → ${(info.size / 1024).toFixed(0)}KB`);
  } catch (err) {
    console.error(`FALHOU ${file}:`, err.message);
  }
}

console.log(`\n${count} arquivos convertidos.`);
console.log(`Total: ${(totalBefore / 1024 / 1024).toFixed(1)}MB → ${(totalAfter / 1024 / 1024).toFixed(1)}MB`);
console.log('\nPróximo passo (supervisionado): trocar referências .png → .webp no código e testar o visual.');
