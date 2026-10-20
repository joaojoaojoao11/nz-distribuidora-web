-- Percentual por PRODUTO dentro da linha (Admin → Tipos de acesso → Preço):
-- a regra passa a ter três níveis — produto > linha > geral — todos por tipo
-- de acesso. Projeto: uibjmvkvbthzypgozpcs (site). Lido por
-- api/_lib/precos/regraAcesso.ts.

alter table public.precos_acesso add column if not exists produto_slug text;
comment on column public.precos_acesso.produto_slug is 'Preenchido = regra só deste produto (slug de produtos). Nulo + linha_key = da linha. Ambos nulos = geral do tipo.';

drop index if exists public.precos_acesso_unico;
create unique index precos_acesso_unico
  on public.precos_acesso (papel, coalesce(linha_key, '*'), coalesce(produto_slug, '*'));
create index if not exists precos_acesso_produto_idx on public.precos_acesso (produto_slug) where produto_slug is not null;

alter table public.precos_acesso_log add column if not exists produto_slug text;

notify pgrst, 'reload schema';
