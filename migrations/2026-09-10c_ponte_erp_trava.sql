-- Ponte site → NZERP, fase 1: a trava contra pedido duplicado mora AQUI.
--
-- Regra do projeto (docs/PLANO_CONEXAO_NZERP.md §0): o NZERP é somente leitura.
-- Nada de índice único em `quotes.site_pedido_id` nem de lock lá dentro. O que
-- impede dois orçamentos para o mesmo pedido é um compare-and-swap nesta
-- tabela, feito ANTES de qualquer chamada ao ERP.
--
-- `site_criar_pedido` continua idempotente por `site_pedido_id` do lado de lá;
-- ela é a segunda rede, não a primeira.

-- ------------------------------------------------------------- 1. a trava
alter table public.pedidos add column if not exists erp_envio text not null default 'pendente';
alter table public.pedidos add column if not exists erp_envio_em timestamptz;
alter table public.pedidos add column if not exists erp_envio_erro text;

alter table public.pedidos drop constraint if exists pedidos_erp_envio_check;
alter table public.pedidos add constraint pedidos_erp_envio_check
  check (erp_envio in ('pendente', 'enviando', 'enviado', 'dispensado'));

comment on column public.pedidos.erp_envio is
  'pendente = ainda não foi ao ERP; enviando = um processo está enviando agora (compare-and-swap); enviado = tem orçamento no ERP; dispensado = não vai (cancelado antes de pagar).';

-- Quem já tem orçamento lá já foi.
update public.pedidos
   set erp_envio = 'enviado', erp_envio_em = coalesce(enviado_em, criado_em)
 where erp_quote_id is not null and erp_envio = 'pendente';

-- ------------------------------------------------ 2. um cliente, um login
-- `clients.site_user_id` no ERP não é único e não vamos mexer nele. A garantia
-- passa a ser desta ponta: cada cliente do ERP responde por no máximo uma conta.
create unique index if not exists user_profiles_erp_client_id_uk
  on public.user_profiles (erp_client_id)
  where erp_client_id is not null;

-- --------------------------------------------- 3. a fila do que falta ir
-- Usada pelo cron e pelo painel: pago, com payload, e ainda não enviado.
create index if not exists pedidos_erp_fila_idx
  on public.pedidos (erp_envio, pagamento_status)
  where erp_envio in ('pendente', 'enviando');
