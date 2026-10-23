-- CNPJ com letras (Receita, desde julho de 2026) na ponte site ↔ NZERP — Fase 1 do plano
-- (docs/PLANO_CNPJ_ALFANUMERICO.md). Cópia em nz-distribuidora-web/migrations/erp/.
--
-- As 12 primeiras posições do CNPJ podem ser letras maiúsculas ou números; os 2 verificadores continuam
-- números (ex.: 12.ABC.345/01DE-35). O ERP tirava "tudo que não é número": o CNPJ novo virava 9 números, o
-- cliente vindo do site nascia sem tipo de pessoa e dois CNPJs que só diferem nas letras viravam a mesma
-- chave. Agora:
--   · fn_doc_norm mantém as letras (sem pontuação, maiúsculas). Para todo documento que já existe (só
--     números, com ou sem pontuação) o resultado é EXATAMENTE o de antes — o índice único de clientes por
--     documento é refeito por garantia (em 23/10 nenhum cliente tinha letra no documento). De quebra, a
--     checagem de duplicidade do CRM (que usa fn_doc_norm) passa a enxergar o CNPJ com letras.
--   · site_doc_valido confere o verificador com o valor de cada posição = código − 48.
--   · site_consultar_cliente, site_vincular_cliente, site_criar_pedido e site_faixa_cliente comparam e
--     gravam pelo fn_doc_norm (o resto de cada função igual ao que estava no ar em 23/10).
--   · titulos_cliente_site.cliente_documento sai pelo fn_doc_norm.

create or replace function public.fn_doc_norm(p text)
returns text
language sql
immutable parallel safe
as $function$
  select nullif(upper(regexp_replace(coalesce(p, ''), '[^0-9A-Za-z]', '', 'g')), '');
$function$;

reindex index public.clients_doc_norm_unique;

create or replace function public.site_doc_valido(p text)
returns boolean
language plpgsql
immutable
set search_path to 'public'
as $function$
declare
  d text := coalesce(public.fn_doc_norm(p), '');
  s int;
  r int;
  i int;
  pesos1 int[] := array[5,4,3,2,9,8,7,6,5,4,3,2];
  pesos2 int[] := array[6,5,4,3,2,9,8,7,6,5,4,3,2];
begin
  if d ~ '^[0-9]{11}$' then
    if d ~ '^(\d)\1{10}$' then return false; end if;
    s := 0; for i in 1..9 loop s := s + substr(d, i, 1)::int * (11 - i); end loop;
    r := (s * 10) % 11; if r = 10 then r := 0; end if;
    if r <> substr(d, 10, 1)::int then return false; end if;
    s := 0; for i in 1..10 loop s := s + substr(d, i, 1)::int * (12 - i); end loop;
    r := (s * 10) % 11; if r = 10 then r := 0; end if;
    return r = substr(d, 11, 1)::int;
  elsif d ~ '^[0-9A-Z]{12}[0-9]{2}$' then
    -- CNPJ, com ou sem letras: cada posição vale o código do caractere − 48 (número vale ele mesmo).
    if d ~ '^(.)\1{13}$' then return false; end if;
    s := 0; for i in 1..12 loop s := s + (ascii(substr(d, i, 1)) - 48) * pesos1[i]; end loop;
    r := s % 11; r := case when r < 2 then 0 else 11 - r end;
    if r <> substr(d, 13, 1)::int then return false; end if;
    s := 0; for i in 1..13 loop s := s + (ascii(substr(d, i, 1)) - 48) * pesos2[i]; end loop;
    r := s % 11; r := case when r < 2 then 0 else 11 - r end;
    return r = substr(d, 14, 1)::int;
  end if;
  return false;
end;
$function$;

CREATE OR REPLACE FUNCTION public.site_consultar_cliente(p_doc text, p_email text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_doc text := coalesce(public.fn_doc_norm(p_doc), '');
  c     public.clients%rowtype;
begin
  if v_doc <> '' then
    select * into c from public.clients
     where coalesce(public.fn_doc_norm(cpf_cnpj), '') = v_doc
     order by created_at limit 1;
  end if;
  if c.id is null and coalesce(p_email, '') <> '' then
    select * into c from public.clients where lower(email) = lower(p_email) order by created_at limit 1;
  end if;
  if c.id is null then
    return null;
  end if;

  -- Lista branca de campos. Nada de limite_de_credito, lista_de_preco,
  -- vendedor ou observacoes.
  return jsonb_build_object(
    'id', c.id,
    'nome', c.nome,
    'fantasia', c.fantasia,
    'tipo_pessoa', c.tipo_pessoa,
    'email', c.email,
    'telefone', coalesce(nullif(c.celular, ''), c.telefone),
    'cep', c.cep,
    'endereco', c.endereco,
    'numero', c.numero,
    'complemento', c.complemento,
    'bairro', c.bairro,
    'cidade', c.cidade,
    'estado', c.estado,
    'inscricao_estadual', c.inscricao_estadual,
    'ativo', coalesce(lower(c.situacao) = 'ativo', false),
    'site_user_id', c.site_user_id
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.site_vincular_cliente(p_site_user_id uuid, p jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_doc       text := coalesce(public.fn_doc_norm(p->>'cpf_cnpj'), '');
  v_client_id uuid;
  v_criou     boolean := false;
begin
  if v_doc <> '' then
    select id into v_client_id from public.clients
     where coalesce(public.fn_doc_norm(cpf_cnpj), '') = v_doc
     order by created_at limit 1;
  end if;
  if v_client_id is null and coalesce(p->>'email', '') <> '' then
    select id into v_client_id from public.clients where lower(email) = lower(p->>'email') limit 1;
  end if;

  if v_client_id is null then
    insert into public.clients (
      nome, cpf_cnpj, tipo_pessoa, email, telefone,
      endereco, numero, complemento, bairro, cidade, estado, cep,
      client_type, fantasia, inscricao_estadual, vendedor, observacoes, situacao, site_user_id
    ) values (
      p->>'nome', nullif(v_doc, ''),
      case when length(v_doc) = 14 then 'J' when length(v_doc) = 11 then 'F' else null end,
      p->>'email', p->>'telefone',
      p->>'endereco', p->>'numero', p->>'complemento', p->>'bairro', p->>'cidade', p->>'uf', p->>'cep',
      'Cliente', p->>'empresa', p->>'ie', 'SITE',
      'Cadastro criado pelo site nzgroup.com.br', 'Ativo', p_site_user_id
    )
    returning id into v_client_id;
    v_criou := true;
  else
    -- Completa o que está vazio; nunca sobrescreve o que a equipe digitou.
    update public.clients set
      site_user_id = coalesce(site_user_id, p_site_user_id),
      email        = coalesce(nullif(email, ''), p->>'email'),
      telefone     = coalesce(nullif(telefone, ''), p->>'telefone'),
      endereco     = coalesce(nullif(endereco, ''), p->>'endereco'),
      numero       = coalesce(nullif(numero, ''), p->>'numero'),
      complemento  = coalesce(nullif(complemento, ''), p->>'complemento'),
      bairro       = coalesce(nullif(bairro, ''), p->>'bairro'),
      cidade       = coalesce(nullif(cidade, ''), p->>'cidade'),
      estado       = coalesce(nullif(estado, ''), p->>'uf'),
      cep          = coalesce(nullif(cep, ''), p->>'cep'),
      fantasia     = coalesce(nullif(fantasia, ''), p->>'empresa'),
      inscricao_estadual = coalesce(nullif(inscricao_estadual, ''), p->>'ie')
    where id = v_client_id;
  end if;

  return jsonb_build_object('client_id', v_client_id, 'criou', v_criou);
end;
$function$;

CREATE OR REPLACE FUNCTION public.site_criar_pedido(p jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_doc        text := coalesce(public.fn_doc_norm(p->>'cpf_cnpj'), '');
  v_client_id  uuid;
  v_opp_id     uuid;
  v_quote_id   uuid;
  v_num        int;
  v_itens      jsonb := coalesce(p->'items', '[]'::jsonb);
  v_total      numeric := coalesce((p->>'total')::numeric, 0);
  v_frete      numeric := coalesce((p->>'shipping_cost')::numeric, 0);
  v_desconto   numeric := round(coalesce((p->>'desconto_cupom')::numeric, 0), 2);
  v_cashback   numeric := round(coalesce((p->>'cashback_usado')::numeric, 0), 2);
  v_origem     text := nullif(p->>'incentivo_origem', '');
  v_faixa      text := nullif(trim(coalesce(p->>'faixa_site', '')), '');
  v_subtotal   numeric;
  v_soma_desc  numeric;
  v_site_id    uuid := nullif(p->>'site_pedido_id', '')::uuid;
  v_site_user  uuid := nullif(p->>'site_user_id', '')::uuid;
begin
  if v_site_id is null then
    raise exception 'site_pedido_id obrigatório';
  end if;
  if jsonb_array_length(v_itens) = 0 then
    raise exception 'pedido sem itens';
  end if;
  if v_desconto < 0 or v_cashback < 0 then
    raise exception 'desconto_cupom e cashback_usado não podem ser negativos';
  end if;

  -- Soma dos itens a preço cheio e do rateio do desconto. O site fecha o
  -- rateio em centavos; se não fechar, é bug e o pedido não entra errado.
  select coalesce(sum((i->>'total')::numeric), 0),
         coalesce(sum(coalesce((i->>'desconto')::numeric, 0)), 0)
    into v_subtotal, v_soma_desc
    from jsonb_array_elements(v_itens) i;
  v_subtotal := round(v_subtotal, 2);
  v_soma_desc := round(v_soma_desc, 2);
  if abs(v_soma_desc - v_desconto) > 0.01 then
    raise exception 'desconto do cupom (%) não fecha com o rateio por item (%)', v_desconto, v_soma_desc;
  end if;
  if v_desconto > 0 and abs((v_subtotal - v_desconto + v_frete) - v_total) > 0.05 then
    raise exception 'total do pedido (%) não fecha: itens % - desconto % + frete %', v_total, v_subtotal, v_desconto, v_frete;
  end if;

  -- Chamadas simultâneas do MESMO pedido do site (retry enquanto a 1ª ainda roda)
  -- esperam uma pela outra: a 2ª só confere depois do commit da 1ª e acha o pedido.
  perform pg_advisory_xact_lock(hashtext('site_criar_pedido:' || v_site_id::text));

  -- Idempotência: o site pode repetir a chamada se a resposta se perder.
  select q.id, q.quote_number, o.client_id into v_quote_id, v_num, v_client_id
    from public.quotes q
    left join public.crm_opportunities o on o.id = q.opportunity_id
   where q.site_pedido_id = v_site_id
   limit 1;
  if v_quote_id is not null then
    return jsonb_build_object('quote_id', v_quote_id, 'quote_number', v_num, 'client_id', v_client_id, 'repetido', true);
  end if;

  -- ------------------------------------------------------- cliente
  if v_doc <> '' then
    select id into v_client_id
    from public.clients
    where coalesce(public.fn_doc_norm(cpf_cnpj), '') = v_doc
    order by created_at
    limit 1;
  end if;
  if v_client_id is null and coalesce(p->>'email', '') <> '' then
    select id into v_client_id from public.clients where lower(email) = lower(p->>'email') limit 1;
  end if;
  if v_client_id is null then
    insert into public.clients (
      nome, cpf_cnpj, tipo_pessoa, email, telefone,
      endereco, numero, complemento, bairro, cidade, estado, cep,
      client_type, fantasia, inscricao_estadual, vendedor, observacoes, situacao, site_user_id, faixa_preco_site
    ) values (
      p->>'nome',
      nullif(v_doc, ''),
      case when length(v_doc) = 14 then 'J' when length(v_doc) = 11 then 'F' else null end,
      p->>'email', p->>'telefone',
      p->>'endereco', p->>'numero', p->>'complemento', p->>'bairro', p->>'cidade', p->>'uf', p->>'cep',
      'Cliente', p->>'empresa', p->>'ie', 'SITE',
      'Cadastro criado pelo site nzgroup.com.br', 'Ativo', v_site_user, v_faixa
    )
    returning id into v_client_id;
  else
    -- Cliente antigo: aproveita o que o site trouxe e o ERP ainda não tinha.
    -- A faixa do site é a verdade do site: sobrescreve quando vem preenchida.
    update public.clients set
      site_user_id = coalesce(site_user_id, v_site_user),
      email        = coalesce(nullif(email, ''), p->>'email'),
      telefone     = coalesce(nullif(telefone, ''), p->>'telefone'),
      endereco     = coalesce(nullif(endereco, ''), p->>'endereco'),
      numero       = coalesce(nullif(numero, ''), p->>'numero'),
      complemento  = coalesce(nullif(complemento, ''), p->>'complemento'),
      bairro       = coalesce(nullif(bairro, ''), p->>'bairro'),
      cidade       = coalesce(nullif(cidade, ''), p->>'cidade'),
      estado       = coalesce(nullif(estado, ''), p->>'uf'),
      cep          = coalesce(nullif(cep, ''), p->>'cep'),
      faixa_preco_site = coalesce(v_faixa, faixa_preco_site)
    where id = v_client_id;
  end if;

  -- ---------------------------------------------------- oportunidade
  -- O card do cliente, ou o prospect com o mesmo CPF/CNPJ (adotado) — nunca um
  -- segundo card (duplicidade de cadastro, 24/09/2026).
  v_opp_id := public.fn_crm_adotar_prospect(v_client_id, 'SITE');
  if v_opp_id is null then
    insert into public.crm_opportunities (client_id, status, notes, prospect_name, prospect_phone, prospect_email, prospect_document)
    values (v_client_id, 'QUALIFICADO', 'Criada pelo site nzgroup.com.br', p->>'nome', p->>'telefone', p->>'email', nullif(v_doc, ''))
    returning id into v_opp_id;
  end if;

  -- ------------------------------------------------------- pedido
  -- subtotal = itens a preço cheio; total = o que o cliente paga. É a mesma
  -- convenção do editor do ERP (QuoteModal: total = subtotal + frete − desconto).
  insert into public.quotes (
    opportunity_id, client_name, company_name, cpf_cnpj, address_full, phone, email,
    salesperson, items, shipping_type, shipping_cost, subtotal, total, notes, status,
    origem, site_pedido_id, site_user_email, cupom, afiliado_codigo,
    desconto_cupom, cashback_usado, incentivo_origem
  ) values (
    v_opp_id, p->>'nome', nullif(p->>'empresa', ''), nullif(p->>'cpf_cnpj', ''), p->>'endereco_completo', p->>'telefone', p->>'email',
    'SITE', v_itens, coalesce(nullif(p->>'shipping_type', ''), 'FOB'), v_frete, v_subtotal, v_total, p->>'notes', 'ABERTO',
    'SITE', v_site_id, p->>'email', nullif(p->>'cupom', ''), nullif(p->>'afiliado_codigo', ''),
    v_desconto, v_cashback, v_origem
  )
  returning id, quote_number into v_quote_id, v_num;

  return jsonb_build_object('quote_id', v_quote_id, 'quote_number', v_num, 'client_id', v_client_id, 'opportunity_id', v_opp_id);
end;
$function$;

CREATE OR REPLACE FUNCTION public.site_faixa_cliente(p jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user  uuid := nullif(p->>'site_user_id', '')::uuid;
  v_doc   text := coalesce(public.fn_doc_norm(p->>'cpf_cnpj'), '');
  v_email text := lower(trim(coalesce(p->>'email', '')));
  v_faixa text := nullif(trim(coalesce(p->>'faixa', '')), '');
  v_id    uuid;
begin
  if v_user is not null then
    select id into v_id from public.clients where site_user_id = v_user order by created_at limit 1;
  end if;
  if v_id is null and v_doc <> '' then
    select id into v_id from public.clients
     where coalesce(public.fn_doc_norm(cpf_cnpj), '') = v_doc
     order by created_at limit 1;
  end if;
  if v_id is null and v_email <> '' then
    select id into v_id from public.clients where lower(email) = v_email order by created_at limit 1;
  end if;
  if v_id is null then
    return jsonb_build_object('client_id', null, 'atualizado', false);
  end if;
  update public.clients
     set faixa_preco_site = v_faixa,
         site_user_id = coalesce(site_user_id, v_user)
   where id = v_id;
  return jsonb_build_object('client_id', v_id, 'atualizado', true);
end;
$function$;

create or replace view public.titulos_cliente_site as
SELECT t.id,
    o.client_id,
        CASE
            WHEN site_doc_valido(t.cliente_cpf_cnpj) THEN fn_doc_norm(t.cliente_cpf_cnpj)
            ELSE NULL::text
        END AS cliente_documento,
    t.numero_documento,
    t.parcela_numero,
    t.parcela_total,
    t.vencimento,
    t.data_emissao,
    t.data_pagamento,
    t.valor,
    t.valor_pago,
    t.valor_liquidado,
    round((COALESCE(t.valor, (0)::numeric) - COALESCE(t.valor_liquidado, (0)::numeric)), 2) AS saldo,
    lower(t.status) AS status,
    t.forma_pagamento,
    t.quote_id,
    t.quote_number,
    t.nf_numero,
    ((t.asaas_payment_id IS NOT NULL) AND (COALESCE(t.asaas_status, ''::text) <> ALL (ARRAY['CANCELLED'::text, 'RECEIVED'::text, 'CONFIRMED'::text, 'RECEIVED_IN_CASH'::text, 'REFUNDED'::text]))) AS cobranca_viva,
    t.asaas_invoice_url,
    t.asaas_bank_slip_url,
    t.asaas_pix_payload,
    t.asaas_pix_expiracao,
    t.asaas_linha_digitavel,
    ((lower(COALESCE(t.status_cobranca, ''::text)) = 'acordo'::text) OR (t.cession_id IS NOT NULL) OR (lower(t.status) = 'em_antecipacao'::text)) AS combinado,
    ((lower(t.status) = ANY (ARRAY['pendente'::text, 'parcial'::text])) AND ((upper(COALESCE(t.gateway, ''::text)) = 'ASAAS'::text) OR (lower(TRIM(BOTH FROM COALESCE(t.meio_pagamento, ''::text))) = 'asaas'::text)) AND (t.remessa_id IS NULL) AND (COALESCE(t.remessa_staged, false) = false) AND (COALESCE(t.cadastrado_manual_banco, false) = false) AND (NOT ((lower(COALESCE(t.status_cobranca, ''::text)) = 'acordo'::text) OR (t.cession_id IS NOT NULL) OR (lower(t.status) = 'em_antecipacao'::text))) AND (COALESCE(t.boleto_descartado, false) = false) AND (COALESCE(upper(q.status), ''::text) <> 'CANCELADO'::text)) AS pagavel
   FROM ((contas_receber t
     LEFT JOIN quotes q ON ((q.id = t.quote_id)))
     LEFT JOIN crm_opportunities o ON ((o.id = q.opportunity_id)))
  WHERE ((t.deleted_at IS NULL) AND (lower(t.status) <> 'cancelado'::text));
