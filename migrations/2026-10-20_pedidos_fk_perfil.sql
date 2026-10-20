-- Admin → Pedidos: FK que faltava, parcelas do cartão e rastro das recusas.
-- Projeto: uibjmvkvbthzypgozpcs (site). FIRECRAL/PLANO_PEDIDOS_PAGAMENTOS_ADMIN.md
--
-- 1. O embed `user_profiles(...)` que a tela do admin faz em `pedidos` exige
--    uma FK pedidos.user_id → user_profiles.id. Só existia a FK para
--    auth.users, então o PostgREST devolvia "Could not find a relationship" e
--    a aba Pedidos & Pagamentos nunca listou pedido nenhum (07/09 → 20/10).
-- 2. Cartão parcelado vira N cobranças no Asaas (uma por parcela) ligadas por
--    um `installment`; o site precisa guardar esse id para reconhecer os
--    eventos das parcelas 2..N.
-- 3. Evento do webhook com erro pode ser marcado como resolvido no admin.
-- 4. Tentativa de cartão recusada guarda valor e motivo, para o vendedor ver
--    quem não conseguiu pagar (o pedido em si é apagado na recusa).

alter table public.pedidos drop constraint if exists pedidos_user_id_perfil_fkey;
alter table public.pedidos
  add constraint pedidos_user_id_perfil_fkey
  foreign key (user_id) references public.user_profiles(id);

alter table public.pagamentos add column if not exists asaas_installment_id text;
create index if not exists pagamentos_installment_idx
  on public.pagamentos (asaas_installment_id) where asaas_installment_id is not null;

alter table public.asaas_eventos add column if not exists resolvido_em timestamptz;

alter table public.checkout_tentativas
  add column if not exists valor numeric(12,2),
  add column if not exists motivo text;

notify pgrst, 'reload schema';
