# NZ GROUP NEW WEBSITE - MANUAL E ARQUITETURA

Bem-vindo ao Mapa do Projeto `nzgroupnewwebsite` (anteriormente `nz-distribuidora-web`). Este documento serve como o "Google Maps" oficial do código fonte para que Agentes de IA e Devs humanos possam encontrar rapidamente qualquer componente e continuem a desenvolver a plataforma seguindo os padrões "Taste-Skill" de altíssima performance.

---

## 1. Topologia do Projeto

A stack é enxuta e focada em performance (Headless-Ready): 
- **React 19** + **Vite** (Build Tool)
- **React Router DOM 7** (Navegação SPA sem recarregamentos)
- Sem TailwindCSS nativamente. Estilização purista via **CSS Modules**.

A árvore do diretório principal fica em `src/`:

```
src/
├── App.tsx          <-- Ponto de entrada do Roteamento (Router Config)
├── index.css        <-- Variáveis Globais (Cores, Fontes Clamps, Margens Base)
├── main.tsx         <-- Montagem root do React (Injeção no DOM)
├── components/      <-- Fragmentos Modulares e Globais (Reutilizáveis)
├── pages/           <-- Rotas/Visões de Tela Inteira
└── assets/          <-- (Usar preferencialmente a pasta 'public' raiz para SVGs)
```

---

## 2. Padrões de Estilização (A Regra de Ouro)

Este repositório foi reconstruído com base na filosofia de design premium **"Taste-Skill"**. 

**Nunca injete Bootstrap ou utilitários pesados.** Siga estas diretrizes:
1. **Glassmorphism Base:** Utilize transparências sob pretos profundos (Ex: `rgba(12,12,12,0.8)`) com `backdrop-filter: blur(10px)`.
2. **Tipografia Absoluta:** O site carrega o Google Fonts *Outfit* (Títulos/Hero) e *Inter* (Corpo do texto).
3. **Escala Responsiva (`clamp`):** Os títulos utilizam `clamp(3rem, 5vw, 5rem)` em vez limiares (Media Queries), diminuindo linhas de código.
4. **Cores Semânticas:**
   - `--bg-primary`: Estúdio super escuro (`#0a0a0a`).
   - `--accent-red`: Vermelho "Romani" / Agressivo (`#d11e1e`).

---

## 3. Diretório de Componentes (`/src/components`)

Se precisar editar algo global que repete por todo site, o componente está aqui:

* **`/Navbar`**: A barra de linkagem fluida no topo da tela. Possui efeito de desfoque sobreposto.
* **`/Footer`**: O rodapé universal contendo a logo matriz e chaves de contato.
* **`/Showcase`**: O grid de seleção horizontal utilizado apenas na Home Page para transitar entre PPF e WRAP.
* **`/About`**: Um trecho na Página Inicial (*Homepage*) encarregado do convite rápido e estatísticas base.
* **`/Hero`**: Componente exclusivo de impacto da Home Page contendo Animações Limpas (*Fade-Up*).

---

## 4. Diretório de Visualizações / Rotas (`/src/pages`)

Cada subdiretório em `pages/` representa uma etapa completa injetada no `App.tsx`. Ao criar uma tela nova, faça aqui em uma pasta própria e declare o módulo `TitlePage.module.css` localmente:

* **`/Home` (Homepage)**: Junta os componentes `Hero`, `Showcase`, e `About` numa estrutura única (`/`).
* **`/Ppf` (Linha PPF)**: Landing page ultra descritiva sobre as polímeros automotivos Premium (Luxury, Prime, Flow e Core).
* **`/Wrap` (Linha Wrap)**: Landing page arquitetada para exibir as pilastras logísticas: >250 Cores a pronta entrega, >500 Exclusivas, e a seção rubra de Consultoria.
* **`/Company` (Sobre Nós)**: O Quartel General. Exibe a carta do fundador João Soares e dados físicos em Barueri.

### Rotas da LOJA e da conta que não são óbvias pelo nome da pasta

* **`/loja/s/:token`** — uma SELEÇÃO enviada a um cliente. Mesmo componente da
  `/loja`, mas a lista vem do banco (`selecoes`), na ordem em que o vendedor
  montou, e o link expira em 24 h. Quando a seleção libera preço, é a única
  porta por onde alguém **sem cadastro** vê valor no site — e só nos itens
  daquela lista. Ver `docs/PLANO_SELECOES_PRECO_ATACADO.md`.
* **`/loja/:slug?s=<token>`** — a página do produto aberta a partir de uma
  seleção. O token vai na URL (e não no `state` do Link) para o preço
  sobreviver a um F5. Ambas com `noindex`.
* **`/painel/selecoes`** — "Minhas seleções" (ativas / expiradas). Só admin: o
  item some do menu **e** a rota redireciona.
* **`/admin/central`** — Central de erros e mudanças. A caixa de entrada da
  equipe: preço que o ERP não precificou, SKU novo ou removido, preço que deu um
  salto, e o que clientes informaram pelo botão "Informar um problema" da página
  do produto.

### API — tudo em `/api/nz/<acao>`

O plano Hobby da Vercel permite 12 funções por deployment. Por isso **todo**
endpoint novo entra no roteador `api/nz/[acao].ts`, que conta como uma função,
com o handler em `api/_lib/handlers/`. Nunca crie um arquivo novo em `api/`.
Os três mais recentes: `selecoes` (criar/abrir/renovar/encerrar), `ocorrencias`
(informar um problema, público, com honeypot e limite por IP) e `patio` (quais
slugs têm rolo fechado / ponta no pátio — é o filtro das bolinhas do card, e só
admin recebe).

### As bolinhas do card: vitrine e filtro são caminhos diferentes

Verde = rolo fechado, laranja = ponta. **Desenhar** as bolinhas é uma pergunta
por página de 60 cards, e a resposta vem junto do preço (`/api/nz/precos`).
**Filtrar** por elas é uma pergunta sobre os 806 itens do catálogo, e aí vale a
lista de slugs de `/api/nz/patio`, buscada uma vez por sessão
(`src/lib/shop/patio.ts`). Sem o mapa — todo mundo que não é admin — o grupo não
aparece na sidebar e um `?patio=` na URL é **ignorado**, nunca aplicado com o
mapa vazio: senão um link do vendedor abriria vazio na mão do cliente.

### Preço: ATACADO, não varejo

`erp_produtos.preco_rolo` e `preco_metro` são o preço de **atacado** — é o que o
site mostra e cobra. O varejo (a tabela publicada) fica em `preco_*_varejo` e só
o papel admin recebe. Os nomes na view do ERP enganam: lá `ideal_*` é o varejo e
`min_*` é o atacado. Quem faz essa escolha é `api/_lib/handlers/sync.ts`
(`precoDeVenda`), num ponto só.

---

## 5. Notas Finais para Agentes (Machine Learning Memory)

- **Imagens Vetoriais (LOGOS)**: Todos os SVGs foram devidamente limpos e organizados semanticamente na arquitetura `/public/assets/logos/` (ex: `logo-nz-ppf.svg`, `logo-nz-wrap.svg`). Ao puxar qualquer logo corporativa no código, utilize caminhos absolutos como `src="/assets/logos/nome-da-logo.svg"`.
- Favicon foi recortado matematicamente e movido para `public/assets/icons/favicon-zoomed.svg`.
- Mantenha `task.md` sempre vivo com base nesse mapa.
