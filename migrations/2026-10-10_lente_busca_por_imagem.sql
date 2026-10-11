-- Lente: busca por imagem na LOJA.
-- RODAR NO PROJETO DO SITE (uibjmvkvbthzypgozpcs).
--
-- Plano: FIRECRAL/PLANO_LOJA_BUSCA_POR_IMAGEM.md (Fases 0 e 2).
--
-- 1. produtos.hex_amostra / paleta_amostra — cor amostrada da FOTO do produto.
--    Só 198 das 490 cores tinham hex no banco; as outras 292 só tinham foto, e
--    sem número não há distância de cor. O valor é ESTIMATIVA nossa (k-means
--    sobre o rolo, sem o fundo branco e sem o logo): serve para a busca por
--    imagem e NUNCA vira swatch nem entra em resolveColor — mesma disciplina do
--    hex_inferido dos chips MCX. Quem preenche é scripts/amostrar-hex-fotos.mjs
--    e, dali em diante, o editor de galeria ao trocar a capa.
-- 2. loja_catalogo expõe as duas colunas. Acrescentadas no FIM: `create or
--    replace view` só aceita coluna nova depois das existentes.
-- 3. loja_config.lente_ia_ativa — liga o entendimento por modelo de visão
--    (/api/nz/lente). Começa DESLIGADA, como checkout_ativo começou.
-- 4. lente_uso — contador do freio por IP (sha256 com sal, nunca o IP). Escrita
--    só pelo servidor: sem policy nenhuma para anon/authenticated. A imagem do
--    cliente não é gravada em lugar nenhum.
--
-- Não mexe no sync: ele cria produtos com ignoreDuplicates e não toca coluna
-- editorial. Aplicada em produção em: 2026-10-10

alter table public.produtos
  add column if not exists hex_amostra    text,
  add column if not exists paleta_amostra jsonb,
  add column if not exists amostra_em     timestamptz,
  add column if not exists amostra_origem text;

comment on column public.produtos.hex_amostra is
  'Cor dominante amostrada da foto (estimativa). Só para a busca por imagem; nunca swatch, nunca família.';
comment on column public.produtos.paleta_amostra is
  'Paleta [{hex, peso}] amostrada da foto, ordenada por peso.';
comment on column public.produtos.amostra_origem is
  'foto-capa | foto-galeria | manual';

create or replace view public.loja_catalogo as
select
  p.id,
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
  (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'tipo', m.tipo,
          'url', m.url,
          'poster', m.poster_url,
          'alt', m.alt,
          'largura', m.largura,
          'altura', m.altura,
          'duracao', m.duracao_s
        ) order by m.capa desc, m.ordem, m.criado_em
      ),
      '[]'::jsonb
    )
    from public.produto_midia m
    where m.produto_id = p.id
  ) as midias,
  p.hex_amostra,
  p.paleta_amostra
from public.produtos p
left join public.erp_produtos e on e.sku = p.erp_sku
cross join public.loja_config c
where p.publicado
  and not p.oculto_manual
  and (p.tipo_vinculo = 'familia'::text or coalesce(e.ativo, false));

alter table public.loja_config
  add column if not exists lente_ia_ativa boolean not null default false;

comment on column public.loja_config.lente_ia_ativa is
  'Busca por imagem: liga o entendimento por modelo de visão (/api/nz/lente). Desligada, a Lente funciona só com cor, no navegador.';

create table if not exists public.lente_uso (
  id        bigint generated always as identity primary key,
  ip_hash   text        not null,
  criado_em timestamptz not null default now()
);

create index if not exists lente_uso_ip_hash_criado_em
  on public.lente_uso (ip_hash, criado_em desc);

alter table public.lente_uso enable row level security;
revoke all on public.lente_uso from anon, authenticated;

comment on table public.lente_uso is
  'Uma linha por consulta ao modelo de visão da Lente. Só o hash do IP com sal, para o freio de 20/hora; nunca a imagem, nunca o IP.';
