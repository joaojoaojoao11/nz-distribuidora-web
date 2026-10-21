// Períodos da recorrência do afiliado (D25): mensal ou quinzenal, à escolha
// dele. A comissão de recorrência nasce "a liberar" e só fica disponível no
// FIM do período (mais a carência, se vier depois). Tudo no fuso de Brasília.

import type { Periodicidade } from './config.js';

const FUSO = 'America/Sao_Paulo';

/** Ano, mês e dia de uma data, no fuso de Brasília. */
export function partesBr(d: Date): { ano: number; mes: number; dia: number } {
  const s = d.toLocaleDateString('en-CA', { timeZone: FUSO }); // AAAA-MM-DD
  const [a, m, dd] = s.split('-').map(Number);
  return { ano: a, mes: m, dia: dd };
}

/** '2026-10' (mensal) ou '2026-10-Q1' / '2026-10-Q2' (quinzenal: 1–15 e 16–fim). */
export function chavePeriodo(d: Date, p: Periodicidade): string {
  const { ano, mes, dia } = partesBr(d);
  const base = `${ano}-${String(mes).padStart(2, '0')}`;
  if (p === 'quinzenal') return `${base}-${dia <= 15 ? 'Q1' : 'Q2'}`;
  return base;
}

/** Último instante do período que contém `d`: 23:59:59 do último dia, em Brasília (UTC−3). */
export function fimPeriodo(d: Date, p: Periodicidade): Date {
  const { ano, mes, dia } = partesBr(d);
  const ultimoDoMes = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  const fimDia = p === 'quinzenal' && dia <= 15 ? 15 : ultimoDoMes;
  // 23:59:59 em Brasília = 02:59:59 UTC do dia seguinte.
  return new Date(Date.UTC(ano, mes - 1, fimDia, 23 + 3, 59, 59));
}

/** Texto para a tela: "outubro/2026" ou "1ª quinzena de outubro/2026". */
export function rotuloPeriodo(chave: string): string {
  const m = /^(\d{4})-(\d{2})(?:-Q([12]))?$/.exec(chave);
  if (!m) return chave;
  const nomeMes = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 15)).toLocaleDateString('pt-BR', { month: 'long', timeZone: 'UTC' });
  const base = `${nomeMes}/${m[1]}`;
  if (m[3] === '1') return `1ª quinzena de ${base}`;
  if (m[3] === '2') return `2ª quinzena de ${base}`;
  return base;
}
