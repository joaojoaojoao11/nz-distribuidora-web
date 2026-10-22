-- Contador de escaneios do QR do selo de garantia NZPPF (22/10/2026).
--
-- Desde 22/10 o QR é o MESMO em todos os selos (HTTPS://NZGROUP.COM.BR/S) e abre
-- a página /s ("veículo protegido"). Aqui só se conta quantas vezes ela abriu
-- por dia, sem nenhum dado de quem escaneou. A tela chama a função uma vez por
-- sessão do navegador; o admin lê a tabela em /admin/garantias.
--
-- O vínculo antigo selo ↔ garantia (2026-10-19_selos_garantia.sql) fica parado
-- no banco, sem uso pelo site.
--
-- Aplicada em produção em: 22/10/2026

create table if not exists public.selo_escaneios (
  dia date primary key,
  total integer not null default 0
);

alter table public.selo_escaneios enable row level security;

drop policy if exists selo_escaneios_admin on public.selo_escaneios;
create policy selo_escaneios_admin on public.selo_escaneios
  for select to authenticated using (public.nz_is_admin());

create or replace function public.registrar_escaneio_selo()
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.selo_escaneios (dia, total)
  values ((now() at time zone 'America/Sao_Paulo')::date, 1)
  on conflict (dia) do update set total = public.selo_escaneios.total + 1;
$$;

revoke all on function public.registrar_escaneio_selo() from public;
grant execute on function public.registrar_escaneio_selo() to anon, authenticated;

notify pgrst, 'reload schema';
