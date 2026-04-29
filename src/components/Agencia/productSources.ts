import { supabase } from '../../lib/supabase';
import { productLines } from '../Catalog/data/catalogData';
import type { SocialProduct } from '../SocialImage/socialImageTypes';
import type { ProductCatalog } from './motorTypes';

/**
 * Fonte unificada de produtos pros motores sociais. Cada motor declara seu
 * catálogo via `config.productCatalog` ('ppf' | 'oracal-651' | 'oracal-670')
 * e o renderer chama `loadProductCatalog(catalog)` no mount.
 *
 * - PPF: hardcoded em catalogData.ts (6 linhas fixas, com car shots).
 * - Oracal 651/670: Supabase web_catalog_products (filtrado por brand).
 *
 * Para Oracal não há foto de carro envelopado individual por cor — usa-se
 * imagem placeholder genérica e o usuário gera AI background custom.
 */

const ORACAL_PLACEHOLDER_IMAGE = '/assets/images/sh/ag_supercar_v2.png';

interface DbProductRow {
  slug: string;
  name: string;
  hex_code: string | null;
  finish_type: string | null;
  technical_description: string | null;
  brand: string | null;
}

function dbRowToSocialProduct(row: DbProductRow): SocialProduct {
  const namePieces = row.name.split(/\s+/);
  // Strip prefixo "ORACAL 651" ou "ORACAL 670" pra deixar shortName legível
  const shortName = namePieces.length > 2
    ? namePieces.slice(2).join(' ').trim() || row.name
    : row.name;
  const subtitle = row.technical_description?.trim()
    ? row.technical_description
    : `${row.brand || 'Oracal'} · ${row.finish_type || 'Vinil adesivo'}`;
  return {
    slug: row.slug,
    title: row.name,
    shortName,
    subtitle,
    image: ORACAL_PLACEHOLDER_IMAGE,
    accent: row.hex_code || '#D4AF37',
  };
}

const BRAND_BY_CATALOG: Record<Exclude<ProductCatalog, 'ppf'>, string> = {
  'oracal-651': 'Oracal 651',
  'oracal-670': 'Oracal 670',
};

export async function loadProductCatalog(
  catalog: ProductCatalog
): Promise<SocialProduct[]> {
  if (catalog === 'ppf') {
    return productLines.map((p) => ({
      slug: p.slug,
      title: p.title,
      shortName: p.shortName,
      subtitle: p.subtitle,
      image: p.image,
      accent: p.accent,
    }));
  }

  const brand = BRAND_BY_CATALOG[catalog];
  const { data, error } = await supabase
    .from('web_catalog_products')
    .select('slug, name, hex_code, finish_type, technical_description, brand')
    .eq('brand', brand)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error(`[productSources] Falha ao carregar ${brand}:`, error);
    return [];
  }
  if (!data || data.length === 0) return [];
  return (data as DbProductRow[]).map(dbRowToSocialProduct);
}

/**
 * Label legível pra exibir no UI (placeholder do dropdown, etc).
 */
export const CATALOG_LABELS: Record<ProductCatalog, string> = {
  ppf: 'Linha',
  'oracal-651': 'Cor (Oracal 651)',
  'oracal-670': 'Cor (Oracal 670)',
};

/**
 * Wordmark de marca exibido no topo dos posts/stories sociais.
 * Mantém a notação do site (Oracal 670RA, não 670).
 */
export const BRAND_NAME_BY_CATALOG: Record<ProductCatalog, string> = {
  ppf: 'NZPPF',
  'oracal-651': 'ORACAL 651',
  'oracal-670': 'ORACAL 670RA',
};

/**
 * Logo SVG da marca para o wordmark no topo dos layouts. Quando definido,
 * o renderer prioriza a imagem em vez do texto `BRAND_NAME_BY_CATALOG`.
 *
 * NZPPF usa o logo oficial 2026 (cliente forneceu o SVG calibrado em
 * `taste-skill/NOVO LOGO 2026/...`). Oracal segue como texto por enquanto
 * — pode ser plugado aqui quando a NZWRAP receber tratamento equivalente.
 */
export const BRAND_LOGO_BY_CATALOG: Partial<Record<ProductCatalog, string>> = {
  ppf: '/assets/logos/logo-nzppf-2026.svg',
};
