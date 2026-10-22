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

const { montarRegras, regrasPadrao, regraPara, precoParaAcesso, precosPorTipo, papelDePreco, carregarRegras, montarVisibilidade, visibilidadePara, linhaOculta } = await import(pathToFileURL(join(outDir, 'precos/regraAcesso.js')).href);

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

console.log('\n=== POR PRODUTO (produto > linha > geral) ===');
{
  const r = montarRegras([
    { papel: 'client', linha_key: null, base: 'atacado', percentual: 30 },
    { papel: 'client', linha_key: 'ppf', base: 'atacado', percentual: 40 },
    { papel: 'client', linha_key: 'ppf', produto_slug: 'luxury-gloss', base: 'atacado', percentual: 10 },
    { papel: 'lojista', linha_key: null, produto_slug: 'luxury-gloss', base: 'varejo', percentual: 5 },
  ]);
  ok('produto com regra própria vence a linha', precoParaAcesso(r, 'client', base, 'ppf', null, 'rolo', 'luxury-gloss') === 3300);
  ok('outro produto da mesma linha segue a linha', precoParaAcesso(r, 'client', base, 'ppf', null, 'rolo', 'prime-matte') === 4200);
  ok('sem slug, vale a linha', precoParaAcesso(r, 'client', base, 'ppf', null, 'rolo') === 4200);
  ok('regra de produto não muda a BASE do tipo (lojista continua no atacado)', precoParaAcesso(r, 'lojista', base, 'ppf', null, 'rolo', 'luxury-gloss') === 3150);
  ok('regra de produto é por tipo: revendedor não é afetado', precoParaAcesso(r, 'reseller', base, 'ppf', null, 'rolo', 'luxury-gloss') === 3000);
  ok('regraPara expõe o nível que valeu', regraPara(r, 'client', 'ppf', 'luxury-gloss').produto_slug === 'luxury-gloss' && regraPara(r, 'client', 'ppf', 'x').produto_slug == null);
}

console.log('\n=== PROMOÇÃO E ARREDONDAMENTO ===');
{
  const r = montarRegras([{ papel: 'client', linha_key: null, base: 'varejo', percentual: 30 }]);
  ok('promoção (preço de saída) substitui a base e leva o percentual do tipo', precoParaAcesso(r, 'client', { atacado: 250, varejo: 330 }, 'avery', 180) === 234);
  ok('sem promoção: varejo + 30%', precoParaAcesso(r, 'client', { atacado: 250, varejo: 330 }, 'avery', null) === 429);
  ok('arredonda a 2 casas', precoParaAcesso(montarRegras([{ papel: 'lojista', linha_key: null, base: 'atacado', percentual: 7.5 }]), 'lojista', { atacado: 99.99 }, null) === 107.49);
  ok('base zero ou nula = sem preço', precoParaAcesso(r, 'client', { atacado: 0, varejo: null }, null) === null && precoParaAcesso(r, 'client', { atacado: null }, null) === null);
}

console.log('\n=== VISIBILIDADE POR TIPO ===');
{
  const vis = montarVisibilidade([
    { papel: 'client', linhas_ocultas: ['avery', 'speed-wrapping'], ve_rolo: false, ve_metro: true, ve_estoque: false, ve_promocao: false, pagamento_online: false },
    { papel: 'lojista', linhas_ocultas: [], ve_rolo: true, ve_metro: true, ve_estoque: true, ve_promocao: true, pagamento_online: true },
  ]);
  const r = montarRegras([{ papel: 'client', linha_key: null, base: 'atacado', percentual: 30 }], vis);
  ok('padrão sem linha: revendedor vê estoque detalhado, cliente final não', visibilidadePara(regrasPadrao(), 'reseller').veEstoque === true && visibilidadePara(regrasPadrao(), 'client').veEstoque === false);
  ok('admin vê tudo, sempre', visibilidadePara(r, 'admin').veEstoque === true && visibilidadePara(r, 'admin').linhasOcultas.size === 0);
  ok('linha oculta: cliente final não vê avery; lojista vê', linhaOculta(r, 'client', 'avery') === true && linhaOculta(r, 'lojista', 'avery') === false && linhaOculta(r, 'admin', 'avery') === false);
  ok('linha oculta → sem preço (rolo e metro)', precoParaAcesso(r, 'client', base, 'avery', null, 'rolo') === null && precoParaAcesso(r, 'client', base, 'avery', null, 'metro') === null);
  ok('linha visível segue a regra de preço', precoParaAcesso(r, 'client', base, 'ppf', null, 'metro') === 3900);
  ok('tipo que não compra rolo fechado: rolo null, metro normal', precoParaAcesso(r, 'client', base, 'ppf', null, 'rolo') === null && precoParaAcesso(r, 'client', base, 'ppf', null, 'metro') === 3900);
  ok('sem unidade informada, a regra de rolo/metro não entra (só a de linha)', precoParaAcesso(r, 'client', base, 'ppf') === 3900);
  ok('tipo sem promoção paga a tabela, não a saída', precoParaAcesso(r, 'client', { atacado: 250 }, 'ppf', 180, 'metro') === 325 && precoParaAcesso(r, 'lojista', { atacado: 250 }, 'ppf', 180, 'metro') === 180);
  const t = precosPorTipo(r, base, 'avery', null, 'rolo');
  ok('precosPorTipo respeita a visibilidade de cada tipo', t.client === null && t.lojista === 3000 && t.reseller === 3000);
  ok('pagamento online e estoque detalhado por tipo', visibilidadePara(r, 'client').pagamentoOnline === false && visibilidadePara(r, 'lojista').veEstoque === true);
  ok('papel inválido na tabela de visibilidade é ignorado', montarVisibilidade([{ papel: 'admin', ve_rolo: false }]).client.veRolo === true);
}

console.log('\n=== FAIXAS DENTRO DO TIPO (Fase 1, 21/10/2026) ===');
{
  // lojista Padrão +10% (ppf +15%); faixa 7 = Gold +7%; faixa 8 = Platinum +4% com ppf +6% e luxury +2%.
  const r = montarRegras([
    { papel: 'lojista', linha_key: null, base: 'atacado', percentual: 10 },
    { papel: 'lojista', linha_key: 'ppf', base: 'atacado', percentual: 15 },
    { papel: 'lojista', linha_key: null, base: 'atacado', percentual: 7, faixa_id: 7 },
    { papel: 'lojista', linha_key: null, base: 'atacado', percentual: 4, faixa_id: 8 },
    { papel: 'lojista', linha_key: 'ppf', base: 'atacado', percentual: 6, faixa_id: 8 },
    { papel: 'lojista', linha_key: 'ppf', produto_slug: 'luxury-gloss', base: 'atacado', percentual: 2, faixa_id: 8 },
    // faixa 9 só tem regra de uma linha: fora dela, cai no tipo
    { papel: 'lojista', linha_key: 'avery', base: 'atacado', percentual: 1, faixa_id: 9 },
    // faixa 20 é de cliente final: nunca vale para lojista
    { papel: 'client', linha_key: null, base: 'varejo', percentual: 3, faixa_id: 20 },
  ]);
  ok('sem faixa: regra do tipo (Padrão +10%)', precoParaAcesso(r, 'lojista', base, 'avery') === 3300);
  ok('Gold: geral da faixa (+7%) vence o geral do tipo', precoParaAcesso(r, 'lojista', base, 'avery', null, 'rolo', 'x', 7) === 3210);
  ok('Gold: geral da faixa vence até a LINHA do tipo (ppf +15% não entra)', precoParaAcesso(r, 'lojista', base, 'ppf', null, 'rolo', 'x', 7) === 3210);
  ok('Platinum: produto > linha > geral dentro da faixa', precoParaAcesso(r, 'lojista', base, 'ppf', null, 'rolo', 'luxury-gloss', 8) === 3060 && precoParaAcesso(r, 'lojista', base, 'ppf', null, 'rolo', 'outro', 8) === 3180 && precoParaAcesso(r, 'lojista', base, 'avery', null, 'rolo', 'outro', 8) === 3120);
  ok('faixa que só fala de uma linha: fora dela cai no tipo (ppf +15%)', precoParaAcesso(r, 'lojista', base, 'avery', null, 'rolo', 'x', 9) === 3030 && precoParaAcesso(r, 'lojista', base, 'ppf', null, 'rolo', 'x', 9) === 3450);
  ok('faixa de outro tipo é ignorada (lojista com faixa 20 = Padrão)', precoParaAcesso(r, 'lojista', base, 'ppf', null, 'rolo', 'x', 20) === 3450);
  ok('faixa inexistente = Padrão', precoParaAcesso(r, 'lojista', base, 'avery', null, 'rolo', 'x', 999) === 3300);
  ok('a BASE é sempre a do tipo (cliente final varejo, faixa 20 +3%)', precoParaAcesso(r, 'client', base, 'avery', null, 'rolo', 'x', 20) === 4120);
  ok('regraPara expõe a faixa que valeu', regraPara(r, 'lojista', 'ppf', 'luxury-gloss', 8).faixa_id === 8 && regraPara(r, 'lojista', 'ppf', 'x', 9).faixa_id == null);
  const t = precosPorTipo(r, base, 'avery', null, 'rolo', 'x', 7);
  ok('precosPorTipo com faixa: só o tipo dono da faixa muda', t.lojista === 3210 && t.reseller === 3000 && t.client === 4000);
  ok('faixa_id como texto vira número', regraPara(montarRegras([{ papel: 'lojista', linha_key: null, base: 'atacado', percentual: 5, faixa_id: '7' }]), 'lojista', null, null, 7).percentual === 5);
}

console.log('\n=== CARREGAR (falha fechada) ===');
{
  // A leitura das regras é paginada (varredura 22/10: .order('id').range(...)).
  const consulta = (resposta) => {
    const q = { order: () => q, range: () => q, then: (res) => res(resposta) };
    return q;
  };
  const dbRuim = { from: () => ({ select: () => consulta({ data: null, error: { message: 'relation does not exist' } }) }) };
  const r = await carregarRegras(dbRuim);
  ok('tabela ausente → padrão, sem derrubar a vitrine', r.geral.client.base === 'varejo' && r.porLinha.size === 0 && r.vis.client.veRolo === true);
  const dbBom = {
    from: (t) => ({
      select: () =>
        consulta(
          t === 'acesso_config'
            ? { data: [{ papel: 'client', linhas_ocultas: ['md80'], ve_rolo: true, ve_metro: true, ve_estoque: false, ve_promocao: true, pagamento_online: true }], error: null }
            : { data: [{ papel: 'client', linha_key: 'ppf', base: 'atacado', percentual: '12.5' }], error: null }
        ),
    }),
  };
  const r2 = await carregarRegras(dbBom);
  ok('linha vinda como texto vira número', regraPara(r2, 'client', 'ppf').percentual === 12.5);
  ok('visibilidade carregada junto com as regras', r2.vis.client.linhasOcultas.has('md80'));
}

rmSync(outDir, { recursive: true, force: true });
console.log(`\n${falhas ? `${falhas} FALHA(S)` : 'tudo OK'}`);
process.exit(falhas ? 1 : 0);
