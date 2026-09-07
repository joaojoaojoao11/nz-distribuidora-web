-- Ponte site → NZERP, fase 4: de quem é cada título do contas a receber.
--
-- Por que isto existe: metade dos títulos vivos do ERP não tem CPF/CNPJ nem
-- orçamento — só o nome do cliente. E o próprio ERP já trabalha assim: a view
-- `v_accounts_receivable`, que as telas financeiras dele usam, tem uma coluna
-- `IDCliente` que é literalmente `cliente_nome`. Atribuir por nome não é
-- invenção nossa; é a chave que o sistema usa internamente.
--
-- Por que a tabela mora AQUI e não lá: regra do projeto — o NZERP é somente
-- leitura (docs/PLANO_CONEXAO_NZERP.md §0). Nenhuma coluna nova, nenhum
-- gatilho, nenhum índice lá dentro.
--
-- O que não casar fica DE FORA, aparece no relatório do admin e é atribuído à
-- mão com o tempo, como o João pediu. Título sem dono não aparece para
-- ninguém — o silêncio é o padrão seguro.

create table if not exists public.erp_titulo_dono (
  titulo_id       uuid primary key,               -- contas_receber.id no ERP
  erp_client_id   uuid not null,                  -- clients.id no ERP
  chave           text not null,                  -- como foi decidido
  confianca       text not null,
  cliente_nome    text,                           -- só para o relatório do admin
  vencimento      date,                           -- idem: dá para revisar sem ler o ERP
  valor           numeric(14, 2),
  confirmado_por  uuid references auth.users (id) on delete set null,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);

alter table public.erp_titulo_dono drop constraint if exists erp_titulo_dono_chave_check;
alter table public.erp_titulo_dono add constraint erp_titulo_dono_chave_check
  check (chave in ('documento', 'orcamento', 'nome', 'manual'));

alter table public.erp_titulo_dono drop constraint if exists erp_titulo_dono_confianca_check;
alter table public.erp_titulo_dono add constraint erp_titulo_dono_confianca_check
  check (confianca in ('alta', 'media', 'manual'));

create index if not exists erp_titulo_dono_cliente_idx on public.erp_titulo_dono (erp_client_id);
create index if not exists erp_titulo_dono_chave_idx on public.erp_titulo_dono (chave);

comment on table public.erp_titulo_dono is
  'De quem é cada título do contas a receber do NZERP. Preenchida por job (documento > orçamento > nome exato e não ambíguo) e pelo botão do admin. O ERP nunca é escrito.';

-- Ninguém lê isto direto do navegador: o cliente vê o SEU histórico por um
-- módulo do servidor, que já filtra. RLS ligada e sem política = só service_role.
alter table public.erp_titulo_dono enable row level security;

-- Quando o job rodou pela última vez e o que sobrou; lido pelo painel admin.
create table if not exists public.erp_atribuicao_log (
  id            bigserial primary key,
  rodou_em      timestamptz not null default now(),
  titulos_lidos int not null default 0,
  por_documento int not null default 0,
  por_orcamento int not null default 0,
  por_nome      int not null default 0,
  sem_dono      int not null default 0,
  ambiguos      int not null default 0,
  duracao_ms    int,
  erro          text
);

alter table public.erp_atribuicao_log enable row level security;
