// POST /api/nz/estoque — disponibilidade de um ou mais produtos, por papel.
//
// ESTE ENDPOINT EXISTE POR UMA RESTRIÇÃO DURA: o catálogo público da LOJA é
// um JSON que qualquer visitante baixa e lê. Nada restrito pode entrar nele.
// Dado por papel só pode vir de um request autenticado, com o papel lido NO
// SERVIDOR — nunca do que o cliente diz que é.
//
// Os três níveis, definidos com o cliente:
//   anônimo / client   → só disponibilidade qualitativa. Nenhum número.
//   reseller aprovado  → saldo em metros e rolos, com quebra fechado × aberto.
//   admin              → tudo acima + os rótulos do ERP (ESTOQUE/DROP) + LPNs,
//                        localização física — lidos AO VIVO no ERP.
//
// NENHUM papel vê preço aqui — preço é /api/nz/precos, com a mesma régua.
//
// Aceita `slug` (um produto) ou `slugs[]` (até 60, a página da vitrine). Um
// alias resolve para o SKU físico do produto original.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { resolverPapel, type Papel } from '../papel.js';

type Nivel = 'pronta-entrega' | 'ultimas-unidades' | 'sob-encomenda';

interface Produto {
  slug: string;
  erp_sku: string | null;
  tipo_vinculo: string;
}

interface Espelho {
  sku: string;
  nome: string | null;
  ativo: boolean;
  saldo_ml: number;
  rolos_fechados: number;
  rolos_abertos: number;
  largura_m: number | null;
  metragem_padrao: number | null;
  estoque_minimo: number | null;
  sincronizado_em: string;
  estoque_atualizado_em: string | null;
}

const MAX_SLUGS = 60;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  const siteUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const siteKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!siteUrl || !siteKey) {
    res.status(500).json({ error: 'ENV ausente', hasSiteUrl: !!siteUrl, hasSiteKey: !!siteKey });
    return;
  }

  const body = (typeof req.body === 'string' ? safeJson(req.body) : req.body) || {};
  const unico = typeof body.slug === 'string' ? body.slug.trim() : '';
  const lista = Array.isArray(body.slugs)
    ? (body.slugs as unknown[]).filter((s): s is string => typeof s === 'string').map((s) => s.trim()).filter(Boolean)
    : [];
  const slugs = [...new Set(unico ? [unico, ...lista] : lista)].slice(0, MAX_SLUGS);
  if (!slugs.length) {
    res.status(400).json({ error: 'Informe slug ou slugs[].' });
    return;
  }

  const site = createClient(siteUrl, siteKey);
  const papel = await resolverPapel(site, req.headers.authorization);

  const { data: produtosData } = await site
    .from('produtos')
    .select('slug, erp_sku, tipo_vinculo')
    .in('slug', slugs);
  const produtos = (produtosData ?? []) as Produto[];

  const skus = [...new Set(produtos.map((p) => p.erp_sku).filter((s): s is string => !!s))];
  const { data: espelhoData } = skus.length
    ? await site
        .from('erp_produtos')
        .select('sku, nome, ativo, saldo_ml, rolos_fechados, rolos_abertos, largura_m, metragem_padrao, estoque_minimo, sincronizado_em, estoque_atualizado_em')
        .in('sku', skus)
    : { data: [] };
  const espelhoPorSku = new Map(((espelhoData ?? []) as unknown as Espelho[]).map((e) => [e.sku, e]));

  const { data: cfg } = await site
    .from('loja_config')
    .select('limite_ultimas_unidades_ml')
    .eq('id', 1)
    .maybeSingle();
  const limiteGlobal = Number(
    (cfg as { limite_ultimas_unidades_ml?: number } | null)?.limite_ultimas_unidades_ml ?? 30
  );

  const itens: Record<string, unknown> = {};
  for (const slug of slugs) {
    const p = produtos.find((x) => x.slug === slug);
    const e = p?.erp_sku ? espelhoPorSku.get(p.erp_sku) : undefined;
    itens[slug] = await montar(p, e, papel, limiteGlobal);
  }

  // Compatibilidade com o chamador de um produto só: mesmo objeto no topo.
  if (unico && slugs.length === 1) {
    res.status(200).json({ papel, ...(itens[unico] as Record<string, unknown>) });
    return;
  }
  res.status(200).json({ papel, itens });
}

async function montar(p: Produto | undefined, e: Espelho | undefined, papel: Papel, limiteGlobal: number) {
  if (!p || !p.erp_sku) return { mapeado: false };
  if (!e) return { mapeado: true, semDados: true };

  const nivel = classificar(e, limiteGlobal);

  // --- nível 1: todo mundo. Só o badge qualitativo.
  const r: Record<string, unknown> = {
    mapeado: true,
    disponibilidade: nivel,
    atualizadoEm: e.sincronizado_em,
  };

  // --- nível 2: lojista aprovado e admin.
  if (papel === 'reseller' || papel === 'admin') {
    r.saldo = {
      metrosLineares: Number(e.saldo_ml),
      rolosFechados: e.rolos_fechados,
      rolosAbertos: e.rolos_abertos,
      larguraM: e.largura_m,
      metragemPadrao: e.metragem_padrao,
    };
  }

  // --- nível 3: admin. Rótulo do ERP e detalhe por rolo, lido AO VIVO.
  if (papel === 'admin') {
    r.erpSku = p.erp_sku;
    r.rotuloErp = Number(e.saldo_ml) > 0.01 ? 'ESTOQUE' : 'DROP';
    r.estoqueMinimo = e.estoque_minimo;
    r.lpns = await lerLpns(p.erp_sku);
  }
  return r;
}

function safeJson(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/** Mesma régua da view loja_catalogo — mudou lá, muda aqui. */
function classificar(e: Espelho, limiteGlobal: number): Nivel {
  if (!e.ativo || e.saldo_ml <= 0) return 'sob-encomenda';
  const limite = e.estoque_minimo && e.estoque_minimo > 0 ? Number(e.estoque_minimo) : limiteGlobal;
  return e.saldo_ml <= limite ? 'ultimas-unidades' : 'pronta-entrega';
}

/** Detalhe por LPN direto do ERP (pátio SP). Só chamado para admin. */
async function lerLpns(erpSku: string) {
  const erpUrl = process.env.ERP_SUPABASE_URL;
  const erpKey = process.env.ERP_SUPABASE_SERVICE_ROLE_KEY || process.env.ERP_SUPABASE_ANON_KEY;
  if (!erpUrl || !erpKey) return { erro: 'ERP não configurado' };

  try {
    const erp = createClient(erpUrl, erpKey);
    const { data, error } = await erp
      .from('estoque_lpn_site')
      .select('lpn, quant_ml, status_rolo, lote, coluna, prateleira, caixa, empresa_id, ultima_atualizacao')
      .eq('sku', erpSku)
      .order('quant_ml', { ascending: false })
      .limit(200);

    if (error) return { erro: error.message };
    return data ?? [];
  } catch (err) {
    return { erro: err instanceof Error ? err.message : String(err) };
  }
}
