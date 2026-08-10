// Gera api/_lib/nzwrapColorMeta.ts a partir de src/lib/data/nzwrapColors.ts.
// Rodar sempre que o catálogo NZWRAP hardcoded mudar: node scripts/gen-color-meta.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'src/lib/data/nzwrapColors.ts'), 'utf8');

const entries = [];
const re = /sku:\s*'([^']+)',\s*\n\s*name:\s*'([^']+)',\s*\n\s*finish:\s*'([^']+)',\s*\n\s*hex:\s*'([^']+)'/g;
let m;
while ((m = re.exec(src)) !== null) {
  entries.push({ sku: m[1], name: m[2], finish: m[3], hex: m[4] });
}
if (entries.length === 0) throw new Error('Nenhuma cor NZWRAP encontrada — o formato de nzwrapColors.ts mudou?');

const lines = entries.map(
  (e) => `  '${e.sku.toLowerCase()}': { name: ${JSON.stringify(e.name)}, finish: ${JSON.stringify(e.finish)}, hex: '${e.hex}' },`
);

const out = `// GERADO por scripts/gen-color-meta.mjs a partir de src/lib/data/nzwrapColors.ts — não editar à mão.
export const nzwrapColorMeta: Record<string, { name: string; finish: string; hex: string }> = {
${lines.join('\n')}
};
`;
writeFileSync(join(root, 'api/_lib/nzwrapColorMeta.ts'), out);
console.log(`OK: ${entries.length} cores NZWRAP -> api/_lib/nzwrapColorMeta.ts`);
