// POST /api/nz/precos — preço de venda de produtos, por papel.
//
// Decisão do cliente (2026-09-05): preço só para quem está LOGADO E APROVADO.
//   anônimo                 → 401 (a UI mostra "entre para ver o preço")
//   logado, não aprovado    → 403 (a UI mostra "cadastro em análise")
//   cliente final / lojista → preço ideal: rolo fechado + metro linear
//   admin                   → + os mínimos (pisos de negociação) e promoção
//
// Os preços vivem em erp_produtos (espelho do pricing_engineering do ERP,
// sem custo nem margem). Unidades: `rolo` é R$ por rolo fechado de
// `metragemPadrao` metros; `metro` é R$ por metro linear fracionado.
//
// `Cache-Control: no-store`: a resposta depende do token — nunca pode ficar
// numa CDN. O papel é lido no servidor (_lib/papel.ts), nunca do cliente.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { resolverPapelDetalhado } from '../papel.js';

interface Produto {
  slug: string;
  erp_sku: string | null;
  tipo_vinculo: string;
}

interface Espelho {
  sku: string;
  ativo: boolean;
  unidade: string | null;
  largura_m: number | null;
  metragem_padrao: number | null;
  preco_rolo: number | null;
  preco_metro: number | null;
  preco_rolo_min: number | null;
  preco_metro_min: number | null;
  promocao: boolean;
  preco_atualizado_em: string | null;
  sincronizado_em: string;
}

const MAX_SLUGS = 80;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

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
  const lista = Array.isArray(body.slugs)
    ? (body.slugs as unknown[]).filter((s): s is string => typeof s === 'string').map((s) => s.trim().toLowerCase()).filter(Boolean)
    : [];
  const slugs = [...new Set(lista)].slice(0, MAX_SLUGS);
  if (!slugs.length) {
    res.status(400).json({ error: 'Informe slugs[].' });
    return;
  }

  const site = createClient(siteUrl, siteKey);
  const { papel, aprovado } = await resolverPapelDetalhado(site, req.headers.authorization);

  if (papel === 'anonimo') {
    res.status(401).json({ error: 'login-necessario', papel });
    return;
  }
  if (!aprovado) {
    res.status(403).json({ error: 'aguardando-aprovacao', papel });
    return;
  }

  const { data: produtosData } = await site
    .from('produtos')
    .select('slug, erp_sku, tipo_vinculo')
    .in('slug', slugs);
  const produtos = (produtosData ?? []) as Produto[];

  const skus = [...new Set(produtos.map((p) => p.erp_sku).filter((s): s is string => !!s))];
  const { data: espelhoData } = skus.length
    ? await site
        .from('erp_produtos')
        .select('sku, ativo, unidade, largura_m, metragem_padrao, preco_rolo, preco_metro, preco_rolo_min, preco_metro_min, promocao, preco_atualizado_em, sincronizado_em')
        .in('sku', skus)
    : { data: [] };
  const porSku = new Map(((espelhoData ?? []) as unknown as Espelho[]).map((e) => [e.sku, e]));

  const itens: Record<string, unknown> = {};
  for (const slug of slugs) {
    const p = produtos.find((x) => x.slug === slug);
    const e = p?.erp_sku ? porSku.get(p.erp_sku) : undefined;
    if (!p || !e || !e.ativo) {
      itens[slug] = { disponivel: false };
      continue;
    }
    const item: Record<string, unknown> = {
      disponivel: e.preco_rolo != null || e.preco_metro != null,
      rolo: e.preco_rolo,
      metro: e.preco_metro,
      metragemPadrao: e.metragem_padrao,
      larguraM: e.largura_m,
      unidade: e.unidade ?? 'ML',
      promocao: Boolean(e.promocao),
      atualizadoEm: e.preco_atualizado_em ?? e.sincronizado_em,
    };
    // Só admin. Construído campo a campo: o que não entra aqui não sai.
    if (papel === 'admin') {
      item.roloMin = e.preco_rolo_min;
      item.metroMin = e.preco_metro_min;
      item.erpSku = p.erp_sku;
    }
    itens[slug] = item;
  }

  res.status(200).json({ papel, itens });
}

function safeJson(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
