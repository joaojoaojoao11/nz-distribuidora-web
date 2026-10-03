// Promoção Moto — QUEM está na promoção e por QUANTO sai o metro. Uma regra só,
// usada por três lugares que não podem divergir:
//   /api/nz/promo-moto  → a lista da loja (quais cores e as fotos de moto);
//   /api/nz/precos      → o preço do card ("de R$ X por R$ Y/m");
//   pedido/precificar   → o que o checkout cobra.
// Se o card mostrasse um preço e o checkout cobrasse outro, a loja estaria
// anunciando um valor que não honra.
//
// Entra na promoção a cor que tem, ao mesmo tempo:
//   1. as fotos de moto prontas (produto_midia em /assets/images/shop/motos/);
//   2. pedaço ABERTO de pelo menos PECA_MINIMA_M: LPN "ROLO ABERTO" no ERP ou
//      pedaço "aberto" do parceiro numa lista de até PARCEIRO_DIAS_VALIDADE dias
//      (a mesma régua que apaga a bolinha vermelha).
//
// Preço de saída = view `preco_saida_site` do ERP (mínimo de negociação, margem
// 11%, ,90 para cima — ver NZERP supabase/migrations/20261003_preco_saida_site.sql).
// Vale para a venda POR METRO da cor enquanto ela estiver na promoção; o rolo
// fechado segue a tabela. A view só expõe preço: o custo não sai do ERP.

import { createClient } from '@supabase/supabase-js';
import type { Db } from './papel.js';

const PASTA_MOTOS = '/assets/images/shop/motos/';
/** Igual à de src/pages/Loja/EstoqueDots.tsx. */
const PARCEIRO_DIAS_VALIDADE = 30;
/** Abaixo disso não cobre nem um tanque: não vale anunciar. */
const PECA_MINIMA_M = 1;
/** A lista muda com venda de ponta (sync diário) ou lista nova do parceiro. */
const VALIDADE_CACHE_MS = 5 * 60 * 1000;

export interface PromoMoto {
  /** SKU → slug e fotos de moto, só de quem está na promoção. */
  porSku: Map<string, { slug: string; fotos: string[] }>;
  /** SKU → preço de saída do metro (só quando é menor que a tabela). */
  precoSaida: Map<string, number>;
}

let cache: { em: number; dados: PromoMoto } | null = null;

export async function lerPromoMoto(site: Db): Promise<PromoMoto> {
  if (cache && Date.now() - cache.em < VALIDADE_CACHE_MS) return cache.dados;
  const dados = await montar(site);
  cache = { em: Date.now(), dados };
  return dados;
}

/** Preço do metro de um SKU na promoção, ou `null` se ele não está nela. */
export function precoMetroPromo(promo: PromoMoto, sku: string | null | undefined, metroTabela: number | null): number | null {
  if (!sku || !promo.porSku.has(sku)) return null;
  const saida = promo.precoSaida.get(sku);
  if (saida == null || !(saida > 0)) return null;
  if (metroTabela != null && !(saida < metroTabela)) return null;
  return saida;
}

async function montar(site: Db): Promise<PromoMoto> {
  const vazio: PromoMoto = { porSku: new Map(), precoSaida: new Map() };

  // 1. Quem tem foto de moto (3 por cor hoje, ~280 linhas).
  const { data: midiaData, error } = await site
    .from('produto_midia')
    .select('produto_id, url, ordem')
    .like('url', `${PASTA_MOTOS}%`)
    .order('ordem')
    .range(0, 1999);
  if (error) throw new Error(`produto_midia: ${error.message}`);
  const fotosPorProduto = new Map<string, string[]>();
  for (const m of (midiaData ?? []) as { produto_id: string; url: string }[]) {
    const lista = fotosPorProduto.get(m.produto_id) ?? [];
    lista.push(m.url);
    fotosPorProduto.set(m.produto_id, lista);
  }
  if (!fotosPorProduto.size) return vazio;

  const { data: prodData } = await site.from('produtos').select('id, slug, erp_sku').in('id', [...fotosPorProduto.keys()]);
  const produtos = ((prodData ?? []) as { id: string; slug: string; erp_sku: string | null }[]).filter((p) => p.erp_sku);
  const skus = [...new Set(produtos.map((p) => p.erp_sku as string))];
  if (!skus.length) return vazio;

  // 2a. Pedaços abertos do parceiro, só lista recente.
  const comPedaco = new Set<string>();
  const limite = new Date(Date.now() - PARCEIRO_DIAS_VALIDADE * 86_400_000).toISOString().slice(0, 10);
  const { data: parcData } = await site
    .from('estoque_parceiro')
    .select('erp_sku, metros')
    .in('erp_sku', skus)
    .eq('status_rolo', 'aberto')
    .gte('lista_de', limite);
  for (const p of (parcData ?? []) as { erp_sku: string; metros: number | string }[]) {
    if (Number(p.metros) >= PECA_MINIMA_M) comPedaco.add(p.erp_sku);
  }

  // 2b. Pontas do nosso pátio e 3. preço de saída — os dois no ERP. Se o ERP
  // falhar, a promoção segue só com o parceiro e SEM preço de saída (o card e o
  // checkout ficam na tabela, que é o lado seguro).
  const precoSaida = new Map<string, number>();
  const erpUrl = process.env.ERP_SUPABASE_URL;
  const erpKey = process.env.ERP_SUPABASE_SERVICE_ROLE_KEY || process.env.ERP_SUPABASE_ANON_KEY;
  if (erpUrl && erpKey) {
    try {
      const erp = createClient(erpUrl, erpKey);
      const [lpns, precos] = await Promise.all([
        erp.from('estoque_lpn_site').select('sku, quant_ml').in('sku', skus).eq('status_rolo', 'ROLO ABERTO').range(0, 1999),
        erp.from('preco_saida_site').select('sku, preco_metro_saida').in('sku', skus),
      ]);
      for (const l of (lpns.data ?? []) as { sku: string; quant_ml: number | string }[]) {
        if (Number(l.quant_ml) >= PECA_MINIMA_M) comPedaco.add(l.sku);
      }
      for (const p of (precos.data ?? []) as { sku: string; preco_metro_saida: number | string }[]) {
        const v = Number(p.preco_metro_saida);
        if (v > 0) precoSaida.set(p.sku, v);
      }
    } catch {
      // segue sem as pontas do pátio e sem preço de saída
    }
  }

  const porSku = new Map<string, { slug: string; fotos: string[] }>();
  for (const p of produtos) {
    const sku = p.erp_sku as string;
    if (comPedaco.has(sku)) porSku.set(sku, { slug: p.slug, fotos: fotosPorProduto.get(p.id) ?? [] });
  }
  return { porSku, precoSaida };
}
