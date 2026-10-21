# Indicação, cashback, saque e afiliados — onde está o plano

O plano completo (20/10/2026) fica no repositório do **NZERP**, em
`docs/PLANO_INDICACAO_CASHBACK_AFILIADOS.md`, porque tem números de margem, e este repositório é público.

Resumo do que ele cobre no site:

- **Fase 0:** conserta o que já existe — cupom com dono, `indicado_por`, "Meus cupons", consumo do cupom no orçamento,
  janela de atribuição e desconto do cupom levado ao ERP por item.
- **Faixas de preço** dentro de cada papel (Padrão, Gold, Platinum), com pré-análise na aprovação do cliente.
- **Carteira em R$** (razão `carteira_movimentos`), cupom pessoal de indicação e cashback com carência.
- **Uso do saldo** no checkout.
- **Saque Pix**, que vira contas a pagar no ERP sozinho, com corte às 14h.
- **Afiliados v2:** painel, metas, campanhas e multiplicadores.
- **Gamificação (21/10):** níveis com tema de corrida, conquistas, comemoração quando o cashback é liberado, missões,
  sequência mensal, ranking opcional e cartão de compartilhar o cupom — sempre dentro da trava de margem e de um teto mensal.

Regra deste repositório: **nenhum código de cupom, percentual de margem ou dado de cliente em migration ou seed.**

## Andamento no site

- **Fase 0 (21/10/2026):** implantada. O desconto do cupom vai ao NZERP rateado por item (`items[].desconto` +
  `desconto_cupom`, `api/_lib/pedido/precificar.ts`); o cadastro resolve o código `NZ-XXXXX` para o usuário do afiliado
  no gatilho (`migrations/2026-10-21_fase0_indicacao_consertos.sql`); cupom com dono só vale para o dono; "Meus cupons"
  lê pela rota (`op: meus-cupons`); o orçamento só reserva o uso do cupom (consumo no pagamento ou no faturamento,
  `pedidos.cupom_consumido_em`); a janela de atribuição vem do servidor; a comissão do afiliado é sem frete; o resgate de
  pontos fica fechado até a Fase 2. Teste: `npm run cupom:test`.
