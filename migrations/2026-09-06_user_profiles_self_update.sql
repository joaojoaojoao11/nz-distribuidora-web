-- user_profiles: o próprio usuário pode editar os dados cadastrais — mas
-- nunca o papel nem a aprovação. RODAR NO PROJETO DO SITE (uibjmvkvbthzypgozpcs).
--
-- Achado em 2026-09-05: não existia policy de UPDATE para o dono da linha.
-- O `update({ phone, company_name })` feito logo após o signUp (AuthContext)
-- era recusado em silêncio pela RLS, e o /painel não conseguiria salvar.
--
-- Policy de linha libera o UPDATE; o trigger é o que impede a escalação:
-- RLS não filtra por coluna, e um cliente com a chave anon poderia mandar
-- `{ role: 'admin', is_approved: true }` no mesmo PATCH.
-- Aplicada em produção em: 2026-09-05

drop policy if exists "Users can update own profile" on public.user_profiles;
create policy "Users can update own profile"
  on public.user_profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.nz_user_profiles_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Admin (pela função já existente do projeto) pode tudo. Service role não
  -- passa por RLS mas passa por trigger: auth.uid() é null → também liberado.
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
  return new;
end;
$$;

drop trigger if exists user_profiles_guard on public.user_profiles;
create trigger user_profiles_guard
  before update on public.user_profiles
  for each row execute function public.nz_user_profiles_guard();
