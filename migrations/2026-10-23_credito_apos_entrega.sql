-- Crédito do programa de indicação libera DEPOIS DA ENTREGA, e devolução parcial
-- desconta (decisão do João, 23/10/2026 — item #10 da varredura de 22/10).
--
-- Antes: o cashback/comissão nascia no FATURAMENTO e ficava disponível 7 dias
-- depois — o indicado recebia no 8º dia, devolvia no 12º, e o indicador já
-- tinha sacado. E a devolução PARCIAL (o pedido continua ENTREGUE no NZERP)
-- não mexia em nada.
--
-- Agora:
--   · o crédito nasce "a liberar" esperando a entrega (`libera_apos_entrega`);
--     `libera_em` continua sendo o "não antes de" (faturamento + carência, ou o
--     fim do período na recorrência);
--   · o sync vê o pedido ENTREGUE no NZERP → grava `pedidos.entregue_em` e a
--     liberação vira entrega + carência (a carência é a de loja_config);
--   · pedido que o NZERP nunca marca entregue: o crédito deixa de esperar 60
--     dias depois de nascer (nada fica preso para sempre);
--   · devolução parcial concluída no NZERP (view devolucoes_site): o crédito
--     ainda a liberar perde a comissão sobre o valor devolvido; o já liberado
--     vira ocorrência para a equipe (não se tira dinheiro que pode ter sido
--     sacado). Cada devolução é aplicada uma vez (carteira_devolucoes).

alter table public.carteira_movimentos add column if not exists libera_apos_entrega boolean not null default false;
comment on column public.carteira_movimentos.libera_apos_entrega is
  'Crédito esperando a ENTREGA do pedido no NZERP (23/10/2026). Enquanto true, não libera mesmo com libera_em vencido; o sync põe false e libera_em = entrega + carência.';

alter table public.pedidos add column if not exists entregue_em timestamptz;
comment on column public.pedidos.entregue_em is 'Quando o NZERP marcou o pedido como ENTREGUE (visto pelo sync). Conta a carência do crédito de indicação.';

create index if not exists carteira_aguarda_entrega_idx on public.carteira_movimentos (pedido_id) where libera_apos_entrega;

create table if not exists public.carteira_devolucoes (
  cancelamento_id text primary key,
  pedido_id uuid not null,
  valor_material numeric not null,
  creditos jsonb not null default '[]'::jsonb,
  processado_em timestamptz not null default now()
);
alter table public.carteira_devolucoes enable row level security;
revoke all on public.carteira_devolucoes from anon, authenticated;
comment on table public.carteira_devolucoes is 'Devoluções parciais do NZERP já aplicadas aos créditos do programa (uma vez por devolução). Só o servidor lê e grava.';

-- Créditos de pedido que hoje esperam a carência: passam a esperar a entrega.
update public.carteira_movimentos m
   set libera_apos_entrega = true
  from public.pedidos p
 where m.pedido_id = p.id
   and m.status = 'a_liberar'
   and m.tipo in ('cashback_indicacao', 'comissao_ativacao', 'comissao_recorrencia')
   and coalesce(p.status, '') <> 'ENTREGUE';

notify pgrst, 'reload schema';
