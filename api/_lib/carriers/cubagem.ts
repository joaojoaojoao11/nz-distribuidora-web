// Peso taxável: o maior entre o peso real e o peso cubado.
//
// A regra é da transportadora, não nossa. A doc da Jadlog (v2.3, campo `peso`
// do simulador de frete) manda enviar "sempre o maior peso, entre o peso real e
// o peso calculado (cubado)" — e não aceita dimensões na cotação, então a
// cubagem é responsabilidade de quem integra. Um rolo de 1,60 m é leve e
// volumoso: cotar pelo peso real subestimaria o frete de quase todo o catálogo.
//
// Fica aqui, isolado, porque duas rotas precisam do mesmo número: /api/nz/prazo
// (público) e /api/nz/testar (diagnóstico admin, que mostra os dois pesos lado
// a lado para conferir a cobrança).

/** Divisor padrão: ≈300 kg/m³, praxe rodoviária. Aéreo costuma usar 6000. */
export const FATOR_CUBAGEM_PADRAO = 3333;

export interface DimensoesEmbalagem {
  peso_kg: number | string;
  comprimento_cm: number | string;
  largura_cm: number | string;
  altura_cm: number | string;
}

export interface PesoTaxavel {
  /** Peso real total (peso da embalagem × quantidade). */
  pesoReal: number;
  /** Peso cubado total (volume em cm³ ÷ fator × quantidade). */
  pesoCubado: number;
  /** O que vai para a transportadora: o maior dos dois. */
  pesoKg: number;
  fator: number;
}

/**
 * Divisor de cubagem da transportadora, tirado de shipping_carriers.config.
 * Fica no banco e não em variável de ambiente porque é número de contrato:
 * muda por negociação e o admin precisa trocar sem deploy.
 */
export function fatorCubagem(config: unknown): number {
  const bruto = (config as { fator_cubagem?: unknown } | null)?.fator_cubagem;
  const n = Number(bruto);
  return Number.isFinite(n) && n > 0 ? n : FATOR_CUBAGEM_PADRAO;
}

/** Arredonda em 3 casas: a Jadlog aceita double e o KG tem precisão de grama. */
function kg(valor: number): number {
  return Math.round(valor * 1000) / 1000;
}

export function pesoTaxavel(
  perfil: DimensoesEmbalagem,
  quantidade: number,
  fator: number
): PesoTaxavel {
  const qtd = Math.max(1, Math.floor(quantidade) || 1);
  const divisor = fator > 0 ? fator : FATOR_CUBAGEM_PADRAO;

  const pesoReal = kg(Number(perfil.peso_kg) * qtd);
  const volumeCm3 =
    Number(perfil.comprimento_cm) * Number(perfil.largura_cm) * Number(perfil.altura_cm);
  const pesoCubado = kg((volumeCm3 / divisor) * qtd);

  return {
    pesoReal,
    pesoCubado,
    pesoKg: Math.max(pesoReal, pesoCubado),
    fator: divisor,
  };
}
