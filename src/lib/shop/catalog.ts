// Catálogo unificado da LOJA — o único ponto de entrada para os ~480 itens.
//
// Tudo aqui é síncrono e estático: o snapshot do banco é gerado no build
// (scripts/generate-shop-snapshot.mjs), então busca e filtro não têm skeleton.
// O que NÃO vem daqui é o estoque, que é volátil e é lido em runtime do espelho
// do NZERP.

import { ethernaToShopItems, shDecorToShopItems } from './adapters/decor';
import {
  metamark7ToShopItems,
  metamarkMcxToShopItems,
  nzwrapToShopItems,
} from './adapters/cores';
import { averyToShopItems, md80ToShopItems, ppfToShopItems } from './adapters/editorial';
import { dbSnapshotToShopItems } from './adapters/dbSnapshot';
import { assertUniqueSlugs, type ShopItem, type SourceKey, type Vertical } from './types';

function build(): ShopItem[] {
  const items = [
    ...nzwrapToShopItems(),
    ...metamarkMcxToShopItems(),
    ...metamark7ToShopItems(),
    ...dbSnapshotToShopItems(),
    ...ethernaToShopItems(),
    ...shDecorToShopItems(),
    ...averyToShopItems(),
    ...md80ToShopItems(),
    ...ppfToShopItems(),
  ];

  if (import.meta.env.DEV) {
    // Colisão de slug entre fontes derruba uma página de produto silenciosamente
    // (etherna e sh-decor já compartilham 3 slugs de origem). Falhar alto.
    assertUniqueSlugs(items);
  }

  return items;
}

export const SHOP_ITEMS: ShopItem[] = build();

const BY_SLUG: ReadonlyMap<string, ShopItem> = new Map(SHOP_ITEMS.map((i) => [i.slug, i]));

export function getShopItem(slug: string): ShopItem | undefined {
  return BY_SLUG.get(slug.toLowerCase());
}

/** Índice reverso: rota antiga → item. Usado pelos redirects das páginas legadas. */
const BY_LEGACY: ReadonlyMap<string, ShopItem> = new Map(
  SHOP_ITEMS.flatMap((i) => (i.legacyPath ? [[i.legacyPath.toLowerCase(), i] as const] : []))
);

export function getShopItemByLegacyPath(path: string): ShopItem | undefined {
  return BY_LEGACY.get(path.toLowerCase());
}

export interface ShopCounts {
  total: number;
  porFonte: Record<string, number>;
  porVertical: Record<string, number>;
  porTipo: Record<string, number>;
  semCor: number;
  semImagem: number;
  semAcabamento: number;
}

/** Diagnóstico de cobertura — usado pelo autoteste de DEV e pela auditoria. */
export function shopCounts(items: ShopItem[] = SHOP_ITEMS): ShopCounts {
  const porFonte: Record<string, number> = {};
  const porVertical: Record<string, number> = {};
  const porTipo: Record<string, number> = {};
  let semCor = 0;
  let semImagem = 0;
  let semAcabamento = 0;

  for (const item of items) {
    porFonte[item.source] = (porFonte[item.source] ?? 0) + 1;
    porVertical[item.vertical] = (porVertical[item.vertical] ?? 0) + 1;
    porTipo[item.kind] = (porTipo[item.kind] ?? 0) + 1;
    // Só itens do tipo 'cor' deveriam ter família — um padrão sem cor é normal.
    if (item.kind === 'cor' && !item.colorFamilies.length) semCor++;
    if (!item.image && !item.hex) semImagem++;
    if (item.kind === 'cor' && !item.finishes.length) semAcabamento++;
  }

  return {
    total: items.length,
    porFonte,
    porVertical,
    porTipo,
    semCor,
    semImagem,
    semAcabamento,
  };
}

export const SOURCE_LABEL: Record<SourceKey, string> = {
  etherna: 'Etherna Decor',
  'sh-decor': 'SH Decor',
  m7: 'Metamark 7 Series',
  mcx: 'MetaCast MCX',
  nzwrap: 'NZWRAP Premium',
  'oracal-651': 'Oracal 651',
  'oracal-670': 'Oracal 670RA',
  'sh-wrapping': 'SH Wrapping',
  avery: 'Avery Dennison',
  md80: 'Metamark MD-80',
  ppf: 'NZPPF',
};

export const VERTICAL_LABEL: Record<Vertical, string> = {
  PPF: 'NZPPF',
  WRAP: 'NZWRAP',
  SIGN: 'NZSIGN',
  DECOR: 'NZDECOR',
};

export const VERTICAL_ORDER: Vertical[] = ['WRAP', 'DECOR', 'SIGN', 'PPF'];
