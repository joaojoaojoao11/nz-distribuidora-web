-- Migração: permitir tipo_servico = 'Movel/Eletro' na tabela garantias_nz
-- Contexto: o wizard de garantia (src/pages/Warranty/WarrantyRegistration.tsx)
-- passou a oferecer a opção "Móvel / Eletrodoméstico" (exclusiva NZPPF).
-- Sem esta migração, o INSERT falha com erro 23514 (violates check constraint).
-- Rodar no SQL Editor do Supabase (projeto uibjmvkvbthzypgozpcs).
-- Aplicada em produção em 2026-06-02.

ALTER TABLE public.garantias_nz
  DROP CONSTRAINT IF EXISTS garantias_nz_tipo_servico_check;

ALTER TABLE public.garantias_nz
  ADD CONSTRAINT garantias_nz_tipo_servico_check
  CHECK (tipo_servico IN ('Total/Full', 'Parcial', 'Movel/Eletro'));
