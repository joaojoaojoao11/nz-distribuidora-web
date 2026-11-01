// Catálogo Imprimax DecorMax — GERADO a partir de scripts/data/imprimax/*.json
// (scripts/generate-imprimax.mjs). Edite os JSONs e regenere; não edite à mão.

export type ImprimaxFamilySlug = 'madeira' | 'pedra' | 'formica' | 'tecido' | 'textura' | 'metal' | 'piso';

export type ImprimaxFamily = {
  slug: ImprimaxFamilySlug;
  name: string;
  description: string;
  /** Fotos de ambiente da FAMÍLIA (não mostram um padrão específico). */
  ambient: string[];
};

export type ImprimaxSpec = { label: string; value: string };

export type ImprimaxProduct = {
  slug: string;
  name: string;
  /** Código do fabricante (10 dígitos, como na lista de preços Imprimax). */
  code: string;
  sku: string;
  /** Página do produto na loja (/loja/<lojaSlug>), com preço e compra. */
  lojaSlug: string;
  family: ImprimaxFamilySlug;
  collection: string;
  description: string;
  specs: ImprimaxSpec[];
  badges: string[];
  images: {
    texture: string;
    /** Fotos DESTE padrão aplicado (site e Digital Press Kit do fabricante). */
    ambient: string[];
    /** Recorte ampliado da textura (só nas capas de 1080 px). */
    zoom?: string;
    /** Card com a amostra e os dados do rolo. */
    ficha: string;
  };
  seo: { title: string; description: string; keywords: string };
  sourceUrl?: string;
};

export const IMPRIMAX_HERO_BADGES = [
  'INDÚSTRIA NACIONAL',
  'ANTIMOFO · ANTIBACTERIANO',
  'NÃO PROPAGA FOGO',
  'ROLO 1,22 × 25 M',
];

export const imprimaxFamilies: ImprimaxFamily[] = [
  {
    "slug": "madeira",
    "name": "Madeira",
    "description": "Carvalhos, jequitibás, freijó, demolição e ripados com veio realista, mais o bambu natural e trançado.",
    "ambient": [
      "/assets/images/decor/imprimax/familias/gold-madeiras-1.jpg",
      "/assets/images/decor/imprimax/familias/gold-madeiras-2.jpg",
      "/assets/images/decor/imprimax/familias/gold-madeiras-3.jpg",
      "/assets/images/decor/imprimax/familias/gold-madeiras-4.jpg"
    ]
  },
  {
    "slug": "pedra",
    "name": "Pedra & Mármore",
    "description": "Mármores com e sem brilho, travertinos, cimento queimado, ardósias, terrazzos, seixos e tijolos.",
    "ambient": [
      "/assets/images/decor/imprimax/familias/gold-pedras-1.jpg",
      "/assets/images/decor/imprimax/familias/gold-pedras-2.jpg",
      "/assets/images/decor/imprimax/familias/gold-pedras-3.jpg"
    ]
  },
  {
    "slug": "formica",
    "name": "Fórmica",
    "description": "Cores sólidas em três acabamentos: Laca (alto brilho), Satin (acetinado) e Ripada (frisos em relevo).",
    "ambient": [
      "/assets/images/decor/imprimax/familias/formica-laca-1.jpg",
      "/assets/images/decor/imprimax/familias/formica-laca-2.jpg",
      "/assets/images/decor/imprimax/familias/formica-laca-3.jpg",
      "/assets/images/decor/imprimax/familias/formica-laca-4.jpg"
    ]
  },
  {
    "slug": "tecido",
    "name": "Tecido & Telado",
    "description": "Bouclé, linho natural, telados, canvas, palha e a textura Savana para aquecer móveis e paredes.",
    "ambient": [
      "/assets/images/decor/imprimax/familias/gold-telado-1.jpg",
      "/assets/images/decor/imprimax/familias/gold-telado-2.jpg",
      "/assets/images/decor/imprimax/familias/gold-telado-3.jpg",
      "/assets/images/decor/imprimax/familias/gold-telado-4.jpg"
    ]
  },
  {
    "slug": "textura",
    "name": "Couro & Texturas",
    "description": "Couro Volpe e Firenze para painéis, cabeceiras e detalhes de mobiliário.",
    "ambient": [
      "/assets/images/decor/imprimax/familias/gold-couros-1.jpg",
      "/assets/images/decor/imprimax/familias/gold-couros-2.jpg",
      "/assets/images/decor/imprimax/familias/gold-couros-3.jpg",
      "/assets/images/decor/imprimax/familias/gold-couros-4.jpg"
    ]
  },
  {
    "slug": "piso",
    "name": "PisoMax",
    "description": "PisoMax: frontal de 250 micras para piso de tráfego leve.",
    "ambient": [
      "/assets/images/decor/imprimax/familias/pisomax-decorativo-1.jpg",
      "/assets/images/decor/imprimax/familias/pisomax-decorativo-2.jpg"
    ]
  }
];

export const imprimaxProducts: ImprimaxProduct[] = [
  {
    "slug": "bambu-natural",
    "name": "Bambu Natural",
    "code": "0016050002",
    "sku": "IMX16050002",
    "lojaSlug": "imprimax-bambu-natural",
    "family": "madeira",
    "collection": "Gold Bambu",
    "description": "Padrão Bambu Natural, da coleção Gold Bambu da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0016050002"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/bambu-natural/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/bambu-natural/ambient-1.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/bambu-natural/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/bambu-natural/ficha.jpg"
    },
    "seo": {
      "title": "Bambu Natural — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Bambu Natural, coleção Gold Bambu, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "bambu natural adesivo, imprimax bambu natural, decormax bambu natural, vinil madeira imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-bambu"
  },
  {
    "slug": "bambu-trancado",
    "name": "Bambu Trançado",
    "code": "0016050001",
    "sku": "IMX16050001",
    "lojaSlug": "imprimax-bambu-trancado",
    "family": "madeira",
    "collection": "Gold Bambu",
    "description": "Padrão Bambu Trançado, da coleção Gold Bambu da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0016050001"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/bambu-trancado/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/bambu-trancado/ambient-1.jpg",
        "/assets/images/decor/imprimax/bambu-trancado/ambient-2.jpg",
        "/assets/images/decor/imprimax/bambu-trancado/ambient-3.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/bambu-trancado/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/bambu-trancado/ficha.jpg"
    },
    "seo": {
      "title": "Bambu Trançado — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Bambu Trançado, coleção Gold Bambu, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "bambu trançado adesivo, imprimax bambu trançado, decormax bambu trançado, vinil madeira imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-bambu"
  },
  {
    "slug": "madeira-carvalho-mc-1701",
    "name": "Madeira Carvalho MC-1701",
    "code": "0013930014",
    "sku": "IMX13930014",
    "lojaSlug": "imprimax-madeira-carvalho-mc-1701",
    "family": "madeira",
    "collection": "Gold Madeiras",
    "description": "Padrão Madeira Carvalho MC-1701, da coleção Gold Madeiras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 / 180 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 / 180 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0013930014"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/madeira-carvalho-mc-1701/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/madeira-carvalho-mc-1701/kit-1.jpg",
        "/assets/images/decor/imprimax/madeira-carvalho-mc-1701/kit-2.jpg",
        "/assets/images/decor/imprimax/madeira-carvalho-mc-1701/kit-3.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/madeira-carvalho-mc-1701/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/madeira-carvalho-mc-1701/ficha.jpg"
    },
    "seo": {
      "title": "Madeira Carvalho MC-1701 — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Madeira Carvalho MC-1701, coleção Gold Madeiras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "madeira carvalho mc-1701 adesivo, imprimax madeira carvalho mc-1701, decormax madeira carvalho mc-1701, vinil madeira imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-madeiras"
  },
  {
    "slug": "madeira-carvalho-mc-1702",
    "name": "Madeira Carvalho MC-1702",
    "code": "0013930015",
    "sku": "IMX13930015",
    "lojaSlug": "imprimax-madeira-carvalho-mc-1702",
    "family": "madeira",
    "collection": "Gold Madeiras",
    "description": "Padrão Madeira Carvalho MC-1702, da coleção Gold Madeiras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 / 180 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 / 180 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0013930015"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/madeira-carvalho-mc-1702/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/madeira-carvalho-mc-1702/kit-1.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/madeira-carvalho-mc-1702/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/madeira-carvalho-mc-1702/ficha.jpg"
    },
    "seo": {
      "title": "Madeira Carvalho MC-1702 — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Madeira Carvalho MC-1702, coleção Gold Madeiras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "madeira carvalho mc-1702 adesivo, imprimax madeira carvalho mc-1702, decormax madeira carvalho mc-1702, vinil madeira imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-madeiras"
  },
  {
    "slug": "madeira-carvalho-mc-1703",
    "name": "Madeira Carvalho MC-1703",
    "code": "0013930016",
    "sku": "IMX13930016",
    "lojaSlug": "imprimax-madeira-carvalho-mc-1703",
    "family": "madeira",
    "collection": "Gold Madeiras",
    "description": "Padrão Madeira Carvalho MC-1703, da coleção Gold Madeiras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 / 180 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 / 180 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0013930016"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/madeira-carvalho-mc-1703/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/madeira-carvalho-mc-1703/kit-1.jpg",
        "/assets/images/decor/imprimax/madeira-carvalho-mc-1703/kit-2.jpg",
        "/assets/images/decor/imprimax/madeira-carvalho-mc-1703/kit-3.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/madeira-carvalho-mc-1703/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/madeira-carvalho-mc-1703/ficha.jpg"
    },
    "seo": {
      "title": "Madeira Carvalho MC-1703 — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Madeira Carvalho MC-1703, coleção Gold Madeiras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "madeira carvalho mc-1703 adesivo, imprimax madeira carvalho mc-1703, decormax madeira carvalho mc-1703, vinil madeira imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-madeiras"
  },
  {
    "slug": "madeira-carvalho-mc-1704",
    "name": "Madeira Carvalho MC-1704",
    "code": "0013930017",
    "sku": "IMX13930017",
    "lojaSlug": "imprimax-madeira-carvalho-mc-1704",
    "family": "madeira",
    "collection": "Gold Madeiras",
    "description": "Padrão Madeira Carvalho MC-1704, da coleção Gold Madeiras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 / 180 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 / 180 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0013930017"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/madeira-carvalho-mc-1704/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/madeira-carvalho-mc-1704/kit-1.jpg",
        "/assets/images/decor/imprimax/madeira-carvalho-mc-1704/kit-2.jpg",
        "/assets/images/decor/imprimax/madeira-carvalho-mc-1704/kit-3.jpg",
        "/assets/images/decor/imprimax/madeira-carvalho-mc-1704/kit-4.jpg",
        "/assets/images/decor/imprimax/madeira-carvalho-mc-1704/kit-5.jpg",
        "/assets/images/decor/imprimax/madeira-carvalho-mc-1704/kit-6.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/madeira-carvalho-mc-1704/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/madeira-carvalho-mc-1704/ficha.jpg"
    },
    "seo": {
      "title": "Madeira Carvalho MC-1704 — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Madeira Carvalho MC-1704, coleção Gold Madeiras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "madeira carvalho mc-1704 adesivo, imprimax madeira carvalho mc-1704, decormax madeira carvalho mc-1704, vinil madeira imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-madeiras"
  },
  {
    "slug": "madeira-carvalho-mc-1705",
    "name": "Madeira Carvalho MC-1705",
    "code": "0013930018",
    "sku": "IMX13930018",
    "lojaSlug": "imprimax-madeira-carvalho-mc-1705",
    "family": "madeira",
    "collection": "Gold Madeiras",
    "description": "Padrão Madeira Carvalho MC-1705, da coleção Gold Madeiras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 / 180 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 / 180 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0013930018"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/madeira-carvalho-mc-1705/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/madeira-carvalho-mc-1705/kit-1.jpg",
        "/assets/images/decor/imprimax/madeira-carvalho-mc-1705/kit-2.jpg",
        "/assets/images/decor/imprimax/madeira-carvalho-mc-1705/kit-3.jpg",
        "/assets/images/decor/imprimax/madeira-carvalho-mc-1705/kit-4.jpg",
        "/assets/images/decor/imprimax/madeira-carvalho-mc-1705/kit-5.jpg",
        "/assets/images/decor/imprimax/madeira-carvalho-mc-1705/kit-6.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/madeira-carvalho-mc-1705/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/madeira-carvalho-mc-1705/ficha.jpg"
    },
    "seo": {
      "title": "Madeira Carvalho MC-1705 — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Madeira Carvalho MC-1705, coleção Gold Madeiras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "madeira carvalho mc-1705 adesivo, imprimax madeira carvalho mc-1705, decormax madeira carvalho mc-1705, vinil madeira imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-madeiras"
  },
  {
    "slug": "madeira-carvalho-mc-1801",
    "name": "Madeira Carvalho MC-1801",
    "code": "0013930026",
    "sku": "IMX13930026",
    "lojaSlug": "imprimax-madeira-carvalho-mc-1801",
    "family": "madeira",
    "collection": "Gold Madeiras",
    "description": "Padrão Madeira Carvalho MC-1801, da coleção Gold Madeiras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 / 180 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 / 180 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0013930026"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/madeira-carvalho-mc-1801/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/madeira-carvalho-mc-1801/kit-1.jpg",
        "/assets/images/decor/imprimax/madeira-carvalho-mc-1801/kit-2.jpg",
        "/assets/images/decor/imprimax/madeira-carvalho-mc-1801/kit-3.jpg",
        "/assets/images/decor/imprimax/madeira-carvalho-mc-1801/kit-4.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/madeira-carvalho-mc-1801/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/madeira-carvalho-mc-1801/ficha.jpg"
    },
    "seo": {
      "title": "Madeira Carvalho MC-1801 — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Madeira Carvalho MC-1801, coleção Gold Madeiras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "madeira carvalho mc-1801 adesivo, imprimax madeira carvalho mc-1801, decormax madeira carvalho mc-1801, vinil madeira imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-madeiras"
  },
  {
    "slug": "madeira-carvalho-mc-1901",
    "name": "Madeira Carvalho MC-1901",
    "code": "0013930037",
    "sku": "IMX13930037",
    "lojaSlug": "imprimax-madeira-carvalho-mc-1901",
    "family": "madeira",
    "collection": "Gold Madeiras",
    "description": "Padrão Madeira Carvalho MC-1901, da coleção Gold Madeiras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 / 180 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 / 180 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0013930037"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/madeira-carvalho-mc-1901/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/madeira-carvalho-mc-1901/kit-1.jpg",
        "/assets/images/decor/imprimax/madeira-carvalho-mc-1901/kit-2.jpg",
        "/assets/images/decor/imprimax/madeira-carvalho-mc-1901/kit-3.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/madeira-carvalho-mc-1901/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/madeira-carvalho-mc-1901/ficha.jpg"
    },
    "seo": {
      "title": "Madeira Carvalho MC-1901 — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Madeira Carvalho MC-1901, coleção Gold Madeiras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "madeira carvalho mc-1901 adesivo, imprimax madeira carvalho mc-1901, decormax madeira carvalho mc-1901, vinil madeira imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-madeiras"
  },
  {
    "slug": "madeira-carvalho-mc-2102",
    "name": "Madeira Carvalho MC-2102",
    "code": "0013930039",
    "sku": "IMX13930039",
    "lojaSlug": "imprimax-madeira-carvalho-mc-2102",
    "family": "madeira",
    "collection": "Gold Madeiras",
    "description": "Padrão Madeira Carvalho MC-2102, da coleção Gold Madeiras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 / 180 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 / 180 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0013930039"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/madeira-carvalho-mc-2102/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/madeira-carvalho-mc-2102/kit-1.jpg",
        "/assets/images/decor/imprimax/madeira-carvalho-mc-2102/kit-2.jpg",
        "/assets/images/decor/imprimax/madeira-carvalho-mc-2102/kit-3.jpg",
        "/assets/images/decor/imprimax/madeira-carvalho-mc-2102/kit-4.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/madeira-carvalho-mc-2102/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/madeira-carvalho-mc-2102/ficha.jpg"
    },
    "seo": {
      "title": "Madeira Carvalho MC-2102 — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Madeira Carvalho MC-2102, coleção Gold Madeiras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "madeira carvalho mc-2102 adesivo, imprimax madeira carvalho mc-2102, decormax madeira carvalho mc-2102, vinil madeira imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-madeiras"
  },
  {
    "slug": "madeira-ciliegio",
    "name": "Madeira Ciliegio",
    "code": "0013930478",
    "sku": "IMX13930478",
    "lojaSlug": "imprimax-madeira-ciliegio",
    "family": "madeira",
    "collection": "Gold Madeiras",
    "description": "Padrão Madeira Ciliegio, da coleção Gold Madeiras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 / 180 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 / 180 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0013930478"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/madeira-ciliegio/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/madeira-ciliegio/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/madeira-ciliegio/ficha.jpg"
    },
    "seo": {
      "title": "Madeira Ciliegio — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Madeira Ciliegio, coleção Gold Madeiras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "madeira ciliegio adesivo, imprimax madeira ciliegio, decormax madeira ciliegio, vinil madeira imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-madeiras"
  },
  {
    "slug": "madeira-demolicao-md-1802",
    "name": "Madeira Demolição MD-1802",
    "code": "0013930022",
    "sku": "IMX13930022",
    "lojaSlug": "imprimax-madeira-demolicao-md-1802",
    "family": "madeira",
    "collection": "Gold Madeiras",
    "description": "Padrão Madeira Demolição MD-1802, da coleção Gold Madeiras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 / 180 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 / 180 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0013930022"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/madeira-demolicao-md-1802/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/madeira-demolicao-md-1802/kit-1.jpg",
        "/assets/images/decor/imprimax/madeira-demolicao-md-1802/kit-2.jpg",
        "/assets/images/decor/imprimax/madeira-demolicao-md-1802/kit-3.jpg",
        "/assets/images/decor/imprimax/madeira-demolicao-md-1802/kit-4.jpg",
        "/assets/images/decor/imprimax/madeira-demolicao-md-1802/kit-5.jpg",
        "/assets/images/decor/imprimax/madeira-demolicao-md-1802/kit-6.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/madeira-demolicao-md-1802/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/madeira-demolicao-md-1802/ficha.jpg"
    },
    "seo": {
      "title": "Madeira Demolição MD-1802 — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Madeira Demolição MD-1802, coleção Gold Madeiras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "madeira demolição md-1802 adesivo, imprimax madeira demolição md-1802, decormax madeira demolição md-1802, vinil madeira imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-madeiras"
  },
  {
    "slug": "madeira-demolicao-md-1803",
    "name": "Madeira Demolição MD-1803",
    "code": "0013930023",
    "sku": "IMX13930023",
    "lojaSlug": "imprimax-madeira-demolicao-md-1803",
    "family": "madeira",
    "collection": "Gold Madeiras",
    "description": "Padrão Madeira Demolição MD-1803, da coleção Gold Madeiras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 / 180 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 / 180 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0013930023"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/madeira-demolicao-md-1803/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/madeira-demolicao-md-1803/kit-1.jpg",
        "/assets/images/decor/imprimax/madeira-demolicao-md-1803/kit-2.jpg",
        "/assets/images/decor/imprimax/madeira-demolicao-md-1803/kit-3.jpg",
        "/assets/images/decor/imprimax/madeira-demolicao-md-1803/kit-4.jpg",
        "/assets/images/decor/imprimax/madeira-demolicao-md-1803/kit-5.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/madeira-demolicao-md-1803/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/madeira-demolicao-md-1803/ficha.jpg"
    },
    "seo": {
      "title": "Madeira Demolição MD-1803 — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Madeira Demolição MD-1803, coleção Gold Madeiras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "madeira demolição md-1803 adesivo, imprimax madeira demolição md-1803, decormax madeira demolição md-1803, vinil madeira imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-madeiras"
  },
  {
    "slug": "madeira-demolicao-md-1804",
    "name": "Madeira Demolição MD-1804",
    "code": "0013930024",
    "sku": "IMX13930024",
    "lojaSlug": "imprimax-madeira-demolicao-md-1804",
    "family": "madeira",
    "collection": "Gold Madeiras",
    "description": "Padrão Madeira Demolição MD-1804, da coleção Gold Madeiras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 / 180 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 / 180 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0013930024"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/madeira-demolicao-md-1804/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/madeira-demolicao-md-1804/kit-1.jpg",
        "/assets/images/decor/imprimax/madeira-demolicao-md-1804/kit-2.jpg",
        "/assets/images/decor/imprimax/madeira-demolicao-md-1804/kit-3.jpg",
        "/assets/images/decor/imprimax/madeira-demolicao-md-1804/kit-4.jpg",
        "/assets/images/decor/imprimax/madeira-demolicao-md-1804/kit-5.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/madeira-demolicao-md-1804/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/madeira-demolicao-md-1804/ficha.jpg"
    },
    "seo": {
      "title": "Madeira Demolição MD-1804 — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Madeira Demolição MD-1804, coleção Gold Madeiras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "madeira demolição md-1804 adesivo, imprimax madeira demolição md-1804, decormax madeira demolição md-1804, vinil madeira imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-madeiras"
  },
  {
    "slug": "madeira-demolicao-md-1903",
    "name": "Madeira Demolição MD-1903",
    "code": "0013930033",
    "sku": "IMX13930033",
    "lojaSlug": "imprimax-madeira-demolicao-md-1903",
    "family": "madeira",
    "collection": "Gold Madeiras",
    "description": "Padrão Madeira Demolição MD-1903, da coleção Gold Madeiras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 / 180 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 / 180 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0013930033"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/madeira-demolicao-md-1903/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/madeira-demolicao-md-1903/kit-1.jpg",
        "/assets/images/decor/imprimax/madeira-demolicao-md-1903/kit-2.jpg",
        "/assets/images/decor/imprimax/madeira-demolicao-md-1903/kit-3.jpg",
        "/assets/images/decor/imprimax/madeira-demolicao-md-1903/kit-4.jpg",
        "/assets/images/decor/imprimax/madeira-demolicao-md-1903/kit-5.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/madeira-demolicao-md-1903/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/madeira-demolicao-md-1903/ficha.jpg"
    },
    "seo": {
      "title": "Madeira Demolição MD-1903 — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Madeira Demolição MD-1903, coleção Gold Madeiras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "madeira demolição md-1903 adesivo, imprimax madeira demolição md-1903, decormax madeira demolição md-1903, vinil madeira imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-madeiras"
  },
  {
    "slug": "madeira-demolicao-md-1904",
    "name": "Madeira Demolição MD-1904",
    "code": "0013930034",
    "sku": "IMX13930034",
    "lojaSlug": "imprimax-madeira-demolicao-md-1904",
    "family": "madeira",
    "collection": "Gold Madeiras",
    "description": "Padrão Madeira Demolição MD-1904, da coleção Gold Madeiras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 / 180 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 / 180 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0013930034"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/madeira-demolicao-md-1904/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/madeira-demolicao-md-1904/kit-1.jpg",
        "/assets/images/decor/imprimax/madeira-demolicao-md-1904/kit-2.jpg",
        "/assets/images/decor/imprimax/madeira-demolicao-md-1904/kit-3.jpg",
        "/assets/images/decor/imprimax/madeira-demolicao-md-1904/kit-4.jpg",
        "/assets/images/decor/imprimax/madeira-demolicao-md-1904/kit-5.jpg",
        "/assets/images/decor/imprimax/madeira-demolicao-md-1904/kit-6.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/madeira-demolicao-md-1904/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/madeira-demolicao-md-1904/ficha.jpg"
    },
    "seo": {
      "title": "Madeira Demolição MD-1904 — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Madeira Demolição MD-1904, coleção Gold Madeiras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "madeira demolição md-1904 adesivo, imprimax madeira demolição md-1904, decormax madeira demolição md-1904, vinil madeira imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-madeiras"
  },
  {
    "slug": "madeira-demolicao-md-1905",
    "name": "Madeira Demolição MD-1905",
    "code": "0013930035",
    "sku": "IMX13930035",
    "lojaSlug": "imprimax-madeira-demolicao-md-1905",
    "family": "madeira",
    "collection": "Gold Madeiras",
    "description": "Padrão Madeira Demolição MD-1905, da coleção Gold Madeiras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 / 180 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 / 180 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0013930035"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/madeira-demolicao-md-1905/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/madeira-demolicao-md-1905/kit-1.jpg",
        "/assets/images/decor/imprimax/madeira-demolicao-md-1905/kit-2.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/madeira-demolicao-md-1905/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/madeira-demolicao-md-1905/ficha.jpg"
    },
    "seo": {
      "title": "Madeira Demolição MD-1905 — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Madeira Demolição MD-1905, coleção Gold Madeiras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "madeira demolição md-1905 adesivo, imprimax madeira demolição md-1905, decormax madeira demolição md-1905, vinil madeira imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-madeiras"
  },
  {
    "slug": "madeira-freijo",
    "name": "Madeira Freijó",
    "code": "0013930080",
    "sku": "IMX13930080",
    "lojaSlug": "imprimax-madeira-freijo",
    "family": "madeira",
    "collection": "Gold Madeiras",
    "description": "Padrão Madeira Freijó, da coleção Gold Madeiras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 / 180 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 / 180 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0013930080"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/madeira-freijo/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/madeira-freijo/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/madeira-freijo/ficha.jpg"
    },
    "seo": {
      "title": "Madeira Freijó — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Madeira Freijó, coleção Gold Madeiras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "madeira freijó adesivo, imprimax madeira freijó, decormax madeira freijó, vinil madeira imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-madeiras"
  },
  {
    "slug": "madeira-imbuia-mi-101",
    "name": "Madeira Imbuia MI-101",
    "code": "0013930019",
    "sku": "IMX13930019",
    "lojaSlug": "imprimax-madeira-imbuia-mi-101",
    "family": "madeira",
    "collection": "Gold Madeiras",
    "description": "Padrão Madeira Imbuia MI-101, da coleção Gold Madeiras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 / 180 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 / 180 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0013930019"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/madeira-imbuia-mi-101/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/madeira-imbuia-mi-101/kit-1.jpg",
        "/assets/images/decor/imprimax/madeira-imbuia-mi-101/kit-2.jpg",
        "/assets/images/decor/imprimax/madeira-imbuia-mi-101/kit-3.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/madeira-imbuia-mi-101/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/madeira-imbuia-mi-101/ficha.jpg"
    },
    "seo": {
      "title": "Madeira Imbuia MI-101 — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Madeira Imbuia MI-101, coleção Gold Madeiras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "madeira imbuia mi-101 adesivo, imprimax madeira imbuia mi-101, decormax madeira imbuia mi-101, vinil madeira imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-madeiras"
  },
  {
    "slug": "madeira-imbuia-mi-102",
    "name": "Madeira Imbuia MI-102",
    "code": "0013930020",
    "sku": "IMX13930020",
    "lojaSlug": "imprimax-madeira-imbuia-mi-102",
    "family": "madeira",
    "collection": "Gold Madeiras",
    "description": "Padrão Madeira Imbuia MI-102, da coleção Gold Madeiras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 / 180 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 / 180 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0013930020"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/madeira-imbuia-mi-102/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/madeira-imbuia-mi-102/kit-1.jpg",
        "/assets/images/decor/imprimax/madeira-imbuia-mi-102/kit-2.jpg",
        "/assets/images/decor/imprimax/madeira-imbuia-mi-102/kit-3.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/madeira-imbuia-mi-102/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/madeira-imbuia-mi-102/ficha.jpg"
    },
    "seo": {
      "title": "Madeira Imbuia MI-102 — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Madeira Imbuia MI-102, coleção Gold Madeiras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "madeira imbuia mi-102 adesivo, imprimax madeira imbuia mi-102, decormax madeira imbuia mi-102, vinil madeira imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-madeiras"
  },
  {
    "slug": "madeira-jequitiba-mj-2201",
    "name": "Madeira Jequitibá MJ-2201",
    "code": "0013931004",
    "sku": "IMX13931004",
    "lojaSlug": "imprimax-madeira-jequitiba-mj-2201",
    "family": "madeira",
    "collection": "Gold Madeiras",
    "description": "Padrão Madeira Jequitibá MJ-2201, da coleção Gold Madeiras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 / 180 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 / 180 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0013931004"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/madeira-jequitiba-mj-2201/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/madeira-jequitiba-mj-2201/kit-1.jpg",
        "/assets/images/decor/imprimax/madeira-jequitiba-mj-2201/kit-2.jpg",
        "/assets/images/decor/imprimax/madeira-jequitiba-mj-2201/kit-3.jpg",
        "/assets/images/decor/imprimax/madeira-jequitiba-mj-2201/kit-4.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/madeira-jequitiba-mj-2201/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/madeira-jequitiba-mj-2201/ficha.jpg"
    },
    "seo": {
      "title": "Madeira Jequitibá MJ-2201 — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Madeira Jequitibá MJ-2201, coleção Gold Madeiras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "madeira jequitibá mj-2201 adesivo, imprimax madeira jequitibá mj-2201, decormax madeira jequitibá mj-2201, vinil madeira imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-madeiras"
  },
  {
    "slug": "madeira-jequitiba-mj-2301",
    "name": "Madeira Jequitibá MJ-2301",
    "code": "0013931005",
    "sku": "IMX13931005",
    "lojaSlug": "imprimax-madeira-jequitiba-mj-2301",
    "family": "madeira",
    "collection": "Gold Madeiras",
    "description": "Padrão Madeira Jequitibá MJ-2301, da coleção Gold Madeiras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 / 180 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 / 180 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0013931005"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/madeira-jequitiba-mj-2301/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/madeira-jequitiba-mj-2301/kit-1.jpg",
        "/assets/images/decor/imprimax/madeira-jequitiba-mj-2301/kit-2.jpg",
        "/assets/images/decor/imprimax/madeira-jequitiba-mj-2301/kit-3.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/madeira-jequitiba-mj-2301/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/madeira-jequitiba-mj-2301/ficha.jpg"
    },
    "seo": {
      "title": "Madeira Jequitibá MJ-2301 — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Madeira Jequitibá MJ-2301, coleção Gold Madeiras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "madeira jequitibá mj-2301 adesivo, imprimax madeira jequitibá mj-2301, decormax madeira jequitibá mj-2301, vinil madeira imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-madeiras"
  },
  {
    "slug": "madeira-jequitiba-mj-2302",
    "name": "Madeira Jequitibá MJ-2302",
    "code": "0013931006",
    "sku": "IMX13931006",
    "lojaSlug": "imprimax-madeira-jequitiba-mj-2302",
    "family": "madeira",
    "collection": "Gold Madeiras",
    "description": "Padrão Madeira Jequitibá MJ-2302, da coleção Gold Madeiras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 / 180 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 / 180 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0013931006"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/madeira-jequitiba-mj-2302/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/madeira-jequitiba-mj-2302/kit-1.jpg",
        "/assets/images/decor/imprimax/madeira-jequitiba-mj-2302/kit-2.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/madeira-jequitiba-mj-2302/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/madeira-jequitiba-mj-2302/ficha.jpg"
    },
    "seo": {
      "title": "Madeira Jequitibá MJ-2302 — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Madeira Jequitibá MJ-2302, coleção Gold Madeiras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "madeira jequitibá mj-2302 adesivo, imprimax madeira jequitibá mj-2302, decormax madeira jequitibá mj-2302, vinil madeira imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-madeiras"
  },
  {
    "slug": "madeira-jequitiba-mj-2303",
    "name": "Madeira Jequitibá MJ-2303",
    "code": "0013931007",
    "sku": "IMX13931007",
    "lojaSlug": "imprimax-madeira-jequitiba-mj-2303",
    "family": "madeira",
    "collection": "Gold Madeiras",
    "description": "Padrão Madeira Jequitibá MJ-2303, da coleção Gold Madeiras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 / 180 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 / 180 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0013931007"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/madeira-jequitiba-mj-2303/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/madeira-jequitiba-mj-2303/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/madeira-jequitiba-mj-2303/ficha.jpg"
    },
    "seo": {
      "title": "Madeira Jequitibá MJ-2303 — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Madeira Jequitibá MJ-2303, coleção Gold Madeiras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "madeira jequitibá mj-2303 adesivo, imprimax madeira jequitibá mj-2303, decormax madeira jequitibá mj-2303, vinil madeira imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-madeiras"
  },
  {
    "slug": "madeira-jequitiba-mj-2304",
    "name": "Madeira Jequitibá MJ-2304",
    "code": "0013931008",
    "sku": "IMX13931008",
    "lojaSlug": "imprimax-madeira-jequitiba-mj-2304",
    "family": "madeira",
    "collection": "Gold Madeiras",
    "description": "Padrão Madeira Jequitibá MJ-2304, da coleção Gold Madeiras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 / 180 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 / 180 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0013931008"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/madeira-jequitiba-mj-2304/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/madeira-jequitiba-mj-2304/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/madeira-jequitiba-mj-2304/ficha.jpg"
    },
    "seo": {
      "title": "Madeira Jequitibá MJ-2304 — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Madeira Jequitibá MJ-2304, coleção Gold Madeiras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "madeira jequitibá mj-2304 adesivo, imprimax madeira jequitibá mj-2304, decormax madeira jequitibá mj-2304, vinil madeira imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-madeiras"
  },
  {
    "slug": "madeira-linheiro-ml-2201",
    "name": "Madeira Linheiro ML-2201",
    "code": "0013931001",
    "sku": "IMX13931001",
    "lojaSlug": "imprimax-madeira-linheiro-ml-2201",
    "family": "madeira",
    "collection": "Gold Madeiras",
    "description": "Padrão Madeira Linheiro ML-2201, da coleção Gold Madeiras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 / 180 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 / 180 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0013931001"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/madeira-linheiro-ml-2201/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/madeira-linheiro-ml-2201/kit-1.jpg",
        "/assets/images/decor/imprimax/madeira-linheiro-ml-2201/kit-2.jpg",
        "/assets/images/decor/imprimax/madeira-linheiro-ml-2201/kit-3.jpg",
        "/assets/images/decor/imprimax/madeira-linheiro-ml-2201/kit-4.jpg",
        "/assets/images/decor/imprimax/madeira-linheiro-ml-2201/kit-5.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/madeira-linheiro-ml-2201/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/madeira-linheiro-ml-2201/ficha.jpg"
    },
    "seo": {
      "title": "Madeira Linheiro ML-2201 — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Madeira Linheiro ML-2201, coleção Gold Madeiras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "madeira linheiro ml-2201 adesivo, imprimax madeira linheiro ml-2201, decormax madeira linheiro ml-2201, vinil madeira imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-madeiras"
  },
  {
    "slug": "madeira-linheiro-ml-2202",
    "name": "Madeira Linheiro ML-2202",
    "code": "0013931002",
    "sku": "IMX13931002",
    "lojaSlug": "imprimax-madeira-linheiro-ml-2202",
    "family": "madeira",
    "collection": "Gold Madeiras",
    "description": "Padrão Madeira Linheiro ML-2202, da coleção Gold Madeiras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 / 180 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 / 180 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0013931002"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/madeira-linheiro-ml-2202/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/madeira-linheiro-ml-2202/kit-1.jpg",
        "/assets/images/decor/imprimax/madeira-linheiro-ml-2202/kit-2.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/madeira-linheiro-ml-2202/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/madeira-linheiro-ml-2202/ficha.jpg"
    },
    "seo": {
      "title": "Madeira Linheiro ML-2202 — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Madeira Linheiro ML-2202, coleção Gold Madeiras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "madeira linheiro ml-2202 adesivo, imprimax madeira linheiro ml-2202, decormax madeira linheiro ml-2202, vinil madeira imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-madeiras"
  },
  {
    "slug": "madeira-marfim",
    "name": "Madeira Marfim",
    "code": "0013930479",
    "sku": "IMX13930479",
    "lojaSlug": "imprimax-madeira-marfim",
    "family": "madeira",
    "collection": "Gold Madeiras",
    "description": "Padrão Madeira Marfim, da coleção Gold Madeiras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 / 180 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 / 180 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0013930479"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/madeira-marfim/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/madeira-marfim/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/madeira-marfim/ficha.jpg"
    },
    "seo": {
      "title": "Madeira Marfim — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Madeira Marfim, coleção Gold Madeiras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "madeira marfim adesivo, imprimax madeira marfim, decormax madeira marfim, vinil madeira imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-madeiras"
  },
  {
    "slug": "madeira-ripada-mr-2102",
    "name": "Madeira Ripada MR-2102",
    "code": "0013930058",
    "sku": "IMX13930058",
    "lojaSlug": "imprimax-madeira-ripada-mr-2102",
    "family": "madeira",
    "collection": "Gold Madeiras",
    "description": "Padrão Madeira Ripada MR-2102, da coleção Gold Madeiras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 / 180 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 / 180 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0013930058"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/madeira-ripada-mr-2102/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/madeira-ripada-mr-2102/kit-1.jpg",
        "/assets/images/decor/imprimax/madeira-ripada-mr-2102/kit-2.jpg",
        "/assets/images/decor/imprimax/madeira-ripada-mr-2102/kit-3.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/madeira-ripada-mr-2102/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/madeira-ripada-mr-2102/ficha.jpg"
    },
    "seo": {
      "title": "Madeira Ripada MR-2102 — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Madeira Ripada MR-2102, coleção Gold Madeiras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "madeira ripada mr-2102 adesivo, imprimax madeira ripada mr-2102, decormax madeira ripada mr-2102, vinil madeira imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-madeiras"
  },
  {
    "slug": "madeira-ripada-mr-2103",
    "name": "Madeira Ripada MR-2103",
    "code": "0013930059",
    "sku": "IMX13930059",
    "lojaSlug": "imprimax-madeira-ripada-mr-2103",
    "family": "madeira",
    "collection": "Gold Madeiras",
    "description": "Padrão Madeira Ripada MR-2103, da coleção Gold Madeiras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 / 180 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 / 180 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0013930059"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/madeira-ripada-mr-2103/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/madeira-ripada-mr-2103/kit-1.jpg",
        "/assets/images/decor/imprimax/madeira-ripada-mr-2103/kit-2.jpg",
        "/assets/images/decor/imprimax/madeira-ripada-mr-2103/kit-3.jpg",
        "/assets/images/decor/imprimax/madeira-ripada-mr-2103/kit-4.jpg",
        "/assets/images/decor/imprimax/madeira-ripada-mr-2103/kit-5.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/madeira-ripada-mr-2103/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/madeira-ripada-mr-2103/ficha.jpg"
    },
    "seo": {
      "title": "Madeira Ripada MR-2103 — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Madeira Ripada MR-2103, coleção Gold Madeiras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "madeira ripada mr-2103 adesivo, imprimax madeira ripada mr-2103, decormax madeira ripada mr-2103, vinil madeira imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-madeiras"
  },
  {
    "slug": "madeira-tabua-mt-1901",
    "name": "Madeira Tábua MT-1901",
    "code": "0013930050",
    "sku": "IMX13930050",
    "lojaSlug": "imprimax-madeira-tabua-mt-1901",
    "family": "madeira",
    "collection": "Gold Madeiras",
    "description": "Padrão Madeira Tábua MT-1901, da coleção Gold Madeiras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 / 180 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "140 / 180 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0013930050"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/madeira-tabua-mt-1901/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/madeira-tabua-mt-1901/kit-1.jpg",
        "/assets/images/decor/imprimax/madeira-tabua-mt-1901/kit-2.jpg",
        "/assets/images/decor/imprimax/madeira-tabua-mt-1901/kit-3.jpg",
        "/assets/images/decor/imprimax/madeira-tabua-mt-1901/kit-4.jpg",
        "/assets/images/decor/imprimax/madeira-tabua-mt-1901/kit-5.jpg",
        "/assets/images/decor/imprimax/madeira-tabua-mt-1901/kit-6.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/madeira-tabua-mt-1901/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/madeira-tabua-mt-1901/ficha.jpg"
    },
    "seo": {
      "title": "Madeira Tábua MT-1901 — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Madeira Tábua MT-1901, coleção Gold Madeiras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "madeira tábua mt-1901 adesivo, imprimax madeira tábua mt-1901, decormax madeira tábua mt-1901, vinil madeira imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-madeiras"
  },
  {
    "slug": "pedras-ardosia-areia",
    "name": "Ardósia Areia",
    "code": "0014060058",
    "sku": "IMX14060058",
    "lojaSlug": "imprimax-pedras-ardosia-areia",
    "family": "pedra",
    "collection": "Gold Pedras",
    "description": "Padrão Ardósia Areia, da coleção Gold Pedras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014060058"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/pedras-ardosia-areia/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/pedras-ardosia-areia/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/pedras-ardosia-areia/ficha.jpg"
    },
    "seo": {
      "title": "Ardósia Areia — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Ardósia Areia, coleção Gold Pedras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "ardósia areia adesivo, imprimax ardósia areia, decormax ardósia areia, vinil pedra & mármore imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-pedras"
  },
  {
    "slug": "pedras-ardosia-cinza",
    "name": "Ardósia Cinza",
    "code": "0014060057",
    "sku": "IMX14060057",
    "lojaSlug": "imprimax-pedras-ardosia-cinza",
    "family": "pedra",
    "collection": "Gold Pedras",
    "description": "Padrão Ardósia Cinza, da coleção Gold Pedras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014060057"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/pedras-ardosia-cinza/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/pedras-ardosia-cinza/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/pedras-ardosia-cinza/ficha.jpg"
    },
    "seo": {
      "title": "Ardósia Cinza — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Ardósia Cinza, coleção Gold Pedras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "ardósia cinza adesivo, imprimax ardósia cinza, decormax ardósia cinza, vinil pedra & mármore imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-pedras"
  },
  {
    "slug": "pedras-cimento-queimado-1801",
    "name": "Cimento Queimado 1801",
    "code": "0014060011",
    "sku": "IMX14060011",
    "lojaSlug": "imprimax-pedras-cimento-queimado-1801",
    "family": "pedra",
    "collection": "Gold Pedras",
    "description": "Padrão Cimento Queimado 1801, da coleção Gold Pedras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014060011"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/pedras-cimento-queimado-1801/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/pedras-cimento-queimado-1801/kit-1.jpg",
        "/assets/images/decor/imprimax/pedras-cimento-queimado-1801/kit-2.jpg",
        "/assets/images/decor/imprimax/pedras-cimento-queimado-1801/kit-3.jpg",
        "/assets/images/decor/imprimax/pedras-cimento-queimado-1801/kit-4.jpg",
        "/assets/images/decor/imprimax/pedras-cimento-queimado-1801/kit-5.jpg",
        "/assets/images/decor/imprimax/pedras-cimento-queimado-1801/kit-6.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/pedras-cimento-queimado-1801/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/pedras-cimento-queimado-1801/ficha.jpg"
    },
    "seo": {
      "title": "Cimento Queimado 1801 — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Cimento Queimado 1801, coleção Gold Pedras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "cimento queimado 1801 adesivo, imprimax cimento queimado 1801, decormax cimento queimado 1801, vinil pedra & mármore imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-pedras"
  },
  {
    "slug": "pedras-cimento-queimado-grafite",
    "name": "Cimento Queimado Grafite",
    "code": "0014060052",
    "sku": "IMX14060052",
    "lojaSlug": "imprimax-pedras-cimento-queimado-grafite",
    "family": "pedra",
    "collection": "Gold Pedras",
    "description": "Padrão Cimento Queimado Grafite, da coleção Gold Pedras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014060052"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/pedras-cimento-queimado-grafite/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/pedras-cimento-queimado-grafite/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/pedras-cimento-queimado-grafite/ficha.jpg"
    },
    "seo": {
      "title": "Cimento Queimado Grafite — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Cimento Queimado Grafite, coleção Gold Pedras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "cimento queimado grafite adesivo, imprimax cimento queimado grafite, decormax cimento queimado grafite, vinil pedra & mármore imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-pedras"
  },
  {
    "slug": "pedras-cimento-queimado-rustic",
    "name": "Cimento Queimado Rustic",
    "code": "0014060025",
    "sku": "IMX14060025",
    "lojaSlug": "imprimax-pedras-cimento-queimado-rustic",
    "family": "pedra",
    "collection": "Gold Pedras",
    "description": "Padrão Cimento Queimado Rustic, da coleção Gold Pedras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014060025"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/pedras-cimento-queimado-rustic/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/pedras-cimento-queimado-rustic/kit-1.jpg",
        "/assets/images/decor/imprimax/pedras-cimento-queimado-rustic/kit-2.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/pedras-cimento-queimado-rustic/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/pedras-cimento-queimado-rustic/ficha.jpg"
    },
    "seo": {
      "title": "Cimento Queimado Rustic — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Cimento Queimado Rustic, coleção Gold Pedras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "cimento queimado rustic adesivo, imprimax cimento queimado rustic, decormax cimento queimado rustic, vinil pedra & mármore imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-pedras"
  },
  {
    "slug": "pedras-granilite",
    "name": "Granilite",
    "code": "0014060045",
    "sku": "IMX14060045",
    "lojaSlug": "imprimax-pedras-granilite",
    "family": "pedra",
    "collection": "Gold Pedras",
    "description": "Padrão Granilite, da coleção Gold Pedras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014060045"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/pedras-granilite/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/pedras-granilite/kit-1.jpg",
        "/assets/images/decor/imprimax/pedras-granilite/kit-2.jpg",
        "/assets/images/decor/imprimax/pedras-granilite/kit-3.jpg",
        "/assets/images/decor/imprimax/pedras-granilite/kit-4.jpg",
        "/assets/images/decor/imprimax/pedras-granilite/kit-5.jpg",
        "/assets/images/decor/imprimax/pedras-granilite/kit-6.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/pedras-granilite/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/pedras-granilite/ficha.jpg"
    },
    "seo": {
      "title": "Granilite — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Granilite, coleção Gold Pedras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "granilite adesivo, imprimax granilite, decormax granilite, vinil pedra & mármore imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-pedras"
  },
  {
    "slug": "pedras-marmore-alba-gloss",
    "name": "Mármore Alba Gloss",
    "code": "0014060013",
    "sku": "IMX14060013",
    "lojaSlug": "imprimax-pedras-marmore-alba-gloss",
    "family": "pedra",
    "collection": "Gold Pedras",
    "description": "Padrão Mármore Alba Gloss, da coleção Gold Pedras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014060013"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/pedras-marmore-alba-gloss/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/pedras-marmore-alba-gloss/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/pedras-marmore-alba-gloss/ficha.jpg"
    },
    "seo": {
      "title": "Mármore Alba Gloss — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Mármore Alba Gloss, coleção Gold Pedras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "mármore alba gloss adesivo, imprimax mármore alba gloss, decormax mármore alba gloss, vinil pedra & mármore imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-pedras"
  },
  {
    "slug": "pedras-marmore-alba-imperial",
    "name": "Mármore Alba Imperial",
    "code": "0014060014",
    "sku": "IMX14060014",
    "lojaSlug": "imprimax-pedras-marmore-alba-imperial",
    "family": "pedra",
    "collection": "Gold Pedras",
    "description": "Padrão Mármore Alba Imperial, da coleção Gold Pedras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014060014"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/pedras-marmore-alba-imperial/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/pedras-marmore-alba-imperial/kit-1.jpg",
        "/assets/images/decor/imprimax/pedras-marmore-alba-imperial/kit-2.jpg",
        "/assets/images/decor/imprimax/pedras-marmore-alba-imperial/kit-3.jpg",
        "/assets/images/decor/imprimax/pedras-marmore-alba-imperial/kit-4.jpg",
        "/assets/images/decor/imprimax/pedras-marmore-alba-imperial/kit-5.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/pedras-marmore-alba-imperial/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/pedras-marmore-alba-imperial/ficha.jpg"
    },
    "seo": {
      "title": "Mármore Alba Imperial — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Mármore Alba Imperial, coleção Gold Pedras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "mármore alba imperial adesivo, imprimax mármore alba imperial, decormax mármore alba imperial, vinil pedra & mármore imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-pedras"
  },
  {
    "slug": "pedras-marmore-alba-imperial-gloss",
    "name": "Mármore Alba Imperial Gloss",
    "code": "0014060015",
    "sku": "IMX14060015",
    "lojaSlug": "imprimax-pedras-marmore-alba-imperial-gloss",
    "family": "pedra",
    "collection": "Gold Pedras",
    "description": "Padrão Mármore Alba Imperial Gloss, da coleção Gold Pedras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014060015"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/pedras-marmore-alba-imperial-gloss/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/pedras-marmore-alba-imperial-gloss/kit-1.jpg",
        "/assets/images/decor/imprimax/pedras-marmore-alba-imperial-gloss/kit-2.jpg",
        "/assets/images/decor/imprimax/pedras-marmore-alba-imperial-gloss/kit-3.jpg",
        "/assets/images/decor/imprimax/pedras-marmore-alba-imperial-gloss/kit-4.jpg",
        "/assets/images/decor/imprimax/pedras-marmore-alba-imperial-gloss/kit-5.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/pedras-marmore-alba-imperial-gloss/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/pedras-marmore-alba-imperial-gloss/ficha.jpg"
    },
    "seo": {
      "title": "Mármore Alba Imperial Gloss — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Mármore Alba Imperial Gloss, coleção Gold Pedras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "mármore alba imperial gloss adesivo, imprimax mármore alba imperial gloss, decormax mármore alba imperial gloss, vinil pedra & mármore imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-pedras"
  },
  {
    "slug": "pedras-marmore-branco-marquina-gloss",
    "name": "Mármore Branco Marquina Gloss",
    "code": "0014060063",
    "sku": "IMX14060063",
    "lojaSlug": "imprimax-pedras-marmore-branco-marquina-gloss",
    "family": "pedra",
    "collection": "Gold Pedras",
    "description": "Padrão Mármore Branco Marquina Gloss, da coleção Gold Pedras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014060063"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/pedras-marmore-branco-marquina-gloss/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/pedras-marmore-branco-marquina-gloss/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/pedras-marmore-branco-marquina-gloss/ficha.jpg"
    },
    "seo": {
      "title": "Mármore Branco Marquina Gloss — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Mármore Branco Marquina Gloss, coleção Gold Pedras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "mármore branco marquina gloss adesivo, imprimax mármore branco marquina gloss, decormax mármore branco marquina gloss, vinil pedra & mármore imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-pedras"
  },
  {
    "slug": "pedras-marmore-calacatta",
    "name": "Mármore Calacatta",
    "code": "0014060006",
    "sku": "IMX14060006",
    "lojaSlug": "imprimax-pedras-marmore-calacatta",
    "family": "pedra",
    "collection": "Gold Pedras",
    "description": "Padrão Mármore Calacatta, da coleção Gold Pedras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014060006"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/pedras-marmore-calacatta/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/pedras-marmore-calacatta/kit-1.jpg",
        "/assets/images/decor/imprimax/pedras-marmore-calacatta/kit-2.jpg",
        "/assets/images/decor/imprimax/pedras-marmore-calacatta/kit-3.jpg",
        "/assets/images/decor/imprimax/pedras-marmore-calacatta/kit-4.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/pedras-marmore-calacatta/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/pedras-marmore-calacatta/ficha.jpg"
    },
    "seo": {
      "title": "Mármore Calacatta — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Mármore Calacatta, coleção Gold Pedras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "mármore calacatta adesivo, imprimax mármore calacatta, decormax mármore calacatta, vinil pedra & mármore imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-pedras"
  },
  {
    "slug": "pedras-marmore-calacatta-athenas",
    "name": "Mármore Calacatta Athenas",
    "code": "0014060041",
    "sku": "IMX14060041",
    "lojaSlug": "imprimax-pedras-marmore-calacatta-athenas",
    "family": "pedra",
    "collection": "Gold Pedras",
    "description": "Padrão Mármore Calacatta Athenas, da coleção Gold Pedras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014060041"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/pedras-marmore-calacatta-athenas/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/pedras-marmore-calacatta-athenas/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/pedras-marmore-calacatta-athenas/ficha.jpg"
    },
    "seo": {
      "title": "Mármore Calacatta Athenas — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Mármore Calacatta Athenas, coleção Gold Pedras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "mármore calacatta athenas adesivo, imprimax mármore calacatta athenas, decormax mármore calacatta athenas, vinil pedra & mármore imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-pedras"
  },
  {
    "slug": "pedras-marmore-calacatta-fosco",
    "name": "Mármore Calacatta Fosco",
    "code": "0014060053",
    "sku": "IMX14060053",
    "lojaSlug": "imprimax-pedras-marmore-calacatta-fosco",
    "family": "pedra",
    "collection": "Gold Pedras",
    "description": "Padrão Mármore Calacatta Fosco, da coleção Gold Pedras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014060053"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/pedras-marmore-calacatta-fosco/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/pedras-marmore-calacatta-fosco/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/pedras-marmore-calacatta-fosco/ficha.jpg"
    },
    "seo": {
      "title": "Mármore Calacatta Fosco — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Mármore Calacatta Fosco, coleção Gold Pedras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "mármore calacatta fosco adesivo, imprimax mármore calacatta fosco, decormax mármore calacatta fosco, vinil pedra & mármore imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-pedras"
  },
  {
    "slug": "pedras-marmore-calacatta-ouro-gloss",
    "name": "Mármore Calacatta Ouro Gloss",
    "code": "0014060070",
    "sku": "IMX14060070",
    "lojaSlug": "imprimax-pedras-marmore-calacatta-ouro-gloss",
    "family": "pedra",
    "collection": "Gold Pedras",
    "description": "Padrão Mármore Calacatta Ouro Gloss, da coleção Gold Pedras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014060070"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/pedras-marmore-calacatta-ouro-gloss/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/pedras-marmore-calacatta-ouro-gloss/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/pedras-marmore-calacatta-ouro-gloss/ficha.jpg"
    },
    "seo": {
      "title": "Mármore Calacatta Ouro Gloss — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Mármore Calacatta Ouro Gloss, coleção Gold Pedras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "mármore calacatta ouro gloss adesivo, imprimax mármore calacatta ouro gloss, decormax mármore calacatta ouro gloss, vinil pedra & mármore imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-pedras"
  },
  {
    "slug": "pedras-marmore-calacatta-ouro-matte",
    "name": "Mármore Calacatta Ouro Matte",
    "code": "0014060069",
    "sku": "IMX14060069",
    "lojaSlug": "imprimax-pedras-marmore-calacatta-ouro-matte",
    "family": "pedra",
    "collection": "Gold Pedras",
    "description": "Padrão Mármore Calacatta Ouro Matte, da coleção Gold Pedras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014060069"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/pedras-marmore-calacatta-ouro-matte/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/pedras-marmore-calacatta-ouro-matte/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/pedras-marmore-calacatta-ouro-matte/ficha.jpg"
    },
    "seo": {
      "title": "Mármore Calacatta Ouro Matte — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Mármore Calacatta Ouro Matte, coleção Gold Pedras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "mármore calacatta ouro matte adesivo, imprimax mármore calacatta ouro matte, decormax mármore calacatta ouro matte, vinil pedra & mármore imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-pedras"
  },
  {
    "slug": "pedras-marmore-carrara",
    "name": "Mármore Carrara",
    "code": "0014060001",
    "sku": "IMX14060001",
    "lojaSlug": "imprimax-pedras-marmore-carrara",
    "family": "pedra",
    "collection": "Gold Pedras",
    "description": "Padrão Mármore Carrara, da coleção Gold Pedras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014060001"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/pedras-marmore-carrara/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/pedras-marmore-carrara/kit-1.jpg",
        "/assets/images/decor/imprimax/pedras-marmore-carrara/kit-2.jpg",
        "/assets/images/decor/imprimax/pedras-marmore-carrara/kit-3.jpg",
        "/assets/images/decor/imprimax/pedras-marmore-carrara/kit-4.jpg",
        "/assets/images/decor/imprimax/pedras-marmore-carrara/kit-5.jpg",
        "/assets/images/decor/imprimax/pedras-marmore-carrara/kit-6.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/pedras-marmore-carrara/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/pedras-marmore-carrara/ficha.jpg"
    },
    "seo": {
      "title": "Mármore Carrara — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Mármore Carrara, coleção Gold Pedras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "mármore carrara adesivo, imprimax mármore carrara, decormax mármore carrara, vinil pedra & mármore imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-pedras"
  },
  {
    "slug": "pedras-marmore-cinza-armani-gloss",
    "name": "Mármore Cinza Armani Gloss",
    "code": "0014060061",
    "sku": "IMX14060061",
    "lojaSlug": "imprimax-pedras-marmore-cinza-armani-gloss",
    "family": "pedra",
    "collection": "Gold Pedras",
    "description": "Padrão Mármore Cinza Armani Gloss, da coleção Gold Pedras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014060061"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/pedras-marmore-cinza-armani-gloss/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/pedras-marmore-cinza-armani-gloss/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/pedras-marmore-cinza-armani-gloss/ficha.jpg"
    },
    "seo": {
      "title": "Mármore Cinza Armani Gloss — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Mármore Cinza Armani Gloss, coleção Gold Pedras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "mármore cinza armani gloss adesivo, imprimax mármore cinza armani gloss, decormax mármore cinza armani gloss, vinil pedra & mármore imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-pedras"
  },
  {
    "slug": "pedras-marmore-crema-armani-gloss",
    "name": "Mármore Crema Armani Gloss",
    "code": "0014060062",
    "sku": "IMX14060062",
    "lojaSlug": "imprimax-pedras-marmore-crema-armani-gloss",
    "family": "pedra",
    "collection": "Gold Pedras",
    "description": "Padrão Mármore Crema Armani Gloss, da coleção Gold Pedras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014060062"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/pedras-marmore-crema-armani-gloss/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/pedras-marmore-crema-armani-gloss/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/pedras-marmore-crema-armani-gloss/ficha.jpg"
    },
    "seo": {
      "title": "Mármore Crema Armani Gloss — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Mármore Crema Armani Gloss, coleção Gold Pedras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "mármore crema armani gloss adesivo, imprimax mármore crema armani gloss, decormax mármore crema armani gloss, vinil pedra & mármore imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-pedras"
  },
  {
    "slug": "pedras-marmore-luna-gloss",
    "name": "Mármore Luna Gloss",
    "code": "0014060017",
    "sku": "IMX14060017",
    "lojaSlug": "imprimax-pedras-marmore-luna-gloss",
    "family": "pedra",
    "collection": "Gold Pedras",
    "description": "Padrão Mármore Luna Gloss, da coleção Gold Pedras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014060017"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/pedras-marmore-luna-gloss/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/pedras-marmore-luna-gloss/kit-1.jpg",
        "/assets/images/decor/imprimax/pedras-marmore-luna-gloss/kit-2.jpg",
        "/assets/images/decor/imprimax/pedras-marmore-luna-gloss/kit-3.jpg",
        "/assets/images/decor/imprimax/pedras-marmore-luna-gloss/kit-4.jpg",
        "/assets/images/decor/imprimax/pedras-marmore-luna-gloss/kit-5.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/pedras-marmore-luna-gloss/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/pedras-marmore-luna-gloss/ficha.jpg"
    },
    "seo": {
      "title": "Mármore Luna Gloss — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Mármore Luna Gloss, coleção Gold Pedras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "mármore luna gloss adesivo, imprimax mármore luna gloss, decormax mármore luna gloss, vinil pedra & mármore imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-pedras"
  },
  {
    "slug": "pedras-marmore-luna-imperial",
    "name": "Mármore Luna Imperial",
    "code": "0014060018",
    "sku": "IMX14060018",
    "lojaSlug": "imprimax-pedras-marmore-luna-imperial",
    "family": "pedra",
    "collection": "Gold Pedras",
    "description": "Padrão Mármore Luna Imperial, da coleção Gold Pedras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014060018"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/pedras-marmore-luna-imperial/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/pedras-marmore-luna-imperial/kit-1.jpg",
        "/assets/images/decor/imprimax/pedras-marmore-luna-imperial/kit-2.jpg",
        "/assets/images/decor/imprimax/pedras-marmore-luna-imperial/kit-3.jpg",
        "/assets/images/decor/imprimax/pedras-marmore-luna-imperial/kit-4.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/pedras-marmore-luna-imperial/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/pedras-marmore-luna-imperial/ficha.jpg"
    },
    "seo": {
      "title": "Mármore Luna Imperial — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Mármore Luna Imperial, coleção Gold Pedras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "mármore luna imperial adesivo, imprimax mármore luna imperial, decormax mármore luna imperial, vinil pedra & mármore imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-pedras"
  },
  {
    "slug": "pedras-marmore-luna-imperial-gloss",
    "name": "Mármore Luna Imperial Gloss",
    "code": "0014060019",
    "sku": "IMX14060019",
    "lojaSlug": "imprimax-pedras-marmore-luna-imperial-gloss",
    "family": "pedra",
    "collection": "Gold Pedras",
    "description": "Padrão Mármore Luna Imperial Gloss, da coleção Gold Pedras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014060019"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/pedras-marmore-luna-imperial-gloss/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/pedras-marmore-luna-imperial-gloss/kit-1.jpg",
        "/assets/images/decor/imprimax/pedras-marmore-luna-imperial-gloss/kit-2.jpg",
        "/assets/images/decor/imprimax/pedras-marmore-luna-imperial-gloss/kit-3.jpg",
        "/assets/images/decor/imprimax/pedras-marmore-luna-imperial-gloss/kit-4.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/pedras-marmore-luna-imperial-gloss/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/pedras-marmore-luna-imperial-gloss/ficha.jpg"
    },
    "seo": {
      "title": "Mármore Luna Imperial Gloss — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Mármore Luna Imperial Gloss, coleção Gold Pedras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "mármore luna imperial gloss adesivo, imprimax mármore luna imperial gloss, decormax mármore luna imperial gloss, vinil pedra & mármore imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-pedras"
  },
  {
    "slug": "pedras-marmore-marrom-armani-gloss",
    "name": "Mármore Marrom Armani Gloss",
    "code": "0014060059",
    "sku": "IMX14060059",
    "lojaSlug": "imprimax-pedras-marmore-marrom-armani-gloss",
    "family": "pedra",
    "collection": "Gold Pedras",
    "description": "Padrão Mármore Marrom Armani Gloss, da coleção Gold Pedras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014060059"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/pedras-marmore-marrom-armani-gloss/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/pedras-marmore-marrom-armani-gloss/kit-1.jpg",
        "/assets/images/decor/imprimax/pedras-marmore-marrom-armani-gloss/kit-2.jpg",
        "/assets/images/decor/imprimax/pedras-marmore-marrom-armani-gloss/kit-3.jpg",
        "/assets/images/decor/imprimax/pedras-marmore-marrom-armani-gloss/kit-4.jpg",
        "/assets/images/decor/imprimax/pedras-marmore-marrom-armani-gloss/kit-5.jpg",
        "/assets/images/decor/imprimax/pedras-marmore-marrom-armani-gloss/kit-6.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/pedras-marmore-marrom-armani-gloss/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/pedras-marmore-marrom-armani-gloss/ficha.jpg"
    },
    "seo": {
      "title": "Mármore Marrom Armani Gloss — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Mármore Marrom Armani Gloss, coleção Gold Pedras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "mármore marrom armani gloss adesivo, imprimax mármore marrom armani gloss, decormax mármore marrom armani gloss, vinil pedra & mármore imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-pedras"
  },
  {
    "slug": "pedras-marmore-travertino-fosco",
    "name": "Mármore Travertino Fosco",
    "code": "0014060046",
    "sku": "IMX14060046",
    "lojaSlug": "imprimax-pedras-marmore-travertino-fosco",
    "family": "pedra",
    "collection": "Gold Pedras",
    "description": "Padrão Mármore Travertino Fosco, da coleção Gold Pedras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014060046"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/pedras-marmore-travertino-fosco/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/pedras-marmore-travertino-fosco/kit-1.jpg",
        "/assets/images/decor/imprimax/pedras-marmore-travertino-fosco/kit-2.jpg",
        "/assets/images/decor/imprimax/pedras-marmore-travertino-fosco/kit-3.jpg",
        "/assets/images/decor/imprimax/pedras-marmore-travertino-fosco/kit-4.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/pedras-marmore-travertino-fosco/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/pedras-marmore-travertino-fosco/ficha.jpg"
    },
    "seo": {
      "title": "Mármore Travertino Fosco — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Mármore Travertino Fosco, coleção Gold Pedras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "mármore travertino fosco adesivo, imprimax mármore travertino fosco, decormax mármore travertino fosco, vinil pedra & mármore imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-pedras"
  },
  {
    "slug": "pedras-marmore-travertino-semi-brilho",
    "name": "Mármore Travertino Semi Brilho",
    "code": "0014060047",
    "sku": "IMX14060047",
    "lojaSlug": "imprimax-pedras-marmore-travertino-semi-brilho",
    "family": "pedra",
    "collection": "Gold Pedras",
    "description": "Padrão Mármore Travertino Semi Brilho, da coleção Gold Pedras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014060047"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/pedras-marmore-travertino-semi-brilho/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/pedras-marmore-travertino-semi-brilho/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/pedras-marmore-travertino-semi-brilho/ficha.jpg"
    },
    "seo": {
      "title": "Mármore Travertino Semi Brilho — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Mármore Travertino Semi Brilho, coleção Gold Pedras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "mármore travertino semi brilho adesivo, imprimax mármore travertino semi brilho, decormax mármore travertino semi brilho, vinil pedra & mármore imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-pedras"
  },
  {
    "slug": "pedras-marmore-travertino-super-brilho",
    "name": "Mármore Travertino Super Brilho",
    "code": "0014060048",
    "sku": "IMX14060048",
    "lojaSlug": "imprimax-pedras-marmore-travertino-super-brilho",
    "family": "pedra",
    "collection": "Gold Pedras",
    "description": "Padrão Mármore Travertino Super Brilho, da coleção Gold Pedras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014060048"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/pedras-marmore-travertino-super-brilho/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/pedras-marmore-travertino-super-brilho/kit-1.jpg",
        "/assets/images/decor/imprimax/pedras-marmore-travertino-super-brilho/kit-2.jpg",
        "/assets/images/decor/imprimax/pedras-marmore-travertino-super-brilho/kit-3.jpg",
        "/assets/images/decor/imprimax/pedras-marmore-travertino-super-brilho/kit-4.jpg",
        "/assets/images/decor/imprimax/pedras-marmore-travertino-super-brilho/kit-5.jpg",
        "/assets/images/decor/imprimax/pedras-marmore-travertino-super-brilho/kit-6.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/pedras-marmore-travertino-super-brilho/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/pedras-marmore-travertino-super-brilho/ficha.jpg"
    },
    "seo": {
      "title": "Mármore Travertino Super Brilho — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Mármore Travertino Super Brilho, coleção Gold Pedras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "mármore travertino super brilho adesivo, imprimax mármore travertino super brilho, decormax mármore travertino super brilho, vinil pedra & mármore imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-pedras"
  },
  {
    "slug": "pedras-miracema-areia",
    "name": "Miracema Areia",
    "code": "0014060068",
    "sku": "IMX14060068",
    "lojaSlug": "imprimax-pedras-miracema-areia",
    "family": "pedra",
    "collection": "Gold Pedras",
    "description": "Padrão Miracema Areia, da coleção Gold Pedras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014060068"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/pedras-miracema-areia/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/pedras-miracema-areia/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/pedras-miracema-areia/ficha.jpg"
    },
    "seo": {
      "title": "Miracema Areia — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Miracema Areia, coleção Gold Pedras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "miracema areia adesivo, imprimax miracema areia, decormax miracema areia, vinil pedra & mármore imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-pedras"
  },
  {
    "slug": "pedras-miracema-rosa",
    "name": "Miracema Rosa",
    "code": "0014060054",
    "sku": "IMX14060054",
    "lojaSlug": "imprimax-pedras-miracema-rosa",
    "family": "pedra",
    "collection": "Gold Pedras",
    "description": "Padrão Miracema Rosa, da coleção Gold Pedras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014060054"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/pedras-miracema-rosa/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/pedras-miracema-rosa/kit-1.jpg",
        "/assets/images/decor/imprimax/pedras-miracema-rosa/kit-2.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/pedras-miracema-rosa/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/pedras-miracema-rosa/ficha.jpg"
    },
    "seo": {
      "title": "Miracema Rosa — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Miracema Rosa, coleção Gold Pedras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "miracema rosa adesivo, imprimax miracema rosa, decormax miracema rosa, vinil pedra & mármore imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-pedras"
  },
  {
    "slug": "pedras-seixos-2601",
    "name": "Seixos 2601",
    "code": "0014060031",
    "sku": "IMX14060031",
    "lojaSlug": "imprimax-pedras-seixos-2601",
    "family": "pedra",
    "collection": "Gold Pedras",
    "description": "Padrão Seixos 2601, da coleção Gold Pedras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014060031"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/pedras-seixos-2601/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/pedras-seixos-2601/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/pedras-seixos-2601/ficha.jpg"
    },
    "seo": {
      "title": "Seixos 2601 — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Seixos 2601, coleção Gold Pedras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "seixos 2601 adesivo, imprimax seixos 2601, decormax seixos 2601, vinil pedra & mármore imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-pedras"
  },
  {
    "slug": "pedras-seixos-2602",
    "name": "Seixos 2602",
    "code": "0014060032",
    "sku": "IMX14060032",
    "lojaSlug": "imprimax-pedras-seixos-2602",
    "family": "pedra",
    "collection": "Gold Pedras",
    "description": "Padrão Seixos 2602, da coleção Gold Pedras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014060032"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/pedras-seixos-2602/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/pedras-seixos-2602/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/pedras-seixos-2602/ficha.jpg"
    },
    "seo": {
      "title": "Seixos 2602 — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Seixos 2602, coleção Gold Pedras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "seixos 2602 adesivo, imprimax seixos 2602, decormax seixos 2602, vinil pedra & mármore imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-pedras"
  },
  {
    "slug": "pedras-terrazzo-cinza-matte",
    "name": "Terrazzo Cinza Matte",
    "code": "0014060071",
    "sku": "IMX14060071",
    "lojaSlug": "imprimax-pedras-terrazzo-cinza-matte",
    "family": "pedra",
    "collection": "Gold Pedras",
    "description": "Padrão Terrazzo Cinza Matte, da coleção Gold Pedras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014060071"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/pedras-terrazzo-cinza-matte/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/pedras-terrazzo-cinza-matte/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/pedras-terrazzo-cinza-matte/ficha.jpg"
    },
    "seo": {
      "title": "Terrazzo Cinza Matte — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Terrazzo Cinza Matte, coleção Gold Pedras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "terrazzo cinza matte adesivo, imprimax terrazzo cinza matte, decormax terrazzo cinza matte, vinil pedra & mármore imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-pedras"
  },
  {
    "slug": "pedras-terrazzo-off-white-matte",
    "name": "Terrazzo Off White Matte",
    "code": "0014060072",
    "sku": "IMX14060072",
    "lojaSlug": "imprimax-pedras-terrazzo-off-white-matte",
    "family": "pedra",
    "collection": "Gold Pedras",
    "description": "Padrão Terrazzo Off White Matte, da coleção Gold Pedras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014060072"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/pedras-terrazzo-off-white-matte/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/pedras-terrazzo-off-white-matte/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/pedras-terrazzo-off-white-matte/ficha.jpg"
    },
    "seo": {
      "title": "Terrazzo Off White Matte — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Terrazzo Off White Matte, coleção Gold Pedras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "terrazzo off white matte adesivo, imprimax terrazzo off white matte, decormax terrazzo off white matte, vinil pedra & mármore imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-pedras"
  },
  {
    "slug": "pedras-terrazzo-romano",
    "name": "Terrazzo Romano",
    "code": "0014060073",
    "sku": "IMX14060073",
    "lojaSlug": "imprimax-pedras-terrazzo-romano",
    "family": "pedra",
    "collection": "Gold Pedras",
    "description": "Padrão Terrazzo Romano, da coleção Gold Pedras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014060073"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/pedras-terrazzo-romano/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/pedras-terrazzo-romano/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/pedras-terrazzo-romano/ficha.jpg"
    },
    "seo": {
      "title": "Terrazzo Romano — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Terrazzo Romano, coleção Gold Pedras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "terrazzo romano adesivo, imprimax terrazzo romano, decormax terrazzo romano, vinil pedra & mármore imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-pedras"
  },
  {
    "slug": "pedras-tijolo-branco-1803",
    "name": "Tijolo Branco 1803",
    "code": "0014060023",
    "sku": "IMX14060023",
    "lojaSlug": "imprimax-pedras-tijolo-branco-1803",
    "family": "pedra",
    "collection": "Gold Pedras",
    "description": "Padrão Tijolo Branco 1803, da coleção Gold Pedras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014060023"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/pedras-tijolo-branco-1803/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/pedras-tijolo-branco-1803/kit-1.jpg",
        "/assets/images/decor/imprimax/pedras-tijolo-branco-1803/kit-2.jpg",
        "/assets/images/decor/imprimax/pedras-tijolo-branco-1803/kit-3.jpg",
        "/assets/images/decor/imprimax/pedras-tijolo-branco-1803/kit-4.jpg",
        "/assets/images/decor/imprimax/pedras-tijolo-branco-1803/kit-5.jpg",
        "/assets/images/decor/imprimax/pedras-tijolo-branco-1803/kit-6.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/pedras-tijolo-branco-1803/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/pedras-tijolo-branco-1803/ficha.jpg"
    },
    "seo": {
      "title": "Tijolo Branco 1803 — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Tijolo Branco 1803, coleção Gold Pedras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "tijolo branco 1803 adesivo, imprimax tijolo branco 1803, decormax tijolo branco 1803, vinil pedra & mármore imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-pedras"
  },
  {
    "slug": "pedras-tijolo-vermelho-1801",
    "name": "Tijolo Vermelho 1801",
    "code": "0014060021",
    "sku": "IMX14060021",
    "lojaSlug": "imprimax-pedras-tijolo-vermelho-1801",
    "family": "pedra",
    "collection": "Gold Pedras",
    "description": "Padrão Tijolo Vermelho 1801, da coleção Gold Pedras da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014060021"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/pedras-tijolo-vermelho-1801/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/pedras-tijolo-vermelho-1801/kit-1.jpg",
        "/assets/images/decor/imprimax/pedras-tijolo-vermelho-1801/kit-2.jpg",
        "/assets/images/decor/imprimax/pedras-tijolo-vermelho-1801/kit-3.jpg",
        "/assets/images/decor/imprimax/pedras-tijolo-vermelho-1801/kit-4.jpg",
        "/assets/images/decor/imprimax/pedras-tijolo-vermelho-1801/kit-5.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/pedras-tijolo-vermelho-1801/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/pedras-tijolo-vermelho-1801/ficha.jpg"
    },
    "seo": {
      "title": "Tijolo Vermelho 1801 — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Tijolo Vermelho 1801, coleção Gold Pedras, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "tijolo vermelho 1801 adesivo, imprimax tijolo vermelho 1801, decormax tijolo vermelho 1801, vinil pedra & mármore imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-pedras"
  },
  {
    "slug": "formica-laca-bege-palha",
    "name": "Fórmica Laca Bege Palha",
    "code": "0010420001",
    "sku": "IMX10420001",
    "lojaSlug": "imprimax-formica-laca-bege-palha",
    "family": "formica",
    "collection": "Gold Fórmica Laca",
    "description": "Padrão Fórmica Laca Bege Palha, da coleção Gold Fórmica Laca da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 160 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Poliéster 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0010420001"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/formica-laca-bege-palha/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/formica-laca-bege-palha/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/formica-laca-bege-palha/ficha.jpg"
    },
    "seo": {
      "title": "Fórmica Laca Bege Palha — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Fórmica Laca Bege Palha, coleção Gold Fórmica Laca, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "fórmica laca bege palha adesivo, imprimax fórmica laca bege palha, decormax fórmica laca bege palha, vinil fórmica imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/formica-laca"
  },
  {
    "slug": "formica-laca-branco",
    "name": "Fórmica Laca Branco",
    "code": "0010420005",
    "sku": "IMX10420005",
    "lojaSlug": "imprimax-formica-laca-branco",
    "family": "formica",
    "collection": "Gold Fórmica Laca",
    "description": "Padrão Fórmica Laca Branco, da coleção Gold Fórmica Laca da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 160 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Poliéster 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0010420005"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/formica-laca-branco/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/formica-laca-branco/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/formica-laca-branco/ficha.jpg"
    },
    "seo": {
      "title": "Fórmica Laca Branco — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Fórmica Laca Branco, coleção Gold Fórmica Laca, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "fórmica laca branco adesivo, imprimax fórmica laca branco, decormax fórmica laca branco, vinil fórmica imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/formica-laca"
  },
  {
    "slug": "formica-laca-cinza-glacial",
    "name": "Fórmica Laca Cinza Glacial",
    "code": "0010420009",
    "sku": "IMX10420009",
    "lojaSlug": "imprimax-formica-laca-cinza-glacial",
    "family": "formica",
    "collection": "Gold Fórmica Laca",
    "description": "Padrão Fórmica Laca Cinza Glacial, da coleção Gold Fórmica Laca da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 160 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Poliéster 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0010420009"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/formica-laca-cinza-glacial/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/formica-laca-cinza-glacial/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/formica-laca-cinza-glacial/ficha.jpg"
    },
    "seo": {
      "title": "Fórmica Laca Cinza Glacial — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Fórmica Laca Cinza Glacial, coleção Gold Fórmica Laca, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "fórmica laca cinza glacial adesivo, imprimax fórmica laca cinza glacial, decormax fórmica laca cinza glacial, vinil fórmica imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/formica-laca"
  },
  {
    "slug": "formica-laca-fendi",
    "name": "Fórmica Laca Fendi",
    "code": "0010420013",
    "sku": "IMX10420013",
    "lojaSlug": "imprimax-formica-laca-fendi",
    "family": "formica",
    "collection": "Gold Fórmica Laca",
    "description": "Padrão Fórmica Laca Fendi, da coleção Gold Fórmica Laca da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 160 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Poliéster 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0010420013"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/formica-laca-fendi/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/formica-laca-fendi/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/formica-laca-fendi/ficha.jpg"
    },
    "seo": {
      "title": "Fórmica Laca Fendi — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Fórmica Laca Fendi, coleção Gold Fórmica Laca, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "fórmica laca fendi adesivo, imprimax fórmica laca fendi, decormax fórmica laca fendi, vinil fórmica imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/formica-laca"
  },
  {
    "slug": "formica-laca-grafite",
    "name": "Fórmica Laca Grafite",
    "code": "0010420017",
    "sku": "IMX10420017",
    "lojaSlug": "imprimax-formica-laca-grafite",
    "family": "formica",
    "collection": "Gold Fórmica Laca",
    "description": "Padrão Fórmica Laca Grafite, da coleção Gold Fórmica Laca da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 160 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Poliéster 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0010420017"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/formica-laca-grafite/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/formica-laca-grafite/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/formica-laca-grafite/ficha.jpg"
    },
    "seo": {
      "title": "Fórmica Laca Grafite — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Fórmica Laca Grafite, coleção Gold Fórmica Laca, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "fórmica laca grafite adesivo, imprimax fórmica laca grafite, decormax fórmica laca grafite, vinil fórmica imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/formica-laca"
  },
  {
    "slug": "formica-laca-preto",
    "name": "Fórmica Laca Preto",
    "code": "0010420021",
    "sku": "IMX10420021",
    "lojaSlug": "imprimax-formica-laca-preto",
    "family": "formica",
    "collection": "Gold Fórmica Laca",
    "description": "Padrão Fórmica Laca Preto, da coleção Gold Fórmica Laca da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 160 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Poliéster 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0010420021"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/formica-laca-preto/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/formica-laca-preto/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/formica-laca-preto/ficha.jpg"
    },
    "seo": {
      "title": "Fórmica Laca Preto — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Fórmica Laca Preto, coleção Gold Fórmica Laca, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "fórmica laca preto adesivo, imprimax fórmica laca preto, decormax fórmica laca preto, vinil fórmica imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/formica-laca"
  },
  {
    "slug": "formica-ripada-azul-petroleo",
    "name": "Fórmica Ripada Azul Petróleo",
    "code": "0010410004",
    "sku": "IMX10410004",
    "lojaSlug": "imprimax-formica-ripada-azul-petroleo",
    "family": "formica",
    "collection": "Gold Fórmica Ripada",
    "description": "Padrão Fórmica Ripada Azul Petróleo, da coleção Gold Fórmica Ripada da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0010410004"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/formica-ripada-azul-petroleo/texture.jpg",
      "ambient": [],
      "ficha": "/assets/images/decor/imprimax/formica-ripada-azul-petroleo/ficha.jpg"
    },
    "seo": {
      "title": "Fórmica Ripada Azul Petróleo — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Fórmica Ripada Azul Petróleo, coleção Gold Fórmica Ripada, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "fórmica ripada azul petróleo adesivo, imprimax fórmica ripada azul petróleo, decormax fórmica ripada azul petróleo, vinil fórmica imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-formica-ripada"
  },
  {
    "slug": "formica-ripada-bege-palha",
    "name": "Fórmica Ripada Bege Palha",
    "code": "0010410006",
    "sku": "IMX10410006",
    "lojaSlug": "imprimax-formica-ripada-bege-palha",
    "family": "formica",
    "collection": "Gold Fórmica Ripada",
    "description": "Padrão Fórmica Ripada Bege Palha, da coleção Gold Fórmica Ripada da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0010410006"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/formica-ripada-bege-palha/texture.jpg",
      "ambient": [],
      "ficha": "/assets/images/decor/imprimax/formica-ripada-bege-palha/ficha.jpg"
    },
    "seo": {
      "title": "Fórmica Ripada Bege Palha — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Fórmica Ripada Bege Palha, coleção Gold Fórmica Ripada, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "fórmica ripada bege palha adesivo, imprimax fórmica ripada bege palha, decormax fórmica ripada bege palha, vinil fórmica imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-formica-ripada"
  },
  {
    "slug": "formica-ripada-branco",
    "name": "Fórmica Ripada Branco",
    "code": "0010410007",
    "sku": "IMX10410007",
    "lojaSlug": "imprimax-formica-ripada-branco",
    "family": "formica",
    "collection": "Gold Fórmica Ripada",
    "description": "Padrão Fórmica Ripada Branco, da coleção Gold Fórmica Ripada da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0010410007"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/formica-ripada-branco/texture.jpg",
      "ambient": [],
      "ficha": "/assets/images/decor/imprimax/formica-ripada-branco/ficha.jpg"
    },
    "seo": {
      "title": "Fórmica Ripada Branco — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Fórmica Ripada Branco, coleção Gold Fórmica Ripada, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "fórmica ripada branco adesivo, imprimax fórmica ripada branco, decormax fórmica ripada branco, vinil fórmica imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-formica-ripada"
  },
  {
    "slug": "formica-ripada-cinza-glacial",
    "name": "Fórmica Ripada Cinza Glacial",
    "code": "0010410002",
    "sku": "IMX10410002",
    "lojaSlug": "imprimax-formica-ripada-cinza-glacial",
    "family": "formica",
    "collection": "Gold Fórmica Ripada",
    "description": "Padrão Fórmica Ripada Cinza Glacial, da coleção Gold Fórmica Ripada da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0010410002"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/formica-ripada-cinza-glacial/texture.jpg",
      "ambient": [],
      "ficha": "/assets/images/decor/imprimax/formica-ripada-cinza-glacial/ficha.jpg"
    },
    "seo": {
      "title": "Fórmica Ripada Cinza Glacial — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Fórmica Ripada Cinza Glacial, coleção Gold Fórmica Ripada, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "fórmica ripada cinza glacial adesivo, imprimax fórmica ripada cinza glacial, decormax fórmica ripada cinza glacial, vinil fórmica imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-formica-ripada"
  },
  {
    "slug": "formica-ripada-cobre-vecchio",
    "name": "Fórmica Ripada Cobre Vecchio",
    "code": "0010410005",
    "sku": "IMX10410005",
    "lojaSlug": "imprimax-formica-ripada-cobre-vecchio",
    "family": "formica",
    "collection": "Gold Fórmica Ripada",
    "description": "Padrão Fórmica Ripada Cobre Vecchio, da coleção Gold Fórmica Ripada da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0010410005"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/formica-ripada-cobre-vecchio/texture.jpg",
      "ambient": [],
      "ficha": "/assets/images/decor/imprimax/formica-ripada-cobre-vecchio/ficha.jpg"
    },
    "seo": {
      "title": "Fórmica Ripada Cobre Vecchio — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Fórmica Ripada Cobre Vecchio, coleção Gold Fórmica Ripada, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "fórmica ripada cobre vecchio adesivo, imprimax fórmica ripada cobre vecchio, decormax fórmica ripada cobre vecchio, vinil fórmica imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-formica-ripada"
  },
  {
    "slug": "formica-ripada-fendi",
    "name": "Fórmica Ripada Fendi",
    "code": "0010410003",
    "sku": "IMX10410003",
    "lojaSlug": "imprimax-formica-ripada-fendi",
    "family": "formica",
    "collection": "Gold Fórmica Ripada",
    "description": "Padrão Fórmica Ripada Fendi, da coleção Gold Fórmica Ripada da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0010410003"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/formica-ripada-fendi/texture.jpg",
      "ambient": [],
      "ficha": "/assets/images/decor/imprimax/formica-ripada-fendi/ficha.jpg"
    },
    "seo": {
      "title": "Fórmica Ripada Fendi — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Fórmica Ripada Fendi, coleção Gold Fórmica Ripada, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "fórmica ripada fendi adesivo, imprimax fórmica ripada fendi, decormax fórmica ripada fendi, vinil fórmica imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-formica-ripada"
  },
  {
    "slug": "formica-ripada-grafite",
    "name": "Fórmica Ripada Grafite",
    "code": "0010410001",
    "sku": "IMX10410001",
    "lojaSlug": "imprimax-formica-ripada-grafite",
    "family": "formica",
    "collection": "Gold Fórmica Ripada",
    "description": "Padrão Fórmica Ripada Grafite, da coleção Gold Fórmica Ripada da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0010410001"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/formica-ripada-grafite/texture.jpg",
      "ambient": [],
      "ficha": "/assets/images/decor/imprimax/formica-ripada-grafite/ficha.jpg"
    },
    "seo": {
      "title": "Fórmica Ripada Grafite — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Fórmica Ripada Grafite, coleção Gold Fórmica Ripada, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "fórmica ripada grafite adesivo, imprimax fórmica ripada grafite, decormax fórmica ripada grafite, vinil fórmica imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-formica-ripada"
  },
  {
    "slug": "formica-satin-areia",
    "name": "Fórmica Satin Areia",
    "code": "0010250021",
    "sku": "IMX10250021",
    "lojaSlug": "imprimax-formica-satin-areia",
    "family": "formica",
    "collection": "Gold Fórmica Satin",
    "description": "Padrão Fórmica Satin Areia, da coleção Gold Fórmica Satin da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 160 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0010250021"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/formica-satin-areia/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/formica-satin-areia/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/formica-satin-areia/ficha.jpg"
    },
    "seo": {
      "title": "Fórmica Satin Areia — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Fórmica Satin Areia, coleção Gold Fórmica Satin, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "fórmica satin areia adesivo, imprimax fórmica satin areia, decormax fórmica satin areia, vinil fórmica imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/formica-satin"
  },
  {
    "slug": "formica-satin-atlantico-glacial",
    "name": "Fórmica Satin Atlântico Glacial",
    "code": "0010250018",
    "sku": "IMX10250018",
    "lojaSlug": "imprimax-formica-satin-atlantico-glacial",
    "family": "formica",
    "collection": "Gold Fórmica Satin",
    "description": "Padrão Fórmica Satin Atlântico Glacial, da coleção Gold Fórmica Satin da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 160 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0010250018"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/formica-satin-atlantico-glacial/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/formica-satin-atlantico-glacial/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/formica-satin-atlantico-glacial/ficha.jpg"
    },
    "seo": {
      "title": "Fórmica Satin Atlântico Glacial — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Fórmica Satin Atlântico Glacial, coleção Gold Fórmica Satin, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "fórmica satin atlântico glacial adesivo, imprimax fórmica satin atlântico glacial, decormax fórmica satin atlântico glacial, vinil fórmica imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/formica-satin"
  },
  {
    "slug": "formica-satin-azul-nevoa",
    "name": "Fórmica Satin Azul Névoa",
    "code": "0010250008",
    "sku": "IMX10250008",
    "lojaSlug": "imprimax-formica-satin-azul-nevoa",
    "family": "formica",
    "collection": "Gold Fórmica Satin",
    "description": "Padrão Fórmica Satin Azul Névoa, da coleção Gold Fórmica Satin da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 160 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0010250008"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/formica-satin-azul-nevoa/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/formica-satin-azul-nevoa/kit-1.jpg",
        "/assets/images/decor/imprimax/formica-satin-azul-nevoa/kit-2.jpg",
        "/assets/images/decor/imprimax/formica-satin-azul-nevoa/kit-3.jpg",
        "/assets/images/decor/imprimax/formica-satin-azul-nevoa/kit-4.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/formica-satin-azul-nevoa/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/formica-satin-azul-nevoa/ficha.jpg"
    },
    "seo": {
      "title": "Fórmica Satin Azul Névoa — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Fórmica Satin Azul Névoa, coleção Gold Fórmica Satin, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "fórmica satin azul névoa adesivo, imprimax fórmica satin azul névoa, decormax fórmica satin azul névoa, vinil fórmica imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/formica-satin"
  },
  {
    "slug": "formica-satin-azul-petroleo",
    "name": "Fórmica Satin Azul Petróleo",
    "code": "0010250009",
    "sku": "IMX10250009",
    "lojaSlug": "imprimax-formica-satin-azul-petroleo",
    "family": "formica",
    "collection": "Gold Fórmica Satin",
    "description": "Padrão Fórmica Satin Azul Petróleo, da coleção Gold Fórmica Satin da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 160 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0010250009"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/formica-satin-azul-petroleo/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/formica-satin-azul-petroleo/kit-1.jpg",
        "/assets/images/decor/imprimax/formica-satin-azul-petroleo/kit-2.jpg",
        "/assets/images/decor/imprimax/formica-satin-azul-petroleo/kit-3.jpg",
        "/assets/images/decor/imprimax/formica-satin-azul-petroleo/kit-4.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/formica-satin-azul-petroleo/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/formica-satin-azul-petroleo/ficha.jpg"
    },
    "seo": {
      "title": "Fórmica Satin Azul Petróleo — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Fórmica Satin Azul Petróleo, coleção Gold Fórmica Satin, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "fórmica satin azul petróleo adesivo, imprimax fórmica satin azul petróleo, decormax fórmica satin azul petróleo, vinil fórmica imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/formica-satin"
  },
  {
    "slug": "formica-satin-bege-palha",
    "name": "Fórmica Satin Bege Palha",
    "code": "0010250010",
    "sku": "IMX10250010",
    "lojaSlug": "imprimax-formica-satin-bege-palha",
    "family": "formica",
    "collection": "Gold Fórmica Satin",
    "description": "Padrão Fórmica Satin Bege Palha, da coleção Gold Fórmica Satin da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 160 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0010250010"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/formica-satin-bege-palha/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/formica-satin-bege-palha/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/formica-satin-bege-palha/ficha.jpg"
    },
    "seo": {
      "title": "Fórmica Satin Bege Palha — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Fórmica Satin Bege Palha, coleção Gold Fórmica Satin, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "fórmica satin bege palha adesivo, imprimax fórmica satin bege palha, decormax fórmica satin bege palha, vinil fórmica imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/formica-satin"
  },
  {
    "slug": "formica-satin-branco",
    "name": "Fórmica Satin Branco",
    "code": "0010250007",
    "sku": "IMX10250007",
    "lojaSlug": "imprimax-formica-satin-branco",
    "family": "formica",
    "collection": "Gold Fórmica Satin",
    "description": "Padrão Fórmica Satin Branco, da coleção Gold Fórmica Satin da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 160 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0010250007"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/formica-satin-branco/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/formica-satin-branco/kit-1.jpg",
        "/assets/images/decor/imprimax/formica-satin-branco/kit-2.jpg",
        "/assets/images/decor/imprimax/formica-satin-branco/kit-3.jpg",
        "/assets/images/decor/imprimax/formica-satin-branco/kit-4.jpg",
        "/assets/images/decor/imprimax/formica-satin-branco/kit-5.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/formica-satin-branco/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/formica-satin-branco/ficha.jpg"
    },
    "seo": {
      "title": "Fórmica Satin Branco — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Fórmica Satin Branco, coleção Gold Fórmica Satin, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "fórmica satin branco adesivo, imprimax fórmica satin branco, decormax fórmica satin branco, vinil fórmica imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/formica-satin"
  },
  {
    "slug": "formica-satin-cinza-nardo",
    "name": "Fórmica Satin Cinza Nardo",
    "code": "0010250011",
    "sku": "IMX10250011",
    "lojaSlug": "imprimax-formica-satin-cinza-nardo",
    "family": "formica",
    "collection": "Gold Fórmica Satin",
    "description": "Padrão Fórmica Satin Cinza Nardo, da coleção Gold Fórmica Satin da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 160 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0010250011"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/formica-satin-cinza-nardo/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/formica-satin-cinza-nardo/kit-1.jpg",
        "/assets/images/decor/imprimax/formica-satin-cinza-nardo/kit-2.jpg",
        "/assets/images/decor/imprimax/formica-satin-cinza-nardo/kit-3.jpg",
        "/assets/images/decor/imprimax/formica-satin-cinza-nardo/kit-4.jpg",
        "/assets/images/decor/imprimax/formica-satin-cinza-nardo/kit-5.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/formica-satin-cinza-nardo/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/formica-satin-cinza-nardo/ficha.jpg"
    },
    "seo": {
      "title": "Fórmica Satin Cinza Nardo — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Fórmica Satin Cinza Nardo, coleção Gold Fórmica Satin, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "fórmica satin cinza nardo adesivo, imprimax fórmica satin cinza nardo, decormax fórmica satin cinza nardo, vinil fórmica imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/formica-satin"
  },
  {
    "slug": "formica-satin-cobre-vecchio",
    "name": "Fórmica Satin Cobre Vecchio",
    "code": "0010250019",
    "sku": "IMX10250019",
    "lojaSlug": "imprimax-formica-satin-cobre-vecchio",
    "family": "formica",
    "collection": "Gold Fórmica Satin",
    "description": "Padrão Fórmica Satin Cobre Vecchio, da coleção Gold Fórmica Satin da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 160 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0010250019"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/formica-satin-cobre-vecchio/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/formica-satin-cobre-vecchio/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/formica-satin-cobre-vecchio/ficha.jpg"
    },
    "seo": {
      "title": "Fórmica Satin Cobre Vecchio — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Fórmica Satin Cobre Vecchio, coleção Gold Fórmica Satin, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "fórmica satin cobre vecchio adesivo, imprimax fórmica satin cobre vecchio, decormax fórmica satin cobre vecchio, vinil fórmica imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/formica-satin"
  },
  {
    "slug": "formica-satin-creme-de-morango",
    "name": "Fórmica Satin Creme de Morango",
    "code": "0010250022",
    "sku": "IMX10250022",
    "lojaSlug": "imprimax-formica-satin-creme-de-morango",
    "family": "formica",
    "collection": "Gold Fórmica Satin",
    "description": "Padrão Fórmica Satin Creme de Morango, da coleção Gold Fórmica Satin da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 160 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0010250022"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/formica-satin-creme-de-morango/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/formica-satin-creme-de-morango/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/formica-satin-creme-de-morango/ficha.jpg"
    },
    "seo": {
      "title": "Fórmica Satin Creme de Morango — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Fórmica Satin Creme de Morango, coleção Gold Fórmica Satin, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "fórmica satin creme de morango adesivo, imprimax fórmica satin creme de morango, decormax fórmica satin creme de morango, vinil fórmica imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/formica-satin"
  },
  {
    "slug": "formica-satin-creme-marfim",
    "name": "Fórmica Satin Creme Marfim",
    "code": "0010250017",
    "sku": "IMX10250017",
    "lojaSlug": "imprimax-formica-satin-creme-marfim",
    "family": "formica",
    "collection": "Gold Fórmica Satin",
    "description": "Padrão Fórmica Satin Creme Marfim, da coleção Gold Fórmica Satin da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 160 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0010250017"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/formica-satin-creme-marfim/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/formica-satin-creme-marfim/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/formica-satin-creme-marfim/ficha.jpg"
    },
    "seo": {
      "title": "Fórmica Satin Creme Marfim — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Fórmica Satin Creme Marfim, coleção Gold Fórmica Satin, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "fórmica satin creme marfim adesivo, imprimax fórmica satin creme marfim, decormax fórmica satin creme marfim, vinil fórmica imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/formica-satin"
  },
  {
    "slug": "formica-satin-fendi",
    "name": "Fórmica Satin Fendi",
    "code": "0010250012",
    "sku": "IMX10250012",
    "lojaSlug": "imprimax-formica-satin-fendi",
    "family": "formica",
    "collection": "Gold Fórmica Satin",
    "description": "Padrão Fórmica Satin Fendi, da coleção Gold Fórmica Satin da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 160 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0010250012"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/formica-satin-fendi/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/formica-satin-fendi/kit-1.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/formica-satin-fendi/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/formica-satin-fendi/ficha.jpg"
    },
    "seo": {
      "title": "Fórmica Satin Fendi — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Fórmica Satin Fendi, coleção Gold Fórmica Satin, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "fórmica satin fendi adesivo, imprimax fórmica satin fendi, decormax fórmica satin fendi, vinil fórmica imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/formica-satin"
  },
  {
    "slug": "formica-satin-glacial",
    "name": "Fórmica Satin Glacial",
    "code": "0010250005",
    "sku": "IMX10250005",
    "lojaSlug": "imprimax-formica-satin-glacial",
    "family": "formica",
    "collection": "Gold Fórmica Satin",
    "description": "Padrão Fórmica Satin Glacial, da coleção Gold Fórmica Satin da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 160 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0010250005"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/formica-satin-glacial/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/formica-satin-glacial/kit-1.jpg",
        "/assets/images/decor/imprimax/formica-satin-glacial/kit-2.jpg",
        "/assets/images/decor/imprimax/formica-satin-glacial/kit-3.jpg",
        "/assets/images/decor/imprimax/formica-satin-glacial/kit-4.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/formica-satin-glacial/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/formica-satin-glacial/ficha.jpg"
    },
    "seo": {
      "title": "Fórmica Satin Glacial — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Fórmica Satin Glacial, coleção Gold Fórmica Satin, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "fórmica satin glacial adesivo, imprimax fórmica satin glacial, decormax fórmica satin glacial, vinil fórmica imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/formica-satin"
  },
  {
    "slug": "formica-satin-grafite",
    "name": "Fórmica Satin Grafite",
    "code": "0010250006",
    "sku": "IMX10250006",
    "lojaSlug": "imprimax-formica-satin-grafite",
    "family": "formica",
    "collection": "Gold Fórmica Satin",
    "description": "Padrão Fórmica Satin Grafite, da coleção Gold Fórmica Satin da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 160 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0010250006"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/formica-satin-grafite/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/formica-satin-grafite/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/formica-satin-grafite/ficha.jpg"
    },
    "seo": {
      "title": "Fórmica Satin Grafite — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Fórmica Satin Grafite, coleção Gold Fórmica Satin, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "fórmica satin grafite adesivo, imprimax fórmica satin grafite, decormax fórmica satin grafite, vinil fórmica imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/formica-satin"
  },
  {
    "slug": "formica-satin-latte",
    "name": "Fórmica Satin Latte",
    "code": "0010250023",
    "sku": "IMX10250023",
    "lojaSlug": "imprimax-formica-satin-latte",
    "family": "formica",
    "collection": "Gold Fórmica Satin",
    "description": "Padrão Fórmica Satin Latte, da coleção Gold Fórmica Satin da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 160 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0010250023"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/formica-satin-latte/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/formica-satin-latte/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/formica-satin-latte/ficha.jpg"
    },
    "seo": {
      "title": "Fórmica Satin Latte — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Fórmica Satin Latte, coleção Gold Fórmica Satin, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "fórmica satin latte adesivo, imprimax fórmica satin latte, decormax fórmica satin latte, vinil fórmica imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/formica-satin"
  },
  {
    "slug": "formica-satin-mocha",
    "name": "Fórmica Satin Mocha",
    "code": "0010250024",
    "sku": "IMX10250024",
    "lojaSlug": "imprimax-formica-satin-mocha",
    "family": "formica",
    "collection": "Gold Fórmica Satin",
    "description": "Padrão Fórmica Satin Mocha, da coleção Gold Fórmica Satin da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 160 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0010250024"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/formica-satin-mocha/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/formica-satin-mocha/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/formica-satin-mocha/ficha.jpg"
    },
    "seo": {
      "title": "Fórmica Satin Mocha — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Fórmica Satin Mocha, coleção Gold Fórmica Satin, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "fórmica satin mocha adesivo, imprimax fórmica satin mocha, decormax fórmica satin mocha, vinil fórmica imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/formica-satin"
  },
  {
    "slug": "formica-satin-prata-aluminio",
    "name": "Fórmica Satin Prata Alumínio",
    "code": "0010250016",
    "sku": "IMX10250016",
    "lojaSlug": "imprimax-formica-satin-prata-aluminio",
    "family": "formica",
    "collection": "Gold Fórmica Satin",
    "description": "Padrão Fórmica Satin Prata Alumínio, da coleção Gold Fórmica Satin da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 160 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0010250016"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/formica-satin-prata-aluminio/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/formica-satin-prata-aluminio/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/formica-satin-prata-aluminio/ficha.jpg"
    },
    "seo": {
      "title": "Fórmica Satin Prata Alumínio — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Fórmica Satin Prata Alumínio, coleção Gold Fórmica Satin, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "fórmica satin prata alumínio adesivo, imprimax fórmica satin prata alumínio, decormax fórmica satin prata alumínio, vinil fórmica imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/formica-satin"
  },
  {
    "slug": "formica-satin-preto",
    "name": "Fórmica Satin Preto",
    "code": "0010250014",
    "sku": "IMX10250014",
    "lojaSlug": "imprimax-formica-satin-preto",
    "family": "formica",
    "collection": "Gold Fórmica Satin",
    "description": "Padrão Fórmica Satin Preto, da coleção Gold Fórmica Satin da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 160 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0010250014"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/formica-satin-preto/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/formica-satin-preto/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/formica-satin-preto/ficha.jpg"
    },
    "seo": {
      "title": "Fórmica Satin Preto — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Fórmica Satin Preto, coleção Gold Fórmica Satin, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "fórmica satin preto adesivo, imprimax fórmica satin preto, decormax fórmica satin preto, vinil fórmica imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/formica-satin"
  },
  {
    "slug": "formica-satin-taupe",
    "name": "Fórmica Satin Taupe",
    "code": "0010250025",
    "sku": "IMX10250025",
    "lojaSlug": "imprimax-formica-satin-taupe",
    "family": "formica",
    "collection": "Gold Fórmica Satin",
    "description": "Padrão Fórmica Satin Taupe, da coleção Gold Fórmica Satin da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 160 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0010250025"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/formica-satin-taupe/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/formica-satin-taupe/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/formica-satin-taupe/ficha.jpg"
    },
    "seo": {
      "title": "Fórmica Satin Taupe — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Fórmica Satin Taupe, coleção Gold Fórmica Satin, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "fórmica satin taupe adesivo, imprimax fórmica satin taupe, decormax fórmica satin taupe, vinil fórmica imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/formica-satin"
  },
  {
    "slug": "formica-satin-verde-frosty",
    "name": "Fórmica Satin Verde Frosty",
    "code": "0010250013",
    "sku": "IMX10250013",
    "lojaSlug": "imprimax-formica-satin-verde-frosty",
    "family": "formica",
    "collection": "Gold Fórmica Satin",
    "description": "Padrão Fórmica Satin Verde Frosty, da coleção Gold Fórmica Satin da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 160 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0010250013"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/formica-satin-verde-frosty/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/formica-satin-verde-frosty/kit-1.jpg",
        "/assets/images/decor/imprimax/formica-satin-verde-frosty/kit-2.jpg",
        "/assets/images/decor/imprimax/formica-satin-verde-frosty/kit-3.jpg",
        "/assets/images/decor/imprimax/formica-satin-verde-frosty/kit-4.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/formica-satin-verde-frosty/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/formica-satin-verde-frosty/ficha.jpg"
    },
    "seo": {
      "title": "Fórmica Satin Verde Frosty — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Fórmica Satin Verde Frosty, coleção Gold Fórmica Satin, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "fórmica satin verde frosty adesivo, imprimax fórmica satin verde frosty, decormax fórmica satin verde frosty, vinil fórmica imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/formica-satin"
  },
  {
    "slug": "formica-satin-verde-oliva",
    "name": "Fórmica Satin Verde Oliva",
    "code": "0010250026",
    "sku": "IMX10250026",
    "lojaSlug": "imprimax-formica-satin-verde-oliva",
    "family": "formica",
    "collection": "Gold Fórmica Satin",
    "description": "Padrão Fórmica Satin Verde Oliva, da coleção Gold Fórmica Satin da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 160 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0010250026"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/formica-satin-verde-oliva/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/formica-satin-verde-oliva/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/formica-satin-verde-oliva/ficha.jpg"
    },
    "seo": {
      "title": "Fórmica Satin Verde Oliva — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Fórmica Satin Verde Oliva, coleção Gold Fórmica Satin, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "fórmica satin verde oliva adesivo, imprimax fórmica satin verde oliva, decormax fórmica satin verde oliva, vinil fórmica imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/formica-satin"
  },
  {
    "slug": "tecido-boucle-bege",
    "name": "Bouclé Bege",
    "code": "0016030001",
    "sku": "IMX16030001",
    "lojaSlug": "imprimax-tecido-boucle-bege",
    "family": "tecido",
    "collection": "Gold Tecido",
    "description": "Padrão Bouclé Bege, da coleção Gold Tecido da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0016030001"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/tecido-boucle-bege/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/tecido-boucle-bege/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/tecido-boucle-bege/ficha.jpg"
    },
    "seo": {
      "title": "Bouclé Bege — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Bouclé Bege, coleção Gold Tecido, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "bouclé bege adesivo, imprimax bouclé bege, decormax bouclé bege, vinil tecido & telado imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-tecido"
  },
  {
    "slug": "tecido-boucle-cinza-escuro",
    "name": "Bouclé Cinza Escuro",
    "code": "0016030004",
    "sku": "IMX16030004",
    "lojaSlug": "imprimax-tecido-boucle-cinza-escuro",
    "family": "tecido",
    "collection": "Gold Tecido",
    "description": "Padrão Bouclé Cinza Escuro, da coleção Gold Tecido da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0016030004"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/tecido-boucle-cinza-escuro/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/tecido-boucle-cinza-escuro/ambient-1.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/tecido-boucle-cinza-escuro/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/tecido-boucle-cinza-escuro/ficha.jpg"
    },
    "seo": {
      "title": "Bouclé Cinza Escuro — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Bouclé Cinza Escuro, coleção Gold Tecido, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "bouclé cinza escuro adesivo, imprimax bouclé cinza escuro, decormax bouclé cinza escuro, vinil tecido & telado imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-tecido"
  },
  {
    "slug": "tecido-boucle-mescla-cinza",
    "name": "Bouclé Mescla Cinza",
    "code": "0016030003",
    "sku": "IMX16030003",
    "lojaSlug": "imprimax-tecido-boucle-mescla-cinza",
    "family": "tecido",
    "collection": "Gold Tecido",
    "description": "Padrão Bouclé Mescla Cinza, da coleção Gold Tecido da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0016030003"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/tecido-boucle-mescla-cinza/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/tecido-boucle-mescla-cinza/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/tecido-boucle-mescla-cinza/ficha.jpg"
    },
    "seo": {
      "title": "Bouclé Mescla Cinza — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Bouclé Mescla Cinza, coleção Gold Tecido, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "bouclé mescla cinza adesivo, imprimax bouclé mescla cinza, decormax bouclé mescla cinza, vinil tecido & telado imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-tecido"
  },
  {
    "slug": "tecido-boucle-off-white",
    "name": "Bouclé Off White",
    "code": "0016030002",
    "sku": "IMX16030002",
    "lojaSlug": "imprimax-tecido-boucle-off-white",
    "family": "tecido",
    "collection": "Gold Tecido",
    "description": "Padrão Bouclé Off White, da coleção Gold Tecido da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0016030002"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/tecido-boucle-off-white/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/tecido-boucle-off-white/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/tecido-boucle-off-white/ficha.jpg"
    },
    "seo": {
      "title": "Bouclé Off White — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Bouclé Off White, coleção Gold Tecido, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "bouclé off white adesivo, imprimax bouclé off white, decormax bouclé off white, vinil tecido & telado imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-tecido"
  },
  {
    "slug": "canvas-preto",
    "name": "Canvas Preto",
    "code": "0014810004",
    "sku": "IMX14810004",
    "lojaSlug": "imprimax-canvas-preto",
    "family": "tecido",
    "collection": "Gold Canvas",
    "description": "Padrão Canvas Preto, da coleção Gold Canvas da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014810004"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/canvas-preto/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/canvas-preto/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/canvas-preto/ficha.jpg"
    },
    "seo": {
      "title": "Canvas Preto — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Canvas Preto, coleção Gold Canvas, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "canvas preto adesivo, imprimax canvas preto, decormax canvas preto, vinil tecido & telado imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-canvas"
  },
  {
    "slug": "tecido-linho-natural-bege",
    "name": "Linho Natural Bege",
    "code": "0016040001",
    "sku": "IMX16040001",
    "lojaSlug": "imprimax-tecido-linho-natural-bege",
    "family": "tecido",
    "collection": "Gold Tecido",
    "description": "Padrão Linho Natural Bege, da coleção Gold Tecido da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0016040001"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/tecido-linho-natural-bege/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/tecido-linho-natural-bege/ambient-1.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/tecido-linho-natural-bege/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/tecido-linho-natural-bege/ficha.jpg"
    },
    "seo": {
      "title": "Linho Natural Bege — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Linho Natural Bege, coleção Gold Tecido, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "linho natural bege adesivo, imprimax linho natural bege, decormax linho natural bege, vinil tecido & telado imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-tecido"
  },
  {
    "slug": "tecido-linho-natural-cinza-escuro",
    "name": "Linho Natural Cinza Escuro",
    "code": "0016040005",
    "sku": "IMX16040005",
    "lojaSlug": "imprimax-tecido-linho-natural-cinza-escuro",
    "family": "tecido",
    "collection": "Gold Tecido",
    "description": "Padrão Linho Natural Cinza Escuro, da coleção Gold Tecido da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0016040005"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/tecido-linho-natural-cinza-escuro/texture.jpg",
      "ambient": [],
      "ficha": "/assets/images/decor/imprimax/tecido-linho-natural-cinza-escuro/ficha.jpg"
    },
    "seo": {
      "title": "Linho Natural Cinza Escuro — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Linho Natural Cinza Escuro, coleção Gold Tecido, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "linho natural cinza escuro adesivo, imprimax linho natural cinza escuro, decormax linho natural cinza escuro, vinil tecido & telado imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-tecido"
  },
  {
    "slug": "tecido-linho-natural-mescla-bege",
    "name": "Linho Natural Mescla Bege",
    "code": "0016040002",
    "sku": "IMX16040002",
    "lojaSlug": "imprimax-tecido-linho-natural-mescla-bege",
    "family": "tecido",
    "collection": "Gold Tecido",
    "description": "Padrão Linho Natural Mescla Bege, da coleção Gold Tecido da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0016040002"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/tecido-linho-natural-mescla-bege/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/tecido-linho-natural-mescla-bege/ambient-1.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/tecido-linho-natural-mescla-bege/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/tecido-linho-natural-mescla-bege/ficha.jpg"
    },
    "seo": {
      "title": "Linho Natural Mescla Bege — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Linho Natural Mescla Bege, coleção Gold Tecido, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "linho natural mescla bege adesivo, imprimax linho natural mescla bege, decormax linho natural mescla bege, vinil tecido & telado imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-tecido"
  },
  {
    "slug": "tecido-linho-natural-mescla-cinza",
    "name": "Linho Natural Mescla Cinza",
    "code": "0016040004",
    "sku": "IMX16040004",
    "lojaSlug": "imprimax-tecido-linho-natural-mescla-cinza",
    "family": "tecido",
    "collection": "Gold Tecido",
    "description": "Padrão Linho Natural Mescla Cinza, da coleção Gold Tecido da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0016040004"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/tecido-linho-natural-mescla-cinza/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/tecido-linho-natural-mescla-cinza/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/tecido-linho-natural-mescla-cinza/ficha.jpg"
    },
    "seo": {
      "title": "Linho Natural Mescla Cinza — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Linho Natural Mescla Cinza, coleção Gold Tecido, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "linho natural mescla cinza adesivo, imprimax linho natural mescla cinza, decormax linho natural mescla cinza, vinil tecido & telado imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-tecido"
  },
  {
    "slug": "tecido-linho-natural-off-white",
    "name": "Linho Natural Off White",
    "code": "0016040003",
    "sku": "IMX16040003",
    "lojaSlug": "imprimax-tecido-linho-natural-off-white",
    "family": "tecido",
    "collection": "Gold Tecido",
    "description": "Padrão Linho Natural Off White, da coleção Gold Tecido da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0016040003"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/tecido-linho-natural-off-white/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/tecido-linho-natural-off-white/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/tecido-linho-natural-off-white/ficha.jpg"
    },
    "seo": {
      "title": "Linho Natural Off White — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Linho Natural Off White, coleção Gold Tecido, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "linho natural off white adesivo, imprimax linho natural off white, decormax linho natural off white, vinil tecido & telado imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-tecido"
  },
  {
    "slug": "palha-trama-natural-2502",
    "name": "Palha Trama Natural 2502",
    "code": "0016050004",
    "sku": "IMX16050004",
    "lojaSlug": "imprimax-palha-trama-natural-2502",
    "family": "tecido",
    "collection": "Gold Palha",
    "description": "Padrão Palha Trama Natural 2502, da coleção Gold Palha da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0016050004"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/palha-trama-natural-2502/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/palha-trama-natural-2502/kit-1.jpg",
        "/assets/images/decor/imprimax/palha-trama-natural-2502/kit-2.jpg",
        "/assets/images/decor/imprimax/palha-trama-natural-2502/kit-3.jpg",
        "/assets/images/decor/imprimax/palha-trama-natural-2502/kit-4.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/palha-trama-natural-2502/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/palha-trama-natural-2502/ficha.jpg"
    },
    "seo": {
      "title": "Palha Trama Natural 2502 — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Palha Trama Natural 2502, coleção Gold Palha, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "palha trama natural 2502 adesivo, imprimax palha trama natural 2502, decormax palha trama natural 2502, vinil tecido & telado imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-palha"
  },
  {
    "slug": "savana-azul-allure",
    "name": "Savana Azul Allure",
    "code": "0014050003",
    "sku": "IMX14050003",
    "lojaSlug": "imprimax-savana-azul-allure",
    "family": "tecido",
    "collection": "Gold Savana",
    "description": "Padrão Savana Azul Allure, da coleção Gold Savana da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014050003"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/savana-azul-allure/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/savana-azul-allure/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/savana-azul-allure/ficha.jpg"
    },
    "seo": {
      "title": "Savana Azul Allure — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Savana Azul Allure, coleção Gold Savana, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "savana azul allure adesivo, imprimax savana azul allure, decormax savana azul allure, vinil tecido & telado imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-savana"
  },
  {
    "slug": "savana-bege-taupe",
    "name": "Savana Bege Taupe",
    "code": "0014050004",
    "sku": "IMX14050004",
    "lojaSlug": "imprimax-savana-bege-taupe",
    "family": "tecido",
    "collection": "Gold Savana",
    "description": "Padrão Savana Bege Taupe, da coleção Gold Savana da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014050004"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/savana-bege-taupe/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/savana-bege-taupe/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/savana-bege-taupe/ficha.jpg"
    },
    "seo": {
      "title": "Savana Bege Taupe — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Savana Bege Taupe, coleção Gold Savana, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "savana bege taupe adesivo, imprimax savana bege taupe, decormax savana bege taupe, vinil tecido & telado imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-savana"
  },
  {
    "slug": "savana-preto-sl",
    "name": "Savana Preto SL",
    "code": "0014050001",
    "sku": "IMX14050001",
    "lojaSlug": "imprimax-savana-preto-sl",
    "family": "tecido",
    "collection": "Gold Savana",
    "description": "Padrão Savana Preto SL, da coleção Gold Savana da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
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
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014050001"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/savana-preto-sl/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/savana-preto-sl/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/savana-preto-sl/ficha.jpg"
    },
    "seo": {
      "title": "Savana Preto SL — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Savana Preto SL, coleção Gold Savana, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "savana preto sl adesivo, imprimax savana preto sl, decormax savana preto sl, vinil tecido & telado imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-savana"
  },
  {
    "slug": "telado-bege-palha",
    "name": "Telado Bege Palha",
    "code": "0014010016",
    "sku": "IMX14010016",
    "lojaSlug": "imprimax-telado-bege-palha",
    "family": "tecido",
    "collection": "Gold Telado",
    "description": "Padrão Telado Bege Palha, da coleção Gold Telado da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 160 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014010016"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/telado-bege-palha/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/telado-bege-palha/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/telado-bege-palha/ficha.jpg"
    },
    "seo": {
      "title": "Telado Bege Palha — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Telado Bege Palha, coleção Gold Telado, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "telado bege palha adesivo, imprimax telado bege palha, decormax telado bege palha, vinil tecido & telado imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-telado"
  },
  {
    "slug": "telado-branco-off",
    "name": "Telado Branco Off",
    "code": "0014010017",
    "sku": "IMX14010017",
    "lojaSlug": "imprimax-telado-branco-off",
    "family": "tecido",
    "collection": "Gold Telado",
    "description": "Padrão Telado Branco Off, da coleção Gold Telado da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 160 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014010017"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/telado-branco-off/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/telado-branco-off/kit-1.jpg",
        "/assets/images/decor/imprimax/telado-branco-off/kit-2.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/telado-branco-off/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/telado-branco-off/ficha.jpg"
    },
    "seo": {
      "title": "Telado Branco Off — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Telado Branco Off, coleção Gold Telado, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "telado branco off adesivo, imprimax telado branco off, decormax telado branco off, vinil tecido & telado imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-telado"
  },
  {
    "slug": "telado-brim-bege",
    "name": "Telado Brim Bege",
    "code": "0014010004",
    "sku": "IMX14010004",
    "lojaSlug": "imprimax-telado-brim-bege",
    "family": "tecido",
    "collection": "Gold Telado",
    "description": "Padrão Telado Brim Bege, da coleção Gold Telado da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 160 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014010004"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/telado-brim-bege/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/telado-brim-bege/kit-1.jpg",
        "/assets/images/decor/imprimax/telado-brim-bege/kit-2.jpg",
        "/assets/images/decor/imprimax/telado-brim-bege/kit-3.jpg",
        "/assets/images/decor/imprimax/telado-brim-bege/kit-4.jpg",
        "/assets/images/decor/imprimax/telado-brim-bege/kit-5.jpg",
        "/assets/images/decor/imprimax/telado-brim-bege/kit-6.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/telado-brim-bege/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/telado-brim-bege/ficha.jpg"
    },
    "seo": {
      "title": "Telado Brim Bege — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Telado Brim Bege, coleção Gold Telado, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "telado brim bege adesivo, imprimax telado brim bege, decormax telado brim bege, vinil tecido & telado imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-telado"
  },
  {
    "slug": "telado-brim-cinza",
    "name": "Telado Brim Cinza",
    "code": "0014010002",
    "sku": "IMX14010002",
    "lojaSlug": "imprimax-telado-brim-cinza",
    "family": "tecido",
    "collection": "Gold Telado",
    "description": "Padrão Telado Brim Cinza, da coleção Gold Telado da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 160 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014010002"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/telado-brim-cinza/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/telado-brim-cinza/kit-1.jpg",
        "/assets/images/decor/imprimax/telado-brim-cinza/kit-2.jpg",
        "/assets/images/decor/imprimax/telado-brim-cinza/kit-3.jpg",
        "/assets/images/decor/imprimax/telado-brim-cinza/kit-4.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/telado-brim-cinza/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/telado-brim-cinza/ficha.jpg"
    },
    "seo": {
      "title": "Telado Brim Cinza — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Telado Brim Cinza, coleção Gold Telado, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "telado brim cinza adesivo, imprimax telado brim cinza, decormax telado brim cinza, vinil tecido & telado imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-telado"
  },
  {
    "slug": "telado-cinza-glacial",
    "name": "Telado Cinza Glacial",
    "code": "0014010015",
    "sku": "IMX14010015",
    "lojaSlug": "imprimax-telado-cinza-glacial",
    "family": "tecido",
    "collection": "Gold Telado",
    "description": "Padrão Telado Cinza Glacial, da coleção Gold Telado da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 160 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014010015"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/telado-cinza-glacial/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/telado-cinza-glacial/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/telado-cinza-glacial/ficha.jpg"
    },
    "seo": {
      "title": "Telado Cinza Glacial — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Telado Cinza Glacial, coleção Gold Telado, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "telado cinza glacial adesivo, imprimax telado cinza glacial, decormax telado cinza glacial, vinil tecido & telado imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-telado"
  },
  {
    "slug": "telado-classico-areia",
    "name": "Telado Clássico Areia",
    "code": "0011990004",
    "sku": "IMX11990004",
    "lojaSlug": "imprimax-telado-classico-areia",
    "family": "tecido",
    "collection": "Gold Telado",
    "description": "Padrão Telado Clássico Areia, da coleção Gold Telado da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 160 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0011990004"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/telado-classico-areia/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/telado-classico-areia/kit-1.jpg",
        "/assets/images/decor/imprimax/telado-classico-areia/kit-2.jpg",
        "/assets/images/decor/imprimax/telado-classico-areia/kit-3.jpg",
        "/assets/images/decor/imprimax/telado-classico-areia/kit-4.jpg",
        "/assets/images/decor/imprimax/telado-classico-areia/kit-5.jpg",
        "/assets/images/decor/imprimax/telado-classico-areia/kit-6.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/telado-classico-areia/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/telado-classico-areia/ficha.jpg"
    },
    "seo": {
      "title": "Telado Clássico Areia — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Telado Clássico Areia, coleção Gold Telado, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "telado clássico areia adesivo, imprimax telado clássico areia, decormax telado clássico areia, vinil tecido & telado imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-telado"
  },
  {
    "slug": "telado-classico-branco-gelo",
    "name": "Telado Clássico Branco Gelo",
    "code": "0011990002",
    "sku": "IMX11990002",
    "lojaSlug": "imprimax-telado-classico-branco-gelo",
    "family": "tecido",
    "collection": "Gold Telado",
    "description": "Padrão Telado Clássico Branco Gelo, da coleção Gold Telado da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 160 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0011990002"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/telado-classico-branco-gelo/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/telado-classico-branco-gelo/kit-1.jpg",
        "/assets/images/decor/imprimax/telado-classico-branco-gelo/kit-2.jpg",
        "/assets/images/decor/imprimax/telado-classico-branco-gelo/kit-3.jpg",
        "/assets/images/decor/imprimax/telado-classico-branco-gelo/kit-4.jpg",
        "/assets/images/decor/imprimax/telado-classico-branco-gelo/kit-5.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/telado-classico-branco-gelo/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/telado-classico-branco-gelo/ficha.jpg"
    },
    "seo": {
      "title": "Telado Clássico Branco Gelo — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Telado Clássico Branco Gelo, coleção Gold Telado, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "telado clássico branco gelo adesivo, imprimax telado clássico branco gelo, decormax telado clássico branco gelo, vinil tecido & telado imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-telado"
  },
  {
    "slug": "telado-linho-cinza-glacial",
    "name": "Telado Linho Cinza Glacial",
    "code": "0014010008",
    "sku": "IMX14010008",
    "lojaSlug": "imprimax-telado-linho-cinza-glacial",
    "family": "tecido",
    "collection": "Gold Telado",
    "description": "Padrão Telado Linho Cinza Glacial, da coleção Gold Telado da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 160 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014010008"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/telado-linho-cinza-glacial/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/telado-linho-cinza-glacial/kit-1.jpg",
        "/assets/images/decor/imprimax/telado-linho-cinza-glacial/kit-2.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/telado-linho-cinza-glacial/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/telado-linho-cinza-glacial/ficha.jpg"
    },
    "seo": {
      "title": "Telado Linho Cinza Glacial — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Telado Linho Cinza Glacial, coleção Gold Telado, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "telado linho cinza glacial adesivo, imprimax telado linho cinza glacial, decormax telado linho cinza glacial, vinil tecido & telado imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-telado"
  },
  {
    "slug": "telado-linho-creme",
    "name": "Telado Linho Creme",
    "code": "0014010018",
    "sku": "IMX14010018",
    "lojaSlug": "imprimax-telado-linho-creme",
    "family": "tecido",
    "collection": "Gold Telado",
    "description": "Padrão Telado Linho Creme, da coleção Gold Telado da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 160 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014010018"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/telado-linho-creme/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/telado-linho-creme/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/telado-linho-creme/ficha.jpg"
    },
    "seo": {
      "title": "Telado Linho Creme — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Telado Linho Creme, coleção Gold Telado, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "telado linho creme adesivo, imprimax telado linho creme, decormax telado linho creme, vinil tecido & telado imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-telado"
  },
  {
    "slug": "telado-linho-off-white",
    "name": "Telado Linho Off White",
    "code": "0014010020",
    "sku": "IMX14010020",
    "lojaSlug": "imprimax-telado-linho-off-white",
    "family": "tecido",
    "collection": "Gold Telado",
    "description": "Padrão Telado Linho Off White, da coleção Gold Telado da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 160 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014010020"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/telado-linho-off-white/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/telado-linho-off-white/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/telado-linho-off-white/ficha.jpg"
    },
    "seo": {
      "title": "Telado Linho Off White — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Telado Linho Off White, coleção Gold Telado, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "telado linho off white adesivo, imprimax telado linho off white, decormax telado linho off white, vinil tecido & telado imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-telado"
  },
  {
    "slug": "telado-linho-palha",
    "name": "Telado Linho Palha",
    "code": "0014010019",
    "sku": "IMX14010019",
    "lojaSlug": "imprimax-telado-linho-palha",
    "family": "tecido",
    "collection": "Gold Telado",
    "description": "Padrão Telado Linho Palha, da coleção Gold Telado da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 160 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014010019"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/telado-linho-palha/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/telado-linho-palha/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/telado-linho-palha/ficha.jpg"
    },
    "seo": {
      "title": "Telado Linho Palha — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Telado Linho Palha, coleção Gold Telado, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "telado linho palha adesivo, imprimax telado linho palha, decormax telado linho palha, vinil tecido & telado imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-telado"
  },
  {
    "slug": "telado-preto",
    "name": "Telado Preto",
    "code": "0014010005",
    "sku": "IMX14010005",
    "lojaSlug": "imprimax-telado-preto",
    "family": "tecido",
    "collection": "Gold Telado",
    "description": "Padrão Telado Preto, da coleção Gold Telado da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 160 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "160 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014010005"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/telado-preto/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/telado-preto/kit-1.jpg",
        "/assets/images/decor/imprimax/telado-preto/kit-2.jpg",
        "/assets/images/decor/imprimax/telado-preto/kit-3.jpg",
        "/assets/images/decor/imprimax/telado-preto/kit-4.jpg",
        "/assets/images/decor/imprimax/telado-preto/kit-5.jpg",
        "/assets/images/decor/imprimax/telado-preto/kit-6.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/telado-preto/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/telado-preto/ficha.jpg"
    },
    "seo": {
      "title": "Telado Preto — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Telado Preto, coleção Gold Telado, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "telado preto adesivo, imprimax telado preto, decormax telado preto, vinil tecido & telado imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-telado"
  },
  {
    "slug": "couros-volpe-preto",
    "name": "Couros Volpe Preto",
    "code": "0014100013",
    "sku": "IMX14100013",
    "lojaSlug": "imprimax-couros-volpe-preto",
    "family": "textura",
    "collection": "Gold Couros",
    "description": "Padrão Couros Volpe Preto, da coleção Gold Couros da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 200 / 140 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "200 / 140 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014100013"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/couros-volpe-preto/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/couros-volpe-preto/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/couros-volpe-preto/ficha.jpg"
    },
    "seo": {
      "title": "Couros Volpe Preto — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Couros Volpe Preto, coleção Gold Couros, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "couros volpe preto adesivo, imprimax couros volpe preto, decormax couros volpe preto, vinil couro & texturas imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-couros"
  },
  {
    "slug": "firenze-dourado",
    "name": "Firenze Dourado",
    "code": "0014120006",
    "sku": "IMX14120006",
    "lojaSlug": "imprimax-firenze-dourado",
    "family": "textura",
    "collection": "Gold Firenze",
    "description": "Padrão Firenze Dourado, da coleção Gold Firenze da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 200 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "200 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014120006"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/firenze-dourado/texture.jpg",
      "ambient": [
        "/assets/images/decor/imprimax/firenze-dourado/kit-1.jpg",
        "/assets/images/decor/imprimax/firenze-dourado/kit-2.jpg",
        "/assets/images/decor/imprimax/firenze-dourado/kit-3.jpg",
        "/assets/images/decor/imprimax/firenze-dourado/kit-4.jpg"
      ],
      "zoom": "/assets/images/decor/imprimax/firenze-dourado/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/firenze-dourado/ficha.jpg"
    },
    "seo": {
      "title": "Firenze Dourado — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Firenze Dourado, coleção Gold Firenze, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "firenze dourado adesivo, imprimax firenze dourado, decormax firenze dourado, vinil couro & texturas imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-firenze"
  },
  {
    "slug": "firenze-grafite",
    "name": "Firenze Grafite",
    "code": "0014120005",
    "sku": "IMX14120005",
    "lojaSlug": "imprimax-firenze-grafite",
    "family": "textura",
    "collection": "Gold Firenze",
    "description": "Padrão Firenze Grafite, da coleção Gold Firenze da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 200 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para revestimento de móveis, paredes, portas, tetos e eletrodomésticos.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "200 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0014120005"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/firenze-grafite/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/firenze-grafite/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/firenze-grafite/ficha.jpg"
    },
    "seo": {
      "title": "Firenze Grafite — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo Firenze Grafite, coleção Gold Firenze, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "firenze grafite adesivo, imprimax firenze grafite, decormax firenze grafite, vinil couro & texturas imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/gold-firenze"
  },
  {
    "slug": "pisomax-pedras-terrazzo-cinza-matte",
    "name": "PisoMax Terrazzo Cinza Matte",
    "code": "0015240040",
    "sku": "IMX15240040",
    "lojaSlug": "imprimax-pisomax-pedras-terrazzo-cinza-matte",
    "family": "piso",
    "collection": "PisoMax Decorativo",
    "description": "Padrão PisoMax Terrazzo Cinza Matte, da coleção PisoMax Decorativo da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 250 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para piso de tráfego leve e para paredes, móveis e bancadas.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "250 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0015240040"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/pisomax-pedras-terrazzo-cinza-matte/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/pisomax-pedras-terrazzo-cinza-matte/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/pisomax-pedras-terrazzo-cinza-matte/ficha.jpg"
    },
    "seo": {
      "title": "PisoMax Terrazzo Cinza Matte — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo PisoMax Terrazzo Cinza Matte, coleção PisoMax Decorativo, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "pisomax terrazzo cinza matte adesivo, imprimax pisomax terrazzo cinza matte, decormax pisomax terrazzo cinza matte, vinil pisomax imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/pisomax-decorativo"
  },
  {
    "slug": "pisomax-pedras-terrazzo-off-white-matte",
    "name": "PisoMax Terrazzo Off White Matte",
    "code": "0015240041",
    "sku": "IMX15240041",
    "lojaSlug": "imprimax-pisomax-pedras-terrazzo-off-white-matte",
    "family": "piso",
    "collection": "PisoMax Decorativo",
    "description": "Padrão PisoMax Terrazzo Off White Matte, da coleção PisoMax Decorativo da linha Imprimax DecorMax. Vinil autoadesivo de PVC polimérico calandrado, com frontal de 250 micras, adesivo acrílico permanente e atóxico. Antimofo, antibacteriano e não propaga fogo. Indicado para piso de tráfego leve e para paredes, móveis e bancadas.",
    "specs": [
      {
        "label": "Espessura frontal",
        "value": "250 micras"
      },
      {
        "label": "Dimensões do rolo",
        "value": "1,22 m × 25 m"
      },
      {
        "label": "Liner",
        "value": "Papel siliconado 120 g/m²"
      },
      {
        "label": "Adesivo",
        "value": "Acrílico aquoso permanente, sensível à pressão (atóxico)"
      },
      {
        "label": "Durabilidade",
        "value": "8 anos interno · 5 anos externo"
      },
      {
        "label": "Proteção",
        "value": "Antimofo, antibacteriano, não propaga fogo"
      },
      {
        "label": "Código Imprimax",
        "value": "0015240041"
      }
    ],
    "badges": [
      "INDÚSTRIA NACIONAL",
      "ANTIMOFO · ANTIBACTERIANO",
      "NÃO PROPAGA FOGO"
    ],
    "images": {
      "texture": "/assets/images/decor/imprimax/pisomax-pedras-terrazzo-off-white-matte/texture.jpg",
      "ambient": [],
      "zoom": "/assets/images/decor/imprimax/pisomax-pedras-terrazzo-off-white-matte/zoom.jpg",
      "ficha": "/assets/images/decor/imprimax/pisomax-pedras-terrazzo-off-white-matte/ficha.jpg"
    },
    "seo": {
      "title": "PisoMax Terrazzo Off White Matte — Vinil Adesivo Imprimax DecorMax",
      "description": "Revestimento vinílico autoadesivo PisoMax Terrazzo Off White Matte, coleção PisoMax Decorativo, linha Imprimax DecorMax. Antimofo e antibacteriano, rolo 1,22 m × 25 m. Compre na NZ Group.",
      "keywords": "pisomax terrazzo off white matte adesivo, imprimax pisomax terrazzo off white matte, decormax pisomax terrazzo off white matte, vinil pisomax imprimax"
    },
    "sourceUrl": "https://www.imprimax.com.br/pisomax-decorativo"
  }
];

export const getImprimaxProductBySlug = (slug?: string) =>
  imprimaxProducts.find((p) => p.slug === slug);

export const getImprimaxProductsByFamily = (family: ImprimaxFamilySlug) =>
  imprimaxProducts.filter((p) => p.family === family);

export const getImprimaxFamilyBySlug = (slug?: string) =>
  imprimaxFamilies.find((f) => f.slug === slug);
