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
      'Riscos. Manchas de água. Detritos de estrada. O TPU Alifático de 190 micras transforma o trânsito brasileiro em detalhe. Um escudo invisível blindando cada centímetro da pintura original.',
      'Proteção e estética não são mais escolha. O Nano-Revestimento japonês eleva o brilho em +32% — acabamento vitrificado, profundo, espelhado. O tipo de presença que faz cabeça virar.',
      'Polímero inteligente com regeneração térmica: pequenos arranhões e marcas de lavagem desaparecem sozinhos, apenas com o calor do sol. Sem polimento. Sem retoque.'
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
      { num: '01', title: 'Top Coat Nano-Japonês',    desc: 'Camada superior com nanopartículas que repelem contaminantes e entregam auto-cura térmica imediata.' },
      { num: '02', title: 'TPU Alifático 190μ',       desc: 'Poliuretano de alta resistência que nunca amarela sob UV. Blindagem real para a pintura.' },
      { num: '03', title: 'Regeneração Térmica',      desc: 'Micro-riscos desaparecem sozinhos com o calor do sol. Auto-cura inteligente comprovada.' },
      { num: '04', title: 'Adesivo PSA Reposicionável', desc: 'Instalação limpa e remoção sem resíduos, mesmo após 12 anos de uso.' }
    ],
    finishes: {
      tagline: 'Cada acabamento. Uma expressão do seu padrão.',
      items: [
        {
          name: 'GLOSS',
          anchor: 'O brilho que vira presença.',
          desc: 'Espelhamento vitrificado, profundidade cristalina. Para quem faz questão de ser notado pelos detalhes — do reflexo na carroceria ao acabamento impecável sob qualquer luz.',
          image: '/assets/images/nzppf_super_brilho.png',
          swatch: '#F5F5F7'
        },
        {
          name: 'MATTE',
          anchor: 'Silêncio premium.',
          desc: 'Aveludado, discreto, sofisticado. Para o proprietário que entende que luxo verdadeiro é aquele que não precisa gritar — apenas existir com personalidade.',
          image: '/assets/images/nzppf_matte.png',
          swatch: '#2E2E30'
        },
        {
          name: 'BLACK',
          anchor: 'Luxo absoluto. Profundidade inegociável.',
          desc: 'Preto profundo vitrificado. Para carros que carregam atitude — onde cada centímetro comunica presença, poder e refinamento em uma única camada.',
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
      'Chega de película genérica que amarela em meses. O Prime Gloss é TPU 100% virgem — mais flexível, mais durável, mais brilhante que qualquer PU comum. Proteção real contra micro-riscos, chuva ácida, impactos e oxidação.',
      'Revestimento hidrofóbico nano-dúplex: água, poeira e sujeira escorrem naturalmente. Lavar vira rotina rápida. O brilho, uma constante.',
      'Regeneração térmica inteligente elimina micro-riscos só com o calor do sol. Diferente de blends reciclados e PU comum, o Prime Gloss não resseca. Não trinca. Não decepciona.'
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
      { num: '01', title: 'Top Coat Nano-Dúplex',  desc: 'Dupla camada hidrofóbica que repele água, poeira e sujeira naturalmente.' },
      { num: '02', title: 'TPU 100% Virgem 190μ',  desc: 'Sem reciclados. Pureza química que garante estabilidade óptica e durabilidade real.' },
      { num: '03', title: 'Regeneração Térmica',   desc: 'Auto-cura de micro-riscos por exposição ao calor. Acabamento sempre impecável.' },
      { num: '04', title: 'Adesivo Flexível',      desc: 'Alta conformação em curvas e detalhes complexos. Sem encolhimento ou descolamento.' }
    ],
    finishes: {
      tagline: 'Três acabamentos. Um padrão de excelência.',
      items: [
        {
          name: 'GLOSS',
          anchor: 'Brilho que sustenta o tempo.',
          desc: 'Reflexo intenso e uniforme, com hidrofobia nano-dúplex que mantém o acabamento impecável em qualquer condição — da garagem à estrada aberta.',
          image: '/assets/images/nzppf_prime_brilho.png',
          swatch: '#F0F0F4'
        },
        {
          name: 'MATTE',
          anchor: 'Elegância que escolhe não competir.',
          desc: 'Toque aveludado, acetinado, personalidade discreta. Ideal para quem entende que diferenciação não precisa de exagero — precisa de intenção.',
          image: '/assets/images/nzppf_prime_matte.jpg',
          swatch: '#2B2D30'
        },
        {
          name: 'BLACK PIANO',
          anchor: 'Profundidade espelhada. Absoluta.',
          desc: 'Preto vitrificado com reflexo profundo, lembrando o acabamento de instrumento de alta categoria. Para donos que querem o impacto visual de um conceito premium — com proteção garantida por 10 anos.',
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
      'A porta de entrada no PPF de verdade. Tecnologia real, acabamento impecável, valor acessível. TPU técnico combinado com adesivo de alta performance — o primeiro passo no universo NZ.',
      '175 micras com coating hidrofóbico que repele poeira e água. Flexibilidade em curvas complexas, aplicação segura, visual cristalino. Performance que não costuma aparecer nessa faixa.',
      'Muito acima dos PU comuns do mercado. O TPU Técnico NZ não resseca, não trinca, mantém estabilidade dimensional e regenera micro-riscos leves com sol ou estufa.'
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
      { num: '01', title: 'Revestimento Hidrofóbico', desc: 'Top coat que repele água e poeira. Lavagem facilitada no dia a dia.' },
      { num: '02', title: 'TPU Técnico 175μ',         desc: 'Base de tecnologia real. Não resseca e não trinca como PU comum.' },
      { num: '03', title: 'Regeneração Térmica',      desc: 'Auto-cura leve de micro-riscos pela ação do sol ou estufa.' },
      { num: '04', title: 'Adesivo Acrílico',         desc: 'Alta conformação em curvas e geometrias complexas do veículo.' }
    ],
    finishes: {
      tagline: 'Versatilidade real. Estética sem compromisso.',
      items: [
        {
          name: 'CLEAR GLOSS',
          anchor: 'A cor original, potencializada.',
          desc: 'Transparente com brilho que realça a pintura de fábrica. Para quem quer proteção sem alterar a identidade visual do veículo — apenas intensificar o que já é bonito.',
          image: '/assets/images/flow_clear_gloss_haval.png',
          swatch: '#EAEAEE'
        },
        {
          name: 'CLEAR MATTE',
          anchor: 'O fosco que suaviza sem apagar.',
          desc: 'Acetinado macio, acabamento aveludado. Transforma a pintura original em algo mais contido, mais sofisticado — sem perder a essência.',
          image: '/assets/images/flow_clear_matte_haval.png',
          swatch: '#AAAAAE'
        },
        {
          name: 'BLACK GLOSS',
          anchor: 'O Black Piano por um valor justo.',
          desc: 'Preto espelhado, máximo escurecimento com brilho absoluto. A opção certa para quem quer impacto visual sem abrir mão do custo consciente.',
          image: '/assets/images/flow_black_gloss_haval.png',
          swatch: '#0A0A0A'
        },
        {
          name: 'BLACK MATTE',
          anchor: 'Presença furtiva. Intenção clara.',
          desc: 'Preto fosco profundo, absorção de luz dramática. Para carros que não pedem licença — apenas aparecem, imponentes, em qualquer cenário.',
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
      'Você pesquisou, comparou, ouviu de tudo: que PPF bom custa uma fortuna, que barato descasca em meses, que meio-termo não existe. Existe. E se chama NZ PPF Core.',
      '80% de TPU premium — o mesmo das linhas topo de mercado — com 20% de PVC de alta resistência. Proteção real contra riscos, pedras e desgaste diário. Com a flexibilidade que uma aplicação bem-feita exige.',
      'Proteção de verdade, acabamento premium, preço que cabe no planejamento. Porque proteger o seu carro não é luxo. É inteligência.'
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
      { num: '01', title: 'Engenharia Híbrida 80/20', desc: '80% TPU premium + 20% PVC de alta resistência. Proteção real com custo acessível.' },
      { num: '02', title: 'Espessura 175μ',            desc: 'Dimensão otimizada para absorver impactos sem comprometer custo-benefício.' },
      { num: '03', title: 'Adesivo Easy-Tack',        desc: 'Reposicionável durante a aplicação. Não agride a pintura ao remover.' },
      { num: '04', title: 'Top Coat Premium',         desc: 'Repelência hidrofóbica que protege contra chuva ácida e manchas do dia a dia.' }
    ],
    finishes: {
      tagline: 'Engenharia híbrida. Estilo sem exceção.',
      items: [
        {
          name: 'CORE GLOSS',
          anchor: 'Brilho honesto. Proteção inteligente.',
          desc: 'Acabamento espelhado que corrige micro-imperfeições de orange-peel, devolvendo ao carro um brilho uniforme — mesmo em pinturas já castigadas pelo tempo.',
          image: '/assets/images/core_clear_gloss.png',
          swatch: '#E8E8EC'
        },
        {
          name: 'CORE MATTE',
          anchor: 'Fosco bruto. Estética com atitude.',
          desc: 'Acetinado bruto, difusão macia. Para donos que procuram discrição com personalidade — um visual que foge do óbvio sem pesar no bolso.',
          image: '/assets/images/core_clear_matte.png',
          swatch: '#8E9092'
        },
        {
          name: 'CORE BLACK',
          anchor: 'Preto puro. Reflexo de fibra envernizada.',
          desc: 'Opaco reflexivo com aparência de fibra de carbono envernizada. Para carros que precisam de presença visual sem comprometer a matemática da escolha.',
          image: '/assets/images/core_black_gloss.png',
          swatch: '#0A0A0A'
        },
        {
          name: 'CORE BLACK MATTE',
          anchor: 'Dark Stealth. Absorção implacável.',
          desc: 'Preto fosco profundo, opacidade dramática. O acabamento mais agressivo da linha — para quem quer atitude máxima com engenharia híbrida de verdade.',
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
      'Proteção e personalização em uma única aplicação. Para quem entende que um carro memorável é feito de detalhes — e o farol é o primeiro deles.',
      'Três tonalidades exclusivas — Light Black, Light Gray e Dark Black — transformam a identidade do farol sem comprometer luminosidade nem segurança. Matéria-prima de alta performance, imune ao amarelamento, às intempéries e ao desgaste diário.',
      'Uma camada que protege enquanto personaliza. 10 anos de garantia contra amarelamento, perda de adesão e delaminação.'
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
      { num: '01', title: 'Top Coat Anti-UV',           desc: 'Barreira química contra amarelamento e intempéries. Proteção real a longo prazo.' },
      { num: '02', title: 'Pigmentação Calibrada',      desc: 'Tonalização homogênea que não compromete a luminosidade nem a segurança noturna.' },
      { num: '03', title: 'TPU Estabilizado',           desc: 'Flexibilidade e resistência ao desgaste diário. Nunca amarela sob UV.' },
      { num: '04', title: 'Adesivo PSA Reposicionável', desc: 'Remoção limpa sem resíduos, sem marcar a lente do farol.' }
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
          desc: 'Escurecimento sutil que integra o farol ao conjunto visual do veículo. Para quem quer refinamento discreto — sem comprometer a luminosidade nem a segurança noturna.',
          image: '/assets/images/nzppf_headlight_light_black.png',
          swatch: '#3A3A3C'
        },
        {
          name: 'LIGHT GRAY',
          anchor: 'O grafite que quase não se vê.',
          desc: 'Tom neutro e refinado. Quase imperceptível em dia claro, revela-se no detalhe — o tipo de escolha que só quem entende percebe.',
          image: '/assets/images/nzppf_headlight_light_gray.png',
          swatch: '#5E5E62'
        },
        {
          name: 'DARK BLACK',
          anchor: 'Presença máxima. Impacto visual total.',
          desc: 'Fumê escuro profundo, o tom mais agressivo da linha. Transforma o farol em elemento de destaque — para carros que não se apresentam, se impõem.',
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
      'Seu parabrisa é a maior superfície de vidro do carro — e a mais exposta. Pedras na rodovia, detritos urbanos, areia, insetos. Cada quilômetro é um risco silencioso que custa caro depois.',
      'Uma única trinca compromete sensores ADAS, câmeras de assistência e a integridade estrutural do vidro. A troca de um parabrisa original é cara, demorada e sacrifica a vedação de fábrica — que nunca se recupera por completo.',
      'O NZ PPF Windshield elimina esse risco antes que ele aconteça. 190 micras de TPU de alta performance absorvendo cada impacto, aplicadas na face externa do parabrisa. Invisível para você. Letal para a pedra.'
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
      { num: '01', title: 'TPU 190μ (7.5 mil)',       desc: 'Camada robusta dimensionada para absorção de impacto em parabrisa.' },
      { num: '02', title: 'Top Coat Hidrofóbico UV',  desc: 'Repele água e bloqueia radiação solar. Proteção real contra intempéries.' },
      { num: '03', title: 'Transparência Óptica',     desc: 'Zero distorção. Compatível com sensores ADAS e câmeras de assistência.' },
      { num: '04', title: 'Adesivo Face Externa',     desc: 'Resistente a lavagens frequentes e abrasão. Mantém vedação de fábrica intacta.' }
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
    highlight: 'Híbrido 80% TPU + 20% PVC com adesivo Easy-Tack. Máxima durabilidade na faixa de entrada do mercado.'
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
    highlight: 'TPU técnico hidrofóbico. A porta de entrada inteligente no PPF técnico, com regeneração ativa.'
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
    highlight: 'TPU 100% Virgem com top coat Nano-Dúplex. O padrão de qualidade do mercado premium.'
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
    highlight: 'TPU Alifático Premium com Top Coat Nano-Japonês. +32% Brilho. A excelência absoluta.'
  }
];

export const benchmarkLines: BenchmarkLine[] = deepSanitize(rawBenchmarkLines);

const rawExclusiveDifferentials = [
  {
    icon: '/assets/simbolos/simbolo-camada.svg',
    title: 'Top Coat Aprovado',
    line: 'PRESENTE EM: LUXURY · PRIME · FLOW · HEADLIGHT · WINDSHIELD',
    desc: 'Camada superior nano-estruturada com proteção UV certificada e repelência hidrofóbica. Mantém o brilho original por anos em todas as linhas premium.'
  },
  {
    icon: '/assets/simbolos/simbolo-certo.svg',
    title: 'Pigmentação Calibrada',
    line: 'EXCLUSIVO DA LINHA: HEADLIGHT',
    desc: 'Três tonalidades testadas em laboratório para uniformidade cromática e estabilidade ao longo do tempo. Transforma o farol sem comprometer luminosidade.'
  },
  {
    icon: '/assets/simbolos/simbolo-escudo-vazio.svg',
    title: 'TPU Estabilizado',
    line: 'PRESENTE EM: LUXURY · PRIME · FLOW · HEADLIGHT · WINDSHIELD',
    desc: 'Polímero alifático com estabilização química contra UV. Resistência real comprovada em condições extremas. No Core, a estabilização vem do blend híbrido 80/20.'
  },
  {
    icon: '/assets/simbolos/simbolo-regeneracao.svg',
    title: 'Adesivo PSA Reposicionável',
    line: 'PRESENTE EM TODAS AS 6 LINHAS',
    desc: 'Adesivo PSA de alta performance que permite reposicionamento durante a aplicação e remoção limpa, sem resíduos. Padrão de qualidade em toda a família NZPPF.'
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
