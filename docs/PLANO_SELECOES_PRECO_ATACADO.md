# Seleções configuráveis, preço de atacado, Central de ocorrências e bolinhas de estoque — NZSTORE

> **STATUS: IMPLANTADO em 2026-09-08.** Planejado pelo Fable, executado pelo Opus.
> Commits: `c854802` (Central), `4a6d9f9` (atacado), `f94ebcd` (bolinhas),
> `0041a6e` (seleções), `8dc3ee2` (autoteste), `b8fb635` (Minhas seleções),
> `743a2cf` (informar problema).
>
> **O que mudou em relação ao plano, e por quê:**
> * A Fase 5 original (carrinho e checkout honrando o preço da seleção) foi
>   **descartada pelo João** na revisão — o manejo de preço é manual, na
>   negociação. Consequência de desenho: dentro de uma seleção com preço, o botão
>   de compra vira "Pedir pelo WhatsApp", senão o cliente veria +X % no card e a
>   tabela no checkout.
> * A **Central de ocorrências** e o botão **"Informar um problema"** entraram na
>   mesma revisão e viraram as Fases 1 e 6.
> * O contador de visitas virou uma função SQL (`selecao_registrar_visita`):
>   ler e regravar `visitas + 1` no Node perde contagem com duas pessoas abrindo
>   o link no mesmo segundo.
> * `usePrecosMapa(selecao?)` devolve o mapa **já recortado** pelo contexto, em
>   vez de expor as chaves compostas. Foi a forma de evitar o risco 6.3: um
>   chamador esquecido lê o preço da loja em vez de pescar, por acidente, o preço
>   com acréscimo que outra tela carregou.
> * Durante a Fase 2 o sync ficou **desligado por ~4 minutos** (`sync_ativo`), do
>   backfill até o deploy sair. Sem isso o webhook do ERP (a cada 5 min, com o
>   código antigo) teria reescrito `preco_rolo` com o varejo. Está religado.
>
> Pedido do João (2026-09-08), com a `/loja` aberta em modo MONTAR SELEÇÃO:
> *"quero que seja possível, na seleção montada, abrir uma telinha de configuração
> de seleção, que eu posso mostrar os preços apenas daqueles itens selecionados
> [...] um campo de aumentar preço em % [...] o link expira em 24h mas em minha
> conta, no menu catálogo, tem as minhas seleções [...] duas abas, ativas e
> expiradas [...] o site agora considere o preço atacado, tanto para rolo quanto
> para fracionado [...] bolinha verde para rolo fechado e laranja para
> fracionado, apenas para usuários administrativos."*
>
> Revisão do João (mesmo dia): *"se [o atacado] estiver zerado tem que ficar
> notificado para o usuário central, que é uma área dentro do painel
> administrativo que é o painel de erros e mudanças [...] em todo produto tenha um
> botão de informar problema, que o usuário pode clicar, escrever uma mensagem,
> até anexar uma imagem, que vai para esse painel também [...] checkout honrar o
> preço da seleção: não precisa, esse manejo de preço é algo manual ali na hora, o
> login depois segue o preço tabelado mesmo."*

---

## 0. Resumo executivo

Sete fases, nesta ordem:

| Fase | Entrega | Tamanho | Depende de |
|---|---|---|---|
| 1 | **Central de ocorrências** em `/admin/central`: tabela `ocorrencias`, abas Erros · Mudanças · Problemas informados · Resolvidas, badge no menu | M | — |
| 2 | O site passa a mostrar e cobrar o **preço de atacado** (rolo e metro). Admin vê o varejo como referência. **Atacado zerado vira ocorrência na Central**; o sync também registra mudanças (SKU novo, SKU removido, preço que mudou muito) | P | 1 |
| 3 | **Bolinhas de estoque** no card e na página do produto, só para admin: verde = tem rolo fechado, laranja = tem rolo aberto (fracionado) | P | — |
| 4 | **Seleção configurável**: telinha ao concluir (mostrar preço? acréscimo %?), link curto `/loja/s/<token>` que **expira em 24 h**, preço liberado para quem abre o link **só nos itens da seleção**, com o acréscimo aplicado. Dentro da seleção a compra é pelo WhatsApp | G | 2 |
| 5 | **Minhas seleções** em `/painel/selecoes` (grupo Catálogo), abas **Ativas** e **Expiradas**, com copiar link, WhatsApp, renovar e encerrar | M | 4 |
| 6 | Botão **"Informar um problema"** em toda página de produto: mensagem + imagem opcional, sem exigir login, cai na Central | M | 1 |
| 7 | Testes automatizados, verificação em produção, documentação e memória | P | 1–6 |

A Central vem primeiro porque a Fase 2 já precisa gravar nela. A Fase 2 vem
antes das seleções porque o acréscimo é calculado **sobre o atacado**.

---

## 1. Como está hoje (levantado no código)

### 1.1 Preço

- O NZERP tem, em `pricing_engineering`, **quatro** colunas de venda:
  `preco_venda_ideal_atacado`, `preco_venda_min_atacado`,
  `preco_venda_ideal_fracionado`, `preco_venda_min_fracionado`. Não existe coluna
  chamada "varejo".
- Na tela de preços do ERP (`components/PricingEngineering.tsx`, linhas ~892–1000)
  a coluna **"Preço V" (varejo)** é `preco_venda_ideal_*` e a **"Preço A" (atacado)**
  é `preco_venda_min_*`. O caderno de preços confirma: *"A tabela publicada é o
  varejo; o preço praticado é o atacado. No atacado, o antigo preço de varejo
  virou o mínimo."*
- A view `precos_site` do ERP ([migrations/erp/20260906_site_views.sql](../migrations/erp/20260906_site_views.sql), l. 43–53)
  entrega `preco_rolo = ideal_atacado` (**varejo**) e `preco_rolo_min = min_atacado`
  (**atacado**); idem para metro.
- O sync ([api/_lib/handlers/sync.ts](../api/_lib/handlers/sync.ts), função `espelhar`)
  copia isso 1:1 para `erp_produtos.preco_rolo / preco_metro / preco_rolo_min / preco_metro_min`.
- **Tudo que cobra ou mostra preço lê `erp_produtos.preco_rolo` e `preco_metro`**,
  ou seja, hoje o site inteiro trabalha com o **varejo**:
  - [api/_lib/handlers/precos.ts](../api/_lib/handlers/precos.ts) — preço do card e da página (admin recebe também `roloMin/metroMin`);
  - [api/_lib/pedido/precificar.ts](../api/_lib/pedido/precificar.ts) — o valor do pedido e do checkout (rolo = `preco_rolo ÷ metragem` por metro);
  - função `carrinhos_abandonados` em [migrations/2026-09-10_carrinhos.sql](../migrations/2026-09-10_carrinhos.sql) — valor estimado do carrinho abandonado;
  - [src/pages/Loja/Preco.tsx](../src/pages/Loja/Preco.tsx) — mostra "mín." em cinza para admin.
- Preço zero já é tratado como "sem preço" no endpoint (commit `5e428c7`), mas ninguém é avisado: o produto simplesmente aparece sem valor.

### 1.2 Seleção

- [src/pages/Loja/Loja.tsx](../src/pages/Loja/Loja.tsx): botão **MONTAR SELEÇÃO / CONCLUIR** (visível para todo mundo), modo `curando` em que o × do card manda o slug para `?fora=`; "COPIAR LINK DA SELEÇÃO" gera `/loja?sel=slug1,slug2,…` (máx. 120, limite da URL).
- [src/pages/Loja/useShopFilters.ts](../src/pages/Loja/useShopFilters.ts): `?sel=` é a "seleção congelada" — quando presente, os filtros somem e a lista é exatamente aquela.
- Não existe tabela, não existe expiração, não existe "minhas seleções". O link é a própria lista de slugs e não carrega nenhuma configuração.
- Preço no link: quem abre anônimo vê "Entre para ver o preço" — o endpoint devolve **401** para anônimo e **403** para não aprovado.

### 1.3 Estoque

- `erp_produtos` já tem `rolos_fechados` e `rolos_abertos` (contagem de LPNs por `status_rolo` na view `estoque_site`), sincronizados junto com o preço.
- O catálogo público (`loja_catalogo` → JSON) só carrega o nível qualitativo (`nivel_estoque`), por desenho: nada restrito entra no JSON.
- [api/_lib/handlers/estoque.ts](../api/_lib/handlers/estoque.ts) dá o saldo para reseller/admin, mas para admin faz **uma consulta ao vivo no ERP por SKU** (LPNs) — não serve para 60 cards de uma vez.
- [api/_lib/handlers/precos.ts](../api/_lib/handlers/precos.ts) já é chamado **em lote por página de cards** (até 80 slugs), já lê `erp_produtos` e já tem um bloco "só admin". É o lugar certo para a bolinha.

### 1.4 Painel admin, painel do cliente e papéis

- Papel é decidido no servidor por [api/_lib/papel.ts](../api/_lib/papel.ts) (`anonimo | client | reseller | admin`); no cliente, `useAuth().isAdmin`.
- **Não existe** nenhuma área de erros, alertas ou ocorrências no admin. O que há são logs por assunto (`erp_sync_log`, `equipe_log`, `erp_atribuicao_log`, `blog_ai_run_log`), sem tela consolidada.
- Menu admin em [src/pages/Admin/adminNav.ts](../src/pages/Admin/adminNav.ts); badges por chave (`clientes | garantias | promo`) contados em `AdminLayout.carregarBadges`. Rotas admin em `App.tsx` (l. 120–150).
- Menu do painel do cliente em [src/pages/Painel/painelNav.ts](../src/pages/Painel/painelNav.ts); grupo `catalogo` tem Favoritos e Vistos. Rotas em `App.tsx` (l. 177–194).
- Storage: `site-assets` é público e só admin escreve; `warranties` aceita envio anônimo de PDF ≤ 5 MB. Anônimo **não** tem como subir imagem em bucket nenhum — o envio do "informar problema" tem de passar pelo servidor.
- Painéis flutuantes na loja precisam de **portal** (a navbar tem `backdrop-filter`, ver memória do carrinho).
- Vercel Hobby: **12 funções no máximo**. Todo endpoint novo entra no roteador [api/nz/[acao].ts](../api/nz/[acao].ts), nunca como arquivo novo em `api/`. Corpo da requisição ≤ 4,5 MB.
- Migrations são aplicadas com `node scripts/aplicar-sql.mjs site migrations/<arquivo>.sql`.

---

## 2. Decisões (confirmadas pelo João em 2026-09-08)

| # | Decisão | Status |
|---|---|---|
| **D1** | **Atacado = `preco_venda_min_*` do ERP** ("Preço A"). Passa a ser o `preco_rolo/preco_metro` do site para todo mundo. O varejo (`ideal_*`) vai para `preco_rolo_varejo/preco_metro_varejo`, visíveis **só para admin**, no lugar do "mín." de hoje. **Atacado zerado/nulo cai no varejo E gera ocorrência na Central** (tipo `preco-zerado`), uma por SKU, que se resolve sozinha quando o atacado chega. | ✅ confirmado, com a Central |
| **D2** | **MONTAR SELEÇÃO só para admin (equipe NZ).** Links antigos `?sel=` continuam funcionando, sem preço. | ✅ |
| **D3** | **O acréscimo vale para qualquer pessoa que abra o link**, logada ou não. Admin vê o preço da seleção **e** o base + o %. | ✅ |
| **D4** | Limite sobe de 120 para **300 itens**. Constante única `MAX_SELECAO` no cliente e `check` no banco. | ✅ |
| **D5** | Link expirado abre **página "Esta seleção expirou"**; **Renovar** reaproveita o **mesmo link** (+24 h). | ✅ |
| **D6** | **Checkout NÃO honra o preço da seleção.** O manejo de preço da seleção é manual, na negociação; quem loga e compra pelo site paga a tabela (atacado). Consequência de desenho: **dentro de uma seleção com preço, o bloco "Adicionar ao carrinho" é substituído por "Pedir pelo WhatsApp"** (mensagem já com o nome do produto e o link da seleção) — para o cliente não ver +10 % no card e outro número no carrinho. O carrinho nunca guarda seleção. | ✅ (revisado) |
| **D7** | Rota **`/loja/s/<token>`** (12 caracteres, base64url). Página do produto aberta a partir dela recebe **`?s=<token>`**. `noindex` nas duas. | ✅ |
| **D8** | Validade padrão **24 h**, em `loja_config.selecao_validade_horas` (sem tela nesta rodada). | ✅ |
| **D9** | **Central de ocorrências** = `/admin/central`, grupo Sistema, badge com o total de abertas. Três categorias: **erro** (sistema: preço zerado, sync falhou), **mudança** (sync: SKU novo, SKU removido do ERP, preço que mudou mais de `loja_config.alerta_variacao_preco_pct`, padrão 20 %) e **problema** (informado por usuário). Resolver é manual, com nota opcional; "mudança" se marca como vista. | novo — interpretação do "painel de erros e mudanças"; ajustar os tipos de mudança se o João quiser outros |
| **D10** | **"Informar um problema"** em toda página de produto, **sem exigir login**: motivo, mensagem (10–1000 caracteres), imagem opcional (redimensionada no navegador para ≤ 1600 px, JPEG, ≤ 1,5 MB), contato opcional (preenchido com o e-mail se logado). Vai por `POST /api/nz/ocorrencias` para bucket **privado** `ocorrencias`; admin vê por URL assinada. Anti-abuso: honeypot + no máximo 5 envios por hora por IP (hash). | novo |

---

## 3. Desenho da solução

### 3.1 Banco (projeto do site `uibjmvkvbthzypgozpcs`)

**`migrations/2026-09-11_central_ocorrencias.sql`** (Fase 1)

```sql
create table if not exists public.ocorrencias (
  id            uuid primary key default gen_random_uuid(),
  categoria     text not null check (categoria in ('erro', 'mudanca', 'problema')),
  tipo          text not null check (tipo in (
                  'preco-zerado', 'sync-erro',                       -- erro
                  'sku-novo', 'sku-removido', 'preco-mudou',          -- mudanca
                  'problema-produto'                                  -- problema
                )),
  status        text not null default 'aberta' check (status in ('aberta', 'resolvida')),
  titulo        text not null,
  detalhe       jsonb not null default '{}'::jsonb,   -- {antes, depois, variacaoPct, semPreco, motivo, ...}
  produto_slug  text,
  erp_sku       text,
  -- Uma ocorrência ABERTA por chave: 'preco-zerado:NZW203'. Fechou, pode nascer outra.
  chave_dedupe  text,
  -- Quem informou (problema): usuário, contato livre, mensagem, imagem, origem.
  user_id       uuid references auth.users(id) on delete set null,
  contato       text,
  mensagem      text,
  imagem_path   text,
  url           text,
  user_agent    text,
  ip_hash       text,
  criado_em     timestamptz not null default now(),
  resolvido_em  timestamptz,
  resolvido_por uuid references auth.users(id) on delete set null,
  nota_resolucao text
);
create unique index if not exists ocorrencias_aberta_por_chave
  on public.ocorrencias (chave_dedupe) where status = 'aberta' and chave_dedupe is not null;
create index if not exists ocorrencias_status_idx on public.ocorrencias (status, categoria, criado_em desc);
create index if not exists ocorrencias_ip_hora_idx on public.ocorrencias (ip_hash, criado_em) where tipo = 'problema-produto';

alter table public.ocorrencias enable row level security;
-- Admin lê e resolve pelo cliente; INSERT só pelo servidor (service role).
create policy ocorrencias_admin_le on public.ocorrencias
  for select to authenticated using (public.nz_is_admin());
create policy ocorrencias_admin_resolve on public.ocorrencias
  for update to authenticated using (public.nz_is_admin()) with check (public.nz_is_admin());

alter table public.loja_config add column if not exists alerta_variacao_preco_pct numeric(5,2) not null default 20;

-- Bucket PRIVADO das imagens do "informar problema". Escrita só pelo servidor;
-- leitura por URL assinada, que só admin consegue gerar.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ocorrencias', 'ocorrencias', false, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
create policy ocorrencias_admin_le_imagem on storage.objects
  for select to authenticated using (bucket_id = 'ocorrencias' and public.nz_is_admin());
```

**`migrations/2026-09-11b_preco_atacado.sql`** (Fase 2)

```sql
alter table public.erp_produtos
  add column if not exists preco_rolo_varejo  numeric(12,2),
  add column if not exists preco_metro_varejo numeric(12,2);

comment on column public.erp_produtos.preco_rolo  is 'ATACADO (preco_venda_min_atacado do ERP). É o preço que o site mostra e cobra.';
comment on column public.erp_produtos.preco_metro is 'ATACADO (preco_venda_min_fracionado do ERP). É o preço que o site mostra e cobra.';
comment on column public.erp_produtos.preco_rolo_varejo  is 'VAREJO / tabela publicada (preco_venda_ideal_atacado). Só admin vê.';
comment on column public.erp_produtos.preco_metro_varejo is 'VAREJO / tabela publicada (preco_venda_ideal_fracionado). Só admin vê.';

-- Backfill idempotente: só roda enquanto as colunas novas estão vazias, isto é,
-- antes do primeiro sync com o mapeamento novo. Rodar depois não faz nada.
update public.erp_produtos
set preco_rolo_varejo  = preco_rolo,
    preco_metro_varejo = preco_metro,
    preco_rolo  = coalesce(nullif(preco_rolo_min, 0),  preco_rolo),
    preco_metro = coalesce(nullif(preco_metro_min, 0), preco_metro)
where preco_rolo_varejo is null and preco_metro_varejo is null;
```

**`migrations/2026-09-11c_selecoes.sql`** (Fase 4)

```sql
create table if not exists public.selecoes (
  id            uuid primary key default gen_random_uuid(),
  token         text not null unique,                       -- 12 chars base64url, gerado no servidor
  criado_por    uuid not null references auth.users(id) on delete cascade,
  titulo        text,
  slugs         text[] not null check (array_length(slugs, 1) between 1 and 300),
  mostrar_preco boolean not null default false,
  acrescimo_pct numeric(5,2) not null default 0 check (acrescimo_pct >= 0 and acrescimo_pct <= 100),
  expira_em     timestamptz not null,
  criado_em     timestamptz not null default now(),
  renovada_em   timestamptz,
  encerrada_em  timestamptz,
  visitas       int not null default 0,
  ultima_visita_em timestamptz
);
create index if not exists selecoes_criado_por_idx on public.selecoes (criado_por, expira_em desc);

alter table public.selecoes enable row level security;
-- Leitura: o dono e a equipe. Escrita: SÓ o servidor. Nenhuma policy de
-- insert/update/delete de propósito: o acréscimo e a validade nascem no servidor.
create policy selecoes_dono_le on public.selecoes
  for select to authenticated
  using (criado_por = auth.uid() or public.nz_is_admin());

alter table public.loja_config add column if not exists selecao_validade_horas int not null default 24;
```

> Anônimo **não** lê `selecoes` nem `ocorrencias` direto: a leitura pública da
> seleção é pelo endpoint, que devolve só os campos públicos (nunca
> `acrescimo_pct`, nunca `criado_por`).

### 3.2 API — `api/_lib/handlers/`

#### `api/_lib/ocorrencias.ts` (Fase 1) — módulo compartilhado, não é handler

```ts
export type NovaOcorrencia = { categoria; tipo; titulo; detalhe?; produtoSlug?; erpSku?; chaveDedupe?; ... };
/** Abre se não houver aberta com a mesma chave (upsert no índice parcial → ignora conflito). */
export async function abrirOcorrencia(site: Db, o: NovaOcorrencia): Promise<'aberta' | 'ja-existia'>;
/** Resolve as abertas de uma chave (ex.: o atacado chegou). */
export async function resolverPorChave(site: Db, chave: string, nota: string): Promise<number>;
```

Usado pelo sync (Fase 2), pelo handler `ocorrencias` (Fase 6) e por qualquer coisa futura que precise avisar a equipe.

#### `ocorrencias.ts` (Fase 6) — novo handler, registrado em `ROTAS` como `ocorrencias`

`POST /api/nz/ocorrencias`, `Cache-Control: no-store`, corpo `{ op: 'informar', slug, motivo, mensagem, contato?, imagem?: { tipo, base64 }, site?: '' /* honeypot */ }`:

1. Honeypot preenchido → responde 200 e não grava (não ensinar o robô).
2. Validar: `slug` existe em `produtos`; `motivo ∈ {'preco','foto','estoque','descricao','outro'}`; `mensagem` 10–1000 chars; `contato` ≤ 120; `imagem.tipo ∈ {jpeg,png,webp}` e base64 ≤ 2 MB decodificado.
3. `ip_hash = sha256(ip + SALT)` (ip de `x-forwarded-for`, salt = `CRON_SECRET` ou env própria); se houver ≥ 5 ocorrências `problema-produto` desse hash na última hora → 429.
4. Se logado (`resolverPapelDetalhado`), `user_id` e, sem `contato`, o e-mail do perfil.
5. Imagem: `site.storage.from('ocorrencias').upload(`${ano}/${id}.${ext}`, buffer, { contentType })`.
6. `abrirOcorrencia({ categoria: 'problema', tipo: 'problema-produto', titulo: `${nome do produto} — ${rótulo do motivo}`, detalhe: { motivo }, produtoSlug, erpSku, mensagem, contato, imagemPath, url, userAgent, ipHash })` — **sem** `chaveDedupe` (cada relato é um).
7. Resposta `{ ok: true, id }`.

#### `sync.ts` (Fase 2) — mapeamento novo em `espelhar()` + ocorrências

```ts
// ERP: precos_site.preco_rolo = ideal_atacado (VAREJO); preco_rolo_min = min_atacado (ATACADO).
// O site mostra e cobra ATACADO. Zero/nulo no atacado = ERP não precificou: cai no varejo
// E vira ocorrência na Central (abaixo).
const atacado = (min, varejo) => (Number(min) > 0 ? Number(min) : varejo ?? null);

preco_rolo:         atacado(p?.preco_rolo_min,  p?.preco_rolo),
preco_metro:        atacado(p?.preco_metro_min, p?.preco_metro),
preco_rolo_min:     p?.preco_rolo_min  ?? null,   // mantido por compatibilidade (= atacado)
preco_metro_min:    p?.preco_metro_min ?? null,
preco_rolo_varejo:  p?.preco_rolo  ?? null,
preco_metro_varejo: p?.preco_metro ?? null,
```

Ocorrências geradas pelo sync (não no `dry`, não quando `gatilho = 'webhook'` para as de *mudança* — o webhook bate a cada 5 min e o cron diário basta; as de *erro* valem em qualquer gatilho):

| tipo | quando | chave_dedupe | título | detalhe |
|---|---|---|---|---|
| `preco-zerado` (erro) | SKU **ativo** com `min_atacado` ou `min_fracionado` ≤ 0/nulo | `preco-zerado:<sku>` | "Atacado zerado: <sku> — <nome>" | `{ roloAtacado, metroAtacado, roloVarejo, metroVarejo, usandoVarejo: bool, semPreco: bool }` |
| (auto-resolução) | SKU que tinha `preco-zerado` aberta e agora tem os dois atacados > 0 | — | — | `resolverPorChave('preco-zerado:<sku>', 'atacado chegou no sync de <data>')` |
| `sync-erro` (erro) | `catch` do handler (onde já grava `erp_sync_log.erro`) | `sync-erro` | "Sync com o NZERP falhou" | `{ mensagem, gatilho, logId }` — resolve sozinha no próximo sync OK |
| `sku-novo` (mudança) | cada item de `paraCriar` | `sku-novo:<sku>` | "SKU novo no ERP: <sku> — <nome>" | `{ slug, linha_key, vertical }` |
| `sku-removido` (mudança) | cada SKU da reconciliação (`removidosData`) | `sku-removido:<sku>` | "SKU sumiu do ERP: <sku>" | `{ nome }` |
| `preco-mudou` (mudança) | `\|novo − antigo\| / antigo × 100 ≥ alerta_variacao_preco_pct` em `preco_rolo` **ou** `preco_metro` (comparando com o que estava em `erp_produtos` antes do upsert) | `preco-mudou:<sku>` | "Preço mudou 35 %: <sku> — <nome>" | `{ campo, antes, depois, variacaoPct }` |

Para o `preco-mudou` o `espelhar()` passa a ler `erp_produtos (sku, preco_rolo, preco_metro, preco_rolo_varejo)` antes do upsert (≈1.200 linhas, paginado como as outras leituras). Na **primeira** execução depois da migration, o `preco_rolo` antigo (varejo) vs novo (atacado) dispararia `preco-mudou` em todo SKU: pular a comparação quando `preco_rolo_varejo` estava `null` na linha antiga.

Atualizar o comentário de cabeçalho do arquivo e o comentário da view `precos_site` em `migrations/erp/20260906_site_views.sql` (só o comentário; a view não muda).

#### `precos.ts` (Fases 2, 3 e 4)

Corpo aceito: `{ slugs: string[], selecao?: string }`.

1. Resolver papel como hoje.
2. Se veio `selecao`: `select id, token, slugs, mostrar_preco, acrescimo_pct, expira_em, encerrada_em from selecoes where token = $1`. **Válida** = existe, `expira_em > now()`, `encerrada_em is null`. Inválida ou `mostrar_preco = false` → ignorar o token e seguir como hoje.
3. Acesso:
   - anônimo **sem** seleção válida → 401; não aprovado **sem** seleção válida → 403 (como hoje);
   - anônimo / não aprovado **com** seleção válida → 200, mas só os slugs de `selecoes.slugs` recebem preço; os outros `{ disponivel: false, foraDaSelecao: true }`;
   - aprovado / admin com seleção válida → preço normal para tudo, e **preço da seleção** para os slugs dentro dela.
4. Preço da seleção: `fator = 1 + acrescimo_pct / 100`; `rolo = r2(preco_rolo × fator)`, `metro = r2(preco_metro × fator)`; item ganha `viaSelecao: true`.
5. Só admin (bloco "campo a campo", como hoje):
   - `roloVarejo`, `metroVarejo` (substituem `roloMin/metroMin`; **remover** os antigos do payload);
   - `usandoVarejo: true` quando o preço mostrado é o varejo por falta de atacado (comparar `preco_rolo == preco_rolo_varejo && preco_rolo_min` nulo/zero);
   - dentro da seleção: `base: { rolo, metro }` e `acrescimoPct`;
   - `estoque: { rolosFechados, rolosAbertos }` (Fase 3 — acrescentar as colunas ao `select`);
   - `erpSku` como hoje.
6. Resposta `{ papel, selecao: token | null, itens }`. `Cache-Control: no-store` continua.

`r2` = `Math.round(x * 100) / 100`, igual ao de `precificar.ts` — extrair para `api/_lib/pedido/dinheiro.ts` e importar nos dois; não duplicar.

#### `selecoes.ts` (Fase 4) — novo, registrado em `ROTAS` como `selecoes`

`POST /api/nz/selecoes`, `Cache-Control: no-store`, corpo `{ op, ... }`:

| op | quem | entrada | saída |
|---|---|---|---|
| `criar` | admin | `{ slugs: string[], titulo?: string, mostrarPreco: boolean, acrescimoPct: number }` | `{ id, token, url, expiraEm, ignorados: string[] }` |
| `abrir` | público | `{ token }` | `{ token, titulo, slugs, mostrarPreco, expiraEm, expirada: false }` — quando expirada/encerrada: `{ token, titulo, expirada: true }` **sem** slugs. Incrementa `visitas`/`ultima_visita_em` (só quando válida e quem abre não é admin). |
| `renovar` | admin (dono ou qualquer admin) | `{ id }` | `{ expiraEm }` — `expira_em = now() + validade`, `encerrada_em = null`, `renovada_em = now()` |
| `encerrar` | admin | `{ id }` | `{ ok }` — `encerrada_em = now()` |

Validações de `criar`: 1 ≤ slugs ≤ 300, deduplicados, minúsculos, **todos existentes em `produtos`** (descartar desconhecidos → `ignorados`); `acrescimoPct` finito, 0–100, 2 casas; `mostrarPreco = false` grava acréscimo 0; `titulo` ≤ 80. Token: `crypto.randomBytes(9).toString('base64url')` (12 chars), repetir se colidir. Validade: `loja_config.selecao_validade_horas`. `url = ${SITE_URL}/loja/s/${token}` (importar o `SITE_URL` já exportado por `api/_lib/handlers/conta.ts`, l. 31; não criar outra constante).

**Nunca** devolver `acrescimo_pct` em `abrir`.

#### `precificar.ts` / `checkout.ts` — **sem mudança de lógica** (D6)

Continuam lendo `erp_produtos.preco_rolo/preco_metro`, que a partir da Fase 2 são o atacado. Só atualizar o tipo `Espelho` se precisar das colunas de varejo (não precisa) e o comentário do cabeçalho ("preço de atacado por metro" já está certo).

### 3.3 Cliente — store de preços `src/lib/shop/precos.ts` (Fase 4)

O cache de hoje é por slug e o estado (`anonimo | ok | …`) é global. Dentro de uma seleção o **mesmo slug tem outro preço** e um anônimo **tem** preço. Refatorar para **contexto = token da seleção (ou vazio)**:

- `export const chavePreco = (slug: string, selecao?: string) => `${selecao ?? ''}|${slug}``.
- `pendentes: Map<contexto, Set<slug>>`; `despachar()` roda **por contexto** e manda `{ slugs, selecao }`.
- O curto-circuito "sem token de sessão → `estado: anonimo`" **só vale para o contexto vazio**. Com seleção, a requisição vai sem `Authorization`.
- `estado` e `papel` passam a ser **por contexto** (`Map<contexto, { estado, papel }>`).
- API pública: `usePreco(slug, selecao?)`, `usePrecosLote(slugs, selecao?)`, `usePrecosMapa()` (mapa por `chavePreco`). Carrinho, mini-carrinho, painel do carrinho e checkout **continuam chamando sem `selecao`** (contexto vazio) — nada muda neles além de compilar com a assinatura nova.
- `PrecoItem`: trocar `roloMin/metroMin` por `roloVarejo/metroVarejo`; adicionar `usandoVarejo?`, `viaSelecao?`, `base?: { rolo, metro }`, `acrescimoPct?`, `estoque?: { rolosFechados, rolosAbertos }`, `foraDaSelecao?`.
- Login/logout continua zerando tudo (todos os contextos).

### 3.4 Loja (lista) — `src/pages/Loja/Loja.tsx` (Fase 4)

**Rota:** `App.tsx` ganha `<Route path="/loja/s/:token" element={<Loja />} />` **antes** de `/loja/:slug`.

**Leitura da seleção remota:** novo `src/lib/shop/selecoes.ts` com os tipos, `abrirSelecao(token)`, `criarSelecao(cfg)`, `renovarSelecao(id)`, `encerrarSelecao(id)`, `urlDaSelecao(token)`, `whatsappDaSelecao(token, titulo?, produto?)`, e um hook `useSelecaoRemota(token)` → `{ estado: 'carregando' | 'ok' | 'expirada' | 'inexistente', dados }`. Funções puras em `src/lib/shop/selecoes/regras.ts` (para o teste): `aplicarAcrescimo(valor, pct)`, `estaAtiva({ expira_em, encerrada_em }, agora)`, `validarConfig({ slugs, acrescimoPct, mostrarPreco })`, `MAX_SELECAO = 300`.

**Modo seleção (`?sel=` antigo):** continua igual (sem preço). `emSelecao` passa a ser `selection.length > 0 || Boolean(token)`.

**Modo seleção remota (`/loja/s/:token`):**
- `results` = `dados.slugs.map(getShopItem)` na ordem do servidor; filtros e sidebar somem; `noindex`.
- Banner: título (ou "Seleção da NZ para você"), "N produtos escolhidos pela nossa equipe", **"Válida até dd/mm às hh:mm"**. Se `mostrarPreco`: "Valores exclusivos desta seleção · fale com a gente para fechar"; senão "Valores sob consulta".
- Expirada/inexistente: hero substituído por bloco "Esta seleção expirou" (ou "não existe mais") + botão WhatsApp + "VER O CATÁLOGO COMPLETO →". Não lista nada.
- Cards recebem `selecao={dados.mostrarPreco ? token : undefined}`; `usePrecosLote(shown.slugs, selecaoToken)`.
- MONTAR SELEÇÃO **não** aparece dentro de uma seleção remota.

**Curadoria (só admin — `useAuth().isAdmin`):**
- O bloco `.curadoria` troca "COPIAR LINK DA SELEÇÃO (N)" por **"CONFIGURAR E GERAR LINK (N)"**. **CONCLUIR** com N > 0 também abre a telinha; com N = 0 só sai do modo.
- Aviso de limite: `results.length > MAX_SELECAO` → "Reduza para 300 itens ou menos".

**Telinha `src/pages/Loja/SelecaoConfig.tsx` (+ `.module.css`)** — `createPortal` em `document.body`, fecha com Esc e clique fora, trava o scroll do fundo (padrão do `MiniCarrinho`):
1. Cabeçalho: "Configurar seleção · N itens".
2. **Título** (opcional, placeholder "Ex.: Cliente João — foscos 3M", máx. 80).
3. Toggle **"Mostrar preço para quem abrir o link"** (default desligado). Apoio: "Quem abrir o link vê o preço destes N itens sem precisar de cadastro."
4. **"Acréscimo sobre o preço (%)"** — number, `min 0 max 100 step 0.5`, default 0, desabilitado com o toggle desligado. Apoio: "Aplicado só nesta seleção, sobre o preço de atacado."
5. Resumo ao vivo: "N itens · preço de atacado + X % · link válido por 24 h".
6. Ações: **GERAR LINK** (o único botão vermelho da tela) e "Cancelar".
7. Pós-criação (mesma telinha): link em campo somente-leitura, **COPIAR LINK** ("Copiado ✓"), **"Enviar no WhatsApp"**, "Ver em Minhas seleções" (`/painel/selecoes`). "Fechar" sai do modo curadoria e limpa `?fora=`.
8. Erro de rede/403: mensagem inline, botão continua ativo.

### 3.5 Página do produto — `LojaProduct.tsx`, `Preco.tsx`, `Comprar.tsx`, `ShopCard.tsx`

- `LojaProduct` lê `const selecao = searchParams.get('s') ?? undefined` e passa para `<Preco selecao>` e para os cards de relacionados (`selecao` + link com `?s=`).
- `ShopCard` ganha prop `selecao?: string`; o `Link` vira `` `/loja/${slug}${selecao ? `?s=${selecao}` : ''}` ``.
- `Preco.tsx`:
  - anônimo **dentro** de seleção com preço: mostra o preço com a legenda "Valor desta seleção";
  - admin: "tabela varejo R$ X" (cinza) no lugar de "mín. R$ X"; `usandoVarejo` → chip âmbar "sem atacado no ERP"; dentro de seleção: "base R$ Y · +Z %";
  - `foraDaSelecao` → `null`, como hoje para `disponivel: false`;
  - **quando `item.viaSelecao`, não renderiza `<Comprar>`**: no lugar, botão "Pedir pelo WhatsApp" com `whatsappDaSelecao(token, titulo, nome do produto)` e a nota "Valor desta seleção — pedido fechado com a equipe NZ" (D6).
- `Comprar.tsx` **não muda**.
- **"Informar um problema"** (Fase 6): link discreto ao lado de "Salvar nos favoritos" / compartilhar (`.actions` da página), abre `src/pages/Loja/InformarProblema.tsx` (+ `.module.css`, portal, mesmo padrão da telinha):
  1. select **Motivo**: "Preço não aparece ou está errado" (`preco`), "Foto errada ou faltando" (`foto`), "Estoque / disponibilidade" (`estoque`), "Descrição ou ficha técnica" (`descricao`), "Outro" (`outro`);
  2. **Mensagem** (textarea, 10–1000, contador);
  3. **Foto** (opcional): `<input type="file" accept="image/*" capture="environment">`; preview; redimensiona no navegador com canvas para ≤ 1600 px, JPEG 0,85 (`src/lib/imagem/reduzir.ts`, função pura testável para o cálculo de dimensões); recusa > 1,5 MB depois da redução;
  4. **Contato** (opcional; pré-preenchido com o e-mail do perfil se logado; placeholder "e-mail ou WhatsApp, se quiser resposta");
  5. campo honeypot invisível (`name="site"`);
  6. **ENVIAR** (vermelho) / Cancelar; sucesso: "Recebemos, obrigado. A equipe NZ vai olhar." e fecha em 2 s; 429: "Muitos envios seguidos, tente mais tarde."; erro: mensagem inline.

### 3.6 Painel do cliente — Minhas seleções (Fase 5)

- `painelNav.ts`: `ItemPainel` ganha `soAdmin?: boolean`; `Contador` ganha `'selecoes'`; grupo `catalogo` recebe `{ para: '/painel/selecoes', icone: '⊞', rotulo: 'Minhas seleções', titulo: 'Minhas seleções', dica: 'Links que você montou para clientes', contador: 'selecoes', soAdmin: true }`.
- `PainelLayout.tsx` e `PainelInicio.tsx`: filtrar `soAdmin` por `isAdmin`; contador = ativas (`expira_em > now()` e `encerrada_em is null`, `criado_por = user.id`).
- `App.tsx`: `<Route path="selecoes" element={<PainelSelecoes />} />`.
- **`src/pages/Painel/PainelSelecoes.tsx`** (CSS no `Painel.module.css`):
  - lê `selecoes` pelo Supabase (RLS), `criado_em desc`;
  - abas **Ativas** / **Expiradas** com contagem; aba lembrada em `sessionStorage`;
  - card: título (ou "Seleção de dd/mm"), até 4 miniaturas via `getShopItem` (+ "e mais N"), N itens, chip "Preço visível · +X %" ou "Sem preço", "Criada em …", **"Expira em 5 h"** / "Expirou em …", visitas;
  - ações: **Abrir**, **Copiar link**, **WhatsApp**, **Renovar 24 h** (nas duas abas; expirada muda de aba), **Encerrar agora** (só ativas, confirmação inline);
  - vazios: "Você ainda não montou nenhuma seleção" + "Montar uma na loja →" / "Nenhuma seleção expirada".
- Não admin: `Navigate` para `/painel`.

### 3.7 Central de ocorrências — `/admin/central` (Fase 1)

- `adminNav.ts`: `badge` ganha `'central'`; grupo `sistema` recebe `{ para: '/admin/central', icone: '🚨', rotulo: 'Central', titulo: 'Central de erros e mudanças', badge: 'central' }` **como primeiro item do grupo**.
- `AdminLayout.carregarBadges`: `+ supabase.from('ocorrencias').select('id', { count: 'exact', head: true }).eq('status', 'aberta')`.
- `App.tsx`: `<Route path="central" element={<AdminCentral />} />`.
- **`src/pages/Admin/AdminCentral.tsx`** (+ `AdminCentral.module.css`, seguindo `Admin.module.css`):
  - topo: três contadores de abertas (Erros · Mudanças · Problemas) e botão "Rodar sync agora" (reaproveita a chamada que `AdminErp` já faz);
  - abas **Erros** · **Mudanças** · **Problemas informados** · **Resolvidas** (últimos 30 dias);
  - filtro de texto (título, SKU, slug) e por tipo;
  - linha: ícone por tipo, título, data relativa, produto (links para `/loja/<slug>` e para o editor `/admin/produtos/<id>` quando houver slug), **detalhe legível** por tipo (preço antes → depois com %, "usando varejo" âmbar, "sem preço nenhum" vermelho, mensagem do sync), e para problemas: motivo, mensagem completa, contato (mailto/wa.me quando der), imagem em miniatura → clique abre a URL assinada (`createSignedUrl(imagem_path, 3600)`), URL de origem, "logado como …";
  - ações: **Resolver** (nota opcional; para mudança o rótulo é **Marcar como visto**) e, na aba Resolvidas, **Reabrir**; ambas via `update` pelo cliente (RLS de admin) gravando `resolvido_em/resolvido_por/nota_resolucao`;
  - `recarregarBadges()` do `Outlet context` após resolver;
  - vazio por aba: "Nada aberto aqui 🎉".
- `AdminHome`: um card "Central · N abertas" linkando para `/admin/central` (uma linha; sem gráfico).

### 3.8 Bolinhas de estoque (Fase 3)

- Servidor: `precos.ts` inclui `estoque` só para admin (3.2, item 5).
- **`src/pages/Loja/EstoqueDots.tsx`**: `usePreco(slug, selecao)`; se `papel === 'admin'` e `item.estoque`: `●` verde quando `rolosFechados > 0` (title "N rolo(s) fechado(s)") e `●` laranja quando `rolosAbertos > 0` (title "N rolo(s) aberto(s) · fracionado"); nada quando ambos zero. Cores: verde `#22c55e`, laranja `#f59e0b`, 8 px, `aria-label` = title.
- `ShopCard`: bolinhas **na linha do código** (`.code`), à direita — fora da foto, que já tem badge e ×. Só para `kind !== 'linha'`.
- `Disponibilidade.tsx`: as mesmas bolinhas ao lado do título quando `dados.saldo` existe e `papel === 'admin'` (componente aceita `{ rolosFechados, rolosAbertos }` por prop).

---

## 4. Passo a passo de implantação

Convenções: um commit por fase (mensagem no padrão `loja: …` / `admin: …` / `painel: …`), `npm run lint && npm run build` antes de cada commit, push só depois do checklist da fase. Migrations com `node scripts/aplicar-sql.mjs site migrations/<arquivo>.sql`.

### Fase 1 — Central de ocorrências

1. `migrations/2026-09-11_central_ocorrencias.sql` (3.1) e aplicar. Conferir no painel do Supabase que o bucket `ocorrencias` nasceu **privado**.
2. `api/_lib/ocorrencias.ts` (`abrirOcorrencia`, `resolverPorChave`).
3. `adminNav.ts`, `AdminLayout.tsx` (badge), `App.tsx` (rota), `AdminCentral.tsx` + CSS, card no `AdminHome`.
4. Para testar a tela antes da Fase 2, inserir 3 ocorrências por SQL (uma de cada categoria) e resolver/reabrir pela tela.
5. Commit `admin: central de erros e mudancas`.

### Fase 2 — Preço de atacado

1. `migrations/2026-09-11b_preco_atacado.sql` e aplicar.
2. `sync.ts`: mapeamento novo + leitura do "antes" + ocorrências (3.2). Nova função `registrarOcorrenciasDoSync(site, { linhas, antes, paraCriar, removidos, cfg })` chamada depois do upsert e da reconciliação; erro nela **não** derruba o sync (`catch` + `console.warn`).
3. `precos.ts` (handler): `select` inclui `preco_rolo_varejo, preco_metro_varejo, preco_rolo_min, preco_metro_min`; admin recebe `roloVarejo/metroVarejo/usandoVarejo`; **remover** `roloMin/metroMin`.
4. `src/lib/shop/precos.ts` (`PrecoItem`) e `Preco.tsx`: "mín." → "tabela varejo" + chip "sem atacado no ERP". `grep -rn "roloMin\|metroMin\|preco_rolo_min\|preco_metro_min" src api` e ajustar o que sobrar.
5. Deploy **e** migration na mesma janela (risco 6.1). Rodar o sync manual (`/admin/erp` ou `POST /api/nz/sync` com JWT de admin) e conferir:
   ```sql
   select sku, preco_rolo, preco_rolo_min, preco_rolo_varejo, preco_metro, preco_metro_min, preco_metro_varejo
   from erp_produtos where ativo and preco_rolo_min is not null limit 10;
   -- esperado: preco_rolo = preco_rolo_min; preco_rolo_varejo >= preco_rolo
   select count(*) from erp_produtos where ativo and preco_rolo > preco_rolo_varejo;   -- esperado 0
   select tipo, count(*) from ocorrencias where status = 'aberta' group by 1;          -- preco-zerado = nº de ativos sem atacado
   ```
6. Atualizar o comentário em `migrations/erp/20260906_site_views.sql` e o cabeçalho de `precificar.ts`.
7. Commit `loja: preco do site passa a ser o atacado (min_* do ERP) + ocorrencias do sync`.

### Fase 3 — Bolinhas de estoque

1. `precos.ts` (handler): `select` + bloco admin com `estoque`.
2. `PrecoItem.estoque`; `EstoqueDots.tsx` + CSS; `ShopCard`; `Disponibilidade.tsx`.
3. Commit `loja: bolinhas de estoque (rolo fechado / fracionado) para admin`.

### Fase 4 — Seleção configurável

1. `migrations/2026-09-11c_selecoes.sql` e aplicar.
2. `api/_lib/handlers/selecoes.ts` + registrar em `[acao].ts`; extrair `r2` para `api/_lib/pedido/dinheiro.ts`.
3. `precos.ts` (handler): suporte a `selecao` (3.2, passos 2–5).
4. `src/lib/shop/selecoes/regras.ts`, `src/lib/shop/selecoes.ts`.
5. Refatorar `src/lib/shop/precos.ts` para contextos (3.3). `npm run build` aqui: todos os chamadores de `usePreco/usePrecosLote/usePrecosMapa` precisam compilar (`grep -rn "usePreco\|usePrecosLote\|usePrecosMapa" src`).
6. `App.tsx` rota `/loja/s/:token`; `Loja.tsx` (3.4); `SelecaoConfig.tsx`; `ShopCard` (`selecao`, link); `LojaProduct`, `Preco.tsx` (3.5, incluindo o WhatsApp no lugar de Comprar).
7. Esconder MONTAR SELEÇÃO de não-admin (D2).
8. Checklist 5.4. Commit `loja: selecao com preco liberado, acrescimo % e link que expira`.

### Fase 5 — Minhas seleções

1. `painelNav.ts`, `PainelLayout.tsx`, `PainelInicio.tsx`, `App.tsx`, `PainelSelecoes.tsx` (3.6).
2. Checklist 5.5. Commit `painel: minhas selecoes (ativas / expiradas)`.

### Fase 6 — Informar um problema

1. `api/_lib/handlers/ocorrencias.ts` + registrar em `[acao].ts`. Env: se não houver salt próprio, usar `CRON_SECRET` para o `ip_hash` (documentar no cabeçalho).
2. `src/lib/imagem/reduzir.ts`; `InformarProblema.tsx` + CSS; botão em `LojaProduct.tsx`.
3. Central: a aba "Problemas informados" já existe desde a Fase 1; conferir miniatura + URL assinada com um envio real.
4. Checklist 5.6. Commit `loja: informar um problema no produto -> central`.

### Fase 7 — Testes, produção, documentação

1. `scripts/test-selecoes.mjs` (script `selecoes:test`), no molde de `test-carrinho.mjs`: `aplicarAcrescimo` (0 %, 100 %, 12,5 %, arredondamento), `estaAtiva` (antes/depois/encerrada), `validarConfig` (limite 300, pct fora da faixa, slugs duplicados), `chavePreco`, `reduzir.ts` (cálculo de dimensões), e a regra de `preco-mudou` (variação ≥ limiar, pular quando o antigo não tinha varejo).
2. `npm run lint && npm run build && npm run selecoes:test && npm run carrinho:test && npm run checkout:test`.
3. Push, esperar a Vercel, verificar **pelo comportamento** (memória: o hash do bundle nunca bate): checklist 5.7.
4. Atualizar este documento com "IMPLANTADO em …" + commits, e `PROJECT_MAP.md` (rotas `/loja/s/:token`, `/painel/selecoes`, `/admin/central`; handlers `selecoes`, `ocorrencias`).
5. Memória: atualizar `project_loja_nzgroup.md` e `project_selecoes_preco_atacado.md` em `C:\Users\joaov\.claude\projects\c--Users-joaov-OneDrive-Documentos-FIRECRAL\memory\`.

---

## 5. Checklist de verificação

### 5.1 Fase 1 — Central
- [ ] `/admin/central` aparece no grupo Sistema com badge = abertas; cliente/lojista não acessa (redirect do `AdminLayout`).
- [ ] Três ocorrências inseridas por SQL caem cada uma na sua aba; Resolver move para Resolvidas e o badge cai; Reabrir volta.
- [ ] `insert` em `ocorrencias` pelo cliente logado como admin **falha** (só o servidor grava).
- [ ] Bucket `ocorrencias` privado: URL pública de um objeto dá 400/403; `createSignedUrl` como admin funciona; como cliente, falha.

### 5.2 Fase 2 — preço
- [ ] SQL do passo 5: `preco_rolo = preco_rolo_min` nos ativos com atacado; nenhum `preco_rolo > preco_rolo_varejo`.
- [ ] Um Etherna Texturizado mostra **R$ 1.088,63 / R$ 44,90** (atacado), não 1.225 / 52.
- [ ] Admin vê "tabela varejo R$ 1.225,00" em cinza; lojista aprovado **não** vê.
- [ ] SKU com atacado zerado no ERP: card mostra o varejo, admin vê o chip "sem atacado no ERP", e existe **uma** ocorrência `preco-zerado` aberta para ele; rodar o sync de novo **não** duplica; corrigir o atacado no ERP + sync → ocorrência resolvida sozinha com nota.
- [ ] `op=resumo` do checkout para 1 rolo devolve `unit × metragem` = atacado do rolo.
- [ ] Primeiro sync após a migration **não** gera `preco-mudou` em massa; um sync com preço alterado ≥ 20 % num SKU gera uma.
- [ ] Sync duas vezes seguidas: idêntico (idempotente).

### 5.3 Fase 3 — bolinhas
- [ ] Admin na `/loja`: SKU com `rolos_fechados > 0` → verde; `rolos_abertos > 0` → laranja; ambos → as duas; zero → nada. `title`/`aria-label` com a contagem.
- [ ] Deslogado, cliente e lojista: nenhuma bolinha; a resposta da API para esses papéis **não** contém `estoque`.
- [ ] Página do produto (admin): bolinhas ao lado de "Disponibilidade".

### 5.4 Fase 4 — seleção
- [ ] Deslogado e lojista: MONTAR SELEÇÃO não aparece; `/loja?sel=a,b` antigo abre, sem preço.
- [ ] Admin: MONTAR SELEÇÃO → tirar 3 itens → CONCLUIR abre a telinha com N certo.
- [ ] Toggle desligado → seleção com `mostrar_preco=false`, `acrescimo_pct=0`; link anônimo: lista certa, "Valores sob consulta", nenhum preço, cards levam ao produto sem `?s=`.
- [ ] Toggle ligado, 10 % → **janela anônima**: preços só nos itens da lista, cada um = `r2(atacado × 1,10)`. Produto: URL com `?s=`, preço + "Valor desta seleção", **sem** "Adicionar ao carrinho", com "Pedir pelo WhatsApp" (mensagem traz produto e link). Produto **fora** da seleção sem `?s=`: "Entre para ver o preço".
- [ ] Logado e aprovado abrindo o link: também vê o preço da seleção e o WhatsApp no lugar do carrinho; fora da seleção, o carrinho continua com o atacado.
- [ ] `POST /api/nz/precos` anônimo com `selecao` válida e slug fora da lista → `foraDaSelecao: true`. Sem `selecao` → 401.
- [ ] `abrir` nunca devolve `acrescimo_pct` nem `criado_por`.
- [ ] Admin no próprio link: preço da seleção + "base R$ … · +10 %".
- [ ] `update selecoes set expira_em = now() - interval '1 minute' where token='…'` → "Esta seleção expirou"; `precos` com esse token volta a 401 para anônimo.
- [ ] Token inexistente → "não existe mais"; 300 itens OK; 301 → aviso na loja e 400 na API.
- [ ] `visitas` sobe ao abrir anônimo; não sobe para admin.
- [ ] `noindex` em `/loja/s/<token>` e em `/loja/<slug>?s=…`.

### 5.5 Fase 5 — painel
- [ ] Admin: "Minhas seleções" no grupo Catálogo (lateral e página inicial do celular), contador = ativas. Cliente/lojista: não aparece; `/painel/selecoes` redireciona.
- [ ] Recém-criada em Ativas; expirada por SQL em Expiradas; **Renovar** move de volta e o link antigo reabre; **Encerrar** move para Expiradas e o link para de abrir.
- [ ] Miniaturas, "Expira em N h", visitas, "Preço visível +10 %" / "Sem preço".

### 5.6 Fase 6 — informar problema
- [ ] Anônimo envia mensagem sem foto → aparece em "Problemas informados" com motivo, mensagem, URL e user-agent; sem `user_id`.
- [ ] Logado envia com foto de 4 MB do celular → chega ≤ 1,5 MB, miniatura abre em URL assinada; `contato` = e-mail do perfil; `user_id` preenchido.
- [ ] Mensagem de 5 caracteres → 400 com texto claro na telinha; honeypot preenchido → 200 e nada gravado; 6º envio na mesma hora → 429.
- [ ] PNG de 3 MB sem redução possível (navegador sem canvas) → recusado no cliente com mensagem.
- [ ] Badge da Central sobe ao enviar e cai ao resolver.

### 5.7 Produção (depois do push)
- [ ] `/loja` deslogado: nenhum preço; admin: atacado + bolinhas + varejo em cinza.
- [ ] Seleção real com 5 itens e 5 %, aberta no celular em 4G sem login: preços certos, WhatsApp abre com a mensagem.
- [ ] `/painel/selecoes` lista, renova e encerra.
- [ ] `/admin/central` mostra as `preco-zerado` do sync do cron; enviar um problema real de um produto e resolvê-lo.
- [ ] `select count(*) from erp_produtos where preco_rolo_varejo is null and ativo` ≈ 0 após o sync do cron.

---

## 6. Riscos e cuidados

1. **Duplo swap no backfill.** Se o sync novo rodar **antes** da migration, as colunas `_varejo` já estarão preenchidas e o `where … is null` não roda — correto. Se a migration rodar antes do deploy da Fase 2, o sync **antigo** (cron/webhook) reescreve `preco_rolo` com o varejo até o deploy. Por isso: migration **e** deploy da Fase 2 na mesma janela, sync manual em seguida.
2. **Preço cai para clientes já aprovados** (varejo → atacado). É a intenção; avisar a equipe comercial no dia.
3. **Contexto de preço no cliente.** O refactor de `precos.ts` é o ponto mais delicado: chamador esquecido compila (parâmetro opcional) mas mostra preço base dentro de uma seleção. Conferir todos com o `grep`.
4. **Nada de acréscimo no cliente.** O front nunca calcula `× (1 + pct)`; mostra o que o servidor devolveu.
5. **Token no `state` do Link não basta**: F5 na página do produto perde o `state`. Daí o `?s=` na URL.
6. **Vercel**: `selecoes` e `ocorrencias` entram no roteador; corpo ≤ 4,5 MB (a imagem vai reduzida e em base64, ≈ 2 MB no pior caso).
7. **RLS**: `selecoes` e `ocorrencias` sem policy de insert para `authenticated` — se algum teste tentar `insert` pelo cliente e falhar, está certo.
8. **Ruído na Central.** `sku-novo` pode chegar aos cem de uma vez num cadastro em massa no ERP: a tela precisa de "Marcar todos como vistos" na aba Mudanças (adicionar; é um `update … where categoria='mudanca' and status='aberta'`).
9. **Abuso do "informar problema".** Sem login, o freio é honeypot + 5/hora/IP. Se aparecer spam, subir o Turnstile (já previsto na memória do cadastro) — fora desta rodada.
10. **`carrinhos_abandonados`** passa a estimar pelo atacado automaticamente (lê `preco_rolo`). Nada a fazer.

---

## 6.1. O que foi verificado em produção (2026-09-08)

Feito por API e por SQL contra o banco real. O que depende de olhar a tela
(layout da Central, das duas telinhas e do cartão de seleção no painel) **não**
foi verificado — precisa de uma sessão de admin no navegador.

**Preço de atacado**
- `preco_rolo = preco_rolo_min` em todos os 803 ativos com atacado; nenhum caso
  de `preco_rolo > preco_rolo_varejo`; nenhum ativo sem varejo gravado.
- Etherna Texturizado saiu de 1.225,00 / 52,00 (varejo) para **1.088,63 / 44,90**
  (atacado) — os números do caderno de preços.
- Backfill re-executado devolve zero linhas (idempotente).
- 17 rodadas do sync depois, o espelho segue com o atacado.

**Central**
- Uma única ocorrência `preco-zerado`, para o SKU `84565478` (PPF Black Piano),
  que está sem atacado **e** sem varejo. As 17 rodadas do sync **não**
  duplicaram: o índice parcial segura.
- Insert repetido com a mesma chave devolve 23505; depois de resolvida, uma nova
  pode nascer. RLS: só SELECT e UPDATE para `authenticated`, nenhum INSERT.
- Bucket `ocorrencias` nasceu privado.

**Seleções**
- `abrir` de seleção ativa devolve token, título, slugs, `mostrarPreco` e
  `expiraEm` — e **nunca** `acrescimo_pct` nem `criado_por`.
- Anônimo com token válido recebe preço só dos slugs da lista, com o acréscimo
  aplicado (1.694,16 → **1.863,58** com 10%); slug de fora volta
  `foraDaSelecao: true`. Sem token, 401.
- Expirada: `abrir` devolve `expirada: true` **sem** a lista, e o preço volta a
  401. Token inexistente, 404.
- `criar`/`renovar`/`encerrar` devolvem 403 sem admin. Visita contada só para
  quem não é admin.

**Informar um problema**
- Relato anônimo grava título com o nome do produto, mensagem, contato, URL e
  motivo, sem `user_id` e com `ip_hash` de 64 caracteres (nunca o IP).
- Mensagem curta → 400; motivo inválido → 400; produto inexistente → 404.
- Honeypot preenchido → 200 **sem gravar linha**.
- Imagem sobe para o bucket privado; a URL pública dá 404 e a chave anônima do
  site também. Sexto envio na mesma hora → 429.

**Autotestes:** `selecoes:test` (48), `carrinho:test`, `checkout:test`,
`painel:test`, `conta:test`, `erp:test`, `ficha:test`, `midia:test`,
`avaliacoes:test` — todos verdes. `lint` e `build` sem erro novo (os de
`useLimiteNome.ts`, `SceneEnvironment.tsx` e `sanitize.ts` já existiam).

---

## 7. Fora do escopo desta rodada (anotar, não fazer)

- Checkout com o preço da seleção (descartado por decisão: D6).
- Lojista montando seleção com acréscimo para o cliente dele (trocar o guard de `criar` e o `soAdmin`).
- Tela em `/admin/erp` para `selecao_validade_horas` e `alerta_variacao_preco_pct` (hoje por SQL).
- Editar uma seleção existente (itens, %) — hoje é criar outra.
- Listagem de **todas** as seleções da equipe no `/admin` (a RLS já permite; falta só a tela).
- Notificação por e-mail/WhatsApp quando nasce ocorrência (a Central é o lugar; e-mail depende do Resend, ainda não configurado).
- Turnstile no "informar problema".
