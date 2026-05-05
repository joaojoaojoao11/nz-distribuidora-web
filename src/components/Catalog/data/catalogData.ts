import { deepSanitize } from '../../../utils/sanitize';

export interface ArchitectureItem {
  num: string;
  title: string;
  desc: string;
  /**
   * Caminho do SVG-âncora visual (substitui prosa por símbolo + microcopy
   * conforme a refundação tipográfica para impressão A5). Reaproveita
   * o set em /public/assets/simbolos/ — mesmo vocabulário visual usado
   * em DifferentiatorsPage.
   */
  icon: string;
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
  /** Eyebrow editorial da seção de fechamento, abaixo dos specs */
  closingTagline?: string;
  /** Pull line aspiracional de marca — 1 frase curta, em itálico */
  closingLine?: string;
}

// Caminhos dos símbolos compartilhados entre páginas. Centralizados aqui
// para evitar string drift e facilitar troca futura por icons SVG inline.
const ICON = {
  camada: '/assets/simbolos/simbolo-camada.svg',
  escudoVazio: '/assets/simbolos/simbolo-escudo-vazio.svg',
  escudoBraco: '/assets/simbolos/simbolo-escudo-com-braco.svg',
  regeneracao: '/assets/simbolos/simbolo-regeneracao.svg',
  repelencia: '/assets/simbolos/simbolo-repelencia.svg',
  certo: '/assets/simbolos/simbolo-certo.svg',
  presente: '/assets/simbolos/simbolo-presente.svg',
} as const;

const rawProductLines: ProductLine[] = [
  {
    slug: 'luxury-gloss',
    title: 'NZ PPF LUXURY GLOSS',
    shortName: 'LUXURY',
    subtitle: 'TPU Alifático 190µ · 12 anos',
    sectionTitle: 'A Melhor Matéria-Prima do Mundo',
    bodyParagraphs: [
      'TPU Alifático 190µ. Nano-japonês entrega +32% brilho. Acabamento vitrificado e espelhado.',
      '12 anos não é número de marketing — é o ciclo real da camada alifática contra UV. O intervalo que separa filme premium de filme honesto.'
    ],
    closingTagline: 'PARA QUEM EXIGE O ABSOLUTO',
    closingLine: 'Não é proteção. É declaração.',
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
      { num: '01', title: 'Top Coat Nano-Japonês', desc: 'Repele sujeira. Auto-cura.',     icon: ICON.camada },
      { num: '02', title: 'TPU Alifático 190μ',    desc: 'Não amarela sob UV.',            icon: ICON.escudoVazio },
      { num: '03', title: 'Regeneração Térmica',   desc: 'Riscos somem com o sol.',        icon: ICON.regeneracao },
      { num: '04', title: 'Adesivo PSA',           desc: 'Remoção limpa em 12 anos.',      icon: ICON.presente }
    ],
    finishes: {
      tagline: 'Cada acabamento. Uma expressão do seu padrão.',
      items: [
        {
          name: 'GLOSS',
          anchor: 'O brilho que vira presença.',
          desc: 'Espelhamento vitrificado, profundidade cristalina sob qualquer luz.',
          image: '/assets/images/nzppf_super_brilho.png',
          swatch: '#F5F5F7'
        },
        {
          name: 'MATTE',
          anchor: 'Silêncio premium.',
          desc: 'Aveludado, discreto, sofisticado. Luxo verdadeiro não grita.',
          image: '/assets/images/nzppf_matte.png',
          swatch: '#2E2E30'
        },
        {
          name: 'BLACK',
          anchor: 'Luxo absoluto. Profundidade inegociável.',
          desc: 'Preto vitrificado profundo. Cada centímetro comunica presença.',
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
    subtitle: 'TPU Virgem 190µ · Nano-Dúplex · 10 anos',
    sectionTitle: 'Proteção Premium com o Melhor Custo-Benefício',
    bodyParagraphs: [
      'TPU 100% virgem. Mais flexível, durável, brilhante. Não trinca, não amarela.',
      'Top coat Nano-Dúplex hidrofóbico de fábrica. 10 anos de garantia. O ponto onde proteção real encontra preço inteligente.'
    ],
    closingTagline: 'EQUILÍBRIO PREMIUM',
    closingLine: 'O custo do erro é maior que o custo do correto.',
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
      { num: '01', title: 'Top Coat Nano-Dúplex', desc: 'Hidrofóbico. Repele água.',  icon: ICON.camada },
      { num: '02', title: 'TPU 100% Virgem 190μ', desc: 'Pureza química. Durável.',   icon: ICON.escudoVazio },
      { num: '03', title: 'Regeneração Térmica',  desc: 'Auto-cura solar.',           icon: ICON.regeneracao },
      { num: '04', title: 'Adesivo Flexível',     desc: 'Conforma curvas totais.',    icon: ICON.presente }
    ],
    finishes: {
      tagline: 'Três acabamentos. Um padrão de excelência.',
      items: [
        {
          name: 'GLOSS',
          anchor: 'Brilho que sustenta o tempo.',
          desc: 'Reflexo intenso e uniforme com hidrofobia nano-dúplex.',
          image: '/assets/images/nzppf_prime_brilho.png',
          swatch: '#F0F0F4'
        },
        {
          name: 'MATTE',
          anchor: 'Elegância que escolhe não competir.',
          desc: 'Aveludado, acetinado. Diferenciação com intenção.',
          image: '/assets/images/nzppf_prime_matte.jpg',
          swatch: '#2B2D30'
        },
        {
          name: 'BLACK PIANO',
          anchor: 'Profundidade espelhada. Absoluta.',
          desc: 'Preto vitrificado de instrumento de alta categoria.',
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
    subtitle: 'TPU Técnico 175µ · 4 anos',
    sectionTitle: 'Entrada Inteligente no Mundo do PPF',
    bodyParagraphs: [
      'TPU técnico hidrofóbico. Não resseca, não trinca. Auto-cura sob o sol.',
      '175µ é o suficiente pro impacto urbano: pedra, areia, lavagem agressiva. Quatro anos de garantia que resistem ao mundo real.'
    ],
    closingTagline: 'ENTRADA TÉCNICA',
    closingLine: 'Nem todo carro precisa de 12 anos. Mas todo carro merece 4.',
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
      { num: '01', title: 'Revestimento Hidrofóbico', desc: 'Repele água. Lavagem fácil.', icon: ICON.repelencia },
      { num: '02', title: 'TPU Técnico 175μ',         desc: 'Não resseca. Não trinca.',    icon: ICON.escudoVazio },
      { num: '03', title: 'Regeneração Térmica',      desc: 'Auto-cura leve solar.',       icon: ICON.regeneracao },
      { num: '04', title: 'Adesivo Acrílico',         desc: 'Curvas complexas.',           icon: ICON.presente }
    ],
    finishes: {
      tagline: 'Versatilidade real. Estética sem compromisso.',
      items: [
        {
          name: 'CLEAR GLOSS',
          anchor: 'A cor original, potencializada.',
          desc: 'Transparente brilhante que realça a pintura de fábrica.',
          image: '/assets/images/flow_clear_gloss_haval.png',
          swatch: '#EAEAEE'
        },
        {
          name: 'CLEAR MATTE',
          anchor: 'O fosco que suaviza sem apagar.',
          desc: 'Acetinado macio, aveludado. Pintura mais contida.',
          image: '/assets/images/flow_clear_matte_haval.png',
          swatch: '#AAAAAE'
        },
        {
          name: 'BLACK GLOSS',
          anchor: 'O Black Piano por um valor justo.',
          desc: 'Preto espelhado com máximo escurecimento.',
          image: '/assets/images/flow_black_gloss_haval.png',
          swatch: '#0A0A0A'
        },
        {
          name: 'BLACK MATTE',
          anchor: 'Presença furtiva. Intenção clara.',
          desc: 'Preto fosco profundo, absorção de luz dramática.',
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
    subtitle: 'Híbrido 80/20 · 175µ · 3 anos',
    sectionTitle: 'O Mercado Exigia Preço. Nós Entregamos Engenharia.',
    bodyParagraphs: [
      'Híbrido 80/20 TPU+PVC. Proteção real contra pedras. Preço que cabe no planejamento.',
      'Engenharia híbrida não é compromisso — é decisão de design. Performance que entrega o que o mundo do dia a dia pede.'
    ],
    closingTagline: 'ENGENHARIA ACESSÍVEL',
    closingLine: 'O orçamento muda. A engenharia não.',
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
      { num: '01', title: 'Híbrido 80/20',     desc: '80% TPU + 20% PVC.',         icon: ICON.escudoBraco },
      { num: '02', title: 'Espessura 175μ',    desc: 'Absorve impacto.',           icon: ICON.escudoVazio },
      { num: '03', title: 'Adesivo Easy-Tack', desc: 'Reposicionável. Sem agredir.', icon: ICON.presente },
      { num: '04', title: 'Top Coat Premium',  desc: 'Hidrofóbico contra ácidos.', icon: ICON.camada }
    ],
    finishes: {
      tagline: 'Engenharia híbrida. Estilo sem exceção.',
      items: [
        {
          name: 'CORE GLOSS',
          anchor: 'Brilho honesto. Proteção inteligente.',
          desc: 'Espelhado que corrige orange-peel e devolve brilho.',
          image: '/assets/images/core_clear_gloss.png',
          swatch: '#E8E8EC'
        },
        {
          name: 'CORE MATTE',
          anchor: 'Fosco bruto. Estética com atitude.',
          desc: 'Acetinado bruto, difusão macia. Discrição com personalidade.',
          image: '/assets/images/core_clear_matte.png',
          swatch: '#8E9092'
        },
        {
          name: 'CORE BLACK',
          anchor: 'Preto puro. Reflexo de fibra envernizada.',
          desc: 'Opaco reflexivo com aparência de carbono envernizado.',
          image: '/assets/images/core_black_gloss.png',
          swatch: '#0A0A0A'
        },
        {
          name: 'CORE BLACK MATTE',
          anchor: 'Dark Stealth. Absorção implacável.',
          desc: 'Preto fosco profundo, opacidade dramática.',
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
    subtitle: 'Pigmentado Anti-UV 150µ · 10 anos',
    sectionTitle: 'Detalhes Definem o Conjunto',
    bodyParagraphs: [
      'Pigmentação anti-UV. Três tonalidades sem comprometer luminosidade nem segurança.',
      '10 anos de proteção contra amarelamento, ataque solar e perda óptica. O farol é o detalhe que define o conjunto.'
    ],
    closingTagline: 'DETALHE QUE DEFINE',
    closingLine: 'O farol é a primeira coisa que se vê. E a primeira que se julga.',
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
      { num: '01', title: 'Top Coat Anti-UV',      desc: 'Anti-amarelamento.',     icon: ICON.camada },
      { num: '02', title: 'Pigmentação Calibrada', desc: 'Preserva luminosidade.', icon: ICON.certo },
      { num: '03', title: 'TPU Estabilizado',      desc: 'Flexível. Nunca amarela.', icon: ICON.escudoVazio },
      { num: '04', title: 'Adesivo PSA',           desc: 'Remoção sem marcar.',    icon: ICON.presente }
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
          desc: 'Escurecimento sutil que integra o farol ao conjunto.',
          image: '/assets/images/nzppf_headlight_light_black.png',
          swatch: '#3A3A3C'
        },
        {
          name: 'LIGHT GRAY',
          anchor: 'O grafite que quase não se vê.',
          desc: 'Tom neutro e refinado. Quase imperceptível em dia claro.',
          image: '/assets/images/nzppf_headlight_light_gray.png',
          swatch: '#5E5E62'
        },
        {
          name: 'DARK BLACK',
          anchor: 'Presença máxima. Impacto visual total.',
          desc: 'Fumê escuro profundo, o tom mais agressivo da linha.',
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
    subtitle: 'TPU 190µ · ADAS · 2 anos',
    sectionTitle: 'A Maior Superfície de Vidro Também é a Mais Exposta',
    bodyParagraphs: [
      '190µ TPU na face externa. Absorve impacto invisível para você, letal para a pedra.',
      'Compatível com ADAS, transparência óptica preservada, repelência hidrofóbica permanente. A maior superfície do carro merece a mesma seriedade do resto.'
    ],
    closingTagline: 'PROTEÇÃO DA SUPERFÍCIE MAIS EXPOSTA',
    closingLine: 'A pedra não negocia. O parabrisa também não.',
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
      { num: '01', title: 'TPU 190μ',             desc: 'Camada anti-impacto.',   icon: ICON.escudoBraco },
      { num: '02', title: 'Top Coat Hidrofóbico', desc: 'Repele água. Bloqueia UV.', icon: ICON.repelencia },
      { num: '03', title: 'Transparência Óptica', desc: 'Zero distorção. ADAS.',   icon: ICON.certo },
      { num: '04', title: 'Adesivo Face Externa', desc: 'Resiste a lavagens.',     icon: ICON.presente }
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
    highlight: 'Híbrido 80/20. Durabilidade na entrada.'
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
    highlight: 'TPU técnico hidrofóbico com regeneração.'
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
    highlight: 'TPU Virgem + Nano-Dúplex. Padrão premium.'
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
    highlight: 'Alifático + Nano-Japonês. Excelência absoluta.'
  }
];

export const benchmarkLines: BenchmarkLine[] = deepSanitize(rawBenchmarkLines);

const rawExclusiveDifferentials = [
  {
    icon: '/assets/simbolos/simbolo-camada.svg',
    title: 'Top Coat Aprovado',
    line: '5 LINHAS PREMIUM',
    desc: 'Camada nano com proteção UV e repelência hidrofóbica.'
  },
  {
    icon: '/assets/simbolos/simbolo-certo.svg',
    title: 'Pigmentação Calibrada',
    line: 'EXCLUSIVO HEADLIGHT',
    desc: 'Três tonalidades testadas em laboratório, sem perder luminosidade.'
  },
  {
    icon: '/assets/simbolos/simbolo-escudo-vazio.svg',
    title: 'TPU Estabilizado',
    line: '5 LINHAS PREMIUM',
    desc: 'Polímero alifático estabilizado contra UV. No Core, vem do blend 80/20.'
  },
  {
    icon: '/assets/simbolos/simbolo-regeneracao.svg',
    title: 'Adesivo PSA',
    line: 'TODAS AS 6 LINHAS',
    desc: 'Reposicionamento na aplicação, remoção sem resíduos.'
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
  company: 'NZGROUP',
  // URLs aprofundadas — referenciadas pelos QRs editoriais (manifesto,
  // comparativo, diferenciais). Páginas no site espelham o conteúdo
  // que foi cortado do catálogo impresso para caber em 12 pt.
  manifestUrl: 'https://www.nzgroup.com.br/manifesto',
  benchmarkUrl: 'https://www.nzgroup.com.br/comparativo',
  differentialsUrl: 'https://www.nzgroup.com.br/diferenciais',
};

export function productUrl(slug: string): string {
  return `${catalogMeta.baseUrl}${catalogMeta.ppfPath}/${slug}`;
}

// Catálogo único de 20 páginas (cover + manifesto + lines + 6 produtos
// + 5 finishes + benchmark + diff + guarantee + closing + backcover +
// ceoletter). O modo "standard" de 15 páginas foi descontinuado —
// manter dois layouts gerava divergência editorial sem benefício real.
export const TOTAL_PAGES = 20;
