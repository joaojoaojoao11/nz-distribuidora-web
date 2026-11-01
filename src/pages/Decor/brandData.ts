export type Brand = {
  slug: 'sh' | 'etherna' | 'imprimax';
  name: string;
  origin: string;
  tagline: string;
  description: string;
  badges: string[];
  logo: string;
  /** Logo horizontal e comprido: aparece mais baixo para não cobrir a foto. */
  logoLargo?: boolean;
  image: string;
  officialSite: string;
  catalogPath?: string;
};

export const decorBrands: Brand[] = [
  {
    slug: 'sh',
    name: 'SH DECOR',
    origin: 'Sign House · Distribuidor Orafol Brasil desde 2005',
    tagline: 'Curadoria ampla. Padrão internacional.',
    description: 'Linha decorativa da Sign House, distribuidora referência da Orafol Alemanha no Brasil há mais de 20 anos. Portfólio organizado em famílias temáticas: madeira, pedra, cimento, metal, tecido, couro, tijolo, sólidos. Textura tátil realista, tecnologia Bubble Free, exclusivo uso interno.',
    badges: ['TEXTURA TÁTIL REALISTA', 'BUBBLE FREE', 'USO INTERNO', 'LAVÁVEL · ATÓXICO'],
    logo: '/assets/logos/nzdecor/logo-sh-decor-branco.svg',
    image: '/assets/images/decor/decor_sh_card.jpg',
    officialSite: 'https://www.shdecorbrasil.com.br',
    catalogPath: '/decor/sh',
  },
  {
    slug: 'etherna',
    name: 'ETHERNA DECOR',
    origin: 'Indústria Etherna · São Paulo · desde 1984',
    tagline: 'Nacional. Tecnologia Shield®. Entrega em 48h.',
    description: 'Indústria brasileira de laminados plásticos com 40+ anos de mercado. Em 2024 lançou a linha Decor com tecnologia Shield® — antifúngico, antibacteriano, resistente a chamas. Frontal 160 micras dupla camada. Mais de 150 padrões ativos em 8 famílias. Rolo padrão 1,22m × 25m. Fábrica em SP dispensa importação.',
    badges: ['INDÚSTRIA NACIONAL', 'TECNOLOGIA SHIELD®', '160μ DUPLA CAMADA', 'ENTREGA 48H', 'ANTIFÚNGICO · ANTIBACTERIANO'],
    logo: '/assets/logos/nzdecor/logo-etherna.webp',
    image: '/assets/images/decor/decor_etherna_card.webp',
    officialSite: 'https://ethernaprodutos.com.br',
    catalogPath: '/decor/etherna',
  },
  {
    slug: 'imprimax',
    name: 'IMPRIMAX DECORMAX',
    origin: 'Imprimax · Indústria nacional de adesivos',
    tagline: 'Nacional. Madeiras, mármores e fórmicas com textura realista.',
    description: 'Linha DecorMax Gold da Imprimax, indústria brasileira de vinil adesivo. Frontal em PVC polimérico calandrado com adesivo acrílico permanente. Antimofo, antibacteriano e não propaga fogo. Durabilidade de 8 anos em interiores. Mais de 120 padrões em madeiras, pedras, fórmicas, tecidos, couros e piso vinílico. Rolo 1,22 m × 25 m.',
    badges: ['INDÚSTRIA NACIONAL', 'ANTIMOFO · ANTIBACTERIANO', 'NÃO PROPAGA FOGO', '8 ANOS INTERNO'],
    logo: '/assets/logos/nzdecor/logo-imprimax-branco.webp',
    logoLargo: true,
    image: '/assets/images/decor/decor_imprimax_card.webp',
    officialSite: 'https://www.imprimax.com.br/decormax',
    catalogPath: '/decor/imprimax',
  },
];
