-- Varredura de 22/10/2026 — dinheiro da indicação/cashback (carteira, pontos, saque).
--
-- 1. pedidos.erp_envio ganha 'retido': pedido pago cujo saldo da carteira já
--    tinha voltado e não deu para reservar de novo. Não vai ao ERP até a equipe
--    olhar (ocorrência na Central).
-- 2. Um estorno por movimento, garantido pelo banco (antes: "existe?" e depois
--    insert — duas rodadas juntas do sync estornavam duas vezes).
-- 3. Uma comissão de afiliado por (pedido, afiliado), seja ativação OU
--    recorrência. O motor rodando de novo no mesmo pedido contava a ativação
--    dele mesmo e pagava a recorrência por cima.
-- 4. pedidos.incentivos_processando_em: a vez do motor no pedido (claim).
-- 5. saques.erp_enviando_em: a vez de mandar o saque ao ERP (claim).
-- 6. carteira_expirar_usuario: validade do saldo em FIFO. Antes o crédito
--    inteiro virava "expirado" mesmo com parte dele já gasta — o saldo ficava
--    NEGATIVO. Agora expira só o que sobrou do crédito antigo, num movimento
--    'expiracao' negativo apontando o crédito; o crédito ganha expirado_em.
-- 7. resgatar_pontos: resgate atômico (trava por pessoa + linha da campanha).
--    Dois cliques juntos resgatavam duas vezes com os mesmos pontos, e o saldo
--    de pontos era somado só até a linha 1000.

-- ------------------------------------------------------------------ 1. retido
alter table public.pedidos drop constraint if exists pedidos_erp_envio_check;
alter table public.pedidos add constraint pedidos_erp_envio_check
  check (erp_envio = any (array['pendente', 'enviando', 'enviado', 'dispensado', 'retido']));

-- A Central ganha o tipo 'carteira' (pedido retido, saque sem título no ERP).
alter table public.ocorrencias drop constraint if exists ocorrencias_tipo_check;
alter table public.ocorrencias add constraint ocorrencias_tipo_check
  check (tipo = any (array['preco-zerado', 'sync-erro', 'sku-novo', 'sku-removido', 'preco-mudou', 'problema-produto', 'carteira']));

-- ------------------------------------------------------- 2. estorno único
create unique index if not exists carteira_estorno_unico
  on public.carteira_movimentos (referencia_id)
  where tipo = 'estorno' and referencia_id is not null;

-- ----------------------------------------------- 3. comissão única no pedido
create unique index if not exists carteira_comissao_pedido_unica
  on public.carteira_movimentos (pedido_id, user_id)
  where pedido_id is not null and tipo in ('comissao_ativacao', 'comissao_recorrencia');

-- Expiração parcial também é uma por crédito.
create unique index if not exists carteira_expiracao_unica
  on public.carteira_movimentos (referencia_id)
  where tipo = 'expiracao' and referencia_id is not null;

-- ------------------------------------------------------------ 4 e 5. claims
alter table public.pedidos add column if not exists incentivos_processando_em timestamptz;
alter table public.saques add column if not exists erp_enviando_em timestamptz;

-- ------------------------------------------------------------- 6. FIFO
create or replace function public.carteira_expirar_usuario(p_user_id uuid, p_limite timestamptz, p_tipos text[])
returns table (expirados int, valor numeric)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_consumo numeric;
  v_resto numeric;
  v_n int := 0;
  v_total numeric := 0;
  r record;
begin
  if p_user_id is null or p_limite is null then
    raise exception 'parametros-invalidos';
  end if;
  -- A mesma trava do checkout e do saque: ninguém gasta enquanto expira.
  perform pg_advisory_xact_lock(hashtext('carteira:' || p_user_id::text));

  -- Tudo que saiu do disponível (compras, saques, estornos, expirações já
  -- feitas) consome os créditos do MAIS ANTIGO para o mais novo.
  select coalesce(-sum(m.valor), 0) into v_consumo
    from public.carteira_movimentos m
   where m.user_id = p_user_id and m.status = 'disponivel' and m.valor < 0;

  for r in
    select m.id, m.valor, m.tipo, m.liberado_em, m.expirado_em
      from public.carteira_movimentos m
     where m.user_id = p_user_id and m.status = 'disponivel' and m.valor > 0
     order by coalesce(m.liberado_em, m.criado_em), m.id
  loop
    if v_consumo >= r.valor then
      v_consumo := v_consumo - r.valor;
      v_resto := 0;
    else
      v_resto := round(r.valor - v_consumo, 2);
      v_consumo := 0;
    end if;

    if r.expirado_em is null and r.tipo = any (p_tipos) and r.liberado_em is not null and r.liberado_em <= p_limite then
      if v_resto > 0 then
        insert into public.carteira_movimentos (user_id, tipo, valor, status, liberado_em, referencia_id, obs, criado_por)
        values (p_user_id, 'expiracao', -v_resto, 'disponivel', now(), r.id, 'validade do saldo', 'motor')
        on conflict do nothing;
        v_n := v_n + 1;
        v_total := v_total + v_resto;
      end if;
      update public.carteira_movimentos set expirado_em = now() where id = r.id and expirado_em is null;
    end if;
  end loop;

  return query select v_n, round(v_total, 2);
end;
$$;
revoke all on function public.carteira_expirar_usuario(uuid, timestamptz, text[]) from public, anon, authenticated;
grant execute on function public.carteira_expirar_usuario(uuid, timestamptz, text[]) to service_role;

-- ------------------------------------------------------------ 7. pontos
create or replace function public.resgatar_pontos(p_user_id uuid, p_campanha_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  c record;
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  v_saldo int;
  v_meus int;
  v_deb bigint;
  v_mov bigint;
begin
  if p_user_id is null or p_campanha_id is null then
    return jsonb_build_object('ok', false, 'motivo', 'campanha-inativa');
  end if;
  -- Ordem fixa (pessoa, depois campanha): sem deadlock.
  perform pg_advisory_xact_lock(hashtext('pontos:' || p_user_id::text));
  select * into c from public.campanhas_cashback where id = p_campanha_id for update;
  if not found or not c.ativo or (c.inicio is not null and c.inicio > v_hoje) or (c.fim is not null and c.fim < v_hoje) then
    return jsonb_build_object('ok', false, 'motivo', 'campanha-inativa');
  end if;
  if c.limite_total is not null and c.resgatados >= c.limite_total then
    return jsonb_build_object('ok', false, 'motivo', 'limite-da-campanha');
  end if;
  if c.limite_por_usuario is not null then
    select count(*) into v_meus from public.resgates where user_id = p_user_id and campanha_id = p_campanha_id;
    if v_meus >= c.limite_por_usuario then
      return jsonb_build_object('ok', false, 'motivo', 'limite-do-usuario');
    end if;
  end if;
  select coalesce(sum(pontos), 0) into v_saldo from public.pontos_movimentos where user_id = p_user_id;
  if v_saldo < c.pontos then
    return jsonb_build_object('ok', false, 'motivo', 'pontos-insuficientes');
  end if;

  insert into public.pontos_movimentos (user_id, pontos, motivo, referencia, descricao)
  values (p_user_id, -c.pontos, 'resgate', p_campanha_id::text, 'Resgate: ' || c.nome)
  returning id into v_deb;
  perform pg_advisory_xact_lock(hashtext('carteira:' || p_user_id::text));
  insert into public.carteira_movimentos (user_id, tipo, valor, status, liberado_em, obs, criado_por)
  values (p_user_id, 'resgate_pontos', round(c.valor, 2), 'disponivel', now(), format('%s (%s pontos)', c.nome, c.pontos), 'resgate')
  returning id into v_mov;
  insert into public.resgates (user_id, campanha_id, pontos, valor, cupom_codigo)
  values (p_user_id, p_campanha_id, c.pontos, c.valor, null);
  update public.campanhas_cashback set resgatados = resgatados + 1 where id = p_campanha_id;

  return jsonb_build_object('ok', true, 'valor', round(c.valor, 2), 'pontos', c.pontos, 'saldoPontos', v_saldo - c.pontos, 'movimentoId', v_mov);
end;
$$;
revoke all on function public.resgatar_pontos(uuid, uuid) from public, anon, authenticated;
grant execute on function public.resgatar_pontos(uuid, uuid) to service_role;

-- ------------------------------------------- 9. colunas só da equipe
-- RLS filtra LINHAS; coluna, não. A política "o dono lê" entregava ao afiliado
-- a `obs_admin` (anotação interna da NZ sobre ele) e ao dono do saque o
-- `erp_erro` cru do NZERP. A tela não lê nenhuma das duas direto (a equipe lê
-- pela API, com a chave de serviço): tira-se só o SELECT dessas colunas.
revoke select on public.afiliados from anon, authenticated;
grant select (user_id, codigo, percentual, ativo, criado_em, status, pct_ativacao, pct_recorrencia,
              desconto_cupom_pct, periodicidade, aprovado_em, aceite_termos_em, documento, tipo_documento, atualizado_em)
  on public.afiliados to authenticated;
revoke select on public.saques from anon, authenticated;
grant select (id, user_id, valor, pix_tipo, pix_chave, status, movimento_id, erp_ap_id, erp_enviado_em, vencimento,
              pago_em, cancelado_em, cancelado_motivo, criado_em, atualizado_em, erp_enviando_em)
  on public.saques to authenticated;

-- ------------------------------------------- 8. indicação no cadastro
-- handle_new_user aceitava em `indicado_por` qualquer UUID cru (sem conferir
-- afiliado nenhum) e o código de afiliado com ativo=true em QUALQUER status
-- (em análise, suspenso). A filiação é para sempre. Agora: só o código de
-- afiliado APROVADO e ativo; e o documento do cadastro igual ao do afiliado
-- (a mesma pessoa ou empresa com outra conta) não filia.
create or replace function public.handle_new_user()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  m          jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_role     text  := case when m->>'role' in ('reseller', 'lojista') then m->>'role' else 'client' end;
  v_origem   text  := case
                        when coalesce(new.raw_app_meta_data->>'provider', '') = 'google' then 'google'
                        when m->>'origem' = 'google' then 'google'
                        else 'site' end;
  v_doc      text  := nullif(regexp_replace(coalesce(m->>'cpf_cnpj', ''), '\D', '', 'g'), '');
  v_nome     text  := nullif(trim(coalesce(m->>'full_name', m->>'name', '')), '');
  v_ind_raw  text  := nullif(trim(coalesce(m->>'indicado_por', '')), '');
  v_indicado uuid;
  v_doc_af   text;
begin
  -- Quem indicou: só o código (NZ-XXXXX) de afiliado aprovado e ativo.
  if v_ind_raw ~ '^[A-Za-z0-9][A-Za-z0-9-]{2,23}$' then
    select a.user_id, nullif(regexp_replace(coalesce(a.documento, ''), '\D', '', 'g'), '')
      into v_indicado, v_doc_af
      from public.afiliados a
     where a.codigo = upper(v_ind_raw) and a.ativo and a.status = 'aprovado'
     limit 1;
  end if;
  if v_indicado = new.id or (v_doc is not null and v_doc = v_doc_af) then
    v_indicado := null;
  end if;

  insert into public.user_profiles (
    id, email, full_name, role, is_approved, origem,
    phone, cpf_cnpj, company_name, ie, indicado_por, aceite_termos_em,
    address_zip, address_street, address_number, address_complement,
    address_neighborhood, address_city, address_state,
    aprovado_em, aprovado_motivo
  ) values (
    new.id, new.email, coalesce(v_nome, ''), v_role, false, v_origem,
    nullif(trim(coalesce(m->>'phone', '')), ''),
    v_doc,
    nullif(trim(coalesce(m->>'company_name', '')), ''),
    nullif(trim(coalesce(m->>'ie', '')), ''),
    v_indicado,
    case when m ? 'aceite_termos_em' or v_origem = 'google' then now() else null end,
    nullif(regexp_replace(coalesce(m->>'address_zip', ''), '\D', '', 'g'), ''),
    nullif(trim(coalesce(m->>'address_street', '')), ''),
    nullif(trim(coalesce(m->>'address_number', '')), ''),
    nullif(trim(coalesce(m->>'address_complement', '')), ''),
    nullif(trim(coalesce(m->>'address_neighborhood', '')), ''),
    nullif(trim(coalesce(m->>'address_city', '')), ''),
    nullif(upper(trim(coalesce(m->>'address_state', ''))), ''),
    null,
    null
  )
  on conflict (id) do nothing;

  return new;
end;
$function$;

notify pgrst, 'reload schema';
