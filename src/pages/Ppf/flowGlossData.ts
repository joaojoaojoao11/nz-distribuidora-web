// Fonte única do conteúdo da linha NZPPF Flow Gloss (formulação G2, 185μ).
// Consumido pela página /ppf/flow-gloss E pelo portfólio em PDF
// (FlowPortfolioDocument.tsx) — mudar aqui reflete nos dois. Não duplicar.

export const FLOW_ICONS = {
  camada: '/assets/simbolos/simbolo-camada.svg',
  certo: '/assets/simbolos/simbolo-certo.svg',
  escudoVazio: '/assets/simbolos/simbolo-escudo-vazio.svg',
  regeneracao: '/assets/simbolos/simbolo-regeneracao.svg',
  repelencia: '/assets/simbolos/simbolo-repelencia.svg',
  presente: '/assets/simbolos/simbolo-presente.svg',
} as const;

export interface TabelaTecnicaRow {
  icon: string;
  info: string;
  spec: string;
  detalhe: string;
}

export const tabelaTecnica: TabelaTecnicaRow[] = [
  { icon: FLOW_ICONS.camada, info: 'Espessura Total', spec: '185 Micras', detalhe: 'Dez micras a mais que a geração anterior.' },
  { icon: FLOW_ICONS.escudoVazio, info: 'Material Base (Core)', spec: 'TPU Técnico G2', detalhe: 'Nova geração: mais estável sob UV que a formulação anterior.' },
  { icon: FLOW_ICONS.camada, info: 'Arquitetura', spec: 'Multicamada Reformulada', detalhe: 'Ganho em duas frentes: nova química e corpo extra do filme.' },
  { icon: FLOW_ICONS.repelencia, info: 'Top Coating', spec: 'Nano-Hidrofóbico G2', detalhe: 'Repelência reforçada e auto-cura mais rápida.' },
  { icon: FLOW_ICONS.certo, info: 'Adesivo', spec: 'Alta Conformação', detalhe: 'Boa adaptação em curvas, fixação segura e remoção limpa.' },
  { icon: FLOW_ICONS.regeneracao, info: 'Garantia de Fábrica', spec: '7 Anos', detalhe: 'Prazo estendido pela nova formulação. Selo de Autenticidade NZPPF.' },
];

export interface BenchmarkMetric {
  metric: string;
  desc: string;
  nz: number[];
  mercado: number[];
}

/** Três pontos: Ano 1, Ano 4, Ano 7 (ver BENCHMARK_ANOS). */
export const benchmarkData: BenchmarkMetric[] = [
  { metric: 'Retenção de Brilho', desc: 'Medição de desgaste em lavagens', nz: [95, 90, 85], mercado: [90, 72, 55] },
  { metric: 'Resistência a Impactos', desc: 'Absorção de resíduos da via', nz: [92, 87, 82], mercado: [85, 68, 50] },
  { metric: 'Regeneração Térmica', desc: 'Capacidade de auto-cura', nz: [94, 88, 82], mercado: [88, 58, 32] },
  { metric: 'Nível de Repelência', desc: 'Efeito hidrofóbico diário', nz: [93, 87, 81], mercado: [86, 56, 30] },
];

export const BENCHMARK_ANOS = ['Ano 1', 'Ano 4', 'Ano 7'];

export interface Diferencial {
  icon: string;
  title: string;
  desc: string;
  accent: string;
  image: string;
}

export const diferenciais: Diferencial[] = [
  { icon: FLOW_ICONS.regeneracao, title: 'Regeneração Acelerada', desc: 'O novo top coat fecha micro riscos mais rápido e em uma faixa térmica mais ampla — não depende de sol forte.', accent: 'Auto-cura acelerada', image: '/assets/images/flow_heal_haval.png' },
  { icon: FLOW_ICONS.repelencia, title: 'Superfície Autolimpante', desc: 'Ângulo de contato maior na formulação G2: a água escorre levando a sujeira junto e a lavagem fica mais rápida.', accent: 'Hidrofobia reforçada', image: '/assets/images/flow_water_haval.png' },
  { icon: FLOW_ICONS.certo, title: 'Brilho que Não Cede', desc: 'Acabamento limpo, uniforme e profundo — e agora com retenção de brilho medida ao longo dos 7 anos de prazo.', accent: 'Brilho por 7 anos', image: '/assets/images/flow_brilho_haval.png' },
  { icon: FLOW_ICONS.escudoVazio, title: 'Durabilidade Estendida', desc: 'Proteção contra arranhões, oxidação e chuva ácida que agora dura até 7 anos sem amarelamento.', accent: 'Garantia de 7 Anos', image: '/assets/images/flow_durabilidade_xiaomi.png' },
];

export interface Finish {
  src: string;
  title: string;
  sub: string;
  tech: string;
  /** Sem estoque: exibe selo ESGOTADO na página e no portfólio. */
  soldOut?: boolean;
}

export const finishesData: Finish[] = [
  { src: '/assets/images/flow_clear_gloss_haval.png', title: 'Clear Gloss', sub: 'Transparente Brilho: conserva a cor original com espelhamento intenso — agora com o top coat G2, que segura o reflexo por mais tempo.', tech: 'TPU G2 185μ • Base Incolor' },
  { src: '/assets/images/flow_clear_matte_haval.png', title: 'Clear Matte', sub: 'Transparente Fosco: transforma a pintura original em um acetinado macio sob a luz, com a repelência reforçada da nova formulação.', tech: 'TPU G2 185μ • Micro Texturizado', soldOut: true },
  { src: '/assets/images/flow_black_gloss_haval.png', title: 'Black Gloss', sub: 'Opaco Brilho: Efeito Black Piano absoluto. Máximo escurecimento bloqueando a matriz de cor inferior.', tech: 'TPU G2 185μ • Base Pigmentada', soldOut: true },
  { src: '/assets/images/flow_black_matte_haval.png', title: 'Black Matte', sub: 'Opaco Fosco: Absorção de luz dramática. Aparência furtiva e agressiva.', tech: 'TPU G2 185μ • Base Negra Fosca', soldOut: true },
];

/** Camadas da arquitetura do filme (seção Tecnologia). */
export const camadas = [
  { name: 'Top Coat Nano-Hidrofóbico G2', desc: 'Camada nova: repele mais água e sujeira e acelera a auto-cura dos micro-riscos.' },
  { name: 'TPU Técnico G2 185μ (Core)', desc: 'Base de 2ª geração, agora dez micras mais espessa: mais absorção de impacto e mais estabilidade sob UV.' },
  { name: 'Adesivo Acrílico de Alta Conformação', desc: 'Aplicação amigável até nas geometrias mais complexas, com remoção limpa.' },
];

export const FLOW_SEO_DESCRIPTION =
  'Nova formulação G2: TPU técnico de 2ª geração com top coat nano-hidrofóbico, agora em 185μ. Mais corpo, mais proteção e 7 anos de garantia — a linha intermediária de performance da NZPPF.';
