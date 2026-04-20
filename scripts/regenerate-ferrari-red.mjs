import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '..', '.env');
const envRaw = fs.readFileSync(envPath, 'utf-8');
const API_KEY = envRaw.split('\n').find(l => l.startsWith('GEMINI_API_KEY='))?.split('=')[1]?.trim();
if (!API_KEY) { console.error('GEMINI_API_KEY not found'); process.exit(1); }

const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');
const OUT_DIR = path.join(PUBLIC_DIR, 'assets', 'images', 'nzwrap');

const LOG_PATH = path.resolve(__dirname, 'generate-nzwrap-images.log');
const log = (msg) => {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_PATH, line + '\n');
};

// Referência de cor = a Land Rover afternoon que está OK (cor correta).
const REF_PATH = path.join(OUT_DIR, 'ferrari_metallic_red_afternoon.png');
const REF_MIME = 'image/png';

// Variações: carro diferente, ângulo diferente, momento diferente. Cor idêntica à referência.
const VARIANTS = [
  {
    filename: 'ferrari_metallic_red_morning.png',
    prompt: 'Use the EXACT same deep metallic red paint color of the car in the reference photo as a strict color reference. Now create a COMPLETELY DIFFERENT new photo: a brand new Ferrari F8 Tributo supercar painted in this exact same metallic red wrap color. Rear three-quarter angle from the right side, showing the rear diffuser and taillights. Scene: early morning at 7am, golden soft sunlight coming from the left, alpine mountain pass road with distant snow-capped peaks, misty cool atmosphere, wet asphalt from morning dew. Ultra-realistic automotive photography, 8k, shallow depth of field, sharp paint detail, preserve the EXACT wrap color from reference. Do not produce an SUV, must be a low mid-engine supercar.',
  },
  {
    filename: 'ferrari_metallic_red_sunset.png',
    prompt: 'Use the EXACT same deep metallic red paint color of the car in the reference photo as a strict color reference. Now create a COMPLETELY DIFFERENT new photo: a brand new Porsche 911 Turbo S painted in this exact same metallic red wrap color. Perfect profile side view from the left, low camera angle near ground level. Scene: golden hour sunset at 6pm, warm orange-pink sky, coastal cliffside road overlooking the ocean, long dramatic warm reflections running along the entire side of the car, cinematic lens flare from the setting sun behind. Ultra-realistic automotive photography, 8k, sharp paint detail, preserve the EXACT wrap color from reference. Do not produce an SUV, must be the classic 911 silhouette.',
  },
  {
    filename: 'ferrari_metallic_red_night.png',
    prompt: 'Use the EXACT same deep metallic red paint color of the car in the reference photo as a strict color reference. Now create a COMPLETELY DIFFERENT new photo: a brand new Lamborghini Huracan EVO painted in this exact same metallic red wrap color. Front three-quarter low angle view from the left, aggressive stance, headlights on. Scene: deep night at 10pm, wet black asphalt of a Tokyo-style city street, vivid neon pink, cyan and magenta signs reflecting on the wet road and along the car body, moody cinematic rim lighting from street lamps, shallow depth of field. Ultra-realistic automotive photography, 8k, sharp paint detail, preserve the EXACT wrap color from reference. Do not produce an SUV, must be a low angular supercar.',
  },
];

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

(async () => {
  log('=== START ferrari_red variant regeneration ===');
  if (!fs.existsSync(REF_PATH)) { log(`FAIL reference not found: ${REF_PATH}`); process.exit(1); }
  const refBase64 = fs.readFileSync(REF_PATH).toString('base64');
  log(`REF  loaded afternoon Land Rover (${refBase64.length} b64 chars)`);

  for (const v of VARIANTS) {
    const outPath = path.join(OUT_DIR, v.filename);
    if (fs.existsSync(outPath)) { log(`SKIP (exists): ${v.filename}`); continue; }
    log(`GEN  ${v.filename}`);
    try {
      const buf = await callGeminiImageEdit(v.prompt, refBase64, REF_MIME);
      fs.writeFileSync(outPath, buf);
      log(`OK   ${v.filename} (${buf.length} bytes)`);
    } catch (err) {
      log(`ERR  ${v.filename}: ${err.message}`);
      await sleep(10000);
      try {
        const buf = await callGeminiImageEdit(v.prompt, refBase64, REF_MIME);
        fs.writeFileSync(outPath, buf);
        log(`OK   ${v.filename} (retry, ${buf.length} bytes)`);
      } catch (err2) {
        log(`FAIL ${v.filename}: ${err2.message}`);
      }
    }
    await sleep(3000);
  }
  log('=== DONE ===');
})();
