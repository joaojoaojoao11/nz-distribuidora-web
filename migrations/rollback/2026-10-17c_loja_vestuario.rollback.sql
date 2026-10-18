-- ROLLBACK de migrations/2026-10-17c_loja_vestuario.sql
--
-- NÃO é migration: fica fora da pasta principal de propósito. Rodar só se a
-- fase A precisar ser desfeita. Definições originais copiadas do banco
-- (pg_get_viewdef / pg_get_functiondef) em 17/10/2026, antes de aplicar.
--
-- Ordem importa:
--   1. esconde de novo (oculto_manual) tudo que está AGENDADO — a view antiga
--      não conhece `publicar_em` e publicaria as camisetas na hora;
--   2. volta a view pública e apaga a base e a prévia;
--   3. volta as duas funções do admin;
--   4. volta os CHECKs só se nenhum dado usar os valores novos;
--   5. as colunas novas FICAM (são inofensivas); o DROP está comentado no fim.

begin;

-- 1) agendado volta a ficar oculto à mão
update public.produtos set oculto_manual = true
 where publicar_em is not null and publicar_em > now() and not oculto_manual;

-- 2) views
drop function if exists public.loja_catalogo_previa();
drop view if exists public.loja_catalogo;
create view public.loja_catalogo as
 SELECT p.id,
    p.slug,
    p.erp_sku,
    p.tipo_vinculo,
    p.pai_id,
    p.alias_de,
    p.nome,
    p.subtitulo,
    p.marca_exibicao,
    p.brand_key,
    p.linha_key,
    p.linha_label,
    p.vertical,
    p.kind,
    p.aplicacoes,
    p.codigo,
    p.imagem,
    p.galeria,
    p.hex,
    p.cor_declarada,
    p.transparente,
    p.hex_inferido,
    p.acabamentos,
    p.acabamento_label,
    p.familia_padrao,
    p.descricao,
    p.ficha,
    p.badges,
    p.garantia_anos,
    p.durabilidade_anos,
    p.legacy_path,
    p.shipping_profile_id,
    p.seo_titulo,
    p.seo_descricao,
    p.ordem,
    p.origem,
    e.largura_m,
    e.metragem_padrao,
    e.unidade,
        CASE
            WHEN e.sku IS NULL THEN NULL::text
            WHEN NOT e.ativo OR e.saldo_ml <= 0::numeric THEN 'sob-encomenda'::text
            WHEN e.saldo_ml <= COALESCE(NULLIF(e.estoque_minimo, 0::numeric), c.limite_ultimas_unidades_ml) THEN 'ultimas-unidades'::text
            ELSE 'pronta-entrega'::text
        END AS nivel_estoque,
    GREATEST(p.atualizado_em, COALESCE(e.sincronizado_em, p.atualizado_em)) AS atualizado_em,
    ( SELECT COALESCE(jsonb_agg(jsonb_build_object('tipo', m.tipo, 'url', m.url, 'poster', m.poster_url, 'alt', m.alt, 'largura', m.largura, 'altura', m.altura, 'duracao', m.duracao_s) ORDER BY m.capa DESC, m.ordem, m.criado_em), '[]'::jsonb) AS "coalesce"
           FROM produto_midia m
          WHERE m.produto_id = p.id) AS midias,
    p.hex_amostra,
    p.paleta_amostra
   FROM produtos p
     LEFT JOIN erp_produtos e ON e.sku = p.erp_sku
     CROSS JOIN loja_config c
  WHERE p.publicado AND NOT p.oculto_manual AND (p.tipo_vinculo = 'familia'::text OR COALESCE(e.ativo, false));
grant select on public.loja_catalogo to anon, authenticated, service_role;
drop view if exists public.loja_catalogo_completo;

-- 3) funções do admin, como estavam
CREATE OR REPLACE FUNCTION public.produtos_buscar(p_q text DEFAULT NULL::text, p_fila text DEFAULT 'todos'::text, p_linha text DEFAULT NULL::text, p_ordem text DEFAULT 'nome'::text, p_offset integer DEFAULT 0, p_limite integer DEFAULT 50)
 RETURNS TABLE(id uuid, slug text, nome text, codigo text, erp_sku text, linha_key text, linha_label text, vertical text, kind text, tipo_vinculo text, origem text, imagem text, hex text, publicado boolean, oculto_manual boolean, atualizado_em timestamp with time zone, erp_nome text, erp_ativo boolean, saldo_ml numeric, preco_rolo numeric, preco_metro numeric, midias integer, videos integer, completude integer, visivel boolean, total_geral bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.produtos_resumo()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

revoke all on function public.produtos_buscar(text, text, text, text, int, int) from public, anon;
grant execute on function public.produtos_buscar(text, text, text, text, int, int) to authenticated;
revoke all on function public.produtos_resumo() from public, anon;
grant execute on function public.produtos_resumo() to authenticated;

-- 4) CHECKs (só se nada usar os valores novos)
do $$
begin
  if not exists (select 1 from public.produtos where kind = 'vestuario') then
    alter table public.produtos drop constraint if exists produtos_kind_check;
    alter table public.produtos add constraint produtos_kind_check
      check (kind = any (array['cor', 'padrao', 'linha']));
  else
    raise notice 'produtos_kind_check mantido: há produtos com kind = vestuario';
  end if;
  if not exists (select 1 from public.pedido_itens where unidade = 'un') then
    alter table public.pedido_itens drop constraint if exists pedido_itens_unidade_check;
    alter table public.pedido_itens add constraint pedido_itens_unidade_check
      check (unidade = any (array['rolo', 'metro']));
  else
    raise notice 'pedido_itens_unidade_check mantido: há itens com unidade = un';
  end if;
end $$;

-- 5) colunas novas: ficam. Para remover de vez (só sem dados que dependam delas):
-- alter table public.produtos drop constraint if exists produtos_variante_check;
-- drop index if exists public.produtos_pai_id_idx;
-- alter table public.produtos drop column if exists publicar_em, drop column if exists variante;
-- alter table public.shipping_profiles drop column if exists dias_producao,
--   drop column if exists itens_por_volume, drop column if exists peso_adicional_kg;

notify pgrst, 'reload schema';

commit;
