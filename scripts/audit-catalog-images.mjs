#!/usr/bin/env node
/**
 * Auditoria de DPI efetivo das imagens do catálogo NZPPF.
 *
 * Lê as dimensões reais (px) de cada PNG/JPG usado e compara
 * com o tamanho que será impresso em A5 (148×210mm @ 300 DPI).
 *
 * DPI mínimo aceitável para impressão offset: 300 DPI no tamanho final.
 * Abaixo de 250 DPI já há perda visível de nitidez.
 */

import { readFileSync, statSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = resolve(__dirname, '..');
const publicDir = resolve(projectRoot, 'public');

// Lista das imagens usadas no catálogo (extraída de catalogData.ts +
// CoverPage.tsx + Catalog.module.css). Cada entrada documenta o
// uso e o tamanho impresso aproximado em mm.
//
// "printed" é a dimensão IMPRESSA da imagem na página A5 final
// (148×210mm). A imagem ocupa essa área inteira (não é maior nem menor).
const IMAGES = [
  // Cover hero (cobre toda a página, incluindo sangria → 154×216mm)
  { path: '/assets/images/luxury_lambo.png',          use: 'capa hero',           printed: { w: 154, h: 216 } },

  // Page background (full bleed em todas as páginas internas)
  { path: '/backgroud.png',                           use: 'fundo das páginas',   printed: { w: 154, h: 216 } },

  // Product detail hero images (50% width, full height da page)
  { path: '/assets/images/luxury_lambo.png',          use: 'product hero Luxury', printed: { w: 77, h: 216 } },
  { path: '/assets/images/nzppf_prime_hero.png',      use: 'product hero Prime',  printed: { w: 77, h: 216 } },
  { path: '/assets/images/flow_haval.png',            use: 'product hero Flow',   printed: { w: 77, h: 216 } },
  { path: '/assets/images/core_catalog_car.png',      use: 'product hero Core',   printed: { w: 77, h: 216 } },
  { path: '/assets/images/nzppf_headlight_light_black.png', use: 'hero Headlight', printed: { w: 77, h: 216 } },
  { path: '/assets/images/nzppf_windshield_diff_impacto.png', use: 'hero Windshield', printed: { w: 77, h: 216 } },

  // Lines overview (página 3): 6 cards 2×3, cada card image ~70×46mm
  { path: '/assets/images/luxury_lambo.png',          use: 'card linha (Lines Overview)', printed: { w: 70, h: 46 } },
  { path: '/assets/images/nzppf_prime_hero.png',      use: 'card linha',                  printed: { w: 70, h: 46 } },
  { path: '/assets/images/flow_haval.png',            use: 'card linha',                  printed: { w: 70, h: 46 } },
  { path: '/assets/images/core_catalog_car.png',      use: 'card linha',                  printed: { w: 70, h: 46 } },
  { path: '/assets/images/nzppf_headlight_light_black.png', use: 'card linha',           printed: { w: 70, h: 46 } },
  { path: '/assets/images/nzppf_windshield_diff_impacto.png', use: 'card linha',          printed: { w: 70, h: 46 } },

  // Finishes hero layout (3 itens, hero 80×100mm + 2 secondaries 50×40mm)
  // Luxury (3 itens, hero index 0)
  { path: '/assets/images/nzppf_super_brilho.png',    use: 'finish hero Luxury Gloss',    printed: { w: 80, h: 100 } },
  { path: '/assets/images/nzppf_matte.png',           use: 'finish secundário Luxury',    printed: { w: 50, h: 40 } },
  { path: '/assets/images/nzppf_black.png',           use: 'finish secundário Luxury',    printed: { w: 50, h: 40 } },

  // Prime (3 itens, hero index 0)
  { path: '/assets/images/nzppf_prime_brilho.png',    use: 'finish hero Prime',           printed: { w: 80, h: 100 } },
  { path: '/assets/images/nzppf_prime_matte.jpg',     use: 'finish secundário Prime',     printed: { w: 50, h: 40 } },
  { path: '/assets/images/nzppf_prime_black.jpg',     use: 'finish secundário Prime',     printed: { w: 50, h: 40 } },

  // Flow (4 itens grid 2×2, cada ~60×50mm)
  { path: '/assets/images/flow_clear_gloss_haval.png', use: 'finish Flow grid',           printed: { w: 60, h: 50 } },
  { path: '/assets/images/flow_clear_matte_haval.png', use: 'finish Flow grid',           printed: { w: 60, h: 50 } },
  { path: '/assets/images/flow_black_gloss_haval.png', use: 'finish Flow grid',           printed: { w: 60, h: 50 } },
  { path: '/assets/images/flow_black_matte_haval.png', use: 'finish Flow grid',           printed: { w: 60, h: 50 } },

  // Core (4 itens grid 2×2)
  { path: '/assets/images/core_clear_gloss.png',      use: 'finish Core grid',            printed: { w: 60, h: 50 } },
  { path: '/assets/images/core_clear_matte.png',      use: 'finish Core grid',            printed: { w: 60, h: 50 } },
  { path: '/assets/images/core_black_gloss.png',      use: 'finish Core grid',            printed: { w: 60, h: 50 } },
  { path: '/assets/images/core_black_matte.png',      use: 'finish Core grid',            printed: { w: 60, h: 50 } },

  // Headlight (3 itens, hero index 2 = DARK BLACK)
  { path: '/assets/images/nzppf_headlight_dark_black.png', use: 'finish hero Headlight',  printed: { w: 80, h: 100 } },
  { path: '/assets/images/nzppf_headlight_light_black.png', use: 'finish secundário Headlight', printed: { w: 50, h: 40 } },
  { path: '/assets/images/nzppf_headlight_light_gray.png',  use: 'finish secundário Headlight', printed: { w: 50, h: 40 } },
];

/** Lê dimensões de um PNG (W e H estão nos bytes 16-23 do arquivo). */
function readPngDimensions(buf) {
  if (
    buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4e ||
    buf[3] !== 0x47 || buf[4] !== 0x0d || buf[5] !== 0x0a ||
    buf[6] !== 0x1a || buf[7] !== 0x0a
  ) {
    return null;
  }
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  return { w, h };
}

/** Lê dimensões de um JPG procurando o marker SOF (FF C0 / C1 / C2). */
function readJpgDimensions(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) return null;
    const marker = buf[i + 1];
    // SOF markers (Start of Frame): C0 baseline, C2 progressive etc.
    if (
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf)
    ) {
      const h = buf.readUInt16BE(i + 5);
      const w = buf.readUInt16BE(i + 7);
      return { w, h };
    }
    const segLen = buf.readUInt16BE(i + 2);
    i += 2 + segLen;
  }
  return null;
}

/** Detecta o formato real pelo magic byte (não pela extensão). */
function detectFormat(buf) {
  if (
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47
  ) return 'png';
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'jpg';
  if (
    buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46
  ) return 'gif';
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return 'webp';
  return 'unknown';
}

function dimensionsOf(buf) {
  const fmt = detectFormat(buf);
  if (fmt === 'png') return { dims: readPngDimensions(buf), format: 'png' };
  if (fmt === 'jpg') return { dims: readJpgDimensions(buf), format: 'jpg' };
  return { dims: null, format: fmt };
}

const MM_PER_INCH = 25.4;
function dpi(pxSize, mmSize) {
  return (pxSize / mmSize) * MM_PER_INCH;
}

const seen = new Map();
const results = [];

for (const img of IMAGES) {
  const fullPath = resolve(publicDir, img.path.replace(/^\//, ''));
  let cached = seen.get(fullPath);

  if (!cached) {
    let bytes;
    try {
      bytes = readFileSync(fullPath);
    } catch (err) {
      results.push({ ...img, status: 'NOT_FOUND', error: err.message });
      continue;
    }
    const result = dimensionsOf(bytes);
    const ext = fullPath.toLowerCase().slice(fullPath.lastIndexOf('.') + 1);
    const extMismatch = result.format !== 'unknown' && result.format !== ext &&
                        !(ext === 'jpeg' && result.format === 'jpg');
    if (!result.dims) {
      results.push({ ...img, status: 'PARSE_FAIL', format: result.format });
      continue;
    }
    cached = {
      dims: result.dims,
      format: result.format,
      extMismatch,
      sizeKb: Math.round(bytes.length / 1024)
    };
    seen.set(fullPath, cached);
  }

  const { dims, format, extMismatch, sizeKb } = cached;
  const dpiW = dpi(dims.w, img.printed.w);
  const dpiH = dpi(dims.h, img.printed.h);
  const minDpi = Math.min(dpiW, dpiH);
  const status =
    minDpi >= 300 ? 'OK' :
    minDpi >= 250 ? 'AVISO' :
    minDpi >= 200 ? 'BAIXO' : 'CRÍTICO';

  results.push({
    ...img,
    pxW: dims.w, pxH: dims.h,
    dpiW: Math.round(dpiW),
    dpiH: Math.round(dpiH),
    minDpi: Math.round(minDpi),
    format,
    extMismatch,
    sizeKb,
    status
  });
}

// Output
const W = 8;
const pad = (s, n) => String(s).padEnd(n);
const padR = (s, n) => String(s).padStart(n);

console.log('\n┌─ AUDITORIA DPI · CATÁLOGO NZPPF A5 IMPRESSO @ 300 DPI ─┐\n');
console.log(
  pad('STATUS', 9),
  pad('PX (W×H)', 14),
  pad('IMPRESSO mm', 12),
  pad('DPI MIN', 8),
  pad('FMT', 5),
  pad('SIZE', 7),
  'IMAGEM · USO'
);
console.log('─'.repeat(140));

for (const r of results) {
  if (r.status === 'NOT_FOUND') {
    console.log(pad('FALTA', 9), pad('-', 14), pad('-', 12), pad('-', 8),
      pad('-', 5), pad('-', 7),
      `${basename(r.path)} · ${r.use}`);
    continue;
  }
  if (r.status === 'PARSE_FAIL') {
    console.log(pad('PARSE_FAIL', 9), pad('-', 14), pad('-', 12), pad('-', 8),
      pad(r.format || '?', 5), pad('-', 7),
      `${basename(r.path)}`);
    continue;
  }
  const pxStr = `${r.pxW}×${r.pxH}`;
  const mmStr = `${r.printed.w}×${r.printed.h}`;
  const fmtStr = r.extMismatch ? `${r.format}!` : r.format;  // ! = ext mismatch
  console.log(
    pad(r.status, 9),
    pad(pxStr, 14),
    pad(mmStr, 12),
    padR(r.minDpi, 8),
    pad(fmtStr, 5),
    padR(`${r.sizeKb}k`, 7),
    `${basename(r.path)} · ${r.use}`
  );
}

// Extra: lista única de arquivos com extensão errada
const mismatched = [...seen.entries()]
  .filter(([_, v]) => v.extMismatch)
  .map(([path, v]) => ({ path, format: v.format }));

if (mismatched.length > 0) {
  console.log('\n─ EXTENSÃO INCORRETA (arquivo .png contendo dado JPG, etc) ─');
  for (const m of mismatched) {
    console.log(`  ${basename(m.path)}  →  formato real: ${m.format}`);
  }
  console.log('\n  Recomendação: renomear ou re-exportar como o formato correto.');
}

// Summary
const counts = results.reduce((acc, r) => {
  acc[r.status] = (acc[r.status] || 0) + 1;
  return acc;
}, {});
console.log('\n─ SUMÁRIO ─');
for (const [k, v] of Object.entries(counts)) {
  console.log(`  ${k}: ${v}`);
}
console.log('\n  Status legend:');
console.log('    OK      ≥ 300 DPI   (qualidade offset profissional)');
console.log('    AVISO   250–299 DPI (aceitável, monitorar)');
console.log('    BAIXO   200–249 DPI (perda perceptível, substituir)');
console.log('    CRÍTICO < 200 DPI   (visualmente pixelizado, urgente)');
