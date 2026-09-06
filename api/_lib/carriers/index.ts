// Seleção do conjunto de adapters ativos.
//
// LOGISTICA_MODO=real usa Jadlog/Gollog/Melhor Envio contra as APIs reais.
// Qualquer outro valor (inclusive ausente) usa o mock — o padrão seguro
// enquanto não há credencial: nenhuma chamada externa sai daqui por acidente.

import { gollog } from './gollog.js';
import { jadlog } from './jadlog.js';
import { melhorenvio } from './melhorenvio.js';
import { gollogMock, jadlogMock, melhorEnvioMock } from './mock.js';
import type { CarrierAdapter } from './types.js';

/**
 * Fonte única das transportadoras conhecidas: o adapter real e o simulado, lado
 * a lado. Adicionar transportadora é acrescentar uma linha aqui — os três
 * consumidores abaixo derivam desta tabela e não têm lista própria.
 */
const REGISTRO: { real: CarrierAdapter; mock: CarrierAdapter }[] = [
  { real: jadlog, mock: jadlogMock },
  { real: gollog, mock: gollogMock },
  { real: melhorenvio, mock: melhorEnvioMock },
];

export function isRealMode(): boolean {
  return process.env.LOGISTICA_MODO === 'real';
}

export function carrierAdapters(): Record<string, CarrierAdapter> {
  const real = isRealMode();
  return Object.fromEntries(REGISTRO.map((r) => [r.real.slug, real ? r.real : r.mock]));
}

export function getAdapter(slug: string): CarrierAdapter | undefined {
  return carrierAdapters()[slug];
}

/**
 * Diagnóstico para o painel: diz se a credencial existe, nunca qual é.
 * Mesmo padrão de `hasX: !!x` que api/cron/ai-writer.ts já usa.
 *
 * Consulta sempre o adapter REAL, mesmo em modo mock: a pergunta é "a variável
 * de ambiente está lá?", e o mock responderia sempre que sim.
 */
export function carrierConfigStatus(): {
  slug: string;
  configurada: boolean;
  modo: string;
  tokenExpiraEm?: string | null;
}[] {
  const modo = isRealMode() ? 'real' : 'mock';
  return REGISTRO.map((r) => {
    const status: { slug: string; configurada: boolean; modo: string; tokenExpiraEm?: string | null } = {
      slug: r.real.slug,
      configurada: r.real.isConfigured(),
      modo,
    };
    // O token do Melhor Envio é um JWT com validade de 30 dias e sem renovação
    // automática (integração por token pessoal). O painel precisa avisar antes
    // de quebrar — a data sai do próprio token, sem chamar a API e sem nunca
    // devolver o token.
    if (r.real.slug === 'melhorenvio') {
      status.tokenExpiraEm = validadeDoJwt(process.env.MELHORENVIO_TOKEN);
    }
    return status;
  });
}

/** `exp` do payload de um JWT, em ISO. null quando não dá para ler. */
export function validadeDoJwt(token: string | undefined): string | null {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { exp?: number };
    if (!json.exp || !Number.isFinite(json.exp)) return null;
    return new Date(json.exp * 1000).toISOString();
  } catch {
    return null;
  }
}
