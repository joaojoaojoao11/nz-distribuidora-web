-- Cadastro v2 — perfis completos na primeira escrita, equipe do NZERP como
-- admin do site e vínculo com a base de clientes do ERP.
--
-- Contexto: docs/PLANO_CADASTRO_CLIENTES_E_COMPRA.md (fase 4.1).
--
-- O que mudou de fundo:
--   1. `handle_new_user` passa a ler TODOS os metadados do signUp. Antes o front
--      criava o usuário e depois fazia um UPDATE separado com telefone/documento
--      /empresa; se esse segundo passo falhasse, o perfil ficava só com nome e
--      e-mail (foi o que aconteceu com as contas de abril).
--   2. `role = 'admin'` NUNCA vem dos metadados — qualquer pessoa pode forjar
--      metadados no signUp. Vem de uma linha em `equipe_convites`, tabela que só
--      o service role escreve.
--   3. Campos novos ligam o perfil ao ERP (cliente e colaborador).

-- ------------------------------------------------------------------ colunas
alter table public.user_profiles
  add column if not exists erp_client_id uuid,
  add column if not exists erp_user_id uuid,
  add column if not exists erp_role text,
  add column if not exists erp_permissions text[] not null default '{}',
  add column if not exists origem text not null default 'site',
  add column if not exists convidado_em timestamptz,
  add column if not exists ultimo_acesso_em timestamptz,
  add column if not exists cadastro_completo_em timestamptz,
  add column if not exists cobranca_igual_entrega boolean not null default true,
  add column if not exists cobranca_cep text,
  add column if not exists cobranca_numero text,
  add column if not exists aprovado_em timestamptz,
  add column if not exists aprovado_motivo text;

comment on column public.user_profiles.erp_client_id is 'clients.id no NZERP — preenchido no primeiro pedido ou no pós-cadastro.';
comment on column public.user_profiles.erp_user_id is 'users.id no NZERP — só para colaboradores (role=admin vindo de convite).';
comment on column public.user_profiles.origem is 'site | convite | google';

do $$ begin
  alter table public.user_profiles add constraint user_profiles_origem_check
    check (origem in ('site', 'convite', 'google'));
exception when duplicate_object then null; end $$;

-- Um documento, uma conta. Índice parcial: perfis sem documento não conflitam.
create unique index if not exists user_profiles_cpf_cnpj_uq
  on public.user_profiles (cpf_cnpj) where cpf_cnpj is not null;
create index if not exists user_profiles_erp_client_idx on public.user_profiles (erp_client_id);
create index if not exists user_profiles_erp_user_idx on public.user_profiles (erp_user_id);

-- ------------------------------------------------------------- convites
create table if not exists public.equipe_convites (
  email           text primary key,
  erp_user_id     uuid,
  erp_role        text,
  erp_permissions text[] not null default '{}',
  nome            text,
  criado_por      uuid,
  criado_em       timestamptz not null default now(),
  usado_em        timestamptz,
  revogado_em     timestamptz
);
comment on table public.equipe_convites is 'Quem pode virar admin do site. Só o service role escreve; o trigger handle_new_user consulta.';

alter table public.equipe_convites enable row level security;
drop policy if exists equipe_convites_admin_select on public.equipe_convites;
create policy equipe_convites_admin_select on public.equipe_convites for select using (public.is_admin());

-- ------------------------------------------------------------ auditoria
create table if not exists public.equipe_log (
  id          bigserial primary key,
  quando      timestamptz not null default now(),
  quem        uuid,
  acao        text not null,
  alvo_email  text,
  detalhe     jsonb
);
alter table public.equipe_log enable row level security;
drop policy if exists equipe_log_admin_select on public.equipe_log;
create policy equipe_log_admin_select on public.equipe_log for select using (public.is_admin());
create index if not exists equipe_log_quando_idx on public.equipe_log (quando desc);

-- --------------------------------------------------------------- trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  m          jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_email    text  := lower(trim(coalesce(new.email, '')));
  v_convite  public.equipe_convites%rowtype;
  v_role     text;
  v_origem   text;
  v_aprovado boolean;
  v_doc      text  := nullif(regexp_replace(coalesce(m->>'cpf_cnpj', ''), '\D', '', 'g'), '');
  v_nome     text  := nullif(trim(coalesce(m->>'full_name', m->>'name', '')), '');
begin
  -- Convite pendente para este e-mail? Então é gente da NZ.
  select * into v_convite from public.equipe_convites
   where email = v_email and revogado_em is null;

  if v_convite.email is not null then
    v_role     := 'admin';
    v_origem   := 'convite';
    v_aprovado := true;
  else
    -- Metadados só escolhem entre cliente e lojista. 'admin' aqui é ignorado.
    v_role     := case when m->>'role' = 'reseller' then 'reseller' else 'client' end;
    v_origem   := case when m->>'origem' = 'google' then 'google' else 'site' end;
    v_aprovado := v_role = 'client';
  end if;

  insert into public.user_profiles (
    id, email, full_name, role, is_approved, origem,
    phone, cpf_cnpj, company_name, ie, indicado_por, aceite_termos_em,
    address_zip, address_street, address_number, address_complement,
    address_neighborhood, address_city, address_state,
    erp_user_id, erp_role, erp_permissions, convidado_em, aprovado_em, aprovado_motivo
  ) values (
    new.id, new.email, coalesce(v_nome, ''), v_role, v_aprovado, v_origem,
    nullif(trim(coalesce(m->>'phone', '')), ''),
    v_doc,
    nullif(trim(coalesce(m->>'company_name', '')), ''),
    nullif(trim(coalesce(m->>'ie', '')), ''),
    case when (m->>'indicado_por') ~ '^[0-9a-fA-F-]{36}$' then (m->>'indicado_por')::uuid else null end,
    case when m ? 'aceite_termos_em' then now() else null end,
    nullif(regexp_replace(coalesce(m->>'address_zip', ''), '\D', '', 'g'), ''),
    nullif(trim(coalesce(m->>'address_street', '')), ''),
    nullif(trim(coalesce(m->>'address_number', '')), ''),
    nullif(trim(coalesce(m->>'address_complement', '')), ''),
    nullif(trim(coalesce(m->>'address_neighborhood', '')), ''),
    nullif(trim(coalesce(m->>'address_city', '')), ''),
    nullif(upper(trim(coalesce(m->>'address_state', ''))), ''),
    v_convite.erp_user_id, v_convite.erp_role, coalesce(v_convite.erp_permissions, '{}'),
    case when v_convite.email is not null then v_convite.criado_em else null end,
    case when v_aprovado then now() else null end,
    case when v_convite.email is not null then 'convite da equipe (NZERP)'
         when v_role = 'client' then 'cliente final — automático' else null end
  )
  on conflict (id) do nothing;

  if v_convite.email is not null then
    update public.equipe_convites set usado_em = now() where email = v_email;
  end if;

  return new;
end;
$$;

-- --------------------------------------------------------------- guarda
create or replace function public.nz_user_profiles_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Service role (auth.uid() null) e admin passam.
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  if new.role is distinct from old.role then
    raise exception 'papel só pode ser alterado por administrador';
  end if;
  if new.is_approved is distinct from old.is_approved then
    raise exception 'aprovação só pode ser alterada por administrador';
  end if;
  if new.id is distinct from old.id or new.email is distinct from old.email then
    raise exception 'id e e-mail não podem ser alterados aqui';
  end if;
  if new.erp_client_id is distinct from old.erp_client_id
     or new.erp_user_id is distinct from old.erp_user_id
     or new.erp_role is distinct from old.erp_role
     or new.erp_permissions is distinct from old.erp_permissions
     or new.origem is distinct from old.origem
     or new.convidado_em is distinct from old.convidado_em
     or new.aprovado_em is distinct from old.aprovado_em
     or new.aprovado_motivo is distinct from old.aprovado_motivo then
    raise exception 'campos de integração só podem ser alterados pelo sistema';
  end if;
  return new;
end;
$$;

-- Cadastro completo = o que o pedido precisa (mesma lista de api/_lib/conta).
create or replace function public.nz_marcar_cadastro_completo()
returns trigger
language plpgsql
as $$
declare
  completo boolean;
begin
  completo :=
    coalesce(new.full_name, '') <> ''
    and coalesce(new.cpf_cnpj, '') <> ''
    and coalesce(new.phone, '') <> ''
    and coalesce(new.address_street, '') <> ''
    and coalesce(new.address_number, '') <> ''
    and coalesce(new.address_city, '') <> ''
    and coalesce(new.address_state, '') <> ''
    and length(regexp_replace(coalesce(new.address_zip, ''), '\D', '', 'g')) = 8;
  if completo and new.cadastro_completo_em is null then
    new.cadastro_completo_em := now();
  elsif not completo then
    new.cadastro_completo_em := null;
  end if;
  return new;
end;
$$;

drop trigger if exists nz_cadastro_completo on public.user_profiles;
create trigger nz_cadastro_completo
  before insert or update on public.user_profiles
  for each row execute function public.nz_marcar_cadastro_completo();

-- ------------------------------------------------------------- acesso
-- O AuthContext chama isto uma vez por sessão. É a única forma de o próprio
-- usuário escrever `ultimo_acesso_em` (a guarda não deixa passar no UPDATE).
create or replace function public.tocar_acesso()
returns void
language sql
security definer
set search_path = public
as $$
  update public.user_profiles set ultimo_acesso_em = now() where id = auth.uid();
$$;
revoke all on function public.tocar_acesso() from public, anon;
grant execute on function public.tocar_acesso() to authenticated;

-- ------------------------------------------------------------- equipe
-- Junta o perfil com o que só existe em auth.users (último login, bloqueio),
-- sem expor auth.users. Admin lê; service role também (auth.uid() null).
create or replace function public.equipe_site()
returns table (
  id uuid, email text, full_name text, role text, is_approved boolean,
  erp_user_id uuid, erp_role text, erp_permissions text[],
  origem text, convidado_em timestamptz, ultimo_acesso_em timestamptz,
  last_sign_in_at timestamptz, bloqueado boolean, created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select p.id, p.email, p.full_name, p.role, p.is_approved,
         p.erp_user_id, p.erp_role, p.erp_permissions,
         p.origem, p.convidado_em, p.ultimo_acesso_em,
         u.last_sign_in_at,
         coalesce(u.banned_until > now(), false) as bloqueado,
         p.created_at
    from public.user_profiles p
    join auth.users u on u.id = p.id
   where auth.uid() is null or public.is_admin();
$$;
revoke all on function public.equipe_site() from public, anon;
grant execute on function public.equipe_site() to authenticated, service_role;
