import { useRef, useState, useCallback } from 'react';

interface UseAIEnhanceOptions {
  colorName: string;
  finish: string;
  referenceImageUrl?: string;
  getFrameDataUrl: () => string | null;
}

export type AIStatus = 'idle' | 'rendering' | 'ready' | 'error';

const GEMINI_MODEL = 'gemini-2.5-flash-image';

function parseDataUrl(dataUrl: string) {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return null;
  return { mime: m[1], data: m[2] };
}

async function fetchAsBase64(url: string): Promise<{ mime: string; data: string } | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const mime = r.headers.get('content-type') || 'image/png';
    const buf = await r.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(buf).reduce((acc, b) => acc + String.fromCharCode(b), '')
    );
    return { mime, data: base64 };
  } catch {
    return null;
  }
}

async function callImageEnhance(params: {
  frameDataUrl: string;
  referenceImageUrl?: string;
  colorName: string;
  finish: string;
  signal: AbortSignal;
}): Promise<string> {
  const devKey = import.meta.env.VITE_GEMINI_API_KEY_DEV as string | undefined;
  const isDev = import.meta.env.DEV;

  if (isDev && devKey) {
    const frame = parseDataUrl(params.frameDataUrl);
    if (!frame) throw new Error('Frame inválido');

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
      { inlineData: { mimeType: frame.mime, data: frame.data } },
    ];

    if (params.referenceImageUrl) {
      const ref = await fetchAsBase64(params.referenceImageUrl);
      if (ref) parts.push({ inlineData: { mimeType: ref.mime, data: ref.data } });
    }

    const prompt = params.referenceImageUrl
      ? `You receive two images. The FIRST is a 3D render of a car with the exact pose, angle and wrap color we want. The SECOND is a real photograph showing the true paint texture, micro-flakes and reflections of wrap color "${params.colorName}" (${params.finish}). Generate a SINGLE new cinematic 8k automotive photograph that keeps EVERY geometric detail, car pose, angle, environment and color from the FIRST image, but enhances it to the photorealistic material quality of the SECOND image. Preserve the exact wrap color of the first image. Do not change the car model or the background scene.`
      : `You receive a 3D render of a car. Transform it into a cinematic 8k photorealistic automotive photograph while keeping every geometric detail, car pose, angle, environment and color exactly the same. The wrap color is "${params.colorName}" (${params.finish}). Enhance only the paint realism, reflections and lighting quality.`;

    parts.push({ text: prompt });

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${devKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }] }),
        signal: params.signal,
      }
    );
    if (!r.ok) {
      const txt = await r.text();
      throw new Error(`Gemini ${r.status}: ${txt.slice(0, 180)}`);
    }
    const json = await r.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data: string; mimeType: string } }> } }>;
    };
    const outPart = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
    if (!outPart?.inlineData) throw new Error('Sem imagem na resposta Gemini');
    return `data:${outPart.inlineData.mimeType || 'image/png'};base64,${outPart.inlineData.data}`;
  }

  const r = await fetch('/api/render-photo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      frameDataUrl: params.frameDataUrl,
      referenceImageUrl: params.referenceImageUrl,
      colorName: params.colorName,
      finish: params.finish,
      origin: window.location.origin,
    }),
    signal: params.signal,
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({ error: `HTTP ${r.status}` }));
    throw new Error(err.error || `HTTP ${r.status}`);
  }
  const json = await r.json() as { dataUrl: string };
  return json.dataUrl;
}

/**
 * Disparo on-demand — usuário clica no botão "FOTO REALISTA".
 * Não mais auto/timer. UI fica fluida enquanto o request roda em background.
 */
export function useAIEnhance({
  colorName,
  finish,
  referenceImageUrl,
  getFrameDataUrl,
}: UseAIEnhanceOptions) {
  const [aiImage, setAiImage] = useState<string | null>(null);
  const [status, setStatus] = useState<AIStatus>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
    setAiImage(null);
    setStatus('idle');
    setErrorMsg(null);
  }, []);

  const trigger = useCallback(async () => {
    const frameDataUrl = getFrameDataUrl();
    if (!frameDataUrl) return;
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setStatus('rendering');
    setErrorMsg(null);
    setAiImage(null);
    try {
      const dataUrl = await callImageEnhance({
        frameDataUrl,
        referenceImageUrl,
        colorName,
        finish,
        signal: abortRef.current.signal,
      });
      setAiImage(dataUrl);
      setStatus('ready');
    } catch (err) {
      if ((err as Error).name === 'AbortError') { setStatus('idle'); return; }
      setStatus('error');
      setErrorMsg((err as Error).message);
    }
  }, [colorName, finish, referenceImageUrl, getFrameDataUrl]);

  return {
    aiImage,
    status,
    errorMsg,
    trigger,
    reset,
  };
}
