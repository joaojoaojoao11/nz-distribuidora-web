import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import { request as httpRequest } from 'node:http'

/**
 * Em dev (`vite`), as serverless functions de `api/` não rodam — só na Vercel
 * (ou via `vercel dev`). Sem isso, Vite tenta resolver `/api/*` como módulo
 * do frontend, encontra o `.ts` e quebra o transform com erro de parser.
 *
 * Desde 21/10/2026: se a API local estiver no ar (`npm run dev:api`, porta
 * 3999 — scripts/dev-api.mjs), este middleware REPASSA o request para ela e a
 * loja inteira funciona no localhost (admin, painel, checkout). Sem ela,
 * devolve o 503 + JSON de sempre, agora com a dica de como subir a API. O
 * try/catch nos consumidores trata o 503 sem derrubar a UI.
 */
function devApiStub(): PluginOption {
  const alvo = process.env.NZ_DEV_API_URL || 'http://127.0.0.1:3999'
  const base = new URL(alvo)
  return {
    name: 'nz-dev-api-stub',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) return next()
        const semApi = () => {
          if (res.headersSent) return
          res.statusCode = 503
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(
            JSON.stringify({
              error: 'API indisponível no Vite dev. Rode `npm run dev:api` em outro terminal (ou use `vercel dev` / faça deploy).',
              path: req.url,
            })
          )
        }
        const encaminhado = httpRequest(
          { host: base.hostname, port: base.port, method: req.method, path: req.url, headers: { ...req.headers, host: `${base.hostname}:${base.port}` } },
          (resposta) => {
            res.statusCode = resposta.statusCode ?? 502
            for (const [k, v] of Object.entries(resposta.headers)) if (v !== undefined) res.setHeader(k, v as string | string[])
            resposta.pipe(res)
          }
        )
        encaminhado.on('error', semApi)
        req.pipe(encaminhado)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), devApiStub()],
})
