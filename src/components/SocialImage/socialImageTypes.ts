import type {
  SocialFormat,
  SocialLayout,
  SocialTone,
  SocialCopyTemplate,
} from '../Agencia/motorTypes';

export type { SocialFormat, SocialLayout, SocialTone, SocialCopyTemplate };

/**
 * Subconjunto mínimo do ProductLine que os motores sociais consomem.
 * Usado para que dados vindos de fontes diferentes (catalogData PPF
 * hardcoded, Supabase Oracal 651/670, NZWRAP) possam alimentar o mesmo
 * renderer sem exigir os campos PPF-only (architecture, finishes, etc.).
 */
export interface SocialProduct {
  slug: string;
  title: string;
  shortName: string;
  subtitle: string;
  image: string;
  accent: string;
}

export interface SocialImageData {
  product: SocialProduct;
  format: SocialFormat;
  layout: SocialLayout;
  tone: SocialTone;
  copy: SocialCopyTemplate;
  /** Cor accent — vem do motor.accent ou product.accent. */
  accent: string;
  /**
   * Wordmark da marca exibido no topo dos layouts (NZPPF, ORACAL 651, etc).
   * Derivado da família do motor pelo renderer.
   */
  brandName: string;
  /** Sobrepõe a foto fixa do produto. Data URL (base64) ou URL pública. */
  aiBackground?: string;
}

export interface FormatDimensions {
  width: number;
  height: number;
}

export const FORMAT_DIMENSIONS: Record<SocialFormat, FormatDimensions> = {
  'feed-1x1': { width: 1080, height: 1080 },
  'story-9x16': { width: 1080, height: 1920 },
};

export const FORMAT_LABELS: Record<SocialFormat, string> = {
  'feed-1x1': 'Feed (1080×1080)',
  'story-9x16': 'Stories (1080×1920)',
};

export const LAYOUT_LABELS: Record<SocialLayout, string> = {
  'hero-bottom-cta': 'Hero + CTA no rodapé',
  'centered-quote': 'Pull quote centralizado',
  'split-photo': 'Foto + texto lado a lado',
  'full-bleed-headline': 'Imagem cheia + headline gigante',
  'stat-driven': 'Stat em destaque',
  'announce-badge': 'Badge de anúncio',
};
