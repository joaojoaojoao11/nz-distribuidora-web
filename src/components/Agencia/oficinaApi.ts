import type { MotorSpec } from './motorTypes';

export interface GenerateResult {
  ok: true;
  motor: MotorSpec;
}

export interface GenerateError {
  ok: false;
  error: string;
}

/**
 * Chama o backend /api/oficina/generate com o prompt do usuário.
 * Retorna a spec gerada ou um erro estruturado (sem throw).
 */
export async function generateMotorFromPrompt(
  prompt: string
): Promise<GenerateResult | GenerateError> {
  try {
    const response = await fetch('/api/oficina/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json().catch(() => ({} as { motor?: MotorSpec; error?: string }));

    if (!response.ok) {
      return { ok: false, error: data.error || `HTTP ${response.status}` };
    }

    if (!data.motor) {
      return { ok: false, error: 'Resposta sem campo "motor".' };
    }

    return { ok: true, motor: data.motor as MotorSpec };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Falha de rede.';
    return { ok: false, error: msg };
  }
}

/* ─── Background AI (Gemini Imagen) ─── */

export interface BackgroundGenResult {
  ok: true;
  imageBase64: string;
}

export interface BackgroundGenError {
  ok: false;
  error: string;
}

/**
 * Chama /api/oficina/generate-background pra gerar uma imagem de fundo
 * via Gemini Imagen no aspect ratio do format do motor.
 */
export async function generateBackgroundFromPrompt(
  prompt: string,
  format: 'feed-1x1' | 'story-9x16'
): Promise<BackgroundGenResult | BackgroundGenError> {
  try {
    const response = await fetch('/api/oficina/generate-background', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, format }),
    });

    const data = await response
      .json()
      .catch(() => ({} as { imageBase64?: string; error?: string }));

    if (!response.ok) {
      return { ok: false, error: data.error || `HTTP ${response.status}` };
    }

    if (!data.imageBase64) {
      return { ok: false, error: 'Resposta sem campo "imageBase64".' };
    }

    return { ok: true, imageBase64: data.imageBase64 };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Falha de rede.';
    return { ok: false, error: msg };
  }
}
