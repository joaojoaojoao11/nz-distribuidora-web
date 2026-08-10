// Construtores de JSON-LD para o edge (api/render.ts).
// REGRA: para crawlers sem JS, o schema vem daqui (tag data-edge-seo, removida
// na hidratação); para o Google (que renderiza JS) e navegação SPA, o schema
// continua vindo do client via <SEO schema={...}> (react-helmet). Os dois devem
// contar a mesma história, não precisam ser idênticos byte a byte.

const SITE_URL = 'https://www.nzgroup.com.br';
const SITE_NAME = 'NZ Distribuidora';
const LOGO = `${SITE_URL}/assets/logos/logo-nz-group-base.svg`;

type Node = Record<string, unknown>;

export function organization(): Node {
  return {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: LOGO,
    sameAs: ['https://www.instagram.com/nzgroup.br'],
  };
}

export function localBusiness(): Node {
  return {
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}/#localbusiness`,
    name: SITE_NAME,
    url: SITE_URL,
    image: `${SITE_URL}/assets/images/og-default.jpg`,
    telephone: '+55 11 91890-7565',
    email: 'joaovitor@nzdistribuidora.com.br',
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'R. Brasilândia, 366 — Chácaras Marco',
      addressLocality: 'Barueri',
      addressRegion: 'SP',
      postalCode: '06419-060',
      addressCountry: 'BR',
    },
    geo: { '@type': 'GeoCoordinates', latitude: -23.4804547, longitude: -46.8865522 },
    areaServed: [{ '@type': 'State', name: 'São Paulo' }, { '@type': 'Country', name: 'Brasil' }],
    sameAs: ['https://www.instagram.com/nzgroup.br'],
    openingHoursSpecification: [{
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '08:00',
      closes: '18:00',
    }],
  };
}

export function webSite(): Node {
  return {
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: 'pt-BR',
    publisher: { '@id': `${SITE_URL}/#organization` },
  };
}

// crumbs: pares [label, path] na ordem, começando na Home
export function breadcrumb(crumbs: Array<[string, string]>): Node {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map(([name, path], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: `${SITE_URL}${path === '/' ? '' : path}` || SITE_URL,
    })),
  };
}

export function product(opts: {
  name: string;
  path: string;
  brand: string;
  sku?: string | null;
  description: string;
  image?: string | null;
  color?: string | null;
}): Node {
  const node: Node = {
    '@type': 'Product',
    '@id': `${SITE_URL}${opts.path}#product`,
    name: opts.name,
    description: opts.description,
    url: `${SITE_URL}${opts.path}`,
    brand: { '@type': 'Brand', name: opts.brand },
    image: opts.image || `${SITE_URL}/assets/images/og-default.jpg`,
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      priceCurrency: 'BRL',
      url: `${SITE_URL}${opts.path}`,
      seller: { '@id': `${SITE_URL}/#organization` },
    },
  };
  if (opts.sku) node.sku = opts.sku;
  if (opts.color) node.color = opts.color;
  return node;
}

export function faqPage(path: string, faq: Array<{ question: string; answer: string }>): Node {
  return {
    '@type': 'FAQPage',
    '@id': `${SITE_URL}${path}#faq`,
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

export function article(opts: {
  path: string;
  title: string;
  description: string;
  image?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  author?: string | null;
}): Node {
  return {
    '@type': 'Article',
    '@id': `${SITE_URL}${opts.path}#article`,
    headline: opts.title,
    description: opts.description,
    image: opts.image || `${SITE_URL}/assets/images/og-default.jpg`,
    mainEntityOfPage: `${SITE_URL}${opts.path}`,
    inLanguage: 'pt-BR',
    ...(opts.publishedAt ? { datePublished: opts.publishedAt } : {}),
    ...(opts.updatedAt ? { dateModified: opts.updatedAt } : {}),
    author: { '@type': 'Organization', name: opts.author || 'Engenharia NZ', url: `${SITE_URL}/sobre` },
    publisher: { '@id': `${SITE_URL}/#organization` },
  };
}

export function collectionPage(path: string, name: string, description: string): Node {
  return {
    '@type': 'CollectionPage',
    '@id': `${SITE_URL}${path}#collection`,
    name,
    description,
    url: `${SITE_URL}${path}`,
    isPartOf: { '@id': `${SITE_URL}/#website` },
  };
}

// Serializa o @graph para injeção segura dentro de <script> (escapa "<")
export function graphScript(nodes: Node[]): string {
  if (nodes.length === 0) return '';
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes }).replace(/</g, '\\u003c');
  return `<script data-edge-seo="1" type="application/ld+json">${json}</script>`;
}
