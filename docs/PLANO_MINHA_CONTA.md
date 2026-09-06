# Área do cliente ("Minha conta") — diagnóstico e plano

> Pedido do João (2026-09-06), com `/painel` aberto: *"tem que ser criado um
> botão no menu, de dados do usuário / para dados do usuário, senha e segurança
> / pedidos / carrinhos abandonados / pagamentos / últimas compras / últimos
> produtos / cupons / e etc… e o botão indique e ganhe / porque o botão adm abre
> uma área que o usuário cliente não vai ter acesso, aí vai ficar melhor fazer
> essa divisão / faça um plano antes de aplicar, me mostre antes."*
>
> **Nada foi alterado no código.** Este documento é para aprovação.

---

## 1. O que existe hoje

`/painel` é **uma página só, com 586 linhas e cinco blocos empilhados**: status do
cadastro, Meus dados, Acesso (trocar senha), Indique e ganhe, Meus pedidos. Não
há menu, não há endereço por tela (só `/painel/pedido/:numero` tem), e no celular
tudo vira uma coluna muito longa — para chegar em "Meus pedidos" é preciso rolar
por todo o formulário de cadastro.

O painel **administrativo** (`/admin`), refeito em 2026-09-06, já tem o que falta
aqui: rota por tela, menu agrupado, gaveta no celular, busca. A área do cliente
ficou uma geração atrás.

**O botão da barra hoje** é um só, e ele decide sozinho para onde vai:
`isAdmin ? '/admin' : '/painel'`. Para o cliente está certo; para você, o botão
"⚙ ADMIN" é o único caminho, e a sua própria conta de comprador fica escondida.
É a divisão que você apontou.

### O que já dá para mostrar sem encanamento novo

Tudo isto **já está no banco, com a permissão certa** (o cliente lê só o que é
dele — políticas `*_proprio` conferidas):

| Dado | Tabela | Serve para |
|---|---|---|
| Pedidos, status, totais | `pedidos` (3 hoje) | Pedidos, Últimas compras |
| Itens de cada pedido | `pedido_itens` | Comprar de novo |
| Pagamentos: Pix, boleto, cartão, recibo | `pagamentos` — tem `boleto_url`, `linha_digitavel`, `pix_payload`, `invoice_url`, `recibo_url`, `cartao_final`, `vencimento` | **Pagamentos** (2ª via, copiar Pix, recibo) |
| Código de afiliado, cupom, comissões | `afiliados`, `cupons`, `comissoes` | Indique e ganhe, Meus cupons |
| Cadastro e endereço | `user_profiles` | Meus dados |
| Último acesso | `user_profiles.ultimo_acesso_em` | Senha e segurança |
| Garantias emitidas | `garantias_nz` (5 hoje), ligadas por CPF/e-mail | **Minhas garantias** (sugestão minha) |

### O que **não** existe e precisa ser construído

1. **Carrinho no servidor.** Hoje o carrinho vive **só no navegador**
   (`localStorage`, `src/lib/shop/carrinho.ts`). Consequência direta: **não existe
   "carrinho abandonado"** — nem para o cliente retomar, nem para você ver quem
   desistiu, nem para mandar e-mail de recuperação. E quem monta o carrinho no
   celular não o encontra no computador.
2. **Produtos vistos.** `analytics_events` guarda `session_id`, **não** o usuário
   — não dá para dizer "os últimos produtos que *você* viu" a partir dele.
3. **Mais de um endereço.** `user_profiles` guarda **um** endereço de entrega
   (+ CEP/número de cobrança). Um lojista que entrega em duas lojas não tem onde
   cadastrar a segunda.
4. **Cupom por cliente.** `cupons` só tem cupom de afiliado (1 linha). Não existe
   "cupom dado ao cliente X".

---

## 2. Achado de segurança (fora do pedido, mas no caminho)

`garantias_nz` está com **RLS aberta para qualquer visitante**:

```
Leitura irrestrita de consulta   [SELECT] → public
Permitir update em garantias_nz  [UPDATE] → public
Permitir delete em garantias_nz  [DELETE] → public
```

A tabela guarda **CPF, nome completo, telefone, e-mail e endereço** de quem
registrou garantia. Com a chave pública do site — que está no bundle, como em
qualquer site — dá para **ler todas**, **alterar** e **apagar** todas.

Isso precisa ser fechado antes de "Minhas garantias" existir, e na verdade
precisa ser fechado de qualquer jeito. É rápido (uma migration): leitura pública
só pelo `codigo_autenticacao` (que é o que o validador usa), escrita só admin.

---

## 3. Estrutura proposta

Regra que usei: **menu curto, agrupado, e nenhum item que abra numa tela vazia
sem explicação.** A loja tem 3 pedidos hoje — a área precisa ficar boa **vazia**,
não só cheia.

```
/painel                    Início — o resumo
│
├─ COMPRAS
│   ├─ /painel/pedidos     Pedidos          (lista + "comprar de novo")
│   ├─ /painel/pagamentos  Pagamentos       (2ª via, Pix, recibo)
│   └─ /painel/carrinho    Carrinho guardado
│
├─ CATÁLOGO
│   ├─ /painel/vistos      Vistos recentemente
│   └─ /painel/favoritos   Favoritos                        [sugestão minha]
│
├─ CONTA
│   ├─ /painel/dados       Meus dados
│   ├─ /painel/enderecos   Endereços                        [fase 2]
│   ├─ /painel/seguranca   Senha e segurança
│   └─ /painel/garantias   Minhas garantias                 [sugestão minha]
│
└─ VANTAGENS
    ├─ /painel/indique     Indique e ganhe
    └─ /painel/cupons      Meus cupons
```

### Decisões de conteúdo que valem explicar

- **"Últimas compras" não vira uma tela separada.** Seria a mesma lista de
  Pedidos filtrada por faturado. O que tem valor de verdade é o **botão "comprar
  de novo"** dentro de cada pedido (repõe o carrinho com os mesmos itens) e um
  bloco **"você costuma comprar"** no Início. Uma tela a menos, a função que
  importa preservada.
- **"Carrinhos abandonados" tem dois lados.** Para o cliente é *"Carrinho
  guardado — você deixou 3 itens em 04/09"*, com um botão para retomar. Para
  você é um **relatório em Admin → Pedidos** ("12 carrinhos parados, R$ 8.400 em
  jogo") e, quando o Resend existir, um e-mail de recuperação. As duas coisas
  saem da **mesma** peça nova: a tabela de carrinho no servidor.
- **"Últimos produtos" = vistos recentemente**, com o preço do papel de quem
  olha e o botão de adicionar. Sem tabela nova: guardo os últimos 20 slugs na
  chave do usuário, do mesmo jeito que o carrinho. Se depois você quiser esse
  dado no admin, aí sim vira tabela.
- **Favoritos (sugestão minha).** É o item que mais falta numa loja de 1.292
  produtos com 480 cores parecidas: o instalador acha a cor, não vai comprar
  hoje, e perde. Custa quase nada em cima da mesma plumbing dos "vistos".
- **Minhas garantias (sugestão minha).** O site já emite certificado; o cliente
  não tem onde reencontrar o dele. Ligação por CPF/e-mail do cadastro.
- **Meus cupons** mostra o cupom do "Indique e ganhe" e um campo para validar um
  código. Cupom nominal por cliente só depois de existir `cupons.user_id`.

### O que fica de fora desta rodada, e por quê

| Item | Por quê |
|---|---|
| Notas fiscais / XML | Vive no ERP (faturamento); precisa de RPC nova lá |
| Preferências de notificação | Só faz sentido com o Resend ligado |
| 2FA | Depende de configuração no Supabase Auth; vale, mas é outra conversa |
| Trocar e-mail da conta | Precisa de e-mail transacional (confirmação nos dois endereços) |
| Limite/crédito do lojista | Dado do ERP (contas a receber) — decisão sua se expõe |

---

## 4. Como fica no celular

**Não vou repetir a gaveta do admin aqui.** No admin ela existe porque são 16
telas e você fica dentro dela o dia todo. O cliente entra na conta duas vezes por
mês, e uma gaveta lateral competiria com o hambúrguer do site — dois menus
diferentes no mesmo canto da tela.

O padrão certo para conta é o de **ajustes do celular**:

- **`/painel` no celular É o menu.** Uma lista de linhas grandes (ícone, título,
  uma frase de contexto, contador quando houver), com altura de toque ≥ 56 px.
- **Cada tela abre cheia**, com um "‹ Minha conta" no topo. O "voltar" do
  Android faz o que se espera.
- **No desktop**, a mesma lista vira coluna fixa à esquerda (240 px) e o conteúdo
  à direita — layout de duas colunas, sem gaveta, sem sobreposição.
- Nada de tabela larga: pedido e pagamento viram **cartão** abaixo de 640 px, com
  o valor e o status em cima. É o que a lista de pedidos já faz hoje, e funciona.
- Alvos conferidos pelo `npm run loja:alvos` (a régua de 44 px que já existe).

---

## 5. A divisão cliente × admin

| Hoje | Proposta |
|---|---|
| Um botão só: admin vai para `/admin`, cliente vai para `/painel` | **Todo mundo** vê "Minha conta" → `/painel`. Quem é admin vê **também** o "⚙ Admin" ao lado |
| Admin não tem caminho fácil para a própria conta de comprador | Dois destinos, dois botões, sem ambiguidade |
| No celular, o link fica no rodapé da gaveta | Mesma regra: dois itens no rodapé da gaveta |

**Rota:** mantenho `/painel` como base em vez de criar `/conta`. Motivo prático:
`/painel` já é o destino do login, do cadastro, do carrinho e do `routeMeta`, e o
servidor **já responde 200 para `/painel/*`** (corrigido em `eaeec08`). Trocar o
nome custaria redirects em 13 lugares para ganhar nada — o rótulo na tela é
"Minha conta" de qualquer jeito.

---

## 6. Fases de execução

| # | Fase | O que entrega | Tamanho |
|---|---|---|---|
| **0** | Fechar `garantias_nz` | Migration de RLS: leitura só pelo código, escrita só admin | 30 min |
| **1** | Casca + rotas | `PainelLayout` (menu lateral no desktop, lista no celular), `painelNav.ts`, rotas aninhadas, `/painel` = Início | 1 tela nova + mover o que existe |
| **2** | Quebrar o que já existe | Meus dados, Senha e segurança, Indique e ganhe e Pedidos saem do arquivão para telas próprias | Recorte, sem lógica nova |
| **3** | Pagamentos | Tela lendo `pagamentos`: 2ª via de boleto, copiar Pix, recibo, cartão usado, vencimento | Tela nova, dado pronto |
| **4** | Comprar de novo | Botão no pedido que repõe o carrinho; bloco "você costuma comprar" no Início | Pequeno |
| **5** | Carrinho no servidor | Tabela `carrinhos` + sync com o `localStorage`; "Carrinho guardado" para o cliente; relatório de abandonados em Admin → Pedidos | **A maior peça** |
| **6** | Vistos e Favoritos | Últimos 20 vistos + favoritar na página e no card | Médio |
| **7** | Meus cupons e Minhas garantias | Duas telas de leitura | Pequeno |
| **8** | Endereços múltiplos | Tabela `enderecos`, escolha no checkout | Médio — **fase 2, se você quiser** |

Cada fase entra com autoteste (`npm run painel:test`, no molde do
`carrinho:test`) e verificação no navegador nos dois tamanhos de tela, como nas
rodadas anteriores.

---

## 7. O que preciso decidir com você

1. **Carrinho no servidor (fase 5): faço?** É o que destrava "carrinhos
   abandonados" dos dois lados e o carrinho seguir do celular para o computador.
   Sem ele, "carrinho abandonado" não existe — nem para o cliente nem para você.
   **Minha recomendação: sim.**
2. **Favoritos: entra?** Recomendo que sim.
3. **Minhas garantias: entra?** Recomendo que sim (e a RLS precisa ser fechada de
   qualquer forma).
4. **Endereços múltiplos: agora ou depois?** Recomendo depois — só vale quando
   alguém pedir para entregar em dois lugares.
5. **Ordem:** faço 0→4 primeiro (área completa com o dado que já existe) e o
   carrinho no servidor logo depois? Ou o carrinho antes de tudo?
