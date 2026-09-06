-- Cancelar, pelo site, um pedido que o cliente ainda não pagou.
--
-- Por que precisa existir no ERP: quem manda no status do pedido é o orçamento
-- daqui (`quotes`), e o sync do site espelha esse status a cada 5 minutos. Um
-- "cancelado" gravado só no site voltaria a ABERTO no ciclo seguinte — o
-- cliente veria o cancelamento se desfazer sozinho.
--
-- Regra conservadora, de propósito: só cancela orçamento que ainda não entrou
-- na operação. APROVADO, FATURADO, ENVIADO e ENTREGUE NÃO são canceláveis por
-- aqui — a essa altura já houve separação, nota ou coleta, e desfazer isso é
-- decisão de vendedor, não de botão no site.

create or replace function public.site_cancelar_pedido(p_site_pedido_id uuid, p_motivo text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id      uuid;
  v_num     int;
  v_status  text;
begin
  if p_site_pedido_id is null then
    raise exception 'site_pedido_id obrigatório';
  end if;

  select id, quote_number, status
    into v_id, v_num, v_status
  from public.quotes
  where site_pedido_id = p_site_pedido_id
  limit 1;

  if v_id is null then
    return jsonb_build_object('ok', false, 'motivo', 'nao-encontrado');
  end if;

  if v_status = 'CANCELADO' then
    -- Idempotente: o site pode repetir a chamada se a resposta se perder.
    return jsonb_build_object('ok', true, 'quote_number', v_num, 'status', v_status, 'repetido', true);
  end if;

  if v_status not in ('RASCUNHO', 'ABERTO', 'AGUARDANDO', 'DADOS_INCOMPLETOS', 'NAO_APROVADO') then
    return jsonb_build_object('ok', false, 'motivo', 'fase-avancada', 'status', v_status, 'quote_number', v_num);
  end if;

  update public.quotes
     set status = 'CANCELADO',
         notes = concat_ws(
           E'\n',
           nullif(notes, ''),
           'CANCELADO PELO CLIENTE NO SITE em ' || to_char(now() at time zone 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI')
             || case when nullif(trim(coalesce(p_motivo, '')), '') is not null then ' — ' || trim(p_motivo) else '' end
         ),
         updated_at = now()
   where id = v_id;

  return jsonb_build_object('ok', true, 'quote_number', v_num, 'status', 'CANCELADO', 'status_anterior', v_status);
end;
$$;

-- Só o servidor do site chama (service_role). A chave pública do ERP abre
-- custo, margem e financeiro — nada disto fica exposto a anon/authenticated.
revoke all on function public.site_cancelar_pedido(uuid, text) from public;
revoke all on function public.site_cancelar_pedido(uuid, text) from anon;
revoke all on function public.site_cancelar_pedido(uuid, text) from authenticated;
grant execute on function public.site_cancelar_pedido(uuid, text) to service_role;
