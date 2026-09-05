// Planejador da migração dos 505 itens editoriais para a tabela `produtos`.
//
// Roda UMA vez (scripts/migrar-catalogo-editorial.mjs), depois do primeiro
// sync ter populado `erp_produtos`. É TS puro para ser testável: o script só
// compila isto com esbuild, entrega a lista de SKUs do ERP e grava o resultado.
//
// Três decisões que ele toma por item:
//   1. a linha de `produtos` (o editorial vira dado, com o MESMO slug — a URL
//      não muda);
//   2. a proposta de conexão com o ERP, em ordem de confiança
//      (código exato > nome exato > código parcial > nome parcial);
//   3. para os NZWRAP do site, o ALIAS: a foto aponta para a pasta da SH, e a
//      SH correspondente tem SKU no ERP — então NZW204 herda o SKU de
//      'sh-bentley-pink'.
//
// Regra de publicação: proposta com confiança ≥ LIMIAR_PUBLICA entra
// publicada como conexão PROVISÓRIA (fica na fila do admin para confirmar);
// abaixo disso, ou sem proposta, o item fica 'pendente' e NÃO publica — é a
// regra "todo produto publicado tem SKU".

import { SHOP_ITEMS } from './catalog';
import { NZWRAP_COLORS } from '../data/nzwrapColors';
import { MCX_CHIP_HEX } from './generated/mcxChipHex';
import type { ShopItem } from './types';

export const LIMIAR_PUBLICA = 0.7;

export interface ErpSkuRef {
  sku: string;
  nome: string | null;
  marca: string | null;
  categoria: string | null;
  ativo: boolean;
}

export interface Proposta {
  sku: string;
  confianca: number;
  via: 'codigo-exato' | 'nome-exato' | 'codigo-parcial' | 'nome-parcial' | 'alias-foto';
}

/** Linha de `produtos` pronta para upsert (onConflict: slug). */
export interface ProdutoRow {
  slug: string;
  erp_sku: string | null;
  tipo_vinculo: 'proprio' | 'alias' | 'familia' | 'pendente';
  alias_de_slug: string | null;
  alias_nota: string | null;
  nome: string;
  subtitulo: string | null;
  marca_exibicao: string;
  brand_key: string;
  linha_key: string;
  linha_label: string | null;
  vertical: string;
  kind: string;
  aplicacoes: string[];
  codigo: string | null;
  imagem: string | null;
  galeria: string[];
  hex: string | null;
  cor_declarada: string | null;
  transparente: boolean;
  hex_inferido: string | null;
  acabamentos: string[];
  acabamento_label: string | null;
  familia_padrao: string | null;
  descricao: string | null;
  ficha: { label: string; value: string }[];
  badges: string[];
  garantia_anos: number | null;
  durabilidade_anos: number | null;
  legacy_path: string | null;
  publicado: boolean;
  origem: 'editorial';
  fonte_original: string;
}

export interface PlanoMigracao {
  produtos: ProdutoRow[];
  propostas: { shop_slug: string; erp_sku: string; confianca: number; via: Proposta['via'] }[];
  resumo: {
    total: number;
    porVia: Record<string, number>;
    publicados: number;
    pendentes: number;
    familias: number;
    skusDuplicados: { erp_sku: string; slugs: string[] }[];
  };
}

const norm = (s: string | null | undefined) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

/** 'NZW204' → slug SH da foto ('bentley-pink'), quando toda a galeria vem de /sh/. */
function shSlugDaFoto(sku: string): string | null {
  const cor = NZWRAP_COLORS.find((c) => c.sku === sku);
  if (!cor) return null;
  const shImgs = cor.images.filter((i) => i.includes('/images/sh/'));
  const proprias = cor.images.filter((i) => i.includes('/images/nzwrap/'));
  if (!shImgs.length || proprias.length) return null;
  const base = shImgs[0]!.split('/').pop()!.replace(/\.(png|webp|jpg)$/i, '');
  return base
    .replace(/_(morning|afternoon|sunset|night|v2|suv|sedan|supercar)$/g, '')
    .replace(/_(morning|afternoon|sunset|night|v2|suv|sedan|supercar)$/g, '')
    .replace(/_/g, '-');
}

/** Sinônimos entre o nome do arquivo da SH e o slug do item SH Wrapping do site. */
const SH_FOTO_PARA_SLUG: Record<string, string> = {
  ag: 'amg-grey',
  'pm-sg': 'pearl-metal-space-grey',
  'glossy-nando-ash': 'glossy-nado-ash',
};

export function planejarMigracao(erp: ErpSkuRef[]): PlanoMigracao {
  const erpBySku = new Map(erp.map((e) => [norm(e.sku), e] as const));
  const erpByNome = new Map<string, ErpSkuRef>();
  for (const e of erp) {
    const n = norm(e.nome);
    if (n && !erpByNome.has(n)) erpByNome.set(n, e);
  }
  const shItems = new Map(
    SHOP_ITEMS.filter((i) => i.source === 'sh-wrapping').map((i) => [i.sourceId, i] as const)
  );

  function propor(item: ShopItem): Proposta | null {
    const code = norm(item.code);
    const nome = norm(item.name);
    if (code && erpBySku.has(code)) return { sku: erpBySku.get(code)!.sku, confianca: 0.98, via: 'codigo-exato' };
    if (nome && erpByNome.has(nome)) return { sku: erpByNome.get(nome)!.sku, confianca: 0.85, via: 'nome-exato' };
    if (code.length >= 3) {
      for (const [sku, row] of erpBySku) {
        if (sku.endsWith(code) || sku.startsWith(code)) return { sku: row.sku, confianca: 0.7, via: 'codigo-parcial' };
      }
    }
    if (nome.length >= 8) {
      for (const [n, row] of erpByNome) {
        if (n.includes(nome) || nome.includes(n)) return { sku: row.sku, confianca: 0.5, via: 'nome-parcial' };
      }
    }
    return null;
  }

  const produtos: ProdutoRow[] = [];
  const propostas: PlanoMigracao['propostas'] = [];
  const porVia: Record<string, number> = {};
  const porSku = new Map<string, string[]>();

  // Primeira passada: propostas normais. Alias precisa saber o SKU do SH.
  const propostaPorSlug = new Map<string, Proposta>();
  for (const item of SHOP_ITEMS) {
    if (item.kind === 'linha') continue;
    const p = propor(item);
    if (p) propostaPorSlug.set(item.slug, p);
  }

  for (const item of SHOP_ITEMS) {
    let tipo: ProdutoRow['tipo_vinculo'] = 'pendente';
    let erpSku: string | null = null;
    let aliasDeSlug: string | null = null;
    let aliasNota: string | null = null;
    let proposta = propostaPorSlug.get(item.slug) ?? null;

    if (item.kind === 'linha') {
      tipo = 'familia';
    } else if (item.source === 'nzwrap') {
      // Alias pela foto: só vale se a SH correspondente tem SKU no ERP.
      const fotoSlug = shSlugDaFoto(item.sourceId);
      const shSlug = fotoSlug ? (SH_FOTO_PARA_SLUG[fotoSlug] ?? fotoSlug) : null;
      const sh = shSlug ? shItems.get(shSlug) : undefined;
      const shProposta = sh ? propostaPorSlug.get(sh.slug) : undefined;
      if (sh && shProposta && shProposta.via === 'codigo-exato') {
        proposta = { sku: shProposta.sku, confianca: 0.9, via: 'alias-foto' };
        aliasDeSlug = sh.slug;
        aliasNota = `Mesmo rolo físico de ${sh.name} (${shProposta.sku}); nome NZWRAP.`;
      } else {
        proposta = null;
      }
    }

    if (proposta) {
      porVia[proposta.via] = (porVia[proposta.via] ?? 0) + 1;
      propostas.push({ shop_slug: item.slug, erp_sku: proposta.sku, confianca: proposta.confianca, via: proposta.via });
      if (proposta.confianca >= LIMIAR_PUBLICA) {
        erpSku = proposta.sku;
        tipo = aliasDeSlug ? 'alias' : 'proprio';
        const lista = porSku.get(proposta.sku) ?? [];
        lista.push(item.slug);
        porSku.set(proposta.sku, lista);
      }
    }

    const publicado = tipo === 'familia' || (tipo !== 'pendente' && erpSku !== null);

    produtos.push({
      slug: item.slug,
      erp_sku: erpSku,
      tipo_vinculo: tipo,
      alias_de_slug: aliasDeSlug,
      alias_nota: aliasNota,
      nome: item.name,
      subtitulo: item.subtitle,
      marca_exibicao: item.brand,
      brand_key: item.brandKey,
      linha_key: item.lineKey,
      linha_label: item.line,
      vertical: item.vertical,
      kind: item.kind,
      aplicacoes: item.aplicacoes,
      codigo: item.code,
      imagem: item.image,
      galeria: item.gallery,
      hex: item.hex,
      // Só o M7 declara família; no ShopItem isso sobrevive como confidence.
      cor_declarada: item.colorConfidence === 'declarada' ? (item.colorFamilies[0] ?? null) : null,
      transparente: item.colorFamilies.includes('transparente'),
      hex_inferido: item.source === 'mcx' ? (MCX_CHIP_HEX[item.sourceId] ?? null) : null,
      acabamentos: item.finishes,
      acabamento_label: item.finishLabel,
      familia_padrao: item.patternFamily,
      descricao: item.description,
      ficha: item.specs,
      badges: item.badges,
      garantia_anos: item.garantiaAnos,
      durabilidade_anos: item.durabilidadeAnos,
      legacy_path: item.legacyPath,
      publicado,
      origem: 'editorial',
      fonte_original: item.source,
    });
  }

  const skusDuplicados = [...porSku.entries()]
    .filter(([, slugs]) => slugs.length > 1)
    // Alias NZWRAP ↔ SH é duplicidade LEGÍTIMA — não é para listar como suspeita.
    .filter(([, slugs]) => {
      const tipos = slugs.map((s) => produtos.find((p) => p.slug === s)?.tipo_vinculo);
      return !(tipos.filter((t) => t === 'proprio').length === 1 && tipos.every((t) => t === 'proprio' || t === 'alias'));
    })
    .map(([erp_sku, slugs]) => ({ erp_sku, slugs }));

  return {
    produtos,
    propostas,
    resumo: {
      total: produtos.length,
      porVia,
      publicados: produtos.filter((p) => p.publicado).length,
      pendentes: produtos.filter((p) => p.tipo_vinculo === 'pendente').length,
      familias: produtos.filter((p) => p.tipo_vinculo === 'familia').length,
      skusDuplicados,
    },
  };
}
