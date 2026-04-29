import type { MotorSpec } from './motorTypes';

export interface GenerateResult {
  ok: true;
  motor: MotorSpec;
}

export interface GenerateError {
  ok: false;
  error: string;
}

/**
 * Chama o backend /api/oficina/generate com o prompt do usuário.
 * Retorna a spec gerada ou um erro estruturado (sem throw).
 */
export async function generateMotorFromPrompt(
  prompt: string
): Promise<GenerateResult | GenerateError> {
  try {
    const response = await fetch('/api/oficina/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json().catch(() => ({} as { motor?: MotorSpec; error?: string }));

    if (!response.ok) {
      return { ok: false, error: data.error || `HTTP ${response.status}` };
    }

    if (!data.motor) {
      return { ok: false, error: 'Resposta sem campo "motor".' };
    }

    return { ok: true, motor: data.motor as MotorSpec };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Falha de rede.';
    return { ok: false, error: msg };
  }
}

/* ─── Background AI (Gemini Imagen) ─── */

export interface BackgroundGenResult {
  ok: true;
  imageBase64: string;
}

export interface BackgroundGenError {
  ok: false;
  error: string;
}

/**
 * Chama /api/oficina/generate-background pra gerar uma imagem de fundo
 * via Gemini Imagen no aspect ratio do format do motor.
 */
export async function generateBackgroundFromPrompt(
  prompt: string,
  format: 'feed-1x1' | 'story-9x16'
): Promise<BackgroundGenResult | BackgroundGenError> {
  try {
    const response = await fetch('/api/oficina/generate-background', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, format }),
    });

    const data = await response
      .json()
      .catch(() => ({} as { imageBase64?: string; error?: string }));

    if (!response.ok) {
      return { ok: false, error: data.error || `HTTP ${response.status}` };
    }

    if (!data.imageBase64) {
      return { ok: false, error: 'Resposta sem campo "imageBase64".' };
    }

    return { ok: true, imageBase64: data.imageBase64 };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Falha de rede.';
    return { ok: false, error: msg };
  }
}

/* ─── Carousel content (Claude tool use) ─── */

export interface CarouselSlideCopy {
  headline: string;
  subline: string;
  cta: string;
  /** Layout-específicos: vem string vazia quando não aplicável ao layout do slide. */
  badge: string;
  stat: string;
  statLabel: string;
  eyebrow: string;
}

export interface CarouselContentResult {
  ok: true;
  slides: CarouselSlideCopy[];
}

export interface CarouselContentError {
  ok: false;
  error: string;
}

export interface GenerateCarouselContentParams {
  brand: string;
  productShortName: string;
  productSubtitle?: string;
  tone: string;
  layouts: string[];
  extraInstructions?: string;
  /** Specs verificáveis da linha (ex "TPU 175μ; 4 anos; hidrofóbico"). */
  factsContext?: string;
  /** Carros típicos do segmento (ex "GWM Haval, Tank, Ora; BYD"). */
  carBrands?: string;
  /** Rótulo humano do segmento (ex "GWM e elétricos premium"). */
  segmentLabel?: string;
}

/**
 * Chama /api/oficina/generate-carousel-content pra obter copy completo
 * (headline/subline/CTA) por slide, baseado em tom + linha + sequência
 * de layouts. Retorna 1 entrada por slide na mesma ordem.
 */
export async function generateCarouselContent(
  params: GenerateCarouselContentParams
): Promise<CarouselContentResult | CarouselContentError> {
  try {
    const response = await fetch('/api/oficina/generate-carousel-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await response
      .json()
      .catch(() => ({} as { slides?: CarouselSlideCopy[]; error?: string }));

    if (!response.ok) {
      return { ok: false, error: data.error || `HTTP ${response.status}` };
    }

    if (!Array.isArray(data.slides)) {
      return { ok: false, error: 'Resposta sem campo "slides".' };
    }

    return { ok: true, slides: data.slides };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Falha de rede.';
    return { ok: false, error: msg };
  }
}

/* ─── Field-level wand (varinha por campo) ─── */

export interface GenerateFieldTextParams {
  fieldKey: string;
  layout: string;
  tone: string;
  brand: string;
  productShortName: string;
  productSubtitle?: string;
  factsContext?: string;
  carBrands?: string;
  segmentLabel?: string;
  currentValue?: string;
  slideIdx: number;
  totalSlides: number;
  /** Outros campos do mesmo slide (pra coerência narrativa). */
  otherFields: Record<string, string>;
}

export interface FieldTextResult {
  ok: true;
  value: string;
}

export interface FieldTextError {
  ok: false;
  error: string;
}

/**
 * Regenera UM campo do slide ativo. Chamada curta (~1-2s) com tool use.
 * O endpoint força a IA a NÃO repetir `currentValue` e a manter coerência
 * com `otherFields`.
 */
export async function generateFieldText(
  params: GenerateFieldTextParams
): Promise<FieldTextResult | FieldTextError> {
  try {
    const response = await fetch('/api/oficina/generate-field', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await response
      .json()
      .catch(() => ({} as { value?: string; error?: string }));
    if (!response.ok) {
      return { ok: false, error: data.error || `HTTP ${response.status}` };
    }
    if (typeof data.value !== 'string') {
      return { ok: false, error: 'Resposta sem campo "value".' };
    }
    return { ok: true, value: data.value };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Falha de rede.';
    return { ok: false, error: msg };
  }
}

/* ─── Caption (Instagram) ─── */

export interface GenerateCaptionParams {
  brand: string;
  productShortName: string;
  productSubtitle?: string;
  tone: string;
  factsContext?: string;
  carBrands?: string;
  segmentLabel?: string;
  slides: Array<{ layout: string; headline: string; subline: string; cta: string }>;
  hashtags: string[];
}

export interface CaptionResult {
  ok: true;
  caption: string;
}

export interface CaptionError {
  ok: false;
  error: string;
}

/**
 * Gera o texto da caption do post (legenda Instagram). Diferente do copy
 * IN-image, é storytelling com line breaks e hashtags ao final.
 */
export async function generateCaption(
  params: GenerateCaptionParams
): Promise<CaptionResult | CaptionError> {
  try {
    const response = await fetch('/api/oficina/generate-caption', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await response
      .json()
      .catch(() => ({} as { caption?: string; error?: string }));
    if (!response.ok) {
      return { ok: false, error: data.error || `HTTP ${response.status}` };
    }
    if (typeof data.caption !== 'string') {
      return { ok: false, error: 'Resposta sem campo "caption".' };
    }
    return { ok: true, caption: data.caption };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Falha de rede.';
    return { ok: false, error: msg };
  }
}
