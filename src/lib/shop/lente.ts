// Cliente da Lente (busca por imagem): o que o navegador fala com
// /api/nz/lente, mais os dois utilitários de arrastar/colar que a barra de
// busca e o painel compartilham.
//
// A chamada ao servidor é ENRIQUECIMENTO. Com a flag `lente_ia_ativa`
// desligada o endpoint responde 204 e a busca segue só com a cor extraída no
// navegador; com erro ou demora, idem. Nada aqui pode travar a Lente.

import { COLOR_LABEL, SUBFAMILY_LABEL, type ColorFamilyId, type ColorSubfamilyId } from './color/lexicon';
import { isFinishId, type FinishId } from './finish/tree';
import { isPatternFamilyId, type PatternFamilyId } from './pattern/taxonomy';

/** Filtros que a leitura da foto pode preencher junto com a cor. */
export interface ExtrasDaLente {
  colors?: ColorFamilyId[];
  finishes?: FinishId[];
  patterns?: PatternFamilyId[];
}

export interface LeituraDaLente {
  /** `#rrggbb` ou null. */
  hexDominante: string | null;
  familias: ColorFamilyId[];
  subfamilias: ColorSubfamilyId[];
  tom: 'claro' | 'medio' | 'escuro' | null;
  acabamentos: FinishId[];
  familiaPadrao: PatternFamilyId | null;
  transparente: boolean;
  descricao: string;
  confianca: 'alta' | 'media' | 'baixa';
}

export type EstadoLeitura =
  | { estado: 'desligada' }
  | { estado: 'ok'; leitura: LeituraDaLente }
  | { estado: 'falhou'; motivo: string };

const TONS = new Set(['claro', 'medio', 'escuro']);
const CONFIANCAS = new Set(['alta', 'media', 'baixa']);

function lista(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

/**
 * O servidor já valida contra a taxonomia; validar de novo aqui é o que
 * garante que uma resposta velha em cache, ou um deploy fora de ordem, nunca
 * injete um id que a loja não conhece num filtro.
 */
export function sanearLeitura(j: Record<string, unknown>): LeituraDaLente {
  const hex = typeof j.hexDominante === 'string' ? j.hexDominante.trim().toLowerCase() : '';
  const tom = typeof j.tom === 'string' && TONS.has(j.tom) ? (j.tom as LeituraDaLente['tom']) : null;
  const padrao = typeof j.familiaPadrao === 'string' && isPatternFamilyId(j.familiaPadrao) ? j.familiaPadrao : null;
  return {
    hexDominante: /^#[0-9a-f]{6}$/.test(hex) ? hex : null,
    familias: lista(j.familias).filter((f): f is ColorFamilyId => f in COLOR_LABEL),
    subfamilias: lista(j.subfamilias).filter((s): s is ColorSubfamilyId => s in SUBFAMILY_LABEL),
    tom,
    acabamentos: lista(j.acabamentos).filter(isFinishId),
    familiaPadrao: padrao,
    transparente: j.transparente === true,
    descricao: typeof j.descricao === 'string' ? j.descricao.slice(0, 140) : '',
    confianca:
      typeof j.confianca === 'string' && CONFIANCAS.has(j.confianca)
        ? (j.confianca as LeituraDaLente['confianca'])
        : 'media',
  };
}

/**
 * Manda a foto (já reduzida, base64 sem prefixo) ao modelo de visão.
 * Nunca lança: todo caminho vira um `EstadoLeitura`.
 */
export async function interpretarImagem(
  base64: string,
  mime: 'image/jpeg' | 'image/png' | 'image/webp',
  timeoutMs = 9000
): Promise<EstadoLeitura> {
  try {
    const res = await fetch('/api/nz/lente', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ imagem: base64, mime }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (res.status === 204) return { estado: 'desligada' };
    if (!res.ok) return { estado: 'falhou', motivo: `http-${res.status}` };
    const j = (await res.json()) as Record<string, unknown>;
    return { estado: 'ok', leitura: sanearLeitura(j) };
  } catch (e) {
    return { estado: 'falhou', motivo: e instanceof Error ? e.name : 'erro' };
  }
}

/** Primeira imagem de um drop ou de um Ctrl+V. `null` se não houver. */
export function imagemDoDataTransfer(dt: DataTransfer | null): File | null {
  if (!dt) return null;
  for (const f of Array.from(dt.files ?? [])) {
    if (f.type.startsWith('image/')) return f;
  }
  for (const it of Array.from(dt.items ?? [])) {
    if (it.kind === 'file' && it.type.startsWith('image/')) {
      const f = it.getAsFile();
      if (f) return f;
    }
  }
  return null;
}

/** Durante o arrasto o navegador ainda não entrega os arquivos; só o tipo. */
export function dataTransferTemArquivo(dt: DataTransfer | null): boolean {
  return Boolean(dt && Array.from(dt.types ?? []).includes('Files'));
}
