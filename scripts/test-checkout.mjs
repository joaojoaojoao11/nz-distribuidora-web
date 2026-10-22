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
    'api/_lib/avisos.ts',
    'api/_lib/email.ts',
    'api/_lib/garantias/emails.ts',
    'api/_lib/garantias/dados.ts',
    'api/_lib/conta/documento.ts',
    'api/_lib/handlers/asaas.ts',
    'api/_lib/pedido/precificar.ts',
    'api/_lib/pedido/despachoErp.ts',
    // `precificar` importa daqui desde que as seleções passaram a precisar da
    // mesma régua de arredondamento.
    'api/_lib/pedido/dinheiro.ts',
    'api/_lib/conta/completude.ts',
    // `precificar` importa os dois abaixo (Promoção Moto; peça e agendamento
    // da coleção). Sem eles na lista, o import quebrava antes do 1º teste.
    'api/_lib/promoMotoDados.ts',
    'api/_lib/loja/visibilidade.ts',
    // `precificar` aplica o preço por tipo de acesso (20/10/2026).
    'api/_lib/precos/regraAcesso.ts',
    // `pagamento` registra o uso do cupom e `precificar` confere o limite por
    // cliente (Fase 2 do plano de indicação, 21/10/2026).
    'api/_lib/incentivos/cupomUsos.ts',
    // Fase 3 (21/10/2026): saldo da carteira no checkout — `pagamento` devolve
    // a reserva quando a cobrança morre; a regra de quanto usar é pura.
    'api/_lib/incentivos/saldoCheckout.ts',
    'api/_lib/incentivos/carteira.ts',
    // `pagamento` abre ocorrência quando o pedido pago fica retido (varredura 22/10).
    'api/_lib/ocorrencias.ts',
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
      neq: () => b, in: () => b, gte: () => b, gt: () => b, lt: () => b, lte: () => b, is: () => b, not: () => b, or: () => b, order: () => b, limit: () => b, range: () => b,
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

const { criarPagamento, parcelasDisponiveis, statusDoEvento, statusDoAsaas, expirarSeVencido, marcarPago, valorConfere, aplicarStatus } = await import(pathToFileURL(join(outDir, 'asaas/pagamento.js')).href);
const { somarDiasUteis, hojeBr, ipDoCliente, sanitizarPagamento } = await import(pathToFileURL(join(outDir, 'asaas/cliente.js')).href);
const { normalizarItens, precificar, montarPayloadErp, itensParaGravar, notaPreVenda } = await import(pathToFileURL(join(outDir, 'pedido/precificar.js')).href);
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
ok('valor confere: cobrança única é o próprio valor', valorConfere({ valor: 100, parcelas: 1 }, 100) && !valorConfere({ valor: 100, parcelas: 1 }, 99.9));
ok('valor confere: 6x de R$ 3.005,27 aceita 500,87 e a última 500,92', valorConfere({ valor: 3005.27, parcelas: 6 }, 500.87) && valorConfere({ valor: 3005.27, parcelas: 6 }, 500.92));
ok('valor confere: parcela de outro valor não passa, nem o total', !valorConfere({ valor: 3005.27, parcelas: 6 }, 480) && !valorConfere({ valor: 3005.27, parcelas: 6 }, 3005.27));
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
  respostas = [
    // 3x: o Asaas devolve a 1ª parcela (value = parcela, netValue = líquido DA PARCELA) e o id do parcelamento.
    { status: 200, json: PAGAMENTO_DOC({ billingType: 'CREDIT_CARD', status: 'CONFIRMED', value: 300, netValue: 290.4, installment: 'ins_3x', installmentNumber: 1, confirmedDate: '2026-09-07', creditCard: { creditCardNumber: '8829', creditCardBrand: 'MASTERCARD', creditCardToken: 'a75a1d98-token' } }) },
    // marcarPago soma o líquido das 3 parcelas.
    { status: 200, json: { data: [{ id: 'pay_a', value: 300, netValue: 290.4 }, { id: 'pay_b', value: 300, netValue: 290.4 }, { id: 'pay_c', value: 300, netValue: 290.4 }] } },
  ];
  chamadas.length = 0;
  const r = await criarPagamento(db, { pedido: { id: 'ped-3', numero: 103 }, perfil: PERFIL, asaasCustomerId: 'cus_000005401844', forma: 'CREDIT_CARD', total: 900, parcelas: 3, cartao: CARTAO, ip: '200.1.2.3', cfg: CFG });
  const post = chamadas[0].body;
  ok('cartão 3x: guarda o id do parcelamento e busca as parcelas em GET /payments?installment=', db.tabelas.pagamentos[0].asaas_installment_id === 'ins_3x' && chamadas[1]?.url.includes('/payments?installment=ins_3x'));
  ok('cartão 3x: líquido = soma das 3 parcelas (871,20), não o da 1ª (290,40)', db.tabelas.pagamentos[0].valor_liquido === 871.2);
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

// ================================================= WEBHOOK: CARTÃO PARCELADO
console.log('\n=== WEBHOOK: CARTÃO PARCELADO ===');
const PARCELADO = () => ({ pagamentos: [{ id: 'pg-6x', pedido_id: 'ped-10', asaas_payment_id: 'pay_p1', asaas_installment_id: 'ins_6x', forma: 'CREDIT_CARD', status: 'pago', valor: 3005.27, parcelas: 6, valor_liquido: 2900, estornado_valor: 0 }], pedidos: [{ id: 'ped-10', cupom: null, pagamento_status: 'pago' }] });
{
  const db = fakeDb(PARCELADO());
  respostas = [{ status: 200, json: PAGAMENTO_DOC({ id: 'pay_p1', billingType: 'CREDIT_CARD', status: 'CONFIRMED', value: 500.87, installment: 'ins_6x', installmentNumber: 1, externalReference: 'ped-10' }) }];
  const r = await webhook.processar(db, 'PAYMENT_CONFIRMED', { id: 'pay_p1', value: 500.87, installment: 'ins_6x', installmentNumber: 1 });
  ok('parcela 1 (500,87 de 3.005,27): aceita, sem erro, pedido ligado', !r.erro && r.pedidoId === 'ped-10' && r.parcela === 1 && db.tabelas.pagamentos[0].status === 'pago');
}
{
  const db = fakeDb(PARCELADO());
  respostas = [{ status: 200, json: PAGAMENTO_DOC({ id: 'pay_p6', billingType: 'CREDIT_CARD', status: 'RECEIVED', value: 500.92, installment: 'ins_6x', installmentNumber: 6, externalReference: 'ped-10' }) }];
  const r = await webhook.processar(db, 'PAYMENT_RECEIVED', { id: 'pay_p6', value: 500.92, installment: 'ins_6x', installmentNumber: 6 });
  ok('parcela irmã (outro pay_, mesmo installment): reconhecida pelo parcelamento', !r.erro && r.pedidoId === 'ped-10' && r.parcela === 6 && db.tabelas.pagamentos[0].ultimo_evento === 'PAYMENT_RECEIVED');
}
{
  const db = fakeDb(PARCELADO());
  respostas = [{ status: 200, json: PAGAMENTO_DOC({ id: 'pay_p3', billingType: 'CREDIT_CARD', status: 'CONFIRMED', value: 480, installment: 'ins_6x', installmentNumber: 3, externalReference: 'ped-10' }) }];
  const r = await webhook.processar(db, 'PAYMENT_CONFIRMED', { id: 'pay_p3', value: 480, installment: 'ins_6x' });
  ok('parcela com valor errado (480): erro, e o erro fala da parcela', /parcela de 6/.test(r.erro ?? ''));
}
{
  // Pagamento gravado antes da coluna existir (pedido #10 real): sem installment id.
  const dados = PARCELADO();
  dados.pagamentos[0].asaas_installment_id = null;
  const db = fakeDb(dados);
  respostas = [{ status: 200, json: PAGAMENTO_DOC({ id: 'pay_p2', billingType: 'CREDIT_CARD', status: 'CONFIRMED', value: 500.87, installment: 'ins_6x', installmentNumber: 2, externalReference: 'ped-10' }) }];
  const r = await webhook.processar(db, 'PAYMENT_CONFIRMED', { id: 'pay_p2', value: 500.87, installment: 'ins_6x', externalReference: 'ped-10' });
  ok('parcelado antigo sem o id: casa pelo pedido e guarda o id do parcelamento', !r.erro && r.pedidoId === 'ped-10' && db.tabelas.pagamentos[0].asaas_installment_id === 'ins_6x');
}
{
  const db = fakeDb(PARCELADO());
  const estorno = (n, v) => [{ status: 200, json: PAGAMENTO_DOC({ id: `pay_p${n}`, billingType: 'CREDIT_CARD', status: 'REFUNDED', value: v, installment: 'ins_6x', installmentNumber: n, externalReference: 'ped-10' }) }];
  respostas = estorno(1, 500.87);
  await webhook.processar(db, 'PAYMENT_REFUNDED', { id: 'pay_p1', installment: 'ins_6x' });
  ok('estorno de UMA parcela: soma no estornado_valor e continua pago', db.tabelas.pagamentos[0].status === 'pago' && db.tabelas.pagamentos[0].estornado_valor === 500.87);
  for (const [n, v] of [[2, 500.87], [3, 500.87], [4, 500.87], [5, 500.87], [6, 500.92]]) {
    respostas = estorno(n, v);
    await webhook.processar(db, 'PAYMENT_REFUNDED', { id: `pay_p${n}`, installment: 'ins_6x' });
  }
  ok('estorno das 6 parcelas: vira estornado e o pedido também', db.tabelas.pagamentos[0].status === 'estornado' && db.tabelas.pedidos[0].pagamento_status === 'estornado', JSON.stringify({ pag: db.tabelas.pagamentos.map((x) => x.status), ped: db.tabelas.pedidos.map((x) => x.pagamento_status) }));
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

// ============================================ peça (unidade 'un') — coleção
console.log('\n=== PEÇA (UN) E AGENDAMENTO ===');
{
  const n = normalizarItens([
    { slug: 'cam-g', qtd: 2.6, unidade: 'un' },
    { slug: 'cam-gg', qtd: 99, unidade: 'un' },
    { slug: 'cam-p', qtd: 0.4, unidade: 'un' },
    { slug: 'x', qtd: 1, unidade: 'caixa' },
  ]);
  ok('peça: arredonda para inteiro', n.find((i) => i.slug === 'cam-g')?.qtd === 3);
  ok('peça: teto de 10 por item', n.find((i) => i.slug === 'cam-gg')?.qtd === 10);
  ok('peça: mínimo 1', n.find((i) => i.slug === 'cam-p')?.qtd === 1);
  ok('unidade desconhecida continua descartada', !n.some((i) => i.slug === 'x'));
}
{
  const futuro = new Date(Date.now() + 86_400_000).toISOString();
  const passado = new Date(Date.now() - 86_400_000).toISOString();
  const db = fakeDb({
    produtos: [
      { id: 'p1', slug: 'cam-g', nome: 'Camiseta G', erp_sku: 'NZPPFCAM01G', tipo_vinculo: 'proprio', linha_key: 'vestuario', publicar_em: passado },
      { id: 'p2', slug: 'cam-agendada', nome: 'Camiseta M', erp_sku: 'NZPPFCAM01M', tipo_vinculo: 'proprio', linha_key: 'vestuario', publicar_em: futuro },
      { id: 'p3', slug: 'rolo-x', nome: 'Rolo X', erp_sku: 'ROLO1', tipo_vinculo: 'proprio', linha_key: 'ppf', publicar_em: null },
      { id: 'p4', slug: 'espatula', nome: 'Espátula', erp_sku: 'NZE01', tipo_vinculo: 'proprio', linha_key: 'diversos', publicar_em: null },
    ],
    erp_produtos: [
      { sku: 'NZPPFCAM01G', nome: 'CAMISETA NZPPF 2026 Nº 01 TRUE PROTECT G', ativo: true, metragem_padrao: 1, preco_rolo: 189, preco_metro: 189, saldo_ml: 0, unidade: 'UN' },
      { sku: 'NZPPFCAM01M', nome: 'CAMISETA NZPPF 2026 Nº 01 TRUE PROTECT M', ativo: true, metragem_padrao: 1, preco_rolo: 189, preco_metro: 189, saldo_ml: 0, unidade: 'UN' },
      { sku: 'ROLO1', nome: 'ROLO X 1,52 X 15M', ativo: true, metragem_padrao: 15, preco_rolo: 3000, preco_metro: 250, saldo_ml: 40, unidade: 'ML' },
      { sku: 'NZE01', nome: 'ESPÁTULA', ativo: true, metragem_padrao: 0.2, preco_rolo: 30, preco_metro: 30, saldo_ml: 5, unidade: 'UN' },
    ],
    loja_config: [{ id: 1 }],
  });

  const a = await precificar(db, [{ slug: 'cam-g', qtd: 2, unidade: 'un' }, { slug: 'rolo-x', qtd: 1, unidade: 'rolo' }]);
  const cam = a.linhas.find((l) => l.produto.slug === 'cam-g');
  const rolo = a.linhas.find((l) => l.produto.slug === 'rolo-x');
  ok('peça: preço por peça = preco_rolo', cam?.unitPrice === 189 && cam?.qtyMt === 2 && cam?.total === 378);
  ok('rolo continua em metros (15 m × 200/m)', rolo?.qtyMt === 15 && rolo?.unitPrice === 200 && rolo?.total === 3000);
  ok('subtotal soma os dois', a.subtotal === 3378 && a.invalidos.length === 0);

  const payload = montarPayloadErp({ pedidoId: 'ped-x', perfil: PERFIL, linhas: a.linhas, total: 3378, notas: '', cupom: null, afiliadoCodigo: null, frete: { tipo: 'CIF', valor: 0, transportadora: '', prazoDias: 0 } });
  const itCam = payload.items.find((i) => i.sku === 'NZPPFCAM01G');
  const itRolo = payload.items.find((i) => i.sku === 'ROLO1');
  ok('ERP: peça vai como UN, qty = peças, nome do ERP com o tamanho', itCam?.unit === 'UN' && itCam?.qty === 2 && itCam?.unitPrice === 189 && itCam?.name.endsWith(' G'));
  ok('ERP: peça sem estoque vai como DROP', itCam?.availabilityTag === 'DROP');
  ok('ERP: rolo segue MT e "(1 rolo fechado)"', itRolo?.unit === 'MT' && /1 rolo fechado/.test(itRolo?.name ?? ''));
  const gravar = itensParaGravar('ped-x', a.linhas);
  ok('pedido_itens: peça grava unidade un e preço por peça', gravar.some((g) => g.unidade === 'un' && g.preco_unit_estimado === 189 && g.qtd === 2));
  const nota = notaPreVenda(a.linhas, 5);
  ok('nota de pré-venda cita o SKU e os dias de produção', Boolean(nota) && nota.includes('NZPPFCAM01G ×2') && nota.includes('5 dias úteis'));
  ok('rolo com estoque não gera nota de pré-venda', notaPreVenda([rolo]) === null);

  const b = await precificar(db, [{ slug: 'cam-g', qtd: 1, unidade: 'metro' }, { slug: 'rolo-x', qtd: 1, unidade: 'un' }]);
  ok('camiseta como metro é recusada; rolo como peça também', b.linhas.length === 0 && b.invalidos.includes('cam-g') && b.invalidos.includes('rolo-x'));

  const c = await precificar(db, [{ slug: 'cam-agendada', qtd: 1, unidade: 'un' }]);
  ok('agendado: cliente não precifica', c.linhas.length === 0 && c.invalidos.includes('cam-agendada'));
  const d = await precificar(db, [{ slug: 'cam-agendada', qtd: 1, unidade: 'un' }], { admin: true });
  ok('agendado: admin precifica (prévia)', d.linhas.length === 1 && d.subtotal === 189);

  const e = await precificar(db, [{ slug: 'espatula', qtd: 1, unidade: 'un' }]);
  ok('peça com metragem ≠ 1 fica de fora (o Tiny dividiria a quantidade)', e.linhas.length === 0 && e.invalidos.includes('espatula'));
}

// ======================================== preço por TIPO DE ACESSO no pedido
console.log('\n=== PREÇO POR TIPO DE ACESSO (checkout = vitrine) ===');
{
  const { precoParaAcesso, montarRegras } = await import(pathToFileURL(join(outDir, 'precos/regraAcesso.js')).href);
  const regrasRows = [
    { papel: 'reseller', linha_key: null, base: 'atacado', percentual: 0 },
    { papel: 'lojista', linha_key: null, base: 'atacado', percentual: 10 },
    { papel: 'client', linha_key: null, base: 'varejo', percentual: 0 },
    { papel: 'client', linha_key: 'ppf', base: 'varejo', percentual: 20 },
  ];
  const db = fakeDb({
    precos_acesso: regrasRows,
    produtos: [
      { id: 'p1', slug: 'rolo-ppf', nome: 'Rolo PPF', erp_sku: 'PPF1', tipo_vinculo: 'proprio', linha_key: 'ppf', publicar_em: null },
      { id: 'p2', slug: 'wrap-x', nome: 'Wrap X', erp_sku: 'WRAP1', tipo_vinculo: 'proprio', linha_key: 'avery', publicar_em: null },
    ],
    erp_produtos: [
      { sku: 'PPF1', nome: 'PPF 15M', ativo: true, metragem_padrao: 15, preco_rolo: 3000, preco_metro: 250, preco_rolo_varejo: 4000, preco_metro_varejo: 330, saldo_ml: 40, unidade: 'ML' },
      { sku: 'WRAP1', nome: 'WRAP 10M', ativo: true, metragem_padrao: 10, preco_rolo: 1000, preco_metro: 100, preco_rolo_varejo: 1500, preco_metro_varejo: 140, saldo_ml: 20, unidade: 'ML' },
    ],
    loja_config: [{ id: 1 }],
  });
  const itensRolo = [{ slug: 'rolo-ppf', qtd: 1, unidade: 'rolo' }];
  const cli = await precificar(db, itensRolo, { papel: 'client' });
  ok('cliente final, linha ppf (varejo +20%): rolo R$ 4.800 → R$ 320/m', cli.linhas[0]?.precoRolo === 4800 && cli.linhas[0]?.unitPrice === 320 && cli.subtotal === 4800);
  const loj = await precificar(db, itensRolo, { papel: 'lojista' });
  ok('lojista (atacado +10%): rolo R$ 3.300 → R$ 220/m', loj.linhas[0]?.precoRolo === 3300 && loj.linhas[0]?.unitPrice === 220);
  const rev = await precificar(db, itensRolo, { papel: 'reseller' });
  ok('revendedor (atacado 0%): R$ 3.000 → R$ 200/m', rev.linhas[0]?.precoRolo === 3000 && rev.linhas[0]?.unitPrice === 200);
  const adm = await precificar(db, itensRolo, { admin: true, papel: 'admin' });
  ok('admin compra pela base (atacado), sem percentual', adm.linhas[0]?.unitPrice === 200);
  const semPapel = await precificar(db, itensRolo, {});
  ok('sem papel informado = cliente final (o mais alto)', semPapel.linhas[0]?.precoRolo === 4800);
  const metroCli = await precificar(db, [{ slug: 'wrap-x', qtd: 3, unidade: 'metro' }], { papel: 'client' });
  ok('metro, cliente final, linha sem regra → varejo geral: R$ 140/m', metroCli.linhas[0]?.unitPrice === 140 && metroCli.subtotal === 420);
  const metroLoj = await precificar(db, [{ slug: 'wrap-x', qtd: 3, unidade: 'metro' }], { papel: 'lojista' });
  ok('metro, lojista: R$ 110/m', metroLoj.linhas[0]?.unitPrice === 110);
  const gravar = itensParaGravar('ped-z', cli.linhas);
  ok('pedido_itens guarda o preço DO TIPO (4.800), não o atacado cru', gravar[0]?.preco_unit_estimado === 4800);
  const regras = montarRegras(regrasRows);
  ok('checkout = vitrine: a mesma função dá o mesmo número', precoParaAcesso(regras, 'client', { atacado: 3000, varejo: 4000 }, 'ppf') === cli.linhas[0]?.precoRolo);
  const payload = montarPayloadErp({ pedidoId: 'ped-z', perfil: PERFIL, linhas: cli.linhas, total: cli.subtotal, notas: '', cupom: null, afiliadoCodigo: null, frete: { tipo: 'CIF', valor: 0, transportadora: '', prazoDias: 0 } });
  ok('o NZERP recebe o preço cobrado (R$ 320/m), e o orçamento fecha com o pagamento', payload.items[0]?.unitPrice === 320 && payload.items[0]?.total === 4800);

  // Visibilidade por tipo: linha oculta e "não compra rolo" viram item inválido no pedido.
  db.tabelas.acesso_config = [{ papel: 'client', linhas_ocultas: ['avery'], ve_rolo: false, ve_metro: true, ve_estoque: false, ve_promocao: true, pagamento_online: true }];
  const ocultoCli = await precificar(db, [{ slug: 'wrap-x', qtd: 2, unidade: 'metro' }], { papel: 'client' });
  ok('linha oculta para o tipo: item inválido no pedido', ocultoCli.linhas.length === 0 && ocultoCli.invalidos.includes('wrap-x'));
  const semRolo = await precificar(db, itensRolo, { papel: 'client' });
  ok('tipo que não compra rolo fechado: rolo inválido', semRolo.linhas.length === 0 && semRolo.invalidos.includes('rolo-ppf'));
  const metroOk = await precificar(db, [{ slug: 'rolo-ppf', qtd: 2, unidade: 'metro' }], { papel: 'client' });
  ok('…mas o metro da mesma linha continua valendo', metroOk.linhas.length === 1 && metroOk.linhas[0].unitPrice === 396);
  const lojOk = await precificar(db, [{ slug: 'wrap-x', qtd: 2, unidade: 'metro' }], { papel: 'lojista' });
  ok('a regra é por tipo: lojista compra a linha normalmente', lojOk.linhas.length === 1);
}

// ======================================== FASE 3: SALDO DA CARTEIRA
console.log('\n=== FASE 3: SALDO DA CARTEIRA NO CHECKOUT ===');
{
  const { calcularUsoDeSaldo, devolverSaldoDoPedido } = await import(pathToFileURL(join(outDir, 'incentivos/saldoCheckout.js')).href);
  const { devolverDebito, apagarReserva } = await import(pathToFileURL(join(outDir, 'incentivos/carteira.js')).href);
  const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  ok('regra: sem saldo → cobra tudo', igual(calcularUsoDeSaldo(340.46, 0, 5), { usar: 0, cobrar: 340.46 }));
  ok('regra: saldo cobre tudo → cobra 0 (pedido nasce pago)', igual(calcularUsoDeSaldo(340.46, 400, 5), { usar: 340.46, cobrar: 0 }));
  ok('regra: saldo parcial → cobra o resto', igual(calcularUsoDeSaldo(340.46, 100, 5), { usar: 100, cobrar: 240.46 }));
  ok('regra: resto abaixo da cobrança mínima (R$ 5) → segura saldo para a cobrança valer 5', igual(calcularUsoDeSaldo(100, 97, 5), { usar: 95, cobrar: 5 }));
  ok('regra: saldo exatamente igual ao total → tudo pelo saldo', igual(calcularUsoDeSaldo(100, 100, 5), { usar: 100, cobrar: 0 }));
  ok('regra: centavos fecham', igual(calcularUsoDeSaldo(99.99, 50.5, 5), { usar: 50.5, cobrar: 49.49 }));
  ok('regra: mínimo zero → usa tudo que der', igual(calcularUsoDeSaldo(100, 97, 0), { usar: 97, cobrar: 3 }));

  // Devolução da reserva: uma vez só, por mais que se peça.
  const db = fakeDb({
    pedidos: [{ id: 'ped-s', numero: 1, user_id: 'u1', saldo_usado: 50, saldo_movimento_id: 7, saldo_devolvido_em: null }],
    carteira_movimentos: [{ id: 7, user_id: 'u1', tipo: 'uso_compra', valor: -50, status: 'disponivel', pedido_id: 'ped-s' }],
  });
  const d1 = await devolverSaldoDoPedido(db, 'ped-s', 'teste');
  ok('devolver: estorno positivo apontando o débito e pedido marcado', d1 === true && db.tabelas.carteira_movimentos.some((m) => m.tipo === 'estorno' && m.valor === 50 && m.referencia_id === 7 && m.status === 'disponivel') && Boolean(db.tabelas.pedidos[0].saldo_devolvido_em));
  const d2 = await devolverSaldoDoPedido(db, 'ped-s', 'teste');
  ok('devolver de novo: nada acontece', d2 === false && db.tabelas.carteira_movimentos.filter((m) => m.tipo === 'estorno').length === 1);
  ok('devolverDebito direto no mesmo débito: também não dobra', (await devolverDebito(db, 7, 'x')) === false);
  ok('devolverDebito num crédito: recusa', (await devolverDebito(fakeDb({ carteira_movimentos: [{ id: 1, tipo: 'comissao_ativacao', valor: 10 }] }), 1, 'x')) === false);

  // Pagamento que morre (Pix expirado) devolve o saldo reservado.
  const db2 = fakeDb({
    pedidos: [{ id: 'ped-e', numero: 2, user_id: 'u1', pagamento_status: 'aguardando', saldo_usado: 20, saldo_movimento_id: 9, saldo_devolvido_em: null }],
    pagamentos: [{ id: 'pg-e', pedido_id: 'ped-e', forma: 'PIX', status: 'aguardando', valor: 80, parcelas: 1 }],
    carteira_movimentos: [{ id: 9, user_id: 'u1', tipo: 'uso_compra', valor: -20, status: 'disponivel', pedido_id: 'ped-e' }],
  });
  await aplicarStatus(db2, db2.tabelas.pagamentos[0], 'expirado', 'teste');
  ok('Pix expirado: pedido expirado e saldo devolvido', db2.tabelas.pedidos[0].pagamento_status === 'expirado' && Boolean(db2.tabelas.pedidos[0].saldo_devolvido_em) && db2.tabelas.carteira_movimentos.some((m) => m.tipo === 'estorno' && m.valor === 20));
  await aplicarStatus(db2, { ...db2.tabelas.pagamentos[0], status: 'aguardando' }, 'cancelado', 'teste');
  ok('cancelar depois de expirar não devolve duas vezes', db2.tabelas.carteira_movimentos.filter((m) => m.tipo === 'estorno').length === 1);

  // Varredura 22/10: boleto vencido ainda se paga (multa e juros) — o saldo FICA reservado.
  const db5 = fakeDb({
    pedidos: [{ id: 'ped-b', numero: 3, user_id: 'u1', pagamento_status: 'aguardando', saldo_usado: 30, saldo_movimento_id: 11, saldo_devolvido_em: null }],
    pagamentos: [{ id: 'pg-b', pedido_id: 'ped-b', asaas_payment_id: 'pay_b', forma: 'BOLETO', status: 'aguardando', valor: 70, parcelas: 1 }],
    carteira_movimentos: [{ id: 11, user_id: 'u1', tipo: 'uso_compra', valor: -30, status: 'disponivel', pedido_id: 'ped-b' }],
  });
  await aplicarStatus(db5, { ...db5.tabelas.pagamentos[0] }, 'vencido', 'PAYMENT_OVERDUE');
  ok('boleto vencido: pedido vencido, mas o saldo continua reservado', db5.tabelas.pedidos[0].pagamento_status === 'vencido' && !db5.tabelas.pedidos[0].saldo_devolvido_em && !db5.tabelas.carteira_movimentos.some((m) => m.tipo === 'estorno'));

  // Evento da cobrança ANTIGA não manda no pedido: a vigente é a mais nova.
  const db6 = fakeDb({
    pedidos: [{ id: 'ped-n', numero: 4, user_id: 'u1', pagamento_status: 'aguardando', saldo_usado: 0 }],
    // O duplo não ordena: a vigente (mais nova) vem primeiro, como faria o order desc.
    pagamentos: [
      { id: 'pg-nova', pedido_id: 'ped-n', forma: 'PIX', status: 'aguardando', valor: 50, parcelas: 1, criado_em: '2026-10-22T12:00:00Z' },
      { id: 'pg-velha', pedido_id: 'ped-n', forma: 'BOLETO', status: 'aguardando', valor: 50, parcelas: 1, criado_em: '2026-10-20T12:00:00Z' },
    ],
  });
  await aplicarStatus(db6, { ...db6.tabelas.pagamentos[1] }, 'vencido', 'PAYMENT_OVERDUE');
  ok('evento da cobrança antiga: a linha dela muda, o pedido não', db6.tabelas.pagamentos[1].status === 'vencido' && db6.tabelas.pedidos[0].pagamento_status === 'aguardando');

  // Pago depois de o saldo ter voltado, e a pessoa já gastou: pedido RETIDO, nada ao ERP.
  const db7 = fakeDb({
    pedidos: [{ id: 'ped-r', numero: 5, user_id: 'u1', cupom: null, pagamento_status: 'cancelado', erp_envio: 'pendente', saldo_usado: 25, saldo_movimento_id: 12, saldo_devolvido_em: '2026-10-21T10:00:00Z' }],
    pagamentos: [{ id: 'pg-r', pedido_id: 'ped-r', forma: 'PIX', status: 'cancelado', valor: 75, parcelas: 1 }],
    carteira_movimentos: [],
  });
  const rpcOriginal = db7.rpc;
  db7.rpc = async (nome, args) => (nome === 'carteira_reservar_uso' ? { data: null, error: { message: 'saldo-insuficiente' } } : rpcOriginal(nome, args));
  await marcarPago(db7, { ...db7.tabelas.pagamentos[0] }, 'PAYMENT_RECEIVED', { status: 'RECEIVED', value: 75 });
  ok('pago com o saldo já devolvido e gasto: pedido retido e ocorrência aberta', db7.tabelas.pedidos[0].pagamento_status === 'pago' && db7.tabelas.pedidos[0].erp_envio === 'retido' && (db7.tabelas.ocorrencias ?? []).some((o) => o.tipo === 'carteira'), JSON.stringify({ envio: db7.tabelas.pedidos[0].erp_envio, oc: (db7.tabelas.ocorrencias ?? []).length }));
  // …e quando ainda há saldo, reserva de novo e segue.
  const db8 = fakeDb({
    pedidos: [{ id: 'ped-q', numero: 6, user_id: 'u1', cupom: null, pagamento_status: 'cancelado', erp_envio: 'pendente', saldo_usado: 25, saldo_movimento_id: 13, saldo_devolvido_em: '2026-10-21T10:00:00Z' }],
    pagamentos: [{ id: 'pg-q', pedido_id: 'ped-q', forma: 'PIX', status: 'cancelado', valor: 75, parcelas: 1 }],
    carteira_movimentos: [],
  });
  db8.rpc = async (nome) => (nome === 'carteira_reservar_uso' ? { data: 99, error: null } : { data: true, error: null });
  await marcarPago(db8, { ...db8.tabelas.pagamentos[0] }, 'PAYMENT_RECEIVED', { status: 'RECEIVED', value: 75 });
  ok('pago com o saldo já devolvido, ainda disponível: reserva de novo (sem reter)', db8.tabelas.pedidos[0].saldo_movimento_id === 99 && !db8.tabelas.pedidos[0].saldo_devolvido_em && db8.tabelas.pedidos[0].erp_envio !== 'retido', JSON.stringify(db8.tabelas.pedidos[0]));

  // Pedido que não nasceu (cobrança falhou): a reserva some sem rastro.
  const db3 = fakeDb({ carteira_movimentos: [{ id: 3, tipo: 'uso_compra', valor: -10 }] });
  await apagarReserva(db3, 3);
  ok('reserva de pedido que não nasceu é apagada', db3.tabelas.carteira_movimentos.length === 0);
  const db4 = fakeDb({ carteira_movimentos: [{ id: 4, tipo: 'uso_compra', valor: -10 }, { id: 5, tipo: 'estorno', valor: 10, referencia_id: 4 }] });
  await apagarReserva(db4, 4);
  ok('reserva já devolvida não é apagada', db4.tabelas.carteira_movimentos.length === 2);

  // O ERP recebe o saldo usado (e só quando há).
  const comSaldo = montarPayloadErp({ pedidoId: 'p', perfil: PERFIL, linhas: [], total: 100, notas: '', cupom: null, afiliadoCodigo: null, frete: { tipo: 'CIF', valor: 0, transportadora: '', prazoDias: 0 }, cashbackUsado: 40 });
  const semSaldo = montarPayloadErp({ pedidoId: 'p', perfil: PERFIL, linhas: [], total: 100, notas: '', cupom: null, afiliadoCodigo: null, frete: { tipo: 'CIF', valor: 0, transportadora: '', prazoDias: 0 } });
  ok('payload ao ERP: cashback_usado só quando há saldo usado', comSaldo.cashback_usado === 40 && !('cashback_usado' in semSaldo));
}

rmSync(outDir, { recursive: true, force: true });
console.log(`\n${falhas ? `${falhas} FALHA(S)` : 'tudo OK'}`);
process.exit(falhas ? 1 : 0);
