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
 *   node scripts/publicar-cor.mjs <slug> --so-capa    refaz só a capa
 *   node scripts/publicar-cor.mjs <slug> --tudo       baixa, CORRIGE a cor,
 *                                                     commita, sobe e grava
 *   node scripts/publicar-cor.mjs <slug> --commit     commita, sobe, espera o
 *                                                     deploy e registra no banco
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
// Caminhos padrao = MetaCast MCX, que foi a primeira linha a passar por aqui.
// Outras linhas (Speed Wrapping, ORACAL...) guardam as imagens em outro lugar,
// entao a entrada do manifesto pode sobrescrever os tres. `url_base` e o que vai
// para produto_midia; `destino` e onde o arquivo fica no repositorio. Os dois
// precisam apontar para o mesmo arquivo, so que um com e outro sem `public/`.
const DESTINO = 'public/assets/images/metamark/mcx/aplicacao';
const DESTINO_CAPA = 'public/assets/images/shop/metamark-mcx';
const URL_BASE = '/assets/images/metamark/mcx/aplicacao';

const dirFotos = (e) => e?.destino ?? DESTINO;
const dirCapa = (e) => e?.destino_capa ?? DESTINO_CAPA;
const urlBase = (e) => e?.url_base ?? URL_BASE;
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

/**
 * Lock preso trava add, commit e push com uma mensagem assustadora e inofensiva.
 *
 * São TRÊS, não um. O index.lock é o famoso, mas um git interrompido no meio do
 * commit deixa também HEAD.lock e refs/heads/<branch>.lock, e esses dois dão a
 * mesma mensagem por outro motivo. Aconteceu aqui: um processo morreu na metade
 * e só o index.lock era limpo.
 */
function limparLock() {
  const branch = (() => { try { return git('rev-parse', '--abbrev-ref', 'HEAD'); } catch { return 'master'; } })();
  const locks = ['.git/index.lock', '.git/HEAD.lock', `.git/refs/heads/${branch}.lock`];
  for (const rel of locks) {
    const lock = path.join(RAIZ, rel);
    if (existsSync(lock)) {
      rmSync(lock, { force: true });
      console.log(aviso(`  removido ${rel} preso de execução anterior`));
    }
  }
}

/**
 * Baixa a versão LEVE quando ela existe.
 *
 * O Higgsfield publica, ao lado do PNG, um `<nome>_min.webp` na MESMA
 * resolução — 2528x1696 — com 0,43 MB contra 9,62 MB. Medido: depois do nosso
 * resize para 1600px o PSNR contra o PNG é 38,1 dB, a diferença média por canal
 * é 2,33, e a mediana RGB que a gente usa para conferir cor muda em UMA unidade.
 * Ou seja, indistinguível para o que fazemos, e 22 vezes menos download — por
 * cor, 38 MB viram 1,7 MB. Se o `_min` não existir, cai no original.
 */
async function baixar(url, destino) {
  const leve = url.replace(/\.png$/i, '_min.webp');
  if (leve !== url) {
    try {
      const r = await fetch(leve);
      if (r.ok) {
        writeFileSync(destino, Buffer.from(await r.arrayBuffer()));
        return 'leve';
      }
    } catch { /* cai no original */ }
  }
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} em ${url}`);
  writeFileSync(destino, Buffer.from(await r.arrayBuffer()));
  return 'original';
}

// --------------------------------------------------------------- banco

const SITE = 'https://www.nzgroup.com.br';

function env() {
  const txt = readFileSync(path.join(RAIZ, '.env'), 'utf8');
  const e = Object.fromEntries(
    txt.split(/\r?\n/).filter((l) => l.includes('=') && !l.trim().startsWith('#')).map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')];
    })
  );
  if (!e.VITE_SUPABASE_URL || !e.SUPABASE_SERVICE_ROLE_KEY) {
    morrer('faltam VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env');
  }
  return e;
}

async function pg(e, caminho, init = {}) {
  const r = await fetch(`${e.VITE_SUPABASE_URL}/rest/v1/${caminho}`, {
    ...init,
    headers: {
      apikey: e.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${e.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(init.headers ?? {}),
    },
  });
  const txt = await r.text();
  if (!r.ok) throw new Error(`PostgREST ${r.status}: ${txt.slice(0, 200)}`);
  return txt ? JSON.parse(txt) : null;
}

/**
 * Espera as imagens existirem EM PRODUÇÃO antes de tocar no banco.
 *
 * A loja lê a galeria do banco, não do código. Linha inserida antes do deploy
 * terminar aponta para arquivo que ainda não existe, e o anúncio mostra
 * miniatura quebrada — foi o que aconteceu na MCX-54. Esperar aqui torna esse
 * erro impossível, em vez de depender de alguém lembrar da ordem.
 */
async function esperarNoAr(urls, limiteMs = 6 * 60_000) {
  const inicio = Date.now();
  process.stdout.write('  esperando o deploy publicar as imagens');
  for (;;) {
    // HEAD .ok NAO basta: o site e SPA e o Vercel devolve index.html com 200
    // para caminho inexistente. Foi assim que a ESG-030 passou na espera com a
    // URL errada e entrou torta no banco. Confere o content-type tambem.
    const res = await Promise.all(urls.map((u) => fetch(SITE + u, { method: 'HEAD', cache: 'no-store' })
      .then((r) => r.ok && (r.headers.get('content-type') ?? '').startsWith('image/')).catch(() => false)));
    if (res.every(Boolean)) { process.stdout.write(` ${ok('no ar')}\n`); return true; }
    if (Date.now() - inicio > limiteMs) { process.stdout.write(` ${erro('tempo esgotado')}\n`); return false; }
    process.stdout.write('.');
    await new Promise((r) => setTimeout(r, 10_000));
  }
}

/**
 * `apenas` existe porque refazer UMA foto de um conjunto é comum, e sem ele o
 * script rebaixaria as outras por cima do que já foi corrigido. A correção de
 * cor acontece depois do download e mora só no arquivo convertido — não há de
 * onde recuperá-la. Aconteceu de quase acontecer na MCX-87.
 */
async function preparar(slug, entrada, apenas, soCapa) {
  const { default: sharp } = await import('sharp');
  // --so-capa existe porque mexer na marca da capa e comum e as fotos ja podem
  // estar corrigidas no disco: rebaixar todas por cima seria perder a correcao.
  if (soCapa) {
    entrada = { ...entrada, fotos: [] };
    console.log(aviso('\nsó a capa — as fotos ficam como estão no disco'));
  } else if (apenas) {
    entrada = { ...entrada, fotos: entrada.fotos.filter((f) => apenas.includes(f.n)) };
    if (!entrada.fotos.length) morrer(`nenhuma foto com esses números neste slug`);
    console.log(aviso(`\nsó as fotos ${apenas.join(', ')} — as outras ficam como estão no disco`));
  }
  mkdirSync(TMP, { recursive: true });
  mkdirSync(path.join(RAIZ, dirFotos(entrada)), { recursive: true });

  console.log(`\n${slug} — ${entrada.fotos.length} fotos\n`);
  for (const foto of entrada.fotos) {
    const bruto = path.join(TMP, `${slug}-${foto.n}.png`);
    process.stdout.write(`  -${foto.n} ${(foto.nota ?? '').padEnd(22)} baixando…`);
    await baixar(foto.url, bruto);

    const saida = path.join(RAIZ, dirFotos(entrada), `${slug}-${foto.n}.jpg`);
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
  if (entrada.capa && (soCapa || !apenas)) {
    mkdirSync(path.join(RAIZ, dirCapa(entrada)), { recursive: true });
    const bruto = path.join(TMP, `${slug}-capa.png`);
    process.stdout.write(`  capa ${''.padEnd(22)} baixando…`);
    await baixar(entrada.capa, bruto);
    const saida = path.join(RAIZ, dirCapa(entrada), `${slug}.webp`);
    // A capa gerada sai SEM marca: pedir o logotipo ao modelo devolve letra
    // torta e nome errado. O logo oficial entra aqui por composicao, recortado
    // uma vez de uma capa aprovada e guardado com alfa em scripts/data/. Assim
    // ele fica pixel a pixel igual em toda a linha.
    //   logo: { arquivo, largura, esquerda, topo }  — fracoes do lado da capa
    const LADO = 1600;
    let capa = sharp(bruto)
      .resize(LADO, LADO, { fit: 'cover', position: 'centre', withoutEnlargement: true });
    if (entrada.logo) {
      const L = entrada.logo;
      const marca = await sharp(path.join(RAIZ, L.arquivo))
        .resize({ width: Math.round(LADO * L.largura) })
        .toBuffer();
      capa = sharp(await capa.png().toBuffer()).composite([{
        input: marca,
        left: Math.round(LADO * L.esquerda),
        top: Math.round(LADO * L.topo),
      }]);
      process.stdout.write(`\r  capa ${''.padEnd(22)} marca aplicada…`);
    }
    const info = await capa.webp({ quality: 88, effort: 6 }).toFile(saida);
    const kb = (statSync(saida).size / 1024).toFixed(0);
    process.stdout.write(`\r  capa ${''.padEnd(22)} ${info.width}×${info.height}  ${kb} kB   ${ok('gravado')}\n`);
  }

  // Faxina não pode derrubar o trabalho. Nesta pasta, que fica dentro do
  // OneDrive, o sincronizador segura o arquivo por um instante depois da
  // escrita e o rmSync leva EPERM — com as imagens já gravadas no lugar certo.
  // Tenta algumas vezes e, se não der, avisa e segue: sobra um diretório
  // temporário, que o próximo `--commit` não inclui porque o add é por caminho.
  for (let i = 0; i < 4; i++) {
    try { rmSync(TMP, { recursive: true, force: true }); break; }
    catch {
      if (i === 3) { console.log(aviso(`  não consegui apagar ${TMP} (OneDrive segurando) — pode apagar à mão depois`)); break; }
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  console.log(`\n${ok('pronto')} — arquivos em ${dirFotos(entrada)}/`);
  if (entrada.leitura) {
    console.log(`\npróximo passo, conferir a cor contra a leitura ${entrada.leitura}:`);
    console.log(`  python3 scripts/medir-cor.py --alvo '${entrada.leitura}' ` +
      `--familia ${entrada.familia ?? 'verde'} ${dirFotos(entrada)}/${slug}-*.jpg`);
  }
  console.log(`\ndepois de corrigir a cor:\n  node scripts/publicar-cor.mjs ${slug} --commit\n`);
}

/* ------------------------------------------------------------------ *
 * Correcao de cor, automatica
 *
 * Ate aqui a correcao era um passo manual no meio: baixar, medir, rodar
 * recolorir-capa.py a mao, so entao commitar. O script mede a imagem sozinho e
 * calcula a gama que leva a mediana ao alvo, entao esse passo nunca precisou de
 * gente — precisava so de alguem chamando ele.
 *
 * A primeira versao disto chamava o Python por spawn. Nao servia: a maquina de
 * producao nao tinha numpy/scipy/pillow, e o comando unico morria no meio, com
 * as imagens ja baixadas e nada commitado. Agora a matematica mora em
 * scripts/lib/cor.mjs, em JS puro sobre o buffer cru do sharp — que o script ja
 * usava. Zero dependencia nova, funciona em qualquer maquina que roda `npm i`.
 *
 * O recolorir-capa.py continua sendo a referencia documentada e a ferramenta de
 * inspecao manual. Os dois foram conferidos imagem a imagem na ESG-032 e dao o
 * mesmo resultado (H 347,6 · S 63,0 · V 78,4 na capa, nos dois).
 *
 * O freio: se a correcao CRIAR estouro em mais de 2% do filme, a imagem esta
 * longe demais do alvo e precisa ser REGERADA, nao corrigida. Nesse caso o
 * comando para antes do commit e o disco fica como estava.
 *
 * "Criar" e a palavra que importa, e custou uma rodada. A primeira versao
 * contava o TOTAL de pixels com saturacao no teto depois da correcao. Numa cor
 * de saturacao quase maxima — a ESG-033 Python Green le S 98, com o canal
 * vermelho no batente da camera — boa parte dos pixels ja nasce em 100%. O
 * medidor acusou 19% a 39% de estouro e abortou a publicacao de cinco imagens
 * que tinham fechado EXATAS no alvo (H 155,3 · S 98,2 contra H 155 · S 98).
 * Agora so conta pixel que estava abaixo do teto antes e chegou no teto depois.
 * ------------------------------------------------------------------ */
const ESTOURO_MAX = 2.0;

/**
 * Grava por cima, aguentando o OneDrive.
 *
 * O sincronizador segura o arquivo por um instante depois de qualquer escrita, e
 * a gravacao seguinte volta EPERM. Foi o que derrubou a capa da ESG-033 num
 * comando em que as quatro fotos ja tinham fechado. Duas correcoes aqui:
 *   - a imagem e resolvida em BUFFER antes de tocar no destino, entao nao existe
 *     handle aberto sobre o arquivo que estamos sobrescrevendo;
 *   - a escrita tenta de novo com espera crescente, em vez de desistir na hora.
 */
async function gravarComRetentativa(caminho, buf, tentativas = 6) {
  for (let i = 0; i < tentativas; i++) {
    try { writeFileSync(caminho, buf); return; }
    catch (e) {
      if (!['EPERM', 'EBUSY', 'EACCES'].includes(e.code) || i === tentativas - 1) throw e;
      await new Promise((r) => setTimeout(r, 300 * (i + 1)));
    }
  }
}

async function corrigirArquivo(sharp, caminho, alvo, familia, manterValor, extra = {}) {
  const { recolorir } = await import('./lib/cor.mjs');
  let img = sharp(readFileSync(caminho)), r = null;
  // Duas passadas: a primeira encosta, a segunda fecha. O arquivo e lossy e a
  // releitura muda um pouco — medido em todas as cores da Speed Wrapping.
  for (let passo = 0; passo < 2; passo++) {
    const { data, info } = await img.removeAlpha().raw().toBuffer({ resolveWithObject: true });
    r = recolorir(data, { W: info.width, H: info.height, alvo, familia, manterValor, ...extra });
    if (Math.max(r.corteS, r.corteV) > ESTOURO_MAX) return r;
    img = sharp(r.buf, { raw: { width: info.width, height: info.height, channels: 3 } });
  }
  const webp = path.extname(caminho).toLowerCase() === '.webp';
  const saida = await (webp
    ? img.webp({ quality: 92, effort: 6 })
    : img.jpeg({ quality: QUALIDADE, mozjpeg: true })).toBuffer();
  await gravarComRetentativa(caminho, saida);
  return r;
}

async function corrigir(slug, entrada) {
  if (!entrada.leitura) { console.log(aviso('\nsem `leitura` no manifesto — correção pulada')); return; }
  const { default: sharp } = await import('sharp');
  const { hexParaHsv } = await import('./lib/cor.mjs');
  const alvo = hexParaHsv(entrada.leitura);
  const fam = entrada.familia ?? 'verde';
  console.log(`\ncorrigindo a cor contra ${entrada.leitura} (família ${fam})\n`);

  const alvos = entrada.fotos.map((f) => ({
    caminho: path.join(RAIZ, dirFotos(entrada), `${slug}-${f.n}.jpg`),
    nome: `-${f.n} ${f.nota ?? ''}`,
    // Em foto de cena metade da lataria esta em sombra: levantar o valor ate a
    // leitura clareia o carro a toa. So matiz e saturacao andam.
    manterValor: true,
  }));
  if (entrada.capa) {
    alvos.push({ caminho: path.join(RAIZ, dirCapa(entrada), `${slug}.webp`), nome: 'capa', manterValor: false });
  }

  let parar = null;
  for (const a of alvos) {
    if (!existsSync(a.caminho)) continue;
    let r;
    try {
      // `sat_min` no manifesto: cor quase cinza (ESG-036 Armor Green, S 12,6) fica
      // abaixo do corte padrao de 0,18 e a mascara sai vazia. O corte existe para
      // separar filme de fundo cinza; nessas cores quem separa e a faixa de matiz.
      r = await corrigirArquivo(sharp, a.caminho, alvo, fam, a.manterValor,
        entrada.sat_min != null ? { satMin: entrada.sat_min } : {});
    } catch (e) {
      console.log(`  ${a.nome.padEnd(26)} ${erro('falhou')}   ${e.message}`);
      parar = { nome: a.nome, causa: 'erro', detalhe: e.message }; continue;
    }
    const d = `H${r.depois.h.toFixed(1)} S${r.depois.s.toFixed(1)} V${r.depois.v.toFixed(1)}`;
    const estouro = Math.max(r.corteS, r.corteV);
    if (estouro > ESTOURO_MAX) {
      console.log(`  ${a.nome.padEnd(26)} ${erro('ESTOUROU')} ${d}  (${estouro.toFixed(1)}% do filme)`);
      parar = { nome: a.nome, causa: 'estouro', detalhe: `${estouro.toFixed(1)}%` };
    } else {
      const dS = Math.abs(r.depois.s - alvo[1] * 100);
      const marca = dS <= 1.5 ? ok('fechou') : aviso('atenção');
      console.log(`  ${a.nome.padEnd(26)} ${marca}   ${d}   ΔS ${dS.toFixed(1)}  estouro ${estouro.toFixed(1)}%`);
    }
  }
  if (parar) {
    // A mensagem tem que dizer o que de fato aconteceu. A primeira versao
    // imprimia "estourou mais de 2%" para QUALQUER falha, inclusive um EPERM do
    // OneDrive — e mandava regerar uma imagem que estava perfeita.
    if (parar.causa === 'estouro') {
      morrer(`a correção de "${parar.nome}" criou estouro em ${parar.detalhe} do filme.\n` +
        '        Nada foi commitado. Essa imagem está longe demais do alvo e precisa ser\n' +
        '        REGERADA na cor, não corrigida. Refaça a geração e rode de novo.');
    }
    morrer(`não consegui processar "${parar.nome}":\n        ${parar.detalhe}\n\n` +
      '        Nada foi commitado, e a cor não foi alterada no disco.\n' +
      '        Se for EPERM ou EBUSY, é o OneDrive segurando o arquivo: espere alguns\n' +
      '        segundos e rode o mesmo comando de novo.');
  }

  // Cor de matiz alto (acima de ~345) cai na familia 'vermelho', que contem o
  // vermelho do logotipo Speed Wrapping (matiz 1,6). Nessas a marca so pode
  // entrar DEPOIS da correcao, senao ela e repintada junto.
  if (entrada.marca_depois && entrada.capa) {
    const L = entrada.marca_depois;
    const capa = path.join(RAIZ, dirCapa(entrada), `${slug}.webp`);
    const lado = (await sharp(capa).metadata()).width;
    const marca = await sharp(path.join(RAIZ, L.arquivo))
      .resize({ width: Math.round(lado * L.largura) }).toBuffer();
    const buf = await sharp(capa).composite([{
      input: marca, left: Math.round(lado * L.esquerda), top: Math.round(lado * L.topo),
    }]).webp({ quality: 92, effort: 6 }).toBuffer();
    writeFileSync(capa, buf);
    console.log(`  ${'marca na capa'.padEnd(26)} ${ok('aplicada')}`);
  }
}

function publicar(slug, entrada) {
  const caminhos = [
    ...entrada.fotos.map((f) => `${dirFotos(entrada)}/${slug}-${f.n}.jpg`),
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
    console.log(aviso('\nnada mudou no git — os arquivos já estão como no último commit.'));
    return false;
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

  console.log(`${ok('publicado')}  commit ${antes} — local e remoto batem (${local.slice(0, 7)}).\n`);
  return true;
}

/** Insere as fotos em produto_midia. Idempotente: URL que já existe é pulada. */
async function registrar(slug, entrada) {
  const e = env();
  const urls = entrada.fotos.map((f) => `${urlBase(entrada)}/${slug}-${f.n}.jpg`);
  if (!(await esperarNoAr(urls))) {
    morrer('as imagens não subiram a tempo. Rode de novo quando o deploy terminar — nada foi\n' +
      '        escrito no banco, então repetir é seguro.');
  }

  const prod = await pg(e, `produtos?slug=eq.${slug}&select=id`);
  if (!prod?.length) morrer(`não achei o produto '${slug}' na tabela produtos`);
  const id = prod[0].id;

  let jaTem = await pg(e, `produto_midia?produto_id=eq.${id}&select=url,ordem`);

  // Produto recem-criado pelo ERP nasce SEM a capa em produto_midia: as cores
  // antigas ja tinham a capa cadastrada, entao este passo so inseria as fotos.
  // Na ESG-038 (primeiro produto novo) a pagina subiu sem capa. Se a capa existe
  // no disco e nao esta no banco, ela entra na posicao 0, como capa.
  const urlCapa = `${dirCapa(entrada).replace(/^public/, '')}/${slug}.webp`;
  const temCapaNoDisco = existsSync(path.join(RAIZ, dirCapa(entrada), `${slug}.webp`));
  if (temCapaNoDisco && !jaTem.some((m) => m.url === urlCapa)) {
    for (const m of [...jaTem].sort((a, b) => b.ordem - a.ordem)) {
      await pg(e, `produto_midia?produto_id=eq.${id}&url=eq.${encodeURIComponent(m.url)}`,
        { method: 'PATCH', body: JSON.stringify({ ordem: m.ordem + 1 }) });
    }
    await pg(e, 'produto_midia', { method: 'POST', body: JSON.stringify([{
      produto_id: id, tipo: 'imagem', url: urlCapa, ordem: 0, capa: true, origem: 'estatico',
      alt: `Rolo ${(entrada.alt_base ?? slug).replace(/^.* em /, '')}`,
    }]) });
    await pg(e, `produtos?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ imagem: urlCapa }) });
    console.log(`  ${ok('capa')} registrada como imagem principal (estava faltando no banco).`);
    jaTem = await pg(e, `produto_midia?produto_id=eq.${id}&select=url,ordem`);
  }
  const existentes = new Set(jaTem.map((m) => m.url));
  let ordem = jaTem.reduce((mx, m) => Math.max(mx, m.ordem), -1);

  const novas = entrada.fotos
    .map((f) => ({ f, url: `${urlBase(entrada)}/${slug}-${f.n}.jpg` }))
    .filter(({ url }) => !existentes.has(url))
    .map(({ f, url }) => ({
      produto_id: id, tipo: 'imagem', url, ordem: ++ordem, capa: false, origem: 'estatico',
      alt: f.alt ?? `${entrada.alt_base ?? slug} — ${f.nota ?? 'foto de aplicação'}`,
    }));

  if (!novas.length) {
    console.log(aviso('  banco já tinha todas as fotos — nada a inserir.\n'));
  } else {
    await pg(e, 'produto_midia', { method: 'POST', body: JSON.stringify(novas) });
    console.log(`  ${ok('inseridas')} ${novas.length} fotos em produto_midia (ordem ${novas[0].ordem}–${ordem}).`);
  }

  const fim = await pg(e, `produto_midia?produto_id=eq.${id}&select=url,ordem,capa&order=ordem`);
  console.log(`\n  galeria final de ${slug} — ${fim.length} mídias:`);
  for (const m of fim) console.log(`    ${String(m.ordem).padStart(2)}${m.capa ? ' (capa)' : '      '}  ${m.url.split('/').pop()}`);
  console.log('\nO catálogo fica até 5 min cacheado na borda; para ver antes, abra a loja');
  console.log('logado como admin ou use ?nocache=1.\n');
}

const [slug, ...flags] = process.argv.slice(2);
if (!slug) morrer('uso: node scripts/publicar-cor.mjs <slug> [--tudo | --commit | --so-capa | --apenas N]');

const manifesto = JSON.parse(readFileSync(MANIFESTO, 'utf8'));
const entrada = manifesto[slug];
if (!entrada) {
  const slugs = Object.keys(manifesto).filter((k) => !k.startsWith('_'));
  morrer(`'${slug}' não está em scripts/data/publicacao.json.\n        disponíveis: ${slugs.join(', ') || '(nenhum)'}`);
}

const tudo = flags.includes('--tudo');
const soCapa = flags.includes('--so-capa');
const iApenas = flags.indexOf('--apenas');
const apenas = iApenas >= 0 ? (flags[iApenas + 1] ?? '').split(',').map(Number).filter(Boolean) : null;
if (iApenas >= 0 && !apenas?.length) morrer('--apenas precisa dos números das fotos, ex: --apenas 5');

if (tudo) {
  // Um comando so: baixa, corrige a cor, commita, sobe, espera o deploy e grava
  // no banco. A correcao para o processo se alguma imagem estourar, e nesse caso
  // nada e commitado — o estado no disco fica igual ao de antes do comando.
  await preparar(slug, entrada, apenas, soCapa);
  await corrigir(slug, entrada);
  publicar(slug, entrada);
  await registrar(slug, entrada);
} else if (flags.includes('--commit')) {
  if (flags.includes('--corrigir')) await corrigir(slug, entrada);
  publicar(slug, entrada);
  // O registro roda mesmo quando o git não tinha nada novo: é o caso de
  // repetir o comando depois de uma falha, com os arquivos já commitados.
  await registrar(slug, entrada);
} else {
  await preparar(slug, entrada, apenas, soCapa);
  if (flags.includes('--corrigir')) await corrigir(slug, entrada);
}
