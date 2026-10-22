// Autoteste do histórico do cliente no NZERP — sem rede, sem banco.
//
// `api/_lib/conta/erpHistorico.ts` é o único módulo que lê orçamentos, notas e
// títulos em nome de um cliente. O que não pode quebrar em silêncio:
//   · as listas brancas de colunas continuam sendo listas (sem `*`) e sem as
//     colunas que nunca podem sair do ERP (vendedor, notas internas, custo,
//     limite de crédito, cobrança/cartório/cessão);
//   · a régua do que o cliente vê (STATUS_VISIVEIS) não inclui orçamento em
//     aberto nem recusado — isso é negociação do vendedor;
//   · o título que sai para a tela (tituloPublico) não carrega as chaves do
//     dono, classifica certo nos três blocos (vencido / a vencer / pago, D6)
//     e só entrega Pix e links enquanto a cobrança vale.
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
ok('pago aparece por 12 meses', m.DIAS_PAGO_VISIVEL === 365);
ok('COLUNAS_TITULO lê a view (combinado/pagavel/cobranca_viva, nunca status_cobranca)', /\bcombinado\b/.test(m.COLUNAS_TITULO) && /\bpagavel\b/.test(m.COLUNAS_TITULO) && /\bcobranca_viva\b/.test(m.COLUNAS_TITULO));

// ------------------------------------------------ o título como a tela recebe
const agora = new Date('2026-10-22T23:30:00-03:00'); // 23h30 em Brasília = já é dia 23 em UTC
const base = {
  id: '11111111-1111-1111-1111-111111111111', client_id: 'cliente-interno', cliente_documento: '99988877000166',
  numero_documento: 'DOC-1', parcela_numero: 2, parcela_total: 3, vencimento: '2026-10-30', data_emissao: '2026-10-01', data_pagamento: null,
  valor: '200.00', valor_pago: null, valor_liquidado: '50.00', saldo: '150.00', status: 'parcial', forma_pagamento: 'BOLETO', quote_number: '123', nf_numero: '9',
  cobranca_viva: true, asaas_invoice_url: 'https://asaas/i', asaas_bank_slip_url: 'https://asaas/b', asaas_pix_payload: 'PIX-COPIA-E-COLA', asaas_pix_expiracao: '2026-10-25T00:00:00Z', asaas_linha_digitavel: '34191',
  combinado: false, pagavel: true,
};
const a = m.tituloPublico(base, agora);
ok('a vencer com cobrança: bloco, saldo, parcela, Pix e links', a.bloco === 'a_vencer' && a.vencido === false && a.saldo === 150 && a.parcela === '2/3' && a.pixPayload === 'PIX-COPIA-E-COLA' && a.cobrancaViva === true && a.faturaUrl === 'https://asaas/i', JSON.stringify(a));
ok('as chaves do dono NÃO saem (client_id, documento do cliente)', !('client_id' in a) && !('cliente_documento' in a) && !JSON.stringify(a).includes('99988877000166') && !JSON.stringify(a).includes('cliente-interno'));
const v = m.tituloPublico({ ...base, vencimento: '2026-10-01', cobranca_viva: false, asaas_pix_payload: null }, agora);
ok('vencido sem cobrança: bloco vencido, pagável, sem Pix nem link', v.bloco === 'vencido' && v.vencido === true && v.pagavel === true && v.pixPayload === null && v.faturaUrl === null);
ok('vence HOJE em Brasília ainda é a vencer (não é UTC)', m.tituloPublico({ ...base, vencimento: '2026-10-22' }, agora).bloco === 'a_vencer');
ok('venceu ontem é vencido', m.tituloPublico({ ...base, vencimento: '2026-10-21' }, agora).bloco === 'vencido');
const p = m.tituloPublico({ ...base, status: 'pago', data_pagamento: '2026-10-05', vencimento: '2026-10-01', cobranca_viva: false, pagavel: false }, agora);
ok('pago: bloco pago, não é vencido, link da cobrança fica para o recibo', p.bloco === 'pago' && p.vencido === false && p.faturaUrl === 'https://asaas/i' && p.pixPayload === null);
const c = m.tituloPublico({ ...base, combinado: true, pagavel: false, cobranca_viva: false }, agora);
ok('combinado (acordo/cedido): sem pagável', c.combinado === true && c.pagavel === false);
ok('Pix expirado não sai', m.tituloPublico({ ...base, asaas_pix_expiracao: '2026-10-22T10:00:00Z' }, agora).pixPayload === null);
ok('sem cobrança viva, o link antigo não sai (cobrança morta não se paga)', m.tituloPublico({ ...base, cobranca_viva: false }, agora).faturaUrl === null);

rmSync(outDir, { recursive: true, force: true });
console.log(falhas ? `\n${falhas} falha(s).` : '\nTudo certo.');
process.exit(falhas ? 1 : 0);
