import { createClient } from '@supabase/supabase-js';
import { shDecorSlugs } from './_lib/shDecorSlugs.js';
import { ethernaSlugs } from './_lib/ethernaSlugs.js';

// Initialize Supabase admin client for the serverless function
// We use Vite's environment variables if available locally, or Vercel's standard environment variables in production
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export const config = {
  runtime: 'edge', // Use Edge runtime for fast execution globally
};

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  // Base static paths
  const staticPaths = [
    '',
    '/ppf',
    '/ppf/luxury-gloss',
    '/ppf/prime-gloss',
    '/ppf/flow-gloss',
    '/ppf/core-gloss',
    '/wrap',
    '/sign',
    '/decor',
    '/decor/sh',
    '/decor/etherna',
    '/sobre',
    '/encontre-aplicador',
    '/blog'
  ];

  // Fetch dynamic blog posts
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, updated_at')
    .eq('status', 'published');

  // We could also fetch products here if they had dedicated DB rows, 
  // but for now we rely on the hardcoded wrapping catalog paths built into the app.
  
  let sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  sitemapContent += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // Add static paths
  for (const path of staticPaths) {
    sitemapContent += `  <url>\n`;
    sitemapContent += `    <loc>${baseUrl}${path}</loc>\n`;
    sitemapContent += `    <changefreq>weekly</changefreq>\n`;
    sitemapContent += `    <priority>${path === '' ? '1.0' : '0.8'}</priority>\n`;
    sitemapContent += `  </url>\n`;
  }

  // Add SH Decor catalog products
  for (const slug of shDecorSlugs) {
    sitemapContent += `  <url>\n`;
    sitemapContent += `    <loc>${baseUrl}/decor/sh/${slug}</loc>\n`;
    sitemapContent += `    <changefreq>monthly</changefreq>\n`;
    sitemapContent += `    <priority>0.7</priority>\n`;
    sitemapContent += `  </url>\n`;
  }

  // Add Etherna Decor catalog products
  for (const slug of ethernaSlugs) {
    sitemapContent += `  <url>\n`;
    sitemapContent += `    <loc>${baseUrl}/decor/etherna/${slug}</loc>\n`;
    sitemapContent += `    <changefreq>monthly</changefreq>\n`;
    sitemapContent += `    <priority>0.7</priority>\n`;
    sitemapContent += `  </url>\n`;
  }

  // Add dynamic blog posts
  if (posts) {
    for (const post of posts) {
      sitemapContent += `  <url>\n`;
      sitemapContent += `    <loc>${baseUrl}/blog/${post.slug}</loc>\n`;
      sitemapContent += `    <lastmod>${new Date(post.updated_at).toISOString()}</lastmod>\n`;
      sitemapContent += `    <changefreq>monthly</changefreq>\n`;
      sitemapContent += `    <priority>0.7</priority>\n`;
      sitemapContent += `  </url>\n`;
    }
  }

  sitemapContent += `</urlset>`;

  return new Response(sitemapContent, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
