import type { VercelRequest, VercelResponse } from '@vercel/node';

interface RenderPhotoBody {
  frameDataUrl: string;        // dataURL PNG do frame 3D atual
  referenceImageUrl?: string;  // path relativo da imagem de referência da cor (da página NZWRAP)
  colorName: string;
  finish: string;
  origin?: string;             // request origin (for fetching reference)
}

const MODEL = 'gemini-2.5-flash-image';

async function fetchAsBase64(url: string, origin: string): Promise<{ mime: string; data: string } | null> {
  try {
    const full = url.startsWith('http') ? url : `${origin}${url}`;
    const r = await fetch(full);
    if (!r.ok) return null;
    const ct = r.headers.get('content-type') || 'image/png';
    const buf = Buffer.from(await r.arrayBuffer());
    return { mime: ct, data: buf.toString('base64') };
  } catch {
    return null;
  }
}

function parseDataUrl(dataUrl: string): { mime: string; data: string } | null {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return null;
  return { mime: m[1], data: m[2] };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
  }

  const body = req.body as RenderPhotoBody;
  if (!body?.frameDataUrl || !body?.colorName || !body?.finish) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const frame = parseDataUrl(body.frameDataUrl);
  if (!frame) {
    return res.status(400).json({ error: 'Invalid frameDataUrl' });
  }

  const origin = body.origin || `https://${req.headers.host}`;
  const reference = body.referenceImageUrl ? await fetchAsBase64(body.referenceImageUrl, origin) : null;

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
    { inlineData: { mimeType: frame.mime, data: frame.data } },
  ];
  if (reference) {
    parts.push({ inlineData: { mimeType: reference.mime, data: reference.data } });
  }

  const prompt = reference
    ? `You receive two images. The FIRST is a 3D render of a car with the exact pose, angle and wrap color we want. The SECOND is a real photograph showing the true paint texture, micro-flakes and reflections of wrap color "${body.colorName}" (${body.finish}). Generate a SINGLE new cinematic 8k automotive photograph that keeps EVERY geometric detail, car pose, angle, environment and color from the FIRST image, but enhances it to the photorealistic material quality of the SECOND image. Preserve the exact wrap color of the first image. Do not change the car model or the background scene.`
    : `You receive a 3D render of a car. Transform it into a cinematic 8k photorealistic automotive photograph while keeping every geometric detail, car pose, angle, environment and color exactly the same. The wrap color is "${body.colorName}" (${body.finish}). Enhance only the paint realism, reflections and lighting quality.`;

  parts.push({ text: prompt });

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }] }),
      }
    );

    if (!r.ok) {
      const txt = await r.text();
      return res.status(502).json({ error: `Gemini ${r.status}: ${txt.slice(0, 300)}` });
    }

    const json = await r.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data: string; mimeType: string } }> } }>;
    };
    const outPart = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
    if (!outPart?.inlineData) {
      return res.status(502).json({ error: 'No image in Gemini response' });
    }

    const mime = outPart.inlineData.mimeType || 'image/png';
    const dataUrl = `data:${mime};base64,${outPart.inlineData.data}`;
    return res.status(200).json({ dataUrl });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: msg });
  }
}
