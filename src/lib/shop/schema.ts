// JSON-LD da LOJA. Deriva de buildColorSchema (src/lib/colorSchema.ts), mas
// generaliza brand/catálogo para servir a qualquer item — cor, padrão ou linha.
//
// A versão do edge (api/_lib/jsonld.ts) tem que contar a mesma história: bots
// sem JS leem aquela, o Google renderiza esta. Divergir entre as duas é o erro
// clássico dessa arquitetura.

import { SITE_URL } from '../siteConfig';
import { VERTICAL_LABEL } from './catalog';
import type { ShopItem } from './types';

const VERTICAL_PATH: Record<ShopItem['vertical'], string> = {
  PPF: '/ppf',
  WRAP: '/wrap',
  SIGN: '/sign',
  DECOR: '/decor',
};

export function buildShopItemSchema(item: ShopItem): string {
  const url = `${SITE_URL}/loja/${item.slug}`;
  const image = item.image
    ? `${SITE_URL}${item.image}`
    : `${SITE_URL}/assets/images/og-default.jpg`;

  const description =
    item.description ||
    `${item.name}${item.code ? ` (${item.code})` : ''} — ${item.line ?? item.brand}. Distribuição e consultoria técnica NZ Group.`;

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        '@id': `${url}#product`,
        name: item.name,
        url,
        brand: { '@type': 'Brand', name: item.brand },
        ...(item.code ? { sku: item.code } : {}),
        ...(item.hex ? { color: item.hex } : {}),
        description,
        image,
        offers: {
          '@type': 'Offer',
          availability: 'https://schema.org/InStock',
          priceCurrency: 'BRL',
          url,
          seller: { '@type': 'Organization', name: 'NZ Distribuidora', url: SITE_URL },
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Loja', item: `${SITE_URL}/loja` },
          {
            '@type': 'ListItem',
            position: 3,
            name: VERTICAL_LABEL[item.vertical],
            item: `${SITE_URL}${VERTICAL_PATH[item.vertical]}`,
          },
          { '@type': 'ListItem', position: 4, name: item.name, item: url },
        ],
      },
    ],
  });
}
