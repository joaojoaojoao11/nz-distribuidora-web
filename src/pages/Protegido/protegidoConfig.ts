// Conteúdo da página /s ("veículo protegido"), que abre pelo QR do selo NZPPF
// colado no batente da porta (22/10/2026). O QR é o mesmo em todos os selos.
//
// Anos de garantia e frases das linhas: as páginas /ppf/<linha> são a fonte.
// Cores das linhas: as mesmas das peças da marca (Luxury dourado, Prime azul,
// Flow vermelho, Core verde). Fotos: carros reais sem marca da galeria da loja.

export interface LinhaProtegido {
  slug: string;
  nome: string;
  /** Primeira palavra do nome, usada no botão ("Conhecer a Luxury"). */
  curto: string;
  anos: number;
  frase: string;
  detalhe: string;
  cor: string;
  foto: string;
}

const FOTO = '/assets/images/protegido';

export const LINHAS_PINTURA: LinhaProtegido[] = [
  {
    slug: 'luxury-gloss',
    nome: 'Luxury Gloss',
    curto: 'Luxury',
    anos: 12,
    frase: 'A excelência absoluta.',
    detalhe: 'Nanotecnologia japonesa e até 32% mais brilho.',
    cor: '#D4AF37',
    foto: `${FOTO}/linha-luxury.webp`,
  },
  {
    slug: 'prime-gloss',
    nome: 'Prime Gloss',
    curto: 'Prime',
    anos: 10,
    frase: 'O padrão de qualidade.',
    detalhe: 'TPU 100% virgem com revestimento nano-dúplex.',
    cor: '#4A90D9',
    foto: `${FOTO}/linha-prime.webp`,
  },
  {
    slug: 'flow-gloss',
    nome: 'Flow Gloss',
    curto: 'Flow',
    anos: 7,
    frase: 'Performance G2.',
    detalhe: 'TPU técnico G2 com top coat nano-hidrofóbico.',
    cor: '#E0322B',
    foto: `${FOTO}/linha-flow.webp`,
  },
  {
    slug: 'core-gloss',
    nome: 'Core Gloss',
    curto: 'Core',
    anos: 4,
    frase: 'Proteção inteligente.',
    detalhe: 'O melhor custo-benefício, sem abrir mão da proteção.',
    cor: '#5E9C70',
    foto: `${FOTO}/linha-core.webp`,
  },
];

export const LINHAS_EXTRAS: LinhaProtegido[] = [
  {
    slug: 'headlight',
    nome: 'Headlight',
    curto: 'Headlight',
    anos: 10,
    frase: 'Faróis protegidos e personalizados.',
    detalhe: 'Tons exclusivos sem perder luminosidade.',
    cor: '#a1a1a6',
    foto: `${FOTO}/linha-headlight.webp`,
  },
  {
    slug: 'windshield',
    nome: 'Windshield',
    curto: 'Windshield',
    anos: 2,
    frase: 'Para-brisa protegido contra pedras.',
    detalhe: 'Compatível com sensores e câmeras (ADAS).',
    cor: '#a1a1a6',
    foto: `${FOTO}/linha-windshield.webp`,
  },
];

/** Manifesto: as palavras acendem na rolagem. `*palavra*` = destaque. */
export const MANIFESTO =
  'Tem carro bonito e tem carro *protegido.* O bonito dura até a primeira pedra da estrada. ' +
  'O protegido tem uma camada *invisível* que recebe o impacto no lugar da pintura, deixa a chuva escorrer sem marcar ' +
  'e faz os micro-riscos sumirem com o calor. Quem colou este selo aqui não deixou *nada* *ao* *acaso.*';

export const PODERES = [
  { id: 'regenera', titulo: 'Se regenera.', texto: 'Micro-riscos do dia a dia somem com o calor do sol.' },
  { id: 'agua', titulo: 'A água não fica.', texto: 'O top coat hidrofóbico faz a chuva escorrer e levar a sujeira junto.' },
  { id: 'impacto', titulo: 'A pedra bate nele, não na pintura.', texto: 'O corpo do PPF absorve o impacto de pedriscos e detritos da estrada.' },
  { id: 'uv', titulo: 'O brilho continua.', texto: 'Proteção contra os raios UV: a pintura não desbota e mantém a profundidade.' },
] as const;

export const CAMADAS = [
  { titulo: 'Top coat', texto: 'Regenera micro-riscos e repele a água.' },
  { titulo: 'Corpo do PPF', texto: 'Até 190 micras que absorvem o impacto.' },
  { titulo: 'Adesivo', texto: 'Mantém o PPF firme na pintura, curva por curva.' },
  { titulo: 'Sua pintura', texto: 'Intacta, como saiu da fábrica.' },
];

// Mesmos cuidados do registro da garantia (registro/Cuidados.tsx, PPF), mais curtos.
export const CUIDADOS = [
  { titulo: 'Os primeiros 7 dias', texto: 'Não lave o carro na primeira semana. Pequenas bolhas de água nesse período são normais e somem sozinhas com o sol.' },
  { titulo: 'Lavagem', texto: 'Use shampoo neutro e evite água de reuso: ela traz partículas que riscam como lixa.' },
  { titulo: 'Alta pressão', texto: 'Mantenha o jato a mais de 50 cm e longe das bordas do PPF.' },
  { titulo: 'Resíduos orgânicos', texto: 'Tire seiva, insetos e fezes de pássaros o quanto antes: são ácidos e mancham se ficarem no sol.' },
];
