// Configuração do programa de indicação/cashback/afiliados — um lugar só.
//
// Tudo vem de `loja_config` (Admin → Afiliados / Cupons / Super cupons). O que
// não estiver gravado cai no PADRÃO abaixo, que é FICTÍCIO: o João faz as
// contas e acerta na tela (decisão de 21/10/2026). Os números da trava de
// margem (imposto e comissão embutida) não têm padrão: sem eles, a trava não
// corta nada — e o admin vê o aviso.

import type { Db } from '../papel.js';

export type Periodicidade = 'mensal' | 'quinzenal';

export interface ConfigIncentivos {
  /** Super cupom: desconto para quem compra (%). */
  pctDescontoIndicado: number;
  /** Super cupom: cashback para quem indicou (%). */
  pctCashbackIndicador: number;
  /** Afiliado: comissão da 1ª compra faturada do filiado (%). */
  pctAtivacaoAfiliado: number;
  /** Afiliado: comissão das compras seguintes (%). */
  pctRecorrenciaAfiliado: number;
  /** Desconto que o cupom do afiliado dá ao filiado (%). D27: opcional. */
  descontoCupomAfiliadoPct: number;
  /** Carência entre o faturamento e o "disponível" (D3). */
  diasLiberacao: number;
  /** Validade do saldo a partir de "disponível" (D11). */
  mesesValidade: number;
  saqueMinimo: number;
  saqueHoraCorte: string;
  /** t e k da trava (§5). Nulos = trava não roda. */
  impostoPct: number | null;
  comissaoEmbutidaPct: number | null;
  travaAtiva: boolean;
  linhasExcluidas: string[];
  periodicidadePadrao: Periodicidade;
  superCupomAtivo: boolean;
  /** Teto mensal dos prêmios em dinheiro da gamificação (D18). Nulo = sem prêmio em dinheiro. */
  tetoMensalPremios: number | null;
  diasAtribuicao: number;
  /** D29: pedido cancelado devolve a conquista que ele gerou (se o fato caiu) e estorna o bônus dela. */
  estornarConquistaCancelamento: boolean;
  /** Fase 3: o checkout oferece "Usar meu saldo". */
  saldoNoCheckout: boolean;
  /** Fase 3: menor cobrança que o Asaas aceita (R$); o restante após o saldo nunca fica abaixo. */
  cobrancaMinima: number;
}

export const CONFIG_PADRAO: ConfigIncentivos = {
  pctDescontoIndicado: 5,
  pctCashbackIndicador: 3,
  pctAtivacaoAfiliado: 10,
  pctRecorrenciaAfiliado: 3,
  descontoCupomAfiliadoPct: 0,
  diasLiberacao: 7,
  mesesValidade: 12,
  saqueMinimo: 50,
  saqueHoraCorte: '14:00',
  impostoPct: null,
  comissaoEmbutidaPct: null,
  travaAtiva: false,
  linhasExcluidas: [],
  periodicidadePadrao: 'mensal',
  superCupomAtivo: true,
  tetoMensalPremios: null,
  diasAtribuicao: 30,
  estornarConquistaCancelamento: true,
  saldoNoCheckout: true,
  cobrancaMinima: 5,
};

export const COLUNAS_CONFIG =
  'pct_desconto_indicado, pct_cashback_indicador, pct_ativacao_afiliado, pct_recorrencia_afiliado, desconto_cupom_afiliado_pct, dias_liberacao_cashback, meses_validade_cashback, saque_minimo, saque_hora_corte, imposto_pct, comissao_embutida_pct, trava_margem_ativa, linhas_excluidas, periodicidade_padrao, super_cupom_ativo, teto_mensal_premios, dias_atribuicao, estornar_conquista_cancelamento, saldo_no_checkout, cobranca_minima';

const num = (v: unknown, padrao: number): number => (v == null || v === '' || !Number.isFinite(Number(v)) ? padrao : Number(v));
const numOuNulo = (v: unknown): number | null => (v == null || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));

export function montarConfig(row: Record<string, unknown> | null | undefined): ConfigIncentivos {
  const r = row ?? {};
  return {
    pctDescontoIndicado: num(r.pct_desconto_indicado, CONFIG_PADRAO.pctDescontoIndicado),
    pctCashbackIndicador: num(r.pct_cashback_indicador, CONFIG_PADRAO.pctCashbackIndicador),
    pctAtivacaoAfiliado: num(r.pct_ativacao_afiliado, CONFIG_PADRAO.pctAtivacaoAfiliado),
    pctRecorrenciaAfiliado: num(r.pct_recorrencia_afiliado, CONFIG_PADRAO.pctRecorrenciaAfiliado),
    descontoCupomAfiliadoPct: num(r.desconto_cupom_afiliado_pct, CONFIG_PADRAO.descontoCupomAfiliadoPct),
    diasLiberacao: Math.max(0, Math.floor(num(r.dias_liberacao_cashback, CONFIG_PADRAO.diasLiberacao))),
    mesesValidade: Math.max(1, Math.floor(num(r.meses_validade_cashback, CONFIG_PADRAO.mesesValidade))),
    saqueMinimo: num(r.saque_minimo, CONFIG_PADRAO.saqueMinimo),
    saqueHoraCorte: typeof r.saque_hora_corte === 'string' && /^\d{2}:\d{2}$/.test(r.saque_hora_corte) ? r.saque_hora_corte : CONFIG_PADRAO.saqueHoraCorte,
    impostoPct: numOuNulo(r.imposto_pct),
    comissaoEmbutidaPct: numOuNulo(r.comissao_embutida_pct),
    travaAtiva: r.trava_margem_ativa === true,
    linhasExcluidas: Array.isArray(r.linhas_excluidas) ? (r.linhas_excluidas as unknown[]).map(String) : [],
    periodicidadePadrao: r.periodicidade_padrao === 'quinzenal' ? 'quinzenal' : 'mensal',
    superCupomAtivo: r.super_cupom_ativo !== false,
    tetoMensalPremios: numOuNulo(r.teto_mensal_premios),
    diasAtribuicao: Math.max(1, Math.floor(num(r.dias_atribuicao, CONFIG_PADRAO.diasAtribuicao))),
    estornarConquistaCancelamento: r.estornar_conquista_cancelamento !== false,
    saldoNoCheckout: r.saldo_no_checkout !== false,
    cobrancaMinima: Math.max(0, num(r.cobranca_minima, CONFIG_PADRAO.cobrancaMinima)),
  };
}

/** Lê a configuração. Falhou? Padrão — o programa nunca derruba o site. */
export async function carregarConfigIncentivos(site: Db): Promise<ConfigIncentivos> {
  try {
    const { data, error } = await site.from('loja_config').select(COLUNAS_CONFIG).eq('id', 1).maybeSingle();
    if (error) throw error;
    return montarConfig(data as Record<string, unknown> | null);
  } catch (err) {
    console.warn('[incentivos] config não carregou; usando o padrão:', err instanceof Error ? err.message : err);
    return { ...CONFIG_PADRAO };
  }
}
