-- O site passa a mostrar e cobrar o preço de ATACADO.
-- RODAR NO PROJETO DO SITE (uibjmvkvbthzypgozpcs).
--
-- Plano: docs/PLANO_SELECOES_PRECO_ATACADO.md (Fase 2).
--
-- O QUE ESTAVA ERRADO. A view `precos_site` do ERP entrega dois pares por SKU e
-- os apelidos enganam (ver migrations/erp/20260906_site_views.sql):
--   preco_rolo      = preco_venda_ideal_atacado  → "Preço V" no ERP = VAREJO
--   preco_rolo_min  = preco_venda_min_atacado    → "Preço A" no ERP = ATACADO
-- O sync copiava 1:1, então `erp_produtos.preco_rolo` era o VAREJO — e o site
-- inteiro (card, página, carrinho, checkout) cobrava a tabela publicada. O
-- caderno de preços da NZ diz o contrário: "a tabela publicada é o varejo; o
-- preço praticado é o atacado".
--
-- O QUE MUDA. `preco_rolo`/`preco_metro` passam a ser o ATACADO, para todos os
-- papéis. O varejo vai para as colunas novas e só o admin recebe, como
-- referência de quanto está descontando.
--
-- ORDEM DE APLICAÇÃO (importa). Esta migração e o deploy do sync novo têm que
-- acontecer na mesma janela:
--   · migração antes do deploy → o sync ANTIGO continua gravando varejo em
--     preco_rolo até o deploy sair. Não quebra nada (ele ignora as colunas
--     novas) e o sync novo conserta na primeira rodada.
--   · deploy antes da migração → o sync novo tenta gravar colunas que não
--     existem e FALHA. Por isso: aplicar isto primeiro.
--
-- Aplicada em produção em: (preencher)

alter table public.erp_produtos
  add column if not exists preco_rolo_varejo  numeric(12,2),
  add column if not exists preco_metro_varejo numeric(12,2);

comment on column public.erp_produtos.preco_rolo is
  'ATACADO do rolo fechado (preco_venda_min_atacado do ERP). É o preço que o site mostra e cobra.';
comment on column public.erp_produtos.preco_metro is
  'ATACADO do metro linear (preco_venda_min_fracionado do ERP). É o preço que o site mostra e cobra.';
comment on column public.erp_produtos.preco_rolo_min is
  'ATACADO cru do ERP. Igual a preco_rolo, exceto quando o ERP não precificou (aí é zero/nulo e preco_rolo cai no varejo).';
comment on column public.erp_produtos.preco_metro_min is
  'ATACADO cru do ERP. Igual a preco_metro, exceto quando o ERP não precificou.';
comment on column public.erp_produtos.preco_rolo_varejo is
  'VAREJO / tabela publicada (preco_venda_ideal_atacado). Só o papel admin recebe.';
comment on column public.erp_produtos.preco_metro_varejo is
  'VAREJO / tabela publicada (preco_venda_ideal_fracionado). Só o papel admin recebe.';

-- Backfill. A guarda `preco_rolo_varejo is null` faz isto rodar UMA vez: depois
-- do primeiro sync novo as colunas já estão preenchidas e uma segunda execução
-- não faz nada. Sem ela, rodar duas vezes trocaria varejo por atacado de novo e
-- de novo (o "duplo swap").
--
-- `nullif(x, 0)`: atacado zerado no ERP é cadastro incompleto, não preço — nesse
-- caso o preço segue sendo o varejo, e o sync abre uma ocorrência na Central.
update public.erp_produtos
set preco_rolo_varejo  = preco_rolo,
    preco_metro_varejo = preco_metro,
    preco_rolo  = coalesce(nullif(preco_rolo_min, 0),  preco_rolo),
    preco_metro = coalesce(nullif(preco_metro_min, 0), preco_metro)
where preco_rolo_varejo is null
  and preco_metro_varejo is null;
