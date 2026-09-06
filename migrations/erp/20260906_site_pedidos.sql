-- Pedidos vindos do site nzgroup.com.br → quotes (Fase 7 da loja).
-- Projeto: ipehorttsrvjynnhyzhu (este). O lado do site está em
-- nz-distribuidora-web/api/_lib/handlers/pedido.ts.
--
-- O pedido do site NASCE como orçamento ABERTO, com vendedor 'SITE' e origem
-- 'SITE'. Quem precifica, aprova e fatura é o vendedor no NZERP, como sempre —
-- o site só entrega o pedido pronto (cliente já resolvido, itens com SKU
-- físico e preço de tabela do canal) e depois espelha o status de volta.
--
-- Regras que este SQL respeita:
--   · quotes.status só aceita os 13 rótulos do CHECK (rules/CRM_RULES.ts);
--   · cliente casa por CPF/CNPJ normalizado (a base guarda formatado E sem
--     formatação), depois por e-mail; senão é criado com vendedor 'SITE';
--   · toda quote precisa de crm_opportunities (o faturamento resolve o
--     endereço por ela) — reaproveita a mais recente do cliente ou cria uma
--     'QUALIFICADO';
--   · a função é SECURITY DEFINER e só o service_role executa: o site chama
--     com a chave de serviço, nunca com anon.
-- Aplicada em produção em: 2026-09-05

alter table public.quotes add column if not exists origem text not null default 'NZERP';
alter table public.quotes add column if not exists site_pedido_id uuid;
alter table public.quotes add column if not exists site_user_email text;
alter table public.quotes add column if not exists cupom text;
alter table public.quotes add column if not exists afiliado_codigo text;
create index if not exists quotes_site_pedido_idx on public.quotes (site_pedido_id) where site_pedido_id is not null;

comment on column public.quotes.origem is 'NZERP (padrão) ou SITE — pedido feito em nzgroup.com.br';

-- ------------------------------------------------- view lida pelo site
create or replace view public.pedidos_site as
select
  q.id,
  q.quote_number,
  q.status,
  q.total,
  q.site_pedido_id,
  q.tiny_order_number,
  q.updated_at
from public.quotes q
where q.origem = 'SITE' and q.site_pedido_id is not null;

comment on view public.pedidos_site is 'Status dos pedidos do site, para o espelho em nzgroup.com.br. Sem dados de terceiros.';

-- ---------------------------------------------------------------- RPC
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
begin
  if v_site_id is null then
    raise exception 'site_pedido_id obrigatório';
  end if;
  if jsonb_array_length(v_itens) = 0 then
    raise exception 'pedido sem itens';
  end if;

  -- Idempotência: o site pode repetir a chamada se a resposta se perder.
  select id, quote_number into v_quote_id, v_num from public.quotes where site_pedido_id = v_site_id limit 1;
  if v_quote_id is not null then
    return jsonb_build_object('quote_id', v_quote_id, 'quote_number', v_num, 'repetido', true);
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
      client_type, fantasia, inscricao_estadual, vendedor, observacoes
    ) values (
      p->>'nome',
      nullif(v_doc, ''),
      case when length(v_doc) = 14 then 'J' when length(v_doc) = 11 then 'F' else null end,
      p->>'email', p->>'telefone',
      p->>'endereco', p->>'numero', p->>'complemento', p->>'bairro', p->>'cidade', p->>'uf', p->>'cep',
      'Cliente', p->>'empresa', p->>'ie', 'SITE', 'Cadastro criado pelo site nzgroup.com.br'
    )
    returning id into v_client_id;
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

-- Mudou status de pedido → avisa o site (mesmo caminho do estoque).
drop trigger if exists trg_site_quotes on public.quotes;
create trigger trg_site_quotes
  after insert or update or delete on public.quotes
  for each statement execute function public.trg_site_notificar();

notify pgrst, 'reload schema';
