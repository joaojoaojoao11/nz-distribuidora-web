// Seleção do conjunto de adapters ativos.
//
// LOGISTICA_MODO=real usa Jadlog/Gollog contra a API do contrato.
// Qualquer outro valor (inclusive ausente) usa o mock — o padrão seguro
// enquanto não há contrato: nenhuma chamada externa sai daqui por acidente.

import { gollog } from './gollog.js';
import { jadlog } from './jadlog.js';
import { gollogMock, jadlogMock } from './mock.js';
import type { CarrierAdapter } from './types.js';

export function isRealMode(): boolean {
  return process.env.LOGISTICA_MODO === 'real';
}

export function carrierAdapters(): Record<string, CarrierAdapter> {
  if (isRealMode()) {
    return { jadlog, gollog };
  }
  return { jadlog: jadlogMock, gollog: gollogMock };
}

export function getAdapter(slug: string): CarrierAdapter | undefined {
  return carrierAdapters()[slug];
}

/**
 * Diagnóstico para o painel: diz se a credencial existe, nunca qual é.
 * Mesmo padrão de `hasX: !!x` que api/cron/ai-writer.ts já usa.
 */
export function carrierConfigStatus(): { slug: string; configurada: boolean; modo: string }[] {
  const modo = isRealMode() ? 'real' : 'mock';
  return [
    { slug: 'jadlog', configurada: jadlog.isConfigured(), modo },
    { slug: 'gollog', configurada: gollog.isConfigured(), modo },
  ];
}
