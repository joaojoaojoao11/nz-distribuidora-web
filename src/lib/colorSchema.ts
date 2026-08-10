import { SITE_URL } from './siteConfig';

// Product + BreadcrumbList para as páginas de cor (lado do cliente — o Google
// renderiza o JS e lê este schema; bots sem JS leem a versão do edge em
// api/_lib/jsonld.ts. Os dois contam a mesma história.)

interface ColorSchemaOpts {
  name: string;
  path: string;          // ex: /wrap/oracal-651/oracal-651-purple-red
  brand: string;         // ex: Oracal 651
  catalogPath: string;   // ex: /wrap/oracal-651
  catalogLabel: string;  // ex: Oracal 651
  sku?: string | null;
  hex?: string | null;
  description?: string | null;
}

export function buildColorSchema(o: ColorSchemaOpts): string {
  const url = `${SITE_URL}${o.path}`;
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        '@id': `${url}#product`,
        name: o.name,
        url,
        brand: { '@type': 'Brand', name: o.brand },
        ...(o.sku ? { sku: o.sku } : {}),
        ...(o.hex ? { color: o.hex } : {}),
        description: o.description || `Vinil ${o.brand} na cor ${o.name}, venda no atacado pela NZ Distribuidora.`,
        image: `${SITE_URL}/assets/images/og-default.jpg`,
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
          { '@type': 'ListItem', position: 2, name: 'Envelopamento', item: `${SITE_URL}/wrap` },
          { '@type': 'ListItem', position: 3, name: o.catalogLabel, item: `${SITE_URL}${o.catalogPath}` },
          { '@type': 'ListItem', position: 4, name: o.name, item: url },
        ],
      },
    ],
  });
}
