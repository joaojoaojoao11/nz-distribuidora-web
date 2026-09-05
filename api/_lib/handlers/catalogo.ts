// GET /api/nz/catalogo — o catálogo público da LOJA, em um JSON só.
//
// É o que substitui o snapshot estático no bundle: a loja carrega este arquivo
// uma vez e o motor de busca/filtro roda em cima dele, igual a antes. A fonte
// é a view `loja_catalogo` (produtos ⨝ erp_produtos), que por construção não
// tem preço nem saldo numérico — só o nível qualitativo de estoque. Se um dia
// alguém puser preço na view, este endpoint o publicaria para o mundo; a
// trava é lá, e o teste de F3 confere que a resposta não tem campo "preco".
//
// Cache na CDN da Vercel: 5 min fresco, 1 h servindo o antigo enquanto
// revalida. O sync do ERP roda a cada 5 min, então o site fica no máximo ~10
// min atrás do ERP sem nenhum visitante esperar a consulta.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const PAGE = 1000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  const siteUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const siteKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!siteUrl || !siteKey) {
    res.status(500).json({ error: 'ENV ausente', hasSiteUrl: !!siteUrl, hasSiteKey: !!siteKey });
    return;
  }

  const site = createClient(siteUrl, siteKey);
  const itens: unknown[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await site
      .from('loja_catalogo')
      .select('*')
      .order('ordem', { ascending: true })
      .order('slug', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) {
      res.status(502).json({ error: 'catalogo-indisponivel', message: error.message });
      return;
    }
    itens.push(...(data ?? []));
    if ((data ?? []).length < PAGE) break;
  }

  const nocache = req.query.nocache === '1';
  res.setHeader(
    'Cache-Control',
    nocache ? 'no-store' : 'public, s-maxage=300, stale-while-revalidate=3600, max-age=60'
  );
  res.status(200).json({ geradoEm: new Date().toISOString(), total: itens.length, itens });
}
