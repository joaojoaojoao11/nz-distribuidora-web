-- CNPJ com letras (Receita, desde julho de 2026) no banco do site — Fase 1 do plano do CNPJ alfanumérico.
--
-- As 12 primeiras posições do CNPJ podem ser letras maiúsculas ou números; os 2 verificadores continuam
-- números (ex.: 12.ABC.345/01DE-35). Até aqui o banco tirava "tudo que não é número" do documento: o CNPJ
-- novo virava 9 números, o login por documento dizia "inválido" e "minhas garantias" podia juntar dois
-- CNPJs diferentes. Agora o documento guardado é: sem pontuação, em maiúsculas, só 0–9 e A–Z
-- (normalizar_documento). Todo documento que já existe (só números) fica EXATAMENTE igual — nada a migrar.
--
-- Funções refeitas (o resto de cada uma igual ao que estava no ar em 23/10):
--   · normalizar_documento_perfil (gatilho de user_profiles)
--   · login_conferir_documento (entrar com CPF/CNPJ)
--   · handle_new_user (criação da conta; documento do afiliado na regra "não indica a si mesmo")
--   · validar_garantia (máscara do documento no certificado público)
--   · minhas_garantias (garantias da conta pelo documento)
--
-- E um conserto antigo, achado no teste: garantias_nz.cliente_cpf era varchar(14) — cabe o CPF com
-- pontuação (14), mas não o CNPJ (18: 00.000.000/0000-00). Garantia de EMPRESA nunca gravou (em 23/10:
-- 13 garantias, nenhuma com CNPJ). Aumentar o limite não reescreve a tabela.

alter table public.garantias_nz alter column cliente_cpf type varchar(18);

create or replace function public.normalizar_documento(p text)
returns text
language sql
immutable
parallel safe
set search_path to ''
as $$
  select nullif(upper(regexp_replace(coalesce(p, ''), '[^0-9A-Za-z]', '', 'g')), '');
$$;

create or replace function public.normalizar_documento_perfil()
returns trigger
language plpgsql
set search_path to 'public', 'pg_temp'
as $function$
begin
  new.cpf_cnpj := public.normalizar_documento(new.cpf_cnpj);
  return new;
end;
$function$;

create or replace function public.login_conferir_documento(p_doc text, p_senha text)
returns table(email text, resultado text)
language plpgsql
security definer
set search_path to 'public', 'extensions', 'pg_temp'
as $function$
declare
  v_doc text := coalesce(public.normalizar_documento(p_doc), '');
  v_id uuid;
  v_role text;
  v_hash text;
  v_email text;
  v_banido timestamptz;
  v_apagado timestamptz;
begin
  -- CPF: 11 números. CNPJ: 12 letras/números + 2 números.
  if v_doc !~ '^([0-9]{11}|[0-9A-Z]{12}[0-9]{2})$' or coalesce(p_senha, '') = '' then
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
$function$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  m          jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_role     text  := case when m->>'role' in ('reseller', 'lojista') then m->>'role' else 'client' end;
  v_origem   text  := case
                        when coalesce(new.raw_app_meta_data->>'provider', '') = 'google' then 'google'
                        when m->>'origem' = 'google' then 'google'
                        else 'site' end;
  v_doc      text  := public.normalizar_documento(m->>'cpf_cnpj');
  v_nome     text  := nullif(trim(coalesce(m->>'full_name', m->>'name', '')), '');
  v_ind_raw  text  := nullif(trim(coalesce(m->>'indicado_por', '')), '');
  v_indicado uuid;
  v_doc_af   text;
begin
  -- Quem indicou: só o código (NZ-XXXXX) de afiliado aprovado e ativo.
  if v_ind_raw ~ '^[A-Za-z0-9][A-Za-z0-9-]{2,23}$' then
    select a.user_id, public.normalizar_documento(a.documento)
      into v_indicado, v_doc_af
      from public.afiliados a
     where a.codigo = upper(v_ind_raw) and a.ativo and a.status = 'aprovado'
     limit 1;
  end if;
  if v_indicado = new.id or (v_doc is not null and v_doc = v_doc_af) then
    v_indicado := null;
  end if;

  insert into public.user_profiles (
    id, email, full_name, role, is_approved, origem,
    phone, cpf_cnpj, company_name, ie, indicado_por, aceite_termos_em,
    address_zip, address_street, address_number, address_complement,
    address_neighborhood, address_city, address_state,
    aprovado_em, aprovado_motivo
  ) values (
    new.id, new.email, coalesce(v_nome, ''), v_role, false, v_origem,
    nullif(trim(coalesce(m->>'phone', '')), ''),
    v_doc,
    nullif(trim(coalesce(m->>'company_name', '')), ''),
    nullif(trim(coalesce(m->>'ie', '')), ''),
    v_indicado,
    case when m ? 'aceite_termos_em' or v_origem = 'google' then now() else null end,
    nullif(regexp_replace(coalesce(m->>'address_zip', ''), '\D', '', 'g'), ''),
    nullif(trim(coalesce(m->>'address_street', '')), ''),
    nullif(trim(coalesce(m->>'address_number', '')), ''),
    nullif(trim(coalesce(m->>'address_complement', '')), ''),
    nullif(trim(coalesce(m->>'address_neighborhood', '')), ''),
    nullif(trim(coalesce(m->>'address_city', '')), ''),
    nullif(upper(trim(coalesce(m->>'address_state', ''))), ''),
    null,
    null
  )
  on conflict (id) do nothing;

  return new;
end;
$function$;

create or replace function public.validar_garantia(p_codigo text)
returns table(cpf_mascarado text, veiculo_modelo text, veiculo_placa_chassi text, aplicador_nome text, data_aplicacao date, produto_nome text, linha_escolhida text, tipo_servico text, areas_protegidas jsonb, garantia_anos integer, durabilidade_anos integer, codigo_autenticacao text)
language sql
stable security definer
set search_path to 'public'
as $function$
  select
    case
      when coalesce(public.normalizar_documento(g.cliente_cpf), '') ~ '^[0-9]{11}$'
        then '***.***.***-' || right(public.normalizar_documento(g.cliente_cpf), 2)
      when coalesce(public.normalizar_documento(g.cliente_cpf), '') ~ '^[0-9A-Z]{12}[0-9]{2}$'
        then '**.***.***/****-' || right(public.normalizar_documento(g.cliente_cpf), 2)
      else '***.***.***-**'
    end,
    g.veiculo_modelo,
    g.veiculo_placa_chassi,
    g.aplicador_nome,
    g.data_aplicacao,
    g.produto_nome,
    g.linha_escolhida,
    g.tipo_servico,
    g.areas_protegidas,
    g.garantia_anos,
    g.durabilidade_anos,
    g.codigo_autenticacao
  from public.garantias_nz g
  where length(coalesce(p_codigo, '')) >= 6
    and g.codigo_autenticacao = p_codigo
    and g.status = 'aprovada'
  limit 1;
$function$;

create or replace function public.minhas_garantias()
returns table(id uuid, protocolo text, status text, produto_nome text, linha_escolhida text, tipo_servico text, veiculo_modelo text, veiculo_placa_chassi text, aplicador_nome text, data_aplicacao date, garantia_anos integer, durabilidade_anos integer, areas_protegidas jsonb, codigo_autenticacao text, certificado_gerado boolean, pdf_url text, created_at timestamp with time zone)
language sql
stable security definer
set search_path to 'public'
as $function$
  select
    g.id, g.protocolo, g.status, g.produto_nome, g.linha_escolhida, g.tipo_servico,
    g.veiculo_modelo, g.veiculo_placa_chassi, g.aplicador_nome,
    g.data_aplicacao, g.garantia_anos, g.durabilidade_anos, g.areas_protegidas,
    case when g.status = 'aprovada' then g.codigo_autenticacao end,
    g.certificado_gerado,
    case when g.status = 'aprovada' then g.pdf_url end,
    g.created_at
  from public.garantias_nz g
  join public.user_profiles p on p.id = auth.uid()
  where auth.uid() is not null
    and (
      (
        public.normalizar_documento(p.cpf_cnpj) is not null
        and public.normalizar_documento(g.cliente_cpf) = public.normalizar_documento(p.cpf_cnpj)
      )
      or (
        nullif(lower(coalesce(p.email, '')), '') is not null
        and lower(coalesce(g.cliente_email, '')) = lower(p.email)
      )
    )
  order by g.created_at desc nulls last;
$function$;
