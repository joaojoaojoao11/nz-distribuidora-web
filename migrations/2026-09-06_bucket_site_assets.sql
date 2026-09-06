-- Bucket público para fotos de produto enviadas pelo painel (Admin → Produtos).
-- RODAR NO PROJETO DO SITE (uibjmvkvbthzypgozpcs).
--
-- Leitura pública (é a foto do card); escrita só para admin, pela mesma régua
-- das tabelas (nz_is_admin, migrations/2026-09-06_loja_ecommerce.sql).
-- Aplicada em produção em: 2026-09-05

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-assets', 'site-assets', true, 8388608, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public = true;

drop policy if exists "site_assets_leitura_publica" on storage.objects;
create policy "site_assets_leitura_publica"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'site-assets');

drop policy if exists "site_assets_admin_escreve" on storage.objects;
create policy "site_assets_admin_escreve"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'site-assets' and public.nz_is_admin());

drop policy if exists "site_assets_admin_atualiza" on storage.objects;
create policy "site_assets_admin_atualiza"
  on storage.objects for update to authenticated
  using (bucket_id = 'site-assets' and public.nz_is_admin());

drop policy if exists "site_assets_admin_apaga" on storage.objects;
create policy "site_assets_admin_apaga"
  on storage.objects for delete to authenticated
  using (bucket_id = 'site-assets' and public.nz_is_admin());
