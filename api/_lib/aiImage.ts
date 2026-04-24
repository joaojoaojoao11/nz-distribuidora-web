import type { SupabaseClient } from '@supabase/supabase-js';

// Gera uma imagem de capa para o blog usando Gemini 2.5 Flash Image e faz upload
// direto no bucket `blog_media` (o mesmo usado pelo editor manual do admin).
// Devolve a URL pública ou null se falhar (cron usa fallback nesse caso).

const IMAGE_MODEL = 'gemini-2.5-flash-image';
const BUCKET = 'blog_media';

export interface GeneratedImage {
  publicUrl: string;
  path: string;
}

/**
 * Reforça o prompt do Gemini (gerado pelo modelo de texto) com instruções
 * visuais consistentes com a identidade NZ, para evitar imagens esquisitas.
 */
export function dressBlogImagePrompt(rawPrompt: string): string {
  const base = rawPrompt?.trim() || 'Automotive paint protection film installation, premium workshop';
  return [
    base,
    // Estilo visual padrão NZ:
    'Cinematic 8k automotive editorial photograph.',
    'Moody lighting, shallow depth of field, premium detailing studio vibe.',
    'No text, no logos, no watermarks, no frames, no borders.',
    'Horizontal composition, centered subject, clean background.',
    'Photorealistic, no illustration, no 3d render look.',
  ].join(' ');
}

/**
 * Chama o Gemini 2.5 Flash Image pedindo SOMENTE imagem. Retorna base64 + mime.
 */
async function callGeminiImage(prompt: string, apiKey: string): Promise<{ mime: string; base64: string } | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
    }),
  });

  if (!response.ok) {
    const txt = await response.text().catch(() => '');
    console.error(`[aiImage] Gemini ${response.status}:`, txt.slice(0, 400));
    return null;
  }

  const json = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ inlineData?: { data: string; mimeType: string } }>;
      };
    }>;
  };

  const part = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!part?.inlineData) {
    console.error('[aiImage] resposta sem imagem:', JSON.stringify(json).slice(0, 400));
    return null;
  }

  return {
    mime: part.inlineData.mimeType || 'image/png',
    base64: part.inlineData.data,
  };
}

/**
 * Converte base64 pra Buffer e sobe no bucket blog_media do Supabase.
 */
async function uploadToSupabase(
  supabase: SupabaseClient,
  mime: string,
  base64: string,
): Promise<GeneratedImage | null> {
  const ext = mime.includes('jpeg') ? 'jpg' : mime.includes('webp') ? 'webp' : 'png';
  const fileName = `ai_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const filePath = `covers/${fileName}`;
  const buffer = Buffer.from(base64, 'base64');

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, buffer, {
      contentType: mime,
      upsert: false,
    });

  if (uploadError) {
    console.error('[aiImage] erro ao subir no Storage:', uploadError);
    return null;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  if (!data?.publicUrl) {
    console.error('[aiImage] getPublicUrl vazio');
    return null;
  }

  return { publicUrl: data.publicUrl, path: filePath };
}

/**
 * Fluxo completo: prompt → imagem Gemini → upload Supabase → URL pública.
 * Retorna null se qualquer passo falhar (o caller decide se usa fallback).
 */
export async function generateBlogCoverImage(
  rawPrompt: string,
  apiKey: string,
  supabase: SupabaseClient,
): Promise<GeneratedImage | null> {
  const dressed = dressBlogImagePrompt(rawPrompt);
  const image = await callGeminiImage(dressed, apiKey);
  if (!image) return null;
  return uploadToSupabase(supabase, image.mime, image.base64);
}
