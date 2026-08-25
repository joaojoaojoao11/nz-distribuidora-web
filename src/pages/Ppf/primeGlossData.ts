// Fonte unica do conteudo da linha NZPPF Prime Gloss.
//
// Consumido pela pagina /ppf/prime-gloss E pelo portfolio em PDF, via
// ppfPortfolioRegistry.ts. Mudar aqui reflete nos dois — nao duplicar.

// Icons
export const CamadaIcon = "/assets/simbolos/simbolo-camada.svg";
export const CertoIcon = "/assets/simbolos/simbolo-certo.svg";
export const EscudoVazioIcon = "/assets/simbolos/simbolo-escudo-vazio.svg";
export const RegeneracaoIcon = "/assets/simbolos/simbolo-regeneracao.svg";
export const RepelenciaIcon = "/assets/simbolos/simbolo-repelencia.svg";
export const PresenteIcon = "/assets/simbolos/simbolo-presente.svg";

export const tabelaTecnica = [
  { icon: CamadaIcon, info: 'Espessura Total', spec: '190 Micras (7.5 mil)', detalhe: 'Camada robusta dimensionada para proteção consistente.' },
  { icon: EscudoVazioIcon, info: 'Material Base (Core)', spec: 'TPU 100% Virgem', detalhe: 'Mais flexível e durável que PU/blends reciclados.' },
  { icon: CamadaIcon, info: 'Arquitetura do Filme', spec: 'Multicamada de Alta Performance', detalhe: 'Top Coat, TPU Core e Adesivo Flexível.' },
  { icon: RepelenciaIcon, info: 'Top Coat (Superfície)', spec: 'Hidrofóbico Nano-Dúplex', detalhe: 'Dupla camada de repelência e proteção de superfície.' },
  { icon: CertoIcon, info: 'Tecnologia de Adesivo', spec: 'Flexível Alta Conformação', detalhe: 'Perfeita adesão em curvas e detalhes complexos.' },
  { icon: RegeneracaoIcon, info: 'Garantia de Fábrica', spec: '10 Anos Certificados', detalhe: 'Contra amarelamento, trinca e descolamento.' }
];

export const benchmarkData = [
  { metric: 'Retenção de Brilho (Gloss Units)', desc: 'Medição em laboratório simulando lavagens e intempéries', nz: [96, 93, 91, 87, 83], mercado: [92, 82, 74, 62, 48] },
  { metric: 'Resistência a Impactos (Impact Absorption)', desc: 'Absorção de energia cinética superficial', nz: [95, 92, 90, 86, 82], mercado: [88, 76, 68, 55, 42] },
  { metric: 'Regeneração Térmica (Self-Healing)', desc: 'Capacidade de auto-cura de micro-riscos', nz: [96, 94, 89, 84, 78], mercado: [90, 75, 58, 40, 25] },
  { metric: 'Nível de Repelência (Beading Angle)', desc: 'Efeito hidrofóbico e facilidade de limpeza', nz: [95, 91, 87, 82, 76], mercado: [89, 74, 58, 43, 30] }
];

export const diferenciais = [
  { icon: RegeneracaoIcon, title: 'Regeneração Térmica', desc: 'Micro-riscos desaparecem com exposição ao calor. Tecnologia que o PU comum não oferece.', accent: 'Auto-cura inteligente', image: '/assets/images/nzppf_prime_regeneracao.png' },
  { icon: RepelenciaIcon, title: 'Repelência Hidrofóbica', desc: 'Revestimento nano-dúplex que repele água, poeira e sujeira. Limpeza facilitada no dia a dia.', accent: 'Nano-Dúplex', image: '/assets/images/nzppf_prime_repelencia.png' },
  { icon: CertoIcon, title: 'Brilho Intenso', desc: 'Acabamento uniforme e duradouro com alto realce visual. Potencializa a estética original da pintura.', accent: 'Alto Realce Visual', image: '/assets/images/nzppf_prime_brilho.png' },
  { icon: EscudoVazioIcon, title: 'Estabilidade Superior', desc: 'Sem encolhimento ou descolamento com o tempo. Alta conformação em curvas e detalhes do veículo.', accent: '10 Anos de Garantia', image: '/assets/images/nzppf_prime_estabilidade.png' }
];

export const finishesData = [
  { src: '/assets/images/nzppf_prime_brilho.png', title: 'GLOSS', sub: 'Brilho intenso e uniforme' },
  { src: '/assets/images/nzppf_prime_matte.jpg', title: 'MATTE', sub: 'Toque suave aveludado' },
  { src: '/assets/images/nzppf_prime_black.jpg', title: 'BLACK PIANO', sub: 'Profundidade absoluta espelhada' }
];
