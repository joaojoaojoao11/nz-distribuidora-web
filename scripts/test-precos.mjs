// Autoteste do preço por tipo de acesso — sem rede, sem banco.
//
// A regra (api/_lib/precos/regraAcesso.ts) é a mesma da vitrine, do checkout
// e da promoção pública. Se ela mudar, muda aqui primeiro.
//
// Uso: npm run precos:test

import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(join(ROOT, 'node_modules/.cache'), { recursive: true });
const outDir = mkdtempSync(join(ROOT, 'node_modules/.cache/nz-precos-'));

const build = spawnSync(
  process.execPath,
  [join(ROOT, 'node_modules/esbuild/bin/esbuild'), 'api/_lib/precos/regraAcesso.ts', 'api/_lib/pedido/dinheiro.ts', `--outdir=${outDir}`, '--outbase=api/_lib', '--format=esm', '--platform=node', '--log-level=error'],
  { cwd: ROOT, encoding: 'utf8' }
);
if (build.status !== 0) {
  console.error(build.error?.message || build.stderr || build.stdout || 'esbuild falhou');
  rmSync(outDir, { recursive: true, force: true });
  process.exit(1);
}

const { montarRegras, regrasPadrao, regraPara, precoParaAcesso, precosPorTipo, papelDePreco, carregarRegras } = await import(pathToFileURL(join(outDir, 'precos/regraAcesso.js')).href);

let falhas = 0;
const ok = (nome, cond, extra = '') => {
  console.log(`${cond ? '  OK  ' : ' FALHA'} ${nome}${extra ? ' — ' + extra : ''}`);
  if (!cond) falhas++;
};

const base = { atacado: 3000, varejo: 4000 };

console.log('\n=== PADRÃO (nada gravado) ===');
{
  const r = regrasPadrao();
  ok('revendedor: atacado, 0%', precoParaAcesso(r, 'reseller', base, 'ppf') === 3000);
  ok('lojista: atacado, 0%', precoParaAcesso(r, 'lojista', base, 'ppf') === 3000);
  ok('cliente final: VAREJO publicado, 0%', precoParaAcesso(r, 'client', base, 'ppf') === 4000);
  ok('cliente final sem varejo no ERP cai no atacado', precoParaAcesso(r, 'client', { atacado: 3000, varejo: null }, 'ppf') === 3000);
  ok('anônimo e desconhecido viram cliente final', papelDePreco('anonimo') === 'client' && papelDePreco(undefined) === 'client' && papelDePreco('lojista') === 'lojista');
}

console.log('\n=== GERAL + POR LINHA ===');
{
  const r = montarRegras([
    { papel: 'reseller', linha_key: null, base: 'atacado', percentual: 0 },
    { papel: 'lojista', linha_key: null, base: 'atacado', percentual: 10 },
    { papel: 'client', linha_key: null, base: 'atacado', percentual: 35 },
    { papel: 'client', linha_key: 'ppf', base: 'atacado', percentual: 40 },
    { papel: 'lojista', linha_key: 'ppf', base: 'varejo', percentual: 5 },
  ]);
  ok('lojista geral 10% sobre o atacado', precoParaAcesso(r, 'lojista', base, 'avery') === 3300);
  ok('cliente final geral 35% sobre o atacado', precoParaAcesso(r, 'client', base, 'avery') === 4050);
  ok('linha ppf: cliente final usa 40%, não 35%', precoParaAcesso(r, 'client', base, 'ppf') === 4200);
  ok('linha ppf: lojista usa 5%, e a BASE continua a do tipo (atacado), não a da linha', precoParaAcesso(r, 'lojista', base, 'ppf') === 3150);
  ok('linha sem regra herda o geral', regraPara(r, 'client', 'etherna').percentual === 35 && regraPara(r, 'client', null).percentual === 35);
  ok('revendedor 0% = o atacado cru', precoParaAcesso(r, 'reseller', base, 'ppf') === 3000);
  ok('percentual negativo vira 0 (ninguém abaixo do atacado)', montarRegras([{ papel: 'client', linha_key: null, base: 'atacado', percentual: -20 }]).geral.client.percentual === 0);
  ok('papel inválido na tabela é ignorado', montarRegras([{ papel: 'admin', linha_key: null, base: 'atacado', percentual: 99 }]).geral.client.base === 'varejo');
  const t = precosPorTipo(r, base, 'ppf');
  ok('precosPorTipo: os três de uma vez', t.reseller === 3000 && t.lojista === 3150 && t.client === 4200);
}

console.log('\n=== PROMOÇÃO E ARREDONDAMENTO ===');
{
  const r = montarRegras([{ papel: 'client', linha_key: null, base: 'varejo', percentual: 30 }]);
  ok('promoção (preço de saída) substitui a base e leva o percentual do tipo', precoParaAcesso(r, 'client', { atacado: 250, varejo: 330 }, 'avery', 180) === 234);
  ok('sem promoção: varejo + 30%', precoParaAcesso(r, 'client', { atacado: 250, varejo: 330 }, 'avery', null) === 429);
  ok('arredonda a 2 casas', precoParaAcesso(montarRegras([{ papel: 'lojista', linha_key: null, base: 'atacado', percentual: 7.5 }]), 'lojista', { atacado: 99.99 }, null) === 107.49);
  ok('base zero ou nula = sem preço', precoParaAcesso(r, 'client', { atacado: 0, varejo: null }, null) === null && precoParaAcesso(r, 'client', { atacado: null }, null) === null);
}

console.log('\n=== CARREGAR (falha fechada) ===');
{
  const dbRuim = { from: () => ({ select: async () => ({ data: null, error: { message: 'relation does not exist' } }) }) };
  const r = await carregarRegras(dbRuim);
  ok('tabela ausente → padrão, sem derrubar a vitrine', r.geral.client.base === 'varejo' && r.porLinha.size === 0);
  const dbBom = { from: () => ({ select: async () => ({ data: [{ papel: 'client', linha_key: 'ppf', base: 'atacado', percentual: '12.5' }], error: null }) }) };
  const r2 = await carregarRegras(dbBom);
  ok('linha vinda como texto vira número', regraPara(r2, 'client', 'ppf').percentual === 12.5);
}

rmSync(outDir, { recursive: true, force: true });
console.log(`\n${falhas ? `${falhas} FALHA(S)` : 'tudo OK'}`);
process.exit(falhas ? 1 : 0);
