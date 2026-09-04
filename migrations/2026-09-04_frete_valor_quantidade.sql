-- Migração: cotação de frete real (Jadlog) — valor, quantidade e cubagem.
--
-- Contexto: a doc oficial da Jadlog (Integração API v2.3, ago/2025) chegou e o
-- simulador de frete devolve PRAZO e VALOR no mesmo payload
-- (POST /embarcador/api/frete/valor → frete[0].prazo e frete[0].vltotal).
-- Decisão do cliente: o VALOR passa a ser exibido, mas SÓ para usuários
-- administrativos. Lojista, cliente final e visitante continuam vendo apenas
-- dias úteis — a regra é aplicada no servidor, em api/_lib/handlers/prazo.ts,
-- com o papel lido do banco a partir do JWT.
--
-- Duas mudanças estruturais:
--   1. QUANTIDADE entra na chave do cache. O visitante escolhe quantos volumes
--      quer cotar; sem isso, a cotação de 1 rolo seria servida como se fosse a
--      de 10 pelos 7 dias de TTL.
--   2. VALOR DECLARADO por perfil. A Jadlog exige `vldeclarado` (valor de NF)
--      na cotação e ele afeta o seguro embutido no frete. É um valor comercial
--      aproximado, informado pelo admin — preço e custo reais continuam sem
--      sair do ERP.
--
-- Rodar DEPOIS de migrations/2026-09-03_logistica_transportadoras.sql, no SQL
-- Editor do Supabase (projeto uibjmvkvbthzypgozpcs).
-- Aplicada em produção em: 2026-09-04 (projeto uibjmvkvbthzypgozpcs, via MCP)

-- ------------------------------------------------- perfis: valor declarado

alter table public.shipping_profiles
  add column if not exists valor_declarado numeric(10,2) not null default 100;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'shipping_profiles_valor_declarado_check'
  ) then
    alter table public.shipping_profiles
      add constraint shipping_profiles_valor_declarado_check check (valor_declarado > 0);
  end if;
end $$;

comment on column public.shipping_profiles.valor_declarado is
  'Valor de NF aproximado de UMA unidade desta embalagem, em BRL. Enviado à transportadora como vldeclarado (multiplicado pela quantidade). Informação comercial aproximada — não é preço de venda e não vem do ERP.';

-- ----------------------------------------------- cache: quantidade e valor

alter table public.shipping_quote_cache
  add column if not exists quantidade int not null default 1;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'shipping_quote_cache_quantidade_check'
  ) then
    alter table public.shipping_quote_cache
      add constraint shipping_quote_cache_quantidade_check check (quantidade >= 1);
  end if;
end $$;

alter table public.shipping_quote_cache
  add column if not exists valor_frete numeric(10,2);

comment on column public.shipping_quote_cache.valor_frete is
  'Valor total do frete devolvido pela transportadora, em BRL. Fica no servidor: só é serializado para papel admin.';

-- A chave primária passa a incluir a quantidade. Sem isso a cotação de 1 volume
-- responderia por todas as quantidades até o cache expirar (7 dias).
do $$
begin
  if exists (
    select 1
      from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      join pg_namespace n on n.oid = t.relnamespace
     where c.conname = 'shipping_quote_cache_pkey'
       and t.relname = 'shipping_quote_cache'
       and n.nspname = 'public'
       and array_length(c.conkey, 1) = 3
  ) then
    alter table public.shipping_quote_cache drop constraint shipping_quote_cache_pkey;
    alter table public.shipping_quote_cache
      add constraint shipping_quote_cache_pkey
      primary key (carrier_slug, profile_id, cep_destino, quantidade);
  end if;
end $$;

-- Cache é derivado e descartável: o que existir aqui foi gravado pelo adapter
-- simulado (LOGISTICA_MODO=mock) e não tem valor de frete. Limpar agora evita
-- servir prazo simulado por até 7 dias depois de ligar a transportadora real.
-- O painel admin também ganhou um botão para repetir isso quando necessário.
delete from public.shipping_quote_cache;

-- --------------------------------------------------- fator de cubagem

-- A Jadlog cobra pelo MAIOR peso entre o real e o cubado, mas o divisor de
-- cubagem é do contrato e não está publicado na doc v2.3. 3333 (≈300 kg/m³) é o
-- padrão rodoviário de mercado; modalidades aéreas costumam usar 6000. O número
-- definitivo vem da franquia junto com o token — trocar aqui não exige deploy.
update public.shipping_carriers
   set config = config || '{"fator_cubagem": 3333}'::jsonb
 where slug = 'jadlog'
   and not (config ? 'fator_cubagem');

update public.shipping_carriers
   set config = config || '{"fator_cubagem": 6000}'::jsonb
 where slug = 'gollog'
   and not (config ? 'fator_cubagem');
