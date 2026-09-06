// Autoteste do checkout Asaas — sem rede, sem banco.
//
// O fetch é substituído por um duplo que devolve os payloads da documentação
// do Asaas (docs.asaas.com, API v3) e guarda o que foi enviado; o Supabase é
// um duplo em memória que registra as escritas. Cobre:
//   · corpo das cobranças Pix / boleto / cartão (à vista e parcelado);
//   · cartão: remoteIp, holderInfo, recusa (400) e o que NÃO é gravado;
//   · webhook: token errado, evento repetido, valor divergente, pago;
//   · expiração do Pix (remove no Asaas) e regras puras (parcelas, datas).
//
// Uso: npm run checkout:test

import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// Dentro de node_modules/.cache para os imports de @supabase/supabase-js
// resolverem (o Node sobe a árvore até ROOT/node_modules).
mkdirSync(join(ROOT, 'node_modules/.cache'), { recursive: true });
const outDir = mkdtempSync(join(ROOT, 'node_modules/.cache/nz-checkout-'));

const build = spawnSync(
  process.execPath,
  [
    join(ROOT, 'node_modules/esbuild/bin/esbuild'),
    'api/_lib/asaas/cliente.ts',
    'api/_lib/asaas/pagamento.ts',
    'api/_lib/handlers/asaas.ts',
    'api/_lib/pedido/precificar.ts',
    'api/_lib/conta/completude.ts',
    `--outdir=${outDir}`,
    '--format=esm',
    '--platform=node',
    '--log-level=error',
  ],
  { cwd: ROOT, encoding: 'utf8' }
);
if (build.status !== 0) {
  console.error(build.error?.message || build.stderr || build.stdout || 'esbuild falhou');
  rmSync(outDir, { recursive: true, force: true });
  process.exit(1);
}
// Entradas em pastas diferentes: o esbuild preserva a árvore (asaas/, handlers/,
// pedido/), então os imports relativos `.js` continuam válidos.

process.env.ASAAS_API_KEY = '$aact_teste_nao_e_uma_chave';
process.env.ASAAS_WEBHOOK_TOKEN = 'token-de-teste-com-64-caracteres-0123456789abcdef0123456789abcdef';
delete process.env.ERP_SUPABASE_URL;

let falhas = 0;
const ok = (nome, cond, extra = '') => {
  console.log(`${cond ? '  OK  ' : ' FALHA'} ${nome}${extra ? ' — ' + extra : ''}`);
  if (!cond) falhas++;
};

// ------------------------------------------------------------ duplo fetch
const chamadas = [];
let respostas = [];
globalThis.fetch = async (url, init = {}) => {
  const corpo = init.body ? JSON.parse(init.body) : null;
  chamadas.push({ url: String(url), method: init.method ?? 'GET', headers: init.headers ?? {}, body: corpo });
  const proxima = respostas.shift() ?? { status: 200, json: {} };
  return new Response(JSON.stringify(proxima.json), { status: proxima.status, headers: { 'content-type': 'application/json', ...(proxima.headers ?? {}) } });
};

// --------------------------------------------------------- duplo supabase
function fakeDb(dados = {}) {
  const escritas = [];
  const tabelas = structuredClone(dados);
  const builder = (tabela) => {
    const st = { tabela, op: 'select', filtros: [], payload: null, single: false, count: false };
    const b = {
      select: (cols, opts) => { if (st.op === 'select') st.op = 'select'; if (opts?.head) st.count = true; return b; },
      insert: (p) => { st.op = 'insert'; st.payload = p; return b; },
      update: (p) => { st.op = 'update'; st.payload = p; return b; },
      delete: () => { st.op = 'delete'; return b; },
      eq: (k, v) => { st.filtros.push([k, v]); return b; },
      neq: () => b, in: () => b, gte: () => b, order: () => b, limit: () => b,
      maybeSingle: () => { st.single = true; return b; },
      single: () => { st.single = true; return b; },
      then: (res, rej) => Promise.resolve(exec()).then(res, rej),
    };
    const exec = () => {
      const linhas = tabelas[st.tabela] ?? [];
      const bate = (r) => st.filtros.every(([k, v]) => r[k] === v);
      if (st.op === 'insert') {
        const lista = Array.isArray(st.payload) ? st.payload : [st.payload];
        const novas = lista.map((r, i) => ({ id: r.id ?? `id-${st.tabela}-${(tabelas[st.tabela] ?? []).length + i + 1}`, criado_em: new Date().toISOString(), ...r }));
        tabelas[st.tabela] = [...linhas, ...novas];
        escritas.push({ tabela: st.tabela, op: 'insert', payload: lista });
        return { data: st.single ? novas[0] : novas, error: null };
      }
      if (st.op === 'update') {
        const alvo = linhas.filter(bate);
        for (const r of alvo) Object.assign(r, st.payload);
        escritas.push({ tabela: st.tabela, op: 'update', payload: st.payload, filtros: st.filtros });
        return { data: alvo, error: null };
      }
      if (st.op === 'delete') {
        tabelas[st.tabela] = linhas.filter((r) => !bate(r));
        escritas.push({ tabela: st.tabela, op: 'delete', filtros: st.filtros });
        return { data: null, error: null };
      }
      const sel = linhas.filter(bate);
      if (st.count) return { count: sel.length, data: null, error: null };
      return { data: st.single ? sel[0] ?? null : sel, error: null };
    };
    return b;
  };
  const rpcs = [];
  return {
    from: builder,
    rpc: async (nome, args) => { rpcs.push({ nome, args }); return { data: true, error: null }; },
    escritas, rpcs, tabelas,
  };
}

const { criarPagamento, parcelasDisponiveis, statusDoEvento, statusDoAsaas, expirarSeVencido, marcarPago } = await import(pathToFileURL(join(outDir, 'asaas/pagamento.js')).href);
const { somarDiasUteis, hojeBr, ipDoCliente, sanitizarPagamento } = await import(pathToFileURL(join(outDir, 'asaas/cliente.js')).href);
const { normalizarItens } = await import(pathToFileURL(join(outDir, 'pedido/precificar.js')).href);
const webhook = await import(pathToFileURL(join(outDir, 'handlers/asaas.js')).href);

const CFG = { checkout_ativo: true, pix_expira_min: 30, boleto_vencimento_dias: 3, boleto_multa_pct: 2, boleto_juros_mes_pct: 1, boleto_minimo: 0, cartao_max_parcelas: 6, cartao_parcela_minima: 100, retirada_ativa: true, retirada_endereco: '', pedido_minimo: 0, frete_gratis_acima: null };
const PERFIL = { full_name: 'Maria Teste', company_name: null, phone: '11999990000', email: 'maria@teste.com', cpf_cnpj: '52998224725', ie: null, indicado_por: null, address_street: 'Rua A', address_number: '10', address_complement: null, address_neighborhood: 'Centro', address_city: 'São Paulo', address_state: 'SP', address_zip: '01310100', asaas_customer_id: 'cus_000005401844', asaas_customer_env: 'production' };
// Payload de cobrança da doc (Criar nova cobrança → 200).
const PAGAMENTO_DOC = (extra = {}) => ({ object: 'payment', id: 'pay_080225913252', dateCreated: '2026-09-07', customer: 'cus_000005401844', value: 100, netValue: 94.51, billingType: 'PIX', status: 'PENDING', dueDate: '2026-09-07', invoiceUrl: 'https://www.asaas.com/i/080225913252', bankSlipUrl: null, transactionReceiptUrl: null, nossoNumero: null, ...extra });

// ================================================================ regras
console.log('\n=== REGRAS PURAS ===');
ok('parcelas: 6x sem juros até a mínima de R$ 100', parcelasDisponiveis(1000, CFG).map((p) => p.n).join(',') === '1,2,3,4,5,6');
ok('parcelas: R$ 250 → só 1x e 2x (125 ≥ 100; 83 < 100)', parcelasDisponiveis(250, CFG).map((p) => p.n).join(',') === '1,2');
ok('parcelas: valor da parcela arredondado a 2 casas', parcelasDisponiveis(1000, CFG)[2].valor === 333.33);
ok('dias úteis: sexta + 3 = quarta', somarDiasUteis('2026-09-04', 3) === '2026-09-09');
ok('dias úteis: 0 dias = mesma data', somarDiasUteis('2026-09-07', 0) === '2026-09-07');
ok('hojeBr tem formato YYYY-MM-DD', /^\d{4}-\d{2}-\d{2}$/.test(hojeBr()));
ok('ip: primeiro do x-forwarded-for', ipDoCliente({ 'x-forwarded-for': '200.1.2.3, 10.0.0.1' }) === '200.1.2.3');
ok('ip: cai no x-real-ip', ipDoCliente({ 'x-real-ip': '200.9.9.9' }) === '200.9.9.9');
ok('evento: RECEIVED/CONFIRMED → pago', statusDoEvento('PAYMENT_RECEIVED', 'PIX') === 'pago' && statusDoEvento('PAYMENT_CONFIRMED', 'CREDIT_CARD') === 'pago');
ok('evento: OVERDUE → vencido no boleto, expirado no Pix', statusDoEvento('PAYMENT_OVERDUE', 'BOLETO') === 'vencido' && statusDoEvento('PAYMENT_OVERDUE', 'PIX') === 'expirado');
ok('evento: reprovado pelo risco → recusado', statusDoEvento('PAYMENT_REPROVED_BY_RISK_ANALYSIS', 'CREDIT_CARD') === 'recusado');
ok('evento: desconhecido → sem transição', statusDoEvento('PAYMENT_BANK_SLIP_VIEWED', 'BOLETO') === null);
ok('status Asaas: AWAITING_RISK_ANALYSIS → em_analise', statusDoAsaas('AWAITING_RISK_ANALYSIS', 'CREDIT_CARD') === 'em_analise');
ok('sanitizar: token do cartão não sobrevive', !('creditCardToken' in (sanitizarPagamento({ creditCard: { creditCardNumber: '8829', creditCardBrand: 'VISA', creditCardToken: 'x' } }).creditCard ?? {})));
const itens = normalizarItens([{ slug: 'A', qtd: 2, unidade: 'rolo' }, { slug: 'b', qtd: 999, unidade: 'metro' }, { slug: 'c', qtd: -1, unidade: 'rolo' }, { qtd: 1, unidade: 'rolo' }]);
ok('itens: minúsculo, teto de 500 m, inválidos fora', itens.length === 2 && itens[0].slug === 'a' && itens[1].qtd === 500);

// ================================================================== PIX
console.log('\n=== COBRANÇA PIX ===');
{
  const db = fakeDb();
  respostas = [
    { status: 200, json: PAGAMENTO_DOC() },
    { status: 200, json: { encodedImage: 'iVBORw0KGgo=', payload: '00020126580014br.gov.bcb.pix...', expirationDate: '2027-09-07 23:59:59' } },
  ];
  chamadas.length = 0;
  const r = await criarPagamento(db, { pedido: { id: 'ped-1', numero: 101 }, perfil: PERFIL, asaasCustomerId: 'cus_000005401844', forma: 'PIX', total: 100, parcelas: 1, ip: '200.1.2.3', cfg: CFG });
  ok('Pix: ok', r.ok === true);
  const post = chamadas[0];
  ok('Pix: POST /payments com access_token e sem Bearer', post.url.endsWith('/payments') && post.method === 'POST' && post.headers.access_token && !post.headers.Authorization);
  ok('Pix: corpo (customer, billingType, value, dueDate=hoje, externalReference=pedido)', post.body.customer === 'cus_000005401844' && post.body.billingType === 'PIX' && post.body.value === 100 && post.body.dueDate === hojeBr() && post.body.externalReference === 'ped-1');
  ok('Pix: busca o QR em GET /payments/{id}/pixQrCode sem Content-Type', chamadas[1].url.endsWith('/payments/pay_080225913252/pixQrCode') && !chamadas[1].headers['Content-Type']);
  const ins = db.escritas.find((e) => e.tabela === 'pagamentos' && e.op === 'insert')?.payload[0];
  ok('Pix: grava payload e QR, status aguardando, expira em ~30 min', ins?.pix_payload?.startsWith('0002') && ins.status === 'aguardando' && Math.abs(new Date(ins.expira_em) - Date.now() - 30 * 60_000) < 5000);
  ok('Pix: nada de cartão na linha', !('creditCard' in (ins ?? {})) && ins.cartao_final == null);
}

// =============================================================== BOLETO
console.log('\n=== COBRANÇA BOLETO ===');
{
  const db = fakeDb();
  respostas = [
    { status: 200, json: PAGAMENTO_DOC({ billingType: 'BOLETO', bankSlipUrl: 'https://www.asaas.com/b/pdf/080225913252', nossoNumero: '6453' }) },
    { status: 200, json: { identificationField: '00190.00009 01234.567890 12345.678901 2 91230000010000', nossoNumero: '6453', barCode: '00192912300000100000000001234567890123456789' } },
  ];
  chamadas.length = 0;
  const r = await criarPagamento(db, { pedido: { id: 'ped-2', numero: 102 }, perfil: PERFIL, asaasCustomerId: 'cus_000005401844', forma: 'BOLETO', total: 100, parcelas: 1, ip: '200.1.2.3', cfg: CFG });
  const post = chamadas[0].body;
  ok('boleto: vence em 3 dias úteis, multa 2% e juros 1% a.m.', post.dueDate === somarDiasUteis(hojeBr(), 3) && post.fine?.value === 2 && post.fine?.type === 'PERCENTAGE' && post.interest?.value === 1);
  const ins = db.escritas.find((e) => e.tabela === 'pagamentos')?.payload[0];
  ok('boleto: linha digitável, PDF e nosso número gravados', r.ok && ins.linha_digitavel?.startsWith('00190') && ins.boleto_url?.includes('/b/pdf/') && ins.nosso_numero === '6453');
}

// =============================================================== CARTÃO
console.log('\n=== COBRANÇA CARTÃO ===');
const CARTAO = { numero: '5162306219378829', nome: 'MARIA TESTE', mes: '05', ano: '2030', cvv: '318', cpf: '52998224725' };
{
  const db = fakeDb({ pedidos: [{ id: 'ped-3', cupom: 'NZ-ABC', pagamento_status: 'aguardando', erp_quote_id: null }] });
  respostas = [{ status: 200, json: PAGAMENTO_DOC({ billingType: 'CREDIT_CARD', status: 'CONFIRMED', value: 900, netValue: 872, confirmedDate: '2026-09-07', creditCard: { creditCardNumber: '8829', creditCardBrand: 'MASTERCARD', creditCardToken: 'a75a1d98-token' } }) }];
  chamadas.length = 0;
  const r = await criarPagamento(db, { pedido: { id: 'ped-3', numero: 103 }, perfil: PERFIL, asaasCustomerId: 'cus_000005401844', forma: 'CREDIT_CARD', total: 900, parcelas: 3, cartao: CARTAO, ip: '200.1.2.3', cfg: CFG });
  const post = chamadas[0].body;
  ok('cartão: creditCard completo e holderInfo com CPF/CEP/número/telefone', post.creditCard?.number === CARTAO.numero && post.creditCard.expiryYear === '2030' && post.creditCardHolderInfo?.cpfCnpj === CARTAO.cpf && post.creditCardHolderInfo.postalCode === '01310100' && post.creditCardHolderInfo.phone === '11999990000');
  ok('cartão: remoteIp é o do comprador', post.remoteIp === '200.1.2.3');
  ok('cartão 3x: installmentCount + totalValue, sem value', post.installmentCount === 3 && post.totalValue === 900 && post.value === undefined);
  ok('cartão: aprovado na resposta → pago', r.ok && r.pagamento.status === 'pago');
  const linhas = db.escritas.filter((e) => e.tabela === 'pagamentos');
  const tudo = JSON.stringify(linhas);
  ok('cartão: número e CVV nunca vão ao banco', !tudo.includes(CARTAO.numero) && !tudo.includes('"318"'));
  ok('cartão: token do cartão não é gravado', !tudo.includes('a75a1d98-token'));
  ok('cartão: só bandeira e 4 últimos', tudo.includes('MASTERCARD') && tudo.includes('"8829"'));
  ok('cartão: pedido vira pago e cupom consumido uma vez', db.tabelas.pedidos[0].pagamento_status === 'pago' && db.rpcs.filter((x) => x.nome === 'cupom_consumir').length === 1);
  // Chamar de novo não consome o cupom outra vez.
  await marcarPago(db, r.pagamento, 'repetido');
  ok('cartão: marcarPago é idempotente', db.rpcs.filter((x) => x.nome === 'cupom_consumir').length === 1);
}
{
  const db = fakeDb();
  respostas = [{ status: 400, json: { errors: [{ code: 'invalid_action', description: 'Transação não autorizada. Verifique os dados do cartão de crédito e tente novamente.' }] } }];
  const r = await criarPagamento(db, { pedido: { id: 'ped-4', numero: 104 }, perfil: PERFIL, asaasCustomerId: 'cus_1', forma: 'CREDIT_CARD', total: 100, parcelas: 1, cartao: CARTAO, ip: '1.1.1.1', cfg: CFG });
  ok('cartão recusado: ok=false, erro cartao-recusado, nada gravado', r.ok === false && r.erro === 'cartao-recusado' && db.escritas.length === 0);
}
{
  const db = fakeDb();
  respostas = [{ status: 401, json: { errors: [{ code: 'invalid_access_token', description: 'invalid' }] } }];
  const r = await criarPagamento(db, { pedido: { id: 'ped-5', numero: 105 }, perfil: PERFIL, asaasCustomerId: 'cus_1', forma: 'PIX', total: 100, parcelas: 1, ip: '1.1.1.1', cfg: CFG });
  ok('chave inválida: erro asaas-indisponivel com mensagem de chave', r.ok === false && r.erro === 'asaas-indisponivel' && /chave/i.test(r.mensagem));
}

// ============================================================== WEBHOOK
console.log('\n=== WEBHOOK ===');
const fakeRes = () => {
  const r = { code: 0, body: null, headersSent: false, setHeader() {}, status(c) { r.code = c; return r; }, json(b) { r.body = b; r.headersSent = true; return r; } };
  return r;
};
const reqCom = (token, body) => ({ method: 'POST', headers: { 'asaas-access-token': token }, body });
process.env.VITE_SUPABASE_URL = 'https://x.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'k';
{
  const res = fakeRes();
  await webhook.default(reqCom('errado', { id: 'evt_1', event: 'PAYMENT_RECEIVED', payment: { id: 'pay_1' } }), res);
  ok('token errado → 401', res.code === 401);
}
{
  const db = fakeDb({ pagamentos: [{ id: 'pg-1', pedido_id: 'ped-9', asaas_payment_id: 'pay_1', forma: 'PIX', status: 'aguardando', valor: 100, estornado_valor: 0 }], pedidos: [{ id: 'ped-9', cupom: null, pagamento_status: 'aguardando' }] });
  respostas = [{ status: 200, json: PAGAMENTO_DOC({ id: 'pay_1', status: 'RECEIVED', value: 90, externalReference: 'ped-9' }) }];
  const r = await webhook.processar(db, 'PAYMENT_RECEIVED', { id: 'pay_1', status: 'RECEIVED', value: 90 });
  ok('valor divergente (90 ≠ 100): NÃO marca pago e registra erro', /valor/.test(r.erro ?? '') && db.tabelas.pagamentos[0].status === 'aguardando');
}
{
  const db = fakeDb({ pagamentos: [{ id: 'pg-1', pedido_id: 'ped-9', asaas_payment_id: 'pay_1', forma: 'PIX', status: 'aguardando', valor: 100, estornado_valor: 0 }], pedidos: [{ id: 'ped-9', cupom: null, pagamento_status: 'aguardando' }] });
  respostas = [{ status: 200, json: PAGAMENTO_DOC({ id: 'pay_1', status: 'RECEIVED', value: 100, externalReference: 'ped-8' }) }];
  const r = await webhook.processar(db, 'PAYMENT_RECEIVED', { id: 'pay_1', status: 'RECEIVED', value: 100 });
  ok('externalReference de outro pedido: NÃO marca pago', /externalReference/.test(r.erro ?? '') && db.tabelas.pagamentos[0].status === 'aguardando');
}
{
  const db = fakeDb({ pagamentos: [{ id: 'pg-1', pedido_id: 'ped-9', asaas_payment_id: 'pay_1', forma: 'PIX', status: 'aguardando', valor: 100, estornado_valor: 0 }], pedidos: [{ id: 'ped-9', cupom: null, pagamento_status: 'aguardando' }] });
  respostas = [{ status: 200, json: PAGAMENTO_DOC({ id: 'pay_1', status: 'RECEIVED', value: 100, externalReference: 'ped-9', paymentDate: '2026-09-07' }) }];
  chamadas.length = 0;
  const r = await webhook.processar(db, 'PAYMENT_RECEIVED', { id: 'pay_1', status: 'RECEIVED', value: 100 });
  ok('PAYMENT_RECEIVED válido: reconsulta o Asaas e marca pago', chamadas[0].url.endsWith('/payments/pay_1') && r.status === 'pago' && db.tabelas.pedidos[0].pagamento_status === 'pago');
  // Evento atrasado depois de pago não rebaixa.
  respostas = [{ status: 200, json: PAGAMENTO_DOC({ id: 'pay_1', status: 'RECEIVED', value: 100, externalReference: 'ped-9' }) }];
  await webhook.processar(db, 'PAYMENT_OVERDUE', { id: 'pay_1' });
  ok('OVERDUE atrasado não rebaixa um pago', db.tabelas.pagamentos[0].status === 'pago');
}
{
  const db = fakeDb({ pagamentos: [] });
  const r = await webhook.processar(db, 'PAYMENT_RECEIVED', { id: 'pay_do_erp', status: 'RECEIVED', value: 50 });
  ok('cobrança do NZERP (não é da loja): ignorada', /não é da loja/.test(r.ignorado ?? ''));
}

// ============================================================ EXPIRAÇÃO
console.log('\n=== EXPIRAÇÃO DO PIX ===');
{
  const db = fakeDb({ pagamentos: [{ id: 'pg-2', pedido_id: 'ped-7', asaas_payment_id: 'pay_7', forma: 'PIX', status: 'aguardando', valor: 100, estornado_valor: 0, expira_em: new Date(Date.now() - 60_000).toISOString() }], pedidos: [{ id: 'ped-7', pagamento_status: 'aguardando' }] });
  respostas = [{ status: 200, json: PAGAMENTO_DOC({ id: 'pay_7', status: 'PENDING' }) }, { status: 200, json: { deleted: true, id: 'pay_7' } }];
  chamadas.length = 0;
  const r = await expirarSeVencido(db, db.tabelas.pagamentos[0]);
  ok('Pix vencido: consulta, remove no Asaas (DELETE) e marca expirado', chamadas[1]?.method === 'DELETE' && r.status === 'expirado' && db.tabelas.pedidos[0].pagamento_status === 'expirado');
}
{
  const db = fakeDb({ pagamentos: [{ id: 'pg-3', pedido_id: 'ped-6', asaas_payment_id: 'pay_6', forma: 'PIX', status: 'aguardando', valor: 100, estornado_valor: 0, expira_em: new Date(Date.now() - 60_000).toISOString() }], pedidos: [{ id: 'ped-6', pagamento_status: 'aguardando' }] });
  respostas = [{ status: 200, json: PAGAMENTO_DOC({ id: 'pay_6', status: 'RECEIVED', value: 100 }) }];
  chamadas.length = 0;
  const r = await expirarSeVencido(db, db.tabelas.pagamentos[0]);
  ok('Pix pago no último segundo: não remove, marca pago', r.status === 'pago' && !chamadas.some((c) => c.method === 'DELETE'));
}
{
  const db = fakeDb();
  const r = await expirarSeVencido(db, { id: 'x', pedido_id: 'y', forma: 'PIX', status: 'aguardando', valor: 1, expira_em: new Date(Date.now() + 60_000).toISOString() });
  ok('Pix dentro do prazo: intocado', r.status === 'aguardando' && db.escritas.length === 0);
}

rmSync(outDir, { recursive: true, force: true });
console.log(`\n${falhas ? `${falhas} FALHA(S)` : 'tudo OK'}`);
process.exit(falhas ? 1 : 0);
