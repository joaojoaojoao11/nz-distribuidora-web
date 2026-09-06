-- Melhor Envio na cotação de frete. RODAR NO PROJETO DO SITE (uibjmvkvbthzypgozpcs).
--
-- Duas mudanças estruturais:
--
-- 1. `shipping_carriers.slug` tinha um CHECK com a lista fechada de duas
--    transportadoras. Agora aceita 'melhorenvio'.
--
-- 2. O cache de cotação assumia UMA cotação por transportadora — PK
--    (carrier_slug, profile_id, cep_destino, quantidade). O Melhor Envio é
--    intermediador: uma chamada devolve vários serviços (Jadlog .Package,
--    Correios PAC/SEDEX, Azul…), e cada um tem prazo e preço próprios. Sem o
--    serviço na chave, a segunda opção sobrescreveria a primeira e a loja
--    mostraria uma só. `servico` = '' para quem cota uma modalidade só
--    (Jadlog, Gollog), então a chave antiga continua valendo para eles.
--
-- O fator de cubagem 6000 do seed é o divisor aéreo/Correios, usado só pelo
-- nosso `pesoTaxavel`; para o Melhor Envio mandamos as dimensões e o peso REAL,
-- e quem cuba é ele. O número fica ali porque o admin pode querer trocar.
--
-- Aplicada em produção em: 2026-09-06

alter table public.shipping_carriers drop constraint if exists shipping_carriers_slug_check;
alter table public.shipping_carriers
  add constraint shipping_carriers_slug_check
  check (slug in ('jadlog', 'gollog', 'melhorenvio'));

alter table public.shipping_quote_cache add column if not exists servico text not null default '';
alter table public.shipping_quote_cache add column if not exists servico_nome text;
alter table public.shipping_quote_cache add column if not exists transportadora text;

-- Idempotente: só recria a PK se ela ainda não tiver a coluna `servico`.
do $$
declare
  n_cols int;
begin
  select cardinality(conkey) into n_cols
  from pg_constraint
  where conrelid = 'public.shipping_quote_cache'::regclass and contype = 'p';

  if n_cols is null or n_cols < 5 then
    -- A cotação em cache foi feita com o modelo antigo; descartar é mais
    -- barato e mais seguro do que adivinhar o serviço de cada linha.
    delete from public.shipping_quote_cache;
    alter table public.shipping_quote_cache drop constraint if exists shipping_quote_cache_pkey;
    alter table public.shipping_quote_cache
      add primary key (carrier_slug, profile_id, cep_destino, quantidade, servico);
  end if;
end $$;

insert into public.shipping_carriers (slug, nome, ativo, cep_origem, dias_manuseio, modalidade, ordem, config)
values (
  'melhorenvio',
  'Melhor Envio',
  false,
  '04696000',
  1,
  null,
  3,
  '{"fator_cubagem": 6000, "servicos": []}'::jsonb
)
on conflict (slug) do nothing;

notify pgrst, 'reload schema';
