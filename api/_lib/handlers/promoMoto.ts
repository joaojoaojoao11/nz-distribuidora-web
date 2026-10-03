// GET /api/nz/promo-moto — a Promoção Moto da loja (/loja?promo=moto). PÚBLICO.
//
// Pedido do João (2026-10-03): um botão na loja que mostra só as cores com
// bobina aberta — no nosso pátio OU no estoque do parceiro Inova (Jardel) — com
// as fotos de moto no lugar do rolo e as medidas fracionadas com o valor de
// venda fechado. É o que faz os fracionados saírem: moto pede 2 a 4 metros.
//
// Entra na promoção a cor que tem, ao mesmo tempo:
//   1. as fotos de moto prontas (produto_midia em /assets/images/shop/motos/);
//   2. pedaço ABERTO: LPN "ROLO ABERTO" no ERP ou pedaço "aberto" do parceiro
//      numa lista de até PARCEIRO_DIAS_VALIDADE dias (a mesma régua que apaga a
//      bolinha vermelha). Rolo fechado do parceiro não é pedaço e não entra.
//
// O que sai daqui é só slug → metros dos pedaços + fotos. Nada de LPN, endereço,
// origem do pedaço ou nome do parceiro: o estoque do parceiro continua fechado
// (a tabela não tem policy) e a resposta é a mesma para todo mundo. O preço NÃO
// vem aqui — continua no /api/nz/precos, por papel; o card multiplica.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const PASTA_MOTOS = '/assets/images/shop/motos/';
/** Igual à de src/pages/Loja/EstoqueDots.tsx. */
const PARCEIRO_DIAS_VALIDADE = 30;
/** Abaixo disso não cobre nem um tanque: não vale anunciar. */
const PECA_MINIMA_M = 1;

interface Midia {
  produto_id: string;
  url: string;
  ordem: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  const siteUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const siteKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!siteUrl || !siteKey) {
    res.status(500).json({ error: 'ENV ausente' });
    return;
  }
  const site = createClient(siteUrl, siteKey);

  // 1. Quem tem foto de moto (3 por cor hoje, ~280 linhas).
  const { data: midiaData, error: midiaErr } = await site
    .from('produto_midia')
    .select('produto_id, url, ordem')
    .like('url', `${PASTA_MOTOS}%`)
    .order('ordem')
    .range(0, 1999);
  if (midiaErr) {
    res.status(500).json({ error: 'produto_midia', detalhe: midiaErr.message });
    return;
  }
  const fotosPorProduto = new Map<string, string[]>();
  for (const m of (midiaData ?? []) as Midia[]) {
    const lista = fotosPorProduto.get(m.produto_id) ?? [];
    lista.push(m.url);
    fotosPorProduto.set(m.produto_id, lista);
  }
  const ids = [...fotosPorProduto.keys()];
  if (!ids.length) {
    responder(res, {});
    return;
  }

  const { data: prodData } = await site.from('produtos').select('id, slug, erp_sku').in('id', ids);
  const produtos = ((prodData ?? []) as { id: string; slug: string; erp_sku: string | null }[]).filter((p) => p.erp_sku);
  const skus = [...new Set(produtos.map((p) => p.erp_sku as string))];

  // 2a. Pedaços do parceiro (só "aberto", só lista recente).
  const limite = new Date(Date.now() - PARCEIRO_DIAS_VALIDADE * 86_400_000).toISOString().slice(0, 10);
  const { data: parcData } = await site
    .from('estoque_parceiro')
    .select('erp_sku, metros')
    .in('erp_sku', skus)
    .eq('status_rolo', 'aberto')
    .gte('lista_de', limite);
  const pecas = new Map<string, number[]>();
  const somar = (sku: string, m: number) => {
    if (!(m >= PECA_MINIMA_M)) return;
    const l = pecas.get(sku) ?? [];
    l.push(Math.round(m * 10) / 10);
    pecas.set(sku, l);
  };
  for (const p of (parcData ?? []) as { erp_sku: string; metros: number | string }[]) somar(p.erp_sku, Number(p.metros));

  // 2b. Pontas do nosso pátio, ao vivo no ERP. Se o ERP falhar, a promoção
  // segue com o que o parceiro tem — não derruba a página.
  const erpUrl = process.env.ERP_SUPABASE_URL;
  const erpKey = process.env.ERP_SUPABASE_SERVICE_ROLE_KEY || process.env.ERP_SUPABASE_ANON_KEY;
  if (erpUrl && erpKey) {
    try {
      const erp = createClient(erpUrl, erpKey);
      const { data: lpnData } = await erp
        .from('estoque_lpn_site')
        .select('sku, quant_ml, status_rolo')
        .in('sku', skus)
        .eq('status_rolo', 'ROLO ABERTO')
        .range(0, 1999);
      for (const l of (lpnData ?? []) as { sku: string; quant_ml: number | string }[]) somar(l.sku, Number(l.quant_ml));
    } catch {
      // segue sem as pontas do pátio
    }
  }

  const itens: Record<string, { pecas: number[]; fotos: string[] }> = {};
  for (const p of produtos) {
    const lista = pecas.get(p.erp_sku as string);
    if (!lista?.length) continue;
    itens[p.slug] = { pecas: [...lista].sort((a, b) => b - a), fotos: fotosPorProduto.get(p.id) ?? [] };
  }
  responder(res, itens);
}

function responder(res: VercelResponse, itens: Record<string, { pecas: number[]; fotos: string[] }>) {
  // Muda quando uma ponta é vendida (sync diário do ERP) ou chega lista nova do
  // parceiro: 5 minutos de CDN bastam e poupam o ERP de uma consulta por visita.
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  res.status(200).json({ itens, atualizadoEm: new Date().toISOString() });
}
