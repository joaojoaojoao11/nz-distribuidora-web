import type {
  SocialLayout,
  SocialTone,
  SocialCopyTemplate,
} from './socialImageTypes';
import type { SocialImageMotorConfig } from '../Agencia/motorTypes';

/**
 * Defaults compartilhados de copy/labels/prompt entre os motores sociais
 * (Imagem Social e Carrossel Social). Mantém uma única fonte de verdade
 * pra suggestions de headline, subline, CTA, hashtags e prompts de IA.
 */

export const TONE_LABELS: Record<SocialTone, string> = {
  tecnico: 'Técnico',
  aspiracional: 'Aspiracional',
  promocional: 'Promocional',
};

export const TONE_MOOD: Record<SocialTone, string> = {
  tecnico:
    'clinical product photography studio lighting, technical precision, deep blacks, controlled rim lights, sharp clean reflections',
  aspiracional:
    'cinematic golden-hour lighting, premium luxury feel, dramatic atmospheric shadows, hero-shot mood',
  promocional:
    'dynamic high-contrast lighting with vibrant accent colors, bold composition, energetic spotlights',
};

/**
 * Defaults globais por layout+tone. `{shortName}` interpola o nome curto
 * do produto/cor; `{brand}` interpola a marca (NZPPF, ORACAL 651, etc).
 *
 * Templates pensados em PPF — quando o motor é Oracal o usuário pode
 * sobrescrever via Headline/Subline/CTA, e a marca já vem dinâmica.
 */
export const DEFAULT_COPY: Record<string, SocialCopyTemplate> = {
  // hero-bottom-cta
  'hero-bottom-cta-tecnico':       { headline: 'TPU ALIFÁTICO 190μ.\n12 ANOS DE GARANTIA.', subline: 'Engenharia premium com top-coat nano-japonês.', cta: 'Ficha técnica' },
  'hero-bottom-cta-aspiracional':  { headline: 'O BRILHO\nQUE VIRA PRESENÇA.', subline: '{shortName} — proteção que devolve tudo o que o sol oferece.', cta: 'Ver linha' },
  'hero-bottom-cta-promocional':   { headline: '{shortName}\nDISPONÍVEL AGORA.', subline: 'Fale com seu aplicador autorizado.', cta: 'Onde comprar' },
  // centered-quote
  'centered-quote-aspiracional':   { headline: 'Proteção feita\npara o mundo real.', subline: '{brand} · MANIFESTO', cta: 'Conheça' },
  'centered-quote-tecnico':        { headline: 'O que está\nentre o sol\ne o seu carro.', subline: '{brand} · {shortName}', cta: 'Detalhes' },
  'centered-quote-promocional':    { headline: 'Garantia que\nvive na rua.', subline: '{brand} · 12 ANOS', cta: 'Aproveitar' },
  // full-bleed-headline
  'full-bleed-headline-aspiracional': { headline: 'PRESENÇA.', subline: '', cta: 'Conheça {shortName}' },
  'full-bleed-headline-tecnico':      { headline: '190μ.', subline: '', cta: 'Especificações' },
  'full-bleed-headline-promocional':  { headline: 'CHEGOU.', subline: '', cta: 'Reservar' },
  // stat-driven
  'stat-driven-tecnico':           { headline: '', subline: 'TPU alifático com top-coat nano-japonês.', cta: 'Ver ficha', stat: '+32%', statLabel: 'DE BRILHO A MAIS' },
  'stat-driven-aspiracional':      { headline: '', subline: 'Cobertura real, no carro do cliente, no teste do tempo.', cta: 'Ver garantia', stat: '12 ANOS', statLabel: 'DE GARANTIA' },
  'stat-driven-promocional':       { headline: '', subline: 'Promoção válida durante todo o mês.', cta: 'Aproveitar', stat: '50%', statLabel: 'OFF NESTA SEMANA' },
  // announce-badge
  'announce-badge-promocional':    { headline: '{shortName}\nESTÁ AQUI.', subline: 'Lançamento oficial. Estoque limitado pra primeiros parceiros.', cta: 'Reservar', badge: 'NOVO LANÇAMENTO' },
  'announce-badge-aspiracional':   { headline: 'CHEGOU\n{shortName}.', subline: 'A nova referência {brand} para o seu projeto.', cta: 'Ver primeiro', badge: 'EDIÇÃO 2026' },
  'announce-badge-tecnico':        { headline: 'NOVA LINHA\n{shortName}.', subline: 'Disponível a partir desta semana em toda a rede {brand}.', cta: 'Encontre aplicador', badge: 'AGORA NA REDE' },
  // split-photo
  'split-photo-tecnico':           { headline: 'TPU 190μ.', subline: 'Engenharia premium com top-coat nano-japonês.', cta: 'Detalhes técnicos' },
  'split-photo-aspiracional':      { headline: '{shortName}.', subline: 'Proteção que devolve tudo o que o sol oferece.', cta: 'Ver linha' },
  'split-photo-promocional':       { headline: 'CHEGOU.', subline: 'Disponível em toda a rede autorizada.', cta: 'Onde comprar' },
};

export function applyVariables(
  template: SocialCopyTemplate,
  vars: { shortName: string; brand: string }
): SocialCopyTemplate {
  const sub = (s: string | undefined): string =>
    s
      ? s.replace(/\{shortName\}/g, vars.shortName).replace(/\{brand\}/g, vars.brand)
      : '';
  return {
    headline: sub(template.headline),
    subline: sub(template.subline),
    cta: sub(template.cta),
    stat: sub(template.stat),
    statLabel: sub(template.statLabel),
    badge: sub(template.badge),
  };
}

export function suggestCopy(
  shortName: string,
  layout: SocialLayout,
  tone: SocialTone,
  brand: string,
  override?: SocialImageMotorConfig['copyTemplates']
): SocialCopyTemplate {
  const key = `${layout}-${tone}`;
  const vars = { shortName, brand };
  if (override?.[key]) return applyVariables(override[key]!, vars);
  if (DEFAULT_COPY[key]) return applyVariables(DEFAULT_COPY[key], vars);
  return applyVariables(
    DEFAULT_COPY[`hero-bottom-cta-${tone}`] || DEFAULT_COPY['hero-bottom-cta-aspiracional'],
    vars
  );
}

/**
 * Hashtags base por marca. NZPPF usa hashtags PPF; Oracal usa hashtags
 * focadas em vinil adesivo / envelopamento.
 */
const BRAND_HASHTAG_KIT: Record<string, string[]> = {
  NZPPF: ['#NZPPF', '#PaintProtection', '#PPF', '#NZGroup', '#ProtecaoAutomotiva'],
  'ORACAL 651': ['#Oracal651', '#VinilAdesivo', '#Sinalizacao', '#Plotagem', '#NZWrap', '#NZGroup'],
  'ORACAL 670RA': ['#Oracal670', '#Oracal670RA', '#Envelopamento', '#WrapPro', '#NZWrap', '#NZGroup'],
};

export function suggestHashtags(
  shortName: string,
  brand: string,
  override?: string[]
): string[] {
  const linha = `#${shortName.replace(/\s+/g, '')}`;
  if (override?.length) return [linha, ...override];
  const kit = BRAND_HASHTAG_KIT[brand] || BRAND_HASHTAG_KIT.NZPPF;
  return [linha, ...kit];
}

export function buildBackgroundPrompt(
  product: { shortName: string; subtitle: string; accent: string },
  layout: SocialLayout,
  tone: SocialTone,
  brand: string
): string {
  const layoutComp =
    layout === 'split-photo'
      ? 'composition occupying the left half, leaving the right half empty for overlay'
      : layout === 'full-bleed-headline'
      ? 'minimalist composition with empty space across the upper third for a giant headline'
      : layout === 'centered-quote'
      ? 'symmetrical composition with empty space in the very center for a pull quote'
      : layout === 'stat-driven'
      ? 'composition skewed to one side leaving the other half empty for a giant statistic'
      : layout === 'announce-badge'
      ? 'dramatic composition with negative space at the top for a badge and below for a headline'
      : 'cinematic composition with negative space in the center for overlay text';

  // Contexto visual diferente por marca: PPF é cena de carro premium;
  // Oracal é cena com aplicação/superfície de vinil adesivo.
  const subjectByBrand: Record<string, string> = {
    NZPPF: `Premium luxury vehicle scene inspired by NZPPF ${product.shortName} paint protection film`,
    'ORACAL 651': `Professional sign-making scene featuring Oracal 651 vinyl in ${product.shortName} color, applied on premium surfaces or signage`,
    'ORACAL 670RA': `Automotive wrap installation scene featuring Oracal 670RA wrap film in ${product.shortName} color, applied on a luxury vehicle`,
  };
  const subject = subjectByBrand[brand] || subjectByBrand.NZPPF;
  return `${subject}. ${TONE_MOOD[tone]}. Subtle ${product.accent} accent lighting highlights. ${layoutComp}.`;
}
