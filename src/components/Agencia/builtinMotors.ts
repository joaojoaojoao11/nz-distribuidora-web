import type { MotorSpec } from './motorTypes';

/**
 * Motores built-in que vêm com o sistema. Organizados por família
 * (NZPPF, Oracal 651, Oracal 670). O hub agrupa visualmente por família
 * via metadata.family.
 *
 * Para adicionar um novo built-in: appende um MotorSpec aqui.
 * Para adicionar um motor user (Oficina): registry.addUserMotor(spec).
 */
export const BUILTIN_MOTORS: MotorSpec[] = [
  /* ─── NZPPF ─── */
  {
    metadata: {
      id: 'catalogo-fisico',
      title: 'Catálogo Físico',
      subtitle: 'NZPPF · 20 páginas',
      description:
        'Catálogo completo print-ready em A4, com todas as 6 linhas, benchmark, garantia e verso de capa institucional.',
      icon: '📕',
      category: 'print',
      status: 'live',
      source: 'builtin',
      family: 'nzppf',
      estimatedTime: '~45s',
    },
    config: { type: 'catalog-pdf' },
  },
  {
    metadata: {
      id: 'insta-post',
      title: 'Imagem Social',
      subtitle: 'Feed e Stories · NZPPF',
      description:
        'Posts e stories com identidade NZPPF — escolha formato, layout, linha PPF e tom. Imagem + legenda + hashtags prontos para publicar.',
      icon: '📸',
      category: 'social',
      status: 'live',
      source: 'builtin',
      family: 'nzppf',
      estimatedTime: '~5s',
    },
    config: {
      type: 'social-image',
      defaultFormat: 'feed-1x1',
      defaultLayout: 'hero-bottom-cta',
      productCatalog: 'ppf',
    },
  },
  {
    metadata: {
      id: 'carrossel-social',
      title: 'Carrossel Social',
      subtitle: 'Instagram · NZPPF',
      description:
        'Carrossel multi-slide com layouts variados — capa de impacto, slides de conteúdo e fechamento com CTA. Linha PPF + tom + formato globais; cada slide com layout e copy próprios.',
      icon: '🎠',
      category: 'social',
      status: 'live',
      source: 'builtin',
      family: 'nzppf',
      estimatedTime: '~5s/slide',
    },
    config: {
      type: 'social-carousel',
      defaultFormat: 'feed-1x1',
      defaultSlidesCount: 5,
      productCatalog: 'ppf',
    },
  },

  /* ─── Oracal 651 ─── */
  {
    metadata: {
      id: 'insta-post-oracal-651',
      title: 'Imagem Social',
      subtitle: 'Feed e Stories · Oracal 651',
      description:
        'Posts e stories para a linha Oracal 651 — escolha a cor do catálogo, formato, layout e tom. Accent cromado pela cor selecionada.',
      icon: '📸',
      category: 'social',
      status: 'live',
      source: 'builtin',
      family: 'oracal-651',
      estimatedTime: '~5s',
    },
    config: {
      type: 'social-image',
      defaultFormat: 'feed-1x1',
      defaultLayout: 'hero-bottom-cta',
      productCatalog: 'oracal-651',
    },
  },
  {
    metadata: {
      id: 'carrossel-oracal-651',
      title: 'Carrossel Social',
      subtitle: 'Instagram · Oracal 651',
      description:
        'Carrossel multi-slide para a linha Oracal 651. Cor + tom + formato globais; cada slide com layout e copy próprios.',
      icon: '🎠',
      category: 'social',
      status: 'live',
      source: 'builtin',
      family: 'oracal-651',
      estimatedTime: '~5s/slide',
    },
    config: {
      type: 'social-carousel',
      defaultFormat: 'feed-1x1',
      defaultSlidesCount: 5,
      productCatalog: 'oracal-651',
    },
  },

  /* ─── Oracal 670 ─── */
  {
    metadata: {
      id: 'insta-post-oracal-670',
      title: 'Imagem Social',
      subtitle: 'Feed e Stories · Oracal 670',
      description:
        'Posts e stories para a linha Oracal 670 — escolha a cor do catálogo, formato, layout e tom. Accent cromado pela cor selecionada.',
      icon: '📸',
      category: 'social',
      status: 'live',
      source: 'builtin',
      family: 'oracal-670',
      estimatedTime: '~5s',
    },
    config: {
      type: 'social-image',
      defaultFormat: 'feed-1x1',
      defaultLayout: 'hero-bottom-cta',
      productCatalog: 'oracal-670',
    },
  },
  {
    metadata: {
      id: 'carrossel-oracal-670',
      title: 'Carrossel Social',
      subtitle: 'Instagram · Oracal 670',
      description:
        'Carrossel multi-slide para a linha Oracal 670. Cor + tom + formato globais; cada slide com layout e copy próprios.',
      icon: '🎠',
      category: 'social',
      status: 'live',
      source: 'builtin',
      family: 'oracal-670',
      estimatedTime: '~5s/slide',
    },
    config: {
      type: 'social-carousel',
      defaultFormat: 'feed-1x1',
      defaultSlidesCount: 5,
      productCatalog: 'oracal-670',
    },
  },
];
