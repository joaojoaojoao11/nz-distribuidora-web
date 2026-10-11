// Amostra a cor dominante da FOTO de cada produto publicado e grava em
// produtos.hex_amostra / paleta_amostra. Fase 0 da busca por imagem
// (FIRECRAL/PLANO_LOJA_BUSCA_POR_IMAGEM.md).
//
// Por que existe: só 198 das 490 cores tinham hex no banco; as outras 292 — e
// os 148 padrões — só tinham foto. Sem número não há distância de cor. A foto
// de catálogo é um rolo sobre fundo branco com o logo da marca no canto: o
// algoritmo tira o fundo e o canto e faz k-means em Lab sobre o que sobra. É
// o MESMO código que a Lente roda no navegador (src/lib/shop/color/paleta.ts,
// compilado aqui com esbuild): a foto do próprio produto reencontra o produto.
//
// O valor é ESTIMATIVA. Nunca vira swatch nem família (ver resolveColor); só a
// busca por imagem lê. Nos produtos que JÁ têm hex publicado, o script também
// amostra — a distância entre os dois é a calibração grátis do método e
// aparece no resumo e na folha de contato.
//
// Saída: tmp/amostra-hex.html (pasta ignorada pelo git) — folha de contato para
// conferir a olho, com os divergentes primeiro.
//
// Uso:
//   npm run shop:amostra              amostra quem ainda não tem e grava
//   npm run shop:amostra -- --forcar  reamostra tudo
//   npm run shop:amostra -- --dry     não grava; só mede e gera a folha
//   npm run shop:amostra -- --limite 50

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const FORCAR = args.includes('--forcar');
const DRY = args.includes('--dry');
const LIMITE = (() => {
  const i = args.indexOf('--limite');
  return i >= 0 ? Number(args[i + 1]) || Infinity : Infinity;
})();

const SITE_URL = 'https://www.nzgroup.com.br';
/** Lado da análise. 96 px bastam para cor; o k-means fica instantâneo. */
const LADO = 96;
/** Mesmas opções de OPCOES_CATALOGO em src/lib/shop/color/paletaNavegador.ts. */
const OPCOES = { k: 4, ignorarFundo: true, ignorarCanto: { largura: 0.42, altura: 0.2 } };
/** Acima disto entre hex publicado e amostra, vai para "conferir a olho". */
const DIVERGENTE_DE = 15;
const CONCORRENCIA = 6;

// ------------------------------------------------------------------ env

async function loadEnv(file) {
  let text;
  try {
    text = await readFile(join(ROOT, file), 'utf8');
  } catch {
    return;
  }
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)$/i);
    if (!match) continue;
    const value = match[2].trim().replace(/^(['"])(.*)\1$/s, '$2');
    if (!(match[1] in process.env)) process.env[match[1]] = value;
  }
}
await loadEnv('.env');
await loadEnv('.env.local');

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('[amostra] ENV ausente: VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}
const site = createClient(url, key);

// ------------------------------------------------------------------ algoritmo (o mesmo da Lente)

mkdirSync(join(ROOT, 'node_modules/.cache'), { recursive: true });
const outDir = mkdtempSync(join(ROOT, 'node_modules/.cache/nz-amostra-'));
const build = spawnSync(
  process.execPath,
  [
    join(ROOT, 'node_modules/esbuild/bin/esbuild'),
    'src/lib/shop/color/paleta.ts',
    'src/lib/shop/color/lab.ts',
    'src/lib/shop/color/hsl.ts',
    '--bundle',
    `--outdir=${outDir}`,
    '--outbase=src/lib/shop/color',
    '--format=esm',
    '--platform=node',
    '--log-level=error',
  ],
  { cwd: ROOT, encoding: 'utf8' }
);
if (build.status !== 0) {
  console.error(build.error?.message || build.stderr || build.stdout || 'esbuild falhou');
  rmSync(outDir, { recursive: true, force: true });
  process.exit(1);
}
const { extrairPaletaDePixels, estimarFundo, MIN_UNIFORMIDADE } = await import(pathToFileURL(join(outDir, 'paleta.js')).href);
const { deltaEHex } = await import(pathToFileURL(join(outDir, 'lab.js')).href);
const { bucketFromHex } = await import(pathToFileURL(join(outDir, 'hsl.js')).href);

async function pixelsDe(src) {
  let entrada;
  if (/^https?:/i.test(src)) {
    const r = await fetch(src);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    entrada = Buffer.from(await r.arrayBuffer());
  } else {
    const p = join(ROOT, 'public', decodeURIComponent(src.split('?')[0]));
    if (!existsSync(p)) throw new Error(`arquivo não existe: ${src}`);
    entrada = p;
  }
  const { data, info } = await sharp(entrada)
    .rotate()
    .ensureAlpha()
    .resize(LADO, LADO, { fit: 'inside', withoutEnlargement: true })
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, largura: info.width, altura: info.height };
}

function amostrar(px) {
  const fundo = estimarFundo(px.data, px.largura, px.altura);
  return {
    // Borda uniforme = foto de estúdio (rolo sobre fundo). Sem isso é carro,
    // ambiente ou textura que preenche o quadro.
    uniforme: Boolean(fundo && fundo.uniformidade >= MIN_UNIFORMIDADE),
    paleta: extrairPaletaDePixels(px.data, px.largura, px.altura, OPCOES),
  };
}

// ------------------------------------------------------------------ produtos

const produtos = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await site
    .from('produtos')
    .select('id, slug, nome, kind, imagem, galeria, hex, hex_inferido, transparente, hex_amostra, amostra_origem')
    .eq('publicado', true)
    .order('slug')
    .range(from, from + 999);
  if (error) {
    console.error('[amostra] produtos:', error.message);
    process.exit(1);
  }
  produtos.push(...(data ?? []));
  if ((data ?? []).length < 1000) break;
}

const comFoto = produtos.filter((p) => p.imagem);
const alvo = comFoto.filter((p) => FORCAR || !p.hex_amostra).slice(0, LIMITE);
console.log(
  `[amostra] ${produtos.length} publicados · ${comFoto.length} com foto · ${alvo.length} a amostrar${DRY ? ' (dry)' : ''}`
);

const resultados = [];
const erros = [];
let idx = 0;
let feitos = 0;

async function processar(p) {
  const px = await pixelsDe(p.imagem);
  let { uniforme, paleta } = amostrar(px);
  let origem = 'foto-capa';
  let fonte = p.imagem;
  let sinal = null;

  // Capa de COR que não é foto de estúdio (carro, ambiente): procura na
  // galeria uma que seja. Padrão decorativo é textura que preenche o quadro —
  // não tem fundo mesmo, e está certo assim.
  if (!uniforme && p.kind === 'cor') {
    const outras = (p.galeria ?? []).filter((u) => u && u !== p.imagem).slice(0, 4);
    let achou = false;
    for (const u of outras) {
      try {
        const r = amostrar(await pixelsDe(u));
        if (r.uniforme) {
          paleta = r.paleta;
          uniforme = true;
          origem = 'foto-galeria';
          fonte = u;
          achou = true;
          break;
        }
      } catch {
        // foto da galeria inacessível: tenta a próxima
      }
    }
    if (!achou) sinal = 'sem-fundo-uniforme';
  }
  if (!paleta.length) throw new Error('sem pixels utilizáveis');

  const hex = paleta[0].hex;
  const de = p.hex && !p.transparente ? deltaEHex(p.hex, hex) : null;
  const paletaDb = paleta.map((c) => ({ hex: c.hex, peso: Number(c.peso.toFixed(3)) }));

  if (!DRY) {
    const { error } = await site
      .from('produtos')
      .update({
        hex_amostra: hex,
        paleta_amostra: paletaDb,
        amostra_em: new Date().toISOString(),
        amostra_origem: origem,
      })
      .eq('id', p.id);
    if (error) throw new Error(`update: ${error.message}`);
  }
  resultados.push({ p, hex, paleta: paletaDb, origem, fonte, uniforme, sinal, de });
}

async function trabalhador() {
  while (idx < alvo.length) {
    const p = alvo[idx++];
    try {
      await processar(p);
    } catch (e) {
      erros.push({ slug: p.slug, erro: e.message });
    }
    feitos++;
    if (feitos % 50 === 0) console.log(`[amostra] ${feitos}/${alvo.length}`);
  }
}
await Promise.all(Array.from({ length: CONCORRENCIA }, trabalhador));

// ------------------------------------------------------------------ resumo

const comDe = resultados.filter((r) => r.de !== null).sort((a, b) => a.de - b.de);
const mediana = comDe.length ? comDe[Math.floor(comDe.length / 2)].de : null;
const divergentes = comDe.filter((r) => r.de > DIVERGENTE_DE).sort((a, b) => b.de - a.de);
const semFundo = resultados.filter((r) => r.sinal === 'sem-fundo-uniforme');
const porOrigem = resultados.reduce((acc, r) => ((acc[r.origem] = (acc[r.origem] ?? 0) + 1), acc), {});

console.log('');
console.log(`[amostra] amostrados: ${resultados.length} · erros: ${erros.length}`);
console.log(`[amostra] origem:`, porOrigem);
console.log(`[amostra] com hex publicado para comparar: ${comDe.length} · ΔE mediano: ${mediana === null ? '—' : mediana.toFixed(1)}`);
console.log(`[amostra] divergentes (ΔE > ${DIVERGENTE_DE}): ${divergentes.length} · cores sem foto de estúdio: ${semFundo.length}`);
for (const r of divergentes.slice(0, 12)) {
  console.log(`   ${r.de.toFixed(1).padStart(5)}  ${r.p.slug}  publicado ${r.p.hex}  amostra ${r.hex}`);
}
for (const e of erros.slice(0, 20)) console.log(`   ERRO ${e.slug}: ${e.erro}`);

// ------------------------------------------------------------------ folha de contato

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const src = (u) => (/^https?:/i.test(u) ? u : `${SITE_URL}${u}`);
const familia = (hex) => bucketFromHex(hex)?.family ?? '—';

function card(r) {
  return `<div class="c">
    <img src="${esc(src(r.fonte))}" loading="lazy" alt="">
    <div class="sw"><span style="background:${r.hex}" title="amostra ${r.hex}"></span>${
      r.p.hex ? `<span style="background:${esc(r.p.hex)}" title="publicado ${esc(r.p.hex)}"></span>` : ''
    }</div>
    <div class="n">${esc(r.p.nome)}</div>
    <div class="m">${esc(r.p.slug)} · ${esc(r.p.kind)} · ${esc(r.origem)}${r.sinal ? ` · <b>${esc(r.sinal)}</b>` : ''}</div>
    <div class="m">amostra ${r.hex} → ${esc(familia(r.hex))}${
      r.p.hex
        ? ` · publicado ${esc(r.p.hex)} → ${esc(familia(r.p.hex))}${r.de === null ? ' (transparente)' : ` · ΔE ${r.de.toFixed(1)}`}`
        : ''
    }</div>
  </div>`;
}

const secao = (titulo, lista) =>
  `<h2>${esc(titulo)} <small>(${lista.length})</small></h2><div class="g">${lista.map(card).join('')}</div>`;

const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Amostra de hex das fotos</title>
<style>
body{font:13px/1.4 system-ui,sans-serif;background:#111;color:#eee;margin:0;padding:1.5rem}
h1{font-size:1.2rem}h2{font-size:1rem;margin:2rem 0 .6rem;border-top:1px solid #333;padding-top:1rem}
small{color:#888}.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}
.c{background:#1a1a1a;border:1px solid #2a2a2a;padding:8px}.c img{width:100%;aspect-ratio:1;object-fit:cover;background:#fff;display:block}
.sw{display:flex;gap:4px;margin:6px 0}.sw span{flex:1;height:26px;border:1px solid #444}
.n{font-weight:600;margin-top:4px}.m{color:#9a9a9a;font-size:11px;word-break:break-all}b{color:#f5a623}
</style></head><body>
<h1>Amostra de hex das fotos — ${new Date().toLocaleString('pt-BR')}${DRY ? ' (dry, nada gravado)' : ''}</h1>
<p>${resultados.length} amostrados · ${comDe.length} com hex publicado para comparar · ΔE mediano ${
  mediana === null ? '—' : mediana.toFixed(1)
} · ${erros.length} erros</p>
<p>Em cada card: a foto usada, a cor amostrada (esquerda) e, quando existe, o hex publicado (direita). A família é a que o bucketing da loja daria a cada hex.</p>
${secao(`Divergentes — ΔE > ${DIVERGENTE_DE} entre publicado e amostra (conferir a olho)`, divergentes)}
${secao('Cores sem foto de estúdio — a capa é carro/ambiente e a galeria não tinha rolo; a cor veio do centro da foto (conferir)', semFundo)}
${secao('Todos', [...resultados].sort((a, b) => a.p.slug.localeCompare(b.p.slug)))}
${erros.length ? `<h2>Erros (${erros.length})</h2><pre>${esc(erros.map((e) => `${e.slug}: ${e.erro}`).join('\n'))}</pre>` : ''}
</body></html>`;

const pasta = join(ROOT, 'tmp');
if (!existsSync(pasta)) mkdirSync(pasta, { recursive: true });
const saida = join(pasta, 'amostra-hex.html');
await writeFile(saida, html, 'utf8');
console.log(`[amostra] folha de contato: ${saida}`);

rmSync(outDir, { recursive: true, force: true });
process.exitCode = erros.length ? 1 : 0;
