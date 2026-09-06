-- "Comprar de novo": repor o carrinho com os itens de um pedido antigo.
--
-- O carrinho guarda slug, nome, código, imagem e cor — dados que vivem em
-- `produtos`, cuja RLS é só de admin (o cliente enxerga o catálogo pela view
-- pública `loja_catalogo`, sem preço). `pedido_itens` guarda `produto_id`, não
-- o slug. Juntar as duas coisas no cliente exigiria abrir `produtos`.
--
-- Em vez disso, uma função que devolve os itens de UM pedido do próprio
-- chamador, já no formato que o carrinho usa. Sem preço: quem precifica é
-- /api/nz/precos, que lê o papel no servidor.
create or replace function public.itens_do_meu_pedido(p_numero int)
returns table (
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
  where p.numero = p_numero
    and p.user_id = auth.uid()
  order by pr.nome;
$$;

revoke all on function public.itens_do_meu_pedido(int) from public;
grant execute on function public.itens_do_meu_pedido(int) to authenticated;
