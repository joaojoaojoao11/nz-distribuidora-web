import { routeMeta, type RouteMeta } from './_lib/routeMeta.js';
import { signSlugs } from './_lib/signSlugs.js';
import { shDecorSlugs } from './_lib/shDecorSlugs.js';
import { ethernaSlugs } from './_lib/ethernaSlugs.js';
import { colorFamilies, colorTitle, colorDescription, type ColorRow } from './_lib/colorCatalog.js';
import { nzwrapColorMeta } from './_lib/nzwrapColorMeta.js';

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
      `${supabaseUrl}/rest/v1/blog_posts?slug=eq.${encodeURIComponent(slug)}&status=eq.published&select=title,meta_description,cover_image_url&limit=1`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as Array<{
      title: string;
      meta_description: string | null;
      cover_image_url: string | null;
    }>;
    const post = rows?.[0];
    if (!post) return null;
    return {
      status: 200,
      canonicalPath: `/blog/${slug}`,
      type: 'article',
      title: post.title,
      description: post.meta_description || post.title,
      image: post.cover_image_url || undefined,
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
    return {
      status: 200,
      canonicalPath: path,
      type: 'website',
      title: colorTitle(row, cfg),
      description: colorDescription(row, cfg),
    };
  } catch {
    return null;
  }
}

async function resolveMeta(pathname: string): Promise<ResolvedMeta> {
  const path = pathname !== '/' ? pathname.replace(/\/+$/, '') : '/';

  const staticMeta = routeMeta[path];
  if (staticMeta) {
    return { ...staticMeta, status: 200, canonicalPath: path, type: 'website' };
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
    return {
      status: 200,
      canonicalPath: path,
      type: 'website',
      title: `Avery ${segments[1].toUpperCase().replace(/-/g, ' ')} — Comunicação Visual NZSIGN`,
      description: 'Linha Avery Dennison para comunicação visual, com distribuição oficial NZSIGN no Brasil.',
    };
  }

  // /decor/sh/:slug e /decor/etherna/:slug — listas fixas
  if (segments[0] === 'decor' && segments.length === 3) {
    const [, family, slug] = segments;
    if (family === 'sh' && shDecorSlugs.includes(slug)) {
      return {
        status: 200,
        canonicalPath: path,
        type: 'website',
        title: `${prettify(slug)} — SH Decor | NZDECOR`,
        description: 'Padrão de vinil decorativo SH Decor: autoadesivo, atóxico, lavável e Bubble Free. Orçamento via NZDecor.',
      };
    }
    if (family === 'etherna' && ethernaSlugs.includes(slug)) {
      return {
        status: 200,
        canonicalPath: path,
        type: 'website',
        title: `${prettify(slug)} — Etherna Decor | NZDECOR`,
        description: 'Padrão de vinil adesivo decorativo Etherna Decor, indústria nacional com Sistema Shield®. Orçamento via NZDecor.',
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
      return {
        status: 200,
        canonicalPath: `/wrap/nzwrap-premium/${slug.toLowerCase()}`,
        type: 'website',
        title: colorTitle(row, { label: 'NZWRAP Premium', skuInTitle: true }),
        description: colorDescription(row, { label: 'NZWRAP Premium' }),
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
    const html = injectMeta(shell, meta);
    const isColorPage = /^\/wrap\/[^/]+\/[^/]+$/.test(pathname);
    const cache = meta.status === 404
      ? 'public, s-maxage=300'
      : pathname.startsWith('/blog/')
        ? 'public, s-maxage=600, stale-while-revalidate=86400'
        : isColorPage
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
