// Regras puras do saque (Fase 4): chave Pix e vencimento do título. Sem rede,
// sem banco — testadas em scripts/test-incentivos.mjs.

import { normalizarDocumento, tipoDocumento } from '../conta/documento.js';

export type PixTipo = 'cpf_cnpj' | 'email' | 'telefone' | 'aleatoria';
export const PIX_TIPOS: PixTipo[] = ['cpf_cnpj', 'email', 'telefone', 'aleatoria'];

/** Normaliza e valida a chave Pix. Devolve a chave como deve ser gravada. */
export function validarChavePix(tipo: string, chaveBruta: string): { ok: true; tipo: PixTipo; chave: string } | { ok: false; motivo: string } {
  const chave = (chaveBruta ?? '').trim();
  if (!PIX_TIPOS.includes(tipo as PixTipo)) return { ok: false, motivo: 'tipo de chave inválido' };
  if (!chave) return { ok: false, motivo: 'informe a chave' };
  if (tipo === 'cpf_cnpj') {
    // CNPJ pode ter letras desde jul/2026 (12.ABC.345/01DE-35): a chave guarda as letras.
    const d = normalizarDocumento(chave);
    if (!tipoDocumento(d)) return { ok: false, motivo: 'CPF tem 11 dígitos; CNPJ, 14' };
    if (/^(.)\1+$/.test(d)) return { ok: false, motivo: 'documento inválido' };
    return { ok: true, tipo: 'cpf_cnpj', chave: d };
  }
  if (tipo === 'email') {
    const e = chave.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) || e.length > 120) return { ok: false, motivo: 'e-mail inválido' };
    return { ok: true, tipo: 'email', chave: e };
  }
  if (tipo === 'telefone') {
    const d = chave.replace(/\D/g, '');
    if (d.length < 10 || d.length > 13) return { ok: false, motivo: 'telefone com DDD (10 ou 11 dígitos)' };
    return { ok: true, tipo: 'telefone', chave: d.length <= 11 ? `+55${d}` : `+${d}` };
  }
  const a = chave.toLowerCase();
  if (!/^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/.test(a)) return { ok: false, motivo: 'chave aleatória tem 32 caracteres (com ou sem hífens)' };
  return { ok: true, tipo: 'aleatoria', chave: a };
}

/**
 * Vencimento do título: `diasUteis` dias úteis (seg–sex) depois do dia do
 * pedido em Brasília; pedido depois da hora de corte conta como do dia
 * seguinte (D8). Feriados não entram aqui: o financeiro ajusta na mão (Fase 4
 * mínima). Devolve 'AAAA-MM-DD'.
 */
export function calcularVencimentoSaque(agora: Date, diasUteis: number, horaCorte: string): string {
  const partes = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(agora);
  const pega = (t: string) => Number(partes.find((p) => p.type === t)?.value ?? '0');
  let dia = new Date(Date.UTC(pega('year'), pega('month') - 1, pega('day')));
  const minutos = (pega('hour') % 24) * 60 + pega('minute');
  const [hc, mc] = (/^\d{2}:\d{2}$/.test(horaCorte) ? horaCorte : '14:00').split(':').map(Number);
  let faltam = Math.max(0, Math.floor(Number(diasUteis) || 0)) + (minutos >= hc * 60 + mc ? 1 : 0);
  const util = (d: Date) => d.getUTCDay() !== 0 && d.getUTCDay() !== 6;
  while (faltam > 0) {
    dia = new Date(dia.getTime() + 86_400_000);
    if (util(dia)) faltam--;
  }
  while (!util(dia)) dia = new Date(dia.getTime() + 86_400_000);
  return dia.toISOString().slice(0, 10);
}
