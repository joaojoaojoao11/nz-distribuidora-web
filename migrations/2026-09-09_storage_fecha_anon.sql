-- Fecha a escrita anônima no Storage.
--
-- `Permitir Upload Publico flrqo9_1` dava INSERT em `site-assets` para `anon` e
-- `authenticated`. Como o bucket é público e não tinha limite de tamanho nem de
-- tipo, qualquer pessoa na internet podia hospedar arquivo no domínio da NZ e
-- gastar o espaço/tráfego da conta. As policies certas já existiam ao lado
-- (`site_assets_admin_escreve`, com `nz_is_admin()`), mas RLS é OU: a permissiva
-- vencia.
--
-- `warranties` continua aceitando envio público — é o formulário de garantia,
-- que roda sem login —, mas agora só PDF de até 5 MB.

drop policy if exists "Permitir Upload Publico flrqo9_1" on storage.objects;

-- A de leitura pública do site-assets é legítima e fica (duplica
-- `site_assets_leitura_publica`, mas remover não muda nada; some para não
-- confundir quem for auditar depois).
drop policy if exists "Permitir Upload Publico flrqo9_0" on storage.objects;

update storage.buckets
   set file_size_limit = 5242880,
       allowed_mime_types = array['application/pdf']
 where id = 'warranties';

-- site-assets: teto de 10 MB e só imagem/pdf (é onde vive logo, hero, anexo).
update storage.buckets
   set file_size_limit = 10485760,
       allowed_mime_types = array['image/webp','image/jpeg','image/png','image/avif','image/svg+xml','application/pdf']
 where id = 'site-assets';

-- `blog_media` aceitava qualquer usuário AUTENTICADO (inclusive um cliente da
-- loja recém-cadastrado) enviar, alterar e apagar arquivo. Só admin escreve.
drop policy if exists "Auth media upload" on storage.objects;
drop policy if exists "Auth media update" on storage.objects;
drop policy if exists "Auth media delete" on storage.objects;

create policy blog_media_admin_escreve on storage.objects
  for insert to authenticated with check (bucket_id = 'blog_media' and public.nz_is_admin());
create policy blog_media_admin_atualiza on storage.objects
  for update to authenticated using (bucket_id = 'blog_media' and public.nz_is_admin());
create policy blog_media_admin_apaga on storage.objects
  for delete to authenticated using (bucket_id = 'blog_media' and public.nz_is_admin());
