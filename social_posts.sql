-- =====================================================================
-- NZ — Tabela social_posts (Agenda Social Media)
-- Roda esse SQL no SQL Editor do Supabase do projeto nzgroup.
-- =====================================================================

create table if not exists public.social_posts (
  id              uuid primary key default gen_random_uuid(),
  account         text not null check (account in ('nzppf', 'nzgroup', 'joaowrap')),
  pillar          text,                                         -- ex: "Showcase Luxury", "Captação Lojista", "Bastidor"
  title           text not null,                                -- título interno do card
  caption         text,                                         -- legenda completa que vai pro Instagram
  format          text,                                         -- "Foto", "Reel", "Carrossel", etc.
  asset_url       text,                                         -- link p/ asset (Drive, pasta local, URL)
  scheduled_for   date,                                         -- data prevista de postagem
  status          text not null default 'backlog'
                  check (status in ('backlog','em_producao','pronto','agendado','postado')),
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid references auth.users(id) on delete set null
);

-- Índices úteis
create index if not exists social_posts_status_idx on public.social_posts(status);
create index if not exists social_posts_account_idx on public.social_posts(account);
create index if not exists social_posts_scheduled_for_idx on public.social_posts(scheduled_for);

-- Row Level Security: só admins têm acesso
alter table public.social_posts enable row level security;

drop policy if exists "social_posts_admin_all" on public.social_posts;
create policy "social_posts_admin_all"
  on public.social_posts
  for all
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Trigger para manter updated_at sempre atualizado
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists social_posts_touch_updated_at on public.social_posts;
create trigger social_posts_touch_updated_at
  before update on public.social_posts
  for each row execute function public.touch_updated_at();

-- =====================================================================
-- (Opcional) Seed inicial — descomente se quiser começar com cards prontos
-- =====================================================================
-- insert into public.social_posts (account, pillar, title, format, scheduled_for, status, notes) values
--   ('nzgroup',  'Captação Lojista',    '+1.200 lojas. 10 estados. R$ 48mi.',                     'Foto',       current_date + 1, 'agendado',    'Legenda 24 do banco.'),
--   ('nzppf',    'Showcase Luxury',     'RAM cromada @adesivotech',                               'Reel',       current_date + 2, 'em_producao', 'Cortar do bruto. Legenda 01.'),
--   ('joaowrap', 'Bastidor',            'Decisão difícil — neguei pedido grande',                 'Reel',       current_date + 2, 'pronto',      'Legenda 29 já gravada. Falta capa.'),
--   ('nzgroup',  'Catálogo NZ Wrap',    'Cor da semana: Stuttgart Sport Grey',                    'Carrossel',  current_date + 3, 'backlog',     'Legenda 15. 4 fotos em luzes diferentes.'),
--   ('nzppf',    'Educativo Prime',     'PPF comum vs. PRIME — diferença no 2º ano',              'Carrossel',  current_date + 4, 'backlog',     'Legenda 05.'),
--   ('joaowrap', 'Educação Aplicador',  'Top 3 erros que vejo na NZ Academy',                     'Carrossel',  current_date + 5, 'backlog',     'Legenda 34.'),
--   ('nzppf',    'Showcase Headlight',  'Detalhes definem o conjunto — Dark Black @parceiro',     'Foto',       current_date + 6, 'backlog',     'Legenda 11.');
