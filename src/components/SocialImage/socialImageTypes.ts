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

/**
 * Chaves dos elementos textuais que aparecem nos layouts. Cada um pode ser
 * sobrescrito (override) e/ou ocultado individualmente por slide.
 *
 * Mapeamento layout→fields visíveis está em LAYOUT_FIELD_KEYS abaixo.
 */
export type SocialFieldKey =
  | 'wordmark'    // marca no topo (default = brandName)
  | 'lineBadge'   // pílula da linha (default = product.shortName)
  | 'eyebrow'     // sub-rótulo dourado (default = product.subtitle, só hero-bottom-cta)
  | 'badge'       // badge dourado (só announce-badge, default = copy.badge)
  | 'headline'    // título principal
  | 'subline'     // legenda secundária
  | 'stat'        // número gigante (só stat-driven)
  | 'statLabel'   // rótulo do stat (só stat-driven)
  | 'cta'         // call-to-action
  | 'footer';     // URL no rodapé (default = "nzgroup.com.br")

/**
 * Quais campos cada layout efetivamente renderiza. UI usa isso pra mostrar
 * só os campos relevantes em cada slide. Renderers usam pra saber o que
 * pode ser overridado — campos não-listados são ignorados se vierem.
 */
export const LAYOUT_FIELD_KEYS: Record<SocialLayout, SocialFieldKey[]> = {
  'announce-badge':      ['wordmark', 'badge', 'headline', 'subline', 'lineBadge', 'cta', 'footer'],
  'hero-bottom-cta':     ['wordmark', 'lineBadge', 'eyebrow', 'headline', 'subline', 'cta', 'footer'],
  'centered-quote':      ['wordmark', 'headline', 'subline', 'footer'],
  'split-photo':         ['wordmark', 'lineBadge', 'headline', 'subline', 'cta'],
  'full-bleed-headline': ['wordmark', 'lineBadge', 'headline', 'footer'],
  'stat-driven':         ['wordmark', 'lineBadge', 'stat', 'statLabel', 'subline', 'cta', 'footer'],
};

export const FIELD_LABELS: Record<SocialFieldKey, string> = {
  wordmark: 'Marca (topo)',
  lineBadge: 'Pílula da linha',
  eyebrow: 'Subtítulo dourado',
  badge: 'Badge de anúncio',
  headline: 'Headline',
  subline: 'Subline',
  stat: 'Stat (número grande)',
  statLabel: 'Stat — rótulo',
  cta: 'CTA',
  footer: 'URL/rodapé',
};

/**
 * Override por campo: texto customizado, flag de oculto, e transform manual
 * (offset X/Y + scale) controlado pela camada de edit mode estilo Canva no
 * AdminSocialCarousel. Renderers checam:
 *   const text = overrides?.[key]?.value ?? defaultValue;
 *   const hidden = overrides?.[key]?.hidden === true;
 *   if (!hidden && text) render(text, transform);
 */
export interface SocialFieldOverride {
  value?: string;
  hidden?: boolean;
  /** Deslocamento em px no espaço do canvas 1080 (clamp ±150). */
  offsetX?: number;
  offsetY?: number;
  /** Multiplicador de tamanho (0.7–1.5). 1 = tamanho original do CSS. */
  scale?: number;
}

/**
 * Transform consolidado pra renderização — calculado por resolveField a
 * partir do override. `null` quando não há transform aplicado (mais barato
 * que objeto vazio pro JSX).
 */
export interface ResolvedTransform {
  offsetX: number;
  offsetY: number;
  scale: number;
}

/** Limites pra clamp dos sliders/drags. */
export const TRANSFORM_LIMITS = {
  offsetMin: -150,
  offsetMax: 150,
  scaleMin: 0.7,
  scaleMax: 1.5,
} as const;

export type SocialFieldOverrides = Partial<Record<SocialFieldKey, SocialFieldOverride>>;

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
  /**
   * URL pra um logo SVG/PNG da marca. Quando presente, o wordmark do topo
   * é renderizado como imagem (em vez do texto `brandName`) — desde que o
   * usuário não tenha digitado um override explícito no campo wordmark.
   */
  brandLogoUrl?: string;
  /**
   * Overrides per-field (texto customizado e/ou hide). Quando ausente, layouts
   * caem no comportamento legado (defaults vindos de copy/product/brandName).
   */
  fieldOverrides?: SocialFieldOverrides;
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
