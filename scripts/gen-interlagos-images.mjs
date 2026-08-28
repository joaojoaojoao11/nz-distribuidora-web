// Gera as imagens WebP da landing do Festival Interlagos.
//   node scripts/gen-interlagos-images.mjs
//
// As PNGs originais das linhas pesam de 750 KB a 2,7 MB — inviável numa página
// que abre por QR Code em 4G ruim dentro do autódromo. Aqui elas viram WebP
// redimensionadas, com peso alvo de 40-70 KB cada.
//
// Saída: public/assets/images/interlagos/

import sharp from 'sharp';
import { mkdir, readdir, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'public', 'assets', 'images');
const out = join(src, 'interlagos');

/** [origem, destino, largura, qualidade] */
const JOBS = [
  ['hero-luxury-car.jpg', 'hero.webp', 1280, 68],
  ['wrap_hero.png', 'nzwrap.webp', 720, 66],
  ['nzppf_prime_black.jpg', 'nzppf.webp', 720, 66],
  ['wrap_670ra_hero.png', 'oracal.webp', 720, 66],
  ['luxury_lambo.png', 'importacao.webp', 720, 66],
];

await mkdir(out, { recursive: true });

for (const [from, to, width, quality] of JOBS) {
  await sharp(join(src, from))
    .resize({ width, withoutEnlargement: true })
    .webp({ quality, effort: 6 })
    .toFile(join(out, to));
}

const files = await readdir(out);
let total = 0;
for (const f of files.sort()) {
  const { size } = await stat(join(out, f));
  total += size;
  console.log(`${f.padEnd(20)} ${(size / 1024).toFixed(0).padStart(5)} KB`);
}
console.log(`${''.padEnd(20)} ${'-----'}`);
console.log(`${'total'.padEnd(20)} ${(total / 1024).toFixed(0).padStart(5)} KB`);
