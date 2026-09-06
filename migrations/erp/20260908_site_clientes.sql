-- Vínculo entre a conta do site (nzgroup.com.br) e a base de clientes do ERP.
--
-- Contexto: nz-distribuidora-web/docs/PLANO_CADASTRO_CLIENTES_E_COMPRA.md (4.5).
--
-- O que muda:
--   1. `clients.site_user_id` — o ERP passa a saber quem tem conta no site.
--   2. `site_consultar_cliente` — o site pergunta "este CNPJ já é cliente?" sem
--      fazer SELECT direto na tabela: a RPC devolve só os campos públicos, então
--      limite de crédito, lista de preço, vendedor e observações não têm como
--      escapar.
--   3. `site_vincular_cliente` — cria/atualiza o cliente a partir do cadastro do
--      site, antes mesmo do primeiro pedido, para o lojista aprovado já aparecer
--      no CRM.
--   4. `site_criar_pedido` passa a COMPLETAR o cadastro do cliente existente
--      (telefone, endereço) quando o campo está vazio no ERP e o site tem o
--      dado. Nunca sobrescreve o que já está preenchido: o ERP continua sendo a
--      fonte da verdade do que a equipe digitou.
--
-- Todas as funções são SECURITY DEFINER e só o service_role executa — o site
-- chama pelo backend, nunca pelo navegador.

alter table public.clients add column if not exists site_user_id uuid;
create index if not exists clients_site_user_idx on public.clients (site_user_id);
comment on column public.clients.site_user_id is 'Conta em nzgroup.com.br (user_profiles.id) deste cliente, quando existe.';

-- ------------------------------------------------------------- consulta
create or replace function public.site_consultar_cliente(p_doc text, p_email text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_doc text := regexp_replace(coalesce(p_doc, ''), '\D', '', 'g');
  c     public.clients%rowtype;
begin
  if v_doc <> '' then
    select * into c from public.clients
     where regexp_replace(coalesce(cpf_cnpj, ''), '\D', '', 'g') = v_doc
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
$$;
revoke all on function public.site_consultar_cliente(text, text) from public, anon, authenticated;
grant execute on function public.site_consultar_cliente(text, text) to service_role;

-- -------------------------------------------------------------- vínculo
create or replace function public.site_vincular_cliente(p_site_user_id uuid, p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_doc       text := regexp_replace(coalesce(p->>'cpf_cnpj', ''), '\D', '', 'g');
  v_client_id uuid;
  v_criou     boolean := false;
begin
  if v_doc <> '' then
    select id into v_client_id from public.clients
     where regexp_replace(coalesce(cpf_cnpj, ''), '\D', '', 'g') = v_doc
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
$$;
revoke all on function public.site_vincular_cliente(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.site_vincular_cliente(uuid, jsonb) to service_role;

-- ---------------------------------------------------------- pedido v2
-- Igual à versão de 2026-09-06, com duas mudanças: completa o cadastro do
-- cliente existente com o que o site trouxe (só onde está vazio) e devolve
-- `client_id` também no caminho idempotente, para o site guardar o vínculo.
create or replace function public.site_criar_pedido(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_doc        text := regexp_replace(coalesce(p->>'cpf_cnpj', ''), '\D', '', 'g');
  v_client_id  uuid;
  v_opp_id     uuid;
  v_quote_id   uuid;
  v_num        int;
  v_itens      jsonb := coalesce(p->'items', '[]'::jsonb);
  v_total      numeric := coalesce((p->>'total')::numeric, 0);
  v_site_id    uuid := nullif(p->>'site_pedido_id', '')::uuid;
  v_site_user  uuid := nullif(p->>'site_user_id', '')::uuid;
begin
  if v_site_id is null then
    raise exception 'site_pedido_id obrigatório';
  end if;
  if jsonb_array_length(v_itens) = 0 then
    raise exception 'pedido sem itens';
  end if;

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
    where regexp_replace(coalesce(cpf_cnpj, ''), '\D', '', 'g') = v_doc
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
      client_type, fantasia, inscricao_estadual, vendedor, observacoes, situacao, site_user_id
    ) values (
      p->>'nome',
      nullif(v_doc, ''),
      case when length(v_doc) = 14 then 'J' when length(v_doc) = 11 then 'F' else null end,
      p->>'email', p->>'telefone',
      p->>'endereco', p->>'numero', p->>'complemento', p->>'bairro', p->>'cidade', p->>'uf', p->>'cep',
      'Cliente', p->>'empresa', p->>'ie', 'SITE',
      'Cadastro criado pelo site nzgroup.com.br', 'Ativo', v_site_user
    )
    returning id into v_client_id;
  else
    -- Cliente antigo: aproveita o que o site trouxe e o ERP ainda não tinha.
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
      cep          = coalesce(nullif(cep, ''), p->>'cep')
    where id = v_client_id;
  end if;

  -- ---------------------------------------------------- oportunidade
  select id into v_opp_id
  from public.crm_opportunities
  where client_id = v_client_id
  order by updated_at desc nulls last
  limit 1;
  if v_opp_id is null then
    insert into public.crm_opportunities (client_id, status, notes, prospect_name, prospect_phone, prospect_email, prospect_document)
    values (v_client_id, 'QUALIFICADO', 'Criada pelo site nzgroup.com.br', p->>'nome', p->>'telefone', p->>'email', nullif(v_doc, ''))
    returning id into v_opp_id;
  end if;

  -- ------------------------------------------------------- pedido
  insert into public.quotes (
    opportunity_id, client_name, company_name, cpf_cnpj, address_full, phone, email,
    salesperson, items, shipping_type, shipping_cost, subtotal, total, notes, status,
    origem, site_pedido_id, site_user_email, cupom, afiliado_codigo
  ) values (
    v_opp_id, p->>'nome', nullif(p->>'empresa', ''), nullif(p->>'cpf_cnpj', ''), p->>'endereco_completo', p->>'telefone', p->>'email',
    'SITE', v_itens, coalesce(nullif(p->>'shipping_type', ''), 'FOB'), coalesce((p->>'shipping_cost')::numeric, 0), v_total, v_total, p->>'notes', 'ABERTO',
    'SITE', v_site_id, p->>'email', nullif(p->>'cupom', ''), nullif(p->>'afiliado_codigo', '')
  )
  returning id, quote_number into v_quote_id, v_num;

  return jsonb_build_object('quote_id', v_quote_id, 'quote_number', v_num, 'client_id', v_client_id, 'opportunity_id', v_opp_id);
end;
$$;

revoke all on function public.site_criar_pedido(jsonb) from public;
revoke all on function public.site_criar_pedido(jsonb) from anon;
revoke all on function public.site_criar_pedido(jsonb) from authenticated;
grant execute on function public.site_criar_pedido(jsonb) to service_role;
