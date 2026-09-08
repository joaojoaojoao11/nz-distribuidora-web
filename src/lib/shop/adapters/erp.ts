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
// FOTO VEM DO BANCO. Este adapter não tem mapa de imagem nenhum — ver a nota
// dentro de `lojaRowToShopItem`. O único caminho de arquivo que ele conhece é o
// placeholder da linha, para o produto sem foto alguma.

import { resolveColor } from '../color/resolveColor';
import type { ColorFamilyId } from '../color/lexicon';
import { normalizeFinishString } from '../finish/normalizeFinish';
import { isFinishId, type FinishId } from '../finish/tree';
import { isPatternFamilyId, PATTERN_SYNONYMS, type PatternFamilyId } from '../pattern/taxonomy';
import { genericImageForLine } from '../generic';
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

  // REGRA DE IMAGEM: quem manda e o BANCO, ponto.
  //
  // Ate 11/09/2026 este adapter completava a foto por conta propria — mapas de
  // slug -> arquivo em `generic.ts` e aqui dentro, mais as fotos de veiculo da
  // SH Wrapping. A loja ficava bonita e o cadastro do produto, que le
  // `produto_midia`, mostrava "nenhuma foto ainda": eram 577 dos 806 itens com
  // foto que ninguem conseguia reordenar, trocar de capa ou apagar (o SHMG-101
  // tinha 8 na pagina e zero no painel). Pior, `capaDe` colocava o mapa ANTES de
  // `row.imagem`, entao trocar a capa pelo painel nao surtia efeito.
  //
  // Aquelas 788 fotos foram para o banco em
  // migrations/2026-09-11d_midia_do_codigo_para_o_banco.sql, na mesma ordem e
  // com a mesma capa. Daqui em diante nao ha o que "completar": o que a loja
  // mostra e o que o painel gerencia, e apagar no painel apaga na loja.
  //
  // O unico caminho que continua vindo do codigo e o PLACEHOLDER da linha, e ele
  // nao e foto: e o que se desenha quando o produto nao tem nenhuma. Por isso
  // entra so em `image`, nunca na galeria nem em `media`.
  const capa = row.imagem ?? null;
  const imageResolvido = capa ?? genericImageForLine(row.linha_key);
  const galleryResolvida = (row.galeria ?? []).filter((u, i, a) => a.indexOf(u) === i);

  // A pagina do produto le `media`, nao `gallery`. `midias` e a fonte; a galeria
  // so cobre o produto cujo espelho ainda nao rodou (o gatilho nz_espelhar_midia
  // mantem as duas iguais).
  const semMeta = (url: string): MidiaPublica => ({
    tipo: 'imagem',
    url,
    poster: null,
    alt: null,
    largura: null,
    altura: null,
    duracao: null,
  });
  const midiasCruas: MidiaPublica[] =
    row.midias && row.midias.length > 0 ? row.midias : galleryResolvida.map(semMeta);
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
    unidadeVenda: row.unidade,
  };
}

/** Converte a view inteira, resolvendo `alias_de` (id) → slug. */
export function lojaRowsToShopItems(rows: LojaCatalogoRow[]): ShopItem[] {
  const slugPorId = new Map(rows.map((r) => [r.id, r.slug] as const));
  return rows.map((r) => lojaRowToShopItem(r, slugPorId));
}
