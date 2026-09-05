// Migra os 505 itens editoriais da LOJA para a tabela `produtos`, com a
// proposta de conexão ao ERP. Roda UMA vez, depois do primeiro sync.
//
//   npm run loja:migrar            → relatório (não escreve nada)
//   npm run loja:migrar -- --write → grava produtos + erp_sku_map
//
// Lê `erp_produtos` do banco do SITE (populado pelo sync), nunca o ERP direto.
// Toda a lógica está em src/lib/shop/migracao-entry.ts; aqui só compila,
// executa e persiste.

import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WRITE = process.argv.includes('--write');

async function loadEnv(file) {
  try {
    const raw = readFileSync(join(ROOT, file), 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m || line.trim().startsWith('#')) continue;
      const v = m[2].replace(/^"(.*)"$/, '$1');
      if (!(m[1] in process.env)) process.env[m[1]] = v;
    }
  } catch {
    /* sem arquivo */
  }
}
await loadEnv('.env');
await loadEnv('.env.local');

const siteUrl = process.env.VITE_SUPABASE_URL;
const siteKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!siteUrl || !siteKey) {
  console.error('Configure VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.');
  process.exit(1);
}

// ---- compila o planejador
const outDir = mkdtempSync(join(tmpdir(), 'nz-migracao-'));
const bundle = join(outDir, 'migracao.mjs');
const build = spawnSync(
  process.execPath,
  [
    join(ROOT, 'node_modules/esbuild/bin/esbuild'),
    'src/lib/shop/migracao-entry.ts',
    '--bundle',
    '--format=esm',
    '--platform=node',
    `--outfile=${bundle}`,
    '--log-level=error',
    '--define:import.meta.env.DEV=false',
  ],
  { cwd: ROOT, encoding: 'utf8' }
);
if (build.status !== 0) {
  console.error(build.error?.message || build.stderr);
  rmSync(outDir, { recursive: true, force: true });
  process.exit(1);
}
const { planejarMigracao, LIMIAR_PUBLICA } = await import(pathToFileURL(bundle).href);
rmSync(outDir, { recursive: true, force: true });

// ---- SKUs do ERP, já espelhados no site
const site = createClient(siteUrl, siteKey);
const erp = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await site
    .from('erp_produtos')
    .select('sku, nome, marca, categoria, ativo')
    .order('sku')
    .range(from, from + 999);
  if (error) {
    console.error('[migrar] erro lendo erp_produtos:', error.message);
    console.error('O sync já rodou? (POST /api/nz/sync)');
    process.exit(1);
  }
  erp.push(...(data ?? []));
  if ((data ?? []).length < 1000) break;
}
if (!erp.length) {
  console.error('[migrar] erp_produtos está vazio — rode o sync antes.');
  process.exit(1);
}

const plano = planejarMigracao(erp);
const r = plano.resumo;

console.log(`[migrar] ${r.total} itens editoriais · ${erp.length} SKUs no espelho · limiar ${LIMIAR_PUBLICA}`);
console.log('\n=== PROPOSTAS POR VIA ===');
console.table(r.porVia);
console.log(`publicados (conexão ≥ limiar ou família): ${r.publicados}`);
console.log(`famílias (páginas de linha)              : ${r.familias}`);
console.log(`pendentes (sem conexão → NÃO publicam)   : ${r.pendentes}`);

const pendentes = plano.produtos.filter((p) => p.tipo_vinculo === 'pendente');
if (pendentes.length) {
  console.log('\nPendentes (primeiros 40):');
  console.table(pendentes.slice(0, 40).map((p) => ({ slug: p.slug, nome: p.nome, codigo: p.codigo ?? '—', fonte: p.fonte_original })));
}

const aliases = plano.produtos.filter((p) => p.tipo_vinculo === 'alias');
console.log(`\nAlias NZWRAP → SH: ${aliases.length}`);
console.table(aliases.map((p) => ({ slug: p.slug, erp_sku: p.erp_sku, de: p.alias_de_slug })));

if (r.skusDuplicados.length) {
  console.log(`\n⚠️  ${r.skusDuplicados.length} SKU(s) propostos para mais de um item (fora alias):`);
  console.table(r.skusDuplicados.slice(0, 20).map((d) => ({ erp_sku: d.erp_sku, slugs: d.slugs.join(', ') })));
}

if (!WRITE) {
  console.log('\n(relatório apenas — rode com --write para gravar)');
  process.exit(0);
}

// ---- grava. Ordem: produtos sem alias → alias (precisa do id do original)
//      → erp_sku_map → remove os 'erp-auto' que o editorial reivindicou.
const semAlias = plano.produtos.filter((p) => !p.alias_de_slug);
const comAlias = plano.produtos.filter((p) => p.alias_de_slug);

function linha(p) {
  const { alias_de_slug: _a, ...resto } = p;
  return resto;
}

for (let i = 0; i < semAlias.length; i += 200) {
  const lote = semAlias.slice(i, i + 200).map(linha);
  const { error } = await site.from('produtos').upsert(lote, { onConflict: 'slug' });
  if (error) {
    console.error('[migrar] erro gravando produtos:', error.message);
    process.exit(1);
  }
}

const { data: ids } = await site.from('produtos').select('id, slug').in('slug', comAlias.map((p) => p.alias_de_slug));
const idPorSlug = new Map((ids ?? []).map((x) => [x.slug, x.id]));
const loteAlias = comAlias.map((p) => ({ ...linha(p), alias_de: idPorSlug.get(p.alias_de_slug) ?? null }));
if (loteAlias.length) {
  const { error } = await site.from('produtos').upsert(loteAlias, { onConflict: 'slug' });
  if (error) {
    console.error('[migrar] erro gravando alias:', error.message);
    process.exit(1);
  }
}

// Fila de conferência. Não sobrescreve o que uma pessoa já conferiu.
const { data: existentes } = await site.from('erp_sku_map').select('shop_slug, origem');
const manuais = new Set((existentes ?? []).filter((x) => x.origem === 'manual').map((x) => x.shop_slug));
const mapa = plano.propostas
  .filter((p) => !manuais.has(p.shop_slug))
  .map((p) => ({ shop_slug: p.shop_slug, erp_sku: p.erp_sku, origem: 'auto', via: p.via, confianca: p.confianca }));
for (let i = 0; i < mapa.length; i += 200) {
  const { error } = await site.from('erp_sku_map').upsert(mapa.slice(i, i + 200), { onConflict: 'shop_slug' });
  if (error) {
    console.error('[migrar] erro gravando erp_sku_map:', error.message);
    process.exit(1);
  }
}

// O sync pode ter criado um produto 'erp-auto' para um SKU que agora tem
// item editorial — o editorial vence, o automático some.
const skus = [...new Set(plano.produtos.filter((p) => p.erp_sku && p.tipo_vinculo === 'proprio').map((p) => p.erp_sku))];
let removidos = 0;
for (let i = 0; i < skus.length; i += 200) {
  const { data, error } = await site
    .from('produtos')
    .delete()
    .eq('origem', 'erp-auto')
    .in('erp_sku', skus.slice(i, i + 200))
    .select('slug');
  if (error) {
    console.error('[migrar] erro removendo erp-auto:', error.message);
    process.exit(1);
  }
  removidos += (data ?? []).length;
}

console.log(`\n[migrar] ${plano.produtos.length} produtos gravados · ${mapa.length} propostas na fila · ${removidos} 'erp-auto' substituídos pelo editorial.`);
console.log('Confira a fila em /admin → Integração ERP.');
