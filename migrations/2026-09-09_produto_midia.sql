-- Mídia de produto: uma linha por foto/vídeo, com alt, ordem e capa.
--
-- Contexto: docs/PLANO_GESTAO_PRODUTOS.md (fase 4.1).
--
-- Por que uma tabela e não continuar no `produtos.galeria text[]`:
--   · o array não guarda texto alternativo (acessibilidade e Google Imagens),
--     nem tipo (vídeo), nem dimensão (o `<img width height>` que evita o pulo
--     de layout), nem quem enviou;
--   · reordenar um array no cliente é reescrever a coluna inteira, e duas abas
--     abertas se sobrescrevem.
--
-- A vitrine e o SSR continuam lendo `produtos.imagem` e `produtos.galeria`: um
-- gatilho espelha as fotos daqui para lá. Assim a loja não muda no mesmo dia em
-- que o painel muda, e um rollback do front não quebra nada.

-- ------------------------------------------------------------------ bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('produto-midia', 'produto-midia', true, 26214400,
        array['image/webp','image/jpeg','image/png','image/avif','video/mp4','video/webm'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists produto_midia_leitura on storage.objects;
drop policy if exists produto_midia_admin_escreve on storage.objects;
drop policy if exists produto_midia_admin_atualiza on storage.objects;
drop policy if exists produto_midia_admin_apaga on storage.objects;

create policy produto_midia_leitura on storage.objects
  for select to anon, authenticated using (bucket_id = 'produto-midia');
create policy produto_midia_admin_escreve on storage.objects
  for insert to authenticated with check (bucket_id = 'produto-midia' and public.nz_is_admin());
create policy produto_midia_admin_atualiza on storage.objects
  for update to authenticated using (bucket_id = 'produto-midia' and public.nz_is_admin());
create policy produto_midia_admin_apaga on storage.objects
  for delete to authenticated using (bucket_id = 'produto-midia' and public.nz_is_admin());

-- ------------------------------------------------------------------ tabela
create table if not exists public.produto_midia (
  id            uuid primary key default gen_random_uuid(),
  produto_id    uuid not null references public.produtos(id) on delete cascade,
  tipo          text not null check (tipo in ('imagem', 'video', 'video-externo')),
  -- storage público, caminho estático legado (/assets/...) ou URL de embed.
  url           text not null,
  poster_url    text,
  alt           text,
  ordem         int not null default 0,
  capa          boolean not null default false,
  largura       int,
  altura        int,
  duracao_s     numeric(6, 2),
  tamanho_bytes bigint,
  origem        text not null default 'upload' check (origem in ('upload', 'estatico', 'externo', 'seed')),
  criado_por    uuid,
  criado_em     timestamptz not null default now()
);

create index if not exists produto_midia_produto_idx on public.produto_midia (produto_id, ordem);
-- Uma capa por produto. O editor troca a capa numa transação (limpa e marca).
create unique index if not exists produto_midia_uma_capa on public.produto_midia (produto_id) where capa;

comment on table public.produto_midia is 'Fotos e vídeos do produto. produtos.imagem/galeria são espelho disto (trigger nz_espelhar_midia).';
comment on column public.produto_midia.origem is 'upload = bucket produto-midia; estatico = /assets no repositório; externo = YouTube/Vimeo; seed = criado por script';

alter table public.produto_midia enable row level security;
drop policy if exists produto_midia_admin_all on public.produto_midia;
drop policy if exists produto_midia_leitura_publica on public.produto_midia;
create policy produto_midia_admin_all on public.produto_midia
  for all to authenticated using (public.nz_is_admin()) with check (public.nz_is_admin());
-- A loja é pública: quem vê o produto vê a mídia dele.
create policy produto_midia_leitura_publica on public.produto_midia
  for select to anon, authenticated using (true);

-- ----------------------------------------------------------------- espelho
create or replace function public.nz_espelhar_midia()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pid uuid := coalesce(new.produto_id, old.produto_id);
begin
  update public.produtos p set
    imagem = (
      select m.url from public.produto_midia m
       where m.produto_id = pid and m.tipo = 'imagem'
       order by m.capa desc, m.ordem, m.criado_em
       limit 1
    ),
    galeria = coalesce((
      select array_agg(m.url order by m.capa desc, m.ordem, m.criado_em)
        from public.produto_midia m
       where m.produto_id = pid and m.tipo = 'imagem'
    ), '{}')
  where p.id = pid;
  return null;
end;
$$;

drop trigger if exists produto_midia_espelho on public.produto_midia;
create trigger produto_midia_espelho
  after insert or update or delete on public.produto_midia
  for each row execute function public.nz_espelhar_midia();

-- --------------------------------------------- importa o que já existe
-- 1.028 referências, todas estáticas e todas existindo em disco (conferido).
-- A capa é a que está em `produtos.imagem`; as demais mantêm a ordem do array.
insert into public.produto_midia (produto_id, tipo, url, ordem, capa, origem)
select p.id, 'imagem', g.url, (g.ord - 1)::int, (g.url = p.imagem), 'estatico'
  from public.produtos p
  cross join lateral unnest(p.galeria) with ordinality as g(url, ord)
 where coalesce(array_length(p.galeria, 1), 0) > 0
   and not exists (select 1 from public.produto_midia m where m.produto_id = p.id)
on conflict do nothing;

-- Produto com capa mas sem galeria (não deve haver, mas fica coerente).
insert into public.produto_midia (produto_id, tipo, url, ordem, capa, origem)
select p.id, 'imagem', p.imagem, 0, true, 'estatico'
  from public.produtos p
 where coalesce(p.imagem, '') <> ''
   and not exists (select 1 from public.produto_midia m where m.produto_id = p.id);

-- --------------------------------------------------------------- catálogo
-- A view ganha `midias`; `imagem`/`galeria` continuam para não quebrar nada.
create or replace view public.loja_catalogo as
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
    -- Coluna nova vai no FIM: `create or replace view` não deixa inserir no meio.
    ( SELECT coalesce(jsonb_agg(jsonb_build_object(
                'tipo', m.tipo, 'url', m.url, 'poster', m.poster_url,
                'alt', m.alt, 'largura', m.largura, 'altura', m.altura,
                'duracao', m.duracao_s
             ) order by m.capa desc, m.ordem, m.criado_em), '[]'::jsonb)
        FROM produto_midia m WHERE m.produto_id = p.id) AS midias
   FROM produtos p
     LEFT JOIN erp_produtos e ON e.sku = p.erp_sku
     CROSS JOIN loja_config c
  WHERE p.publicado AND NOT p.oculto_manual AND (p.tipo_vinculo = 'familia'::text OR COALESCE(e.ativo, false));
