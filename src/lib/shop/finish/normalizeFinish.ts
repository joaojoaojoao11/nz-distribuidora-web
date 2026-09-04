// Normalização das 6 grafias de acabamento que existem no catálogo real.
//
// As fontes descrevem acabamento de jeitos incompatíveis:
//   nzwrapColors.ts       'Sólido/Metálico Brilhante', 'Metálico Fosco', 'Camaleão'
//   web_catalog_products  finish_type: 'Gloss'
//   metamarkMcxColors.ts  'matt-metallic' | 'satin-solid' | ...
//   metamark7Colors.ts    matt: boolean + transparent: boolean
//
// Todas convergem para o mesmo conjunto de tags planas.

import type { FinishId } from './tree';
import { normalize } from '../types';

export interface FinishResult {
  ids: FinishId[];
  /** Grafia original preservada, para exibir na ficha. */
  label: string | null;
}

/**
 * Regras cumulativas — uma string pode disparar várias.
 *
 * Nota sobre `br?ilh`: `sh_colors.json` tem 'Camaleão Bilhante' (sem o "r") em
 * produção. O "r" opcional cobre as duas grafias. Tolerar o typo aqui é mais
 * barato e mais seguro do que migrar o dado agora; corrigir o banco é outra
 * tarefa.
 *
 * Nota sobre `satin`: mapeia para 'acetinado' e NÃO adiciona 'fosco'. A
 * hierarquia é resolvida na consulta, não no dado — ver tree.ts.
 */
const RULES: { pattern: RegExp; id: FinishId }[] = [
  { pattern: /gloss|br?ilh/, id: 'brilhante' },
  { pattern: /mat+e?\b|matt|fosc/, id: 'fosco' },
  { pattern: /satin|aceti|cetim/, id: 'acetinado' },
  { pattern: /metal/, id: 'metalico' },
  { pattern: /camaleao|chameleon|color ?shift|colour ?shift|iridesc|flip/, id: 'camaleao' },
  { pattern: /chrom|crom/, id: 'cromado' },
  { pattern: /brush|escov/, id: 'escovado' },
  { pattern: /carbon/, id: 'carbono' },
  { pattern: /textur|grain|leather|couro/, id: 'texturizado' },
  { pattern: /transparen|clear/, id: 'transparente' },
  { pattern: /solid/, id: 'solido' },
  { pattern: /pearl|perol|nacar/, id: 'perolado' },
  { pattern: /reflet|reflect/, id: 'refletivo' },
];

export function normalizeFinishString(raw: string | null | undefined): FinishResult {
  if (!raw || !raw.trim()) return { ids: [], label: null };

  const text = normalize(raw);
  const ids: FinishId[] = [];
  for (const rule of RULES) {
    if (rule.pattern.test(text) && !ids.includes(rule.id)) ids.push(rule.id);
  }

  return { ids, label: raw.trim() };
}

/** MetaCast MCX: enum de 5 valores, cada um já combinando textura e brilho. */
export function finishFromMcx(finish: string, labelPt?: string): FinishResult {
  const map: Record<string, FinishId[]> = {
    'matt-metallic': ['metalico', 'fosco'],
    'gloss-metallic': ['metalico', 'brilhante'],
    'satin-metallic': ['metalico', 'acetinado'],
    'gloss-solid': ['solido', 'brilhante'],
    'satin-solid': ['solido', 'acetinado'],
  };
  return {
    ids: map[finish] ?? [],
    label: labelPt ? labelPt.charAt(0).toUpperCase() + labelPt.slice(1) : null,
  };
}

/** Metamark 7 Series: o acabamento vem de dois booleanos, não de uma string. */
export function finishFromM7(matt: boolean, transparent: boolean): FinishResult {
  const ids: FinishId[] = [matt ? 'fosco' : 'brilhante'];
  if (transparent) ids.push('transparente');
  return {
    ids,
    label: transparent ? (matt ? 'Fosco transparente' : 'Transparente') : matt ? 'Fosco' : 'Brilhante',
  };
}

/** Rótulo humano de um conjunto de tags, para chips e ficha técnica. */
export function describeFinishes(ids: readonly FinishId[], fallback: string | null): string | null {
  if (fallback) return fallback;
  if (!ids.length) return null;
  return ids.join(' · ');
}
