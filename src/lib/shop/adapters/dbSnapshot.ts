// Adapter do snapshot de web_catalog_products: Oracal 651, Oracal 670RA e
// SH Wrapping (116 cores).
//
// Historicamente estas cores não tinham imagem — a tabela não tem coluna de
// imagem e o card da LOJA renderizava só swatch do hex.
//
// SH Wrapping está ganhando fotos-de-rolo geradas por IA (Nano Banana Pro,
// image-to-image referenciando padrão Inozetek), aplicadas cor por cor conforme
// aprovadas pelo time. Convenção: `public/assets/images/shop/sh-wrapping/{slug}.webp`
// mapeadas explicitamente em SH_WRAPPING_IMAGES abaixo — mapping explícito evita
// 404 pra slugs sem foto ainda e mantém a decisão editorial rastreável.

import { DB_SNAPSHOT, type DbSnapshotRow, type DbSnapshotSource } from '../generated/dbSnapshot';
import { resolveColor } from '../color/resolveColor';
import { normalizeFinishString } from '../finish/normalizeFinish';
import { genericImageForLine, isReviewedSlug } from '../generic';
import { buildSearchText, shopSlug, type BrandKey, type ShopItem, type ShopSpec } from '../types';

/**
 * Fotos de rolo SH Wrapping já aprovadas. Adicionar uma entrada por cor à
 * medida que o mockup for validado. Slugs faltantes seguem renderizando swatch
 * do hex — não é 404.
 */
const SH_WRAPPING_IMAGES: Record<string, string> = {
  'paprika-orange': '/assets/images/shop/sh-wrapping/paprika-orange.webp',
  'glossy-black': '/assets/images/shop/sh-wrapping/glossy-black.webp',
  'pearl-white': '/assets/images/shop/sh-wrapping/pearl-white.webp',
  'sao-paulo-yellow': '/assets/images/shop/sh-wrapping/sao-paulo-yellow.webp',
  'soulmoving-red': '/assets/images/shop/sh-wrapping/soulmoving-red.webp',
  'crystal-white': '/assets/images/shop/sh-wrapping/crystal-white.webp',
  'bentley-pink': '/assets/images/shop/sh-wrapping/bentley-pink.webp',
  'crystal-mamba-green': '/assets/images/shop/sh-wrapping/crystal-mamba-green.webp',
  'pearl-metal-black': '/assets/images/shop/sh-wrapping/pearl-metal-black.webp',
  'khaki-green': '/assets/images/shop/sh-wrapping/khaki-green.webp',
  'combat-green': '/assets/images/shop/sh-wrapping/combat-green.webp',
  'crystal-glacial-blue': '/assets/images/shop/sh-wrapping/crystal-glacial-blue.webp',
  'mercury-silver': '/assets/images/shop/sh-wrapping/mercury-silver.webp',
  'liquid-metal-somato-blue': '/assets/images/shop/sh-wrapping/liquid-metal-somato-blue.webp',
  'pearl-metal-white': '/assets/images/shop/sh-wrapping/pearl-metal-white.webp',
  'pearl-metal-space-grey': '/assets/images/shop/sh-wrapping/pearl-metal-space-grey.webp',
  'amg-grey': '/assets/images/shop/sh-wrapping/amg-grey.webp',
  'amg-mountain-grey': '/assets/images/shop/sh-wrapping/amg-mountain-grey.webp',
  'blue-charm-green': '/assets/images/shop/sh-wrapping/blue-charm-green.webp',
  'candy-purple-gloss-aluminium': '/assets/images/shop/sh-wrapping/candy-purple-gloss-aluminium.webp',
  'crystal-champagne-gold': '/assets/images/shop/sh-wrapping/crystal-champagne-gold.webp',
  'crystal-silver': '/assets/images/shop/sh-wrapping/crystal-silver.webp',
  'crystal-yellow': '/assets/images/shop/sh-wrapping/crystal-yellow.webp',
  'fantastic-green-grey': '/assets/images/shop/sh-wrapping/fantastic-green-grey.webp',
  'fantastic-purple': '/assets/images/shop/sh-wrapping/fantastic-purple.webp',
  'glossy-nado-ash': '/assets/images/shop/sh-wrapping/glossy-nado-ash.webp',
  'matt-dark-purple': '/assets/images/shop/sh-wrapping/matt-dark-purple.webp',
  'pearl-metal-sakura-pink': '/assets/images/shop/sh-wrapping/pearl-metal-sakura-pink.webp',
  'pearl-metal-tiffany': '/assets/images/shop/sh-wrapping/pearl-metal-tiffany.webp',
  'space-blue-gloss-aluminium': '/assets/images/shop/sh-wrapping/space-blue-gloss-aluminium.webp',
};

/**
 * Fotos de rolo Oracal 670RA (24 cores). Padrão: tubete de papelão fino com
 * label ORAFOL no interior, logo 'ORACAL 670RA' no canto superior esquerdo.
 * Convenção: `public/assets/images/shop/oracal-670ra/{slug}.webp`.
 */
const ORACAL_670_IMAGES: Record<string, string> = {
  'white-g': '/assets/images/shop/oracal-670ra/white-g.webp',
  'yellow-g': '/assets/images/shop/oracal-670ra/yellow-g.webp',
  'brimstone-yellow-g': '/assets/images/shop/oracal-670ra/brimstone-yellow-g.webp',
  'dark-red-g': '/assets/images/shop/oracal-670ra/dark-red-g.webp',
  'red-g': '/assets/images/shop/oracal-670ra/red-g.webp',
  'light-red-g': '/assets/images/shop/oracal-670ra/light-red-g.webp',
  'pastel-orange-g': '/assets/images/shop/oracal-670ra/pastel-orange-g.webp',
  'violet-m': '/assets/images/shop/oracal-670ra/violet-m.webp',
  'orange-red-g': '/assets/images/shop/oracal-670ra/orange-red-g.webp',
  'light-blue-g': '/assets/images/shop/oracal-670ra/light-blue-g.webp',
  'mint-g': '/assets/images/shop/oracal-670ra/mint-g.webp',
  'ice-blue-g': '/assets/images/shop/oracal-670ra/ice-blue-g.webp',
  'dark-green-m': '/assets/images/shop/oracal-670ra/dark-green-m.webp',
  'yellow-green-g': '/assets/images/shop/oracal-670ra/yellow-green-g.webp',
  'turquoise-g': '/assets/images/shop/oracal-670ra/turquoise-g.webp',
  'black-g': '/assets/images/shop/oracal-670ra/black-g.webp',
  'black-m': '/assets/images/shop/oracal-670ra/black-m.webp',
  'light-grey-g': '/assets/images/shop/oracal-670ra/light-grey-g.webp',
  'dark-grey-g': '/assets/images/shop/oracal-670ra/dark-grey-g.webp',
  'dark-grey-m': '/assets/images/shop/oracal-670ra/dark-grey-m.webp',
  'telegrey-g': '/assets/images/shop/oracal-670ra/telegrey-g.webp',
  'telegrey-m': '/assets/images/shop/oracal-670ra/telegrey-m.webp',
  'sky-blue-m': '/assets/images/shop/oracal-670ra/sky-blue-m.webp',
  'deep-sea-blue-g': '/assets/images/shop/oracal-670ra/deep-sea-blue-g.webp',
};

/**
 * Fotos de rolo Oracal 651 (62 cores). Padrão idêntico ao Oracal 670RA:
 * tubete de papelão fino com label ORAFOL no interior, logo 'ORACAL 651'
 * no canto superior esquerdo. Todos "Sólido Brilhante" (Gloss).
 * Convenção: `public/assets/images/shop/oracal-651/{color}.webp`.
 * Chave = slug completo do DB (`oracal-651-{color}`).
 */
const ORACAL_651_IMAGES: Record<string, string> = {
  'oracal-651-transparent': '/assets/images/shop/oracal-651/transparent.webp',
  'oracal-651-white': '/assets/images/shop/oracal-651/white.webp',
  'oracal-651-signal-yellow': '/assets/images/shop/oracal-651/signal-yellow.webp',
  'oracal-651-golden-yellow': '/assets/images/shop/oracal-651/golden-yellow.webp',
  'oracal-651-yellow': '/assets/images/shop/oracal-651/yellow.webp',
  'oracal-651-light-yellow': '/assets/images/shop/oracal-651/light-yellow.webp',
  'oracal-651-cream': '/assets/images/shop/oracal-651/cream.webp',
  'oracal-651-brimstone-yellow': '/assets/images/shop/oracal-651/brimstone-yellow.webp',
  'oracal-651-purple-red': '/assets/images/shop/oracal-651/purple-red.webp',
  'oracal-651-dark-red': '/assets/images/shop/oracal-651/dark-red.webp',
  'oracal-651-red': '/assets/images/shop/oracal-651/red.webp',
  'oracal-651-light-red': '/assets/images/shop/oracal-651/light-red.webp',
  'oracal-651-orange': '/assets/images/shop/oracal-651/orange.webp',
  'oracal-651-pastel-orange': '/assets/images/shop/oracal-651/pastel-orange.webp',
  'oracal-651-light-orange': '/assets/images/shop/oracal-651/light-orange.webp',
  'oracal-651-violet': '/assets/images/shop/oracal-651/violet.webp',
  'oracal-651-pink': '/assets/images/shop/oracal-651/pink.webp',
  'oracal-651-lilac': '/assets/images/shop/oracal-651/lilac.webp',
  'oracal-651-lavender': '/assets/images/shop/oracal-651/lavender.webp',
  'oracal-651-soft-pink': '/assets/images/shop/oracal-651/soft-pink.webp',
  'oracal-651-orange-red': '/assets/images/shop/oracal-651/orange-red.webp',
  'oracal-651-king-blue': '/assets/images/shop/oracal-651/king-blue.webp',
  'oracal-651-dark-blue': '/assets/images/shop/oracal-651/dark-blue.webp',
  'oracal-651-gentian-blue': '/assets/images/shop/oracal-651/gentian-blue.webp',
  'oracal-651-azure-blue': '/assets/images/shop/oracal-651/azure-blue.webp',
  'oracal-651-light-blue': '/assets/images/shop/oracal-651/light-blue.webp',
  'oracal-651-turquoise': '/assets/images/shop/oracal-651/turquoise.webp',
  'oracal-651-mint': '/assets/images/shop/oracal-651/mint.webp',
  'oracal-651-ice-blue': '/assets/images/shop/oracal-651/ice-blue.webp',
  'oracal-651-traffic-blue': '/assets/images/shop/oracal-651/traffic-blue.webp',
  'oracal-651-dark-green': '/assets/images/shop/oracal-651/dark-green.webp',
  'oracal-651-green': '/assets/images/shop/oracal-651/green.webp',
  'oracal-651-light-green': '/assets/images/shop/oracal-651/light-green.webp',
  'oracal-651-lime-tree-green': '/assets/images/shop/oracal-651/lime-tree-green.webp',
  'oracal-651-yellow-green': '/assets/images/shop/oracal-651/yellow-green.webp',
  'oracal-651-cobalt-blue': '/assets/images/shop/oracal-651/cobalt-blue.webp',
  'oracal-651-turquoise-blue': '/assets/images/shop/oracal-651/turquoise-blue.webp',
  'oracal-651-blue': '/assets/images/shop/oracal-651/blue.webp',
  'oracal-651-grass-green': '/assets/images/shop/oracal-651/grass-green.webp',
  'oracal-651-black': '/assets/images/shop/oracal-651/black.webp',
  'oracal-651-grey': '/assets/images/shop/oracal-651/grey.webp',
  'oracal-651-light-grey': '/assets/images/shop/oracal-651/light-grey.webp',
  'oracal-651-dark-grey': '/assets/images/shop/oracal-651/dark-grey.webp',
  'oracal-651-middle-grey': '/assets/images/shop/oracal-651/middle-grey.webp',
  'oracal-651-telegrey': '/assets/images/shop/oracal-651/telegrey.webp',
  'oracal-651-brown': '/assets/images/shop/oracal-651/brown.webp',
  'oracal-651-light-brown': '/assets/images/shop/oracal-651/light-brown.webp',
  'oracal-651-beige': '/assets/images/shop/oracal-651/beige.webp',
  'oracal-651-nut-brown': '/assets/images/shop/oracal-651/nut-brown.webp',
  'oracal-651-sky-blue': '/assets/images/shop/oracal-651/sky-blue.webp',
  'oracal-651-brilliant-blue': '/assets/images/shop/oracal-651/brilliant-blue.webp',
  'oracal-651-silver-grey': '/assets/images/shop/oracal-651/silver-grey.webp',
  'oracal-651-gold': '/assets/images/shop/oracal-651/gold.webp',
  'oracal-651-copper': '/assets/images/shop/oracal-651/copper.webp',
  'oracal-651-gentian': '/assets/images/shop/oracal-651/gentian.webp',
  'oracal-651-burgundy': '/assets/images/shop/oracal-651/burgundy.webp',
  'oracal-651-coral': '/assets/images/shop/oracal-651/coral.webp',
  'oracal-651-purple': '/assets/images/shop/oracal-651/purple.webp',
  'oracal-651-steel-blue': '/assets/images/shop/oracal-651/steel-blue.webp',
  'oracal-651-deep-sea-blue': '/assets/images/shop/oracal-651/deep-sea-blue.webp',
  'oracal-651-forest-green': '/assets/images/shop/oracal-651/forest-green.webp',
  'oracal-651-imitation-gold': '/assets/images/shop/oracal-651/imitation-gold.webp',
};

/**
 * Galerias SH Wrapping. Quando existe, o card usa a galeria inteira
 * (foto do rolo + 3 carros esportivos envelopados na cor). Cores sem
 * galeria caem no `image` mainly (só o rolo).
 */
const SH_WRAPPING_GALLERY: Record<string, string[]> = {
  'sao-paulo-yellow': [
    '/assets/images/shop/sh-wrapping/sao-paulo-yellow.webp',
    '/assets/images/shop/sh-wrapping/sao-paulo-yellow-car-1.webp',
    '/assets/images/shop/sh-wrapping/sao-paulo-yellow-car-2.webp',
    '/assets/images/shop/sh-wrapping/sao-paulo-yellow-car-3.webp',
  ],
  'soulmoving-red': [
    '/assets/images/shop/sh-wrapping/soulmoving-red.webp',
    '/assets/images/shop/sh-wrapping/soulmoving-red-car-1.webp',
    '/assets/images/shop/sh-wrapping/soulmoving-red-car-2.webp',
    '/assets/images/shop/sh-wrapping/soulmoving-red-car-3.webp',
  ],
  'crystal-white': [
    '/assets/images/shop/sh-wrapping/crystal-white.webp',
    '/assets/images/shop/sh-wrapping/crystal-white-car-1.webp',
    '/assets/images/shop/sh-wrapping/crystal-white-car-2.webp',
    '/assets/images/shop/sh-wrapping/crystal-white-car-3.webp',
  ],
  'bentley-pink': [
    '/assets/images/shop/sh-wrapping/bentley-pink.webp',
    '/assets/images/shop/sh-wrapping/bentley-pink-car-1.webp',
    '/assets/images/shop/sh-wrapping/bentley-pink-car-2.webp',
    '/assets/images/shop/sh-wrapping/bentley-pink-car-3.webp',
  ],
  'crystal-mamba-green': [
    '/assets/images/shop/sh-wrapping/crystal-mamba-green.webp',
    '/assets/images/shop/sh-wrapping/crystal-mamba-green-car-1.webp',
    '/assets/images/shop/sh-wrapping/crystal-mamba-green-car-2.webp',
    '/assets/images/shop/sh-wrapping/crystal-mamba-green-car-3.webp',
  ],
  'pearl-metal-black': [
    '/assets/images/shop/sh-wrapping/pearl-metal-black.webp',
    '/assets/images/shop/sh-wrapping/pearl-metal-black-car-1.webp',
    '/assets/images/shop/sh-wrapping/pearl-metal-black-car-2.webp',
    '/assets/images/shop/sh-wrapping/pearl-metal-black-car-3.webp',
  ],
  'khaki-green': [
    '/assets/images/shop/sh-wrapping/khaki-green.webp',
    '/assets/images/shop/sh-wrapping/khaki-green-car-1.webp',
    '/assets/images/shop/sh-wrapping/khaki-green-car-2.webp',
    '/assets/images/shop/sh-wrapping/khaki-green-car-3.webp',
  ],
  'combat-green': [
    '/assets/images/shop/sh-wrapping/combat-green.webp',
    '/assets/images/shop/sh-wrapping/combat-green-car-1.webp',
    '/assets/images/shop/sh-wrapping/combat-green-car-2.webp',
    '/assets/images/shop/sh-wrapping/combat-green-car-3.webp',
  ],
  'crystal-glacial-blue': [
    '/assets/images/shop/sh-wrapping/crystal-glacial-blue.webp',
    '/assets/images/shop/sh-wrapping/crystal-glacial-blue-car-1.webp',
    '/assets/images/shop/sh-wrapping/crystal-glacial-blue-car-2.webp',
    '/assets/images/shop/sh-wrapping/crystal-glacial-blue-car-3.webp',
  ],
  'mercury-silver': [
    '/assets/images/shop/sh-wrapping/mercury-silver.webp',
    '/assets/images/shop/sh-wrapping/mercury-silver-car-1.webp',
    '/assets/images/shop/sh-wrapping/mercury-silver-car-2.webp',
    '/assets/images/shop/sh-wrapping/mercury-silver-car-3.webp',
  ],
  'liquid-metal-somato-blue': [
    '/assets/images/shop/sh-wrapping/liquid-metal-somato-blue.webp',
    '/assets/images/shop/sh-wrapping/liquid-metal-somato-blue-car-1.webp',
    '/assets/images/shop/sh-wrapping/liquid-metal-somato-blue-car-2.webp',
    '/assets/images/shop/sh-wrapping/liquid-metal-somato-blue-car-3.webp',
  ],
  'pearl-metal-white': [
    '/assets/images/shop/sh-wrapping/pearl-metal-white.webp',
    '/assets/images/shop/sh-wrapping/pearl-metal-white-car-1.webp',
    '/assets/images/shop/sh-wrapping/pearl-metal-white-car-2.webp',
    '/assets/images/shop/sh-wrapping/pearl-metal-white-car-3.webp',
  ],
  'pearl-metal-space-grey': [
    '/assets/images/shop/sh-wrapping/pearl-metal-space-grey.webp',
    '/assets/images/shop/sh-wrapping/pearl-metal-space-grey-car-1.webp',
    '/assets/images/shop/sh-wrapping/pearl-metal-space-grey-car-2.webp',
    '/assets/images/shop/sh-wrapping/pearl-metal-space-grey-car-3.webp',
  ],
};

/**
 * Config por marca. O `routePrefix` é explícito de propósito: a coluna `brand`
 * do banco vale 'Oracal 670' mas a rota é '/wrap/oracal-670ra'. Derivar a rota
 * do brand quebraria as 24 cores dessa linha.
 */
const SOURCE_CFG: Record<
  DbSnapshotSource,
  {
    brand: string;
    brandKey: BrandKey;
    line: string;
    routePrefix: string;
    badges: string[];
    aplicacao: 'automotivo';
  }
> = {
  'oracal-651': {
    brand: 'Orafol',
    brandKey: 'orafol',
    line: 'Oracal 651',
    routePrefix: '/wrap/oracal-651',
    badges: ['VINIL INTERMEDIÁRIO', 'RECORTE E SINALIZAÇÃO'],
    aplicacao: 'automotivo',
  },
  'oracal-670': {
    brand: 'Orafol',
    brandKey: 'orafol',
    line: 'Oracal 670RA',
    routePrefix: '/wrap/oracal-670ra',
    badges: ['RAPID AIR®', 'WRAPPING FILM'],
    aplicacao: 'automotivo',
  },
  'sh-wrapping': {
    brand: 'SH Wrapping',
    brandKey: 'sh',
    line: 'SH Wrapping Colors',
    routePrefix: '/wrap/sh-colors',
    badges: ['ENVELOPAMENTO AUTOMOTIVO'],
    aplicacao: 'automotivo',
  },
};

/**
 * 'NZWRAP FERRARI METALLIC RED' → 'FERRARI METALLIC RED'.
 * Regra atual: caixa-alta total, sem o prefixo de linha. Mudou de title-case
 * para caixa-alta por decisão editorial — assim card, página, breadcrumb, SEO
 * e link do WhatsApp compartilham o mesmo formato.
 */
function cleanName(raw: string): string {
  return raw.replace(/^NZWRAP\s+/i, '').trim().toUpperCase();
}

function rowToShopItem(row: DbSnapshotRow): ShopItem {
  const cfg = SOURCE_CFG[row.source];
  const finish = normalizeFinishString(row.finishType);
  const color = resolveColor({
    name: row.name,
    code: row.sku,
    hex: row.hex,
    finishes: finish.ids,
  });

  const displayName = cleanName(row.name);

  const specs: ShopSpec[] = [];
  if (row.sku) specs.push({ label: 'Código', value: row.sku });
  if (row.finishType) specs.push({ label: 'Acabamento', value: row.finishType });
  if (row.hex) specs.push({ label: 'Hex aproximado', value: row.hex.toUpperCase() });
  if (row.durabilidadeAnos) specs.push({ label: 'Durabilidade', value: `${row.durabilidadeAnos} anos` });
  if (row.garantiaAnos) {
    specs.push({
      label: 'Garantia',
      value: `${row.garantiaAnos} ${row.garantiaAnos === 1 ? 'ano' : 'anos'}`,
    });
  }

  return {
    slug: shopSlug(row.source, row.slug),
    source: row.source,
    sourceId: row.slug,
    name: displayName,
    code: row.sku,
    subtitle: `${cfg.line}${row.finishType ? ` · ${row.finishType}` : ''}`,
    brand: cfg.brand,
    line: cfg.line,
    lineKey: row.source,
    brandKey: cfg.brandKey,
    vertical: 'WRAP',
    kind: 'cor',
    aplicacoes: [cfg.aplicacao],
    // Regra de imagem/galeria:
    //  - SH Wrapping revisada  → foto customizada + galeria (rolo + 3 carros quando existe)
    //  - Oracal 670RA revisada → foto de rolo customizada (sem galeria — só rolo por enquanto)
    //  - Oracal 651 revisada   → foto de rolo customizada (só rolo)
    //  - qualquer outro sem foto → placeholder branded da linha (nunca vazio)
    image:
      row.source === 'sh-wrapping' && isReviewedSlug(row.slug)
        ? (SH_WRAPPING_IMAGES[row.slug] ?? genericImageForLine(row.source))
        : row.source === 'oracal-670' && isReviewedSlug(row.slug)
          ? (ORACAL_670_IMAGES[row.slug] ?? genericImageForLine(row.source))
          : row.source === 'oracal-651' && isReviewedSlug(row.slug)
            ? (ORACAL_651_IMAGES[row.slug] ?? genericImageForLine(row.source))
            : genericImageForLine(row.source),
    gallery:
      row.source === 'sh-wrapping' && isReviewedSlug(row.slug)
        ? (SH_WRAPPING_GALLERY[row.slug] ?? [])
        : [],
    hex: row.hex,
    colorFamilies: color.families,
    colorSubfamilies: color.subfamilies,
    colorConfidence: color.confidence,
    finishes: finish.ids,
    finishLabel: finish.label,
    patternFamily: null,
    specs,
    badges: cfg.badges,
    garantiaAnos: row.garantiaAnos,
    durabilidadeAnos: row.durabilidadeAnos,
    description: row.description,
    legacyPath: `${cfg.routePrefix}/${row.slug}`,
    searchText: buildSearchText([
      displayName,
      row.name,
      row.technicalName,
      row.sku,
      row.finishType,
      cfg.line,
      cfg.brand,
      'vinil cor envelopamento',
    ]),
  };
}

export function dbSnapshotToShopItems(): ShopItem[] {
  return DB_SNAPSHOT.map(rowToShopItem);
}
