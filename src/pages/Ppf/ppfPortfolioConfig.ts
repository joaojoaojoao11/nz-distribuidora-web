/**
 * Metadados do portfólio em PDF de cada linha NZPPF.
 *
 * Aqui fica APENAS o que o PDF precisa e a página não expõe como dado:
 * copy de capa, manifesto, camadas e rótulos do eixo do benchmark.
 *
 * Os blocos pesados (ficha técnica, benchmark, diferenciais, acabamentos)
 * NÃO são duplicados: cada página passa as próprias constantes para o
 * <PpfPortfolioButton>, então continuam com uma fonte só.
 *
 * ATENÇÃO: os textos de `manifesto` espelham a seção Manifesto do JSX de
 * cada página. Ao reescrever o manifesto de uma linha, atualize os dois.
 */

export interface PortfolioBadge {
  value: string;
  label: string;
}

export interface PortfolioCamada {
  name: string;
  desc: string;
}

export interface PpfPortfolioConfig {
  slug: string;
  /** Nome comercial completo, usado na capa e no cabeçalho de página. */
  name: string;
  /** Linha de apoio da capa. */
  tagline: string;
  /** Cor de destaque da linha (mesma do CSS da página). */
  accent: string;
  /** A mesma cor em componentes RGB, para as transparências do CSS. */
  accentRgb: string;
  heroImage: string;
  badges: PortfolioBadge[];
  manifesto: {
    title: string;
    paragraphs: string[];
    quote: string;
  };
  /** Página de tecnologia. Omitida quando a linha não tem arte de camadas. */
  tecnologia?: {
    title: string;
    layersImage: string;
    camadas: PortfolioCamada[];
  };
  /** Rótulos do eixo X do benchmark — variam por linha (3 ou 5 pontos). */
  benchmarkYears: string[];
  benchmarkTitle: string;
  /** Título da página de acabamentos. Ausente quando a linha não tem. */
  finishesTitle?: string;
  /** Frase de disponibilidade no rodapé da página de contato. */
  fileName: string;
}

const CONTATO_PADRAO = 'www.nzgroup.com.br';

export const PPF_PORTFOLIOS: Record<string, PpfPortfolioConfig> = {
  'luxury-gloss': {
    slug: 'luxury-gloss',
    name: 'NZPPF Luxury Gloss',
    tagline: 'TPU Alifático 190μ | 12 Anos de Garantia',
    accent: '#D4AF37',
    accentRgb: '212, 175, 55',
    heroImage: '/assets/images/luxury_lambo.png',
    badges: [
      { value: '190μ', label: 'Espessura' },
      { value: '12 anos', label: 'Garantia de fábrica' },
      { value: '+32%', label: 'Brilho vs pintura nua' },
      { value: 'Alifático', label: 'TPU premium' },
    ],
    manifesto: {
      title: 'A melhor matéria-prima do mundo',
      paragraphs: [
        'Pare de sofrer com riscos, manchas de água e detritos na estrada. O TPU Alifático de 190 micras atua como um escudo invisível de alta resistência, blindando a pintura original contra os piores cenários do trânsito brasileiro.',
        'Você não precisa mais escolher entre proteção e estética. O Nano-Revestimento de tecnologia japonesa impulsiona o nível de brilho em até +32%, proporcionando um acabamento vitrificado, profundo e espelhado.',
        'Graças ao polímero inteligente de regeneração térmica avançada, os pequenos arranhões e as marcas de lavagem somem sozinhos apenas com o calor do sol.',
      ],
      quote:
        'Validada pelos instaladores de elite e com 12 ANOS DE GARANTIA, essa não é apenas uma película protetora. É o fim da depreciação estética e a valorização suprema do seu investimento.',
    },
    tecnologia: {
      title: 'Coextrusão em 4 camadas',
      layersImage: '/assets/images/nzppf_premium_layers_tpu.png',
      camadas: [
        { name: 'Nano-Revestimento Japonês (Top Coat)', desc: 'Hidrofobia extrema, auto-cura térmica e +32% de brilho.' },
        { name: 'Core em TPU Alifático 190μ', desc: 'Estabilização anti-UV: não amarela ao longo dos 12 anos.' },
        { name: 'Adesivo Acrílico PSA Reposicionável', desc: 'Instalação limpa e remoção segura, sem resíduos.' },
      ],
    },
    benchmarkYears: ['Ano 1', 'Ano 3', 'Ano 5', 'Ano 8', 'Ano 12'],
    benchmarkTitle: 'Desgaste em 12 anos',
    finishesTitle: 'Acabamentos disponíveis',
    fileName: 'NZPPF_Luxury_Gloss_Portfolio.pdf',
  },

  'prime-gloss': {
    slug: 'prime-gloss',
    name: 'NZPPF Prime Gloss',
    tagline: 'TPU 100% Virgem 190μ | 10 Anos de Garantia',
    accent: '#4A90D9',
    accentRgb: '74, 144, 217',
    heroImage: '/assets/images/nzppf_prime_hero.png',
    badges: [
      { value: '190μ', label: 'Espessura' },
      { value: '10 anos', label: 'Garantia de fábrica' },
      { value: '100%', label: 'TPU virgem' },
      { value: 'Nano-dúplex', label: 'Top coat' },
    ],
    manifesto: {
      title: 'Proteção premium com o melhor custo-benefício',
      paragraphs: [
        'Pare de aceitar películas genéricas que amarelam em meses. O NZPPF Prime Gloss utiliza TPU 100% virgem — mais flexível, durável e brilhante que o PU comum — entregando proteção real contra micro-riscos, chuva ácida, impactos de pedras e oxidação.',
        'Com revestimento hidrofóbico nano-dúplex, a superfície repele água, poeira e sujeira naturalmente. O carro fica mais fácil de limpar e mantém o brilho por muito mais tempo.',
        'A regeneração térmica inteligente elimina micro-riscos apenas com exposição ao calor. Diferente das películas de PU e blends reciclados, o Prime Gloss não resseca e não trinca.',
      ],
      quote:
        'Pensada para quem quer unir estética, proteção e praticidade, a NZ Prime Gloss entrega resultado profissional com excelente custo-benefício — e conta com 10 ANOS DE GARANTIA para sua tranquilidade.',
    },
    tecnologia: {
      title: 'Multicamada de alta performance',
      layersImage: '/assets/images/nzppf_prime_layers.jpg',
      camadas: [
        { name: 'Top Coat Hidrofóbico Nano-Dúplex', desc: 'Dupla camada de repelência e proteção de superfície.' },
        { name: 'Core em TPU 100% Virgem 190μ', desc: 'Mais flexível e durável que PU e blends reciclados.' },
        { name: 'Adesivo Flexível de Alta Conformação', desc: 'Adesão perfeita em curvas e detalhes complexos.' },
      ],
    },
    benchmarkYears: ['Ano 1', 'Ano 3', 'Ano 5', 'Ano 8', 'Ano 10'],
    benchmarkTitle: 'Desgaste em 10 anos',
    finishesTitle: 'Acabamentos disponíveis',
    fileName: 'NZPPF_Prime_Gloss_Portfolio.pdf',
  },

  'flow-gloss': {
    slug: 'flow-gloss',
    name: 'NZPPF Flow Gloss',
    tagline: 'Nova Formulação G2 | 7 Anos de Garantia',
    accent: '#0daebd',
    accentRgb: '13, 174, 189',
    heroImage: '/assets/images/flow_hero_haval.png',
    badges: [
      { value: '185μ', label: 'Espessura' },
      { value: '7 anos', label: 'Garantia de fábrica' },
      { value: 'TPU G2', label: 'Base de 2ª geração' },
      { value: '4', label: 'Acabamentos' },
    ],
    manifesto: {
      title: 'A nova geração do PPF intermediário',
      paragraphs: [
        'O NZPPF Flow Gloss foi reformulado. A linha estreia o TPU Técnico G2 — uma base de segunda geração — somado a um novo top coat nano-hidrofóbico. Não é a mesma película com outro rótulo: mudou a química e mudou o corpo do filme.',
        'A espessura subiu de 175 para 185 micras: dez micras a mais de material para absorver pedra, areia e detrito da via antes que cheguem à pintura. E o ganho não parou no volume — a nova base tem estabilidade dimensional e resistência a UV maiores, e o top coat G2 repele água e sujeira com mais eficiência que a formulação anterior.',
        'Muito acima de qualquer PU comum, o TPU G2 não resseca, não trinca e regenera micro-riscos com mais rapidez. Foi justamente esse conjunto que permitiu à NZ estender a garantia de fábrica para 7 anos.',
      ],
      quote:
        'A Flow deixou de ser a escolha de entrada e virou a linha intermediária de performance da NZPPF: 185 micras de corpo com a química da nova geração. Garantia certificada estrutural de 7 ANOS pela NZ.',
    },
    tecnologia: {
      title: 'Nova formulação, mais espessura',
      layersImage: '/assets/images/flow_layers.png',
      camadas: [
        { name: 'Top Coat Nano-Hidrofóbico G2', desc: 'Camada nova: repele mais água e sujeira e acelera a auto-cura dos micro-riscos.' },
        { name: 'TPU Técnico G2 185μ (Core)', desc: 'Base de 2ª geração, agora dez micras mais espessa: mais absorção de impacto e mais estabilidade sob UV.' },
        { name: 'Adesivo Acrílico de Alta Conformação', desc: 'Aplicação amigável até nas geometrias mais complexas, com remoção limpa.' },
      ],
    },
    benchmarkYears: ['Ano 1', 'Ano 4', 'Ano 7'],
    benchmarkTitle: 'Desgaste em 7 anos',
    finishesTitle: 'Acabamentos e disponibilidade',
    fileName: 'NZPPF_Flow_Gloss_G2_Portfolio.pdf',
  },

  'core-gloss': {
    slug: 'core-gloss',
    name: 'NZPPF Core Gloss',
    tagline: 'Híbrido 80/20 · 175μ | 3 Anos de Garantia',
    accent: '#4A7C59',
    accentRgb: '74, 124, 89',
    heroImage: '/assets/images/core_catalog_car.png',
    badges: [
      { value: '175μ', label: 'Espessura' },
      { value: '3 anos', label: 'Garantia de fábrica' },
      { value: '80/20', label: 'TPU premium + PVC' },
      { value: '4', label: 'Acabamentos' },
    ],
    manifesto: {
      title: 'O mercado exigia preço. Nós entregamos margem.',
      paragraphs: [
        'Você conhece a realidade da oficina: quando o cliente espreme o orçamento, a loja inevitavelmente empurra um vinil barato. O aplicador sofre na instalação, a cola trava, o material resseca, e o retorno à garantia destrói toda a sua margem.',
        'Por outro lado, utilizar um rolo de TPU puro em um projeto de entrada é assassinar o seu caixa. O NZPPF Core foi criado exclusivamente para resolver a matemática da bancada.',
        'Desenvolvemos um blend exato de 80% de TPU premium para garantir elasticidade e proteção real, fundido a 20% de PVC de alta resistência. O resultado? O melhor ticket médio que a sua operação de volume já teve.',
      ],
      quote:
        'O ativo da sua operação não é uma película barata. É previsibilidade de aplicação, nenhuma bolha, cliente feliz e garantia de 3 ANOS certificada pela marca que sustenta sua operação: a NZ.',
    },
    tecnologia: {
      title: 'O blend que resolve a bancada',
      layersImage: '/assets/images/core_layers.png',
      camadas: [
        { name: 'Top Coat Hidrofóbico', desc: 'Barreira contra chuva ácida e facilidade de limpeza no dia a dia.' },
        { name: 'Blend 80% TPU + 20% PVC · 175μ', desc: 'Elasticidade e proteção real com o custo que o projeto de entrada exige.' },
        { name: 'Adesivo Easy-Tack Reposicionável', desc: 'Instalação previsível, sem bolha e sem retrabalho na bancada.' },
      ],
    },
    benchmarkYears: ['Ano 1', 'Ano 2', 'Ano 3'],
    benchmarkTitle: 'Desgaste em 3 anos',
    finishesTitle: 'Acabamentos disponíveis',
    fileName: 'NZPPF_Core_Gloss_Portfolio.pdf',
  },

  headlight: {
    slug: 'headlight',
    name: 'NZ PPF Headlight',
    tagline: 'Película para Faróis | 10 Anos de Garantia',
    accent: '#D4AF37',
    accentRgb: '212, 175, 55',
    heroImage: '/assets/images/nzppf_headlight_light_black.png',
    badges: [
      { value: '10 anos', label: 'Garantia de fábrica' },
      { value: '3', label: 'Tonalidades' },
      { value: 'Anti-UV', label: 'Estabilização certificada' },
      { value: 'ADAS', label: 'Luminosidade preservada' },
    ],
    manifesto: {
      title: 'Detalhes definem o conjunto',
      paragraphs: [
        'A linha NZ PPF Headlight oferece proteção e personalização em uma única aplicação. Desenvolvida para quem entende que os detalhes constroem a identidade visual do veículo.',
        'São três tonalidades exclusivas, pensadas para transformar a identidade visual dos faróis sem comprometer a luminosidade nem a segurança. Cada filme é produzido com matéria-prima de alta performance, resistente ao amarelamento, às intempéries e ao desgaste do uso diário.',
        'Uma camada que age como escudo e como acabamento — ao mesmo tempo.',
      ],
      quote:
        'Proteção real. Estética sob medida. 10 ANOS DE GARANTIA de fábrica contra amarelamento, perda de adesão e delaminação.',
    },
    benchmarkYears: ['Ano 1', 'Ano 3', 'Ano 5', 'Ano 8', 'Ano 10'],
    benchmarkTitle: 'Desgaste em 10 anos',
    finishesTitle: 'Tonalidades disponíveis',
    fileName: 'NZPPF_Headlight_Portfolio.pdf',
  },

  windshield: {
    slug: 'windshield',
    name: 'NZ PPF Windshield',
    tagline: 'TPU 190μ para Parabrisa | 2 Anos de Garantia',
    accent: '#D4AF37',
    accentRgb: '212, 175, 55',
    heroImage: '/assets/images/nzppf_windshield_hero.png',
    badges: [
      { value: '190μ', label: 'Espessura' },
      { value: '2 anos', label: 'Garantia de fábrica' },
      { value: 'ADAS', label: 'Compatível com sensores' },
      { value: 'Zero', label: 'Distorção óptica' },
    ],
    manifesto: {
      title: 'A maior superfície de vidro também é a mais exposta',
      paragraphs: [
        'O parabrisa é a maior superfície de vidro do veículo — e a mais exposta. Pedras em rodovias, detritos urbanos, areia, insetos: cada quilômetro rodado é um risco silencioso que pode custar caro.',
        'Uma única trinca pode comprometer sensores ADAS, câmeras de assistência e a integridade estrutural do vidro. E a troca de um parabrisa original, além do custo elevado, significa abrir mão da vedação de fábrica — algo que nunca se recupera por completo.',
        'O NZ PPF Windshield foi desenvolvido para eliminar esse risco antes que ele aconteça.',
      ],
      quote:
        '190 micras de TPU de alta performance atuando como camada de absorção de impacto aplicada na face externa do parabrisa. Proteção invisível. Desempenho real.',
    },
    benchmarkYears: ['Ano 1', 'Ano 2', 'Ano 3'],
    benchmarkTitle: 'Desgaste em 3 anos',
    fileName: 'NZPPF_Windshield_Portfolio.pdf',
  },
};

export const PORTFOLIO_SITE = CONTATO_PADRAO;
