-- Central do cliente, Fase C (22/10/2026): "Pagar pelo Asaas" na aba Pagamentos.
--
-- O site pede ao NZERP a emissão da cobrança de um título do cliente
-- (api/_lib/conta/pagarTitulo.ts → api/asaas/emit do ERP, origem 'site').
-- O endereço do ERP NÃO entra no repositório (este repo é público e as rotas
-- /api do ERP não pedem login): vem da env NZERP_API_URL ou desta coluna, que
-- é preenchida por script fora do git. loja_config só é lida pelo admin
-- (RLS nz_is_admin) e pelo servidor (service_role).
alter table public.loja_config add column if not exists nzerp_api_url text;
comment on column public.loja_config.nzerp_api_url is 'Endereço do NZERP para pedir emissão de cobrança (Central do cliente, Fase C). Preenchido fora do git.';
notify pgrst, 'reload schema';
