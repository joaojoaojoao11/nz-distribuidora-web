# Botão "Como funciona" — mapa dos tutoriais

Pedido do João (22/10/2026): "um botão de tutorial, de como funciona aquela parte para o usuário… começar pelas
áreas novas, na visão do administrador… cada tipo de acesso vai precisar de uma animação tutorial para as funções".

## Como funciona

- **Componente:** `src/components/Tutorial/`
  - `BotaoTutorial.tsx`: o botão e a janela.
    - Passos, bolinha vermelha até a 1ª abertura, Esc e setas.
    - Celular: a janela abre como folha de baixo.
    - "Reduzir movimento" ligado: as cenas abrem paradas e aparece "ver animação".
  - `Cenas.tsx`: as cenas animadas, montadas só com dados. São 8 tipos:
    - fluxo;
    - linha do tempo;
    - carteira;
    - cupom;
    - status;
    - níveis;
    - formulário;
    - comparação.
  - `TituloComTutorial.tsx`: põe o botão ao lado de um h1/h2 que já existe.
  - `tipos.ts`, `negrito.ts`.
- **Conteúdo:** `src/lib/tutoriais/`, um arquivo por área.
  - O começo do id diz o arquivo: `admin.*` → `admin.ts`, `conta.*` → `conta.ts`, `loja.*` → `loja.ts`,
    `garantia.*` → `garantia.ts`.
  - Cada área carrega à parte, só quando uma tela pede: o texto do admin não entra no pacote da loja.
- **Onde o botão entra:**
  - **Admin com `<PaginaAdmin>`:** a prop `tutorial="admin.xxx"`.
  - **Demais telas do admin:** o campo `tutorial` do item em `adminNav.ts`. Vale só na rota exata. O botão aparece
    no cabeçalho da casca, compacto no celular.
  - **Painel do cliente:** o campo `tutorial` do item em `painelNav.ts`, com variante por tipo de acesso
    (`padrao`, `afiliado`, `lojista`, `revendedor`, `admin`). Aparece ao lado do título da tela.
  - **Loja, garantia e cabeçalhos próprios:** `<TituloComTutorial>` ou `<BotaoTutorial>` direto.
- **Vitrine (só no localhost):**
  - `/dev/tutoriais`: todos os botões;
  - `/dev/tutoriais?passos=1`: todos os passos de todos os tutoriais de uma vez, para revisar o texto.

## Regras do conteúdo

1. **O texto descreve o que o código faz hoje.** Mudou a regra de uma tela? Atualize o tutorial no mesmo commit.
2. **Sem número que vem do banco.** Percentual, carência, saque mínimo, prazo de Pix e parcelas são configuráveis.
   Escreva "o número aparece na tela". Pode usar número fixo no código, como "40 pontos" ou "rolo de 1 em 1".
3. **Repositório público:** nenhum percentual real, código de cupom real ou dado de cliente. Use códigos fictícios
   (MARIA27, EXEMPLO10, XXXX-XXXX). Os valores das cenas de carteira são marcados como "exemplo".
4. **Cada passo** tem título, um parágrafo de até ~60 palavras e uma cena. São de 2 a 6 passos por tutorial.
5. **Nunca prometer o que a tela promete e o código não faz.** Veja a lista no fim deste arquivo.

## Inventário (53 tutoriais)

### Admin (29)

| id | Tela | Onde está ligado |
|---|---|---|
| admin.home | Dashboard `/admin` | adminNav (caso especial `/admin`) |
| admin.afiliados | Afiliados | PaginaAdmin |
| admin.afiliado-detalhe | Tela do afiliado | PaginaAdmin |
| admin.afiliados-regras | Regras gerais dos afiliados | PaginaAdmin |
| admin.super-cupons | Super cupons | PaginaAdmin |
| admin.super-cupons-regras | Regras do super cupom | PaginaAdmin |
| admin.cupons | Cupons | PaginaAdmin |
| admin.cupom-editor | Criar/editar cupom | PaginaAdmin |
| admin.saques | Saques | PaginaAdmin |
| admin.clientes | Clientes & Revendedores | adminNav |
| admin.precos | Tipos de acesso (entrada) | adminNav |
| admin.precos-tipo | Configurar um tipo (`/admin/precos/:papel`) | TituloComTutorial no h2 |
| admin.pedidos | Pedidos da loja | adminNav |
| admin.pedido-detalhe | Detalhe do pedido | TituloComTutorial no h2 |
| admin.pagamentos | Pagamento online (Asaas) | adminNav |
| admin.logistica | Logística & Transportadoras | adminNav |
| admin.garantias | Garantias oficiais | adminNav |
| admin.central | Central de erros e mudanças | adminNav |
| admin.produtos | Produtos da loja | adminNav |
| admin.produto-editor | Editor de produto | barra do editor |
| admin.avaliacoes | Avaliações & Cashback | adminNav |
| admin.erp | Integração NZERP | adminNav |
| admin.leads | Leads & Contatos | adminNav |
| admin.promo | Páginas promocionais | adminNav |
| admin.equipe | Usuários do sistema | adminNav |
| admin.blog | Blog & Conteúdos | adminNav |
| admin.blog-ia | Motor IA (SEO autônomo) | adminNav |
| admin.agencia | Agência NZ | adminNav |
| admin.agenda-social | Agenda Social Media | adminNav |

### Área do cliente (15)

| id | Tela | Público |
|---|---|---|
| conta.inicio | Início do painel | cliente |
| conta.pedidos | Meus pedidos | cliente |
| conta.pedido | Detalhe do pedido (`/painel/pedido/:n`) | cliente |
| conta.pagamentos | Pagamentos | cliente |
| conta.carrinho | Carrinho guardado | cliente |
| conta.listas | Favoritos e Vistos | cliente |
| conta.dados | Meus dados | cliente |
| conta.seguranca | Senha e segurança | cliente |
| conta.garantias | Minhas garantias | cliente |
| conta.pontos | Pontos e cashback | cliente |
| conta.avaliacoes | Minhas avaliações | cliente |
| conta.cupons | Meus cupons | cliente |
| conta.indique | Indique e ganhe | cliente (indicador) |
| conta.indique-afiliado | Indique e ganhe | afiliado (quem tem linha em `afiliados`) |
| conta.selecoes | Minhas seleções | admin |

### Loja (6) e garantia (4)

| id | Tela | Público |
|---|---|---|
| loja.cadastro | `/cadastro` | cliente |
| loja.vitrine | `/loja` ("Como achar o produto") | cliente |
| loja.produto | página do produto ("Como comprar") | cliente |
| loja.carrinho | `/carrinho` | cliente |
| loja.checkout | `/checkout` | cliente |
| loja.selecao | `/loja/s/:token` ("Como funciona esta seleção") | cliente |
| garantia.registro | `/registro-garantia` | dono do carro |
| garantia.registro-aplicador | `/registro-garantia`, logado como lojista ou revendedor | aplicador |
| garantia.validar | `/validar-garantia` | qualquer pessoa |

### Telas que ficaram sem tutorial, de propósito

- **Login, recuperar senha e nova senha:** a tela já se explica.
- **`/s` (página do QR do selo, 22/10/2026):** é uma página de apresentação para o dono do carro, sem função para ensinar. O tutorial antigo `garantia.selo` (conferência do selo único) saiu junto com o vínculo.
- **Configurações globais (`/admin/configuracoes`):** grava em `configuracoes_nz`, que nenhum código lê. Não há o
  que ensinar até isso ser ligado.
- **Páginas institucionais, linhas (PPF/Wrap/Sign/Decor) e blog público:** são conteúdo, não função.
- **Campanhas com prazo (Coleção, Interlagos, Promoção Moto em `/wrap/motos`) e Encontre um aplicador:** o texto da
  própria página explica. Vale reavaliar se virarem fluxo permanente.

## Textos das telas que contradizem o código

Estes textos foram achados no estudo de 22/10/2026. Os tutoriais **não** repetem nenhum deles; corrigir na tela é
trabalho do agente do site.

- `src/pages/Auth/Register.tsx:238`: diz que o super cupom digitado no cadastro "vale na sua primeira compra". O
  gatilho só resolve código de afiliado, então o super cupom se perde.
- `src/pages/Painel/PainelIndique.tsx`: o link do super cupom (`/cadastro?ref=CÓDIGO`) e a mensagem do WhatsApp
  ("cadastre-se com meu super cupom") não aplicam desconto. O amigo precisa digitar o código no carrinho/checkout.
- `src/pages/Painel/PainelCupons.tsx`: o super cupom aparece como cupom para o dono usar ("desconto aplicado no
  carrinho"), mas o dono não pode usar o próprio.
- `src/pages/Painel/PainelInicio.tsx:86` e `src/pages/Loja/Preco.tsx:115`: "você vê preço de rolo fechado e de
  metro em toda a loja" ignora a visibilidade por tipo.
- `src/pages/Painel/PainelPontos.tsx:120,135`: validade fixa "12 meses" e "vale N dias" da campanha. O crédito segue
  a validade da carteira, que é configurável.
- `src/pages/Painel/PedidoDetalhe.tsx:255,269` e `src/pages/Loja/FormaPagamento.tsx:73,80`: prometem aviso por
  e-mail e "entra em separação". O site não manda e-mail ao cliente.
- `src/pages/Loja/FormaPagamento.tsx:168`: "os dados do cartão vão direto para o processador". Eles passam pelo
  servidor da NZ, sem ser guardados.
- `src/pages/Loja/PrazoEntrega.tsx:403,414`: "já incluindo a expedição". O código não soma dias de expedição.
- `src/pages/Loja/Loja.tsx:491`: "Valores sob consulta" aparece também para quem já vê preço.
- `src/pages/Warranty/registro/Protocolo.tsx:145`: diz a qualquer logado que ele "acompanha no painel". O painel
  casa pelo CPF/e-mail do dono, não do aplicador.
- `src/pages/Painel/painelNav.ts` (Minhas garantias): "Certificados emitidos no seu nome", mas a lista inclui as
  em análise e as recusadas.
- `src/pages/Admin/AdminAvaliacoes.tsx:242`: diz que o crédito sai como "cupom de valor, nominal". Hoje vira R$ na
  carteira, e "Validade do cupom (dias)" não é usada.
- `src/pages/Admin/AdminErp.tsx`:
  - `:196`: diz que o preço não é transferido; o sync transfere atacado e varejo;
  - `:286`, `:351`: mandam rodar um script que não existe;
  - `:166`: fala em "vercel dev" (hoje é `npm run dev:api`).
- `src/pages/Admin/AdminEquipe.tsx`:
  - `:126`: sugere que estar no NZERP basta; precisa do convite;
  - `:151`: "limite de 2/hora" desatualizado.
- `src/pages/Admin/AdminSettings.tsx:75`: "Remetente nas etiquetas", mas nada lê essa tabela.
- `src/pages/Admin/AdminLogistica.tsx:422`: "o valor em R$ só aparece para admin" vale só na página do produto; no
  checkout o cliente paga o frete.
- `src/pages/Admin/AdminPagamentos.tsx:187` e `src/pages/Loja/Carrinho.tsx:247`: "cartão até 6x" está fixo; o
  máximo é configurável.
- `src/pages/Loja/SelecaoConfig.tsx:187` e `src/pages/Painel/PainelSelecoes.tsx:113,251`: "24 h" está fixo; a
  validade é configurável. "Renovar" recomeça a contar a partir de agora, não soma.
- `src/pages/Admin/AdminBlog.tsx`: "Publicar Postagem" grava com o status do seletor, que começa em Rascunho.
- `src/pages/Admin/AdminAIBlog.tsx`: "2x ao dia" nunca acontece (o cron gera no máximo 1 post por dia); o placeholder
  fala em Gemini.

## Atenção ao mudar

- **`admin.clientes`** já descreve as contas criadas a partir do NZERP (Central do cliente, Fase A, commit
  `cef4628`). Se a Fase B mudar convite, aprovação ou a fila "ERP sem conta", ajuste os passos 5 e 6.
