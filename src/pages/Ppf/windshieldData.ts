// Fonte unica do conteudo da linha NZ PPF Windshield.
//
// Consumido pela pagina /ppf/windshield E pelo portfolio em PDF, via
// ppfPortfolioRegistry.ts. Mudar aqui reflete nos dois — nao duplicar.

// Icons
export const CamadaIcon = "/assets/simbolos/simbolo-camada.svg";
export const CertoIcon = "/assets/simbolos/simbolo-certo.svg";
export const EscudoVazioIcon = "/assets/simbolos/simbolo-escudo-vazio.svg";
export const RegeneracaoIcon = "/assets/simbolos/simbolo-regeneracao.svg";
export const RepelenciaIcon = "/assets/simbolos/simbolo-repelencia.svg";
export const PresenteIcon = "/assets/simbolos/simbolo-presente.svg";

export const tabelaTecnica = [
  { icon: CamadaIcon, info: 'Espessura Total', spec: '190 Micras (7.5 mil)', detalhe: 'Camada robusta dimensionada para absorção de impacto em parabrisa.' },
  { icon: EscudoVazioIcon, info: 'Material Base', spec: 'TPU de Alta Performance', detalhe: 'Poliuretano automotivo com estabilização UV para uso externo.' },
  { icon: CamadaIcon, info: 'Arquitetura', spec: 'Coextrusão Multicamada', detalhe: 'Liner, adesivo PSA, core TPU 190 µ e top coat anti-UV.' },
  { icon: RepelenciaIcon, info: 'Top Coat', spec: 'Hidrofóbico Anti-UV', detalhe: 'Repelência de água e barreira contra radiação solar.' },
  { icon: CertoIcon, info: 'Aplicação', spec: 'Face Externa do Parabrisa', detalhe: 'Compatibilidade total com sensores ADAS e câmeras de assistência.' },
  { icon: RegeneracaoIcon, info: 'Garantia de Fábrica', spec: '2 Anos Certificados', detalhe: 'Respaldo contra delaminação, amarelamento e perda de adesão.' }
];

export const benchmarkData = [
  { metric: 'Transparência Óptica', desc: 'Clareza visual e ausência de distorção', nz: [99.5, 99.2, 98.8], mercado: [96.0, 91.0, 85.0] },
  { metric: 'Absorção de Impacto', desc: 'Energia cinética dissipada pela película (vs vidro nu)', nz: [99.0, 97.5, 95.0], mercado: [82.0, 70.0, 58.0] },
  { metric: 'Resistência UV', desc: 'Estabilidade química sob radiação solar contínua', nz: [99.2, 97.8, 95.5], mercado: [94.0, 82.0, 68.0] }
];

export const diferenciais = [
  { icon: EscudoVazioIcon, title: 'Absorção de Impacto', desc: 'Pedras que antes trincariam o vidro são absorvidas e dissipadas pela película. A superfície permanece intacta.', accent: 'TPU 190μ', image: '/assets/images/nzppf_windshield_diff_impacto.png' },
  { icon: CertoIcon, title: 'Preserva o Vidro Original', desc: 'Evita a troca do parabrisa e mantém a vedação de fábrica — algo que nunca se recupera após substituição.', accent: 'Integridade Estrutural', image: '/assets/images/nzppf_windshield_diff_preservacao.png' },
  { icon: CamadaIcon, title: 'Compatível com ADAS', desc: 'Transparência óptica total. Nenhuma interferência em sensores, câmeras ou sistemas de assistência à condução.', accent: 'Zero Distorção', image: '/assets/images/nzppf_windshield_diff_adas.png' },
  { icon: RepelenciaIcon, title: 'Resistência Real', desc: 'Resistência a abrasão, intempéries e radiação UV em condições de uso intenso, em rodovia e cidade.', accent: '2 Anos de Garantia', image: '/assets/images/nzppf_windshield_diff_resistencia.png' }
];
