// Autoteste do histórico do cliente no NZERP — sem rede, sem banco.
//
// `api/_lib/conta/erpHistorico.ts` é o único módulo que lê orçamentos, notas e
// títulos em nome de um cliente. O que não pode quebrar em silêncio:
//   · as listas brancas de colunas continuam sendo listas (sem `*`) e sem as
//     colunas que nunca podem sair do ERP (vendedor, notas internas, custo,
//     limite de crédito, cobrança/cartório/cessão);
//   · a régua do que o cliente vê (STATUS_VISIVEIS) não inclui orçamento em
//     aberto nem recusado — isso é negociação do vendedor.
//
// Uso: node scripts/test-erp-historico.mjs
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(join(ROOT, 'node_modules/.cache'), { recursive: true });
const outDir = mkdtempSync(join(ROOT, 'node_modules/.cache/nz-historico-'));
const build = spawnSync(process.execPath, [join(ROOT, 'node_modules/esbuild/bin/esbuild'), 'api/_lib/conta/erpHistorico.ts', '--bundle', '--platform=node', '--format=esm', '--packages=external', `--outfile=${join(outDir, 'erpHistorico.js')}`, '--log-level=error'], { cwd: ROOT, encoding: 'utf8' });
if (build.status !== 0) {
  console.error(build.stderr || build.stdout || 'esbuild falhou');
  rmSync(outDir, { recursive: true, force: true });
  process.exit(1);
}
const m = await import(pathToFileURL(join(outDir, 'erpHistorico.js')).href);

let falhas = 0;
const ok = (nome, cond, extra = '') => {
  console.log(`${cond ? '  OK  ' : ' FALHA'} ${nome}${extra ? ' — ' + extra : ''}`);
  if (!cond) falhas++;
};

const PROIBIDAS = /salesperson|vendedor|notes|observac|custo|margem|limite|lista_de_preco|cartorio|cessao|cession|remessa|encargo|status_cobranca|historico|deleted_by|deleted_reason/i;
for (const nome of ['COLUNAS_QUOTE', 'COLUNAS_FATURAMENTO', 'COLUNAS_TITULO', 'COLUNAS_CLIENTE']) {
  const v = m[nome];
  ok(`${nome} é lista de colunas, sem *`, typeof v === 'string' && v.length > 0 && !v.includes('*'));
  const ruins = v.split(',').map((c) => c.trim()).filter((c) => PROIBIDAS.test(c));
  ok(`${nome} não tem coluna proibida`, ruins.length === 0, ruins.join(', '));
}
ok('STATUS_VISIVEIS: entregue, enviado, faturado, aprovado entram', ['ENTREGUE', 'ENVIADO', 'FATURADO', 'APROVADO'].every((s) => m.STATUS_VISIVEIS.includes(s)));
ok('STATUS_VISIVEIS: aberto, aguardando, não aprovado e rascunho NÃO entram', ['ABERTO', 'AGUARDANDO', 'NAO_APROVADO', 'RASCUNHO', 'SOLICITADO', 'DADOS_INCOMPLETOS'].every((s) => !m.STATUS_VISIVEIS.includes(s)));
ok('cancelado só nos últimos 90 dias', m.DIAS_CANCELADO_VISIVEL === 90);

rmSync(outDir, { recursive: true, force: true });
console.log(falhas ? `\n${falhas} falha(s).` : '\nTudo certo.');
process.exit(falhas ? 1 : 0);
