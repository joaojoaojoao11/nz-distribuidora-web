// Adapter Gollog (GOL Log — carga aérea).
//
// ⚠️ NÃO VERIFICADO CONTRA A API REAL. A Gollog libera a API de cotação sob
// credencial de cliente e não publica documentação aberta. O endpoint e o
// formato abaixo precisam ser conferidos contra a documentação do contrato
// antes de ativar.
//
// Enquanto GOLLOG_USER/GOLLOG_PASSWORD não existirem no ambiente,
// isConfigured() devolve false e o endpoint usa o mock.

import { CarrierError, withTimeout, type CarrierAdapter, type QuoteInput, type QuoteResult } from './types.js';

const ENDPOINT = process.env.GOLLOG_ENDPOINT || 'https://api.gollog.com.br/cotacao';
const TIMEOUT_MS = 6000;

export const gollog: CarrierAdapter = {
  slug: 'gollog',
  nome: 'Gollog',

  isConfigured() {
    return Boolean(process.env.GOLLOG_USER && process.env.GOLLOG_PASSWORD);
  },

  async quoteDeadline(input: QuoteInput): Promise<QuoteResult> {
    const user = process.env.GOLLOG_USER;
    const password = process.env.GOLLOG_PASSWORD;
    if (!user || !password) {
      throw new CarrierError('gollog', 'GOLLOG_USER/GOLLOG_PASSWORD não configurados');
    }

    const res = await withTimeout(
      fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`,
        },
        body: JSON.stringify({
          cepOrigem: input.cepOrigem,
          cepDestino: input.cepDestino,
          peso: input.pesoKg,
          altura: input.alturaCm,
          largura: input.larguraCm,
          comprimento: input.comprimentoCm,
          valorMercadoria: input.valorDeclarado,
        }),
      }),
      TIMEOUT_MS,
      'gollog'
    );

    if (!res.ok) throw new CarrierError('gollog', `HTTP ${res.status} ao consultar prazo`);

    const json = (await res.json()) as {
      prazoEntrega?: number;
      prazo?: number;
      servico?: string;
      valorTotal?: number | string;
      valor?: number | string;
    };

    const dias = json.prazoEntrega ?? json.prazo;
    if (typeof dias !== 'number') throw new CarrierError('gollog', 'Resposta sem campo de prazo');

    // Nome do campo de valor é chute, como o resto deste adapter: se não vier
    // um número, devolve null e a UI simplesmente não mostra valor da Gollog.
    const valor = Number(json.valorTotal ?? json.valor);

    return {
      dias,
      valorTotal: Number.isFinite(valor) && valor > 0 ? valor : null,
      modalidade: json.servico ?? 'Standard',
      raw: json,
    };
  },
};
