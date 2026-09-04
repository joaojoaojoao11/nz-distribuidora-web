// Adapter do snapshot de web_catalog_products: Oracal 651, Oracal 670RA e
// SH Wrapping (116 cores).
//
// Estas são as únicas cores do catálogo SEM imagem — a tabela não tem coluna de
// imagem e as páginas de cor sempre renderizaram swatch a partir do hex. O card
// da LOJA faz o mesmo, com um leve gradiente para não ficar chapado ao lado das
// texturas fotografadas do DECOR.

import { DB_SNAPSHOT, type DbSnapshotRow, type DbSnapshotSource } from '../generated/dbSnapshot';
import { resolveColor } from '../color/resolveColor';
import { normalizeFinishString } from '../finish/normalizeFinish';
import { buildSearchText, shopSlug, type BrandKey, type ShopItem, type ShopSpec } from '../types';

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
    // A tabela não tem coluna de imagem: o card resolve por swatch do hex.
    image: null,
    gallery: [],
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
