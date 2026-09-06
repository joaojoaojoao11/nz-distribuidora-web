# Checkout da NZSTORE com Asaas — Pix, cartão e boleto pelo site

> Estudo feito em 2026-09-06 sobre a documentação oficial (docs.asaas.com, API v3) e sobre o
> código atual da loja. Nada foi alterado ainda. Este arquivo é o roteiro que o agente vai
> executar fase a fase; a seção 2 é a lista do que o João precisa fazer/passar.

---

## 1. Como o Asaas funciona (o que importa para nós)

**O que é.** Instituição de pagamento (autorizada pelo BC, PCI-DSS). A NZ já tem a conta
aprovada ("Sua conta foi aprovada", print 1) — conta 7368108-2 no banco 461. Cada cobrança
criada pela API vira uma "cobrança" na conta; o dinheiro cai no saldo Asaas e é sacado para o
banco da NZ.

**API.** REST/JSON. Produção `https://api.asaas.com/v3`, sandbox `https://api-sandbox.asaas.com/v3`
(conta, chave e dados separados — chave de sandbox em produção dá 401). Autenticação por
cabeçalho **`access_token: <chave>`**. Sem OAuth, sem User-Agent obrigatório. Limites:
25.000 requisições por conta a cada 12 h, 50 GETs simultâneos, e limite por endpoint; ao
estourar volta `429` com cabeçalhos `RateLimit-Limit/Remaining/Reset` (nunca repetir na hora).

**Chave de API (print 2).** Gerada em Integrações → Chaves de API. Mostrada **uma única vez**.
Regra do Asaas: chave sem uso por 3 meses é desabilitada (401) e depois de 6 meses expira de
vez — irrelevante para nós porque a loja usa todo dia, mas o painel admin vai avisar.
A caixa **"Permitir que esta chave execute operações de saque via API" fica DESMARCADA**:
a loja só cria e consulta cobranças; ela nunca pode sacar dinheiro. Há opção de restringir a
chave por IP, mas a Vercel não tem IP fixo de saída, então não usamos.

**Os três objetos que usamos.**

| Objeto | Endpoint | Para quê |
|---|---|---|
| Cliente | `POST /v3/customers`, `GET /v3/customers?cpfCnpj=` | Um por comprador. A API **permite duplicado**, então buscamos por CPF/CNPJ antes de criar e guardamos o `id` (`cus_…`) no perfil. |
| Cobrança | `POST /v3/payments` | `customer`, `billingType` (`PIX` \| `BOLETO` \| `CREDIT_CARD`), `value`, `dueDate`, `description`, `externalReference` (nosso número do pedido). Resposta: `id` (`pay_…`), `status`, `invoiceUrl`, `bankSlipUrl`, `pixTransaction`, `netValue`. |
| Webhook | `POST /v3/webhooks` ou painel | Asaas chama nossa URL a cada evento; manda o token no cabeçalho **`asaas-access-token`**. |

**Pix.** Cria a cobrança com `billingType: PIX` e busca o QR em
`GET /v3/payments/{id}/pixQrCode` → `encodedImage` (PNG base64), `payload` (copia e cola),
`expirationDate`. Precisa de **chave Pix cadastrada na conta** (sem ela o QR só vale até 23:59
do dia e o Asaas avisa que vai descontinuar). Com chave, o QR vale 12 meses após o vencimento —
**longo demais para loja**; nós controlamos a expiração do nosso lado (seção 4). Pagou →
evento `PAYMENT_RECEIVED` na hora, saldo já disponível. Taxa hoje (site Asaas): R$ 1,99 por
Pix recebido (promocional R$ 0,99 nos 3 primeiros meses).

**Boleto.** `billingType: BOLETO`, `dueDate` = vencimento. Resposta traz `bankSlipUrl` (PDF);
linha digitável em `GET /v3/payments/{id}/identificationField` → `identificationField`,
`nossoNumero`, `barCode`. Aceita `fine` (multa), `interest` (juros a.m.) e `discount`.
Compensa em **até 3 dias úteis** → `PAYMENT_RECEIVED`. Depois do vencimento: `PAYMENT_OVERDUE`.
Taxa hoje: R$ 1,99 por boleto recebido (blog antigo fala R$ 3,49 — conferir em
Taxas no seu painel, item do menu do print 1).

**Cartão de crédito.** É **síncrono**: `POST /v3/payments` com `billingType: CREDIT_CARD` +
`creditCard {holderName, number, expiryMonth, expiryYear, ccv}` +
`creditCardHolderInfo {name, email, cpfCnpj, postalCode, addressNumber, phone}` +
**`remoteIp`** (IP do comprador, nunca do servidor — obrigatório, é antifraude). A resposta já
vem `CONFIRMED` (aprovado) ou HTTP 400 com `errors[{code, description}]` (recusado — a
mensagem é genérica de propósito: "Transação não autorizada. Verifique os dados…"). Parcelas:
`installmentCount` + `totalValue` (até 21x Visa/Master, 12x outras). Pode cair em análise
manual (`PAYMENT_AWAITING_RISK_ANALYSIS` → aprovado/reprovado por webhook). O dinheiro fica
disponível (`PAYMENT_RECEIVED`) ~32 dias depois, ou em 2 dias úteis com antecipação (1,25%
a.m. à vista, 1,70% parcelado). Taxa hoje: 2,99% + R$ 0,49 à vista; 3,49% (2–6x), 3,99%
(7–12x), 4,29% (13–21x) + R$ 0,49. Tokenização (salvar cartão para recompra) existe
(`POST /v3/creditCard/tokenizeCreditCard`) mas **em produção depende de habilitação pelo
Asaas** — fica para depois.

**Checkout hospedado do Asaas (`POST /v3/checkouts`).** Página pronta do Asaas, só Pix e
cartão, **sem boleto**, exige imagem base64 por item, redireciona de volta. Não vamos usar
como caminho principal: o boleto ficaria de fora e a experiência sairia do site. Fica como
plano B para cartão (seção 5, decisão 1).

**Webhooks.** Entrega "pelo menos uma vez" (pode repetir → idempotência pelo `id` do evento
`evt_…`); fila **sequencial** por padrão; se nossa URL falhar 15 vezes seguidas a fila
**pausa** (e ninguém mais recebe evento até religar no painel) — por isso o handler responde
`200` rápido e nunca deixa exceção vazar. Payload: `{ id, event, dateCreated, payment: {...} }`.
Eventos que a loja trata:

| Evento | Significado | O que a loja faz |
|---|---|---|
| `PAYMENT_CONFIRMED` | cartão aprovado (saldo ainda preso) | pedido **PAGO** |
| `PAYMENT_RECEIVED` | Pix/boleto pago; cartão liquidado | pedido **PAGO** (se ainda não) |
| `PAYMENT_AWAITING_RISK_ANALYSIS` | cartão em análise manual | pedido "em análise" |
| `PAYMENT_REPROVED_BY_RISK_ANALYSIS` | reprovado | pagamento **recusado**, avisa cliente |
| `PAYMENT_OVERDUE` | boleto venceu | pagamento **vencido** |
| `PAYMENT_DELETED` | cobrança removida | pagamento **cancelado** |
| `PAYMENT_REFUNDED` / `PARTIALLY_REFUNDED` | estorno | pagamento **estornado** |
| `PAYMENT_CHARGEBACK_REQUESTED` | contestação | alerta admin |
| `ACCESS_TOKEN_EXPIRING_SOON` / `_DISABLED` | chave | alerta admin |

IPs de origem em produção: `52.67.12.206`, `18.230.8.159`, `54.94.136.112`, `54.94.183.101`
(usamos só como conferência extra; a autenticação é o token).

**Estorno.** `POST /v3/payments/{id}/refund` com `value` opcional (parcial) — cartão e Pix;
boleto não estorna pela API. As taxas não voltam.

**Redirecionamento.** `callback.successUrl` da cobrança só funciona se o domínio for o
cadastrado em Configurações → Informações da conta. Como o cliente paga dentro do nosso site,
quase não usamos; mas o domínio precisa estar cadastrado (seção 2).

**Sandbox.** `https://sandbox.asaas.com` (painel) — conta e chave próprias. Cartão de teste:
qualquer número válido fictício aprova; `5184019740373151` (Master) e `4916561358240741` (Visa)
recusam. Pix/boleto: botão "CONFIRMAR PAGAMENTO" na cobrança ou
`POST /v3/sandbox/payment/{id}/confirm` — dispara os webhooks de verdade. Descontos/multa de
boleto não são testáveis no sandbox.

---

## 2. O que o João precisa fazer / me passar

### 2.1 Na conta Asaas de produção (print 1)

1. **Chave de API** — Integrações → Chaves de API → Gerar (é a tela do print 2):
   - Nome: `NZSTORE`
   - Expiração: em branco
   - **NÃO marcar** "Permitir que esta chave execute operações de saque via API"
   - Avançar → copiar a chave (só aparece uma vez) → salvar num `.txt` e me passar o caminho,
     como fez com o Melhor Envio. Eu subo na Vercel via stdin e apago o arquivo.
2. **Chave Pix da conta** — menu Pix → Minhas chaves → criar uma **chave aleatória** (EVP).
   Sem isso o QR Code é o "provisório" que expira no mesmo dia. Se o painel pedir "prova de
   vida", é o Asaas exigindo a selfie do responsável — fazer.
3. **Domínio da loja** — Minha conta → Configurações → Informações: site =
   `https://www.nzgroup.com.br`. É o que libera `successUrl` e aparece na fatura do cliente.
4. **Notificações ao cliente** — Configurações → Notificações: deixar **e-mail** ligado
   (grátis: o Asaas manda "seu boleto", "seu Pix", "pagamento confirmado" com a marca da NZ
   — a loja não tem servidor de e-mail hoje, então isso resolve de graça). **SMS/WhatsApp
   desligados** (são cobrados por envio).
5. **Taxas** — menu Taxas: conferir os valores reais da sua conta (podem diferir do site
   público). Não muda código, mas muda a decisão sobre parcelas (seção 5).
6. Depois que eu publicar o endpoint, o **webhook** eu crio pela API com a própria chave
   (nome `NZSTORE`, URL `https://www.nzgroup.com.br/api/nz/asaas`, token gerado por mim de
   64 caracteres, fila sequencial, só os eventos da tabela acima). Você não precisa mexer —
   só conferir em Integrações → Webhooks que apareceu.

### 2.2 Sandbox (para testar sem dinheiro de verdade)

7. Criar conta em `https://sandbox.asaas.com` (cadastro normal, aprovação automática),
   gerar chave de API lá (mesma tela, mesma regra de não marcar saque), salvar em outro
   `.txt` e me passar o caminho. Cadastrar uma chave Pix aleatória no sandbox também.

### 2.3 Decisões de negócio (seção 5) — responder em uma linha cada.

---

## 3. O que existe hoje no site e o que muda

Hoje o carrinho (`src/pages/Loja/Carrinho.tsx`) manda `POST /api/nz/pedido`, que reprecifica
no servidor, grava `pedidos` + `pedido_itens` e cria um orçamento **ABERTO** no NZERP via
RPC `site_criar_pedido`, com `shipping_type: 'FOB'` e `shipping_cost: 0`, e a tela diz "sem
pagamento aqui, o vendedor fecha com você". Não há nada de pagamento em lugar nenhum (tabela,
coluna, env, handler) — é campo verde.

O que o checkout precisa mudar no que existe:

| Hoje | Depois |
|---|---|
| Frete só na página do produto, **sem valor** para quem não é admin, um perfil por vez | Frete **do carrinho inteiro** (vários perfis → vários volumes numa chamada ao Melhor Envio) e **valor visível ao comprador logado** no checkout. A regra "valor só admin" continua na vitrine pública. |
| `pedidos.status` = espelho do ERP (`sync.ts` sobrescreve) | Continua. Pagamento ganha coluna própria `pagamento_status` para não ser atropelada pelo sync. |
| Orçamento no ERP nasce ABERTO, FOB, frete 0 | Nasce ABERTO com nota "aguardando pagamento online (PIX/BOLETO/CARTÃO)", frete **CIF com o valor cobrado** e, ao pagar, RPC nova `site_confirmar_pagamento` põe **APROVADO** e grava forma/valor líquido/id Asaas. |
| Cupom: `usos` incrementa lendo e escrevendo (corrida) | `update … set usos = usos + 1 where usos < limite_usos` atômico. |
| Painel do cliente: lista de pedidos sem detalhe | Página `/painel/pedido/:numero` com itens, frete, **status do pagamento**, QR/boleto/recibo. |
| Só `is_approved` compra | Ver decisão 3 (seção 5). |

---

## 4. Desenho da solução

### 4.1 Banco (site) — `migrations/2026-09-07_checkout_asaas.sql`

```sql
alter table public.user_profiles add column if not exists asaas_customer_id text;

alter table public.pedidos
  add column if not exists pagamento_status text not null default 'nenhum'
    check (pagamento_status in ('nenhum','aguardando','em_analise','pago','recusado',
                                'expirado','vencido','estornado','cancelado')),
  add column if not exists forma_pagamento text
    check (forma_pagamento in ('PIX','BOLETO','CREDIT_CARD','RETIRADA_SEM_PAGAMENTO')),
  add column if not exists valor_frete numeric(12,2) not null default 0,
  add column if not exists desconto numeric(12,2) not null default 0,
  add column if not exists total_final numeric(12,2),        -- itens - desconto + frete
  add column if not exists pago_em timestamptz;

create table public.pagamentos (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  provedor text not null default 'asaas',
  asaas_payment_id text unique,           -- pay_…
  asaas_customer_id text,
  forma text not null,                    -- PIX | BOLETO | CREDIT_CARD
  status text not null,                   -- mesmo domínio de pagamento_status
  status_asaas text,                      -- PENDING/CONFIRMED/RECEIVED/… cru
  valor numeric(12,2) not null,
  valor_liquido numeric(12,2),            -- netValue
  parcelas int not null default 1,
  vencimento date,
  expira_em timestamptz,                  -- Pix: nosso prazo
  pix_payload text,                       -- copia e cola
  pix_qr_base64 text,
  boleto_url text,
  linha_digitavel text,
  nosso_numero text,
  cartao_bandeira text,                   -- só isto do cartão
  cartao_final text,                      -- 4 últimos
  invoice_url text,
  pago_em timestamptz,
  estornado_valor numeric(12,2) not null default 0,
  ultimo_evento text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table public.asaas_eventos (      -- idempotência do webhook + auditoria
  id text primary key,                    -- evt_…
  evento text not null,
  asaas_payment_id text,
  pedido_id uuid,
  recebido_em timestamptz not null default now(),
  processado_em timestamptz,
  erro text,
  payload jsonb not null
);

alter table public.loja_config
  add column if not exists pix_expira_min int not null default 30,
  add column if not exists boleto_vencimento_dias int not null default 3,
  add column if not exists boleto_multa_pct numeric(5,2) not null default 2,
  add column if not exists boleto_juros_mes_pct numeric(5,2) not null default 1,
  add column if not exists cartao_max_parcelas int not null default 6,
  add column if not exists cartao_parcela_minima numeric(12,2) not null default 100,
  add column if not exists retirada_ativa boolean not null default true,
  add column if not exists pedido_minimo numeric(12,2) not null default 0;
```

RLS igual ao resto da loja: `pagamentos` — dono lê (`pedido.user_id = auth.uid()`), admin
tudo, escrita só pela API (service role); `asaas_eventos` — só admin lê. **Nunca** gravar
número, validade ou CVV de cartão em lugar nenhum; `payload` do evento passa por
`sanitizar()` que remove `creditCard.creditCardToken`.

### 4.2 Backend — tudo dentro de `api/nz/[acao].ts` (a Vercel não ganha função nova)

- `api/_lib/asaas/cliente.ts` — wrapper: `asaasFetch(path, init)` com base por
  `ASAAS_ENV`, cabeçalho `access_token`, `AbortSignal.timeout(15000)`, tratamento de
  `429` (lê `RateLimit-Reset`), erro tipado `AsaasError{status, code, description}`.
  Funções: `garantirCliente(perfil)`, `criarCobrancaPix/Boleto/Cartao`, `qrCodePix(id)`,
  `linhaDigitavel(id)`, `consultar(id)`, `remover(id)`, `estornar(id, valor)`,
  `criarWebhook(...)`. **Log nunca inclui corpo de requisição de cartão**.
- `api/_lib/handlers/checkout.ts` — ação `checkout`, `POST`, logado. Ops:
  - `op:'resumo'` — recebe `{itens, cupom, cep}` → reprecifica (mesma rotina de
    `pedido.ts`, extraída para `api/_lib/pedido/precificar.ts`), valida cupom, cota frete do
    carrinho (`prazo` ganha `op:'carrinho'`: agrupa por perfil de embalagem, monta
    `volumes[]` de perfis diferentes numa chamada ao Melhor Envio; Jadlog direta soma por
    perfil), acrescenta "Retirar em São Paulo — grátis" se `retirada_ativa`. Devolve
    `{subtotal, desconto, fretes[], parcelas[{n, valor}]}` — o valor do frete vai para o
    comprador aqui **porque é o checkout**, não a vitrine.
  - `op:'pagar'` — `{itens, cupom, endereco, frete:{opcaoId}, forma, cartao?, parcelas?}`:
    1. reprecifica e recalcula frete **de novo** (nunca confia no total do cliente);
    2. `garantirCliente` no Asaas (busca por CPF/CNPJ → cria → salva `asaas_customer_id`);
    3. grava `pedidos` (status `RASCUNHO`, `pagamento_status: 'aguardando'`) + itens;
    4. cria a cobrança conforme `forma`:
       - **PIX**: `dueDate` = hoje, `description` = "Pedido NZ #123", `externalReference`
         = id do pedido; depois `pixQrCode` → grava `pix_payload`, `pix_qr_base64`,
         `expira_em = now() + pix_expira_min`.
       - **BOLETO**: `dueDate` = hoje + `boleto_vencimento_dias` (dias úteis),
         `fine`/`interest` da config, `daysAfterDueDateToRegistrationCancellation: 5`;
         depois `identificationField` → grava linha/nosso número/`bankSlipUrl`.
       - **CREDIT_CARD**: `creditCard` + `creditCardHolderInfo` (do perfil, com o CEP/número
         do endereço de cobrança digitado) + `remoteIp` (primeiro IP de `x-forwarded-for`)
         + `installmentCount/totalValue` quando `parcelas > 1`. Resposta `CONFIRMED` →
         `pago` na hora; `AWAITING_RISK_ANALYSIS` → `em_analise`; 400 → apaga o pedido
         rascunho e devolve `{error:'cartao-recusado'}` (sem detalhe do emissor).
         **Limite: 3 tentativas de cartão por usuário a cada 15 min** (tabela em memória +
         `asaas_eventos`), contra teste de cartões roubados.
    5. cria o orçamento no ERP (`site_criar_pedido`, agora com `shipping_type:'CIF'`,
       `shipping_cost: valor_frete`, nota com a forma de pagamento);
    6. se já pagou (cartão), chama `site_confirmar_pagamento` na hora;
    7. devolve `{numero, pagamento:{forma, status, pix?, boleto?, cartao?}}`.
  - `op:'status'` — `{numero}` → estado atual (polling da página do pedido a cada 5 s por
    até 30 min; se `expira_em` passou e ainda `aguardando` → `remover(id)` no Asaas e
    marca `expirado`).
  - `op:'novo-pagamento'` — pedido `expirado`/`recusado`/`vencido` → gera outra cobrança
    (o cliente troca Pix por cartão, por exemplo) sem recriar o pedido.
- `api/_lib/handlers/asaas.ts` — ação `asaas`, o **webhook**:
  1. `POST` só; compara `asaas-access-token` com `ASAAS_WEBHOOK_TOKEN` via
     `timingSafeEqual` (padrão de `webhook.ts`); diferente → `401`;
  2. `insert into asaas_eventos … on conflict (id) do nothing` — se já existia, `200` e sai;
  3. **reconsulta** `GET /v3/payments/{id}` no Asaas (não confia só no payload) e confere
     `externalReference` = pedido e `value` = `total_final` (diferença → marca erro, alerta,
     não paga);
  4. aplica a transição da tabela de eventos; se virou `pago` → `site_confirmar_pagamento`
     no ERP e `cupons.usos + 1` atômico;
  5. sempre `200`, mesmo em falha interna (grava `erro` na linha do evento para o admin ver
     e para o cron reprocessar) — para a fila do Asaas nunca pausar.
- `api/_lib/handlers/sync.ts` (cron diário já existente) ganha: reprocessar `asaas_eventos`
  com `erro`, expirar Pix `aguardando` vencidos, checar validade da chave
  (`GET /v3/myAccount/status`?) e reportar no painel.
- `api/_lib/handlers/pedido.ts` continua existindo para o fluxo "orçamento sem pagamento"
  (lojista que negocia) — vira `forma_pagamento: null`.

**Variáveis (Vercel, production + preview; nunca `VITE_`):**

| Nome | Valor |
|---|---|
| `ASAAS_API_KEY` | chave de produção |
| `ASAAS_ENV` | `production` \| `sandbox` |
| `ASAAS_WEBHOOK_TOKEN` | 64 chars gerados por mim, o mesmo cadastrado no webhook |
| `ASAAS_SANDBOX_API_KEY` | chave do sandbox (usada quando `ASAAS_ENV=sandbox`) |

### 4.3 ERP (repo `2NZERPUPDATE30`, precisa do "pode" para push)

Migration `20260907_site_pagamentos.sql`: `quotes` ganha `pagamento_forma`,
`pagamento_status`, `pagamento_valor_liquido`, `pagamento_asaas_id`, `pago_em`; RPC
`site_confirmar_pagamento(p jsonb)` SECURITY DEFINER (só `service_role`) → acha o quote por
`site_pedido_id`, grava os campos, muda status para `APROVADO` respeitando a máquina de
estados de `rules/CRM_RULES.ts`, e registra em `crm_opportunities` "pago online". Tela de
orçamento mostra o selo "PAGO ONLINE · PIX · R$ x" e bloqueia edição de preço.

### 4.4 Front — a experiência

**Rota nova `/checkout`** (SSR-safe como as demais) + `/painel/pedido/:numero`.
Carrinho continua em `/carrinho` mas o botão vira **"Fechar pedido"** → `/checkout`.

Desktop: duas colunas — esquerda os passos, direita o resumo fixo (itens, subtotal, cupom,
frete, total, "pagar"). Celular: uma coluna, resumo recolhido no topo ("Total R$ x ▾" que
expande) e o botão de pagar **fixo no rodapé**; cada passo é um card que abre e fecha.

1. **Identificação** — se não logado, `/login?next=/checkout` (cadastro rápido: nome,
   e-mail, senha, CPF/CNPJ, celular; endereço fica para o passo 2).
2. **Entrega** — endereço vindo do perfil; CEP com o mesmo comportamento do campo de frete
   (máscara, ViaCEP preenche rua/bairro/cidade/UF, só número/complemento para digitar);
   "salvar no meu cadastro" marcado. Abaixo, as opções de frete **com preço e prazo**
   (rádio; a mais barata pré-selecionada; "Retirar em São Paulo — grátis — endereço do pátio").
   Toda mudança de CEP recota (debounce 500 ms) e trava o botão de pagar até voltar.
3. **Pagamento** — três abas grandes, com ícone e a informação que decide:
   - **Pix** — "Aprovação na hora. QR Code válido por 30 min." (selecionado por padrão)
   - **Cartão** — "Até 6x sem juros" (config). Campos: número (máscara, bandeira detectada,
     `autocomplete=cc-number`, `inputmode=numeric`), nome impresso, validade MM/AA, CVV,
     CPF do titular (pré-preenchido), parcelas (select com "3x de R$ 123,45"). Nada disso
     entra em estado global nem em `localStorage`; o form é submetido uma vez e limpo.
   - **Boleto** — "Vence em 3 dias úteis. Compensa em até 3 dias úteis após o pagamento.
     O pedido só é separado depois da compensação."
4. **Revisão** — endereço, entrega, pagamento, itens; check de aceite dos termos; botão
   **"Pagar R$ 1.234,56"** (ou "Gerar boleto" / "Gerar Pix"). Duplo clique protegido
   (`enviando`), erro por código (`cartao-recusado`, `cupom-invalido`, `frete-indisponivel`,
   `itens-invalidos`, `cadastro-incompleto`).

**Página do pedido (`/painel/pedido/:numero`)** — é para onde o "Pagar" leva e onde o cliente
volta pelo painel ou pelo e-mail do Asaas:
- **Pix**: no celular, botão grande **"Copiar código Pix"** primeiro (ninguém escaneia a
  própria tela) e o QR abaixo, menor; no desktop, QR grande e o copia-e-cola ao lado.
  Contador "expira em 29:59". Polling a cada 5 s; ao pagar, a tela troca sozinha para
  "Pagamento confirmado ✓ — pedido #123 em separação" sem recarregar. Expirou → botão
  "Gerar novo Pix" / "Pagar com cartão".
- **Boleto**: linha digitável com "Copiar", botão "Abrir boleto (PDF)", vencimento, aviso
  de compensação; "Também enviamos por e-mail".
- **Cartão**: resultado imediato — aprovado (recibo `invoiceUrl`), em análise, ou recusado
  com "tentar outro cartão / pagar com Pix".
- Status do **pedido** (ERP: separação, enviado, entregue) e do **pagamento** lado a lado;
  itens; endereço; frete escolhido.

**Painel `/painel`** — lista de pedidos ganha a coluna de pagamento (chip colorido) e link.

**Admin → Pedidos (nova aba)** — lista com filtros (pagamento, forma, período), detalhe com
link para a cobrança no Asaas, botão **Estornar** (total/parcial, com confirmação, só admin,
Pix e cartão), lista de eventos do webhook com erro em vermelho, e cartão "Asaas: chave OK /
webhook OK / último evento há 3 min". **Admin → Loja** ganha os campos de `loja_config` novos.

### 4.5 Segurança (regras fixas do projeto)

- Chave Asaas e token do webhook só em env do servidor; nunca `VITE_`; nunca no banco;
  diagnóstico `hasAsaasKey: !!key`.
- Total sempre recalculado no servidor a partir do ERP; o cliente manda itens, cupom,
  CEP e opção de frete — nunca valores.
- Dados de cartão: entram pelo `POST` do checkout, vão direto ao Asaas, não são gravados,
  não são logados, não vão ao Sentry/console; resposta com `Cache-Control: no-store`;
  guardamos só bandeira + 4 últimos. O site fica com a menor superfície possível de PCI
  (SAQ A-EP) — decisão 1 abaixo pode zerar isso.
- Webhook: `timingSafeEqual`, idempotência por `evt_id`, reconsulta ao Asaas antes de marcar
  pago, conferência de valor, `200` sempre.
- Só usuário logado (e aprovado — ver decisão 3) chega ao checkout; limite de 3 tentativas
  de cartão/15 min por usuário e 10/h por IP; CPF/CNPJ validado (`documento.ts`).
- Estorno só admin, com registro em `asaas_eventos`.

---

## 5. Decisões que só o João pode tomar

1. **Cartão dentro do site (transparente) ou na página do Asaas (hospedada)?**
   Transparente = experiência contínua, boleto/Pix/cartão iguais, mas o número do cartão
   passa pelo nosso servidor (não fica, não loga). Hospedada = zero contato com cartão, o
   cliente sai para `asaas.com/checkoutSession/…` e volta; sem boleto por lá (boleto e Pix
   continuam no site). **Minha recomendação: transparente**, com as regras da 4.5.
2. **Parcelas**: quantas sem juros (proposta: 6x, parcela mínima R$ 100) e se acima disso
   libera com juros repassados ou não oferece.
3. **Quem compra**: hoje só `is_approved`. Proposta: **cliente final (papel `client`)
   aprovado automaticamente ao confirmar e-mail**; lojista continua com aprovação manual
   (preço atacado). Se o preço da loja é o de atacado para todo mundo, isso precisa de uma
   olhada antes.
4. **Boleto**: vencimento em 3 dias úteis, multa 2%, juros 1% a.m. — ok? Pedido mínimo para
   boleto (ex.: R$ 200) para não pagar taxa em boleto de R$ 30 que nunca é pago?
5. **Retirada em São Paulo** grátis como opção de entrega — sim? Endereço a mostrar?
6. **Pix expira em 30 min** — ok?
7. **Frete grátis acima de R$ X** — quer?
8. **ERP**: pedido pago vira orçamento **APROVADO** automaticamente (vendedor só fatura) —
   ok? E o Pix que expirou fica como lead ABERTO para o vendedor cobrar, ou some?

---

## 6. Testes

### 6.1 Automatizados (`scripts/test-checkout.mjs`, `npm run checkout:test`) — sem rede
- montagem do corpo de cliente, Pix, boleto e cartão a partir de um perfil/pedido reais;
- `remoteIp` vem do primeiro IP de `x-forwarded-for`, nunca vazio;
- total: itens − cupom + frete, arredondamento a 2 casas, parcelas somam o total;
- webhook: token errado → 401; evento repetido → 200 sem reprocessar; valor divergente →
  não marca pago; `PAYMENT_CONFIRMED` (cartão) e `PAYMENT_RECEIVED` (Pix) → `pago` uma vez
  só; `OVERDUE` → `vencido`; `REFUNDED` → `estornado`;
- expiração do Pix: `expira_em` no passado + `aguardando` → `expirado` e `remover()` chamado;
- sanitização: nenhum campo de cartão em `pagamentos`, `asaas_eventos.payload`, nem em log;
- `tsc` da `api/` e do app, `npm run build`.

### 6.2 Sandbox (`ASAAS_ENV=sandbox`, no próprio domínio, antes de ligar produção)
1. **Pix**: checkout → QR aparece → `POST /v3/sandbox/payment/{id}/confirm` → webhook chega
   → página troca para "confirmado" sem recarregar → ERP recebe `site_confirmar_pagamento`
   → orçamento APROVADO. Repetir sem confirmar → aos 30 min vira `expirado` e a cobrança
   some do Asaas.
2. **Boleto**: linha digitável + PDF abrem → confirmar no sandbox → `pago`. Vencido →
   `PAYMENT_OVERDUE` → `vencido` → "gerar novo pagamento".
3. **Cartão**: número fictício válido → aprovado na hora, ERP APROVADO; `5184019740373151`
   → "recusado", pedido rascunho apagado, 3ª tentativa em 15 min → bloqueio; 3x parcelado →
   `installmentCount` 3 e total certo.
4. **Estorno** pelo admin (Pix e cartão) → `PAYMENT_REFUNDED` → `estornado`.
5. **Webhook** com token errado → 401 e nada gravado; evento duplicado → 1 linha.
6. **Celular** (Chrome Android + Safari iOS): teclado numérico nos campos, sem zoom (16px),
   botão de pagar visível com teclado aberto, "Copiar código Pix" funciona, PDF do boleto
   abre, polling não trava a bateria (para ao pagar/expirar).
7. **Acessibilidade**: rótulos, foco, mensagens de erro por campo, contraste.

### 6.3 Produção (com `ASAAS_ENV=production`)
- Pix real de R$ 1,00 pelo João → `PAYMENT_RECEIVED` → APROVADO no ERP → estorno pelo admin.
- Cartão real de R$ 1,00 (cartão do João) → `CONFIRMED` → estorno.
- Boleto real gerado e cancelado (não pagar) → confere `OVERDUE` depois do vencimento.
- Painel admin mostra os três eventos.

---

## 7. Fases e commits

| Fase | Entrega | Commit |
|---|---|---|
| 0 | João: chave prod, chave sandbox, chave Pix, domínio, notificações; respostas da seção 5 | — |
| 1 | migration site + RLS; `api/_lib/asaas/*`; `checkout` (resumo/pagar Pix+boleto/status); webhook `asaas`; testes | `feat(checkout): Asaas — cliente, Pix e boleto, webhook` |
| 2 | frete do carrinho (`prazo op:'carrinho'` + retirada); `precificar.ts` compartilhado; cupom atômico | `feat(checkout): frete do carrinho com valor para o comprador` |
| 3 | `/checkout` (4 passos, desktop + celular) + `/painel/pedido/:numero` + painel com status | `feat(checkout): página de checkout e acompanhamento do pedido` |
| 4 | cartão transparente + parcelas + limite de tentativas | `feat(checkout): cartão de crédito parcelado` |
| 5 | ERP: migration + RPC `site_confirmar_pagamento` + selo na tela (push com o "pode") | `feat(site): pagamento online → orçamento APROVADO` |
| 6 | Admin → Pedidos (estorno, eventos, saúde da integração) + Admin → Loja (config) | `feat(admin): pedidos pagos, estorno e saúde do Asaas` |
| 7 | homologação sandbox (6.2), variáveis de produção, webhook criado, testes reais (6.3), ligar | `chore(checkout): produção` |

Cada fase compila, passa nos testes e é publicada sozinha; a loja continua funcionando no
modo atual ("orçamento sem pagamento") até a fase 7 ligar o checkout de verdade — o botão
"Fechar pedido" só aparece com `loja_config.checkout_ativo = true`.

## 8. Riscos e limites conhecidos
- **Chave Pix sem "prova de vida"**: se o Asaas exigir e não for feita, o QR é o provisório
  (expira no dia) — o checkout funciona, mas o Asaas avisa que vai desligar esse modo.
- **Cartão pode cair em análise manual** (`AWAITING_RISK_ANALYSIS`): o cliente vê "em
  análise, avisamos por e-mail"; o pedido só vai para APROVADO no ERP quando aprovar.
- **Chargeback** de cartão é risco da NZ (o Asaas cobra de volta): pedido grande em cartão
  para cliente novo merece conferência do vendedor antes de faturar — o selo no ERP ajuda.
- **Sem reserva de estoque** no ERP: dois pagamentos do mesmo último rolo são possíveis;
  o vendedor resolve na separação (já é assim hoje com orçamentos).
- **Vercel Hobby**: nenhuma função nova; expiração de Pix é preguiçosa (na consulta e no
  cron diário), não em tempo real.
- **Boleto não estorna pela API** — devolução de boleto pago é Pix manual pelo painel Asaas.
- Taxas e limites do Asaas mudam; os valores desta página são de 2026-09-06.
