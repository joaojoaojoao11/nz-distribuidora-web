// Mede o modelo de visão da Lente antes de ligar a flag: precisão de família e
// de acabamento, latência e custo, por modelo, sobre fotos do próprio catálogo
// (gabarito = família pelo hex publicado, acabamento pelo cadastro).
//
// Chama a API da Anthropic DIRETO (não passa pelo endpoint nem pela flag), com
// exatamente o prompt e o schema do handler (api/_lib/lenteTaxonomia.ts).
// Custa centavos: N fotos × modelos. Precisa de ANTHROPIC_API_KEY no .env.
//
// Uso:
//   npm run lente:ia:test
//   npm run lente:ia:test -- --n 10 --modelos claude-opus-5-5,claude-sonnet-5-5,claude-haiku-5-5

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const N = (() => {
  const i = args.indexOf('--n');
  return i >= 0 ? Number(args[i + 1]) || 10 : 10;
})();
const MODELOS = (() => {
  const i = args.indexOf('--modelos');
  return (i >= 0 ? args[i + 1] : 'claude-opus-5-5,claude-sonnet-5-5,claude-haiku-5-5').split(',').map((s) => s.trim()).filter(Boolean);
})();
/**
 * US$ por milhão de tokens (entrada, saída, leitura de cache), tabela de
 * 2026-10. `input_tokens` da resposta NÃO inclui o que veio do cache; os dois
 * somam separados.
 */
const PRECO = {
  'claude-opus-5-5': [4, 20, 0.2],
  'claude-sonnet-5-5': [2, 10, 0.2],
  'claude-haiku-5-5': [0.1, 0.5, 0.01],
};

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

const apiKey = process.env.ANTHROPIC_API_KEY;
const supaUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supaKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
if (!apiKey || !supaUrl || !supaKey) {
  console.error('[lente-ia] precisa de ANTHROPIC_API_KEY, VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env');
  process.exit(1);
}

// Taxonomia e bucketing compilados do código — o mesmo que o handler usa.
mkdirSync(join(ROOT, 'node_modules/.cache'), { recursive: true });
const outDir = mkdtempSync(join(ROOT, 'node_modules/.cache/nz-lente-ia-'));
const build = spawnSync(
  process.execPath,
  [
    join(ROOT, 'node_modules/esbuild/bin/esbuild'),
    'api/_lib/lenteTaxonomia.ts',
    'src/lib/shop/color/hsl.ts',
    '--bundle',
    `--outdir=${outDir}`,
    '--outbase=.',
    '--format=esm',
    '--platform=node',
    '--log-level=error',
  ],
  { cwd: ROOT, encoding: 'utf8' }
);
if (build.status !== 0) {
  console.error(build.stderr || build.stdout);
  process.exit(1);
}
const { SCHEMA_LEITURA, SISTEMA } = await import(pathToFileURL(join(outDir, 'api/_lib/lenteTaxonomia.js')).href);
const { bucketFromHex } = await import(pathToFileURL(join(outDir, 'src/lib/shop/color/hsl.js')).href);

// Gabarito: cores com hex publicado + acabamento cadastrado, e alguns padrões.
const res = await fetch(
  `${supaUrl}/rest/v1/loja_catalogo?select=slug,nome,kind,imagem,hex,acabamentos,familia_padrao,transparente&imagem=not.is.null&limit=3000`,
  { headers: { apikey: supaKey, Authorization: `Bearer ${supaKey}` } }
);
if (!res.ok) {
  console.error('[lente-ia] catálogo:', res.status);
  process.exit(1);
}
const rows = (await res.json()).filter((r) => r.imagem?.startsWith('/assets/') && existsSync(join(ROOT, 'public', decodeURIComponent(r.imagem))));
const cores = rows.filter((r) => r.kind === 'cor' && r.hex && !r.transparente && (r.acabamentos ?? []).length).sort((a, b) => a.slug.localeCompare(b.slug));
const padroes = rows.filter((r) => r.kind === 'padrao' && r.familia_padrao).sort((a, b) => a.slug.localeCompare(b.slug));
const nCores = Math.max(1, Math.round(N * 0.8));
const nPadroes = Math.max(0, N - nCores);
const pick = (lista, n) => {
  const passo = Math.max(1, Math.floor(lista.length / Math.max(1, n)));
  return lista.filter((_, i) => i % passo === 0).slice(0, n);
};
const amostra = [...pick(cores, nCores), ...pick(padroes, nPadroes)];
console.log(`[lente-ia] ${amostra.length} fotos (${nCores} cores + ${nPadroes} padrões) × ${MODELOS.length} modelo(s)`);

// Mesma redução que o navegador faz: ≤ 768 px, JPEG.
const imagens = [];
for (const r of amostra) {
  const buf = await sharp(join(ROOT, 'public', decodeURIComponent(r.imagem)))
    .rotate()
    .resize(768, 768, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
  imagens.push({ r, base64: buf.toString('base64') });
}

const client = new Anthropic({ apiKey, timeout: 60_000, maxRetries: 1 });

for (const modelo of MODELOS) {
  console.log(`\n=== ${modelo}`);
  let famOk = 0;
  let famTotal = 0;
  let acabOk = 0;
  let acabTotal = 0;
  let padOk = 0;
  let padTotal = 0;
  let tokIn = 0;
  let tokOut = 0;
  let tokCache = 0;
  let ms = 0;
  let falhas = 0;

  for (const { r, base64 } of imagens) {
    const t0 = Date.now();
    let leitura = null;
    try {
      const resp = await client.messages.create({
        model: modelo,
        max_tokens: 600,
        system: [{ type: 'text', text: SISTEMA, cache_control: { type: 'ephemeral' } }],
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
              { type: 'text', text: 'Classifique este material.' },
            ],
          },
        ],
        output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA_LEITURA } },
      });
      ms += Date.now() - t0;
      tokIn += resp.usage.input_tokens;
      tokOut += resp.usage.output_tokens;
      tokCache += resp.usage.cache_read_input_tokens ?? 0;
      const texto = resp.content.find((b) => b.type === 'text')?.text ?? '';
      leitura = JSON.parse(texto);
    } catch (e) {
      falhas++;
      console.log(`   ERRO ${r.slug}: ${e?.status ?? ''} ${e?.message ?? e}`);
      continue;
    }

    const linha = [];
    if (r.kind === 'cor') {
      const esperada = bucketFromHex(r.hex)?.family ?? null;
      if (esperada) {
        famTotal++;
        const acertou = (leitura.familias ?? []).includes(esperada);
        if (acertou) famOk++;
        linha.push(`família ${acertou ? 'ok' : 'X'} (esp. ${esperada}, leu ${(leitura.familias ?? []).join('/') || '—'})`);
      }
      const esperados = r.acabamentos ?? [];
      if (esperados.length) {
        acabTotal++;
        const acertou = esperados.some((a) => (leitura.acabamentos ?? []).includes(a));
        if (acertou) acabOk++;
        linha.push(`acab. ${acertou ? 'ok' : 'X'} (esp. ${esperados.join('/')}, leu ${(leitura.acabamentos ?? []).join('/') || '—'})`);
      }
    } else {
      padTotal++;
      const acertou = leitura.familia_padrao === r.familia_padrao;
      if (acertou) padOk++;
      linha.push(`padrão ${acertou ? 'ok' : 'X'} (esp. ${r.familia_padrao}, leu ${leitura.familia_padrao ?? '—'})`);
    }
    console.log(`   ${r.slug}: ${linha.join(' · ')} · "${leitura.descricao_curta ?? ''}" · ${leitura.confianca ?? ''}`);
  }

  const n = imagens.length - falhas || 1;
  const [pin, pout, pcache] = PRECO[modelo] ?? [null, null, null];
  const custo = pin === null ? null : (tokIn * pin + tokCache * pcache + tokOut * pout) / 1e6;
  console.log(
    `   família ${famTotal ? ((100 * famOk) / famTotal).toFixed(0) + '%' : '—'} (${famOk}/${famTotal}) · acabamento ${
      acabTotal ? ((100 * acabOk) / acabTotal).toFixed(0) + '%' : '—'
    } (${acabOk}/${acabTotal}) · padrão ${padTotal ? ((100 * padOk) / padTotal).toFixed(0) + '%' : '—'} (${padOk}/${padTotal})`
  );
  console.log(
    `   latência média ${(ms / n / 1000).toFixed(1)} s · tokens in ${tokIn} (cache ${tokCache}) out ${tokOut} · custo da rodada ${
      custo === null ? '?' : 'US$ ' + custo.toFixed(4)
    } ≈ US$ ${custo === null ? '?' : (custo / n).toFixed(4)} por foto · falhas ${falhas}`
  );
}

rmSync(outDir, { recursive: true, force: true });
