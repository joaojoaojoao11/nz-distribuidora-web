// Autoteste do cupom no pedido — sem rede, sem banco.
//
// B7 do plano de indicação (21/10/2026): o desconto do cupom vai ao NZERP
// RATEADO por item (`items[].desconto`) e somado em `desconto_cupom`, para a
// NF-e sair com vDesc e o total igual ao que o cliente pagou. O que não pode
// quebrar em silêncio:
//   · a soma do rateio fecha EXATAMENTE no desconto, em centavos;
//   · nenhuma linha fica negativa; desconto maior que os itens é limitado;
//   · pedido SEM cupom sai sem nenhuma chave `desconto` nos itens
//     (o payload do pedido de sempre não muda);
//   · `total` continua sendo o que o cliente paga (itens − desconto + frete).
//
// Uso: npm run cupom:test

import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(join(ROOT, 'node_modules/.cache'), { recursive: true });
const outDir = mkdtempSync(join(ROOT, 'node_modules/.cache/nz-cupom-'));

const build = spawnSync(
  process.execPath,
  [
    join(ROOT, 'node_modules/esbuild/bin/esbuild'),
    'api/_lib/pedido/precificar.ts',
    'api/_lib/pedido/dinheiro.ts',
    'api/_lib/conta/completude.ts',
    'api/_lib/promoMotoDados.ts',
    'api/_lib/loja/visibilidade.ts',
    'api/_lib/precos/regraAcesso.ts',
    `--outdir=${outDir}`,
    '--outbase=api/_lib',
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

const { ratearDesconto, montarPayloadErp, resolverCupom, usosReservados, r2 } = await import(pathToFileURL(join(outDir, 'pedido/precificar.js')).href);

// ------------------------------------------------ banco do site, em memória
// Só o que resolverCupom/usosReservados usam: from().select().eq().is().neq()
// .or().maybeSingle(), e o count com head:true. O `.or(...)` entende o filtro
// de pagamento_status ("nulo, ou fora da lista") que a reserva usa.
function bancoFalso(tabelas) {
  return {
    from(nome) {
      let linhas = [...(tabelas[nome] ?? [])];
      let contar = false;
      const q = {
        select(_cols, opts) {
          contar = Boolean(opts?.count);
          return q;
        },
        eq(c, v) {
          linhas = linhas.filter((l) => l[c] === v);
          return q;
        },
        neq(c, v) {
          linhas = linhas.filter((l) => l[c] !== v);
          return q;
        },
        is(c, v) {
          linhas = linhas.filter((l) => (v === null ? l[c] == null : l[c] === v));
          return q;
        },
        or(expr) {
          const m = /^(\w+)\.is\.null,\1\.not\.in\.\(([^)]*)\)$/.exec(expr);
          if (!m) throw new Error('or() não suportado no teste: ' + expr);
          const lista = m[2].split(',');
          linhas = linhas.filter((l) => l[m[1]] == null || !lista.includes(l[m[1]]));
          return q;
        },
        maybeSingle: async () => ({ data: linhas[0] ?? null, error: null }),
        then(resolve, reject) {
          return Promise.resolve({ data: contar ? null : linhas, count: contar ? linhas.length : null, error: null }).then(resolve, reject);
        },
      };
      return q;
    },
  };
}

let falhas = 0;
const ok = (nome, cond, extra = '') => {
  console.log(`${cond ? '  OK  ' : ' FALHA'} ${nome}${extra ? ' — ' + extra : ''}`);
  if (!cond) falhas++;
};
const soma = (xs) => r2(xs.reduce((s, x) => s + x, 0));

console.log('\n=== RATEIO ===');
{
  ok('sem desconto: tudo zero', ratearDesconto([100, 200], 0).every((v) => v === 0));
  ok('sem itens: lista vazia', ratearDesconto([], 10).length === 0);
  const r = ratearDesconto([100, 100, 100], 10);
  ok('3 × 100 com R$ 10: soma fecha', soma(r) === 10, JSON.stringify(r));
  ok('3 × 100 com R$ 10: resto vai para a última', JSON.stringify(r) === '[3.33,3.33,3.34]', JSON.stringify(r));
  const p = ratearDesconto([1000, 250.5, 0.3], 62.54);
  ok('proporcional, 3 linhas, soma fecha', soma(p) === 62.54, JSON.stringify(p));
  ok('proporcional: nenhuma linha acima do próprio total', p.every((v, i) => v <= [1000, 250.5, 0.3][i]));
  const maior = ratearDesconto([10, 5], 100);
  ok('desconto maior que os itens: limitado à soma', soma(maior) === 15, JSON.stringify(maior));
  const unico = ratearDesconto([37.37], 5);
  ok('uma linha só leva tudo', unico[0] === 5);
  const neg = ratearDesconto([50, -10, 20], 7);
  ok('linha negativa conta como zero e não recebe', neg[1] === 0 && soma(neg) === 7, JSON.stringify(neg));
  // Muitas linhas pequenas: nenhum centavo se perde e nada fica negativo.
  const totais = Array.from({ length: 40 }, (_, i) => r2(0.01 * (i + 1)));
  const d = ratearDesconto(totais, 4.2);
  ok('40 linhas pequenas: soma fecha', soma(d) === 4.2, String(soma(d)));
  ok('40 linhas pequenas: nada negativo nem acima da linha', d.every((v, i) => v >= 0 && v <= totais[i] + 1e-9));
  // Centavos e valores "feios" de verdade (preço por metro × metragem).
  const feios = [r2(21.9 * 15), r2(1.9 * 0.5), r2(455.55 * 3)];
  const df = ratearDesconto(feios, r2(soma(feios) * 0.05));
  ok('5% sobre valores com centavos fecha ao centavo', soma(df) === r2(soma(feios) * 0.05), JSON.stringify(df));
}

console.log('\n=== PAYLOAD PARA O NZERP ===');
const perfil = {
  full_name: 'Cliente Teste',
  company_name: 'Loja Teste',
  phone: '11999999999',
  email: 'teste@example.com',
  cpf_cnpj: '12345678000199',
  ie: '',
  indicado_por: null,
  address_street: 'Rua A',
  address_number: '1',
  address_complement: '',
  address_neighborhood: 'Centro',
  address_city: 'Barueri',
  address_state: 'SP',
  address_zip: '06400000',
  asaas_customer_id: null,
  asaas_customer_env: null,
};
const linha = (sku, unitPrice, qtyMt, unidade = 'metro', qtd = qtyMt) => ({
  produto: { id: 'p-' + sku, slug: sku.toLowerCase(), nome: 'Produto ' + sku, codigo: null, erp_sku: sku, tipo_vinculo: 'direto', linha_key: 'ppf', shipping_profile_id: null },
  e: { sku, nome: 'Produto ' + sku, ativo: true, metragem_padrao: 15, preco_rolo: unitPrice * 15, preco_metro: unitPrice, saldo_ml: 100, unidade: 'ML' },
  item: { slug: sku.toLowerCase(), qtd, unidade, lpns: [] },
  unitPrice,
  qtyMt,
  total: r2(unitPrice * qtyMt),
});
const linhas = [linha('SKU1', 100, 10), linha('SKU2', 33.33, 3), linha('SKU3', 10, 1)];
const subtotal = soma(linhas.map((l) => l.total));

{
  const semCupom = montarPayloadErp({
    pedidoId: '00000000-0000-0000-0000-000000000001',
    siteUserId: null,
    perfil,
    linhas,
    total: r2(subtotal + 25),
    notas: 'x',
    cupom: null,
    afiliadoCodigo: null,
    frete: { tipo: 'CIF', valor: 25 },
  });
  ok('sem cupom: nenhum item tem a chave desconto', semCupom.items.every((i) => !('desconto' in i)));
  ok('sem cupom: desconto_cupom = 0', semCupom.desconto_cupom === 0);
  ok('sem cupom: cupom vazio e total = itens + frete', semCupom.cupom === '' && semCupom.total === r2(subtotal + 25));
  ok('sem cupom: itens a preço cheio', soma(semCupom.items.map((i) => i.total)) === subtotal);
  ok('sem cupom: nenhuma chave nova no item', Object.keys(semCupom.items[0]).sort().join(',') === 'availabilityTag,name,qty,sku,total,unit,unitPrice', Object.keys(semCupom.items[0]).join(','));

  const desconto = r2(subtotal * 0.05);
  const comCupom = montarPayloadErp({
    pedidoId: '00000000-0000-0000-0000-000000000002',
    siteUserId: null,
    perfil,
    linhas,
    total: r2(subtotal - desconto + 25),
    notas: 'x',
    cupom: 'TESTE5',
    afiliadoCodigo: null,
    frete: { tipo: 'CIF', valor: 25 },
    desconto,
  });
  ok('com cupom: desconto_cupom é o desconto', comCupom.desconto_cupom === desconto, `${comCupom.desconto_cupom} ≠ ${desconto}`);
  ok('com cupom: soma de items[].desconto fecha', soma(comCupom.items.map((i) => i.desconto ?? 0)) === desconto, JSON.stringify(comCupom.items.map((i) => i.desconto)));
  ok('com cupom: itens continuam a preço cheio', soma(comCupom.items.map((i) => i.total)) === subtotal);
  ok('com cupom: total = itens − desconto + frete', comCupom.total === r2(subtotal - desconto + 25));
  ok('com cupom: shipping_cost não leva desconto', comCupom.shipping_cost === 25);
  // A conferência que o NZERP faz em site_criar_pedido v3.
  const fecha = Math.abs(soma(comCupom.items.map((i) => i.total)) - comCupom.desconto_cupom + comCupom.shipping_cost - comCupom.total) <= 0.05;
  ok('com cupom: passa na conferência do NZERP (itens − desconto + frete = total)', fecha);

  const orcamento = montarPayloadErp({
    pedidoId: '00000000-0000-0000-0000-000000000003',
    siteUserId: null,
    perfil,
    linhas,
    total: r2(subtotal - 10),
    notas: 'x',
    cupom: 'DEZREAIS',
    afiliadoCodigo: null,
    frete: { tipo: 'FOB', valor: 0 },
    desconto: 10,
  });
  ok('orçamento (FOB, sem frete) com R$ 10: soma fecha', soma(orcamento.items.map((i) => i.desconto ?? 0)) === 10);
  ok('orçamento: total = itens − 10', orcamento.total === r2(subtotal - 10));

  const negativo = montarPayloadErp({
    pedidoId: '00000000-0000-0000-0000-000000000004',
    siteUserId: null,
    perfil,
    linhas,
    total: subtotal,
    notas: 'x',
    cupom: null,
    afiliadoCodigo: null,
    frete: { tipo: 'FOB', valor: 0 },
    desconto: -5,
  });
  ok('desconto negativo vira zero', negativo.desconto_cupom === 0 && negativo.items.every((i) => !('desconto' in i)));
}

console.log('\n=== B3: CUPOM COM DONO E CUPOM DE AFILIADO ===');
{
  const EU = 'u-eu';
  const OUTRO = 'u-outro';
  const AFILIADO = 'u-afiliado';
  const cupons = [
    { codigo: 'CAMPANHA10', tipo: 'campanha', desconto_pct: 10, desconto_valor: null, afiliado_user_id: null, dono_user_id: null, ativo: true, valido_de: null, valido_ate: null, limite_usos: null, usos: 0 },
    { codigo: 'NOMINAL50', tipo: 'campanha', desconto_pct: null, desconto_valor: 50, afiliado_user_id: null, dono_user_id: EU, ativo: true, valido_de: null, valido_ate: null, limite_usos: 1, usos: 0 },
    { codigo: 'NZ-AFIL1', tipo: 'afiliado', desconto_pct: 5, desconto_valor: null, afiliado_user_id: AFILIADO, dono_user_id: null, ativo: true, valido_de: null, valido_ate: null, limite_usos: null, usos: 0 },
  ];
  const db = bancoFalso({ cupons, pedidos: [] });
  const campanha = await resolverCupom(db, 'campanha10', 200, OUTRO);
  ok('cupom de campanha vale para qualquer um (10% de 200 = 20)', campanha.codigo === 'CAMPANHA10' && campanha.desconto === 20 && !campanha.invalido);
  const dono = await resolverCupom(db, 'NOMINAL50', 200, EU);
  ok('cupom nominal vale para o dono', dono.codigo === 'NOMINAL50' && dono.desconto === 50);
  const naoDono = await resolverCupom(db, 'NOMINAL50', 200, OUTRO);
  ok('cupom nominal NÃO vale para outra pessoa', naoDono.invalido && naoDono.codigo === null);
  const proprio = await resolverCupom(db, 'NZ-AFIL1', 200, AFILIADO);
  ok('ninguém usa o próprio cupom de afiliado', proprio.invalido);
  const indicado = await resolverCupom(db, 'NZ-AFIL1', 200, OUTRO);
  ok('o indicado usa o cupom do afiliado e o afiliado é atribuído', indicado.codigo === 'NZ-AFIL1' && indicado.afiliadoUserId === AFILIADO && indicado.desconto === 10);
  const vazio = await resolverCupom(db, '   ', 200, EU);
  ok('sem código: nada, e não é inválido', vazio.codigo === null && !vazio.invalido);
  const inexistente = await resolverCupom(db, 'NAOEXISTE', 200, EU);
  ok('código inexistente é inválido', inexistente.invalido);
}

console.log('\n=== B5: RESERVA DE USOS (orçamento e cobrança em aberto) ===');
{
  const cupons = [{ codigo: 'LIMITE2', tipo: 'campanha', desconto_pct: 10, desconto_valor: null, afiliado_user_id: null, dono_user_id: null, ativo: true, valido_de: null, valido_ate: null, limite_usos: 2, usos: 1 }];
  const pedidos = [
    // orçamento esperando o ERP faturar: RESERVA
    { id: 'p1', cupom: 'LIMITE2', cupom_consumido_em: null, status: 'SOLICITADO', pagamento_status: null },
    // já consumido no pagamento: NÃO conta como reserva (já está em usos)
    { id: 'p2', cupom: 'LIMITE2', cupom_consumido_em: '2026-10-21T10:00:00Z', status: 'APROVADO', pagamento_status: 'pago' },
    // Pix expirado: não segura
    { id: 'p3', cupom: 'LIMITE2', cupom_consumido_em: null, status: 'RASCUNHO', pagamento_status: 'expirado' },
    // cancelado: não segura
    { id: 'p4', cupom: 'LIMITE2', cupom_consumido_em: null, status: 'CANCELADO', pagamento_status: null },
    // outro cupom: não conta
    { id: 'p5', cupom: 'OUTRO', cupom_consumido_em: null, status: 'SOLICITADO', pagamento_status: null },
  ];
  const db = bancoFalso({ cupons, pedidos });
  ok('1 reserva viva (o orçamento p1)', (await usosReservados(db, 'LIMITE2')) === 1);
  const r = await resolverCupom(db, 'LIMITE2', 100, 'u-x');
  ok('limite 2 com 1 uso + 1 reserva → esgotado', r.invalido);
  const db2 = bancoFalso({ cupons, pedidos: pedidos.filter((p) => p.id !== 'p1') });
  const r2b = await resolverCupom(db2, 'LIMITE2', 100, 'u-x');
  ok('sem a reserva, o último uso ainda vale', !r2b.invalido && r2b.desconto === 10);
  const aguardando = bancoFalso({ cupons, pedidos: [{ id: 'p6', cupom: 'LIMITE2', cupom_consumido_em: null, status: 'RASCUNHO', pagamento_status: 'aguardando' }] });
  ok('cobrança em aberto (aguardando) também reserva', (await usosReservados(aguardando, 'LIMITE2')) === 1);
  const semLimite = bancoFalso({ cupons: [{ ...cupons[0], codigo: 'LIVRE', limite_usos: null }], pedidos });
  const livre = await resolverCupom(semLimite, 'LIVRE', 100, 'u-x');
  ok('cupom sem limite não consulta reserva e vale', !livre.invalido);
}

rmSync(outDir, { recursive: true, force: true });
console.log(falhas ? `\n${falhas} falha(s).` : '\nTudo certo.');
process.exit(falhas ? 1 : 0);
