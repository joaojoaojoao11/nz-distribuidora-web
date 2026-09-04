// Propõe o mapeamento entre os itens da LOJA e os SKUs do NZERP.
//
// Este é o gargalo real da integração de estoque. O site identifica produto por
// slug ('etherna-madeira-carvalho-areia') ou código de mostruário ('M7-108',
// 'IT 403', 'NZW201'); o ERP usa master_catalog.sku em uppercase, com histórico
// de importação do Tiny/Olist. Não há garantia de que batem — e sem o mapa não
// há o que sincronizar.
//
// O script NÃO decide sozinho: grava as propostas em erp_sku_map com
// origem='auto' e uma confiança, e a aba Integração ERP do painel mostra a fila
// para conferência humana. Só o que uma pessoa conferir vira origem='manual'.
//
// Uso:
//   node scripts/propose-sku-map.mjs            # só relatório, não grava
//   node scripts/propose-sku-map.mjs --write    # grava as propostas

import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFile, rmSync } from 'node:fs';
import { readFile as read } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WRITE = process.argv.includes('--write');

async function loadEnv(file) {
  let text;
  try {
    text = await read(join(ROOT, file), 'utf8');
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

const siteUrl = process.env.VITE_SUPABASE_URL;
const siteKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const erpUrl = process.env.ERP_SUPABASE_URL;
const erpKey = process.env.ERP_SUPABASE_SERVICE_ROLE_KEY || process.env.ERP_SUPABASE_ANON_KEY;

if (!erpUrl || !erpKey) {
  console.error('[sku-map] ENV do ERP ausente.', {
    hasErpUrl: !!erpUrl,
    hasErpKey: !!erpKey,
  });
  console.error('Configure ERP_SUPABASE_URL e ERP_SUPABASE_SERVICE_ROLE_KEY no .env.');
  process.exit(1);
}

// ---- catálogo do site, compilado da camada TS
const outDir = mkdtempSync(join(tmpdir(), 'nz-sku-map-'));
const bundle = join(outDir, 'catalog.mjs');
const build = spawnSync(
  process.execPath,
  [
    join(ROOT, 'node_modules/esbuild/bin/esbuild'),
    'src/lib/shop/catalog.ts',
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
const { SHOP_ITEMS } = await import(pathToFileURL(bundle).href);
rmSync(outDir, { recursive: true, force: true });

// ---- catálogo do ERP
const erp = createClient(erpUrl, erpKey);
const { data: erpRows, error } = await erp
  .from('catalogo_site')
  .select('sku, nome, marca, categoria');

if (error) {
  console.error('[sku-map] erro lendo catalogo_site no ERP:', error.message);
  console.error('A view já foi criada? Ver migrations/erp/2026-09-03_views_site.sql');
  process.exit(1);
}

console.log(`[sku-map] ${SHOP_ITEMS.length} itens no site · ${erpRows.length} SKUs ativos no ERP`);

// ---- normalização e matching
const norm = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

const erpBySku = new Map();
const erpByNome = new Map();
for (const row of erpRows) {
  erpBySku.set(norm(row.sku), row);
  const n = norm(row.nome);
  if (!erpByNome.has(n)) erpByNome.set(n, row);
}

/**
 * Estratégias em ordem de confiança. A primeira que casar vence — daí a ordem
 * importar: código exato é muito mais confiável do que nome parecido.
 */
function propor(item) {
  const code = item.code ? norm(item.code) : '';
  const nome = norm(item.name);

  // 1. Código do mostruário = SKU do ERP. 'M7-108' ↔ 'M7108'.
  if (code && erpBySku.has(code)) {
    return { sku: erpBySku.get(code).sku, confianca: 0.98, via: 'codigo-exato' };
  }

  // 2. Nome idêntico, ignorando acento, caixa e pontuação.
  if (erpByNome.has(nome)) {
    return { sku: erpByNome.get(nome).sku, confianca: 0.85, via: 'nome-exato' };
  }

  // 3. Código contido no SKU do ERP (prefixo de linha somado ao código).
  if (code.length >= 3) {
    for (const [sku, row] of erpBySku) {
      if (sku.endsWith(code) || sku.startsWith(code)) {
        return { sku: row.sku, confianca: 0.7, via: 'codigo-parcial' };
      }
    }
  }

  // 4. Nome do site contido no nome do ERP, ou o contrário. Só com nomes
  //    razoavelmente longos — abaixo disso gera falso positivo demais.
  if (nome.length >= 8) {
    for (const [n, row] of erpByNome) {
      if (n.includes(nome) || nome.includes(n)) {
        return { sku: row.sku, confianca: 0.5, via: 'nome-parcial' };
      }
    }
  }

  return null;
}

const propostas = [];
const semMatch = [];
for (const item of SHOP_ITEMS) {
  // Linhas técnicas (Avery, NZPPF) não são SKU vendável — não entram no mapa.
  if (item.kind === 'linha') continue;
  const p = propor(item);
  if (p) propostas.push({ shop_slug: item.slug, erp_sku: p.sku, confianca: p.confianca, via: p.via, nome: item.name });
  else semMatch.push(item);
}

const porVia = {};
for (const p of propostas) porVia[p.via] = (porVia[p.via] ?? 0) + 1;

console.log('\n=== PROPOSTAS ===');
console.table(porVia);
console.log(`total propostas : ${propostas.length}`);
console.log(`sem match       : ${semMatch.length}`);
console.log(
  `cobertura       : ${((propostas.length / (propostas.length + semMatch.length)) * 100).toFixed(1)}%`
);

if (semMatch.length) {
  console.log('\nSem correspondência no ERP (primeiros 20):');
  console.table(
    semMatch.slice(0, 20).map((i) => ({ slug: i.slug, nome: i.name, code: i.code ?? '—' }))
  );
}

// Um SKU do ERP casado com vários itens do site é quase sempre erro do
// matching — vale olhar antes de aceitar.
const porSku = {};
for (const p of propostas) (porSku[p.erp_sku] ??= []).push(p.shop_slug);
const duplicados = Object.entries(porSku).filter(([, list]) => list.length > 1);
if (duplicados.length) {
  console.log(`\n⚠️  ${duplicados.length} SKU(s) do ERP propostos para mais de um item do site:`);
  console.table(
    duplicados.slice(0, 15).map(([sku, list]) => ({ erp_sku: sku, itens: list.join(', ') }))
  );
}

if (!WRITE) {
  console.log('\n(relatório apenas — rode com --write para gravar em erp_sku_map)');
  process.exit(0);
}

if (!siteUrl || !siteKey) {
  console.error('[sku-map] ENV do site ausente para gravar.', {
    hasSiteUrl: !!siteUrl,
    hasSiteKey: !!siteKey,
  });
  process.exit(1);
}

const site = createClient(siteUrl, siteKey);

// Não sobrescreve o que já foi conferido por uma pessoa.
const { data: existentes } = await site
  .from('erp_sku_map')
  .select('shop_slug, origem');
const manuais = new Set(
  (existentes ?? []).filter((r) => r.origem === 'manual').map((r) => r.shop_slug)
);

const paraGravar = propostas
  .filter((p) => !manuais.has(p.shop_slug))
  .map((p) => ({
    shop_slug: p.shop_slug,
    erp_sku: p.erp_sku,
    origem: 'auto',
    confianca: p.confianca,
  }));

const { error: upsertErr } = await site
  .from('erp_sku_map')
  .upsert(paraGravar, { onConflict: 'shop_slug' });

if (upsertErr) {
  console.error('[sku-map] erro ao gravar:', upsertErr.message);
  process.exit(1);
}

console.log(
  `\n[sku-map] ${paraGravar.length} propostas gravadas (${manuais.size} conferidas manualmente foram preservadas).`
);
console.log('Confira a fila em /admin → Integração ERP antes de ligar o sync.');
