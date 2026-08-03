// Catálogo Etherna Decor — GERADO a partir de scripts/data/etherna/*.json
// (scripts/generate-etherna.mjs). Edite os JSONs e regenere; não edite à mão.

export type EthernaFamilySlug =
  | 'madeira'
  | 'marmorizado'
  | 'formica'
  | 'pedra'
  | 'metal'
  | 'tecido'
  | 'estampado'
  | 'geometrico';

export type EthernaFamily = {
  slug: EthernaFamilySlug;
  name: string;
  description: string;
};

export type EthernaSpec = { label: string; value: string };

export type EthernaProduct = {
  slug: string;
  name: string;
  code: string;
  family: EthernaFamilySlug;
  collection: string;
  description: string;
  specs: EthernaSpec[];
  badges: string[];
  images: {
    texture: string;
    ambient: string[];
  };
  seo: { title: string; description: string; keywords: string };
  sourceUrl?: string;
};

export const ETHERNA_HERO_BADGES = [
  'INDÚSTRIA NACIONAL',
  'SISTEMA SHIELD®',
  'NÃO PROPAGA FOGO',
  'ENTREGA EM 48H',
];

export const ethernaFamilies: EthernaFamily[] = [
  { slug: 'madeira', name: 'Madeira', description: 'Carvalhos, ébanos, nogueiras e painéis ripados com veio realista para móveis e paredes.' },
  { slug: 'marmorizado', name: 'Marmorizado', description: 'Carraras, calacattas e travertinos para bancadas, painéis e superfícies de destaque.' },
  { slug: 'formica', name: 'Fórmica & Wood', description: 'Cores sólidas Fórmica e linha Wood para padronização limpa de móveis e ambientes.' },
  { slug: 'pedra', name: 'Pedra & Cimento', description: 'Granilites, cimentos, tijolos e miracema para composições urbanas e industriais.' },
  { slug: 'metal', name: 'Metal', description: 'Escovados e aço corten para acabamentos metálicos contemporâneos.' },
  { slug: 'tecido', name: 'Tecido', description: 'Linho telado e as tramas Avalon, Flow, Amalfi e Rivera para aquecer ambientes.' },
  { slug: 'estampado', name: 'Estampado', description: 'Estampas exclusivas para pontos de cor e personalidade.' },
  { slug: 'geometrico', name: 'Geométrico', description: 'Cubos marmorizados e chevrons para composições gráficas sofisticadas.' },
];

export const ethernaProducts: EthernaProduct[] = [
  {
    "slug": "madeira-carvalho-areia",
    "name": "Madeira Carvalho Areia",
    "code": "104",
    "family": "madeira",
    "collection": "Madeira",
    "description": "Padrão Madeira Carvalho Areia, da família Madeira da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/madeira-carvalho-areia/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Madeira Carvalho Areia — Vinil Adesivo Etherna Decor (cód. 104)",
      "description": "Revestimento vinílico autoadesivo Madeira Carvalho Areia, família Madeira, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "madeira carvalho areia adesivo, etherna decor madeira carvalho areia, vinil madeira etherna, 104"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "madeira-carvalho-caramelo",
    "name": "Madeira Carvalho Caramelo",
    "code": "103",
    "family": "madeira",
    "collection": "Madeira",
    "description": "Padrão Madeira Carvalho Caramelo, da família Madeira da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/madeira-carvalho-caramelo/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Madeira Carvalho Caramelo — Vinil Adesivo Etherna Decor (cód. 103)",
      "description": "Revestimento vinílico autoadesivo Madeira Carvalho Caramelo, família Madeira, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "madeira carvalho caramelo adesivo, etherna decor madeira carvalho caramelo, vinil madeira etherna, 103"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "madeira-cerejeira-cacau",
    "name": "Madeira Cerejeira Cacau",
    "code": "48",
    "family": "madeira",
    "collection": "Madeira",
    "description": "Padrão Madeira Cerejeira Cacau, da família Madeira da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/madeira-cerejeira-cacau/texture.jpg",
      "ambient": [
        "/assets/images/decor/etherna/madeira-cerejeira-cacau/ambient-1.jpg"
      ]
    },
    "seo": {
      "title": "Madeira Cerejeira Cacau — Vinil Adesivo Etherna Decor (cód. 48)",
      "description": "Revestimento vinílico autoadesivo Madeira Cerejeira Cacau, família Madeira, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "madeira cerejeira cacau adesivo, etherna decor madeira cerejeira cacau, vinil madeira etherna, 48"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "madeira-cerejeira-marfim",
    "name": "Madeira Cerejeira Marfim",
    "code": "49",
    "family": "madeira",
    "collection": "Madeira",
    "description": "Padrão Madeira Cerejeira Marfim, da família Madeira da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/madeira-cerejeira-marfim/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Madeira Cerejeira Marfim — Vinil Adesivo Etherna Decor (cód. 49)",
      "description": "Revestimento vinílico autoadesivo Madeira Cerejeira Marfim, família Madeira, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "madeira cerejeira marfim adesivo, etherna decor madeira cerejeira marfim, vinil madeira etherna, 49"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "madeira-classica-areia",
    "name": "Madeira Clássica Areia",
    "code": "2",
    "family": "madeira",
    "collection": "Madeira",
    "description": "Padrão Madeira Clássica Areia, da família Madeira da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/madeira-classica-areia/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Madeira Clássica Areia — Vinil Adesivo Etherna Decor (cód. 2)",
      "description": "Revestimento vinílico autoadesivo Madeira Clássica Areia, família Madeira, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "madeira clássica areia adesivo, etherna decor madeira clássica areia, vinil madeira etherna, 2"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "madeira-classica-bege",
    "name": "Madeira Clássica Bege",
    "code": "4",
    "family": "madeira",
    "collection": "Madeira",
    "description": "Padrão Madeira Clássica Bege, da família Madeira da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/madeira-classica-bege/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Madeira Clássica Bege — Vinil Adesivo Etherna Decor (cód. 4)",
      "description": "Revestimento vinílico autoadesivo Madeira Clássica Bege, família Madeira, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "madeira clássica bege adesivo, etherna decor madeira clássica bege, vinil madeira etherna, 4"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "madeira-classica-cacau",
    "name": "Madeira Clássica Cacau",
    "code": "5",
    "family": "madeira",
    "collection": "Madeira",
    "description": "Padrão Madeira Clássica Cacau, da família Madeira da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/madeira-classica-cacau/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Madeira Clássica Cacau — Vinil Adesivo Etherna Decor (cód. 5)",
      "description": "Revestimento vinílico autoadesivo Madeira Clássica Cacau, família Madeira, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "madeira clássica cacau adesivo, etherna decor madeira clássica cacau, vinil madeira etherna, 5"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "madeira-classica-cinza",
    "name": "Madeira Clássica Cinza",
    "code": "1",
    "family": "madeira",
    "collection": "Madeira",
    "description": "Padrão Madeira Clássica Cinza, da família Madeira da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/madeira-classica-cinza/texture.jpg",
      "ambient": [
        "/assets/images/decor/etherna/madeira-classica-cinza/ambient-1.jpg"
      ]
    },
    "seo": {
      "title": "Madeira Clássica Cinza — Vinil Adesivo Etherna Decor (cód. 1)",
      "description": "Revestimento vinílico autoadesivo Madeira Clássica Cinza, família Madeira, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "madeira clássica cinza adesivo, etherna decor madeira clássica cinza, vinil madeira etherna, 1"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "madeira-classica-marfim",
    "name": "Madeira Clássica Marfim",
    "code": "3",
    "family": "madeira",
    "collection": "Madeira",
    "description": "Padrão Madeira Clássica Marfim, da família Madeira da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/madeira-classica-marfim/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Madeira Clássica Marfim — Vinil Adesivo Etherna Decor (cód. 3)",
      "description": "Revestimento vinílico autoadesivo Madeira Clássica Marfim, família Madeira, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "madeira clássica marfim adesivo, etherna decor madeira clássica marfim, vinil madeira etherna, 3"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "madeira-cumaru-avela",
    "name": "Madeira Cumaru Avelã",
    "code": "102",
    "family": "madeira",
    "collection": "Madeira",
    "description": "Padrão Madeira Cumaru Avelã, da família Madeira da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/madeira-cumaru-avela/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Madeira Cumaru Avelã — Vinil Adesivo Etherna Decor (cód. 102)",
      "description": "Revestimento vinílico autoadesivo Madeira Cumaru Avelã, família Madeira, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "madeira cumaru avelã adesivo, etherna decor madeira cumaru avelã, vinil madeira etherna, 102"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "madeira-demolicao-marrom",
    "name": "Madeira Demolição Marrom",
    "code": "100",
    "family": "madeira",
    "collection": "Madeira",
    "description": "Padrão Madeira Demolição Marrom, da família Madeira da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/madeira-demolicao-marrom/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Madeira Demolição Marrom — Vinil Adesivo Etherna Decor (cód. 100)",
      "description": "Revestimento vinílico autoadesivo Madeira Demolição Marrom, família Madeira, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "madeira demolição marrom adesivo, etherna decor madeira demolição marrom, vinil madeira etherna, 100"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "madeira-ebano-areia",
    "name": "Madeira Ébano Areia",
    "code": "96",
    "family": "madeira",
    "collection": "Madeira",
    "description": "Padrão Madeira Ébano Areia, da família Madeira da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/madeira-ebano-areia/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Madeira Ébano Areia — Vinil Adesivo Etherna Decor (cód. 96)",
      "description": "Revestimento vinílico autoadesivo Madeira Ébano Areia, família Madeira, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "madeira ébano areia adesivo, etherna decor madeira ébano areia, vinil madeira etherna, 96"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "madeira-ebano-avela",
    "name": "Madeira Ébano Avelã",
    "code": "51",
    "family": "madeira",
    "collection": "Madeira",
    "description": "Padrão Madeira Ébano Avelã, da família Madeira da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/madeira-ebano-avela/texture.jpg",
      "ambient": [
        "/assets/images/decor/etherna/madeira-ebano-avela/ambient-1.jpg"
      ]
    },
    "seo": {
      "title": "Madeira Ébano Avelã — Vinil Adesivo Etherna Decor (cód. 51)",
      "description": "Revestimento vinílico autoadesivo Madeira Ébano Avelã, família Madeira, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "madeira ébano avelã adesivo, etherna decor madeira ébano avelã, vinil madeira etherna, 51"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "madeira-ebano-marrom",
    "name": "Madeira Ébano Marrom",
    "code": "52",
    "family": "madeira",
    "collection": "Madeira",
    "description": "Padrão Madeira Ébano Marrom, da família Madeira da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/madeira-ebano-marrom/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Madeira Ébano Marrom — Vinil Adesivo Etherna Decor (cód. 52)",
      "description": "Revestimento vinílico autoadesivo Madeira Ébano Marrom, família Madeira, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "madeira ébano marrom adesivo, etherna decor madeira ébano marrom, vinil madeira etherna, 52"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "madeira-ebano-pinhao",
    "name": "Madeira Ébano Pinhão",
    "code": "53",
    "family": "madeira",
    "collection": "Madeira",
    "description": "Padrão Madeira Ébano Pinhão, da família Madeira da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/madeira-ebano-pinhao/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Madeira Ébano Pinhão — Vinil Adesivo Etherna Decor (cód. 53)",
      "description": "Revestimento vinílico autoadesivo Madeira Ébano Pinhão, família Madeira, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "madeira ébano pinhão adesivo, etherna decor madeira ébano pinhão, vinil madeira etherna, 53"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "madeira-figueira-marfim",
    "name": "Madeira Figueira Marfim",
    "code": "54",
    "family": "madeira",
    "collection": "Madeira",
    "description": "Padrão Madeira Figueira Marfim, da família Madeira da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/madeira-figueira-marfim/texture.jpg",
      "ambient": [
        "/assets/images/decor/etherna/madeira-figueira-marfim/ambient-1.jpg"
      ]
    },
    "seo": {
      "title": "Madeira Figueira Marfim — Vinil Adesivo Etherna Decor (cód. 54)",
      "description": "Revestimento vinílico autoadesivo Madeira Figueira Marfim, família Madeira, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "madeira figueira marfim adesivo, etherna decor madeira figueira marfim, vinil madeira etherna, 54"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "madeira-figueira-ocre",
    "name": "Madeira Figueira Ocre",
    "code": "55",
    "family": "madeira",
    "collection": "Madeira",
    "description": "Padrão Madeira Figueira Ocre, da família Madeira da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/madeira-figueira-ocre/texture.jpg",
      "ambient": [
        "/assets/images/decor/etherna/madeira-figueira-ocre/ambient-1.jpg"
      ]
    },
    "seo": {
      "title": "Madeira Figueira Ocre — Vinil Adesivo Etherna Decor (cód. 55)",
      "description": "Revestimento vinílico autoadesivo Madeira Figueira Ocre, família Madeira, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "madeira figueira ocre adesivo, etherna decor madeira figueira ocre, vinil madeira etherna, 55"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "madeira-jacaranda-avela",
    "name": "Madeira Jacarandá Avelã",
    "code": "101",
    "family": "madeira",
    "collection": "Madeira",
    "description": "Padrão Madeira Jacarandá Avelã, da família Madeira da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/madeira-jacaranda-avela/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Madeira Jacarandá Avelã — Vinil Adesivo Etherna Decor (cód. 101)",
      "description": "Revestimento vinílico autoadesivo Madeira Jacarandá Avelã, família Madeira, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "madeira jacarandá avelã adesivo, etherna decor madeira jacarandá avelã, vinil madeira etherna, 101"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "madeira-mogno-avela",
    "name": "Madeira Mogno Avelã",
    "code": "56",
    "family": "madeira",
    "collection": "Madeira",
    "description": "Padrão Madeira Mogno Avelã, da família Madeira da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/madeira-mogno-avela/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Madeira Mogno Avelã — Vinil Adesivo Etherna Decor (cód. 56)",
      "description": "Revestimento vinílico autoadesivo Madeira Mogno Avelã, família Madeira, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "madeira mogno avelã adesivo, etherna decor madeira mogno avelã, vinil madeira etherna, 56"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "madeira-mogno-terra",
    "name": "Madeira Mogno Terra",
    "code": "59",
    "family": "madeira",
    "collection": "Madeira",
    "description": "Padrão Madeira Mogno Terra, da família Madeira da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/madeira-mogno-terra/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Madeira Mogno Terra — Vinil Adesivo Etherna Decor (cód. 59)",
      "description": "Revestimento vinílico autoadesivo Madeira Mogno Terra, família Madeira, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "madeira mogno terra adesivo, etherna decor madeira mogno terra, vinil madeira etherna, 59"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "madeira-nogueira-marrom",
    "name": "Madeira Nogueira Marrom",
    "code": "99",
    "family": "madeira",
    "collection": "Madeira",
    "description": "Padrão Madeira Nogueira Marrom, da família Madeira da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/madeira-nogueira-marrom/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Madeira Nogueira Marrom — Vinil Adesivo Etherna Decor (cód. 99)",
      "description": "Revestimento vinílico autoadesivo Madeira Nogueira Marrom, família Madeira, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "madeira nogueira marrom adesivo, etherna decor madeira nogueira marrom, vinil madeira etherna, 99"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "madeira-painel-bege",
    "name": "Madeira Painel Bege",
    "code": "12",
    "family": "madeira",
    "collection": "Madeira",
    "description": "Padrão Madeira Painel Bege, da família Madeira da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/madeira-painel-bege/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Madeira Painel Bege — Vinil Adesivo Etherna Decor (cód. 12)",
      "description": "Revestimento vinílico autoadesivo Madeira Painel Bege, família Madeira, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "madeira painel bege adesivo, etherna decor madeira painel bege, vinil madeira etherna, 12"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "madeira-painel-caramelo",
    "name": "Madeira Painel Caramelo",
    "code": "13",
    "family": "madeira",
    "collection": "Madeira",
    "description": "Padrão Madeira Painel Caramelo, da família Madeira da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/madeira-painel-caramelo/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Madeira Painel Caramelo — Vinil Adesivo Etherna Decor (cód. 13)",
      "description": "Revestimento vinílico autoadesivo Madeira Painel Caramelo, família Madeira, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "madeira painel caramelo adesivo, etherna decor madeira painel caramelo, vinil madeira etherna, 13"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "madeira-painel-cedro",
    "name": "Madeira Painel Cedro",
    "code": "14",
    "family": "madeira",
    "collection": "Madeira",
    "description": "Padrão Madeira Painel Cedro, da família Madeira da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/madeira-painel-cedro/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Madeira Painel Cedro — Vinil Adesivo Etherna Decor (cód. 14)",
      "description": "Revestimento vinílico autoadesivo Madeira Painel Cedro, família Madeira, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "madeira painel cedro adesivo, etherna decor madeira painel cedro, vinil madeira etherna, 14"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "madeira-ripada-marfim",
    "name": "Madeira Ripada Marfim",
    "code": "15",
    "family": "madeira",
    "collection": "Madeira",
    "description": "Padrão Madeira Ripada Marfim, da família Madeira da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/madeira-ripada-marfim/texture.jpg",
      "ambient": [
        "/assets/images/decor/etherna/madeira-ripada-marfim/ambient-1.jpg"
      ]
    },
    "seo": {
      "title": "Madeira Ripada Marfim — Vinil Adesivo Etherna Decor (cód. 15)",
      "description": "Revestimento vinílico autoadesivo Madeira Ripada Marfim, família Madeira, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "madeira ripada marfim adesivo, etherna decor madeira ripada marfim, vinil madeira etherna, 15"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "madeira-rustica-caramelo",
    "name": "Madeira Rústica Caramelo",
    "code": "10",
    "family": "madeira",
    "collection": "Madeira",
    "description": "Padrão Madeira Rústica Caramelo, da família Madeira da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/madeira-rustica-caramelo/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Madeira Rústica Caramelo — Vinil Adesivo Etherna Decor (cód. 10)",
      "description": "Revestimento vinílico autoadesivo Madeira Rústica Caramelo, família Madeira, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "madeira rústica caramelo adesivo, etherna decor madeira rústica caramelo, vinil madeira etherna, 10"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "madeira-rustica-marrom",
    "name": "Madeira Rústica Marrom",
    "code": "11",
    "family": "madeira",
    "collection": "Madeira",
    "description": "Padrão Madeira Rústica Marrom, da família Madeira da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/madeira-rustica-marrom/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Madeira Rústica Marrom — Vinil Adesivo Etherna Decor (cód. 11)",
      "description": "Revestimento vinílico autoadesivo Madeira Rústica Marrom, família Madeira, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "madeira rústica marrom adesivo, etherna decor madeira rústica marrom, vinil madeira etherna, 11"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "madeira-verona-ebano",
    "name": "Madeira Verona Ébano",
    "code": "8",
    "family": "madeira",
    "collection": "Madeira",
    "description": "Padrão Madeira Verona Ébano, da família Madeira da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/madeira-verona-ebano/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Madeira Verona Ébano — Vinil Adesivo Etherna Decor (cód. 8)",
      "description": "Revestimento vinílico autoadesivo Madeira Verona Ébano, família Madeira, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "madeira verona ébano adesivo, etherna decor madeira verona ébano, vinil madeira etherna, 8"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "madeira-verona-marfim",
    "name": "Madeira Verona Marfim",
    "code": "7",
    "family": "madeira",
    "collection": "Madeira",
    "description": "Padrão Madeira Verona Marfim, da família Madeira da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/madeira-verona-marfim/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Madeira Verona Marfim — Vinil Adesivo Etherna Decor (cód. 7)",
      "description": "Revestimento vinílico autoadesivo Madeira Verona Marfim, família Madeira, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "madeira verona marfim adesivo, etherna decor madeira verona marfim, vinil madeira etherna, 7"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "madeira-verona-preto",
    "name": "Madeira Verona Preto",
    "code": "9",
    "family": "madeira",
    "collection": "Madeira",
    "description": "Padrão Madeira Verona Preto, da família Madeira da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/madeira-verona-preto/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Madeira Verona Preto — Vinil Adesivo Etherna Decor (cód. 9)",
      "description": "Revestimento vinílico autoadesivo Madeira Verona Preto, família Madeira, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "madeira verona preto adesivo, etherna decor madeira verona preto, vinil madeira etherna, 9"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "marmore-bianco-branco",
    "name": "Mármore Bianco Branco",
    "code": "21",
    "family": "marmorizado",
    "collection": "Mármore",
    "description": "Padrão Mármore Bianco Branco, da família Marmorizado da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/marmore-bianco-branco/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Mármore Bianco Branco — Vinil Adesivo Etherna Decor (cód. 21)",
      "description": "Revestimento vinílico autoadesivo Mármore Bianco Branco, família Marmorizado, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "mármore bianco branco adesivo, etherna decor mármore bianco branco, vinil marmorizado etherna, 21"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "marmore-calacatta-gold-fosco",
    "name": "Mármore Calacatta Gold Fosco",
    "code": "95",
    "family": "marmorizado",
    "collection": "Mármore",
    "description": "Padrão Mármore Calacatta Gold Fosco, da família Marmorizado da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/marmore-calacatta-gold-fosco/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Mármore Calacatta Gold Fosco — Vinil Adesivo Etherna Decor (cód. 95)",
      "description": "Revestimento vinílico autoadesivo Mármore Calacatta Gold Fosco, família Marmorizado, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "mármore calacatta gold fosco adesivo, etherna decor mármore calacatta gold fosco, vinil marmorizado etherna, 95"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "marmore-calacatta-ouro",
    "name": "Mármore Calacatta Ouro",
    "code": "60",
    "family": "marmorizado",
    "collection": "Mármore",
    "description": "Padrão Mármore Calacatta Ouro, da família Marmorizado da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/marmore-calacatta-ouro/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Mármore Calacatta Ouro — Vinil Adesivo Etherna Decor (cód. 60)",
      "description": "Revestimento vinílico autoadesivo Mármore Calacatta Ouro, família Marmorizado, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "mármore calacatta ouro adesivo, etherna decor mármore calacatta ouro, vinil marmorizado etherna, 60"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "marmore-calacatta-silver",
    "name": "Mármore Calacatta Silver",
    "code": "94",
    "family": "marmorizado",
    "collection": "Mármore",
    "description": "Padrão Mármore Calacatta Silver, da família Marmorizado da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/marmore-calacatta-silver/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Mármore Calacatta Silver — Vinil Adesivo Etherna Decor (cód. 94)",
      "description": "Revestimento vinílico autoadesivo Mármore Calacatta Silver, família Marmorizado, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "mármore calacatta silver adesivo, etherna decor mármore calacatta silver, vinil marmorizado etherna, 94"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "marmore-carrara-azul-marinho",
    "name": "Mármore Carrara Azul Marinho",
    "code": "26",
    "family": "marmorizado",
    "collection": "Mármore",
    "description": "Padrão Mármore Carrara Azul Marinho, da família Marmorizado da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/marmore-carrara-azul-marinho/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Mármore Carrara Azul Marinho — Vinil Adesivo Etherna Decor (cód. 26)",
      "description": "Revestimento vinílico autoadesivo Mármore Carrara Azul Marinho, família Marmorizado, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "mármore carrara azul marinho adesivo, etherna decor mármore carrara azul marinho, vinil marmorizado etherna, 26"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "marmore-carrara-bege",
    "name": "Mármore Carrara Bege",
    "code": "23",
    "family": "marmorizado",
    "collection": "Mármore",
    "description": "Padrão Mármore Carrara Bege, da família Marmorizado da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/marmore-carrara-bege/texture.jpg",
      "ambient": [
        "/assets/images/decor/etherna/marmore-carrara-bege/ambient-1.jpg"
      ]
    },
    "seo": {
      "title": "Mármore Carrara Bege — Vinil Adesivo Etherna Decor (cód. 23)",
      "description": "Revestimento vinílico autoadesivo Mármore Carrara Bege, família Marmorizado, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "mármore carrara bege adesivo, etherna decor mármore carrara bege, vinil marmorizado etherna, 23"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "marmore-carrara-cinza",
    "name": "Mármore Carrara Cinza",
    "code": "22",
    "family": "marmorizado",
    "collection": "Mármore",
    "description": "Padrão Mármore Carrara Cinza, da família Marmorizado da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/marmore-carrara-cinza/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Mármore Carrara Cinza — Vinil Adesivo Etherna Decor (cód. 22)",
      "description": "Revestimento vinílico autoadesivo Mármore Carrara Cinza, família Marmorizado, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "mármore carrara cinza adesivo, etherna decor mármore carrara cinza, vinil marmorizado etherna, 22"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "marmore-carrara-ocre",
    "name": "Mármore Carrara Ocre",
    "code": "24",
    "family": "marmorizado",
    "collection": "Mármore",
    "description": "Padrão Mármore Carrara Ocre, da família Marmorizado da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/marmore-carrara-ocre/texture.jpg",
      "ambient": [
        "/assets/images/decor/etherna/marmore-carrara-ocre/ambient-1.jpg"
      ]
    },
    "seo": {
      "title": "Mármore Carrara Ocre — Vinil Adesivo Etherna Decor (cód. 24)",
      "description": "Revestimento vinílico autoadesivo Mármore Carrara Ocre, família Marmorizado, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "mármore carrara ocre adesivo, etherna decor mármore carrara ocre, vinil marmorizado etherna, 24"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "marmore-carrara-preto",
    "name": "Mármore Carrara Preto",
    "code": "27",
    "family": "marmorizado",
    "collection": "Mármore",
    "description": "Padrão Mármore Carrara Preto, da família Marmorizado da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/marmore-carrara-preto/texture.jpg",
      "ambient": [
        "/assets/images/decor/etherna/marmore-carrara-preto/ambient-1.jpg"
      ]
    },
    "seo": {
      "title": "Mármore Carrara Preto — Vinil Adesivo Etherna Decor (cód. 27)",
      "description": "Revestimento vinílico autoadesivo Mármore Carrara Preto, família Marmorizado, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "mármore carrara preto adesivo, etherna decor mármore carrara preto, vinil marmorizado etherna, 27"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "marmore-carrara-verde",
    "name": "Mármore Carrara Verde",
    "code": "25",
    "family": "marmorizado",
    "collection": "Mármore",
    "description": "Padrão Mármore Carrara Verde, da família Marmorizado da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/marmore-carrara-verde/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Mármore Carrara Verde — Vinil Adesivo Etherna Decor (cód. 25)",
      "description": "Revestimento vinílico autoadesivo Mármore Carrara Verde, família Marmorizado, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "mármore carrara verde adesivo, etherna decor mármore carrara verde, vinil marmorizado etherna, 25"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "marmore-casablanca-areia",
    "name": "Mármore Casablanca Areia",
    "code": "97",
    "family": "marmorizado",
    "collection": "Mármore",
    "description": "Padrão Mármore Casablanca Areia, da família Marmorizado da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/marmore-casablanca-areia/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Mármore Casablanca Areia — Vinil Adesivo Etherna Decor (cód. 97)",
      "description": "Revestimento vinílico autoadesivo Mármore Casablanca Areia, família Marmorizado, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "mármore casablanca areia adesivo, etherna decor mármore casablanca areia, vinil marmorizado etherna, 97"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "marmore-casablanca-areia-fosco",
    "name": "Mármore Casablanca Areia Fosco",
    "code": "98",
    "family": "marmorizado",
    "collection": "Mármore",
    "description": "Padrão Mármore Casablanca Areia Fosco, da família Marmorizado da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/marmore-casablanca-areia-fosco/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Mármore Casablanca Areia Fosco — Vinil Adesivo Etherna Decor (cód. 98)",
      "description": "Revestimento vinílico autoadesivo Mármore Casablanca Areia Fosco, família Marmorizado, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "mármore casablanca areia fosco adesivo, etherna decor mármore casablanca areia fosco, vinil marmorizado etherna, 98"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "marmore-claro-ouro",
    "name": "Mármore Claro Ouro",
    "code": "19",
    "family": "marmorizado",
    "collection": "Mármore",
    "description": "Padrão Mármore Claro Ouro, da família Marmorizado da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/marmore-claro-ouro/texture.jpg",
      "ambient": [
        "/assets/images/decor/etherna/marmore-claro-ouro/ambient-1.jpg"
      ]
    },
    "seo": {
      "title": "Mármore Claro Ouro — Vinil Adesivo Etherna Decor (cód. 19)",
      "description": "Revestimento vinílico autoadesivo Mármore Claro Ouro, família Marmorizado, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "mármore claro ouro adesivo, etherna decor mármore claro ouro, vinil marmorizado etherna, 19"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "marmore-claro-prata",
    "name": "Mármore Claro Prata",
    "code": "20",
    "family": "marmorizado",
    "collection": "Mármore",
    "description": "Padrão Mármore Claro Prata, da família Marmorizado da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/marmore-claro-prata/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Mármore Claro Prata — Vinil Adesivo Etherna Decor (cód. 20)",
      "description": "Revestimento vinílico autoadesivo Mármore Claro Prata, família Marmorizado, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "mármore claro prata adesivo, etherna decor mármore claro prata, vinil marmorizado etherna, 20"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "marmore-imperial-cinza",
    "name": "Mármore Imperial Cinza",
    "code": "45",
    "family": "marmorizado",
    "collection": "Mármore",
    "description": "Padrão Mármore Imperial Cinza, da família Marmorizado da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/marmore-imperial-cinza/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Mármore Imperial Cinza — Vinil Adesivo Etherna Decor (cód. 45)",
      "description": "Revestimento vinílico autoadesivo Mármore Imperial Cinza, família Marmorizado, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "mármore imperial cinza adesivo, etherna decor mármore imperial cinza, vinil marmorizado etherna, 45"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "marmore-ivec-bege",
    "name": "Mármore Ivec Bege",
    "code": "87",
    "family": "marmorizado",
    "collection": "Mármore",
    "description": "Padrão Mármore Ivec Bege, da família Marmorizado da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/marmore-ivec-bege/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Mármore Ivec Bege — Vinil Adesivo Etherna Decor (cód. 87)",
      "description": "Revestimento vinílico autoadesivo Mármore Ivec Bege, família Marmorizado, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "mármore ivec bege adesivo, etherna decor mármore ivec bege, vinil marmorizado etherna, 87"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "marmore-marquina-preto",
    "name": "Mármore Marquina Preto",
    "code": "",
    "family": "marmorizado",
    "collection": "Mármore",
    "description": "Padrão Mármore Marquina Preto, da família Marmorizado da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/marmore-marquina-preto/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Mármore Marquina Preto — Vinil Adesivo Etherna Decor",
      "description": "Revestimento vinílico autoadesivo Mármore Marquina Preto, família Marmorizado, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "mármore marquina preto adesivo, etherna decor mármore marquina preto, vinil marmorizado etherna"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "marmore-marrakesh-branco-fosco",
    "name": "Mármore Marrakesh Branco Fosco",
    "code": "111",
    "family": "marmorizado",
    "collection": "Mármore",
    "description": "Padrão Mármore Marrakesh Branco Fosco, da família Marmorizado da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/marmore-marrakesh-branco-fosco/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Mármore Marrakesh Branco Fosco — Vinil Adesivo Etherna Decor (cód. 111)",
      "description": "Revestimento vinílico autoadesivo Mármore Marrakesh Branco Fosco, família Marmorizado, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "mármore marrakesh branco fosco adesivo, etherna decor mármore marrakesh branco fosco, vinil marmorizado etherna, 111"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "marmore-nero-cinza",
    "name": "Mármore Nero Cinza",
    "code": "86",
    "family": "marmorizado",
    "collection": "Mármore",
    "description": "Padrão Mármore Nero Cinza, da família Marmorizado da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/marmore-nero-cinza/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Mármore Nero Cinza — Vinil Adesivo Etherna Decor (cód. 86)",
      "description": "Revestimento vinílico autoadesivo Mármore Nero Cinza, família Marmorizado, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "mármore nero cinza adesivo, etherna decor mármore nero cinza, vinil marmorizado etherna, 86"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "marmore-quartzo-cinza",
    "name": "Mármore Quartzo Cinza",
    "code": "44",
    "family": "marmorizado",
    "collection": "Mármore",
    "description": "Padrão Mármore Quartzo Cinza, da família Marmorizado da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/marmore-quartzo-cinza/texture.jpg",
      "ambient": [
        "/assets/images/decor/etherna/marmore-quartzo-cinza/ambient-1.jpg"
      ]
    },
    "seo": {
      "title": "Mármore Quartzo Cinza — Vinil Adesivo Etherna Decor (cód. 44)",
      "description": "Revestimento vinílico autoadesivo Mármore Quartzo Cinza, família Marmorizado, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "mármore quartzo cinza adesivo, etherna decor mármore quartzo cinza, vinil marmorizado etherna, 44"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "marmore-thassos-bege",
    "name": "Mármore Thassos Bege",
    "code": "85",
    "family": "marmorizado",
    "collection": "Mármore",
    "description": "Padrão Mármore Thassos Bege, da família Marmorizado da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/marmore-thassos-bege/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Mármore Thassos Bege — Vinil Adesivo Etherna Decor (cód. 85)",
      "description": "Revestimento vinílico autoadesivo Mármore Thassos Bege, família Marmorizado, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "mármore thassos bege adesivo, etherna decor mármore thassos bege, vinil marmorizado etherna, 85"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "marmore-travertino-bege",
    "name": "Mármore Travertino Bege",
    "code": "63",
    "family": "marmorizado",
    "collection": "Mármore",
    "description": "Padrão Mármore Travertino Bege, da família Marmorizado da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/marmore-travertino-bege/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Mármore Travertino Bege — Vinil Adesivo Etherna Decor (cód. 63)",
      "description": "Revestimento vinílico autoadesivo Mármore Travertino Bege, família Marmorizado, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "mármore travertino bege adesivo, etherna decor mármore travertino bege, vinil marmorizado etherna, 63"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "travertino-premium-bege",
    "name": "Travertino Premium Bege",
    "code": "92",
    "family": "marmorizado",
    "collection": "Travertino",
    "description": "Padrão Travertino Premium Bege, da família Marmorizado da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/travertino-premium-bege/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Travertino Premium Bege — Vinil Adesivo Etherna Decor (cód. 92)",
      "description": "Revestimento vinílico autoadesivo Travertino Premium Bege, família Marmorizado, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "travertino premium bege adesivo, etherna decor travertino premium bege, vinil marmorizado etherna, 92"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "formica-areia",
    "name": "Fórmica Areia",
    "code": "89",
    "family": "formica",
    "collection": "Fórmica",
    "description": "Padrão Fórmica Areia, da família Fórmica & Wood da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 140 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/formica-areia/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Fórmica Areia — Vinil Adesivo Etherna Decor (cód. 89)",
      "description": "Revestimento vinílico autoadesivo Fórmica Areia, família Fórmica & Wood, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "fórmica areia adesivo, etherna decor fórmica areia, vinil fórmica & wood etherna, 89"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "formica-azul",
    "name": "Fórmica Azul",
    "code": "4137-C",
    "family": "formica",
    "collection": "Fórmica",
    "description": "Padrão Fórmica Azul, da família Fórmica & Wood da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 140 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/formica-azul/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Fórmica Azul — Vinil Adesivo Etherna Decor (cód. 4137-C)",
      "description": "Revestimento vinílico autoadesivo Fórmica Azul, família Fórmica & Wood, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "fórmica azul adesivo, etherna decor fórmica azul, vinil fórmica & wood etherna, 4137-C"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "formica-azul-marinho",
    "name": "Fórmica Azul Marinho",
    "code": "",
    "family": "formica",
    "collection": "Fórmica",
    "description": "Padrão Fórmica Azul Marinho, da família Fórmica & Wood da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 140 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/formica-azul-marinho/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Fórmica Azul Marinho — Vinil Adesivo Etherna Decor",
      "description": "Revestimento vinílico autoadesivo Fórmica Azul Marinho, família Fórmica & Wood, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "fórmica azul marinho adesivo, etherna decor fórmica azul marinho, vinil fórmica & wood etherna"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "formica-azul-oxford",
    "name": "Fórmica Azul Oxford",
    "code": "",
    "family": "formica",
    "collection": "Fórmica",
    "description": "Padrão Fórmica Azul Oxford, da família Fórmica & Wood da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 140 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/formica-azul-oxford/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Fórmica Azul Oxford — Vinil Adesivo Etherna Decor",
      "description": "Revestimento vinílico autoadesivo Fórmica Azul Oxford, família Fórmica & Wood, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "fórmica azul oxford adesivo, etherna decor fórmica azul oxford, vinil fórmica & wood etherna"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "formica-azul-pastel",
    "name": "Fórmica Azul Pastel",
    "code": "",
    "family": "formica",
    "collection": "Fórmica",
    "description": "Padrão Fórmica Azul Pastel, da família Fórmica & Wood da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 140 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/formica-azul-pastel/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Fórmica Azul Pastel — Vinil Adesivo Etherna Decor",
      "description": "Revestimento vinílico autoadesivo Fórmica Azul Pastel, família Fórmica & Wood, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "fórmica azul pastel adesivo, etherna decor fórmica azul pastel, vinil fórmica & wood etherna"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "formica-bege",
    "name": "Fórmica Bege",
    "code": "4248-C",
    "family": "formica",
    "collection": "Fórmica",
    "description": "Padrão Fórmica Bege, da família Fórmica & Wood da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 140 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/formica-bege/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Fórmica Bege — Vinil Adesivo Etherna Decor (cód. 4248-C)",
      "description": "Revestimento vinílico autoadesivo Fórmica Bege, família Fórmica & Wood, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "fórmica bege adesivo, etherna decor fórmica bege, vinil fórmica & wood etherna, 4248-C"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "formica-bege-greige",
    "name": "Fórmica Bege Greige",
    "code": "",
    "family": "formica",
    "collection": "Fórmica",
    "description": "Padrão Fórmica Bege Greige, da família Fórmica & Wood da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 140 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/formica-bege-greige/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Fórmica Bege Greige — Vinil Adesivo Etherna Decor",
      "description": "Revestimento vinílico autoadesivo Fórmica Bege Greige, família Fórmica & Wood, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "fórmica bege greige adesivo, etherna decor fórmica bege greige, vinil fórmica & wood etherna"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "formica-bordo",
    "name": "Fórmica Bordô",
    "code": "195-C",
    "family": "formica",
    "collection": "Fórmica",
    "description": "Padrão Fórmica Bordô, da família Fórmica & Wood da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 140 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/formica-bordo/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Fórmica Bordô — Vinil Adesivo Etherna Decor (cód. 195-C)",
      "description": "Revestimento vinílico autoadesivo Fórmica Bordô, família Fórmica & Wood, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "fórmica bordô adesivo, etherna decor fórmica bordô, vinil fórmica & wood etherna, 195-C"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "formica-branco",
    "name": "Fórmica Branco",
    "code": "",
    "family": "formica",
    "collection": "Fórmica",
    "description": "Padrão Fórmica Branco, da família Fórmica & Wood da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 140 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/formica-branco/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Fórmica Branco — Vinil Adesivo Etherna Decor",
      "description": "Revestimento vinílico autoadesivo Fórmica Branco, família Fórmica & Wood, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "fórmica branco adesivo, etherna decor fórmica branco, vinil fórmica & wood etherna"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "formica-caramelo",
    "name": "Fórmica Caramelo",
    "code": "",
    "family": "formica",
    "collection": "Fórmica",
    "description": "Padrão Fórmica Caramelo, da família Fórmica & Wood da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 140 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/formica-caramelo/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Fórmica Caramelo — Vinil Adesivo Etherna Decor",
      "description": "Revestimento vinílico autoadesivo Fórmica Caramelo, família Fórmica & Wood, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "fórmica caramelo adesivo, etherna decor fórmica caramelo, vinil fórmica & wood etherna"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "formica-cinza-8-c",
    "name": "Fórmica Cinza 8 C",
    "code": "",
    "family": "formica",
    "collection": "Fórmica",
    "description": "Padrão Fórmica Cinza 8 C, da família Fórmica & Wood da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 140 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/formica-cinza-8-c/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Fórmica Cinza 8 C — Vinil Adesivo Etherna Decor",
      "description": "Revestimento vinílico autoadesivo Fórmica Cinza 8 C, família Fórmica & Wood, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "fórmica cinza 8 c adesivo, etherna decor fórmica cinza 8 c, vinil fórmica & wood etherna"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "formica-cinza-cromio",
    "name": "Fórmica Cinza Crômio",
    "code": "",
    "family": "formica",
    "collection": "Fórmica",
    "description": "Padrão Fórmica Cinza Crômio, da família Fórmica & Wood da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 140 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/formica-cinza-cromio/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Fórmica Cinza Crômio — Vinil Adesivo Etherna Decor",
      "description": "Revestimento vinílico autoadesivo Fórmica Cinza Crômio, família Fórmica & Wood, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "fórmica cinza crômio adesivo, etherna decor fórmica cinza crômio, vinil fórmica & wood etherna"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "formica-cinza-glacial",
    "name": "Fórmica Cinza Glacial",
    "code": "88",
    "family": "formica",
    "collection": "Fórmica",
    "description": "Padrão Fórmica Cinza Glacial, da família Fórmica & Wood da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 140 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/formica-cinza-glacial/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Fórmica Cinza Glacial — Vinil Adesivo Etherna Decor (cód. 88)",
      "description": "Revestimento vinílico autoadesivo Fórmica Cinza Glacial, família Fórmica & Wood, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "fórmica cinza glacial adesivo, etherna decor fórmica cinza glacial, vinil fórmica & wood etherna, 88"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "formica-fendi",
    "name": "Fórmica Fendi",
    "code": "407-C",
    "family": "formica",
    "collection": "Fórmica",
    "description": "Padrão Fórmica Fendi, da família Fórmica & Wood da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 140 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/formica-fendi/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Fórmica Fendi — Vinil Adesivo Etherna Decor (cód. 407-C)",
      "description": "Revestimento vinílico autoadesivo Fórmica Fendi, família Fórmica & Wood, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "fórmica fendi adesivo, etherna decor fórmica fendi, vinil fórmica & wood etherna, 407-C"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "formica-grafite",
    "name": "Fórmica Grafite",
    "code": "",
    "family": "formica",
    "collection": "Fórmica",
    "description": "Padrão Fórmica Grafite, da família Fórmica & Wood da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 140 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/formica-grafite/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Fórmica Grafite — Vinil Adesivo Etherna Decor",
      "description": "Revestimento vinílico autoadesivo Fórmica Grafite, família Fórmica & Wood, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "fórmica grafite adesivo, etherna decor fórmica grafite, vinil fórmica & wood etherna"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "formica-marrom",
    "name": "Fórmica Marrom",
    "code": "",
    "family": "formica",
    "collection": "Fórmica",
    "description": "Padrão Fórmica Marrom, da família Fórmica & Wood da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 140 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/formica-marrom/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Fórmica Marrom — Vinil Adesivo Etherna Decor",
      "description": "Revestimento vinílico autoadesivo Fórmica Marrom, família Fórmica & Wood, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "fórmica marrom adesivo, etherna decor fórmica marrom, vinil fórmica & wood etherna"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "formica-moka",
    "name": "Fórmica Moka",
    "code": "410-C",
    "family": "formica",
    "collection": "Fórmica",
    "description": "Padrão Fórmica Moka, da família Fórmica & Wood da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 140 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/formica-moka/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Fórmica Moka — Vinil Adesivo Etherna Decor (cód. 410-C)",
      "description": "Revestimento vinílico autoadesivo Fórmica Moka, família Fórmica & Wood, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "fórmica moka adesivo, etherna decor fórmica moka, vinil fórmica & wood etherna, 410-C"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "formica-mostarda",
    "name": "Fórmica Mostarda",
    "code": "",
    "family": "formica",
    "collection": "Fórmica",
    "description": "Padrão Fórmica Mostarda, da família Fórmica & Wood da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 140 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/formica-mostarda/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Fórmica Mostarda — Vinil Adesivo Etherna Decor",
      "description": "Revestimento vinílico autoadesivo Fórmica Mostarda, família Fórmica & Wood, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "fórmica mostarda adesivo, etherna decor fórmica mostarda, vinil fórmica & wood etherna"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "formica-nude",
    "name": "Fórmica Nude",
    "code": "4260-C",
    "family": "formica",
    "collection": "Fórmica",
    "description": "Padrão Fórmica Nude, da família Fórmica & Wood da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 140 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/formica-nude/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Fórmica Nude — Vinil Adesivo Etherna Decor (cód. 4260-C)",
      "description": "Revestimento vinílico autoadesivo Fórmica Nude, família Fórmica & Wood, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "fórmica nude adesivo, etherna decor fórmica nude, vinil fórmica & wood etherna, 4260-C"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "formica-off-white",
    "name": "Fórmica Off White",
    "code": "",
    "family": "formica",
    "collection": "Fórmica",
    "description": "Padrão Fórmica Off White, da família Fórmica & Wood da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 140 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/formica-off-white/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Fórmica Off White — Vinil Adesivo Etherna Decor",
      "description": "Revestimento vinílico autoadesivo Fórmica Off White, família Fórmica & Wood, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "fórmica off white adesivo, etherna decor fórmica off white, vinil fórmica & wood etherna"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "formica-preto",
    "name": "Fórmica Preto",
    "code": "",
    "family": "formica",
    "collection": "Fórmica",
    "description": "Padrão Fórmica Preto, da família Fórmica & Wood da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 140 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/formica-preto/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Fórmica Preto — Vinil Adesivo Etherna Decor",
      "description": "Revestimento vinílico autoadesivo Fórmica Preto, família Fórmica & Wood, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "fórmica preto adesivo, etherna decor fórmica preto, vinil fórmica & wood etherna"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "formica-rosa-claro",
    "name": "Fórmica Rosa Claro",
    "code": "107",
    "family": "formica",
    "collection": "Fórmica",
    "description": "Padrão Fórmica Rosa Claro, da família Fórmica & Wood da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 140 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/formica-rosa-claro/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Fórmica Rosa Claro — Vinil Adesivo Etherna Decor (cód. 107)",
      "description": "Revestimento vinílico autoadesivo Fórmica Rosa Claro, família Fórmica & Wood, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "fórmica rosa claro adesivo, etherna decor fórmica rosa claro, vinil fórmica & wood etherna, 107"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "formica-taupe",
    "name": "Fórmica Taupe",
    "code": "",
    "family": "formica",
    "collection": "Fórmica",
    "description": "Padrão Fórmica Taupe, da família Fórmica & Wood da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 140 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/formica-taupe/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Fórmica Taupe — Vinil Adesivo Etherna Decor",
      "description": "Revestimento vinílico autoadesivo Fórmica Taupe, família Fórmica & Wood, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "fórmica taupe adesivo, etherna decor fórmica taupe, vinil fórmica & wood etherna"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "formica-telha",
    "name": "Fórmica Telha",
    "code": "",
    "family": "formica",
    "collection": "Fórmica",
    "description": "Padrão Fórmica Telha, da família Fórmica & Wood da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 140 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/formica-telha/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Fórmica Telha — Vinil Adesivo Etherna Decor",
      "description": "Revestimento vinílico autoadesivo Fórmica Telha, família Fórmica & Wood, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "fórmica telha adesivo, etherna decor fórmica telha, vinil fórmica & wood etherna"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "formica-terracota",
    "name": "Fórmica Terracota",
    "code": "471-C",
    "family": "formica",
    "collection": "Fórmica",
    "description": "Padrão Fórmica Terracota, da família Fórmica & Wood da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 140 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/formica-terracota/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Fórmica Terracota — Vinil Adesivo Etherna Decor (cód. 471-C)",
      "description": "Revestimento vinílico autoadesivo Fórmica Terracota, família Fórmica & Wood, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "fórmica terracota adesivo, etherna decor fórmica terracota, vinil fórmica & wood etherna, 471-C"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "formica-tiza",
    "name": "Fórmica Tiza",
    "code": "",
    "family": "formica",
    "collection": "Fórmica",
    "description": "Padrão Fórmica Tiza, da família Fórmica & Wood da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 140 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/formica-tiza/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Fórmica Tiza — Vinil Adesivo Etherna Decor",
      "description": "Revestimento vinílico autoadesivo Fórmica Tiza, família Fórmica & Wood, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "fórmica tiza adesivo, etherna decor fórmica tiza, vinil fórmica & wood etherna"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "formica-toscana",
    "name": "Fórmica Toscana",
    "code": "2441-C",
    "family": "formica",
    "collection": "Fórmica",
    "description": "Padrão Fórmica Toscana, da família Fórmica & Wood da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 140 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/formica-toscana/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Fórmica Toscana — Vinil Adesivo Etherna Decor (cód. 2441-C)",
      "description": "Revestimento vinílico autoadesivo Fórmica Toscana, família Fórmica & Wood, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "fórmica toscana adesivo, etherna decor fórmica toscana, vinil fórmica & wood etherna, 2441-C"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "formica-verde-escuro",
    "name": "Fórmica Verde Escuro",
    "code": "",
    "family": "formica",
    "collection": "Fórmica",
    "description": "Padrão Fórmica Verde Escuro, da família Fórmica & Wood da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 140 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/formica-verde-escuro/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Fórmica Verde Escuro — Vinil Adesivo Etherna Decor",
      "description": "Revestimento vinílico autoadesivo Fórmica Verde Escuro, família Fórmica & Wood, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "fórmica verde escuro adesivo, etherna decor fórmica verde escuro, vinil fórmica & wood etherna"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "formica-verde-musgo",
    "name": "Fórmica Verde Musgo",
    "code": "",
    "family": "formica",
    "collection": "Fórmica",
    "description": "Padrão Fórmica Verde Musgo, da família Fórmica & Wood da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 140 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/formica-verde-musgo/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Fórmica Verde Musgo — Vinil Adesivo Etherna Decor",
      "description": "Revestimento vinílico autoadesivo Fórmica Verde Musgo, família Fórmica & Wood, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "fórmica verde musgo adesivo, etherna decor fórmica verde musgo, vinil fórmica & wood etherna"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "formica-verde-oliva",
    "name": "Fórmica Verde Oliva",
    "code": "108",
    "family": "formica",
    "collection": "Fórmica",
    "description": "Padrão Fórmica Verde Oliva, da família Fórmica & Wood da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 140 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/formica-verde-oliva/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Fórmica Verde Oliva — Vinil Adesivo Etherna Decor (cód. 108)",
      "description": "Revestimento vinílico autoadesivo Fórmica Verde Oliva, família Fórmica & Wood, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "fórmica verde oliva adesivo, etherna decor fórmica verde oliva, vinil fórmica & wood etherna, 108"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "formica-verde-pastel",
    "name": "Fórmica Verde Pastel",
    "code": "4178-C",
    "family": "formica",
    "collection": "Fórmica",
    "description": "Padrão Fórmica Verde Pastel, da família Fórmica & Wood da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 140 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/formica-verde-pastel/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Fórmica Verde Pastel — Vinil Adesivo Etherna Decor (cód. 4178-C)",
      "description": "Revestimento vinílico autoadesivo Fórmica Verde Pastel, família Fórmica & Wood, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "fórmica verde pastel adesivo, etherna decor fórmica verde pastel, vinil fórmica & wood etherna, 4178-C"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "formica-verde-selva",
    "name": "Fórmica Verde Selva",
    "code": "2409-C",
    "family": "formica",
    "collection": "Fórmica",
    "description": "Padrão Fórmica Verde Selva, da família Fórmica & Wood da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 140 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/formica-verde-selva/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Fórmica Verde Selva — Vinil Adesivo Etherna Decor (cód. 2409-C)",
      "description": "Revestimento vinílico autoadesivo Fórmica Verde Selva, família Fórmica & Wood, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "fórmica verde selva adesivo, etherna decor fórmica verde selva, vinil fórmica & wood etherna, 2409-C"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "formica-vinho",
    "name": "Fórmica Vinho",
    "code": "",
    "family": "formica",
    "collection": "Fórmica",
    "description": "Padrão Fórmica Vinho, da família Fórmica & Wood da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 140 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/formica-vinho/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Fórmica Vinho — Vinil Adesivo Etherna Decor",
      "description": "Revestimento vinílico autoadesivo Fórmica Vinho, família Fórmica & Wood, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "fórmica vinho adesivo, etherna decor fórmica vinho, vinil fórmica & wood etherna"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "wood-branco",
    "name": "Wood Branco",
    "code": "90",
    "family": "formica",
    "collection": "Wood",
    "description": "Padrão Wood Branco, da família Fórmica & Wood da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 140 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/wood-branco/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Wood Branco — Vinil Adesivo Etherna Decor (cód. 90)",
      "description": "Revestimento vinílico autoadesivo Wood Branco, família Fórmica & Wood, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "wood branco adesivo, etherna decor wood branco, vinil fórmica & wood etherna, 90"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "wood-preto",
    "name": "Wood Preto",
    "code": "91",
    "family": "formica",
    "collection": "Wood",
    "description": "Padrão Wood Preto, da família Fórmica & Wood da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 140 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/wood-preto/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Wood Preto — Vinil Adesivo Etherna Decor (cód. 91)",
      "description": "Revestimento vinílico autoadesivo Wood Preto, família Fórmica & Wood, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "wood preto adesivo, etherna decor wood preto, vinil fórmica & wood etherna, 91"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "cimento-queimado-cinza",
    "name": "Cimento Queimado Cinza",
    "code": "34",
    "family": "pedra",
    "collection": "Cimento",
    "description": "Padrão Cimento Queimado Cinza, da família Pedra & Cimento da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/cimento-queimado-cinza/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Cimento Queimado Cinza — Vinil Adesivo Etherna Decor (cód. 34)",
      "description": "Revestimento vinílico autoadesivo Cimento Queimado Cinza, família Pedra & Cimento, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "cimento queimado cinza adesivo, etherna decor cimento queimado cinza, vinil pedra & cimento etherna, 34"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "cimento-queimado-ocre",
    "name": "Cimento Queimado Ocre",
    "code": "",
    "family": "pedra",
    "collection": "Cimento",
    "description": "Padrão Cimento Queimado Ocre, da família Pedra & Cimento da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/cimento-queimado-ocre/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Cimento Queimado Ocre — Vinil Adesivo Etherna Decor",
      "description": "Revestimento vinílico autoadesivo Cimento Queimado Ocre, família Pedra & Cimento, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "cimento queimado ocre adesivo, etherna decor cimento queimado ocre, vinil pedra & cimento etherna"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "cimento-texturizado-areia",
    "name": "Cimento Texturizado Areia",
    "code": "105",
    "family": "pedra",
    "collection": "Cimento",
    "description": "Padrão Cimento Texturizado Areia, da família Pedra & Cimento da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/cimento-texturizado-areia/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Cimento Texturizado Areia — Vinil Adesivo Etherna Decor (cód. 105)",
      "description": "Revestimento vinílico autoadesivo Cimento Texturizado Areia, família Pedra & Cimento, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "cimento texturizado areia adesivo, etherna decor cimento texturizado areia, vinil pedra & cimento etherna, 105"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "cimento-texturizado-cinza",
    "name": "Cimento Texturizado Cinza",
    "code": "61",
    "family": "pedra",
    "collection": "Cimento",
    "description": "Padrão Cimento Texturizado Cinza, da família Pedra & Cimento da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/cimento-texturizado-cinza/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Cimento Texturizado Cinza — Vinil Adesivo Etherna Decor (cód. 61)",
      "description": "Revestimento vinílico autoadesivo Cimento Texturizado Cinza, família Pedra & Cimento, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "cimento texturizado cinza adesivo, etherna decor cimento texturizado cinza, vinil pedra & cimento etherna, 61"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "cimento-texturizado-cinza-claro",
    "name": "Cimento Texturizado Cinza Claro",
    "code": "106",
    "family": "pedra",
    "collection": "Cimento",
    "description": "Padrão Cimento Texturizado Cinza Claro, da família Pedra & Cimento da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/cimento-texturizado-cinza-claro/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Cimento Texturizado Cinza Claro — Vinil Adesivo Etherna Decor (cód. 106)",
      "description": "Revestimento vinílico autoadesivo Cimento Texturizado Cinza Claro, família Pedra & Cimento, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "cimento texturizado cinza claro adesivo, etherna decor cimento texturizado cinza claro, vinil pedra & cimento etherna, 106"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "granilite-bege",
    "name": "Granilite Bege",
    "code": "41",
    "family": "pedra",
    "collection": "Granilite",
    "description": "Padrão Granilite Bege, da família Pedra & Cimento da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/granilite-bege/texture.jpg",
      "ambient": [
        "/assets/images/decor/etherna/granilite-bege/ambient-1.jpg"
      ]
    },
    "seo": {
      "title": "Granilite Bege — Vinil Adesivo Etherna Decor (cód. 41)",
      "description": "Revestimento vinílico autoadesivo Granilite Bege, família Pedra & Cimento, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "granilite bege adesivo, etherna decor granilite bege, vinil pedra & cimento etherna, 41"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "granilite-cinza",
    "name": "Granilite Cinza",
    "code": "42",
    "family": "pedra",
    "collection": "Granilite",
    "description": "Padrão Granilite Cinza, da família Pedra & Cimento da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/granilite-cinza/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Granilite Cinza — Vinil Adesivo Etherna Decor (cód. 42)",
      "description": "Revestimento vinílico autoadesivo Granilite Cinza, família Pedra & Cimento, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "granilite cinza adesivo, etherna decor granilite cinza, vinil pedra & cimento etherna, 42"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "granilite-color-branco",
    "name": "Granilite Color Branco",
    "code": "93",
    "family": "pedra",
    "collection": "Granilite",
    "description": "Padrão Granilite Color Branco, da família Pedra & Cimento da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/granilite-color-branco/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Granilite Color Branco — Vinil Adesivo Etherna Decor (cód. 93)",
      "description": "Revestimento vinílico autoadesivo Granilite Color Branco, família Pedra & Cimento, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "granilite color branco adesivo, etherna decor granilite color branco, vinil pedra & cimento etherna, 93"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "granilite-grafite",
    "name": "Granilite Grafite",
    "code": "43",
    "family": "pedra",
    "collection": "Granilite",
    "description": "Padrão Granilite Grafite, da família Pedra & Cimento da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/granilite-grafite/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Granilite Grafite — Vinil Adesivo Etherna Decor (cód. 43)",
      "description": "Revestimento vinílico autoadesivo Granilite Grafite, família Pedra & Cimento, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "granilite grafite adesivo, etherna decor granilite grafite, vinil pedra & cimento etherna, 43"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "granilite-romanza-cinza",
    "name": "Granilite Romanza Cinza",
    "code": "",
    "family": "pedra",
    "collection": "Granilite",
    "description": "Padrão Granilite Romanza Cinza, da família Pedra & Cimento da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/granilite-romanza-cinza/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Granilite Romanza Cinza — Vinil Adesivo Etherna Decor",
      "description": "Revestimento vinílico autoadesivo Granilite Romanza Cinza, família Pedra & Cimento, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "granilite romanza cinza adesivo, etherna decor granilite romanza cinza, vinil pedra & cimento etherna"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "granilite-romanza-gelo",
    "name": "Granilite Romanza Gelo",
    "code": "",
    "family": "pedra",
    "collection": "Granilite",
    "description": "Padrão Granilite Romanza Gelo, da família Pedra & Cimento da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/granilite-romanza-gelo/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Granilite Romanza Gelo — Vinil Adesivo Etherna Decor",
      "description": "Revestimento vinílico autoadesivo Granilite Romanza Gelo, família Pedra & Cimento, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "granilite romanza gelo adesivo, etherna decor granilite romanza gelo, vinil pedra & cimento etherna"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "miracema-bege",
    "name": "Miracema Bege",
    "code": "62",
    "family": "pedra",
    "collection": "Miracema",
    "description": "Padrão Miracema Bege, da família Pedra & Cimento da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/miracema-bege/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Miracema Bege — Vinil Adesivo Etherna Decor (cód. 62)",
      "description": "Revestimento vinílico autoadesivo Miracema Bege, família Pedra & Cimento, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "miracema bege adesivo, etherna decor miracema bege, vinil pedra & cimento etherna, 62"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "tijolo-branco",
    "name": "Tijolo Branco",
    "code": "38",
    "family": "pedra",
    "collection": "Tijolo",
    "description": "Padrão Tijolo Branco, da família Pedra & Cimento da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/tijolo-branco/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Tijolo Branco — Vinil Adesivo Etherna Decor (cód. 38)",
      "description": "Revestimento vinílico autoadesivo Tijolo Branco, família Pedra & Cimento, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "tijolo branco adesivo, etherna decor tijolo branco, vinil pedra & cimento etherna, 38"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "tijolo-cinza",
    "name": "Tijolo Cinza",
    "code": "39",
    "family": "pedra",
    "collection": "Tijolo",
    "description": "Padrão Tijolo Cinza, da família Pedra & Cimento da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/tijolo-cinza/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Tijolo Cinza — Vinil Adesivo Etherna Decor (cód. 39)",
      "description": "Revestimento vinílico autoadesivo Tijolo Cinza, família Pedra & Cimento, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "tijolo cinza adesivo, etherna decor tijolo cinza, vinil pedra & cimento etherna, 39"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "tijolo-laranja",
    "name": "Tijolo Laranja",
    "code": "37",
    "family": "pedra",
    "collection": "Tijolo",
    "description": "Padrão Tijolo Laranja, da família Pedra & Cimento da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/tijolo-laranja/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Tijolo Laranja — Vinil Adesivo Etherna Decor (cód. 37)",
      "description": "Revestimento vinílico autoadesivo Tijolo Laranja, família Pedra & Cimento, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "tijolo laranja adesivo, etherna decor tijolo laranja, vinil pedra & cimento etherna, 37"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "tijolo-preto",
    "name": "Tijolo Preto",
    "code": "40",
    "family": "pedra",
    "collection": "Tijolo",
    "description": "Padrão Tijolo Preto, da família Pedra & Cimento da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/tijolo-preto/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Tijolo Preto — Vinil Adesivo Etherna Decor (cód. 40)",
      "description": "Revestimento vinílico autoadesivo Tijolo Preto, família Pedra & Cimento, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "tijolo preto adesivo, etherna decor tijolo preto, vinil pedra & cimento etherna, 40"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "corten-ferrugem",
    "name": "Corten Ferrugem",
    "code": "30",
    "family": "metal",
    "collection": "Corten",
    "description": "Padrão Corten Ferrugem, da família Metal da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/corten-ferrugem/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Corten Ferrugem — Vinil Adesivo Etherna Decor (cód. 30)",
      "description": "Revestimento vinílico autoadesivo Corten Ferrugem, família Metal, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "corten ferrugem adesivo, etherna decor corten ferrugem, vinil metal etherna, 30"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "corten-grafite",
    "name": "Corten Grafite",
    "code": "29",
    "family": "metal",
    "collection": "Corten",
    "description": "Padrão Corten Grafite, da família Metal da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/corten-grafite/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Corten Grafite — Vinil Adesivo Etherna Decor (cód. 29)",
      "description": "Revestimento vinílico autoadesivo Corten Grafite, família Metal, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "corten grafite adesivo, etherna decor corten grafite, vinil metal etherna, 29"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "corten-inox",
    "name": "Corten Inox",
    "code": "28",
    "family": "metal",
    "collection": "Corten",
    "description": "Padrão Corten Inox, da família Metal da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/corten-inox/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Corten Inox — Vinil Adesivo Etherna Decor (cód. 28)",
      "description": "Revestimento vinílico autoadesivo Corten Inox, família Metal, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "corten inox adesivo, etherna decor corten inox, vinil metal etherna, 28"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "escovado-grafite",
    "name": "Escovado Grafite",
    "code": "",
    "family": "metal",
    "collection": "Escovado",
    "description": "Padrão Escovado Grafite, da família Metal da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 100 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "100 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 02 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/escovado-grafite/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Escovado Grafite — Vinil Adesivo Etherna Decor",
      "description": "Revestimento vinílico autoadesivo Escovado Grafite, família Metal, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "escovado grafite adesivo, etherna decor escovado grafite, vinil metal etherna"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "escovado-inox",
    "name": "Escovado Inox",
    "code": "",
    "family": "metal",
    "collection": "Escovado",
    "description": "Padrão Escovado Inox, da família Metal da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 100 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "100 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 02 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/escovado-inox/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Escovado Inox — Vinil Adesivo Etherna Decor",
      "description": "Revestimento vinílico autoadesivo Escovado Inox, família Metal, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "escovado inox adesivo, etherna decor escovado inox, vinil metal etherna"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "escovado-prata",
    "name": "Escovado Prata",
    "code": "",
    "family": "metal",
    "collection": "Escovado",
    "description": "Padrão Escovado Prata, da família Metal da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 100 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "100 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 02 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/escovado-prata/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Escovado Prata — Vinil Adesivo Etherna Decor",
      "description": "Revestimento vinílico autoadesivo Escovado Prata, família Metal, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "escovado prata adesivo, etherna decor escovado prata, vinil metal etherna"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "amalfi-algodao-egipcio",
    "name": "Amalfi Algodão Egípcio",
    "code": "161",
    "family": "tecido",
    "collection": "Amalfi",
    "description": "Padrão Amalfi Algodão Egípcio, da família Tecido da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/amalfi-algodao-egipcio/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Amalfi Algodão Egípcio — Vinil Adesivo Etherna Decor (cód. 161)",
      "description": "Revestimento vinílico autoadesivo Amalfi Algodão Egípcio, família Tecido, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "amalfi algodão egípcio adesivo, etherna decor amalfi algodão egípcio, vinil tecido etherna, 161"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "amalfi-areia",
    "name": "Amalfi Areia",
    "code": "157",
    "family": "tecido",
    "collection": "Amalfi",
    "description": "Padrão Amalfi Areia, da família Tecido da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/amalfi-areia/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Amalfi Areia — Vinil Adesivo Etherna Decor (cód. 157)",
      "description": "Revestimento vinílico autoadesivo Amalfi Areia, família Tecido, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "amalfi areia adesivo, etherna decor amalfi areia, vinil tecido etherna, 157"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "amalfi-bege-greige",
    "name": "Amalfi Bege Greige",
    "code": "162",
    "family": "tecido",
    "collection": "Amalfi",
    "description": "Padrão Amalfi Bege Greige, da família Tecido da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/amalfi-bege-greige/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Amalfi Bege Greige — Vinil Adesivo Etherna Decor (cód. 162)",
      "description": "Revestimento vinílico autoadesivo Amalfi Bege Greige, família Tecido, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "amalfi bege greige adesivo, etherna decor amalfi bege greige, vinil tecido etherna, 162"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "amalfi-cinza-cromio",
    "name": "Amalfi Cinza Crômio",
    "code": "164",
    "family": "tecido",
    "collection": "Amalfi",
    "description": "Padrão Amalfi Cinza Crômio, da família Tecido da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/amalfi-cinza-cromio/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Amalfi Cinza Crômio — Vinil Adesivo Etherna Decor (cód. 164)",
      "description": "Revestimento vinílico autoadesivo Amalfi Cinza Crômio, família Tecido, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "amalfi cinza crômio adesivo, etherna decor amalfi cinza crômio, vinil tecido etherna, 164"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "amalfi-creme",
    "name": "Amalfi Creme",
    "code": "159",
    "family": "tecido",
    "collection": "Amalfi",
    "description": "Padrão Amalfi Creme, da família Tecido da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/amalfi-creme/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Amalfi Creme — Vinil Adesivo Etherna Decor (cód. 159)",
      "description": "Revestimento vinílico autoadesivo Amalfi Creme, família Tecido, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "amalfi creme adesivo, etherna decor amalfi creme, vinil tecido etherna, 159"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "amalfi-fendi",
    "name": "Amalfi Fendi",
    "code": "163",
    "family": "tecido",
    "collection": "Amalfi",
    "description": "Padrão Amalfi Fendi, da família Tecido da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/amalfi-fendi/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Amalfi Fendi — Vinil Adesivo Etherna Decor (cód. 163)",
      "description": "Revestimento vinílico autoadesivo Amalfi Fendi, família Tecido, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "amalfi fendi adesivo, etherna decor amalfi fendi, vinil tecido etherna, 163"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "amalfi-nude",
    "name": "Amalfi Nude",
    "code": "160",
    "family": "tecido",
    "collection": "Amalfi",
    "description": "Padrão Amalfi Nude, da família Tecido da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/amalfi-nude/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Amalfi Nude — Vinil Adesivo Etherna Decor (cód. 160)",
      "description": "Revestimento vinílico autoadesivo Amalfi Nude, família Tecido, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "amalfi nude adesivo, etherna decor amalfi nude, vinil tecido etherna, 160"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "amalfi-off-white",
    "name": "Amalfi Off White",
    "code": "156",
    "family": "tecido",
    "collection": "Amalfi",
    "description": "Padrão Amalfi Off White, da família Tecido da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/amalfi-off-white/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Amalfi Off White — Vinil Adesivo Etherna Decor (cód. 156)",
      "description": "Revestimento vinílico autoadesivo Amalfi Off White, família Tecido, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "amalfi off white adesivo, etherna decor amalfi off white, vinil tecido etherna, 156"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "amalfi-palha",
    "name": "Amalfi Palha",
    "code": "158",
    "family": "tecido",
    "collection": "Amalfi",
    "description": "Padrão Amalfi Palha, da família Tecido da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/amalfi-palha/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Amalfi Palha — Vinil Adesivo Etherna Decor (cód. 158)",
      "description": "Revestimento vinílico autoadesivo Amalfi Palha, família Tecido, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "amalfi palha adesivo, etherna decor amalfi palha, vinil tecido etherna, 158"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "avalon-areia",
    "name": "Avalon Areia",
    "code": "133",
    "family": "tecido",
    "collection": "Avalon",
    "description": "Padrão Avalon Areia, da família Tecido da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/avalon-areia/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Avalon Areia — Vinil Adesivo Etherna Decor (cód. 133)",
      "description": "Revestimento vinílico autoadesivo Avalon Areia, família Tecido, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "avalon areia adesivo, etherna decor avalon areia, vinil tecido etherna, 133"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "avalon-azul-acero",
    "name": "Avalon Azul Acero",
    "code": "138",
    "family": "tecido",
    "collection": "Avalon",
    "description": "Padrão Avalon Azul Acero, da família Tecido da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/avalon-azul-acero/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Avalon Azul Acero — Vinil Adesivo Etherna Decor (cód. 138)",
      "description": "Revestimento vinílico autoadesivo Avalon Azul Acero, família Tecido, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "avalon azul acero adesivo, etherna decor avalon azul acero, vinil tecido etherna, 138"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "avalon-bege-castor",
    "name": "Avalon Bege Castor",
    "code": "134",
    "family": "tecido",
    "collection": "Avalon",
    "description": "Padrão Avalon Bege Castor, da família Tecido da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/avalon-bege-castor/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Avalon Bege Castor — Vinil Adesivo Etherna Decor (cód. 134)",
      "description": "Revestimento vinílico autoadesivo Avalon Bege Castor, família Tecido, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "avalon bege castor adesivo, etherna decor avalon bege castor, vinil tecido etherna, 134"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "avalon-cinza-claro",
    "name": "Avalon Cinza Claro",
    "code": "154",
    "family": "tecido",
    "collection": "Avalon",
    "description": "Padrão Avalon Cinza Claro, da família Tecido da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/avalon-cinza-claro/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Avalon Cinza Claro — Vinil Adesivo Etherna Decor (cód. 154)",
      "description": "Revestimento vinílico autoadesivo Avalon Cinza Claro, família Tecido, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "avalon cinza claro adesivo, etherna decor avalon cinza claro, vinil tecido etherna, 154"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "avalon-mostarda-djon",
    "name": "Avalon Mostarda Djon",
    "code": "135",
    "family": "tecido",
    "collection": "Avalon",
    "description": "Padrão Avalon Mostarda Djon, da família Tecido da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/avalon-mostarda-djon/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Avalon Mostarda Djon — Vinil Adesivo Etherna Decor (cód. 135)",
      "description": "Revestimento vinílico autoadesivo Avalon Mostarda Djon, família Tecido, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "avalon mostarda djon adesivo, etherna decor avalon mostarda djon, vinil tecido etherna, 135"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "avalon-nude-frio",
    "name": "Avalon Nude Frio",
    "code": "136",
    "family": "tecido",
    "collection": "Avalon",
    "description": "Padrão Avalon Nude Frio, da família Tecido da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/avalon-nude-frio/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Avalon Nude Frio — Vinil Adesivo Etherna Decor (cód. 136)",
      "description": "Revestimento vinílico autoadesivo Avalon Nude Frio, família Tecido, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "avalon nude frio adesivo, etherna decor avalon nude frio, vinil tecido etherna, 136"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "avalon-off-white",
    "name": "Avalon Off White",
    "code": "132",
    "family": "tecido",
    "collection": "Avalon",
    "description": "Padrão Avalon Off White, da família Tecido da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/avalon-off-white/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Avalon Off White — Vinil Adesivo Etherna Decor (cód. 132)",
      "description": "Revestimento vinílico autoadesivo Avalon Off White, família Tecido, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "avalon off white adesivo, etherna decor avalon off white, vinil tecido etherna, 132"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "avalon-verde-esmeralda",
    "name": "Avalon Verde Esmeralda",
    "code": "137",
    "family": "tecido",
    "collection": "Avalon",
    "description": "Padrão Avalon Verde Esmeralda, da família Tecido da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/avalon-verde-esmeralda/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Avalon Verde Esmeralda — Vinil Adesivo Etherna Decor (cód. 137)",
      "description": "Revestimento vinílico autoadesivo Avalon Verde Esmeralda, família Tecido, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "avalon verde esmeralda adesivo, etherna decor avalon verde esmeralda, vinil tecido etherna, 137"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "flow-areia",
    "name": "Flow Areia",
    "code": "152",
    "family": "tecido",
    "collection": "Flow",
    "description": "Padrão Flow Areia, da família Tecido da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/flow-areia/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Flow Areia — Vinil Adesivo Etherna Decor (cód. 152)",
      "description": "Revestimento vinílico autoadesivo Flow Areia, família Tecido, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "flow areia adesivo, etherna decor flow areia, vinil tecido etherna, 152"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "flow-cinza-claro",
    "name": "Flow Cinza Claro",
    "code": "155",
    "family": "tecido",
    "collection": "Flow",
    "description": "Padrão Flow Cinza Claro, da família Tecido da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/flow-cinza-claro/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Flow Cinza Claro — Vinil Adesivo Etherna Decor (cód. 155)",
      "description": "Revestimento vinílico autoadesivo Flow Cinza Claro, família Tecido, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "flow cinza claro adesivo, etherna decor flow cinza claro, vinil tecido etherna, 155"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "flow-creme",
    "name": "Flow Creme",
    "code": "153",
    "family": "tecido",
    "collection": "Flow",
    "description": "Padrão Flow Creme, da família Tecido da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/flow-creme/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Flow Creme — Vinil Adesivo Etherna Decor (cód. 153)",
      "description": "Revestimento vinílico autoadesivo Flow Creme, família Tecido, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "flow creme adesivo, etherna decor flow creme, vinil tecido etherna, 153"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "flow-off-white",
    "name": "Flow Off White",
    "code": "151",
    "family": "tecido",
    "collection": "Flow",
    "description": "Padrão Flow Off White, da família Tecido da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/flow-off-white/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Flow Off White — Vinil Adesivo Etherna Decor (cód. 151)",
      "description": "Revestimento vinílico autoadesivo Flow Off White, família Tecido, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "flow off white adesivo, etherna decor flow off white, vinil tecido etherna, 151"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "linem-areia",
    "name": "Linem Areia",
    "code": "67",
    "family": "tecido",
    "collection": "Linem",
    "description": "Padrão Linem Areia, da família Tecido da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/linem-areia/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Linem Areia — Vinil Adesivo Etherna Decor (cód. 67)",
      "description": "Revestimento vinílico autoadesivo Linem Areia, família Tecido, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "linem areia adesivo, etherna decor linem areia, vinil tecido etherna, 67"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "linem-azul-denim",
    "name": "Linem Azul Denim",
    "code": "148",
    "family": "tecido",
    "collection": "Linem",
    "description": "Padrão Linem Azul Denim, da família Tecido da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/linem-azul-denim/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Linem Azul Denim — Vinil Adesivo Etherna Decor (cód. 148)",
      "description": "Revestimento vinílico autoadesivo Linem Azul Denim, família Tecido, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "linem azul denim adesivo, etherna decor linem azul denim, vinil tecido etherna, 148"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "linem-bege-greige",
    "name": "Linem Bege Greige",
    "code": "143",
    "family": "tecido",
    "collection": "Linem",
    "description": "Padrão Linem Bege Greige, da família Tecido da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/linem-bege-greige/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Linem Bege Greige — Vinil Adesivo Etherna Decor (cód. 143)",
      "description": "Revestimento vinílico autoadesivo Linem Bege Greige, família Tecido, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "linem bege greige adesivo, etherna decor linem bege greige, vinil tecido etherna, 143"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "linem-cinza",
    "name": "Linem Cinza",
    "code": "68",
    "family": "tecido",
    "collection": "Linem",
    "description": "Padrão Linem Cinza, da família Tecido da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/linem-cinza/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Linem Cinza — Vinil Adesivo Etherna Decor (cód. 68)",
      "description": "Revestimento vinílico autoadesivo Linem Cinza, família Tecido, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "linem cinza adesivo, etherna decor linem cinza, vinil tecido etherna, 68"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "linem-cinza-claro",
    "name": "Linem Cinza Claro",
    "code": "109",
    "family": "tecido",
    "collection": "Linem",
    "description": "Padrão Linem Cinza Claro, da família Tecido da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/linem-cinza-claro/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Linem Cinza Claro — Vinil Adesivo Etherna Decor (cód. 109)",
      "description": "Revestimento vinílico autoadesivo Linem Cinza Claro, família Tecido, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "linem cinza claro adesivo, etherna decor linem cinza claro, vinil tecido etherna, 109"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "linem-cinza-nevoa",
    "name": "Linem Cinza Névoa",
    "code": "147",
    "family": "tecido",
    "collection": "Linem",
    "description": "Padrão Linem Cinza Névoa, da família Tecido da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/linem-cinza-nevoa/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Linem Cinza Névoa — Vinil Adesivo Etherna Decor (cód. 147)",
      "description": "Revestimento vinílico autoadesivo Linem Cinza Névoa, família Tecido, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "linem cinza névoa adesivo, etherna decor linem cinza névoa, vinil tecido etherna, 147"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "linem-creme",
    "name": "Linem Creme",
    "code": "66",
    "family": "tecido",
    "collection": "Linem",
    "description": "Padrão Linem Creme, da família Tecido da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/linem-creme/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Linem Creme — Vinil Adesivo Etherna Decor (cód. 66)",
      "description": "Revestimento vinílico autoadesivo Linem Creme, família Tecido, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "linem creme adesivo, etherna decor linem creme, vinil tecido etherna, 66"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "linem-cromio",
    "name": "Linem Crômio",
    "code": "146",
    "family": "tecido",
    "collection": "Linem",
    "description": "Padrão Linem Crômio, da família Tecido da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/linem-cromio/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Linem Crômio — Vinil Adesivo Etherna Decor (cód. 146)",
      "description": "Revestimento vinílico autoadesivo Linem Crômio, família Tecido, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "linem crômio adesivo, etherna decor linem crômio, vinil tecido etherna, 146"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "linem-gelo",
    "name": "Linem Gelo",
    "code": "110",
    "family": "tecido",
    "collection": "Linem",
    "description": "Padrão Linem Gelo, da família Tecido da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/linem-gelo/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Linem Gelo — Vinil Adesivo Etherna Decor (cód. 110)",
      "description": "Revestimento vinílico autoadesivo Linem Gelo, família Tecido, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "linem gelo adesivo, etherna decor linem gelo, vinil tecido etherna, 110"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "linem-granizo",
    "name": "Linem Granizo",
    "code": "145",
    "family": "tecido",
    "collection": "Linem",
    "description": "Padrão Linem Granizo, da família Tecido da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/linem-granizo/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Linem Granizo — Vinil Adesivo Etherna Decor (cód. 145)",
      "description": "Revestimento vinílico autoadesivo Linem Granizo, família Tecido, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "linem granizo adesivo, etherna decor linem granizo, vinil tecido etherna, 145"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "linem-nude",
    "name": "Linem Nude",
    "code": "142",
    "family": "tecido",
    "collection": "Linem",
    "description": "Padrão Linem Nude, da família Tecido da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/linem-nude/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Linem Nude — Vinil Adesivo Etherna Decor (cód. 142)",
      "description": "Revestimento vinílico autoadesivo Linem Nude, família Tecido, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "linem nude adesivo, etherna decor linem nude, vinil tecido etherna, 142"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "linem-off-white",
    "name": "Linem Off White",
    "code": "64",
    "family": "tecido",
    "collection": "Linem",
    "description": "Padrão Linem Off White, da família Tecido da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/linem-off-white/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Linem Off White — Vinil Adesivo Etherna Decor (cód. 64)",
      "description": "Revestimento vinílico autoadesivo Linem Off White, família Tecido, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "linem off white adesivo, etherna decor linem off white, vinil tecido etherna, 64"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "linem-palha",
    "name": "Linem Palha",
    "code": "65",
    "family": "tecido",
    "collection": "Linem",
    "description": "Padrão Linem Palha, da família Tecido da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/linem-palha/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Linem Palha — Vinil Adesivo Etherna Decor (cód. 65)",
      "description": "Revestimento vinílico autoadesivo Linem Palha, família Tecido, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "linem palha adesivo, etherna decor linem palha, vinil tecido etherna, 65"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "linem-taupe",
    "name": "Linem Taupe",
    "code": "144",
    "family": "tecido",
    "collection": "Linem",
    "description": "Padrão Linem Taupe, da família Tecido da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "NÃO PROPAGA FOGO",
      "RESISTE A MOFO",
      "ALTA ADESÃO"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/linem-taupe/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Linem Taupe — Vinil Adesivo Etherna Decor (cód. 144)",
      "description": "Revestimento vinílico autoadesivo Linem Taupe, família Tecido, linha Etherna Decor. Indústria nacional, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "linem taupe adesivo, etherna decor linem taupe, vinil tecido etherna, 144"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "rivera-algodao-egipcio",
    "name": "Rivera Algodão Egípcio",
    "code": "170",
    "family": "tecido",
    "collection": "Rivera",
    "description": "Padrão Rivera Algodão Egípcio, da família Tecido da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/rivera-algodao-egipcio/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Rivera Algodão Egípcio — Vinil Adesivo Etherna Decor (cód. 170)",
      "description": "Revestimento vinílico autoadesivo Rivera Algodão Egípcio, família Tecido, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "rivera algodão egípcio adesivo, etherna decor rivera algodão egípcio, vinil tecido etherna, 170"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "rivera-areia",
    "name": "Rivera Areia",
    "code": "166",
    "family": "tecido",
    "collection": "Rivera",
    "description": "Padrão Rivera Areia, da família Tecido da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/rivera-areia/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Rivera Areia — Vinil Adesivo Etherna Decor (cód. 166)",
      "description": "Revestimento vinílico autoadesivo Rivera Areia, família Tecido, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "rivera areia adesivo, etherna decor rivera areia, vinil tecido etherna, 166"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "rivera-bege-greige",
    "name": "Rivera Bege Greige",
    "code": "171",
    "family": "tecido",
    "collection": "Rivera",
    "description": "Padrão Rivera Bege Greige, da família Tecido da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/rivera-bege-greige/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Rivera Bege Greige — Vinil Adesivo Etherna Decor (cód. 171)",
      "description": "Revestimento vinílico autoadesivo Rivera Bege Greige, família Tecido, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "rivera bege greige adesivo, etherna decor rivera bege greige, vinil tecido etherna, 171"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "rivera-cinza-cromio",
    "name": "Rivera Cinza Crômio",
    "code": "173",
    "family": "tecido",
    "collection": "Rivera",
    "description": "Padrão Rivera Cinza Crômio, da família Tecido da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/rivera-cinza-cromio/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Rivera Cinza Crômio — Vinil Adesivo Etherna Decor (cód. 173)",
      "description": "Revestimento vinílico autoadesivo Rivera Cinza Crômio, família Tecido, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "rivera cinza crômio adesivo, etherna decor rivera cinza crômio, vinil tecido etherna, 173"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "rivera-creme",
    "name": "Rivera Creme",
    "code": "168",
    "family": "tecido",
    "collection": "Rivera",
    "description": "Padrão Rivera Creme, da família Tecido da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/rivera-creme/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Rivera Creme — Vinil Adesivo Etherna Decor (cód. 168)",
      "description": "Revestimento vinílico autoadesivo Rivera Creme, família Tecido, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "rivera creme adesivo, etherna decor rivera creme, vinil tecido etherna, 168"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "rivera-fendi",
    "name": "Rivera Fendi",
    "code": "172",
    "family": "tecido",
    "collection": "Rivera",
    "description": "Padrão Rivera Fendi, da família Tecido da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/rivera-fendi/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Rivera Fendi — Vinil Adesivo Etherna Decor (cód. 172)",
      "description": "Revestimento vinílico autoadesivo Rivera Fendi, família Tecido, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "rivera fendi adesivo, etherna decor rivera fendi, vinil tecido etherna, 172"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "rivera-nude",
    "name": "Rivera Nude",
    "code": "169",
    "family": "tecido",
    "collection": "Rivera",
    "description": "Padrão Rivera Nude, da família Tecido da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/rivera-nude/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Rivera Nude — Vinil Adesivo Etherna Decor (cód. 169)",
      "description": "Revestimento vinílico autoadesivo Rivera Nude, família Tecido, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "rivera nude adesivo, etherna decor rivera nude, vinil tecido etherna, 169"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "rivera-off-white",
    "name": "Rivera Off White",
    "code": "165",
    "family": "tecido",
    "collection": "Rivera",
    "description": "Padrão Rivera Off White, da família Tecido da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/rivera-off-white/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Rivera Off White — Vinil Adesivo Etherna Decor (cód. 165)",
      "description": "Revestimento vinílico autoadesivo Rivera Off White, família Tecido, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "rivera off white adesivo, etherna decor rivera off white, vinil tecido etherna, 165"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "rivera-palha",
    "name": "Rivera Palha",
    "code": "167",
    "family": "tecido",
    "collection": "Rivera",
    "description": "Padrão Rivera Palha, da família Tecido da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/rivera-palha/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Rivera Palha — Vinil Adesivo Etherna Decor (cód. 167)",
      "description": "Revestimento vinílico autoadesivo Rivera Palha, família Tecido, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "rivera palha adesivo, etherna decor rivera palha, vinil tecido etherna, 167"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "pincelado-acqua",
    "name": "Pincelado Acqua",
    "code": "31",
    "family": "estampado",
    "collection": "Pincelado",
    "description": "Padrão Pincelado Acqua, da família Estampado da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/pincelado-acqua/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Pincelado Acqua — Vinil Adesivo Etherna Decor (cód. 31)",
      "description": "Revestimento vinílico autoadesivo Pincelado Acqua, família Estampado, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "pincelado acqua adesivo, etherna decor pincelado acqua, vinil estampado etherna, 31"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "chevron-soft-gold",
    "name": "Chevron Soft Gold",
    "code": "140",
    "family": "geometrico",
    "collection": "Chevron",
    "description": "Padrão Chevron Soft Gold, da família Geométrico da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/chevron-soft-gold/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Chevron Soft Gold — Vinil Adesivo Etherna Decor (cód. 140)",
      "description": "Revestimento vinílico autoadesivo Chevron Soft Gold, família Geométrico, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "chevron soft gold adesivo, etherna decor chevron soft gold, vinil geométrico etherna, 140"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "chevron-white-pearl",
    "name": "Chevron White Pearl",
    "code": "139",
    "family": "geometrico",
    "collection": "Chevron",
    "description": "Padrão Chevron White Pearl, da família Geométrico da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/chevron-white-pearl/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Chevron White Pearl — Vinil Adesivo Etherna Decor (cód. 139)",
      "description": "Revestimento vinílico autoadesivo Chevron White Pearl, família Geométrico, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "chevron white pearl adesivo, etherna decor chevron white pearl, vinil geométrico etherna, 139"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "cubo-geometrico-marmorizado-ouro",
    "name": "Cubo Geométrico Marmorizado Ouro",
    "code": "18",
    "family": "geometrico",
    "collection": "Cubo",
    "description": "Padrão Cubo Geométrico Marmorizado Ouro, da família Geométrico da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/cubo-geometrico-marmorizado-ouro/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Cubo Geométrico Marmorizado Ouro — Vinil Adesivo Etherna Decor (cód. 18)",
      "description": "Revestimento vinílico autoadesivo Cubo Geométrico Marmorizado Ouro, família Geométrico, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "cubo geométrico marmorizado ouro adesivo, etherna decor cubo geométrico marmorizado ouro, vinil geométrico etherna, 18"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  },
  {
    "slug": "cubo-geometrico-marmorizado-rose",
    "name": "Cubo Geométrico Marmorizado Rose",
    "code": "17",
    "family": "geometrico",
    "collection": "Cubo",
    "description": "Padrão Cubo Geométrico Marmorizado Rose, da família Geométrico da linha Etherna Decor. Vinil autoadesivo polimérico calandrado produzido no Brasil, com frontal de 160 micras e proteção Sistema Shield® — antifúngico, bactericida e que não propaga chamas. Indicado para revestimento de móveis, paredes, portas, eletrodomésticos e superfícies em geral.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras (dupla camada)"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel couché 120 g/m² siliconado"
      },
      {
        "label": "Adesivo",
        "value": "Cola acrílica aquosa permanente de alta adesão"
      },
      {
        "label": "Durabilidade",
        "value": "08 anos interno · 04 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Sistema Shield® — antifúngico, bactericida, não propaga fogo"
      }
    ],
    "badges": [
      "SISTEMA SHIELD®",
      "ANTIFÚNGICO · BACTERICIDA",
      "NÃO PROPAGA FOGO",
      "INDÚSTRIA NACIONAL"
    ],
    "images": {
      "texture": "/assets/images/decor/etherna/cubo-geometrico-marmorizado-rose/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Cubo Geométrico Marmorizado Rose — Vinil Adesivo Etherna Decor (cód. 17)",
      "description": "Revestimento vinílico autoadesivo Cubo Geométrico Marmorizado Rose, família Geométrico, linha Etherna Decor. Indústria nacional, Sistema Shield®, rolo 1,22 m × 25 m. Orçamento com a NZDecor.",
      "keywords": "cubo geométrico marmorizado rose adesivo, etherna decor cubo geométrico marmorizado rose, vinil geométrico etherna, 17"
    },
    "sourceUrl": "https://ethernaprodutos.com.br/linha-adesivos/etherna-decor/"
  }
];

export const getEthernaProductBySlug = (slug?: string) =>
  ethernaProducts.find((p) => p.slug === slug);

export const getEthernaProductsByFamily = (family: EthernaFamilySlug) =>
  ethernaProducts.filter((p) => p.family === family);

export const getEthernaFamilyBySlug = (slug?: string) =>
  ethernaFamilies.find((f) => f.slug === slug);
