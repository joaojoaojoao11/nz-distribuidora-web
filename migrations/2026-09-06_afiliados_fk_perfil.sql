-- afiliados → user_profiles: FK extra só para o PostgREST conseguir embutir
-- o nome/e-mail do afiliado no painel admin (select '*, user_profiles(...)').
-- user_profiles.id é a mesma chave de auth.users. RODAR NO PROJETO DO SITE.
-- Aplicada em produção em: 2026-09-05
alter table public.afiliados drop constraint if exists afiliados_perfil_fkey;
alter table public.afiliados
  add constraint afiliados_perfil_fkey
  foreign key (user_id) references public.user_profiles(id) on delete cascade;
notify pgrst, 'reload schema';
