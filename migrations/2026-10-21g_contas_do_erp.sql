-- 2026-10-21g — Central do cliente, Fase A: contas criadas a partir da base do NZERP.
--
-- O job do sync lê `clientes_site` no ERP e cria aqui uma conta BLOQUEADA
-- (lojista, sem senha, origem `erp`) para cada cliente qualificado ou com
-- pedido entregue, já vinculada (`erp_client_id` ↔ `clients.site_user_id`).
-- Quem não pôde ser criado (sem e-mail, e-mail de outra conta, documento
-- inválido) fica em `erp_clientes_pendentes`, a fila do admin.
--
-- Idempotente. Sem dado de cliente.

alter table public.user_profiles drop constraint if exists user_profiles_origem_check;
alter table public.user_profiles
  add constraint user_profiles_origem_check check (origem = any (array['site', 'convite', 'google', 'erp']));

alter table public.user_profiles
  add column if not exists convite_enviado_em timestamptz,
  add column if not exists convite_enviado_por uuid;
comment on column public.user_profiles.convite_enviado_em is 'Último convite (link ou e-mail) para a pessoa definir a senha — contas criadas pelo ERP.';

create table if not exists public.erp_clientes_pendentes (
  erp_client_id uuid primary key,
  nome text,
  email text,
  cpf_cnpj text,
  motivo text not null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
comment on table public.erp_clientes_pendentes is 'Clientes do NZERP que o job não conseguiu transformar em conta do site, com o motivo (fila do admin).';

alter table public.erp_clientes_pendentes enable row level security;
drop policy if exists erp_pendentes_admin_le on public.erp_clientes_pendentes;
create policy erp_pendentes_admin_le on public.erp_clientes_pendentes for select to authenticated using (public.nz_is_admin());
-- Escrita: só o servidor (service role).

create index if not exists user_profiles_erp_client_idx on public.user_profiles (erp_client_id) where erp_client_id is not null;
