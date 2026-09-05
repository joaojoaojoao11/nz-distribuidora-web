-- Migração: a LOJA deixa de ser vitrine estática e vira cadastro de e-commerce
-- espelhado do NZERP. RODAR NO PROJETO DO SITE (uibjmvkvbthzypgozpcs).
--
-- Substitui migrations/2026-09-03_erp_integracao.sql, que nunca foi aplicada.
-- O SQL do lado do ERP está em 2NZERPUPDATE30/supabase/migrations/20260906_site_views.sql
-- e roda no OUTRO projeto (ipehorttsrvjynnhyzhu).
--
-- Desenho (plano de 2026-09-05):
--   · O ERP é dono da identidade e dos números: SKU, nome, marca, categoria,
--     largura, metragem, ativo, PREÇO e ESTOQUE. Tudo isso vive em
--     `erp_produtos`, que só o sync escreve.
--   · O site é dono do editorial: slug, nome de exibição, foto, hex, acabamento,
--     descrição, ficha, linha de frete, SEO, ordem. Isso vive em `produtos`.
--   · Um produto do site aponta para um SKU do ERP (muitos-para-um: os NZWRAP
--     do site são alias do rolo SH Wrapping correspondente). Sem `erp_sku`, não
--     publica.
--   · Preço NUNCA fica legível por anon. A view pública `loja_catalogo` não tem
--     coluna de preço; preço sai só por /api/nz/precos, com papel decidido no
--     servidor. Os mínimos (`*_min`) só chegam ao papel admin.
--   · Ativo no site = ativo no ERP, por join. Nunca copiado.
--
-- Aplicada em produção em: (preencher)

-- ================================================================ helpers

-- Uma régua só para "é admin". `superadmin` é aceito aqui e no TS.
create or replace function public.nz_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_profiles
    where id = auth.uid() and role in ('admin', 'superadmin')
  );
$$;

create or replace function public.nz_set_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

-- ======================================================== erp_produtos
--
-- Espelho INTEGRAL do master_catalog + pricing_engineering + estoque do ERP:
-- todos os SKUs, ativos ou não. Escrita exclusiva do sync (service role).
-- Custo, margem e acréscimo fracionado não existem aqui — as views do ERP já
-- não os transferem. O que nunca chega não pode vazar.

create table if not exists public.erp_produtos (
  sku text primary key,
  nome text,
  marca text,
  categoria text,
  ativo boolean not null default true,
  -- true quando o SKU sumiu da view do ERP (apagado lá). Fica para histórico.
  removido_no_erp boolean not null default false,
  largura_m numeric(6,3),
  metragem_padrao numeric(8,2),
  -- ML (metro linear) | UN (unidade/rolo) | M2. Só rótulo, como no ERP.
  unidade text not null default 'ML',
  estoque_minimo numeric(10,2),
  id_tiny text,

  -- Preços de venda "ideais" (tabela). Rolo = R$ por rolo fechado de
  -- `metragem_padrao` metros; metro = R$ por metro linear (fracionado).
  preco_rolo numeric(12,2),
  preco_metro numeric(12,2),
  -- Pisos de negociação. Só o papel admin recebe estes valores.
  preco_rolo_min numeric(12,2),
  preco_metro_min numeric(12,2),
  promocao boolean not null default false,
  preco_atualizado_em timestamptz,

  -- Saldo do pátio de SP (MATRIZ). No ERP um LPN é um rolo físico; aqui é a
  -- soma e a contagem por status.
  saldo_ml numeric(12,2) not null default 0,
  rolos_fechados int not null default 0,
  rolos_abertos int not null default 0,
  estoque_atualizado_em timestamptz,

  erp_updated_at timestamptz,
  sincronizado_em timestamptz not null default now()
);

create index if not exists erp_produtos_ativo_idx on public.erp_produtos (ativo);
create index if not exists erp_produtos_marca_idx on public.erp_produtos (marca);

comment on table public.erp_produtos is
  'Espelho do NZERP (catálogo, preço de venda, estoque SP). Escrito só pelo sync. Sem custo/margem por desenho.';

-- ============================================================ produtos
--
-- O cadastro do site. Os 505 itens editoriais entram aqui com o mesmo slug
-- (URLs não mudam); os SKUs do ERP sem item editorial entram como
-- origem='erp-auto', criados pelo sync, publicados com amostra de cor.

create table if not exists public.produtos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,

  -- SKU físico no ERP. Muitos-para-um: alias aponta para o mesmo SKU do
  -- produto original. Null só enquanto 'pendente'.
  erp_sku text references public.erp_produtos(sku) on delete set null,
  -- proprio  = este produto É o SKU
  -- alias    = mesmo rolo físico de outro produto, com outro nome/marca (NZWRAP ↔ SH)
  -- familia  = página de linha que agrupa filhos (NZPPF, Avery) — sem SKU próprio
  -- pendente = ainda sem conexão conferida; não publica
  tipo_vinculo text not null default 'pendente'
    check (tipo_vinculo in ('proprio', 'alias', 'familia', 'pendente')),
  pai_id uuid references public.produtos(id) on delete set null,
  alias_de uuid references public.produtos(id) on delete set null,
  alias_nota text,

  -- editorial
  nome text not null,
  subtitulo text,
  marca_exibicao text,
  brand_key text,
  linha_key text not null,
  linha_label text,
  vertical text not null check (vertical in ('PPF', 'WRAP', 'SIGN', 'DECOR')),
  kind text not null default 'cor' check (kind in ('cor', 'padrao', 'linha')),
  aplicacoes text[] not null default '{}',
  codigo text,
  imagem text,
  galeria text[] not null default '{}',
  hex text,
  -- Família declarada pelo fabricante (M7, MCX). O resto é resolvido no cliente
  -- pelo motor "o nome manda".
  cor_declarada text,
  transparente boolean not null default false,
  -- Hex tirado do chip da imagem (MCX): só orienta o bucketing quando o nome
  -- não tem cor; nunca vira swatch.
  hex_inferido text,
  -- Tags de acabamento já normalizadas ('metalico','fosco'…). Vazio ⇒ o
  -- adapter deduz do rótulo/nome.
  acabamentos text[] not null default '{}',
  acabamento_label text,
  familia_padrao text,
  descricao text,
  ficha jsonb not null default '[]'::jsonb,
  badges text[] not null default '{}',
  garantia_anos int,
  durabilidade_anos int,
  legacy_path text,
  shipping_profile_id uuid references public.shipping_profiles(id) on delete set null,
  seo_titulo text,
  seo_descricao text,

  -- visibilidade = publicado ∧ ¬oculto_manual ∧ erp_produtos.ativo (na view)
  publicado boolean not null default true,
  oculto_manual boolean not null default false,
  ordem int not null default 0,

  origem text not null default 'manual' check (origem in ('editorial', 'erp-auto', 'manual')),
  fonte_original text,
  criado_por uuid references auth.users(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists produtos_erp_sku_idx on public.produtos (erp_sku);
create index if not exists produtos_vinculo_idx on public.produtos (tipo_vinculo);
create index if not exists produtos_pai_idx on public.produtos (pai_id);
create index if not exists produtos_linha_idx on public.produtos (linha_key);

drop trigger if exists produtos_atualizado_em on public.produtos;
create trigger produtos_atualizado_em
  before update on public.produtos
  for each row execute function public.nz_set_atualizado_em();

-- Publicar exige conexão com o ERP. 'familia' é a exceção (agrupa filhos).
alter table public.produtos drop constraint if exists produtos_publicado_exige_sku;
alter table public.produtos add constraint produtos_publicado_exige_sku
  check (
    not publicado
    or tipo_vinculo = 'familia'
    or (erp_sku is not null and tipo_vinculo in ('proprio', 'alias'))
  );

comment on table public.produtos is
  'Cadastro editorial da LOJA. Identidade e números vêm de erp_produtos via erp_sku.';

-- ========================================================= erp_sku_map
--
-- Fila de conferência das propostas automáticas (scripts/propose-sku-map.mjs).
-- Ao confirmar no painel, o valor é gravado em produtos.erp_sku.

create table if not exists public.erp_sku_map (
  id uuid primary key default gen_random_uuid(),
  shop_slug text not null unique,
  erp_sku text not null,
  origem text not null default 'auto' check (origem in ('auto', 'manual')),
  via text,
  confianca numeric(3,2),
  conferido_em timestamptz,
  conferido_por uuid references auth.users(id),
  observacao text,
  created_at timestamptz not null default now()
);

create index if not exists erp_sku_map_erp_sku_idx on public.erp_sku_map (erp_sku);
create index if not exists erp_sku_map_pendentes_idx
  on public.erp_sku_map (confianca desc) where conferido_em is null;

-- ========================================================= erp_sync_log

create table if not exists public.erp_sync_log (
  id uuid primary key default gen_random_uuid(),
  iniciado_em timestamptz not null default now(),
  concluido_em timestamptz,
  gatilho text not null check (gatilho in ('cron', 'webhook', 'manual', 'dry-run')),
  lidos int not null default 0,
  atualizados int not null default 0,
  desativados int not null default 0,
  produtos_criados int not null default 0,
  pedidos_atualizados int not null default 0,
  erro text
);

create index if not exists erp_sync_log_recentes_idx on public.erp_sync_log (iniciado_em desc);

-- ========================================================== loja_config

create table if not exists public.loja_config (
  id int primary key default 1 check (id = 1),
  limite_ultimas_unidades_ml numeric(10,2) not null default 30,
  sync_ativo boolean not null default true,
  percentual_afiliado_padrao numeric(5,2) not null default 3,
  dias_atribuicao int not null default 30,
  atualizado_em timestamptz not null default now()
);

insert into public.loja_config (id) values (1) on conflict (id) do nothing;

-- ======================================================= user_profiles
-- A tabela nasceu pelo painel do Supabase (não há DDL versionada). Só ADD.

alter table public.user_profiles add column if not exists cpf_cnpj text;
alter table public.user_profiles add column if not exists ie text;
alter table public.user_profiles add column if not exists indicado_por uuid references auth.users(id);
alter table public.user_profiles add column if not exists aceite_termos_em timestamptz;

-- ================================================= afiliados e cupons

create table if not exists public.afiliados (
  user_id uuid primary key references auth.users(id) on delete cascade,
  codigo text not null unique,
  percentual numeric(5,2),
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table if not exists public.cupons (
  codigo text primary key,
  tipo text not null check (tipo in ('afiliado', 'campanha')),
  desconto_pct numeric(5,2),
  desconto_valor numeric(12,2),
  afiliado_user_id uuid references public.afiliados(user_id) on delete cascade,
  valido_de timestamptz,
  valido_ate timestamptz,
  limite_usos int,
  usos int not null default 0,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

-- Último clique em ?ref=CODIGO, por visitante (cookie) e, depois, por usuário.
create table if not exists public.atribuicoes (
  visitante_id text primary key,
  afiliado_user_id uuid not null references public.afiliados(user_id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  primeiro_clique_em timestamptz not null default now(),
  ultimo_clique_em timestamptz not null default now()
);

create index if not exists atribuicoes_user_idx on public.atribuicoes (user_id);

-- ============================================================ pedidos

create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  numero serial unique,
  user_id uuid not null references auth.users(id),
  -- Rótulos do ERP (rules/CRM_RULES.ts). O site só espelha.
  status text not null default 'RASCUNHO',
  erp_quote_id uuid,
  erp_quote_number int,
  cupom text references public.cupons(codigo),
  afiliado_user_id uuid references public.afiliados(user_id),
  frete jsonb,
  endereco jsonb,
  observacoes text,
  -- Preço ideal × quantidade, só informativo: quem precifica é o vendedor no ERP.
  total_estimado numeric(12,2),
  total_erp numeric(12,2),
  criado_em timestamptz not null default now(),
  enviado_em timestamptz,
  status_atualizado_em timestamptz
);

create index if not exists pedidos_user_idx on public.pedidos (user_id);
create index if not exists pedidos_erp_quote_idx on public.pedidos (erp_quote_id);

create table if not exists public.pedido_itens (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  produto_id uuid references public.produtos(id),
  -- O SKU FÍSICO — alias já resolvido no momento de gravar.
  erp_sku text not null,
  qtd numeric(10,2) not null check (qtd > 0),
  unidade text not null check (unidade in ('rolo', 'metro')),
  preco_unit_estimado numeric(12,2),
  lpns_solicitados text[] not null default '{}'
);

create index if not exists pedido_itens_pedido_idx on public.pedido_itens (pedido_id);

create table if not exists public.comissoes (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  afiliado_user_id uuid not null references public.afiliados(user_id),
  base_valor numeric(12,2) not null,
  percentual numeric(5,2) not null,
  valor numeric(12,2) not null,
  status text not null default 'pendente' check (status in ('pendente', 'apurada', 'paga', 'cancelada')),
  evento_erp text,
  apurada_em timestamptz,
  paga_em timestamptz,
  observacao text,
  criado_em timestamptz not null default now(),
  unique (pedido_id, afiliado_user_id)
);

-- ======================================================= loja_catalogo
--
-- A ÚNICA superfície pública do catálogo. Sem preço, sem saldo numérico —
-- só o nível qualitativo. Roda com os direitos do dono (bypassa RLS das
-- tabelas base) de propósito: é o recorte que pode ser público.

create or replace view public.loja_catalogo as
select
  p.id,
  p.slug,
  p.erp_sku,
  p.tipo_vinculo,
  p.pai_id,
  p.alias_de,
  p.nome,
  p.subtitulo,
  p.marca_exibicao,
  p.brand_key,
  p.linha_key,
  p.linha_label,
  p.vertical,
  p.kind,
  p.aplicacoes,
  p.codigo,
  p.imagem,
  p.galeria,
  p.hex,
  p.cor_declarada,
  p.transparente,
  p.hex_inferido,
  p.acabamentos,
  p.acabamento_label,
  p.familia_padrao,
  p.descricao,
  p.ficha,
  p.badges,
  p.garantia_anos,
  p.durabilidade_anos,
  p.legacy_path,
  p.shipping_profile_id,
  p.seo_titulo,
  p.seo_descricao,
  p.ordem,
  p.origem,
  e.largura_m,
  e.metragem_padrao,
  e.unidade,
  case
    when e.sku is null then null
    when not e.ativo or e.saldo_ml <= 0 then 'sob-encomenda'
    when e.saldo_ml <= coalesce(nullif(e.estoque_minimo, 0), c.limite_ultimas_unidades_ml) then 'ultimas-unidades'
    else 'pronta-entrega'
  end as nivel_estoque,
  greatest(p.atualizado_em, coalesce(e.sincronizado_em, p.atualizado_em)) as atualizado_em
from public.produtos p
left join public.erp_produtos e on e.sku = p.erp_sku
cross join public.loja_config c
where p.publicado
  and not p.oculto_manual
  and (p.tipo_vinculo = 'familia' or coalesce(e.ativo, false));

comment on view public.loja_catalogo is
  'Recorte público da LOJA. Se um dia alguém adicionar preço ou saldo aqui, estará quebrando a premissa do desenho.';

grant select on public.loja_catalogo to anon, authenticated;

-- ================================================================ RLS

alter table public.erp_produtos enable row level security;
alter table public.produtos enable row level security;
alter table public.erp_sku_map enable row level security;
alter table public.erp_sync_log enable row level security;
alter table public.loja_config enable row level security;
alter table public.afiliados enable row level security;
alter table public.cupons enable row level security;
alter table public.atribuicoes enable row level security;
alter table public.pedidos enable row level security;
alter table public.pedido_itens enable row level security;
alter table public.comissoes enable row level security;

-- Admin: tudo, nas tabelas de cadastro e integração.
do $$
declare t text;
begin
  foreach t in array array['erp_produtos','produtos','erp_sku_map','erp_sync_log','loja_config','afiliados','cupons','atribuicoes','pedidos','pedido_itens','comissoes']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_admin_all', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.nz_is_admin()) with check (public.nz_is_admin())',
      t || '_admin_all', t
    );
  end loop;
end $$;

-- Usuário comum: lê o que é dele. Escrita passa pela API (service role).
drop policy if exists afiliados_proprio on public.afiliados;
create policy afiliados_proprio on public.afiliados
  for select to authenticated using (user_id = auth.uid());

drop policy if exists pedidos_proprio on public.pedidos;
create policy pedidos_proprio on public.pedidos
  for select to authenticated using (user_id = auth.uid());

drop policy if exists pedido_itens_proprio on public.pedido_itens;
create policy pedido_itens_proprio on public.pedido_itens
  for select to authenticated
  using (exists (select 1 from public.pedidos p where p.id = pedido_id and p.user_id = auth.uid()));

drop policy if exists comissoes_proprio on public.comissoes;
create policy comissoes_proprio on public.comissoes
  for select to authenticated using (afiliado_user_id = auth.uid());

-- Nenhuma policy para anon em nenhuma tabela: anon só enxerga loja_catalogo.

notify pgrst, 'reload schema';
