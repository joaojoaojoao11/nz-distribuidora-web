-- Migração: logística — perfis de embalagem e transportadoras.
-- Contexto: a página de produto da LOJA (src/pages/Loja/LojaProduct.tsx) passa a
-- mostrar PRAZO DE ENTREGA por transportadora (Jadlog, Gollog). Prazo apenas —
-- nunca valor de frete: as APIs devolvem os dois no mesmo payload e o valor é
-- descartado no servidor, em api/logistica/prazo.ts.
--
-- Decisão de modelagem: peso e medida NÃO ficam por produto. Quase todo item da
-- mesma linha tem o mesmo volume físico (as 92 cores Metamark 7 Series são o
-- mesmo filme, só muda a cor), e 320 dos 505 itens do catálogo vivem em arquivo
-- .ts, fora do banco — cadastrar item a item não os alcançaria. Em vez disso,
-- ~15 perfis de embalagem ligados à LINHA (line_key), com override por produto
-- para exceções.
--
-- Rodar no SQL Editor do Supabase (projeto uibjmvkvbthzypgozpcs).
-- Aplicada em produção em: (preencher ao aplicar)

-- ---------------------------------------------------------------- perfis

create table if not exists public.shipping_profiles (
  id uuid primary key default gen_random_uuid(),
  -- Ex.: 'Rolo Etherna 1,22 × 25 m'
  nome text not null,
  formato text not null check (formato in ('rolo', 'caixa', 'tubo')),
  peso_kg numeric(6,3) not null check (peso_kg > 0),
  comprimento_cm numeric(6,1) not null check (comprimento_cm > 0),
  largura_cm numeric(6,1) not null check (largura_cm > 0),
  altura_cm numeric(6,1) not null check (altura_cm > 0),
  observacao text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- N:N perfil ↔ linha do catálogo. É o que dá o SELETOR DE FORMATO na página de
-- produto: uma linha com 2 perfis (rolo fechado e bobina cortada) mostra o
-- seletor; com 1 perfil, consulta direto.
create table if not exists public.shipping_profile_lines (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.shipping_profiles(id) on delete cascade,
  -- Valores de LineKey em src/lib/shop/types.ts: 'etherna', 'sh-decor', 'm7',
  -- 'mcx', 'nzwrap', 'oracal-651', 'oracal-670', 'sh-wrapping', 'avery',
  -- 'md80', 'ppf'.
  line_key text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (profile_id, line_key)
);

create index if not exists shipping_profile_lines_line_idx
  on public.shipping_profile_lines (line_key);

-- No máximo um perfil padrão por linha.
create unique index if not exists shipping_profile_lines_one_default
  on public.shipping_profile_lines (line_key) where is_default;

-- ------------------------------------------------------- transportadoras

-- Config OPERACIONAL da transportadora. Credencial NÃO mora aqui: token e
-- senha vivem em variável de ambiente lida só em api/, nunca em VITE_*. O
-- admin exibe apenas "credencial configurada ✓/✗".
create table if not exists public.shipping_carriers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug in ('jadlog', 'gollog')),
  nome text not null,
  ativo boolean not null default false,
  cep_origem text not null check (cep_origem ~ '^[0-9]{8}$'),
  -- Dias de expedição da NZ, somados ao prazo que a transportadora devolve.
  dias_manuseio int not null default 1 check (dias_manuseio >= 0),
  modalidade text,
  ordem int not null default 0,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Cache de prazo. Chave por (transportadora, perfil, CEP): o prazo de um CEP
-- muda muito pouco, e isso derruba o volume de chamadas à API contratada.
create table if not exists public.shipping_quote_cache (
  carrier_slug text not null,
  profile_id uuid not null references public.shipping_profiles(id) on delete cascade,
  cep_destino text not null check (cep_destino ~ '^[0-9]{8}$'),
  prazo_dias int not null check (prazo_dias >= 0),
  raw jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  primary key (carrier_slug, profile_id, cep_destino)
);

create index if not exists shipping_quote_cache_expires_idx
  on public.shipping_quote_cache (expires_at);

-- ------------------------------------------- override por produto do banco

alter table public.web_catalog_products
  add column if not exists shipping_profile_id uuid references public.shipping_profiles(id);

-- ------------------------------------------------------------------- RLS
--
-- NENHUMA policy para anon. O browser jamais lê peso, dimensão ou config de
-- transportadora — isso é informação comercial. Quem lê é o endpoint
-- api/logistica/prazo.ts, com service role. A página de produto recebe apenas
-- { id, nome } dos formatos, embutidos no snapshot de build.

alter table public.shipping_profiles enable row level security;
alter table public.shipping_profile_lines enable row level security;
alter table public.shipping_carriers enable row level security;
alter table public.shipping_quote_cache enable row level security;

drop policy if exists "shipping_profiles_admin_all" on public.shipping_profiles;
create policy "shipping_profiles_admin_all"
  on public.shipping_profiles
  for all to authenticated
  using      (exists (select 1 from public.user_profiles where id = auth.uid() and role in ('admin', 'superadmin')))
  with check (exists (select 1 from public.user_profiles where id = auth.uid() and role in ('admin', 'superadmin')));

drop policy if exists "shipping_profile_lines_admin_all" on public.shipping_profile_lines;
create policy "shipping_profile_lines_admin_all"
  on public.shipping_profile_lines
  for all to authenticated
  using      (exists (select 1 from public.user_profiles where id = auth.uid() and role in ('admin', 'superadmin')))
  with check (exists (select 1 from public.user_profiles where id = auth.uid() and role in ('admin', 'superadmin')));

drop policy if exists "shipping_carriers_admin_all" on public.shipping_carriers;
create policy "shipping_carriers_admin_all"
  on public.shipping_carriers
  for all to authenticated
  using      (exists (select 1 from public.user_profiles where id = auth.uid() and role in ('admin', 'superadmin')))
  with check (exists (select 1 from public.user_profiles where id = auth.uid() and role in ('admin', 'superadmin')));

drop policy if exists "shipping_quote_cache_admin_all" on public.shipping_quote_cache;
create policy "shipping_quote_cache_admin_all"
  on public.shipping_quote_cache
  for all to authenticated
  using      (exists (select 1 from public.user_profiles where id = auth.uid() and role in ('admin', 'superadmin')))
  with check (exists (select 1 from public.user_profiles where id = auth.uid() and role in ('admin', 'superadmin')));

-- ---------------------------------------------------------------- seeds
--
-- As duas transportadoras nascem INATIVAS: não há contrato com nenhuma delas
-- ainda, e o adapter ativo é o mock (LOGISTICA_MODO=mock). Ativar pelo painel
-- quando a credencial existir.

insert into public.shipping_carriers (slug, nome, ativo, cep_origem, dias_manuseio, modalidade, ordem)
values
  ('jadlog', 'Jadlog', false, '04696000', 1, '.Package', 1),
  ('gollog', 'Gollog', false, '04696000', 1, 'Standard', 2)
on conflict (slug) do nothing;
