# Operação de SEO — nzgroup.com.br

Guia prático pós-implantação do SEO v2 (agosto/2026). O que é automático já está rodando; o que precisa de você está marcado com ⚠️.

---

## ⚠️ 1. Google Search Console (fazer 1 vez, ~10 min) — O MAIS IMPORTANTE

Sem isso o Google indexa "no escuro" e você não vê o resultado do trabalho.

1. Acesse https://search.google.com/search-console e entre com a conta Google da empresa.
2. Clique em **Adicionar propriedade** → escolha o tipo **Domínio** → digite `nzgroup.com.br`.
3. O Google vai mostrar um registro **TXT** (algo como `google-site-verification=xxxx`).
4. No painel onde o domínio foi registrado (Registro.br, GoDaddy etc.), abra a **zona DNS** e crie um registro **TXT** no domínio raiz com esse valor.
5. Volte ao Search Console e clique **Verificar** (pode levar até 1h para o DNS propagar).
6. Depois de verificado: menu **Sitemaps** → adicionar `https://www.nzgroup.com.br/sitemap.xml` → Enviar.
7. Em 2–4 semanas, acompanhe em **Indexação → Páginas** (cobertura) e **Desempenho** (cliques/impressões por palavra).

## ⚠️ 2. Bing Webmaster Tools (~2 min, depois do passo 1)

1. Acesse https://www.bing.com/webmasters e entre com qualquer conta Microsoft.
2. Use a opção **Importar do Google Search Console** — ele puxa tudo, incluindo o sitemap.

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
4. **Segurança Supabase**: a tabela `configuracoes_nz` está com RLS desabilitado (qualquer pessoa com a chave pública consegue ler/alterar). Corrigir com uma policy de admin — pedir ao Claude na próxima sessão.

## 7. Teste rápido pós-deploy

```
curl -A "facebookexternalhit/1.1" https://www.nzgroup.com.br/ppf | findstr og:title
curl -i https://www.nzgroup.com.br/pagina-que-nao-existe   ← deve responder 404
https://www.nzgroup.com.br/sitemap.xml                     ← deve listar ~50+ URLs
```
E cole qualquer URL do site em https://www.opengraph.xyz para ver o cartão do WhatsApp.
