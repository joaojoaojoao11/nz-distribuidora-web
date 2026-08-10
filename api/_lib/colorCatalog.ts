// Config das famílias de páginas de cor do catálogo Wrap (programmatic SEO).
// Usado por api/render.ts (meta única por cor no edge) e api/sitemap.ts.
// As 3 famílias de banco resolvem pelo slug em web_catalog_products;
// a NZWRAP Premium resolve pelo SKU no mapa estático nzwrapColorMeta.ts.

export interface ColorFamilyCfg {
  brand: string;        // valor exato da coluna web_catalog_products.brand
  label: string;        // nome comercial exibido no title
  routePrefix: string;  // prefixo da rota pública
  skuInTitle: boolean;  // SKUs Oracal são termo de busca real ("oracal 651 025")
}

export const colorFamilies: Record<string, ColorFamilyCfg> = {
  'sh-colors':    { brand: 'SH Wrapping', label: 'SH Wrapping', routePrefix: '/wrap/sh-colors',    skuInTitle: false },
  'oracal-651':   { brand: 'Oracal 651',  label: 'Oracal 651',  routePrefix: '/wrap/oracal-651',   skuInTitle: true },
  'oracal-670ra': { brand: 'Oracal 670',  label: 'Oracal 670RA', routePrefix: '/wrap/oracal-670ra', skuInTitle: true },
};

export interface ColorRow {
  name: string;
  sku?: string | null;
  finish_type?: string | null;
  hex_code?: string | null;
  garantia_anos?: number | null;
  durabilidade_anos?: number | null;
  technical_description?: string | null;
}

// "AMG GREY" -> "AMG Grey"; "NZWRAP FERRARI METALLIC RED" -> "Ferrari Metallic Red"
export function cleanColorName(raw: string): string {
  const noBrand = raw.replace(/^NZWRAP\s+/i, '').trim();
  return noBrand
    .split(/\s+/)
    .map((w) => (/^[A-Z0-9-]{2,4}$/.test(w) ? w : w[0]?.toUpperCase() + w.slice(1).toLowerCase()))
    .join(' ');
}

export function colorTitle(row: ColorRow, cfg: { label: string; skuInTitle: boolean }): string {
  const name = cleanColorName(row.name);
  const sku = cfg.skuInTitle && row.sku ? ` ${row.sku}` : '';
  const finish = row.finish_type ? ` ${row.finish_type}` : '';
  return `${name} — Vinil ${cfg.label}${sku}${finish}`;
}

export function colorDescription(row: ColorRow, cfg: { label: string }): string {
  const name = cleanColorName(row.name);
  const parts: string[] = [];
  const desc = (row.technical_description || '').trim();
  if (desc) {
    const first = desc.split(/(?<=[.!?])\s/)[0];
    parts.push(first.length > 110 ? `${first.slice(0, 107)}...` : first);
  } else {
    parts.push(`Vinil ${cfg.label} na cor ${name}${row.finish_type ? `, acabamento ${row.finish_type}` : ''}.`);
  }
  if (row.durabilidade_anos && row.durabilidade_anos > 0) parts.push(`Durabilidade de até ${row.durabilidade_anos} anos.`);
  else if (row.garantia_anos && row.garantia_anos > 0) parts.push(`Garantia de ${row.garantia_anos} ${row.garantia_anos === 1 ? 'ano' : 'anos'}.`);
  parts.push('Atacado para instaladores na NZ Distribuidora.');
  return parts.join(' ');
}
