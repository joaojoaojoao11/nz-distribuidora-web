-- Migração: integração com o NZERP — espelho de estoque e mapa de SKU.
-- RODAR NO PROJETO DO SITE (uibjmvkvbthzypgozpcs).
-- O SQL do lado do ERP está em migrations/erp/2026-09-03_views_site.sql e roda
-- no OUTRO projeto (ipehorttsrvjynnhyzhu).
--
-- Contexto: a LOJA precisa refletir o estoque real, que vive no NZERP — outro
-- projeto Supabase. A sincronização é feita por função serverless na Vercel
-- (api/erp/sync.ts), com as chaves dos dois projetos só no servidor.
--
-- Por que NÃO conexão direta do browser ao ERP: o NZERP conecta como `anon` e
-- suas tabelas têm policy `FOR ALL TO public` — a chave anônima dele dá leitura
-- e escrita em custo, margem, contas_receber, clients, CRM e RH. Publicar essa
-- chave no bundle do site exporia o sistema interno inteiro.
--
-- Rodar no SQL Editor do Supabase. Aplicada em produção em: (preencher)

-- ------------------------------------------------------- mapa de SKU
--
-- O gargalo real da integração não é técnico, é de identidade: o site
-- identifica produto por slug de catálogo ('etherna-madeira-carvalho-areia')
-- ou código de mostruário ('M7-108', 'IT 403'); o ERP usa master_catalog.sku
-- em uppercase, com histórico de importação do Tiny/Olist. Não há garantia de
-- que batem. Sem este mapa, não há o que sincronizar.

create table if not exists public.erp_sku_map (
  id uuid primary key default gen_random_uuid(),
  -- Slug global do ShopItem (src/lib/shop/types.ts).
  shop_slug text not null unique,
  -- master_catalog.sku no NZERP.
  erp_sku text not null,
  -- 'auto'   = proposto por scripts/propose-sku-map.mjs, ainda não conferido
  -- 'manual' = conferido ou digitado por uma pessoa
  origem text not null default 'auto' check (origem in ('auto', 'manual')),
  -- 0..1 — confiança do match automático. Só serve para ordenar a fila.
  confianca numeric(3,2),
  conferido_em timestamptz,
  conferido_por uuid references auth.users(id),
  observacao text,
  created_at timestamptz not null default now()
);

create index if not exists erp_sku_map_erp_sku_idx on public.erp_sku_map (erp_sku);
create index if not exists erp_sku_map_pendentes_idx
  on public.erp_sku_map (confianca desc) where conferido_em is null;

-- ------------------------------------------------ espelho de estoque
--
-- Espelho ENXUTO. Custo, preço de venda e margem NÃO existem aqui: são
-- filtrados na origem, nas views do ERP. O que nunca chega não pode vazar.

create table if not exists public.erp_stock_mirror (
  erp_sku text primary key,
  nome text,
  categoria text,
  marca text,
  ativo boolean not null default true,
  -- Saldo agregado. No ERP não existe coluna de saldo: é SUM(quant_ml) dos
  -- LPNs em `inventory`, onde um LPN é um rolo físico.
  saldo_ml numeric(12,2) not null default 0,
  rolos_fechados int not null default 0,
  rolos_abertos int not null default 0,
  largura_m numeric(6,3),
  metragem_padrao numeric(8,2),
  estoque_minimo numeric(10,2),
  -- Última alteração no ERP, usada para o sync incremental.
  erp_updated_at timestamptz,
  sincronizado_em timestamptz not null default now()
);

create index if not exists erp_stock_mirror_ativo_idx on public.erp_stock_mirror (ativo);

-- Log de sincronização, para o painel mostrar o que aconteceu e quando.
create table if not exists public.erp_sync_log (
  id uuid primary key default gen_random_uuid(),
  iniciado_em timestamptz not null default now(),
  concluido_em timestamptz,
  gatilho text not null check (gatilho in ('cron', 'webhook', 'manual')),
  lidos int not null default 0,
  atualizados int not null default 0,
  desativados int not null default 0,
  erro text
);

create index if not exists erp_sync_log_recentes_idx on public.erp_sync_log (iniciado_em desc);

-- ------------------------------------------------------ configuração

create table if not exists public.erp_config (
  id int primary key default 1 check (id = 1),
  -- Limiares do badge qualitativo mostrado ao público. Default derivado de
  -- estoque_minimo quando o SKU tiver um.
  limite_ultimas_unidades_ml numeric(10,2) not null default 30,
  sync_ativo boolean not null default true,
  atualizado_em timestamptz not null default now()
);

insert into public.erp_config (id) values (1) on conflict (id) do nothing;

-- ------------------------------------------------------------------ RLS
--
-- NENHUMA policy para anon em nenhuma tabela. O estoque chega ao visitante
-- exclusivamente por api/loja/estoque.ts, que decide o que mostrar conforme o
-- papel do usuário — e para anônimo/cliente final mostra só disponibilidade
-- qualitativa, nunca número.

alter table public.erp_sku_map enable row level security;
alter table public.erp_stock_mirror enable row level security;
alter table public.erp_sync_log enable row level security;
alter table public.erp_config enable row level security;

drop policy if exists "erp_sku_map_admin_all" on public.erp_sku_map;
create policy "erp_sku_map_admin_all"
  on public.erp_sku_map for all to authenticated
  using      (exists (select 1 from public.user_profiles where id = auth.uid() and role in ('admin', 'superadmin')))
  with check (exists (select 1 from public.user_profiles where id = auth.uid() and role in ('admin', 'superadmin')));

drop policy if exists "erp_stock_mirror_admin_all" on public.erp_stock_mirror;
create policy "erp_stock_mirror_admin_all"
  on public.erp_stock_mirror for all to authenticated
  using      (exists (select 1 from public.user_profiles where id = auth.uid() and role in ('admin', 'superadmin')))
  with check (exists (select 1 from public.user_profiles where id = auth.uid() and role in ('admin', 'superadmin')));

drop policy if exists "erp_sync_log_admin_all" on public.erp_sync_log;
create policy "erp_sync_log_admin_all"
  on public.erp_sync_log for all to authenticated
  using      (exists (select 1 from public.user_profiles where id = auth.uid() and role in ('admin', 'superadmin')))
  with check (exists (select 1 from public.user_profiles where id = auth.uid() and role in ('admin', 'superadmin')));

drop policy if exists "erp_config_admin_all" on public.erp_config;
create policy "erp_config_admin_all"
  on public.erp_config for all to authenticated
  using      (exists (select 1 from public.user_profiles where id = auth.uid() and role in ('admin', 'superadmin')))
  with check (exists (select 1 from public.user_profiles where id = auth.uid() and role in ('admin', 'superadmin')));
