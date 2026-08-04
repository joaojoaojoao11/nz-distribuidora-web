import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from './App.tsx'

// As meta tags injetadas pelo edge (api/render.ts) servem crawlers sem JS.
// No browser, o react-helmet é a fonte da verdade — removemos as tags do edge
// antes do render para não duplicar title/canonical/OG na navegação SPA.
document.querySelectorAll('[data-edge-seo]').forEach((el) => el.remove())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
)
