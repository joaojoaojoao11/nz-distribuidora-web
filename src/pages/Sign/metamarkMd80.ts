/* Linha Metamark MD-80 Series — vinil calandrado 80μm para impressão digital.
 *
 * Lançamento NZSIGN em setembro/2026. São dois produtos (adesivo transparente e
 * adesivo cinza blockout), cada um em dois acabamentos, e o acabamento fosco tem
 * código próprio de fábrica — MD-81M e MD-81MB, não "MD-80 fosco".
 *
 * Códigos e specs conferidos contra o catálogo do fabricante em 2026-08-12:
 *   https://metamark.co.uk/products/metamark-md-80
 *   https://metamark.co.uk/products/metamark-md-80b
 * O briefing interno trazia estes SKUs como "MD-V80/MD-V81M/MD-V80B/MD-V81MB".
 * O "V" não existe no catálogo Metamark UK — aparece só em revenda asiática, como
 * apelido de MD-80. Aqui vale o código do fabricante.
 *
 * A família tem um terceiro produto, MD-80MRB (removable blockout), que a NZ ainda
 * não confirmou em estoque — está citado nas notas, sem card próprio.
 *
 * Fonte única: consumido por MetamarkBlock.tsx (cards + ficha técnica) e por
 * Sign.tsx (JSON-LD). Não duplicar esses dados em nenhum dos dois.
 */

export type MetamarkSku = {
  slug: string;
  code: string;
  name: string;
  adhesive: 'transparente' | 'cinza';
  finish: 'brilho' | 'fosco';
  description: string;
  badges: string[];
  image?: string;
  available: boolean;
};

/* Badges são uppercase no CSS (.familyBadge), e "μ" vira "Μ" (Mu maiúsculo grego)
 * nessa transformação — por isso "80 MICRAS" por extenso aqui. Na ficha técnica,
 * que não é uppercase, "80μm" pode aparecer normalmente. */
export const metamarkSkus: MetamarkSku[] = [
  {
    slug: 'md-80-branco-brilho',
    code: 'MD-80',
    name: 'MD-80 · Branco Brilho',
    adhesive: 'transparente',
    finish: 'brilho',
    description:
      'Vinil calandrado monomérico 80μm branco brilho com adesivo acrílico permanente livre de solvente. Impressão em solvente, eco-solvente, látex e UV. Aplicações promocionais de curto prazo: vitrines, PDVs, painéis, etiquetas e superfícies planas ou de curva suave.',
    badges: ['80 MICRAS', 'ADESIVO TRANSPARENTE', 'BRILHO', 'ATÉ 3 ANOS EXT.'],
    image: '/assets/images/metamark/md80/md-80-card.jpg',
    available: true,
  },
  {
    slug: 'md-81m-branco-fosco',
    code: 'MD-81M',
    name: 'MD-81M · Branco Fosco',
    adhesive: 'transparente',
    finish: 'fosco',
    description:
      'Acabamento fosco da linha MD-80. Mesma base técnica — 80μm monomérico, adesivo acrílico permanente livre de solvente — com superfície matte. Indicado para ambientes com reflexo, iluminação difícil e comunicações que exigem sobriedade visual.',
    badges: ['80 MICRAS', 'ADESIVO TRANSPARENTE', 'FOSCO', 'ATÉ 3 ANOS EXT.'],
    image: '/assets/images/metamark/md80/md-80-detalhe.jpg',
    available: true,
  },
  {
    slug: 'md-80b-branco-brilho-cinza',
    code: 'MD-80B',
    name: 'MD-80B · Branco Brilho · Adesivo Cinza',
    adhesive: 'cinza',
    finish: 'brilho',
    description:
      'Versão com adesivo acrílico permanente cinza pigmentado. A opacidade extra bloqueia o substrato e evita show-through — cores fiéis quando aplicado sobre vitrines coloridas, gráficos antigos ou superfícies com padrão. Escolha profissional para rebranding e sobreposição.',
    badges: ['80 MICRAS', 'ADESIVO CINZA · BLOCKOUT', 'BRILHO', 'ATÉ 3 ANOS EXT.'],
    image: '/assets/images/metamark/md80/md-80b-card.jpg',
    available: true,
  },
  {
    slug: 'md-81mb-branco-fosco-cinza',
    code: 'MD-81MB',
    name: 'MD-81MB · Branco Fosco · Adesivo Cinza',
    adhesive: 'cinza',
    finish: 'fosco',
    description:
      'Combinação de acabamento fosco com adesivo cinza blockout. Cobertura total sobre qualquer substrato, sem reflexo. Ideal para sobreposição de comunicação visual em ambientes corporativos e vitrines com forte contraste de fundo.',
    badges: ['80 MICRAS', 'ADESIVO CINZA · BLOCKOUT', 'FOSCO', 'ATÉ 3 ANOS EXT.'],
    image: '/assets/images/metamark/md80/md-80b-detalhe.jpg',
    available: true,
  },
];

/* Especificações comuns às quatro versões, conforme a ficha do fabricante. O bloco
 * renderiza em duas colunas fatiando este array ao meio — manter a contagem par. */
export const MD80_SPECS: { label: string; value: string }[] = [
  { label: 'Película', value: 'PVC calandrado monomérico 80μm' },
  { label: 'Liner', value: 'Papel kraft 140 g/m²' },
  { label: 'Adesivo · MD-80 / MD-81M', value: 'Acrílico permanente livre de solvente, transparente' },
  { label: 'Adesivo · MD-80B / MD-81MB', value: 'Acrílico permanente livre de solvente, cinza pigmentado' },
  { label: 'Durabilidade externa', value: 'Até 3 anos' },
  { label: 'Classificação de fogo', value: 'Classe B' },
  { label: 'Larguras de bobina', value: '1.370 mm · 1.600 mm' },
  { label: 'Comprimento da bobina', value: '50 m' },
  { label: 'Compatibilidade de tintas', value: 'Solvente · Eco-solvente · Látex · UV' },
  { label: 'Laminação recomendada', value: 'MetaGuard MG-80' },
  { label: 'Temperatura de aplicação', value: '+10°C a +60°C' },
  { label: 'Temperatura de serviço', value: '-20°C a +70°C' },
  { label: 'Estocagem', value: '1 ano a 15–20°C e 50% UR' },
  { label: 'Certificações do fabricante', value: 'ISO 9001, 14001, 45001, 50001 · Ecovadis Platinum' },
  { label: 'Aplicações típicas', value: 'Vitrines, PDV, painéis promocionais, etiquetas e sinalização de curto prazo' },
  { label: 'Origem', value: 'Reino Unido — Metamark (UK) Limited, grupo UPM Raflatac' },
];

export const MD80_NOTES: string[] = [
  'Não recomendado para superfícies de baixa energia, como polipropileno.',
  'Aguardar 24 a 48 h de secagem dos solventes de impressão antes da laminação.',
  'Adequado para aplicação úmida ou seca.',
  'A família MD-80 inclui ainda o MD-80MRB, blockout removível — consulte disponibilidade.',
  'Larguras e comprimentos podem variar por lote de importação; confirme na cotação.',
  'As fotos são aplicações reais publicadas pela Metamark e ilustram a linha, não o acabamento brilho ou fosco de cada versão.',
];
