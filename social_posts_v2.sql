-- =====================================================================
-- NZ — Migration v2: adiciona coluna `checklist` em social_posts
-- Roda esse SQL no SQL Editor do Supabase do projeto nzgroup, depois do
-- social_posts.sql original. É idempotente (IF NOT EXISTS).
--
-- Estrutura esperada do JSON:
--   [{ "label": "string", "done": boolean }, ...]
--
-- RLS já está ativo na tabela base; ALTER TABLE não precisa redeclarar.
-- =====================================================================

alter table public.social_posts
  add column if not exists checklist jsonb not null default '[]'::jsonb;

-- (Opcional) índice GIN se quiser filtrar/buscar por items da checklist.
-- Não é necessário pro MVP — descomente quando virar gargalo.
-- create index if not exists social_posts_checklist_gin_idx
--   on public.social_posts using gin (checklist);
