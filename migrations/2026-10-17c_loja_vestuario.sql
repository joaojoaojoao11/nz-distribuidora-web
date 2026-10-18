-- Loja: produto vendido por UNIDADE com tamanho (Coleção NZPPF 2026 · Os Clãs)
-- e publicação AGENDADA por data.
--
-- Plano: NZ-AGENTES/CLEDNA/casos/2026-10-17_loja-vestuario-plano.md (fase A).
-- Rollback: migrations/rollback/2026-10-17c_loja_vestuario.rollback.sql
--
-- Tudo aqui é ADITIVO e compatível com o código que está no ar:
--   · colunas novas nascem nulas / com o padrão que reproduz o comportamento atual;
--   · os CHECKs só ganham valores ('vestuario', 'un');
--   · a view pública mantém as 44 colunas na mesma ordem e só ganha 4 no fim;
--     produtos sem `publicar_em` (todos os rolos) continuam exatamente iguais.
--
-- Por que duas views. A regra de visibilidade ("publicado, não oculto, ERP
-- ativo") mora em UM lugar: `loja_catalogo_completo`. A pública
-- (`loja_catalogo`) é ela + a data. A prévia do admin lê a completa por uma
-- função que confere `nz_is_admin()`. A completa NÃO é legível por anon nem por
-- authenticated — o padrão do Supabase dá acesso total a objeto novo no
-- `public`, então o REVOKE abaixo é obrigatório (sem ele, vaza o agendado).

begin;

-- 1) produtos: data de publicação, tamanho e o tipo "vestuario" --------------
alter table public.produtos
  add column if not exists publicar_em timestamptz,
  add column if not exists variante text;

alter table public.produtos drop constraint if exists produtos_kind_check;
alter table public.produtos add constraint produtos_kind_check
  check (kind = any (array['cor', 'padrao', 'linha', 'vestuario']));

alter table public.produtos drop constraint if exists produtos_variante_check;
alter table public.produtos add constraint produtos_variante_check
  check (variante is null or variante = any (array['PP', 'P', 'M', 'G', 'GG', 'XGG']));

create index if not exists produtos_pai_id_idx on public.produtos (pai_id) where pai_id is not null;

-- 2) pedido_itens: unidade por peça -------------------------------------------
alter table public.pedido_itens drop constraint if exists pedido_itens_unidade_check;
alter table public.pedido_itens add constraint pedido_itens_unidade_check
  check (unidade = any (array['rolo', 'metro', 'un']));

-- 3) shipping_profiles: dias de produção e peças por volume -------------------
-- Os perfis de rolo ficam com os padrões (0 / 1 / 0) = comportamento de hoje.
alter table public.shipping_profiles
  add column if not exists dias_producao integer not null default 0,
  add column if not exists itens_por_volume integer not null default 1,
  add column if not exists peso_adicional_kg numeric(6,3) not null default 0;

alter table public.shipping_profiles drop constraint if exists shipping_profiles_dias_producao_check;
alter table public.shipping_profiles add constraint shipping_profiles_dias_producao_check
  check (dias_producao between 0 and 90);
alter table public.shipping_profiles drop constraint if exists shipping_profiles_itens_por_volume_check;
alter table public.shipping_profiles add constraint shipping_profiles_itens_por_volume_check
  check (itens_por_volume between 1 and 50);
alter table public.shipping_profiles drop constraint if exists shipping_profiles_peso_adicional_kg_check;
alter table public.shipping_profiles add constraint shipping_profiles_peso_adicional_kg_check
  check (peso_adicional_kg >= 0);

-- 4) view base, SEM filtro de data --------------------------------------------
-- Corpo idêntico ao vigente (migrations/2026-10-10_lente_busca_por_imagem.sql)
-- + 4 colunas no fim.
create or replace view public.loja_catalogo_completo as
select p.id,
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
       case
         when e.sku is null then null::text
         when not e.ativo or e.saldo_ml <= 0::numeric then 'sob-encomenda'::text
         when e.saldo_ml <= coalesce(nullif(e.estoque_minimo, 0::numeric), c.limite_ultimas_unidades_ml) then 'ultimas-unidades'::text
         else 'pronta-entrega'::text
       end as nivel_estoque,
       greatest(p.atualizado_em, coalesce(e.sincronizado_em, p.atualizado_em)) as atualizado_em,
       (select coalesce(jsonb_agg(jsonb_build_object(
                  'tipo', m.tipo, 'url', m.url, 'poster', m.poster_url, 'alt', m.alt,
                  'largura', m.largura, 'altura', m.altura, 'duracao', m.duracao_s)
                order by m.capa desc, m.ordem, m.criado_em), '[]'::jsonb)
          from public.produto_midia m
         where m.produto_id = p.id) as midias,
       p.hex_amostra,
       p.paleta_amostra,
       -- novas (sempre no fim: CREATE OR REPLACE VIEW só aceita coluna nova no fim)
       p.publicar_em,
       p.variante,
       (select pp.slug from public.produtos pp where pp.id = p.pai_id) as pai_slug,
       -- Preço de vitrine SÓ para vestuário (decisão D9): é o mesmo valor que o
       -- checkout cobra (preco_rolo = atacado = o que o site cobra de todos).
       case when p.kind = 'vestuario' and coalesce(e.preco_rolo, 0) > 0 then e.preco_rolo end as preco_publico
  from public.produtos p
  left join public.erp_produtos e on e.sku = p.erp_sku
  cross join public.loja_config c
 where p.publicado
   and not p.oculto_manual
   and (p.tipo_vinculo = 'familia'::text or coalesce(e.ativo, false));

revoke all on public.loja_catalogo_completo from public, anon, authenticated;

-- 5) view pública = base + data -----------------------------------------------
create or replace view public.loja_catalogo as
select id, slug, erp_sku, tipo_vinculo, pai_id, alias_de, nome, subtitulo, marca_exibicao, brand_key,
       linha_key, linha_label, vertical, kind, aplicacoes, codigo, imagem, galeria, hex, cor_declarada,
       transparente, hex_inferido, acabamentos, acabamento_label, familia_padrao, descricao, ficha,
       badges, garantia_anos, durabilidade_anos, legacy_path, shipping_profile_id, seo_titulo,
       seo_descricao, ordem, origem, largura_m, metragem_padrao, unidade, nivel_estoque, atualizado_em,
       midias, hex_amostra, paleta_amostra,
       publicar_em, variante, pai_slug, preco_publico
  from public.loja_catalogo_completo
 where publicar_em is null or publicar_em <= now();
-- CREATE OR REPLACE preserva o grant de leitura que anon/authenticated já têm.

-- 6) prévia do admin: o que está agendado (publicar_em no futuro) ------------
create or replace function public.loja_catalogo_previa()
returns setof public.loja_catalogo_completo
language sql
stable
security definer
set search_path = public
as $$
  select *
    from public.loja_catalogo_completo
   where public.nz_is_admin()
     and publicar_em > now();
$$;
revoke all on function public.loja_catalogo_previa() from public, anon;
grant execute on function public.loja_catalogo_previa() to authenticated;

-- 7) busca do admin: só admin, e "visível" respeita a data --------------------
-- Antes: qualquer usuário LOGADO (cliente) podia chamar e recebia todos os
-- produtos, ocultos inclusive, com preço de atacado e saldo. Único chamador:
-- src/pages/Admin/AdminProdutos.tsx (rota /admin, papel admin).
create or replace function public.produtos_buscar(
  p_q text default null::text,
  p_fila text default 'todos'::text,
  p_linha text default null::text,
  p_ordem text default 'nome'::text,
  p_offset integer default 0,
  p_limite integer default 50
)
returns table(id uuid, slug text, nome text, codigo text, erp_sku text, linha_key text, linha_label text,
              vertical text, kind text, tipo_vinculo text, origem text, imagem text, hex text,
              publicado boolean, oculto_manual boolean, atualizado_em timestamp with time zone,
              erp_nome text, erp_ativo boolean, saldo_ml numeric, preco_rolo numeric, preco_metro numeric,
              midias integer, videos integer, completude integer, visivel boolean, total_geral bigint)
language sql
stable
security definer
set search_path to 'public'
as $function$
  with base as (
    select p.*,
           e.nome as e_nome, e.ativo as e_ativo, e.saldo_ml as e_saldo,
           e.preco_rolo as e_rolo, e.preco_metro as e_metro,
           (select count(*) from produto_midia m where m.produto_id = p.id and m.tipo = 'imagem') as n_img,
           (select count(*) from produto_midia m where m.produto_id = p.id and m.tipo <> 'imagem') as n_vid
      from produtos p
      left join erp_produtos e on e.sku = p.erp_sku
     where public.nz_is_admin()
  ), calculado as (
    select b.*,
           (case when coalesce(b.imagem, '') <> '' then 1 else 0 end
          + case when b.n_img >= 2 then 1 else 0 end
          + case when coalesce(b.descricao, '') <> '' then 1 else 0 end
          + case when jsonb_typeof(b.ficha) = 'array' and jsonb_array_length(b.ficha) >= 3 then 1 else 0 end
          + case when coalesce(b.seo_titulo, '') <> '' then 1 else 0 end) as pontos,
           (b.publicado and not b.oculto_manual
            and (b.tipo_vinculo = 'familia' or coalesce(b.e_ativo, false))
            and (b.publicar_em is null or b.publicar_em <= now())) as e_visivel
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

create or replace function public.produtos_resumo()
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $function$
  with b as (
    select p.id, p.imagem, p.kind, p.tipo_vinculo, p.origem, p.oculto_manual, p.publicado, p.publicar_em,
           p.descricao, p.ficha, p.seo_titulo, e.ativo as e_ativo,
           (select count(*) from produto_midia m where m.produto_id = p.id and m.tipo = 'imagem') as n_img
      from produtos p left join erp_produtos e on e.sku = p.erp_sku
     where public.nz_is_admin()
  )
  select jsonb_build_object(
    'total',       count(*),
    'visiveis',    count(*) filter (where publicado and not oculto_manual
                                      and (tipo_vinculo = 'familia' or coalesce(e_ativo, false))
                                      and (publicar_em is null or publicar_em <= now())),
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

-- os grants das duas funções não mudam (create or replace preserva): authenticated executa,
-- anon não. Repetidos aqui para o arquivo valer sozinho num banco novo.
revoke all on function public.produtos_buscar(text, text, text, text, int, int) from public, anon;
grant execute on function public.produtos_buscar(text, text, text, text, int, int) to authenticated;
revoke all on function public.produtos_resumo() from public, anon;
grant execute on function public.produtos_resumo() to authenticated;

notify pgrst, 'reload schema';

commit;
