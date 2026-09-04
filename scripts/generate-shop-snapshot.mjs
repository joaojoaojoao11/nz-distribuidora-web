// Exporta as cores de web_catalog_products para um .ts estático, no mesmo
// padrão de scripts/generate-etherna.mjs e generate-sh-decor.mjs.
//
// Por que snapshot e não fetch em runtime: a LOJA filtra e ordena ~480 itens no
// cliente e precisa que isso seja instantâneo, sem skeleton. O catálogo
// editorial muda devagar (uma cor nova por vez), então um arquivo regenerado no
// build é a troca certa. O ESTOQUE, que é volátil, não vem por aqui — vem em
// runtime do espelho do NZERP.
//
// IMPORTANTE — whitelist de marca: NZWRAP e SH Wrapping também existem em
// arquivos .ts estáticos, com imagens que o banco não tem (insert_nzwrap.sql
// inseriu as 30 cores NZWRAP no banco). Um `select *` duplicaria esses itens na
// loja. Só as 3 marcas abaixo saem do banco.
//
// Uso: npm run shop:snapshot

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// Parser mínimo de .env — o projeto não tem dotenv, e não vale adicionar uma
// dependência de runtime por causa de um script de build.
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

const OUT_FILE = join(ROOT, 'src/lib/shop/generated/dbSnapshot.ts');

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('[shop-snapshot] ENV ausente.', {
    hasUrl: !!url,
    hasKey: !!key,
  });
  process.exit(1);
}

/**
 * Marcas que a LOJA consome DO BANCO. O valor é o da coluna `brand`, que nem
 * sempre casa com a rota: brand 'Oracal 670' ↔ rota '/wrap/oracal-670ra'.
 * Nunca derivar rota a partir de brand.
 */
const BRANDS = {
  'Oracal 651': { source: 'oracal-651', line: 'Oracal 651', routePrefix: '/wrap/oracal-651' },
  'Oracal 670': { source: 'oracal-670', line: 'Oracal 670RA', routePrefix: '/wrap/oracal-670ra' },
  'SH Wrapping': { source: 'sh-wrapping', line: 'SH Wrapping', routePrefix: '/wrap/sh-colors' },
};

const supabase = createClient(url, key);

// PostgREST ignora .limit() acima de 1000; paginar é obrigatório mesmo com ~160
// linhas hoje, porque o catálogo cresce.
async function fetchAllRows() {
  const PAGE = 1000;
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('web_catalog_products')
      .select(
        'id, brand, slug, sku, name, technical_name, finish_type, hex_code, technical_description, garantia_anos, durabilidade_anos'
      )
      .in('brand', Object.keys(BRANDS))
      .eq('is_active', true)
      .order('brand', { ascending: true })
      .order('sku', { ascending: true, nullsFirst: false })
      .range(from, from + PAGE - 1);

    if (error) {
      console.error('[shop-snapshot] erro na query:', error.message);
      process.exit(1);
    }
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

const rows = await fetchAllRows();

if (!rows.length) {
  console.error(
    '[shop-snapshot] nenhuma linha retornada. Abortando para não sobrescrever o snapshot com um arquivo vazio.'
  );
  process.exit(1);
}

const byBrand = {};
for (const row of rows) byBrand[row.brand] = (byBrand[row.brand] ?? 0) + 1;

const serialize = (v) => (v === null || v === undefined ? 'null' : JSON.stringify(v));

const body = rows
  .map((r) => {
    const cfg = BRANDS[r.brand];
    return `  { source: ${JSON.stringify(cfg.source)}, slug: ${JSON.stringify(r.slug)}, sku: ${serialize(
      r.sku
    )}, name: ${JSON.stringify(r.name)}, technicalName: ${serialize(
      r.technical_name
    )}, finishType: ${serialize(r.finish_type)}, hex: ${serialize(
      r.hex_code
    )}, description: ${serialize(r.technical_description)}, garantiaAnos: ${serialize(
      r.garantia_anos
    )}, durabilidadeAnos: ${serialize(r.durabilidade_anos)} },`;
  })
  .join('\n');

await writeFile(
  OUT_FILE,
  `// GERADO por scripts/generate-shop-snapshot.mjs — não editar à mão.
// Fonte: web_catalog_products (projeto uibjmvkvbthzypgozpcs), marcas
// ${Object.keys(BRANDS).join(', ')}, apenas is_active = true.
//
// NZWRAP e as cores com imagem NÃO vêm daqui: elas vivem em src/lib/data/*.ts.
// Regerar: npm run shop:snapshot
//
// Gerado em ${new Date().toISOString().slice(0, 10)} · ${rows.length} cores.

export type DbSnapshotSource = 'oracal-651' | 'oracal-670' | 'sh-wrapping';

export interface DbSnapshotRow {
  source: DbSnapshotSource;
  slug: string;
  sku: string | null;
  name: string;
  technicalName: string | null;
  finishType: string | null;
  hex: string | null;
  description: string | null;
  garantiaAnos: number | null;
  durabilidadeAnos: number | null;
}

export const DB_SNAPSHOT: DbSnapshotRow[] = [
${body}
];
`,
  'utf8'
);

console.log(`[shop-snapshot] ${rows.length} cores → ${OUT_FILE}`);
console.table(byBrand);
