// Publicação AGENDADA de produto da loja (produtos.publicar_em).
//
// A vitrine pública já respeita a data na própria view (`loja_catalogo` =
// `loja_catalogo_completo` + `publicar_em <= now()`, migration
// 2026-10-17c_loja_vestuario.sql). Este helper é para quem lê a TABELA
// `produtos` direto — preço, estoque, compra, ocorrência, seleção — e por isso
// não passa pela view: sem ele, um slug agendado responderia preço e entraria
// num pedido antes da hora.
//
// Admin passa por cima (é a prévia antes do lançamento). Produto sem data
// (todos os rolos) nunca está agendado: nada muda para eles.

/** `true` se o produto tem data de publicação e ela ainda não chegou. */
export function estaAgendado(publicarEm: string | null | undefined, agora: Date = new Date()): boolean {
  if (!publicarEm) return false;
  const t = Date.parse(publicarEm);
  return Number.isFinite(t) && t > agora.getTime();
}

/** Unidade do ERP que vende por PEÇA (camiseta, ferramenta), não por metro. */
export function vendePorUnidade(unidadeErp: string | null | undefined): boolean {
  return (unidadeErp ?? '').trim().toUpperCase() === 'UN';
}
