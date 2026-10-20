-- Visibilidade da loja por TIPO DE ACESSO (decisão do João, 20/10/2026, noite):
-- além do percentual (precos_acesso), cada tipo pode ter partes da loja
-- escondidas — linhas comerciais inteiras, rolo fechado ou metro fracionado,
-- o estoque detalhado, a Promoção Moto e o pagamento online.
-- Projeto: uibjmvkvbthzypgozpcs (site). Lido por api/_lib/precos/regraAcesso.ts
-- (preço, pedido, promoção), handlers/estoque.ts, handlers/checkout.ts e pelo
-- front (src/lib/shop/acesso.ts) para filtrar o catálogo de quem está logado.
-- Admin vê tudo e não tem linha aqui.

create table if not exists public.acesso_config (
  papel text primary key check (papel in ('client', 'lojista', 'reseller')),
  -- linha_key de produtos que este tipo NÃO vê (nem preço, nem card, nem compra)
  linhas_ocultas text[] not null default '{}',
  ve_rolo boolean not null default true,
  ve_metro boolean not null default true,
  -- metros, rolos fechados e abertos no card (nível 2 de /api/nz/estoque)
  ve_estoque boolean not null default false,
  ve_promocao boolean not null default true,
  pagamento_online boolean not null default true,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid
);
comment on table public.acesso_config is 'O que cada tipo de acesso vê na loja. Admin vê tudo. Regra em api/_lib/precos/regraAcesso.ts.';

alter table public.acesso_config enable row level security;

drop policy if exists acesso_config_admin_all on public.acesso_config;
create policy acesso_config_admin_all on public.acesso_config
  for all to authenticated using (public.nz_is_admin()) with check (public.nz_is_admin());

-- Quem está logado lê a própria regra para filtrar o catálogo na tela. Não é
-- segredo: é o que a pessoa já veria (ou não) navegando.
drop policy if exists acesso_config_le on public.acesso_config;
create policy acesso_config_le on public.acesso_config
  for select to authenticated using (true);

grant select on public.acesso_config to authenticated;
grant insert, update, delete on public.acesso_config to authenticated;

-- Partida = como a loja se comportava até hoje: lojista e revendedor veem o
-- estoque detalhado; cliente final não. Todo mundo vê tudo o resto.
insert into public.acesso_config (papel, ve_estoque) values
  ('reseller', true),
  ('lojista', true),
  ('client', false)
on conflict (papel) do nothing;

notify pgrst, 'reload schema';
