import { deepSanitize } from '../../../utils/sanitize';

export interface ArchitectureItem {
  num: string;
  title: string;
  desc: string;
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
    ]
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
    ]
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
    ]
  },
  {
    slug: 'core-gloss',
    title: 'NZ PPF CORE GLOSS',
    shortName: 'CORE',
    subtitle: 'Híbrido 80/20 TPU+PVC · 150–180µ · 3 Anos de Garantia',
    sectionTitle: 'O Mercado Exigia Preço. Nós Entregamos Engenharia.',
    bodyParagraphs: [
      'Você pesquisou, comparou, ouviu de tudo: que PPF bom custa uma fortuna, que barato descasca em meses, que meio-termo não existe. Existe. E se chama NZ PPF Core.',
      '80% de TPU premium — o mesmo das linhas topo de mercado — com 20% de PVC de alta resistência. Proteção real contra riscos, pedras e desgaste diário. Com a flexibilidade que uma aplicação bem-feita exige.',
      'Proteção de verdade, acabamento premium, preço que cabe no planejamento. Porque proteger o seu carro não é luxo. É inteligência.'
    ],
    image: '/assets/images/core_catalog_car.png',
    thickness: '150–180μ',
    warranty: '3 ANOS',
    accent: '#4A7C59',
    tone: 'green',
    highlights: [
      { label: 'Composição', value: '80/20 TPU/PVC' },
      { label: 'Espessura', value: '150–180 µ' },
      { label: 'Adesivo', value: 'Easy-Tack' },
      { label: 'Garantia', value: '3 anos' }
    ],
    architecture: [
      { num: '01', title: 'Engenharia Híbrida 80/20', desc: '80% TPU premium + 20% PVC de alta resistência. Proteção real com custo acessível.' },
      { num: '02', title: 'Espessura 150–180μ',       desc: 'Dimensão otimizada para absorver impactos sem comprometer custo-benefício.' },
      { num: '03', title: 'Adesivo Easy-Tack',        desc: 'Reposicionável durante a aplicação. Não agride a pintura ao remover.' },
      { num: '04', title: 'Top Coat Premium',         desc: 'Repelência hidrofóbica que protege contra chuva ácida e manchas do dia a dia.' }
    ]
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
    ]
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
    image: '/assets/images/nzppf_windshield_hero.png',
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
    id: 'core', name: 'CORE', thickness: '150–180μ', warranty: '3 Anos', accent: '#4A7C59',
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
    desc: 'Camada superior nano-estruturada com proteção UV certificada e repelência hidrofóbica. Mantém o brilho original por anos.'
  },
  {
    icon: '/assets/simbolos/simbolo-certo.svg',
    title: 'Pigmentação Calibrada',
    desc: 'Tonalidades testadas em laboratório para uniformidade cromática e estabilidade ao longo do tempo de uso.'
  },
  {
    icon: '/assets/simbolos/simbolo-escudo-vazio.svg',
    title: 'TPU Estabilizado',
    desc: 'Polímero alifático com estabilização química contra UV. Resistência real comprovada em condições extremas.'
  },
  {
    icon: '/assets/simbolos/simbolo-regeneracao.svg',
    title: 'Adesivo PSA Reposicionável',
    desc: 'PSA de alta performance que permite reposicionamento durante a aplicação e remoção limpa, sem resíduos.'
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

export const TOTAL_PAGES = 14;
