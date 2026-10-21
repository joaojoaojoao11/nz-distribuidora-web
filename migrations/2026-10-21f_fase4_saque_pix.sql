-- 2026-10-21f — Fase 4 (mínima) do plano de indicação: saque por Pix como SOLICITAÇÃO.
--
-- Regra do João (21/10/2026): o cliente cadastra a chave Pix na conta dele e
-- pede o saque; a solicitação vai ao NZERP como um título em aberto no Contas
-- a Pagar, e o financeiro paga como paga qualquer título. Sem automação de Pix.
--
--   · user_profiles.pix_tipo / pix_chave — a chave de quem recebe;
--   · saques — a solicitação (status solicitado → enviado → pago | cancelado);
--   · carteira_solicitar_saque — RPC atômica: trava por pessoa, confere o
--     mínimo e o disponível, debita a carteira (`saque`) e cria a solicitação;
--   · loja_config.saque_dias_vencimento — dias úteis para o título vencer.
--
-- Idempotente. Sem dado de cliente, sem percentual real.

alter table public.user_profiles
  add column if not exists pix_tipo text,
  add column if not exists pix_chave text;
alter table public.user_profiles drop constraint if exists user_profiles_pix_tipo_check;
alter table public.user_profiles
  add constraint user_profiles_pix_tipo_check check (pix_tipo is null or pix_tipo in ('cpf_cnpj', 'email', 'telefone', 'aleatoria'));
comment on column public.user_profiles.pix_chave is 'Chave Pix para receber o saque da carteira (Fase 4). Só o dono e o admin veem.';

alter table public.loja_config
  add column if not exists saque_dias_vencimento integer not null default 2;
comment on column public.loja_config.saque_dias_vencimento is 'Dias úteis para o título do saque vencer no NZERP (pedido depois da hora de corte conta +1).';

create table if not exists public.saques (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  valor numeric(12,2) not null check (valor > 0),
  pix_tipo text not null,
  pix_chave text not null,
  status text not null default 'solicitado' check (status in ('solicitado', 'enviado', 'pago', 'cancelado')),
  -- O débito `saque` na carteira; a devolução (cancelado) aponta para ele.
  movimento_id bigint references public.carteira_movimentos (id) on delete set null,
  -- O título no NZERP (accounts_payable.id) e o último erro de envio.
  erp_ap_id text,
  erp_erro text,
  erp_enviado_em timestamptz,
  vencimento date,
  pago_em timestamptz,
  cancelado_em timestamptz,
  cancelado_motivo text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
comment on table public.saques is 'Solicitações de saque da carteira (Fase 4). O título no NZERP é a verdade do pagamento; o sync espelha pago/cancelado.';
create index if not exists saques_user_idx on public.saques (user_id, criado_em desc);
create index if not exists saques_status_idx on public.saques (status);

alter table public.saques enable row level security;
drop policy if exists saques_admin_le on public.saques;
create policy saques_admin_le on public.saques for select to authenticated using (public.nz_is_admin());
drop policy if exists saques_dono_le on public.saques;
create policy saques_dono_le on public.saques for select to authenticated using (user_id = auth.uid());
-- Escrita: só o servidor (service role), pela RPC abaixo e pelo sync.

create or replace function public.carteira_solicitar_saque(p_user_id uuid, p_valor numeric, p_minimo numeric, p_pix_tipo text, p_pix_chave text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_valor numeric := round(coalesce(p_valor, 0), 2);
  v_disp  numeric;
  v_mov   bigint;
  v_id    uuid;
begin
  if p_user_id is null or coalesce(p_pix_chave, '') = '' then
    raise exception 'parametros-invalidos';
  end if;
  if v_valor <= 0 then
    raise exception 'valor-invalido';
  end if;
  if v_valor < round(coalesce(p_minimo, 0), 2) then
    raise exception 'abaixo-do-minimo';
  end if;
  perform pg_advisory_xact_lock(hashtext('carteira:' || p_user_id::text));
  select round(coalesce(sum(valor) filter (where status = 'disponivel'), 0), 2)
    into v_disp
    from public.carteira_movimentos
   where user_id = p_user_id;
  if v_disp < v_valor then
    raise exception 'saldo-insuficiente' using detail = format('disponivel %s, saque %s', v_disp, v_valor);
  end if;
  insert into public.carteira_movimentos (user_id, tipo, valor, status, liberado_em, obs, criado_por)
  values (p_user_id, 'saque', -v_valor, 'disponivel', now(), 'Saque por Pix', 'saque')
  returning id into v_mov;
  insert into public.saques (user_id, valor, pix_tipo, pix_chave, movimento_id)
  values (p_user_id, v_valor, p_pix_tipo, p_pix_chave, v_mov)
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.carteira_solicitar_saque(uuid, numeric, numeric, text, text) from public;
revoke all on function public.carteira_solicitar_saque(uuid, numeric, numeric, text, text) from anon;
revoke all on function public.carteira_solicitar_saque(uuid, numeric, numeric, text, text) from authenticated;
grant execute on function public.carteira_solicitar_saque(uuid, numeric, numeric, text, text) to service_role;

notify pgrst, 'reload schema';
