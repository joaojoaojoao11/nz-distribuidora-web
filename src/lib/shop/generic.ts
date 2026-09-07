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
import { SH_COLORS_ASSETS } from '../data/shWrappingAssets';

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
 * Slug = mesmo `c.slug` da tabela M7_COLORS (`m7-100-white-gloss` etc.) OU
 * slug do ERP (`metamark-7-almond-meta7172` etc.) para SKUs que existem so no
 * banco (variantes de largura, cores legado do Metamark 5 renomeadas para 7).
 *
 * 99 entradas: 92 cores oficiais + 7 SKUs adicionais do ERP.
 * Cobre 100% dos 93 itens Metamark 7 Series da loja (m7-XXX estatico + 7 slugs
 * de ERP; total > 93 porque alguns codigos aparecem em ambos caminhos).
 */
export const M7_ROLL_IMAGES: Record<string, string> = {
  'm7-100-white-gloss': '/assets/images/shop/metamark-7/m7-100-white-gloss.webp',
  'm7-101m-white-matt': '/assets/images/shop/metamark-7/m7-101m-white-matt.webp',
  'm7-102-grape': '/assets/images/shop/metamark-7/m7-102-grape.webp',
  'm7-103-clay': '/assets/images/shop/metamark-7/m7-103-clay.webp',
  'm7-104-azure-blue': '/assets/images/shop/metamark-7/m7-104-azure-blue.webp',
  'm7-105-clear': '/assets/images/shop/metamark-7/m7-105-clear.webp',
  'm7-107-fire-orange': '/assets/images/shop/metamark-7/m7-107-fire-orange.webp',
  'm7-108-imitation-gold': '/assets/images/shop/metamark-7/m7-108-imitation-gold.webp',
  'm7-109-chiltern-white': '/assets/images/shop/metamark-7/m7-109-chiltern-white.webp',
  'm7-110-black-gloss': '/assets/images/shop/metamark-7/m7-110-black-gloss.webp',
  'm7-111m-black-matt': '/assets/images/shop/metamark-7/m7-111m-black-matt.webp',
  'm7-112-tangerine': '/assets/images/shop/metamark-7/m7-112-tangerine.webp',
  'm7-113-burnt-orange': '/assets/images/shop/metamark-7/m7-113-burnt-orange.webp',
  'm7-114-maroon': '/assets/images/shop/metamark-7/m7-114-maroon.webp',
  'm7-115-cornflour': '/assets/images/shop/metamark-7/m7-115-cornflour.webp',
  'm7-116-admiral': '/assets/images/shop/metamark-7/m7-116-admiral.webp',
  'm7-117-oxford': '/assets/images/shop/metamark-7/m7-117-oxford.webp',
  'm7-118-reflex-blue': '/assets/images/shop/metamark-7/m7-118-reflex-blue.webp',
  'm7-119-prussian': '/assets/images/shop/metamark-7/m7-119-prussian.webp',
  'm7-120-pewter': '/assets/images/shop/metamark-7/m7-120-pewter.webp',
  'm7-121-light-grey': '/assets/images/shop/metamark-7/m7-121-light-grey.webp',
  'm7-122-pale-grey': '/assets/images/shop/metamark-7/m7-122-pale-grey.webp',
  'm7-123-medium-grey': '/assets/images/shop/metamark-7/m7-123-medium-grey.webp',
  'm7-124-dark-grey': '/assets/images/shop/metamark-7/m7-124-dark-grey.webp',
  'm7-125-nimbus-grey': '/assets/images/shop/metamark-7/m7-125-nimbus-grey.webp',
  'm7-126-storm-grey': '/assets/images/shop/metamark-7/m7-126-storm-grey.webp',
  'm7-127-ash-grey': '/assets/images/shop/metamark-7/m7-127-ash-grey.webp',
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
  // SKUs adicionais do ERP (7 ALMOND, EGGSHELL, MARINA, MAUVE, MELON, NATURE,
  // TRAFFIC) — codigos META7137/172/173/177/184/153A/198A que nao estao no
  // color chart oficial das 92 cores, mas existem no cadastro do banco.
  // Slug formato ERP: `metamark-7-<nome>-<sku>`.
  'metamark-7-almond-meta7172': '/assets/images/shop/metamark-7/metamark-7-almond-meta7172.webp',
  'metamark-7-eggshell-meta7177': '/assets/images/shop/metamark-7/metamark-7-eggshell-meta7177.webp',
  'metamark-7-marina-meta7153a': '/assets/images/shop/metamark-7/metamark-7-marina-meta7153a.webp',
  'metamark-7-mauve-meta7184': '/assets/images/shop/metamark-7/metamark-7-mauve-meta7184.webp',
  'metamark-7-melon-meta7137': '/assets/images/shop/metamark-7/metamark-7-melon-meta7137.webp',
  'metamark-7-nature-meta7198a': '/assets/images/shop/metamark-7/metamark-7-nature-meta7198a.webp',
  'metamark-7-traffic-meta7173': '/assets/images/shop/metamark-7/metamark-7-traffic-meta7173.webp',
};

/**
 * Fotos de rolo Speed Wrapping geradas por IA (Nano Banana 2, img2img a partir
 * do template Speed Wrapping aprovado). Um webp 1200x1200 por slug — tubete PET
 * liso preto polido, logo SPEED WRAPPING oficial (vermelho+branco) no canto
 * superior esquerdo, fundo branco.
 *
 * Slug = mesmo `slug` do banco (produtos.slug), sempre no formato
 * `speed-wrapping-<linha>-<num>-<nome>-spw<linha><num>`.
 *
 * Metadata por linha SW (material/liner/textura) fica em
 * `src/lib/data/speedWrappingLines.ts` — usar de referência quando gerar novas
 * linhas.
 *
 * Linha ESG (Super Gloss PET) — 37 cores. Material: PVC polimérico dupla camada,
 * liner PET transparente, superfície resinada lisa (sem casca de laranja), ultra
 * gloss mirror wet-look. Cores da 001 a 037.
 *
 * Linha EMA (Super Matte) — 17 cores. Material: PVC polimérico, acabamento
 * fosco velvet non-reflective simples (matte puro, sem wet-look, sem
 * reflexos especulares). Cores 001 a 017.
 *
 * Linha EGL (Chrome Gloss) — 12 cores. Material: PVC polimérico com paper
 * liner (kraft), superfície com textura casca de laranja (orange peel), tint
 * candy gloss translúcido brilhante (NÃO é chrome espelhado, apesar do nome
 * da linha; é candy paint look). Cores 001 a 012.
 *
 * Linha EGB (Gloss Básico) — 7 cores. Material: PVC polimérico entry-level
 * com paper liner (kraft), textura casca de laranja, cor sólida opaca
 * brilhante (solid gloss simples, sem candy translúcido, sem wet-look premium,
 * sem chrome). Versão econômica do ESG. Cores 001 a 007.
 *
 * Linha EMR (Chrome Mirror) — 11 cores. Material: PVC polimérico com paper
 * liner (kraft) e superfície de chrome espelhado real (mirror-polished), lisa
 * (sem orange peel, o mirror precisa de superfície suave). Cores 001-011 =
 * silver + 10 tints (red, blue, purple, orange, gold, rose, tiffany, bronze,
 * black, green). Esse é o chrome de verdade (diferente do EGL que apesar do
 * nome "Chrome Gloss" é candy translúcido).
 */
export const SW_ROLL_IMAGES: Record<string, string> = {
  // ESG — Super Gloss (37 cores)
  'speed-wrapping-esg-001-super-gloss-piano-black-pet-spwesg001':
    '/assets/images/shop/speed-wrapping/speed-wrapping-esg-001-super-gloss-piano-black-pet-spwesg001.webp',
  'speed-wrapping-esg-002-super-gloss-piano-white-pet-spwesg002':
    '/assets/images/shop/speed-wrapping/speed-wrapping-esg-002-super-gloss-piano-white-pet-spwesg002.webp',
  'speed-wrapping-esg-003-super-gloss-porsche-rouge-red-pet-spwesg003':
    '/assets/images/shop/speed-wrapping/speed-wrapping-esg-003-super-gloss-porsche-rouge-red-pet-spwesg003.webp',
  'speed-wrapping-esg-004-super-gloss-ferrari-red-pet-spwesg004':
    '/assets/images/shop/speed-wrapping/speed-wrapping-esg-004-super-gloss-ferrari-red-pet-spwesg004.webp',
  'speed-wrapping-esg-005-super-gloss-viper-green-pet-spwesg005':
    '/assets/images/shop/speed-wrapping/speed-wrapping-esg-005-super-gloss-viper-green-pet-spwesg005.webp',
  'speed-wrapping-esg-006-super-gloss-apple-green-pet-spwesg006':
    '/assets/images/shop/speed-wrapping/speed-wrapping-esg-006-super-gloss-apple-green-pet-spwesg006.webp',
  'speed-wrapping-esg-007-super-gloss-acid-green-pet-spwesg007':
    '/assets/images/shop/speed-wrapping/speed-wrapping-esg-007-super-gloss-acid-green-pet-spwesg007.webp',
  'speed-wrapping-esg-008-super-gloss-light-lime-green-pet-spwesg008':
    '/assets/images/shop/speed-wrapping/speed-wrapping-esg-008-super-gloss-light-lime-green-pet-spwesg008.webp',
  // ESG 009 tem typo no cadastro do banco ("saspphire") — preservamos o slug
  // exatamente como está pra que o lookup bata; renomear no banco seria trabalho
  // de correção do cadastro, não da foto.
  'speed-wrapping-esg-009-super-gloss-saspphire-pet-spwesg009':
    '/assets/images/shop/speed-wrapping/speed-wrapping-esg-009-super-gloss-saspphire-pet-spwesg009.webp',
  'speed-wrapping-esg-010-super-gloss-denim-blue-pet-spwesg010':
    '/assets/images/shop/speed-wrapping/speed-wrapping-esg-010-super-gloss-denim-blue-pet-spwesg010.webp',
  'speed-wrapping-esg-011-super-gloss-miami-blue-pet-spwesg011':
    '/assets/images/shop/speed-wrapping/speed-wrapping-esg-011-super-gloss-miami-blue-pet-spwesg011.webp',
  'speed-wrapping-esg-012-super-gloss-ice-cream-blue-pet-spwesg012':
    '/assets/images/shop/speed-wrapping/speed-wrapping-esg-012-super-gloss-ice-cream-blue-pet-spwesg012.webp',
  'speed-wrapping-esg-013-super-gloss-sky-blue-pet-spwesg013':
    '/assets/images/shop/speed-wrapping/speed-wrapping-esg-013-super-gloss-sky-blue-pet-spwesg013.webp',
  'speed-wrapping-esg-014-super-gloss-tiffany-pet-spwesg014':
    '/assets/images/shop/speed-wrapping/speed-wrapping-esg-014-super-gloss-tiffany-pet-spwesg014.webp',
  'speed-wrapping-esg-015-super-gloss-shark-blue-pet-spwesg015':
    '/assets/images/shop/speed-wrapping/speed-wrapping-esg-015-super-gloss-shark-blue-pet-spwesg015.webp',
  'speed-wrapping-esg-016-super-gloss-sunflower-yellow-pet-spwesg016':
    '/assets/images/shop/speed-wrapping/speed-wrapping-esg-016-super-gloss-sunflower-yellow-pet-spwesg016.webp',
  'speed-wrapping-esg-017-super-gloss-maize-yellow-pet-spwesg017':
    '/assets/images/shop/speed-wrapping/speed-wrapping-esg-017-super-gloss-maize-yellow-pet-spwesg017.webp',
  'speed-wrapping-esg-018-super-gloss-lemon-yellow-pet-spwesg018':
    '/assets/images/shop/speed-wrapping/speed-wrapping-esg-018-super-gloss-lemon-yellow-pet-spwesg018.webp',
  'speed-wrapping-esg-019-super-gloss-bright-orange-pet-spwesg019':
    '/assets/images/shop/speed-wrapping/speed-wrapping-esg-019-super-gloss-bright-orange-pet-spwesg019.webp',
  'speed-wrapping-esg-020-super-gloss-mclaren-orange-pet-spwesg020':
    '/assets/images/shop/speed-wrapping/speed-wrapping-esg-020-super-gloss-mclaren-orange-pet-spwesg020.webp',
  'speed-wrapping-esg-021-super-gloss-beetroot-red-pet-spwesg021':
    '/assets/images/shop/speed-wrapping/speed-wrapping-esg-021-super-gloss-beetroot-red-pet-spwesg021.webp',
  'speed-wrapping-esg-022-super-gloss-coral-orange-pet-spwesg022':
    '/assets/images/shop/speed-wrapping/speed-wrapping-esg-022-super-gloss-coral-orange-pet-spwesg022.webp',
  'speed-wrapping-esg-023-super-gloss-peach-pink-pet-spwesg023':
    '/assets/images/shop/speed-wrapping/speed-wrapping-esg-023-super-gloss-peach-pink-pet-spwesg023.webp',
  'speed-wrapping-esg-024-super-gloss-rouge-pink-pet-spwesg024':
    '/assets/images/shop/speed-wrapping/speed-wrapping-esg-024-super-gloss-rouge-pink-pet-spwesg024.webp',
  'speed-wrapping-esg-025-super-gloss-lavender-pet-spwesg025':
    '/assets/images/shop/speed-wrapping/speed-wrapping-esg-025-super-gloss-lavender-pet-spwesg025.webp',
  'speed-wrapping-esg-026-super-gloss-mist-blue-pet-spwesg026':
    '/assets/images/shop/speed-wrapping/speed-wrapping-esg-026-super-gloss-mist-blue-pet-spwesg026.webp',
  'speed-wrapping-esg-027-super-gloss-nardo-grey-pet-spwesg027':
    '/assets/images/shop/speed-wrapping/speed-wrapping-esg-027-super-gloss-nardo-grey-pet-spwesg027.webp',
  'speed-wrapping-esg-028-super-gloss-brooklyn-grey-pet-spwesg028':
    '/assets/images/shop/speed-wrapping/speed-wrapping-esg-028-super-gloss-brooklyn-grey-pet-spwesg028.webp',
  'speed-wrapping-esg-029-super-gloss-volcano-grey-pet-spwesg029':
    '/assets/images/shop/speed-wrapping/speed-wrapping-esg-029-super-gloss-volcano-grey-pet-spwesg029.webp',
  // ESG 030-032 e 034 nao tem sufixo "pet" no nome cadastrado.
  'speed-wrapping-esg-030-super-gloss-black-gem-red-spwesg030':
    '/assets/images/shop/speed-wrapping/speed-wrapping-esg-030-super-gloss-black-gem-red-spwesg030.webp',
  'speed-wrapping-esg-031-super-gloss-plum-magenta-spwesg031':
    '/assets/images/shop/speed-wrapping/speed-wrapping-esg-031-super-gloss-plum-magenta-spwesg031.webp',
  'speed-wrapping-esg-032-super-gloss-morganite-gem-red-spwesg032':
    '/assets/images/shop/speed-wrapping/speed-wrapping-esg-032-super-gloss-morganite-gem-red-spwesg032.webp',
  // ESG 033 tem typo no banco ("prosche" em vez de "porsche") — preservamos.
  'speed-wrapping-esg-033-super-gloss-prosche-spwesg033':
    '/assets/images/shop/speed-wrapping/speed-wrapping-esg-033-super-gloss-prosche-spwesg033.webp',
  'speed-wrapping-esg-034-super-gloss-piano-china-blue-spwesg034':
    '/assets/images/shop/speed-wrapping/speed-wrapping-esg-034-super-gloss-piano-china-blue-spwesg034.webp',
  'speed-wrapping-esg-035-super-gloss-racing-green-pet-spwesg035':
    '/assets/images/shop/speed-wrapping/speed-wrapping-esg-035-super-gloss-racing-green-pet-spwesg035.webp',
  'speed-wrapping-esg-036-super-gloss-armor-green-pet-spwesg036':
    '/assets/images/shop/speed-wrapping/speed-wrapping-esg-036-super-gloss-armor-green-pet-spwesg036.webp',
  'speed-wrapping-esg-037-super-gloss-khaki-grey-pet-spwesg037':
    '/assets/images/shop/speed-wrapping/speed-wrapping-esg-037-super-gloss-khaki-grey-pet-spwesg037.webp',
  // EMA — Super Matte (17 cores) — sem sufixo -pet (paper liner)
  'speed-wrapping-ema-001-matt-white-spwema001':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ema-001-matt-white-spwema001.webp',
  'speed-wrapping-ema-002-matt-black-spwema002':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ema-002-matt-black-spwema002.webp',
  'speed-wrapping-ema-003-matt-orange-spwema003':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ema-003-matt-orange-spwema003.webp',
  // ema-004 (Matt Yellow) fora: o arquivo gerado veio corrompido — nao tem
  // assinatura RIFF/WEBP e nenhum decodificador abre. Com a entrada aqui, o
  // card mostraria imagem quebrada; sem ela, cai no placeholder da linha.
  // Regerar a foto e reativar esta chave.
  'speed-wrapping-ema-005-matt-lemon-green-spwema005':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ema-005-matt-lemon-green-spwema005.webp',
  'speed-wrapping-ema-006-matt-apple-green-spwema006':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ema-006-matt-apple-green-spwema006.webp',
  'speed-wrapping-ema-007-matt-army-green-spwema007':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ema-007-matt-army-green-spwema007.webp',
  'speed-wrapping-ema-008-matt-tiffany-spwema008':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ema-008-matt-tiffany-spwema008.webp',
  'speed-wrapping-ema-009-matt-purple-spwema009':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ema-009-matt-purple-spwema009.webp',
  'speed-wrapping-ema-010-matt-light-blue-spwema010':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ema-010-matt-light-blue-spwema010.webp',
  'speed-wrapping-ema-011-matt-medium-blue-spwema011':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ema-011-matt-medium-blue-spwema011.webp',
  'speed-wrapping-ema-012-matt-pearl-blue-spwema012':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ema-012-matt-pearl-blue-spwema012.webp',
  'speed-wrapping-ema-013-matt-pink-spwema013':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ema-013-matt-pink-spwema013.webp',
  'speed-wrapping-ema-014-matt-rose-red-spwema014':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ema-014-matt-rose-red-spwema014.webp',
  'speed-wrapping-ema-015-matt-red-spwema015':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ema-015-matt-red-spwema015.webp',
  'speed-wrapping-ema-016-matt-gray-spwema016':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ema-016-matt-gray-spwema016.webp',
  'speed-wrapping-ema-017-matt-cement-gray-spwema017':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ema-017-matt-cement-gray-spwema017.webp',
  // EGL — Chrome Gloss (12 cores) — paper liner + orange peel + candy gloss
  'speed-wrapping-egl-001-chrome-gloss-silver-spwegl001':
    '/assets/images/shop/speed-wrapping/speed-wrapping-egl-001-chrome-gloss-silver-spwegl001.webp',
  'speed-wrapping-egl-002-chrome-gloss-grey-spwegl002':
    '/assets/images/shop/speed-wrapping/speed-wrapping-egl-002-chrome-gloss-grey-spwegl002.webp',
  'speed-wrapping-egl-003-chrome-gloss-red-spwegl003':
    '/assets/images/shop/speed-wrapping/speed-wrapping-egl-003-chrome-gloss-red-spwegl003.webp',
  'speed-wrapping-egl-004-chrome-gloss-rose-red-spwegl004':
    '/assets/images/shop/speed-wrapping/speed-wrapping-egl-004-chrome-gloss-rose-red-spwegl004.webp',
  'speed-wrapping-egl-005-chrome-gloss-pink-spwegl005':
    '/assets/images/shop/speed-wrapping/speed-wrapping-egl-005-chrome-gloss-pink-spwegl005.webp',
  'speed-wrapping-egl-006-chrome-gloss-purple-spwegl006':
    '/assets/images/shop/speed-wrapping/speed-wrapping-egl-006-chrome-gloss-purple-spwegl006.webp',
  'speed-wrapping-egl-007-chrome-gloss-orange-spwegl007':
    '/assets/images/shop/speed-wrapping/speed-wrapping-egl-007-chrome-gloss-orange-spwegl007.webp',
  'speed-wrapping-egl-008-chrome-gloss-gold-spwegl008':
    '/assets/images/shop/speed-wrapping/speed-wrapping-egl-008-chrome-gloss-gold-spwegl008.webp',
  'speed-wrapping-egl-009-chrome-gloss-green-spwegl009':
    '/assets/images/shop/speed-wrapping/speed-wrapping-egl-009-chrome-gloss-green-spwegl009.webp',
  'speed-wrapping-egl-010-chrome-gloss-tiffany-spwegl010':
    '/assets/images/shop/speed-wrapping/speed-wrapping-egl-010-chrome-gloss-tiffany-spwegl010.webp',
  'speed-wrapping-egl-011-chrome-gloss-blue-spwegl011':
    '/assets/images/shop/speed-wrapping/speed-wrapping-egl-011-chrome-gloss-blue-spwegl011.webp',
  'speed-wrapping-egl-012-chrome-gloss-light-blue-spwegl012':
    '/assets/images/shop/speed-wrapping/speed-wrapping-egl-012-chrome-gloss-light-blue-spwegl012.webp',
  // EGB — Gloss Basico (7 cores) — paper liner + orange peel + solid gloss opaco
  'speed-wrapping-egb-001-gloss-black-spwegb001':
    '/assets/images/shop/speed-wrapping/speed-wrapping-egb-001-gloss-black-spwegb001.webp',
  'speed-wrapping-egb-002-gloss-white-spwegb002':
    '/assets/images/shop/speed-wrapping/speed-wrapping-egb-002-gloss-white-spwegb002.webp',
  'speed-wrapping-egb-003-gloss-red-spwegb003':
    '/assets/images/shop/speed-wrapping/speed-wrapping-egb-003-gloss-red-spwegb003.webp',
  'speed-wrapping-egb-004-gloss-orange-spwegb004':
    '/assets/images/shop/speed-wrapping/speed-wrapping-egb-004-gloss-orange-spwegb004.webp',
  'speed-wrapping-egb-005-gloss-maize-yellow-spwegb005':
    '/assets/images/shop/speed-wrapping/speed-wrapping-egb-005-gloss-maize-yellow-spwegb005.webp',
  'speed-wrapping-egb-006-gloss-green-spwegb006':
    '/assets/images/shop/speed-wrapping/speed-wrapping-egb-006-gloss-green-spwegb006.webp',
  'speed-wrapping-egb-007-gloss-blue-spwegb007':
    '/assets/images/shop/speed-wrapping/speed-wrapping-egb-007-gloss-blue-spwegb007.webp',
  // EMR — Chrome Mirror (11 cores) — paper liner + smooth chrome mirror
  'speed-wrapping-emr-001-chrome-mirror-silver-spwemr001':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emr-001-chrome-mirror-silver-spwemr001.webp',
  'speed-wrapping-emr-002-chrome-mirror-red-spwemr002':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emr-002-chrome-mirror-red-spwemr002.webp',
  'speed-wrapping-emr-003-chrome-mirror-blue-spwemr003':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emr-003-chrome-mirror-blue-spwemr003.webp',
  'speed-wrapping-emr-004-chrome-mirror-purple-spwemr004':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emr-004-chrome-mirror-purple-spwemr004.webp',
  'speed-wrapping-emr-005-chrome-mirror-orange-spwemr005':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emr-005-chrome-mirror-orange-spwemr005.webp',
  'speed-wrapping-emr-006-chrome-mirror-gold-spwemr006':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emr-006-chrome-mirror-gold-spwemr006.webp',
  'speed-wrapping-emr-007-chrome-mirror-rose-spwemr007':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emr-007-chrome-mirror-rose-spwemr007.webp',
  'speed-wrapping-emr-008-chrome-mirror-tiffany-spwemr008':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emr-008-chrome-mirror-tiffany-spwemr008.webp',
  'speed-wrapping-emr-009-chrome-mirror-bronze-spwemr009':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emr-009-chrome-mirror-bronze-spwemr009.webp',
  'speed-wrapping-emr-010-chrome-mirror-black-spwemr010':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emr-010-chrome-mirror-black-spwemr010.webp',
  'speed-wrapping-emr-011-chrome-mirror-green-spwemr011':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emr-011-chrome-mirror-green-spwemr011.webp',
  // ECH — Chrome Matte (11 cores) — paper liner + chrome com acabamento matte
  // (pigmento metalico mas superficie difusa, sem espelho, similar a metal escovado)
  'speed-wrapping-ech-001-chrome-matte-gold-spwech001':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ech-001-chrome-matte-gold-spwech001.webp',
  'speed-wrapping-ech-002-chrome-matte-orange-spwech002':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ech-002-chrome-matte-orange-spwech002.webp',
  'speed-wrapping-ech-003-chrome-matte-red-spwech003':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ech-003-chrome-matte-red-spwech003.webp',
  'speed-wrapping-ech-004-chrome-matte-rose-red-spwech004':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ech-004-chrome-matte-rose-red-spwech004.webp',
  'speed-wrapping-ech-005-chrome-matte-brown-spwech005':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ech-005-chrome-matte-brown-spwech005.webp',
  'speed-wrapping-ech-006-chrome-matte-tiffany-spwech006':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ech-006-chrome-matte-tiffany-spwech006.webp',
  'speed-wrapping-ech-007-chrome-matte-blue-spwech007':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ech-007-chrome-matte-blue-spwech007.webp',
  'speed-wrapping-ech-008-chrome-matte-light-blue-spwech008':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ech-008-chrome-matte-light-blue-spwech008.webp',
  'speed-wrapping-ech-009-chrome-matte-green-spwech009':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ech-009-chrome-matte-green-spwech009.webp',
  'speed-wrapping-ech-010-chrome-matte-purple-spwech010':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ech-010-chrome-matte-purple-spwech010.webp',
  'speed-wrapping-ech-011-chrome-matte-black-spwech011':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ech-011-chrome-matte-black-spwech011.webp',
  // EOX — Oxide (4 cores) — PET liner + matte solid com carater oxidado/patinado
  // A CHAVE termina em `spwerw006`, nao `spweox001`: e o slug real do produto no
  // banco (o codigo do cadastro saiu de outra linha). O ARQUIVO segue com o nome
  // da geracao — chave e nome de arquivo nao precisam coincidir, e a chave e que
  // tem de bater com produtos.slug, senao a cor cai no placeholder.
  'speed-wrapping-eox-001-oxide-chrome-silver-pet-spwerw006':
    '/assets/images/shop/speed-wrapping/speed-wrapping-eox-001-oxide-chrome-silver-pet-spweox001.webp',
  'speed-wrapping-eox-002-oxide-red-pet-spweox002':
    '/assets/images/shop/speed-wrapping/speed-wrapping-eox-002-oxide-red-pet-spweox002.webp',
  'speed-wrapping-eox-003-oxide-ghost-venom-green-spweox003':
    '/assets/images/shop/speed-wrapping/speed-wrapping-eox-003-oxide-ghost-venom-green-spweox003.webp',
  'speed-wrapping-eox-004-oxide-dusk-purple-spweox004':
    '/assets/images/shop/speed-wrapping/speed-wrapping-eox-004-oxide-dusk-purple-spweox004.webp',
  // EDG — Metallic (23 cores) — PET liner + pigmento metalico solido gloss wet-look
  'speed-wrapping-edg-001-metallic-agate-grey-pet-spwedg001':
    '/assets/images/shop/speed-wrapping/speed-wrapping-edg-001-metallic-agate-grey-pet-spwedg001.webp',
  'speed-wrapping-edg-002-metallic-soul-red-pet-spwedg002':
    '/assets/images/shop/speed-wrapping/speed-wrapping-edg-002-metallic-soul-red-pet-spwedg002.webp',
  'speed-wrapping-edg-003-metallic-mountain-green-pet-spwedg003':
    '/assets/images/shop/speed-wrapping/speed-wrapping-edg-003-metallic-mountain-green-pet-spwedg003.webp',
  'speed-wrapping-edg-004-metallic-isle-of-man-green-pet-spwedg004':
    '/assets/images/shop/speed-wrapping/speed-wrapping-edg-004-metallic-isle-of-man-green-pet-spwedg004.webp',
  'speed-wrapping-edg-005-metallic-indigo-blue-flip-purple-green-spwedg005':
    '/assets/images/shop/speed-wrapping/speed-wrapping-edg-005-metallic-indigo-blue-flip-purple-green-spwedg005.webp',
  'speed-wrapping-edg-006-metallic-porshe-urban-green-pet-spwedg006':
    '/assets/images/shop/speed-wrapping/speed-wrapping-edg-006-metallic-porshe-urban-green-pet-spwedg006.webp',
  'speed-wrapping-edg-007-metallic-ice-crystal-blue-pet-spwedg007':
    '/assets/images/shop/speed-wrapping/speed-wrapping-edg-007-metallic-ice-crystal-blue-pet-spwedg007.webp',
  'speed-wrapping-edg-008-metallic-lamborghini-blue-blast-purple-spwedg008':
    '/assets/images/shop/speed-wrapping/speed-wrapping-edg-008-metallic-lamborghini-blue-blast-purple-spwedg008.webp',
  'speed-wrapping-edg-009-metallic-violet-pet-spwedg009':
    '/assets/images/shop/speed-wrapping/speed-wrapping-edg-009-metallic-violet-pet-spwedg009.webp',
  'speed-wrapping-edg-010-metallic-gentian-blue-pet-spwedg010':
    '/assets/images/shop/speed-wrapping/speed-wrapping-edg-010-metallic-gentian-blue-pet-spwedg010.webp',
  'speed-wrapping-edg-011-metallic-grey-pet-spwedg011':
    '/assets/images/shop/speed-wrapping/speed-wrapping-edg-011-metallic-grey-pet-spwedg011.webp',
  'speed-wrapping-edg-012-metallic-brown-grey-pet-spwedg012':
    '/assets/images/shop/speed-wrapping/speed-wrapping-edg-012-metallic-brown-grey-pet-spwedg012.webp',
  'speed-wrapping-edg-013-metallic-byron-bay-blue-pet-spwedg013':
    '/assets/images/shop/speed-wrapping/speed-wrapping-edg-013-metallic-byron-bay-blue-pet-spwedg013.webp',
  'speed-wrapping-edg-014-metallic-champane-pet-spwedg014':
    '/assets/images/shop/speed-wrapping/speed-wrapping-edg-014-metallic-champane-pet-spwedg014.webp',
  'speed-wrapping-edg-015-metallic-passion-pink-pet-spwedg015':
    '/assets/images/shop/speed-wrapping/speed-wrapping-edg-015-metallic-passion-pink-pet-spwedg015.webp',
  'speed-wrapping-edg-016-metal-space-silver-pet-spwedg016':
    '/assets/images/shop/speed-wrapping/speed-wrapping-edg-016-metal-space-silver-pet-spwedg016.webp',
  'speed-wrapping-edg-017-metal-midnigth-plurple-spwedg017':
    '/assets/images/shop/speed-wrapping/speed-wrapping-edg-017-metal-midnigth-plurple-spwedg017.webp',
  'speed-wrapping-edg-018-metal-agate-green-spwedg018':
    '/assets/images/shop/speed-wrapping/speed-wrapping-edg-018-metal-agate-green-spwedg018.webp',
  'speed-wrapping-edg-019-metal-austin-gold-pet-spwedg019':
    '/assets/images/shop/speed-wrapping/speed-wrapping-edg-019-metal-austin-gold-pet-spwedg019.webp',
  'speed-wrapping-edg-020-metal-ruby-red-pet-spwedg020':
    '/assets/images/shop/speed-wrapping/speed-wrapping-edg-020-metal-ruby-red-pet-spwedg020.webp',
  'speed-wrapping-edg-021-metal-blue-berry-pet-spwedg021':
    '/assets/images/shop/speed-wrapping/speed-wrapping-edg-021-metal-blue-berry-pet-spwedg021.webp',
  'speed-wrapping-edg-025-mettalic-paint-mettalic-solar-gold-pet-spwedg025':
    '/assets/images/shop/speed-wrapping/speed-wrapping-edg-025-mettalic-paint-mettalic-solar-gold-pet-spwedg025.webp',
  'speed-wrapping-edg-027-metallic-paint-metallic-midnight-pluple-pet-spwedg027':
    '/assets/images/shop/speed-wrapping/speed-wrapping-edg-027-metallic-paint-metallic-midnight-pluple-pet-spwedg027.webp',

  // EMG — Satin Metallic Glossy (17)
  // EMT — Satin Metallic Matte (25)
  // ECG — Candy Gold (7)
  // EHM — Chrome Metallic (12)
  // ELS — Laser Chrome (7)
  // ECC — Chameleon Chrome (11)
  // EFG — Magic Flip / Crystal / Matte (15)
  // EGH — Phantom Shadow (5)
  // EGF — Carbon Fiber (9)
  // ERW — Rainbow (6)
  // EBP — Body Protect (3)

  // ---- EMG (17) ----
  'speed-wrapping-emg-001-satin-metallic-glossy-white-pet-spwemg001':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emg-001-satin-metallic-glossy-white-pet-spwemg001.webp',
  'speed-wrapping-emg-002-satin-metallic-glossy-black-pet-spwemg002':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emg-002-satin-metallic-glossy-black-pet-spwemg002.webp',
  'speed-wrapping-emg-003-satin-metallic-glossy-coal-grey-pet-spwemg003':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emg-003-satin-metallic-glossy-coal-grey-pet-spwemg003.webp',
  'speed-wrapping-emg-004-satin-metallic-glossy-grey-pet-spwemg004':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emg-004-satin-metallic-glossy-grey-pet-spwemg004.webp',
  'speed-wrapping-emg-005-satin-metallic-glossy-fire-red-pet-spwemg005':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emg-005-satin-metallic-glossy-fire-red-pet-spwemg005.webp',
  'speed-wrapping-emg-006-satin-metallic-glossy-orange-pet-spwemg006':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emg-006-satin-metallic-glossy-orange-pet-spwemg006.webp',
  'speed-wrapping-emg-007-satin-metallic-glossy-maple-leaf-yellow-spwemg007':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emg-007-satin-metallic-glossy-maple-leaf-yellow-spwemg007.webp',
  'speed-wrapping-emg-008-satin-metallic-glossy-champagne-pet-spwemg008':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emg-008-satin-metallic-glossy-champagne-pet-spwemg008.webp',
  'speed-wrapping-emg-009-satin-metallic-glossy-roes-pink-pet-spwemg009':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emg-009-satin-metallic-glossy-roes-pink-pet-spwemg009.webp',
  'speed-wrapping-emg-010-satin-metallic-glossy-grape-purple-pet-spwemg010':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emg-010-satin-metallic-glossy-grape-purple-pet-spwemg010.webp',
  'speed-wrapping-emg-011-satin-metallic-glossy-royal-green-pet-spwemg011':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emg-011-satin-metallic-glossy-royal-green-pet-spwemg011.webp',
  'speed-wrapping-emg-012-satin-metallic-glossy-emerald-pet-spwemg012':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emg-012-satin-metallic-glossy-emerald-pet-spwemg012.webp',
  'speed-wrapping-emg-013-satin-metallic-glossy-blueberry-pet-spwemg013':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emg-013-satin-metallic-glossy-blueberry-pet-spwemg013.webp',
  'speed-wrapping-emg-014-satin-metallic-glossy-sapphire-pet-spwemg014':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emg-014-satin-metallic-glossy-sapphire-pet-spwemg014.webp',
  'speed-wrapping-emg-015-satin-metallic-glossy-magic-blue-pet-spwemg015':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emg-015-satin-metallic-glossy-magic-blue-pet-spwemg015.webp',
  'speed-wrapping-emg-016-satin-metallic-glossy-seablue-pet-spwemg016':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emg-016-satin-metallic-glossy-seablue-pet-spwemg016.webp',
  'speed-wrapping-emg-017-satin-metallic-glossy-mistblue-pet-spwemg017':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emg-017-satin-metallic-glossy-mistblue-pet-spwemg017.webp',
  // ---- EMT (25) ----
  'speed-wrapping-emt-001-satin-metallic-matt-white-spwemt001':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emt-001-satin-metallic-matt-white-spwemt001.webp',
  'speed-wrapping-emt-002-satin-metallic-matt-black-spwemt002':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emt-002-satin-metallic-matt-black-spwemt002.webp',
  'speed-wrapping-emt-003-satin-metallic-matt-carbon-grey-spwemt003':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emt-003-satin-metallic-matt-carbon-grey-spwemt003.webp',
  'speed-wrapping-emt-004-satin-metallic-matt-titanium-grey-spwemt004':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emt-004-satin-metallic-matt-titanium-grey-spwemt004.webp',
  'speed-wrapping-emt-005-satin-metallic-matt-coal-grey-spwemt005':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emt-005-satin-metallic-matt-coal-grey-spwemt005.webp',
  'speed-wrapping-emt-006-satin-metallic-matt-grey-spwemt006':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emt-006-satin-metallic-matt-grey-spwemt006.webp',
  'speed-wrapping-emt-007-satin-metallic-matt-fire-red-spwemt007':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emt-007-satin-metallic-matt-fire-red-spwemt007.webp',
  'speed-wrapping-emt-008-satin-metallic-matt-orange-spwemt008':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emt-008-satin-metallic-matt-orange-spwemt008.webp',
  'speed-wrapping-emt-009-satin-metallic-matt-maple-leaf-yellow-spwemt009':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emt-009-satin-metallic-matt-maple-leaf-yellow-spwemt009.webp',
  'speed-wrapping-emt-010-satin-metallic-matt-rose-gold-spwemt010':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emt-010-satin-metallic-matt-rose-gold-spwemt010.webp',
  'speed-wrapping-emt-011-satin-metallic-matt-grape-purple-spwemt011':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emt-011-satin-metallic-matt-grape-purple-spwemt011.webp',
  'speed-wrapping-emt-012-satin-metallic-matt-royal-green-spwemt012':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emt-012-satin-metallic-matt-royal-green-spwemt012.webp',
  'speed-wrapping-emt-013-satin-metallic-matt-emerald-spwemt013':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emt-013-satin-metallic-matt-emerald-spwemt013.webp',
  'speed-wrapping-emt-014-satin-metallic-matt-new-grass-green-spwemt014':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emt-014-satin-metallic-matt-new-grass-green-spwemt014.webp',
  'speed-wrapping-emt-015-satin-metallic-matt-lime-spwemt015':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emt-015-satin-metallic-matt-lime-spwemt015.webp',
  'speed-wrapping-emt-016-satin-metallic-matt-lake-green-spwemt016':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emt-016-satin-metallic-matt-lake-green-spwemt016.webp',
  'speed-wrapping-emt-017-satin-metallic-matt-sea-blue-spwemt017':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emt-017-satin-metallic-matt-sea-blue-spwemt017.webp',
  'speed-wrapping-emt-018-satin-metallic-matt-lake-blue-spwemt018':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emt-018-satin-metallic-matt-lake-blue-spwemt018.webp',
  'speed-wrapping-emt-019-satin-metallic-matt-sky-blue-spwemt019':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emt-019-satin-metallic-matt-sky-blue-spwemt019.webp',
  'speed-wrapping-emt-020-satin-metallic-matt-mist-blue-spwemt020':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emt-020-satin-metallic-matt-mist-blue-spwemt020.webp',
  'speed-wrapping-emt-021-satin-metallic-matt-matt-gunsmoke-grey-spwemt021':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emt-021-satin-metallic-matt-matt-gunsmoke-grey-spwemt021.webp',
  'speed-wrapping-emt-022-satin-metallic-matt-titanium-metal-grey-spwemt022':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emt-022-satin-metallic-matt-titanium-metal-grey-spwemt022.webp',
  'speed-wrapping-emt-023-satin-metallic-matt-sakura-pink-spwemt023':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emt-023-satin-metallic-matt-sakura-pink-spwemt023.webp',
  'speed-wrapping-emt-025-satin-metallic-matt-deep-blue-spwemt025':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emt-025-satin-metallic-matt-deep-blue-spwemt025.webp',
  'speed-wrapping-emt-026-satin-ceramic-black-pet-spwemt026':
    '/assets/images/shop/speed-wrapping/speed-wrapping-emt-026-satin-ceramic-black-pet-spwemt026.webp',
  // ---- ECG (7) ----
  'speed-wrapping-ecg-001-candy-gold-green-pet-spwecg001':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ecg-001-candy-gold-green-pet-spwecg001.webp',
  'speed-wrapping-ecg-002-candy-gold-violet-pet-spwecg002':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ecg-002-candy-gold-violet-pet-spwecg002.webp',
  'speed-wrapping-ecg-003-candy-gold-lemon-yellow-pet-spwecg003':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ecg-003-candy-gold-lemon-yellow-pet-spwecg003.webp',
  'speed-wrapping-ecg-004-candy-gold-sky-blue-pet-spwecg004':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ecg-004-candy-gold-sky-blue-pet-spwecg004.webp',
  'speed-wrapping-ecg-005-candy-gold-racing-orange-pet-spwecg005':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ecg-005-candy-gold-racing-orange-pet-spwecg005.webp',
  'speed-wrapping-ecg-006-candy-gold-pink-purple-pet-spwecg006':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ecg-006-candy-gold-pink-purple-pet-spwecg006.webp',
  'speed-wrapping-ecg-007-candy-gold-blue-chameleon-pet-spwecg007':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ecg-007-candy-gold-blue-chameleon-pet-spwecg007.webp',
  // ---- EHM (12) ----
  'speed-wrapping-ehm-001-chrome-metallic-gold-pet-spwehm001':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ehm-001-chrome-metallic-gold-pet-spwehm001.webp',
  'speed-wrapping-ehm-002-chrome-metallic-rose-red-pet-spwehm002':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ehm-002-chrome-metallic-rose-red-pet-spwehm002.webp',
  'speed-wrapping-ehm-003-chrome-metallic-red-pet-spwehm003':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ehm-003-chrome-metallic-red-pet-spwehm003.webp',
  'speed-wrapping-ehm-004-chrome-metallic-orange-pet-spwehm004':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ehm-004-chrome-metallic-orange-pet-spwehm004.webp',
  'speed-wrapping-ehm-005-chrome-metallic-light-blue-pet-spwehm005':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ehm-005-chrome-metallic-light-blue-pet-spwehm005.webp',
  'speed-wrapping-ehm-006-chrome-metallic-king-blue-pet-spwehm006':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ehm-006-chrome-metallic-king-blue-pet-spwehm006.webp',
  'speed-wrapping-ehm-007-chrome-metallic-green-pet-spwehm007':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ehm-007-chrome-metallic-green-pet-spwehm007.webp',
  'speed-wrapping-ehm-008-chrome-metallic-purple-pet-spwehm008':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ehm-008-chrome-metallic-purple-pet-spwehm008.webp',
  'speed-wrapping-ehm-009-chrome-metallic-romani-red-pet-spwehm009':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ehm-009-chrome-metallic-romani-red-pet-spwehm009.webp',
  'speed-wrapping-ehm-010-chrome-metallic-dark-gold-pet-spwehm010':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ehm-010-chrome-metallic-dark-gold-pet-spwehm010.webp',
  'speed-wrapping-ehm-011-chrome-metallic-grey-pet-spwehm011':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ehm-011-chrome-metallic-grey-pet-spwehm011.webp',
  'speed-wrapping-ehm-012-chrome-metallic-silver-pet-spwehm012':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ehm-012-chrome-metallic-silver-pet-spwehm012.webp',
  // ---- ELS (7) ----
  'speed-wrapping-els-001-laser-chrome-black-pet-spwels001':
    '/assets/images/shop/speed-wrapping/speed-wrapping-els-001-laser-chrome-black-pet-spwels001.webp',
  'speed-wrapping-els-002-laser-chrome-silver-pet-spwels002':
    '/assets/images/shop/speed-wrapping/speed-wrapping-els-002-laser-chrome-silver-pet-spwels002.webp',
  'speed-wrapping-els-003-laser-chrome-blue-pet-spwels003':
    '/assets/images/shop/speed-wrapping/speed-wrapping-els-003-laser-chrome-blue-pet-spwels003.webp',
  'speed-wrapping-els-004-laser-chrome-gold-pet-spwels004':
    '/assets/images/shop/speed-wrapping/speed-wrapping-els-004-laser-chrome-gold-pet-spwels004.webp',
  'speed-wrapping-els-005-laser-chrome-purple-pet-spwels005':
    '/assets/images/shop/speed-wrapping/speed-wrapping-els-005-laser-chrome-purple-pet-spwels005.webp',
  'speed-wrapping-els-006-laser-chrome-red-pet-spwels006':
    '/assets/images/shop/speed-wrapping/speed-wrapping-els-006-laser-chrome-red-pet-spwels006.webp',
  'speed-wrapping-els-007-laser-chrome-green-pet-spwels007':
    '/assets/images/shop/speed-wrapping/speed-wrapping-els-007-laser-chrome-green-pet-spwels007.webp',
  // ---- ECC (11) ----
  'speed-wrapping-ecc-001-chameleon-chrome-silver-spwecc001':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ecc-001-chameleon-chrome-silver-spwecc001.webp',
  'speed-wrapping-ecc-002-chameleon-chrome-green-spwecc002':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ecc-002-chameleon-chrome-green-spwecc002.webp',
  'speed-wrapping-ecc-003-chameleon-chrome-blue-spwecc003':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ecc-003-chameleon-chrome-blue-spwecc003.webp',
  'speed-wrapping-ecc-004-chameleon-chrome-sapphire-blue-spwecc004':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ecc-004-chameleon-chrome-sapphire-blue-spwecc004.webp',
  'speed-wrapping-ecc-005-chameleon-blue-purple-pet-spwecc005':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ecc-005-chameleon-blue-purple-pet-spwecc005.webp',
  'speed-wrapping-ecc-006-chameleon-purple-red-pet-spwecc006':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ecc-006-chameleon-purple-red-pet-spwecc006.webp',
  'speed-wrapping-ecc-007-chameleon-purple-blue-pet-spwecc007':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ecc-007-chameleon-purple-blue-pet-spwecc007.webp',
  'speed-wrapping-ecc-008-chameleon-green-gold-pet-spwecc008':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ecc-008-chameleon-green-gold-pet-spwecc008.webp',
  'speed-wrapping-ecc-009-chameleon-green-purple-pet-spwecc009':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ecc-009-chameleon-green-purple-pet-spwecc009.webp',
  'speed-wrapping-ecc-010-chameleon-galaxy-pet-spwecc010':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ecc-010-chameleon-galaxy-pet-spwecc010.webp',
  'speed-wrapping-ecc-011-chameleon-fancy-galatic-sparkling-pet-spwecc011':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ecc-011-chameleon-fancy-galatic-sparkling-pet-spwecc011.webp',
  // ---- EFG (15) ----
  'speed-wrapping-efg-001-magic-flip-grey-green-pet-spwefg001':
    '/assets/images/shop/speed-wrapping/speed-wrapping-efg-001-magic-flip-grey-green-pet-spwefg001.webp',
  'speed-wrapping-efg-002-magic-flip-grey-purple-pet-spwefg002':
    '/assets/images/shop/speed-wrapping/speed-wrapping-efg-002-magic-flip-grey-purple-pet-spwefg002.webp',
  'speed-wrapping-efg-003-magic-flip-volcano-grey-pet-spwefg003':
    '/assets/images/shop/speed-wrapping/speed-wrapping-efg-003-magic-flip-volcano-grey-pet-spwefg003.webp',
  'speed-wrapping-efg-004-magic-flip-grey-blue-pet-spwefg004':
    '/assets/images/shop/speed-wrapping/speed-wrapping-efg-004-magic-flip-grey-blue-pet-spwefg004.webp',
  'speed-wrapping-efg-005-magic-crystal-white-green-pet-spwefg005':
    '/assets/images/shop/speed-wrapping/speed-wrapping-efg-005-magic-crystal-white-green-pet-spwefg005.webp',
  'speed-wrapping-efg-006-magic-crystal-white-gold-pet-spwefg006':
    '/assets/images/shop/speed-wrapping/speed-wrapping-efg-006-magic-crystal-white-gold-pet-spwefg006.webp',
  'speed-wrapping-efg-007-magic-crystal-white-red-pet-spwefg007':
    '/assets/images/shop/speed-wrapping/speed-wrapping-efg-007-magic-crystal-white-red-pet-spwefg007.webp',
  'speed-wrapping-efg-008-magic-crystal-white-blue-pet-spwefg008':
    '/assets/images/shop/speed-wrapping/speed-wrapping-efg-008-magic-crystal-white-blue-pet-spwefg008.webp',
  'speed-wrapping-efg-009-magic-racing-tiffany-pet-spwefg009':
    '/assets/images/shop/speed-wrapping/speed-wrapping-efg-009-magic-racing-tiffany-pet-spwefg009.webp',
  'speed-wrapping-efg-010-magic-flip-glacial-frost-blue-pet-spwefg010':
    '/assets/images/shop/speed-wrapping/speed-wrapping-efg-010-magic-flip-glacial-frost-blue-pet-spwefg010.webp',
  'speed-wrapping-efg-011-magic-blue-white-gold-pet-spwefg011':
    '/assets/images/shop/speed-wrapping/speed-wrapping-efg-011-magic-blue-white-gold-pet-spwefg011.webp',
  'speed-wrapping-efg-012-magic-blue-white-green-pet-spwefg012':
    '/assets/images/shop/speed-wrapping/speed-wrapping-efg-012-magic-blue-white-green-pet-spwefg012.webp',
  'speed-wrapping-efg-013-magic-matte-grey-blue-pet-spwefg013':
    '/assets/images/shop/speed-wrapping/speed-wrapping-efg-013-magic-matte-grey-blue-pet-spwefg013.webp',
  'speed-wrapping-efg-014-magic-matte-grey-red-pet-spwefg014':
    '/assets/images/shop/speed-wrapping/speed-wrapping-efg-014-magic-matte-grey-red-pet-spwefg014.webp',
  'speed-wrapping-efg-015-magic-matte-grey-purple-pet-spwefg015':
    '/assets/images/shop/speed-wrapping/speed-wrapping-efg-015-magic-matte-grey-purple-pet-spwefg015.webp',
  // ---- EGH (5) ----
  'speed-wrapping-egh-001-phontom-shadow-black-purple-spwegh001':
    '/assets/images/shop/speed-wrapping/speed-wrapping-egh-001-phontom-shadow-black-purple-spwegh001.webp',
  'speed-wrapping-egh-002-phontom-shadow-jazz-blue-spwegh002':
    '/assets/images/shop/speed-wrapping/speed-wrapping-egh-002-phontom-shadow-jazz-blue-spwegh002.webp',
  'speed-wrapping-egh-003-phontom-shadow-olive-green-spwegh003':
    '/assets/images/shop/speed-wrapping/speed-wrapping-egh-003-phontom-shadow-olive-green-spwegh003.webp',
  'speed-wrapping-egh-004-phontom-shadow-black-blue-spwegh004':
    '/assets/images/shop/speed-wrapping/speed-wrapping-egh-004-phontom-shadow-black-blue-spwegh004.webp',
  'speed-wrapping-egh-005-phontom-shadow-black-gold-spwegh005':
    '/assets/images/shop/speed-wrapping/speed-wrapping-egh-005-phontom-shadow-black-gold-spwegh005.webp',
  // ---- EGF (9) ----
  'speed-wrapping-egf-001-gloss-carbon-red-pet-spwegf001':
    '/assets/images/shop/speed-wrapping/speed-wrapping-egf-001-gloss-carbon-red-pet-spwegf001.webp',
  'speed-wrapping-egf-002-gloss-carbon-black-pet-spwegf002':
    '/assets/images/shop/speed-wrapping/speed-wrapping-egf-002-gloss-carbon-black-pet-spwegf002.webp',
  'speed-wrapping-egf-003-matte-carbon-red-pet-spwegf003':
    '/assets/images/shop/speed-wrapping/speed-wrapping-egf-003-matte-carbon-red-pet-spwegf003.webp',
  'speed-wrapping-egf-004-matte-carbon-black-pet-spwegf004':
    '/assets/images/shop/speed-wrapping/speed-wrapping-egf-004-matte-carbon-black-pet-spwegf004.webp',
  'speed-wrapping-egf-006-carbon-gloss-5d-spwegf006':
    '/assets/images/shop/speed-wrapping/speed-wrapping-egf-006-carbon-gloss-5d-spwegf006.webp',
  'speed-wrapping-egf-007-frosted-black-pet-spwegf007':
    '/assets/images/shop/speed-wrapping/speed-wrapping-egf-007-frosted-black-pet-spwegf007.webp',
  'speed-wrapping-egf-017-shadow-black-spwegf017':
    '/assets/images/shop/speed-wrapping/speed-wrapping-egf-017-shadow-black-spwegf017.webp',
  'speed-wrapping-egf-018-forged-carbon-spwegf018':
    '/assets/images/shop/speed-wrapping/speed-wrapping-egf-018-forged-carbon-spwegf018.webp',
  // ---- ERW (5) ----
  'speed-wrapping-erw-001-rainbow-grey-pet-spwerw001':
    '/assets/images/shop/speed-wrapping/speed-wrapping-erw-001-rainbow-grey-pet-spwerw001.webp',
  'speed-wrapping-erw-002-rainbow-silver-pet-spwerw002':
    '/assets/images/shop/speed-wrapping/speed-wrapping-erw-002-rainbow-silver-pet-spwerw002.webp',
  'speed-wrapping-erw-003-rainbow-white-pet-spwerw003':
    '/assets/images/shop/speed-wrapping/speed-wrapping-erw-003-rainbow-white-pet-spwerw003.webp',
  'speed-wrapping-erw-004-rainbow-matte-grey-spwerw004':
    '/assets/images/shop/speed-wrapping/speed-wrapping-erw-004-rainbow-matte-grey-spwerw004.webp',
  'speed-wrapping-erw-005-rainbow-matte-silver-spwerw005':
    '/assets/images/shop/speed-wrapping/speed-wrapping-erw-005-rainbow-matte-silver-spwerw005.webp',
  // ---- EBP (3) ----
  'speed-wrapping-ebp-001-gloss-black-sunroof-12c-spwebp001':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ebp-001-gloss-black-sunroof-12c-spwebp001.webp',
  'speed-wrapping-ebp-002-gloss-black-sunroof-18c-spwebp002':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ebp-002-gloss-black-sunroof-18c-spwebp002.webp',
  'speed-wrapping-ebp-003-matte-black-pet-spwebp003':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ebp-003-matte-black-pet-spwebp003.webp',

  // ---- Extras (EMA-004 regerado, EBP-SW PPF Black) ----
  'speed-wrapping-ema-004-matt-yellow-spwema004':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ema-004-matt-yellow-spwema004.webp',
  'speed-wrapping-ppf-black-58892722':
    '/assets/images/shop/speed-wrapping/speed-wrapping-ppf-black-58892722.webp',
  // EGF-005 (Carbon Gloss 3D) fica de fora até a foto existir: a geração
  // voltou 403 no CDN. Sem entrada aqui o card cai no placeholder da linha,
  // que é melhor do que apontar para um arquivo que não subiu.

  // Fechamento da Speed Wrapping: EGF-005 (a URL do lote anterior expirou com
  // 403) e TC4001, que nao pertence a nenhuma das 19 familias de cor — e o
  // adesivo holografico para impressao.
  'speed-wrapping-egf-005-carbon-gloss-3d-spwegf005':
    '/assets/images/shop/speed-wrapping/speed-wrapping-egf-005-carbon-gloss-3d-spwegf005.webp',
  'speed-wrapping-tc4001-holographic-printing-adhesive-spwtc4001':
    '/assets/images/shop/speed-wrapping/speed-wrapping-tc4001-holographic-printing-adhesive-spwtc4001.webp',
};

/**
 * Fotos de rolo por slug, de todas as linhas que já têm. O adapter do ERP — que
 * é o caminho de produção — consulta por aqui, e não mapa a mapa: foi assim que
 * a MetaCast MCX ficou semanas com a foto só em dev, porque o mapa vivia
 * exclusivamente no adapter estático. Linha nova entra nesta lista e vale nos
 * dois caminhos de uma vez.
 */
/**
 * Fotos de rolo com slug do ERP, fora das familias acima.
 *
 * Oracal 6510 — as 7 fluorescentes. Linha propria no cadastro, mas o arquivo
 * mora junto do 651 porque e a mesma familia de material.
 *
 * Oracal 670 light blue — o cadastro tem DOIS produtos para a mesma cor: o
 * slug curto (`oracal-670-light-blue-g`, ja no mapa do dbSnapshot) e este,
 * longo, vindo do ERP. Aponta para o MESMO arquivo de propósito: e a mesma
 * foto do mesmo rolo, e sem esta entrada o duplicado cai no placeholder.
 */
export const ERP_ROLL_IMAGES: Record<string, string> = {
  'oracal-6510-vinil-oracal-6510-029-yellow-fluorescent-ora6510029f':
    '/assets/images/shop/oracal-651/fluor-029-yellow.webp',
  'oracal-6510-vinil-oracal-6510-037-orange-fluorescent-ora6510037f':
    '/assets/images/shop/oracal-651/fluor-037-orange.webp',
  'oracal-6510-vinil-oracal-6510-038-red-orange-fluorescent-ora6510038f':
    '/assets/images/shop/oracal-651/fluor-038-red-orange.webp',
  'oracal-6510-vinil-oracal-6510-039-red-fluorescent-ora6510039f':
    '/assets/images/shop/oracal-651/fluor-039-red.webp',
  'oracal-6510-vinil-oracal-6510-046-pink-fluorescent-ora6510046f':
    '/assets/images/shop/oracal-651/fluor-046-pink.webp',
  'oracal-6510-vinil-oracal-6510-069-green-fluorescent-ora6510069f':
    '/assets/images/shop/oracal-651/fluor-069-green.webp',
  'oracal-6510-vinil-oracal-6510-357-orange-red-fluorescent-ora6510357f':
    '/assets/images/shop/oracal-651/fluor-357-orange-red.webp',
  'oracal-670-vinil-oracal-670-light-blue-g-053g-ora670053':
    '/assets/images/shop/oracal-670ra/light-blue-g.webp',
  // SH Decor: as outras 50 texturas vem preenchidas em `produtos.imagem` no
  // banco; so esta faltava. Entra aqui em vez de no banco para o arquivo e a
  // referencia viajarem no mesmo commit.
  'sh-decor-ip-415-pedra-carrara-brilho-shdip-415':
    '/assets/images/decor/sh/carrara-brilho/texture.jpg',
  // Etherna: as outras 137 texturas vem do banco em `produtos.imagem`; estas 8
  // vinham nulas. Mesma razao da SH Decor — arquivo e referencia no mesmo commit.
  'etherna-calacatta-black-preto-eth001':
    '/assets/images/decor/etherna/calacatta-black-preto/texture.jpg',
  'etherna-calacatta-brilho-gold-eth002':
    '/assets/images/decor/etherna/calacatta-brilho-gold/texture.jpg',
  'etherna-calacatta-brilho-silver-eth003':
    '/assets/images/decor/etherna/calacatta-brilho-silver/texture.jpg',
  'etherna-texturizado-cinza-claro-eth036':
    '/assets/images/decor/etherna/texturizado-cinza-claro/texture.jpg',
  'etherna-linem-gelo-eth057':
    '/assets/images/decor/etherna/linem-gelo/texture.jpg',
  'etherna-travertino-premium-fosco-bege-eth058':
    '/assets/images/decor/etherna/travertino-premium-fosco-bege/texture.jpg',
  'etherna-madeira-cerejeira-marrom-eth109':
    '/assets/images/decor/etherna/madeira-cerejeira-marrom/texture.jpg',
  'etherna-concreto-cinza-claro-eth158':
    '/assets/images/decor/etherna/concreto-cinza-claro/texture.jpg',
};

const ROLL_IMAGE_MAPS: ReadonlyArray<Record<string, string>> = [
  MCX_ROLL_IMAGES,
  M7_ROLL_IMAGES,
  SW_ROLL_IMAGES,
  ERP_ROLL_IMAGES,
];

/** Foto de rolo para o slug, se alguma linha tiver. */
export function rollImageFor(slug: string): string | undefined {
  for (const mapa of ROLL_IMAGE_MAPS) {
    const url = mapa[slug];
    if (url) return url;
  }
  return undefined;
}

/**
 * Fotos de veículo das cores SH Wrapping — as mesmas que a página
 * /wrap/sh-wrapping já mostrava e que a loja ignorava. Ordem fixa (SUV, sedan,
 * superesportivo, noite) para a galeria não embaralhar entre visitas.
 *
 * Aceita o slug cru (`paprika-orange`) ou o prefixado do ERP
 * (`sh-paprika-orange`), como `isReviewedSlug`.
 */
export function shVehiclePhotosFor(slug: string): string[] {
  const cru = slug.startsWith('sh-') ? slug.slice(3) : slug;
  const g = (SH_COLORS_ASSETS[slug] ?? SH_COLORS_ASSETS[cru])?.gallery;
  if (!g) return [];
  return [g.suv, g.sedan, g.supercar, g.night].filter((u): u is string => Boolean(u));
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
