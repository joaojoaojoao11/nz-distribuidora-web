/*
 * Gera as 4 imagens contextuais da seção "Diferenciais Exclusivos" da página Headlight
 * usando Gemini Imagen 4 Ultra. Executar com:
 *   node scripts/gen-headlight-diffs.cjs
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Carrega .env manualmente (sem depender de dotenv)
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.+?)\s*$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  });
}

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('GEMINI_API_KEY não encontrada no .env');
  process.exit(1);
}

const OUT_DIR = path.join(__dirname, '..', 'public', 'assets', 'images');

const jobs = [
  {
    file: 'nzppf_headlight_diff_protecao.png',
    prompt:
      'Ultra-realistic macro automotive photography, extreme close-up of a premium luxury sports car headlight cluster at night, a protective glossy PPF polyurethane film layer visibly catching a razor-thin rim light across its surface, a single small road stone frozen mid-bounce just deflecting off the transparent film without damaging it, microscopic impact ripple in the film, deep moody black studio background, dramatic chiaroscuro lighting, cinematic shallow depth of field, 8k commercial product photography, hyper-detailed reflections, BMW M4 Mercedes AMG headlight aesthetic, highly polished LED matrix projector, cold blue accent reflections, editorial magazine grade, no text, no watermark'
  },
  {
    file: 'nzppf_headlight_diff_estetica.png',
    prompt:
      'Ultra-realistic editorial automotive catalog photograph, three identical luxury car headlights arranged side by side in a triptych, each wearing a different progressive smoked tint film — left headlight has a very subtle light black fume tint, center headlight has a neutral light gray graphite tint, right headlight has a deep dark black smoked tint, clean seamless neutral dark charcoal gradient studio background, soft even top lighting, premium product photography composition, each lens identical in shape and model, refined automotive jewelry aesthetic, sharp focus, balanced symmetric framing, 8k hyper-detailed commercial photography, no text, no watermark',
  },
  {
    file: 'nzppf_headlight_diff_luminosidade.png',
    prompt:
      'Cinematic night highway automotive photography, low front three-quarter angle of a premium luxury sports coupe on a dark wet asphalt road, its smoked tinted headlights fully illuminated and cutting two crisp bright beams through light atmospheric fog and fine rain, LED projector lens clearly visible glowing warm white through the subtle fume tint, tint does not diminish beam brightness, reflective wet ground with long light streaks, moody deep blue and black ambience, subtle lens flare from the headlight, film-grain cinematography, extremely realistic motion atmosphere, IMAX commercial grade, no text, no watermark',
  },
  {
    file: 'nzppf_headlight_diff_resistencia.png',
    prompt:
      'Hyper-realistic extreme close-up macro product photography of a luxury car headlight lens under intense midday golden sunlight, the lens surface is crystal clear with absolutely no yellowing or clouding, protective transparent PPF film visibly beads hundreds of perfectly spherical water droplets across its surface, a soft sun flare hits the upper edge of the lens, warm golden hour light, faint heat-haze atmosphere, premium clean detailed surface reflections, editorial automotive catalog look, shallow depth of field, sharp detail on water beads and lens micro-structure, 8k hyper-detailed commercial photography, no text, no watermark',
  }
];

function generate(job) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      instances: [{ prompt: job.prompt }],
      parameters: { sampleCount: 1, aspectRatio: '16:9' }
    });

    const opts = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/imagen-4.0-ultra-generate-001:predict?key=${API_KEY}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    };

    const req = https.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (!json.predictions || !json.predictions[0] || !json.predictions[0].bytesBase64Encoded) {
            return reject(new Error(`[${job.file}] resposta inesperada: ${data.slice(0, 400)}`));
          }
          const buf = Buffer.from(json.predictions[0].bytesBase64Encoded, 'base64');
          const outPath = path.join(OUT_DIR, job.file);
          fs.writeFileSync(outPath, buf);
          console.log(`OK ${job.file} (${(buf.length / 1024).toFixed(1)} KB) -> ${outPath}`);
          resolve(outPath);
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

(async () => {
  console.log(`Gerando ${jobs.length} imagens em paralelo...`);
  const results = await Promise.allSettled(jobs.map(generate));
  const failed = results.filter(r => r.status === 'rejected');
  if (failed.length) {
    console.error(`\n${failed.length} falha(s):`);
    failed.forEach(f => console.error(' -', f.reason.message));
    process.exit(1);
  }
  console.log('\nConcluído.');
})();
