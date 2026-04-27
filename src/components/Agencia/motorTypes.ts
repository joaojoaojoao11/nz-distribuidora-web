/**
 * Tipos centrais da Agência NZ.
 *
 * Um Motor é a representação declarativa de um gerador de material.
 * Em vez de ter um componente TSX hardcoded por gerador, cada gerador
 * é descrito por um JSON spec (MotorSpec) e renderizado por um
 * componente genérico apropriado pro `config.type`.
 *
 * Esta arquitetura permite que a Oficina NZ (Fase 3+) gere novos
 * motores apenas produzindo JSON — sem precisar criar arquivos.
 */

export type MotorCategory = 'print' | 'social' | 'vendas' | 'tecnico';
export type MotorStatus = 'live' | 'soon';
export type MotorSource = 'builtin' | 'user';

/**
 * Família/marca do motor. Usado para agrupar built-ins no hub
 * em sub-seções (NZPPF, NZWRAP Oracal 651, NZWRAP Oracal 670).
 */
export type MotorFamily = 'nzppf' | 'oracal-651' | 'oracal-670';

export interface MotorMetadata {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  category: MotorCategory;
  status: MotorStatus;
  source: MotorSource;
  /** Família/linha. Default 'nzppf' quando ausente. */
  family?: MotorFamily;
  estimatedTime?: string;
  /** ISO date string — quando o motor foi criado. Útil pra ordenar motores user. */
  createdAt?: string;
}

/**
 * Catálogo de produtos que alimenta a dropdown "Linha" / "Cor" dos motores
 * sociais. PPF é hardcoded em catalogData.ts; Oracal vem do Supabase.
 */
export type ProductCatalog = 'ppf' | 'oracal-651' | 'oracal-670';

/* ─── SocialImage motor (Fase 4 — substitui instagram-post da Fase 3) ─── */

export type SocialFormat = 'feed-1x1' | 'story-9x16';

export type SocialLayout =
  | 'hero-bottom-cta'      // wordmark top + headline centro + CTA bottom (layout atual)
  | 'centered-quote'        // pull quote grande centralizado, com aspas
  | 'split-photo'           // metade imagem, metade conteúdo
  | 'full-bleed-headline'   // só imagem + headline gigante sobre overlay
  | 'stat-driven'           // número grande dourado + label
  | 'announce-badge';       // badge dourado + headline + subline

export type SocialTone = 'tecnico' | 'aspiracional' | 'promocional';

export interface SocialCopyTemplate {
  /** Headline principal. Use \n para quebra de linha. */
  headline: string;
  /** Subline/legenda secundária. */
  subline: string;
  /** CTA. Em layouts sem CTA visível (full-bleed, centered-quote), usado só na caption. */
  cta: string;
  /**
   * Stat principal — usado APENAS no layout 'stat-driven'.
   * Ex: "12 ANOS", "+32%", "190μ".
   */
  stat?: string;
  /**
   * Label do stat — usado APENAS no layout 'stat-driven'.
   * Ex: "DE GARANTIA REAL", "DE BRILHO A MAIS".
   */
  statLabel?: string;
  /**
   * Texto do badge — usado APENAS no layout 'announce-badge'.
   * Ex: "NOVO LANÇAMENTO", "BLACK FRIDAY", "EDIÇÃO LIMITADA".
   */
  badge?: string;
}

export interface SocialImageMotorConfig {
  type: 'social-image';
  defaultFormat?: SocialFormat;
  defaultLayout?: SocialLayout;
  defaultProductSlug?: string;
  defaultTone?: SocialTone;
  /** Catálogo de produtos. Default 'ppf' quando ausente. */
  productCatalog?: ProductCatalog;
  /**
   * Override de cor accent (hex). Se ausente, usa product.accent.
   * Ex: '#E8BF4A' (dourado mais brilhante), '#000000' (preto stealth).
   */
  accent?: string;
  /**
   * Templates de copy. Chave é '${layout}-${tone}'.
   * Variável especial {shortName} é substituída por product.shortName.
   */
  copyTemplates?: Partial<Record<string, SocialCopyTemplate>>;
  hashtags?: string[];
  lockedInputs?: Array<'format' | 'layout' | 'productSlug' | 'tone'>;
}

export interface CatalogPdfMotorConfig {
  type: 'catalog-pdf';
  /** Apenas wrapper do AdminCatalog atual — sem parâmetros nesta fase. */
}

/* ─── Carrossel social (Instagram multi-slide) ─── */

export interface SocialCarouselMotorConfig {
  type: 'social-carousel';
  defaultFormat?: SocialFormat;
  defaultProductSlug?: string;
  defaultTone?: SocialTone;
  /** Catálogo de produtos. Default 'ppf' quando ausente. */
  productCatalog?: ProductCatalog;
  /** Quantidade de slides padrão (3-10). Default: 5. */
  defaultSlidesCount?: number;
  /**
   * Sequência de layouts pra preencher cada slide na ordem.
   * Se ausente, usa preset opinado (capa announce → meio variado → fechamento CTA).
   */
  defaultSlideLayouts?: SocialLayout[];
  /** Override de cor accent (hex). Se ausente, usa product.accent. */
  accent?: string;
  hashtags?: string[];
  lockedInputs?: Array<'format' | 'productSlug' | 'tone' | 'slidesCount'>;
}

export type MotorConfig =
  | SocialImageMotorConfig
  | CatalogPdfMotorConfig
  | SocialCarouselMotorConfig;

/* ─── Motor completo (metadata + config) ─── */

export interface MotorSpec {
  metadata: MotorMetadata;
  config: MotorConfig;
}

/* ─── Constantes auxiliares ─── */

export const CATEGORY_LABELS: Record<MotorCategory, string> = {
  print: 'Print',
  social: 'Social',
  vendas: 'Vendas',
  tecnico: 'Técnico',
};
