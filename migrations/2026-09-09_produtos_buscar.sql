-- Busca da lista de produtos do painel, feita no banco.
--
-- A tela antiga baixava os 1.292 produtos E o espelho inteiro do ERP para o
-- navegador, filtrava em memória e mostrava no máximo 400 linhas. Funcionava
-- com 1.292; não funciona com 5.000, e recarregava tudo a cada "Salvar".
--
-- As filas que interessam dependem do ERP (sem estoque, inativo lá) e da mídia
-- (sem foto, incompleto) — então a consulta tem de ser aqui, onde as três
-- tabelas se encontram.
--
-- `completude` é a régua de 0 a 5 que a lista mostra como barra: foto, galeria
-- com 2+, descrição, ficha com 3+ linhas, SEO.

create or replace function public.produtos_buscar(
  p_q       text default null,
  p_fila    text default 'todos',
  p_linha   text default null,
  p_ordem   text default 'nome',
  p_offset  int  default 0,
  p_limite  int  default 50
)
returns table (
  id uuid, slug text, nome text, codigo text, erp_sku text,
  linha_key text, linha_label text, vertical text, kind text,
  tipo_vinculo text, origem text, imagem text, hex text,
  publicado boolean, oculto_manual boolean, atualizado_em timestamptz,
  erp_nome text, erp_ativo boolean, saldo_ml numeric,
  preco_rolo numeric, preco_metro numeric,
  midias int, videos int, completude int, visivel boolean,
  total_geral bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with base as (
    select p.*,
           e.nome as e_nome, e.ativo as e_ativo, e.saldo_ml as e_saldo,
           e.preco_rolo as e_rolo, e.preco_metro as e_metro,
           (select count(*) from produto_midia m where m.produto_id = p.id and m.tipo = 'imagem') as n_img,
           (select count(*) from produto_midia m where m.produto_id = p.id and m.tipo <> 'imagem') as n_vid
      from produtos p
      left join erp_produtos e on e.sku = p.erp_sku
  ), calculado as (
    select b.*,
           (case when coalesce(b.imagem, '') <> '' then 1 else 0 end
          + case when b.n_img >= 2 then 1 else 0 end
          + case when coalesce(b.descricao, '') <> '' then 1 else 0 end
          + case when jsonb_typeof(b.ficha) = 'array' and jsonb_array_length(b.ficha) >= 3 then 1 else 0 end
          + case when coalesce(b.seo_titulo, '') <> '' then 1 else 0 end) as pontos,
           (b.publicado and not b.oculto_manual
            and (b.tipo_vinculo = 'familia' or coalesce(b.e_ativo, false))) as e_visivel
      from base b
  ), filtrado as (
    select c.* from calculado c
     where (p_linha is null or p_linha = '' or c.linha_key = p_linha)
       and (
         p_fila is null or p_fila = 'todos'
         or (p_fila = 'sem-conexao'  and c.tipo_vinculo = 'pendente')
         or (p_fila = 'sem-foto'     and coalesce(c.imagem, '') = '' and c.kind <> 'linha')
         or (p_fila = 'alias'        and c.tipo_vinculo = 'alias')
         or (p_fila = 'inativo-erp'  and c.erp_sku is not null and coalesce(c.e_ativo, true) = false)
         or (p_fila = 'erp-auto'     and c.origem = 'erp-auto')
         or (p_fila = 'ocultos'      and c.oculto_manual)
         or (p_fila = 'com-estoque'  and coalesce(c.e_saldo, 0) > 0)
         or (p_fila = 'incompletos'  and c.pontos < 3)
         or (p_fila = 'com-video'    and c.n_vid > 0)
         or (p_fila = 'visiveis'     and c.e_visivel)
       )
       and (
         p_q is null or btrim(p_q) = ''
         or c.nome    ilike '%' || p_q || '%'
         or c.slug    ilike '%' || p_q || '%'
         or coalesce(c.codigo, '')  ilike '%' || p_q || '%'
         or coalesce(c.erp_sku, '') ilike '%' || p_q || '%'
         or coalesce(c.e_nome, '')  ilike '%' || p_q || '%'
       )
  )
  select f.id, f.slug, f.nome, f.codigo, f.erp_sku,
         f.linha_key, f.linha_label, f.vertical, f.kind,
         f.tipo_vinculo, f.origem, f.imagem, f.hex,
         f.publicado, f.oculto_manual, f.atualizado_em,
         f.e_nome, f.e_ativo, f.e_saldo, f.e_rolo, f.e_metro,
         f.n_img::int, f.n_vid::int, f.pontos::int, f.e_visivel,
         count(*) over () as total_geral
    from filtrado f
   order by
     case when p_ordem = 'nome'       then f.nome end asc,
     case when p_ordem = 'atualizado' then f.atualizado_em end desc,
     case when p_ordem = 'estoque'    then coalesce(f.e_saldo, -1) end desc,
     case when p_ordem = 'completude' then f.pontos end asc,
     case when p_ordem = 'linha'      then f.linha_label end asc,
     f.nome asc
   offset greatest(p_offset, 0)
   limit least(greatest(p_limite, 1), 200);
$$;

revoke all on function public.produtos_buscar(text, text, text, text, int, int) from public, anon;
grant execute on function public.produtos_buscar(text, text, text, text, int, int) to authenticated;

-- Contadores do topo da tela (uma consulta em vez de sete).
create or replace function public.produtos_resumo()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with b as (
    select p.id, p.imagem, p.kind, p.tipo_vinculo, p.origem, p.oculto_manual, p.publicado,
           p.descricao, p.ficha, p.seo_titulo, e.ativo as e_ativo,
           (select count(*) from produto_midia m where m.produto_id = p.id and m.tipo = 'imagem') as n_img
      from produtos p left join erp_produtos e on e.sku = p.erp_sku
  )
  select jsonb_build_object(
    'total',       count(*),
    'visiveis',    count(*) filter (where publicado and not oculto_manual and (tipo_vinculo = 'familia' or coalesce(e_ativo, false))),
    'semConexao',  count(*) filter (where tipo_vinculo = 'pendente'),
    'semFoto',     count(*) filter (where coalesce(imagem, '') = '' and kind <> 'linha'),
    'alias',       count(*) filter (where tipo_vinculo = 'alias'),
    'inativos',    count(*) filter (where e_ativo = false),
    'incompletos', count(*) filter (where
        (case when coalesce(imagem, '') <> '' then 1 else 0 end
       + case when n_img >= 2 then 1 else 0 end
       + case when coalesce(descricao, '') <> '' then 1 else 0 end
       + case when jsonb_typeof(ficha) = 'array' and jsonb_array_length(ficha) >= 3 then 1 else 0 end
       + case when coalesce(seo_titulo, '') <> '' then 1 else 0 end) < 3)
  ) from b;
$$;

revoke all on function public.produtos_resumo() from public, anon;
grant execute on function public.produtos_resumo() to authenticated;
