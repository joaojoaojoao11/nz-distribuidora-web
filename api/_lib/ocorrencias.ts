// Central de erros e mudanças — a porta de escrita.
//
// Tudo que o site precisa contar para a equipe NZ passa por aqui: o sync
// avisando que um SKU está sem preço de atacado, um cliente informando que a
// foto está errada, o sync inteiro caindo. A tela é /admin/central.
//
// Duas garantias que este módulo dá e que os chamadores não precisam repetir:
//
//   1. DEDUPE. Uma ocorrência ABERTA por `chaveDedupe`. O sync bate a cada 5
//      minutos pelo webhook do ERP; sem isso, um SKU sem preço viraria 288
//      linhas por dia. Quem garante é o índice parcial
//      `ocorrencias_aberta_por_chave` — a corrida entre dois syncs simultâneos
//      morre no banco, não numa checagem em memória.
//
//   2. NUNCA DERRUBA O CHAMADOR. Falha ao registrar ocorrência é registrada no
//      console e engolida. O sync existe para espelhar catálogo; se o aviso
//      falhar, o espelho ainda tem que acontecer.
//
// Escrita só com service role: a tabela não tem policy de insert para
// `authenticated` (ver migrations/2026-09-11_central_ocorrencias.sql).

import type { Db } from './papel.js';

export type CategoriaOcorrencia = 'erro' | 'mudanca' | 'problema';

export type TipoOcorrencia =
  | 'preco-zerado'
  | 'sync-erro'
  | 'sku-novo'
  | 'sku-removido'
  | 'preco-mudou'
  | 'problema-produto';

export interface NovaOcorrencia {
  categoria: CategoriaOcorrencia;
  tipo: TipoOcorrencia;
  titulo: string;
  detalhe?: Record<string, unknown>;
  produtoSlug?: string | null;
  erpSku?: string | null;
  /** Sem chave, cada chamada abre uma linha nova (é o caso dos relatos). */
  chaveDedupe?: string | null;
  userId?: string | null;
  contato?: string | null;
  mensagem?: string | null;
  imagemPath?: string | null;
  url?: string | null;
  userAgent?: string | null;
  ipHash?: string | null;
}

export type ResultadoAbertura = 'aberta' | 'ja-existia' | 'falhou';

/**
 * Abre uma ocorrência. Se já houver uma ABERTA com a mesma `chaveDedupe`, não
 * faz nada e devolve 'ja-existia' — o conflito é detectado pelo índice único
 * parcial, então duas execuções simultâneas do sync não criam duas linhas.
 */
export async function abrirOcorrencia(site: Db, o: NovaOcorrencia): Promise<ResultadoAbertura> {
  try {
    const { error } = await site.from('ocorrencias').insert([
      {
        categoria: o.categoria,
        tipo: o.tipo,
        titulo: o.titulo.slice(0, 300),
        detalhe: o.detalhe ?? {},
        produto_slug: o.produtoSlug ?? null,
        erp_sku: o.erpSku ?? null,
        chave_dedupe: o.chaveDedupe ?? null,
        user_id: o.userId ?? null,
        contato: o.contato ?? null,
        mensagem: o.mensagem ?? null,
        imagem_path: o.imagemPath ?? null,
        url: o.url ?? null,
        user_agent: o.userAgent ? o.userAgent.slice(0, 400) : null,
        ip_hash: o.ipHash ?? null,
      },
    ]);
    if (!error) return 'aberta';
    // 23505 = unique_violation: já existe uma aberta com esta chave. É o
    // caminho normal, não erro.
    if (error.code === '23505') return 'ja-existia';
    console.warn('[ocorrencias] insert falhou:', error.message);
    return 'falhou';
  } catch (err) {
    console.warn('[ocorrencias] insert falhou:', err instanceof Error ? err.message : err);
    return 'falhou';
  }
}

/**
 * Fecha as abertas de uma chave. É como o sync desfaz o que ele mesmo abriu:
 * o atacado chegou no ERP, então a queixa "atacado zerado" não é mais verdade.
 * Devolve quantas fechou.
 */
export async function resolverPorChave(site: Db, chave: string, nota: string): Promise<number> {
  try {
    const { data, error } = await site
      .from('ocorrencias')
      .update({ status: 'resolvida', resolvido_em: new Date().toISOString(), nota_resolucao: nota })
      .eq('chave_dedupe', chave)
      .eq('status', 'aberta')
      .select('id');
    if (error) {
      console.warn('[ocorrencias] resolver falhou:', error.message);
      return 0;
    }
    return (data ?? []).length;
  } catch (err) {
    console.warn('[ocorrencias] resolver falhou:', err instanceof Error ? err.message : err);
    return 0;
  }
}

/** Versão em lote do `resolverPorChave` — uma query para N chaves. */
export async function resolverVariasChaves(site: Db, chaves: string[], nota: string): Promise<number> {
  if (!chaves.length) return 0;
  try {
    const { data, error } = await site
      .from('ocorrencias')
      .update({ status: 'resolvida', resolvido_em: new Date().toISOString(), nota_resolucao: nota })
      .in('chave_dedupe', chaves)
      .eq('status', 'aberta')
      .select('id');
    if (error) {
      console.warn('[ocorrencias] resolver em lote falhou:', error.message);
      return 0;
    }
    return (data ?? []).length;
  } catch (err) {
    console.warn('[ocorrencias] resolver em lote falhou:', err instanceof Error ? err.message : err);
    return 0;
  }
}

/** As chaves já abertas de um conjunto — evita N inserts que só dariam 23505. */
export async function chavesAbertas(site: Db, prefixo: string): Promise<Set<string>> {
  try {
    const { data, error } = await site
      .from('ocorrencias')
      .select('chave_dedupe')
      .eq('status', 'aberta')
      .like('chave_dedupe', `${prefixo}%`);
    if (error) return new Set();
    return new Set(((data ?? []) as { chave_dedupe: string | null }[]).map((r) => r.chave_dedupe).filter((c): c is string => Boolean(c)));
  } catch {
    return new Set();
  }
}
