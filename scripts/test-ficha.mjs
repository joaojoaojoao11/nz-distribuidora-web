// Autoteste da ficha técnica em camadas — sem rede, sem banco.
//
// A verificação que dá nome a este arquivo é a terceira: **quando a unidade do
// ERP é M2, `metragem_padrao` guarda ÁREA, não comprimento**. São 64 SKUs com
// 1,52 × 22,86 M2, e 22,86 é m² (1,524 × 15). Chamar isso de "metragem do
// rolo: 22,86 m" publica um número errado em 174 produtos — e é o tipo de erro
// que ninguém percebe lendo o código, só medindo o dado.
//
// A segunda razão deste arquivo existir: a promoção de ficha duplicada para a
// linha. A Etherna tem espessura frontal DIFERENTE por coleção (160/140/100
// micras). Um merge que deixasse a linha sobrescrever a variante apagaria essa
// diferença em 38 produtos sem erro nenhum.
//
// Uso: npm run ficha:test

import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(join(ROOT, 'node_modules/.cache'), { recursive: true });
const outDir = mkdtempSync(join(ROOT, 'node_modules/.cache/nz-ficha-'));

let falhas = 0;
const ok = (nome, cond, extra = '') => {
  console.log(`${cond ? '  OK  ' : ' FALHA'} ${nome}${extra ? ' — ' + extra : ''}`);
  if (!cond) falhas++;
};

const build = spawnSync(
  process.execPath,
  [
    join(ROOT, 'node_modules/esbuild/bin/esbuild'),
    'src/lib/shop/linhas.ts',
    '--bundle',
    `--outdir=${outDir}`,
    '--outbase=src/lib/shop',
    '--format=esm',
    '--platform=node',
    '--log-level=error',
  ],
  { cwd: ROOT, encoding: 'utf8' }
);
if (build.status !== 0) {
  console.error(build.stderr || build.stdout);
  process.exit(1);
}

const { fichaDoItem, fichaDoRolo, familiaDoItem, indexarLinhas } = await import(
  pathToFileURL(join(outDir, 'linhas.js')).href
);

// ------------------------------------------------------------------ fixtures

const item = (over = {}) => ({
  slug: 's',
  name: 'Produto',
  code: null,
  brand: 'NZ',
  line: null,
  lineKey: 'etherna',
  specs: [],
  larguraM: null,
  metragemPadrao: null,
  unidadeVenda: null,
  description: null,
  finishLabel: null,
  hex: null,
  durabilidadeAnos: null,
  garantiaAnos: null,
  ...over,
});

const linha = (over = {}) => ({
  linha_key: 'etherna',
  familia_key: null,
  label: 'Etherna Decor',
  marca_key: 'etherna',
  ficha: [],
  chamada: null,
  descricao: null,
  texto_venda: null,
  aplicacoes: [],
  cuidados: null,
  tds_url: null,
  tds_titulo: null,
  fonte_url: null,
  conferido_em: null,
  prefixos: [],
  nome_prefixos: [],
  ordem: 0,
  atualizado_em: null,
  ...over,
});

// ------------------------------------------------- 1. o m² disfarçado de metro
console.log('\n=== 1. unidade do ERP ===');
{
  const emM2 = fichaDoRolo(item({ larguraM: 1.524, metragemPadrao: 22.86, unidadeVenda: 'M2' }));
  const rotuloM2 = emM2.find((s) => /22,86/.test(s.value));
  ok('M2 vira "Área do rolo", não "Metragem"', rotuloM2?.label === 'Área do rolo', rotuloM2?.label);
  ok('e sai com m², não com m', rotuloM2?.value === '22,86 m²', rotuloM2?.value);

  const emML = fichaDoRolo(item({ larguraM: 1.52, metragemPadrao: 17, unidadeVenda: 'ML' }));
  const rotuloML = emML.find((s) => /17/.test(s.value));
  ok('ML continua sendo metragem linear', rotuloML?.label === 'Metragem do rolo', rotuloML?.label);
  ok('formatado em pt-BR', emML[0].value === '1,52 m', emML[0].value);

  ok('sem largura no ERP, não inventa linha', fichaDoRolo(item()).length === 0);
  ok('largura zero não vira "0 m"', fichaDoRolo(item({ larguraM: 0, metragemPadrao: 0 })).length === 0);
}

// ------------------------------------------- 2. a variante nunca perde da linha
console.log('\n=== 2. precedência ===');
{
  // O caso real: 35 padrões Etherna são de 140 micras, a linha afirma o resto.
  const indice = indexarLinhas([
    linha({
      ficha: [
        { label: 'Espessura frontal', value: '160 micras (dupla camada)' },
        { label: 'Adesivo', value: 'Cola acrílica aquosa' },
      ],
    }),
  ]);
  const f = fichaDoItem(item({ specs: [{ label: 'Espessura frontal', value: '140 micras' }] }), indice);
  ok('a espessura da COR sobrevive', f.variante[0].value === '140 micras', f.variante[0].value);
  ok('a linha não repete o rótulo', !f.linha.some((s) => s.label === 'Espessura frontal'));
  ok('mas entrega o que só ela tem', f.linha.some((s) => s.label === 'Adesivo'));
  ok('e diz de quem é a ficha', f.linhaLabel === 'Etherna Decor');
}

// --------------------------------------- 3. o rolo e a linha nao se misturam
console.log('\n=== 3. o que ESTE rolo e x o que a linha oferece ===');
{
  // Na página do M7-108 apareciam três linhas sobre largura, uma embaixo da
  // outra. A regra que ficou: o ERP diz o que ESTE rolo é ("Largura do rolo"),
  // a linha diz o que a linha oferece. Rótulos distintos, sem contradição.
  const indice = indexarLinhas([linha({ ficha: [{ label: 'Larguras', value: '1,22 m e 1,52 m' }] })]);
  const f = fichaDoItem(item({ larguraM: 1.52, unidadeVenda: 'ML' }), indice);
  const doRolo = f.variante.find((s) => s.value === '1,52 m');
  ok('o rolo real vem do ERP', doRolo?.label === 'Largura do rolo', doRolo?.label);
  ok('e não se chama só "Largura"', !f.variante.some((s) => s.label === 'Largura'));
  ok('o que a linha oferece continua aparecendo', f.linha.some((s) => s.label === 'Larguras'));

  // Quando o rótulo é o mesmo, aí sim o mais específico cala o outro.
  const mesmo = indexarLinhas([linha({ ficha: [{ label: 'Largura do rolo', value: '1,22 m' }] })]);
  const g = fichaDoItem(item({ larguraM: 1.52, unidadeVenda: 'ML' }), mesmo);
  ok('rótulo igual: o ERP ganha e a linha não repete', !g.linha.some((s) => s.label === 'Largura do rolo'));

  // O seed não pode voltar a trazer dimensão de rolo na ficha de linha.
  const seed = readFileSync(join(ROOT, 'migrations/2026-09-07b_seed_linhas.sql'), 'utf8');
  ok('o seed não reintroduz "Dimensões do rolo"', !/"label":"Dimensões do rolo"/.test(seed));
  ok('nem um rótulo "Rolo" solto', !/"label":"Rolo"/.test(seed));
}

// ------------------------------------------------------- 4. sub-família
console.log('\n=== 4. sub-família ===');
{
  const indice = indexarLinhas([
    linha({ linha_key: 'avery', label: 'Avery Dennison' }),
    linha({ linha_key: 'avery', familia_key: 'mpi', label: 'MPI', nome_prefixos: ['mpi'], ficha: [{ label: 'Espessura', value: '60–80 microns' }] }),
    linha({ linha_key: 'avery', familia_key: 'slp', label: 'SLP', nome_prefixos: ['slp'], ficha: [{ label: 'Espessura', value: '~70 microns' }] }),
  ]);
  const mpi = familiaDoItem(item({ lineKey: 'avery', name: 'Mpi 1105 Gls Easy Apply Rs' }), indice);
  ok('acha a família pelo nome', mpi?.familia_key === 'mpi', mpi?.familia_key);
  const slp = familiaDoItem(item({ lineKey: 'avery', name: 'Slp 3900 White Gloss Perm' }), indice);
  ok('e não confunde SLP com MPI', slp?.familia_key === 'slp', slp?.familia_key);
  const nenhuma = familiaDoItem(item({ lineKey: 'avery', name: 'Sw 900 192 M Ltr Ezrsblac K' }), indice);
  ok('SW900 não casa com nenhuma — e é o certo', nenhuma === null);

  const f = fichaDoItem(item({ lineKey: 'avery', name: 'Mpi 1105 Gls' }), indice);
  ok('a ficha usada é a da família', f.linha.some((s) => s.value === '60–80 microns'));
  ok('e o rótulo mostra a família, não a marca', f.linhaLabel === 'MPI', f.linhaLabel);
}

// -------------------------------------------- 5. prefixo mais longo ganha
console.log('\n=== 5. prefixo mais longo ===');
{
  // Speed Wrapping: SPWECH (cromado) precisa vencer SPWE (a linha toda).
  const indice = indexarLinhas([
    linha({ linha_key: 'sw', familia_key: 'geral', label: 'Geral', prefixos: ['SPWE'] }),
    linha({ linha_key: 'sw', familia_key: 'cromado', label: 'Cromado', prefixos: ['SPWECH'] }),
  ]);
  const f = familiaDoItem(item({ lineKey: 'sw', code: 'SPWECH12' }), indice);
  ok('o específico ganha do genérico', f?.familia_key === 'cromado', f?.familia_key);
  const g = familiaDoItem(item({ lineKey: 'sw', code: 'SPWEMT04' }), indice);
  ok('e o genérico continua pegando o resto', g?.familia_key === 'geral', g?.familia_key);
}

// --------------------------------------------------- 6. nada é nada mesmo
console.log('\n=== 6. bloco vazio não abre ===');
{
  ok('sem ficha e sem linha, temFicha é falso', fichaDoItem(item(), indexarLinhas([])).temFicha === false);
  const soTexto = fichaDoItem(item(), indexarLinhas([linha({ texto_venda: 'algo' })]));
  ok('mas só com texto de venda, abre', soTexto.temFicha === true);
  ok('e a lista de ficha fica vazia, não com placeholder', soTexto.variante.length === 0 && soTexto.linha.length === 0);
}

// ------------------------------------------ 7. a descrição da cor não some
console.log('\n=== 7. texto ===');
{
  // A Etherna tem 159 descrições distintas, uma por padrão. Trocá-las pela
  // descrição da linha seria perder 159 textos por um.
  const indice = indexarLinhas([linha({ descricao: 'Texto genérico da linha' })]);
  const f = fichaDoItem(item({ description: 'Carvalho com veio claro' }), indice);
  ok('descrição da cor ganha da linha', f.descricao === 'Carvalho com veio claro');
  const semCor = fichaDoItem(item(), indice);
  ok('sem descrição da cor, herda a da linha', semCor.descricao === 'Texto genérico da linha');
}

// ---------------------------------------- 8. procedência não é decorativa
console.log('\n=== 8. procedência ===');
{
  const fonte = readFileSync(join(ROOT, 'src/pages/Loja/FichaTecnica.tsx'), 'utf8');
  ok('a UI só mostra fonte quando ela existe', /ficha\.fonteUrl \|\| ficha\.conferidoEm/.test(fonte));
  ok('e não escreve "conferido" sem data', !/conferido em<\/|>conferido em</.test(fonte));

  const seed = readFileSync(join(ROOT, 'migrations/2026-09-07b_seed_linhas.sql'), 'utf8');
  const datas = seed.match(/date '\d{4}-\d{2}-\d{2}'/g) ?? [];
  ok('só a MD-80 tem data de conferência no seed', datas.length === 1, datas.join(' '));
  ok('conteúdo de linha sem fonte registrada não entrou', !/conferido_em.*current_date/i.test(seed));
}

// ------------------------------------- 9. a view entrega o que o cliente lê
console.log('\n=== 9. view x tipo do cliente ===');
{
  // Este teste nasceu de um bug real: `nome_prefixos` foi acrescentada à tabela
  // DEPOIS de a view ser criada, e a view seleciona coluna a coluna. O campo
  // existia no banco, existia no tipo e nunca chegava ao site — a família
  // NZPPF Luxury caía na ficha genérica da linha, sem erro nenhum em lugar
  // nenhum. Um campo que o cliente lê e a view não entrega é sempre isso:
  // silencioso.
  const tipo = readFileSync(join(ROOT, 'src/lib/shop/linhas.ts'), 'utf8');
  const corpo = tipo.slice(tipo.indexOf('export interface LojaLinhaRow'));
  const campos = [...corpo.slice(0, corpo.indexOf('\n}')).matchAll(/^\s{2}(\w+)[?]?:/gm)].map((m) => m[1]);
  ok('o tipo tem campos para conferir', campos.length >= 15, `${campos.length} campos`);

  const sql = readFileSync(join(ROOT, 'migrations/2026-09-07_ficha_por_linha.sql'), 'utf8');
  const view = sql.slice(sql.indexOf('create or replace view public.loja_linhas'), sql.indexOf('comment on view public.loja_linhas'));
  const faltando = campos.filter((c) => !new RegExp(`(\\b|\\.)${c}\\b`).test(view));
  ok('a view loja_linhas entrega todos eles', faltando.length === 0, faltando.join(', '));
}

rmSync(outDir, { recursive: true, force: true });
console.log(falhas ? `\n${falhas} FALHA(S)` : '\ntudo certo');
process.exit(falhas ? 1 : 0);
