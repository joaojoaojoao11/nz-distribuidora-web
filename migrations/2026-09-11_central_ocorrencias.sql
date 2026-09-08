-- Central de erros e mudanças: uma caixa de entrada para a equipe NZ.
-- RODAR NO PROJETO DO SITE (uibjmvkvbthzypgozpcs).
--
-- Plano: docs/PLANO_SELECOES_PRECO_ATACADO.md (Fase 1).
--
-- Por que existe: o site já registrava o que dava errado em quatro logs
-- separados (erp_sync_log, equipe_log, erp_atribuicao_log, blog_ai_run_log),
-- nenhum deles com tela. Um SKU sem preço, um produto que sumiu do ERP ou um
-- cliente dizendo "a foto está errada" simplesmente não chegavam a ninguém.
--
-- Três categorias, decididas com o João (2026-09-08):
--   erro     — o sistema não conseguiu fazer o certo (atacado zerado, sync caiu)
--   mudanca  — o ERP mudou algo que a equipe precisa saber (SKU novo/removido,
--              preço que variou acima do limiar)
--   problema — alguém informou pela página do produto
--
-- ESCRITA SÓ PELO SERVIDOR. O admin lê e resolve; nenhuma policy de insert
-- para `authenticated`, de propósito: ocorrência nasce do sync ou do endpoint,
-- nunca do navegador.
--
-- Aplicada em produção em: (preencher)

create table if not exists public.ocorrencias (
  id            uuid primary key default gen_random_uuid(),
  categoria     text not null check (categoria in ('erro', 'mudanca', 'problema')),
  tipo          text not null check (tipo in (
                  'preco-zerado', 'sync-erro',                       -- erro
                  'sku-novo', 'sku-removido', 'preco-mudou',         -- mudanca
                  'problema-produto'                                 -- problema
                )),
  status        text not null default 'aberta' check (status in ('aberta', 'resolvida')),
  titulo        text not null,
  -- O que a tela mostra em "detalhe": {antes, depois, variacaoPct, usandoVarejo,
  -- semPreco, motivo, mensagem do sync...}. Formato livre por tipo.
  detalhe       jsonb not null default '{}'::jsonb,
  produto_slug  text,
  erp_sku       text,
  -- Uma ocorrência ABERTA por chave ('preco-zerado:NZW203'): o sync roda a cada
  -- 5 min e não pode empilhar a mesma queixa. Resolvida, pode nascer outra.
  chave_dedupe  text,

  -- Só para 'problema-produto': quem informou e o que mandou.
  user_id       uuid references auth.users(id) on delete set null,
  contato       text,
  mensagem      text,
  imagem_path   text,
  url           text,
  user_agent    text,
  -- sha256(ip + salt). Serve para o freio de 5 envios/hora, não para
  -- identificar ninguém: o IP em claro nunca é gravado.
  ip_hash       text,

  criado_em     timestamptz not null default now(),
  resolvido_em  timestamptz,
  resolvido_por uuid references auth.users(id) on delete set null,
  nota_resolucao text
);

-- O índice PARCIAL é o que faz o dedupe: só as abertas competem pela chave.
create unique index if not exists ocorrencias_aberta_por_chave
  on public.ocorrencias (chave_dedupe)
  where status = 'aberta' and chave_dedupe is not null;

create index if not exists ocorrencias_status_idx
  on public.ocorrencias (status, categoria, criado_em desc);

create index if not exists ocorrencias_ip_hora_idx
  on public.ocorrencias (ip_hash, criado_em)
  where tipo = 'problema-produto';

comment on table public.ocorrencias is
  'Central de erros e mudanças (/admin/central). Escrita só pelo servidor; admin lê e resolve.';

alter table public.ocorrencias enable row level security;

drop policy if exists ocorrencias_admin_le on public.ocorrencias;
create policy ocorrencias_admin_le on public.ocorrencias
  for select to authenticated using (public.nz_is_admin());

drop policy if exists ocorrencias_admin_resolve on public.ocorrencias;
create policy ocorrencias_admin_resolve on public.ocorrencias
  for update to authenticated
  using (public.nz_is_admin()) with check (public.nz_is_admin());

-- ==================================================== loja_config

-- Acima disso, uma mudança de preço no sync vira ocorrência de 'mudanca'.
alter table public.loja_config
  add column if not exists alerta_variacao_preco_pct numeric(5,2) not null default 20;

-- ==================================================== bucket privado

-- Imagens do "informar um problema" (Fase 6). PRIVADO: o anônimo manda a foto
-- pelo endpoint (service role) e só o admin lê, por URL assinada. Um bucket
-- público aqui seria hospedagem aberta no domínio da NZ — foi exatamente o furo
-- fechado em migrations/2026-09-09_storage_fecha_anon.sql.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ocorrencias', 'ocorrencias', false, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = false,
  file_size_limit = 3145728,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists ocorrencias_admin_le_imagem on storage.objects;
create policy ocorrencias_admin_le_imagem on storage.objects
  for select to authenticated
  using (bucket_id = 'ocorrencias' and public.nz_is_admin());
