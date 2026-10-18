-- Bucket PRIVADO para o PDF do certificado que vai anexado ao e-mail.
--
-- O Admin gera o certificado oficial no navegador (src/pages/Admin/
-- certificadoPdf.ts, ~4,8 MB) e o guarda aqui; o servidor (/api/nz/garantia,
-- op 'enviar') cria uma URL assinada de 15 min e o Resend anexa o arquivo.
-- Passa por aqui porque a Vercel não aceita 4,8 MB no corpo da requisição.
--
-- Privado de propósito: o PDF tem nome e CPF do cliente. O bucket antigo
-- `warranties` era público — não é usado mais.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('certificados', 'certificados', false, 15728640, array['application/pdf'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Só admin grava, troca e lê. O upload com upsert precisa dos três.
drop policy if exists certificados_admin_insert on storage.objects;
create policy certificados_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'certificados' and public.nz_is_admin());

drop policy if exists certificados_admin_update on storage.objects;
create policy certificados_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'certificados' and public.nz_is_admin())
  with check (bucket_id = 'certificados' and public.nz_is_admin());

drop policy if exists certificados_admin_select on storage.objects;
create policy certificados_admin_select on storage.objects
  for select to authenticated
  using (bucket_id = 'certificados' and public.nz_is_admin());
