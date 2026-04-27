import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * POST /api/oficina/generate-background
 *
 * Body: { prompt: string, format: 'feed-1x1' | 'story-9x16' }
 * Response (200): { imageBase64: 'data:image/png;base64,...' }
 * Response (400/500/502): { error: string }
 *
 * Gera background custom via Gemini Imagen 4 Ultra.
 * Aspect ratio é mapeado pelo format do motor (1:1 feed, 9:16 story).
 */

const MODEL = process.env.GEMINI_IMAGE_MODEL || 'imagen-4.0-ultra-generate-001';

const ASPECT_RATIO_MAP: Record<string, string> = {
  'feed-1x1': '1:1',
  'story-9x16': '9:16',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).json({});
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY não configurada.' });
    return;
  }

  const body = (req.body || {}) as { prompt?: unknown; format?: unknown };
  const rawPrompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  const format = typeof body.format === 'string' ? body.format : '';
  const aspectRatio = ASPECT_RATIO_MAP[format];

  if (!rawPrompt) {
    res.status(400).json({ error: 'Prompt vazio.' });
    return;
  }
  if (rawPrompt.length > 1500) {
    res.status(400).json({ error: 'Prompt muito longo (máx. 1500 caracteres).' });
    return;
  }
  if (!aspectRatio) {
    res.status(400).json({ error: `Format inválido: ${format}` });
    return;
  }

  // Reforça brand identity: fundo escuro, sem texto, espaço pra overlay.
  const enrichedPrompt = `${rawPrompt}. Premium automotive aesthetic, dark moody atmosphere, deep blacks and rich shadows, cinematic composition, photorealistic, ultra-detailed 4K. No text, no logos, no people, no humans, no readable signage. Leave negative space in the center for overlay typography.`;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:predict?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt: enrichedPrompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio,
            personGeneration: 'dont_allow',
          },
        }),
      }
    );

    if (!r.ok) {
      const errorBody = await r.text().catch(() => '');
      res.status(502).json({ error: `Gemini ${r.status}: ${errorBody.slice(0, 400)}` });
      return;
    }

    const data = (await r.json()) as { predictions?: Array<{ bytesBase64Encoded?: string }> };
    const bytes = data?.predictions?.[0]?.bytesBase64Encoded;
    if (!bytes) {
      res.status(502).json({ error: 'Imagen não retornou imagem.' });
      return;
    }

    res.status(200).json({ imageBase64: `data:image/png;base64,${bytes}` });
  } catch (err) {
    console.error('[generate-background] Erro:', err);
    const msg = err instanceof Error ? err.message : 'Erro ao gerar imagem.';
    res.status(500).json({ error: msg });
  }
}
