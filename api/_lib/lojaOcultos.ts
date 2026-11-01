// Linhas comerciais que NÃO devem aparecer na loja.
//
// Trava de LINHA INTEIRA, para o caso em que a marca sai do portfólio e nem
// os produtos que o ERP criar amanhã devem aparecer. Esconder produto a
// produto é trabalho do cadastro (`produtos.oculto_manual`, editável no
// painel); esta lista é a exceção que também vale para o que ainda não existe.
//
// Correção de um comentário anterior meu: o sync NÃO sobrescreve produtos já
// cadastrados (`upsert ... ignoreDuplicates: true`), então a flag do banco é
// durável. O que ela não cobre é o SKU novo que o sync criar depois.

export const LINHAS_OCULTAS: ReadonlySet<string> = new Set([
  // NAR PPF — retirada da loja a pedido da NZ em 2026-09-07.
  'nar',
  // Avery Dennison — retirada do site a pedido da NZ em 2026-11-01. Anda junto
  // com AVERY_NO_SITE em src/lib/avery.ts (o /sign e o menu leem de lá).
  'avery',
  'avery-adpro',
]);

/** Avery no site: lido pelo /sign do render, pelo sitemap e pelas metas de rota. */
export const AVERY_NO_SITE = !LINHAS_OCULTAS.has('avery');

export function ehLinhaOculta(linhaKey: string | null | undefined): boolean {
  return LINHAS_OCULTAS.has(String(linhaKey ?? '').toLowerCase());
}

/**
 * O slug da loja começa pela linha (`avery-…`, `nar-…`). Serve ao render: quando
 * o banco não devolve o item por ele ser de linha oculta, o índice estático não
 * pode ressuscitá-lo como fallback.
 */
export function ehSlugDeLinhaOculta(slug: string): boolean {
  const s = slug.toLowerCase();
  for (const linha of LINHAS_OCULTAS) if (s.startsWith(`${linha}-`)) return true;
  return false;
}
