-- Aprovação manual para todo cadastro + preço por tipo de acesso.
-- Projeto: uibjmvkvbthzypgozpcs (site). FIRECRAL/PLANO_CADASTRO_APROVACAO.md (Fases A e C).
--
-- 1. handle_new_user: NINGUÉM nasce aprovado. Desde 06/09 o cliente final nascia
--    aprovado (decisão enterrada no plano do checkout) e via a tabela de ATACADO;
--    em 20/10 uma cliente se cadastrou e comprou sem o João saber. Agora todo
--    cadastro espera o clique em Admin → Clientes. Papel novo `lojista`
--    (lojista/aplicador); `reseller` passa a significar REVENDEDOR. Nunca cria
--    admin — regra de 08/09 que não muda. Quem já existe não é tocado.
-- 2. precos_acesso: percentual de aumento por tipo de acesso (geral e por linha
--    comercial) sobre a base do ERP (atacado, ou varejo se o tipo escolher).
--    precos_acesso_log guarda quem mudou o quê.
-- 3. linhas_da_loja(): as linhas comerciais que existem em `produtos`, com rótulo,
--    para a tela de preços. Só admin.

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
begin
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
    case when (m->>'indicado_por') ~ '^[0-9a-fA-F-]{36}$' then (m->>'indicado_por')::uuid else null end,
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

-- ======================================================= precos_acesso
create table if not exists public.precos_acesso (
  id bigserial primary key,
  papel text not null check (papel in ('client', 'lojista', 'reseller')),
  -- null = regra geral do tipo; preenchido = só para produtos desta linha comercial
  linha_key text,
  base text not null default 'atacado' check (base in ('atacado', 'varejo')),
  percentual numeric(6,2) not null default 0 check (percentual >= 0),
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid
);
create unique index if not exists precos_acesso_unico on public.precos_acesso (papel, coalesce(linha_key, '*'));
comment on table public.precos_acesso is 'Percentual de aumento por tipo de acesso sobre a base do ERP. linha_key nulo = geral. Lido por api/_lib/precos/regraAcesso.ts.';

create table if not exists public.precos_acesso_log (
  id bigserial primary key,
  quando timestamptz not null default now(),
  quem uuid,
  papel text not null,
  linha_key text,
  de jsonb,
  para jsonb
);

alter table public.precos_acesso enable row level security;
alter table public.precos_acesso_log enable row level security;

drop policy if exists precos_acesso_admin_all on public.precos_acesso;
create policy precos_acesso_admin_all on public.precos_acesso
  for all to authenticated using (public.nz_is_admin()) with check (public.nz_is_admin());

drop policy if exists precos_acesso_log_admin on public.precos_acesso_log;
create policy precos_acesso_log_admin on public.precos_acesso_log
  for all to authenticated using (public.nz_is_admin()) with check (public.nz_is_admin());

grant select, insert, update, delete on public.precos_acesso, public.precos_acesso_log to authenticated;
grant usage, select on sequence public.precos_acesso_id_seq, public.precos_acesso_log_id_seq to authenticated;

-- Valores de partida: revendedor e lojista no atacado (o que todo aprovado via
-- até hoje); cliente final na tabela de VAREJO que o ERP já publica.
insert into public.precos_acesso (papel, linha_key, base, percentual) values
  ('reseller', null, 'atacado', 0),
  ('lojista',  null, 'atacado', 0),
  ('client',   null, 'varejo',  0)
on conflict do nothing;

-- ====================================================== linhas_da_loja
create or replace function public.linhas_da_loja()
returns table (linha_key text, label text, produtos bigint)
language sql
security definer
set search_path = public
as $$
  select p.linha_key,
         coalesce(l.label, initcap(replace(p.linha_key, '-', ' '))) as label,
         count(*)::bigint as produtos
    from public.produtos p
    left join public.linhas l on l.linha_key = p.linha_key
   where p.linha_key is not null
     and public.nz_is_admin()
   group by p.linha_key, l.label
   order by count(*) desc, p.linha_key;
$$;
revoke all on function public.linhas_da_loja() from public, anon;
grant execute on function public.linhas_da_loja() to authenticated, service_role;

notify pgrst, 'reload schema';
