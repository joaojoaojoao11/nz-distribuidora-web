import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '..', '.env');
const envRaw = fs.readFileSync(envPath, 'utf-8');
const API_KEY = envRaw.split('\n').find(l => l.startsWith('GEMINI_API_KEY='))?.split('=')[1]?.trim();
if (!API_KEY) { console.error('GEMINI_API_KEY not found in .env'); process.exit(1); }

const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');
const OUT_DIR = path.join(PUBLIC_DIR, 'assets', 'images', 'nzwrap');
fs.mkdirSync(OUT_DIR, { recursive: true });

const LOG_PATH = path.resolve(__dirname, 'generate-nzwrap-images.log');
const log = (msg) => {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_PATH, line + '\n');
};

// Cada cor usa sua foto SH original (que tem a cor correta) como referência
const COLORS = [
  { sku: 'NZW201', slug: 'ferrari_metallic_red',  reference: 'assets/images/sh/soulmoving_red_suv.jpeg',        mime: 'image/jpeg' },
  { sku: 'NZW210', slug: 'viper_green',           reference: 'assets/images/sh/crystal_mamba_green_morning.png', mime: 'image/png'  },
  { sku: 'NZW212', slug: 'diamond_white',         reference: 'assets/images/sh/crystal_white_morning.png',       mime: 'image/png'  },
  { sku: 'NZW216', slug: 'piano_black_gloss',     reference: 'assets/images/sh/glossy_black_morning.png',        mime: 'image/png'  },
];

const MOMENTS = {
  morning:   'early morning, 7am, soft golden sunlight from the east, misty cool atmosphere, empty mountain road, clear pale-blue sky',
  afternoon: 'bright midday, 1pm, intense direct sunlight, sharp hard shadows, urban concrete rooftop parking, clear blue sky',
  sunset:    'golden hour sunset, 6pm, warm orange-pink sky, long dramatic golden reflections on the paint, coastal road, cinematic lens flare',
  night:     'deep night, 10pm, wet black city street, vivid neon signs reflecting on the wet pavement and the car body, moody cinematic rim lighting from street lamps',
};

const buildPrompt = (moment) =>
  `Use the provided photo as a strict color reference. Re-render the SAME car keeping the EXACT same wrap color, the same car model and the same viewing angle. Only change the environment and lighting to: ${MOMENTS[moment]}. Ultra-realistic automotive photography, 8k resolution, photorealistic, sharp paint detail, preserve color fidelity above all.`;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function callGeminiImageEdit(prompt, refBase64, refMime) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      contents: [{
        parts: [
          { inlineData: { mimeType: refMime, data: refBase64 } },
          { text: prompt },
        ],
      }],
    });
    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-2.5-flash-image:generateContent?key=${API_KEY}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 500)}`)); return; }
        try {
          const json = JSON.parse(data);
          const parts = json?.candidates?.[0]?.content?.parts || [];
          const imgPart = parts.find(p => p.inlineData?.data);
          if (!imgPart) { reject(new Error(`No image in response: ${data.slice(0, 500)}`)); return; }
          resolve(Buffer.from(imgPart.inlineData.data, 'base64'));
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function generateOne(color, moment, refBase64) {
  const filename = `${color.slug}_${moment}.png`;
  const outPath = path.join(OUT_DIR, filename);
  if (fs.existsSync(outPath)) { log(`SKIP (exists): ${filename}`); return; }
  const prompt = buildPrompt(moment);
  log(`GEN  ${color.sku} ${moment} -> ${filename}`);
  try {
    const buf = await callGeminiImageEdit(prompt, refBase64, color.mime);
    fs.writeFileSync(outPath, buf);
    log(`OK   ${filename} (${buf.length} bytes)`);
  } catch (err) {
    log(`ERR  ${filename}: ${err.message}`);
    log(`RETRY ${filename} after 10s`);
    await sleep(10000);
    try {
      const buf = await callGeminiImageEdit(prompt, refBase64, color.mime);
      fs.writeFileSync(outPath, buf);
      log(`OK   ${filename} (retry, ${buf.length} bytes)`);
    } catch (err2) {
      log(`FAIL ${filename}: ${err2.message}`);
    }
  }
}

(async () => {
  log('=== START nzwrap image-to-image generation (gemini-2.5-flash-image) ===');
  for (const color of COLORS) {
    const refPath = path.join(PUBLIC_DIR, color.reference);
    if (!fs.existsSync(refPath)) { log(`FAIL reference not found: ${refPath}`); continue; }
    const refBase64 = fs.readFileSync(refPath).toString('base64');
    log(`REF  ${color.sku} loaded ${color.reference} (${refBase64.length} b64 chars)`);
    for (const moment of Object.keys(MOMENTS)) {
      await generateOne(color, moment, refBase64);
      await sleep(3000);
    }
  }
  log('=== DONE ===');
})();
