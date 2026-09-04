// Gera api/_lib/shopItems.ts — o espelho enxuto do catálogo para o edge.
//
// Por que existe: api/render.ts roda em Edge runtime e serve o HTML que os
// crawlers sem JS enxergam. Ele não pode importar src/lib/shop (que puxa React,
// 240 KB de dados de padrão e o client do Supabase). Este arquivo carrega só o
// que o edge precisa: slug, título, descrição e se a URL é auto-canônica.
//
// Auto-canônico: os 129 itens M7 + MCX, que hoje NÃO têm página própria (só
// existem como ?cor=<slug> dentro do catálogo). Para eles a /loja/:slug é a
// entidade indexável, e são os únicos que entram no sitemap.
//
// Uso: npm run shop:index

import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_FILE = join(ROOT, 'api/_lib/shopItems.ts');

const outDir = mkdtempSync(join(tmpdir(), 'nz-shop-index-'));
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
  console.error(build.error?.message || build.stderr || 'esbuild falhou');
  rmSync(outDir, { recursive: true, force: true });
  process.exit(1);
}

const { SHOP_ITEMS } = await import(pathToFileURL(bundle).href);
rmSync(outDir, { recursive: true, force: true });

/** Fontes cujos itens NÃO têm página de detalhe fora da loja. */
const SELF_CANONICAL = new Set(['m7', 'mcx']);

function title(item) {
  const codigo = item.code ? ` · ${item.code}` : '';
  return `${item.name}${codigo} — ${item.line ?? item.brand}`;
}

function description(item) {
  if (item.description) {
    const first = item.description.split(/(?<=[.!?])\s/)[0];
    return first.length > 155 ? `${first.slice(0, 152)}...` : first;
  }
  const codigo = item.code ? ` (${item.code})` : '';
  const acabamento = item.finishLabel ? `, acabamento ${item.finishLabel.toLowerCase()}` : '';
  return `${item.name}${codigo} — ${item.line ?? item.brand}${acabamento}. Distribuição e consultoria técnica NZ Group. Valores sob consulta.`;
}

const rows = SHOP_ITEMS.map((item) => ({
  slug: item.slug,
  name: item.name,
  brand: item.brand,
  vertical: item.vertical,
  title: title(item),
  description: description(item),
  image: item.image,
  selfCanonical: SELF_CANONICAL.has(item.source),
  legacyPath: item.legacyPath,
}));

const body = rows
  .map(
    (r) =>
      `  { slug: ${JSON.stringify(r.slug)}, name: ${JSON.stringify(r.name)}, brand: ${JSON.stringify(
        r.brand
      )}, vertical: ${JSON.stringify(r.vertical)}, title: ${JSON.stringify(
        r.title
      )}, description: ${JSON.stringify(r.description)}, image: ${JSON.stringify(
        r.image
      )}, selfCanonical: ${r.selfCanonical}, legacyPath: ${JSON.stringify(r.legacyPath)} },`
  )
  .join('\n');

const selfCount = rows.filter((r) => r.selfCanonical).length;

writeFileSync(
  OUT_FILE,
  `// GERADO por scripts/generate-shop-index.mjs — não editar à mão.
// Espelho enxuto de src/lib/shop para o Edge runtime (api/render.ts e
// api/sitemap.ts), que não pode importar o catálogo completo do app.
//
// \`selfCanonical\` marca os itens sem página de detalhe fora da LOJA — as ${selfCount}
// cores Metamark 7 Series e MetaCast MCX, que hoje só existem como ?cor=<slug>.
// São os únicos que entram no sitemap por conta própria.
//
// Regerar: npm run shop:index
// Gerado em ${new Date().toISOString().slice(0, 10)} · ${rows.length} itens.

export interface ShopIndexItem {
  slug: string;
  name: string;
  brand: string;
  vertical: string;
  title: string;
  description: string;
  image: string | null;
  selfCanonical: boolean;
  legacyPath: string | null;
}

export const shopItems: ShopIndexItem[] = [
${body}
];

const bySlug = new Map<string, ShopIndexItem>(shopItems.map((i) => [i.slug, i]));

export function getShopIndexItem(slug: string): ShopIndexItem | undefined {
  return bySlug.get(slug.toLowerCase());
}

/** Slugs que devem entrar no sitemap como URL própria. */
export const shopSelfCanonicalSlugs: string[] = shopItems
  .filter((i) => i.selfCanonical)
  .map((i) => i.slug);
`,
  'utf8'
);

console.log(
  `[shop-index] ${rows.length} itens → api/_lib/shopItems.ts (${selfCount} auto-canônicos)`
);
