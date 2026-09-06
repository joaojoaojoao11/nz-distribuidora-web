// Adapter do CADASTRO DO SITE: uma linha da view pública `loja_catalogo`
// (produtos ⨝ erp_produtos) vira um ShopItem.
//
// É o adapter que aposenta os outros: depois da migração, TODO item da LOJA —
// os 505 editoriais e os ~640 criados automaticamente do ERP — passa por aqui.
// A classificação (cor, acabamento, padrão) continua sendo feita no cliente, no
// momento de carregar, pelo mesmo motor de sempre: "o nome manda". O banco
// guarda o que é FATO (nome, hex publicado, família declarada pelo fabricante,
// tags de acabamento); o que é INTERPRETAÇÃO é recalculado a cada carga, então
// uma correção no léxico vale para o catálogo inteiro sem migrar dado.
//
// A view NÃO tem preço nem saldo numérico. Este adapter não sabe o que é preço.
//
// Fotos SH Wrapping: enquanto a coluna `imagem` da view ERP não estiver
// preenchida para SH Wrapping, aplicamos um mapa local por slug (mesma fonte
// que dbSnapshot). Quando o backend passar a devolver a URL, este fallback fica
// dormente. O slug aqui já vem prefixado (`sh-glossy-black`), então o mapa
// espelha isso.

import { resolveColor } from '../color/resolveColor';
import type { ColorFamilyId } from '../color/lexicon';
import { normalizeFinishString } from '../finish/normalizeFinish';
import { isFinishId, type FinishId } from '../finish/tree';
import { isPatternFamilyId, PATTERN_SYNONYMS, type PatternFamilyId } from '../pattern/taxonomy';
import { genericImageForLine, isReviewedSlug, rollImageFor, shVehiclePhotosFor } from '../generic';
import {
  buildSearchText,
  normalize,
  type Aplicacao,
  type BrandKey,
  type ItemKind,
  type LineKey,
  type MidiaPublica,
  type NivelEstoque,
  type ShopItem,
  type ShopSpec,
  type TipoVinculo,
  type Vertical,
} from '../types';

/** Espelho 1:1 das colunas de `loja_catalogo` (migrations/2026-09-06_loja_ecommerce.sql). */
export interface LojaCatalogoRow {
  id: string;
  slug: string;
  erp_sku: string | null;
  tipo_vinculo: TipoVinculo;
  pai_id: string | null;
  alias_de: string | null;
  nome: string;
  subtitulo: string | null;
  marca_exibicao: string | null;
  brand_key: string | null;
  linha_key: string;
  linha_label: string | null;
  vertical: Vertical;
  kind: ItemKind;
  aplicacoes: string[] | null;
  codigo: string | null;
  imagem: string | null;
  galeria: string[] | null;
  midias: MidiaPublica[] | null;
  hex: string | null;
  cor_declarada: string | null;
  transparente: boolean | null;
  hex_inferido: string | null;
  acabamentos: string[] | null;
  acabamento_label: string | null;
  familia_padrao: string | null;
  descricao: string | null;
  ficha: ShopSpec[] | null;
  badges: string[] | null;
  garantia_anos: number | null;
  durabilidade_anos: number | null;
  legacy_path: string | null;
  shipping_profile_id: string | null;
  seo_titulo: string | null;
  seo_descricao: string | null;
  ordem: number | null;
  origem: string | null;
  largura_m: number | null;
  metragem_padrao: number | null;
  unidade: string | null;
  nivel_estoque: NivelEstoque | null;
  atualizado_em: string | null;
}

const APLICACOES: readonly Aplicacao[] = ['automotivo', 'arquitetonico', 'comunicacao-visual'];

function finishesDe(row: LojaCatalogoRow): { ids: FinishId[]; label: string | null } {
  const salvas = (row.acabamentos ?? []).filter(isFinishId);
  if (salvas.length) return { ids: salvas, label: row.acabamento_label };
  if (row.acabamento_label) return normalizeFinishString(row.acabamento_label);
  // Produto criado do ERP: o nome carrega o acabamento ("GLOSS BLACK", "MATTE
  // ELECTRO", "CHROME"). Só vale para cor — um padrão decorativo não tem.
  if (row.kind === 'cor') {
    const r = normalizeFinishString(row.nome);
    return { ids: r.ids, label: null };
  }
  return { ids: [], label: null };
}

function patternDe(row: LojaCatalogoRow): PatternFamilyId | null {
  if (row.familia_padrao && isPatternFamilyId(row.familia_padrao)) return row.familia_padrao;
  if (row.kind !== 'padrao') return null;
  const texto = normalize(row.nome);
  for (const [token, id] of Object.entries(PATTERN_SYNONYMS)) {
    if (new RegExp(`(^|\\s)${token}(\\s|$)`).test(texto)) return id;
  }
  return null;
}

/**
 * Fotos-de-rolo SH Wrapping (chave = slug já prefixado da ERP view).
 * Enquanto o backend não devolver `imagem`, este mapa preenche o campo aqui.
 */
const SH_WRAPPING_IMAGES_ERP: Record<string, string> = {
  'sh-paprika-orange': '/assets/images/shop/sh-wrapping/paprika-orange.webp',
  'sh-glossy-black': '/assets/images/shop/sh-wrapping/glossy-black.webp',
  'sh-pearl-white': '/assets/images/shop/sh-wrapping/pearl-white.webp',
  'sh-sao-paulo-yellow': '/assets/images/shop/sh-wrapping/sao-paulo-yellow.webp',
  'sh-soulmoving-red': '/assets/images/shop/sh-wrapping/soulmoving-red.webp',
  'sh-crystal-white': '/assets/images/shop/sh-wrapping/crystal-white.webp',
  'sh-bentley-pink': '/assets/images/shop/sh-wrapping/bentley-pink.webp',
  'sh-crystal-mamba-green': '/assets/images/shop/sh-wrapping/crystal-mamba-green.webp',
  'sh-pearl-metal-black': '/assets/images/shop/sh-wrapping/pearl-metal-black.webp',
  'sh-khaki-green': '/assets/images/shop/sh-wrapping/khaki-green.webp',
  'sh-combat-green': '/assets/images/shop/sh-wrapping/combat-green.webp',
  'sh-crystal-glacial-blue': '/assets/images/shop/sh-wrapping/crystal-glacial-blue.webp',
  'sh-mercury-silver': '/assets/images/shop/sh-wrapping/mercury-silver.webp',
  'sh-liquid-metal-somato-blue': '/assets/images/shop/sh-wrapping/liquid-metal-somato-blue.webp',
  'sh-pearl-metal-white': '/assets/images/shop/sh-wrapping/pearl-metal-white.webp',
  'sh-pearl-metal-space-grey': '/assets/images/shop/sh-wrapping/pearl-metal-space-grey.webp',
  'sh-amg-grey': '/assets/images/shop/sh-wrapping/amg-grey.webp',
  'sh-amg-mountain-grey': '/assets/images/shop/sh-wrapping/amg-mountain-grey.webp',
  'sh-blue-charm-green': '/assets/images/shop/sh-wrapping/blue-charm-green.webp',
  'sh-candy-purple-gloss-aluminium': '/assets/images/shop/sh-wrapping/candy-purple-gloss-aluminium.webp',
  'sh-crystal-champagne-gold': '/assets/images/shop/sh-wrapping/crystal-champagne-gold.webp',
  'sh-crystal-silver': '/assets/images/shop/sh-wrapping/crystal-silver.webp',
  'sh-crystal-yellow': '/assets/images/shop/sh-wrapping/crystal-yellow.webp',
  'sh-fantastic-green-grey': '/assets/images/shop/sh-wrapping/fantastic-green-grey.webp',
  'sh-fantastic-purple': '/assets/images/shop/sh-wrapping/fantastic-purple.webp',
  'sh-glossy-nado-ash': '/assets/images/shop/sh-wrapping/glossy-nado-ash.webp',
  'sh-matt-dark-purple': '/assets/images/shop/sh-wrapping/matt-dark-purple.webp',
  'sh-pearl-metal-sakura-pink': '/assets/images/shop/sh-wrapping/pearl-metal-sakura-pink.webp',
  'sh-pearl-metal-tiffany': '/assets/images/shop/sh-wrapping/pearl-metal-tiffany.webp',
  'sh-space-blue-gloss-aluminium': '/assets/images/shop/sh-wrapping/space-blue-gloss-aluminium.webp',
  // Oracal 670RA — slug ERP prefixado com 'oracal-670-'
  'oracal-670-white-g': '/assets/images/shop/oracal-670ra/white-g.webp',
  'oracal-670-yellow-g': '/assets/images/shop/oracal-670ra/yellow-g.webp',
  'oracal-670-brimstone-yellow-g': '/assets/images/shop/oracal-670ra/brimstone-yellow-g.webp',
  'oracal-670-dark-red-g': '/assets/images/shop/oracal-670ra/dark-red-g.webp',
  'oracal-670-red-g': '/assets/images/shop/oracal-670ra/red-g.webp',
  'oracal-670-light-red-g': '/assets/images/shop/oracal-670ra/light-red-g.webp',
  'oracal-670-pastel-orange-g': '/assets/images/shop/oracal-670ra/pastel-orange-g.webp',
  'oracal-670-violet-m': '/assets/images/shop/oracal-670ra/violet-m.webp',
  'oracal-670-orange-red-g': '/assets/images/shop/oracal-670ra/orange-red-g.webp',
  'oracal-670-light-blue-g': '/assets/images/shop/oracal-670ra/light-blue-g.webp',
  'oracal-670-mint-g': '/assets/images/shop/oracal-670ra/mint-g.webp',
  'oracal-670-ice-blue-g': '/assets/images/shop/oracal-670ra/ice-blue-g.webp',
  'oracal-670-dark-green-m': '/assets/images/shop/oracal-670ra/dark-green-m.webp',
  'oracal-670-yellow-green-g': '/assets/images/shop/oracal-670ra/yellow-green-g.webp',
  'oracal-670-turquoise-g': '/assets/images/shop/oracal-670ra/turquoise-g.webp',
  'oracal-670-black-g': '/assets/images/shop/oracal-670ra/black-g.webp',
  'oracal-670-black-m': '/assets/images/shop/oracal-670ra/black-m.webp',
  'oracal-670-light-grey-g': '/assets/images/shop/oracal-670ra/light-grey-g.webp',
  'oracal-670-dark-grey-g': '/assets/images/shop/oracal-670ra/dark-grey-g.webp',
  'oracal-670-dark-grey-m': '/assets/images/shop/oracal-670ra/dark-grey-m.webp',
  'oracal-670-telegrey-g': '/assets/images/shop/oracal-670ra/telegrey-g.webp',
  'oracal-670-telegrey-m': '/assets/images/shop/oracal-670ra/telegrey-m.webp',
  'oracal-670-sky-blue-m': '/assets/images/shop/oracal-670ra/sky-blue-m.webp',
  'oracal-670-deep-sea-blue-g': '/assets/images/shop/oracal-670ra/deep-sea-blue-g.webp',
  // Oracal 651 — slug ERP idêntico ao slug do DB (já vem prefixado 'oracal-651-')
  'oracal-651-transparent': '/assets/images/shop/oracal-651/transparent.webp',
  'oracal-651-white': '/assets/images/shop/oracal-651/white.webp',
  'oracal-651-signal-yellow': '/assets/images/shop/oracal-651/signal-yellow.webp',
  'oracal-651-golden-yellow': '/assets/images/shop/oracal-651/golden-yellow.webp',
  'oracal-651-yellow': '/assets/images/shop/oracal-651/yellow.webp',
  'oracal-651-light-yellow': '/assets/images/shop/oracal-651/light-yellow.webp',
  'oracal-651-cream': '/assets/images/shop/oracal-651/cream.webp',
  'oracal-651-brimstone-yellow': '/assets/images/shop/oracal-651/brimstone-yellow.webp',
  'oracal-651-purple-red': '/assets/images/shop/oracal-651/purple-red.webp',
  'oracal-651-dark-red': '/assets/images/shop/oracal-651/dark-red.webp',
  'oracal-651-red': '/assets/images/shop/oracal-651/red.webp',
  'oracal-651-light-red': '/assets/images/shop/oracal-651/light-red.webp',
  'oracal-651-orange': '/assets/images/shop/oracal-651/orange.webp',
  'oracal-651-pastel-orange': '/assets/images/shop/oracal-651/pastel-orange.webp',
  'oracal-651-light-orange': '/assets/images/shop/oracal-651/light-orange.webp',
  'oracal-651-violet': '/assets/images/shop/oracal-651/violet.webp',
  'oracal-651-pink': '/assets/images/shop/oracal-651/pink.webp',
  'oracal-651-lilac': '/assets/images/shop/oracal-651/lilac.webp',
  'oracal-651-lavender': '/assets/images/shop/oracal-651/lavender.webp',
  'oracal-651-soft-pink': '/assets/images/shop/oracal-651/soft-pink.webp',
  'oracal-651-orange-red': '/assets/images/shop/oracal-651/orange-red.webp',
  'oracal-651-king-blue': '/assets/images/shop/oracal-651/king-blue.webp',
  'oracal-651-dark-blue': '/assets/images/shop/oracal-651/dark-blue.webp',
  'oracal-651-gentian-blue': '/assets/images/shop/oracal-651/gentian-blue.webp',
  'oracal-651-azure-blue': '/assets/images/shop/oracal-651/azure-blue.webp',
  'oracal-651-light-blue': '/assets/images/shop/oracal-651/light-blue.webp',
  'oracal-651-turquoise': '/assets/images/shop/oracal-651/turquoise.webp',
  'oracal-651-mint': '/assets/images/shop/oracal-651/mint.webp',
  'oracal-651-ice-blue': '/assets/images/shop/oracal-651/ice-blue.webp',
  'oracal-651-traffic-blue': '/assets/images/shop/oracal-651/traffic-blue.webp',
  'oracal-651-dark-green': '/assets/images/shop/oracal-651/dark-green.webp',
  'oracal-651-green': '/assets/images/shop/oracal-651/green.webp',
  'oracal-651-light-green': '/assets/images/shop/oracal-651/light-green.webp',
  'oracal-651-lime-tree-green': '/assets/images/shop/oracal-651/lime-tree-green.webp',
  'oracal-651-yellow-green': '/assets/images/shop/oracal-651/yellow-green.webp',
  'oracal-651-cobalt-blue': '/assets/images/shop/oracal-651/cobalt-blue.webp',
  'oracal-651-turquoise-blue': '/assets/images/shop/oracal-651/turquoise-blue.webp',
  'oracal-651-blue': '/assets/images/shop/oracal-651/blue.webp',
  'oracal-651-grass-green': '/assets/images/shop/oracal-651/grass-green.webp',
  'oracal-651-black': '/assets/images/shop/oracal-651/black.webp',
  'oracal-651-grey': '/assets/images/shop/oracal-651/grey.webp',
  'oracal-651-light-grey': '/assets/images/shop/oracal-651/light-grey.webp',
  'oracal-651-dark-grey': '/assets/images/shop/oracal-651/dark-grey.webp',
  'oracal-651-middle-grey': '/assets/images/shop/oracal-651/middle-grey.webp',
  'oracal-651-telegrey': '/assets/images/shop/oracal-651/telegrey.webp',
  'oracal-651-brown': '/assets/images/shop/oracal-651/brown.webp',
  'oracal-651-light-brown': '/assets/images/shop/oracal-651/light-brown.webp',
  'oracal-651-beige': '/assets/images/shop/oracal-651/beige.webp',
  'oracal-651-nut-brown': '/assets/images/shop/oracal-651/nut-brown.webp',
  'oracal-651-sky-blue': '/assets/images/shop/oracal-651/sky-blue.webp',
  'oracal-651-brilliant-blue': '/assets/images/shop/oracal-651/brilliant-blue.webp',
  'oracal-651-silver-grey': '/assets/images/shop/oracal-651/silver-grey.webp',
  'oracal-651-gold': '/assets/images/shop/oracal-651/gold.webp',
  'oracal-651-copper': '/assets/images/shop/oracal-651/copper.webp',
  'oracal-651-gentian': '/assets/images/shop/oracal-651/gentian.webp',
  'oracal-651-burgundy': '/assets/images/shop/oracal-651/burgundy.webp',
  'oracal-651-coral': '/assets/images/shop/oracal-651/coral.webp',
  'oracal-651-purple': '/assets/images/shop/oracal-651/purple.webp',
  'oracal-651-steel-blue': '/assets/images/shop/oracal-651/steel-blue.webp',
  'oracal-651-deep-sea-blue': '/assets/images/shop/oracal-651/deep-sea-blue.webp',
  'oracal-651-forest-green': '/assets/images/shop/oracal-651/forest-green.webp',
  'oracal-651-imitation-gold': '/assets/images/shop/oracal-651/imitation-gold.webp',
};

/**
 * Galerias SH Wrapping (chave = slug já prefixado da ERP view).
 * Rolo + 3 carros esportivos envelopados na cor. Cores sem galeria
 * caem no `image` sozinho.
 */
const SH_WRAPPING_GALLERY_ERP: Record<string, string[]> = {
  'sh-sao-paulo-yellow': [
    '/assets/images/shop/sh-wrapping/sao-paulo-yellow.webp',
    '/assets/images/shop/sh-wrapping/sao-paulo-yellow-car-1.webp',
    '/assets/images/shop/sh-wrapping/sao-paulo-yellow-car-2.webp',
    '/assets/images/shop/sh-wrapping/sao-paulo-yellow-car-3.webp',
  ],
  'sh-soulmoving-red': [
    '/assets/images/shop/sh-wrapping/soulmoving-red.webp',
    '/assets/images/shop/sh-wrapping/soulmoving-red-car-1.webp',
    '/assets/images/shop/sh-wrapping/soulmoving-red-car-2.webp',
    '/assets/images/shop/sh-wrapping/soulmoving-red-car-3.webp',
  ],
  'sh-crystal-white': [
    '/assets/images/shop/sh-wrapping/crystal-white.webp',
    '/assets/images/shop/sh-wrapping/crystal-white-car-1.webp',
    '/assets/images/shop/sh-wrapping/crystal-white-car-2.webp',
    '/assets/images/shop/sh-wrapping/crystal-white-car-3.webp',
  ],
  'sh-bentley-pink': [
    '/assets/images/shop/sh-wrapping/bentley-pink.webp',
    '/assets/images/shop/sh-wrapping/bentley-pink-car-1.webp',
    '/assets/images/shop/sh-wrapping/bentley-pink-car-2.webp',
    '/assets/images/shop/sh-wrapping/bentley-pink-car-3.webp',
  ],
  'sh-crystal-mamba-green': [
    '/assets/images/shop/sh-wrapping/crystal-mamba-green.webp',
    '/assets/images/shop/sh-wrapping/crystal-mamba-green-car-1.webp',
    '/assets/images/shop/sh-wrapping/crystal-mamba-green-car-2.webp',
    '/assets/images/shop/sh-wrapping/crystal-mamba-green-car-3.webp',
  ],
  'sh-pearl-metal-black': [
    '/assets/images/shop/sh-wrapping/pearl-metal-black.webp',
    '/assets/images/shop/sh-wrapping/pearl-metal-black-car-1.webp',
    '/assets/images/shop/sh-wrapping/pearl-metal-black-car-2.webp',
    '/assets/images/shop/sh-wrapping/pearl-metal-black-car-3.webp',
  ],
  'sh-khaki-green': [
    '/assets/images/shop/sh-wrapping/khaki-green.webp',
    '/assets/images/shop/sh-wrapping/khaki-green-car-1.webp',
    '/assets/images/shop/sh-wrapping/khaki-green-car-2.webp',
    '/assets/images/shop/sh-wrapping/khaki-green-car-3.webp',
  ],
  'sh-combat-green': [
    '/assets/images/shop/sh-wrapping/combat-green.webp',
    '/assets/images/shop/sh-wrapping/combat-green-car-1.webp',
    '/assets/images/shop/sh-wrapping/combat-green-car-2.webp',
    '/assets/images/shop/sh-wrapping/combat-green-car-3.webp',
  ],
  'sh-crystal-glacial-blue': [
    '/assets/images/shop/sh-wrapping/crystal-glacial-blue.webp',
    '/assets/images/shop/sh-wrapping/crystal-glacial-blue-car-1.webp',
    '/assets/images/shop/sh-wrapping/crystal-glacial-blue-car-2.webp',
    '/assets/images/shop/sh-wrapping/crystal-glacial-blue-car-3.webp',
  ],
  'sh-mercury-silver': [
    '/assets/images/shop/sh-wrapping/mercury-silver.webp',
    '/assets/images/shop/sh-wrapping/mercury-silver-car-1.webp',
    '/assets/images/shop/sh-wrapping/mercury-silver-car-2.webp',
    '/assets/images/shop/sh-wrapping/mercury-silver-car-3.webp',
  ],
  'sh-liquid-metal-somato-blue': [
    '/assets/images/shop/sh-wrapping/liquid-metal-somato-blue.webp',
    '/assets/images/shop/sh-wrapping/liquid-metal-somato-blue-car-1.webp',
    '/assets/images/shop/sh-wrapping/liquid-metal-somato-blue-car-2.webp',
    '/assets/images/shop/sh-wrapping/liquid-metal-somato-blue-car-3.webp',
  ],
  'sh-pearl-metal-white': [
    '/assets/images/shop/sh-wrapping/pearl-metal-white.webp',
    '/assets/images/shop/sh-wrapping/pearl-metal-white-car-1.webp',
    '/assets/images/shop/sh-wrapping/pearl-metal-white-car-2.webp',
    '/assets/images/shop/sh-wrapping/pearl-metal-white-car-3.webp',
  ],
  'sh-pearl-metal-space-grey': [
    '/assets/images/shop/sh-wrapping/pearl-metal-space-grey.webp',
    '/assets/images/shop/sh-wrapping/pearl-metal-space-grey-car-1.webp',
    '/assets/images/shop/sh-wrapping/pearl-metal-space-grey-car-2.webp',
    '/assets/images/shop/sh-wrapping/pearl-metal-space-grey-car-3.webp',
  ],
};

export function lojaRowToShopItem(row: LojaCatalogoRow, slugPorId?: ReadonlyMap<string, string>): ShopItem {
  const finish = finishesDe(row);
  const color = resolveColor({
    name: row.nome,
    code: row.codigo ?? row.erp_sku,
    hex: row.transparente ? null : row.hex,
    declaredFamily: (row.cor_declarada as ColorFamilyId | null) ?? null,
    inferredHex: row.hex_inferido,
    transparent: Boolean(row.transparente),
    finishes: finish.ids,
  });

  const aplicacoes = (row.aplicacoes ?? []).filter((a): a is Aplicacao =>
    (APLICACOES as readonly string[]).includes(a)
  );

  const specs: ShopSpec[] = Array.isArray(row.ficha) ? row.ficha : [];
  const brand = row.marca_exibicao ?? 'NZ';
  const line = row.linha_label ?? null;

  // Caixa-alta total no nome exibido — decisão editorial, mesma regra do
  // dbSnapshot. O `row.nome` cru vem do banco em qualquer capitalização
  // (herança do ERP); aqui a gente normaliza sempre.
  const displayName = (row.nome ?? '').toUpperCase();

  // Regra de imagem/galeria (mesma do dbSnapshot):
  //  - row.imagem publicada no banco vence tudo
  //  - senão, se o slug está em REVIEWED, usa o mapa customizado
  //  - senão, cai no placeholder branded da linha (nunca vazio)
  const reviewed = isReviewedSlug(row.slug);
  // `Record<string, string>` sem noUncheckedIndexedAccess indexa como `string`,
  // nunca `string | undefined`; o encadeamento direto de `??` com o ternário
  // aninhado por isso não compilava (TS2871). Separado, fica legível e o tipo
  // do meio é honesto: pode não haver foto revisada para este slug.
  const fotoRevisada: string | undefined = reviewed
    ? SH_WRAPPING_IMAGES_ERP[row.slug]
    : undefined;
  // A foto de rolo VENCE `row.imagem`. E a unica excecao a "banco manda", e por
  // um motivo concreto: onde o banco traz chip de cor (MetaCast MCX), o chip nao
  // mostra o material. Onde o banco nao traz nada (Metamark 7 Series), sem isto
  // a linha ficaria no placeholder mesmo com foto em disco.
  const rolo: string | undefined = rollImageFor(row.slug);
  // Separado do placeholder de proposito: `capa` e a foto de verdade, quando
  // existe. Ela precisa liderar a galeria, e um placeholder nunca deve entrar
  // no meio de fotos reais.
  const capa: string | null = rolo ?? row.imagem ?? fotoRevisada ?? null;
  const imageResolvido = capa ?? genericImageForLine(row.linha_key);
  const galleryBase =
    row.galeria && row.galeria.length > 0
      ? row.galeria
      : reviewed
        ? (SH_WRAPPING_GALLERY_ERP[row.slug] ?? [])
        : [];
  // Fotos oficiais de veiculo da SH Wrapping (as de /wrap/sh-wrapping). Entram
  // no fim, sem duplicar o que ja veio do banco ou do mapa de galeria.
  const veiculos = shVehiclePhotosFor(row.slug);
  // A CAPA E SEMPRE O PRIMEIRO ITEM. A pagina do produto renderiza a galeria,
  // nao o campo `image`: sem esta linha, uma cor SH com foto de veiculo mas sem
  // galeria propria abriria no carro e o rolo sumiria da pagina.
  const galeriaCrua = [
    ...(capa ? [capa] : []),
    ...galleryBase,
    ...veiculos,
  ];
  const galleryResolvida = galeriaCrua.filter((u, i) => galeriaCrua.indexOf(u) === i);

  // A pagina do produto le `media`, nao `gallery`. Como o banco ja preenche
  // `midias` para a MCX (chip + aplicacao), o rolo precisa entrar aqui tambem —
  // senao a capa da lista mostra o rolo e a da pagina continua mostrando o chip.
  const semMeta = (url: string): MidiaPublica => ({
    tipo: 'imagem',
    url,
    poster: null,
    alt: null,
    largura: null,
    altura: null,
    duracao: null,
  });
  const mediaBase: MidiaPublica[] =
    row.midias && row.midias.length > 0 ? row.midias : galleryResolvida.map(semMeta);
  // Mesma regra da galeria: capa na frente, veiculos no fim, sem repetir. O
  // banco pode ter `midias` proprias (MetaCast MCX tem), entao nao da para
  // simplesmente derivar da galeria.
  const midiasCruas: MidiaPublica[] = [
    ...(capa ? [semMeta(capa)] : []),
    ...mediaBase,
    ...veiculos.map(semMeta),
  ];
  const vistos = new Set<string>();
  const mediaResolvida: MidiaPublica[] = midiasCruas.filter((m) => {
    if (vistos.has(m.url)) return false;
    vistos.add(m.url);
    return true;
  });

  return {
    slug: row.slug,
    source: 'erp',
    sourceId: row.slug,
    name: displayName,
    code: row.codigo,
    subtitle: row.subtitulo,
    brand,
    line,
    lineKey: row.linha_key as LineKey,
    brandKey: (row.brand_key ?? 'outro') as BrandKey,
    vertical: row.vertical,
    kind: row.kind,
    aplicacoes,
    image: imageResolvido,
    gallery: galleryResolvida,
    // `midias` só existe para quem já cadastrou pelo painel novo; o resto
    // continua com as URLs de sempre, sem alt nem dimensão.
    media: mediaResolvida,
    hex: row.hex,
    colorFamilies: color.families,
    colorSubfamilies: color.subfamilies,
    colorConfidence: color.confidence,
    finishes: finish.ids,
    finishLabel: finish.label,
    patternFamily: patternDe(row),
    specs,
    badges: row.badges ?? [],
    garantiaAnos: row.garantia_anos,
    durabilidadeAnos: row.durabilidade_anos,
    description: row.descricao,
    legacyPath: row.legacy_path,
    searchText: buildSearchText([
      row.nome, // busca inclui o nome cru também, cobre buscas em minúsculas
      displayName,
      row.codigo,
      row.erp_sku,
      brand,
      line,
      row.subtitulo,
      finish.label,
      row.descricao,
    ]),
    erpSku: row.erp_sku,
    tipoVinculo: row.tipo_vinculo,
    aliasDeSlug: row.alias_de ? (slugPorId?.get(row.alias_de) ?? null) : null,
    nivelEstoque: row.nivel_estoque,
    larguraM: row.largura_m,
    metragemPadrao: row.metragem_padrao,
  };
}

/** Converte a view inteira, resolvendo `alias_de` (id) → slug. */
export function lojaRowsToShopItems(rows: LojaCatalogoRow[]): ShopItem[] {
  const slugPorId = new Map(rows.map((r) => [r.id, r.slug] as const));
  return rows.map((r) => lojaRowToShopItem(r, slugPorId));
}
