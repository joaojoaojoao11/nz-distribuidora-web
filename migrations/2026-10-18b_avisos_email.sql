-- Avisos por e-mail para a NZ (api/_lib/avisos.ts), 18/10/2026.

-- Um aviso com chave sai UMA vez: o servidor reserva a chave aqui antes de
-- mandar o e-mail (pagamento confirmado chega por webhook e por cron; o
-- pós-cadastro roda em todo login novo). Só o service role escreve.
create table if not exists public.avisos_enviados (
  chave text primary key,
  tipo text not null,
  criado_em timestamptz not null default now(),
  ok boolean,
  erro text
);
alter table public.avisos_enviados enable row level security;
revoke all on public.avisos_enviados from anon, authenticated;

-- Limite por IP dos formulários abertos, agora gravados pelo servidor
-- (/api/nz/lead). sha256(ip + salt) — nunca o IP.
alter table public.installer_leads add column if not exists ip_hash text;
alter table public.leads add column if not exists ip_hash text;
create index if not exists installer_leads_ip_hash_idx on public.installer_leads (ip_hash, created_at desc) where ip_hash is not null;
create index if not exists leads_ip_hash_idx on public.leads (ip_hash, created_at desc) where ip_hash is not null;

-- Admin → Leads marca o pedido de aplicador como atendido (antes só lia).
drop policy if exists installer_leads_admin_update on public.installer_leads;
create policy installer_leads_admin_update on public.installer_leads
  for update to authenticated
  using (public.nz_is_admin())
  with check (public.nz_is_admin());
