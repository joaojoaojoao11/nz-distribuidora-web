// API da loja no localhost — `npm run dev:api` (porta 3999).
//
// As funções de `api/` são serverless da Vercel e não rodam no `vite`. Até
// 21/10/2026 o dev server respondia 503 ("API indisponível no Vite dev") para
// todo /api/*, e nenhuma tela do admin que depende da API funcionava no
// localhost. Este script empacota o roteador `api/nz/[acao].ts` com o esbuild
// e o serve num servidor HTTP com a mesma cara da Vercel (req.query, req.body
// já parseado, res.status().json()). O `vite.config.ts` repassa /api/* para
// cá quando este servidor está no ar; sem ele, continua o 503 de antes.
//
// Ambiente: lê o `.env` do site. As chaves do NZERP (ERP_SUPABASE_URL /
// ERP_SUPABASE_SERVICE_ROLE_KEY) não ficam no .env do site; se existir o
// `.env.local` do NZERP ao lado (GitHub/2NZERPUPDATE30), as chaves de lá são
// usadas — é o que o pedido e o checkout precisam para falar com o ERP.
// Nunca imprime valor de variável.
//
// É DESENVOLVIMENTO: bate nos mesmos bancos da produção (não existe staging).
// Recompila quando algo em api/ muda.

import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { context } from 'esbuild';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORTA = Number(process.env.NZ_DEV_API_PORT || 3999);
const OUT = join(ROOT, 'node_modules/.cache/nz-dev-api');
mkdirSync(OUT, { recursive: true });

function lerEnv(caminho) {
  if (!existsSync(caminho)) return {};
  return Object.fromEntries(
    readFileSync(caminho, 'utf8')
      .split(/\r?\n/)
      .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
      .map((l) => {
        const i = l.indexOf('=');
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')];
      })
  );
}
const envSite = lerEnv(join(ROOT, '.env'));
for (const [k, v] of Object.entries(envSite)) if (!(k in process.env)) process.env[k] = v;
const envErp = lerEnv(join(ROOT, '../../GitHub/2NZERPUPDATE30/.env.local'));
if (!process.env.ERP_SUPABASE_URL && envErp.VITE_SUPABASE_URL) process.env.ERP_SUPABASE_URL = envErp.VITE_SUPABASE_URL;
if (!process.env.ERP_SUPABASE_SERVICE_ROLE_KEY && envErp.SUPABASE_SERVICE_ROLE_KEY) process.env.ERP_SUPABASE_SERVICE_ROLE_KEY = envErp.SUPABASE_SERVICE_ROLE_KEY;
const temErp = Boolean(process.env.ERP_SUPABASE_URL && process.env.ERP_SUPABASE_SERVICE_ROLE_KEY);

// ------------------------------------------------------------ build + watch
let versao = 0;
let roteador = null;
let pronto = null;
const ctx = await context({
  entryPoints: [join(ROOT, 'api/nz/[acao].ts')],
  bundle: true,
  packages: 'external',
  platform: 'node',
  format: 'esm',
  outfile: join(OUT, 'roteador.mjs'),
  logLevel: 'silent',
  plugins: [
    {
      name: 'nz-recarrega',
      setup(b) {
        b.onEnd(async (r) => {
          if (r.errors.length) {
            console.error('[dev-api] erro de build:', r.errors.map((e) => e.text).join(' | '));
            return;
          }
          versao++;
          try {
            const m = await import(pathToFileURL(join(OUT, 'roteador.mjs')).href + `?v=${versao}`);
            roteador = m.default;
            console.log(`[dev-api] build ${versao} pronto`);
          } catch (e) {
            console.error('[dev-api] não carregou o roteador:', e.message);
          }
        });
      },
    },
  ],
});
pronto = ctx.watch();

// -------------------------------------------------------------- adaptador
function lerCorpo(req) {
  return new Promise((resolve) => {
    const partes = [];
    req.on('data', (c) => partes.push(c));
    req.on('end', () => resolve(Buffer.concat(partes).toString('utf8')));
    req.on('error', () => resolve(''));
  });
}

const servidor = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORTA}`);
  const m = /^\/api\/nz\/([^/?]+)/.exec(url.pathname);
  if (!m) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'rota-desconhecida', path: url.pathname, dica: 'só /api/nz/<acao> roda aqui' }));
    return;
  }
  await pronto;
  if (!roteador) {
    res.statusCode = 503;
    res.end(JSON.stringify({ error: 'dev-api-sem-build' }));
    return;
  }
  const bruto = await lerCorpo(req);
  const tipo = String(req.headers['content-type'] || '');
  let body = bruto;
  if (tipo.includes('application/json') && bruto) {
    try {
      body = JSON.parse(bruto);
    } catch {
      body = bruto;
    }
  }
  const query = Object.fromEntries(url.searchParams.entries());
  query.acao = m[1];
  const cookies = Object.fromEntries(
    String(req.headers.cookie || '')
      .split(';')
      .map((c) => c.trim())
      .filter(Boolean)
      .map((c) => {
        const i = c.indexOf('=');
        return [c.slice(0, i), decodeURIComponent(c.slice(i + 1))];
      })
  );
  const vreq = Object.assign(req, { query, body, cookies });
  let enviado = false;
  const vres = Object.assign(res, {
    status(n) {
      res.statusCode = n;
      return vres;
    },
    json(obj) {
      enviado = true;
      if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(obj));
      return vres;
    },
    send(x) {
      enviado = true;
      if (Buffer.isBuffer(x) || typeof x === 'string') res.end(x);
      else {
        if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(x));
      }
      return vres;
    },
    redirect(a, b) {
      const [codigo, destino] = typeof a === 'number' ? [a, b] : [302, a];
      res.statusCode = codigo;
      res.setHeader('Location', destino);
      res.end();
      return vres;
    },
  });
  Object.defineProperty(vres, 'headersSent', { get: () => enviado || res.writableEnded });
  const inicio = Date.now();
  try {
    await roteador(vreq, vres);
  } catch (e) {
    console.error('[dev-api] erro em', m[1], e);
    if (!res.writableEnded) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'erro-interno', message: e instanceof Error ? e.message : String(e) }));
    }
  }
  console.log(`[dev-api] ${req.method} /api/nz/${m[1]} → ${res.statusCode} (${Date.now() - inicio} ms)`);
});

servidor.listen(PORTA, '127.0.0.1', () => {
  console.log(`[dev-api] API da loja em http://127.0.0.1:${PORTA}/api/nz/<acao>  (ERP: ${temErp ? 'com chaves' : 'SEM chaves — pedido/checkout não falam com o NZERP'})`);
  console.log('[dev-api] o vite (npm run dev) repassa /api/* para cá sozinho');
});
