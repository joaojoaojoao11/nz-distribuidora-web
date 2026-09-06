// uso: node sql.mjs <site|erp> <arquivo.sql | "query">
import fs from 'node:fs';
const lerEnv = (p) => Object.fromEntries(fs.readFileSync(p, 'utf8').split(/\r?\n/).filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]; }));
const erp = lerEnv('C:/Users/joaov/OneDrive/Documentos/GitHub/2NZERPUPDATE30/.env.local');
const PROJ = { site: 'uibjmvkvbthzypgozpcs', erp: 'ipehorttsrvjynnhyzhu' }[process.argv[2]];
const arg = process.argv[3];
const query = fs.existsSync(arg) ? fs.readFileSync(arg, 'utf8') : arg;
const r = await fetch(`https://api.supabase.com/v1/projects/${PROJ}/database/query`, { method: 'POST', headers: { Authorization: 'Bearer ' + erp.SUPABASE_ACCESS_TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
const t = await r.text();
console.log(r.status, t.slice(0, 6000));
if (!r.ok) process.exit(1);
