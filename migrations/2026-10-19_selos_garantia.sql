-- Selos de garantia NZPPF (19/10/2026) — o adesivo do batente da porta.
--
-- Cada selo impresso tem um CÓDIGO de 8 caracteres (ex.: 7KQ2-XM9P) que é ao
-- mesmo tempo a identidade e a "senha" do selo. O QR do selo abre
-- nzgroup.com.br/s/<CÓDIGO> (rota /s/:codigo), que responde pelo estado:
--   livre ............ selo autêntico, ainda sem garantia (ou a garantia foi recusada)
--   em_analise ....... ligado a uma garantia pendente (mostra só a data do registro)
--   verificada ....... ligado a uma garantia aprovada (a tela vai para /validar-garantia)
--   cancelado ........ cancelado pela NZ
--   nao_reconhecido .. código que não existe
-- O estado é DERIVADO do status da garantia: aprovar ou recusar no admin não
-- precisa mexer no selo. Garantia recusada devolve o selo para "livre".
--
-- Os códigos NÃO estão neste arquivo (o repositório é público): são importados
-- da planilha mestre da gráfica, que fica fora do git.
--
-- Acesso: a tabela não tem policy (anon não lê nem lista). O site só fala com
-- ela por funções: conferir_selo (pública, devolve só o estado) e
-- selo_disponivel / vincular_selo (só o servidor, com a service role).

create table if not exists public.selos_garantia (
  id uuid primary key default gen_random_uuid(),
  seq integer not null unique,
  codigo text not null unique check (codigo ~ '^[2-9A-HJ-NP-Z]{8}$'),
  modelo text not null check (modelo in ('A', 'B')),
  lote text not null,
  status text not null default 'ativo' check (status in ('ativo', 'cancelado')),
  garantia_id uuid unique references public.garantias_nz (id) on delete set null,
  vinculado_em timestamptz,
  cancelado_em timestamptz,
  motivo_cancelamento text,
  created_at timestamptz not null default now()
);

alter table public.selos_garantia enable row level security;

-- Histórico: a garantia guarda o código do selo que veio no registro, mesmo
-- que depois o selo seja religado a outra garantia (quando esta é recusada).
alter table public.garantias_nz add column if not exists selo_codigo text;
create index if not exists garantias_nz_selo_codigo_idx on public.garantias_nz (selo_codigo) where selo_codigo is not null;

-- O código como o site recebe: caixa-alta, sem hífen, espaço ou o endereço do QR.
create or replace function public.selo_normalizar(p text)
returns text
language sql
immutable
as $$
  select upper(regexp_replace(regexp_replace(coalesce(p, ''), '^.*/[sS]/', ''), '[^0-9A-Za-z]', '', 'g'));
$$;

-- ------------------------------------------------------------ conferir (público)
create or replace function public.conferir_selo(p_codigo text)
returns table (estado text, modelo text, registrado_em timestamptz, codigo_autenticacao text)
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  v_codigo text := public.selo_normalizar(p_codigo);
  s public.selos_garantia%rowtype;
  g record;
begin
  select * into s from public.selos_garantia where codigo = v_codigo;
  if not found then
    return query select 'nao_reconhecido'::text, null::text, null::timestamptz, null::text;
    return;
  end if;
  if s.status = 'cancelado' then
    return query select 'cancelado'::text, s.modelo, null::timestamptz, null::text;
    return;
  end if;
  select gz.status, gz.created_at, gz.codigo_autenticacao into g from public.garantias_nz gz where gz.id = s.garantia_id;
  if not found or g.status = 'recusada' then
    return query select 'livre'::text, s.modelo, null::timestamptz, null::text;
  elsif g.status = 'aprovada' then
    return query select 'verificada'::text, s.modelo, g.created_at::timestamptz, g.codigo_autenticacao::text;
  else
    return query select 'em_analise'::text, s.modelo, g.created_at::timestamptz, null::text;
  end if;
end;
$$;

-- ------------------------------------------------- registro (só o servidor)
-- 'ok' | 'invalido' | 'nao-encontrado' | 'cancelado' | 'em-uso'
create or replace function public.selo_disponivel(p_codigo text)
returns text
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  v_codigo text := public.selo_normalizar(p_codigo);
  s public.selos_garantia%rowtype;
  v_status text;
begin
  if v_codigo !~ '^[2-9A-HJ-NP-Z]{8}$' then return 'invalido'; end if;
  select * into s from public.selos_garantia where codigo = v_codigo;
  if not found then return 'nao-encontrado'; end if;
  if s.status = 'cancelado' then return 'cancelado'; end if;
  if s.garantia_id is null then return 'ok'; end if;
  select status into v_status from public.garantias_nz where id = s.garantia_id;
  if v_status is null or v_status = 'recusada' then return 'ok'; end if;
  return 'em-uso';
end;
$$;

-- Liga o selo à garantia recém-registrada. Trava a linha para dois registros
-- simultâneos não levarem o mesmo selo. Devolve false se o selo não está livre.
create or replace function public.vincular_selo(p_codigo text, p_garantia uuid)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_codigo text := public.selo_normalizar(p_codigo);
  s public.selos_garantia%rowtype;
  v_status text;
begin
  select * into s from public.selos_garantia where codigo = v_codigo for update;
  if not found or s.status <> 'ativo' then return false; end if;
  if s.garantia_id is not null and s.garantia_id <> p_garantia then
    select status into v_status from public.garantias_nz where id = s.garantia_id;
    if v_status is not null and v_status <> 'recusada' then return false; end if;
  end if;
  update public.selos_garantia set garantia_id = p_garantia, vinculado_em = now() where id = s.id;
  update public.garantias_nz set selo_codigo = v_codigo where id = p_garantia;
  return true;
end;
$$;

revoke all on function public.conferir_selo(text) from public;
revoke all on function public.selo_disponivel(text) from public;
revoke all on function public.vincular_selo(text, uuid) from public;
-- O Supabase dá execute ao anon/authenticated em toda função nova: tira explicitamente.
revoke all on function public.selo_disponivel(text) from anon, authenticated;
revoke all on function public.vincular_selo(text, uuid) from anon, authenticated;
grant execute on function public.conferir_selo(text) to anon, authenticated, service_role;
grant execute on function public.selo_disponivel(text) to service_role;
grant execute on function public.vincular_selo(text, uuid) to service_role;

notify pgrst, 'reload schema';
