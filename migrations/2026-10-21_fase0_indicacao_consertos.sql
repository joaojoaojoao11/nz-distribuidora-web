-- Fase 0 do plano de indicação/cashback (21/10/2026): consertos do que já existe.
-- Projeto: uibjmvkvbthzypgozpcs (site). O plano fica no NZERP
-- (docs/PLANO_INDICACAO_CASHBACK_AFILIADOS.md); aqui só o aviso docs/PLANO_INDICACAO_CASHBACK.md.
--
-- B2. handle_new_user: o cadastro manda em `indicado_por` o CÓDIGO do afiliado
--     (NZ-XXXXX, guardado pelo link ?ref=), mas a coluna é UUID e o gatilho só
--     aceitava UUID — 0 perfis preenchidos. Agora o código é resolvido aqui,
--     no servidor, pela tabela `afiliados` (só afiliado ativo); UUID continua
--     aceito. Ninguém indica a si mesmo. Quem já existe não é tocado.
-- B5. pedidos.cupom_consumido_em: o uso do cupom passa a ser consumido UMA vez
--     por pedido, no pagamento (checkout) ou no faturamento (orçamento, via
--     sync). Antes o orçamento consumia na criação, mesmo sem virar venda.

-- ====================================================== handle_new_user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  m          jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_role     text  := case when m->>'role' in ('reseller', 'lojista') then m->>'role' else 'client' end;
  v_origem   text  := case
                        when coalesce(new.raw_app_meta_data->>'provider', '') = 'google' then 'google'
                        when m->>'origem' = 'google' then 'google'
                        else 'site' end;
  v_doc      text  := nullif(regexp_replace(coalesce(m->>'cpf_cnpj', ''), '\D', '', 'g'), '');
  v_nome     text  := nullif(trim(coalesce(m->>'full_name', m->>'name', '')), '');
  v_ind_raw  text  := nullif(trim(coalesce(m->>'indicado_por', '')), '');
  v_indicado uuid;
begin
  -- Quem indicou: UUID direto, ou o código do afiliado (NZ-XXXXX) resolvido aqui.
  if v_ind_raw ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then
    v_indicado := v_ind_raw::uuid;
  elsif v_ind_raw ~ '^[A-Za-z0-9][A-Za-z0-9-]{2,23}$' then
    select a.user_id into v_indicado
      from public.afiliados a
     where a.codigo = upper(v_ind_raw) and a.ativo
     limit 1;
  end if;
  if v_indicado = new.id then
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
$$;

-- ====================================================== cupom consumido
alter table public.pedidos add column if not exists cupom_consumido_em timestamptz;
comment on column public.pedidos.cupom_consumido_em is
  'Quando o uso do cupom deste pedido foi contado em cupons.usos (pagamento no checkout, ou faturamento no ERP para orçamento). Nulo = ainda só reservado.';
create index if not exists pedidos_cupom_reserva_idx on public.pedidos (cupom) where cupom is not null and cupom_consumido_em is null;

-- Quem já consumiu pelo código antigo (pago no checkout, ou orçamento que
-- consumia na criação) fica marcado, para o sync não contar de novo.
update public.pedidos
   set cupom_consumido_em = coalesce(pago_em, criado_em)
 where cupom is not null
   and cupom_consumido_em is null
   and (pagamento_status = 'pago' or forma_pagamento is null);

notify pgrst, 'reload schema';
