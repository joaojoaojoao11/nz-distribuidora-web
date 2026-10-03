// GET /api/nz/promo-moto — a Promoção Moto da loja (/loja?promo=moto). PÚBLICO.
//
// Pedido do João (2026-10-03): um botão na loja que mostra só as cores com
// bobina aberta — no nosso pátio OU no estoque do parceiro Inova (Jardel) — com
// as fotos de moto no lugar do rolo e o metro "do máximo para o mínimo".
//
// Quem entra e por quanto sai o metro: api/_lib/promoMotoDados.ts (a mesma
// regra do /api/nz/precos e do checkout). Daqui sai slug → fotos de moto e o
// preço do METRO "de/por" — público de propósito: na promoção o João quer o
// preço à vista de todos (03/10). O rolo fechado segue só para quem entrou, e
// comprar continua pedindo cadastro. Nada de metros de pedaço, LPN, origem ou
// nome do parceiro.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { lerPromoMoto, precoMetroPromo } from '../promoMotoDados.js';

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

  try {
    const site = createClient(siteUrl, siteKey);
    const promo = await lerPromoMoto(site);
    const skus = [...promo.porSku.keys()];
    // A tabela é a do espelho (o que o checkout cobra fora da promoção).
    const { data } = skus.length
      ? await site.from('erp_produtos').select('sku, ativo, preco_metro').in('sku', skus)
      : { data: [] };
    const tabela = new Map(
      ((data ?? []) as { sku: string; ativo: boolean; preco_metro: number | null }[])
        .filter((e) => e.ativo && Number(e.preco_metro) > 0)
        .map((e) => [e.sku, Number(e.preco_metro)])
    );
    const itens: Record<string, { fotos: string[]; metro: number | null; metroCheio: number | null }> = {};
    for (const [sku, { slug, fotos }] of promo.porSku) {
      const cheio = tabela.get(sku) ?? null;
      const saida = precoMetroPromo(promo, sku, cheio);
      itens[slug] = { fotos, metro: saida ?? cheio, metroCheio: saida != null ? cheio : null };
    }
    // Muda quando uma ponta é vendida (sync diário do ERP) ou chega lista nova
    // do parceiro: 5 minutos de CDN bastam e poupam o ERP de uma consulta por visita.
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    res.status(200).json({ itens, atualizadoEm: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ error: 'promo-moto', detalhe: e instanceof Error ? e.message : String(e) });
  }
}
