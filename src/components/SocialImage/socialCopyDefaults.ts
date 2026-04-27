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

/** Defaults globais por layout+tone — usado quando o motor não tem override. */
export const DEFAULT_COPY: Record<string, SocialCopyTemplate> = {
  // hero-bottom-cta
  'hero-bottom-cta-tecnico':       { headline: 'TPU ALIFÁTICO 190μ.\n12 ANOS DE GARANTIA.', subline: 'Engenharia premium com top-coat nano-japonês.', cta: 'Ficha técnica' },
  'hero-bottom-cta-aspiracional':  { headline: 'O BRILHO\nQUE VIRA PRESENÇA.', subline: '{shortName} — proteção que devolve tudo o que o sol oferece.', cta: 'Ver linha' },
  'hero-bottom-cta-promocional':   { headline: '{shortName}\nDISPONÍVEL AGORA.', subline: 'Fale com seu aplicador autorizado.', cta: 'Onde comprar' },
  // centered-quote
  'centered-quote-aspiracional':   { headline: 'Proteção feita\npara o mundo real.', subline: 'NZPPF · MANIFESTO', cta: 'Conheça' },
  'centered-quote-tecnico':        { headline: 'O que está\nentre o sol\ne o seu carro.', subline: 'NZPPF · {shortName}', cta: 'Detalhes' },
  'centered-quote-promocional':    { headline: 'Garantia que\nvive na rua.', subline: 'NZPPF · 12 ANOS', cta: 'Aproveitar' },
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
  'announce-badge-aspiracional':   { headline: 'CHEGOU\n{shortName}.', subline: 'A nova referência em proteção automotiva premium.', cta: 'Ver primeiro', badge: 'EDIÇÃO 2026' },
  'announce-badge-tecnico':        { headline: 'NOVA LINHA\n{shortName}.', subline: 'Disponível para aplicação a partir desta semana em toda a rede.', cta: 'Encontre aplicador', badge: 'AGORA NA REDE' },
  // split-photo
  'split-photo-tecnico':           { headline: 'TPU 190μ.', subline: 'Engenharia premium com top-coat nano-japonês.', cta: 'Detalhes técnicos' },
  'split-photo-aspiracional':      { headline: '{shortName}.', subline: 'Proteção que devolve tudo o que o sol oferece.', cta: 'Ver linha' },
  'split-photo-promocional':       { headline: 'CHEGOU.', subline: 'Disponível em toda a rede autorizada.', cta: 'Onde comprar' },
};

export function applyShortName(
  template: SocialCopyTemplate,
  shortName: string
): SocialCopyTemplate {
  const sub = (s: string | undefined): string =>
    s ? s.replace(/\{shortName\}/g, shortName) : '';
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
  override?: SocialImageMotorConfig['copyTemplates']
): SocialCopyTemplate {
  const key = `${layout}-${tone}`;
  if (override?.[key]) return applyShortName(override[key]!, shortName);
  if (DEFAULT_COPY[key]) return applyShortName(DEFAULT_COPY[key], shortName);
  return applyShortName(
    DEFAULT_COPY[`hero-bottom-cta-${tone}`] || DEFAULT_COPY['hero-bottom-cta-aspiracional'],
    shortName
  );
}

export function suggestHashtags(shortName: string, override?: string[]): string[] {
  const linha = `#${shortName.replace(/\s+/g, '')}`;
  if (override?.length) return [linha, ...override];
  return [linha, '#NZPPF', '#PaintProtection', '#PPF', '#NZGroup', '#ProtecaoAutomotiva'];
}

export function buildBackgroundPrompt(
  product: { shortName: string; subtitle: string; accent: string },
  layout: SocialLayout,
  tone: SocialTone
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

  return `Premium luxury vehicle scene inspired by NZPPF ${product.shortName} paint protection film. ${TONE_MOOD[tone]}. Subtle ${product.accent} accent lighting highlights. ${layoutComp}.`;
}
