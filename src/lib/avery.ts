// Avery Dennison no site. Desligado a pedido da NZ em 2026-11-01: somem o
// bloco e as 6 famílias do /sign, os itens editoriais da loja, o menu e os
// textos que citam a marca. Nada foi apagado.
//
// Para trazer de volta: `true` aqui E tirar 'avery' e 'avery-adpro' de
// LINHAS_OCULTAS em api/_lib/lojaOcultos.ts (o edge runtime não importa de
// src/, então são duas chaves que andam juntas).
export const AVERY_NO_SITE = false;
