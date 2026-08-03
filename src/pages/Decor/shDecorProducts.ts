// Catálogo SH Decor — GERADO a partir de scripts/data/sh-decor/*.json
// (scripts/generate-sh-decor.mjs). Edite os JSONs e regenere; não edite à mão.

export type ShDecorFamilySlug =
  | 'madeira'
  | 'pedra'
  | 'cimento'
  | 'couro'
  | 'tecido'
  | 'solido'
  | 'piso'
  | 'tijolo';

export type ShDecorFamily = {
  slug: ShDecorFamilySlug;
  name: string;
  description: string;
};

export type ShDecorSpec = { label: string; value: string };

export type ShDecorProduct = {
  slug: string;
  name: string;
  code: string;
  family: ShDecorFamilySlug;
  description: string;
  specs: ShDecorSpec[];
  badges?: string[];
  images: {
    texture: string;
    ambient: string[];
  };
  seo: { title: string; description: string; keywords: string };
  sourceUrl?: string;
};

export const SH_DEFAULT_BADGES = ['ATÓXICO', 'BUBBLE FREE', 'LAVÁVEL', 'REALISMO ATÉ NO TOQUE'];

export const shDecorFamilies: ShDecorFamily[] = [
  { slug: 'madeira', name: 'Madeira', description: 'Carvalhos, freijós, freixos e madeiras nobres com veio e toque realistas.' },
  { slug: 'pedra', name: 'Pedra', description: 'Mármores, travertinos e pedras naturais para bancadas, paredes e painéis.' },
  { slug: 'cimento', name: 'Cimento', description: 'Cimento queimado e concreto para o acabamento industrial contemporâneo.' },
  { slug: 'couro', name: 'Couro', description: 'Texturas de couro para cabeceiras, painéis e mobiliário de alto padrão.' },
  { slug: 'tecido', name: 'Tecido', description: 'Linhos e tramas têxteis que aquecem ambientes residenciais e corporativos.' },
  { slug: 'solido', name: 'Sólido', description: 'Cores sólidas e fórmicas para padronização limpa de móveis e superfícies.' },
  { slug: 'piso', name: 'Piso', description: 'Padrões desenvolvidos para renovação de pisos internos.' },
  { slug: 'tijolo', name: 'Tijolo', description: 'Tijolinhos aparentes para composições rústicas e industriais.' },
];

export const shDecorProducts: ShDecorProduct[] = [
  {
    "slug": "acacia",
    "name": "Acácia",
    "code": "IT 403",
    "family": "madeira",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Acácia, da família Madeira, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/acacia/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/acacia/ambient-1.jpg",
        "/assets/images/decor/sh/acacia/ambient-2.jpg",
        "/assets/images/decor/sh/acacia/ambient-3.jpg"
      ]
    },
    "seo": {
      "title": "Acácia — Vinil Decorativo SH Decor (IT 403)",
      "description": "Revestimento de vinil autoadesivo Acácia (IT 403), família Madeira. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "acácia vinil adesivo, sh decor acácia, revestimento madeira adesivo, IT 403"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/acacia-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "carvalho",
    "name": "Carvalho",
    "code": "IT 334",
    "family": "madeira",
    "description": "Padrão Carvalho, da família Madeira, desenvolvido para ambientes internos. Termo moldável, garante acabamento perfeito mesmo em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas e eletrodomésticos. Contraindicado apenas para pisos e áreas externas.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Cor do Adesivo (Fundo)",
        "value": "Transparente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Largura do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1,56m (só rolo 123cm), 3,12m, 6,25m, 12,5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/carvalho/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/carvalho/ambient-1.jpg",
        "/assets/images/decor/sh/carvalho/ambient-2.jpg",
        "/assets/images/decor/sh/carvalho/ambient-3.jpg"
      ]
    },
    "seo": {
      "title": "Carvalho — Vinil Decorativo SH Decor (IT 334)",
      "description": "Revestimento de vinil autoadesivo Carvalho (IT 334), família Madeira. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "carvalho vinil adesivo, sh decor carvalho, revestimento madeira adesivo, IT 334"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/carvalho-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "carvalho-avela",
    "name": "Carvalho Avelã",
    "code": "IT 614",
    "family": "madeira",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Carvalho Avelã da família Madeira, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/carvalho-avela/texture.jpg",
      "ambient": []
    },
    "seo": {
      "title": "Carvalho Avelã — Vinil Decorativo SH Decor (IT 614)",
      "description": "Revestimento de vinil autoadesivo Carvalho Avelã (IT 614), família Madeira. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "carvalho avelã vinil adesivo, sh decor carvalho avelã, revestimento madeira adesivo, IT 614"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/carvalho-avela-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "carvalho-branco",
    "name": "Carvalho Branco",
    "code": "SD 910-1",
    "family": "madeira",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Carvalho Branco, da família Madeira, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/carvalho-branco/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/carvalho-branco/ambient-1.jpg"
      ]
    },
    "seo": {
      "title": "Carvalho Branco — Vinil Decorativo SH Decor (SD 910-1)",
      "description": "Revestimento de vinil autoadesivo Carvalho Branco (SD 910-1), família Madeira. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "carvalho branco vinil adesivo, sh decor carvalho branco, revestimento madeira adesivo, SD 910-1"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/carvalho-branco-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "carvalho-preto",
    "name": "Carvalho Preto",
    "code": "IT 619",
    "family": "madeira",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Carvalho Preto, da família Madeira, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/carvalho-preto/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/carvalho-preto/ambient-1.jpg",
        "/assets/images/decor/sh/carvalho-preto/ambient-2.jpg"
      ]
    },
    "seo": {
      "title": "Carvalho Preto — Vinil Decorativo SH Decor (IT 619)",
      "description": "Revestimento de vinil autoadesivo Carvalho Preto (IT 619), família Madeira. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "carvalho preto vinil adesivo, sh decor carvalho preto, revestimento madeira adesivo, IT 619"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/carvalho-preto-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "carvalho-sonoma",
    "name": "Carvalho Sonoma",
    "code": "IT 424",
    "family": "madeira",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Carvalho Sonoma, da família Madeira, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/carvalho-sonoma/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/carvalho-sonoma/ambient-1.jpg",
        "/assets/images/decor/sh/carvalho-sonoma/ambient-2.jpg",
        "/assets/images/decor/sh/carvalho-sonoma/ambient-3.jpg"
      ]
    },
    "seo": {
      "title": "Carvalho Sonoma — Vinil Decorativo SH Decor (IT 424)",
      "description": "Revestimento de vinil autoadesivo Carvalho Sonoma (IT 424), família Madeira. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "carvalho sonoma vinil adesivo, sh decor carvalho sonoma, revestimento madeira adesivo, IT 424"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/carvalho-sonoma-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "cedro",
    "name": "Cedro",
    "code": "IT 252",
    "family": "madeira",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Cedro, da família Madeira, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/cedro/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/cedro/ambient-1.jpg",
        "/assets/images/decor/sh/cedro/ambient-2.jpg",
        "/assets/images/decor/sh/cedro/ambient-3.jpg"
      ]
    },
    "seo": {
      "title": "Cedro — Vinil Decorativo SH Decor (IT 252)",
      "description": "Revestimento de vinil autoadesivo Cedro (IT 252), família Madeira. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "cedro vinil adesivo, sh decor cedro, revestimento madeira adesivo, IT 252"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/cedro-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "cedro-amarelo",
    "name": "Cedro Amarelo",
    "code": "IT 251",
    "family": "madeira",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor Cedro Amarelo, da família Madeira, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/cedro-amarelo/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/cedro-amarelo/ambient-1.jpg",
        "/assets/images/decor/sh/cedro-amarelo/ambient-2.jpg",
        "/assets/images/decor/sh/cedro-amarelo/ambient-3.jpg"
      ]
    },
    "seo": {
      "title": "Cedro Amarelo — Vinil Decorativo SH Decor (IT 251)",
      "description": "Revestimento de vinil autoadesivo Cedro Amarelo (IT 251), família Madeira. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "cedro amarelo vinil adesivo, sh decor cedro amarelo, revestimento madeira adesivo, IT 251"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/cedro-amarelo-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "cerejeira-amendoa",
    "name": "Cerejeira Amêndoa",
    "code": "IT 232",
    "family": "madeira",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Cerejeira Amêndoa, da família Madeira, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/cerejeira-amendoa/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/cerejeira-amendoa/ambient-1.jpg",
        "/assets/images/decor/sh/cerejeira-amendoa/ambient-2.jpg",
        "/assets/images/decor/sh/cerejeira-amendoa/ambient-3.jpg"
      ]
    },
    "seo": {
      "title": "Cerejeira Amêndoa — Vinil Decorativo SH Decor (IT 232)",
      "description": "Revestimento de vinil autoadesivo Cerejeira Amêndoa (IT 232), família Madeira. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "cerejeira amêndoa vinil adesivo, sh decor cerejeira amêndoa, revestimento madeira adesivo, IT 232"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/cerejeira-amendoa-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "cerejeira-rosa",
    "name": "Cerejeira Rosa",
    "code": "IT 124",
    "family": "madeira",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Cerejeira Rosa, da família Madeira, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/cerejeira-rosa/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/cerejeira-rosa/ambient-1.jpg",
        "/assets/images/decor/sh/cerejeira-rosa/ambient-2.jpg",
        "/assets/images/decor/sh/cerejeira-rosa/ambient-3.jpg"
      ]
    },
    "seo": {
      "title": "Cerejeira Rosa — Vinil Decorativo SH Decor (IT 124)",
      "description": "Revestimento de vinil autoadesivo Cerejeira Rosa (IT 124), família Madeira. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "cerejeira rosa vinil adesivo, sh decor cerejeira rosa, revestimento madeira adesivo, IT 124"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/cerejeira-rosa-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "freijo-amazonas",
    "name": "Freijó Amazonas",
    "code": "IT 205",
    "family": "madeira",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Feijó Amazonas da família Madeira, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Cor do Adesivo (Fundo)",
        "value": "Transparente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/freijo-amazonas/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/freijo-amazonas/ambient-1.jpg",
        "/assets/images/decor/sh/freijo-amazonas/ambient-2.jpg",
        "/assets/images/decor/sh/freijo-amazonas/ambient-3.jpg"
      ]
    },
    "seo": {
      "title": "Freijó Amazonas — Vinil Decorativo SH Decor (IT 205)",
      "description": "Revestimento de vinil autoadesivo Freijó Amazonas (IT 205), família Madeira. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "freijó amazonas vinil adesivo, sh decor freijó amazonas, revestimento madeira adesivo, IT 205"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/freijo-amazonas-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "freijo-natural",
    "name": "Freijó Natural",
    "code": "IT 339",
    "family": "madeira",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Feijó Natural da família Madeira, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/freijo-natural/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/freijo-natural/ambient-1.jpg",
        "/assets/images/decor/sh/freijo-natural/ambient-2.jpg",
        "/assets/images/decor/sh/freijo-natural/ambient-3.jpg"
      ]
    },
    "seo": {
      "title": "Freijó Natural — Vinil Decorativo SH Decor (IT 339)",
      "description": "Revestimento de vinil autoadesivo Freijó Natural (IT 339), família Madeira. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "freijó natural vinil adesivo, sh decor freijó natural, revestimento madeira adesivo, IT 339"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/freijo-natural-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "freijo-real",
    "name": "Freijó Real",
    "code": "IPW 511",
    "family": "madeira",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor Freijó Real, da família Madeira, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/freijo-real/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/freijo-real/ambient-1.jpg",
        "/assets/images/decor/sh/freijo-real/ambient-2.jpg",
        "/assets/images/decor/sh/freijo-real/ambient-3.jpg"
      ]
    },
    "seo": {
      "title": "Freijó Real — Vinil Decorativo SH Decor (IPW 511)",
      "description": "Revestimento de vinil autoadesivo Freijó Real (IPW 511), família Madeira. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "freijó real vinil adesivo, sh decor freijó real, revestimento madeira adesivo, IPW 511"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/freijo-real-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "freixo-amarelo",
    "name": "Freixo Amarelo",
    "code": "IT 235",
    "family": "madeira",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Freixo Amarelo, da família Madeira, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/freixo-amarelo/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/freixo-amarelo/ambient-1.jpg",
        "/assets/images/decor/sh/freixo-amarelo/ambient-2.jpg"
      ]
    },
    "seo": {
      "title": "Freixo Amarelo — Vinil Decorativo SH Decor (IT 235)",
      "description": "Revestimento de vinil autoadesivo Freixo Amarelo (IT 235), família Madeira. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "freixo amarelo vinil adesivo, sh decor freixo amarelo, revestimento madeira adesivo, IT 235"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/freixo-amarelo-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "freixo-bege",
    "name": "Freixo Bege",
    "code": "IT 253",
    "family": "madeira",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Freixo Bege, da família Madeira, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/freixo-bege/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/freixo-bege/ambient-1.jpg",
        "/assets/images/decor/sh/freixo-bege/ambient-2.jpg",
        "/assets/images/decor/sh/freixo-bege/ambient-3.jpg"
      ]
    },
    "seo": {
      "title": "Freixo Bege — Vinil Decorativo SH Decor (IT 253)",
      "description": "Revestimento de vinil autoadesivo Freixo Bege (IT 253), família Madeira. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "freixo bege vinil adesivo, sh decor freixo bege, revestimento madeira adesivo, IT 253"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/freixo-bege-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "freixo-cinza",
    "name": "Freixo Cinza",
    "code": "IT 250",
    "family": "madeira",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Freixo Cinza, da família Madeira, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/freixo-cinza/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/freixo-cinza/ambient-1.jpg",
        "/assets/images/decor/sh/freixo-cinza/ambient-2.jpg",
        "/assets/images/decor/sh/freixo-cinza/ambient-3.jpg"
      ]
    },
    "seo": {
      "title": "Freixo Cinza — Vinil Decorativo SH Decor (IT 250)",
      "description": "Revestimento de vinil autoadesivo Freixo Cinza (IT 250), família Madeira. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "freixo cinza vinil adesivo, sh decor freixo cinza, revestimento madeira adesivo, IT 250"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/freixo-cinza-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "freixo-marrom",
    "name": "Freixo Marrom",
    "code": "IT 236",
    "family": "madeira",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Freixo Marrom, da família Madeira, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/freixo-marrom/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/freixo-marrom/ambient-1.jpg",
        "/assets/images/decor/sh/freixo-marrom/ambient-2.jpg",
        "/assets/images/decor/sh/freixo-marrom/ambient-3.jpg"
      ]
    },
    "seo": {
      "title": "Freixo Marrom — Vinil Decorativo SH Decor (IT 236)",
      "description": "Revestimento de vinil autoadesivo Freixo Marrom (IT 236), família Madeira. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "freixo marrom vinil adesivo, sh decor freixo marrom, revestimento madeira adesivo, IT 236"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/freixo-marrom-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "nogal-peruano",
    "name": "Nogal Peruano",
    "code": "IT 254",
    "family": "madeira",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Nogal Peruano, da família Madeira, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/nogal-peruano/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/nogal-peruano/ambient-1.jpg",
        "/assets/images/decor/sh/nogal-peruano/ambient-2.jpg",
        "/assets/images/decor/sh/nogal-peruano/ambient-3.jpg"
      ]
    },
    "seo": {
      "title": "Nogal Peruano — Vinil Decorativo SH Decor (IT 254)",
      "description": "Revestimento de vinil autoadesivo Nogal Peruano (IT 254), família Madeira. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "nogal peruano vinil adesivo, sh decor nogal peruano, revestimento madeira adesivo, IT 254"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/nogal-peruano-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "peroba",
    "name": "Peroba",
    "code": "ITA 436",
    "family": "madeira",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Peroba, da família Madeira, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/peroba/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/peroba/ambient-1.jpg",
        "/assets/images/decor/sh/peroba/ambient-2.jpg",
        "/assets/images/decor/sh/peroba/ambient-3.jpg"
      ]
    },
    "seo": {
      "title": "Peroba — Vinil Decorativo SH Decor (ITA 436)",
      "description": "Revestimento de vinil autoadesivo Peroba (ITA 436), família Madeira. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "peroba vinil adesivo, sh decor peroba, revestimento madeira adesivo, ITA 436"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/peroba-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "pinho-ancestral",
    "name": "Pinho Ancestral",
    "code": "IPW 838",
    "family": "madeira",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Pinho Ancestral, da família Madeira, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Cor do Adesivo (Fundo)",
        "value": "Transparente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/pinho-ancestral/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/pinho-ancestral/ambient-1.jpg",
        "/assets/images/decor/sh/pinho-ancestral/ambient-2.jpg",
        "/assets/images/decor/sh/pinho-ancestral/ambient-3.jpg"
      ]
    },
    "seo": {
      "title": "Pinho Ancestral — Vinil Decorativo SH Decor (IPW 838)",
      "description": "Revestimento de vinil autoadesivo Pinho Ancestral (IPW 838), família Madeira. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "pinho ancestral vinil adesivo, sh decor pinho ancestral, revestimento madeira adesivo, IPW 838"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/pinho-ancestral-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "pinho-chileno",
    "name": "Pinho Chileno",
    "code": "IT 205-1",
    "family": "madeira",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Pinho Chileno da família Madeira, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/pinho-chileno/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/pinho-chileno/ambient-1.jpg",
        "/assets/images/decor/sh/pinho-chileno/ambient-2.jpg",
        "/assets/images/decor/sh/pinho-chileno/ambient-3.jpg"
      ]
    },
    "seo": {
      "title": "Pinho Chileno — Vinil Decorativo SH Decor (IT 205-1)",
      "description": "Revestimento de vinil autoadesivo Pinho Chileno (IT 205-1), família Madeira. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "pinho chileno vinil adesivo, sh decor pinho chileno, revestimento madeira adesivo, IT 205-1"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/pinho-chileno-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "tabaco",
    "name": "Tabaco",
    "code": "IT 307",
    "family": "madeira",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Tabaco, da família Madeira, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Cor do Adesivo (Fundo)",
        "value": "Transparente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/tabaco/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/tabaco/ambient-1.jpg",
        "/assets/images/decor/sh/tabaco/ambient-2.jpg",
        "/assets/images/decor/sh/tabaco/ambient-3.jpg"
      ]
    },
    "seo": {
      "title": "Tabaco — Vinil Decorativo SH Decor (IT 307)",
      "description": "Revestimento de vinil autoadesivo Tabaco (IT 307), família Madeira. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "tabaco vinil adesivo, sh decor tabaco, revestimento madeira adesivo, IT 307"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/tabaco-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "carrara-fosco",
    "name": "Carrara Fosco",
    "code": "IP 413-12",
    "family": "pedra",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Carrara Fosco, da família Pedra, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/carrara-fosco/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/carrara-fosco/ambient-1.jpg",
        "/assets/images/decor/sh/carrara-fosco/ambient-2.jpg",
        "/assets/images/decor/sh/carrara-fosco/ambient-3.jpg"
      ]
    },
    "seo": {
      "title": "Carrara Fosco — Vinil Decorativo SH Decor (IP 413-12)",
      "description": "Revestimento de vinil autoadesivo Carrara Fosco (IP 413-12), família Pedra. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "carrara fosco vinil adesivo, sh decor carrara fosco, revestimento pedra adesivo, IP 413-12"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/carrara-fosco-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "granilite-marfim",
    "name": "Granilite Marfim",
    "code": "PCR 512",
    "family": "pedra",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Granilite Marfim da família Pedra, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/granilite-marfim/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/granilite-marfim/ambient-1.jpg",
        "/assets/images/decor/sh/granilite-marfim/ambient-2.jpg",
        "/assets/images/decor/sh/granilite-marfim/ambient-3.jpg"
      ]
    },
    "seo": {
      "title": "Granilite Marfim — Vinil Decorativo SH Decor (PCR 512)",
      "description": "Revestimento de vinil autoadesivo Granilite Marfim (PCR 512), família Pedra. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "granilite marfim vinil adesivo, sh decor granilite marfim, revestimento pedra adesivo, PCR 512"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/granilite-marfim-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "mambo",
    "name": "Mambo",
    "code": "IP 413-9",
    "family": "pedra",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Mambo, da família Pedra, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/mambo/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/mambo/ambient-1.jpg",
        "/assets/images/decor/sh/mambo/ambient-2.jpg",
        "/assets/images/decor/sh/mambo/ambient-3.jpg"
      ]
    },
    "seo": {
      "title": "Mambo — Vinil Decorativo SH Decor (IP 413-9)",
      "description": "Revestimento de vinil autoadesivo Mambo (IP 413-9), família Pedra. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "mambo vinil adesivo, sh decor mambo, revestimento pedra adesivo, IP 413-9"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/mambo-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "marrom-imperial",
    "name": "Marrom Imperial",
    "code": "IP 402",
    "family": "pedra",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Marrom Imperial, da família Pedra, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/marrom-imperial/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/marrom-imperial/ambient-1.jpg",
        "/assets/images/decor/sh/marrom-imperial/ambient-2.jpg",
        "/assets/images/decor/sh/marrom-imperial/ambient-3.jpg"
      ]
    },
    "seo": {
      "title": "Marrom Imperial — Vinil Decorativo SH Decor (IP 402)",
      "description": "Revestimento de vinil autoadesivo Marrom Imperial (IP 402), família Pedra. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "marrom imperial vinil adesivo, sh decor marrom imperial, revestimento pedra adesivo, IP 402"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/marrom-imperial-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "preto-indiano",
    "name": "Preto Indiano",
    "code": "IP 401",
    "family": "pedra",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Preto Indiano, da família Pedra, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/preto-indiano/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/preto-indiano/ambient-1.jpg",
        "/assets/images/decor/sh/preto-indiano/ambient-2.jpg",
        "/assets/images/decor/sh/preto-indiano/ambient-3.jpg"
      ]
    },
    "seo": {
      "title": "Preto Indiano — Vinil Decorativo SH Decor (IP 401)",
      "description": "Revestimento de vinil autoadesivo Preto Indiano (IP 401), família Pedra. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "preto indiano vinil adesivo, sh decor preto indiano, revestimento pedra adesivo, IP 401"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/preto-indiano-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "travertino-bege",
    "name": "Travertino Bege",
    "code": "IP 413-8",
    "family": "pedra",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Travertino Bege, da família Pedra, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/travertino-bege/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/travertino-bege/ambient-1.jpg",
        "/assets/images/decor/sh/travertino-bege/ambient-2.jpg",
        "/assets/images/decor/sh/travertino-bege/ambient-3.jpg"
      ]
    },
    "seo": {
      "title": "Travertino Bege — Vinil Decorativo SH Decor (IP 413-8)",
      "description": "Revestimento de vinil autoadesivo Travertino Bege (IP 413-8), família Pedra. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "travertino bege vinil adesivo, sh decor travertino bege, revestimento pedra adesivo, IP 413-8"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/travertino-bege-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "travertino-brilho",
    "name": "Travertino Brilho",
    "code": "IP 413-3",
    "family": "pedra",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Travertino Brilho, da família Pedra, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/travertino-brilho/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/travertino-brilho/ambient-1.jpg",
        "/assets/images/decor/sh/travertino-brilho/ambient-2.jpg"
      ]
    },
    "seo": {
      "title": "Travertino Brilho — Vinil Decorativo SH Decor (IP 413-3)",
      "description": "Revestimento de vinil autoadesivo Travertino Brilho (IP 413-3), família Pedra. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "travertino brilho vinil adesivo, sh decor travertino brilho, revestimento pedra adesivo, IP 413-3"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/travertino-brilho-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "cimento-natural",
    "name": "Cimento Natural",
    "code": "IPW 561",
    "family": "cimento",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Cimento Natural, da família Cimento, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/cimento-natural/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/cimento-natural/ambient-1.jpg",
        "/assets/images/decor/sh/cimento-natural/ambient-2.jpg",
        "/assets/images/decor/sh/cimento-natural/ambient-3.jpg"
      ]
    },
    "seo": {
      "title": "Cimento Natural — Vinil Decorativo SH Decor (IPW 561)",
      "description": "Revestimento de vinil autoadesivo Cimento Natural (IPW 561), família Cimento. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "cimento natural vinil adesivo, sh decor cimento natural, revestimento cimento adesivo, IPW 561"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/cimento-natural-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "cimento-queimado",
    "name": "Cimento Queimado",
    "code": "IPW 557",
    "family": "cimento",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Cimento Queimado, da família Cimento, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/cimento-queimado/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/cimento-queimado/ambient-1.jpg",
        "/assets/images/decor/sh/cimento-queimado/ambient-2.jpg",
        "/assets/images/decor/sh/cimento-queimado/ambient-3.jpg"
      ]
    },
    "seo": {
      "title": "Cimento Queimado — Vinil Decorativo SH Decor (IPW 557)",
      "description": "Revestimento de vinil autoadesivo Cimento Queimado (IPW 557), família Cimento. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "cimento queimado vinil adesivo, sh decor cimento queimado, revestimento cimento adesivo, IPW 557"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/cimento-queimado-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "cimento-texturizado-oliva",
    "name": "Cimento Texturizado Oliva",
    "code": "PCR 511",
    "family": "cimento",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Cimento Texturizado Oliva, da família Cimento, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/cimento-texturizado-oliva/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/cimento-texturizado-oliva/ambient-1.jpg",
        "/assets/images/decor/sh/cimento-texturizado-oliva/ambient-2.jpg",
        "/assets/images/decor/sh/cimento-texturizado-oliva/ambient-3.jpg"
      ]
    },
    "seo": {
      "title": "Cimento Texturizado Oliva — Vinil Decorativo SH Decor (PCR 511)",
      "description": "Revestimento de vinil autoadesivo Cimento Texturizado Oliva (PCR 511), família Cimento. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "cimento texturizado oliva vinil adesivo, sh decor cimento texturizado oliva, revestimento cimento adesivo, PCR 511"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/cimento-texturizado-oliva-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "concreto",
    "name": "Concreto",
    "code": "IPW 558",
    "family": "cimento",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Concreto, da família Cimento, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/concreto/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/concreto/ambient-1.jpg",
        "/assets/images/decor/sh/concreto/ambient-2.jpg"
      ]
    },
    "seo": {
      "title": "Concreto — Vinil Decorativo SH Decor (IPW 558)",
      "description": "Revestimento de vinil autoadesivo Concreto (IPW 558), família Cimento. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "concreto vinil adesivo, sh decor concreto, revestimento cimento adesivo, IPW 558"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/concreto-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "couro-branco",
    "name": "Couro Branco",
    "code": "SD 941",
    "family": "couro",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Couro Branco, da família Couro, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/couro-branco/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/couro-branco/ambient-1.jpg"
      ]
    },
    "seo": {
      "title": "Couro Branco — Vinil Decorativo SH Decor (SD 941)",
      "description": "Revestimento de vinil autoadesivo Couro Branco (SD 941), família Couro. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "couro branco vinil adesivo, sh decor couro branco, revestimento couro adesivo, SD 941"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/couro-branco-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "couro-natural",
    "name": "Couro Natural",
    "code": "IE 029",
    "family": "couro",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Couro Natural, da família Couro, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/couro-natural/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/couro-natural/ambient-1.jpg",
        "/assets/images/decor/sh/couro-natural/ambient-2.jpg",
        "/assets/images/decor/sh/couro-natural/ambient-3.jpg"
      ]
    },
    "seo": {
      "title": "Couro Natural — Vinil Decorativo SH Decor (IE 029)",
      "description": "Revestimento de vinil autoadesivo Couro Natural (IE 029), família Couro. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "couro natural vinil adesivo, sh decor couro natural, revestimento couro adesivo, IE 029"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/couro-natural-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "couro-off-white",
    "name": "Couro Off White",
    "code": "SD 947",
    "family": "couro",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Couro Off White, da família Couro, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/couro-off-white/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/couro-off-white/ambient-1.jpg",
        "/assets/images/decor/sh/couro-off-white/ambient-2.jpg"
      ]
    },
    "seo": {
      "title": "Couro Off White — Vinil Decorativo SH Decor (SD 947)",
      "description": "Revestimento de vinil autoadesivo Couro Off White (SD 947), família Couro. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "couro off white vinil adesivo, sh decor couro off white, revestimento couro adesivo, SD 947"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/couro-off-white-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "couro-preto",
    "name": "Couro Preto",
    "code": "SD 948",
    "family": "couro",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Couro Preto, da família Couro, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/couro-preto/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/couro-preto/ambient-1.jpg",
        "/assets/images/decor/sh/couro-preto/ambient-2.jpg",
        "/assets/images/decor/sh/couro-preto/ambient-3.jpg"
      ]
    },
    "seo": {
      "title": "Couro Preto — Vinil Decorativo SH Decor (SD 948)",
      "description": "Revestimento de vinil autoadesivo Couro Preto (SD 948), família Couro. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "couro preto vinil adesivo, sh decor couro preto, revestimento couro adesivo, SD 948"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/couro-preto-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "linho",
    "name": "Linho",
    "code": "IPW 551",
    "family": "tecido",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Linho, da família Tecido, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/linho/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/linho/ambient-1.jpg",
        "/assets/images/decor/sh/linho/ambient-2.jpg"
      ]
    },
    "seo": {
      "title": "Linho — Vinil Decorativo SH Decor (IPW 551)",
      "description": "Revestimento de vinil autoadesivo Linho (IPW 551), família Tecido. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "linho vinil adesivo, sh decor linho, revestimento tecido adesivo, IPW 551"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/linho-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "linho-azulado",
    "name": "Linho Azulado",
    "code": "IE 070",
    "family": "tecido",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Linho Azulado, da família Tecido, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/linho-azulado/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/linho-azulado/ambient-1.jpg",
        "/assets/images/decor/sh/linho-azulado/ambient-2.jpg",
        "/assets/images/decor/sh/linho-azulado/ambient-3.jpg"
      ]
    },
    "seo": {
      "title": "Linho Azulado — Vinil Decorativo SH Decor (IE 070)",
      "description": "Revestimento de vinil autoadesivo Linho Azulado (IE 070), família Tecido. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "linho azulado vinil adesivo, sh decor linho azulado, revestimento tecido adesivo, IE 070"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/linho-azulado-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "palha",
    "name": "Palha",
    "code": "IPW 552",
    "family": "tecido",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Palha, da família Tecido, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/palha/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/palha/ambient-1.jpg",
        "/assets/images/decor/sh/palha/ambient-2.jpg",
        "/assets/images/decor/sh/palha/ambient-3.jpg"
      ]
    },
    "seo": {
      "title": "Palha — Vinil Decorativo SH Decor (IPW 552)",
      "description": "Revestimento de vinil autoadesivo Palha (IPW 552), família Tecido. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "palha vinil adesivo, sh decor palha, revestimento tecido adesivo, IPW 552"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/palha-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "romano-artico",
    "name": "Romano Ártico",
    "code": "IPW 701",
    "family": "tecido",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Romano Ártico da família Tecido, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Cor do Adesivo (Fundo)",
        "value": "Transparente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/romano-artico/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/romano-artico/ambient-1.jpg",
        "/assets/images/decor/sh/romano-artico/ambient-2.jpg",
        "/assets/images/decor/sh/romano-artico/ambient-3.jpg"
      ]
    },
    "seo": {
      "title": "Romano Ártico — Vinil Decorativo SH Decor (IPW 701)",
      "description": "Revestimento de vinil autoadesivo Romano Ártico (IPW 701), família Tecido. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "romano ártico vinil adesivo, sh decor romano ártico, revestimento tecido adesivo, IPW 701"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/romano-artico-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "savana-bege",
    "name": "Savana Bege",
    "code": "IPW 702",
    "family": "tecido",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Savana Bege da família Tecido, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/savana-bege/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/savana-bege/ambient-1.jpg",
        "/assets/images/decor/sh/savana-bege/ambient-2.jpg",
        "/assets/images/decor/sh/savana-bege/ambient-3.jpg"
      ]
    },
    "seo": {
      "title": "Savana Bege — Vinil Decorativo SH Decor (IPW 702)",
      "description": "Revestimento de vinil autoadesivo Savana Bege (IPW 702), família Tecido. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "savana bege vinil adesivo, sh decor savana bege, revestimento tecido adesivo, IPW 702"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/savana-bege-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "tricoline-bege",
    "name": "Tricoline Bege",
    "code": "IT 153",
    "family": "tecido",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Trcoline Bege, da família Tecido, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/tricoline-bege/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/tricoline-bege/ambient-1.jpg",
        "/assets/images/decor/sh/tricoline-bege/ambient-2.jpg",
        "/assets/images/decor/sh/tricoline-bege/ambient-3.jpg"
      ]
    },
    "seo": {
      "title": "Tricoline Bege — Vinil Decorativo SH Decor (IT 153)",
      "description": "Revestimento de vinil autoadesivo Tricoline Bege (IT 153), família Tecido. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "tricoline bege vinil adesivo, sh decor tricoline bege, revestimento tecido adesivo, IT 153"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/tricoline-bege-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "formica-azul-petroleo",
    "name": "Fórmica Azul Petróleo",
    "code": "SD 999",
    "family": "solido",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Fórmica Azul Petróleo, da família Sólido, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/formica-azul-petroleo/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/formica-azul-petroleo/ambient-1.jpg",
        "/assets/images/decor/sh/formica-azul-petroleo/ambient-2.jpg",
        "/assets/images/decor/sh/formica-azul-petroleo/ambient-3.jpg"
      ]
    },
    "seo": {
      "title": "Fórmica Azul Petróleo — Vinil Decorativo SH Decor (SD 999)",
      "description": "Revestimento de vinil autoadesivo Fórmica Azul Petróleo (SD 999), família Sólido. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "fórmica azul petróleo vinil adesivo, sh decor fórmica azul petróleo, revestimento sólido adesivo, SD 999"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/formica-azul-petroleo-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "formica-branca",
    "name": "Fórmica Branca",
    "code": "SD 901",
    "family": "solido",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Fórmica Branca, da família Sólido, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/formica-branca/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/formica-branca/ambient-1.jpg",
        "/assets/images/decor/sh/formica-branca/ambient-2.jpg",
        "/assets/images/decor/sh/formica-branca/ambient-3.jpg"
      ]
    },
    "seo": {
      "title": "Fórmica Branca — Vinil Decorativo SH Decor (SD 901)",
      "description": "Revestimento de vinil autoadesivo Fórmica Branca (SD 901), família Sólido. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "fórmica branca vinil adesivo, sh decor fórmica branca, revestimento sólido adesivo, SD 901"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/formica-branca-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "formica-cinza-esmeralda",
    "name": "Fórmica Cinza Esmeralda",
    "code": "SD 992",
    "family": "solido",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Fórmica Cinza Esmeralda, da família Sólido, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/formica-cinza-esmeralda/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/formica-cinza-esmeralda/ambient-1.jpg"
      ]
    },
    "seo": {
      "title": "Fórmica Cinza Esmeralda — Vinil Decorativo SH Decor (SD 992)",
      "description": "Revestimento de vinil autoadesivo Fórmica Cinza Esmeralda (SD 992), família Sólido. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "fórmica cinza esmeralda vinil adesivo, sh decor fórmica cinza esmeralda, revestimento sólido adesivo, SD 992"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/formica-cinza-esmeralda-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "formica-cinza-glacial",
    "name": "Fórmica Cinza Glacial",
    "code": "SD 918",
    "family": "solido",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Fórmica Cinza Glacial, da família Sólido, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/formica-cinza-glacial/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/formica-cinza-glacial/ambient-1.jpg",
        "/assets/images/decor/sh/formica-cinza-glacial/ambient-2.jpg",
        "/assets/images/decor/sh/formica-cinza-glacial/ambient-3.jpg"
      ]
    },
    "seo": {
      "title": "Fórmica Cinza Glacial — Vinil Decorativo SH Decor (SD 918)",
      "description": "Revestimento de vinil autoadesivo Fórmica Cinza Glacial (SD 918), família Sólido. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "fórmica cinza glacial vinil adesivo, sh decor fórmica cinza glacial, revestimento sólido adesivo, SD 918"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/formica-cinza-glacial-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "formica-cinza-telegrey",
    "name": "Fórmica Cinza Telegrey",
    "code": "SD 984",
    "family": "solido",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Fórmica Cinza Glacial, da família Sólido, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/formica-cinza-telegrey/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/formica-cinza-telegrey/ambient-1.jpg",
        "/assets/images/decor/sh/formica-cinza-telegrey/ambient-2.jpg",
        "/assets/images/decor/sh/formica-cinza-telegrey/ambient-3.jpg"
      ]
    },
    "seo": {
      "title": "Fórmica Cinza Telegrey — Vinil Decorativo SH Decor (SD 984)",
      "description": "Revestimento de vinil autoadesivo Fórmica Cinza Telegrey (SD 984), família Sólido. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "fórmica cinza telegrey vinil adesivo, sh decor fórmica cinza telegrey, revestimento sólido adesivo, SD 984"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/formica-cinza-telegrey-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "formica-laca-branco",
    "name": "Fórmica Laca Branco",
    "code": "IH 706",
    "family": "solido",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Fórmica Laca Branco da família Laca, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/formica-laca-branco/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/formica-laca-branco/ambient-1.jpg",
        "/assets/images/decor/sh/formica-laca-branco/ambient-2.jpg",
        "/assets/images/decor/sh/formica-laca-branco/ambient-3.jpg"
      ]
    },
    "seo": {
      "title": "Fórmica Laca Branco — Vinil Decorativo SH Decor (IH 706)",
      "description": "Revestimento de vinil autoadesivo Fórmica Laca Branco (IH 706), família Sólido. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "fórmica laca branco vinil adesivo, sh decor fórmica laca branco, revestimento sólido adesivo, IH 706"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/formica-laca-branco-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "formica-nude",
    "name": "Fórmica Nude",
    "code": "SD 933",
    "family": "solido",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Fórmica Nude, da família Sólido, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/formica-nude/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/formica-nude/ambient-1.jpg",
        "/assets/images/decor/sh/formica-nude/ambient-2.jpg",
        "/assets/images/decor/sh/formica-nude/ambient-3.jpg"
      ]
    },
    "seo": {
      "title": "Fórmica Nude — Vinil Decorativo SH Decor (SD 933)",
      "description": "Revestimento de vinil autoadesivo Fórmica Nude (SD 933), família Sólido. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "fórmica nude vinil adesivo, sh decor fórmica nude, revestimento sólido adesivo, SD 933"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/formica-nude-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "formica-off-white",
    "name": "Fórmica Off White",
    "code": "SD 920",
    "family": "solido",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Fórmica Off White, da família Sólido, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/formica-off-white/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/formica-off-white/ambient-1.jpg",
        "/assets/images/decor/sh/formica-off-white/ambient-2.jpg"
      ]
    },
    "seo": {
      "title": "Fórmica Off White — Vinil Decorativo SH Decor (SD 920)",
      "description": "Revestimento de vinil autoadesivo Fórmica Off White (SD 920), família Sólido. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "fórmica off white vinil adesivo, sh decor fórmica off white, revestimento sólido adesivo, SD 920"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/formica-off-white-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "formica-preta",
    "name": "Fórmica Preta",
    "code": "SD 908",
    "family": "solido",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Fórmica Preta, da família Sólido, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/formica-preta/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/formica-preta/ambient-1.jpg",
        "/assets/images/decor/sh/formica-preta/ambient-2.jpg",
        "/assets/images/decor/sh/formica-preta/ambient-3.jpg"
      ]
    },
    "seo": {
      "title": "Fórmica Preta — Vinil Decorativo SH Decor (SD 908)",
      "description": "Revestimento de vinil autoadesivo Fórmica Preta (SD 908), família Sólido. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "fórmica preta vinil adesivo, sh decor fórmica preta, revestimento sólido adesivo, SD 908"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/formica-preta-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "formica-verde-balsamo",
    "name": "Fórmica Verde Bálsamo",
    "code": "SD 995",
    "family": "solido",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Fórmica Verde Bálsamo, da família Sólido, desenvolvido para utilização em ambientes internos. O material adesivo pode ser utilizado como papel de parede e muito mais, com contraindicações de uso apenas para pisos e áreas externas. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade: pias, paredes, armários, tetos, mesas, guarda-roupas, geladeiras, portas, eletrodomésticos, entre outros.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "200 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "9 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "61,5cm ou 123cm"
      },
      {
        "label": "Metragem",
        "value": "1.56m (somente rolo com 123cm), 3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/formica-verde-balsamo/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/formica-verde-balsamo/ambient-1.jpg",
        "/assets/images/decor/sh/formica-verde-balsamo/ambient-2.jpg",
        "/assets/images/decor/sh/formica-verde-balsamo/ambient-3.jpg"
      ]
    },
    "seo": {
      "title": "Fórmica Verde Bálsamo — Vinil Decorativo SH Decor (SD 995)",
      "description": "Revestimento de vinil autoadesivo Fórmica Verde Bálsamo (SD 995), família Sólido. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "fórmica verde bálsamo vinil adesivo, sh decor fórmica verde bálsamo, revestimento sólido adesivo, SD 995"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/formica-verde-balsamo-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "carvalho-alpino",
    "name": "Carvalho Alpino",
    "code": "FDS 1005",
    "family": "piso",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Carvalho Alpini da família Piso, desenvolvido para utilização em pisos de ambientes internos. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "500 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "5 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "123cm"
      },
      {
        "label": "Metragem",
        "value": "3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/carvalho-alpino/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/carvalho-alpino/ambient-1.jpg",
        "/assets/images/decor/sh/carvalho-alpino/ambient-2.jpg",
        "/assets/images/decor/sh/carvalho-alpino/ambient-3.jpg"
      ]
    },
    "seo": {
      "title": "Carvalho Alpino — Vinil Decorativo SH Decor (FDS 1005)",
      "description": "Revestimento de vinil autoadesivo Carvalho Alpino (FDS 1005), família Piso. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "carvalho alpino vinil adesivo, sh decor carvalho alpino, revestimento piso adesivo, FDS 1005"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/carvalho-alpino-revestimento-de-vinil-autoadesivo"
  },
  {
    "slug": "carvalho-europeu",
    "name": "Carvalho Europeu",
    "code": "FDS 1007",
    "family": "piso",
    "description": "Utilize os revestimentos de vinil autoadesivo da SH Decor no Carvalho Europeu da família Piso, desenvolvido para utilização em pisos de ambientes internos. Sua característica termo moldável é determinante para um acabamento perfeito, sendo indicado inclusive para aplicação em superfícies de alta complexidade.",
    "specs": [
      {
        "label": "Material",
        "value": "PVC Calandrado"
      },
      {
        "label": "Espessura",
        "value": "500 microns"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico semi permanente"
      },
      {
        "label": "Cor do Adesivo (Fundo)",
        "value": "Transparente"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120gr"
      },
      {
        "label": "Durabilidade",
        "value": "5 anos"
      },
      {
        "label": "Tamanho do Rolo",
        "value": "123cm"
      },
      {
        "label": "Metragem",
        "value": "3.12m, 6.25m, 12.5m ou 25m"
      }
    ],
    "images": {
      "texture": "/assets/images/decor/sh/carvalho-europeu/texture.jpg",
      "ambient": [
        "/assets/images/decor/sh/carvalho-europeu/ambient-1.jpg",
        "/assets/images/decor/sh/carvalho-europeu/ambient-2.jpg"
      ]
    },
    "seo": {
      "title": "Carvalho Europeu — Vinil Decorativo SH Decor (FDS 1007)",
      "description": "Revestimento de vinil autoadesivo Carvalho Europeu (FDS 1007), família Piso. Atóxico, lavável, tecnologia Bubble Free. Orçamento com a NZDecor.",
      "keywords": "carvalho europeu vinil adesivo, sh decor carvalho europeu, revestimento piso adesivo, FDS 1007"
    },
    "sourceUrl": "https://www.shdecorbrasil.com.br/produto/carvalho-europeu-revestimento-de-vinil-autoadesivo"
  }
];

export const getShProductBySlug = (slug?: string) =>
  shDecorProducts.find((p) => p.slug === slug);

export const getShProductsByFamily = (family: ShDecorFamilySlug) =>
  shDecorProducts.filter((p) => p.family === family);

export const getShFamilyBySlug = (slug?: string) =>
  shDecorFamilies.find((f) => f.slug === slug);
