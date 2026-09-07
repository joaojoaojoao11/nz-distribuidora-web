-- Ficha técnica por LINHA (e por sub-família), texto de venda e conferência.
-- RODAR NO PROJETO DO SITE (uibjmvkvbthzypgozpcs).
--
-- Plano: docs/PLANO_FICHA_TECNICA.md
--
-- O problema que isto resolve (medido em 07/09/2026):
--   · A Etherna tem 159 produtos com ficha e apenas 4 fichas DISTINTAS entre
--     eles. É a mesma ficha da linha, copiada 159 vezes, já divergida em 4
--     versões. SH Decor: 55 produtos, 5 fichas. MD-80: 4 produtos, 1 ficha.
--   · 787 produtos publicados estão com `ficha` vazia — mas 11 linhas já têm
--     o conteúdo escrito em arquivos .ts do repositório.
--
-- O desenho é o mesmo de `produtos` ⨝ `erp_produtos`: o dado mais específico
-- fica no lugar mais específico, e o compartilhado fica em um lugar só.
--
--   A. produtos.ficha          → só o que muda de cor para cor
--   B. linha_familias.ficha    → sub-família (Speed Wrapping SPWECH ≠ SPWEMT)
--   C. linhas.ficha            → a linha inteira (é o que os sites-mãe publicam)
--   D. erp_produtos            → largura/metragem, nunca digitado
--
-- Precedência no cliente: A > D > B > C. A linha nunca repete um rótulo que a
-- variante já trouxe.
--
-- Aplicada em produção em: 2026-09-07

-- ============================================================== linhas

create table if not exists public.linhas (
  linha_key text primary key,
  label text not null,
  marca_key text,

  -- Ficha técnica da linha: [{label, value}], mesma forma de produtos.ficha.
  ficha jsonb not null default '[]'::jsonb,

  -- Texto de venda em três tamanhos. Ver §5 do plano.
  chamada text,        -- 1 frase (≤155 car.): card, meta description
  descricao text,      -- 1 parágrafo: topo da página quando a cor não tem
  texto_venda text,    -- bloco longo: "Sobre a linha", recolhível
  aplicacoes text[] not null default '{}',
  cuidados text,       -- aplicação, limpeza, remoção

  -- TDS do fabricante, quando existe. É o documento com mais autoridade;
  -- a ficha NZ gerada não o substitui, anda ao lado.
  tds_url text,
  tds_titulo text,

  -- Procedência. NÃO é burocracia: a ficha é o documento que o aplicador
  -- imprime e segue. Daqui a um ano, é isto que responde "de onde saiu esse
  -- 190 micras?" sem reabrir o site do fabricante. O metamarkMd80.ts já fazia
  -- isso num comentário — e foi assim que se descobriu que o briefing interno
  -- trazia SKUs que não existem no catálogo Metamark.
  fonte_url text,
  fonte_nota text,
  conferido_em date,
  conferido_por uuid references auth.users(id),

  publicado boolean not null default true,
  ordem int not null default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

drop trigger if exists linhas_atualizado_em on public.linhas;
create trigger linhas_atualizado_em
  before update on public.linhas
  for each row execute function public.nz_set_atualizado_em();

comment on table public.linhas is
  'Ficha técnica e texto de venda por linha comercial. Uma linha aqui vale para todos os produtos com o mesmo linha_key.';

-- ====================================================== linha_familias
--
-- `linha_key` nasceu para resolver PERFIL DE EMBALAGEM no frete, não ficha
-- técnica. Em duas linhas ela é grossa demais:
--   avery (288)          → AAT=Ad Color (258) · UWF=wrap film (23) · AVCV (1)
--   speed-wrapping (241) → 20 famílias pelo prefixo (SPWECH cromado, SPWEMT
--                          fosco, SPWEFG forjado…). Uma ficha só para as 241
--                          seria falsa: não têm a mesma espessura.
--
-- O prefixo do SKU é PISTA, não decisão: `prefixos` é preenchido com curadoria
-- e revisado no painel, nunca por script cego.

create table if not exists public.linha_familias (
  id uuid primary key default gen_random_uuid(),
  linha_key text not null references public.linhas(linha_key) on delete cascade,
  familia_key text not null,
  label text not null,

  -- Prefixos de SKU que caem nesta família. Casamento por prefixo mais LONGO
  -- (SPWECH antes de SPW), para uma família específica ganhar da genérica.
  prefixos text[] not null default '{}',

  -- Prefixos do NOME do produto. Existe porque em `avery` o prefixo do SKU NÃO
  -- discrimina: AAT cobre MPI, SLP, DOL e SW900 igualmente. Lá a família está
  -- no nome ("Mpi 1105 Gls…", "Slp 3900 White…").
  nome_prefixos text[] not null default '{}',

  ficha jsonb not null default '[]'::jsonb,
  chamada text,
  descricao text,
  texto_venda text,
  aplicacoes text[] not null default '{}',
  cuidados text,
  tds_url text,
  tds_titulo text,
  fonte_url text,
  fonte_nota text,
  conferido_em date,
  conferido_por uuid references auth.users(id),

  publicado boolean not null default true,
  ordem int not null default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (linha_key, familia_key)
);

drop trigger if exists linha_familias_atualizado_em on public.linha_familias;
create trigger linha_familias_atualizado_em
  before update on public.linha_familias
  for each row execute function public.nz_set_atualizado_em();

create index if not exists linha_familias_linha_idx on public.linha_familias (linha_key);

comment on table public.linha_familias is
  'Sub-família técnica dentro de uma linha comercial. Existe porque linha_key agrupa filmes diferentes em avery e speed-wrapping.';

-- Amarração explícita, quando o prefixo do SKU não resolve. Vazio = resolve
-- pelo prefixo. Preenchido = manda, e o prefixo é ignorado para este produto.
alter table public.produtos add column if not exists familia_key text;
create index if not exists produtos_familia_idx on public.produtos (linha_key, familia_key);

comment on column public.produtos.familia_key is
  'Sub-família técnica. NULL ⇒ resolvida pelo prefixo do código em linha_familias.prefixos.';

-- ========================================================= loja_linhas
--
-- Superfície pública. Mesma regra da loja_catalogo: só o que pode ser lido
-- pelo mundo. `conferido_por` (uuid de usuário) e as notas internas de fonte
-- NÃO saem — quem conferiu é gestão, não vitrine.

create or replace view public.loja_linhas as
select
  l.linha_key,
  null::text as familia_key,
  l.label,
  l.marca_key,
  l.ficha,
  l.chamada,
  l.descricao,
  l.texto_venda,
  l.aplicacoes,
  l.cuidados,
  l.tds_url,
  l.tds_titulo,
  l.fonte_url,
  l.conferido_em,
  '{}'::text[] as prefixos,
  l.ordem,
  l.atualizado_em,
  '{}'::text[] as nome_prefixos
from public.linhas l
where l.publicado
union all
select
  f.linha_key,
  f.familia_key,
  f.label,
  l.marca_key,
  f.ficha,
  f.chamada,
  f.descricao,
  f.texto_venda,
  f.aplicacoes,
  f.cuidados,
  coalesce(f.tds_url, l.tds_url),
  coalesce(f.tds_titulo, l.tds_titulo),
  f.fonte_url,
  f.conferido_em,
  f.prefixos,
  f.ordem,
  f.atualizado_em,
  f.nome_prefixos
from public.linha_familias f
join public.linhas l on l.linha_key = f.linha_key
where f.publicado and l.publicado;

comment on view public.loja_linhas is
  'Recorte público das fichas de linha e sub-família. Sem quem conferiu e sem notas internas.';

grant select on public.loja_linhas to anon, authenticated;

-- ================================================================ RLS
--
-- Mesmo padrão das outras tabelas do catálogo: admin escreve, anon não
-- enxerga a tabela base (só a view).

alter table public.linhas enable row level security;
alter table public.linha_familias enable row level security;

drop policy if exists linhas_admin_all on public.linhas;
create policy linhas_admin_all on public.linhas
  for all to authenticated using (public.nz_is_admin()) with check (public.nz_is_admin());

drop policy if exists linha_familias_admin_all on public.linha_familias;
create policy linha_familias_admin_all on public.linha_familias
  for all to authenticated using (public.nz_is_admin()) with check (public.nz_is_admin());
