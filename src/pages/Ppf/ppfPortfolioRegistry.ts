// Registro das 6 linhas NZPPF para o portfolio em PDF.
//
// Casa a config de apresentacao (ppfPortfolioConfig.ts) com os dados reais de
// cada linha, que vivem nos modulos <linha>Data.ts — os mesmos consumidos
// pelas paginas. Nao ha segunda copia de ficha tecnica, benchmark,
// diferenciais nem acabamentos.
//
// A ordem do array e a ordem do catalogo completo: topo -> entrada ->
// linhas especificas.

import { PPF_PORTFOLIOS, type PpfPortfolioConfig } from './ppfPortfolioConfig';
import type { SpecRow, BenchmarkRow, DiferencialRow, FinishRow } from './PpfPortfolioDocument';

import * as luxury from './luxuryGlossData';
import * as prime from './primeGlossData';
import * as flow from './flowGlossData';
import * as core from './coreGlossData';
import * as headlight from './headlightData';
import * as windshield from './windshieldData';

export interface PortfolioLineEntry {
  config: PpfPortfolioConfig;
  tabelaTecnica: SpecRow[];
  benchmarkData: BenchmarkRow[];
  diferenciais: DiferencialRow[];
  finishes?: FinishRow[];
}

export const PPF_LINES: PortfolioLineEntry[] = [
  {
    config: PPF_PORTFOLIOS['luxury-gloss'],
    tabelaTecnica: luxury.tabelaTecnica,
    benchmarkData: luxury.benchmarkData,
    diferenciais: luxury.diferenciais,
    finishes: luxury.finishesCarousel,
  },
  {
    config: PPF_PORTFOLIOS['prime-gloss'],
    tabelaTecnica: prime.tabelaTecnica,
    benchmarkData: prime.benchmarkData,
    diferenciais: prime.diferenciais,
    finishes: prime.finishesData,
  },
  {
    config: PPF_PORTFOLIOS['flow-gloss'],
    tabelaTecnica: flow.tabelaTecnica,
    benchmarkData: flow.benchmarkData,
    diferenciais: flow.diferenciais,
    finishes: flow.finishesData,
  },
  {
    config: PPF_PORTFOLIOS['core-gloss'],
    tabelaTecnica: core.tabelaTecnica,
    benchmarkData: core.benchmarkData,
    diferenciais: core.diferenciais,
    finishes: core.finishesData,
  },
  {
    config: PPF_PORTFOLIOS['headlight'],
    tabelaTecnica: headlight.tabelaTecnica,
    benchmarkData: headlight.benchmarkData,
    diferenciais: headlight.diferenciais,
    finishes: headlight.tonalidades,
  },
  {
    config: PPF_PORTFOLIOS['windshield'],
    tabelaTecnica: windshield.tabelaTecnica,
    benchmarkData: windshield.benchmarkData,
    diferenciais: windshield.diferenciais,
    // Windshield nao tem acabamentos.
  },
];

export function getPortfolioLine(slug: string): PortfolioLineEntry | undefined {
  return PPF_LINES.find((l) => l.config.slug === slug);
}

/**
 * Paginas do portfolio de uma linha.
 *
 * 6 fixas — capa, manifesto, diferenciais, ficha, benchmark e contato —
 * mais tecnologia e acabamentos, que so existem nas linhas que tem esses
 * dados (Headlight nao tem camadas; Windshield tambem nao tem acabamentos).
 */
export function portfolioPageCount(entry: PortfolioLineEntry): number {
  const temAcabamentos = Boolean(
    entry.config.finishesTitle && entry.finishes && entry.finishes.length > 0
  );
  return 6 + (entry.config.tecnologia ? 1 : 0) + (temAcabamentos ? 1 : 0);
}

/**
 * Paginas do catalogo completo: capa geral + as secoes de todas as linhas
 * (cada uma sem a sua pagina de contato) + UMA pagina de contato no fim.
 */
export function catalogoPageCount(): number {
  return 1 + PPF_LINES.reduce((acc, l) => acc + portfolioPageCount(l) - 1, 0) + 1;
}

/** Nome de arquivo e titulo do catalogo com todas as linhas. */
export const CATALOGO_COMPLETO = {
  fileName: 'NZPPF_Catalogo_Completo.pdf',
  title: 'NZPPF — Portfólio Completo',
  tagline: 'As 6 linhas de proteção de pintura da NZ Distribuidora',
};
