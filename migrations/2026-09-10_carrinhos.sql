-- Carrinho no servidor.
--
-- Até aqui o carrinho vivia SÓ no localStorage do navegador. Três coisas eram
-- impossíveis por causa disso:
--   1. o cliente montar no celular e fechar no computador;
--   2. o próprio cliente reencontrar o que deixou ("carrinho guardado");
--   3. a NZ saber quem desistiu — carrinho abandonado não existia como dado.
--
-- Uma linha por usuário: carrinho é estado atual, não histórico. O navegador
-- continua sendo a fonte imediata (a loja não pode depender da rede para somar
-- um item); isto aqui é a cópia durável, gravada com atraso.

create table if not exists public.carrinhos (
  user_id uuid primary key references auth.users(id) on delete cascade,
  itens jsonb not null default '[]'::jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  -- Quando saiu o último e-mail de recuperação. Sem isto, ligar o Resend
  -- amanhã significaria mandar o mesmo lembrete todo dia para o mesmo carrinho.
  lembrado_em timestamptz
);

comment on table public.carrinhos is
  'Carrinho durável do cliente (uma linha por usuário). Espelho do localStorage.';

alter table public.carrinhos enable row level security;

drop policy if exists carrinhos_proprio on public.carrinhos;
create policy carrinhos_proprio on public.carrinhos
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists carrinhos_admin_le on public.carrinhos;
create policy carrinhos_admin_le on public.carrinhos
  for select to authenticated
  using (public.nz_is_admin());

create index if not exists carrinhos_atualizado_idx on public.carrinhos (atualizado_em desc);

-- ------------------------------------------------------ relatório do admin
-- O valor NÃO vem do cliente: é recalculado aqui a partir de `erp_produtos`.
-- Guardar um total mandado pelo navegador daria um número bonito e mentiroso.
create or replace function public.carrinhos_abandonados(p_horas int default 24)
returns table (
  user_id uuid,
  nome text,
  email text,
  telefone text,
  itens int,
  valor_estimado numeric,
  atualizado_em timestamptz,
  lembrado_em timestamptz
)
language sql
stable
security definer
set search_path to 'public'
as $$
  select
    c.user_id,
    p.full_name,
    p.email,
    p.phone,
    (select count(*)::int from jsonb_array_elements(c.itens)) as itens,
    coalesce((
      select sum(
        coalesce(
          case when i->>'unidade' = 'rolo' then e.preco_rolo else e.preco_metro end,
          0
        ) * coalesce((i->>'qtd')::numeric, 0)
      )
      from jsonb_array_elements(c.itens) i
      left join public.produtos pr on pr.slug = i->>'slug'
      left join public.erp_produtos e on e.sku = pr.erp_sku
    ), 0) as valor_estimado,
    c.atualizado_em,
    c.lembrado_em
  from public.carrinhos c
  join public.user_profiles p on p.id = c.user_id
  where public.nz_is_admin()
    and jsonb_array_length(c.itens) > 0
    and c.atualizado_em < now() - make_interval(hours => greatest(p_horas, 0))
    -- Quem já fechou pedido depois de montar o carrinho não está abandonado.
    and not exists (
      select 1 from public.pedidos ped
      where ped.user_id = c.user_id and ped.criado_em > c.atualizado_em
    )
  order by valor_estimado desc, c.atualizado_em desc;
$$;

revoke all on function public.carrinhos_abandonados(int) from public;
grant execute on function public.carrinhos_abandonados(int) to authenticated;
