// Camada unificada da LOJA — tipo comum a todas as fontes do catálogo.
//
// O portfólio da NZ vive hoje em 8 fontes com schemas incompatíveis (arquivos
// .ts gerados por script, arquivos .ts à mão e a tabela web_catalog_products).
// `ShopItem` é o denominador comum: cada adapter em ./adapters converte a sua
// fonte para cá, e a partir daí busca, filtro, card e página de produto só
// conhecem este tipo.
//
// Regra de ouro: nada de custo, preço ou margem entra neste tipo. A LOJA é
// vitrine; valores são sob consulta.

import type { ColorFamilyId, ColorSubfamilyId } from './color/lexicon';
import type { FinishId } from './finish/tree';
import type { PatternFamilyId } from './pattern/taxonomy';
import type { BrandKeyErp, LinhaErp } from './erp/mapa';

/** As 4 linhas de negócio da NZ, espelhando as rotas /ppf /wrap /sign /decor. */
export type Vertical = 'PPF' | 'WRAP' | 'SIGN' | 'DECOR';

/**
 * O que o item é, do ponto de vista de quem procura:
 * - `cor`    uma cor de um filme (Oracal 651 White, M7-108 Imitation Gold)
 * - `padrao` uma textura decorativa (Madeira Carvalho Areia)
 * - `linha`  uma família técnica sem SKU de cor (Avery MPI, NZPPF Luxury Gloss)
 */
export type ItemKind = 'cor' | 'padrao' | 'linha';

export type Aplicacao = 'automotivo' | 'arquitetonico' | 'comunicacao-visual';

/** Fonte de origem do dado. Um por adapter. */
export type SourceKey =
  | 'etherna'
  | 'sh-decor'
  | 'm7'
  | 'mcx'
  | 'nzwrap'
  | 'oracal-651'
  | 'oracal-670'
  | 'sh-wrapping'
  | 'avery'
  | 'md80'
  | 'ppf'
  /** Cadastro no banco do site (`produtos` ⨝ `erp_produtos`), espelhado do NZERP. */
  | 'erp';

/**
 * Chave da linha comercial, usada para resolver o perfil de embalagem na
 * logística (um perfil vale para todos os itens da mesma linha — os 92 M7 são
 * o mesmo filme físico, só muda a cor). Começou igual a `SourceKey`; com o
 * espelho do ERP ganhou as linhas que só existem lá (Speed Wrapping, NAR…).
 * A lista canônica vive em ./erp/mapa.ts.
 */
export type LineKey = LinhaErp;

/**
 * Fabricante. Separado da LINHA de propósito: a SH fabrica duas linhas de
 * negócios diferentes — SH Wrapping (automotiva) e SH Decor (decorativa) —, e a
 * Metamark fabrica três. Quem procura "SH Decor" não quer ver vinil automotivo;
 * quem procura "metamark" quer as três linhas. Sem os dois eixos, um dos dois
 * comportamentos fica errado.
 */
export type BrandKey = BrandKeyErp;

/** Nível qualitativo de estoque — o único dado de estoque que é público. */
export type NivelEstoque = 'pronta-entrega' | 'ultimas-unidades' | 'sob-encomenda';

/** Como o produto do site se liga ao SKU físico do ERP. */
export type TipoVinculo = 'proprio' | 'alias' | 'familia' | 'pendente';

/** Uma foto ou vídeo do produto, como o catálogo entrega. */
export interface MidiaPublica {
  tipo: 'imagem' | 'video' | 'video-externo';
  url: string;
  poster: string | null;
  alt: string | null;
  largura: number | null;
  altura: number | null;
  duracao: number | null;
}

export interface ShopSpec {
  label: string;
  value: string;
}

/** De onde veio a família de cor — usada para pontuar e para sinalizar estimativa na UI. */
export type ColorConfidence = 'declarada' | 'nome' | 'hex' | 'inferida';

export interface ShopItem {
  /** Slug global, já prefixado pela fonte. Ex.: 'sh-decor-formica-nude'. */
  slug: string;
  source: SourceKey;
  /** Identificador original na fonte, antes do prefixo. Serve para montar `legacyPath`. */
  sourceId: string;

  name: string;
  /** Código de mostruário / SKU exibido no chip do card. 'IT 403', 'M7-108', 'NZW201'. */
  code: string | null;
  subtitle: string | null;
  brand: string;
  /** Linha comercial legível. 'MetaCast MCX', 'Oracal 651', '7 Series'. */
  line: string | null;
  lineKey: LineKey;
  brandKey: BrandKey;

  vertical: Vertical;
  kind: ItemKind;
  aplicacoes: Aplicacao[];

  /** Imagem principal. `null` ⇒ o card renderiza swatch a partir de `hex`. */
  image: string | null;
  gallery: string[];
  /**
   * Mídia com metadado (alt, dimensão, vídeo). `gallery` continua sendo só as
   * URLs das imagens, para o que já lia dela; `media` é o que a página do
   * produto usa para montar galeria com vídeo e `<img width height>`.
   *
   * Opcional porque só o catálogo do banco preenche: as fontes estáticas
   * (adapters editorial/cores/decor) continuam entregando apenas `gallery`.
   */
  media?: MidiaPublica[];

  hex: string | null;
  /** Famílias de cor; a primária é `[0]`. Vazio para padrões sem cor identificável. */
  colorFamilies: ColorFamilyId[];
  colorSubfamilies: ColorSubfamilyId[];
  colorConfidence: ColorConfidence | null;

  /** Tags planas de acabamento: 'Metálico Fosco' → ['metalico', 'fosco']. */
  finishes: FinishId[];
  /** A grafia original, para exibição. */
  finishLabel: string | null;

  patternFamily: PatternFamilyId | null;

  specs: ShopSpec[];
  badges: string[];
  garantiaAnos: number | null;
  durabilidadeAnos: number | null;
  description: string | null;

  /** Rota de detalhe que existia antes da LOJA. `null` quando o item nunca teve página. */
  legacyPath: string | null;

  /** Texto normalizado (sem acento, minúsculo) para o fallback de busca textual. */
  searchText: string;

  // --- campos que só existem quando o item vem do banco (source 'erp').
  // Opcionais para os adapters estáticos continuarem válidos até serem
  // aposentados pela migração do catálogo para `produtos`.

  /** SKU físico no NZERP. Alias aponta para o SKU do produto original. */
  erpSku?: string | null;
  tipoVinculo?: TipoVinculo;
  /** Slug do produto do qual este é alias (NZWRAP → SH Wrapping). */
  aliasDeSlug?: string | null;
  /** Vem pronto na view pública; nunca há número junto. */
  nivelEstoque?: NivelEstoque | null;
  larguraM?: number | null;
  metragemPadrao?: number | null;
}

/** Prefixo de slug por fonte. Resolve as 3 colisões reais entre etherna e sh-decor. */
const SLUG_PREFIX: Record<SourceKey, string> = {
  etherna: 'etherna-',
  'sh-decor': 'sh-decor-',
  m7: 'm7-',
  mcx: 'mcx-',
  nzwrap: 'nzwrap-',
  'oracal-651': 'oracal-651-',
  'oracal-670': 'oracal-670-',
  'sh-wrapping': 'sh-',
  avery: 'avery-',
  md80: 'md80-',
  ppf: 'ppf-',
  // O slug de um produto do banco já é global: nunca recebe prefixo.
  erp: '',
};

/**
 * Monta o slug global. O `startsWith` evita duplicar o prefixo em fontes que já
 * o trazem embutido (M7, MCX e Oracal vêm com 'm7-108-...', 'mcx-54-...').
 */
export function shopSlug(source: SourceKey, sourceId: string): string {
  const prefix = SLUG_PREFIX[source];
  const id = sourceId.toLowerCase().trim();
  return id.startsWith(prefix) ? id : prefix + id;
}

/** Busca sem acento/caixa: 'formica' encontra 'Fórmica'. Mesma regra do SearchPalette. */
export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Monta o `searchText` de um item. Concentrado aqui para que todos os adapters
 * produzam exatamente o mesmo formato — o matcher depende disso.
 */
export function buildSearchText(parts: (string | null | undefined)[]): string {
  return normalize(parts.filter(Boolean).join(' ')).replace(/\s+/g, ' ');
}

/**
 * Falha alto e cedo se duas fontes gerarem o mesmo slug. Roda só em DEV, mas é
 * o que impede uma colisão silenciosa de derrubar uma página de produto.
 */
export function assertUniqueSlugs(items: ShopItem[]): void {
  const seen = new Map<string, SourceKey>();
  const clashes: string[] = [];
  for (const item of items) {
    const previous = seen.get(item.slug);
    if (previous) clashes.push(`${item.slug} (${previous} × ${item.source})`);
    else seen.set(item.slug, item.source);
  }
  if (clashes.length) {
    throw new Error(`[shop] slugs duplicados no catálogo:\n  ${clashes.join('\n  ')}`);
  }
}
