-- 2026-10-21d — Conquista ligada ao pedido que a gerou + regra do cancelamento (D29).
--
-- Achado no teste ponta a ponta de 21/10/2026: o pedido cancelado estornava a
-- comissão, mas o bônus em dinheiro da conquista ("primeira venda") ficava na
-- carteira. Agora a conquista guarda o pedido que a gerou; quando esse pedido
-- é cancelado, a conquista cujo fato deixou de valer volta (pode ser ganha de
-- novo) e o bônus dela é estornado. Ligado por padrão; a NZ desliga em
-- Admin → Afiliados → Regras gerais → Carteira.
--
-- Idempotente. Sem dado de cliente, sem percentual real.

alter table public.loja_config
  add column if not exists estornar_conquista_cancelamento boolean not null default true;
comment on column public.loja_config.estornar_conquista_cancelamento is
  'Pedido cancelado devolve a conquista que ele gerou (se o fato deixou de valer) e estorna o bônus dela (D29).';

alter table public.conquistas_usuario
  add column if not exists pedido_id uuid references public.pedidos (id) on delete set null;
comment on column public.conquistas_usuario.pedido_id is
  'Pedido faturado que fez a conquista nascer (nulo = conquista avaliada fora de um pedido).';

create index if not exists conquistas_usuario_pedido_idx
  on public.conquistas_usuario (pedido_id)
  where pedido_id is not null;
