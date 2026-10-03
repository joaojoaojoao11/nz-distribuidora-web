-- Estoque do PARCEIRO (Inova, do Jardel): rolo aberto ou fechado que é DELE, não nosso
-- (não é consignado). Vira a terceira bolinha do admin, a vermelha, ao lado da verde
-- (rolo fechado no pátio SP) e da laranja (ponta no pátio SP). Pedido do João, 03/10/2026.
--
-- Uma linha por PEDAÇO: "EDG 010 - 7 + 2 metros" são dois pedaços (7 m e 2 m), porque
-- não dá para vender 9 m contínuos. Quem atualiza é a Cledna (Claude), a partir da lista
-- que o João manda de vez em quando: a lista inteira do parceiro substitui a anterior.
-- `lista_de` é a data da lista — a bolinha apaga quando ela fica velha.
--
-- SÓ INTERNO: RLS ligado e nenhuma policy. Só a service role (api/) lê e escreve; o
-- navegador nunca toca nesta tabela.

create table if not exists public.estoque_parceiro (
  id uuid primary key default gen_random_uuid(),
  parceiro text not null default 'Inova (Jardel)',
  erp_sku text not null,
  metros numeric(8,2) not null check (metros > 0),
  status_rolo text not null default 'aberto' check (status_rolo in ('aberto', 'fechado')),
  nota text,
  lista_de date not null,
  atualizado_em timestamptz not null default now()
);

create index if not exists estoque_parceiro_sku_idx on public.estoque_parceiro (erp_sku);

alter table public.estoque_parceiro enable row level security;

comment on table public.estoque_parceiro is
  'Pedaços de rolo no estoque do parceiro Inova (Jardel). Só admin, via service role. Ver migrations/2026-10-03_estoque_parceiro.sql.';
