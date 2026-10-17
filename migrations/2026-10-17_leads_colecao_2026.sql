-- Coleção NZPPF 2026 · Os Clãs (página /colecao, alias /clas).
-- Lista de espera do lançamento de quinta, 29/10/2026, às 18h: quem entra recebe o
-- aviso primeiro no WhatsApp. O formulário grava direto do navegador (anon key).
-- Mesmo padrão de RLS de leads_festival_interlagos (2026-08-27): insert anônimo,
-- leitura e gestão só para admin/superadmin pelo painel (/admin/promo).
-- APLICADA em 17/10/2026 no projeto do site (uibjmvkvbthzypgozpcs), via Management API.

create table if not exists public.leads_colecao_2026 (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  nome text not null check (char_length(nome) between 1 and 120),
  -- E.164 (+5511999998888), normalizado no formulário.
  whatsapp text not null check (whatsapp ~ '^\+55[0-9]{10,11}$'),
  cla text check (cla in ('sol-nascente','detalhe','meia-noite','fumaca','night-riders')),

  -- utm_source da visita, ou 'site' quando não veio de campanha.
  origem text check (char_length(origem) <= 80),
  utm_campaign text check (char_length(utm_campaign) <= 120)
);

-- Um aviso por número: o segundo cadastro do mesmo WhatsApp volta 23505 e a
-- página mostra "você já está na lista".
create unique index if not exists leads_colecao_2026_whatsapp_uniq
  on public.leads_colecao_2026 (whatsapp);
create index if not exists leads_colecao_2026_created_at_idx
  on public.leads_colecao_2026 (created_at desc);

alter table public.leads_colecao_2026 enable row level security;

-- Insert público (anon key do browser). Diferente do Interlagos, vale também para
-- `authenticated`: cliente logado na loja navega com o JWT dele e, só com `anon`,
-- o cadastro dele na lista seria barrado pela RLS (mesmo padrão de garantias_nz,
-- 2026-09-10). Inserir é tudo o que essas duas funções podem fazer aqui.
drop policy if exists "publico pode inserir" on public.leads_colecao_2026;
create policy "publico pode inserir"
  on public.leads_colecao_2026
  for insert to anon, authenticated
  with check (true);

-- Sem policy de select para anon: leitura só via service_role / painel.
drop policy if exists "leads_colecao_2026_admin_all" on public.leads_colecao_2026;
create policy "leads_colecao_2026_admin_all"
  on public.leads_colecao_2026
  for all to authenticated
  using      (exists (select 1 from public.user_profiles where id = auth.uid() and role in ('admin','superadmin')))
  with check (exists (select 1 from public.user_profiles where id = auth.uid() and role in ('admin','superadmin')));

notify pgrst, 'reload schema';
