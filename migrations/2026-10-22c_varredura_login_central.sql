-- Varredura de 22/10/2026 — login por CPF/CNPJ e Central do cliente.
--
-- 1. user_profiles.cpf_cnpj sempre SÓ DÍGITOS (gatilho antes de gravar). A tela
--    Meus dados gravava o que vinha; "12.345.678/0001-90" convivia com
--    "12345678000190" de outra conta e furava o índice único, e as buscas (login,
--    recuperação, vínculo) não enxergavam a conta mascarada.
-- 2. Limite de tentativas ATÔMICO: login_tentar_documento trava por documento e
--    por IP (advisory lock), conta, confere a senha e grava a tentativa na mesma
--    transação. Antes, contar → conferir (~100 ms de bcrypt) → gravar deixava uma
--    rajada em paralelo passar inteira pela contagem com zero. E o limite por
--    documento contava só senha errada — o 429 entregava quem tinha conta. Agora:
--    por documento conta TODA falha (sem conta, admin, sem senha…); por IP conta
--    só falha (CGNAT de operadora não trava quem acerta); sem IP vira 'sem-ip'.
-- 3. 'superadmin' é admin também no login por documento (nz_is_admin já trata assim).
-- 4. titulo_emissao_trava: dois cliques em "Gerar Pix/boleto" (Início + Pagamentos,
--    ou repetir depois do tempo esgotado) não pedem duas cobranças ao ERP.

-- --------------------------------------------------------------- 1. documento
create or replace function public.normalizar_documento_perfil()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.cpf_cnpj := nullif(regexp_replace(coalesce(new.cpf_cnpj, ''), '\D', '', 'g'), '');
  return new;
end;
$$;

-- O nome começa com "a" de propósito: gatilhos BEFORE rodam em ordem alfabética,
-- e este tem que vir antes da trava (trg_trava_documento) compará-lo.
drop trigger if exists a_normaliza_documento on public.user_profiles;
create trigger a_normaliza_documento
  before insert or update of cpf_cnpj on public.user_profiles
  for each row execute function public.normalizar_documento_perfil();

update public.user_profiles
   set cpf_cnpj = nullif(regexp_replace(cpf_cnpj, '\D', '', 'g'), '')
 where cpf_cnpj is not null and cpf_cnpj ~ '\D';

-- --------------------------------------------------------- 2/3. login atômico
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
  if v_role in ('admin', 'superadmin') then
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

create or replace function public.login_tentar_documento(p_doc text, p_senha text, p_chave text, p_ip text)
returns table (email text, resultado text)
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
#variable_conflict use_column
-- `resultado` e `email` são também os nomes das colunas de saída: sem o alias
-- `t.` o plpgsql não sabe se é a coluna ou a variável ("is ambiguous").
declare
  v_ip text := coalesce(nullif(trim(p_ip), ''), 'sem-ip');
  v_falhas_doc int;
  v_falhas_ip int;
  v_email text;
  v_res text;
begin
  -- Ordem fixa (documento, depois IP): sem ciclo, sem deadlock. Uma rajada do
  -- mesmo IP ou para o mesmo documento passa em fila — e a fila também segura o
  -- bcrypt, que não vira mais um ataque de CPU ao banco.
  perform pg_advisory_xact_lock(hashtext('login-doc:' || coalesce(p_chave, '')));
  perform pg_advisory_xact_lock(hashtext('login-ip:' || v_ip));

  select count(*) into v_falhas_doc from public.login_tentativas t
   where t.chave_doc = p_chave and t.resultado not in ('ok', 'limite') and t.criado_em > now() - interval '15 minutes';
  select count(*) into v_falhas_ip from public.login_tentativas t
   where t.ip = v_ip and t.resultado not in ('ok', 'limite') and t.criado_em > now() - interval '60 minutes';

  if v_falhas_doc >= 5 or v_falhas_ip >= 20 then
    insert into public.login_tentativas (chave_doc, ip, resultado) values (p_chave, v_ip, 'limite');
    return query select null::text, 'limite'::text;
    return;
  end if;

  select c.email, c.resultado into v_email, v_res from public.login_conferir_documento(p_doc, p_senha) c;
  insert into public.login_tentativas (chave_doc, ip, resultado) values (p_chave, v_ip, v_res);
  return query select case when v_res = 'ok' then v_email end, v_res;
end;
$$;

revoke all on function public.login_tentar_documento(text, text, text, text) from public, anon, authenticated;
grant execute on function public.login_tentar_documento(text, text, text, text) to service_role;
revoke all on function public.login_conferir_documento(text, text) from public, anon, authenticated;
grant execute on function public.login_conferir_documento(text, text) to service_role;

-- ------------------------------------------------------- 4. trava da emissão
create table if not exists public.titulo_emissao_trava (
  titulo_id text primary key,
  user_id uuid,
  criado_em timestamptz not null default now()
);
alter table public.titulo_emissao_trava enable row level security;
revoke all on public.titulo_emissao_trava from anon, authenticated;
comment on table public.titulo_emissao_trava is 'Pagar título (Central do cliente): uma emissão por vez por título. A linha vive só durante o pedido ao ERP; trava com mais de 2 min é considerada morta.';

notify pgrst, 'reload schema';
