import type { MotorSpec } from './motorTypes';

/**
 * Motores built-in que vêm com o sistema. São equivalentes 1:1 aos
 * "docs" hardcoded da Fase 1, agora descritos como spec.
 *
 * Para adicionar um novo built-in: appende um MotorSpec aqui.
 * Para adicionar um motor user (Fase 3): registry.addUserMotor(spec).
 */
export const BUILTIN_MOTORS: MotorSpec[] = [
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
      estimatedTime: '~45s',
    },
    config: { type: 'catalog-pdf' },
  },
  {
    metadata: {
      id: 'insta-post',
      title: 'Imagem Social',
      subtitle: 'Feed e Stories',
      description:
        'Gera posts e stories com identidade NZPPF — escolha formato, layout, linha e tom. Imagem + legenda + hashtags prontos para publicar.',
      icon: '📸',
      category: 'social',
      status: 'live',
      source: 'builtin',
      estimatedTime: '~5s',
    },
    config: {
      type: 'social-image',
      defaultFormat: 'feed-1x1',
      defaultLayout: 'hero-bottom-cta',
    },
  },
  {
    metadata: {
      id: 'carrossel-social',
      title: 'Carrossel Social',
      subtitle: 'Instagram · 3-10 slides',
      description:
        'Carrossel multi-slide com layouts variados — capa de impacto, slides de conteúdo e fechamento com CTA. Linha + tom + formato globais; cada slide com layout e copy próprios.',
      icon: '🎠',
      category: 'social',
      status: 'live',
      source: 'builtin',
      estimatedTime: '~5s/slide',
    },
    config: {
      type: 'social-carousel',
      defaultFormat: 'feed-1x1',
      defaultSlidesCount: 5,
    },
  },
  /* Placeholders "soon" — entram como motores reais conforme implementadas */
  {
    metadata: {
      id: 'one-pager',
      title: 'One-pager por linha',
      subtitle: 'A4 individual',
      description:
        'Folha individual de cada linha de produto, ideal para envio personalizado ao cliente.',
      icon: '📄',
      category: 'print',
      status: 'soon',
      source: 'builtin',
    },
    config: { type: 'catalog-pdf' /* placeholder, vai virar 'a4-flyer' */ },
  },
  {
    metadata: {
      id: 'folder-comercial',
      title: 'Folder comercial 3 painéis',
      subtitle: 'Brochure dobrado',
      description: 'Folder dobrável para entrega em PDV, eventos e showroom.',
      icon: '📰',
      category: 'vendas',
      status: 'soon',
      source: 'builtin',
    },
    config: { type: 'catalog-pdf' /* placeholder */ },
  },
  {
    metadata: {
      id: 'pitch-deck',
      title: 'Apresentação de vendas',
      subtitle: 'Pitch deck premium',
      description:
        'Slides para apresentação ao vivo a clientes corporativos e parceiros.',
      icon: '🎯',
      category: 'vendas',
      status: 'soon',
      source: 'builtin',
    },
    config: { type: 'catalog-pdf' /* placeholder */ },
  },
  {
    metadata: {
      id: 'tabela-tecnica',
      title: 'Tabela técnica comparativa',
      subtitle: 'Spec sheet 1 página',
      description:
        'Comparação densa em tabela: espessura, garantia, top coat, matéria-prima e indicação.',
      icon: '📊',
      category: 'tecnico',
      status: 'soon',
      source: 'builtin',
    },
    config: { type: 'catalog-pdf' /* placeholder */ },
  },
];
