// Adapter Jadlog.
//
// ⚠️ NÃO VERIFICADO CONTRA A API REAL. A Jadlog expõe a simulação de frete pelo
// portal do Embarcador, com token JWT vinculado ao contrato, e não publica
// documentação aberta e estável. O endpoint, o formato do corpo e os nomes dos
// campos abaixo refletem o formato conhecido dessa API, mas PRECISAM ser
// conferidos contra a documentação que vem com o contrato antes de ativar.
//
// Enquanto JADLOG_TOKEN não existir no ambiente, isConfigured() devolve false e
// o endpoint usa o mock. Nada aqui roda por acidente.

import { CarrierError, withTimeout, type CarrierAdapter, type QuoteInput, type QuoteResult } from './types.js';

const ENDPOINT =
  process.env.JADLOG_ENDPOINT || 'https://www.jadlog.com.br/embarcador/api/frete/valor';

const TIMEOUT_MS = 6000;

/** Modalidade Jadlog: 3 = .Package (padrão), 0 = .Com, 9 = .Package Centralizado. */
const MODALIDADE = Number(process.env.JADLOG_MODALIDADE || 3);

export const jadlog: CarrierAdapter = {
  slug: 'jadlog',
  nome: 'Jadlog',

  isConfigured() {
    return Boolean(process.env.JADLOG_TOKEN);
  },

  async quoteDeadline(input: QuoteInput): Promise<QuoteResult> {
    const token = process.env.JADLOG_TOKEN;
    if (!token) throw new CarrierError('jadlog', 'JADLOG_TOKEN não configurado');

    const body = {
      frete: [
        {
          cepori: input.cepOrigem,
          cepdes: input.cepDestino,
          peso: input.pesoKg,
          modalidade: MODALIDADE,
          tpentrega: 'D',
          tpseguro: 'N',
          vldeclarado: input.valorDeclarado ?? 100,
          vlcoleta: 0,
          // Cubagem: a Jadlog usa metros.
          cnpj: process.env.JADLOG_CNPJ || undefined,
          conta: process.env.JADLOG_CONTA || undefined,
          altura: input.alturaCm / 100,
          largura: input.larguraCm / 100,
          comprimento: input.comprimentoCm / 100,
        },
      ],
    };

    const res = await withTimeout(
      fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      }),
      TIMEOUT_MS,
      'jadlog'
    );

    if (!res.ok) {
      throw new CarrierError('jadlog', `HTTP ${res.status} ao consultar prazo`);
    }

    const json = (await res.json()) as {
      frete?: { prazo?: number; error?: string; erro?: string }[];
    };

    const primeiro = json.frete?.[0];
    if (!primeiro) throw new CarrierError('jadlog', 'Resposta sem cotação');
    if (primeiro.error || primeiro.erro) {
      throw new CarrierError('jadlog', String(primeiro.error || primeiro.erro));
    }
    if (typeof primeiro.prazo !== 'number') {
      throw new CarrierError('jadlog', 'Resposta sem campo de prazo');
    }

    // `raw` fica só para o painel de diagnóstico. O endpoint público descarta
    // esta chave junto com qualquer campo de valor que venha aqui dentro.
    return { dias: primeiro.prazo, modalidade: '.Package', raw: json };
  },
};
