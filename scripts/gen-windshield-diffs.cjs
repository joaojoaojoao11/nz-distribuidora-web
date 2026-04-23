/*
 * Gera as 4 imagens contextuais da seção "Diferenciais Exclusivos" da página Windshield
 * usando Gemini Imagen 4 Ultra. Executar com:
 *   node scripts/gen-windshield-diffs.cjs
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Carrega .env manualmente
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
    file: 'nzppf_windshield_diff_impacto.png',
    prompt:
      'Ultra-realistic extreme macro automotive photography, close-up of a luxury car windshield at a dramatic three-quarter angle, a small sharp road stone frozen mid-impact striking the transparent protective PPF film on the outer surface, the film visibly flexes and absorbs the energy with a subtle ripple distortion while the underlying glass remains perfectly intact, tiny splinter fragments scattering outward, deep moody dark studio background with a single cinematic rim light, hyper-detailed 190 micron film texture visible, cold blue accent rim lighting, premium automotive product photography, shallow depth of field, 8k photorealistic, no text, no watermark',
  },
  {
    file: 'nzppf_windshield_diff_preservacao.png',
    prompt:
      'Ultra-realistic premium automotive photography, three-quarter front view of a flawless pristine luxury sports car parked inside an elegant dark private showroom, dramatic cinematic spotlighting emphasizing the perfectly clean factory-sealed windshield, the thin factory rubber seal around the glass is pristine and uncut, soft warm golden reflections from overhead spot lights across the original glass, museum-grade lighting, deep black polished concrete floor, architectural minimalist background, luxury car collector aesthetic, Porsche or Aston Martin silhouette feel, hyper-detailed glass edge and trim, 8k commercial photography, no text, no watermark',
  },
  {
    file: 'nzppf_windshield_diff_adas.png',
    prompt:
      'Ultra-realistic automotive interior photography shot from the driver perspective through a crystal-clear windshield on a highway at golden hour, the advanced ADAS camera module and radar sensors mounted at the top of the windshield near the rearview mirror are sharply visible, the road ahead shows lane markings and the road is perfectly crisp with zero optical distortion through the glass, subtle augmented-reality heads-up style holographic blue data overlays floating over the road indicating lane detection and vehicle tracking, premium car dashboard slightly out of focus at the bottom, cinematic warm sunlight flare, hyper-detailed sensor housing and camera lens, modern luxury SUV cockpit feel, 8k photorealistic, no text, no watermark',
  },
  {
    file: 'nzppf_windshield_diff_resistencia.png',
    prompt:
      'Ultra-realistic dynamic automotive action photography, front three-quarter view of a luxury sports sedan driving at high speed on a rugged mountain highway in harsh summer conditions, heavy rain droplets and small debris visibly hitting and deflecting off the windshield protective film in motion, intense golden sun flare bursting above the horizon, wet reflective asphalt, pristine clear windshield surface despite the extreme elements, cinematic motion blur on the wheels and environment, warm dramatic late afternoon lighting, IMAX-grade commercial automotive cinematography, hyper-detailed water droplet physics and light refraction, 8k photorealistic, no text, no watermark',
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
