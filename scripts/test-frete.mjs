// Autoteste da cotação de frete: cubagem + adapters Jadlog e Melhor Envio.
//
// Os casos vêm dos payloads LITERAIS das documentações oficiais — "Integração
// API JADLOG" v2.3 (28/08/2025), Simulador de Frete, pp. 21-22, e a referência
// "Cálculo de Fretes" do Melhor Envio (docs.melhorenvio.com.br, revisão de
// 2026-06), tanto o retorno de sucesso quanto os formatos de erro. É o que
// separa "escrevi conforme a doc" de "conferi contra a doc".
//
// Não faz chamada de rede: o fetch é substituído por um duplo que devolve os
// payloads da doc e guarda o corpo enviado, para verificar o que a gente manda.
//
// Uso: npm run frete:test

import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = mkdtempSync(join(tmpdir(), 'nz-frete-'));

// Mesmo motivo do audit-shop.mjs: no Windows o wrapper .bin é um .cmd, que o
// Node recente recusa a lançar sem shell.
const build = spawnSync(
  process.execPath,
  [
    join(ROOT, 'node_modules/esbuild/bin/esbuild'),
    'api/_lib/carriers/jadlog.ts',
    'api/_lib/carriers/melhorenvio.ts',
    'api/_lib/carriers/cubagem.ts',
    'api/_lib/carriers/types.ts',
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

const { jadlog } = await import(pathToFileURL(join(outDir, 'jadlog.js')).href);
const { melhorenvio } = await import(pathToFileURL(join(outDir, 'melhorenvio.js')).href);
const { pesoTaxavel, fatorCubagem, FATOR_CUBAGEM_PADRAO } = await import(
  pathToFileURL(join(outDir, 'cubagem.js')).href
);

let falhas = 0;
const ok = (nome, cond, extra = '') => {
  console.log(`${cond ? '  OK  ' : ' FALHA'} ${nome}${extra ? ' — ' + extra : ''}`);
  if (!cond) falhas++;
};

const ENTRADA = {
  cepOrigem: '04696000',
  cepDestino: '01310100',
  pesoKg: 0.3,
  pesoRealKg: 0.3,
  quantidade: 1,
  comprimentoCm: 30,
  larguraCm: 20,
  alturaCm: 10,
  valorDeclarado: 55,
};

console.log('\n=== CUBAGEM ===');
// A regra da Jadlog: cobra pelo MAIOR entre peso real e cubado. Um rolo de
// vinil é o caso que justifica a conta — leve e volumoso.
const rolo = { peso_kg: 12, comprimento_cm: 170, largura_cm: 20, altura_cm: 20 };
const p1 = pesoTaxavel(rolo, 1, 3333);
ok(
  'rolo volumoso: cubado vence o real',
  p1.pesoKg === p1.pesoCubado && p1.pesoCubado > p1.pesoReal,
  `real ${p1.pesoReal} kg vs cubado ${p1.pesoCubado} kg`
);
const p5 = pesoTaxavel(rolo, 5, 3333);
ok(
  'quantidade multiplica os dois pesos',
  Math.abs(p5.pesoCubado - p1.pesoCubado * 5) < 0.01 && Math.abs(p5.pesoReal - 60) < 0.01,
  `5 rolos = ${p5.pesoCubado} kg cubados`
);
const denso = pesoTaxavel(
  { peso_kg: 30, comprimento_cm: 30, largura_cm: 20, altura_cm: 20 },
  1,
  3333
);
ok('caixa densa: peso real vence', denso.pesoKg === denso.pesoReal, `real ${denso.pesoReal} kg`);
ok(
  'quantidade inválida cai para 1',
  pesoTaxavel(rolo, 0, 3333).pesoReal === 12 && pesoTaxavel(rolo, NaN, 3333).pesoReal === 12
);
ok('fator do config é respeitado', fatorCubagem({ fator_cubagem: 6000 }) === 6000);
ok(
  'config ausente ou inválido cai no padrão',
  fatorCubagem(null) === FATOR_CUBAGEM_PADRAO &&
    fatorCubagem({}) === FATOR_CUBAGEM_PADRAO &&
    fatorCubagem({ fator_cubagem: 'abc' }) === FATOR_CUBAGEM_PADRAO
);

console.log('\n=== ADAPTER JADLOG (payloads da doc v2.3) ===');
process.env.JADLOG_TOKEN = 'token-de-teste';
process.env.JADLOG_CNPJ = '00.000.000/0001-00';
delete process.env.JADLOG_CONTRATO;
delete process.env.JADLOG_MODALIDADE;

let capturado = null;
const responder = (json, status = 200) => {
  globalThis.fetch = async (url, opts) => {
    capturado = { url, opts, body: JSON.parse(opts.body) };
    return { ok: status >= 200 && status < 300, status, json: async () => json };
  };
};

ok('isConfigured exige token E CNPJ', jadlog.isConfigured() === true);
process.env.JADLOG_CNPJ = '';
ok('sem CNPJ não está configurado', jadlog.isConfigured() === false);
process.env.JADLOG_CNPJ = '00.000.000/0001-00';

// Doc p. 22, "Retorno com Sucesso" — copiado campo a campo.
responder({
  frete: [
    {
      cepdes: '00000000',
      cepori: '00000000',
      conta: '000000',
      contrato: null,
      frap: 'N',
      cnpj: '00000000000000',
      modalidade: 3,
      peso: 0.3,
      prazo: 5,
      tpentrega: 'D',
      tpseguro: 'N',
      vldeclarado: 55.0,
      vltotal: 7.5,
    },
  ],
});
const r = await jadlog.quoteDeadline(ENTRADA);
ok('extrai o prazo', r.dias === 5, `dias=${r.dias}`);
ok('extrai o vltotal', r.valorTotal === 7.5, `valor=${r.valorTotal}`);
ok('traduz a modalidade', r.modalidade === '.Package', String(r.modalidade));

const item = capturado.body.frete[0];
ok(
  'corpo é { frete: [ 1 item ] }',
  Array.isArray(capturado.body.frete) && capturado.body.frete.length === 1
);
ok('CNPJ vai só com dígitos', /^[0-9]{14}$/.test(item.cnpj), item.cnpj);
ok(
  'NÃO envia dimensões — a cotação da doc não tem esses campos',
  item.altura === undefined && item.largura === undefined && item.comprimento === undefined
);
ok(
  'todos os campos 1-1 da doc estão presentes',
  ['cepori', 'cepdes', 'frap', 'peso', 'cnpj', 'modalidade', 'tpentrega', 'tpseguro', 'vldeclarado'].every(
    (k) => item[k] !== undefined
  )
);
ok(
  'frap=N, tpentrega=D, tpseguro=N',
  item.frap === 'N' && item.tpentrega === 'D' && item.tpseguro === 'N'
);
ok('contrato vira null quando não configurado', item.contrato === null);
ok(
  'Authorization vai sem prefixo Bearer',
  capturado.opts.headers.Authorization === 'token-de-teste',
  capturado.opts.headers.Authorization
);

// Doc p. 22, "Retorno com Erro": o erro vem FORA do array, que ainda ecoa a
// entrada — quem só olhasse frete[0] acharia que deu certo.
responder({
  frete: [{ cepori: '00000000', cepdes: '00000000', peso: 0.3 }],
  error: { id: -1, descricao: 'frete[0].contrato Numero de contrato invalido' },
});
try {
  await jadlog.quoteDeadline(ENTRADA);
  ok('erro no topo vira exceção', false);
} catch (e) {
  ok('erro no topo vira exceção', e.message.includes('contrato invalido'), e.message);
}

// Doc p. 21: grupo de erro por item.
responder({ frete: [{ erro: { id: -2, descricao: 'Destino fora da área de cobertura' } }] });
try {
  await jadlog.quoteDeadline(ENTRADA);
  ok('erro por item vira exceção', false);
} catch (e) {
  ok('erro por item vira exceção', e.message.includes('fora da área'), e.message);
}

// Prazo sem valor: a página do cliente continua funcionando, o admin só não vê R$.
responder({ frete: [{ prazo: 3 }] });
const semValor = await jadlog.quoteDeadline(ENTRADA);
ok(
  'sem vltotal: prazo ok e valor null (nunca 0 nem NaN)',
  semValor.dias === 3 && semValor.valorTotal === null,
  `valor=${semValor.valorTotal}`
);

responder({}, 401);
try {
  await jadlog.quoteDeadline(ENTRADA);
  ok('HTTP 401 (token inválido) vira exceção', false);
} catch (e) {
  ok('HTTP 401 (token inválido) vira exceção', e.message.includes('401'), e.message);
}

console.log('\n=== ADAPTER MELHOR ENVIO (payloads da doc) ===');
process.env.MELHORENVIO_TOKEN = 'jwt.de.teste';
process.env.MELHORENVIO_UA_EMAIL = 'tecnico@nzgroup.com.br';

ok('isConfigured exige token E e-mail do User-Agent', melhorenvio.isConfigured() === true);
delete process.env.MELHORENVIO_UA_EMAIL;
ok('sem e-mail não está configurado', melhorenvio.isConfigured() === false);
process.env.MELHORENVIO_UA_EMAIL = 'tecnico@nzgroup.com.br';

// Resposta de exemplo da referência "Cálculo de Fretes" — 5 serviços de 2
// transportadoras, com custom_price/custom_delivery_time distintos do preço
// original em um deles (é o campo que a doc manda usar).
const RESPOSTA_DOC = [
  { id: 1, name: 'PAC', price: '37.79', custom_price: '35.00', delivery_time: 9,
    custom_delivery_time: 9, company: { id: 1, name: 'Correios' } },
  { id: 2, name: 'SEDEX', price: '46.23', custom_price: '46.23', delivery_time: 4,
    custom_delivery_time: 4, company: { id: 1, name: 'Correios' } },
  { id: 3, name: '.Package', price: '18.60', custom_price: '18.60', delivery_time: 6,
    custom_delivery_time: 6, company: { id: 2, name: 'Jadlog' } },
  { id: 4, name: '.Com', price: '16.44', custom_price: '16.44', delivery_time: 5,
    custom_delivery_time: 5, company: { id: 2, name: 'Jadlog' } },
  { id: 17, name: 'Mini Envios', price: '23.44', custom_price: '23.44', delivery_time: 11,
    custom_delivery_time: 11, company: { id: 1, name: 'Correios' } },
];

// Dois rolos MCX: o caso real da NZ. Peso REAL por volume (a cubagem é do ME,
// que recebe as dimensões) e valor declarado dividido pelos volumes.
const ROLO_ME = {
  cepOrigem: '04696000',
  cepDestino: '01310100',
  pesoKg: 30.4,      // já cubado — NÃO deve ser o que vai no corpo
  pesoRealKg: 27,    // 2 rolos de 13,5 kg
  quantidade: 2,
  comprimentoCm: 152,
  larguraCm: 20,
  alturaCm: 20,
  valorDeclarado: 200,
  config: {},
};

responder(RESPOSTA_DOC);
const meOpcoes = await melhorenvio.quoteDeadline(ROLO_ME);

ok('devolve UMA opção por serviço', Array.isArray(meOpcoes) && meOpcoes.length === 5,
  `${meOpcoes.length} opções`);
ok('usa custom_price, não price',
  meOpcoes.find((o) => o.servico === '1')?.valorTotal === 35,
  `PAC = ${meOpcoes.find((o) => o.servico === '1')?.valorTotal}`);
ok('identifica o serviço pelo id, não pelo nome',
  meOpcoes.map((o) => o.servico).join(',') === '1,2,3,4,17');
ok('guarda a transportadora por trás do serviço',
  meOpcoes.find((o) => o.servico === '3')?.transportadora === 'Jadlog' &&
    meOpcoes.find((o) => o.servico === '3')?.servicoNome === '.Package');
ok('prazo vem de custom_delivery_time',
  meOpcoes.find((o) => o.servico === '2')?.dias === 4);

ok('um volume por rolo', capturado.body.volumes.length === 2,
  `${capturado.body.volumes.length} volumes`);
ok('manda o peso REAL por volume (a cubagem é do Melhor Envio)',
  capturado.body.volumes[0].weight === 13.5,
  `weight=${capturado.body.volumes[0].weight}`);
ok('valor segurado é por volume', capturado.body.volumes[0].insurance === 100,
  `insurance=${capturado.body.volumes[0].insurance}`);
ok('dimensões em cm, inteiras',
  capturado.body.volumes[0].length === 152 && capturado.body.volumes[0].width === 20);
ok('manda as duas grafias de height/length que a doc usa',
  capturado.body.volumes[0].heigth === 20 && capturado.body.volumes[0].lenght === 152);
ok('CEPs de origem e destino no formato da doc',
  capturado.body.from.postal_code === '04696000' && capturado.body.to.postal_code === '01310100');
ok('serviços adicionais desligados',
  capturado.body.options.receipt === false && capturado.body.options.own_hand === false);
ok('sem config.servicos não restringe serviços', capturado.body.services === undefined);
ok('User-Agent com aplicação e e-mail (exigido pela API)',
  /NZSTORE \(tecnico@nzgroup\.com\.br\)/.test(capturado.opts.headers['User-Agent']),
  capturado.opts.headers['User-Agent']);
ok('Authorization com Bearer', capturado.opts.headers.Authorization === 'Bearer jwt.de.teste');

// config.servicos restringe a consulta, sem deploy.
responder(RESPOSTA_DOC);
await melhorenvio.quoteDeadline({ ...ROLO_ME, config: { servicos: ['3', 2, 'abc'] } });
ok('config.servicos vira o parâmetro services (só números)',
  capturado.body.services === '3,2', `services=${capturado.body.services}`);

// Serviço que não atende o volume volta com `error` DENTRO da entrada — os
// outros continuam válidos. É o caso real do rolo de 152 cm nos Correios.
responder([
  { id: 1, name: 'PAC', company: { name: 'Correios' },
    error: 'Comprimento maior que o permitido (100 cm)' },
  { id: 3, name: '.Package', custom_price: '92.10', custom_delivery_time: 5,
    company: { name: 'Jadlog' } },
]);
const comRecusa = await melhorenvio.quoteDeadline(ROLO_ME);
ok('serviço com error é descartado, a cotação continua',
  comRecusa.length === 1 && comRecusa[0].servico === '3',
  `${comRecusa.length} opção(ões)`);

responder([
  { id: 1, name: 'PAC', company: { name: 'Correios' }, error: 'Comprimento maior que o permitido' },
  { id: 2, name: 'SEDEX', company: { name: 'Correios' }, error: 'Comprimento maior que o permitido' },
]);
try {
  await melhorenvio.quoteDeadline(ROLO_ME);
  ok('todos os serviços recusados vira exceção com o motivo', false);
} catch (e) {
  ok('todos os serviços recusados vira exceção com o motivo',
    e.message.includes('Nenhum serviço atende') && e.message.includes('Comprimento'), e.message);
}

responder({}, 401);
try {
  await melhorenvio.quoteDeadline(ROLO_ME);
  ok('HTTP 401 fala em token, não em "erro 401"', false);
} catch (e) {
  ok('HTTP 401 fala em token, não em "erro 401"',
    /[Tt]oken/.test(e.message) && /shipping-calculate/.test(e.message), e.message);
}

responder({ message: 'The given data was invalid.',
  errors: { 'to.postal_code': ['O campo to.postal code é obrigatório.'] } }, 422);
try {
  await melhorenvio.quoteDeadline(ROLO_ME);
  ok('HTTP 422 explica QUAL campo', false);
} catch (e) {
  ok('HTTP 422 explica QUAL campo', e.message.includes('to.postal_code'), e.message);
}

responder({}, 429);
try {
  await melhorenvio.quoteDeadline(ROLO_ME);
  ok('HTTP 429 cita o limite de 250/min', false);
} catch (e) {
  ok('HTTP 429 cita o limite de 250/min', e.message.includes('250'), e.message);
}

rmSync(outDir, { recursive: true, force: true });
console.log(`\n${falhas === 0 ? 'TUDO OK' : falhas + ' FALHA(S)'}`);
process.exit(falhas === 0 ? 0 : 1);
