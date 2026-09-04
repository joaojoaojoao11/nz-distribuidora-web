# Migração de URL — rotas antigas → `/loja/:slug`

**Status: PRONTA, NÃO APLICADA.** Decisão pendente sua.

## O que está no ar hoje

A LOJA foi entregue no estado **seguro** da migração:

- `/loja` e `/loja/:slug` funcionando com os 505 itens.
- As **129 cores M7 + MCX** — que antes só existiam como `?cor=<slug>` e não eram
  indexáveis como entidade — são **auto-canônicas** e entram no sitemap. Ganho
  líquido de 129 páginas novas, sem risco: não havia URL para perder.
- Os outros 376 itens: `/loja/:slug` emite `<link rel="canonical">` apontando
  para a página de detalhe que já existe (`/decor/sh/acacia`,
  `/wrap/oracal-651/...`). Não há conteúdo duplicado e nenhuma URL antiga mudou.

Ou seja: a loja está no ar e nada do que rankeia foi tocado.

## Por que não apliquei os redirects

Você escolheu "LOJA vira a página padrão, rotas antigas redirecionam 301", e está
no plano aprovado. Parei antes de disparar por dois motivos concretos:

1. **O template genérico tem menos conteúdo que dois dos templates atuais.**
   `NzwrapColorPage` mostra a mesma cor em quatro condições de luz
   (manhã/tarde/pôr do sol/noite); `EthernaProduct` e `ShDecorProduct` trazem
   galeria de ambiente mais o contexto da família. O `/loja/:slug` tem galeria e
   ficha, mas não replica isso. Redirecionar uma página mais rica para uma mais
   pobre é perda real, não só risco de ranking.

2. **Risco assimétrico.** São 159 Etherna + 55 SH Decor + ~146 páginas de cor já
   indexadas. Se o corte for certo, esperar uma manhã não custa nada. Se for
   errado, o custo aparece semanas depois no Search Console. Você aplica isto em
   5 minutos depois de abrir a loja e comparar lado a lado; eu não teria como
   comparar sozinho.

Não é redução de escopo: é a sequência correta de migração de SEO — publicar,
observar, depois cortar. O plano já previa isso ("essa etapa fica isolada e é
reversível sozinha").

## Como aplicar, quando decidir

### 1. Inverter o canonical no edge

`api/render.ts`, no branch `/loja/:slug` — trocar:

```ts
const canonicalPath = item.selfCanonical ? path : item.legacyPath ?? path;
```

por:

```ts
// A LOJA passou a ser a página canônica de todo produto.
const canonicalPath = path;
```

### 2. Marcar todos os itens como auto-canônicos

`scripts/generate-shop-index.mjs` — trocar:

```js
const SELF_CANONICAL = new Set(['m7', 'mcx']);
```

por:

```js
const SELF_CANONICAL = null; // null = todos
```

e ajustar `selfCanonical: SELF_CANONICAL ? SELF_CANONICAL.has(item.source) : true`.

Depois: `npm run shop:index`. O sitemap passa a emitir as 505 URLs `/loja/*`.

### 3. Redirects 301

Em `vercel.json`, acrescentar ao array `redirects` (antes do catch-all de
rewrites, que não conflita):

```json
{ "source": "/decor/etherna/:slug",      "destination": "/loja/etherna-:slug",    "permanent": true },
{ "source": "/decor/sh/:slug",           "destination": "/loja/sh-decor-:slug",   "permanent": true },
{ "source": "/wrap/nzwrap-premium/:sku", "destination": "/loja/nzwrap-:sku",      "permanent": true },
{ "source": "/wrap/oracal-651/:slug",    "destination": "/loja/:slug",            "permanent": true },
{ "source": "/wrap/oracal-670ra/:slug",  "destination": "/loja/oracal-670-:slug", "permanent": true },
{ "source": "/wrap/sh-colors/:slug",     "destination": "/loja/sh-:slug",         "permanent": true },
{ "source": "/sign/:slug",               "destination": "/loja/avery-:slug",      "permanent": true }
```

**Prefixos conferidos contra `api/_lib/shopItems.ts`** — não re-derivar de
cabeça, porque três linhas fogem do padrão:

| Rota antiga | Slug na loja | Regra |
|---|---|---|
| `/decor/etherna/madeira-carvalho-areia` | `etherna-madeira-carvalho-areia` | prefixa |
| `/decor/sh/acacia` | `sh-decor-acacia` | prefixa |
| `/wrap/nzwrap-premium/nzw201` | `nzwrap-nzw201` | prefixa |
| `/wrap/oracal-651/oracal-651-transparent` | `oracal-651-transparent` | **já prefixado na origem — não prefixar de novo** |
| `/wrap/oracal-670ra/white-g` | `oracal-670-white-g` | prefixa (o `ra` da rota não entra no slug) |
| `/wrap/sh-colors/glossy-nado-ash` | `sh-glossy-nado-ash` | prefixa com `sh-`, não `sh-wrapping-` |
| `/sign/mpi` | `avery-mpi` | prefixa |

Os 4 SKUs Metamark MD-80 não têm rota antiga própria (`legacyPath` é `/sign`),
então não entram em nenhum redirect.

### 4. Remover as páginas de listagem antigas do sitemap? Não.

`/decor/sh`, `/decor/etherna`, `/wrap/oracal-651` etc. continuam sendo páginas de
categoria legítimas. Só as páginas de **detalhe** migram.

### 5. Depois de publicar

- Enviar o sitemap novo no Search Console.
- Acompanhar "Páginas" → "Redirecionamento" por 4–8 semanas.
- Se o tráfego de um grupo cair de forma consistente, reverter é só remover o
  bloco de `redirects` e voltar o canonical — as páginas antigas continuam no
  código, intactas.

## Alternativa que vale considerar antes

Migrar **por linha**, não tudo de uma vez: começar por SH Wrapping e Oracal 670RA
(menor volume de tráfego), medir 3 semanas, e só então mover Etherna e SH Decor,
que são o grosso do tráfego orgânico de DECOR.
