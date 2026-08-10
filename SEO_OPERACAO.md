# Operação de SEO — nzgroup.com.br

Guia prático pós-implantação do SEO v2 (agosto/2026). O que é automático já está rodando; o que precisa de você está marcado com ⚠️.

---

## ✅ 1. Google Search Console — FEITO em 04/08/2026

Propriedade `sc-domain:nzgroup.com.br` já estava verificada; o sitemap `https://www.nzgroup.com.br/sitemap.xml` foi enviado em 04/08/2026 (status Processado, 252 páginas encontradas). Baseline antes do SEO v2: 15 páginas indexadas, 129 cliques/3 meses.

**Acompanhar** (2–4 semanas): https://search.google.com/search-console → **Indexação → Páginas** (cobertura deve subir de 15 para 100+) e **Desempenho** (cliques/impressões por palavra).

## ✅ 2. Bing Webmaster Tools — FEITO em 04/08/2026

Propriedade importada do GSC (conta joao.vanderleia@gmail.com) + sitemap enviado manualmente. Bing rastreia as 252 URLs em 24–48h.

## 3. IndexNow — já automático ✅

Cada post novo publicado pelo Motor avisa Bing/Yandex na hora (chave em `public/a3f8c1d94b7e42068f5a9c2d1e6b3a70.txt`). Nada a fazer.

---

## 4. Como operar o Motor SEO IA v2

- **Texto: Claude (Anthropic API)** — modelo `claude-sonnet-5` com *structured outputs* (o formato do artigo é garantido pela API; fim das quebras de parse que o Gemini causava). Custo ~R$ 0,10-0,15/artigo. Requer `ANTHROPIC_API_KEY` na Vercel (a mesma da Agência NZ) com créditos ativos em console.anthropic.com. O Gemini foi **removido** do motor.
- **6 campanhas em rodízio** (1 post/dia às 06h de Brasília, cada tema volta a cada ~6 dias): Linhas NZPPF · Dúvidas do dono de carro · Grande SP (1 cidade por post) · Técnica do instalador · NZWRAP/cores · Manutenção e pós-venda.
- **Por enquanto tudo sai como RASCUNHO** (você escolheu revisar no início):
  1. Rotina diária no **Cowork** (prompt salvo "rotina do blog"): revisar o texto, gerar capa personalizada no **Higgsfield**, publicar e avisar os buscadores. Alternativa manual: Admin → aba **✍️ Blog**.
  2. Depois de 1–2 semanas validando o tom, ligue a publicação automática por campanha: Admin → **🧠 Motor SEO IA** → *Ajustar Motor* → campo **Publicação** → "Publicar automaticamente".
- **Capas** ⚠️ (5 min, obrigatório): suba 8–10 fotos suas (carros com PPF, oficina) no Supabase Storage, bucket `blog_media`, pasta `fallbacks/`. O rascunho nasce com uma foto do pool (sorteio determinístico); a capa sob medida entra na revisão via Higgsfield.
- **Card "Saúde do Motor"** na aba do Motor mostra as últimas execuções do cron e erros.

## 5. O que mudou no site (resumo técnico)

- Canonical/OG/JSON-LD corrigidos de `agencianz.com` (domínio morto) para `https://www.nzgroup.com.br`.
- Toda rota agora entrega HTML com title/description/OG corretos para crawlers e WhatsApp (edge function `api/render.ts`); URL inexistente devolve **404 real**.
- Sitemap cobre todas as rotas (inclusive `/ppf/headlight`, `/ppf/windshield`, `/sign/*`, `/wrap/*`) e os posts do blog.
- 17 páginas ganharam meta tags; posts do blog agora têm seção FAQ com schema `FAQPage` (elegível a rich results).
- Bundle inicial dividido por rota (era ~3 MB com admin+3D+mapas na home).
- Páginas novas: `/contato`, `/privacidade`, `/termos`, página 404.

## 6. Pendências recomendadas (supervisionadas)

1. **Converter PNGs pesados para WebP** (328 MB em `public/assets/images`): `npm i -D sharp` e `node scripts/convert-webp.mjs`, depois trocar referências aos poucos testando o visual.
2. **Recomprimir vídeos hero** (`hero-home.mp4` tem 28,8 MB; ideal < 5 MB): qualquer conversor H.264 CRF 28 ou WebM resolve.
3. **Verificar no painel Vercel** se `nzgroup.com.br` (sem www) redireciona para `www.nzgroup.com.br` (Settings → Domains — deve mostrar "Redirect").
4. ~~RLS de `configuracoes_nz`~~ ✅ resolvido em 04/08/2026 (Cowork): RLS ativo com 4 policies (leitura pública, escrita só admin). Painel admin validado — login usa Supabase Auth e há 2 admins em `user_profiles`.
5. **Storage — uploads públicos** ⚠️: os buckets `warranties` e `site-assets` aceitam INSERT de qualquer pessoa sem login (policies "Permitir Upload Publico"). `warranties` também é leitura pública — se PDFs de garantia com dados de cliente forem salvos lá, ficam acessíveis por URL (LGPD). Antes de restringir, mapear o fluxo de registro de garantia (o upload é feito por visitante anônimo?). `blog_media` está correto (leitura pública, escrita autenticada).

**Feito em 04/08/2026 (blog):** 22 posts duplicados deletados (sobrou `comparativo-nzppf-guia-tecnico-instaladores-donos-carro-sp`); redirects 301 dos 22 slugs antigos adicionados no `vercel.json`; sitemap é dinâmico e já se auto-corrigiu.

---

## 8. SEO v3 — Fase 0+1 (09/08/2026)

**Correções:**
- 🐞 **Bug de leads corrigido**: os formulários "Cupom Surpresa" das 6 páginas PPF enviavam leads para um projeto Supabase antigo (`ipehortt...`) — agora gravam na tabela `leads` do projeto atual. Leads aparecem no admin.
- Blog consolidado de vez: os 5 duplicados restantes foram deletados (+5 redirects 301); o post sobrevivente ganhou categoria PPF e FAQ (elegível a rich results).
- WhatsApp placeholder (11 99999-9999) trocado pelo número real em 2 páginas de cor.
- Memória do motor vacinada contra o tema "guia/comparativo NZPPF" (não será reescrito).

**Programmatic SEO (maior novidade):** as ~146 páginas de cor de vinil (`/wrap/oracal-651/*`, `/wrap/sh-colors/*`, `/wrap/oracal-670ra/*`, `/wrap/nzwrap-premium/*`) agora têm:
- Title/description únicos por cor no HTML do edge (specs reais: acabamento, hex, durabilidade);
- Entrada no sitemap (252 → ~390 URLs);
- Seção visível de specs + FAQ + links internos em cada página (anti-conteúdo-raso);
- Cor inexistente responde 404 real.
- Após cada deploy que mude o catálogo: `node scripts/submit-indexnow.mjs /wrap/` avisa os buscadores.
- Se o catálogo NZWRAP hardcoded mudar: rodar `node scripts/gen-color-meta.mjs` e commitar.

**IAs (ChatGPT, Perplexity, Claude, Gemini):** criado `public/llms.txt` (cartão de visitas para bots de IA) e `robots.txt` liberando GPTBot, ClaudeBot, PerplexityBot, Google-Extended e CCBot.

**Próximas fases do plano v3** (ver `C:\Users\joaov\.claude\plans\quero-que-voce-analise-cached-boole.md`): JSON-LD no edge + breadcrumbs (F2), hubs/categorias/pillar pages (F3), diretório de instaladores (F4), performance (F6), Google Business Profile + backlinks (F7 — ver seção do plano).

## 7. Teste rápido pós-deploy

```
curl -A "facebookexternalhit/1.1" https://www.nzgroup.com.br/ppf | findstr og:title
curl -i https://www.nzgroup.com.br/pagina-que-nao-existe   ← deve responder 404
https://www.nzgroup.com.br/sitemap.xml                     ← deve listar ~50+ URLs
```
E cole qualquer URL do site em https://www.opengraph.xyz para ver o cartão do WhatsApp.
