import { deepSanitize } from '../../../utils/sanitize';

export interface ArchitectureItem {
  num: string;
  title: string;
  desc: string;
}

export interface FinishItem {
  name: string;
  anchor: string;
  desc: string;
  image: string;
  swatch: string;
}

export interface FinishesData {
  tagline: string;
  items: FinishItem[];
  /**
   * Índice (0-based) do acabamento que recebe destaque "herói" no layout
   * de 3 itens (modo Completo). Se omitido, o primeiro item é o herói.
   * Ignorado quando há 4 itens (grid 2×2 simétrico).
   */
  heroIndex?: number;
}

export interface ProductLine {
  slug: string;
  title: string;
  shortName: string;
  subtitle: string;
  sectionTitle: string;
  bodyParagraphs: string[];
  image: string;
  thickness: string;
  warranty: string;
  accent: string;
  tone: 'gold' | 'blue' | 'red' | 'green' | 'silver';
  highlights: { label: string; value: string }[];
  /** 4-item "Arquitetura do Filme" grade (espelha a seção do site) */
  architecture: ArchitectureItem[];
  /** Acabamentos/tonalidades — usado apenas no modo "Completo com Acabamentos" */
  finishes?: FinishesData;
}

const rawProductLines: ProductLine[] = [
  {
    slug: 'luxury-gloss',
    title: 'NZ PPF LUXURY GLOSS',
    shortName: 'LUXURY',
    subtitle: 'TPU Alifático 190µ · +32% Brilho · 12 Anos de Garantia',
    sectionTitle: 'A Melhor Matéria-Prima do Mundo',
    bodyParagraphs: [
      'TPU Alifático de 190μ blinda cada centímetro da pintura. Nano-Revestimento japonês entrega +32% de brilho — acabamento vitrificado e espelhado.'
    ],
    image: '/assets/images/luxury_lambo.png',
    thickness: '190μ',
    warranty: '12 ANOS',
    accent: '#D4AF37',
    tone: 'gold',
    highlights: [
      { label: 'Espessura', value: '190 µ' },
      { label: 'Brilho', value: '+32%' },
      { label: 'Repelência', value: '+30%' },
      { label: 'Garantia', value: '12 anos' }
    ],
    architecture: [
      { num: '01', title: 'Top Coat Nano-Japonês',    desc: 'Repele contaminantes. Auto-cura térmica.' },
      { num: '02', title: 'TPU Alifático 190μ',       desc: 'Não amarela sob UV. Blindagem real.' },
      { num: '03', title: 'Regeneração Térmica',      desc: 'Micro-riscos somem com o sol.' },
      { num: '04', title: 'Adesivo PSA',              desc: 'Remoção limpa após 12 anos.' }
    ],
    finishes: {
      tagline: 'Cada acabamento. Uma expressão do seu padrão.',
      items: [
        {
          name: 'GLOSS',
          anchor: 'O brilho que vira presença.',
          desc: 'Espelhamento vitrificado, profundidade cristalina. Para quem faz questão de ser notado pelos detalhes — sob qualquer luz.',
          image: '/assets/images/nzppf_super_brilho.png',
          swatch: '#F5F5F7'
        },
        {
          name: 'MATTE',
          anchor: 'Silêncio premium.',
          desc: 'Aveludado, discreto, sofisticado. Luxo verdadeiro não grita — apenas existe.',
          image: '/assets/images/nzppf_matte.png',
          swatch: '#2E2E30'
        },
        {
          name: 'BLACK',
          anchor: 'Luxo absoluto. Profundidade inegociável.',
          desc: 'Preto vitrificado profundo. Cada centímetro comunica presença e poder.',
          image: '/assets/images/nzppf_black.png',
          swatch: '#0A0A0A'
        }
      ]
    }
  },
  {
    slug: 'prime-gloss',
    title: 'NZ PPF PRIME GLOSS',
    shortName: 'PRIME',
    subtitle: 'TPU 100% Virgem 190µ · Nano-Dúplex · 10 Anos de Garantia',
    sectionTitle: 'Proteção Premium com o Melhor Custo-Benefício',
    bodyParagraphs: [
      'TPU 100% virgem — mais flexível, mais durável, mais brilhante que PU comum. Não resseca, não trinca, não amarela. Proteção real contra micro-riscos e chuva ácida.'
    ],
    image: '/assets/images/nzppf_prime_hero.png',
    thickness: '190μ',
    warranty: '10 ANOS',
    accent: '#4A90D9',
    tone: 'blue',
    highlights: [
      { label: 'Espessura', value: '190 µ' },
      { label: 'Material', value: 'TPU Virgem' },
      { label: 'Top Coat', value: 'Nano-Dúplex' },
      { label: 'Garantia', value: '10 anos' }
    ],
    architecture: [
      { num: '01', title: 'Top Coat Nano-Dúplex',  desc: 'Hidrofóbico. Repele água e poeira.' },
      { num: '02', title: 'TPU 100% Virgem 190μ',  desc: 'Pureza química. Durabilidade real.' },
      { num: '03', title: 'Regeneração Térmica',   desc: 'Micro-riscos somem sob o sol.' },
      { num: '04', title: 'Adesivo Flexível',      desc: 'Conformação total em curvas.' }
    ],
    finishes: {
      tagline: 'Três acabamentos. Um padrão de excelência.',
      items: [
        {
          name: 'GLOSS',
          anchor: 'Brilho que sustenta o tempo.',
          desc: 'Reflexo intenso e uniforme, com hidrofobia nano-dúplex que mantém o acabamento impecável da garagem à estrada.',
          image: '/assets/images/nzppf_prime_brilho.png',
          swatch: '#F0F0F4'
        },
        {
          name: 'MATTE',
          anchor: 'Elegância que escolhe não competir.',
          desc: 'Aveludado, acetinado. Diferenciação que não precisa de exagero — precisa de intenção.',
          image: '/assets/images/nzppf_prime_matte.jpg',
          swatch: '#2B2D30'
        },
        {
          name: 'BLACK PIANO',
          anchor: 'Profundidade espelhada. Absoluta.',
          desc: 'Preto vitrificado com reflexo de instrumento de alta categoria. Conceito premium com 10 anos de garantia.',
          image: '/assets/images/nzppf_prime_black.jpg',
          swatch: '#050505'
        }
      ]
    }
  },
  {
    slug: 'flow-gloss',
    title: 'NZ PPF FLOW GLOSS',
    shortName: 'FLOW',
    subtitle: 'TPU Técnico 175µ · Hidrofóbico · 4 Anos de Garantia',
    sectionTitle: 'Entrada Inteligente no Mundo do PPF',
    bodyParagraphs: [
      'A porta de entrada no PPF de verdade. TPU técnico hidrofóbico que não resseca, não trinca e regenera micro-riscos com o calor do sol. Acima de qualquer PU comum.'
    ],
    image: '/assets/images/flow_haval.png',
    thickness: '175μ',
    warranty: '4 ANOS',
    accent: '#d11e1e',
    tone: 'red',
    highlights: [
      { label: 'Espessura', value: '175 µ' },
      { label: 'Material', value: 'TPU Técnico' },
      { label: 'Top Coat', value: 'Hidrofóbico' },
      { label: 'Garantia', value: '4 anos' }
    ],
    architecture: [
      { num: '01', title: 'Revestimento Hidrofóbico', desc: 'Repele água. Lavagem facilitada.' },
      { num: '02', title: 'TPU Técnico 175μ',         desc: 'Não resseca. Não trinca.' },
      { num: '03', title: 'Regeneração Térmica',      desc: 'Auto-cura leve sob o sol.' },
      { num: '04', title: 'Adesivo Acrílico',         desc: 'Conformação em curvas complexas.' }
    ],
    finishes: {
      tagline: 'Versatilidade real. Estética sem compromisso.',
      items: [
        {
          name: 'CLEAR GLOSS',
          anchor: 'A cor original, potencializada.',
          desc: 'Transparente com brilho que realça a pintura de fábrica. Proteção sem alterar a identidade do veículo.',
          image: '/assets/images/flow_clear_gloss_haval.png',
          swatch: '#EAEAEE'
        },
        {
          name: 'CLEAR MATTE',
          anchor: 'O fosco que suaviza sem apagar.',
          desc: 'Acetinado macio, acabamento aveludado. Transforma a pintura original em algo mais contido e sofisticado.',
          image: '/assets/images/flow_clear_matte_haval.png',
          swatch: '#AAAAAE'
        },
        {
          name: 'BLACK GLOSS',
          anchor: 'O Black Piano por um valor justo.',
          desc: 'Preto espelhado com máximo escurecimento. Impacto visual sem abrir mão do custo consciente.',
          image: '/assets/images/flow_black_gloss_haval.png',
          swatch: '#0A0A0A'
        },
        {
          name: 'BLACK MATTE',
          anchor: 'Presença furtiva. Intenção clara.',
          desc: 'Preto fosco profundo, absorção de luz dramática. Para carros que não pedem licença — apenas aparecem.',
          image: '/assets/images/flow_black_matte_haval.png',
          swatch: '#1A1A1A'
        }
      ]
    }
  },
  {
    slug: 'core-gloss',
    title: 'NZ PPF CORE GLOSS',
    shortName: 'CORE',
    subtitle: 'Híbrido 80/20 TPU+PVC · 175µ · 3 Anos de Garantia',
    sectionTitle: 'O Mercado Exigia Preço. Nós Entregamos Engenharia.',
    bodyParagraphs: [
      'Engenharia híbrida 80/20: TPU premium + PVC de alta resistência. Proteção real contra riscos e pedras com a flexibilidade necessária — preço que cabe no planejamento.'
    ],
    image: '/assets/images/core_catalog_car.png',
    thickness: '175μ',
    warranty: '3 ANOS',
    accent: '#4A7C59',
    tone: 'green',
    highlights: [
      { label: 'Composição', value: '80/20 TPU/PVC' },
      { label: 'Espessura', value: '175 µ' },
      { label: 'Adesivo', value: 'Easy-Tack' },
      { label: 'Garantia', value: '3 anos' }
    ],
    architecture: [
      { num: '01', title: 'Híbrido 80/20',     desc: '80% TPU premium + 20% PVC.' },
      { num: '02', title: 'Espessura 175μ',    desc: 'Otimizado para absorver impactos.' },
      { num: '03', title: 'Adesivo Easy-Tack', desc: 'Reposicionável. Não agride pintura.' },
      { num: '04', title: 'Top Coat Premium',  desc: 'Hidrofóbico contra chuva ácida.' }
    ],
    finishes: {
      tagline: 'Engenharia híbrida. Estilo sem exceção.',
      items: [
        {
          name: 'CORE GLOSS',
          anchor: 'Brilho honesto. Proteção inteligente.',
          desc: 'Acabamento espelhado que corrige micro-imperfeições de orange-peel e devolve brilho uniforme à pintura.',
          image: '/assets/images/core_clear_gloss.png',
          swatch: '#E8E8EC'
        },
        {
          name: 'CORE MATTE',
          anchor: 'Fosco bruto. Estética com atitude.',
          desc: 'Acetinado bruto, difusão macia. Discrição com personalidade — sem pesar no bolso.',
          image: '/assets/images/core_clear_matte.png',
          swatch: '#8E9092'
        },
        {
          name: 'CORE BLACK',
          anchor: 'Preto puro. Reflexo de fibra envernizada.',
          desc: 'Opaco reflexivo com aparência de fibra de carbono envernizada. Presença visual sem comprometer a escolha.',
          image: '/assets/images/core_black_gloss.png',
          swatch: '#0A0A0A'
        },
        {
          name: 'CORE BLACK MATTE',
          anchor: 'Dark Stealth. Absorção implacável.',
          desc: 'Preto fosco profundo, opacidade dramática. O acabamento mais agressivo da linha — engenharia híbrida real.',
          image: '/assets/images/core_black_matte.png',
          swatch: '#1C1C1E'
        }
      ]
    }
  },
  {
    slug: 'headlight',
    title: 'NZ PPF HEADLIGHT',
    shortName: 'HEADLIGHT',
    subtitle: 'TPU Pigmentado Anti-UV · 150µ · 10 Anos de Garantia',
    sectionTitle: 'Detalhes Definem o Conjunto',
    bodyParagraphs: [
      'Proteção e personalização em uma única aplicação. Três tonalidades — Light Black, Light Gray e Dark Black — transformam o farol sem comprometer luminosidade nem segurança.'
    ],
    image: '/assets/images/nzppf_headlight_light_black.png',
    thickness: '150μ',
    warranty: '10 ANOS',
    accent: '#D4AF37',
    tone: 'gold',
    highlights: [
      { label: 'Espessura', value: '150 µ' },
      { label: 'Tonalidades', value: '3 exclusivas' },
      { label: 'Top Coat', value: 'Anti-UV' },
      { label: 'Garantia', value: '10 anos' }
    ],
    architecture: [
      { num: '01', title: 'Top Coat Anti-UV',      desc: 'Barreira contra amarelamento.' },
      { num: '02', title: 'Pigmentação Calibrada', desc: 'Preserva luminosidade.' },
      { num: '03', title: 'TPU Estabilizado',      desc: 'Flexível. Nunca amarela.' },
      { num: '04', title: 'Adesivo PSA',           desc: 'Remoção limpa, sem marcar.' }
    ],
    finishes: {
      tagline: 'O farol como extensão da identidade.',
      // Dark Black recebe destaque herói: é o tom mais agressivo da linha
      // e o de maior apelo emocional ("Presença máxima. Impacto visual total.")
      heroIndex: 2,
      items: [
        {
          name: 'LIGHT BLACK',
          anchor: 'Sofisticação sem exagero.',
          desc: 'Escurecimento sutil que integra o farol ao conjunto visual. Refinamento discreto sem comprometer luminosidade.',
          image: '/assets/images/nzppf_headlight_light_black.png',
          swatch: '#3A3A3C'
        },
        {
          name: 'LIGHT GRAY',
          anchor: 'O grafite que quase não se vê.',
          desc: 'Tom neutro e refinado. Quase imperceptível em dia claro — só quem entende percebe.',
          image: '/assets/images/nzppf_headlight_light_gray.png',
          swatch: '#5E5E62'
        },
        {
          name: 'DARK BLACK',
          anchor: 'Presença máxima. Impacto visual total.',
          desc: 'Fumê escuro profundo, o tom mais agressivo da linha. Transforma o farol em elemento de destaque — para carros que se impõem, não se apresentam.',
          image: '/assets/images/nzppf_headlight_dark_black.png',
          swatch: '#0F0F10'
        }
      ]
    }
  },
  {
    slug: 'windshield',
    title: 'NZ PPF WINDSHIELD',
    shortName: 'WINDSHIELD',
    subtitle: 'TPU 190µ · Face Externa · ADAS · 2 Anos de Garantia',
    sectionTitle: 'A Maior Superfície de Vidro Também é a Mais Exposta',
    bodyParagraphs: [
      'Pedras, detritos, areia, insetos. O parabrisa é a superfície mais exposta do carro. 190μ de TPU na face externa absorvem cada impacto — invisível para você, letal para a pedra.'
    ],
    image: '/assets/images/nzppf_windshield_diff_impacto.png',
    thickness: '190μ',
    warranty: '2 ANOS',
    accent: '#C0C0C0',
    tone: 'silver',
    highlights: [
      { label: 'Espessura', value: '190 µ (7.5 mil)' },
      { label: 'Aplicação', value: 'Face Externa' },
      { label: 'ADAS', value: 'Compatível' },
      { label: 'Garantia', value: '2 anos' }
    ],
    architecture: [
      { num: '01', title: 'TPU 190μ',             desc: 'Camada robusta contra impactos.' },
      { num: '02', title: 'Top Coat Hidrofóbico', desc: 'Repele água. Bloqueia UV.' },
      { num: '03', title: 'Transparência Óptica', desc: 'Zero distorção. Compatível ADAS.' },
      { num: '04', title: 'Adesivo Face Externa', desc: 'Resiste a lavagens frequentes.' }
    ]
  }
];

export interface BenchmarkLine {
  id: string;
  name: string;
  thickness: string;
  warranty: string;
  metrics: { label: string; value: number }[];
  highlight: string;
  accent: string;
}

/**
 * Export oficial: todos os strings já passaram por `sanitizeCatalogText`
 * recursivamente. Nenhum consumidor downstream precisa pensar em sanitização —
 * mas as páginas ainda chamam `sanitizeCatalogText` como segunda linha de
 * defesa para texto hardcoded em JSX.
 */
export const productLines: ProductLine[] = deepSanitize(rawProductLines);

const rawBenchmarkLines: BenchmarkLine[] = [
  {
    id: 'core', name: 'CORE', thickness: '175μ', warranty: '3 Anos', accent: '#4A7C59',
    metrics: [
      { label: 'Brilho', value: 70 },
      { label: 'Durabilidade', value: 60 },
      { label: 'Regeneração', value: 50 },
      { label: 'Repelência', value: 65 },
      { label: 'Custo-Benefício', value: 100 }
    ],
    highlight: 'Híbrido 80/20 + Easy-Tack. Máxima durabilidade na entrada.'
  },
  {
    id: 'flow', name: 'FLOW', thickness: '175μ', warranty: '4 Anos', accent: '#d11e1e',
    metrics: [
      { label: 'Brilho', value: 85 },
      { label: 'Durabilidade', value: 75 },
      { label: 'Regeneração', value: 70 },
      { label: 'Repelência', value: 80 },
      { label: 'Custo-Benefício', value: 85 }
    ],
    highlight: 'TPU técnico hidrofóbico. Entrada no PPF com regeneração.'
  },
  {
    id: 'prime', name: 'PRIME', thickness: '190μ', warranty: '10 Anos', accent: '#4A90D9',
    metrics: [
      { label: 'Brilho', value: 92 },
      { label: 'Durabilidade', value: 90 },
      { label: 'Regeneração', value: 85 },
      { label: 'Repelência', value: 90 },
      { label: 'Custo-Benefício', value: 75 }
    ],
    highlight: 'TPU 100% Virgem + Nano-Dúplex. Padrão premium.'
  },
  {
    id: 'luxury', name: 'LUXURY', thickness: '190μ', warranty: '12 Anos', accent: '#D4AF37',
    metrics: [
      { label: 'Brilho', value: 100 },
      { label: 'Durabilidade', value: 100 },
      { label: 'Regeneração', value: 100 },
      { label: 'Repelência', value: 95 },
      { label: 'Custo-Benefício', value: 60 }
    ],
    highlight: 'TPU Alifático + Nano-Japonês. +32% Brilho. Excelência absoluta.'
  }
];

export const benchmarkLines: BenchmarkLine[] = deepSanitize(rawBenchmarkLines);

const rawExclusiveDifferentials = [
  {
    icon: '/assets/simbolos/simbolo-camada.svg',
    title: 'Top Coat Aprovado',
    line: '5 LINHAS PREMIUM',
    desc: 'Camada nano-estruturada com proteção UV certificada e repelência hidrofóbica.'
  },
  {
    icon: '/assets/simbolos/simbolo-certo.svg',
    title: 'Pigmentação Calibrada',
    line: 'EXCLUSIVO HEADLIGHT',
    desc: 'Três tonalidades testadas em laboratório, sem comprometer luminosidade.'
  },
  {
    icon: '/assets/simbolos/simbolo-escudo-vazio.svg',
    title: 'TPU Estabilizado',
    line: '5 LINHAS PREMIUM',
    desc: 'Polímero alifático com estabilização química contra UV. No Core, vem do blend 80/20.'
  },
  {
    icon: '/assets/simbolos/simbolo-regeneracao.svg',
    title: 'Adesivo PSA',
    line: 'TODAS AS 6 LINHAS',
    desc: 'Reposicionamento na aplicação e remoção limpa, sem resíduos.'
  }
];

export const exclusiveDifferentials = deepSanitize(rawExclusiveDifferentials);

export const catalogMeta = {
  edition: 'CATÁLOGO OFICIAL — EDIÇÃO 2026',
  brand: 'NZPPF',
  tagline: 'PROTEÇÃO FEITA PARA O MUNDO REAL',
  url: 'www.nzgroup.com.br',
  baseUrl: 'https://www.nzgroup.com.br',
  ppfPath: '/ppf',
  company: 'NZGROUP'
};

export function productUrl(slug: string): string {
  return `${catalogMeta.baseUrl}${catalogMeta.ppfPath}/${slug}`;
}

export const TOTAL_PAGES = 15;
export const TOTAL_PAGES_COMPLETE = 20;

export type CatalogMode = 'standard' | 'complete';

export function totalPagesFor(mode: CatalogMode): number {
  return mode === 'complete' ? TOTAL_PAGES_COMPLETE : TOTAL_PAGES;
}
