-- 2026-10-21e — Fase 3 do plano de indicação: usar o saldo da carteira no checkout.
--
-- O cliente marca "Usar meu saldo" no checkout. O site reserva o valor na
-- carteira (débito `uso_compra`, atômico por pessoa), cobra só o restante no
-- Asaas e, se o saldo cobre tudo, o pedido nasce pago (forma SALDO) sem
-- cobrança. Pagamento expirado/recusado/cancelado ou pedido cancelado no ERP
-- devolve a reserva (movimento `estorno` positivo apontando o débito).
--
-- Idempotente. Sem dado de cliente, sem percentual real.

-- Configuração (Admin → Afiliados → Regras gerais → Carteira).
alter table public.loja_config
  add column if not exists saldo_no_checkout boolean not null default true,
  add column if not exists cobranca_minima numeric(12,2) not null default 5;
comment on column public.loja_config.saldo_no_checkout is 'Fase 3: o checkout oferece "Usar meu saldo" (carteira em R$).';
comment on column public.loja_config.cobranca_minima is 'Menor cobrança que o Asaas aceita (R$). Se o restante após o saldo ficar abaixo disso, usa-se menos saldo.';

-- Pedido: quanto de saldo foi usado, o débito da reserva e se foi devolvido.
alter table public.pedidos
  add column if not exists saldo_usado numeric(12,2) not null default 0,
  add column if not exists saldo_movimento_id bigint references public.carteira_movimentos (id) on delete set null,
  add column if not exists saldo_devolvido_em timestamptz;
comment on column public.pedidos.saldo_usado is 'Saldo da carteira usado neste pedido (R$). total_final continua sendo o valor do pedido; o Asaas cobra total_final − saldo_usado.';
comment on column public.pedidos.saldo_movimento_id is 'Movimento uso_compra que reservou o saldo (o mais recente, se houve nova reserva).';
comment on column public.pedidos.saldo_devolvido_em is 'Quando a reserva voltou para a carteira (pagamento expirado/recusado/cancelado ou pedido cancelado).';

-- Pedido pago só com saldo: forma SALDO (não existe cobrança no Asaas).
alter table public.pedidos drop constraint if exists pedidos_forma_pagamento_check;
alter table public.pedidos
  add constraint pedidos_forma_pagamento_check
  check (forma_pagamento is null or forma_pagamento in ('PIX', 'BOLETO', 'CREDIT_CARD', 'SALDO'));

-- Reserva atômica: lock por pessoa, confere o disponível e debita na mesma
-- transação. Dois checkouts ao mesmo tempo não gastam o mesmo real.
create or replace function public.carteira_reservar_uso(p_user_id uuid, p_valor numeric, p_pedido_id uuid, p_obs text default null)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_valor numeric := round(coalesce(p_valor, 0), 2);
  v_disp  numeric;
  v_id    bigint;
begin
  if p_user_id is null or p_pedido_id is null then
    raise exception 'parametros-invalidos';
  end if;
  if v_valor <= 0 then
    raise exception 'valor-invalido';
  end if;
  perform pg_advisory_xact_lock(hashtext('carteira:' || p_user_id::text));
  select round(coalesce(sum(valor) filter (where status = 'disponivel'), 0), 2)
    into v_disp
    from public.carteira_movimentos
   where user_id = p_user_id;
  if v_disp < v_valor then
    raise exception 'saldo-insuficiente' using detail = format('disponivel %s, pedido %s', v_disp, v_valor);
  end if;
  insert into public.carteira_movimentos (user_id, tipo, valor, status, liberado_em, pedido_id, obs, criado_por)
  values (p_user_id, 'uso_compra', -v_valor, 'disponivel', now(), p_pedido_id, p_obs, 'checkout')
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.carteira_reservar_uso(uuid, numeric, uuid, text) from public;
revoke all on function public.carteira_reservar_uso(uuid, numeric, uuid, text) from anon;
revoke all on function public.carteira_reservar_uso(uuid, numeric, uuid, text) from authenticated;
grant execute on function public.carteira_reservar_uso(uuid, numeric, uuid, text) to service_role;

notify pgrst, 'reload schema';
