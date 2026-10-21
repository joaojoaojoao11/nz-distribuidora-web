-- Fase 2 do plano de indicação/cashback (21/10/2026): CARTEIRA em R$, SUPER
-- CUPOM, cupom NOMINAL, afiliado com ATIVAÇÃO + RECORRÊNCIA (mensal/quinzenal)
-- e as tabelas da GAMIFICAÇÃO (G1). Projeto: uibjmvkvbthzypgozpcs (site).
-- Plano no NZERP (docs/PLANO_INDICACAO_CASHBACK_AFILIADOS.md, D21–D28).
--
-- Regras:
--   · a carteira é um RAZÃO (carteira_movimentos): nunca se apaga, só se
--     estorna; saldo = soma. Só o servidor escreve (service role). O cliente
--     lê pela rota (op minha-carteira), que esconde quem é o indicado (D26).
--   · super cupom (tipo 'super'): um por cliente, dono em dono_user_id, vale
--     UMA compra por indicado (usos_por_cliente = 1), só para conta nova.
--   · cupom nominal (tipo 'nominal'): criado pelo admin para UM cliente.
--   · cupom de afiliado (tipo 'afiliado'): a "senha" de entrada; quem se
--     cadastra com ele fica filiado (user_profiles.indicado_por + filiado_em).
--   · percentuais e a trava de margem ficam em loja_config; os VALORES não
--     entram aqui (repositório público): entram por script, fora do git.

-- ======================================================= carteira
create table if not exists public.carteira_movimentos (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null check (tipo in (
    'cashback_indicacao', 'comissao_ativacao', 'comissao_recorrencia', 'bonus_meta', 'bonus_campanha',
    'resgate_pontos', 'uso_compra', 'saque', 'estorno', 'expiracao', 'ajuste')),
  valor numeric(12,2) not null,
  status text not null default 'disponivel' check (status in ('a_liberar', 'disponivel', 'estornado', 'expirado')),
  libera_em timestamptz,
  expira_em timestamptz,
  pedido_id uuid references public.pedidos (id) on delete set null,
  -- Quem gerou o crédito (o indicado/filiado). Nunca sai pela rota do indicador pelo nome.
  origem_user_id uuid,
  cupom_codigo text,
  -- Recorrência do afiliado: '2026-10' (mensal) ou '2026-10-Q1' / '2026-10-Q2' (quinzenal).
  periodo text,
  percentual_aplicado numeric(6,2),
  multiplicador numeric(6,2),
  base_valor numeric(12,2),
  -- Estorno aponta o movimento original.
  referencia_id bigint references public.carteira_movimentos (id) on delete set null,
  obs text,
  criado_por text,
  criado_em timestamptz not null default now(),
  liberado_em timestamptz,
  estornado_em timestamptz,
  expirado_em timestamptz
);
comment on table public.carteira_movimentos is 'Razão da carteira em R$ (cashback, comissões, bônus, uso em compra, saque). Nunca apagar: estornar. Saldo = soma por status.';
create unique index if not exists carteira_credito_unico
  on public.carteira_movimentos (tipo, pedido_id, user_id)
  where pedido_id is not null and tipo in ('cashback_indicacao', 'comissao_ativacao', 'comissao_recorrencia');
create index if not exists carteira_user_idx on public.carteira_movimentos (user_id, criado_em desc);
create index if not exists carteira_libera_idx on public.carteira_movimentos (libera_em) where status = 'a_liberar';
create index if not exists carteira_pedido_idx on public.carteira_movimentos (pedido_id) where pedido_id is not null;

create or replace view public.carteira_saldos with (security_invoker = true) as
select
  user_id,
  round(coalesce(sum(valor) filter (where status = 'disponivel'), 0), 2) as disponivel,
  round(coalesce(sum(valor) filter (where status = 'a_liberar'), 0), 2) as a_liberar,
  round(coalesce(sum(valor) filter (where status in ('disponivel', 'a_liberar')), 0), 2) as total
from public.carteira_movimentos
group by user_id;

alter table public.carteira_movimentos enable row level security;
drop policy if exists carteira_admin_le on public.carteira_movimentos;
create policy carteira_admin_le on public.carteira_movimentos for select to authenticated using (public.nz_is_admin());
-- Sem policy para o próprio usuário de propósito: o extrato dele sai pela rota
-- (op minha-carteira), que não devolve origem_user_id. Escrita: só service role.

-- ======================================================= pedidos
alter table public.pedidos add column if not exists incentivos_processados_em timestamptz;
alter table public.pedidos add column if not exists incentivos_estornados_em timestamptz;
comment on column public.pedidos.incentivos_processados_em is 'Quando o motor de incentivos criou os créditos deste pedido (FATURADO no ERP). Nulo = ainda não.';

-- ======================================================= cupons
alter table public.cupons drop constraint if exists cupons_tipo_check;
alter table public.cupons add constraint cupons_tipo_check check (tipo in ('afiliado', 'campanha', 'super', 'nominal'));
alter table public.cupons add column if not exists so_conta_nova boolean not null default false;
alter table public.cupons add column if not exists usos_por_cliente int;
alter table public.cupons add column if not exists comissao_pct numeric(6,2);
alter table public.cupons add column if not exists descricao text;
alter table public.cupons add column if not exists criado_por uuid;
alter table public.cupons add column if not exists atualizado_em timestamptz;
comment on column public.cupons.usos_por_cliente is 'Quantas vezes o MESMO cliente pode usar (super cupom = 1). Nulo = sem limite por cliente.';
comment on column public.cupons.comissao_pct is 'Super cupom: % do pedido que vira cashback para o dono (nulo = loja_config.pct_cashback_indicador).';
comment on column public.cupons.so_conta_nova is 'Só vale para quem ainda não tem compra paga (D2/D22).';
create index if not exists cupons_super_dono_idx on public.cupons (dono_user_id) where tipo = 'super';

create table if not exists public.cupom_usos (
  id bigserial primary key,
  cupom_codigo text not null references public.cupons (codigo) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  pedido_id uuid references public.pedidos (id) on delete cascade,
  usado_em timestamptz not null default now(),
  unique (cupom_codigo, pedido_id)
);
comment on table public.cupom_usos is 'Um uso consumido do cupom por pedido (pagamento no checkout ou faturamento do orçamento). É o que conta o limite por cliente.';
create index if not exists cupom_usos_cliente_idx on public.cupom_usos (cupom_codigo, user_id);
alter table public.cupom_usos enable row level security;
drop policy if exists cupom_usos_admin on public.cupom_usos;
create policy cupom_usos_admin on public.cupom_usos for select to authenticated using (public.nz_is_admin());

-- ======================================================= afiliados
alter table public.afiliados add column if not exists status text not null default 'aprovado' check (status in ('pendente', 'aprovado', 'suspenso'));
alter table public.afiliados add column if not exists pct_ativacao numeric(6,2);
alter table public.afiliados add column if not exists pct_recorrencia numeric(6,2);
alter table public.afiliados add column if not exists desconto_cupom_pct numeric(6,2);
alter table public.afiliados add column if not exists periodicidade text not null default 'mensal' check (periodicidade in ('mensal', 'quinzenal'));
alter table public.afiliados add column if not exists aprovado_em timestamptz;
alter table public.afiliados add column if not exists aceite_termos_em timestamptz;
alter table public.afiliados add column if not exists documento text;
alter table public.afiliados add column if not exists tipo_documento text;
alter table public.afiliados add column if not exists obs_admin text;
alter table public.afiliados add column if not exists atualizado_em timestamptz;
comment on column public.afiliados.pct_ativacao is 'Comissão da 1ª compra faturada de cada filiado (%). Nulo = loja_config.pct_ativacao_afiliado.';
comment on column public.afiliados.pct_recorrencia is 'Comissão das compras seguintes (%), apurada por período. Nulo = loja_config.pct_recorrencia_afiliado (ou o percentual antigo).';
comment on column public.afiliados.desconto_cupom_pct is 'Desconto que o cupom do afiliado dá ao filiado (%). Nulo = loja_config.desconto_cupom_afiliado_pct (D27).';
comment on column public.afiliados.periodicidade is 'Fechamento da recorrência: mensal ou quinzenal, à escolha do afiliado (D25).';
-- Quem já era afiliado continua aprovado (coluna nasce com default 'aprovado').
update public.afiliados set aprovado_em = coalesce(aprovado_em, criado_em) where status = 'aprovado';

-- ======================================================= user_profiles
alter table public.user_profiles add column if not exists filiado_em timestamptz;
comment on column public.user_profiles.filiado_em is 'Quando a conta ficou vinculada ao afiliado de indicado_por (cadastro com o cupom dele, ou 1ª compra com o cupom). Permanente (D23).';

-- ======================================================= loja_config
alter table public.loja_config add column if not exists pct_desconto_indicado numeric(6,2);
alter table public.loja_config add column if not exists pct_cashback_indicador numeric(6,2);
alter table public.loja_config add column if not exists pct_ativacao_afiliado numeric(6,2);
alter table public.loja_config add column if not exists pct_recorrencia_afiliado numeric(6,2);
alter table public.loja_config add column if not exists desconto_cupom_afiliado_pct numeric(6,2);
alter table public.loja_config add column if not exists dias_liberacao_cashback int not null default 7;
alter table public.loja_config add column if not exists meses_validade_cashback int not null default 12;
alter table public.loja_config add column if not exists saque_minimo numeric(12,2) not null default 50;
alter table public.loja_config add column if not exists saque_hora_corte text not null default '14:00';
alter table public.loja_config add column if not exists imposto_pct numeric(6,2);
alter table public.loja_config add column if not exists comissao_embutida_pct numeric(6,2);
alter table public.loja_config add column if not exists trava_margem_ativa boolean not null default false;
alter table public.loja_config add column if not exists linhas_excluidas text[] not null default '{}';
alter table public.loja_config add column if not exists periodicidade_padrao text not null default 'mensal';
alter table public.loja_config add column if not exists super_cupom_ativo boolean not null default true;
alter table public.loja_config add column if not exists teto_mensal_premios numeric(12,2);
comment on column public.loja_config.trava_margem_ativa is 'Trava da §5 do plano: só corta incentivo quando ligada E com imposto_pct e comissao_embutida_pct preenchidos (confirmar com o Davi/Danila).';

-- ======================================================= gamificação (G1)
create table if not exists public.niveis_programa (
  id bigserial primary key,
  publico text not null check (publico in ('indicador', 'afiliado')),
  ordem int not null,
  nome text not null,
  icone text,
  criterio_tipo text not null check (criterio_tipo in ('indicados_12m', 'faturamento_12m')),
  criterio_valor numeric not null default 0,
  multiplicador numeric(6,2) not null default 1,
  ativo boolean not null default true,
  unique (publico, ordem)
);
create table if not exists public.conquistas (
  codigo text primary key,
  nome text not null,
  descricao text,
  icone text,
  publico text not null default 'indicador' check (publico in ('indicador', 'afiliado', 'todos')),
  bonus_valor numeric(12,2) not null default 0,
  ativa boolean not null default true,
  ordem int not null default 0
);
create table if not exists public.conquistas_usuario (
  user_id uuid not null references auth.users (id) on delete cascade,
  codigo text not null references public.conquistas (codigo) on delete cascade,
  obtida_em timestamptz not null default now(),
  vista_em timestamptz,
  bonus_movimento_id bigint references public.carteira_movimentos (id) on delete set null,
  primary key (user_id, codigo)
);
create table if not exists public.eventos_programa (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null,
  payload jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  visto_em timestamptz
);
comment on table public.eventos_programa is 'Os "momentos" do programa (cadastrou, aprovado, comprou, liberado, conquista). Sem dado pessoal do indicado (§9).';
create index if not exists eventos_programa_user_idx on public.eventos_programa (user_id, criado_em desc);

alter table public.niveis_programa enable row level security;
alter table public.conquistas enable row level security;
alter table public.conquistas_usuario enable row level security;
alter table public.eventos_programa enable row level security;
drop policy if exists niveis_le on public.niveis_programa;
create policy niveis_le on public.niveis_programa for select to authenticated using (true);
drop policy if exists niveis_admin on public.niveis_programa;
create policy niveis_admin on public.niveis_programa for all to authenticated using (public.nz_is_admin()) with check (public.nz_is_admin());
drop policy if exists conquistas_le on public.conquistas;
create policy conquistas_le on public.conquistas for select to authenticated using (true);
drop policy if exists conquistas_admin on public.conquistas;
create policy conquistas_admin on public.conquistas for all to authenticated using (public.nz_is_admin()) with check (public.nz_is_admin());
drop policy if exists conquistas_usuario_meus on public.conquistas_usuario;
create policy conquistas_usuario_meus on public.conquistas_usuario for select to authenticated using (user_id = auth.uid() or public.nz_is_admin());
drop policy if exists eventos_meus on public.eventos_programa;
create policy eventos_meus on public.eventos_programa for select to authenticated using (user_id = auth.uid() or public.nz_is_admin());

-- Níveis (D17, tema de corrida) e conquistas (§11.3). Só NOMES e critérios;
-- multiplicadores e bônus em R$ entram por script, fora do git.
insert into public.niveis_programa (publico, ordem, nome, icone, criterio_tipo, criterio_valor) values
  ('indicador', 1, 'Largada',       '🏁', 'indicados_12m', 0),
  ('indicador', 2, 'Volta Rápida',  '⚡', 'indicados_12m', 1),
  ('indicador', 3, 'Pódio',         '🏆', 'indicados_12m', 3),
  ('indicador', 4, 'Pole Position', '🥇', 'indicados_12m', 6),
  ('indicador', 5, 'Campeão',       '👑', 'indicados_12m', 10),
  ('afiliado',  1, 'Largada',       '🏁', 'faturamento_12m', 0),
  ('afiliado',  2, 'Volta Rápida',  '⚡', 'faturamento_12m', 5000),
  ('afiliado',  3, 'Pódio',         '🏆', 'faturamento_12m', 20000),
  ('afiliado',  4, 'Pole Position', '🥇', 'faturamento_12m', 50000),
  ('afiliado',  5, 'Campeão',       '👑', 'faturamento_12m', 120000)
on conflict (publico, ordem) do nothing;

insert into public.conquistas (codigo, nome, descricao, icone, publico, ordem) values
  ('primeira_indicacao', 'Bandeirada',    'Seu primeiro indicado se cadastrou.',               '🏁', 'todos', 1),
  ('primeiro_aprovado',  'Na pista',      'Seu primeiro indicado foi aprovado.',               '🛣️', 'todos', 2),
  ('primeira_venda',     'Primeira volta','A primeira compra de um indicado foi faturada.',    '🏎️', 'todos', 3),
  ('primeiro_saque',     'Pit stop',      'Seu primeiro saque foi pago.',                      '🔧', 'todos', 4),
  ('tres_no_mes',        'Hat-trick',     'Três indicados compraram no mesmo mês.',            '🎩', 'todos', 5),
  ('indicou_platinum',   'Patrocinador',  'Um indicado seu foi aprovado na faixa Platinum.',   '💎', 'todos', 6),
  ('sequencia_3',        'Regularidade',  'Três meses seguidos com compra de indicado.',       '📈', 'afiliado', 7),
  ('nivel_campeao',      'Campeão',       'Você chegou ao último nível.',                      '👑', 'todos', 8)
on conflict (codigo) do nothing;

notify pgrst, 'reload schema';
