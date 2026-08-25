// Fonte unica do conteudo da linha NZ PPF Headlight.
//
// Consumido pela pagina /ppf/headlight E pelo portfolio em PDF, via
// ppfPortfolioRegistry.ts. Mudar aqui reflete nos dois — nao duplicar.

// Icons
export const CamadaIcon = "/assets/simbolos/simbolo-camada.svg";
export const CertoIcon = "/assets/simbolos/simbolo-certo.svg";
export const EscudoVazioIcon = "/assets/simbolos/simbolo-escudo-vazio.svg";
export const RegeneracaoIcon = "/assets/simbolos/simbolo-regeneracao.svg";
export const RepelenciaIcon = "/assets/simbolos/simbolo-repelencia.svg";
export const PresenteIcon = "/assets/simbolos/simbolo-presente.svg";

export const tabelaTecnica = [
  { icon: CamadaIcon, info: 'Espessura Total', spec: '150 Micras', detalhe: 'Dimensionada para proteção de lente sem distorção óptica.' },
  { icon: EscudoVazioIcon, info: 'Material Base', spec: 'TPU Pigmentado Anti-UV', detalhe: 'Poliuretano automotivo com estabilização contra amarelamento.' },
  { icon: CamadaIcon, info: 'Arquitetura', spec: 'Multicamada Coextrudada', detalhe: 'Top coat + camada pigmentada + core TPU + adesivo PSA.' },
  { icon: RepelenciaIcon, info: 'Top Coat', spec: 'Hidrofóbico Anti-UV', detalhe: 'Barreira contra intempéries, chuva ácida e radiação solar.' },
  { icon: CertoIcon, info: 'Adesivo', spec: 'PSA Reposicionável', detalhe: 'Instalação limpa e remoção sem resíduos na lente.' },
  { icon: RegeneracaoIcon, info: 'Garantia de Fábrica', spec: '10 Anos Certificados', detalhe: 'Respaldo contra amarelamento, delaminação e perda de adesão.' }
];

export const benchmarkData = [
  { metric: 'Retenção de Transparência', desc: 'Medição da clareza óptica ao longo do tempo', nz: [99.2, 97.8, 96.4, 93.8, 91.0], mercado: [94.5, 85.0, 74.0, 60.0, 45.0] },
  { metric: 'Resistência ao Amarelamento', desc: 'Estabilidade UV em exposição solar contínua', nz: [99.5, 98.2, 96.8, 94.0, 90.5], mercado: [93.0, 78.0, 62.0, 44.0, 28.0] },
  { metric: 'Estabilidade Cromática da Pigmentação', desc: 'Uniformidade do tom fumê ao longo dos anos', nz: [99.0, 97.0, 95.5, 92.8, 89.2], mercado: [92.5, 80.0, 66.0, 50.0, 35.0] }
];

export const diferenciais = [
  { icon: EscudoVazioIcon, title: 'Proteção Real', desc: 'TPU com estabilização UV protege a lente contra pedriscos, amarelamento e oxidação.', accent: '10 Anos de Garantia', image: '/assets/images/nzppf_headlight_diff_protecao.png' },
  { icon: CertoIcon, title: 'Estética Sob Medida', desc: 'Três tonalidades exclusivas para integrar o farol ao conjunto visual do veículo sem exageros.', accent: '3 Tonalidades', image: '/assets/images/nzppf_headlight_diff_estetica.png' },
  { icon: RegeneracaoIcon, title: 'Luminosidade Preservada', desc: 'Pigmentação calibrada para não comprometer a segurança noturna nem a emissão luminosa homologada.', accent: 'Segurança Mantida', image: '/assets/images/nzppf_headlight_diff_luminosidade.png' },
  { icon: RepelenciaIcon, title: 'Resistência Real', desc: 'Imune ao amarelamento e às intempéries. Validado em condições reais de uso diário.', accent: 'Anti-UV Certificado', image: '/assets/images/nzppf_headlight_diff_resistencia.png' }
];

export const tonalidades = [
  { src: '/assets/images/nzppf_headlight_light_black.png', title: 'LIGHT BLACK', sub: 'Escurecimento sutil. Sofisticação sem exagero.' },
  { src: '/assets/images/nzppf_headlight_light_gray.png', title: 'LIGHT GRAY', sub: 'Tom neutro e refinado. Grafite quase imperceptível.' },
  { src: '/assets/images/nzppf_headlight_dark_black.png', title: 'DARK BLACK', sub: 'Presença máxima. Fumê escuro de impacto visual.' }
];
