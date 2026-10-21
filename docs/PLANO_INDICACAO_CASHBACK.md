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
- **Fase 1 (21/10/2026):** implantada. Faixas de preço dentro do tipo de acesso (`faixas_preco`, `precos_acesso.faixa_id`,
  `user_profiles.faixa_id`; regra em `api/_lib/precos/regraAcesso.ts`: produto > linha > geral da faixa, senão a regra do
  tipo; a base é a do tipo); seletor e gestão de faixas em `/admin/precos/:papel` (uma faixa pode ter um único cliente);
  faixa escolhida na aprovação em `/admin/clientes`, com a etiqueta "indicação de NZ-XXXXX" e a pré-análise do consultor
  (`pre_analises`); o e-mail de aprovação diz a faixa; o nome da faixa é espelhado no cliente do NZERP (só leitura lá).
  Percentuais das faixas NÃO ficam no repositório. Teste: `npm run precos:test`.
- **Fase 2 (21/10/2026):** implantada. Carteira em R$ (`carteira_movimentos`, razão; escrita só pelo servidor; o
  cliente lê pela rota, com o indicado por número), super cupom (um por cliente, 1 compra por indicado, só conta nova),
  cupom nominal, filiação permanente pelo cupom do afiliado, comissão de ativação e de recorrência (mensal/quinzenal),
  trava de margem (desligada até os números serem confirmados), carência e validade do saldo, cron de
  liberação/expiração, estorno em cancelamento, resgate de pontos virando crédito. Motor em `api/_lib/incentivos/`,
  rota `/api/nz/incentivos`. Admin: `/admin/afiliados` (+ `/admin/afiliados/:userId`), `/admin/cupons`,
  `/admin/super-cupons`, com as peças de `src/pages/Admin/comuns/`. Painel: `/painel/indique` refeito (nível,
  saldo, super cupom, afiliado, momentos, conquistas, comemoração, extrato). Percentuais, bônus e multiplicadores
  NÃO ficam no repositório. Teste: `npm run incentivos:test`.
