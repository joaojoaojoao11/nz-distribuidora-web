// Adapters dos dois catálogos DECOR: Etherna (159) e SH Decor (55).
//
// Os dois compartilham 3 slugs — 'formica-cinza-glacial', 'formica-nude' e
// 'formica-off-white' — daí o prefixo obrigatório em shopSlug().
//
// Padrões decorativos não têm hex. A cor sai apenas de tokens do nome, o que
// acerta 'Fórmica Azul Petróleo' e 'Couro Branco' e deixa `colorFamilies`
// vazio no resto — que é o correto: uma madeira não pertence a família de cor.

import {
  ethernaFamilies,
  ethernaProducts,
  type EthernaProduct,
} from '../../../pages/Decor/ethernaProducts';
import {
  SH_DEFAULT_BADGES,
  shDecorFamilies,
  shDecorProducts,
  type ShDecorProduct,
} from '../../../pages/Decor/shDecorProducts';
import { resolveColor } from '../color/resolveColor';
import { patternFromEtherna, patternFromShDecor } from '../pattern/taxonomy';
import { buildSearchText, shopSlug, type ShopItem } from '../types';

/** Extrai "9 anos" → 9 das specs, que é onde a durabilidade vive nos dois catálogos. */
function durabilidadeFromSpecs(specs: { label: string; value: string }[]): number | null {
  const spec = specs.find((s) => /durabilidade/i.test(s.label));
  if (!spec) return null;
  const match = spec.value.match(/(\d+)\s*anos?/i);
  return match ? Number(match[1]) : null;
}

function ethernaToShopItem(p: EthernaProduct): ShopItem {
  const familyName = ethernaFamilies.find((f) => f.slug === p.family)?.name ?? p.family;
  const color = resolveColor({ name: p.name });
  const patternFamily = patternFromEtherna(p.family);

  return {
    slug: shopSlug('etherna', p.slug),
    source: 'etherna',
    sourceId: p.slug,
    name: p.name,
    code: p.code || null,
    subtitle: p.collection || familyName,
    brand: 'Etherna Decor',
    line: 'Etherna Decor',
    lineKey: 'etherna',
    brandKey: 'etherna',
    vertical: 'DECOR',
    kind: 'padrao',
    aplicacoes: ['arquitetonico'],
    image: p.images.texture,
    gallery: [p.images.texture, ...p.images.ambient],
    hex: null,
    colorFamilies: color.families,
    colorSubfamilies: color.subfamilies,
    colorConfidence: color.confidence,
    finishes: [],
    finishLabel: null,
    patternFamily,
    specs: p.specs,
    badges: p.badges,
    garantiaAnos: null,
    durabilidadeAnos: durabilidadeFromSpecs(p.specs),
    description: p.description,
    legacyPath: `/decor/etherna/${p.slug}`,
    searchText: buildSearchText([
      p.name,
      p.code,
      familyName,
      p.collection,
      'etherna decor vinil adesivo decorativo arquitetonico',
      p.seo?.keywords,
    ]),
  };
}

function shDecorToShopItem(p: ShDecorProduct): ShopItem {
  const familyName = shDecorFamilies.find((f) => f.slug === p.family)?.name ?? p.family;
  const color = resolveColor({ name: p.name });
  const patternFamily = patternFromShDecor(p.family);

  return {
    slug: shopSlug('sh-decor', p.slug),
    source: 'sh-decor',
    sourceId: p.slug,
    name: p.name,
    code: p.code || null,
    subtitle: familyName,
    brand: 'SH Decor',
    line: 'SH Decor',
    lineKey: 'sh-decor',
    brandKey: 'sh',
    vertical: 'DECOR',
    kind: 'padrao',
    aplicacoes: ['arquitetonico'],
    image: p.images.texture,
    gallery: [p.images.texture, ...p.images.ambient],
    hex: null,
    colorFamilies: color.families,
    colorSubfamilies: color.subfamilies,
    colorConfidence: color.confidence,
    finishes: [],
    finishLabel: null,
    patternFamily,
    specs: p.specs,
    badges: p.badges ?? SH_DEFAULT_BADGES,
    garantiaAnos: null,
    durabilidadeAnos: durabilidadeFromSpecs(p.specs),
    description: p.description,
    legacyPath: `/decor/sh/${p.slug}`,
    searchText: buildSearchText([
      p.name,
      p.code,
      familyName,
      'sh decor vinil autoadesivo decorativo revestimento',
      p.seo?.keywords,
    ]),
  };
}

export function ethernaToShopItems(): ShopItem[] {
  return ethernaProducts.map(ethernaToShopItem);
}

export function shDecorToShopItems(): ShopItem[] {
  return shDecorProducts.map(shDecorToShopItem);
}
