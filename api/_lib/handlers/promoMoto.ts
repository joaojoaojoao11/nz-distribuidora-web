// GET /api/nz/promo-moto — a Promoção Moto da loja (/loja?promo=moto). PÚBLICO.
//
// Pedido do João (2026-10-03): um botão na loja que mostra só as cores com
// bobina aberta — no nosso pátio OU no estoque do parceiro Inova (Jardel) — com
// as fotos de moto no lugar do rolo e o metro "do máximo para o mínimo".
//
// Quem entra e por quanto sai o metro: api/_lib/promoMotoDados.ts (a mesma
// regra do /api/nz/precos e do checkout). Daqui sai só slug → fotos de moto:
// nada de metros, LPN, origem ou nome do parceiro, e nenhum preço — o preço
// continua no /api/nz/precos, por papel.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { lerPromoMoto } from '../promoMotoDados.js';

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
    const promo = await lerPromoMoto(createClient(siteUrl, siteKey));
    const itens: Record<string, { fotos: string[] }> = {};
    for (const { slug, fotos } of promo.porSku.values()) itens[slug] = { fotos };
    // Muda quando uma ponta é vendida (sync diário do ERP) ou chega lista nova
    // do parceiro: 5 minutos de CDN bastam e poupam o ERP de uma consulta por visita.
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    res.status(200).json({ itens, atualizadoEm: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ error: 'promo-moto', detalhe: e instanceof Error ? e.message : String(e) });
  }
}
