// Lê e escreve a configuração do Supabase Auth pela Management API.
//
//   node scripts/auth-config.mjs get site
//   node scripts/auth-config.mjs set site config/auth-site.json
//
// A Management API do Supabase recusa o urllib do Python (Cloudflare 1010), por
// isso este script é Node — mesmo caminho de scripts/aplicar-sql.mjs, e o token
// sai do mesmo .env.local.
//
// NUNCA imprime a resposta inteira: ela traz smtp_pass, secrets de OAuth e o
// segredo do captcha. O `get` mostra uma lista curta de campos e troca segredo
// por `hasX: true/false`.

import fs from 'node:fs';

const lerEnv = (p) =>
  Object.fromEntries(
    fs
      .readFileSync(p, 'utf8')
      .split(/\r?\n/)
      .filter((l) => l.includes('=') && !l.startsWith('#'))
      .map((l) => {
        const i = l.indexOf('=');
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')];
      })
  );

const env = lerEnv('C:/Users/joaov/OneDrive/Documentos/GitHub/2NZERPUPDATE30/.env.local');
const PROJETOS = { site: 'uibjmvkvbthzypgozpcs', erp: 'ipehorttsrvjynnhyzhu' };

const [, , acao, alvo, arquivo] = process.argv;
const ref = PROJETOS[alvo];
if (!ref || !['get', 'set'].includes(acao)) {
  console.error('uso: node scripts/auth-config.mjs get|set site|erp [arquivo.json]');
  process.exit(1);
}

const URL_BASE = `https://api.supabase.com/v1/projects/${ref}/config/auth`;
const cabecalhos = { Authorization: 'Bearer ' + env.SUPABASE_ACCESS_TOKEN, 'Content-Type': 'application/json' };

/** Campos que interessam ao diagnóstico; segredo vira hasX. */
const SEGREDOS = ['smtp_pass', 'security_captcha_secret', 'external_google_secret', 'external_apple_secret'];
const VISIVEIS = [
  'site_url',
  'uri_allow_list',
  'disable_signup',
  'mailer_autoconfirm',
  'password_min_length',
  'jwt_exp',
  'rate_limit_email_sent',
  'security_captcha_enabled',
  'security_captcha_provider',
  'external_email_enabled',
  'external_google_enabled',
  'external_google_client_id',
  'smtp_host',
  'smtp_port',
  'smtp_user',
  'smtp_sender_name',
  'smtp_admin_email',
  'mailer_subjects_invite',
  'mailer_subjects_recovery',
  'mailer_subjects_email_change',
  'mailer_subjects_magic_link',
  'mailer_subjects_confirmation',
];

function resumir(cfg) {
  const out = {};
  for (const k of VISIVEIS) if (cfg[k] !== undefined) out[k] = cfg[k];
  for (const k of SEGREDOS) out[`has_${k}`] = Boolean(cfg[k]);
  return out;
}

if (acao === 'get') {
  const r = await fetch(URL_BASE, { headers: cabecalhos });
  const j = await r.json();
  if (!r.ok) {
    console.error(r.status, JSON.stringify(j).slice(0, 400));
    process.exit(1);
  }
  console.log(JSON.stringify(resumir(j), null, 2));
} else {
  if (!arquivo || !fs.existsSync(arquivo)) {
    console.error('arquivo JSON com os campos a alterar é obrigatório no `set`');
    process.exit(1);
  }
  const patch = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
  const r = await fetch(URL_BASE, { method: 'PATCH', headers: cabecalhos, body: JSON.stringify(patch) });
  const j = await r.json();
  if (!r.ok) {
    console.error(r.status, JSON.stringify(j).slice(0, 600));
    process.exit(1);
  }
  // Confirma só as chaves que foram enviadas, sem ecoar segredo.
  const conferencia = {};
  for (const k of Object.keys(patch)) {
    conferencia[k] = SEGREDOS.includes(k) ? (j[k] ? 'definido' : 'VAZIO') : j[k];
  }
  console.log('ok', JSON.stringify(conferencia, null, 2).slice(0, 3000));
}
