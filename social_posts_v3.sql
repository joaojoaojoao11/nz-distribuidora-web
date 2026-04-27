-- =====================================================================
-- NZ — Migration v3: Objetivos, Tarefas e Feeds de Calendário externos
-- Roda no SQL Editor do Supabase do projeto NZ depois das migrations
-- v1 (social_posts) e v2 (checklist). Tudo idempotente.
--
-- Tabelas:
--   - agenda_objectives: objetivos mensais e semanais
--   - agenda_tasks: tarefas vinculáveis a objetivos e/ou social_posts
--   - calendar_feeds: URLs .ics públicos pra overlay read-only
-- =====================================================================

create table if not exists public.agenda_objectives (
  id           uuid primary key default gen_random_uuid(),
  scope        text not null check (scope in ('monthly','weekly')),
  title        text not null,
  description  text,
  -- Para 'monthly': primeiro dia do mês. Para 'weekly': segunda-feira da semana.
  target_date  date not null,
  status       text not null default 'open'
                check (status in ('open','done','dropped')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id) on delete set null
);

create table if not exists public.agenda_tasks (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text,
  due_date        date,                                              -- null = sem prazo
  status          text not null default 'pending'
                  check (status in ('pending','doing','done','dropped')),
  priority        int  not null default 2,                            -- 1=alta, 2=média, 3=baixa
  objective_id    uuid references public.agenda_objectives(id) on delete set null,
  social_post_id  uuid references public.social_posts(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid references auth.users(id) on delete set null
);

create index if not exists agenda_objectives_scope_date_idx
  on public.agenda_objectives(scope, target_date);
create index if not exists agenda_tasks_due_date_idx
  on public.agenda_tasks(due_date);
create index if not exists agenda_tasks_objective_idx
  on public.agenda_tasks(objective_id);
create index if not exists agenda_tasks_post_idx
  on public.agenda_tasks(social_post_id);

-- RLS
alter table public.agenda_objectives enable row level security;
alter table public.agenda_tasks enable row level security;

drop policy if exists "agenda_objectives_admin_all" on public.agenda_objectives;
create policy "agenda_objectives_admin_all" on public.agenda_objectives for all
  using (exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "agenda_tasks_admin_all" on public.agenda_tasks;
create policy "agenda_tasks_admin_all" on public.agenda_tasks for all
  using (exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin'));

-- Triggers de updated_at (touch_updated_at já existe da migration v1)
drop trigger if exists agenda_objectives_touch on public.agenda_objectives;
create trigger agenda_objectives_touch before update on public.agenda_objectives
  for each row execute function public.touch_updated_at();

drop trigger if exists agenda_tasks_touch on public.agenda_tasks;
create trigger agenda_tasks_touch before update on public.agenda_tasks
  for each row execute function public.touch_updated_at();

-- =====================================================================
-- Feeds externos de calendário (overlay read-only com URLs .ics públicos)
-- =====================================================================

create table if not exists public.calendar_feeds (
  id           uuid primary key default gen_random_uuid(),
  label        text not null,
  ics_url      text not null,
  color        text not null default '#888888',
  enabled      boolean not null default true,
  created_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id) on delete set null
);

alter table public.calendar_feeds enable row level security;

drop policy if exists "calendar_feeds_admin_all" on public.calendar_feeds;
create policy "calendar_feeds_admin_all" on public.calendar_feeds for all
  using (exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin'));
