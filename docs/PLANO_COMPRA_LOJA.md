# Processo de compra da NZSTORE — diagnóstico e execução

> **IMPLANTADO em 2026-09-06** (commit `714cc4d`), verificado em produção.
> Testes: `npm run carrinho:test` (26) e `scratchpad/pw/compra.mjs` (23 no navegador).

> Pedido do João (2026-09-06), com a página do AD PRO NEW GENERATION 35 aberta:
> *"o processo de compra na loja tem que ser melhorado… aparece o carrinho lá em
> cima, vem sutil, tem que ter um processo de compra intuitivo e claro."*

---

## 1. Diagnóstico — por que o fluxo não se explica

### Na página do produto

1. **A ação de comprar é o elemento mais fraco da tela.** "Adicionar rolo
   fechado" e "Adicionar metros" são dois botões vazados de 0,68 rem, e logo
   abaixo deles um botão vermelho de largura inteira grita **PEDIR ORÇAMENTO** —
   que sai do site para o WhatsApp. Para quem já está logado e vendo preço, a
   hierarquia está invertida: o caminho mais visível é o que não vende.
2. **Adicionar não confirma nada.** O texto do próprio botão vira "Adicionado ✓"
   por 1,8 s — no lugar onde o dedo acabou de sair, portanto muitas vezes
   escondido — e um "🛒 1" aparece 600 px acima, no topo. É exatamente o
   "vem sutil" da reclamação.
3. **"Ver carrinho" é um link sublinhado minúsculo** encostado à direita. O
   próximo passo do processo é a coisa menos visível do bloco.
4. **A quantidade não diz do quê.** Dois campos numéricos nus, sem +/−, sem
   unidade ao lado e sem subtotal: o cliente digita "2" e não vê o que vai
   gastar antes de ir para o carrinho.
5. **Dois botões concorrentes para uma decisão só.** Rolo fechado e metro são
   uma escolha *ou/ou* desenhada como duas ações paralelas.

### Na barra do topo

6. **O carrinho só existe quando tem coisa dentro.** Quem nunca adicionou nada
   nunca aprendeu onde ele fica; quando aparece, aparece como texto com o mesmo
   peso do botão ADMIN.
7. **A contagem é de linhas, não de itens** (`totalItensCarrinho` devolve
   `lista.length`): 5 rolos mostram "1".
8. **No celular ele não está na barra** — só dentro do menu hambúrguer, no
   rodapé da gaveta.
9. **Nada se mexe quando o número muda**, então mesmo quem olha para o topo não
   percebe a mudança.

### Na página do carrinho

10. **Ordem sem lógica e pesos contraditórios:** "Fechar pedido e pagar" é
    primário, "Enviar como orçamento" usa o estilo do botão de *limpar*, e
    "Continuar comprando" usa esse mesmo estilo. Três botões, três significados,
    dois deles com a mesma cara.
11. **Jargão interno na cara do cliente:** "Enviar pedido ao NZERP".
12. **Nenhuma noção de onde se está** no caminho produto → carrinho → entrega e
    pagamento → confirmado, nem de quantos passos faltam.

### Transversal

13. **O carrinho não é por usuário**, apesar do comentário no topo do arquivo
    dizer que é: a chave `nz:carrinho` é fixa. Em computador compartilhado (o da
    loja, o do balcão) um cliente vê o carrinho do outro.

---

## 2. O que foi feito

| # | Mudança | Arquivo |
|---|---|---|
| 1 | Bloco de compra novo: escolha de unidade em botões segmentados, contador com +/−, subtotal ao vivo e **um** botão primário "Adicionar ao carrinho" | `src/pages/Loja/Comprar.tsx` |
| 2 | Painel do carrinho que abre ao adicionar, mostra o que entrou, o total e o próximo passo | `src/components/Loja/MiniCarrinho.tsx` |
| 3 | Carrinho sempre visível na barra (desktop e celular), ícone de verdade, contagem em itens, badge e pulso ao mudar | `src/components/Navbar/Navbar.tsx` |
| 4 | Passos numerados do processo (Carrinho · Entrega e pagamento · Confirmação) | `src/components/Loja/PassosCompra.tsx` |
| 5 | Carrinho reorganizado: um CTA primário, alternativa em texto, jargão fora | `src/pages/Loja/Carrinho.tsx` |
| 6 | Carrinho por usuário, com o carrinho de visitante migrando no login | `src/lib/shop/carrinho.ts` |
| 7 | WhatsApp vira secundário quando o visitante pode comprar de fato | `src/pages/Loja/LojaProduct.tsx` |

**Regra de hierarquia adotada:** em qualquer tela da loja existe **um** botão
vermelho cheio, e ele é o passo seguinte da compra. Tudo que é alternativa
(orçamento por WhatsApp, pedido para o vendedor, continuar comprando) é link ou
botão vazado.

---

## 3. Fora desta rodada

- **Quantidade ciente do estoque.** Hoje dá para adicionar 1 rolo fechado de
  30 m de um produto com 20,5 m em saldo; quem barra é o vendedor. Exige subir a
  consulta de `/api/nz/estoque` do bloco `Disponibilidade` para o de compra.
- **Adicionar direto do card da lista** (`ShopCard`) — a escolha de unidade
  precisa de um passo, então ficaria um mini-popover.
- **Frete estimado dentro do carrinho.** Hoje só no checkout; o carrinho diz
  "frete calculado no passo seguinte".
