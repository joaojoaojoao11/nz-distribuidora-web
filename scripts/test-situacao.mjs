// Autoteste da situação do pedido no admin — sem rede, sem navegador.
//
// `situacaoDoPedido` é a única régua que diz, para a lista, o detalhe e o
// contador do menu, o que um pedido está esperando. Se a régua mudar, muda
// aqui primeiro.
//
// Uso: npm run pedidos:test

import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(join(ROOT, 'node_modules/.cache'), { recursive: true });
const outDir = mkdtempSync(join(ROOT, 'node_modules/.cache/nz-situacao-'));

const build = spawnSync(
  process.execPath,
  [join(ROOT, 'node_modules/esbuild/bin/esbuild'), 'src/lib/shop/situacaoPedido.ts', `--outdir=${outDir}`, '--format=esm', '--platform=node', '--log-level=error'],
  { cwd: ROOT, encoding: 'utf8' }
);
if (build.status !== 0) {
  console.error(build.error?.message || build.stderr || build.stdout || 'esbuild falhou');
  rmSync(outDir, { recursive: true, force: true });
  process.exit(1);
}

const { situacaoDoPedido, contarFilas, pedeAtencao, FILAS } = await import(pathToFileURL(join(outDir, 'situacaoPedido.js')).href);

let falhas = 0;
const ok = (nome, cond, extra = '') => {
  console.log(`${cond ? '  OK  ' : ' FALHA'} ${nome}${extra ? ' — ' + extra : ''}`);
  if (!cond) falhas++;
};

const base = { status: 'APROVADO', pagamento_status: 'pago', forma_pagamento: 'CREDIT_CARD', erp_envio: 'enviado', erp_pago_em: '2026-10-20T12:48:27Z', erp_quote_number: 1376 };
const AGORA = Date.parse('2026-10-20T13:00:00-03:00');

console.log('\n=== PAGO ===');
{
  const s = situacaoDoPedido(base, AGORA);
  ok('pago + APROVADO no ERP → "Pago · a separar", fila novos, verde', s.rotulo === 'Pago · a separar' && s.fila === 'novos' && s.tom === 'ok' && /1376/.test(s.detalhe ?? ''));
  ok('pago + FATURADO → em andamento', situacaoDoPedido({ ...base, status: 'FATURADO' }, AGORA).fila === 'andamento');
  ok('pago + ENVIADO → em andamento, rótulo diz enviado', /enviado/.test(situacaoDoPedido({ ...base, status: 'ENVIADO' }, AGORA).rotulo));
  ok('pago + ENTREGUE → concluído', situacaoDoPedido({ ...base, status: 'ENTREGUE' }, AGORA).fila === 'concluido');
  const semErp = situacaoDoPedido({ ...base, erp_envio: 'pendente', erp_quote_number: null, erp_envio_erro: 'site_criar_pedido: timeout' }, AGORA);
  ok('pago sem orçamento no ERP → ação "enviar-erp", vermelho, mostra o erro', semErp.fila === 'acao' && semErp.acao === 'enviar-erp' && semErp.tom === 'erro' && /timeout/.test(semErp.detalhe ?? ''));
  const naoAvisado = situacaoDoPedido({ ...base, erp_pago_em: null }, AGORA);
  ok('pago com orçamento mas ERP não avisado → ação', naoAvisado.fila === 'acao' && /não avisado/.test(naoAvisado.rotulo));
  ok('pago + NAO_ENTREGUE → ação', situacaoDoPedido({ ...base, status: 'NAO_ENTREGUE' }, AGORA).fila === 'acao');
  ok('pago + CANCELADO → não concluído, alerta de estorno', (() => { const s = situacaoDoPedido({ ...base, status: 'CANCELADO' }, AGORA); return s.fila === 'parado' && /estorno/.test(s.detalhe ?? ''); })());
  ok('estornado → não concluído, neutro', situacaoDoPedido({ ...base, pagamento_status: 'estornado' }, AGORA).tom === 'neutro');
}

console.log('\n=== AGUARDANDO CLIENTE ===');
{
  const pix = situacaoDoPedido({ ...base, status: 'RASCUNHO', pagamento_status: 'aguardando', forma_pagamento: 'PIX', erp_envio: 'pendente', erp_pago_em: null, erp_quote_number: null, expira_em: '2026-10-20T13:25:00-03:00' }, AGORA);
  ok('Pix em aberto → "Aguardando Pix", fila cliente, diz quando expira', pix.rotulo === 'Aguardando Pix' && pix.fila === 'cliente' && /13:25/.test(pix.detalhe ?? ''));
  const pixVencido = situacaoDoPedido({ ...base, status: 'RASCUNHO', pagamento_status: 'aguardando', forma_pagamento: 'PIX', erp_envio: 'pendente', erp_pago_em: null, erp_quote_number: null, expira_em: '2026-10-20T12:00:00-03:00' }, AGORA);
  ok('Pix passou do prazo e ninguém expirou → avisa', /venceu/.test(pixVencido.detalhe ?? ''));
  const boleto = situacaoDoPedido({ ...base, status: 'RASCUNHO', pagamento_status: 'aguardando', forma_pagamento: 'BOLETO', erp_envio: 'pendente', erp_pago_em: null, erp_quote_number: null, vencimento: '2026-10-23' }, AGORA);
  ok('boleto em aberto → "Aguardando boleto · vence 23/10"', boleto.rotulo === 'Aguardando boleto' && boleto.detalhe === 'vence 23/10');
  ok('cartão em análise → fila cliente, âmbar', (() => { const s = situacaoDoPedido({ ...base, pagamento_status: 'em_analise' }, AGORA); return s.fila === 'cliente' && s.tom === 'atencao'; })());
}

console.log('\n=== NÃO CONCLUÍDOS ===');
{
  ok('cartão recusado → não concluído, vermelho', (() => { const s = situacaoDoPedido({ ...base, pagamento_status: 'recusado', status: 'RASCUNHO' }, AGORA); return s.rotulo === 'Cartão recusado' && s.fila === 'parado' && s.tom === 'erro'; })());
  ok('Pix expirado / boleto vencido → não concluídos', situacaoDoPedido({ ...base, pagamento_status: 'expirado' }, AGORA).fila === 'parado' && situacaoDoPedido({ ...base, pagamento_status: 'vencido' }, AGORA).fila === 'parado');
  ok('cancelado sem pagamento → neutro', situacaoDoPedido({ ...base, status: 'CANCELADO', pagamento_status: 'cancelado' }, AGORA).tom === 'neutro');
}

console.log('\n=== ORÇAMENTO (SEM PAGAMENTO ONLINE) ===');
{
  const sol = situacaoDoPedido({ status: 'SOLICITADO', pagamento_status: 'nenhum', forma_pagamento: null, erp_envio: 'pendente', erp_pago_em: null, erp_quote_number: null }, AGORA);
  ok('SOLICITADO → "aguardando vendedor", ação enviar-erp', /aguardando vendedor/.test(sol.rotulo) && sol.acao === 'enviar-erp' && sol.fila === 'acao');
  ok('ABERTO no ERP → em andamento, azul', (() => { const s = situacaoDoPedido({ status: 'ABERTO', pagamento_status: 'nenhum', forma_pagamento: null, erp_envio: 'enviado', erp_pago_em: null, erp_quote_number: 1085 }, AGORA); return s.fila === 'andamento' && s.tom === 'info'; })());
  ok('DADOS_INCOMPLETOS → ação', situacaoDoPedido({ status: 'DADOS_INCOMPLETOS', pagamento_status: 'nenhum', forma_pagamento: null, erp_envio: 'enviado', erp_pago_em: null, erp_quote_number: 1 }, AGORA).fila === 'acao');
  ok('RASCUNHO → não concluído', situacaoDoPedido({ status: 'RASCUNHO', pagamento_status: 'nenhum', forma_pagamento: null, erp_envio: 'pendente', erp_pago_em: null, erp_quote_number: null }, AGORA).fila === 'parado');
  ok('pagamento_status null é tratado como nenhum', situacaoDoPedido({ status: 'SOLICITADO', pagamento_status: null, forma_pagamento: null, erp_envio: 'pendente', erp_pago_em: null, erp_quote_number: null }, AGORA).acao === 'enviar-erp');
}

console.log('\n=== FILAS E CONTADOR ===');
{
  const lista = [
    base,
    { ...base, status: 'FATURADO' },
    { ...base, erp_pago_em: null },
    { status: 'SOLICITADO', pagamento_status: 'nenhum', forma_pagamento: null, erp_envio: 'pendente', erp_pago_em: null, erp_quote_number: null },
    { ...base, status: 'CANCELADO', pagamento_status: 'cancelado' },
  ];
  const c = contarFilas(lista, AGORA);
  ok('contarFilas: 2 ação, 1 novos, 1 andamento, 1 parado', c.acao === 2 && c.novos === 1 && c.andamento === 1 && c.parado === 1 && c.cliente === 0 && c.concluido === 0);
  ok('pedeAtencao: ação e novos contam no menu; andamento não', pedeAtencao(base, AGORA) && pedeAtencao(lista[3], AGORA) && !pedeAtencao(lista[1], AGORA));
  ok('toda fila tem rótulo e descrição', FILAS.length === 6 && FILAS.every((f) => f.rotulo && f.descricao));
  const filasUsadas = new Set(FILAS.map((f) => f.id));
  ok('toda situação cai numa fila conhecida', lista.every((p) => filasUsadas.has(situacaoDoPedido(p, AGORA).fila)));
}

rmSync(outDir, { recursive: true, force: true });
console.log(`\n${falhas ? `${falhas} FALHA(S)` : 'tudo OK'}`);
process.exit(falhas ? 1 : 0);
