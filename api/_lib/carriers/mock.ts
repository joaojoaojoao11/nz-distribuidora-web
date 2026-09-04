// Adapter simulado — ATIVO POR PADRÃO enquanto não houver contrato com Jadlog
// e Gollog (LOGISTICA_MODO=mock).
//
// Existe para que banco, admin, endpoint e UI possam ser construídos e
// validados ponta a ponta sem depender do comercial fechar contrato. Trocar
// pelo adapter real é mudar uma variável de ambiente.
//
// O prazo simulado é derivado da faixa de CEP e do peso, para exercitar a UI
// com números plausíveis e variados — não é estimativa comercial e não deve
// ser usado em produção com transportadora ativa.

import type { CarrierAdapter, QuoteInput, QuoteResult } from './types.js';

/** Faixas de CEP por região, com um prazo-base em dias úteis. */
const REGIOES: { max: number; label: string; base: number }[] = [
  { max: 19999, label: 'SP capital e interior', base: 1 },
  { max: 28999, label: 'RJ / ES', base: 2 },
  { max: 39999, label: 'MG', base: 2 },
  { max: 49999, label: 'BA / SE', base: 5 },
  { max: 56999, label: 'PE / AL / PB', base: 6 },
  { max: 63999, label: 'CE / PI / RN', base: 7 },
  { max: 65999, label: 'MA', base: 8 },
  { max: 68999, label: 'PA / AP / AM / RR / AC', base: 9 },
  { max: 69999, label: 'Norte', base: 10 },
  { max: 72799, label: 'DF / GO', base: 4 },
  { max: 78999, label: 'GO / TO / MT', base: 5 },
  { max: 79999, label: 'MS', base: 4 },
  { max: 87999, label: 'PR', base: 3 },
  { max: 89999, label: 'SC', base: 3 },
  { max: 99999, label: 'RS', base: 4 },
];

function prazoBase(cep: string): { dias: number; regiao: string } {
  const prefixo = Number(cep.slice(0, 5));
  const faixa = REGIOES.find((r) => prefixo <= r.max) ?? REGIOES[REGIOES.length - 1];
  return { dias: faixa.base, regiao: faixa.label };
}

function build(slug: 'jadlog' | 'gollog', nome: string, ajuste: number): CarrierAdapter {
  return {
    slug,
    nome,
    // O mock está sempre "configurado" — é justamente o ponto dele.
    isConfigured: () => true,
    async quoteDeadline(input: QuoteInput): Promise<QuoteResult> {
      const { dias, regiao } = prazoBase(input.cepDestino);
      // Volume alto pesa no prazo, para a UI exercitar o seletor de formato.
      const pesoExtra = input.pesoKg > 20 ? 1 : 0;
      return {
        dias: Math.max(1, dias + ajuste + pesoExtra),
        modalidade: slug === 'jadlog' ? '.Package (simulado)' : 'Standard (simulado)',
        raw: {
          simulado: true,
          aviso: 'LOGISTICA_MODO=mock — nenhum contrato de transportadora configurado',
          regiao,
          entrada: input,
        },
      };
    },
  };
}

export const jadlogMock = build('jadlog', 'Jadlog', 0);
export const gollogMock = build('gollog', 'Gollog', -1);
