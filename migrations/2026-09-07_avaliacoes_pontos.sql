-- Avaliações de produto, pontos por avaliar e campanhas de cashback.
--
-- Regra que manda em tudo (docs/PLANO_PROVA_SOCIAL.md): nada aqui nasce
-- inventado. Só avalia quem comprou, a avaliação passa por moderação, e o
-- ponto é creditado pela avaliação APROVADA — **qualquer que seja a nota**.
--
-- Isso não é escrúpulo: pagar por nota alta é o que transforma um programa de
-- incentivo legal em publicidade enganosa. Incentivar avaliação é permitido
-- desde que (a) o incentivo não dependa do conteúdo e (b) a página diga que a
-- avaliação foi incentivada. As duas coisas estão no desenho, não no discurso:
-- a coluna `incentivada` existe para ser mostrada, e o crédito de pontos não lê
-- a coluna `nota` em lugar nenhum.

-- ========================================================== avaliações
create table if not exists public.avaliacoes (
  id             uuid primary key default gen_random_uuid(),
  produto_slug   text not null,
  user_id        uuid not null references auth.users (id) on delete cascade,

  -- De onde veio a compra que dá direito de avaliar. Uma das duas.
  pedido_id      uuid references public.pedidos (id) on delete set null,
  erp_quote_id   uuid,

  nota           smallint not null check (nota between 1 and 5),
  titulo         text check (titulo is null or length(titulo) <= 120),
  texto          text not null check (length(texto) between 20 and 3000),
  foto_url       text,

  -- Nome exibido, congelado na criação: a leitura pública não precisa (e não
  -- pode) alcançar `user_profiles`. Guardamos "João V.", nunca o e-mail.
  autor_nome     text not null,
  autor_cidade   text,
  aplicador      boolean not null default false,

  -- Ganhou ponto ou cupom por avaliar? Then a página TEM que dizer.
  incentivada    boolean not null default false,

  status         text not null default 'pendente',
  motivo_recusa  text,
  resposta_loja  text,
  resposta_em    timestamptz,
  moderado_por   uuid references auth.users (id) on delete set null,
  moderado_em    timestamptz,
  criado_em      timestamptz not null default now(),

  -- Uma avaliação por pessoa por produto. Sem isto, dez avaliações do mesmo
  -- cliente no mesmo produto viram dez vezes os pontos.
  unique (user_id, produto_slug)
);

alter table public.avaliacoes drop constraint if exists avaliacoes_status_check;
alter table public.avaliacoes add constraint avaliacoes_status_check
  check (status in ('pendente', 'aprovada', 'recusada'));

create index if not exists avaliacoes_produto_idx on public.avaliacoes (produto_slug, status);
create index if not exists avaliacoes_user_idx on public.avaliacoes (user_id);
create index if not exists avaliacoes_fila_idx on public.avaliacoes (criado_em) where status = 'pendente';

comment on table public.avaliacoes is
  'Avaliação de produto por quem comprou. Moderada antes de publicar. `incentivada` diz se houve ponto/cupom em troca — e a página mostra.';

-- ============================================================== pontos
-- Razão em movimentos, nunca um saldo guardado: saldo em coluna diverge no
-- primeiro erro e ninguém descobre de onde veio. Aqui o saldo é a soma, e cada
-- linha diz por quê.
create table if not exists public.pontos_movimentos (
  id          bigserial primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  pontos      integer not null check (pontos <> 0),  -- + credita, − debita
  motivo      text not null,
  referencia  text,
  descricao   text,
  criado_em   timestamptz not null default now()
);

alter table public.pontos_movimentos drop constraint if exists pontos_movimentos_motivo_check;
alter table public.pontos_movimentos add constraint pontos_movimentos_motivo_check
  check (motivo in ('avaliacao', 'resgate', 'ajuste', 'estorno'));

create index if not exists pontos_user_idx on public.pontos_movimentos (user_id, criado_em desc);
-- Um crédito por avaliação, e só um. Reaprovar não paga de novo.
create unique index if not exists pontos_avaliacao_uk
  on public.pontos_movimentos (referencia) where motivo = 'avaliacao';

comment on table public.pontos_movimentos is
  'Razão de pontos. Saldo = soma. Crédito de avaliação NÃO depende da nota — ver a migration.';

-- ========================================================== campanhas
create table if not exists public.campanhas_cashback (
  id                 uuid primary key default gen_random_uuid(),
  nome               text not null,
  descricao          text,
  pontos             integer not null check (pontos > 0),
  valor              numeric(10, 2) not null check (valor > 0),
  validade_dias      integer not null default 90 check (validade_dias > 0),
  ativo              boolean not null default true,
  inicio             date,
  fim                date,
  limite_por_usuario integer,
  limite_total       integer,
  resgatados         integer not null default 0,
  criado_em          timestamptz not null default now()
);

comment on table public.campanhas_cashback is
  'Quanto vale trocar pontos por crédito. O crédito sai como cupom de valor, nominal ao cliente.';

create table if not exists public.resgates (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  campanha_id  uuid not null references public.campanhas_cashback (id),
  pontos       integer not null,
  valor        numeric(10, 2) not null,
  cupom_codigo text references public.cupons (codigo),
  criado_em    timestamptz not null default now()
);

create index if not exists resgates_user_idx on public.resgates (user_id, criado_em desc);
create index if not exists resgates_campanha_idx on public.resgates (campanha_id);

-- ------------------------------------------------ cupom com dono
-- Sem isto o cupom de cashback vale para qualquer um que descobrir o código:
-- `cupons` só conhecia `afiliado_user_id`, e esse é usado para IMPEDIR o uso
-- pelo próprio afiliado, não para restringir a um dono.
alter table public.cupons add column if not exists dono_user_id uuid references auth.users (id) on delete cascade;
create index if not exists cupons_dono_idx on public.cupons (dono_user_id) where dono_user_id is not null;
comment on column public.cupons.dono_user_id is
  'Quando preenchido, só este usuário pode usar o cupom. É o caso do cashback.';

-- ================================================================ RLS
alter table public.avaliacoes enable row level security;
alter table public.pontos_movimentos enable row level security;
alter table public.campanhas_cashback enable row level security;
alter table public.resgates enable row level security;

-- Avaliação APROVADA é conteúdo público — é o ponto do sistema.
drop policy if exists avaliacoes_publicas on public.avaliacoes;
create policy avaliacoes_publicas on public.avaliacoes
  for select to anon, authenticated
  using (status = 'aprovada');

-- O autor vê as próprias, inclusive pendente e recusada.
drop policy if exists avaliacoes_minhas on public.avaliacoes;
create policy avaliacoes_minhas on public.avaliacoes
  for select to authenticated
  using (user_id = auth.uid());

-- Escrita NUNCA pelo navegador: quem grava é o servidor, que confere a compra.
-- Sem política de insert/update/delete = ninguém escreve por RLS.

-- Pontos e resgates: cada um vê o seu.
drop policy if exists pontos_meus on public.pontos_movimentos;
create policy pontos_meus on public.pontos_movimentos
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists resgates_meus on public.resgates;
create policy resgates_meus on public.resgates
  for select to authenticated
  using (user_id = auth.uid());

-- Campanha ativa é vitrine: quem está logado vê o que pode resgatar.
drop policy if exists campanhas_visiveis on public.campanhas_cashback;
create policy campanhas_visiveis on public.campanhas_cashback
  for select to authenticated
  using (ativo and (inicio is null or inicio <= current_date) and (fim is null or fim >= current_date));

-- =========================================== resumo público por produto
-- A vitrine e a página do produto precisam de média e contagem sem baixar
-- avaliação nenhuma. View, não tabela: nunca fica velha.
create or replace view public.avaliacoes_resumo as
select
  produto_slug,
  count(*)::int                                        as total,
  round(avg(nota)::numeric, 2)                         as media,
  count(*) filter (where nota = 5)::int                as n5,
  count(*) filter (where nota = 4)::int                as n4,
  count(*) filter (where nota = 3)::int                as n3,
  count(*) filter (where nota = 2)::int                as n2,
  count(*) filter (where nota = 1)::int                as n1,
  max(criado_em)                                       as ultima
from public.avaliacoes
where status = 'aprovada'
group by produto_slug;

comment on view public.avaliacoes_resumo is
  'Média e contagem por produto, só do que está aprovado. Lida pela loja e pela página do produto.';
