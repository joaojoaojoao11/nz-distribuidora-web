-- A linha ganha página de apresentação, catálogo e fotos.
-- RODAR NO PROJETO DO SITE (uibjmvkvbthzypgozpcs).
--
-- Pedido do João (07/09/2026): "as linhas de ppf do nzppf têm que ter plus
-- porque são da nossa linha própria, e os ppf possuem página de apresentação,
-- catálogo da linha, e fotos para cada uma das linhas. Nesses materiais nzppf
-- você precisa cruzar essas informações, e colocar os catálogos baixáveis com
-- link da página desses produtos também."
--
-- Os três campos são GENÉRICOS, não "de PPF". A NZPPF é só a primeira linha a
-- ter os três preenchidos, porque é marca própria e por isso é a única com
-- página, catálogo e sessão de fotos feitas por nós. Etherna e SH Decor têm
-- catálogo em PDF do fabricante e podem receber `catalogo_url` quando o
-- arquivo for para o /public.
--
-- Aplicada em produção em: 2026-09-07

alter table public.linhas          add column if not exists pagina_url text;
alter table public.linha_familias  add column if not exists pagina_url text;

-- Chave no gerador de portfólio (src/pages/Ppf/ppfPortfolioRegistry.ts). O PDF
-- é montado no navegador a partir dos MESMOS dados da página — não há segunda
-- cópia de ficha nem de acabamentos, e por isso o catálogo nunca diverge do
-- que está no site. Hoje só a NZPPF tem gerador.
alter table public.linhas          add column if not exists catalogo_slug text;
alter table public.linha_familias  add column if not exists catalogo_slug text;

-- PDF pronto, hospedado. Para catálogo de fabricante que não geramos.
alter table public.linhas          add column if not exists catalogo_url text;
alter table public.linha_familias  add column if not exists catalogo_url text;

-- Fotos da linha: [{url, titulo, sub}]. A primeira é a foto de capa; as demais
-- são os acabamentos/tonalidades, com o mesmo rótulo que a página usa.
alter table public.linhas          add column if not exists galeria jsonb not null default '[]'::jsonb;
alter table public.linha_familias  add column if not exists galeria jsonb not null default '[]'::jsonb;

comment on column public.linhas.catalogo_slug is
  'Chave no gerador de portfólio NZPPF. O PDF sai dos mesmos dados da página da linha.';
comment on column public.linhas.galeria is
  'Fotos da linha: [{url, titulo, sub}]. A primeira é a capa.';

-- A view seleciona coluna a coluna: campo novo que não entra aqui existe no
-- banco e nunca chega ao site. Foi exatamente assim que `nome_prefixos` ficou
-- invisível em produção — o teste 9 de scripts/test-ficha.mjs cobre isso agora.
create or replace view public.loja_linhas as
select
  l.linha_key,
  null::text as familia_key,
  l.label,
  l.marca_key,
  l.ficha,
  l.chamada,
  l.descricao,
  l.texto_venda,
  l.aplicacoes,
  l.cuidados,
  l.tds_url,
  l.tds_titulo,
  l.fonte_url,
  l.conferido_em,
  '{}'::text[] as prefixos,
  l.ordem,
  l.atualizado_em,
  '{}'::text[] as nome_prefixos,
  l.pagina_url,
  l.catalogo_slug,
  l.catalogo_url,
  l.galeria
from public.linhas l
where l.publicado
union all
select
  f.linha_key,
  f.familia_key,
  f.label,
  l.marca_key,
  f.ficha,
  f.chamada,
  f.descricao,
  f.texto_venda,
  f.aplicacoes,
  f.cuidados,
  coalesce(f.tds_url, l.tds_url),
  coalesce(f.tds_titulo, l.tds_titulo),
  f.fonte_url,
  f.conferido_em,
  f.prefixos,
  f.ordem,
  f.atualizado_em,
  f.nome_prefixos,
  coalesce(f.pagina_url, l.pagina_url),
  coalesce(f.catalogo_slug, l.catalogo_slug),
  coalesce(f.catalogo_url, l.catalogo_url),
  case when jsonb_array_length(f.galeria) > 0 then f.galeria else l.galeria end
from public.linha_familias f
join public.linhas l on l.linha_key = f.linha_key
where f.publicado and l.publicado;

grant select on public.loja_linhas to anon, authenticated;
