// Linhas comerciais que NÃO devem aparecer na loja.
//
// A trava fica aqui, no servidor, e não num filtro de tela: os produtos do ERP
// são recriados a cada sync (5 min), então esconder no banco duraria até a
// próxima passada. Filtrando na leitura, a linha some do catálogo, da busca,
// das facetas e do SSR de uma vez só — e volta apagando uma linha desta lista.

export const LINHAS_OCULTAS: ReadonlySet<string> = new Set([
  // NAR PPF — retirada da loja a pedido da NZ em 2026-09-07.
  'nar',
]);

export function ehLinhaOculta(linhaKey: string | null | undefined): boolean {
  return LINHAS_OCULTAS.has(String(linhaKey ?? '').toLowerCase());
}
