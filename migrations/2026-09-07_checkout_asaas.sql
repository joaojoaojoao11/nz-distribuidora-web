-- Checkout da loja com Asaas (Pix, boleto, cartão) — docs/PLANO_CHECKOUT_ASAAS.md
-- Projeto: uibjmvkvbthzypgozpcs (site). Aplicada via Management API em 2026-09-07.
--
-- O que muda:
--   · pedidos ganha o estado do PAGAMENTO em coluna própria (pagamento_status):
--     `status` continua sendo o espelho do ERP e é sobrescrito pelo sync — se o
--     "pago" morasse lá, o próximo sync apagava;
--   · pagamentos: uma linha por cobrança no Asaas (um pedido pode ter mais de
--     uma: Pix expirou → cliente pagou no cartão);
--   · asaas_eventos: idempotência do webhook (entrega "pelo menos uma vez")
--     e auditoria do que chegou;
--   · checkout_tentativas: limite de tentativas de cartão por usuário/IP —
--     em memória não serve, cada invocação serverless nasce zerada;
--   · loja_config: parâmetros do checkout (Pix, boleto, parcelas, retirada);
--   · cliente final nasce aprovado (decisão de 2026-09-06): quem se cadastra
--     como `client` já vê preço e compra; lojista continua com aprovação manual.
--
-- NUNCA há dado de cartão aqui: só bandeira e 4 últimos dígitos.

-- ============================================================= pedidos
alter table public.pedidos
  add column if not exists pagamento_status text not null default 'nenhum',
  add column if not exists forma_pagamento text,
  add column if not exists valor_frete numeric(12,2) not null default 0,
  add column if not exists desconto numeric(12,2) not null default 0,
  add column if not exists total_final numeric(12,2),
  add column if not exists pago_em timestamptz,
  add column if not exists erp_pago_em timestamptz;

alter table public.pedidos drop constraint if exists pedidos_pagamento_status_check;
alter table public.pedidos add constraint pedidos_pagamento_status_check
  check (pagamento_status in ('nenhum','aguardando','em_analise','pago','recusado','expirado','vencido','estornado','cancelado'));

alter table public.pedidos drop constraint if exists pedidos_forma_pagamento_check;
alter table public.pedidos add constraint pedidos_forma_pagamento_check
  check (forma_pagamento is null or forma_pagamento in ('PIX','BOLETO','CREDIT_CARD'));

comment on column public.pedidos.pagamento_status is 'Estado do pagamento online. Separado de status (espelho do ERP) de propósito.';
comment on column public.pedidos.erp_pago_em is 'Quando o ERP foi avisado do pagamento (site_confirmar_pagamento). Null = pendente de aviso.';

create index if not exists pedidos_pagamento_idx on public.pedidos (pagamento_status) where pagamento_status in ('aguardando','em_analise');

-- ========================================================== pagamentos
create table if not exists public.pagamentos (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  provedor text not null default 'asaas',
  ambiente text not null default 'production',
  asaas_payment_id text unique,
  asaas_customer_id text,
  forma text not null check (forma in ('PIX','BOLETO','CREDIT_CARD')),
  status text not null check (status in ('aguardando','em_analise','pago','recusado','expirado','vencido','estornado','cancelado')),
  status_asaas text,
  valor numeric(12,2) not null,
  valor_liquido numeric(12,2),
  parcelas int not null default 1,
  vencimento date,
  expira_em timestamptz,
  pix_payload text,
  pix_qr_base64 text,
  boleto_url text,
  linha_digitavel text,
  nosso_numero text,
  cartao_bandeira text,
  cartao_final text,
  invoice_url text,
  recibo_url text,
  pago_em timestamptz,
  estornado_valor numeric(12,2) not null default 0,
  ultimo_evento text,
  ultima_consulta_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists pagamentos_pedido_idx on public.pagamentos (pedido_id);

-- ======================================================= asaas_eventos
create table if not exists public.asaas_eventos (
  id text primary key,
  evento text not null,
  asaas_payment_id text,
  pedido_id uuid,
  recebido_em timestamptz not null default now(),
  processado_em timestamptz,
  erro text,
  payload jsonb not null
);
create index if not exists asaas_eventos_pendentes_idx on public.asaas_eventos (recebido_em) where processado_em is null;

-- ================================================= checkout_tentativas
create table if not exists public.checkout_tentativas (
  id bigserial primary key,
  user_id uuid,
  ip text,
  forma text,
  resultado text,
  criado_em timestamptz not null default now()
);
create index if not exists checkout_tentativas_user_idx on public.checkout_tentativas (user_id, criado_em desc);
create index if not exists checkout_tentativas_ip_idx on public.checkout_tentativas (ip, criado_em desc);

-- ======================================================== loja_config
alter table public.loja_config
  add column if not exists checkout_ativo boolean not null default false,
  add column if not exists pix_expira_min int not null default 30,
  add column if not exists boleto_vencimento_dias int not null default 3,
  add column if not exists boleto_multa_pct numeric(5,2) not null default 2,
  add column if not exists boleto_juros_mes_pct numeric(5,2) not null default 1,
  add column if not exists boleto_minimo numeric(12,2) not null default 0,
  add column if not exists cartao_max_parcelas int not null default 6,
  add column if not exists cartao_parcela_minima numeric(12,2) not null default 100,
  add column if not exists retirada_ativa boolean not null default true,
  add column if not exists retirada_endereco text not null default 'Av. Interlagos — São Paulo/SP (combinar horário pelo WhatsApp)',
  add column if not exists pedido_minimo numeric(12,2) not null default 0,
  add column if not exists frete_gratis_acima numeric(12,2);

-- ======================================================= user_profiles
alter table public.user_profiles
  add column if not exists asaas_customer_id text,
  add column if not exists asaas_customer_env text;

-- Cliente final nasce aprovado; lojista continua manual.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := coalesce(new.raw_user_meta_data->>'role', 'client');
begin
  insert into public.user_profiles (id, email, full_name, role, is_approved)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    case when v_role in ('client', 'reseller') then v_role else 'client' end,
    v_role = 'client'
  );
  return new;
end;
$$;

update public.user_profiles set is_approved = true where role = 'client' and not is_approved;

-- ============================================ cupom: incremento atômico
create or replace function public.cupom_consumir(p_codigo text)
returns boolean
language sql
security definer
set search_path = public
as $$
  update public.cupons
     set usos = usos + 1
   where codigo = p_codigo
     and ativo
     and (limite_usos is null or usos < limite_usos)
  returning true;
$$;
revoke all on function public.cupom_consumir(text) from public, anon, authenticated;
grant execute on function public.cupom_consumir(text) to service_role;

-- ================================================================ RLS
alter table public.pagamentos enable row level security;
alter table public.asaas_eventos enable row level security;
alter table public.checkout_tentativas enable row level security;

drop policy if exists pagamentos_admin_all on public.pagamentos;
create policy pagamentos_admin_all on public.pagamentos
  for all to authenticated using (public.nz_is_admin()) with check (public.nz_is_admin());

drop policy if exists pagamentos_proprio on public.pagamentos;
create policy pagamentos_proprio on public.pagamentos
  for select to authenticated
  using (exists (select 1 from public.pedidos p where p.id = pedido_id and p.user_id = auth.uid()));

drop policy if exists asaas_eventos_admin on public.asaas_eventos;
create policy asaas_eventos_admin on public.asaas_eventos
  for select to authenticated using (public.nz_is_admin());

drop policy if exists checkout_tentativas_admin on public.checkout_tentativas;
create policy checkout_tentativas_admin on public.checkout_tentativas
  for select to authenticated using (public.nz_is_admin());

-- Escrita nas três tabelas só pela API (service role).
grant select on public.pagamentos, public.asaas_eventos, public.checkout_tentativas to authenticated;

notify pgrst, 'reload schema';

-- Reenvio ao ERP: o corpo da RPC fica guardado para o caso de o ERP estar fora
-- na hora do checkout (o pagamento já existe; o pedido não pode se perder).
alter table public.pedidos add column if not exists erp_payload jsonb;
