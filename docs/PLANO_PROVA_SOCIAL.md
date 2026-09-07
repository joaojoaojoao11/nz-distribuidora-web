# Prova social na página do produto

> Pedido do João (2026-09-07): *"um sistema de avaliação e comentários fakes em
> todos os produtos, alguns com mais quantidade, outros com menos, mas seguindo
> uma lógica, e aleatoriedade, como validação social, assim vai encorajar os
> clientes que visitarem os produtos a ler."*
>
> **Avaliação falsa não entra.** O objetivo — prova social que faça o visitante
> parar e ler — entra inteiro, e com material melhor. Este documento é a
> proposta; nada foi alterado.

---

## 0. Por que não a versão inventada

Não é questão de gosto. São três riscos concretos, e os três custam dinheiro:

| Risco | O que acontece na prática |
|---|---|
| **CDC art. 37** | Avaliação inventada é o exemplo de manual de publicidade enganosa. Basta um cliente irritado ou um concorrente com um print para virar Procon. |
| **Google** | Marcação `Review` falsa dá ação manual: perde as estrelas no resultado **e** derruba o domínio. A NZ tem um motor de SEO rodando desde 04/08 — seria pôr o investimento inteiro em risco por causa de um bloco de página. |
| **Marca** | O público da NZ é B2B: 253 clientes, dos quais **134 recompraram**. É gente que se conhece, que conversa em grupo de aplicador. Uma avaliação inventada de um produto que alguém comprou de verdade é descoberta em uma conversa. |

E há um problema prático que independe de lei: **843 produtos publicados**
significa 843 mentiras para manter coerentes. No dia em que um cliente
perguntar "quem é esse João que avaliou?", não há resposta.

---

## 1. O que a NZ já tem — e é melhor do que review inventada

Levantei no ERP e no site antes de propor qualquer coisa. Os números são reais:

| Dado | Número |
|---|---:|
| Pedidos entregues / enviados / aprovados | **752** |
| Clientes distintos que compraram | **253** |
| **Clientes que compraram mais de uma vez** | **134 (53,0%)** |
| Cliente mais fiel | **31 pedidos** |
| Itens vendidos (linhas de pedido) | **982** |
| SKUs com venda real | **193** |
| SKUs com venda nos últimos 90 dias | **152** |

E a distribuição por SKU **já é** exatamente o que você descreveu — "alguns com
mais, outros com menos, seguindo uma lógica" — só que verdadeira:

| Vendas do SKU | Quantos SKUs |
|---|---:|
| 20 ou mais | 10 |
| 10 a 19 | 7 |
| 5 a 9 | 22 |
| 2 a 4 | 54 |
| exatamente 1 | 100 |

Os campeões, para dar nome:

| SKU | Produto | Vendas | Clientes distintos |
|---|---|---:|---:|
| NZP05 | NZPPF Prime Clear Gloss | 153 | 60 |
| NZW01 | NZWrap Black Piano Ultra | 89 | 60 |
| NZP06 | NZPPF Prime Clear Matte | 69 | 36 |

**Você não precisa inventar uma curva. Você já tem uma, e ela é sua.**

---

## 2. As quatro camadas

A ideia central: em vez de UMA prova social falsa igual em todo produto, quatro
provas verdadeiras que aparecem **onde existem** e ficam quietas onde não
existem. Página sem número não é página fraca — é página honesta, e o espaço
vira conteúdo técnico, que é o que este público lê.

### Camada 1 — Prova de venda *(existe hoje; é ligar)*

Vem do ERP, que já é lido pelo site. Não escreve nada lá (regra do
[PLANO_CONEXAO_NZERP](PLANO_CONEXAO_NZERP.md) §0).

- **"60 clientes já compraram este produto"** — mais convincente que "4,8
  estrelas", porque é específico e verificável.
- **"12 rolos saíram nos últimos 30 dias"** — recência vende mais que total
  histórico.
- **"3º mais vendido da linha NZPPF"** — posição relativa, sem expor volume.
- Para os **650 produtos sem venda**: nada de número inventado. Sobe um nível e
  mostra a **linha**: *"Linha NZPPF — 336 rolos vendidos, 89 clientes"*. É
  verdade, é relevante, e cobre o catálogo inteiro.
- **O número 53% de recompra** merece lugar fixo na loja, não só no produto. É
  o argumento mais forte que a NZ tem e hoje não está escrito em lugar nenhum.

**A decidir:** granularidade. Número exato ("153 vendidos") entrega volume ao
concorrente. Faixa ("mais de 100 vendidos") protege e continua forte. Ver §5.

### Camada 2 — Avaliação de verdade, com compra verificada

O sistema de avaliação existe — o que muda é **quem pode escrever**.

- Só quem **comprou aquele produto** avalia. O site sabe: `pedidos` do site e
  `quotes` do ERP, ligados por `user_profiles.erp_client_id` (a ponte de
  10/09). O selo **"Compra verificada"** deixa de ser enfeite e passa a
  significar algo — é justamente o que a avaliação falsa nunca tem.
- Nota de 1 a 5 + texto livre + foto opcional.
- **Moderação:** o admin aprova antes de publicar. Pode ocultar, **nunca
  editar** — review editada é review falsa com passo extra.
- Nota baixa **fica**. Catálogo só com 5 estrelas é o sinal mais óbvio de
  fraude que existe; um 3 estrelas bem respondido pela NZ vende mais que dez 5
  estrelas mudos. Resposta oficial da loja em cada avaliação.
- Marcação `schema.org/Review` **só no que é real** — é isso que ganha estrela
  no Google, legitimamente.

### Camada 3 — O motor: convite a quem já comprou

Sem isto a camada 2 nasce vazia e fica vazia.

- **253 clientes reais** já compraram; **359 clientes do ERP têm e-mail**.
- E-mail pós-compra (7 dias após entrega) pedindo avaliação **do que a pessoa
  comprou de verdade**, com link direto e um clique para a nota.
- Onda inicial: convite ao histórico dos últimos 12 meses.
- **Expectativa honesta:** taxa de resposta de 5 a 15%. Dos 253, isso é **13 a
  38 avaliações** nas primeiras semanas — pouco, mas real, e cresce sozinho a
  cada venda.
- Acelerador legítimo: cupom de desconto por avaliação, **com o incentivo
  declarado na página** ("avaliação incentivada"). Isso é permitido; esconder
  é que não é.
- **Depende do Resend**, que já está na fila de pendências.

### Camada 4 — Prova de aplicação (a que mais vende neste mercado)

Quem compra PPF e wrap quer ver **carro pronto**, não estrela.

- `garantias_nz` já guarda instalação real: modelo do veículo, aplicador,
  cidade, data, linha aplicada. Hoje são **5 registros** — pouco, mas é semente
  verdadeira e cresce a cada garantia emitida.
- Galeria por produto: *"Aplicado em Civic 2023 · por [aplicador] · Santana de
  Parnaíba/SP"*, com foto e consentimento por escrito.
- A rede de aplicadores é o maior ativo de conteúdo que a NZ tem e não está
  sendo usada.

### Camada 5 — Perguntas e respostas

- O visitante deste catálogo pergunta coisa técnica: conformabilidade em
  para-choque, durabilidade em sol de São Paulo, se aceita wrap sobre wrap.
- Pergunta pública + resposta da NZ = prova social **e** SEO **e** menos
  suporte no WhatsApp. Uma resposta boa serve para todos os visitantes
  seguintes.
- É a camada que enche mais rápido, porque não depende de o cliente ter
  comprado.

---

## 3. Como cada página fica

| Situação do produto | O que aparece |
|---|---|
| Campeão (NZP05: 153 vendas, 60 clientes) | contagem de clientes + vendas recentes + avaliações + aplicações |
| Médio (2 a 9 vendas) | "N clientes já compraram" + posição na linha + Q&A |
| Uma venda só | posição na linha, sem número próprio |
| Sem venda (650 produtos) | prova da **linha** + ficha técnica + Q&A |

Regra que vale para as quatro camadas: **na dúvida, não mostra**. Um bloco
vazio é melhor que um bloco duvidoso.

---

## 4. Fases

| # | Fase | Depende de | Tamanho |
|---|---|---|---|
| **1** | Prova de venda vinda do ERP (produto e linha) + o "53% recompra" na loja | nada — o dado já está lá | médio |
| **2** | Tabela de avaliações, moderação no admin, gate de compra verificada, `schema.org` | fase 1 | médio |
| **3** | Convite pós-compra + onda inicial ao histórico | **Resend** | médio |
| **4** | Perguntas e respostas | fase 2 | pequeno |
| **5** | Galeria de aplicação a partir das garantias e dos aplicadores | consentimento | médio |

Ordem pensada para dar resultado antes de depender do Resend: a fase 1 sozinha
já põe prova social em **todas as 843 páginas** (por produto onde houver, por
linha no resto), e não depende de ninguém escrever nada.

---

## 5. O que preciso decidir com você

1. **Granularidade do número de vendas.** Exato ("153 vendidos") ou faixa
   ("mais de 100")? Exato é mais forte; faixa não entrega volume ao concorrente.
   *Recomendo faixa para volume e número exato para clientes distintos* — "60
   clientes compraram" impressiona sem revelar quanto a NZ girou.
2. **Cupom por avaliação?** Funciona e é legal, desde que a página diga que a
   avaliação foi incentivada. *Recomendo sim, na onda inicial.*
3. **Produto sem venda: mostra o bloco vazio ou esconde?** *Recomendo esconder
   o bloco de produto e mostrar o da linha.*
4. **Aplicador pode avaliar?** Ele instala mas nem sempre é quem compra.
   *Recomendo sim, com selo próprio ("avaliação de aplicador profissional"),
   separado de "compra verificada".*
5. **Onda inicial de convites: 12 meses de histórico ou só 2026?**

---

## 6. O que este plano NÃO faz

- Não cria avaliação, comentário, nota ou contador que não venha de fato real.
- Não escreve nada no NZERP.
- Não promete volume: a camada 2 começa com dezenas, não centenas. Quem quiser
  centenas na primeira semana está pedindo a versão que este documento recusa.
