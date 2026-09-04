// POST /api/erp/webhook — acelerador do sync, disparado pelo NZERP.
//
// O NZERP configura um Database Webhook em master_catalog/inventory apontando
// para cá. Isso encurta a latência de "estoque mudou" para segundos, em vez de
// esperar o cron de 5 minutos.
//
// ⚠️ NÃO é fonte de verdade. O pg_net, que move os Database Webhooks do
// Supabase, guarda fila e respostas em tabelas UNLOGGED (perdidas em crash),
// tem timeout de 2s e NÃO tem retry documentado — é entrega no melhor esforço.
// Se este endpoint estiver fora do ar por 30 segundos, aquele evento some.
// Por isso o cron continua rodando: ele é a rede de segurança que recupera o
// que o webhook perder.
//
// Autenticação por shared secret com comparação em tempo constante, no mesmo
// padrão de api/agenda/social-posts-feed.ts.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { timingSafeEqual } from 'node:crypto';

function tokensEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  const expected = process.env.ERP_WEBHOOK_SECRET;
  if (!expected) {
    res.status(500).json({ error: 'ENV ausente', hasWebhookSecret: false });
    return;
  }

  const header = req.headers['x-erp-secret'];
  const received = typeof header === 'string' ? header : '';
  if (!received || !tokensEqual(received, expected)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    res.status(500).json({ error: 'ENV ausente', hasCronSecret: false });
    return;
  }

  // Encaminha para o sync. Um sync completo de ~500 SKUs é barato o bastante
  // para não valer a complexidade de sincronizar um SKU só — e evita o risco de
  // um webhook parcial deixar o espelho inconsistente.
  const origin = `https://${req.headers.host}`;
  try {
    const resposta = await fetch(`${origin}/api/erp/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cronSecret}`,
      },
      body: JSON.stringify({ gatilho: 'webhook' }),
    });
    const json = await resposta.json();
    res.status(resposta.status).json(json);
  } catch (err) {
    console.error('[erp-webhook] falhou ao acionar o sync:', err);
    // 200 de propósito: o pg_net não faz retry, e devolver erro só polui o log
    // do ERP. O cron cobre o evento perdido.
    res.status(200).json({ ok: false, motivo: 'sync não acionado; o cron cobre' });
  }
}
