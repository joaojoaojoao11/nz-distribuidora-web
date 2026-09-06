// Adapter simulado — ATIVO POR PADRÃO enquanto não houver contrato com Jadlog,
// Gollog e Melhor Envio (LOGISTICA_MODO=mock).
//
// Existe para que banco, admin, endpoint e UI possam ser construídos e
// validados ponta a ponta sem depender do comercial fechar contrato. Trocar
// pelo adapter real é mudar uma variável de ambiente.
//
// O prazo e o valor simulados são derivados da faixa de CEP e do peso, para
// exercitar a UI com números plausíveis e variados — NÃO são estimativa
// comercial e não devem ser divulgados. O valor existe aqui porque a tela de
// admin passou a mostrar preço: sem ele, o caminho do valor só seria testável
// depois do contrato com a transportadora.

import type { CarrierAdapter, CarrierSlug, QuoteInput, QuoteResult } from './types.js';

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

function build(slug: CarrierSlug, nome: string, ajuste: number): CarrierAdapter {
  return {
    slug,
    nome,
    // O mock está sempre "configurado" — é justamente o ponto dele.
    isConfigured: () => true,
    async quoteDeadline(input: QuoteInput): Promise<QuoteResult> {
      const { dias, regiao } = prazoBase(input.cepDestino);
      // Volume alto pesa no prazo, para a UI exercitar o seletor de formato.
      const pesoExtra = input.pesoKg > 20 ? 1 : 0;
      const diasTotal = Math.max(1, dias + ajuste + pesoExtra);
      // Fórmula sem qualquer pretensão de realismo: uma base, um tanto por kg e
      // um tanto por dia de distância, só para o número variar como variaria de
      // verdade quando o CEP ou a quantidade mudam.
      const valor = Math.round((18 + input.pesoKg * 2.1 + diasTotal * 1.4) * 100) / 100;
      return {
        dias: diasTotal,
        valorTotal: valor,
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

/**
 * O mock do Melhor Envio devolve VÁRIOS serviços, porque é isso que a API real
 * faz — e porque o caminho de várias opções por transportadora precisa ser
 * exercitável sem credencial.
 *
 * O detalhe que importa: os rolos da NZ têm 152 cm de comprimento e os Correios
 * limitam o maior lado a 100 cm. Na API real esse serviço volta com `error` e é
 * descartado. O mock reproduz isso — some quando o volume é um rolo, aparece
 * quando cabe — para a tela ser testada nas duas situações.
 */
export const melhorEnvioMock: CarrierAdapter = {
  slug: 'melhorenvio',
  nome: 'Melhor Envio',
  isConfigured: () => true,
  async quoteDeadline(input: QuoteInput): Promise<QuoteResult[]> {
    const { dias, regiao } = prazoBase(input.cepDestino);
    const raw = {
      simulado: true,
      aviso: 'LOGISTICA_MODO=mock — nenhuma credencial de Melhor Envio configurada',
      regiao,
      entrada: input,
    };
    const preco = (fator: number, d: number) =>
      Math.round((18 + input.pesoKg * 2.1 + d * 1.4) * fator * 100) / 100;

    const opcoes: QuoteResult[] = [
      {
        dias: Math.max(1, dias + 1),
        valorTotal: preco(0.92, dias + 1),
        servico: '3',
        servicoNome: '.Package',
        transportadora: 'Jadlog',
        modalidade: 'Jadlog .Package (simulado)',
        raw,
      },
    ];

    // Correios: só entra quando o maior lado cabe em 100 cm.
    const maiorLado = Math.max(input.comprimentoCm, input.larguraCm, input.alturaCm);
    if (maiorLado <= 100) {
      opcoes.push({
        dias: Math.max(1, dias),
        valorTotal: preco(1.15, dias),
        servico: '2',
        servicoNome: 'SEDEX',
        transportadora: 'Correios',
        modalidade: 'Correios SEDEX (simulado)',
        raw,
      });
      opcoes.push({
        dias: Math.max(1, dias + 3),
        valorTotal: preco(0.8, dias + 3),
        servico: '1',
        servicoNome: 'PAC',
        transportadora: 'Correios',
        modalidade: 'Correios PAC (simulado)',
        raw,
      });
    }

    return opcoes;
  },
};
