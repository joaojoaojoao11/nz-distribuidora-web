# Prompt — Agenda Social v4: Objetivos, Tarefas e Calendar overlay

> **Como usar:** Cole tudo abaixo da linha tracejada num único turno do Claude no VS Code. Continua o trabalho da v3 (Importar em Lote, Calendário, Checklist, Motor de Ideias).

---

# Tarefa

A Agenda Social Media virou a mesa de trabalho do João + assistente Cowork. Agora ela precisa **planejar** trabalho, não só agendar posts. Adicione um módulo de **Objetivos & Tarefas** (mensal / semanal / diário) integrado com os posts existentes, e um **overlay leve do Google Calendar** pro João ver compromissos externos junto.

## Estado atual

Já entregue (v1-v3):
- Tabelas: `social_posts` (com coluna `checklist jsonb`).
- Componentes: `AdminAgendaSocial.tsx`, `AdminAgendaSocialCalendar.tsx`, `AdminAgendaSocialIdeaGenerator.tsx`, e (deve estar entregue) `BulkImportModal` inline.
- Features: kanban, modal com checklist editável, vista calendário, motor de ideias, importação em lote.
- README atualizado.

---

# As 3 features novas

## 1. Tabelas Supabase

Criar `social_posts_v3.sql` (idempotente, segue mesmo padrão das anteriores):

```sql
-- =====================================================================
-- NZ — Migration v3: Objetivos e Tarefas
-- =====================================================================

create table if not exists public.agenda_objectives (
  id           uuid primary key default gen_random_uuid(),
  scope        text not null check (scope in ('monthly','weekly')),
  title        text not null,
  description  text,
  -- Para 'monthly': primeiro dia do mês. Para 'weekly': segunda-feira da semana.
  target_date  date not null,
  status       text not null default 'open'
                check (status in ('open','done','dropped')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id) on delete set null
);

create table if not exists public.agenda_tasks (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text,
  due_date        date,                                              -- null = sem prazo
  status          text not null default 'pending'
                  check (status in ('pending','doing','done','dropped')),
  priority        int  not null default 2,                            -- 1=alta, 2=média, 3=baixa
  objective_id    uuid references public.agenda_objectives(id) on delete set null,
  social_post_id  uuid references public.social_posts(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid references auth.users(id) on delete set null
);

create index if not exists agenda_objectives_scope_date_idx
  on public.agenda_objectives(scope, target_date);
create index if not exists agenda_tasks_due_date_idx
  on public.agenda_tasks(due_date);
create index if not exists agenda_tasks_objective_idx
  on public.agenda_tasks(objective_id);
create index if not exists agenda_tasks_post_idx
  on public.agenda_tasks(social_post_id);

-- RLS
alter table public.agenda_objectives enable row level security;
alter table public.agenda_tasks enable row level security;

drop policy if exists "agenda_objectives_admin_all" on public.agenda_objectives;
create policy "agenda_objectives_admin_all" on public.agenda_objectives for all
  using (exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "agenda_tasks_admin_all" on public.agenda_tasks;
create policy "agenda_tasks_admin_all" on public.agenda_tasks for all
  using (exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin'));

-- Triggers de updated_at (touch_updated_at já existe)
drop trigger if exists agenda_objectives_touch on public.agenda_objectives;
create trigger agenda_objectives_touch before update on public.agenda_objectives
  for each row execute function public.touch_updated_at();

drop trigger if exists agenda_tasks_touch on public.agenda_tasks;
create trigger agenda_tasks_touch before update on public.agenda_tasks
  for each row execute function public.touch_updated_at();
```

## 2. Sub-aba "Plano" no AdminAgendaSocial

Adicionar terceiro botão no toggle de view (que hoje tem `Kanban` e `Calendário`): **`🎯 Plano`**.

Tipo: `view: 'kanban' | 'calendar' | 'plan'`.

**Layout do Plano (3 zonas verticais):**

### Zona 1 — Mês (topo)
- Header: nome do mês + navegação `← Hoje →` (mesmo componente do calendário).
- Cards horizontais: objetivos mensais. Cada card tem título, descrição (truncada), status, contador de tarefas-filhas (`5 tarefas · 3 concluídas`), barra de progresso fina.
- Botão `+ Objetivo do mês` no fim da linha.

### Zona 2 — Semana (meio)
- Cabeçalho: "Semana de [Seg DD] a [Dom DD]" + navegação prev/next semana.
- Grid 7 colunas (Seg-Dom). Cada coluna tem:
  - Header com o dia (`Seg 28` etc).
  - Lista de tarefas com `due_date` naquele dia.
  - Lista (compacta, com badge da conta) de posts agendados naquele dia (puxados de `social_posts`).
- Linha separada acima do grid: objetivos semanais (cards finos, sem grid).

### Zona 3 — Hoje (rodapé)
- Card grande: "Hoje, [data extensa]".
- Lista de tarefas com `due_date = hoje`, ordenadas por `priority` (1 → 3) e depois por `status`.
- Cada tarefa tem: checkbox (toggle status `pending` ↔ `done`), título editável (click), badge de prioridade, link sutil pro objetivo se tiver, link sutil pro social_post se tiver.
- Botão `+ Tarefa de hoje`.

### Componentes inline a criar
- `PlanView` — orquestra as 3 zonas e os fetches.
- `ObjectiveCard` — card de objetivo (mensal ou semanal).
- `ObjectiveModal` — criar/editar objetivo. Campos: título, descrição, scope, target_date.
- `TaskRow` — linha de tarefa, com inline edit.
- `TaskModal` — criar/editar tarefa. Campos: título, descrição, due_date, prioridade, objective_id (select de objetivos abertos), social_post_id (select de posts no backlog/em produção/pronto).

Todos no `AdminAgendaSocial.tsx` se couber sem passar de **1000 linhas**. Se passar, extrair `AdminAgendaSocialPlan.tsx`.

### Conexões importantes

- Tarefa pode ser **criada a partir de um post**: no card do post (kanban view), botão pequeno `+ tarefa` que abre TaskModal pré-preenchida com `social_post_id` e `due_date = scheduled_for` se houver.
- Quando tarefa é marcada `done` e tem `social_post_id`, **não muda** o status do post (só status da tarefa). Mas mostra um indicador visual no card do post tipo `✓ checklist & tarefas em dia`.
- Objetivos mensais com `target_date` no mês corrente aparecem na Zona 1. Semanais com target na semana ativa aparecem na Zona 2.

## 3. Overlay Google Calendar (read-only, MVP)

### Decisão de arquitetura

Duas opções, **escolha a (B)** para MVP:

- **(A) OAuth Google direto** — Supabase Auth com provider Google + scope `calendar.readonly`. Requer configurar scope no Supabase, lidar com `provider_token` no client, refresh, etc. Trabalho médio.
- **(B) iCal URL pública** — usuário cola a URL `.ics` da agenda (ou agendas) que ele quer sobrepor. App fetcha, parseia client-side, exibe como ghost chips no Calendário e no Plano. Sem OAuth, sem backend, sem scope.

Vai de (B). Justificativa: read-only basta pro MVP, zero infraestrutura nova, usuário controla totalmente quais agendas compartilhar.

### Implementação

**SQL (mesmo arquivo `social_posts_v3.sql`, ao final):**

```sql
create table if not exists public.calendar_feeds (
  id           uuid primary key default gen_random_uuid(),
  label        text not null,
  ics_url      text not null,
  color        text not null default '#888888',         -- cor do chip no overlay
  enabled      boolean not null default true,
  created_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id) on delete set null
);

alter table public.calendar_feeds enable row level security;
drop policy if exists "calendar_feeds_admin_all" on public.calendar_feeds;
create policy "calendar_feeds_admin_all" on public.calendar_feeds for all
  using (exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin'));
```

**UI:**

- Botão pequeno `🔗 Agendas externas` na header do Calendário (ao lado dos navs do mês). Click abre `FeedManagerModal`:
  - Lista de feeds existentes (label + URL truncada + toggle enabled + botão remover).
  - Form pra adicionar novo: label, URL, cor (input type=color).
  - Instrução curta: "Cole a URL pública .ics do Google Calendar (Configurações da agenda → Integrar agenda → URL pública no formato iCal)".

**Fetch e parse:**

- Componente `useCalendarFeeds()` hook — carrega feeds enabled, fetcha cada `.ics`, parseia, retorna `Map<dateKey, ExternalEvent[]>`.
- Parser de iCal **caseiro mínimo** — cobre só `BEGIN:VEVENT` / `SUMMARY` / `DTSTART` / `DTEND` / `END:VEVENT`. Não precisa lidar com recurrence rules complexas no MVP. Eventos all-day: `DTSTART;VALUE=DATE:YYYYMMDD`. Eventos com hora: ignorar a hora pra exibição (mostra só no dia certo).
- **CORS**: Google Calendar publica `.ics` com CORS aberto. Se algum feed bloquear, mostrar warning no FeedManagerModal pra esse feed específico.

**Renderização:**

- No Calendar (e dentro da Zona 2 do Plano), eventos externos viram chips com `border-left-color = feed.color`, badge com label do feed (3 chars), título do evento. Visualmente mais leves que os chips de post NZ (opacidade 0.7, font menor). Não clicáveis (read-only).

## 4. README

Adicionar nova seção `## Plano (Objetivos & Tarefas)` documentando as 3 zonas e o ciclo de uso (mensal → semanal → diário). Adicionar `## Agendas externas` documentando como pegar URL .ics do Google Calendar e adicionar.

Atualizar a tabela "O que foi adicionado" com os arquivos novos.

## 5. Build + commit

```bash
npm run build      # tem que passar limpo
git add -A
git commit -m "feat(agenda-social): plano de objetivos + overlay iCal externo

- agenda_objectives e agenda_tasks tabelas (RLS admin).
- Sub-view Plano: zona mês, zona semana, zona hoje.
- Tarefas conectadas a objetivos e/ou social_posts.
- Botão '+ tarefa' no card do post (kanban view).
- calendar_feeds tabela + FeedManager para adicionar URLs .ics.
- Overlay read-only de eventos externos no Calendar e Plano.
- Parser iCal mínimo (VEVENT/SUMMARY/DTSTART/DTEND).
- README documenta Plano e Agendas externas."
git push
```

---

# Restrições

- **Não instale libs.** Parser iCal: implemente á mão, é simples (regex + split). Já é mais de 50% do parser caseiro: `text.split(/BEGIN:VEVENT/).slice(1).map(parseEvent)`.
- **Não adicione recurrence rules** no parser iCal. Se o evento tem `RRULE`, importa só a primeira ocorrência. Documenta isso no README.
- **Não use `any`.** Crie tipos: `AgendaObjective`, `AgendaTask`, `CalendarFeed`, `ExternalEvent`.
- **Não quebre** a vista Kanban nem a Calendário nem a Importação em Lote — features novas são adições.
- **Mantém visual padrão NZ** — dark + accent-red + Outfit/Inter. Sem cores novas exceto a do feed do usuário.
- TypeScript estrito. `npm run build` passa antes do commit.

---

# Definição de pronto

- [ ] `social_posts_v3.sql` criado, idempotente, com `agenda_objectives`, `agenda_tasks`, `calendar_feeds`.
- [ ] Toggle de view tem 3 botões: Kanban / Calendário / 🎯 Plano.
- [ ] Plano mostra: objetivos do mês corrente, grid da semana com tarefas e posts, lista do dia.
- [ ] Criar/editar/concluir objetivo funciona.
- [ ] Criar/editar/concluir tarefa funciona, com vínculo opcional a objetivo e/ou post.
- [ ] Card de post no kanban tem botão `+ tarefa` que abre modal pré-preenchida.
- [ ] FeedManagerModal permite adicionar URL .ics, cor, label.
- [ ] Eventos externos aparecem no Calendário e na zona Semana do Plano (read-only).
- [ ] Parser iCal lê eventos all-day e com hora corretamente (data correta, hora ignorada na visualização).
- [ ] README atualizado.
- [ ] `npm run build` passa, commit + push feitos.

---

# O que me responder no fim

(a) Hash do commit.
(b) Lista de arquivos criados/modificados.
(c) Decisões de design importantes.
(d) Limitações conhecidas do parser iCal (quais campos não cobre).
(e) Lembrete pro João do SQL `social_posts_v3.sql` que ele precisa rodar no Supabase.
(f) Instrução curta de como pegar a URL .ics no Google Calendar:
   `Calendar → ⚙ Settings → Settings for my calendars → escolha a agenda → role até "Integrate calendar" → copie "Secret address in iCal format" (ou "Public address" se quiser ler agenda pública).`
