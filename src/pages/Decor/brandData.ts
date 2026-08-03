export type Brand = {
  slug: 'sh' | 'etherna';
  name: string;
  origin: string;
  tagline: string;
  description: string;
  badges: string[];
  logo: string;
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
    description: 'Indústria brasileira de laminados plásticos com 40+ anos de mercado. Em 2024 lançou a linha Decor com tecnologia Shield® — antifúngico, antibacteriano, resistente a chamas. Frontal 160 micras dupla camada. 40 padrões ativos. Rolo padrão 1,22m × 25m. Fábrica em SP dispensa importação.',
    badges: ['INDÚSTRIA NACIONAL', 'TECNOLOGIA SHIELD®', '160μ DUPLA CAMADA', 'ENTREGA 48H', 'ANTIFÚNGICO · ANTIBACTERIANO'],
    logo: '/assets/logos/nzdecor/logo-etherna.webp',
    image: '/assets/images/decor/decor_etherna_card.webp',
    officialSite: 'https://ethernaprodutos.com.br',
  },
];
