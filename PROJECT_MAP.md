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
* **`/admin/pedidos`** — só pedidos, organizados por FILAS (precisa de ação,
  pagos a separar, aguardando cliente, em andamento, concluídos, não
  concluídos). A régua que decide a fila é `src/lib/shop/situacaoPedido.ts`
  (`npm run pedidos:test`) e é a mesma do contador no menu. Cada linha abre
  **`/admin/pedidos/:numero`** (itens com foto, cliente, cobranças do Asaas,
  linha do tempo, botões de estorno / enviar ao NZERP / cancelar). Sub-abas:
  carrinhos parados e cartões recusados.
* **`/admin/pagamentos`** — Pagamento online (Asaas): ligar/desligar, Pix,
  boleto, cartão, saúde da integração e eventos do webhook (só os da loja por
  padrão; a conta Asaas é a mesma do NZERP e os boletos dele também chegam).
  Retirada em SP e frete grátis ficam em `/admin/logistica`.
  Até 20/10/2026 tudo isso era uma tela só, e a lista de pedidos nunca abriu:
  o embed `user_profiles(...)` exigia a FK `pedidos.user_id → user_profiles`
  (migration `2026-10-20_pedidos_fk_perfil.sql`).

### API no localhost: `npm run dev:api`

As funções de `api/` são serverless da Vercel e não rodam no `vite`. Até
21/10/2026 todo `/api/*` no dev respondia 503 ("API indisponível no Vite
dev"), e nenhuma tela do admin que depende da API funcionava no localhost.
Agora `npm run dev:api` (`scripts/dev-api.mjs`, porta 3999) empacota o
roteador `api/nz/[acao].ts` com o esbuild e o serve com a mesma cara da Vercel;
o `vite.config.ts` repassa `/api/*` para ele quando está no ar (sem ele, o 503
continua, com a dica). Lê o `.env` do site e, para o pedido e o checkout
falarem com o NZERP, as chaves do `.env.local` do NZERP ao lado. Bate nos
bancos de produção (não existe staging). No NZERP, `.claude/launch.json` tem
a configuração `site-nz-api`.

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

### Foto de produto: quem manda é o banco

`produto_midia` é a fonte única — o painel do produto (aba MÍDIA) edita essa
tabela e um gatilho espelha em `produtos.imagem`/`galeria`; a view
`loja_catalogo` publica tudo em `midias`. O adapter da loja
(`src/lib/shop/adapters/erp.ts`) **não completa foto**: o único caminho de
arquivo que ele conhece é o placeholder da linha, para o produto que não tem
nenhuma.

Até 11/09/2026 não era assim: mapas de slug → arquivo em `generic.ts` e no
próprio adapter davam foto a 577 dos 806 itens, e o painel mostrava "nenhuma
foto ainda" — não dava para reordenar, trocar a capa nem apagar. As 788 fotos
foram para o banco em `migrations/2026-09-11d_midia_do_codigo_para_o_banco.sql`
(gerada por `scripts/gerar-backfill-midia.mjs`, que roda o próprio adapter para
congelar o que a loja mostrava). O `npm run shop:audit` tem a seção MÍDIA VEM DO
BANCO para a regressão não voltar.

O adapter do snapshot estático (`adapters/dbSnapshot.ts`) continua com os mapas:
ele é o catálogo de emergência, para quando `/api/nz/catalogo` não responde.

### Preço: por TIPO DE ACESSO, sobre a base do ERP

`erp_produtos.preco_rolo` e `preco_metro` são o preço de **atacado** (a tabela
mínima do NZERP); `preco_*_varejo` é a tabela publicada. Os nomes na view do ERP
enganam: lá `ideal_*` é o varejo e `min_*` é o atacado. Quem faz essa escolha é
`api/_lib/handlers/sync.ts` (`precoDeVenda`), num ponto só.

Desde 20/10/2026 o que cada pessoa VÊ e PAGA depende do tipo de acesso
(`user_profiles.role`: `client` cliente final, `lojista` lojista/aplicador,
`reseller` revendedor, `admin`): `preço = base × (1 + percentual)`, com um
percentual geral por tipo e, opcionalmente, um por linha comercial
(`produtos.linha_key`). A tabela é `precos_acesso`, a tela é
**`/admin/precos`** (uma linha por tipo; `/admin/precos/:papel` configura),
e a regra mora numa função só — `api/_lib/precos/regraAcesso.ts` — chamada
por `/api/nz/precos` (vitrine), `pedido/precificar.ts` (pedido e checkout) e
`promo-moto` (público = cliente final). Admin vê tudo e compra pela base.
`npm run precos:test`.

**Faixas dentro do tipo** (desde 21/10/2026, Fase 1 do plano de indicação):
`faixas_preco` (Gold, Platinum, ou uma faixa criada para um único cliente) e
`precos_acesso.faixa_id`. A pessoa recebe a faixa na aprovação
(`user_profiles.faixa_id`, só o servidor muda — ops `aprovar` e `mudar-faixa`
de `/api/nz/conta`). A regra: produto > linha > geral **da faixa**; o que a
faixa não define cai na regra do tipo; a base é sempre a do tipo. Sem faixa =
Padrão. O seletor de faixas fica em `/admin/precos/:papel`; a escolha por
pessoa e a pré-análise do consultor (`pre_analises`) ficam em `/admin/clientes`.
O nome da faixa vai ao NZERP (`clients.faixa_preco_site`, só leitura lá).

### Indicação, cashback e afiliados (desde 21/10/2026)

Uma carteira em R$ por cliente (`carteira_movimentos`, um razão: nunca se
apaga, só se estorna; saldo = soma por status). **Só o servidor escreve**, e o
cliente lê pela rota `/api/nz/incentivos` (op `minha-carteira`), que devolve o
indicado como "indicado nº N", nunca pelo nome. Três fontes de crédito, todas
geradas quando o NZERP **fatura** o pedido (`sync.ts` → `api/_lib/incentivos/motor.ts`):

- **Super cupom** (`cupons.tipo='super'`): um por cliente aprovado, código fixo
  (trocável no painel). Quem compra com ele ganha desconto; o dono ganha
  cashback. Vale uma compra por indicado e só para conta nova (`cupom_usos`).
- **Afiliado** (`afiliados.status='aprovado'`, aprovado pela NZ): o cupom dele
  é a "senha" de entrada — quem se cadastra ou compra com ele fica filiado
  para sempre (`user_profiles.indicado_por` + `filiado_em`). Comissão de
  **ativação** na primeira compra faturada do filiado e de **recorrência** nas
  seguintes, apurada por período mensal ou quinzenal (`periodo` no movimento,
  liberação no fim do período).
- **Cupom nominal** (`tipo='nominal'`, `dono_user_id`): só desconto, para um
  cliente da base, criado em `/admin/cupons`.

Carência (D3), validade do saldo (D11), trava de margem (§5 do plano; só
corta quando ligada e com imposto/comissão embutida preenchidos) e os
percentuais ficam em `loja_config` e nas telas do admin: `/admin/afiliados`
(com a tela de cada afiliado em `/admin/afiliados/:userId`), `/admin/cupons` e
`/admin/super-cupons`. Gamificação G1 (níveis, conquistas, momentos) em
`api/_lib/incentivos/gamificacao.ts`, calculada no servidor. O cron diário do
sync libera o que venceu e expira o saldo antigo. Teste: `npm run incentivos:test`.
A regra única do cupom (nominal, próprio, só conta nova, limite por cliente,
esgotado) é `motivoCupomInvalido` em `api/_lib/pedido/precificar.ts`.
**Saldo no checkout** (Fase 3): `api/_lib/incentivos/saldoCheckout.ts` — quanto
usar (`calcularUsoDeSaldo`, o restante nunca fica abaixo da cobrança mínima),
reserva pela RPC `carteira_reservar_uso`, devolução quando a cobrança morre ou o
pedido é cancelado, e o pedido coberto pelo saldo nasce pago (forma `SALDO`,
sem Asaas). O ERP recebe `cashback_usado`; o contábil disso é a Fase 6.
**Saque por Pix** (Fase 4 mínima): `api/_lib/incentivos/saque.ts` + `saqueRegras.ts`
(chave Pix e vencimento, puros). O cliente cadastra a chave e pede o saque em
"Indique e ganhe"; a RPC `carteira_solicitar_saque` debita a carteira e o site
manda ao NZERP como título em aberto (`site_solicitar_saque`, Contas a Pagar).
O sync remanda pendentes e espelha pago/cancelado pela view `saques_site`
(cancelado devolve o saldo). Admin: `/admin/saques`, só leitura.

**Visibilidade por tipo** (`acesso_config`, mesma tela, aba Visibilidade):
linhas comerciais ocultas, rolo fechado, metro fracionado, estoque detalhado,
Promoção Moto e pagamento online. O servidor aplica tudo (preço nulo e item
inválido para linha oculta/unidade proibida; nível 2 do estoque; checkout
desligado para o tipo); o front só evita mostrar o que seria negado
(`src/lib/shop/acesso.ts` filtra o catálogo de quem está logado). Anônimo
continua vendo o catálogo público sem preço.

**Ninguém nasce aprovado** (também desde 20/10): o cadastro cria a conta como
não aprovada e o admin libera em `/admin/clientes`, escolhendo o tipo de
acesso; o cliente recebe e-mail. Aprovar/revogar/mudar tipo passam por
`/api/nz/conta` (ops `aprovar`, `revogar`, `mudar-tipo`) e ficam em `equipe_log`.

### E-mails do Supabase Auth saem pelo Resend (Send Email Hook)

Confirmação de e-mail, redefinição de senha, convite do painel, link mágico e
troca de e-mail não saem mais pelo mailer do Supabase: o Auth chama
**`api/auth-email.ts`** (função EDGE — o runtime Node entrega o corpo já
parseado e a assinatura Standard Webhooks é sobre os bytes exatos), que
verifica a assinatura (`api/_lib/auth/webhook.ts`, segredo derivado da chave
de serviço — `scripts/hook-segredo.mjs` gera o patch de configuração), monta o
e-mail no modelo NZ (`api/_lib/auth/emails.ts`) e manda pelo Resend. Toda
chamada deixa linha `auth-<tipo>` em `avisos_enviados`. Desde 20/10/2026
20:40 UTC o `mailer_autoconfirm` está desligado: a conta só vale depois do
clique (`VIRADA_CONFIRMACAO` em `api/_lib/conta/emailVerificado.ts`), e o cron
diário apaga contas criadas depois disso que nunca confirmaram em 48 h
(`api/_lib/conta/limparNaoConfirmados.ts`). `npm run auth-email:test`.

---

## 5. Notas Finais para Agentes (Machine Learning Memory)

- **Imagens Vetoriais (LOGOS)**: Todos os SVGs foram devidamente limpos e organizados semanticamente na arquitetura `/public/assets/logos/` (ex: `logo-nz-ppf.svg`, `logo-nz-wrap.svg`). Ao puxar qualquer logo corporativa no código, utilize caminhos absolutos como `src="/assets/logos/nome-da-logo.svg"`.
- Favicon foi recortado matematicamente e movido para `public/assets/icons/favicon-zoomed.svg`.
- Mantenha `task.md` sempre vivo com base nesse mapa.
