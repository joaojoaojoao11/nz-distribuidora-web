import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Em dev (`vite`), as serverless functions de `api/` não rodam — só na Vercel
 * (ou via `vercel dev`). Sem isso, Vite tenta resolver `/api/*` como módulo
 * do frontend, encontra o `.ts` e quebra o transform com erro de parser.
 *
 * Esse middleware curto-circuita TODO request que comece com `/api/` no dev
 * server e devolve 503 + JSON. O try/catch no useCalendarFeeds (e qualquer
 * outro consumidor) trata o 503 como erro de feed sem derrubar a UI.
 */
function devApiStub(): PluginOption {
  return {
    name: 'nz-dev-api-stub',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) return next()
        res.statusCode = 503
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(
          JSON.stringify({
            error: 'API indisponível no Vite dev. Use `vercel dev` ou faça deploy.',
            path: req.url,
          })
        )
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), devApiStub()],
})
