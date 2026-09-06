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
  'liquid-metal-somato-blue',
  'pearl-metal-white',
  'pearl-metal-space-grey',
  // SH Wrapping — Colors (só rolo, sem galeria ainda)
  'amg-grey',
  'amg-mountain-grey',
  'blue-charm-green',
  'candy-purple-gloss-aluminium',
  'crystal-champagne-gold',
  'crystal-silver',
  'crystal-yellow',
  'fantastic-green-grey',
  'fantastic-purple',
  'glossy-nado-ash',
  'matt-dark-purple',
  'pearl-metal-sakura-pink',
  'pearl-metal-tiffany',
  'space-blue-gloss-aluminium',
  // Oracal 670RA — Colors (24 cores, só rolo)
  'white-g',
  'yellow-g',
  'brimstone-yellow-g',
  'dark-red-g',
  'red-g',
  'light-red-g',
  'pastel-orange-g',
  'violet-m',
  'orange-red-g',
  'light-blue-g',
  'mint-g',
  'ice-blue-g',
  'dark-green-m',
  'yellow-green-g',
  'turquoise-g',
  'black-g',
  'black-m',
  'light-grey-g',
  'dark-grey-g',
  'dark-grey-m',
  'telegrey-g',
  'telegrey-m',
  'sky-blue-m',
  'deep-sea-blue-g',
  // Oracal 651 — 62 cores (só rolo). Slug do DB é `oracal-651-<color>`;
  // isReviewedSlug tira o prefixo `oracal-651-` e checa contra estas chaves raw.
  'transparent',
  'signal-yellow',
  'golden-yellow',
  'yellow',
  'light-yellow',
  'cream',
  'brimstone-yellow',
  'purple-red',
  'dark-red',
  'red',
  'light-red',
  'orange',
  'pastel-orange',
  'light-orange',
  'violet',
  'pink',
  'lilac',
  'lavender',
  'soft-pink',
  'orange-red',
  'king-blue',
  'dark-blue',
  'gentian-blue',
  'azure-blue',
  'turquoise',
  'mint',
  'ice-blue',
  'traffic-blue',
  'dark-green',
  'green',
  'light-green',
  'lime-tree-green',
  'yellow-green',
  'cobalt-blue',
  'turquoise-blue',
  'blue',
  'grass-green',
  'black',
  'grey',
  'light-grey',
  'dark-grey',
  'middle-grey',
  'telegrey',
  'brown',
  'light-brown',
  'beige',
  'nut-brown',
  'sky-blue',
  'brilliant-blue',
  'silver-grey',
  'gold',
  'copper',
  'gentian',
  'burgundy',
  'coral',
  'purple',
  'steel-blue',
  'deep-sea-blue',
  'forest-green',
  'imitation-gold',
  // 'white' e 'light-blue' já estão implicitamente cobertos porque o DB slug do
  // Oracal 651 white é `oracal-651-white` e do light-blue é `oracal-651-light-blue`.
  // Adicionamos abaixo, sabendo que não colidem com nenhum slug SH/Oracal 670:
  'white',
  'light-blue',
]);

/**
 * Fotos de rolo MetaCast MCX geradas por IA (Nano Banana 2, img2img a partir do
 * template METACAST MCX / METAMARK aprovado). Um webp 1600x1600 por slug — tubete
 * de papelão com paper label ORAFOL substituído por METAMARK "Premium Cast
 * Automotive Colour Wrap Films", logo METACAST MCX no canto superior esquerdo.
 *
 * Slug = mesmo `c.slug` da tabela MCX_COLORS (`mcx-51-miami-blue` etc.).
 * Convenção de arquivo: `public/assets/images/shop/metamark-mcx/{slug}.webp`.
 */
export const MCX_ROLL_IMAGES: Record<string, string> = {
  'mcx-00-simply-white': '/assets/images/shop/metamark-mcx/mcx-00-simply-white.webp',
  'mcx-10-jet-black': '/assets/images/shop/metamark-mcx/mcx-10-jet-black.webp',
  'mcx-12-gotham-black': '/assets/images/shop/metamark-mcx/mcx-12-gotham-black.webp',
  'mcx-22-chalk-grey': '/assets/images/shop/metamark-mcx/mcx-22-chalk-grey.webp',
  'mcx-26-nardo-grey': '/assets/images/shop/metamark-mcx/mcx-26-nardo-grey.webp',
  'mcx-28-cafe-racer': '/assets/images/shop/metamark-mcx/mcx-28-cafe-racer.webp',
  'mcx-35-modena-yellow': '/assets/images/shop/metamark-mcx/mcx-35-modena-yellow.webp',
  'mcx-36-monza-yellow': '/assets/images/shop/metamark-mcx/mcx-36-monza-yellow.webp',
  'mcx-38-venturi-orange': '/assets/images/shop/metamark-mcx/mcx-38-venturi-orange.webp',
  'mcx-39-firefox': '/assets/images/shop/metamark-mcx/mcx-39-firefox.webp',
  'mcx-46-volcano-red': '/assets/images/shop/metamark-mcx/mcx-46-volcano-red.webp',
  'mcx-48-cooper-red': '/assets/images/shop/metamark-mcx/mcx-48-cooper-red.webp',
  'mcx-49-maranello-red': '/assets/images/shop/metamark-mcx/mcx-49-maranello-red.webp',
  'mcx-51-miami-blue': '/assets/images/shop/metamark-mcx/mcx-51-miami-blue.webp',
  'mcx-52-mexico-blue': '/assets/images/shop/metamark-mcx/mcx-52-mexico-blue.webp',
  'mcx-54-bavarian-blue': '/assets/images/shop/metamark-mcx/mcx-54-bavarian-blue.webp',
  'mcx-56-icon-blue': '/assets/images/shop/metamark-mcx/mcx-56-icon-blue.webp',
  'mcx-57-yacht-blue': '/assets/images/shop/metamark-mcx/mcx-57-yacht-blue.webp',
  'mcx-58-lapis-blue': '/assets/images/shop/metamark-mcx/mcx-58-lapis-blue.webp',
  'mcx-59-blue-abyss': '/assets/images/shop/metamark-mcx/mcx-59-blue-abyss.webp',
  'mcx-60-sub-lime': '/assets/images/shop/metamark-mcx/mcx-60-sub-lime.webp',
  'mcx-61-atomic-green': '/assets/images/shop/metamark-mcx/mcx-61-atomic-green.webp',
  'mcx-62-viper-green': '/assets/images/shop/metamark-mcx/mcx-62-viper-green.webp',
  'mcx-63-speed-green': '/assets/images/shop/metamark-mcx/mcx-63-speed-green.webp',
  'mcx-65-carbon-green': '/assets/images/shop/metamark-mcx/mcx-65-carbon-green.webp',
  'mcx-66-army-olive': '/assets/images/shop/metamark-mcx/mcx-66-army-olive.webp',
  'mcx-67-bullitt-green': '/assets/images/shop/metamark-mcx/mcx-67-bullitt-green.webp',
  'mcx-68-chimera-green': '/assets/images/shop/metamark-mcx/mcx-68-chimera-green.webp',
  'mcx-73-capri-bronze': '/assets/images/shop/metamark-mcx/mcx-73-capri-bronze.webp',
  'mcx-84-electric-storm': '/assets/images/shop/metamark-mcx/mcx-84-electric-storm.webp',
  'mcx-86-nightlife': '/assets/images/shop/metamark-mcx/mcx-86-nightlife.webp',
  'mcx-87-plum-crazy': '/assets/images/shop/metamark-mcx/mcx-87-plum-crazy.webp',
  'mcx-94-pure-iridium': '/assets/images/shop/metamark-mcx/mcx-94-pure-iridium.webp',
  'mcx-96-urban-steel': '/assets/images/shop/metamark-mcx/mcx-96-urban-steel.webp',
  'mcx-97-carbon-steel': '/assets/images/shop/metamark-mcx/mcx-97-carbon-steel.webp',
  'mcx-98-blizzard-stone': '/assets/images/shop/metamark-mcx/mcx-98-blizzard-stone.webp',
  'mcx-99-obsidian-black': '/assets/images/shop/metamark-mcx/mcx-99-obsidian-black.webp',
};

/**
 * Fotos de rolo Metamark 7 Series geradas por IA (Nano Banana 2, img2img a partir
 * do template METAMARK 7 SERIES aprovado). Um webp 1600x1600 por slug — tubete de
 * papelão com paper label METAMARK premium ("M7 · 7 SERIES · Cutting & Signage
 * Polymeric PVC Film · 70 micras · Polymeric PVC · 8 Year Durability") no interior
 * e logo METAMARK 7 SERIES no canto superior esquerdo.
 *
 * Slug = mesmo `c.slug` da tabela M7_COLORS (`m7-100-white-gloss` etc.).
 * Convenção de arquivo: `public/assets/images/shop/metamark-7/{slug}.webp`.
 *
 * 86/92 mapeados. Os 6 sem foto ainda (m7-105-clear, m7-111m-black-matt,
 * m7-112-tangerine, m7-115-cornflour, m7-118-reflex-blue, m7-127-ash-grey) caem
 * no fallback null → chip default.
 */
export const M7_ROLL_IMAGES: Record<string, string> = {
  'm7-100-white-gloss': '/assets/images/shop/metamark-7/m7-100-white-gloss.webp',
  'm7-101m-white-matt': '/assets/images/shop/metamark-7/m7-101m-white-matt.webp',
  'm7-102-grape': '/assets/images/shop/metamark-7/m7-102-grape.webp',
  'm7-103-clay': '/assets/images/shop/metamark-7/m7-103-clay.webp',
  'm7-104-azure-blue': '/assets/images/shop/metamark-7/m7-104-azure-blue.webp',
  'm7-107-fire-orange': '/assets/images/shop/metamark-7/m7-107-fire-orange.webp',
  'm7-108-imitation-gold': '/assets/images/shop/metamark-7/m7-108-imitation-gold.webp',
  'm7-109-chiltern-white': '/assets/images/shop/metamark-7/m7-109-chiltern-white.webp',
  'm7-110-black-gloss': '/assets/images/shop/metamark-7/m7-110-black-gloss.webp',
  'm7-113-burnt-orange': '/assets/images/shop/metamark-7/m7-113-burnt-orange.webp',
  'm7-114-maroon': '/assets/images/shop/metamark-7/m7-114-maroon.webp',
  'm7-116-admiral': '/assets/images/shop/metamark-7/m7-116-admiral.webp',
  'm7-117-oxford': '/assets/images/shop/metamark-7/m7-117-oxford.webp',
  'm7-119-prussian': '/assets/images/shop/metamark-7/m7-119-prussian.webp',
  'm7-120-pewter': '/assets/images/shop/metamark-7/m7-120-pewter.webp',
  'm7-121-light-grey': '/assets/images/shop/metamark-7/m7-121-light-grey.webp',
  'm7-122-pale-grey': '/assets/images/shop/metamark-7/m7-122-pale-grey.webp',
  'm7-123-medium-grey': '/assets/images/shop/metamark-7/m7-123-medium-grey.webp',
  'm7-124-dark-grey': '/assets/images/shop/metamark-7/m7-124-dark-grey.webp',
  'm7-125-nimbus-grey': '/assets/images/shop/metamark-7/m7-125-nimbus-grey.webp',
  'm7-126-storm-grey': '/assets/images/shop/metamark-7/m7-126-storm-grey.webp',
  'm7-128-shadow': '/assets/images/shop/metamark-7/m7-128-shadow.webp',
  'm7-129-ochre': '/assets/images/shop/metamark-7/m7-129-ochre.webp',
  'm7-130-lemon': '/assets/images/shop/metamark-7/m7-130-lemon.webp',
  'm7-131-sunflower': '/assets/images/shop/metamark-7/m7-131-sunflower.webp',
  'm7-132-medium-yellow': '/assets/images/shop/metamark-7/m7-132-medium-yellow.webp',
  'm7-134-marigold': '/assets/images/shop/metamark-7/m7-134-marigold.webp',
  'm7-135-apricot': '/assets/images/shop/metamark-7/m7-135-apricot.webp',
  'm7-136-bright-yellow': '/assets/images/shop/metamark-7/m7-136-bright-yellow.webp',
  'm7-138-saffron': '/assets/images/shop/metamark-7/m7-138-saffron.webp',
  'm7-139-pumpkin': '/assets/images/shop/metamark-7/m7-139-pumpkin.webp',
  'm7-140-poppy': '/assets/images/shop/metamark-7/m7-140-poppy.webp',
  'm7-141-flame-red': '/assets/images/shop/metamark-7/m7-141-flame-red.webp',
  'm7-142-tomato': '/assets/images/shop/metamark-7/m7-142-tomato.webp',
  'm7-143-cherry': '/assets/images/shop/metamark-7/m7-143-cherry.webp',
  'm7-144-medium-red': '/assets/images/shop/metamark-7/m7-144-medium-red.webp',
  'm7-145-burgundy': '/assets/images/shop/metamark-7/m7-145-burgundy.webp',
  'm7-146-ruby': '/assets/images/shop/metamark-7/m7-146-ruby.webp',
  'm7-147-rose': '/assets/images/shop/metamark-7/m7-147-rose.webp',
  'm7-148-deep-red': '/assets/images/shop/metamark-7/m7-148-deep-red.webp',
  'm7-149-crimson': '/assets/images/shop/metamark-7/m7-149-crimson.webp',
  'm7-150-pale-blue': '/assets/images/shop/metamark-7/m7-150-pale-blue.webp',
  'm7-151-olympic': '/assets/images/shop/metamark-7/m7-151-olympic.webp',
  'm7-152-ocean': '/assets/images/shop/metamark-7/m7-152-ocean.webp',
  'm7-154-mid-blue': '/assets/images/shop/metamark-7/m7-154-mid-blue.webp',
  'm7-155-ultramarine': '/assets/images/shop/metamark-7/m7-155-ultramarine.webp',
  'm7-156-navy': '/assets/images/shop/metamark-7/m7-156-navy.webp',
  'm7-157-midnight': '/assets/images/shop/metamark-7/m7-157-midnight.webp',
  'm7-158-bright-blue': '/assets/images/shop/metamark-7/m7-158-bright-blue.webp',
  'm7-159-sky-blue': '/assets/images/shop/metamark-7/m7-159-sky-blue.webp',
  'm7-160-lime': '/assets/images/shop/metamark-7/m7-160-lime.webp',
  'm7-161-grass': '/assets/images/shop/metamark-7/m7-161-grass.webp',
  'm7-162-emerald': '/assets/images/shop/metamark-7/m7-162-emerald.webp',
  'm7-163-mid-green': '/assets/images/shop/metamark-7/m7-163-mid-green.webp',
  'm7-164-forest': '/assets/images/shop/metamark-7/m7-164-forest.webp',
  'm7-165-teal': '/assets/images/shop/metamark-7/m7-165-teal.webp',
  'm7-166-turquoise': '/assets/images/shop/metamark-7/m7-166-turquoise.webp',
  'm7-167-poseidon': '/assets/images/shop/metamark-7/m7-167-poseidon.webp',
  'm7-168-deep-lagoon': '/assets/images/shop/metamark-7/m7-168-deep-lagoon.webp',
  'm7-169-hunter': '/assets/images/shop/metamark-7/m7-169-hunter.webp',
  'm7-170-powder-blue': '/assets/images/shop/metamark-7/m7-170-powder-blue.webp',
  'm7-171-brown': '/assets/images/shop/metamark-7/m7-171-brown.webp',
  'm7-174-burnt-sienna': '/assets/images/shop/metamark-7/m7-174-burnt-sienna.webp',
  'm7-175-shortbread': '/assets/images/shop/metamark-7/m7-175-shortbread.webp',
  'm7-176-ivory': '/assets/images/shop/metamark-7/m7-176-ivory.webp',
  'm7-178-viking': '/assets/images/shop/metamark-7/m7-178-viking.webp',
  'm7-179-peach-blossom': '/assets/images/shop/metamark-7/m7-179-peach-blossom.webp',
  'm7-180-lilac': '/assets/images/shop/metamark-7/m7-180-lilac.webp',
  'm7-181-pink': '/assets/images/shop/metamark-7/m7-181-pink.webp',
  'm7-182-magenta': '/assets/images/shop/metamark-7/m7-182-magenta.webp',
  'm7-183-violet': '/assets/images/shop/metamark-7/m7-183-violet.webp',
  'm7-185-dark-navy': '/assets/images/shop/metamark-7/m7-185-dark-navy.webp',
  'm7-186-lavender': '/assets/images/shop/metamark-7/m7-186-lavender.webp',
  'm7-187-dark-violet': '/assets/images/shop/metamark-7/m7-187-dark-violet.webp',
  'm7-188-aquamarine': '/assets/images/shop/metamark-7/m7-188-aquamarine.webp',
  'm7-189-jungle-green': '/assets/images/shop/metamark-7/m7-189-jungle-green.webp',
  'm7-190-silver': '/assets/images/shop/metamark-7/m7-190-silver.webp',
  'm7-191-gold': '/assets/images/shop/metamark-7/m7-191-gold.webp',
  'm7-192-charcoal': '/assets/images/shop/metamark-7/m7-192-charcoal.webp',
  'm7-193m-gunmetal': '/assets/images/shop/metamark-7/m7-193m-gunmetal.webp',
  'm7-194-steel': '/assets/images/shop/metamark-7/m7-194-steel.webp',
  'm7-195-aluminium': '/assets/images/shop/metamark-7/m7-195-aluminium.webp',
  'm7-196-graphite': '/assets/images/shop/metamark-7/m7-196-graphite.webp',
  'm7-197-grasshopper': '/assets/images/shop/metamark-7/m7-197-grasshopper.webp',
  'm7-198-nature': '/assets/images/shop/metamark-7/m7-198-nature.webp',
  'm7-199-apple': '/assets/images/shop/metamark-7/m7-199-apple.webp',
};

/**
 * Fotos de rolo por slug, de todas as linhas que já têm. O adapter do ERP — que
 * é o caminho de produção — consulta por aqui, e não mapa a mapa: foi assim que
 * a MetaCast MCX ficou semanas com a foto só em dev, porque o mapa vivia
 * exclusivamente no adapter estático. Linha nova entra nesta lista e vale nos
 * dois caminhos de uma vez.
 */
const ROLL_IMAGE_MAPS: ReadonlyArray<Record<string, string>> = [MCX_ROLL_IMAGES, M7_ROLL_IMAGES];

/** Foto de rolo para o slug, se alguma linha tiver. */
export function rollImageFor(slug: string): string | undefined {
  for (const mapa of ROLL_IMAGE_MAPS) {
    const url = mapa[slug];
    if (url) return url;
  }
  return undefined;
}

/** Retorna o placeholder correto pra lineKey (ou o default). */
export function genericImageForLine(lineKey: string | null | undefined): string {
  if (!lineKey) return GENERIC_IMAGE_DEFAULT;
  return GENERIC_IMAGE_BY_LINE[lineKey as LinhaErp] ?? GENERIC_IMAGE_DEFAULT;
}

/**
 * Slug revisado? Aceita raw (`paprika-orange`) ou prefixado (`sh-paprika-orange`,
 * `oracal-670-black-g`, etc). O adapter ERP e o `shopSlug()` do bundle estático
 * usam prefixo por linha, então a gente aceita os dois formatos.
 */
export function isReviewedSlug(slug: string): boolean {
  if (REVIEWED_SLUGS.has(slug)) return true;
  const PREFIXES = ['sh-', 'oracal-670-', 'oracal-651-'];
  for (const p of PREFIXES) {
    if (slug.startsWith(p) && REVIEWED_SLUGS.has(slug.slice(p.length))) return true;
  }
  return false;
}
