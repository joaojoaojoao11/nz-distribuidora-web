-- Landing page do Festival Interlagos 2026 (Edição Auto, 27-30/08).
-- Tabela de captação de leads via QR Code do estande, com endereço para envio do brinde.
-- Aplicada em 2026-08-27 no projeto uibjmvkvbthzypgozpcs via MCP apply_migration.

create table if not exists public.leads_festival_interlagos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  perfil text not null check (perfil in ('envelopador','aplicador_ppf','ambos','proprietario')),
  nome text not null,
  telefone text not null,
  email text,
  instagram text not null,

  cep text not null,
  logradouro text not null,
  numero text not null,
  complemento text,
  bairro text not null,
  cidade text not null,
  uf text not null,

  quer_indicacao_aplicador boolean default false,
  servico_interesse text,
  marcas_utilizadas text,
  volume_mensal text,

  segue_instagram boolean default false,
  consentimento_lgpd boolean not null default false,

  brinde_status text not null default 'pendente'
    check (brinde_status in ('pendente','validado','enviado','recusado')),

  origem text default 'qr_festival_interlagos',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  user_agent text
);

-- Anti-fraude: um brinde por telefone e por Instagram.
create unique index if not exists leads_interlagos_telefone_uniq
  on public.leads_festival_interlagos (telefone);
create unique index if not exists leads_interlagos_instagram_uniq
  on public.leads_festival_interlagos (lower(instagram));
create index if not exists leads_interlagos_created_at_idx
  on public.leads_festival_interlagos (created_at desc);

alter table public.leads_festival_interlagos enable row level security;

-- Insert público (anon key do browser) — mesmo padrão de installer_leads.
drop policy if exists "anon pode inserir" on public.leads_festival_interlagos;
create policy "anon pode inserir"
  on public.leads_festival_interlagos
  for insert to anon
  with check (true);

-- Sem policy de select para anon: leitura só via service_role / painel.
-- Admin lê e gerencia pelo painel — padrão de social_posts.sql.
drop policy if exists "leads_interlagos_admin_all" on public.leads_festival_interlagos;
create policy "leads_interlagos_admin_all"
  on public.leads_festival_interlagos
  for all to authenticated
  using      (exists (select 1 from public.user_profiles where id = auth.uid() and role in ('admin','superadmin')))
  with check (exists (select 1 from public.user_profiles where id = auth.uid() and role in ('admin','superadmin')));
