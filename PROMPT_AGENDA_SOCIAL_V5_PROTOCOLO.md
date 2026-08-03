# Prompt — Agenda Social v5: Protocolo Cowork

> **Como usar:** cole tudo abaixo da linha tracejada num único turno do Claude no VS Code.

---

# Tarefa

Estender a Agenda Social pra virar uma **mesa de operação compartilhada** entre o João e o assistente Cowork. Hoje a bulk import só aceita `social_posts`. Você vai transformar ela num **protocolo de comandos polimórfico** (entrada) e adicionar um **export** estruturado (saída). Isso fecha o loop: Cowork manda comandos → João executa via paste → Agenda processa → João exporta estado → Cowork lê e ajusta. Sem OAuth, sem API exposta, controle total do João.

## Estado atual

Já entregue (v1-v4):
- Tabelas: `social_posts`, `agenda_objectives`, `agenda_tasks`, `calendar_feeds`.
- Componentes: `AdminAgendaSocial.tsx`, `AdminAgendaSocialCalendar.tsx`, `AdminAgendaSocialPlan.tsx`, `AdminAgendaSocialIdeaGenerator.tsx`, `AdminAgendaSocialFeeds.ts`, `AdminAgendaSocialFeedManager.tsx`.
- BulkImportModal hoje aceita só array de posts. Vamos estender.

## Antes de codar, leia

- `src/pages/Admin/AdminAgendaSocial.tsx` (foco: `BulkImportModal`, `parseBulkInput`, função `executeImport`/equivalente)
- `src/pages/Admin/AdminAgendaSocialPlan.tsx` (referência de como tasks e objectives são criados/atualizados)
- `social_posts.sql`, `social_posts_v2.sql`, `social_posts_v3.sql` (schemas)
- `AGENDA_SOCIAL_README.md` (estado documentado)

---

# As 2 features

## 1. Bulk Import polimórfico + comandos

Substitua o `BulkImportModal` atual por uma versão que aceita 4 formatos de entrada e 4 tipos de ação.

### 4 formatos de payload

**(A) Array simples — só posts (compatibilidade legada)**
```json
[ {"account": "nzppf", "title": "..."}, ... ]
```
Detecta por: array onde nenhum item tem `action` nem `kind`. Comportamento idêntico ao atual.

**(B) Objeto agrupado por tipo**
```json
{
  "posts":      [ {...}, {...} ],
  "tasks":      [ {...} ],
  "objectives": [ {...} ]
}
```

**(C) Array de comandos**
```json
[
  { "action": "create", "table": "social_posts", "data": { "account": "nzppf", "title": "..." } },
  { "action": "create", "table": "agenda_tasks", "data": { "title": "Visitar @adesivotech", "due_date": "2026-04-29" } },
  { "action": "update", "table": "social_posts", "id": "uuid", "patch": { "scheduled_for": "2026-05-03" } },
  { "action": "delete", "table": "social_posts", "ids": ["uuid1", "uuid2"] },
  { "action": "advance_status", "table": "social_posts", "ids": ["uuid"] }
]
```

**(D) Misto** — array onde cada item ou é um comando OU traz campo `kind: "post" | "task" | "objective"` que vira `create`.

### Tabelas suportadas
- `social_posts`
- `agenda_tasks`
- `agenda_objectives`

### Ações suportadas

- **create** — exige `data`. Validações por tabela:
  - `social_posts`: `account` + `title` obrigatórios. Resto idêntico ao bulk import atual (status default `backlog`, checklist auto-populada por format).
  - `agenda_tasks`: `title` obrigatório. Demais opcionais (`due_date`, `priority`, `objective_id`, `social_post_id`, `description`).
  - `agenda_objectives`: `scope` + `title` + `target_date` obrigatórios. `scope` em `('monthly', 'weekly')`.
- **update** — exige `id` + `patch` (objeto parcial). Aplica via `.update(patch).eq('id', id)`. Não permite mudar `id` ou `created_at`.
- **delete** — exige `ids: string[]`. Apaga via `.in('id', ids)`. Confirma com `confirm()` antes se total > 5.
- **advance_status** — só pra `social_posts`. Lê status atual, move pro próximo (backlog→em_producao→pronto→agendado→postado). Se já em `postado`, ignora silenciosamente. Faz em batch — busca todos primeiro, agrupa por novo status, dispara um update por grupo.

### Validação

- Toda validação client-side antes do execute.
- Pre-visualização agrupada:
  ```
  ✓ Detectado: 3 posts (create), 2 tarefas (create), 1 objetivo (create),
              2 commands (1 update, 1 delete)
  ⚠ 1 ignorado:
    · Index 4: action "destroy" desconhecida (use create, update, delete, advance_status)
  ```
- Erros não bloqueiam — executa válidos, ignora inválidos. Toast de sucesso quebra por tabela e ação ao fim.

### UI

Manter o modal mas evoluir:
- **Título**: "Protocolo Cowork — Importar / Comandar"
- **Toggle JSON/TSV**: TSV continua aceito mas só pra formato (A) — adiciona nota "TSV só suporta posts simples (formato legado)".
- **Preview**: cresce em altura, mostra o resumo agrupado e a lista de ignorados.
- **Botão final**: "Executar (X operações)" — disabled se 0.
- Após execute, toast resume:
  ```
  Executado: 3 posts criados, 2 tarefas criadas, 1 objetivo criado,
             1 post atualizado, 2 posts apagados.
  ```

### Implementação

- Função pura `parseBatch(text: string): { ops: ParsedOp[]; errors: string[] }` — separa parsing de UI, fácil de testar.
- Função `executeBatch(ops: ParsedOp[]): Promise<ExecResult>` — despacha por ação/tabela, agrupa inserts da mesma tabela em uma chamada quando possível.
- Tipo `ParsedOp`:
  ```ts
  type ParsedOp =
    | { kind: 'create'; table: TableName; data: Record<string, unknown> }
    | { kind: 'update'; table: TableName; id: string; patch: Record<string, unknown> }
    | { kind: 'delete'; table: TableName; ids: string[] }
    | { kind: 'advance_status'; table: 'social_posts'; ids: string[] };
  ```
- Aceitar bulk insert em chamada única: agrupar todos os `create` da mesma tabela e mandar um array em uma chamada `.insert([...])`.

## 2. Export pro Cowork

Novo botão **`📤 Exportar`** ao lado do `📥 Importar em lote` na header.

### Modal de export

Filtros:
- **Escopo de data**: `Todos` | `Esta semana` (Seg-Dom da semana atual) | `Este mês` | `Próximos 30 dias` | `Datas personalizadas` (range picker simples).
- **Tabelas**: 4 checkboxes (`posts`, `tasks`, `objectives`, `external_events`) — todos marcados por padrão.
- **Conta** (só afeta posts): `Todas` | `@nzppf` | `@nzgroup.br` | `@joaowrap`.

UI:
- Pré-visualização: textarea readonly, monospace, ~12 linhas, scroll, mostra o JSON resultante atualizado em tempo real.
- Botão `📋 Copiar pro clipboard` (usa `navigator.clipboard.writeText`). Toast "JSON copiado — cole no chat do Cowork".
- Botão `Fechar`.

### Estrutura do JSON exportado

```json
{
  "exported_at": "2026-04-27T19:00:00Z",
  "scope": "this_week",
  "filters": {
    "accounts": ["all"],
    "tables": ["posts", "tasks", "objectives", "external_events"]
  },
  "summary": {
    "posts":      { "total": 7, "by_status": { "backlog": 2, "agendado": 5 }, "by_account": { "nzppf": 3, "nzgroup": 2, "joaowrap": 2 } },
    "tasks":      { "total": 4, "by_status": { "pending": 3, "done": 1 } },
    "objectives": { "monthly": 1, "weekly": 1, "open": 2, "done": 0 },
    "external_events": { "total": 5 }
  },
  "posts":      [ /* arrays completos com todos os campos exceto created_by */ ],
  "tasks":      [ /* idem */ ],
  "objectives": [ /* idem */ ],
  "external_events": [
    { "feed_label": "Agenda João", "title": "Reunião lojista X", "date": "2026-04-30", "all_day": true }
  ]
}
```

Regras:
- IDs **incluídos** em todos os arrays — Cowork precisa pra mandar comandos de `update`/`delete`/`advance_status`.
- `created_by` **omitido** (privacidade).
- `external_events` é uma agregação dos feeds .ics ativos (read-only). Pega do hook `useCalendarFeeds` que já existe.
- `summary` é calculado client-side a partir dos arrays.

## 3. Atualizar README

- Renomear seção "Importar em lote" pra **"Protocolo Cowork: Importar, Comandar, Exportar"**.
- Documentar os 4 formatos de payload com exemplo de cada.
- Documentar as 4 ações com exemplo de cada.
- Documentar o export — formato JSON, filtros, uso do clipboard.
- Adicionar bloco **"Round-trip de exemplo"**:
  ```
  1. João: "Cowork, planeja a próxima semana baseada nos lojistas que vou visitar terça e quinta."
  2. Cowork: gera JSON com 5 posts + 4 tasks + 1 objetivo semanal.
  3. João: cola no Importar/Comandar → executa.
  4. Agenda mostra os cards e tarefas.
  5. João trabalha durante a semana, marca tarefas done, move posts no kanban.
  6. Domingo: João clica Exportar (escopo "Esta semana"), copia.
  7. Cola no chat do Cowork.
  8. Cowork analisa: "Você cumpriu 6/7 — o post Reel da RAM ficou em pronto, não foi agendado. Sugiro mover pra terça que vem. Manda esse comando: ..."
  9. João cola, executa, segue.
  ```

## 4. Build + commit

```bash
npm run build      # passa limpo
git add -A
git commit -m "feat(agenda-social): protocolo Cowork — bulk polimórfico + export

- BulkImportModal aceita 4 formatos: array legado, agrupado, comandos, misto.
- 4 ações: create, update, delete, advance_status.
- 3 tabelas: social_posts, agenda_tasks, agenda_objectives.
- Validação tolerante, executa válidos, ignora inválidos.
- Pre-visualização agrupada por tipo e ação.
- Botão Exportar com 3 filtros (escopo, tabelas, conta).
- Export JSON inclui summary + arrays + external_events.
- Cópia automática pro clipboard via navigator.clipboard.
- README documenta protocolo completo + round-trip de exemplo."
git push
```

---

# Restrições

- Sem libs novas. Use `JSON.parse`, `navigator.clipboard.writeText`, e o cliente Supabase já existente.
- TypeScript estrito. Crie tipos: `ParsedOp`, `ExecResult`, `ExportPayload`, `ExportSummary`.
- `npm run build` passa antes do commit.
- **Compatibilidade legada obrigatória**: formato (A) — array simples de posts — continua funcionando 100%. Teste manualmente colando um payload no formato antigo antes do commit.
- Não toca em outras telas. Não mexe em SQL.
- `navigator.clipboard.writeText` exige HTTPS ou localhost. Em localhost dev funciona. Pro caso de fallback, ofereça também um botão "Selecionar tudo" que dá `select()` no textarea — usuário copia com Ctrl+C.
- Confirmação `confirm()` antes de executar `delete` quando total > 5.
- Não bloquear a UI enquanto executa — mostre estado de loading no botão "Executar".

---

# Definição de pronto

- [ ] `parseBatch` reconhece os 4 formatos (A, B, C, D).
- [ ] Pre-visualização agrupa por tipo e ação, lista ignorados com motivo.
- [ ] `create` funciona pras 3 tabelas com validação correta de campos obrigatórios.
- [ ] `update` funciona pras 3 tabelas.
- [ ] `delete` funciona pras 3 tabelas com confirmação se > 5 ids.
- [ ] `advance_status` funciona pra `social_posts` (move pro próximo, ignora `postado`).
- [ ] Bulk insert agrupa creates da mesma tabela em uma chamada.
- [ ] Toast de sucesso quebra por tabela e ação.
- [ ] Botão `📤 Exportar` aparece na header.
- [ ] Modal de export tem os 3 filtros funcionando.
- [ ] JSON exportado tem `exported_at`, `scope`, `filters`, `summary`, e os arrays.
- [ ] IDs incluídos no export, `created_by` omitido.
- [ ] `external_events` agregados dos feeds ativos.
- [ ] Botão "Copiar pro clipboard" funciona, com toast de confirmação.
- [ ] Formato (A) legado continua funcionando — testado manualmente com um array de posts antigo.
- [ ] README atualizado com a nova seção e o round-trip.
- [ ] `npm run build` passa, commit + push feitos.

---

# O que me responder no fim

(a) Hash do commit.
(b) Arquivos criados/modificados (com contagem de linhas).
(c) Decisões de design importantes (ex: por que `advance_status` é só pra posts? por que confirm em delete > 5?).
(d) Confirmação explícita de que testou o formato legado (A) e funciona.
(e) Um exemplo curto (5-10 linhas) de payload misto (formato D) que você testou que cobre `create` em 2 tabelas + `update` + `delete`, junto com o resultado da execução.
(f) Exemplo curto do JSON exportado em escopo "Esta semana".
