// Autoteste do carrinho da loja — sem rede, sem navegador.
//
// Cobre o que é lógica pura de `src/lib/shop/carrinho.ts`: a contagem que vai
// no crachá da barra, a soma de itens repetidos, e a parte nova — a chave por
// usuário e a migração do carrinho de visitante no login. Esse último é o que
// separa "o cliente perdeu o carrinho ao entrar" de "o cliente do balcão viu o
// carrinho do anterior", e não dá para verificar no olho.
//
// Uso: npm run carrinho:test

import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(join(ROOT, 'node_modules/.cache'), { recursive: true });
const outDir = mkdtempSync(join(ROOT, 'node_modules/.cache/nz-carrinho-'));

const build = spawnSync(
  process.execPath,
  [
    join(ROOT, 'node_modules/esbuild/bin/esbuild'),
    'src/lib/shop/carrinho.ts',
    'src/lib/shop/painelCarrinho.ts',
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

// Dublês: o módulo importa o cliente do Supabase (que lê import.meta.env) e o
// useSyncExternalStore do React. Os specifiers são trocados no JS emitido —
// exports de ESM são só leitura, então não dá para trocar depois do import.
writeFileSync(
  join(outDir, 'supabase-falso.js'),
  [
    'let ouvinte = null;',
    'export const supabase = { auth: { onAuthStateChange: (fn) => { ouvinte = fn; return { data: { subscription: { unsubscribe() {} } } }; } } };',
    "export const entrar = (uid) => ouvinte?.('SIGNED_IN', uid ? { user: { id: uid } } : null);",
  ].join('\n') + '\n'
);
writeFileSync(join(outDir, 'react-falso.js'), 'export const useSyncExternalStore = (_s, get) => get();\n');

const arq = join(outDir, 'carrinho.js');
writeFileSync(
  arq,
  readFileSync(arq, 'utf8')
    .replace(/"\.\.\/supabase"|'\.\.\/supabase'/g, '"./supabase-falso.js"')
    .replace(/from\s*"react"|from\s*'react'/g, 'from "./react-falso.js"')
);
const arqPainel = join(outDir, 'painelCarrinho.js');
writeFileSync(arqPainel, readFileSync(arqPainel, 'utf8').replace(/from\s*"react"|from\s*'react'/g, 'from "./react-falso.js"'));

// localStorage de mentira, antes de importar o módulo (ele lê no carregamento).
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

const { adicionarAoCarrinho, alterarQuantidade, removerDoCarrinho, limparCarrinho, totalItensCarrinho, useCarrinho } =
  await import(pathToFileURL(arq).href);
const { entrar } = await import(pathToFileURL(join(outDir, 'supabase-falso.js')).href);
const painel = await import(pathToFileURL(arqPainel).href);

const produto = (slug) => ({ slug, nome: slug, codigo: null, imagem: null, hex: null });
const lerChave = (k) => JSON.parse(guardado.get(k) ?? '[]');

// ============================================================ contagem
console.log('\n=== CONTAGEM DO CRACHÁ ===');
ok('carrinho vazio conta zero', totalItensCarrinho([]) === 0);
ok(
  '3 rolos contam 3 (era 1 quando contava linhas)',
  totalItensCarrinho([{ slug: 'a', unidade: 'rolo', qtd: 3, lpns: [] }]) === 3
);
ok('linha de metros conta 1, não 12,5', totalItensCarrinho([{ slug: 'a', unidade: 'metro', qtd: 12.5, lpns: [] }]) === 1);
ok(
  'misto soma certo',
  totalItensCarrinho([
    { slug: 'a', unidade: 'rolo', qtd: 2, lpns: [] },
    { slug: 'b', unidade: 'metro', qtd: 7, lpns: [] },
  ]) === 3
);

// ============================================================== itens
console.log('\n=== ITENS ===');
limparCarrinho();
adicionarAoCarrinho({ ...produto('mcx-preto'), unidade: 'rolo', qtd: 1 });
adicionarAoCarrinho({ ...produto('mcx-preto'), unidade: 'rolo', qtd: 2 });
ok('mesmo produto e unidade somam numa linha só', useCarrinho().length === 1 && useCarrinho()[0].qtd === 3);

adicionarAoCarrinho({ ...produto('mcx-preto'), unidade: 'metro', qtd: 4.5 });
ok('mesma cor em metro é outra linha', useCarrinho().length === 2);
ok('crachá reflete rolos + linha de metro', totalItensCarrinho() === 4);

alterarQuantidade('mcx-preto', 'metro', 0);
ok('quantidade zero remove a linha', useCarrinho().length === 1);

alterarQuantidade('mcx-preto', 'rolo', 2);
ok('alterar quantidade grava', useCarrinho()[0].qtd === 2);

removerDoCarrinho('mcx-preto', 'rolo');
ok('remover esvazia', useCarrinho().length === 0);

// =================================================== chave por usuário
console.log('\n=== CHAVE POR USUÁRIO ===');
guardado.clear();
adicionarAoCarrinho({ ...produto('sh-vermelho'), unidade: 'rolo', qtd: 2 });
ok('visitante grava na chave sem sufixo', lerChave('nz:carrinho').length === 1);

entrar('user-A');
ok('ao entrar, o carrinho do visitante vem junto', useCarrinho().length === 1 && useCarrinho()[0].qtd === 2);
ok('e passa a morar na chave do usuário', lerChave('nz:carrinho:user-A').length === 1);
ok('a chave de visitante fica vazia', lerChave('nz:carrinho').length === 0);

adicionarAoCarrinho({ ...produto('avery-branco'), unidade: 'metro', qtd: 10 });
ok('compras do logado vão para a chave dele', lerChave('nz:carrinho:user-A').length === 2);

entrar(null);
ok('sair esvazia a tela (o carrinho do usuário não vaza)', useCarrinho().length === 0);
ok('mas continua guardado para quando ele voltar', lerChave('nz:carrinho:user-A').length === 2);

entrar('user-B');
ok('outro usuário no mesmo computador começa do zero', useCarrinho().length === 0);
adicionarAoCarrinho({ ...produto('oracal-azul'), unidade: 'rolo', qtd: 1 });

entrar('user-A');
ok('voltando, cada um acha o seu', useCarrinho().length === 2);
ok('e o do outro segue intacto', lerChave('nz:carrinho:user-B').length === 1);

// Visitante monta uma lista com um item que o usuário JÁ tinha: soma, não duplica.
entrar(null);
adicionarAoCarrinho({ ...produto('sh-vermelho'), unidade: 'rolo', qtd: 1 });
entrar('user-A');
const linhaSh = useCarrinho().filter((i) => i.slug === 'sh-vermelho' && i.unidade === 'rolo');
ok('item repetido na fusão vira uma linha só', linhaSh.length === 1);
ok('e a quantidade soma (2 + 1)', linhaSh[0]?.qtd === 3);

// ============================================================= painel
console.log('\n=== PAINEL LATERAL ===');
ok('nasce fechado', painel.usePainelCarrinho() === null);
painel.abrirPainelCarrinho({ slug: 'sh-vermelho', unidade: 'rolo' });
ok('abre marcando o que entrou', painel.usePainelCarrinho()?.destaque?.slug === 'sh-vermelho');
painel.abrirPainelCarrinho();
ok('abre sem destaque quando vem do ícone da barra', painel.usePainelCarrinho()?.destaque === null);
painel.fecharPainelCarrinho();
ok('fecha', painel.usePainelCarrinho() === null);

rmSync(outDir, { recursive: true, force: true });
console.log(`\n${falhas ? `${falhas} FALHA(S)` : 'tudo certo'}`);
process.exit(falhas ? 1 : 0);
