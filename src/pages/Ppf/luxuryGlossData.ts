// Fonte unica do conteudo da linha NZPPF Luxury Gloss.
//
// Consumido pela pagina /ppf/luxury-gloss E pelo portfolio em PDF, via
// ppfPortfolioRegistry.ts. Mudar aqui reflete nos dois — nao duplicar.

// Icons
export const CamadaIcon = "/assets/simbolos/simbolo-camada.svg";
export const CertoIcon = "/assets/simbolos/simbolo-certo.svg";
export const EscudoVazioIcon = "/assets/simbolos/simbolo-escudo-vazio.svg";
export const RegeneracaoIcon = "/assets/simbolos/simbolo-regeneracao.svg";
export const RepelenciaIcon = "/assets/simbolos/simbolo-repelencia.svg";
export const PresenteIcon = "/assets/simbolos/simbolo-presente.svg";

export const tabelaTecnica = [
  { icon: CamadaIcon, info: 'Espessura Total (Premium)', spec: '190 Micras (7.5 mil)', detalhe: 'Camada robusta dimensionada para máxima dissipação de impacto.' },
  { icon: EscudoVazioIcon, info: 'Material Base (Core)', spec: '100% TPU Alifático Premium', detalhe: 'Poliuretano automotivo com estabilização anti-UV (não amarela).' },
  { icon: CamadaIcon, info: 'Arquitetura do Filme', spec: 'Coextrusão em 4 Camadas', detalhe: 'Liner Protetor, Adesivo PSA, Core TPU e Top Coat.' },
  { icon: RepelenciaIcon, info: 'Top Coat (Superfície)', spec: 'Nano-Revestimento Japonês', detalhe: 'Propriedades hidrofóbicas extremas e auto-cura térmica.' },
  { icon: CertoIcon, info: 'Tecnologia de Adesivo', spec: 'Acrílico PSA Reposicionável', detalhe: 'Instalação limpa e remoção segura a longo prazo (Zero Resíduos).' },
  { icon: RegeneracaoIcon, info: 'Garantia de Fábrica', spec: '12 Anos Certificados', detalhe: 'Respaldo contra amarelamento, delaminação e perda de adesão.' }
];

export const benchmarkData = [
  { metric: 'Retenção de Brilho (Gloss Units)', desc: 'Medição em laboratório simulando lavagens e intempéries', nz: [99.5, 97.2, 98.8, 94.6, 95.5], mercado: [95.0, 86.5, 82.0, 71.5, 62.0] },
  { metric: 'Resistência a Impactos (Impact Absorption)', desc: 'Absorção de energia cinética superficial', nz: [98.8, 97.5, 98.0, 94.2, 93.5], mercado: [92.0, 81.0, 76.5, 65.0, 51.5] },
  { metric: 'Regeneração Térmica (Self-Healing)', desc: 'Capacidade de auto-cura de micro-riscos', nz: [99.0, 99.5, 96.8, 95.5, 93.0], mercado: [96.5, 84.0, 68.5, 52.0, 32.5] },
  { metric: 'Nível de Repelência (Beading Angle)', desc: 'Efeito hidrofóbico e facilidade de limpeza', nz: [98.5, 95.2, 96.0, 91.5, 89.8], mercado: [94.0, 81.5, 66.0, 52.5, 38.0] }
];

export const diferenciais = [
  { icon: RegeneracaoIcon, title: 'Regeneração Térmica', desc: 'Micro-riscos desaparecem sozinhos com o calor do sol. Tecnologia de auto-cura inteligente.', accent: 'Auto-cura com calor', image: '/assets/images/nzppf_regeneracao.png' },
  { icon: RepelenciaIcon, title: 'Mega Repelência', desc: '30% mais repelente que o padrão de mercado. Água, poeira e sujeira deslizam pela superfície.', accent: 'Proteção contra sujeira', image: '/assets/images/nzppf_repelencia.png' },
  { icon: CertoIcon, title: 'Super Brilho +32%', desc: 'Nano-Revestimento japonês que potencializa o brilho original da pintura em até 32%.', accent: '+32% de Brilho', image: '/assets/images/nzppf_super_brilho.png' },
  { icon: EscudoVazioIcon, title: 'Blindagem Total', desc: 'TPU Alifático de 190 micras protege contra riscos, impactos, oxidação e detritos da estrada.', accent: '12 Anos de Garantia', image: '/assets/images/nzppf_premium_layers_tpu.png' }
];

export const finishesCarousel = [
  { src: '/assets/images/nzppf_super_brilho.png', title: 'GLOSS', sub: 'Brilho espelhado vitrificado' },
  { src: '/assets/images/nzppf_matte.png', title: 'MATTE', sub: 'Toque suave aveludado' },
  { src: '/assets/images/nzppf_black.png', title: 'BLACK', sub: 'Luxo absoluto profundo' }
];
