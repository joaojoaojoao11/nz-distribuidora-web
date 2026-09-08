-- Seleções: a lista que o vendedor monta e manda para o cliente.
-- RODAR NO PROJETO DO SITE (uibjmvkvbthzypgozpcs).
--
-- Plano: docs/PLANO_SELECOES_PRECO_ATACADO.md (Fase 4).
--
-- O que existia: `/loja?sel=slug1,slug2,...` — a lista inteira dentro da URL.
-- Funcionava, mas não tinha onde guardar nada além dos slugs: sem título, sem
-- validade, sem histórico, e com teto de 120 itens porque a URL não aguentava
-- mais (o link quebrava ao colar no WhatsApp).
--
-- Com um token de 12 caracteres a lista sai da URL e passa a caber aqui, e com
-- ela três coisas que o João pediu: mostrar preço para quem não tem cadastro,
-- um acréscimo em % que vale só naquela seleção, e validade de 24 h.
--
-- ESCRITA SÓ PELO SERVIDOR. Não há policy de insert/update/delete para
-- `authenticated`, de propósito: se o navegador pudesse gravar, poderia gravar
-- `acrescimo_pct = 0` na seleção de outra pessoa, ou renovar sozinho um link
-- que deveria ter morrido. Quem escreve é /api/nz/selecoes, com service role.
--
-- Aplicada em produção em: 2026-09-08

create table if not exists public.selecoes (
  id            uuid primary key default gen_random_uuid(),
  -- 12 caracteres base64url, sorteados no servidor. Curto para caber numa
  -- mensagem de WhatsApp sem quebrar; 72 bits de entropia é muito mais do que
  -- alguém adivinha por força bruta num link que vive 24 h.
  token         text not null unique,
  criado_por    uuid not null references auth.users(id) on delete cascade,
  titulo        text,
  -- 300 é o teto novo (era 120, limite da URL). Cabe uma linha inteira: a
  -- Etherna tem 145 SKUs.
  slugs         text[] not null check (array_length(slugs, 1) between 1 and 300),
  mostrar_preco boolean not null default false,
  acrescimo_pct numeric(5,2) not null default 0 check (acrescimo_pct >= 0 and acrescimo_pct <= 100),
  expira_em     timestamptz not null,
  criado_em     timestamptz not null default now(),
  renovada_em   timestamptz,
  -- Encerrar é matar o link antes da hora, sem apagar o histórico.
  encerrada_em  timestamptz,
  visitas       int not null default 0,
  ultima_visita_em timestamptz
);

create index if not exists selecoes_criado_por_idx
  on public.selecoes (criado_por, expira_em desc);

comment on table public.selecoes is
  'Seleções enviadas a clientes (/loja/s/<token>). Escrita só pelo servidor; leitura pública passa por /api/nz/selecoes, que nunca devolve acrescimo_pct.';
comment on column public.selecoes.acrescimo_pct is
  'Percentual somado ao preço de atacado DENTRO desta seleção. NUNCA sai para o público: o cliente vê o preço final, não a conta.';

alter table public.selecoes enable row level security;

-- Só para a tela /painel/selecoes: o dono vê as dele, a equipe vê todas. Quem
-- abre o link não passa por aqui — passa pelo endpoint.
drop policy if exists selecoes_dono_le on public.selecoes;
create policy selecoes_dono_le on public.selecoes
  for select to authenticated
  using (criado_por = auth.uid() or public.nz_is_admin());

alter table public.loja_config
  add column if not exists selecao_validade_horas int not null default 24;

-- Incremento ATÔMICO da visita. Ler e depois gravar `visitas + 1` do lado do
-- Node perde contagem quando duas pessoas abrem o link no mesmo segundo — e o
-- vendedor usa esse número justamente para saber se o cliente abriu.
-- `security definer` porque quem chama é o servidor (service role), mas também
-- deixa a função servir a qualquer caminho futuro sem afrouxar a RLS da tabela.
create or replace function public.selecao_registrar_visita(p_token text)
returns void
language sql
volatile
security definer
set search_path = public
as $$
  update public.selecoes
     set visitas = visitas + 1,
         ultima_visita_em = now()
   where token = p_token
     and encerrada_em is null
     and expira_em > now();
$$;

revoke all on function public.selecao_registrar_visita(text) from public, anon, authenticated;
