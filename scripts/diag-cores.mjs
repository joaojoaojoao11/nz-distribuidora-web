// Diagnóstico da classificação de cor da LOJA.
//
// Responde à pergunta "por que buscar 'vermelho' traz um item rosa?" medindo,
// para cada família, quantos itens entram só pela família SECUNDÁRIA e quais
// deles são erro de classificação (o nome do produto diz outra cor).
//
// Uso: npm run shop:cores
//
// O exit code é o número de problemas — serve como régua entre commits, não
// como gate de CI (para isso existe o npm run shop:audit).

import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = mkdtempSync(join(tmpdir(), 'nz-shop-cores-'));
const outFile = join(outDir, 'cores.mjs');

// Roda o entry JS do esbuild com o próprio node, em vez do wrapper .bin: no
// Windows o wrapper é um .cmd, que o Node recente recusa a lançar sem shell —
// e usar shell reintroduz o aviso DEP0190.
const esbuildBin = join(ROOT, 'node_modules/esbuild/bin/esbuild');

const build = spawnSync(
  process.execPath,
  [
    esbuildBin,
    'src/lib/shop/diag-cores.ts',
    '--bundle',
    '--format=esm',
    '--platform=node',
    `--outfile=${outFile}`,
    '--log-level=error',
    // import.meta.env.DEV não existe fora do Vite.
    '--define:import.meta.env.DEV=false',
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
  mod.runColorDiag();
} finally {
  rmSync(outDir, { recursive: true, force: true });
}
