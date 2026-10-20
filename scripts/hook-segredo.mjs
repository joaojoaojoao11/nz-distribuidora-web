// Gera o patch de configuração do Supabase Auth que liga o Send Email Hook,
// com o segredo DERIVADO da chave de serviço (o mesmo cálculo de
// api/_lib/auth/webhook.ts, derivarSegredo). Nunca imprime o segredo.
//
//   node scripts/hook-segredo.mjs <arquivo-de-saida.json>
//   node scripts/auth-config.mjs set site <arquivo-de-saida.json>
//
// Se a chave de serviço for trocada na Vercel, rode os dois de novo.

import { createHmac } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ROTULO = 'nz-auth-email-hook-v1';
const saida = process.argv[2];
if (!saida) {
  console.error('uso: node scripts/hook-segredo.mjs <arquivo-de-saida.json>');
  process.exit(1);
}
const env = Object.fromEntries(
  readFileSync(join(ROOT, '.env'), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')];
    })
);
const chave = env.SUPABASE_SERVICE_ROLE_KEY;
if (!chave) {
  console.error('SUPABASE_SERVICE_ROLE_KEY ausente no .env');
  process.exit(1);
}
const segredo = `v1,whsec_${createHmac('sha256', chave).update(ROTULO).digest('base64')}`;
writeFileSync(
  saida,
  JSON.stringify({ hook_send_email_enabled: true, hook_send_email_uri: 'https://www.nzgroup.com.br/api/auth-email', hook_send_email_secrets: segredo }, null, 2) + '\n'
);
console.log(`patch gravado em ${saida} (segredo derivado, ${segredo.length} caracteres)`);
