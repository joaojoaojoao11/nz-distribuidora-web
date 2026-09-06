// Autoteste da área do cliente — sem rede, sem navegador.
//
// Cobre a lógica pura: as listas pessoais (favoritos e vistos, com chave por
// usuário e fusão no login, o mesmo contrato do carrinho) e o menu — que o
// título da tela saia da rota, inclusive nas subrotas.
//
// Uso: npm run painel:test

import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(join(ROOT, 'node_modules/.cache'), { recursive: true });
const outDir = mkdtempSync(join(ROOT, 'node_modules/.cache/nz-painel-'));

const build = spawnSync(
  process.execPath,
  [
    join(ROOT, 'node_modules/esbuild/bin/esbuild'),
    'src/lib/shop/listasPessoais.ts',
    'src/pages/Painel/painelNav.ts',
    'src/pages/Painel/pedidoRotulos.ts',
    `--outdir=${outDir}`,
    // Entradas de pastas diferentes: sem outbase o esbuild recria a árvore a
    // partir da raiz comum e os caminhos abaixo deixam de bater.
    '--outbase=src',
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

// Dublês: o módulo lê o cliente do Supabase (import.meta.env) e o
// useSyncExternalStore do React. Trocados no JS emitido — export de ESM é só
// leitura, não dá para trocar depois do import.
writeFileSync(
  join(outDir, 'lib/supabase-falso.js'),
  [
    'let ouvinte = null;',
    'export const supabase = { auth: { onAuthStateChange: (fn) => { ouvinte = fn; return { data: { subscription: { unsubscribe() {} } } }; } } };',
    "export const entrar = (uid) => ouvinte?.('SIGNED_IN', uid ? { user: { id: uid } } : null);",
  ].join('\n') + '\n'
);
writeFileSync(join(outDir, 'lib/react-falso.js'), 'export const useSyncExternalStore = (_s, get) => get();\n');

const arq = join(outDir, 'lib/shop/listasPessoais.js');
writeFileSync(
  arq,
  readFileSync(arq, 'utf8')
    .replace(/"\.\.\/supabase"|'\.\.\/supabase'/g, '"../supabase-falso.js"')
    .replace(/from\s*"react"|from\s*'react'/g, 'from "../react-falso.js"')
);

const guardado = new Map();
globalThis.window = {
  localStorage: {
    getItem: (k) => (guardado.has(k) ? guardado.get(k) : null),
    setItem: (k, v) => guardado.set(k, String(v)),
    removeItem: (k) => guardado.delete(k),
  },
};

let falhas = 0;
const ok = (nome, cond, extra = '') => {
  console.log(`${cond ? '  OK  ' : ' FALHA'} ${nome}${extra ? ' — ' + extra : ''}`);
  if (!cond) falhas++;
};

const listas = await import(pathToFileURL(arq).href);
const { entrar } = await import(pathToFileURL(join(outDir, 'lib/supabase-falso.js')).href);
const nav = await import(pathToFileURL(join(outDir, 'pages/Painel/painelNav.js')).href);
const rotulos = await import(pathToFileURL(join(outDir, 'pages/Painel/pedidoRotulos.js')).href);

const prod = (slug) => ({ slug, nome: slug.toUpperCase(), codigo: null, imagem: null, hex: null });
const lerChave = (k) => JSON.parse(guardado.get(k) ?? '[]');

// ============================================================= favoritos
console.log('\n=== FAVORITOS ===');
guardado.clear();
ok('começa vazio', listas.useFavoritos().length === 0);
ok('alternar liga', listas.alternarFavorito(prod('mcx-preto')) === true);
ok('e entra na lista', listas.useFavoritos().length === 1);
ok('ehFavorito reconhece', listas.ehFavorito('mcx-preto') === true);
ok('alternar de novo desliga', listas.alternarFavorito(prod('mcx-preto')) === false);
ok('e sai da lista', listas.useFavoritos().length === 0);

listas.alternarFavorito(prod('a'));
listas.alternarFavorito(prod('b'));
ok('o mais recente fica na frente', listas.useFavoritos()[0].slug === 'b');
listas.removerFavorito('a');
ok('remover tira o certo', listas.useFavoritos().map((i) => i.slug).join() === 'b');
ok('grava na chave de visitante', lerChave('nz:favoritos').length === 1);

// ================================================================ vistos
console.log('\n=== VISTOS ===');
listas.limparVistos();
for (const s of ['p1', 'p2', 'p3']) listas.registrarVisto(prod(s));
ok('guarda na ordem inversa', listas.useVistos().map((i) => i.slug).join() === 'p3,p2,p1');

listas.registrarVisto(prod('p1'));
ok('reabrir o mesmo não duplica', listas.useVistos().filter((i) => i.slug === 'p1').length === 1);
ok('e ele volta para a frente', listas.useVistos()[0].slug === 'p1');
ok('sem crescer a lista', listas.useVistos().length === 3);

for (let i = 0; i < 40; i++) listas.registrarVisto(prod(`x${i}`));
ok('a lista tem teto (24)', listas.useVistos().length === 24, `${listas.useVistos().length} itens`);

listas.limparVistos();
ok('limpar esvazia', listas.useVistos().length === 0);

// ==================================================== chave por usuário
console.log('\n=== CHAVE POR USUÁRIO ===');
// Zerar o Map do storage nao zera a memoria do modulo: esvaziar pelas
// proprias funcoes e o que deixa esta secao comecar limpa de verdade.
for (const f of [...listas.useFavoritos()]) listas.removerFavorito(f.slug);
listas.limparVistos();
guardado.clear();
listas.alternarFavorito(prod('visitante-guardou'));
entrar('user-A');
ok('o favorito do visitante vai junto no login', listas.useFavoritos().length === 1);
ok('e passa para a chave do usuário', lerChave('nz:favoritos:user-A').length === 1);
ok('a chave anônima fica vazia', lerChave('nz:favoritos').length === 0);

listas.alternarFavorito(prod('so-do-A'));
entrar('user-B');
ok('outro usuário começa do zero', listas.useFavoritos().length === 0);
ok('e não vê o do outro', lerChave('nz:favoritos:user-A').length === 2);

entrar('user-A');
ok('voltando, cada um acha o seu', listas.useFavoritos().length === 2);

entrar(null);
ok('sair não vaza a lista do usuário', listas.useFavoritos().length === 0);

// ================================================================= menu
console.log('\n=== MENU ===');
ok('a raiz é "Minha conta"', nav.tituloDaRota('/painel') === 'Minha conta');
ok('com barra no fim também', nav.tituloDaRota('/painel/') === 'Minha conta');
ok('cada tela tem título', nav.tituloDaRota('/painel/pagamentos') === 'Pagamentos');
ok('subrota herda o título', nav.tituloDaRota('/painel/pedidos/algo') === 'Meus pedidos');
ok('o detalhe do pedido tem o seu', nav.tituloDaRota('/painel/pedido/5') === 'Pedido');
ok('rota desconhecida não quebra', nav.tituloDaRota('/painel/inexistente') === 'Minha conta');

const rotas = nav.TODOS_ITENS.map((i) => i.para);
ok('nenhuma rota repetida no menu', new Set(rotas).size === rotas.length);
ok('toda rota cai sob /painel/', rotas.every((r) => r.startsWith('/painel/')));
ok('todo item tem dica (é a segunda linha no celular)', nav.TODOS_ITENS.every((i) => i.dica.length > 5));
ok('os 4 grupos existem', nav.GRUPOS.map((g) => g.id).join() === 'compras,catalogo,conta,vantagens');

// ============================================================== rótulos
console.log('\n=== RÓTULOS ===');
ok('status do ERP vira português', rotulos.STATUS_LABEL.ABERTO === 'Enviado — aguardando o vendedor');
ok('pagamento pago é ok', rotulos.tomDoPagamento('pago') === 'ok');
ok('aguardando é pendente', rotulos.tomDoPagamento('aguardando') === 'pendente');
ok('recusado é ruim', rotulos.tomDoPagamento('recusado') === 'ruim');
ok('"nenhum" não pinta chip', rotulos.tomDoPagamento('nenhum') === null);
ok('nulo não pinta chip', rotulos.tomDoPagamento(null) === null);

console.log('\n=== PODE CANCELAR ===');
const ped = (status, pagamento_status = null) => ({ status, pagamento_status });
ok('pedido aberto e nao pago pode', rotulos.podeCancelar(ped('ABERTO')) === true);
ok('rascunho pode', rotulos.podeCancelar(ped('RASCUNHO')) === true);
ok('aguardando pagamento ainda pode', rotulos.podeCancelar(ped('ABERTO', 'aguardando')) === true);
ok('Pix expirado ainda pode', rotulos.podeCancelar(ped('ABERTO', 'expirado')) === true);
ok('PAGO nunca pode (isso e estorno)', rotulos.podeCancelar(ped('ABERTO', 'pago')) === false);
ok('aprovado nao pode (ja separou)', rotulos.podeCancelar(ped('APROVADO')) === false);
ok('faturado nao pode', rotulos.podeCancelar(ped('FATURADO')) === false);
ok('enviado nao pode', rotulos.podeCancelar(ped('ENVIADO')) === false);
ok('ja cancelado nao oferece de novo', rotulos.podeCancelar(ped('CANCELADO')) === false);

rmSync(outDir, { recursive: true, force: true });
console.log(`\n${falhas ? `${falhas} FALHA(S)` : 'tudo certo'}`);
process.exit(falhas ? 1 : 0);
