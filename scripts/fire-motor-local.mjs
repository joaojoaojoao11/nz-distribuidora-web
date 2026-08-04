// Dispara o Motor SEO IA fazendo POST no endpoint real (produção ou vercel dev),
// em vez de duplicar a lógica de api/cron/ai-writer.ts — assim os prompts nunca
// ficam fora de sincronia.
//
// Uso:
//   node scripts/fire-motor-local.mjs <campaignId> [baseUrl]
//   baseUrl default: https://www.nzgroup.com.br
//   local:  node scripts/fire-motor-local.mjs <campaignId> http://localhost:3000
//
// Requer no .env: CRON_SECRET

import { readFileSync } from 'node:fs';

const ENV_FILE = new URL('../.env', import.meta.url);
try {
  for (const line of readFileSync(ENV_FILE, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch { /* sem .env local, usa env vars do shell */ }

const CRON_SECRET = process.env.CRON_SECRET;
const CAMPAIGN_ID = process.argv[2];
const BASE_URL = process.argv[3] || 'https://www.nzgroup.com.br';

if (!CRON_SECRET) {
  console.error('CRON_SECRET ausente no .env');
  process.exit(1);
}
if (!CAMPAIGN_ID) {
  console.error('Uso: node scripts/fire-motor-local.mjs <campaignId> [baseUrl]');
  process.exit(1);
}

const res = await fetch(`${BASE_URL}/api/cron/ai-writer`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${CRON_SECRET}`,
  },
  body: JSON.stringify({ force: true, campaignId: CAMPAIGN_ID }),
});

const body = await res.json().catch(() => null);
console.log(`HTTP ${res.status}`);
console.dir(body, { depth: null });
process.exit(res.ok ? 0 : 1);
