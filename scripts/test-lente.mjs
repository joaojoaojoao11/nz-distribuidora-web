// Autoteste da busca por imagem (Lente).
//
// Parte 1 — sem rede:
//   · ΔE2000 contra pares de referência de Sharma, Wu & Dalal (2005);
//   · paleta determinística de uma imagem sintética (quadrado azul sobre
//     branco), com e sem descarte de fundo;
//   · ranking por hex alvo em applyFilters: item sem cor sai, item longe sai,
//     mais perto primeiro, selo certo;
//   · a taxonomia que o servidor manda ao modelo (api/_lib/lenteTaxonomia.ts)
//     é IGUAL à da loja — mudou um lado, isto quebra antes do deploy.
//
// Parte 2 — com rede (anon) e as fotos de public/:
//   · auto-recuperação: a foto do próprio produto, pelo MESMO caminho que a
//     Lente usa, tem que trazer o produto no top-3. Mede o pipeline inteiro,
//     da amostragem ao ranking. Pula com --offline ou sem ENV.
//
// Uso: npm run lente:test [-- --offline] [-- --n 60]

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const OFFLINE = args.includes('--offline');
const N = (() => {
  const i = args.indexOf('--n');
  return i >= 0 ? Number(args[i + 1]) || 60 : 60;
})();

let falhas = 0;
const ok = (nome, cond, extra = '') => {
  console.log(`${cond ? '  OK  ' : ' FALHA'} ${nome}${extra ? ' — ' + extra : ''}`);
  if (!cond) falhas++;
};

// ------------------------------------------------------------------ build

mkdirSync(join(ROOT, 'node_modules/.cache'), { recursive: true });
const outDir = mkdtempSync(join(ROOT, 'node_modules/.cache/nz-lente-test-'));
const build = spawnSync(
  process.execPath,
  [
    join(ROOT, 'node_modules/esbuild/bin/esbuild'),
    'src/lib/shop/color/lab.ts',
    'src/lib/shop/color/paleta.ts',
    'src/lib/shop/color/lexicon.ts',
    'src/lib/shop/finish/tree.ts',
    'src/lib/shop/pattern/taxonomy.ts',
    'src/lib/shop/search/match.ts',
    'api/_lib/lenteTaxonomia.ts',
    '--bundle',
    `--outdir=${outDir}`,
    '--outbase=.',
    '--format=esm',
    '--platform=node',
    '--log-level=error',
    '--define:import.meta.env.DEV=false',
  ],
  { cwd: ROOT, encoding: 'utf8' }
);
if (build.status !== 0) {
  console.error(build.error?.message || build.stderr || build.stdout || 'esbuild falhou');
  rmSync(outDir, { recursive: true, force: true });
  process.exit(1);
}
const mod = (p) => import(pathToFileURL(join(outDir, p)).href);
const lab = await mod('src/lib/shop/color/lab.js');
const paleta = await mod('src/lib/shop/color/paleta.js');
const lexicon = await mod('src/lib/shop/color/lexicon.js');
const tree = await mod('src/lib/shop/finish/tree.js');
const taxonomy = await mod('src/lib/shop/pattern/taxonomy.js');
const match = await mod('src/lib/shop/search/match.js');
const api = await mod('api/_lib/lenteTaxonomia.js');

// ------------------------------------------------------------------ 1. ΔE2000

console.log('\n— ΔE2000 (Sharma 2005)');
const PARES = [
  [[50.0, 2.6772, -79.7751], [50.0, 0.0, -82.7485], 2.0425],
  [[50.0, 3.1571, -77.2803], [50.0, 0.0, -82.7485], 2.8615],
  [[50.0, 2.8361, -74.02], [50.0, 0.0, -82.7485], 3.4412],
  [[50.0, 0.0, 0.0], [50.0, -1.0, 2.0], 2.3669],
  [[50.0, 2.5, 0.0], [73.0, 25.0, -18.0], 27.1492],
  [[50.0, 2.5, 0.0], [61.0, -5.0, 29.0], 22.8977],
  [[50.0, 2.5, 0.0], [56.0, -27.0, -3.0], 31.903],
  [[50.0, 2.5, 0.0], [58.0, 24.0, 15.0], 19.4535],
  [[60.2574, -34.0099, 36.2677], [60.4626, -34.1751, 39.4387], 1.2644],
  [[63.0109, -31.0961, -5.8663], [62.8187, -29.7946, -4.0864], 1.263],
];
for (const [a, b, esperado] of PARES) {
  const de = lab.deltaE2000({ L: a[0], a: a[1], b: a[2] }, { L: b[0], a: b[1], b: b[2] });
  ok(`par ${a.join(',')} × ${b.join(',')} = ${esperado}`, Math.abs(de - esperado) < 0.01, de.toFixed(4));
}
ok('preto × branco = 100', Math.abs(lab.deltaEHex('#000000', '#ffffff') - 100) < 0.01);
ok('mesma cor = 0', lab.deltaEHex('#1f63b8', '#1F63B8') === 0);
{
  const l = lab.hexToLab('#1f63b8');
  const volta = lab.labToHex(l);
  const [r1, g1, b1] = [0x1f, 0x63, 0xb8];
  const [r2, g2, b2] = [parseInt(volta.slice(1, 3), 16), parseInt(volta.slice(3, 5), 16), parseInt(volta.slice(5, 7), 16)];
  ok('hex → Lab → hex volta igual (±1 por canal)', Math.abs(r1 - r2) <= 1 && Math.abs(g1 - g2) <= 1 && Math.abs(b1 - b2) <= 1, volta);
}

// ------------------------------------------------------------------ 2. paleta

console.log('\n— paleta de imagem sintética');
function imagemSintetica() {
  // 64×64 branco, quadrado azul (#1f63b8) de 32×32 no centro = 25% da área,
  // e uma faixa vermelha (#c0182b) de 64×6 um pouco acima da borda ≈ 9%
  // (fora do anel de 8% que mede o fundo).
  const w = 64;
  const h = 64;
  const d = new Uint8ClampedArray(w * h * 4).fill(255);
  const pinta = (x, y, r, g, b) => {
    const o = (y * w + x) * 4;
    d[o] = r;
    d[o + 1] = g;
    d[o + 2] = b;
    d[o + 3] = 255;
  };
  for (let y = 16; y < 48; y++) for (let x = 16; x < 48; x++) pinta(x, y, 0x1f, 0x63, 0xb8);
  for (let y = 50; y < 56; y++) for (let x = 8; x < 56; x++) pinta(x, y, 0xc0, 0x18, 0x2b);
  return { d, w, h };
}
/** Fundo de qualquer cor com um quadrado central de outra. */
function fundoComQuadrado(fundo, quadrado, w = 64, h = 64) {
  const d = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const x = i % w;
    const y = (i / w) | 0;
    const dentro = x >= 16 && x < 48 && y >= 16 && y < 48;
    const c = dentro ? quadrado : fundo;
    d.set([c[0], c[1], c[2], 255], i * 4);
  }
  return { d, w, h };
}
{
  const { d, w, h } = imagemSintetica();
  const semFundo = paleta.extrairPaletaDePixels(d, w, h, { k: 4, ignorarFundo: true });
  const comFundo = paleta.extrairPaletaDePixels(d, w, h, { k: 4 });
  ok('com fundo descartado, a maior cor é o azul', semFundo.length > 0 && lab.deltaEHex(semFundo[0].hex, '#1f63b8') < 3, semFundo[0]?.hex);
  ok('e a segunda é a vermelha', semFundo.length > 1 && lab.deltaEHex(semFundo[1].hex, '#c0182b') < 3, semFundo[1]?.hex);
  ok('sem descartar, a maior cor é o branco', comFundo.length > 0 && lab.deltaEHex(comFundo[0].hex, '#ffffff') < 3, comFundo[0]?.hex);
  const deNovo = paleta.extrairPaletaDePixels(d, w, h, { k: 4, ignorarFundo: true });
  ok('determinística: duas rodadas, mesma paleta', JSON.stringify(semFundo.map((c) => c.hex)) === JSON.stringify(deNovo.map((c) => c.hex)));
  ok('pesos somam 1', Math.abs(semFundo.reduce((s, c) => s + c.peso, 0) - 1) < 1e-6);
  ok('fração de fundo branco na borda é alta', paleta.fracaoDeFundoBranco(d, w, h) > 0.8);
  const fundo = paleta.estimarFundo(d, w, h);
  ok('borda branca é uniforme', fundo && fundo.uniformidade > 0.95, fundo?.uniformidade.toFixed(2));
  const ponto = paleta.amostrarPontoDePixels(d, w, h, 32, 32, 2);
  ok('toque no centro devolve o azul', ponto !== null && lab.deltaEHex(ponto, '#1f63b8') < 1, ponto);

  // Fundo branco-rosado da Metamark (#f5eaf3): não é "branco", mas é fundo.
  const rosado = fundoComQuadrado([0xf5, 0xea, 0xf3], [0x15, 0x2b, 0x4f]);
  const pr = paleta.extrairPaletaDePixels(rosado.d, rosado.w, rosado.h, { k: 4, ignorarFundo: true });
  ok('fundo branco-rosado sai; sobra o azul-marinho', pr.length > 0 && lab.deltaEHex(pr[0].hex, '#152b4f') < 3, pr[0]?.hex);

  // Fundo preto de render: idem.
  const preto = fundoComQuadrado([0x0a, 0x0a, 0x0a], [0xf5, 0xd5, 0x47]);
  const pp = paleta.extrairPaletaDePixels(preto.d, preto.w, preto.h, { k: 4, ignorarFundo: true });
  ok('fundo preto sai; sobra o amarelo', pp.length > 0 && lab.deltaEHex(pp[0].hex, '#f5d547') < 3, pp[0]?.hex);

  // Produto da cor do fundo (branco sobre branco): o corte desfaz e sobra branco.
  const branco = fundoComQuadrado([0xff, 0xff, 0xff], [0xf6, 0xf6, 0xf4]);
  const pb = paleta.extrairPaletaDePixels(branco.d, branco.w, branco.h, { k: 4, ignorarFundo: true });
  ok('produto branco sobre branco não vira paleta vazia', pb.length > 0 && lab.deltaEHex(pb[0].hex, '#fafaf9') < 4, pb[0]?.hex);

  // Foto de rua: borda nada uniforme (quatro faixas), assunto amarelo no centro.
  {
    const w2 = 64;
    const h2 = 64;
    const dd = new Uint8ClampedArray(w2 * h2 * 4);
    for (let i = 0; i < w2 * h2; i++) {
      const x = i % w2;
      const y = (i / w2) | 0;
      let c;
      if (x >= 14 && x < 50 && y >= 14 && y < 50) c = [0xf5, 0xd5, 0x47];
      else if (y < 16) c = [0x7f, 0xb3, 0xe6];
      else if (y >= 48) c = [0x3a, 0x3a, 0x3c];
      else if (x < 32) c = [0x5d, 0x7a, 0x3a];
      else c = [0xb5, 0x8a, 0x5a];
      dd.set([c[0], c[1], c[2], 255], i * 4);
    }
    const f2 = paleta.estimarFundo(dd, w2, h2);
    ok('borda de rua não é uniforme', f2 && f2.uniformidade < 0.65, f2?.uniformidade.toFixed(2));
    const pc = paleta.extrairPaletaDePixels(dd, w2, h2, { k: 5, ignorarFundo: true });
    ok('sem fundo uniforme, lê o centro: amarelo primeiro', pc.length > 0 && lab.deltaEHex(pc[0].hex, '#f5d547') < 3, pc[0]?.hex);
  }
}

// ------------------------------------------------------------------ 3. ranking

console.log('\n— ranking por hex alvo');
const item = (over = {}) => ({
  slug: 's',
  source: 'erp',
  sourceId: 's',
  name: 'Produto',
  code: null,
  subtitle: null,
  brand: 'NZ',
  line: null,
  lineKey: 'sh-wrapping',
  brandKey: 'sh',
  vertical: 'WRAP',
  kind: 'cor',
  aplicacoes: [],
  image: '/x.webp',
  gallery: [],
  hex: null,
  colorFamilies: [],
  colorSubfamilies: [],
  colorConfidence: null,
  finishes: [],
  finishLabel: null,
  patternFamily: null,
  specs: [],
  badges: [],
  garantiaAnos: null,
  durabilidadeAnos: null,
  description: null,
  legacyPath: null,
  searchText: 'produto',
  ...over,
});
{
  const A = item({ slug: 'a', name: 'Azul royal', hex: '#1f63b8', hexBusca: '#1f63b8', colorFamilies: ['azul'] });
  const B = item({ slug: 'b', name: 'Azul quase', hex: '#2a6cbd', hexBusca: '#2a6cbd', colorFamilies: ['azul'] });
  const C = item({ slug: 'c', name: 'Vermelho', hex: '#c0182b', hexBusca: '#c0182b', colorFamilies: ['vermelho'] });
  const D = item({ slug: 'd', name: 'Sem cor', hex: null, hexBusca: null });
  const E = item({ slug: 'e', name: 'Só hex antigo', hex: '#1d60b5', colorFamilies: ['azul'] });
  const f = { ...match.EMPTY_FILTERS, hexAlvo: '1f63b8' };
  const r = match.applyFilters([C, D, B, E, A], f).map((i) => i.slug);
  ok('mais perto primeiro, longe e sem cor fora', JSON.stringify(r) === JSON.stringify(['a', 'e', 'b']), r.join(','));
  ok('hasActiveFilters enxerga o alvo', match.hasActiveFilters(f) && !match.hasActiveFilters(match.EMPTY_FILTERS));
  const deB = match.distanciaDeCor(B, '1f63b8');
  ok('selo: B é "muito parecida"', match.semelhancaDe(deB) === 'muito', deB.toFixed(2));
  ok('selo: vermelho não ganha selo', match.semelhancaDe(match.distanciaDeCor(C, '1f63b8')) === null);
  ok('sem hexBusca cai no hex', match.hexDeBusca(E) === '#1d60b5' && match.hexDeBusca(D) === null);
  const porNome = match.applyFilters([C, D, B, A], { ...f, sort: 'nome' }).map((i) => i.slug);
  ok('ordenação explícita continua valendo dentro do corte', JSON.stringify(porNome) === JSON.stringify(['b', 'a']), porNome.join(','));
  const comTexto = match.applyFilters([C, D, B, A], { ...f, q: 'royal' }).map((i) => i.slug);
  ok('texto livre é soft junto com o alvo (royal primeiro, quase depois)', comTexto[0] === 'a' && comTexto.includes('b'), comTexto.join(','));
}

// ------------------------------------------------------------------ 4. taxonomia servidor = loja

console.log('\n— taxonomia do servidor igual à da loja');
const iguais = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
ok('famílias', iguais(api.FAMILIAS, Object.keys(lexicon.COLOR_LABEL)));
ok('subfamílias', iguais(api.SUBFAMILIAS, Object.keys(lexicon.SUBFAMILY_LABEL)));
ok('acabamentos', iguais(api.ACABAMENTOS, Object.keys(tree.FINISH_LABEL)));
ok('padrões', iguais(api.PADROES, Object.keys(taxonomy.PATTERN_LABEL)));
ok('schema exige todos os campos', api.SCHEMA_LEITURA.required.length === Object.keys(api.SCHEMA_LEITURA.properties).length);
ok('prompt de sistema cita as listas', api.SISTEMA.includes('camaleao') && api.SISTEMA.includes('marmore') && api.SISTEMA.includes('azul-marinho'));

// ------------------------------------------------------------------ 5. auto-recuperação

console.log('\n— auto-recuperação (foto do produto acha o produto)');
async function loadEnv(file) {
  let text;
  try {
    text = await readFile(join(ROOT, file), 'utf8');
  } catch {
    return;
  }
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)$/i);
    if (!m) continue;
    const v = m[2].trim().replace(/^(['"])(.*)\1$/s, '$2');
    if (!(m[1] in process.env)) process.env[m[1]] = v;
  }
}
await loadEnv('.env');
await loadEnv('.env.local');
const supaUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supaKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (OFFLINE || !supaUrl || !supaKey) {
  console.log('  pulado' + (OFFLINE ? ' (--offline)' : ' (sem ENV do Supabase)'));
} else {
  let sharp = null;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.log('  pulado (sharp não instalado)');
  }
  if (sharp) {
    const res = await fetch(
      `${supaUrl}/rest/v1/loja_catalogo?select=slug,kind,imagem,hex,hex_inferido,hex_amostra,transparente&imagem=not.is.null&limit=3000`,
      { headers: { apikey: supaKey, Authorization: `Bearer ${supaKey}` } }
    );
    if (!res.ok) {
      ok('catálogo acessível pela anon', false, `HTTP ${res.status}`);
    } else {
      const rows = await res.json();
      const hexBusca = (r) => (r.transparente ? null : r.hex ?? r.hex_inferido ?? r.hex_amostra ?? null);
      const comCor = rows.filter((r) => hexBusca(r));
      const semAmostra = rows.filter((r) => !r.hex_amostra).length;
      ok(`catálogo com cor de busca: ${comCor.length} de ${rows.length} (sem amostra: ${semAmostra})`, comCor.length / rows.length > 0.95);

      // Amostra determinística: candidatos com foto LOCAL e cor de busca, por slug, um a cada passo.
      const locais = comCor.filter((r) => r.imagem.startsWith('/assets/') && existsSync(join(ROOT, 'public', decodeURIComponent(r.imagem)))).sort((a, b) => a.slug.localeCompare(b.slug));
      const passo = Math.max(1, Math.floor(locais.length / N));
      const amostra = locais.filter((_, i) => i % passo === 0).slice(0, N);

      const OPCOES = { k: 4, ignorarFundo: true, ignorarCanto: { largura: 0.42, altura: 0.2 } };
      // Mesma regra de match.ts (coresDeBusca): o hex principal e, se for
      // outra, a cor amostrada da foto; vale a mais perto.
      const coresDe = (r) => {
        const lista = [];
        const principal = hexBusca(r);
        if (principal) lista.push(principal);
        if (!r.transparente && r.hex_amostra && r.hex_amostra.toLowerCase() !== principal?.toLowerCase()) lista.push(r.hex_amostra);
        return lista;
      };
      const itens = comCor
        .map((r) => ({ slug: r.slug, labs: coresDe(r).map((h) => lab.hexToLab(h)).filter(Boolean) }))
        .filter((x) => x.labs.length);
      const menorDe = (alvo, labs) => Math.min(...labs.map((l) => lab.deltaE2000(alvo, l)));

      // Posição = quantos ficam ESTRITAMENTE mais perto + 1 (empate não penaliza).
      const posicaoDe = (alvo, slug, soPrincipal) => {
        const proprio = itens.find((x) => x.slug === slug);
        if (!proprio) return null;
        const labsDe = (x) => (soPrincipal ? [x.labs[0]] : x.labs);
        const dePropria = menorDe(alvo, labsDe(proprio));
        let melhores = 0;
        let melhor = null;
        for (const x of itens) {
          const d = menorDe(alvo, labsDe(x));
          if (d < dePropria - 1e-9) melhores++;
          if (!melhor || d < melhor.d) melhor = { slug: x.slug, d };
        }
        return { pos: melhores + 1, de: dePropria, melhor };
      };

      let top1 = 0;
      let top3 = 0;
      let top3Publicado = 0;
      const erradas = [];
      let n = 0;
      for (const r of amostra) {
        const { data, info } = await sharp(join(ROOT, 'public', decodeURIComponent(r.imagem)))
          .rotate()
          .ensureAlpha()
          .resize(96, 96, { fit: 'inside', withoutEnlargement: true })
          .raw()
          .toBuffer({ resolveWithObject: true });
        const pal = paleta.extrairPaletaDePixels(data, info.width, info.height, OPCOES);
        if (!pal.length) continue;
        const alvo = pal[0].lab;
        const completa = posicaoDe(alvo, r.slug, false);
        const publicada = posicaoDe(alvo, r.slug, true);
        if (!completa || !publicada) continue;
        n++;
        if (completa.pos === 1) top1++;
        if (completa.pos <= 3) top3++;
        else erradas.push({ slug: r.slug, ...completa });
        if (publicada.pos <= 3) top3Publicado++;
      }
      n = n || 1;
      console.log(
        `  ${n} fotos · top-1 ${((100 * top1) / n).toFixed(0)}% · top-3 ${((100 * top3) / n).toFixed(0)}% · (só contra o hex principal, para referência: top-3 ${(
          (100 * top3Publicado) / n
        ).toFixed(0)}%)`
      );
      for (const e of erradas.slice(0, 15)) {
        console.log(`   ${e.slug}: posição ${e.pos} (ΔE até si ${e.de.toFixed(1)}; mais perto: ${e.melhor.slug} ΔE ${e.melhor.d.toFixed(1)})`);
      }
      ok('foto do produto traz o produto no top-3 em ≥ 90%', top3 / n >= 0.9, `${((100 * top3) / n).toFixed(0)}%`);
    }
  }
}

rmSync(outDir, { recursive: true, force: true });
console.log(falhas ? `\n${falhas} falha(s)` : '\ntudo certo');
process.exitCode = falhas ? 1 : 0;
