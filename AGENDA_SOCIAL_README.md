# Agenda Social Media — Setup local

Módulo simples de kanban para gerenciar posts das três contas (@nzppf, @nzgroup.br, @joaowrap) direto no admin do site.

## O que foi adicionado

| Arquivo | O que é |
|--------|---------|
| `social_posts.sql` | SQL inicial — cria tabela `social_posts`, RLS, trigger de updated_at |
| `social_posts_v2.sql` | Migration v2 — adiciona coluna `checklist` (jsonb) |
| `social_posts_v3.sql` | Migration v3 — cria `agenda_objectives`, `agenda_tasks`, `calendar_feeds` |
| `src/pages/Admin/AdminAgendaSocial.tsx` | Componente principal (kanban + toggle de view + modal de criar/editar com checklist + bulk import) |
| `src/pages/Admin/AdminAgendaSocialCalendar.tsx` | Vista calendário mensal (com overlay de eventos externos) |
| `src/pages/Admin/AdminAgendaSocialPlan.tsx` | Vista Plano (zonas Mês / Semana / Hoje, objetivos e tarefas) |
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

### Importar em lote (canal de colaboração com o Cowork)

Botão `📥 Importar em lote` na header. Abre modal com toggle **JSON** (preferido) ou **TSV** (backup pra digitar/colar de planilha).

Cole o conteúdo. A pre-visualização atualiza em tempo real, mostrando quantos posts foram detectados e quais linhas foram ignoradas (com motivo). Clicar em **Importar X posts** cria os cards no kanban com `status = 'backlog'` e checklist auto-populada conforme o `format`.

**Quando usar:**
- Acabou de conversar com o Cowork (assistente desktop) que sugeriu N posts pra semana → cola o JSON.
- Tem uma planilha externa com posts a importar → exporta como TSV → cola.

**Formato JSON (recomendado):**

```json
[
  {
    "account": "nzppf",
    "title": "RAM cromada @adesivotech",
    "format": "Reel",
    "pillar": "Showcase Luxury",
    "scheduled_for": "2026-04-29",
    "caption": "Brilho que vira presença...",
    "notes": "Cortar do bruto."
  },
  {
    "account": "nzgroup",
    "title": "Cor da semana: Stuttgart Sport Grey",
    "format": "Carrossel",
    "pillar": "Catálogo NZ Wrap"
  }
]
```

**Formato TSV (header obrigatório, qualquer ordem das colunas):**

```
account	title	format	pillar	scheduled_for
nzppf	RAM cromada @adesivotech	Reel	Showcase Luxury	2026-04-29
nzgroup	Cor da semana	Carrossel	Catálogo NZ Wrap	
```

**Regras de validação:**
- `account` obrigatório (`nzppf` | `nzgroup` | `joaowrap`).
- `title` obrigatório, não vazio.
- `format` opcional, mas se vier deve ser um de `Foto / Carrossel / Reel / Story` (case-insensitive).
- `scheduled_for` opcional, formato `YYYY-MM-DD` se presente.
- `status` ignorado se vier — sempre forçado pra `backlog` na importação.
- `pillar`, `caption`, `notes`, `asset_url` opcionais.
- `checklist` opcional. Se vier bem-formada (`[{ "label": str, "done": bool }, ...]`) é usada; senão deriva do `format`.

**Validação tolerante:** linhas inválidas viram a lista de "ignorados" com motivo, e o resto importa normalmente. Não é tudo-ou-nada.

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

### CORS

O endpoint `.ics` é fetched no client. Google Calendar serve com CORS aberto na URL `secret address`. Se algum feed bloquear (CORS ou auth), aparece warning ⚠ no FeedManager pra esse feed.

## Trabalhando com o Cowork

O **Cowork** é o assistente que roda no desktop do João, em paralelo a esta interface. Ele ajuda com bastidor, planejamento, redação de legendas, sugestões de pauta. Não tem acesso direto ao Supabase — o canal entre Cowork e a Agenda é o **JSON** que ele entrega no chat.

**Fluxo recomendado:**

1. João conversa com o Cowork: "me dá 7 posts pra essa semana baseados nas visitas em Curitiba e no lançamento da Headlight Dark Black".
2. Cowork responde com bloco JSON pronto pra colar (formato documentado acima em "Importar em lote").
3. João abre `/admin` → **Agenda Social** → `📥 Importar em lote` → cola → confere a pré-visualização → confirma.
4. Cards aparecem no Backlog, com checklist preenchida pelo `format`. João edita o que quiser direto na interface.

**Por que esse desenho:** Cowork não toca DB. Toda criação passa pela mão do João (via paste + click). Isso mantém auditoria simples (todo card tem `created_by = user`), evita risco de credencial vazada e mantém a Agenda como fonte única de verdade.

---

*Proteção feita para o mundo real — inclusive proteção do seu tempo de venda.*
