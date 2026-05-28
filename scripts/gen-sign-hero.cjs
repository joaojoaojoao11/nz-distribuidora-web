/*
 * Gera o hero da página NZSIGN (/sign).
 * Tenta múltiplos modelos do Google Gemini, em ordem de preferência:
 *   1. Gemini 2.5 Flash Image (native image gen — pode estar no free tier)
 *   2. Gemini 2.0 Flash Exp Image (legado)
 *   3. Imagen 4 Ultra (paid plan)
 * Executar: node scripts/gen-sign-hero.cjs
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.+?)\s*$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  });
}

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('GEMINI_API_KEY não encontrada no .env');
  process.exit(1);
}

const OUT_DIR = path.join(__dirname, '..', 'public', 'assets', 'images', 'sign');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
const OUT_PATH = path.join(OUT_DIR, 'sign_hero.png');

const PROMPT =
  'Ultra-realistic cinematic wide-angle interior photograph of a premium signage and visual communication production studio at night, dramatic moody black-and-charcoal atmosphere. In the foreground a master signmaker installer wearing a dark t-shirt, his hands holding a yellow squeegee, applying a glossy black premium vinyl wrap film over a brushed metallic panel, the sharply cut white letters of a wordmark just beginning to reveal as the transfer tape lifts. Background: a high-end wide-format roll-to-roll printer outputting a vivid corporate visual identity print onto white vinyl, soft glow of UV curing LEDs spilling cyan and magenta light. To the side: vertical rolls of premium calendered vinyl in racks, a CNC vinyl cutter plotter mid-cut producing precise tiny letterforms, a stack of crisp colored brand swatches. Single key warm tungsten overhead pendant light, deep red accent neon edge from a distant illuminated sign, volumetric haze, intense chiaroscuro. Hyper-detailed, film-grain, editorial commercial photography, 8k, sharp focus on the vinyl application action, shallow depth of field, ultra-premium brand catalog aesthetic. Wide cinematic 16:9 aspect ratio. No visible logos, no text, no watermark.';

function httpsPost({ hostname, path: urlPath, body }) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname,
        path: urlPath,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// --- Strategy 1: Gemini native image gen via generateContent ---
async function tryGeminiNative(model) {
  const body = JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: PROMPT }] }],
    generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
  });

  const res = await httpsPost({
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models/${model}:generateContent?key=${API_KEY}`,
    body,
  });

  if (res.status !== 200) {
    return { ok: false, model, error: `${res.status}: ${res.body.slice(0, 300)}` };
  }

  let json;
  try {
    json = JSON.parse(res.body);
  } catch {
    return { ok: false, model, error: `JSON parse failed: ${res.body.slice(0, 300)}` };
  }

  const parts = json?.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((p) => p.inlineData?.data);
  if (!imagePart) {
    return { ok: false, model, error: `sem imagem na resposta: ${res.body.slice(0, 300)}` };
  }

  const buf = Buffer.from(imagePart.inlineData.data, 'base64');
  return { ok: true, model, buffer: buf };
}

// --- Strategy 2: Imagen predict endpoint ---
async function tryImagen(model) {
  const body = JSON.stringify({
    instances: [{ prompt: PROMPT }],
    parameters: { sampleCount: 1, aspectRatio: '16:9' },
  });

  const res = await httpsPost({
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models/${model}:predict?key=${API_KEY}`,
    body,
  });

  if (res.status !== 200) {
    return { ok: false, model, error: `${res.status}: ${res.body.slice(0, 300)}` };
  }

  let json;
  try {
    json = JSON.parse(res.body);
  } catch {
    return { ok: false, model, error: `JSON parse failed: ${res.body.slice(0, 300)}` };
  }

  const b64 = json?.predictions?.[0]?.bytesBase64Encoded;
  if (!b64) {
    return { ok: false, model, error: `sem imagem na resposta: ${res.body.slice(0, 300)}` };
  }

  const buf = Buffer.from(b64, 'base64');
  return { ok: true, model, buffer: buf };
}

const ATTEMPTS = [
  { label: 'Gemini 3.1 Flash Image (latest)', fn: () => tryGeminiNative('gemini-3.1-flash-image') },
  { label: 'Gemini 3.1 Flash Image Preview', fn: () => tryGeminiNative('gemini-3.1-flash-image-preview') },
  { label: 'Gemini 3 Pro Image', fn: () => tryGeminiNative('gemini-3-pro-image') },
  { label: 'Gemini 3 Pro Image Preview', fn: () => tryGeminiNative('gemini-3-pro-image-preview') },
  { label: 'Gemini 2.5 Flash Image', fn: () => tryGeminiNative('gemini-2.5-flash-image') },
  { label: 'Imagen 4 Fast (paid)', fn: () => tryImagen('imagen-4.0-fast-generate-001') },
  { label: 'Imagen 4 Ultra (paid)', fn: () => tryImagen('imagen-4.0-ultra-generate-001') },
];

(async () => {
  for (const attempt of ATTEMPTS) {
    console.log(`\n→ Tentando: ${attempt.label}`);
    try {
      const result = await attempt.fn();
      if (result.ok) {
        fs.writeFileSync(OUT_PATH, result.buffer);
        console.log(`✓ SUCESSO com ${result.model}`);
        console.log(`  ${(result.buffer.length / 1024).toFixed(1)} KB → ${OUT_PATH}`);
        process.exit(0);
      } else {
        console.log(`  ✗ ${result.error}`);
      }
    } catch (e) {
      console.log(`  ✗ exceção: ${e.message}`);
    }
  }
  console.error('\nTodos os modelos falharam. Verifique billing em https://ai.dev/projects');
  process.exit(1);
})();
