-- Fase 1 do plano de indicação/cashback (21/10/2026): FAIXAS DE PREÇO dentro de
-- cada tipo de acesso + PRÉ-ANÁLISE do consultor.
-- Projeto: uibjmvkvbthzypgozpcs (site). Plano no NZERP (docs/PLANO_INDICACAO_CASHBACK_AFILIADOS.md).
--
-- A faixa é uma categoria DENTRO do tipo de acesso (ex.: lojista Gold, lojista
-- Platinum). Quem não tem faixa está na regra do tipo ("Padrão" = precos_acesso
-- com faixa_id nulo, exatamente o que existe hoje). A faixa pode ter um cliente
-- só: é assim que se faz a configuração individual de uma pessoa.
--
-- Prioridade do preço (api/_lib/precos/regraAcesso.ts): dentro da faixa,
-- produto > linha > geral; se a faixa não diz nada para aquele produto, vale a
-- regra do tipo. A BASE (atacado/varejo) é sempre a do tipo.
--
-- Percentuais NÃO entram aqui (repositório público): os valores de partida
-- entram por script fora do git, e o João acerta na tela Admin → Preços.

-- ======================================================= faixas_preco
create table if not exists public.faixas_preco (
  id bigserial primary key,
  papel text not null check (papel in ('client', 'lojista', 'reseller')),
  nome text not null,
  descricao text,
  ordem int not null default 0,
  ativa boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid,
  unique (papel, nome)
);
comment on table public.faixas_preco is
  'Faixas de preço dentro de cada tipo de acesso (ex.: lojista Gold/Platinum). Sem faixa = regra do tipo. Uma faixa pode ter um único cliente (configuração individual).';

-- ======================================================= precos_acesso
alter table public.precos_acesso add column if not exists faixa_id bigint references public.faixas_preco (id) on delete cascade;
comment on column public.precos_acesso.faixa_id is 'Nulo = regra do tipo (Padrão). Preenchido = regra só desta faixa, nos mesmos três níveis (geral, linha, produto).';
drop index if exists public.precos_acesso_unico;
create unique index precos_acesso_unico
  on public.precos_acesso (papel, coalesce(faixa_id, 0), coalesce(linha_key, '*'), coalesce(produto_slug, '*'));
create index if not exists precos_acesso_faixa_idx on public.precos_acesso (faixa_id) where faixa_id is not null;
alter table public.precos_acesso_log add column if not exists faixa_id bigint;

-- ======================================================= user_profiles
alter table public.user_profiles add column if not exists faixa_id bigint references public.faixas_preco (id) on delete set null;
comment on column public.user_profiles.faixa_id is 'Faixa de preço dentro do tipo de acesso, dada pelo consultor na aprovação. Nulo = Padrão do tipo. Só o servidor muda (op aprovar / mudar-faixa).';
create index if not exists user_profiles_faixa_idx on public.user_profiles (faixa_id) where faixa_id is not null;

-- ======================================================= pre_analises
create table if not exists public.pre_analises (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  consultor text,
  origem text,
  volume_mensal_estimado numeric,
  perfil text,
  linhas_interesse text[] not null default '{}',
  preco_atual_concorrente text,
  obs text,
  faixa_sugerida bigint references public.faixas_preco (id) on delete set null,
  faixa_definida bigint references public.faixas_preco (id) on delete set null,
  criado_em timestamptz not null default now()
);
comment on table public.pre_analises is 'Uma linha por pré-análise do consultor (histórico): perfil do cliente, volume, concorrência e a faixa sugerida/definida.';
create index if not exists pre_analises_user_idx on public.pre_analises (user_id, criado_em desc);

-- ================================================================ RLS
alter table public.faixas_preco enable row level security;
drop policy if exists faixas_preco_admin_all on public.faixas_preco;
create policy faixas_preco_admin_all on public.faixas_preco for all to authenticated using (public.nz_is_admin()) with check (public.nz_is_admin());

alter table public.pre_analises enable row level security;
drop policy if exists pre_analises_admin_all on public.pre_analises;
create policy pre_analises_admin_all on public.pre_analises for all to authenticated using (public.nz_is_admin()) with check (public.nz_is_admin());

-- ================================================= guarda do perfil
-- O usuário edita o próprio perfil (endereço, telefone…), então faixa_id e
-- indicado_por entram na lista do que só o sistema muda — senão qualquer um
-- se colocaria na Platinum ou trocaria quem o indicou.
create or replace function public.nz_user_profiles_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  if new.role is distinct from old.role then
    raise exception 'papel só pode ser alterado por administrador';
  end if;
  if new.is_approved is distinct from old.is_approved then
    raise exception 'aprovação só pode ser alterada por administrador';
  end if;
  if new.id is distinct from old.id or new.email is distinct from old.email then
    raise exception 'id e e-mail não podem ser alterados aqui';
  end if;
  if new.faixa_id is distinct from old.faixa_id then
    raise exception 'faixa de preço só pode ser alterada por administrador';
  end if;
  if new.indicado_por is distinct from old.indicado_por then
    raise exception 'quem indicou não pode ser alterado aqui';
  end if;
  if new.erp_client_id is distinct from old.erp_client_id
     or new.erp_user_id is distinct from old.erp_user_id
     or new.erp_role is distinct from old.erp_role
     or new.erp_permissions is distinct from old.erp_permissions
     or new.origem is distinct from old.origem
     or new.convidado_em is distinct from old.convidado_em
     or new.aprovado_em is distinct from old.aprovado_em
     or new.aprovado_motivo is distinct from old.aprovado_motivo
     or new.erp_candidato_id is distinct from old.erp_candidato_id
     or new.erp_candidato_em is distinct from old.erp_candidato_em
     or new.erp_candidato_motivo is distinct from old.erp_candidato_motivo then
    raise exception 'campos de integração só podem ser alterados pelo sistema';
  end if;
  return new;
end;
$$;

-- ============================================================ faixas
-- Só os NOMES (ponto de partida: Gold e Platinum em cada tipo). O percentual
-- de cada faixa entra pela tela Admin → Preços → tipo → faixa.
insert into public.faixas_preco (papel, nome, descricao, ordem) values
  ('lojista',  'Gold',     'Lojista/aplicador com volume: percentual menor que o Padrão.', 1),
  ('lojista',  'Platinum', 'Lojista/aplicador parceiro: o menor percentual do tipo.', 2),
  ('reseller', 'Gold',     'Revendedor com volume.', 1),
  ('reseller', 'Platinum', 'Revendedor parceiro.', 2),
  ('client',   'Gold',     'Cliente final recorrente.', 1),
  ('client',   'Platinum', 'Cliente final parceiro.', 2)
on conflict (papel, nome) do nothing;

notify pgrst, 'reload schema';
