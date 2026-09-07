# Site ↔ NZERP: pedido só depois de pago, e o histórico do cliente na conta

> Pedido do João (2026-09-10): *"preparar o envio de pedido direto ao NZERP…
> tudo pensado para evitar problemas, duplicidades… só quando o pagamento for
> aprovado no site ele vá para o NZERP… todos os clientes do NZERP podem ter
> cadastro no site como lojista… o site pode ter na parte de pedidos todos os
> pedidos do cliente, na parte de pagamento todos os pagamentos."*
>
> Restrição dada depois: *"tem que ser aditivo, utilizar o que já existe no
> nzerp, **sem criar nada lá** para não atrapalhar o fluxo. A parte de status
> podem ser replicados também. O que não conseguir replicar de títulos não tem
> problema, só vamos relatando para ir consertando com o tempo."*
>
> **IMPLANTADO em 10/09/2026** ("pode seguir o plano"). O que ficou de pé está
> na seção 8; as decisões, na 7.

---

## 0. A regra que manda em todo o resto

**O NZERP passa a ser somente leitura para este projeto.** Nenhuma tabela,
coluna, índice, view, função ou gatilho novo lá dentro. As únicas escritas que
continuam são as que **já existem e já estão em produção**:

| Já existe no ERP | Para quê | Escreve? |
|---|---|---|
| `site_criar_pedido` | pedido do site vira orçamento | sim (é o produto) |
| `site_confirmar_pagamento` | marca o orçamento como pago | sim |
| `site_cancelar_pedido` | cancela orçamento não faturado | sim — **ver §7, decisão 5** |
| `site_consultar_cliente` | acha o cliente por documento | não |
| `site_vincular_cliente` | grava `clients.site_user_id` | sim — **proponho parar de usar** |
| views `catalogo_site`, `precos_site`, `estoque_site`, `pedidos_site` | espelho do catálogo e status | não |
| tabelas `quotes`, `faturamento`, `contas_receber`, `clients` | histórico do cliente | **só leitura** |

Tudo que este plano precisa de novo — trava de duplicidade, unicidade de
vínculo, atribuição de títulos — **passa a morar no banco do site**. É mais
trabalho de um lado só, e o fluxo do ERP não sente nada.

---

## 1. O que eu encontrei

### 1.1 O ERP recebe o pedido antes do pagamento

`api/_lib/handlers/checkout.ts:388`: assim que a cobrança nasce no Asaas, o site
já chama `site_criar_pedido`. O pagamento é confirmado depois, numa segunda
chamada. **Um Pix gerado e nunca pago vira orçamento igual**, e a rotina de
manutenção (`asaas/manutencao.ts:69`) ainda reenvia pedido sem orçamento, pago
ou não. É o que você mandou inverter.

### 1.2 A idempotência depende de um "consulta e depois insere", sem trava

`site_criar_pedido` procura por `site_pedido_id` e, se não achar, insere. O
índice em `quotes.site_pedido_id` **não é único** — e agora não pode virar, pela
regra §0. Webhook do Asaas, cron e a tela consultando status podem correr
juntos, os três lerem "não existe" e os três inserirem.

**Não aconteceu ainda: só há 3 pedidos vindos do site.** Com volume, acontece.
A trava vai para o lado do site (§3.1).

### 1.3 Um cliente do ERP pode acabar ligado a dois logins

`clients.site_user_id` também não é único. Como não vamos mexer lá, a garantia
passa a ser **no site**: índice único em `user_profiles.erp_client_id`. O
documento, esse, já é único no ERP — 389 clientes, zero CNPJ repetido.

### 1.4 Metade dos títulos não tem documento nem orçamento

Dos 2.319 títulos vivos em `contas_receber`:

| | Títulos | Como atribuir |
|---|---:|---|
| Com CPF/CNPJ | 982 | direto |
| Sem documento, com `quote_id` | 199 | pelo orçamento |
| Sem documento e sem orçamento | 1.138 | pelo nome — ver abaixo |

**E aqui está o achado que muda a conversa:** a view `v_accounts_receivable`,
que é a que as telas financeiras do próprio ERP usam, tem uma coluna
`IDCliente` — e ela é literalmente `cliente_nome`. **O ERP já usa o nome como
chave do título.** Atribuir por nome não é invenção minha; é a mesma chave que
o sistema usa internamente.

Com uma trava a mais: só nome **exato e não ambíguo**. Existem 3 nomes de
cliente repetidos entre os 389, e 49 títulos caem neles — esses ficam de fora.

| Resultado esperado | Títulos |
|---|---:|
| Atribuídos com segurança | ~2.228 (96%) |
| Sobram para o relatório | ~91 (4%) |

Você já disse como tratar os que sobram: **relatar e ir consertando com o
tempo.** Eles não aparecem para nenhum cliente e ficam numa lista em
Admin → Clientes, com o botão de atribuir à mão.

### 1.5 Os itens do orçamento não carregam custo

`quotes.items` guarda `sku`, `name`, `qty`, `unit`, `unitPrice`, `total`.
**Nenhum custo, nenhuma margem.** Mostrar o pedido ao dono dele é seguro.

### 1.6 Cadastro dos clientes do ERP no site

389 clientes, 359 com e-mail, **1 ligado a um usuário do site**. O
reconhecimento automático já funciona (cadastrou com o CNPJ que está no ERP →
vincula e aprova como lojista). Falta alcance, não código.

---

## 2. O caminho, do carrinho ao orçamento

```
   CLIENTE                         SITE                          NZERP
   ───────                         ────                          ─────
   carrinho ──────────► pedidos (RASCUNHO)
                                    │
                      escolhe pagar │
                                    ▼
                             cobrança no Asaas
                             erp_payload congelado          (não sabe de nada)
                                    │
                    ┌───────────────┴───────────────┐
                 não paga                        PAGOU
                    │                               │
                    ▼                               ▼
          Pix expira / cancela         trava NO SITE (compare-and-swap
          nada vai ao ERP              em pedidos.erp_envio)
                                                    │
                                                    ▼
                                        site_criar_pedido ──► quotes (origem SITE,
                                        site_confirmar_pgto     já pago)
                                                    │
                                     pedidos: ABERTO + nº do orçamento
                                                    │
                                  ◄─────────────────┘
                                  espelho de status a cada 5 min
```

---

## 3. Como cada risco fecha, sem tocar no ERP

### 3.1 Duplicidade de orçamento — trava no banco do site

Coluna nova **em `pedidos` (site)**: `erp_envio` com `pendente | enviando | enviado`.
O despacho começa com um UPDATE condicional, que é atômico:

```sql
update pedidos
   set erp_envio = 'enviando', erp_envio_em = now()
 where id = $1
   and (erp_envio = 'pendente'
        or (erp_envio = 'enviando' and erp_envio_em < now() - interval '5 minutes'))
returning id;
```

Zero linhas = **outro processo já está enviando**, e este desiste. É o que fecha
a corrida real (webhook + cron + tela ao mesmo tempo). O prazo de 5 minutos
devolve o pedido à fila se o processo morrer no meio. E a idempotência que já
existe dentro de `site_criar_pedido` continua sendo a segunda rede.

### 3.2 Vínculo — unicidade no site

Índice único em `user_profiles.erp_client_id`. **Proponho parar de chamar
`site_vincular_cliente`**: é uma escrita a menos no ERP, e o vínculo que
importa (o que decide o que o cliente vê) é o do site.

### 3.3 Os outros

| Risco | O que fecha | Onde |
|---|---|---|
| Asaas repete o evento | `asaas_eventos` tem o id do evento como chave | já existe |
| Cliente clica "pagar" duas vezes | a cobrança anterior em aberto é cancelada antes | já existe |
| Pedido pago reenviado | `erp_quote_id` preenchido não reenvia | já existe |
| Estorno depois do orçamento | `site_cancelar_pedido` | já existe |
| Vínculo errado expõe outra empresa | só CNPJ normalizado igual; e-mail reforça, não decide | site |
| Preço divergente | recalculado no servidor a cada etapa | já existe |

---

## 4. O histórico do cliente, lendo o que já existe

Um módulo só no servidor do site — `api/_lib/conta/erpHistorico.ts` — é o único
lugar autorizado a tocar no ERP para isto. Ele lê direto das tabelas que já
existem, com **lista branca de colunas escrita como constante**, nunca `*`:

| O que aparece | De onde | Chave |
|---|---|---|
| Pedidos do NZERP | `quotes` | `cpf_cnpj` do cliente |
| Notas fiscais | `faturamento` | pelo `quote_id` |
| Parcelas e boletos | `contas_receber` | pela atribuição do §4.1 |
| Status | `quotes.status` | replicado com os rótulos em português que o site já tem |

**Nunca sai:** custo, margem, tabela de preço interna, vendedor, observações
internas, `status_cobranca`, cartório, cessão, histórico de cobrança, limite de
crédito, e qualquer linha que não seja do próprio cliente.

Um autoteste garante a lista branca: se alguém escrever `select('*')` nesse
módulo, o teste quebra.

### 4.1 Atribuição dos títulos — tabela no site

Tabela nova **no site**: `erp_titulo_dono (titulo_id, erp_client_id, chave, confianca, confirmado_por, criado_em)`,
preenchida por um job diário e pelo botão do admin. Três chaves, em ordem:

1. **documento igual** → confiança alta (982)
2. **`quote_id` do cliente** → confiança alta (199)
3. **nome exato e não ambíguo** → confiança média (~1.089) — a mesma chave que o
   ERP usa internamente

O que não casar fica de fora e entra no relatório. O ERP não é escrito em
momento nenhum.

---

## 5. O "enviar como orçamento"

Continua sendo a decisão principal. Note que, sob a regra §0, a opção A **não
precisa de nada novo no ERP**: a solicitação vive no site, e o botão do vendedor
chama a `site_criar_pedido` que já existe.

| | O que acontece | Efeito |
|---|---|---|
| **A. Vira solicitação no site** *(recomendo)* | Fica como `SOLICITADO`, aparece em Admin → Pedidos com "Enviar ao NZERP" | O ERP só recebe o que é real; um clique a mais |
| B. Some | Só existe comprar pagando | Perde o lojista que negocia antes |
| C. Fica como está | Continua criando orçamento sem pagamento | Contraria o pedido |

---

## 6. Fases

| # | Fase | Onde | Tamanho |
|---|---|---|---|
| **1** | `pedidos.erp_envio` + compare-and-swap; único em `user_profiles.erp_client_id` | **site** | pequeno |
| **2** | ERP só recebe pago: despacho sai do "pagar", filtro da manutenção muda, teste de corrida | **site** | pequeno |
| **3** | "Enviar como orçamento" vira solicitação + botão do vendedor | **site** | médio |
| **4** | `erp_titulo_dono` + job de atribuição + relatório do que sobrou | **site** | médio |
| **5** | `erpHistorico.ts`: leitura com lista branca de `quotes`, `faturamento`, `contas_receber` | **site** | médio |
| **6** | `/painel/pedidos` e `/painel/pagamentos` juntando site + ERP, com selo de origem | **site** | médio |
| **7** | Admin → Clientes: quem tem conta, vincular à mão, atribuir título, convidar | **site** | médio |

**Nenhuma fase escreve objeto novo no NZERP.**

---

## 7. As decisões, e o que foi feito com cada uma

O João respondeu **"pode seguir o plano"** em 10/09/2026. As seis decisões
ficaram com a recomendação do plano:

| # | Decisão | Resposta | Onde vive |
|---|---|---|---|
| 1 | "Enviar como orçamento" | **A** — vira `SOLICITADO` no site; o vendedor despacha | `handlers/pedido.ts`, `op: 'enviar-erp'` |
| 2 | Atribuir título por nome exato e não ambíguo | **sim** | `conta/atribuirTitulos.ts` |
| 3 | Título vencido aparece ao cliente | **sim**, com data e valor, sem linguagem de cobrança | `PainelPagamentos.tsx` |
| 4 | Limite de crédito aparece | **não** — a coluna não é nem lida | teste reprova se voltar |
| 5 | `site_cancelar_pedido` fica | **fica** — isolada, no namespace `site_`, recusa qualquer coisa aprovada | `handlers/checkout.ts` |
| 6 | Parar de escrever `clients.site_user_id` | **sim** | `site_vincular_cliente` removida de `conta/erpClientes.ts` |

## 8. O que ficou de pé (implantado em 10/09/2026)

**Migrations do site** (nenhuma no ERP):

- `2026-09-10c_ponte_erp_trava.sql` — `pedidos.erp_envio`, `erp_envio_em`,
  `erp_envio_erro`; índice único em `user_profiles.erp_client_id`; índice da fila.
- `2026-09-10d_erp_titulo_dono.sql` — `erp_titulo_dono` e `erp_atribuicao_log`,
  as duas com RLS ligada e sem política (só service role).

**Servidor:**

- `api/_lib/pedido/despachoErp.ts` — o único caminho até o ERP. Faz a trava,
  cria o orçamento e confirma o pagamento. `motivo: 'pago' | 'admin'`.
- `api/_lib/conta/atribuirTitulos.ts` — o job das três chaves.
- `api/_lib/conta/erpHistorico.ts` — leitura com lista branca de colunas.
- `handlers/checkout.ts` — ops novas `fila-erp` e `enviar-erp` (admin).
- `handlers/conta.ts` — ops novas `historico-erp` (cliente) e
  `atribuir-titulos` / `titulos-sem-dono` / `atribuir-titulo` (admin).
- `handlers/sync.ts` — o job entra no cron diário.

**Telas:**

- `/painel/pedidos` — segunda lista, "Compras anteriores na NZ", com selo.
- `/painel/pagamentos` — segunda lista, "Suas parcelas na NZ".
- Admin → Pedidos — "Esperando para ir ao NZERP", com o botão do vendedor.
- Admin → Clientes — "Títulos do NZERP sem dono", com o botão de rodar o job.

**Autoteste:** `npm run erp:test` — 46 verificações. Cobre a regra do pagamento,
a corrida de três processos na trava, a retomada depois de 5 min, o erro do ERP
que devolve a trava, e lê o fonte para reprovar `select('*')`, coluna proibida e
RPC de escrita nova no ERP.

**Números reais da atribuição** (conferidos em produção, 10/09/2026):

| Chave | Títulos |
|---|---:|
| documento | 946 |
| nome exato e não ambíguo | 1.054 |
| orçamento | 201 |
| **atribuídos** | **2.201 (94,9%)** |
| sem dono | 69 |
| nome repetido entre clientes | 49 |
| **para o relatório** | **118 (5,1%)** |
