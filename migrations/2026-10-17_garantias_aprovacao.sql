-- Registro de garantia vira PROTOCOLO: o certificado só vale depois que alguém
-- do admin aprova (pedido do João, 17/10/2026).
--
-- Antes: o formulário gravava e já mostrava o certificado; qualquer pessoa
-- podia "emitir" uma garantia NZ para qualquer placa. Agora:
--   - todo registro nasce `pendente`, com um protocolo (GAR-AAAA-NNNNN) gerado
--     aqui no banco — venha de onde vier o insert, o trigger força o estado;
--   - `aprovada` só por admin (policy garantias_admin_all já restringe UPDATE);
--   - o validador público (`validar_garantia`) só reconhece garantia aprovada;
--   - `minhas_garantias` devolve o status e só entrega o código se aprovada.
--
-- Compatível com o formulário antigo ainda no ar: o insert direto dele continua
-- passando (policy pública de insert), só que nasce pendente. A policy de insert
-- público sai na migração seguinte (2026-10-17b), depois que o formulário novo
-- — que grava pelo servidor — estiver publicado.

-- ------------------------------------------------------------------ colunas
create sequence if not exists public.garantias_protocolo_seq;

alter table public.garantias_nz
  add column if not exists status text not null default 'pendente',
  add column if not exists protocolo text,
  add column if not exists aprovada_em timestamptz,
  add column if not exists aprovada_por uuid,
  add column if not exists recusada_em timestamptz,
  add column if not exists motivo_recusa text,
  add column if not exists certificado_enviado_em timestamptz,
  add column if not exists certificado_enviado_para text,
  add column if not exists envios_certificado integer not null default 0,
  add column if not exists aviso_nz_enviado_em timestamptz,
  -- sha256(ip + salt) do registro, para o limite por hora do servidor. Nunca o IP.
  add column if not exists ip_hash text;

alter table public.garantias_nz drop constraint if exists garantias_nz_status_check;
alter table public.garantias_nz
  add constraint garantias_nz_status_check check (status in ('pendente', 'aprovada', 'recusada'));

-- As que já existiam foram emitidas pelo fluxo antigo (todas com certificado
-- gerado em 17/10): contam como aprovadas.
update public.garantias_nz
   set status = 'aprovada',
       aprovada_em = coalesce(data_geracao, created_at)
 where status = 'pendente'
   and certificado_gerado is true;

-- Protocolo para as antigas, na ordem em que foram registradas.
do $$
declare
  g record;
begin
  for g in select id, created_at from public.garantias_nz where protocolo is null order by created_at, id loop
    update public.garantias_nz
       set protocolo = 'GAR-' || to_char(coalesce(g.created_at, now()) at time zone 'America/Sao_Paulo', 'YYYY')
                       || '-' || lpad(nextval('public.garantias_protocolo_seq')::text, 5, '0')
     where id = g.id;
  end loop;
end $$;

create unique index if not exists garantias_nz_protocolo_key on public.garantias_nz (protocolo);
create index if not exists garantias_nz_status_idx on public.garantias_nz (status, created_at desc);
create index if not exists garantias_nz_ip_hash_idx on public.garantias_nz (ip_hash, created_at desc) where ip_hash is not null;

-- ------------------------------------------------------------------ trigger
-- Registro novo nasce pendente e com protocolo, venha de onde vier: aprovar é
-- um passo separado, de admin. Quem insere não escolhe estado nem datas.
create or replace function public.garantias_nz_ao_inserir()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  new.protocolo := 'GAR-' || to_char(now() at time zone 'America/Sao_Paulo', 'YYYY')
                   || '-' || lpad(nextval('public.garantias_protocolo_seq')::text, 5, '0');
  new.status := 'pendente';
  new.aprovada_em := null;
  new.aprovada_por := null;
  new.recusada_em := null;
  new.motivo_recusa := null;
  new.certificado_gerado := false;
  new.data_geracao := null;
  new.pdf_url := null;
  new.certificado_enviado_em := null;
  new.certificado_enviado_para := null;
  new.envios_certificado := 0;
  new.aviso_nz_enviado_em := null;
  return new;
end;
$$;

drop trigger if exists garantias_nz_ao_inserir on public.garantias_nz;
create trigger garantias_nz_ao_inserir
  before insert on public.garantias_nz
  for each row execute function public.garantias_nz_ao_inserir();

-- ----------------------------------------------------------------- validador
-- Só garantia APROVADA é reconhecida. Pendente ou recusada responde como
-- inexistente: um certificado que a NZ não aprovou não vale nada.
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
  where length(coalesce(p_codigo, '')) >= 6
    and g.codigo_autenticacao = p_codigo
    and g.status = 'aprovada'
  limit 1;
$$;

revoke all on function public.validar_garantia(text) from public;
grant execute on function public.validar_garantia(text) to anon, authenticated;

-- ---------------------------------------------------------- minhas garantias
-- Muda o formato de retorno (status, protocolo), então precisa recriar.
drop function if exists public.minhas_garantias();
create function public.minhas_garantias()
returns table (
  id uuid,
  protocolo text,
  status text,
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
  -- Só existe para a garantia aprovada: com ele se abre o certificado.
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
    g.id, g.protocolo, g.status, g.produto_nome, g.linha_escolhida, g.tipo_servico,
    g.veiculo_modelo, g.veiculo_placa_chassi, g.aplicador_nome,
    g.data_aplicacao, g.garantia_anos, g.durabilidade_anos, g.areas_protegidas,
    case when g.status = 'aprovada' then g.codigo_autenticacao end,
    g.certificado_gerado,
    case when g.status = 'aprovada' then g.pdf_url end,
    g.created_at
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
  order by g.created_at desc nulls last;
$$;

revoke all on function public.minhas_garantias() from public;
grant execute on function public.minhas_garantias() to authenticated;
