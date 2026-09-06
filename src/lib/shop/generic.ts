// Controle central de itens da LOJA já revisados e placeholders branded por
// linha para todo o resto.
//
// Este módulo existe para não deixar item vazio na LOJA. Antes, itens da SH
// Wrapping sem foto customizada renderizavam swatch do hex; itens de Oracal,
// Etherna, Avery etc — coisas sem cor sólida — caíam num bloco tipográfico.
// Agora tem uma única foto genérica branded por linha, e um Set explícito das
// cores que já receberam foto customizada.
//
// A regra é simples:
//   - slug ∈ REVIEWED_SLUGS  → usa a foto customizada do mapa da linha
//   - slug ∉ REVIEWED_SLUGS  → cai no GENERIC_IMAGE_BY_LINE[lineKey]
//
// Assim as fotos que a gente gastou tempo aprovando ficam blindadas: mudanças
// no fallback nunca sobrescrevem uma revisada.

import type { LinhaErp } from './erp/mapa';

/**
 * Placeholder branded por linha. Uma imagem 1600x1200 com o nome da linha em
 * fundo escuro NZ. Preenche todo item que ainda não tem foto customizada.
 */
export const GENERIC_IMAGE_BY_LINE: Record<LinhaErp, string> = {
  etherna: '/assets/images/shop/generic/etherna.webp',
  'sh-decor': '/assets/images/shop/generic/sh-decor.webp',
  m7: '/assets/images/shop/generic/m7.webp',
  mcx: '/assets/images/shop/generic/mcx.webp',
  nzwrap: '/assets/images/shop/generic/nzwrap.webp',
  'oracal-651': '/assets/images/shop/generic/oracal-651.webp',
  'oracal-670': '/assets/images/shop/generic/oracal-670.webp',
  'sh-wrapping': '/assets/images/shop/generic/sh-wrapping.webp',
  avery: '/assets/images/shop/generic/avery.webp',
  md80: '/assets/images/shop/generic/md80.webp',
  ppf: '/assets/images/shop/generic/ppf.webp',
  'speed-wrapping': '/assets/images/shop/generic/speed-wrapping.webp',
  'nzwrap-import': '/assets/images/shop/generic/nzwrap-import.webp',
  nar: '/assets/images/shop/generic/nar.webp',
  next: '/assets/images/shop/generic/next.webp',
  'avery-adpro': '/assets/images/shop/generic/avery-adpro.webp',
  'nz-farol': '/assets/images/shop/generic/nz-farol.webp',
  diversos: '/assets/images/shop/generic/diversos.webp',
};

/** Fallback dos fallbacks. Se a lineKey não bater em nenhuma acima. */
export const GENERIC_IMAGE_DEFAULT = '/assets/images/shop/generic/default.webp';

/**
 * Slugs já revisados — receberam fotos customizadas aprovadas.
 * Chave = slug "cru" (sem prefixo `sh-`). O dbSnapshot usa direto; o erp
 * checa via helper que retira o prefixo.
 *
 * ADICIONAR AQUI toda vez que uma cor for aprovada e ganhar foto.
 */
export const REVIEWED_SLUGS: ReadonlySet<string> = new Set([
  // SH Wrapping — Colors (rolo + 3 carros)
  'paprika-orange',
  'glossy-black',
  'pearl-white',
  'sao-paulo-yellow',
  'soulmoving-red',
  'crystal-white',
  'bentley-pink',
  'crystal-mamba-green',
  'pearl-metal-black',
  'khaki-green',
  'combat-green',
  'crystal-glacial-blue',
  'mercury-silver',
  'somato-blue',
  'pearl-metal-white',
]);

/** Retorna o placeholder correto pra lineKey (ou o default). */
export function genericImageForLine(lineKey: string | null | undefined): string {
  if (!lineKey) return GENERIC_IMAGE_DEFAULT;
  return GENERIC_IMAGE_BY_LINE[lineKey as LinhaErp] ?? GENERIC_IMAGE_DEFAULT;
}

/** Slug revisado? Aceita raw (`paprika-orange`) ou prefixado (`sh-paprika-orange`). */
export function isReviewedSlug(slug: string): boolean {
  if (REVIEWED_SLUGS.has(slug)) return true;
  // ERP prefixa `sh-`, tira e tenta de novo.
  if (slug.startsWith('sh-') && REVIEWED_SLUGS.has(slug.slice(3))) return true;
  return false;
}
