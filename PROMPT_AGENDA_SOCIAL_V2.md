# Prompt — Finalizar Agenda Social Media (v2)

> **Como usar:** Abre Claude no VS Code (no diretório `nz-distribuidora-web/`), cola **tudo abaixo da linha tracejada** num único turno e deixa rodar. O prompt é autocontido — não precisa de contexto adicional.

---

# Tarefa

Você está finalizando um módulo já existente no admin do site `nz-distribuidora-web`: a **Agenda Social Media** (kanban de posts para 3 contas Instagram). O MVP está rodando. Sua missão é adicionar **3 features** para deixar a ferramenta operacional de verdade.

## Contexto: o que já existe

O módulo já entregue:

- **Tabela Supabase**: `social_posts` (criada via `social_posts.sql` na raiz do projeto). Campos: `id`, `account` (`'nzppf' | 'nzgroup' | 'joaowrap'`), `pillar`, `title`, `caption`, `format`, `asset_url`, `scheduled_for` (date), `status` (`'backlog' | 'em_producao' | 'pronto' | 'agendado' | 'postado'`), `notes`, timestamps, `created_by`. RLS para admins.

- **Componente**: `src/pages/Admin/AdminAgendaSocial.tsx` — kanban com filtro por conta, modal de criar/editar, mover status com setas `← →`, deletar.

- **CSS**: `src/pages/Admin/AdminAgendaSocial.module.css` — padrão visual do admin (dark, accent-red, Outfit/Inter, CSS modules).

- **Integração Dashboard**: já registrado em `src/pages/Admin/Dashboard.tsx` como tab `'agenda-social'`, botão sidebar "📅 Agenda Social", `tabLabels['agenda-social'] = 'Agenda Social Media'`.

- **README**: `AGENDA_SOCIAL_README.md` na raiz documenta setup local.

## Antes de codar: leia esses arquivos

```
src/pages/Admin/AdminAgendaSocial.tsx
src/pages/Admin/AdminAgendaSocial.module.css
src/pages/Admin/Dashboard.tsx               # só pra confirmar como tabs são integradas
src/pages/Admin/AdminAgenciaNZ.tsx          # padrão visual de "hub" com sub-views
src/pages/Admin/Admin.module.css            # tokens e classes globais do admin
src/index.css                                # CSS variables: --accent-red, --bg-primary, --font-heading, etc.
src/lib/supabase.ts                          # cliente já configurado
PROJECT_MAP.md                               # convenções gerais do projeto
social_posts.sql                             # schema atual da tabela
```

**Não invente padrões.** Siga exatamente o que está nesses arquivos: CSS modules, classes em camelCase via `styles.foo`, tokens CSS via `var(--accent-red)`, fontes `var(--font-heading)` e `var(--font-body)`, sem TailwindCSS.

---

# As 3 features

## 1. Vista Calendário (toggle Kanban ↔ Agenda)

**Objetivo:** ao lado do título "Agenda Social Media", botões de toggle `📋 Kanban` / `📅 Calendário`. Calendário mostra o mês corrente com os posts que têm `scheduled_for` posicionados nos dias certos.

**Especificação:**

- Estado novo: `view: 'kanban' | 'calendar'` (default `'kanban'`).
- Componente novo: `CalendarView` no mesmo arquivo (não criar arquivo separado — manter o módulo coeso).
- Layout: grid 7 colunas (Dom-Sáb), 5-6 linhas. Header dos dias da semana em cima.
- Cada célula de dia: número do dia + lista vertical de "chips" (posts agendados para esse dia). Chip mostra `accountBadge` (cor da conta) + título truncado em 1 linha.
- Header com nome do mês ("Maio 2026") + botões `←` `→` para navegar mês anterior/próximo + botão "Hoje".
- Filtro por conta (já existente) **continua funcionando** no Calendário.
- Click em chip: abre o mesmo modal de edição já existente.
- Click em célula vazia (mas não fora do mês): abre modal de criar **com `scheduled_for` pré-preenchido** com aquela data e status `'backlog'`.
- Posts **sem** `scheduled_for` não aparecem no calendário (visualização pura por data).
- Use `Intl.DateTimeFormat('pt-BR')` para nomes de mês/dia. Não importe libs novas (date-fns, dayjs, etc.) — JS nativo basta.

**Estilo:**
- Célula de dia: borda sutil `rgba(255,255,255,0.06)`, hover `rgba(255,255,255,0.05)`.
- Dia de hoje: borda `var(--accent-red)`.
- Dias de outro mês (preenchimento da grid): opacidade 0.3, número em `var(--text-muted)`.
- Chip: padding tight, font-size 0.7rem, sem border-radius pra manter o brutalismo do site.

## 2. Checklist dinâmica por formato

**Objetivo:** dentro do modal de criar/editar, abaixo do campo "Notas internas", uma checklist que **muda conforme o `format`** (Foto, Carrossel, Reel, Story). Permite acompanhar o progresso de produção sem sair da Agenda.

**Especificação:**

- Adicionar coluna `checklist jsonb default '[]'::jsonb` na tabela `social_posts` (cria migration SQL nova: `social_posts_v2.sql`). Estrutura: `[{ "label": "string", "done": boolean }, ...]`.
- Templates por formato (constantes no arquivo TS):

  ```ts
  const CHECKLIST_TEMPLATES: Record<string, string[]> = {
    'Foto':      ['Foto escolhida', 'Edição rápida', 'Legenda colada', 'Hashtags revisadas', 'Agendado no Meta Business'],
    'Carrossel': ['Roteiro de 3-5 cards', 'Cards desenhados/montados', 'Capa criada', 'Legenda colada', 'Hashtags revisadas', 'Agendado no Meta Business'],
    'Reel':      ['Roteiro escrito', 'Asset gravado', 'Edição feita', 'Capa do reel criada', 'Legenda colada', 'Hashtags revisadas', 'Agendado no Meta Business'],
    'Story':     ['Asset bruto', 'Stickers / CTA inseridos', 'Postado'],
  };
  ```

- Ao **criar** post novo OU ao **mudar `format`** num post existente que tenha checklist vazia: popula com o template do formato (todos `done: false`).
- Se o post já tem checklist com pelo menos 1 item `done`, e o usuário muda o `format`: pergunta via `confirm()` "Mudar formato vai resetar a checklist atual. Continuar?" antes de resetar.
- UI:
  - Header da seção: "Checklist de produção" + barra de progresso fina (0 → N items done).
  - Lista vertical de items: `<input type="checkbox">` + `<span>` com label.
  - Permitir editar label (clicar no texto) e adicionar item custom no fim ("+ Adicionar item").
  - Permitir remover item (`×` à direita).
- Salva junto com o resto do post quando clica "Salvar".
- No **card do kanban**, mostra a barra de progresso pequena se checklist tem pelo menos 1 item: "🗸 3/6". Click no número não faz nada — só visual.

## 3. Motor de Ideias

**Objetivo:** botão `💡 Gerar ideias` ao lado do `+ Novo post`. Abre modal que gera N ideias de post baseadas em conta + pilar + contexto opcional. Usuário seleciona quais quer e elas viram cards no Backlog.

**Especificação:**

- **Não use LLM externo** (sem chamada OpenAI/Anthropic). Use um gerador determinístico template-based — é mais confiável, sem custo, e o usuário pode editar o card depois.
- Banco interno: dicionário de templates por (conta × pilar). ~3-5 templates por combinação. Templates têm placeholders que são preenchidos randomicamente de listas auxiliares.

  Exemplo de estrutura:
  ```ts
  type IdeaTemplate = { title: string; format: string; pillar: string };

  const IDEA_BANK: Record<Account, Record<string, IdeaTemplate[]>> = {
    nzppf: {
      'Showcase Luxury': [
        { title: '{carro} aplicação Luxury — brilho que vira presença', format: 'Reel', pillar: 'Showcase Luxury' },
        { title: 'Antes e depois: {carro} com Luxury Gloss', format: 'Carrossel', pillar: 'Showcase Luxury' },
        { title: 'Detalhe do acabamento espelhado — close em {parte}', format: 'Foto', pillar: 'Showcase Luxury' },
      ],
      'Showcase Prime': [/* ... */],
      'Educativo Técnico': [
        { title: 'TPU vs PU comum — {dor} explicada', format: 'Carrossel', pillar: 'Educativo Técnico' },
        { title: '+32% de brilho: o que isso significa na prática', format: 'Reel', pillar: 'Educativo Técnico' },
      ],
      // etc.
    },
    nzgroup: {
      'Catálogo NZ Wrap': [
        { title: 'Cor da semana: {cor_wrap}', format: 'Carrossel', pillar: 'Catálogo NZ Wrap' },
      ],
      'Captação Lojista': [
        { title: '+1.200 lojas escolheram NZ — por quê', format: 'Carrossel', pillar: 'Captação Lojista' },
      ],
      // etc.
    },
    joaowrap: {
      'Bastidor Empreendedor': [
        { title: 'Decisão difícil dessa semana: {tema_decisao}', format: 'Reel', pillar: 'Bastidor Empreendedor' },
      ],
      // etc.
    },
  };

  const FILLERS = {
    carro: ['Lamborghini Urus', 'Porsche 911', 'BMW M3', 'BYD DM1', 'RAM 2500', 'Range Rover', 'Tesla Model Y', 'Audi RS6'],
    parte: ['capô', 'paralama', 'porta', 'soleira', 'farol', 'maçaneta'],
    dor: ['amarelamento', 'descolamento', 'durabilidade real', 'regeneração térmica'],
    cor_wrap: ['Ferrari Metallic Red', 'Stuttgart Sport Grey', 'Viper Green', 'Diamond Champagne', 'Iceberg Blue', 'Bentley Pink'],
    tema_decisao: ['recusar pedido grande', 'demitir parceiro mal-alinhado', 'segurar lançamento por mais 30 dias', 'mudar fornecedor de fábrica'],
  };
  ```

  **Importante:** as listas de cores wrap **devem ser puxadas do código real** — leia `src/lib/data/nzwrapColors.ts` e use os nomes de lá (não invente). Mesma coisa para nomes de linhas PPF: leia `src/components/Catalog/data/catalogData.ts` e use os `shortName` reais (LUXURY, PRIME, FLOW, CORE, HEADLIGHT, WINDSHIELD).

- Form do modal:
  - Conta (select — mesmo padrão do existente)
  - Pilar (select filtrado pelos pilares disponíveis daquela conta no banco)
  - Quantidade (input number, 1-10, default 5)
  - Contexto opcional (textarea pequena — "carro específico, evento, etc. — vai influenciar fillers se for nome reconhecido")
- Botão "Gerar" sorteia N templates do pilar (com repetição se N > templates), substitui placeholders por valores aleatórios dos FILLERS (preferindo o que estiver no contexto se houver match), e mostra lista de ideias geradas.
- Cada ideia tem checkbox + título editável. Acima da lista: "Selecionar todas" / "Desmarcar todas".
- Botão final "Adicionar X selecionadas ao Backlog" cria os cards via `supabase.from('social_posts').insert([...])` com status `'backlog'`. Fecha modal e recarrega a lista de posts.
- Toast de sucesso simples (pode ser um `alert()` mesmo no MVP).

---

# Restrições

- **TypeScript estrito.** Antes de finalizar, rode `npm run build` (não só `tsc --noEmit`). Tem que passar 100%.
- **Não instale libs novas** sem necessidade. Se precisar de algo (date-fns, react-dnd), pare e me avise — provavelmente tem como fazer com nativo.
- **Mantenha tudo num único arquivo** `AdminAgendaSocial.tsx`. Se ficar > 800 linhas, aí sim quebre em sub-componentes (`CalendarView.tsx`, `ChecklistEditor.tsx`, `IdeaGenerator.tsx`) **dentro da pasta `Admin/`** (não criar subpastas novas).
- **Não mude nada fora desses escopos**. Não toque em outros admin pages, não refatore Dashboard além do mínimo necessário (provavelmente nada — toda a integração já está pronta).
- **Não quebre o MVP atual**. As features novas são adições, não substituições. Modal existente continua existindo, kanban continua existindo, filtro continua funcionando.
- **Confirme RLS no SQL novo.** A migration de checklist é só `ALTER TABLE` — RLS já está ativo, não precisa redeclarar.

---

# Ordem sugerida de execução

1. Ler os arquivos listados acima (~5 min).
2. Criar `social_posts_v2.sql` com `ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS checklist jsonb NOT NULL DEFAULT '[]'::jsonb;`
3. Atualizar interface `SocialPost` no TS para incluir `checklist: ChecklistItem[]`.
4. Implementar **Checklist dinâmica** no modal existente (menor escopo, valida fluxo de update na DB com novo campo).
5. Implementar **Vista Calendário** (toggle + componente).
6. Implementar **Motor de Ideias** (último porque depende dos templates e dos imports de `nzwrapColors` / `catalogData`).
7. Rodar `npm run build`. Corrigir erros até passar limpo.
8. Rodar `npm run dev`, abrir `/admin`, clicar **Agenda Social**, testar manualmente:
   - Criar post novo via "+ Novo post" → checklist aparece com template do formato.
   - Mudar formato → checklist reseta (com confirm).
   - Marcar items → barra de progresso atualiza.
   - Toggle Calendário → posts agendados aparecem nos dias.
   - Click em dia vazio → modal abre com data preenchida.
   - Click em chip do calendário → modal de edição abre com aquele post.
   - Gerar ideias → 5 cards aparecem → selecionar 3 → adicionar ao backlog → ver no kanban.
9. Atualizar `AGENDA_SOCIAL_README.md` documentando as 3 novas features e o SQL adicional a rodar.

---

# Definição de pronto

- [ ] `npm run build` passa sem erros nem warnings de TS.
- [ ] `social_posts_v2.sql` criado e funcional (testado mentalmente — ALTER TABLE idempotente).
- [ ] Toggle Kanban/Calendário funciona, mantém filtro de conta.
- [ ] Calendário navega meses, mostra hoje, abre modal por click.
- [ ] Checklist dinâmica respeita template por formato, persiste no DB, mostra progresso no card do kanban.
- [ ] Motor de ideias gera N posts a partir de templates reais (cores e linhas vindas do código), permite seleção, insere no backlog.
- [ ] README atualizado.
- [ ] Nenhum arquivo fora do escopo foi modificado.

Quando terminar, me responde com: (a) lista dos arquivos criados/modificados, (b) qualquer decisão de design que tomou e merece registro, (c) o que **não** foi feito de propósito, (d) qualquer débito técnico que vale registrar para depois.
