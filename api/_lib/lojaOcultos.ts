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
]);

export function ehLinhaOculta(linhaKey: string | null | undefined): boolean {
  return LINHAS_OCULTAS.has(String(linhaKey ?? '').toLowerCase());
}
