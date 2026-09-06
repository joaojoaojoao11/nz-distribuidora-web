-- Fecha o caminho "me cadastro com o e-mail de alguém da NZ e viro admin".
--
-- O projeto tem confirmação automática de e-mail (mailer_autoconfirm), então
-- criar conta com `elisa@nzdistribuidora.com.br` não prova nada sobre quem
-- controla aquela caixa. Se bastasse existir uma linha em `equipe_convites`
-- para o trigger promover, um estranho que soubesse os e-mails da equipe ganharia
-- o painel administrativo.
--
-- A prova de que o convite foi de fato entregue àquela caixa é `invited_at`, que
-- o Supabase preenche quando o usuário nasce do fluxo de convite
-- (inviteUserByEmail / generateLink type=invite) — e que um signUp comum nunca
-- tem. Agora o trigger exige as DUAS coisas: convite registrado pelo servidor E
-- usuário criado pelo convite.
--
-- Quem já tem conta continua sendo promovido pelo servidor (op `convidar` →
-- `promover`), com admin logado do outro lado.

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
  -- Convite pendente para este e-mail E conta nascida do próprio convite.
  if new.invited_at is not null then
    select * into v_convite from public.equipe_convites
     where email = v_email and revogado_em is null;
  end if;

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
