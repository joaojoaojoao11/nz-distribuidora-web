-- Fecha `garantias_nz`, que estava aberta para qualquer visitante.
--
-- Como estava (conferido em 2026-09-10):
--   Leitura irrestrita de consulta   [SELECT] -> public
--   Permitir update em garantias_nz  [UPDATE] -> public
--   Permitir delete em garantias_nz  [DELETE] -> public
--
-- A tabela guarda CPF, nome completo, telefone, e-mail e endereço de quem
-- registrou garantia. Com a chave pública do site — que está no bundle, como em
-- qualquer site — dava para LER TODAS, ALTERAR e APAGAR.
--
-- RLS não enxerga o WHERE da consulta, então "só pode ler filtrando pelo
-- código" é impossível como policy: uma policy `using (true)` libera a listagem
-- inteira. A saída é tirar o SELECT público e servir o validador por uma função
-- SECURITY DEFINER que recebe o código e devolve SÓ o que o certificado mostra,
-- com o CPF já mascarado no servidor (hoje o CPF inteiro descia para o
-- navegador e a máscara era cosmética, no cliente).

-- ------------------------------------------------------------------ policies
drop policy if exists "Leitura irrestrita de consulta" on public.garantias_nz;
drop policy if exists "Permitir update em garantias_nz" on public.garantias_nz;
drop policy if exists "Permitir delete em garantias_nz" on public.garantias_nz;

-- O registro de garantia é um formulário público: continua podendo inserir.
drop policy if exists "Garantias podem ser inseridas publicamente" on public.garantias_nz;
create policy garantias_insert_publico on public.garantias_nz
  for insert to anon, authenticated with check (true);

-- Ler, alterar e apagar: só admin (é o que o Admin -> Garantias faz).
drop policy if exists garantias_admin_all on public.garantias_nz;
create policy garantias_admin_all on public.garantias_nz
  for all to authenticated using (public.nz_is_admin()) with check (public.nz_is_admin());

-- ----------------------------------------------------------------- validador
-- /validar-garantia?id=<codigo>. Devolve uma linha só, sem e-mail, telefone,
-- endereço nem CPF inteiro.
create or replace function public.validar_garantia(p_codigo text)
returns table (
  cpf_mascarado text,
  veiculo_modelo text,
  veiculo_placa_chassi text,
  aplicador_nome text,
  data_aplicacao date,
  produto_nome text,
  linha_escolhida text,
  tipo_servico text,
  areas_protegidas jsonb,
  garantia_anos int,
  durabilidade_anos int,
  codigo_autenticacao text
)
language sql
stable
security definer
set search_path to 'public'
as $$
  select
    case
      when length(regexp_replace(coalesce(g.cliente_cpf, ''), '\D', '', 'g')) = 11
        then '***.***.***-' || right(regexp_replace(g.cliente_cpf, '\D', '', 'g'), 2)
      when length(regexp_replace(coalesce(g.cliente_cpf, ''), '\D', '', 'g')) = 14
        then '**.***.***/****-' || right(regexp_replace(g.cliente_cpf, '\D', '', 'g'), 2)
      else '***.***.***-**'
    end,
    g.veiculo_modelo,
    g.veiculo_placa_chassi,
    g.aplicador_nome,
    g.data_aplicacao,
    g.produto_nome,
    g.linha_escolhida,
    g.tipo_servico,
    g.areas_protegidas,
    g.garantia_anos,
    g.durabilidade_anos,
    g.codigo_autenticacao
  from public.garantias_nz g
  -- Código curto demais não consulta nada: sem isso um '' varreria a tabela.
  where length(coalesce(p_codigo, '')) >= 6
    and g.codigo_autenticacao = p_codigo
  limit 1;
$$;

revoke all on function public.validar_garantia(text) from public;
grant execute on function public.validar_garantia(text) to anon, authenticated;

-- ------------------------------------------------------------ minhas garantias
-- Painel do cliente: as garantias em que ELE é o cliente. Casa por CPF/CNPJ
-- (só os dígitos, porque o formulário grava formatado) ou pelo e-mail da conta.
create or replace function public.minhas_garantias()
returns table (
  id uuid,
  produto_nome text,
  linha_escolhida text,
  tipo_servico text,
  veiculo_modelo text,
  veiculo_placa_chassi text,
  aplicador_nome text,
  data_aplicacao date,
  garantia_anos int,
  durabilidade_anos int,
  areas_protegidas jsonb,
  codigo_autenticacao text,
  certificado_gerado boolean,
  pdf_url text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path to 'public'
as $$
  select
    g.id, g.produto_nome, g.linha_escolhida, g.tipo_servico,
    g.veiculo_modelo, g.veiculo_placa_chassi, g.aplicador_nome,
    g.data_aplicacao, g.garantia_anos, g.durabilidade_anos,
    g.areas_protegidas, g.codigo_autenticacao, g.certificado_gerado,
    g.pdf_url, g.created_at
  from public.garantias_nz g
  join public.user_profiles p on p.id = auth.uid()
  where auth.uid() is not null
    and (
      (
        nullif(regexp_replace(coalesce(p.cpf_cnpj, ''), '\D', '', 'g'), '') is not null
        and regexp_replace(coalesce(g.cliente_cpf, ''), '\D', '', 'g')
            = regexp_replace(p.cpf_cnpj, '\D', '', 'g')
      )
      or (
        nullif(lower(coalesce(p.email, '')), '') is not null
        and lower(coalesce(g.cliente_email, '')) = lower(p.email)
      )
    )
  order by g.data_aplicacao desc nulls last, g.created_at desc;
$$;

revoke all on function public.minhas_garantias() from public;
grant execute on function public.minhas_garantias() to authenticated;
