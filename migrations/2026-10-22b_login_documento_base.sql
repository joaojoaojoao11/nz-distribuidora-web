-- Login com CPF/CNPJ, Fase 0 (22/10/2026): a base, sem mudar tela nenhuma.
--
-- 1. login_tentativas — o rastro de cada tentativa de entrar pelo documento,
--    para os limites contra força bruta (por documento e por IP). O documento
--    NÃO é gravado: só um HMAC dele (chave_doc), calculado no servidor.
-- 2. login_conferir_documento — confere CPF/CNPJ + senha DIRETO no banco
--    (bcrypt do Auth, pgcrypto). Só o servidor chama (service_role). Por que
--    não o login do Supabase pelo servidor: o limite do Supabase é por IP de
--    origem e ignora X-Forwarded-For (testado em 22/10) — todo login por
--    documento sairia do IP da Vercel e um ataque travaria o login de todos.
--    Com a senha certa, o servidor devolve o e-mail DA PRÓPRIA conta e o
--    navegador entra como sempre, pelo IP do cliente.
--    Caminho sem conta / admin / sem senha / bloqueada: roda um bcrypt de
--    mentira para o tempo de resposta ser o mesmo.
-- 3. trava do documento — depois que a conta é aprovada ou ligada ao NZERP, o
--    CPF/CNPJ vira identidade (login e chave com o ERP): o cliente não troca
--    mais pela tela Meus dados. O admin troca pelo servidor (op
--    trocar-documento, com rastro em equipe_log).

-- ----------------------------------------------------------- 1. tentativas
create table if not exists public.login_tentativas (
  id bigserial primary key,
  chave_doc text,
  ip text,
  resultado text not null check (resultado in ('ok', 'senha', 'sem-conta', 'sem-senha', 'admin', 'bloqueada', 'invalido', 'limite')),
  criado_em timestamptz not null default now()
);
create index if not exists login_tentativas_doc_idx on public.login_tentativas (chave_doc, criado_em desc);
create index if not exists login_tentativas_ip_idx on public.login_tentativas (ip, criado_em desc);
alter table public.login_tentativas enable row level security;
revoke all on public.login_tentativas from anon, authenticated;
comment on table public.login_tentativas is 'Tentativas de entrar com CPF/CNPJ (limites contra força bruta). chave_doc = HMAC do documento, nunca o número. Apagado após 30 dias pelo sync diário.';

-- ------------------------------------------------- 2. conferir a senha
create or replace function public.login_conferir_documento(p_doc text, p_senha text)
returns table (email text, resultado text)
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_doc text := regexp_replace(coalesce(p_doc, ''), '\D', '', 'g');
  v_id uuid;
  v_role text;
  v_hash text;
  v_email text;
  v_banido timestamptz;
  v_apagado timestamptz;
begin
  if length(v_doc) not in (11, 14) or coalesce(p_senha, '') = '' then
    perform extensions.crypt(coalesce(nullif(p_senha, ''), 'x'), extensions.gen_salt('bf', 10));
    return query select null::text, 'invalido'::text;
    return;
  end if;

  select p.id, p.role into v_id, v_role from public.user_profiles p where p.cpf_cnpj = v_doc limit 1;
  if v_id is not null then
    select u.encrypted_password, u.email, u.banned_until, u.deleted_at
      into v_hash, v_email, v_banido, v_apagado
      from auth.users u where u.id = v_id;
  end if;

  if v_id is null or v_email is null or v_apagado is not null then
    perform extensions.crypt(p_senha, extensions.gen_salt('bf', 10));
    return query select null::text, 'sem-conta'::text;
    return;
  end if;
  if v_role = 'admin' then
    perform extensions.crypt(p_senha, extensions.gen_salt('bf', 10));
    return query select null::text, 'admin'::text;
    return;
  end if;
  if v_banido is not null and v_banido > now() then
    perform extensions.crypt(p_senha, extensions.gen_salt('bf', 10));
    return query select null::text, 'bloqueada'::text;
    return;
  end if;
  if coalesce(v_hash, '') = '' then
    perform extensions.crypt(p_senha, extensions.gen_salt('bf', 10));
    return query select null::text, 'sem-senha'::text;
    return;
  end if;

  if extensions.crypt(p_senha, v_hash) = v_hash then
    return query select v_email, 'ok'::text;
  else
    return query select null::text, 'senha'::text;
  end if;
end;
$$;

revoke all on function public.login_conferir_documento(text, text) from public, anon, authenticated;
grant execute on function public.login_conferir_documento(text, text) to service_role;
comment on function public.login_conferir_documento(text, text) is 'Login com CPF/CNPJ: confere a senha no bcrypt do Auth. Devolve o e-mail só com a senha certa. Só service_role.';

-- ------------------------------------------------- 3. trava do documento
create or replace function public.trava_documento_perfil()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Só a própria pessoa logada (authenticated, não admin) é barrada. O servidor
  -- (service_role), o admin e o SQL direto da manutenção passam.
  if old.cpf_cnpj is not null
     and new.cpf_cnpj is distinct from old.cpf_cnpj
     and (coalesce(old.is_approved, false) or old.erp_client_id is not null)
     and coalesce(auth.role(), '') = 'authenticated'
     and not public.nz_is_admin() then
    raise exception 'documento-travado'
      using errcode = 'P0001',
            hint = 'O CPF/CNPJ desta conta só pode ser trocado pela NZ.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_trava_documento on public.user_profiles;
create trigger trg_trava_documento
  before update of cpf_cnpj on public.user_profiles
  for each row execute function public.trava_documento_perfil();

notify pgrst, 'reload schema';
