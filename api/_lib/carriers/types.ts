// Contrato comum das transportadoras.
//
// As APIs de cotação (Jadlog, Gollog) devolvem prazo e preço no mesmo payload.
// O adapter extrai os dois; quem decide o que o browser enxerga é o endpoint:
// PRAZO para todo mundo, VALOR só para papel admin (api/_lib/handlers/prazo.ts).
// `raw` é diagnóstico do painel e nunca é serializado pelo endpoint público.

export interface QuoteInput {
  cepOrigem: string;
  cepDestino: string;
  /**
   * Peso a cobrar, em KG. JÁ é o maior entre peso real e peso cubado, e JÁ
   * está multiplicado pela quantidade — a doc da Jadlog (v2.3) é explícita:
   * "Sempre deverá ser informado o maior peso, entre o peso real e o peso
   * calculado (cubado)". A conta fica em carriers/cubagem.ts, uma só vez.
   */
  pesoKg: number;
  /** Volumes da remessa. Só informativo para adapters que cotam por volume. */
  quantidade: number;
  /**
   * Dimensões de UM volume, em cm. A cotação da Jadlog não aceita dimensão
   * (só o peso já cubado), mas outras transportadoras aceitam — por isso
   * continuam no contrato.
   */
  comprimentoCm: number;
  larguraCm: number;
  alturaCm: number;
  /** Valor declarado de NF, total da remessa. Exigido pela Jadlog. */
  valorDeclarado: number;
}

export interface QuoteResult {
  /** Dias úteis de transporte, sem o manuseio da NZ (somado pelo endpoint). */
  dias: number;
  /**
   * Valor total do frete em BRL, ou null quando a transportadora não devolve.
   * Chega até aqui de propósito: o filtro por papel é do endpoint, não do
   * adapter — assim o painel de diagnóstico admin sempre vê o número real.
   */
  valorTotal: number | null;
  modalidade?: string;
  /** Resposta crua da transportadora. SÓ para o painel de diagnóstico. */
  raw: unknown;
}

export interface CarrierAdapter {
  slug: 'jadlog' | 'gollog';
  nome: string;
  /** Há credencial no ambiente? O admin exibe isso como ✓/✗, nunca o valor. */
  isConfigured(): boolean;
  quoteDeadline(input: QuoteInput): Promise<QuoteResult>;
}

/** Erro de transportadora, para o endpoint distinguir de bug nosso. */
export class CarrierError extends Error {
  constructor(
    public readonly carrier: string,
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'CarrierError';
  }
}

/**
 * Timeout por transportadora. Uma API lenta não pode segurar a resposta da
 * página inteira — o endpoint usa Promise.allSettled e cada adapter se corta
 * sozinho aqui.
 */
export async function withTimeout<T>(promise: Promise<T>, ms: number, carrier: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new CarrierError(carrier, `Tempo esgotado após ${ms}ms`)),
          ms
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
