// Auditoria da camada unificada da LOJA.
//
// Compila src/lib/shop/audit-entry.ts com esbuild e roda no node, porque o
// projeto não tem runner de teste e a camada é TS puro. Reporta:
//   - contagem por fonte, vertical e tipo
//   - itens de cor que ficaram SEM família (o que a busca não vai achar)
//   - itens de cor sem acabamento
//   - distribuição por família de cor
//   - os 3 casos do requisito: "azul", "azul fosco", "azul acetinado"
//
// Uso: npm run shop:audit

import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = mkdtempSync(join(tmpdir(), 'nz-shop-audit-'));
const outFile = join(outDir, 'audit.mjs');

// Roda o entry JS do esbuild com o próprio node, em vez do wrapper .bin: no
// Windows o wrapper é um .cmd, que o Node recente recusa a lançar sem shell —
// e usar shell reintroduz o aviso DEP0190.
const esbuildBin = join(ROOT, 'node_modules/esbuild/bin/esbuild');

const build = spawnSync(
  process.execPath,
  [
    esbuildBin,
    'src/lib/shop/audit-entry.ts',
    '--bundle',
    '--format=esm',
    '--platform=node',
    `--outfile=${outFile}`,
    '--log-level=error',
    // import.meta.env.DEV não existe fora do Vite.
    '--define:import.meta.env.DEV=true',
  ],
  { cwd: ROOT, encoding: 'utf8' }
);

if (build.status !== 0) {
  console.error(build.error?.message || build.stderr || build.stdout || 'esbuild falhou sem saída');
  rmSync(outDir, { recursive: true, force: true });
  process.exit(1);
}

try {
  const mod = await import(pathToFileURL(outFile).href);
  const failures = mod.runAudit();
  process.exitCode = failures > 0 ? 1 : 0;
} finally {
  rmSync(outDir, { recursive: true, force: true });
}
