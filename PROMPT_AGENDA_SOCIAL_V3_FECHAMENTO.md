# Prompt — Fechamento da Agenda Social Media (v3)

> **Como usar:** Cole tudo abaixo da linha tracejada num único turno do Claude no VS Code. É o último passo antes de a ferramenta ir pra produção e eu (Claude no Cowork desktop) começar a colaborar com o João direto através dela.

---

# Tarefa

Você já implementou as 3 features (Calendário, Checklist, Motor de Ideias) — build passa, split em 3 arquivos, README atualizado. Sua missão agora é **fechar o ciclo**: smoke test pós-SQL, commit + push, e adicionar **uma feature pequena de ponte para colaboração com o assistente Cowork**.

## Estado atual (não duplique trabalho)

Confirmado já feito:
- `social_posts.sql` — schema + RLS + trigger.
- `social_posts_v2.sql` — coluna `checklist jsonb`.
- `src/pages/Admin/AdminAgendaSocial.tsx` (~760 linhas) — kanban, modal com checklist, toggle, integrações.
- `src/pages/Admin/AdminAgendaSocialCalendar.tsx` — vista calendário.
- `src/pages/Admin/AdminAgendaSocialIdeaGenerator.tsx` — motor de ideias.
- `src/pages/Admin/AdminAgendaSocial.module.css` — estilos.
- `Dashboard.tsx` — tab integrada.
- `AGENDA_SOCIAL_README.md` — documentação atualizada.
- `npm run build` passa limpo.

---

# Passos de fechamento

## 1. Verificação manual (instruir o João — não conseguimos por código)

O João já viu na tela `Erro: Could not find the table 'public.social_posts' in the schema cache`. Esse é o comportamento **correto** do componente — ele detecta tabela ausente e orienta. O João precisa rodar os 2 SQLs no Supabase **antes** dos próximos passos. Coloque na sua resposta uma seção bem visível chamada **AÇÃO MANUAL DO JOÃO** com:

```
1. Abrir https://supabase.com → projeto NZ → SQL Editor → New Query
2. Copiar conteúdo de `social_posts.sql` → colar → Run
3. Nova query → copiar `social_posts_v2.sql` → colar → Run
4. Voltar ao localhost:5173/admin → tab Agenda Social → recarregar.
   Erro deve sumir, kanban vazio aparece.
```

**Não tente rodar SQL programaticamente** — o anon key do `.env` não tem permissão pra DDL, e mesmo que tivesse, dependerias de RLS de admin que só existe pós-criação. Manual mesmo.

## 2. Smoke test programático do build

Depois de garantir que o que dá pra testar localmente está OK (sem precisar do Supabase real):

```bash
cd c:/Users/joaov/OneDrive/Documentos/FIRECRAL/nz-distribuidora-web
npm run build
```

Tem que continuar passando. Se quebrar por causa da feature nova abaixo, corrige até passar.

## 3. Adicionar feature: **Importar em Lote**

**Razão estratégica:** o assistente Cowork (rodando no desktop do João) vai sugerir posts em chat — tipo "aqui vão 7 posts pra essa semana baseados nas visitas que você descreveu". Para o João não digitar 7 cards à mão, precisa de um botão que aceita um lote em formato simples e cria tudo de uma vez no Backlog. Esse é o canal de comunicação entre mim (Claude VS Code), o assistente Cowork, e a interface real.

### Especificação

Adicionar **botão `📥 Importar em lote`** na header, ao lado do `💡 Gerar ideias`. Mesmo padrão visual (`secondaryBtn`).

Click abre um **modal novo** (componente inline no `AdminAgendaSocial.tsx`, não precisa extrair) com:

- **Título:** "Importar posts em lote"
- **Subtítulo curto:** "Cole o JSON ou TSV abaixo. O Cowork pode te entregar nesse formato."
- **Toggle de formato:** `JSON` | `TSV` (default `JSON`).
- **Textarea grande** (10-15 linhas, font monospace) com placeholder mostrando exemplo no formato selecionado.
- **Pre-visualização** abaixo do textarea: enquanto o usuário cola, parse em tempo real e mostra: "✓ N posts válidos detectados" ou "⚠ erro na linha X: ..." com mensagem específica.
- **Botão `Importar X posts`** (disabled se zero válidos).
- **Botão `Cancelar`**.

### Formatos aceitos

**JSON** (preferido — flexível e o Cowork vai mandar nesse formato):

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

**TSV** (backup — fácil pro João digitar à mão):

```
account	title	format	pillar	scheduled_for
nzppf	RAM cromada @adesivotech	Reel	Showcase Luxury	2026-04-29
nzgroup	Cor da semana: Stuttgart	Carrossel	Catálogo NZ Wrap	
```

Primeira linha = header (qualquer ordem das colunas). Linhas vazias ignoradas.

### Regras de validação

Para cada post:
- `account` **obrigatório**, deve ser `'nzppf' | 'nzgroup' | 'joaowrap'`.
- `title` **obrigatório**, não-vazio após trim.
- `format` opcional, mas se presente deve ser um dos `['Foto', 'Carrossel', 'Reel', 'Story']` (case-insensitive na entrada, normalizado pra capitalize).
- `scheduled_for` opcional, mas se presente deve ser ISO date `YYYY-MM-DD` (regex check).
- `status` ignorado se vier — sempre força `'backlog'` (intent: importação alimenta o Backlog).
- `pillar`, `caption`, `notes`, `asset_url` opcionais, passam direto.
- `checklist` opcional. Se não vier, **gera** com `templateChecklist(format)` (que já existe no módulo).

### Implementação

1. Estado novo no `AdminAgendaSocial`: `[importOpen, setImportOpen] = useState(false)`.
2. Botão `📥 Importar em lote` na header chama `setImportOpen(true)`.
3. Componente `BulkImportModal` inline no mesmo arquivo (~120-150 linhas estimadas — mantém main file ainda < 900 linhas, aceitável).
4. Função pura `parseBulkInput(text: string, format: 'json' | 'tsv'): { valid: BulkPost[]; errors: string[] }` — separa parsing de UI, fácil de testar mental.
5. Submit: `supabase.from('social_posts').insert(payload)` com array. Em caso de erro, mostra mensagem; em sucesso, chama `loadPosts()` e fecha modal.
6. CSS: reutilizar `modalOverlay`, `modal`, `modalHeader`, `modalBody`, `modalFooter`, `formInput`, `formTextarea`, `primaryBtn`, `secondaryBtn` que já existem. Adicionar 3-5 classes específicas se necessário (ex: `.importPreview`, `.importPreviewError`, `.importFormatToggle`) seguindo o padrão de naming existente.

### UX de erro

Validação **não-bloqueante**: mesmo com erros, mostra os posts válidos detectados e permite importar só os válidos (não tudo-ou-nada). Erros aparecem em lista clara com número da linha (ou índice no JSON) + mensagem.

Exemplo:
```
✓ 5 posts válidos detectados
⚠ 2 ignorados:
  · Linha 3: account "instagram" inválido (use nzppf, nzgroup ou joaowrap)
  · Linha 5: title vazio
```

## 4. Atualizar README

Adicionar seção no `AGENDA_SOCIAL_README.md` sobre **Importar em Lote**:
- Quando usar (recebeu sugestão do Cowork ou tem planilha externa).
- Os 2 formatos aceitos, com exemplo curto de cada.
- Que linhas com erro são ignoradas, válidas são importadas.
- Nota: o status é sempre forçado pra `backlog` na importação.

Adicionar seção **"Trabalhando com o Cowork"** no fim do README:
- Cowork é o assistente desktop que o João usa em paralelo.
- Fluxo recomendado: João conversa com Cowork → Cowork sugere posts em JSON → João clica "Importar em lote" → cola → cria. Cowork **não** acessa o Supabase diretamente; o canal é via copy-paste do JSON.

## 5. Build final + commit

```bash
npm run build  # tem que passar
```

Se passar, commit:

```bash
git add -A
git commit -m "feat(agenda-social): importação em lote (JSON/TSV) + finalização

- Botão 'Importar em lote' na header da Agenda Social.
- BulkImportModal aceita JSON ou TSV.
- Parser tolerante: importa válidos, lista ignorados com motivo.
- Status sempre forçado pra 'backlog' na importação.
- Checklist auto-populada via templateChecklist(format).
- README documenta formato e fluxo de colaboração com Cowork.

Closes Agenda Social v3."
git push
```

Se algum passo falhar, **não force push**, **não rebase silenciosamente** — pare e me responda explicando o que aconteceu.

---

# Restrições

- **Não instale libs** (sem `papaparse`, sem `csv-parse`, etc.). Parse JSON com `JSON.parse`, TSV com `.split('\n').map(l => l.split('\t'))`. Suficiente.
- **Não mude APIs públicas existentes** do `AdminAgendaSocial` exportadas (`Account`, `SocialPost`, `templateChecklist`, etc.) — outros arquivos importam disso.
- **Não toque em arquivos fora do escopo**: nada de Dashboard, nada de outros admin pages, nada de SQL novo (a coluna `checklist` já existe).
- **TypeScript estrito.** `npm run build` tem que passar antes do commit.
- **Sem `any` desnecessário.** Crie tipo `BulkPost` para os items parseados.

---

# Definição de pronto

- [ ] Botão "📥 Importar em lote" visível na header, ao lado do "💡 Gerar ideias".
- [ ] Modal abre, permite trocar entre JSON e TSV, mostra placeholder do formato.
- [ ] Pre-visualização atualiza em tempo real com contagem de válidos + erros.
- [ ] Importar 5 posts via JSON cria 5 cards no Backlog, com checklist auto-populada por formato.
- [ ] Importar via TSV funciona igual.
- [ ] Linhas/items inválidos são ignorados, válidos passam.
- [ ] README atualizado com seção de Importar em Lote + seção Cowork.
- [ ] `npm run build` passa.
- [ ] Commit + push feitos com mensagem descritiva.

---

# O que me responder no fim

(a) Confirmação de que build passou e commit/push deram OK (com hash do commit).
(b) Bloco com o exemplo de JSON pronto pra eu (Cowork) usar como template ao sugerir posts pro João.
(c) Qualquer surpresa que apareceu durante a implementação.
(d) Lembrete pro João dos 2 SQLs que ele ainda precisa rodar no Supabase (com link clicável do painel se você lembrar).
