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
import {
  buildSearchText,
  normalize,
  type Aplicacao,
  type BrandKey,
  type ItemKind,
  type LineKey,
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

  return {
    slug: row.slug,
    source: 'erp',
    sourceId: row.slug,
    name: row.nome,
    code: row.codigo,
    subtitle: row.subtitulo,
    brand,
    line,
    lineKey: row.linha_key as LineKey,
    brandKey: (row.brand_key ?? 'outro') as BrandKey,
    vertical: row.vertical,
    kind: row.kind,
    aplicacoes,
    image: row.imagem ?? SH_WRAPPING_IMAGES_ERP[row.slug] ?? null,
    gallery: row.galeria && row.galeria.length > 0 ? row.galeria : (SH_WRAPPING_GALLERY_ERP[row.slug] ?? []),
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
      row.nome,
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
