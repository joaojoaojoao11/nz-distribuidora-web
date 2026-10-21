// Trava de margem (§5 do plano) — a regra única, só com percentuais.
//
//   (1 + a) × (1 − d) × (1 − t − c)  ≥  (1 − t − k)
//
//   a = acréscimo da faixa/tipo sobre o preço do ERP
//   d = desconto do cupom (fração do subtotal)
//   t = imposto (loja_config.imposto_pct)
//   k = comissão de vendedor embutida no preço (loja_config.comissao_embutida_pct)
//   c = cashback/comissão total do pedido (já com multiplicador)
//
// Uma venda do canal nunca pode render menos contribuição que a mesma venda no
// balcão. Quando passa, o incentivo é cortado até o teto; o desconto que o
// cliente viu no carrinho NUNCA muda depois. Custo e margem não entram aqui —
// é por isso que a conta pode rodar no site.

export interface EntradaTrava {
  /** acréscimo (%), ex.: 10 */
  acrescimoPct: number;
  /** desconto do cupom (%), ex.: 5 */
  descontoPct: number;
  /** imposto (%), ex.: 9.5 */
  impostoPct: number;
  /** comissão embutida (%), ex.: 2 */
  comissaoEmbutidaPct: number;
  /** incentivo pedido (%), ex.: 6 */
  incentivoPct: number;
}

export interface SaidaTrava {
  /** incentivo que passa (%), 2 casas */
  incentivoPct: number;
  /** teto que a trava permite (%), 2 casas (pode ser negativo = nada passa) */
  tetoPct: number;
  cortou: boolean;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Teto de incentivo (%) para esta venda. */
export function tetoIncentivoPct(e: Omit<EntradaTrava, 'incentivoPct'>): number {
  const a = Number(e.acrescimoPct) / 100;
  const d = Number(e.descontoPct) / 100;
  const t = Number(e.impostoPct) / 100;
  const k = Number(e.comissaoEmbutidaPct) / 100;
  const fator = (1 + a) * (1 - d);
  if (!(fator > 0)) return -100;
  // c_max = 1 − t − (1 − t − k) / ((1 + a)(1 − d))
  return r2((1 - t - (1 - t - k) / fator) * 100);
}

/** Aplica a trava: devolve o incentivo que passa. Nunca negativo. */
export function limitarIncentivo(e: EntradaTrava): SaidaTrava {
  const teto = tetoIncentivoPct(e);
  const pedido = r2(Math.max(0, Number(e.incentivoPct) || 0));
  if (pedido <= teto) return { incentivoPct: pedido, tetoPct: teto, cortou: false };
  return { incentivoPct: Math.max(0, teto), tetoPct: teto, cortou: true };
}
