-- Site NZ (nzgroup.com.br) — recorte do ERP que pode sair para a loja.
-- Projeto: ipehorttsrvjynnhyzhu (este). O lado do site está em
-- nz-distribuidora-web/migrations/2026-09-06_loja_ecommerce.sql.
--
-- POR QUE VIEWS: o filtro do que sai do ERP tem que ser NA ORIGEM.
-- master_catalog e pricing_engineering carregam custo, margem e fornecedor,
-- e este projeto opera com policies FOR ALL TO public. O site lê estas views
-- só no servidor (Vercel, service role) e nunca as tabelas base. Selecionando
-- apenas as colunas abaixo, nem um bug do lado do site consegue vazar o que
-- nunca foi transferido.
--
-- REGRA: nenhuma view aqui pode ganhar coluna de custo, margem, acréscimo ou
-- fornecedor. Preço de VENDA (ideal e mínimo) sai; o resto não.
--
-- Substitui as views nunca aplicadas de 2026-09-03.
-- Aplicada em produção em: 2026-09-05

-- ------------------------------------------------- catálogo (TODOS os SKUs)
-- Ativos e inativos: o site precisa saber que um SKU foi desativado para
-- desativar o produto correspondente. Ausência na view = apagado do ERP.
create or replace view public.catalogo_site as
select
  mc.sku,
  mc.nome,
  mc.categoria,
  mc.marca,
  mc.active            as ativo,
  mc.largura_l         as largura_m,
  mc.metragem_padrao,
  coalesce(nullif(upper(trim(mc.cost_unit)), ''), 'ML') as unidade,
  mc.estoque_minimo,
  mc.id_tiny,
  mc.updated_at
from public.master_catalog mc;

comment on view public.catalogo_site is
  'Recorte do master_catalog para o site NZ. Sem custo, preço, margem ou fornecedor — o filtro é na origem.';

-- ------------------------------------------------------------ preços
-- Só preço de VENDA. atacado = R$ por rolo fechado de metragem_padrao_ml;
-- fracionado = R$ por metro linear. Os mínimos são pisos de negociação e só
-- chegam ao papel admin do site (a filtragem por papel é do site).
create or replace view public.precos_site as
select
  pe.sku,
  pe.preco_venda_ideal_atacado    as preco_rolo,
  pe.preco_venda_min_atacado      as preco_rolo_min,
  pe.preco_venda_ideal_fracionado as preco_metro,
  pe.preco_venda_min_fracionado   as preco_metro_min,
  coalesce(pe.promocao, false)    as promocao,
  pe.metragem_padrao_ml,
  pe.updated_at
from public.pricing_engineering pe;

comment on view public.precos_site is
  'Preços de venda para o site NZ. PROIBIDO adicionar custo_ml_referencia, margem_* ou acrescimo_frac aqui.';

-- -------------------------------------------------------- saldo (pátio SP)
-- Um LPN = um rolo físico. A filial MG é CNPJ fiscal; o material fica na
-- MATRIZ, então o saldo do site é o da matriz — e continua verdade se MG um
-- dia tiver estoque físico próprio.
create or replace view public.estoque_site as
select
  i.sku,
  coalesce(sum(i.quant_ml), 0)                                   as saldo_ml,
  count(*) filter (where i.status_rolo = 'ROLO FECHADO')         as rolos_fechados,
  count(*) filter (where i.status_rolo = 'ROLO ABERTO')          as rolos_abertos,
  max(i."ultAtuali")                                             as ultima_movimentacao
from public.inventory i
where i.sku is not null
  and coalesce(i.quant_ml, 0) > 0
  and i.company_id in (select c.id from public.companies c where c.is_matriz)
group by i.sku;

comment on view public.estoque_site is
  'Saldo agregado por SKU no pátio da MATRIZ (SP) para o site NZ.';

-- ------------------------------------------------- detalhe por LPN (admin)
-- Lido AO VIVO só para o papel admin do site: são os botões "1 rolo, 2 rolos,
-- ponta de 7,5 m" da página do produto. Sem custo_unitario.
create or replace view public.estoque_lpn_site as
select
  i.lpn,
  i.sku,
  i.quant_ml,
  i.status_rolo,
  i.lote,
  i.coluna,
  i.prateleira,
  i."nCaixa"      as caixa,
  i.company_id    as empresa_id,
  i."ultAtuali"   as ultima_atualizacao
from public.inventory i
where i.sku is not null
  and coalesce(i.quant_ml, 0) > 0
  and i.company_id in (select c.id from public.companies c where c.is_matriz);

comment on view public.estoque_lpn_site is
  'Detalhe por rolo físico (pátio SP) para o painel admin do site. Sem custo.';

-- ============================================== notificação para o site
--
-- Três caminhos redundantes levam a mudança até o site:
--   1. trigger POR STATEMENT nas tabelas de produto/preço/estoque → segundos;
--   2. pg_cron a cada 5 min → rede de segurança (o plano Hobby da Vercel só
--      aceita cron diário, então a cadência vive aqui);
--   3. o cron diário da Vercel → reconciliação de madrugada.
-- O segredo do webhook fica no Vault, nunca no corpo da função.

-- Segredo compartilhado: o script de aplicação substitui o placeholder.
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'site_webhook_secret') then
    perform vault.create_secret('__SITE_WEBHOOK_SECRET__', 'site_webhook_secret', 'x-erp-secret do webhook nzgroup.com.br/api/nz/webhook');
  end if;
end $$;

create or replace function public.site_notificar_sync()
returns void
language plpgsql
security definer
set search_path = public, vault, net
as $$
declare
  segredo text;
begin
  select decrypted_secret into segredo from vault.decrypted_secrets where name = 'site_webhook_secret' limit 1;
  if segredo is null then
    return;
  end if;
  perform net.http_post(
    url     := 'https://www.nzgroup.com.br/api/nz/webhook',
    headers := jsonb_build_object('content-type', 'application/json', 'x-erp-secret', segredo),
    body    := jsonb_build_object('origem', 'nzerp', 'em', now()),
    timeout_milliseconds := 5000
  );
end;
$$;

comment on function public.site_notificar_sync() is
  'Avisa o site NZ que produto/preço/estoque mudou. Melhor esforço: o pg_cron e o cron da Vercel recuperam o que se perder.';

create or replace function public.trg_site_notificar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.site_notificar_sync();
  return null;
end;
$$;

drop trigger if exists trg_site_master_catalog on public.master_catalog;
create trigger trg_site_master_catalog
  after insert or update or delete on public.master_catalog
  for each statement execute function public.trg_site_notificar();

drop trigger if exists trg_site_pricing on public.pricing_engineering;
create trigger trg_site_pricing
  after insert or update or delete on public.pricing_engineering
  for each statement execute function public.trg_site_notificar();

drop trigger if exists trg_site_inventory on public.inventory;
create trigger trg_site_inventory
  after insert or update or delete on public.inventory
  for each statement execute function public.trg_site_notificar();

-- Cadência de 5 minutos. Idempotente: remove antes de agendar.
do $$
begin
  perform cron.unschedule(jobid) from cron.job where jobname = 'site-sync-5min';
  perform cron.schedule('site-sync-5min', '*/5 * * * *', $cron$ select public.site_notificar_sync(); $cron$);
end $$;

notify pgrst, 'reload schema';
