// Autoteste da ponte site → NZERP — sem rede, sem navegador, sem banco.
//
// Três coisas aqui não podem quebrar em silêncio, e são justamente as que um
// teste de tela nunca pegaria:
//
//   1. **A regra.** O NZERP só recebe pedido PAGO. Um Pix gerado e não pago não
//      pode virar orçamento lá dentro por caminho nenhum — só o admin passa por
//      cima, e de propósito.
//   2. **A trava.** Webhook, cron e a tela podem despachar o mesmo pedido no
//      mesmo segundo. O compare-and-swap em `pedidos.erp_envio` tem que deixar
//      UM passar e só um. Isto substitui o índice único que NÃO existe no ERP,
//      porque lá é somente leitura.
//   3. **A lista branca.** `erpHistorico.ts` é o único módulo que lê `quotes`,
//      `faturamento` e `contas_receber`. Um `select('*')` distraído ali vaza
//      custo, margem, limite de crédito e histórico de cobrança para a tela do
//      cliente. O teste lê o ARQUIVO e reprova.
//
// Uso: npm run erp:test

import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(join(ROOT, 'node_modules/.cache'), { recursive: true });
const outDir = mkdtempSync(join(ROOT, 'node_modules/.cache/nz-erp-'));

let falhas = 0;
const ok = (nome, cond, extra = '') => {
  console.log(`${cond ? '  OK  ' : ' FALHA'} ${nome}${extra ? ' — ' + extra : ''}`);
  if (!cond) falhas++;
};

// ================================================== 1. lista branca (no fonte)
console.log('\n=== LISTA BRANCA DO HISTÓRICO ===');
const fonteBruta = readFileSync(join(ROOT, 'api/_lib/conta/erpHistorico.ts'), 'utf8');
// Os comentários deste módulo FALAM de `select('*')` e de `limite_de_credito`
// para explicar por que são proibidos. Se o teste lesse o comentário, ele
// reprovaria a própria documentação — então o que vale é só o código.
const fonteHistorico = fonteBruta.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ 	]*\/\/.*$/gm, '');

ok('nenhum select("*") no código do histórico', !/select\(\s*['"`]\s*\*/.test(fonteHistorico));
ok('nenhum select() sem argumento', !/\.select\(\s*\)/.test(fonteHistorico));

// Todo `.select()` FEITO NO ERP tem que usar uma constante de lista branca. Os
// selects no banco do site (uma coluna de `user_profiles`, uma de
// `erp_titulo_dono`) não são o risco — o risco é ler as tabelas do ERP.
const statementsErp = fonteHistorico.split(';').filter((st) => /(^|[^A-Za-z0-9_])erp\s*\.from\(/.test(st.replace(/\s+/g, ' ')));
const selectsErp = statementsErp.flatMap((st) => [...st.matchAll(/\.select\(([^)]*)\)/g)].map((m) => m[1].trim()));
ok('há leituras do ERP para conferir', selectsErp.length >= 4, `${selectsErp.length}`);
ok(
  'todo select no ERP usa uma constante COLUNAS_*',
  selectsErp.length > 0 && selectsErp.every((s) => /^COLUNAS_[A-Z_]+$/.test(s)),
  selectsErp.filter((s) => !/^COLUNAS_[A-Z_]+$/.test(s)).join(' | ')
);

// As colunas que NUNCA podem sair do ERP. Cada uma é dinheiro ou é de terceiro.
const PROIBIDAS = [
  'custo',
  'margem',
  'limite_de_credito',
  'limit_credit',
  'salesperson',
  'vendedor',
  'notes',
  'observacoes',
  'obs',
  'status_cobranca',
  'cession_id',
  'custo_cartorio',
  'historico',
  'deleted_reason',
  'deleted_by',
  'remessa_id',
  'encargo_recompra',
  'lista_de_preco',
  'password',
];
const constantes = [...fonteBruta.matchAll(/export const (COLUNAS_[A-Z_]+) = *\n? *'([^']+)'/g)];
ok('as quatro listas brancas existem', constantes.length === 4, `${constantes.length}`);
for (const [, nome, valor] of constantes) {
  const colunas = valor.split(',').map((c) => c.trim());
  const ruins = colunas.filter((c) => PROIBIDAS.includes(c));
  ok(`${nome} não carrega coluna proibida`, ruins.length === 0, ruins.join(', '));
}
ok(
  'a lista do cliente não pede limite de crédito (decisão 4)',
  !/limite_de_credito|limit_credit/.test(fonteHistorico)
);

// ============================================ 2. o ERP não é mais escrito à toa
console.log('\n=== O ERP É SOMENTE LEITURA ===');
const ESCRITAS_PERMITIDAS = new Set(['site_criar_pedido', 'site_confirmar_pagamento', 'site_cancelar_pedido']);
const arquivosApi = spawnSync(process.execPath, ['-e', `
  const { readdirSync, statSync } = require('node:fs');
  const { join } = require('node:path');
  const saida = [];
  (function anda(d) {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) anda(p);
      else if (p.endsWith('.ts')) saida.push(p);
    }
  })(${JSON.stringify(join(ROOT, 'api'))});
  console.log(saida.join('\\n'));
`], { encoding: 'utf8' }).stdout.trim().split('\n');

const rpcsDoErp = new Set();
for (const arq of arquivosApi) {
  const txt = readFileSync(arq, 'utf8');
  for (const m of txt.matchAll(/erp\.rpc\(\s*'([a-z_]+)'/g)) rpcsDoErp.add(m[1]);
}
const naoPermitidas = [...rpcsDoErp].filter((r) => !ESCRITAS_PERMITIDAS.has(r) && !r.startsWith('site_consultar'));
ok('nenhuma RPC nova de escrita no ERP', naoPermitidas.length === 0, naoPermitidas.join(', '));
ok(
  'site_vincular_cliente não é mais chamada (decisão 6)',
  !arquivosApi.some((a) => readFileSync(a, 'utf8').includes("rpc('site_vincular_cliente'"))
);

// ================================================== 3. a lógica, de verdade
const build = spawnSync(
  process.execPath,
  [
    join(ROOT, 'node_modules/esbuild/bin/esbuild'),
    'api/_lib/pedido/despachoErp.ts',
    'api/_lib/conta/atribuirTitulos.ts',
    'api/_lib/conta/documento.ts',
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

// Dublê do @supabase/supabase-js: o módulo o carrega por import dinâmico, então
// dá para trocar o especificador no JS emitido (export de ESM é só leitura).
writeFileSync(
  join(outDir, 'supabase-falso.js'),
  [
    'export let ultimoErp = null;',
    'export const respostas = { site_criar_pedido: null, site_confirmar_pagamento: null };',
    'export const chamadas = [];',
    'export function createClient() {',
    '  ultimoErp = {',
    '    rpc: async (nome, args) => { chamadas.push({ nome, args }); const r = respostas[nome]; return r ?? { data: null, error: null }; },',
    '    from: () => ({ select: () => ({ in: () => ({ }) }) }),',
    '  };',
    '  return ultimoErp;',
    '}',
  ].join('\n') + '\n'
);
const arqDespacho = join(outDir, 'pedido/despachoErp.js');
writeFileSync(
  arqDespacho,
  readFileSync(arqDespacho, 'utf8').replace(/"@supabase\/supabase-js"|'@supabase\/supabase-js'/g, '"../supabase-falso.js"')
);

process.env.ERP_SUPABASE_URL = 'https://erp.teste';
process.env.ERP_SUPABASE_SERVICE_ROLE_KEY = 'chave-de-teste';

const { despacharAoErp, dispensarDoErp } = await import(pathToFileURL(arqDespacho).href);
const falso = await import(pathToFileURL(join(outDir, 'supabase-falso.js')).href);
const { normalizarNome } = await import(pathToFileURL(join(outDir, 'conta/atribuirTitulos.js')).href);

// -------------------------------------------------- banco do site, em memória
// Só o que o módulo usa. `update().eq().or().select()` é o compare-and-swap: é
// aqui que a corrida é resolvida, então ele é aplicado de forma atômica —
// avaliar e escrever sem ceder o turno, igual a um UPDATE do Postgres.
function bancoFalso(pedidos, pagamentos = []) {
  const tabelas = { pedidos, pagamentos, user_profiles: [{ id: 'u1', erp_client_id: null }] };

  const casa = (linha, filtros) =>
    filtros.every((f) => {
      if (f.tipo === 'eq') return linha[f.col] === f.valor;
      if (f.tipo === 'is') return linha[f.col] == null;
      if (f.tipo === 'in') return f.valor.includes(linha[f.col]);
      if (f.tipo === 'or') {
        // "erp_envio.eq.pendente,and(erp_envio.eq.enviando,erp_envio_em.lt.X)"
        const limite = /erp_envio_em\.lt\.([^)]+)/.exec(f.valor)?.[1];
        return linha.erp_envio === 'pendente' || (linha.erp_envio === 'enviando' && limite && String(linha.erp_envio_em) < limite);
      }
      return true;
    });

  return {
    from(nome) {
      const filtros = [];
      let modo = 'select';
      let patch = null;
      const q = {
        select() {
          if (modo !== 'update') modo = 'select';
          return q;
        },
        update(p) {
          modo = 'update';
          patch = p;
          return q;
        },
        eq(col, valor) {
          filtros.push({ tipo: 'eq', col, valor });
          return q;
        },
        is(col) {
          filtros.push({ tipo: 'is', col });
          return q;
        },
        in(col, valor) {
          filtros.push({ tipo: 'in', col, valor });
          return q;
        },
        or(valor) {
          filtros.push({ tipo: 'or', valor });
          return q;
        },
        order: () => q,
        limit: () => q,
        aplicar() {
          const alvo = (tabelas[nome] ?? []).filter((l) => casa(l, filtros));
          if (modo === 'update') {
            for (const l of alvo) Object.assign(l, patch);
            return alvo.map((l) => ({ id: l.id }));
          }
          return alvo;
        },
        maybeSingle: async () => ({ data: q.aplicar()[0] ?? null, error: null }),
        then: (res, rej) => Promise.resolve({ data: q.aplicar(), error: null }).then(res, rej),
      };
      return q;
    },
    rpc: async () => ({ data: null, error: null }),
  };
}

const pedidoBase = (over = {}) => ({
  id: 'p1',
  numero: 9,
  user_id: 'u1',
  status: 'RASCUNHO',
  erp_quote_id: null,
  erp_quote_number: null,
  erp_envio: 'pendente',
  erp_envio_em: null,
  erp_payload: { site_pedido_id: 'p1' },
  pagamento_status: 'aguardando',
  erp_pago_em: null,
  forma_pagamento: 'PIX',
  total_final: 100,
  valor_frete: 0,
  pago_em: null,
  ...over,
});

console.log('\n=== SÓ PEDIDO PAGO VAI AO NZERP ===');
falso.respostas.site_criar_pedido = { data: { quote_id: 'q-1', quote_number: 4242, client_id: 'c-1' }, error: null };

{
  falso.chamadas.length = 0;
  const p = pedidoBase();
  const r = await despacharAoErp(bancoFalso([p]), 'p1', 'pago');
  ok('Pix aguardando não vira orçamento', r.estado === 'nao-pago', r.estado);
  ok('e o ERP não foi chamado', falso.chamadas.length === 0, `${falso.chamadas.length} chamada(s)`);
  ok('o pedido continua na fila', p.erp_envio === 'pendente', p.erp_envio);
}

for (const status of ['expirado', 'recusado', 'vencido', 'cancelado', 'nenhum', 'em_analise']) {
  falso.chamadas.length = 0;
  const r = await despacharAoErp(bancoFalso([pedidoBase({ pagamento_status: status })]), 'p1', 'pago');
  ok(`pagamento "${status}" também não vai`, r.estado === 'nao-pago' && falso.chamadas.length === 0, r.estado);
}

{
  falso.chamadas.length = 0;
  const p = pedidoBase({ pagamento_status: 'pago', pago_em: '2026-09-10T10:00:00Z' });
  const r = await despacharAoErp(bancoFalso([p]), 'p1', 'pago');
  ok('pago vira orçamento', r.estado === 'enviado' && r.quoteNumber === 4242, r.estado);
  ok('o pedido passa a ABERTO', p.status === 'ABERTO', p.status);
  ok('e sai da fila', p.erp_envio === 'enviado', p.erp_envio);
  ok('criou e confirmou o pagamento', falso.chamadas.map((c) => c.nome).join() === 'site_criar_pedido,site_confirmar_pagamento', falso.chamadas.map((c) => c.nome).join());
}

{
  falso.chamadas.length = 0;
  const p = pedidoBase({ status: 'SOLICITADO' });
  const r = await despacharAoErp(bancoFalso([p]), 'p1', 'admin');
  ok('o admin pode mandar um não pago (é a porta com dono)', r.estado === 'enviado', r.estado);
  ok('e o pagamento NÃO é confirmado', !falso.chamadas.some((c) => c.nome === 'site_confirmar_pagamento'));
}

{
  const p = pedidoBase({ status: 'CANCELADO', pagamento_status: 'pago' });
  const r = await despacharAoErp(bancoFalso([p]), 'p1', 'pago');
  ok('pedido cancelado nunca vai', r.estado === 'cancelado', r.estado);
}

{
  const p = pedidoBase({ pagamento_status: 'pago', erp_payload: null });
  const r = await despacharAoErp(bancoFalso([p]), 'p1', 'pago');
  ok('sem payload não inventa pedido', r.estado === 'sem-payload', r.estado);
}

console.log('\n=== A TRAVA CONTRA DUPLICIDADE ===');
{
  // Webhook, cron e a tela ao mesmo tempo, no mesmo pedido.
  falso.chamadas.length = 0;
  const p = pedidoBase({ pagamento_status: 'pago' });
  const banco = bancoFalso([p]);
  const rs = await Promise.all([
    despacharAoErp(banco, 'p1', 'pago'),
    despacharAoErp(banco, 'p1', 'pago'),
    despacharAoErp(banco, 'p1', 'pago'),
  ]);
  const criou = falso.chamadas.filter((c) => c.nome === 'site_criar_pedido').length;
  ok('três processos, UM orçamento', criou === 1, `${criou} chamadas a site_criar_pedido`);
  ok('os outros dois desistem sem erro', rs.filter((r) => r.estado === 'outro-processo').length === 2, rs.map((r) => r.estado).join());
  ok('o vencedor devolve o número', rs.some((r) => r.quoteNumber === 4242));
}

{
  // O processo anterior morreu no meio: depois de 5 min o pedido volta à fila.
  falso.chamadas.length = 0;
  const travadoAgora = pedidoBase({ pagamento_status: 'pago', erp_envio: 'enviando', erp_envio_em: new Date().toISOString() });
  const r1 = await despacharAoErp(bancoFalso([travadoAgora]), 'p1', 'pago');
  ok('trava recente segura', r1.estado === 'outro-processo', r1.estado);

  const travadoVelho = pedidoBase({ pagamento_status: 'pago', erp_envio: 'enviando', erp_envio_em: new Date(Date.now() - 6 * 60_000).toISOString() });
  const r2 = await despacharAoErp(bancoFalso([travadoVelho]), 'p1', 'pago');
  ok('trava de 6 min atrás é retomada', r2.estado === 'enviado', r2.estado);
}

{
  falso.chamadas.length = 0;
  const p = pedidoBase({ pagamento_status: 'pago', erp_quote_id: 'q-1', erp_quote_number: 4242, erp_envio: 'enviado', erp_pago_em: '2026-09-10T10:00:00Z' });
  const r = await despacharAoErp(bancoFalso([p]), 'p1', 'pago');
  ok('quem já foi não vai de novo', r.estado === 'ja-enviado' && falso.chamadas.length === 0, r.estado);
}

{
  falso.chamadas.length = 0;
  falso.respostas.site_criar_pedido = { data: null, error: { message: 'ERP fora do ar' } };
  const p = pedidoBase({ pagamento_status: 'pago' });
  const r = await despacharAoErp(bancoFalso([p]), 'p1', 'pago');
  ok('erro do ERP não perde o pedido', r.estado === 'erro', r.estado);
  ok('a trava é devolvida para o cron tentar', p.erp_envio === 'pendente', p.erp_envio);
  ok('e o erro fica guardado', String(p.erp_envio_erro).includes('ERP fora do ar'), String(p.erp_envio_erro));
  falso.respostas.site_criar_pedido = { data: { quote_id: 'q-1', quote_number: 4242 }, error: null };
}

{
  const p = pedidoBase();
  await dispensarDoErp(bancoFalso([p]), 'p1');
  ok('cancelar antes de pagar tira da fila', p.erp_envio === 'dispensado', p.erp_envio);
}

console.log('\n=== ATRIBUIÇÃO POR NOME ===');
ok('acento não separa', normalizarNome('Comércio SÃO JOÃO') === 'comercio sao joao', normalizarNome('Comércio SÃO JOÃO'));
ok('pontuação não separa', normalizarNome('J. R. Adesivos & Cia.') === 'j r adesivos cia', normalizarNome('J. R. Adesivos & Cia.'));
ok('espaço sobrando não separa', normalizarNome('  NZ   DISTRIBUIDORA  ') === 'nz distribuidora');
ok('nome vazio não vira chave', normalizarNome('') === '' && normalizarNome(null) === '');
ok('nomes iguais escritos diferente batem', normalizarNome('Auto Center Ltda.') === normalizarNome('AUTO CENTER LTDA'));
ok('nomes diferentes não batem', normalizarNome('Adesivos SP') !== normalizarNome('Adesivos RJ'));

rmSync(outDir, { recursive: true, force: true });
console.log(`\n${falhas ? `${falhas} FALHA(S)` : 'tudo certo'}`);
process.exit(falhas ? 1 : 0);
