// Contrato comum das transportadoras.
//
// A LOJA mostra PRAZO, nunca valor. As APIs de cotação (Jadlog, Gollog)
// devolvem prazo e preço no mesmo payload — o adapter é responsável por
// extrair só o prazo e devolver o `raw` apenas para diagnóstico no painel
// admin. O endpoint público jamais serializa `raw` na resposta.

export interface QuoteInput {
  cepOrigem: string;
  cepDestino: string;
  pesoKg: number;
  comprimentoCm: number;
  larguraCm: number;
  alturaCm: number;
  /** Valor declarado, exigido por algumas APIs. Não é exibido em lugar nenhum. */
  valorDeclarado?: number;
}

export interface QuoteResult {
  /** Dias úteis de transporte, sem o manuseio da NZ (somado pelo endpoint). */
  dias: number;
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
