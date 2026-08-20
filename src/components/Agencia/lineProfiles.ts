/**
 * Perfil canônico de cada linha NZ — define o "DNA" da linha pra que a IA
 * (texto e imagem) sempre use o veículo, segmento e specs corretos. Isso é
 * o "anexo de prompt" mencionado pelo cliente: quando a linha é selecionada,
 * o sistema gruda esses fatos no prompt da IA pra evitar invencionices.
 *
 * Fonte de verdade: catalogData.ts. Aqui só consolidamos em texto pronto pra
 * passar pra IA.
 */

export interface LineProfile {
  /** Slug do produto (matches productLines[].slug). */
  slug: string;
  /** Marca/segmento de carro associado à linha (ex "GWM Haval / Tank / Ora, BYD"). */
  carBrands: string;
  /** Descrição humana do segmento (PT-BR), pra mostrar na UI. */
  segmentLabel: string;
  /**
   * Frase em inglês que descreve o sujeito ideal da imagem (passada literal
   * pro Imagen). Inclui carro/superfície específica + detalhe estético.
   */
  imageSubject: string;
  /**
   * Specs e fatos verificáveis pra IA usar como referência ao escrever copy.
   * Frases curtas e factuais — sem tom de marketing — pra que a IA possa
   * embutir esses dados sem distorcer.
   */
  factsContext: string;
  /** Nome curto da linha pra rotulagem na UI. */
  shortName: string;
}

/**
 * Mapeamento por slug. Acrescenta-se uma linha aqui sempre que uma nova
 * linha NZ é lançada — ou ajusta-se quando o posicionamento mudar.
 *
 * Nota: NZPPF FLOW está explicitamente atrelado a GWM (Haval/Tank/Ora) +
 * elétricos do segmento por decisão comercial — atende o cliente que dirige
 * um SUV chinês premium ou EV mid-tier. Desde a reformulação G2 (7 anos) ela
 * não é mais o entry-point da marca: esse papel é da CORE.
 */
export const LINE_PROFILES: Record<string, LineProfile> = {
  'luxury-gloss': {
    slug: 'luxury-gloss',
    shortName: 'LUXURY',
    carBrands: 'Lamborghini, Ferrari, McLaren, Porsche 911 Turbo, Aston Martin',
    segmentLabel: 'Supercars europeus de altíssimo padrão',
    imageSubject:
      'European luxury supercar (Lamborghini Aventador or Huracán SVJ, Ferrari 296 GTB, McLaren GT, Porsche 911 Turbo S, or Aston Martin DB12), premium showroom or moody nocturnal garage scene',
    factsContext:
      'TPU Alifático 190μ. Top-coat nano-japonês. +32% de brilho vs pintura nua. Garantia de 12 anos. Não amarela sob UV. Auto-cura térmica de micro-riscos. Adesivo PSA com remoção limpa.',
  },
  'prime-gloss': {
    slug: 'prime-gloss',
    shortName: 'PRIME',
    carBrands: 'BMW M, Audi RS, Mercedes-AMG, Porsche Cayenne, Range Rover Sport',
    segmentLabel: 'Premium alemão e SUVs de luxo (BMW/Audi/Mercedes/Porsche/Range)',
    imageSubject:
      'Premium German performance car or luxury SUV (BMW M3 / M5, Audi RS6 Avant, Mercedes-AMG GT, Porsche Cayenne Turbo, Range Rover Sport SVR), sophisticated urban or driveway scene',
    factsContext:
      'TPU 100% virgem 190μ. Top-coat nano-dúplex hidrofóbico. Garantia de 10 anos. Mais flexível que PU comum, não resseca, não trinca, não amarela. Regeneração térmica de micro-riscos. Adesivo flexível pra conformação em curvas.',
  },
  'flow-gloss': {
    slug: 'flow-gloss',
    shortName: 'FLOW',
    carBrands: 'GWM Haval H6 / H9, GWM Tank 300 / 500, GWM Ora 03, BYD Han / Tang, Volvo XC40 Recharge',
    segmentLabel: 'GWM (Haval / Tank / Ora) e elétricos premium do segmento',
    imageSubject:
      'Chinese premium SUV or premium electric car — preferably GWM brand vehicle (Haval H6 or H9, Tank 300 or 500, Ora 03) or BYD Han / Tang, or premium electric Volvo XC40 Recharge — modern urban setting or charging station ambient',
    factsContext:
      'TPU Técnico G2 185μ (nova formulação — subiu de 175 para 185μ). Top-coat nano-hidrofóbico G2. Garantia de 7 anos. Muito acima de qualquer PU comum. Regeneração térmica acelerada. Adesivo acrílico pra conformação em curvas complexas. Linha intermediária de performance da NZPPF.',
  },
  'core-gloss': {
    slug: 'core-gloss',
    shortName: 'CORE',
    carBrands: 'Hyundai Creta / HB20, Jeep Renegade / Compass, Toyota Corolla Cross, VW T-Cross, Honda HR-V',
    segmentLabel: 'SUVs e sedãs populares premium (mid-segment brasileiro)',
    imageSubject:
      'Mainstream popular-premium Brazilian car (Hyundai Creta or HB20, Jeep Renegade or Compass, Toyota Corolla Cross, VW T-Cross, Honda HR-V), realistic everyday street or driveway',
    factsContext:
      'Híbrido 80/20 (80% TPU premium + 20% PVC). Espessura 175μ. Adesivo Easy-Tack reposicionável. Top-coat hidrofóbico contra chuva ácida. Garantia de 3 anos. Otimizado pra absorver impactos.',
  },
  'headlight': {
    slug: 'headlight',
    shortName: 'HEADLIGHT',
    carBrands: 'Audi (Matrix LED), BMW (Laser), Lexus, Porsche, Mercedes (Multibeam)',
    segmentLabel: 'Tonalização premium de faróis em qualquer carro com LED/DRL marcante',
    imageSubject:
      'Tight macro shot of a premium car headlight detail — Audi Matrix LED, BMW Laser, Lexus, Porsche, or Mercedes Multibeam — with subtle smoked overlay tone catching light, dramatic dark surrounding',
    factsContext:
      'TPU pigmentado anti-UV de 150μ. Três tonalidades (Light Black, Light Gray, Dark Black). Pigmentação calibrada que preserva luminosidade e segurança. Garantia de 10 anos. Adesivo PSA com remoção limpa.',
  },
  'windshield': {
    slug: 'windshield',
    shortName: 'WINDSHIELD',
    carBrands: 'SUVs e sedãs premium expostos a estradas',
    segmentLabel: 'Parabrisas de SUVs e sedãs premium expostos a estradas e detritos',
    imageSubject:
      'Macro shot of a premium car windshield with dramatic side-light reflection of road, sky and stone debris bouncing off — focus on glass surface clarity and protective film layer',
    factsContext:
      'TPU 190μ aplicado na face EXTERNA do parabrisa. Compatível com sistemas ADAS. Top-coat hidrofóbico que repele água e bloqueia UV. Transparência óptica sem distorção. Garantia de 2 anos.',
  },
  /* ─── Oracal (NZWRAP) ─── */
  '_oracal-651-default': {
    slug: '_oracal-651-default',
    shortName: 'ORACAL 651',
    carBrands: 'Aplicações em sinalização, plotter, fachadas e rotulagem',
    segmentLabel: 'Vinil adesivo de polímero calandrado pra sinalização e plotagem',
    imageSubject:
      'Professional sign-making or storefront scene featuring Oracal 651 vinyl applied on a clean signage panel, vehicle decal or premium retail surface, controlled studio lighting',
    factsContext:
      'Vinil adesivo de polímero calandrado pra sinalização interna/externa, com excelente cobertura de cor e durabilidade típica de 4 a 5 anos em aplicações externas planas.',
  },
  '_oracal-670-default': {
    slug: '_oracal-670-default',
    shortName: 'ORACAL 670RA',
    carBrands: 'Envelopamento automotivo (qualquer carro premium)',
    segmentLabel: 'Envelopamento automotivo profissional',
    imageSubject:
      'Automotive wrap installation scene — premium vehicle being wrapped with Oracal 670RA vinyl, professional wrap shop with detailing tools and dramatic spot lighting',
    factsContext:
      'Vinil adesivo cast pra envelopamento automotivo, com adesivo Rapid Air, alta conformação em curvas e durabilidade típica de até 8 anos.',
  },
};

/**
 * Lookup defensivo. Para PPF usa o slug; para Oracal cai nos defaults.
 * Retorna null quando não há perfil aplicável (mantém o caller resiliente).
 */
export function lookupLineProfile(
  productSlug: string,
  productCatalog: 'ppf' | 'oracal-651' | 'oracal-670'
): LineProfile | null {
  if (productCatalog === 'ppf') return LINE_PROFILES[productSlug] || null;
  if (productCatalog === 'oracal-651') return LINE_PROFILES['_oracal-651-default'];
  if (productCatalog === 'oracal-670') return LINE_PROFILES['_oracal-670-default'];
  return null;
}
