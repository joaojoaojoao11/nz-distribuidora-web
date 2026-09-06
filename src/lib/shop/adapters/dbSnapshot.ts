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
    //  - slug ∈ REVIEWED_SLUGS  → foto customizada do mapa da linha
    //  - senão                   → placeholder branded da linha (nunca vazio)
    // Assim SH Wrapping revisadas mantêm rolo+3 carros; SH Wrapping sem
    // revisão e todo o Oracal 651/670 ganham placeholder branded.
    image:
      row.source === 'sh-wrapping' && isReviewedSlug(row.slug)
        ? (SH_WRAPPING_IMAGES[row.slug] ?? genericImageForLine(row.source))
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
