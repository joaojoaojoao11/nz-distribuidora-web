-- ⚠️ RODAR NO PROJETO DO **NZERP** (ipehorttsrvjynnhyzhu), NÃO no do site.
--
-- Contexto: o site (projeto uibjmvkvbthzypgozpcs) precisa refletir o catálogo
-- ativo e o saldo de estoque na LOJA. A leitura acontece server-side, por
-- api/erp/sync.ts na Vercel, usando a service role key do ERP.
--
-- Por que views e não leitura direta das tabelas: o filtro do que pode sair do
-- ERP tem que ser NA ORIGEM. `master_catalog` carrega custo_unitario,
-- preco_venda, price_rolo_min/ideal, price_frac_min/ideal e fornecedor — nada
-- disso pode chegar ao site. Selecionando só as colunas abaixo, nem um bug do
-- lado do site consegue vazar o que nunca foi transferido.
--
-- Nenhuma destas views expõe valor. Se um dia alguém adicionar uma coluna de
-- preço aqui, estará quebrando a premissa do desenho.
--
-- Aplicada em produção em: (preencher ao aplicar)

-- ------------------------------------------------- catálogo ativo do site
create or replace view public.catalogo_site as
select
  mc.sku,
  mc.nome,
  mc.categoria,
  mc.marca,
  mc.active            as ativo,
  mc.largura_l         as largura_m,
  mc.metragem_padrao,
  mc.estoque_minimo,
  mc.updated_at
from public.master_catalog mc
where mc.active = true;

comment on view public.catalogo_site is
  'Recorte público do master_catalog para o site NZ. Sem custo, preço, margem ou fornecedor — o filtro é na origem, de propósito.';

-- -------------------------------------------------------- saldo agregado
--
-- No ERP não existe coluna de saldo por SKU: o saldo é a soma de quant_ml dos
-- LPNs em `inventory`, onde cada LPN é um rolo físico. A quebra por
-- status_rolo é o que permite ao lojista ver "3 rolos fechados + 12 m de
-- ponta" em vez de um total que esconde a diferença.
create or replace view public.estoque_site as
select
  i.sku,
  coalesce(sum(i.quant_ml), 0)                                          as saldo_ml,
  count(*) filter (where i.status_rolo = 'ROLO FECHADO')                as rolos_fechados,
  count(*) filter (where i.status_rolo = 'ROLO ABERTO')                 as rolos_abertos,
  max(i."ultAtuali")                                                    as ultima_movimentacao
from public.inventory i
where i.sku is not null
  and coalesce(i.quant_ml, 0) > 0
group by i.sku;

comment on view public.estoque_site is
  'Saldo agregado por SKU para o site NZ. O ERP guarda um LPN por rolo físico; aqui vira soma e contagem por status.';

-- ---------------------------------------------------- view de conveniência
create or replace view public.catalogo_estoque_site as
select
  c.sku,
  c.nome,
  c.categoria,
  c.marca,
  c.ativo,
  c.largura_m,
  c.metragem_padrao,
  c.estoque_minimo,
  c.updated_at,
  coalesce(e.saldo_ml, 0)       as saldo_ml,
  coalesce(e.rolos_fechados, 0) as rolos_fechados,
  coalesce(e.rolos_abertos, 0)  as rolos_abertos
from public.catalogo_site c
left join public.estoque_site e on e.sku = c.sku;

comment on view public.catalogo_estoque_site is
  'É esta view que api/erp/sync.ts consome. Uma leitura só, já com o saldo junto.';

-- ------------------------------------------------- detalhe por LPN (admin)
--
-- Só o papel `admin` do site vê isto, e a leitura é AO VIVO — não é espelhada.
-- Espelhar LPN significaria replicar uma linha por rolo físico a cada 5
-- minutos, para um dado que meia dúzia de pessoas consulta esporadicamente.
-- Ler na hora é mais barato e sempre correto.
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
  i."companyId"   as empresa_id,
  i."ultAtuali"   as ultima_atualizacao
from public.inventory i
where i.sku is not null
  and coalesce(i.quant_ml, 0) > 0;

comment on view public.estoque_lpn_site is
  'Detalhe por rolo físico, para o painel admin do site. Sem custo_unitario — o financeiro não sai do ERP.';

-- ------------------------------------------------------------------ NOTA
--
-- Estas views herdam as permissões das tabelas base. O NZERP hoje opera com
-- policies `FOR ALL TO public`, então elas também ficam legíveis pela chave
-- anônima do ERP. Isso NÃO é uma decisão desta migração — é o estado atual do
-- projeto, e o desenho da integração assume isso ao nunca colocar chave do ERP
-- no bundle do site.
--
-- Recomendação separada, fora do escopo da LOJA: revisar a postura de RLS do
-- NZERP. Um role read-only dedicado, com GRANT SELECT apenas nestas três
-- views, seria o próximo passo natural:
--
--   create role site_readonly nologin;
--   grant usage on schema public to site_readonly;
--   grant select on public.catalogo_site, public.estoque_site,
--                   public.catalogo_estoque_site to site_readonly;
