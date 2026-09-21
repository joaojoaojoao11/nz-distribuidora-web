#!/usr/bin/env node
/**
 * Publica as fotos de aplicação de uma cor: baixa, converte, grava e sobe.
 *
 * POR QUE ISTO EXISTE
 * -------------------
 * Antes cada cor era publicada com um PowerShell montado na hora. O custo
 * apareceu em três formas:
 *
 *   - escape. O comando embutia JavaScript dentro de uma here-string do
 *     PowerShell; `${n}` do template literal era interpolado pelo shell antes de
 *     chegar no node, e o comando quebrava.
 *   - `git push` que não executa e não reclama. Aconteceu: o commit ficou local
 *     e só foi descoberto comparando o hash de .git/refs/heads/master com o de
 *     origin/master.
 *   - `index.lock` preso, que trava `git add` e `git commit` com uma mensagem
 *     que parece grave e não é.
 *
 * Aqui os três viram checagem do programa, não atenção de quem digita.
 *
 * O `git add` é SEMPRE por caminho explícito. Neste repositório `git status`
 * lista dezenas de arquivos como modificados por diferença de fim de linha
 * (OneDrive), então `git add -A` levaria junto o que ninguém pediu.
 *
 * USO
 * ---
 *   node scripts/publicar-cor.mjs <slug>              baixa, converte e grava
 *   node scripts/publicar-cor.mjs <slug> --apenas 5   refaz só a foto 5
 *   node scripts/publicar-cor.mjs <slug> --commit     adiciona, commita e sobe
 *
 * São dois passos de propósito: entre um e outro entra a correção de cor
 * (scripts/medir-cor.py e scripts/recolorir-capa.py), que trabalha sobre os
 * arquivos já gravados.
 *
 * O que publicar sai de scripts/data/publicacao.json.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// sharp entra por import dinâmico lá dentro, só no passo que converte imagem.
// No topo ele derrubava também o `--commit` e as mensagens de erro, que não têm
// nada a ver com imagem — e derrubava em qualquer máquina onde o binário nativo
// não casasse com a plataforma.

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFESTO = path.join(RAIZ, 'scripts/data/publicacao.json');
const DESTINO = 'public/assets/images/metamark/mcx/aplicacao';
const DESTINO_CAPA = 'public/assets/images/shop/metamark-mcx';
const TMP = path.join(RAIZ, 'scripts/output/.tmp-publicar');

const LARGURA = 1600;
const QUALIDADE = 86;

const cor = (c, t) => `\x1b[${c}m${t}\x1b[0m`;
const ok = (t) => cor(32, t);
const aviso = (t) => cor(33, t);
const erro = (t) => cor(31, t);

function morrer(msg) {
  console.error(`\n${erro('erro')}  ${msg}\n`);
  process.exit(1);
}

function git(...args) {
  return execFileSync('git', args, { cwd: RAIZ, encoding: 'utf8' }).trim();
}

/** Lock preso trava add e commit com uma mensagem assustadora e inofensiva. */
function limparLock() {
  const lock = path.join(RAIZ, '.git/index.lock');
  if (existsSync(lock)) {
    rmSync(lock, { force: true });
    console.log(aviso('  removido um .git/index.lock preso de execução anterior'));
  }
}

async function baixar(url, destino) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} em ${url}`);
  writeFileSync(destino, Buffer.from(await r.arrayBuffer()));
}

/**
 * `apenas` existe porque refazer UMA foto de um conjunto é comum, e sem ele o
 * script rebaixaria as outras por cima do que já foi corrigido. A correção de
 * cor acontece depois do download e mora só no arquivo convertido — não há de
 * onde recuperá-la. Aconteceu de quase acontecer na MCX-87.
 */
async function preparar(slug, entrada, apenas) {
  const { default: sharp } = await import('sharp');
  if (apenas) {
    entrada = { ...entrada, fotos: entrada.fotos.filter((f) => apenas.includes(f.n)) };
    if (!entrada.fotos.length) morrer(`nenhuma foto com esses números neste slug`);
    console.log(aviso(`\nsó as fotos ${apenas.join(', ')} — as outras ficam como estão no disco`));
  }
  mkdirSync(TMP, { recursive: true });
  mkdirSync(path.join(RAIZ, DESTINO), { recursive: true });

  console.log(`\n${slug} — ${entrada.fotos.length} fotos\n`);
  for (const foto of entrada.fotos) {
    const bruto = path.join(TMP, `${slug}-${foto.n}.png`);
    process.stdout.write(`  -${foto.n} ${(foto.nota ?? '').padEnd(22)} baixando…`);
    await baixar(foto.url, bruto);

    const saida = path.join(RAIZ, DESTINO, `${slug}-${foto.n}.jpg`);
    const info = await sharp(bruto)
      .resize({ width: LARGURA, withoutEnlargement: true })
      .jpeg({ quality: QUALIDADE, mozjpeg: true })
      .toFile(saida);

    const kb = (statSync(saida).size / 1024).toFixed(0);
    process.stdout.write(`\r  -${foto.n} ${(foto.nota ?? '').padEnd(22)} ${info.width}×${info.height}  ${kb} kB   ${ok('gravado')}\n`);
  }
  // A capa só vem por aqui quando foi REGERADA. Quando a composição aprovada
  // ainda serve, o caminho certo é recolorir o arquivo que já está no
  // repositório com scripts/recolorir-capa.py — ver a nota em generic.ts.
  // Ela é 1600x1600: o card da loja é 1:1 e um retângulo esticado fica ruim ao
  // lado dos outros.
  if (entrada.capa && !apenas) {
    mkdirSync(path.join(RAIZ, DESTINO_CAPA), { recursive: true });
    const bruto = path.join(TMP, `${slug}-capa.png`);
    process.stdout.write(`  capa ${''.padEnd(22)} baixando…`);
    await baixar(entrada.capa, bruto);
    const saida = path.join(RAIZ, DESTINO_CAPA, `${slug}.webp`);
    const info = await sharp(bruto)
      .resize(1600, 1600, { fit: 'cover', position: 'centre', withoutEnlargement: true })
      .webp({ quality: 88, effort: 6 })
      .toFile(saida);
    const kb = (statSync(saida).size / 1024).toFixed(0);
    process.stdout.write(`\r  capa ${''.padEnd(22)} ${info.width}×${info.height}  ${kb} kB   ${ok('gravado')}\n`);
  }

  rmSync(TMP, { recursive: true, force: true });

  console.log(`\n${ok('pronto')} — arquivos em ${DESTINO}/`);
  if (entrada.leitura) {
    console.log(`\npróximo passo, conferir a cor contra a leitura ${entrada.leitura}:`);
    console.log(`  python3 scripts/medir-cor.py --alvo '${entrada.leitura}' ` +
      `--familia ${entrada.familia ?? 'verde'} ${DESTINO}/${slug}-*.jpg`);
  }
  console.log(`\ndepois de corrigir a cor:\n  node scripts/publicar-cor.mjs ${slug} --commit\n`);
}

function publicar(slug, entrada) {
  const caminhos = [
    ...entrada.fotos.map((f) => `${DESTINO}/${slug}-${f.n}.jpg`),
    ...(entrada.extras ?? []),
  ];

  const faltando = caminhos.filter((c) => !existsSync(path.join(RAIZ, c)));
  if (faltando.length) {
    morrer(`estes arquivos não existem ainda:\n        ${faltando.join('\n        ')}\n` +
      `        rode primeiro: node scripts/publicar-cor.mjs ${slug}`);
  }

  limparLock();
  git('add', '--', ...caminhos);

  const staged = git('diff', '--cached', '--name-only');
  if (!staged) {
    console.log(aviso('\nnada mudou — os arquivos já estão como no último commit.\n'));
    return;
  }
  console.log(`\nvai subir:\n${staged.split('\n').map((l) => `  ${l}`).join('\n')}\n`);

  git('commit', '-m', entrada.mensagem ?? `feat(${slug}): fotos de aplicacao`);

  const antes = git('rev-parse', '--short', 'HEAD');
  git('push');

  // O push que não executa e não reclama: comparar é a única forma de saber.
  git('fetch', '--quiet', 'origin');
  const local = git('rev-parse', 'HEAD');
  const remoto = git('rev-parse', 'origin/master');
  if (local !== remoto) {
    morrer(`o push NÃO chegou ao remoto.\n        local  ${local.slice(0, 7)}\n` +
      `        remoto ${remoto.slice(0, 7)}\n        rode 'git push' de novo e confira.`);
  }

  console.log(`${ok('publicado')}  commit ${antes} — local e remoto batem (${local.slice(0, 7)}).`);
  console.log('A Vercel builda a partir do push. O catálogo fica até 5 min cacheado na borda;');
  console.log('para ver antes disso, abra a loja logado como admin ou use ?nocache=1.');
  console.log(`\n${aviso('falta')}  inserir as fotos em produto_midia — e só DEPOIS que o build`);
  console.log('        terminar. A loja lê a galeria do banco, não do código: linha inserida');
  console.log('        antes do deploy aponta para arquivo que ainda não existe, e o anúncio');
  console.log('        mostra miniatura quebrada. Aconteceu na MCX-54.\n');
}

const [slug, ...flags] = process.argv.slice(2);
if (!slug) morrer('uso: node scripts/publicar-cor.mjs <slug> [--commit]');

const manifesto = JSON.parse(readFileSync(MANIFESTO, 'utf8'));
const entrada = manifesto[slug];
if (!entrada) {
  const slugs = Object.keys(manifesto).filter((k) => !k.startsWith('_'));
  morrer(`'${slug}' não está em scripts/data/publicacao.json.\n        disponíveis: ${slugs.join(', ') || '(nenhum)'}`);
}

const iApenas = flags.indexOf('--apenas');
const apenas = iApenas >= 0 ? (flags[iApenas + 1] ?? '').split(',').map(Number).filter(Boolean) : null;
if (iApenas >= 0 && !apenas?.length) morrer('--apenas precisa dos números das fotos, ex: --apenas 5');

if (flags.includes('--commit')) publicar(slug, entrada);
else await preparar(slug, entrada, apenas);
