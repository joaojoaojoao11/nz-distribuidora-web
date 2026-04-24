import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { generateBlogCoverImage } from './_lib/aiImage.js';

// POST /api/generate-blog-image
// Body: { prompt: string }
// Resposta: { publicUrl, path } ou { error }
//
// Útil pra:
// 1) Testes manuais de qualidade de imagem sem esperar o cron.
// 2) Botão "gerar imagem via IA" no editor manual do admin (futuro).
// 3) Debug em produção quando o cron falhar.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = (req.body || {}) as { prompt?: string };
  if (!prompt || prompt.trim().length < 5) {
    return res.status(400).json({ error: 'prompt obrigatório (min 5 chars)' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!supabaseUrl || !supabaseKey || !geminiKey) {
    return res.status(500).json({ error: 'ENV ausente (SUPABASE/GEMINI)' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const result = await generateBlogCoverImage(prompt, geminiKey, supabase);
    if (!result) {
      return res.status(502).json({ error: 'Falha na geração da imagem. Veja logs da função.' });
    }
    return res.status(200).json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[generate-blog-image]', err);
    return res.status(500).json({ error: msg });
  }
}
