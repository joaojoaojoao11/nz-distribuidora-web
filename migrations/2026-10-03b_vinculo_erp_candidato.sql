-- Vínculo com o NZERP vira "candidato" até o e-mail ser verificado ou um admin
-- confirmar. Hoje o site liga a conta ao cliente do ERP (histórico, endereço,
-- aprovação de lojista) confiando num e-mail que nunca foi provado, porque
-- mailer_autoconfirm = true. Aditiva: não muda nenhum dado existente.

alter table public.user_profiles
  add column if not exists erp_candidato_id uuid,
  add column if not exists erp_candidato_em timestamptz,
  add column if not exists erp_candidato_motivo text;

comment on column public.user_profiles.erp_candidato_id is
  'clients.id no NZERP que o cadastro PARECE ser. Vira erp_client_id só com e-mail verificado ou confirmação de admin.';
comment on column public.user_profiles.erp_candidato_motivo is 'documento | email';

create index if not exists user_profiles_erp_candidato_idx on public.user_profiles (erp_candidato_id);

-- Usuário comum não escreve as colunas novas (mesma lista de "integração").
create or replace function public.nz_user_profiles_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
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
     or new.aprovado_motivo is distinct from old.aprovado_motivo
     or new.erp_candidato_id is distinct from old.erp_candidato_id
     or new.erp_candidato_em is distinct from old.erp_candidato_em
     or new.erp_candidato_motivo is distinct from old.erp_candidato_motivo then
    raise exception 'campos de integração só podem ser alterados pelo sistema';
  end if;
  return new;
end;
$$;
