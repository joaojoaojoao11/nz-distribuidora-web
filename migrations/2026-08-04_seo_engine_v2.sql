-- Motor SEO IA v2 — aplicada em 2026-08-04 no projeto uibjmvkvbthzypgozpcs
-- (via MCP apply_migration "seo_engine_v2" + seeds via execute_sql)

-- === DDL ===
alter table public.blog_posts add column if not exists faq jsonb;
alter table public.blog_ai_campaigns add column if not exists auto_publish boolean not null default true;
alter table public.blog_ai_memory_log add column if not exists generated_slug text;

create table if not exists public.blog_ai_run_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  campaign_id uuid references public.blog_ai_campaigns(id) on delete set null,
  post_id uuid references public.blog_posts(id) on delete set null,
  status text,
  reason text,
  image_mode text
);

alter table public.blog_ai_run_log enable row level security;

drop policy if exists "admin_read_run_log" on public.blog_ai_run_log;
create policy "admin_read_run_log" on public.blog_ai_run_log
  for select
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid() and up.role = 'admin'
    )
  );

-- === SEEDS ===
insert into public.blog_categories (name, slug) values
  ('PPF', 'ppf'),
  ('Envelopamento', 'envelopamento'),
  ('Guia do Consumidor', 'guia-do-consumidor'),
  ('Mercado do Instalador', 'mercado-do-instalador'),
  ('Manutenção', 'manutencao')
on conflict (slug) do nothing;

-- Desativa a campanha antiga (gerava sempre o mesmo comparativo — canibalização)
update public.blog_ai_campaigns set is_active = false
where theme ilike '%comparativo%';

-- 6 campanhas em rodízio; começam com auto_publish=false (rascunho para revisão).
-- Temas/instructions completos: ver histórico da migration ou o painel AdminAIBlog.
-- Campanhas: Linhas NZPPF em profundidade (ppf) · Dúvidas do dono de carro (guia-do-consumidor)
-- · PPF e envelopamento na Grande São Paulo (guia-do-consumidor) · Técnica e negócio do
-- instalador (mercado-do-instalador) · Envelopamento NZWRAP, cores e tendências (envelopamento)
-- · Manutenção e pós-venda de PPF e wrap (manutencao)
