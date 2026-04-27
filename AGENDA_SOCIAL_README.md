# Agenda Social Media — Setup local

Módulo simples de kanban para gerenciar posts das três contas (@nzppf, @nzgroup.br, @joaowrap) direto no admin do site.

## O que foi adicionado

| Arquivo | O que é |
|--------|---------|
| `social_posts.sql` | SQL inicial — cria tabela `social_posts`, RLS, trigger de updated_at |
| `social_posts_v2.sql` | Migration v2 — adiciona coluna `checklist` (jsonb) |
| `social_posts_v3.sql` | Migration v3 — cria `agenda_objectives`, `agenda_tasks`, `calendar_feeds` |
| `src/pages/Admin/AdminAgendaSocial.tsx` | Componente principal (kanban + toggle de view + modais de criar/editar/importar/exportar) |
| `src/pages/Admin/AdminAgendaSocialCalendar.tsx` | Vista calendário mensal (com overlay de eventos externos) |
| `src/pages/Admin/AdminAgendaSocialPlan.tsx` | Vista Plano (zonas Mês / Semana / Hoje, objetivos e tarefas) |
| `src/pages/Admin/AdminAgendaSocialProtocol.ts` | Protocolo Cowork — `parseBatch`, `executeBatch`, `buildExport` (lógica pura) |
| `src/pages/Admin/AdminAgendaSocialIdeaGenerator.tsx` | Motor de ideias (banco interno + UI de geração) |
| `src/pages/Admin/AdminAgendaSocialFeeds.ts` | Tipos + parser iCal mínimo + hook `useCalendarFeeds` |
| `src/pages/Admin/AdminAgendaSocialFeedManager.tsx` | Modal pra cadastrar URLs `.ics` públicas |
| `src/pages/Admin/AdminAgendaSocial.module.css` | Estilos no padrão do admin (dark, accent-red) |
| `src/pages/Admin/Dashboard.tsx` | 4 edições mínimas: import, type union, sidebar button, render condicional |

Nenhum arquivo existente foi reescrito do zero — só edições pontuais no Dashboard. Outras telas (Leads, Garantias, Agência NZ, etc.) continuam intactas.

## Setup em 3 passos

### 1. Rodar os SQLs no Supabase

Abre o painel do projeto NZ no Supabase → **SQL Editor** → **New Query**.

**Primeira instalação (3 SQLs em ordem):**
1. Cola `social_posts.sql` → **Run** (cria tabela + RLS + trigger).
2. Nova query → cola `social_posts_v2.sql` → **Run** (adiciona coluna `checklist`).
3. Nova query → cola `social_posts_v3.sql` → **Run** (cria `agenda_objectives`, `agenda_tasks`, `calendar_feeds` para o módulo Plano e overlay externo).

**Atualização de instalação existente:**
- Já tinha v1 e v2 → roda só `social_posts_v3.sql`.
- Já tinha v1 → roda v2 e v3.
- Tudo idempotente (`if not exists`).

Cada SQL cria as tabelas com RLS para admins e seus triggers. Roda em ~1s cada.

Se quiser começar com cards de exemplo, descomente o bloco `-- insert into ...` no fim do `social_posts.sql` antes de rodar.

### 2. Rodar o site local

```bash
cd C:\Users\joaov\OneDrive\Documentos\FIRECRAL\nz-distribuidora-web
npm install        # só se ainda não rodou
npm run dev
```

Abre normalmente em `http://localhost:5173`.

### 3. Acessar a Agenda

Login com seu usuário admin → `/admin` → na sidebar esquerda, novo botão **📅 Agenda Social** logo abaixo do "🎨 Agência NZ".

## Como usar

### Kanban e Calendário (toggle no header)

Topo direito tem dois botões: `📋 Kanban` e `📅 Calendário`. O filtro por conta vale para os dois.

**Kanban** — visão padrão por status. 5 colunas (Backlog → Em Produção → Pronto → Agendado → Postado).

**Calendário** — visão mensal. Cada dia mostra os posts agendados (chips com badge da conta + título). Header tem nome do mês, botões `← Hoje →` para navegar. Posts sem `data prevista` não aparecem aqui.
- Click em um chip → abre o modal de edição daquele post.
- Click em uma célula vazia (do mês corrente) → abre modal de criar com a data já preenchida.

### Criar post

Botão `+ Novo post` no canto direito do header. Modal abre, preenche conta + título (obrigatórios) e o que mais quiser (legenda, formato, data prevista, asset, notas), clica salvar. O card aparece na coluna do status escolhido (default: Backlog).

### Checklist de produção (no modal)

Abaixo de "Notas internas". Lista de itens marcáveis com barra de progresso fina no topo da seção.

- **Auto-populada** quando você escolhe um formato (`Foto`, `Carrossel`, `Reel`, `Story`) — cada formato tem seu template padrão.
- **Mudou o formato?** Se você já marcou pelo menos 1 item, o sistema pergunta antes de resetar a checklist. Se nenhum estava marcado, troca silenciosamente.
- **Editar label:** clica no texto do item. Enter salva, Esc cancela.
- **Adicionar item custom:** botão `+ Adicionar item` no fim da lista.
- **Remover item:** ícone `×` à direita de cada linha.

A checklist é persistida com o card. No kanban, todo card que tem checklist mostra `🗸 X/Y` + barra fina logo abaixo da meta.

### Protocolo Cowork: Importar, Comandar, Exportar

Dois botões na header da Agenda Social:

- **📥 Importar / Comandar** — entrada. Aceita JSON polimórfico em 4 formatos × 4 ações × 3 tabelas.
- **📤 Exportar** — saída. Gera snapshot estruturado pro Cowork digerir e voltar com o próximo passo.

Juntos formam um **protocolo de comandos** que transforma a Agenda numa mesa de operação compartilhada entre o João e o assistente Cowork. Sem OAuth, sem API exposta — toda mudança passa por um copy/paste consciente do João.

#### Tabelas suportadas

| Alias curto | Tabela real |
|---|---|
| `posts` | `social_posts` |
| `tasks` | `agenda_tasks` |
| `objectives` | `agenda_objectives` |

#### 4 formatos de payload (entrada)

**(A) Array legado de posts** — compatibilidade com importação antiga. Detecta automaticamente quando nenhum item tem `action` ou `kind`. Todos viram `create` em `social_posts`.

```json
[
  { "account": "nzppf", "title": "RAM cromada @adesivotech",
    "format": "Reel", "scheduled_for": "2026-04-29" },
  { "account": "nzgroup", "title": "Cor da semana: Stuttgart Sport Grey",
    "format": "Carrossel", "pillar": "Catálogo NZ Wrap" }
]
```

**(B) Objeto agrupado** — agrupa por tabela. Útil quando o Cowork quer separar visualmente o que é post / tarefa / objetivo.

```json
{
  "posts":      [ { "account": "nzppf", "title": "..." } ],
  "tasks":      [ { "title": "Visitar @adesivotech", "due_date": "2026-04-29" } ],
  "objectives": [ { "scope": "weekly", "title": "Fechar 3 lojas",
                    "target_date": "2026-05-03" } ]
}
```

**(C) Array de comandos** — explícito. Cada item é uma operação completa.

```json
[
  { "action": "create", "table": "social_posts",
    "data": { "account": "nzppf", "title": "..." } },
  { "action": "update", "table": "social_posts", "id": "uuid",
    "patch": { "scheduled_for": "2026-05-03" } },
  { "action": "delete", "table": "agenda_tasks",
    "ids": ["uuid1", "uuid2"] },
  { "action": "advance_status", "table": "social_posts",
    "ids": ["uuid"] }
]
```

**(D) Misto** — array onde cada item ou é um comando OU traz `kind: "post" | "task" | "objective"` que vira `create` na tabela apropriada.

```json
[
  { "kind": "post",      "account": "nzppf", "title": "RAM dourada" },
  { "kind": "task",      "title": "Editar reel sexta",
                          "due_date": "2026-05-01", "priority": 1 },
  { "action": "advance_status", "table": "social_posts",
    "ids": ["uuid-existente"] }
]
```

#### 4 ações suportadas

- **`create`** — cria registro. Exige `data` com os campos obrigatórios da tabela.
  - `social_posts`: `account` + `title` obrigatórios. Status default `backlog`. Checklist auto-populada por `format` se não vier.
  - `agenda_tasks`: `title` obrigatório. `priority` default 2 (1=alta, 2=média, 3=baixa).
  - `agenda_objectives`: `scope` (`monthly` | `weekly`) + `title` + `target_date` obrigatórios.

- **`update`** — exige `id` + `patch` (objeto parcial). Campos `id`, `created_at`, `created_by` são silenciosamente ignorados se vierem no patch.

- **`delete`** — exige `ids: string[]`. Apaga em batch via `.in('id', ids)`. Confirmação obrigatória se total > 5.

- **`advance_status`** — só pra `social_posts`. Move pro próximo status (`backlog → em_producao → pronto → agendado → postado`). Posts já em `postado` são ignorados silenciosamente. Operação em batch — agrupa por novo status.

#### Validação tolerante

Erros não bloqueiam: o sistema executa as operações válidas e lista as ignoradas com motivo. Pré-visualização agrupada por tipo e ação:

```
Modo: array de comandos
✓ Detectado:
  · 3 posts (create)
  · 1 posts (update)
  · 2 posts (advance_status)
  · 4 tarefas (create)
⚠ 1 ignorado:
  · Item 5: action "destroy" desconhecida (use create, update, delete, advance_status)
```

Toast de execução quebra por tabela e ação:

```
Execução do protocolo Cowork:
· posts: 3 criados, 1 atualizados, 2 avançados
· tarefas: 4 criados
```

#### TSV legado

O toggle **TSV (legado)** continua funcionando, mas só pra formato (A) — array simples de posts. É auto-detectado se você colar um header com tabs + coluna `account`. Use JSON pra qualquer coisa além de posts.

#### Exportar

Botão **📤 Exportar** abre modal com 3 filtros:

- **Escopo de data**: `Todos` | `Esta semana` (Seg-Dom) | `Este mês` | `Próximos 30 dias` | `Datas personalizadas`.
- **Tabelas**: 4 checkboxes (`posts` / `tasks` / `objectives` / `external_events`) — todos marcados por padrão.
- **Conta** (só afeta posts): `Todas` | `@nzppf` | `@nzgroup.br` | `@joaowrap`.

A pré-visualização JSON atualiza em tempo real. Botão **📋 Copiar pro clipboard** usa `navigator.clipboard.writeText`. Em ambientes onde clipboard não está disponível (HTTPS quirks), o botão **Selecionar tudo** faz `select()` no textarea pra copiar manualmente com Ctrl+C.

**Estrutura do JSON exportado:**

```json
{
  "exported_at": "2026-04-27T19:00:00.000Z",
  "scope": "this_week",
  "range": { "start": "2026-04-27", "end": "2026-05-03" },
  "filters": {
    "accounts": "all",
    "tables": { "posts": true, "tasks": true, "objectives": true, "external_events": true }
  },
  "summary": {
    "posts":      { "total": 7, "by_status": { "backlog": 2, "agendado": 5 },
                    "by_account": { "nzppf": 3, "nzgroup": 2, "joaowrap": 2 } },
    "tasks":      { "total": 4, "by_status": { "pending": 3, "done": 1 } },
    "objectives": { "monthly": 1, "weekly": 1, "open": 2, "done": 0 },
    "external_events": { "total": 5 }
  },
  "posts":           [ /* arrays completos sem created_by */ ],
  "tasks":           [ /* idem */ ],
  "objectives":      [ /* idem */ ],
  "external_events": [ { "feed_label": "Agenda João",
                         "title": "Reunião lojista X",
                         "date": "2026-04-30",
                         "all_day": true } ]
}
```

Regras:

- **IDs incluídos** em todos os arrays — Cowork precisa pra mandar comandos `update` / `delete` / `advance_status` no próximo round.
- **`created_by` omitido** (privacidade).
- **`external_events`** é uma agregação dos feeds `.ics` enabled (read-only). Vem do hook `useCalendarFeeds` já carregado pelo módulo.
- **`summary`** é calculado client-side a partir dos arrays filtrados.

#### Round-trip de exemplo

```
1. João: "Cowork, planeja a próxima semana baseada nos lojistas
          que vou visitar terça e quinta."
2. Cowork: gera JSON com 5 posts + 4 tasks + 1 objetivo semanal
          (formato D: misto).
3. João abre Agenda → 📥 Importar / Comandar → cola → confere
          a pré-visualização → clica Executar.
4. Agenda mostra os cards no Backlog e tarefas na zona Hoje/Semana.
5. João trabalha durante a semana — marca tarefas como done,
          move posts no kanban com as setas, agenda no Meta.
6. Domingo 19h: João abre 📤 Exportar (escopo "Esta semana"),
          clica Copiar pro clipboard.
7. Cola no chat do Cowork.
8. Cowork analisa: "Você cumpriu 6/7 — o post 'Reel da RAM'
          ficou em pronto, não foi agendado. Sugiro mover pra
          terça que vem. Manda esse comando:
          { action: 'update', table: 'social_posts',
            id: '<uuid>', patch: { scheduled_for: '2026-05-12' } }"
9. João cola, executa, segue.
```

Esse é o ciclo: **Cowork sugere → João executa → Agenda registra → João exporta → Cowork analisa**. Sem credenciais compartilhadas, sem API pública, sem ferramenta a mais entre os dois.

### Motor de ideias

Botão `💡 Gerar ideias` ao lado do `+ Novo post`. Abre modal:

1. Escolhe **conta** + **pilar** (filtra pela conta selecionada).
2. **Quantidade** (1-10, default 5).
3. **Contexto opcional** — se você escrever "BMW M3" ou "Ferrari Metallic Red", o gerador prefere esse valor nos placeholders quando bate.
4. Clica `Gerar`. N ideias aparecem, todas pré-selecionadas. Você pode:
   - Editar o título de cada uma direto no input.
   - Desmarcar as que não quer.
   - "Selecionar todas" / "Desmarcar todas".
5. Clica `Adicionar X ao Backlog`. Os cards aparecem no kanban com status `backlog`, formato apropriado e checklist já preenchida.

**Sem chamada a IA externa** — banco interno determinístico. Cores de wrap puxadas do código real (`src/lib/data/nzwrapColors.ts`), linhas PPF puxadas de `src/components/Catalog/data/catalogData.ts`. Adicionar/editar templates significa mexer em `IDEA_BANK` no arquivo `AdminAgendaSocialIdeaGenerator.tsx`.

### Ações comuns

**Mover de status:** dois jeitos:
1. No próprio card, setas `←` e `→` empurram para coluna anterior/seguinte.
2. Editar o card e mudar o campo Status diretamente.

Fluxo natural: `Backlog → Em Produção → Pronto → Agendado → Postado`.

**Filtrar por conta:** botões no topo (`Todos / @nzppf / @nzgroup.br / @joaowrap`). Ao filtrar, a barra de stats mostra a contagem só daquela conta por status. O filtro vale também na vista Calendário.

**Editar:** clica no título do card, ou no ícone `✎`.

**Apagar:** ícone `×` (pede confirmação).

## Receita de uso semanal recomendada

Combina com a rotina da planilha `NZ_Sistema_Rotina.xlsx`:

- **Domingo 19h-21h** — abre a Agenda. Filtra por `Backlog`. Move 7 cards para `Em Produção` (define data prevista). Cola legenda do `NZ_Banco_Legendas_2026.docx` no campo `Legenda`. Anexa link do asset. Quando agendar no Meta Business Suite, move para `Agendado`.
- **Toda visita a lojista** — captura mídia → cria card direto pelo celular (PWA do site funciona) com status `Backlog`, asset link e nota.
- **Sexta 18h** — review: tudo que está em `Postado` da semana, marca o que performou e cria 3-5 cards novos no `Backlog` enquanto a memória está fresca.

## Limitações conscientes do MVP

Não tem (de propósito, para manter simples):
- Drag-and-drop entre colunas (use as setas `← →`).
- Integração com Meta/Instagram para postar automaticamente.
- Upload de imagem direto (use link de Drive/URL externa).
- Notificações.
- Drag-and-drop de chip entre dias no calendário (edite o post para mudar a data).

Se algum desses virar dor real depois de 30 dias de uso, dá para evoluir incrementalmente.

## Próximas evoluções possíveis (quando fizer sentido)

1. **Drag-and-drop** com `react-beautiful-dnd` — ~50 linhas, melhora muito a UX.
2. **Drag de chip entre dias no calendário** — atualiza `scheduled_for` no Supabase ao soltar.
3. **Importar do banco de legendas** — botão que cria card automaticamente a partir de uma das 39 legendas do `NZ_Banco_Legendas_2026.docx` (embutido como JSON).
4. **Stats mensais** — gráfico de posts feitos por mês × meta da planilha de Métricas.
5. **Webhook agendado** — cron Supabase que avisa por email/WhatsApp 24h antes de cada post `Agendado`.
6. **Templates de ideias mais ricos** — ampliar `IDEA_BANK` por pilar (hoje cobre todos os pilares com 3-4 templates cada).
7. **Editar templates da checklist** sem mexer no código — tabela `checklist_templates` no Supabase com fallback pro hardcoded.

Me chama quando quiser priorizar uma dessas.

## Plano (Objetivos & Tarefas)

Toggle de view tem 3 botões: **📋 Kanban / 📅 Calendário / 🎯 Plano**.

A vista Plano não substitui o Kanban — ela fornece a camada de **planejamento** que o Kanban (focado em estado de produção dos posts) não cobre. Tem 3 zonas verticais:

### Zona 1 — Mês

Cards horizontais com **objetivos mensais** do mês corrente. Cada card mostra título, descrição truncada, status (✓ ou ○), contador de tarefas vinculadas (`5 tarefas · 3 concluídas`) e barra de progresso fina.

- `+ Objetivo do mês` cria objetivo com `target_date` = primeiro dia do mês ativo.
- Click no número de status alterna `open` ↔ `done`.
- Click no título abre modal de edição.
- Navegação ← Hoje → no header da zona muda o mês visualizado.

### Zona 2 — Semana

Cabeçalho mostra a semana ativa (segunda → domingo). Acima do grid, **objetivos semanais** aparecem como chips dourados clicáveis.

Grid 7 colunas (Seg → Dom). Cada coluna tem:
- Header com o dia (`Seg 28`).
- Tarefas com `due_date` naquele dia (priority colorido + título truncado).
- Posts agendados naquele dia (badge da conta + título).
- Eventos de feeds externos `.ics` enabled (chips translúcidos com cor do feed).

A coluna do dia atual ganha borda accent-red.

### Zona 3 — Hoje

Card destacado em fundo vinho. Lista de **tarefas com `due_date = hoje`**, ordenadas por prioridade (Alta → Baixa) e depois por status (em andamento → pendente → concluída).

Cada linha tem:
- Checkbox que alterna `pending` ↔ `done`.
- Título editável (click para abrir modal).
- Tag de prioridade colorida.
- Link sutil pro objetivo se tiver `objective_id`.
- Link sutil pro post se tiver `social_post_id`.

`+ Tarefa de hoje` cria tarefa pré-preenchida com prazo = hoje.

### Conexões

- **Objetivo ↔ Tarefa:** Tarefa pode ter `objective_id`. Card de objetivo no mês conta tarefas vinculadas. TaskModal tem dropdown de objetivos abertos.
- **Post ↔ Tarefa:** No card do post (Kanban), botão `+T` cria tarefa pré-preenchida com `social_post_id` e `due_date = scheduled_for`. **Não muda** o status do post quando a tarefa é concluída — são dois ciclos independentes.
- **Filtro por conta** continua valendo na zona Semana (posts mostrados são os filtrados).

### Ciclo de uso recomendado

1. **Início do mês:** define 2-4 objetivos mensais.
2. **Domingo (~19h):** define 1-3 objetivos semanais e cria as tarefas da semana (vincula a objetivos quando fizer sentido).
3. **Diariamente:** abre a Zona 3 logo cedo, marca o que vai fazer hoje, conclui ao longo do dia.

## Agendas externas (overlay iCal)

Botão `🔗` no header do **Calendário** abre o **FeedManager**. Permite cadastrar URLs `.ics` públicas do Google Calendar (ou de qualquer fonte iCal compatível) e exibir esses eventos como chips read-only sobre o Calendário e a zona Semana do Plano.

### Como pegar a URL .ics no Google Calendar

```
calendar.google.com → ⚙ Settings (engrenagem) → Settings for my calendars
  → escolha a agenda → role até "Integrate calendar"
  → copie "Secret address in iCal format" (privada, recomendada)
  ou "Public address in iCal format" (apenas se a agenda for pública)
```

Cole no FeedManager: label (ex: "Pessoal", "NZ Group"), URL, cor para os chips. Toggle on/off para esconder sem apagar.

### Limitações conscientes do parser iCal

O parser é caseiro e mínimo (sem libs externas). Cobre:
- `BEGIN:VEVENT` / `END:VEVENT` boundaries.
- `SUMMARY` (com unescape de `\,`, `\;`, `\\`, `\n`).
- `DTSTART` em formatos `;VALUE=DATE:YYYYMMDD` (all-day) e `:YYYYMMDDTHHMMSS[Z]` (com hora — hora ignorada na visualização).
- Line folding RFC 5545 (linhas continuadas com espaço/tab).

**Não cobre** (limitações documentadas):
- `RRULE` (recorrência) — eventos recorrentes aparecem só na primeira ocorrência (DTSTART original).
- `RECURRENCE-ID`, `EXDATE`, `EXRULE` — overrides de instâncias recorrentes ignorados.
- Timezone real (`TZID`, `VTIMEZONE`) — só extrai data, hora descartada.
- `CATEGORIES`, `LOCATION`, `DESCRIPTION` — não exibidos (apenas SUMMARY).
- Validação semântica (eventos com DTSTART > DTEND, etc).

Read-only por design: a Agenda NZ não escreve em calendários externos.

### Proxy server-side (CORS)

URLs `.ics` do Google Calendar (e Outlook, iCloud) **não** servem CORS aberto pra browsers — o navegador bloqueia o fetch direto. Por isso temos uma serverless function em `api/agenda/fetch-ical.ts` que faz proxy: cliente chama `/api/agenda/fetch-ical?url=<encoded>`, o servidor fetcha o `.ics` e devolve o conteúdo.

Validação anti-SSRF: o proxy só aceita URLs de hosts conhecidos de iCal (Google, Outlook, iCloud). Tentativa de fetch para outros hosts retorna 400.

Se algum feed continuar dando erro (URL inválida, token revogado, host fora da whitelist), aparece warning ⚠ no FeedManager pra esse feed específico.

## Trabalhando com o Cowork

O **Cowork** é o assistente que roda no desktop do João, em paralelo a esta interface. Ele ajuda com bastidor, planejamento, redação de legendas, sugestões de pauta. Não tem acesso direto ao Supabase — o canal entre Cowork e a Agenda é o **JSON** que ele entrega no chat e o JSON estruturado que o João copia de volta.

A documentação completa do protocolo bidirecional (4 formatos × 4 ações × 3 tabelas + filtros de export + round-trip) está acima em **"Protocolo Cowork: Importar, Comandar, Exportar"**.

**Por que esse desenho:** Cowork não toca DB. Toda criação/edição passa pela mão do João (via paste + click). Isso mantém auditoria simples (todo card tem `created_by = user`), evita risco de credencial vazada e mantém a Agenda como fonte única de verdade.

---

*Proteção feita para o mundo real — inclusive proteção do seu tempo de venda.*
