-- Pagamento online do site (Asaas) → orçamento no NZERP.
-- Projeto: ipehorttsrvjynnhyzhu (ERP). Cópia em 2NZERPUPDATE30/supabase/migrations/.
--
-- Quando o cliente paga no site (Pix, boleto compensado ou cartão aprovado), o
-- site chama site_confirmar_pagamento com o resumo. Aqui:
--   · o orçamento sai de ABERTO/AGUARDANDO/DADOS_INCOMPLETOS para APROVADO
--     (o vendedor só fatura; não precifica nem cobra);
--   · payment_method/payment_condition ficam legíveis na tela do orçamento;
--   · as colunas pagamento_* guardam o rastro (id da cobrança no Asaas,
--     valor líquido, parcelas, quando pagou) para a conferência do financeiro.
--
-- NÃO cria título em contas_receber: o faturamento continua criando os
-- títulos como hoje; o financeiro vê "PAGO ONLINE" no orçamento e baixa. A
-- baixa automática do título pelo pagamento do site fica para uma próxima
-- rodada, depois de estudar o FaturamentoModule (que emite cobrança Asaas
-- para conta 'Asaas' — não pode cobrar duas vezes).
--
-- SECURITY DEFINER, só service_role: o site chama com a chave de serviço.

alter table public.quotes
  add column if not exists pagamento_status text,
  add column if not exists pagamento_forma text,
  add column if not exists pagamento_asaas_id text,
  add column if not exists pagamento_valor numeric,
  add column if not exists pagamento_valor_liquido numeric,
  add column if not exists pagamento_parcelas int,
  add column if not exists pago_em timestamptz;

comment on column public.quotes.pagamento_status is 'pago = pagamento online confirmado pelo Asaas (site). Null = fluxo normal.';

create or replace function public.site_confirmar_pagamento(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_site_id uuid := nullif(p->>'site_pedido_id', '')::uuid;
  v_quote   public.quotes%rowtype;
  v_forma   text := coalesce(p->>'forma', '');
  v_method  text;
  v_parc    int := coalesce((p->>'parcelas')::int, 1);
  v_valor   numeric := (p->>'valor')::numeric;
  v_nota    text;
begin
  if v_site_id is null then
    raise exception 'site_pedido_id obrigatório';
  end if;

  select * into v_quote from public.quotes where site_pedido_id = v_site_id limit 1;
  if not found then
    raise exception 'orçamento do pedido % não encontrado', v_site_id;
  end if;

  -- Idempotente: o webhook pode chegar duas vezes.
  if v_quote.pagamento_status = 'pago' then
    return jsonb_build_object('quote_id', v_quote.id, 'quote_number', v_quote.quote_number, 'repetido', true);
  end if;

  v_method := case v_forma when 'PIX' then 'PIX' when 'BOLETO' then 'BOLETO' when 'CREDIT_CARD' then 'CARTAO' else v_forma end;
  v_nota := format(
    '[PAGO ONLINE via Asaas em %s — %s%s — R$ %s%s%s]',
    to_char(coalesce((p->>'pago_em')::timestamptz, now()) at time zone 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI'),
    v_method,
    case when v_parc > 1 then ' ' || v_parc || 'x' else '' end,
    to_char(coalesce(v_valor, v_quote.total, 0), 'FM999G999G990D00'),
    case when p->>'asaas_payment_id' is not null then ' — cobrança ' || (p->>'asaas_payment_id') else '' end,
    case when coalesce(p->>'cartao', '') <> '' then ' — cartão ' || (p->>'cartao') else '' end
  );

  update public.quotes set
    status = case when status in ('ABERTO', 'AGUARDANDO', 'DADOS_INCOMPLETOS') then 'APROVADO' else status end,
    payment_method = coalesce(v_method, payment_method),
    payment_condition = 'PAGO ONLINE (Asaas)' || case when v_parc > 1 then ' ' || v_parc || 'x' else '' end,
    pagamento_status = 'pago',
    pagamento_forma = v_forma,
    pagamento_asaas_id = p->>'asaas_payment_id',
    pagamento_valor = v_valor,
    pagamento_valor_liquido = (p->>'valor_liquido')::numeric,
    pagamento_parcelas = v_parc,
    pago_em = coalesce((p->>'pago_em')::timestamptz, now()),
    notes = case when coalesce(notes, '') = '' then v_nota else notes || E'\n' || v_nota end,
    updated_at = now()
  where id = v_quote.id;

  return jsonb_build_object('quote_id', v_quote.id, 'quote_number', v_quote.quote_number, 'status', 'APROVADO');
end;
$$;

revoke all on function public.site_confirmar_pagamento(jsonb) from public;
revoke all on function public.site_confirmar_pagamento(jsonb) from anon;
revoke all on function public.site_confirmar_pagamento(jsonb) from authenticated;
grant execute on function public.site_confirmar_pagamento(jsonb) to service_role;

notify pgrst, 'reload schema';
