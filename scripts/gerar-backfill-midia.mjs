// Gera a migration que traz para o banco as fotos que só existiam em CÓDIGO.
//
// O PROBLEMA QUE ISTO RESOLVE
// Metade do catálogo ganhava foto por mapas embutidos no front
// (generic.ts, adapters/erp.ts) apontando para arquivos estáticos de
// `public/assets`. A loja mostrava; o cadastro do produto, que lê
// `produto_midia`, não via nada — e por isso não dava para reordenar, trocar a
// capa nem apagar. Era o caso do SHMG-101, com 8 fotos na página e nenhuma no
// painel.
//
// O QUE ELE FAZ
// Roda o MESMO adapter da loja (`lojaRowsToShopItems`) contra o catálogo real e
// escreve, em SQL, a lista de mídia de cada produto exatamente na ordem e com a
// capa que a loja mostra hoje. Depois disso o banco passa a ser a única fonte,
// e o adapter para de inventar caminho.
//
// É IDEMPOTENTE: só insere URL que ainda não existe para aquele produto, e
// ajusta ordem/capa do resto. Rodar de novo depois da correção do adapter não
// tem efeito nenhum — o adapter passa a devolver só o que já está no banco.
//
// Uso:
//   node scripts/gerar-backfill-midia.mjs            # escreve a migration
//   node scripts/aplicar-sql.mjs site migrations/<arquivo>.sql

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const ENV = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
);

const SAIDA = 'migrations/2026-09-11d_midia_do_codigo_para_o_banco.sql';

// O adapter é TypeScript e importa CSS/`import.meta.env`; esbuild resolve os
// dois. Bundle num arquivo só para não depender da árvore de módulos em runtime.
mkdirSync('node_modules/.cache', { recursive: true });
const BUNDLE = 'node_modules/.cache/adapter-loja.mjs';
const build = spawnSync(
  'npx',
  ['esbuild', 'src/lib/shop/adapters/erp.ts', '--bundle', '--platform=node', '--format=esm',
   '--packages=external', '--define:import.meta.env.DEV=false', `--outfile=${BUNDLE}`],
  { shell: true, encoding: 'utf8' }
);
if (build.status !== 0) {
  console.error(build.stderr);
  process.exit(1);
}
const { lojaRowsToShopItems } = await import(pathToFileURL(BUNDLE).href);

const db = createClient(ENV.VITE_SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY);
let rows = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await db.from('loja_catalogo').select('*').range(from, from + 999);
  if (error) throw new Error(error.message);
  if (!data?.length) break;
  rows = rows.concat(data);
  if (data.length < 1000) break;
}
console.log('catálogo:', rows.length, 'itens');

const itens = lojaRowsToShopItems(rows);
const porSlug = new Map(rows.map((r) => [r.slug, r]));

const linhas = [];
const semArquivo = [];
let afetados = 0;

for (const item of itens) {
  const row = porSlug.get(item.slug);
  const noBanco = (row.midias ?? []).map((m) => m.url);
  const naLoja = item.media.map((m) => m.url);
  if (naLoja.every((u) => noBanco.includes(u)) && naLoja.length === noBanco.length) continue;

  // Caminho estático que não existe em disco vira 404 na loja: não cadastra.
  const validas = naLoja.filter((url) => {
    if (!url.startsWith('/')) return true;
    if (existsSync('public' + url)) return true;
    semArquivo.push(`${item.slug} ${url}`);
    return false;
  });
  if (!validas.length) continue;

  afetados++;
  validas.forEach((url, i) => {
    linhas.push(`('${item.slug.replace(/'/g, "''")}','${url.replace(/'/g, "''")}',${i},${i === 0})`);
  });
}

console.log('produtos na migration:', afetados, '| linhas de mídia:', linhas.length);
if (semArquivo.length) {
  console.log('descartadas por não existir em disco:', semArquivo.length);
  console.log(semArquivo.slice(0, 10).join('\n'));
}

const sql = `-- Fotos que só existiam no código passam a existir no banco.
--
-- Gerado por scripts/gerar-backfill-midia.mjs em ${new Date().toISOString().slice(0, 10)}.
-- NÃO edite à mão: a lista abaixo é a saída do adapter da loja, ou seja, é
-- exatamente o que cada página de produto mostra hoje — mesma ordem, mesma capa.
--
-- Depois desta migration, o adapter (src/lib/shop/adapters/erp.ts) para de
-- injetar caminho de arquivo e passa a ler só o banco. As duas coisas andam
-- juntas: rode isto ANTES de publicar aquele código, senão os produtos ficam
-- sem foto entre um e outro.
--
-- ${afetados} produtos, ${linhas.length} fotos.

create table if not exists public._bf_midia (
  slug  text,
  url   text,
  ordem int,
  capa  boolean
);
truncate public._bf_midia;

insert into public._bf_midia (slug, url, ordem, capa) values
${linhas.join(',\n')};

-- 1. O que falta entra. Só o que não existe para aquele produto.
insert into public.produto_midia (produto_id, tipo, url, ordem, capa, origem)
select p.id, 'imagem', b.url, b.ordem, false, 'estatico'
  from public._bf_midia b
  join public.produtos p on p.slug = b.slug
 where not exists (
   select 1 from public.produto_midia m where m.produto_id = p.id and m.url = b.url
 );

-- 2. A ordem passa a ser a da loja.
update public.produto_midia m
   set ordem = b.ordem
  from public._bf_midia b
  join public.produtos p on p.slug = b.slug
 where m.produto_id = p.id
   and m.url = b.url
   and m.ordem is distinct from b.ordem;

-- 3. A capa também. Primeiro tira de quem está errado (o índice único não
--    deixa duas), depois marca a que a loja usa.
update public.produto_midia m
   set capa = false
  from public._bf_midia b
  join public.produtos p on p.slug = b.slug
 where m.produto_id = p.id
   and b.capa
   and m.capa
   and m.url <> b.url;

update public.produto_midia m
   set capa = true
  from public._bf_midia b
  join public.produtos p on p.slug = b.slug
 where m.produto_id = p.id
   and b.capa
   and m.url = b.url
   and not m.capa;

drop table public._bf_midia;

-- O gatilho nz_espelhar_midia já atualizou produtos.imagem e produtos.galeria.
select count(*) filter (where origem = 'estatico') as estaticas,
       count(*)                                    as total_midias
  from public.produto_midia;
`;

writeFileSync(SAIDA, sql, 'utf8');
console.log('escrito:', SAIDA, `(${(sql.length / 1024).toFixed(0)} KB)`);
