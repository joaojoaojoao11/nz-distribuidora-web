// Fonte unica do conteudo da linha NZPPF Core Gloss.
//
// Consumido pela pagina /ppf/core-gloss E pelo portfolio em PDF, via
// ppfPortfolioRegistry.ts. Mudar aqui reflete nos dois — nao duplicar.

// Icons (reusing system generic icons)
export const CamadaIcon = "/assets/simbolos/simbolo-camada.svg";
export const CertoIcon = "/assets/simbolos/simbolo-certo.svg";
export const EscudoVazioIcon = "/assets/simbolos/simbolo-escudo-vazio.svg";
export const RegeneracaoIcon = "/assets/simbolos/simbolo-regeneracao.svg";
export const RepelenciaIcon = "/assets/simbolos/simbolo-repelencia.svg";
export const PresenteIcon = "/assets/simbolos/simbolo-presente.svg";

export const coreColor = '#4A7C59'; // Tactical Green

export const tabelaTecnica = [
  { icon: CamadaIcon, info: 'Espessura Média', spec: '150-180 Micras', detalhe: 'Garante resistência essencial contra pedriscos.' },
  { icon: EscudoVazioIcon, info: 'Engenharia de Base', spec: '80% TPU + 20% PVC', detalhe: 'O Híbrido Inteligente perfeito para Custo-Benefício.' },
  { icon: CamadaIcon, info: 'Estruturação', spec: 'Multicamadas', detalhe: 'Projetada para não rasgar no tensionamento grave.' },
  { icon: RepelenciaIcon, info: 'Top Coating', spec: 'Proteção Acelerada', detalhe: 'Camada de fechamento superior com repelência hidrofóbica.' },
  { icon: CertoIcon, info: 'Cola (Adesivo)', spec: 'Easy-Tack Reposicionável', detalhe: 'Garante zero marcas de tração e flexibilidade ao aplicador.' },
  { icon: RegeneracaoIcon, info: 'Garantia Comprovada', spec: '3 Anos', detalhe: 'Certificação formal da fábrica para blindar a sua loja.' }
];

export const benchmarkData = [
  { metric: 'Facilidade de Aplicação', desc: 'Desempenho sob estiramento e re-posicionamento', nz: [95, 88, 80], mercado: [80, 65, 50] },
  { metric: 'Relação Custo vs Durabilidade', desc: 'A matemática da margem', nz: [96, 90, 85], mercado: [70, 60, 50] },
  { metric: 'Barreira Hidrofóbica', desc: 'Resistência a chuvas', nz: [87, 80, 74], mercado: [80, 60, 40] },
  { metric: 'Manutenção do Brilho (Meses)', desc: 'Previsibilidade do brilho (Top Coat)', nz: [90, 84, 80], mercado: [75, 60, 55] }
];

export const diferenciais = [
  { icon: CertoIcon, title: 'Matemática da Oficina', desc: 'Com o custo de um PVC premium e qualidade de um TPU avançado, seu markup dobra na instalação sem retorno pra garantia.', accent: '80% TPU / 20% PVC', image: '/assets/images/core_catalog_car.png' },
  { icon: RepelenciaIcon, title: 'Coating Super Premium', desc: 'O cliente final exige repelência, água rolando do capô e sujeira indo embora rápido. O Top Coat do Core entrega exatamente isso.', accent: 'Hidrofobia', image: '/assets/images/core_water.png' },
  { icon: CamadaIcon, title: 'Adesivo Tolerante (Easy-Tack)', desc: 'A cola não agride a pintura no tracionamento e não trava em excesso no capô. O instalador ganha horas no fim da semana.', accent: 'Instalação Ágil', image: '/assets/images/core_clear_gloss.png' },
  { icon: EscudoVazioIcon, title: 'Garantia Blindada de 3 Anos', desc: 'Você vende o serviço de olhos fechados. Uma garantia de entrada que destrói a vida útil da maoria dos vinis TPH do mercado.', accent: 'Segurança Financeira', image: '/assets/images/core_hero.png' }
];

export const finishesData = [
  { src: '/assets/images/core_clear_gloss.png', title: 'Core Gloss', sub: 'O clássico inquestionável. Brilho espelhado, correção de orange-peel e proteção transparente e absoluta contra arranhões do tempo.', tech: 'Blend TPU/PVC Brilho' },
  { src: '/assets/images/core_clear_matte.png', title: 'Core Matte', sub: 'Fosco acetinado bruto. Transforma o aspecto do carro com uma difusão macia e furtiva.', tech: 'Blend TPU/PVC Fosco' },
  { src: '/assets/images/core_black_gloss.png', title: 'Core Black', sub: 'Preto puro absoluto refletivo. Bloqueia a luz original da carroceria entregando visual de fibra envernizada.', tech: 'Blend Black Pigmentado' },
  { src: '/assets/images/core_black_matte.png', title: 'Core Black Matte', sub: 'Dark Stealth. O topo da agressividade visual na linha Core com absorção opaca implacável.', tech: 'Blend Black Matte' }
];
