-- O trigger deixa de criar administradores. Ponto.
--
-- Tentativa anterior (2026-09-08b): o trigger promovia quem tivesse convite E
-- `auth.users.invited_at` preenchido. Na prática o GoTrue grava `invited_at`
-- DEPOIS do INSERT que dispara o trigger, então a condição nunca era verdadeira
-- e o convite não promovia ninguém.
--
-- Em vez de perseguir o detalhe interno do GoTrue, a regra fica sem ambiguidade:
-- toda conta nasce cliente ou lojista. Quem vira admin é promovido pelo
-- servidor, na op `convidar` de /api/nz/equipe, logo depois de criar o usuário —
-- com um admin autenticado do outro lado e o usuário exato em mãos (id, não
-- e-mail). Não existe caminho em que um cadastro comum vire administrador.
--
-- `equipe_convites` continua: é o registro de quem foi convidado, com o papel e
-- as permissões que vieram do NZERP, e o que o painel usa para mostrar status.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  m          jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_role     text  := case when m->>'role' = 'reseller' then 'reseller' else 'client' end;
  v_origem   text  := case when m->>'origem' = 'google' then 'google' else 'site' end;
  v_aprovado boolean := v_role = 'client';
  v_doc      text  := nullif(regexp_replace(coalesce(m->>'cpf_cnpj', ''), '\D', '', 'g'), '');
  v_nome     text  := nullif(trim(coalesce(m->>'full_name', m->>'name', '')), '');
begin
  insert into public.user_profiles (
    id, email, full_name, role, is_approved, origem,
    phone, cpf_cnpj, company_name, ie, indicado_por, aceite_termos_em,
    address_zip, address_street, address_number, address_complement,
    address_neighborhood, address_city, address_state,
    aprovado_em, aprovado_motivo
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
    case when v_aprovado then now() else null end,
    case when v_role = 'client' then 'cliente final — automático' else null end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;
