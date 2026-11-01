// NZWRAP Premium no site. Desligado a pedido da NZ em 2026-11-01 ("por
// enquanto"): somem a página da linha, as 30 páginas de cor, o item do menu e
// da busca, o card da linha no /wrap e os 30 itens estáticos da loja. Nada foi
// apagado.
//
// Para trazer de volta: `true` aqui E tirar 'nzwrap' e 'nzwrap-import' de
// LINHAS_OCULTAS em api/_lib/lojaOcultos.ts (o edge runtime não importa de
// src/, então são duas chaves que andam juntas).
export const NZWRAP_PREMIUM_NO_SITE = false;
