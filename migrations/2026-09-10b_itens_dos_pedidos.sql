-- Miniaturas na lista de pedidos.
--
-- `itens_do_meu_pedido(numero)` resolvia o "comprar de novo", mas para desenhar
-- a lista seria uma chamada por pedido — 20 pedidos, 20 idas ao banco. Esta
-- versão recebe os números de uma vez e devolve tudo agrupado pelo pedido.
--
-- Substitui a anterior: duas funções fazendo a mesma coisa divergem na primeira
-- mudança de regra (o `disponivel`, por exemplo).
drop function if exists public.itens_do_meu_pedido(int);

create or replace function public.itens_dos_meus_pedidos(p_numeros int[])
returns table (
  pedido_numero int,
  slug text,
  nome text,
  codigo text,
  imagem text,
  hex text,
  qtd numeric,
  unidade text,
  disponivel boolean
)
language sql
stable
security definer
set search_path to 'public'
as $$
  select
    p.numero,
    pr.slug,
    pr.nome,
    pr.codigo,
    pr.imagem,
    pr.hex,
    i.qtd,
    i.unidade,
    -- Produto despublicado ou sem SKU não volta para o carrinho: a tela avisa
    -- em vez de deixar o cliente descobrir no checkout.
    (pr.publicado and coalesce(pr.oculto_manual, false) = false and nullif(pr.erp_sku, '') is not null) as disponivel
  from public.pedidos p
  join public.pedido_itens i on i.pedido_id = p.id
  join public.produtos pr on pr.id = i.produto_id
  where p.user_id = auth.uid()
    and p.numero = any(coalesce(p_numeros, '{}'::int[]))
  order by p.numero desc, pr.nome;
$$;

revoke all on function public.itens_dos_meus_pedidos(int[]) from public;
grant execute on function public.itens_dos_meus_pedidos(int[]) to authenticated;
