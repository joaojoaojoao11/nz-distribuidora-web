import { routeMeta, type RouteMeta } from './_lib/routeMeta.js';
import { signSlugs } from './_lib/signSlugs.js';
import { shDecorSlugs } from './_lib/shDecorSlugs.js';
import { ethernaSlugs } from './_lib/ethernaSlugs.js';
import { colorFamilies, colorTitle, colorDescription, cleanColorName, type ColorRow } from './_lib/colorCatalog.js';
import { nzwrapColorMeta } from './_lib/nzwrapColorMeta.js';
import { ppfLines } from './_lib/ppfLines.js';
import { getShopIndexItem, type ShopIndexItem } from './_lib/shopItems.js';
import { organization, localBusiness, webSite, breadcrumb, product, faqPage, article, collectionPage, graphScript } from './_lib/jsonld.js';

// Shell HTML com meta correta por rota, para TODOS os user-agents.
// O React continua renderizando o corpo no cliente; aqui garantimos que
// crawlers sem JS (WhatsApp, Facebook, LinkedIn, Bing) e o primeiro paint
// recebam title/description/canonical/OG corretos — e que rota inexistente
// devolva HTTP 404 de verdade (mata o soft-404 do SPA).
// vercel.json aponta o catch-all para cá; arquivos estáticos são servidos
// antes dos rewrites, então /assets, /robots.txt e /index.html não passam aqui.

export const config = {
  runtime: 'edge',
};

const SITE_URL = 'https://www.nzgroup.com.br';
const SITE_NAME = 'NZ Distribuidora';
const DEFAULT_OG_IMAGE = `${SITE_URL}/assets/images/og-default.jpg`;

interface ResolvedMeta extends RouteMeta {
  status: number;
  canonicalPath: string;
  type: 'website' | 'article';
  image?: string;
  schema?: Record<string, unknown>[];
}

// Rótulos curtos para o BreadcrumbList (título completo fica no <title>)
const crumbLabels: Record<string, string> = {
  '/loja': 'Loja',
  '/ppf': 'NZPPF',
  '/wrap': 'Envelopamento',
  '/sign': 'NZSIGN',
  '/decor': 'NZDECOR',
  '/blog': 'Blog',
  '/decor/sh': 'SH Decor',
  '/decor/etherna': 'Etherna Decor',
  '/wrap/nzwrap-premium': 'NZWRAP Premium',
  '/wrap/sh-colors': 'SH Wrapping',
  '/wrap/oracal-970ra': 'Oracal 970RA',
  '/wrap/oracal-651': 'Oracal 651',
  '/wrap/oracal-670ra': 'Oracal 670RA',
  '/wrap/metamark-mcx': 'Metamark MCX',
  '/wrap/metamark-7-series': 'Metamark Série 7',
  '/ppf/luxury-gloss': 'Luxury Gloss',
  '/ppf/prime-gloss': 'Prime Gloss',
  '/ppf/flow-gloss': 'Flow Gloss',
  '/ppf/core-gloss': 'Core Gloss',
  '/ppf/headlight': 'Headlight',
  '/ppf/windshield': 'Windshield',
};

// Páginas de listagem que merecem CollectionPage (institucionais ficam só com breadcrumb)
const catalogPaths = new Set([
  '/loja',
  '/ppf', '/wrap', '/sign', '/decor', '/decor/sh', '/decor/etherna', '/blog',
  '/wrap/nzwrap-premium', '/wrap/sh-colors', '/wrap/oracal-970ra', '/wrap/oracal-651',
  '/wrap/oracal-670ra', '/wrap/metamark-mcx', '/wrap/metamark-7-series',
]);

function crumbsFor(path: string, leafLabel?: string): Array<[string, string]> {
  const crumbs: Array<[string, string]> = [['Início', '/']];
  const segs = path.split('/').filter(Boolean);
  let acc = '';
  segs.forEach((s, i) => {
    acc += `/${s}`;
    const isLeaf = i === segs.length - 1;
    crumbs.push([(isLeaf && leafLabel) || crumbLabels[acc] || prettify(s), acc]);
  });
  return crumbs;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function prettify(slug: string): string {
  return slug
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

const NOT_FOUND_META: ResolvedMeta = {
  status: 404,
  canonicalPath: '/',
  type: 'website',
  title: 'Página não encontrada',
  description: 'A página que você procura não existe ou foi movida.',
  noindex: true,
};

async function fetchBlogPostMeta(slug: string): Promise<ResolvedMeta | null> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  if (!supabaseUrl || !supabaseKey) return null;

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/blog_posts?slug=eq.${encodeURIComponent(slug)}&status=eq.published&select=title,meta_description,cover_image_url,faq,published_at,updated_at,author&limit=1`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as Array<{
      title: string;
      meta_description: string | null;
      cover_image_url: string | null;
      faq: Array<{ question: string; answer: string }> | null;
      published_at: string | null;
      updated_at: string | null;
      author: string | null;
    }>;
    const post = rows?.[0];
    if (!post) return null;
    const path = `/blog/${slug}`;
    const schema: Record<string, unknown>[] = [
      organization(),
      article({
        path,
        title: post.title,
        description: post.meta_description || post.title,
        image: post.cover_image_url,
        publishedAt: post.published_at,
        updatedAt: post.updated_at,
        author: post.author,
      }),
      breadcrumb(crumbsFor(path, post.title)),
    ];
    if (Array.isArray(post.faq) && post.faq.length > 0) schema.push(faqPage(path, post.faq));
    return {
      status: 200,
      canonicalPath: path,
      type: 'article',
      title: post.title,
      description: post.meta_description || post.title,
      image: post.cover_image_url || undefined,
      schema,
    };
  } catch {
    return null;
  }
}

/**
 * Produto que só existe no banco (`loja_catalogo`): meta gerada da linha.
 * Só descritivo — a view não tem preço, e este caminho não pede nada além.
 */
async function fetchLojaItem(slug: string): Promise<ShopIndexItem | null> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  if (!supabaseUrl || !supabaseKey) return null;
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/loja_catalogo?slug=eq.${encodeURIComponent(slug.toLowerCase())}&select=slug,nome,marca_exibicao,vertical,codigo,imagem,linha_label,acabamento_label,descricao,seo_titulo,seo_descricao,legacy_path&limit=1`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as {
      slug: string; nome: string; marca_exibicao: string | null; vertical: string; codigo: string | null;
      imagem: string | null; linha_label: string | null; acabamento_label: string | null;
      descricao: string | null; seo_titulo: string | null; seo_descricao: string | null; legacy_path: string | null;
    }[];
    const r = rows?.[0];
    if (!r) return null;
    const brand = r.marca_exibicao ?? 'NZ';
    const linha = r.linha_label ?? brand;
    const title = r.seo_titulo ?? `${r.nome}${r.codigo ? ` · ${r.codigo}` : ''} — ${linha}`;
    const description =
      r.seo_descricao ??
      r.descricao ??
      `${r.nome}${r.codigo ? ` (${r.codigo})` : ''} — ${linha}${r.acabamento_label ? `, acabamento ${r.acabamento_label.toLowerCase()}` : ''}. Distribuição e consultoria técnica NZ Group.`;
    return {
      slug: r.slug,
      name: r.nome,
      brand,
      vertical: r.vertical,
      title,
      description,
      image: r.imagem,
      selfCanonical: !r.legacy_path,
      legacyPath: r.legacy_path,
    };
  } catch {
    return null;
  }
}

async function fetchColorMeta(
  cfg: (typeof colorFamilies)[string],
  slug: string,
  path: string,
): Promise<ResolvedMeta | null> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  if (!supabaseUrl || !supabaseKey) return null;

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/web_catalog_products?slug=eq.${encodeURIComponent(slug)}&brand=eq.${encodeURIComponent(cfg.brand)}&is_active=eq.true&select=name,sku,finish_type,hex_code,garantia_anos,durabilidade_anos,technical_description&limit=1`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as ColorRow[];
    const row = rows?.[0];
    if (!row) return null;
    const description = colorDescription(row, cfg);
    return {
      status: 200,
      canonicalPath: path,
      type: 'website',
      title: colorTitle(row, cfg),
      description,
      schema: [
        organization(),
        product({ name: cleanColorName(row.name), path, brand: cfg.brand, sku: row.sku, description, color: row.hex_code }),
        breadcrumb(crumbsFor(path, cleanColorName(row.name))),
      ],
    };
  } catch {
    return null;
  }
}

async function resolveMeta(pathname: string): Promise<ResolvedMeta> {
  const path = pathname !== '/' ? pathname.replace(/\/+$/, '') : '/';

  const staticMeta = routeMeta[path];
  if (staticMeta) {
    const schema: Record<string, unknown>[] = [organization()];
    if (path === '/') {
      schema.push(localBusiness(), webSite());
    } else {
      const line = ppfLines[path];
      if (line) {
        schema.push(
          product({ name: line.name, path, brand: 'NZPPF', description: line.description }),
          faqPage(path, line.faq),
        );
      } else if (catalogPaths.has(path)) {
        schema.push(collectionPage(path, staticMeta.title, staticMeta.description));
      }
      schema.push(breadcrumb(crumbsFor(path)));
    }
    return { ...staticMeta, status: 200, canonicalPath: path, type: 'website', schema };
  }

  const segments = path.split('/').filter(Boolean);

  // /blog/:slug — valida no Supabase; post inexistente = 404 real
  if (segments[0] === 'blog' && segments.length === 2) {
    const meta = await fetchBlogPostMeta(segments[1]);
    return meta || NOT_FOUND_META;
  }

  // /sign/:slug — lista fixa
  if (segments[0] === 'sign' && segments.length === 2) {
    if (!signSlugs.includes(segments[1])) return NOT_FOUND_META;
    const name = `Avery ${segments[1].toUpperCase().replace(/-/g, ' ')}`;
    const description = 'Linha Avery Dennison para comunicação visual, com distribuição oficial NZSIGN no Brasil.';
    return {
      status: 200,
      canonicalPath: path,
      type: 'website',
      title: `${name} — Comunicação Visual NZSIGN`,
      description,
      schema: [
        organization(),
        product({ name, path, brand: 'Avery Dennison', description }),
        breadcrumb(crumbsFor(path, name)),
      ],
    };
  }

  // /decor/sh/:slug e /decor/etherna/:slug — listas fixas
  if (segments[0] === 'decor' && segments.length === 3) {
    const [, family, slug] = segments;
    if (family === 'sh' && shDecorSlugs.includes(slug)) {
      const description = 'Padrão de vinil decorativo SH Decor: autoadesivo, atóxico, lavável e Bubble Free. Orçamento via NZDecor.';
      return {
        status: 200,
        canonicalPath: path,
        type: 'website',
        title: `${prettify(slug)} — SH Decor | NZDECOR`,
        description,
        schema: [
          organization(),
          product({ name: prettify(slug), path, brand: 'SH Decor', description }),
          breadcrumb(crumbsFor(path, prettify(slug))),
        ],
      };
    }
    if (family === 'etherna' && ethernaSlugs.includes(slug)) {
      const description = 'Padrão de vinil adesivo decorativo Etherna Decor, indústria nacional com Sistema Shield®. Orçamento via NZDecor.';
      return {
        status: 200,
        canonicalPath: path,
        type: 'website',
        title: `${prettify(slug)} — Etherna Decor | NZDECOR`,
        description,
        schema: [
          organization(),
          product({ name: prettify(slug), path, brand: 'Etherna Decor', description }),
          breadcrumb(crumbsFor(path, prettify(slug))),
        ],
      };
    }
    return NOT_FOUND_META;
  }

  // Páginas de cor do catálogo Wrap — meta única por cor (programmatic SEO)
  if (segments[0] === 'wrap' && segments.length === 3) {
    const [, family, slug] = segments;

    // NZWRAP Premium: catálogo estático, URL usa o SKU em minúsculas
    if (family === 'nzwrap-premium') {
      const c = nzwrapColorMeta[slug.toLowerCase()];
      if (!c) return NOT_FOUND_META;
      const row: ColorRow = { name: c.name, sku: slug.toUpperCase(), finish_type: c.finish, hex_code: c.hex, durabilidade_anos: 5, garantia_anos: 3 };
      const canonicalPath = `/wrap/nzwrap-premium/${slug.toLowerCase()}`;
      const description = colorDescription(row, { label: 'NZWRAP Premium' });
      return {
        status: 200,
        canonicalPath,
        type: 'website',
        title: colorTitle(row, { label: 'NZWRAP Premium', skuInTitle: true }),
        description,
        schema: [
          organization(),
          product({ name: cleanColorName(c.name), path: canonicalPath, brand: 'NZWRAP', sku: slug.toUpperCase(), description, color: c.hex }),
          breadcrumb(crumbsFor(canonicalPath, cleanColorName(c.name))),
        ],
      };
    }

    // SH / Oracal 651 / Oracal 670RA: catálogo no Supabase, URL usa o slug
    const cfg = colorFamilies[family];
    if (cfg) {
      const meta = await fetchColorMeta(cfg, slug, path);
      return meta || NOT_FOUND_META;
    }

    // Família sem página de cor (ex.: metamark, oracal-970ra) = 404 real
    return NOT_FOUND_META;
  }

  // /loja/:slug — página de produto unificada.
  //
  // Canonical em duas classes: os itens que já têm página de detalhe própria
  // apontam para ela (a versão da loja é conveniência de navegação, não uma
  // segunda entidade); os 129 itens M7 e MCX, que hoje só existem como
  // ?cor=<slug> dentro do catálogo, são auto-canônicos — e é onde a LOJA gera
  // páginas indexáveis novas em vez de duplicar as existentes.
  if (segments[0] === 'loja' && segments.length === 2) {
    // Primeiro o índice estático (rápido, cobre os 505 editoriais); depois o
    // banco, para os produtos criados do ERP que não existem no bundle.
    const item = getShopIndexItem(segments[1]) ?? (await fetchLojaItem(segments[1]));
    if (!item) return NOT_FOUND_META;

    const canonicalPath = item.selfCanonical ? path : item.legacyPath ?? path;

    return {
      status: 200,
      canonicalPath,
      type: 'website',
      title: item.title,
      description: item.description,
      image: item.image ? `${SITE_URL}${item.image}` : undefined,
      schema: [
        organization(),
        product({
          name: item.name,
          path: canonicalPath,
          brand: item.brand,
          description: item.description,
        }),
        breadcrumb(crumbsFor(path, item.name)),
      ],
    };
  }

  return NOT_FOUND_META;
}

function buildHeadBlock(meta: ResolvedMeta): string {
  const fullTitle = `${meta.title} | ${SITE_NAME}`;
  const canonical = `${SITE_URL}${meta.canonicalPath === '/' ? '' : meta.canonicalPath}` || SITE_URL;
  const image = meta.image || DEFAULT_OG_IMAGE;
  const t = escapeHtml(fullTitle);
  const d = escapeHtml(meta.description);
  const i = escapeHtml(image);

  return [
    `<title data-edge-seo="1">${t}</title>`,
    `<meta data-edge-seo="1" name="description" content="${d}" />`,
    meta.noindex ? `<meta data-edge-seo="1" name="robots" content="noindex, nofollow" />` : '',
    `<link data-edge-seo="1" rel="canonical" href="${canonical}" />`,
    `<meta data-edge-seo="1" property="og:title" content="${t}" />`,
    `<meta data-edge-seo="1" property="og:description" content="${d}" />`,
    `<meta data-edge-seo="1" property="og:url" content="${canonical}" />`,
    `<meta data-edge-seo="1" property="og:type" content="${meta.type}" />`,
    `<meta data-edge-seo="1" property="og:image" content="${i}" />`,
    `<meta data-edge-seo="1" property="og:site_name" content="${SITE_NAME}" />`,
    `<meta data-edge-seo="1" property="og:locale" content="pt_BR" />`,
    `<meta data-edge-seo="1" name="twitter:card" content="summary_large_image" />`,
    `<meta data-edge-seo="1" name="twitter:title" content="${t}" />`,
    `<meta data-edge-seo="1" name="twitter:description" content="${d}" />`,
    `<meta data-edge-seo="1" name="twitter:image" content="${i}" />`,
    graphScript(meta.schema || []),
  ].filter(Boolean).join('\n    ');
}

function injectMeta(shell: string, meta: ResolvedMeta): string {
  // Remove as tags estáticas do index.html que vamos substituir (evita duplicata)
  let html = shell
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\s+name="description"[^>]*\/?>(\r?\n)?/i, '')
    .replace(/<meta\s+property="og:[^"]*"[^>]*\/?>(\r?\n)?/gi, '');

  return html.replace('</head>', `    ${buildHeadBlock(meta)}\n  </head>`);
}

export default async function handler(req: Request) {
  const url = new URL(req.url);
  // O rewrite manda o path original em ?path= não — usamos o próprio pathname
  // da request (a Vercel preserva o path original no rewrite).
  const pathname = url.pathname === '/api/render' ? (url.searchParams.get('path') || '/') : url.pathname;

  // Busca o shell buildado no próprio deployment (filesystem serve antes do rewrite)
  let shell: string | null = null;
  try {
    const res = await fetch(`${url.origin}/index.html`);
    if (res.ok) shell = await res.text();
  } catch {
    shell = null;
  }

  // Fallback de segurança: sem shell, devolve redirect suave pro root estático
  if (!shell) {
    return new Response(null, { status: 307, headers: { Location: '/index.html' } });
  }

  try {
    const meta = await resolveMeta(pathname);

    // Higiene de indexação das facetas da LOJA. O rewrite do vercel.json
    // repassa a query original junto do `path`, então dá para contar aqui.
    // Uma faceta é intenção de busca legítima (/loja?cor=azul); duas ou mais,
    // ou qualquer texto livre, é combinação infinita e vira noindex apontando
    // para /loja. A mesma regra roda no cliente (Loja.tsx) — as duas camadas
    // precisam concordar.
    if (pathname === '/loja') {
      const facetKeys = [...url.searchParams.keys()].filter((k) => k !== 'path');
      if (facetKeys.includes('q') || facetKeys.includes('sort') || facetKeys.length >= 2) {
        meta.noindex = true;
        meta.canonicalPath = '/loja';
      }
    }

    const html = injectMeta(shell, meta);
    const isColorPage = /^\/wrap\/[^/]+\/[^/]+$/.test(pathname);
    const isShopProduct = /^\/loja\/[^/]+$/.test(pathname);
    const cache = meta.status === 404
      ? 'public, s-maxage=300'
      : pathname.startsWith('/blog/')
        ? 'public, s-maxage=600, stale-while-revalidate=86400'
        : isColorPage || isShopProduct
          ? 'public, s-maxage=86400, stale-while-revalidate=604800'
          : 'public, s-maxage=3600, stale-while-revalidate=86400';

    return new Response(html, {
      status: meta.status,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': cache,
      },
    });
  } catch (err) {
    console.error('[render] falhou, servindo shell puro:', err);
    return new Response(shell, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}
