// Autoteste das seleções — sem rede, sem navegador.
//
// Cobre as contas que, se errarem, o cliente vê preço errado ou vê um link
// morto como se estivesse vivo: o acréscimo em %, a janela de validade, a
// validação da telinha e a chave do cache de preços por contexto.
//
// Por que vale a pena testar isto e não o resto: o olho não pega arredondamento
// de centavo, e "a seleção expirou" só aparece 24 h depois — no navegador esse
// caso nunca é exercitado por acidente.
//
// Uso: npm run selecoes:test

import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(join(ROOT, 'node_modules/.cache'), { recursive: true });
const outDir = mkdtempSync(join(ROOT, 'node_modules/.cache/nz-selecoes-'));

// Um esbuild por arquivo: com vários pontos de entrada em pastas diferentes o
// esbuild espelha a árvore de diretórios no destino, e o que queremos aqui é um
// diretório plano onde os dublês fiquem ao lado dos módulos.
for (const [entrada, saida] of [
  ['src/lib/shop/selecoes/regras.ts', 'regras.js'],
  ['src/lib/shop/precos.ts', 'precos.js'],
  ['api/_lib/pedido/dinheiro.ts', 'dinheiro.js'],
]) {
  const build = spawnSync(
    process.execPath,
    [
      join(ROOT, 'node_modules/esbuild/bin/esbuild'),
      entrada,
      `--outfile=${join(outDir, saida)}`,
      '--format=esm',
      '--platform=node',
      '--log-level=error',
    ],
    { cwd: ROOT, encoding: 'utf8' }
  );
  if (build.status !== 0) {
    console.error(build.error?.message || build.stderr || build.stdout || `esbuild falhou em ${entrada}`);
    rmSync(outDir, { recursive: true, force: true });
    process.exit(1);
  }
}

// `precos.ts` importa o cliente do Supabase (que lê import.meta.env) e o React.
// Só queremos `chavePreco`, que é função pura — os dublês existem para o módulo
// carregar.
writeFileSync(
  join(outDir, 'supabase-falso.js'),
  'export const supabase = { auth: { onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }), getSession: async () => ({ data: {} }) } };\n'
);
writeFileSync(
  join(outDir, 'react-falso.js'),
  [
    'export const useSyncExternalStore = (_s, get) => get();',
    'export const useEffect = () => {};',
    'export const useMemo = (fn) => fn();',
  ].join('\n') + '\n'
);

const arqPrecos = join(outDir, 'precos.js');
writeFileSync(
  arqPrecos,
  readFileSync(arqPrecos, 'utf8')
    .replace(/"\.\.\/supabase"|'\.\.\/supabase'/g, '"./supabase-falso.js"')
    .replace(/from\s*"react"|from\s*'react'/g, 'from "./react-falso.js"')
);

let falhas = 0;
const ok = (nome, cond, extra = '') => {
  console.log(`${cond ? '  OK  ' : ' FALHA'} ${nome}${extra ? ' — ' + extra : ''}`);
  if (!cond) falhas++;
};

const regras = await import(pathToFileURL(join(outDir, 'regras.js')).href);
const servidor = await import(pathToFileURL(join(outDir, 'dinheiro.js')).href);
const { chavePreco } = await import(pathToFileURL(arqPrecos).href);

// ====================================================== acréscimo em %
console.log('\n=== ACRÉSCIMO ===');
ok('0% devolve o próprio preço', regras.aplicarAcrescimo(1088.63, 0) === 1088.63);
ok('10% sobre 1088,63 dá 1197,49', regras.aplicarAcrescimo(1088.63, 10) === 1197.49);
ok('12,5% arredonda para o centavo', regras.aplicarAcrescimo(44.9, 12.5) === 50.51);
ok('100% dobra', regras.aplicarAcrescimo(52, 100) === 104);
ok('preço nulo continua nulo', regras.aplicarAcrescimo(null, 10) === null);
// Zero no espelho é cadastro incompleto do ERP, não preço: não pode virar
// "R$ 0,00 + 10%".
ok('preço zero não vira preço', regras.aplicarAcrescimo(0, 10) === null);
ok('percentual negativo não desconta', regras.aplicarAcrescimo(100, -20) === 100);

// A conta do cliente e a do servidor têm que ser a MESMA: se divergirem, o card
// mostra um número e o vendedor cobra outro.
console.log('\n=== MESMA CONTA NOS DOIS LADOS ===');
for (const [valor, pct] of [
  [1088.63, 10],
  [44.9, 12.5],
  [1572, 7.5],
  [52.4, 33.33],
  [0.05, 1],
]) {
  ok(
    `${valor} + ${pct}% igual no cliente e no servidor`,
    regras.aplicarAcrescimo(valor, pct) === servidor.aplicarAcrescimo(valor, pct),
    `${regras.aplicarAcrescimo(valor, pct)} vs ${servidor.aplicarAcrescimo(valor, pct)}`
  );
}

// ========================================================== validade
console.log('\n=== VALIDADE ===');
const agora = Date.parse('2026-09-08T12:00:00Z');
const daquiA = (h) => new Date(agora + h * 3600_000).toISOString();

ok('dentro do prazo está ativa', regras.estaAtiva({ expira_em: daquiA(5) }, agora));
ok('vencida não está ativa', !regras.estaAtiva({ expira_em: daquiA(-1) }, agora));
ok('no limite exato não está ativa', !regras.estaAtiva({ expira_em: daquiA(0) }, agora));
ok(
  'encerrada à mão não está ativa mesmo dentro do prazo',
  !regras.estaAtiva({ expira_em: daquiA(20), encerrada_em: daquiA(-2) }, agora)
);
ok('nula não está ativa', !regras.estaAtiva(null, agora));
ok('data inválida não está ativa', !regras.estaAtiva({ expira_em: 'nunca' }, agora));

console.log('\n=== TEXTO DE VALIDADE ===');
ok('faltando 5 h', regras.textoDeValidade(daquiA(5), agora) === 'expira em 5 h');
ok('faltando 40 min', regras.textoDeValidade(new Date(agora + 40 * 60000).toISOString(), agora) === 'expira em 40 min');
ok('vencida há 2 h', regras.textoDeValidade(daquiA(-2), agora) === 'expirou há 2 h');
ok('vencida há 3 d', regras.textoDeValidade(daquiA(-72), agora) === 'expirou há 3 d');

// ========================================================= validação
console.log('\n=== VALIDAÇÃO DA TELINHA ===');
const base = { slugs: ['a', 'b'], mostrarPreco: true, acrescimoPct: 10 };
ok('config boa não tem problema', regras.validarConfig(base).length === 0);
ok('lista vazia reclama de slugs', regras.validarConfig({ ...base, slugs: [] })[0]?.campo === 'slugs');
ok(
  `${regras.MAX_SELECAO} itens passa`,
  regras.validarConfig({ ...base, slugs: Array.from({ length: regras.MAX_SELECAO }, (_, i) => `s${i}`) }).length === 0
);
ok(
  `${regras.MAX_SELECAO + 1} itens reclama`,
  regras.validarConfig({ ...base, slugs: Array.from({ length: regras.MAX_SELECAO + 1 }, (_, i) => `s${i}`) })[0]
    ?.campo === 'slugs'
);
// Duplicado não conta duas vezes: o servidor deduplica antes de gravar, então a
// telinha não pode acusar excesso do que não vai ser enviado.
ok('slug repetido conta uma vez só', regras.validarConfig({ ...base, slugs: ['a', 'a', 'A', ' a '] }).length === 0);
ok('acréscimo acima de 100 reclama', regras.validarConfig({ ...base, acrescimoPct: 101 })[0]?.campo === 'acrescimoPct');
ok('acréscimo negativo reclama', regras.validarConfig({ ...base, acrescimoPct: -1 })[0]?.campo === 'acrescimoPct');
ok('acréscimo não numérico reclama', regras.validarConfig({ ...base, acrescimoPct: NaN })[0]?.campo === 'acrescimoPct');
// Sem preço na tela o campo fica desligado; um lixo nele não pode travar o botão.
ok(
  'sem mostrar preço, acréscimo inválido não trava',
  regras.validarConfig({ ...base, mostrarPreco: false, acrescimoPct: 999 }).length === 0
);
ok(
  'título comprido reclama',
  regras.validarConfig({ ...base, titulo: 'x'.repeat(regras.MAX_TITULO + 1) })[0]?.campo === 'titulo'
);

console.log('\n=== NORMALIZAÇÃO DE SLUGS ===');
ok(
  'tira repetido, minúsculo, mantém a ordem curada',
  JSON.stringify(regras.normalizarSlugs([' B ', 'a', 'B', 'A', ''])) === JSON.stringify(['b', 'a'])
);

// ================================================ chave do cache de preço
//
// O mesmo slug tem preço diferente dentro e fora de uma seleção. Se as duas
// chaves colidissem, um cliente veria na loja o preço com acréscimo que a tela
// da seleção carregou — ou o contrário.
console.log('\n=== CONTEXTO DO CACHE DE PREÇO ===');
ok('loja e seleção não colidem', chavePreco('mcx-preto') !== chavePreco('mcx-preto', 'tok1'));
ok('seleções diferentes não colidem', chavePreco('x', 'tok1') !== chavePreco('x', 'tok2'));
ok('mesma chave é estável', chavePreco('x', 'tok1') === chavePreco('x', 'tok1'));
ok('sem token é o contexto vazio', chavePreco('x') === chavePreco('x', undefined));
// Um slug pode ter '|'? Não hoje, mas a chave não pode depender disso: o
// prefixo é o token, que é base64url e nunca tem '|'.
ok('o separador fica antes do slug', chavePreco('a|b', 'tok') === 'tok|a|b');

rmSync(outDir, { recursive: true, force: true });
console.log(`\n${falhas === 0 ? 'TUDO OK' : `${falhas} FALHA(S)`}\n`);
process.exit(falhas === 0 ? 0 : 1);
