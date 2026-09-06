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

/** 'NZWRAP FERRARI METALLIC RED' → 'Ferrari Metallic Red'. Mesma regra do edge. */
function cleanName(raw: string): string {
  const noBrand = raw.replace(/^NZWRAP\s+/i, '').trim();
  return noBrand
    .split(/\s+/)
    .map((w) => (/^[A-Z0-9-]{2,4}$/.test(w) ? w : (w[0]?.toUpperCase() ?? '') + w.slice(1).toLowerCase()))
    .join(' ');
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
    // SH Wrapping: foto de rolo por slug quando existe; senão swatch do hex.
    // Oracal 651/670: sempre swatch (não geramos fotos, hex chapado funciona).
    image: row.source === 'sh-wrapping' ? (SH_WRAPPING_IMAGES[row.slug] ?? null) : null,
    gallery: row.source === 'sh-wrapping' ? (SH_WRAPPING_GALLERY[row.slug] ?? []) : [],
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
