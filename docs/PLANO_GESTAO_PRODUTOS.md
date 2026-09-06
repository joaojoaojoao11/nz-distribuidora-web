# Gestão de produtos e painel administrativo — diagnóstico, revisão e plano

> **Status 2026-09-06: IMPLANTADO** (fases 4.1–4.7). Verificado em produção pelo smoke de
> mídia (20 checagens), pelo teste de navegador com Playwright (upload real: PNG de 810 kB →
> WebP de 146 kB, 1024×1024) e por `npm run midia:test` (32 checagens sem rede).
>
> **Fora do escopo entregue:** a fase 4.8 (tirar as ~230 MB de imagens estáticas do
> repositório) não foi feita — depende do "pode" do João e não muda nada para quem usa.
>
> **Ajuste de rumo na 4.1:** a coluna `midias` entrou no FIM da view `loja_catalogo`;
> `create or replace view` não aceita coluna nova no meio.
>
> Para o agente **Opus 5** executar. Diagnóstico feito em 2026-09-06 lendo o código do site
> (`nz-distribuidora-web`: `src/pages/Admin/*`, `src/pages/Loja/*`, `src/lib/shop/*`,
> `api/_lib/handlers/catalogo.ts`, `api/render.ts`), o banco do site (`uibjmvkvbthzypgozpcs`:
> `produtos`, `erp_produtos`, `loja_catalogo`, `storage.buckets/objects/policies`) e o
> tamanho real da pasta `public/`. Nada foi alterado ainda. Antecessores:
> `docs/PLANO_CHECKOUT_ASAAS.md` e `docs/PLANO_CADASTRO_CLIENTES_E_COMPRA.md` (ambos implantados).
>
> Regras que continuam valendo: nenhuma chave do ERP no bundle; preço/custo/margem nunca saem
> do ERP (a view `loja_catalogo` não tem preço — e o teste do catálogo confere isso); segredos
> nunca ecoados; endpoints novos entram como ação em `api/nz/[acao].ts` (Vercel Hobby, 12
> funções); nada de `VITE_` para segredo.

---

## 0. O pedido do João (2026-09-06)

> "A gestão do produto deve ser melhorada e completa, como um e-commerce. Hoje só dá para
> editar a foto de capa; tem que ter como subir imagens, ter orientações das imagens, subir
> pequenos vídeos manualmente — para ser um site independente, que não depende 100% de IA.
> Com a tela de gestão aberta o fundo rola junto, isso é errado. Melhorar também a usabilidade
> da área de gestão por trás do site, onde fica a aba de produtos."

---

## 1. Diagnóstico — como está hoje

### 1.1 Números

| | Valor | Comentário |
|---|---|---|
| Produtos em `produtos` | **1.292** (1.246 publicados) | 18 linhas; 1.234 com SKU do ERP |
| Com foto (`imagem`) | **297** (23%) | os outros **995** mostram só um quadrado da cor (`hex`) |
| Com galeria (2–4 fotos) | 271 | máximo 4 fotos; a capa sempre está na galeria |
| Com descrição | 284 (22%) | |
| Com título/descrição SEO | **0** | `api/render.ts` cai no fallback automático (funciona, mas ninguém nunca editou) |
| Com ficha técnica (`ficha`) | 1.292 | gerada pelo seed (código, acabamento, hex) — **não editável** no painel |
| Referências de imagem | 1.028, **0 quebradas** | todas apontam para arquivos estáticos do repositório |
| Objetos no bucket `site-assets` | **1** (27 kB) | o botão "Enviar arquivo" existe mas ninguém usou |
| `public/` no repositório | **474 MB** | 625 jpg · 263 png · 94 webp; `sh/` = 116 arquivos / 113 MB (~1 MB cada) |

**Linhas inteiras sem foto nem descrição:** Avery (282), Speed Wrapping (241), Diversos (139),
Metamark 7 (99), Oracal 651 (69), NZWRAP Import (38), M7/NAR/Next/NZ Farol/PPF cores. Só
Etherna (159/167), SH Decor (55/56), MCX (37/37) e NZWRAP (30/30) estão fotografadas; SH
Wrapping tem 6 fotos em 39 cores. Ou seja: **77% da loja é quadrado de cor**, e o painel de
hoje não oferece um caminho prático para mudar isso.

### 1.2 O editor de produto (`src/pages/Admin/AdminProdutos.tsx`, 748 linhas)

O que tem: SKU/vínculo com o ERP (próprio/alias/pendente/família), nome, subtítulo, código,
marca, linha, vertical/tipo, hex, acabamento, **uma** foto (caminho ou upload), descrição,
garantia, durabilidade, SEO, ordem, publicado/oculto. Bloco somente-leitura do ERP (preço,
estoque). Está correto no que faz.

O que **não** tem — e o e-commerce precisa:
1. **Galeria.** A coluna `galeria text[]` existe, 271 produtos têm 2–4 fotos e a vitrine
   renderiza miniaturas (`LojaProduct.tsx:95-118`), mas o editor só mexe em `imagem`. Não dá
   para adicionar, remover, reordenar nem definir qual é a capa.
2. **Vídeo.** Nada: nem coluna, nem upload, nem player na vitrine.
3. **Orientação de mídia.** Nenhuma indicação de tamanho, proporção, formato, peso, fundo.
   O upload manda o arquivo cru (`supabase.storage.upload(file)`): um PNG de 8 MB vira a
   foto da loja como está.
4. **Alt text.** Inexistente — `<img alt="">` na galeria e `alt={item.name}` na capa.
5. **Ficha técnica, badges, aplicações, acabamentos** (`ficha jsonb`, `badges[]`,
   `aplicacoes[]`, `acabamentos[]`): a vitrine mostra todos (`renderSpecs`, `badges`,
   chips), mas o editor não expõe nenhum. O único jeito de mudar é SQL.
6. **Criar produto.** O painel só edita. Produto novo nasce do sync do ERP (`erp-auto`) ou
   do seed editorial; a origem `manual` existe no `CHECK` mas não tem UI.
7. **Apagar / duplicar.** Não existe.
8. **Fundo rola junto** (a reclamação do João): o editor é um `position: fixed` com o
   formulário rolando dentro (`overflowY: auto`), mas o `<body>` não é travado —
   `overscroll` vaza para a lista atrás. Também não fecha com **Esc**, não avisa de
   alterações não salvas ao fechar/clicar fora, não tem "salvar e ir para o próximo da
   fila", e todo o estilo é inline (`style={{…}}`), fora do `Admin.module.css`.
9. **Lista de SKUs do ERP** num `<datalist>` de 1.500 itens — funciona, mas é lento e não
   mostra estoque/preço ao escolher.

### 1.3 Mídia: onde vive e como chega à loja

- **100% das fotos são arquivos estáticos do repositório** (`/assets/images/...`). Trocar a
  foto de um produto hoje significa commit + deploy. O bucket `site-assets` (Supabase
  Storage, público) está pronto para receber upload — mas com **1 objeto** em 7 meses.
- Sem redimensionar, sem converter para WebP, sem limite de peso. As fotos SH têm ~1 MB
  cada; `670ra/*.png` passam de 800 kB. A página do produto carrega a capa com
  `fetchPriority="high"` e sem `width/height/srcset` → **CLS e LCP ruins** no celular.
- `public/` com 474 MB dentro do repositório Git: cada clone e cada build carrega isso.
- A vitrine resolve capa/galeria em `src/lib/shop/adapters/erp.ts:258-273` com fallback para
  imagem genérica da linha; `ficha` → `specs`; `badges`; tudo já plugado — o gargalo é só
  o painel.

### 1.4 Segurança do Storage — corrigir antes de qualquer outra coisa

Policies em `storage.objects` hoje:
- `Permitir Upload Publico flrqo9_1` — **INSERT para `anon` e `authenticated` no
  `site-assets`**. Qualquer pessoa na internet, sem login, pode subir arquivo para o bucket
  público do site (abuso de espaço/egress, hospedagem de conteúdo alheio no domínio da NZ).
  Convive com as policies corretas (`site_assets_admin_escreve`, `nz_is_admin()`), mas RLS
  é OU: a permissiva vence.
- `Permitir upload publico de garantias pdf` — INSERT público no `warranties`, sem limite
  de tamanho nem MIME. Vem do formulário público de garantia; precisa ao menos de limite
  (5 MB, `application/pdf`).
- `site-assets`: `file_size_limit = null`, `allowed_mime_types = null`.

### 1.5 A lista de produtos

- Carrega **todos os 1.292 produtos e todo o espelho do ERP** no navegador (`lerTudo` em
  páginas de 1.000) e mostra no máximo 400 linhas. Funciona hoje; não escala e demora ~2 s
  a cada "Salvar" (recarrega tudo).
- Sem ordenação por coluna, sem seleção em massa (publicar/ocultar/mudar linha de 50 itens
  de uma vez), sem coluna de **completude** (foto? descrição? ficha? SEO?), sem export.
- As **filas** (sem conexão, sem foto, alias, inativo no ERP, criados do ERP, ocultos, com
  estoque) e a busca são bons e ficam.

### 1.6 O painel administrativo (`src/pages/Admin/Dashboard.tsx`, 804 linhas)

- **Abas em `useState`, sem rota.** `/admin` é uma URL só: F5 volta para o dashboard, não
  existe link direto para "Produtos" nem para um produto específico, o botão Voltar do
  navegador sai do painel. É a causa de fundo da sensação de "usabilidade ruim".
- **16 abas planas** na barra lateral, sem agrupamento (Leads, Páginas promocionais, Clientes,
  Produtos, Blog, Motor SEO IA, Garantias, Agência NZ, Agenda Social, Usuários, Integração
  ERP, Pedidos & Pagamentos, Afiliados, Logística, Configurações…).
- `Dashboard.tsx` mistura layout, navegação, analytics (heatmap em canvas, períodos) e
  carregamento de leads/usuários/garantias a cada montagem. Já foi reduzido em 100 linhas
  neste ciclo (Usuários e Clientes viraram componentes); continua o arquivo mais frágil.
- **Celular:** a barra vira 60 px de ícones sem rótulo (`@media 768px`); não há gaveta,
  nem cabeçalho com menu. Editar produto no celular é possível mas ruim.
- **Sem busca global** (produto por nome/SKU, pedido por número, cliente por e-mail).
- **Código morto:** `AdminProducts.tsx` (357 linhas, tabela legada `web_catalog_products`,
  146 linhas no banco) não é montado por ninguém. `web_catalog_products` ainda é lida por
  `adapters/dbSnapshot.ts` / `generated/dbSnapshot.ts` (48 kB no bundle) como "primeira
  pintura" da loja antes de `/api/nz/catalogo` responder — avaliar na fase 4.5.
- Sem atalhos de teclado, sem breadcrumbs, sem "última edição por/em" visível.

### 1.7 A vitrine (`src/pages/Loja/LojaProduct.tsx`)

Galeria com miniaturas (clicáveis) e capa grande; sem zoom, sem lightbox, sem deslizar no
celular, sem vídeo. Ficha, badges, chips de cor/acabamento, garantia/durabilidade: tudo
renderizado. SEO por produto lido em `api/render.ts:165-180` (SSR) — pronto para quando o
painel preencher.

### 1.8 Limites de plataforma que moldam o desenho

- **Vercel Hobby:** corpo de função ≤ 4,5 MB, 12 funções. Logo: upload **direto do
  navegador para o Supabase Storage** (já é assim), e todo processamento de imagem/vídeo
  **no navegador** (canvas/`<video>`), nunca numa função.
- **Supabase:** o plano não é exposto pela Management API; assumir **Free** (1 GB de
  storage, 50 MB por arquivo, sem transformação de imagem — isso é Pro). Consequências:
  imagens convertidas/redimensionadas no cliente; vídeo curto (≤ 25 MB) **ou** link
  externo; monitorar o uso do bucket no painel.
- `sharp` está nas dependências, mas só em scripts locais (`extract-chip-hex`,
  `gen-interlagos-images`) — não serve para upload em produção.

---

## 2. Decisões — recomendação embutida no plano (o João pode trocar)

| # | Decisão | Recomendação | Alternativa |
|---|---|---|---|
| D1 | Onde a mídia nova vive | **Supabase Storage**, bucket novo `produto-midia` (público, 25 MB/arquivo, MIME de imagem e vídeo). As 1.028 imagens estáticas continuam onde estão; migrá-las é fase opcional | continuar no repositório (commit por foto — rejeitado) |
| D2 | Processamento de imagem | **No navegador, antes do upload**: WebP, lado maior 1600 px, qualidade 0,82, capa com recorte 1:1 opcional; alvo 150–400 kB. Guarda largura/altura para `<img width height>` | mandar cru (rejeitado); transformação do Supabase (só Pro) |
| D3 | Vídeo | **Os dois caminhos**: upload curto (mp4/webm, ≤ 20 s, ≤ 25 MB, poster gerado no navegador) **e** link externo (YouTube/Instagram/Vimeo) que não gasta storage | só link externo |
| D4 | Modelo de dados | Tabela **`produto_midia`** (uma linha por foto/vídeo: tipo, url, poster, alt, ordem, largura, altura, duração, tamanho, capa). Trigger espelha em `produtos.imagem`/`galeria` para a vitrine e o SSR não mudarem de uma vez | crescer o `galeria text[]` (perde alt/ordem/tipo) |
| D5 | Editor | **Página com rota própria** `/admin/produtos/:slug` (e `/novo`), abas *Dados · Mídia · Ficha · ERP · SEO*, barra de salvar fixa, pré-visualização do card e da página ao lado. Resolve o fundo rolando, o F5, o link direto e o "próximo da fila" | consertar o drawer (só trava o scroll) |
| D6 | Painel | **Rotas por aba** (`/admin/:aba`), `Dashboard.tsx` dividido em layout + página inicial, menu **agrupado** (Loja · Conteúdo · Marketing · Clientes · Sistema), busca global no cabeçalho, gaveta no celular | manter `useState` |
| D7 | Orientações de mídia | Painel "Orientações" **dentro da aba Mídia** (com as specs da seção 5) + validação automática (avisa quando a foto é pequena, pesada, fora de proporção) | só um documento |
| D8 | Storage aberto | **Fechar já** (fase 4.1): remover INSERT de `anon` no `site-assets`; limitar `warranties` a PDF ≤ 5 MB | — |
| D9 | Criar/apagar | Criar produto **manual** (`origem = 'manual'`); apagar só manual/pendente sem pedido; produto do ERP nunca se apaga — oculta. Duplicar (nova cor da mesma linha) | — |
| D10 | Imagens estáticas | Fase opcional 4.8: script que sobe `public/assets/images/{decor,sh,shop,nzwrap,metamark}` para o bucket já convertidas, reescreve `produto_midia` e remove ~230 MB do repositório | deixar como está |

---

## 3. O que o João precisa fazer / passar

Nada é bloqueante. Opcional, mas vale:
1. **Confirmar o plano do Supabase** (Free ou Pro) — muda o teto do vídeo e se vale
   ligar transformação de imagem no servidor.
2. **Fotos reais das linhas sem foto**, na ordem que mais vende: SH Wrapping (33 cores sem
   foto), Speed Wrapping (241), Avery (282), Metamark 7 (99), Oracal 651 (69). Com o painel
   novo, subir é arrastar; sem foto continua o quadrado da cor.
3. Dizer se quer a fase 4.8 (tirar as imagens estáticas do repositório).

---

## 4. Plano de execução

Cada fase termina com lint + `npm run build` + testes + commit + push + verificação em
produção. Migrations do site aplicadas com `node scripts/aplicar-sql.mjs site <arquivo>`.
Ler antes de tocar: `AdminProdutos.tsx` inteiro, `adapters/erp.ts:240-310`, `LojaProduct.tsx`,
`ShopCard.tsx`, `api/render.ts:150-200`, `Admin.module.css`, `Dashboard.tsx:36-120` e `:380-460`.

### 4.1 Segurança do Storage, bucket e modelo de mídia (sem UI)

**Migration `migrations/2026-09-09_produto_midia.sql`:**
```sql
-- 1. fecha o bucket público para escrita anônima
drop policy if exists "Permitir Upload Publico flrqo9_1" on storage.objects;
update storage.buckets set file_size_limit = 5242880, allowed_mime_types = array['application/pdf'] where id = 'warranties';

-- 2. bucket de mídia de produto
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('produto-midia', 'produto-midia', true, 26214400,
        array['image/webp','image/jpeg','image/png','image/avif','video/mp4','video/webm'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
create policy produto_midia_leitura on storage.objects for select to anon, authenticated using (bucket_id = 'produto-midia');
create policy produto_midia_admin_escreve on storage.objects for insert to authenticated with check (bucket_id = 'produto-midia' and public.nz_is_admin());
create policy produto_midia_admin_atualiza on storage.objects for update to authenticated using (bucket_id = 'produto-midia' and public.nz_is_admin());
create policy produto_midia_admin_apaga on storage.objects for delete to authenticated using (bucket_id = 'produto-midia' and public.nz_is_admin());

-- 3. uma linha por mídia
create table public.produto_midia (
  id          uuid primary key default gen_random_uuid(),
  produto_id  uuid not null references public.produtos(id) on delete cascade,
  tipo        text not null check (tipo in ('imagem','video','video-externo')),
  url         text not null,               -- storage público, /assets/... legado, ou URL externa
  poster_url  text,                        -- vídeo: quadro de capa
  alt         text,
  ordem       int not null default 0,
  capa        boolean not null default false,
  largura     int, altura int, duracao_s numeric, tamanho_bytes int,
  origem      text not null default 'upload' check (origem in ('upload','estatico','externo','seed')),
  criado_por  uuid, criado_em timestamptz not null default now()
);
create index on public.produto_midia (produto_id, ordem);
create unique index produto_midia_uma_capa on public.produto_midia (produto_id) where capa;
alter table public.produto_midia enable row level security;
create policy produto_midia_admin_all on public.produto_midia for all to authenticated using (public.nz_is_admin()) with check (public.nz_is_admin());
create policy produto_midia_leitura_publica on public.produto_midia for select to anon, authenticated using (true);

-- 4. espelho: a vitrine e o SSR continuam lendo produtos.imagem / galeria
create or replace function public.nz_espelhar_midia() returns trigger language plpgsql as $$
declare pid uuid := coalesce(new.produto_id, old.produto_id);
begin
  update public.produtos p set
    imagem  = (select url from public.produto_midia m where m.produto_id = pid and m.tipo = 'imagem' order by capa desc, ordem limit 1),
    galeria = coalesce((select array_agg(url order by capa desc, ordem) from public.produto_midia m where m.produto_id = pid and m.tipo = 'imagem'), '{}')
  where p.id = pid;
  return null;
end $$;
create trigger produto_midia_espelho after insert or update or delete on public.produto_midia for each row execute function public.nz_espelhar_midia();

-- 5. importa o que já existe (1.028 refs; a capa é a primeira da galeria)
insert into public.produto_midia (produto_id, tipo, url, ordem, capa, origem)
select p.id, 'imagem', g.url, g.ord - 1, g.url = p.imagem, 'estatico'
from public.produtos p, unnest(p.galeria) with ordinality as g(url, ord)
where coalesce(array_length(p.galeria,1),0) > 0;
```
- `loja_catalogo` ganha `midias jsonb` (subselect ordenado de `produto_midia` com tipo, url,
  poster, alt, largura, altura) — a vitrine passa a ter vídeo e alt sem segunda consulta.
  `imagem`/`galeria` continuam na view.
- Teste (`scripts/test-midia.mjs`, `npm run midia:test`): a migração aplicada num banco de
  teste? Não há — então testar as funções puras do front (4.2) e, no smoke, o trigger
  (inserir mídia num produto de teste → `imagem`/`galeria` refletem; apagar → limpa).
- `api/_lib/handlers/catalogo.ts`: expõe `midias`; teste existente de "sem preço" continua.

### 4.2 Módulo de mídia (front, sem tela ainda)

`src/lib/admin/midia.ts`:
- `processarImagem(file, { ladoMax: 1600, quadrado?: boolean, qualidade: 0.82 })` →
  `{ blob: webp, largura, altura, tamanho }` via `createImageBitmap` + canvas; respeita
  EXIF (o `createImageBitmap` com `imageOrientation: 'from-image'`); rejeita < 600 px
  com mensagem clara; HEIC não suportado → mensagem "converta para JPG".
- `posterDeVideo(file)` → captura o quadro em 0,5 s num canvas → WebP; `duracao`,
  `largura`, `altura`; rejeita > 20 s ou > 25 MB.
- `nomeNoBucket(slug, tipo, ext)` → `produtos/<slug>/<yyyymmdd>-<seq>.<ext>`.
- `enviar(bucket, path, blob, onProgress)` — `supabase.storage.from().upload` (sem progresso
  nativo: usar `XMLHttpRequest` no endpoint de upload com o token da sessão para ter
  barra; fallback para `upload()`).
- `linkExterno(url)` → detecta YouTube/Vimeo/Instagram, extrai id, devolve `embedUrl` e
  `thumbnail` (YouTube: `i.ytimg.com/vi/<id>/hqdefault.jpg`).
- `avaliarMidia(m)` → avisos de orientação: "capa não é quadrada", "menor que 1000 px",
  "acima de 500 kB", "sem alt".
- Testes sem rede para tudo que é puro (nomes, link externo, avaliação, limites).

`src/components/Admin/GaleriaEditor.tsx` (+ `.module.css`):
- Zona de arrastar/soltar múltiplos arquivos + botão; fila de upload com progresso por
  item; miniaturas em grade; **reordenar arrastando** (HTML5 drag-and-drop nativo, sem
  lib; teclado: setas ← →); marcar capa (estrela); campo alt inline; remover (apaga do
  bucket quando `origem = 'upload'`); adicionar vídeo por arquivo ou por link; ícone/badge
  por tipo; contador de peso total.
- Painel lateral colapsável **"Orientações"** com a seção 5 resumida e o estado do produto
  (o que falta).
- Tudo em CSS module — zero `style={{}}`.

### 4.3 Editor de produto como página

- Rotas: `/admin/produtos` (lista), `/admin/produtos/novo`, `/admin/produtos/:slug`.
  Componentes: `src/pages/Admin/Produtos/ListaProdutos.tsx`, `EditorProduto.tsx`,
  `abas/{Dados,Midia,Ficha,Erp,Seo}.tsx`, `PreviewProduto.tsx`.
- Layout: coluna esquerda (formulário em abas), coluna direita fixa (pré-visualização do
  **card da loja** e do topo da **página do produto** com a mídia real, atualizando ao
  digitar; link "abrir na loja"). Barra inferior fixa: *Salvar · Salvar e próximo da fila ·
  Cancelar*; `Ctrl+S` salva; `Esc` volta para a lista; `beforeunload` + guarda de rota se
  houver alteração não salva.
- **Aba Dados:** o que existe hoje + `subtitulo`, `marca_exibicao`, `aplicacoes` (chips:
  automotivo, arquitetura, sinalização, decoração), `acabamentos` (chips de
  `FINISH_LABEL`), `badges` (chips livres), `hex` com conta-gotas na capa (ler pixel
  central da imagem → sugerir hex), validação de hex e slug (slug editável só em `manual`).
- **Aba Mídia:** `GaleriaEditor`.
- **Aba Ficha:** lista label/valor reordenável; botões "puxar do ERP" (largura, metragem
  padrão, unidade — de `erp_produtos`) e "modelo da linha" (ficha padrão por `linha_key`,
  definida em `src/lib/shop/fichaPadrao.ts`).
- **Aba ERP:** o bloco somente-leitura de hoje + seletor de SKU com busca (lista filtrada
  com nome, estoque e preço, sem `datalist` de 1.500) + vínculo/alias.
- **Aba SEO:** título/descrição com contador de caracteres e prévia do resultado do Google;
  botão "gerar sugestão" a partir de nome/linha/acabamento (regra local, sem IA — a IA
  continua opcional e separada).
- Ações no cabeçalho: publicar/ocultar, duplicar (mesma linha, nova cor), apagar (só
  `manual`/`pendente`, com confirmação), "ver no site", histórico (`atualizado_em`,
  `criado_por`; opcional: `produto_historico` com diff — só se sobrar tempo).
- Depois de salvar: `recarregarCatalogo()` + `fetch('/api/nz/catalogo', {cache:'reload'})`
  para o CDN não servir 5 min de catálogo velho ao próprio admin.

### 4.4 Lista de produtos

- Busca **no servidor** (RPC `produtos_buscar(q, fila, linha, ordem, offset, limite)` que
  devolve produto + colunas do ERP + `midia_count` + `completude`), páginas de 50, ordenação
  por coluna (nome, linha, estoque, preço, atualizado), estado na URL (`?q=&fila=&linha=&p=`).
- Coluna **Completude** (barra 0–5: foto, galeria ≥ 2, descrição, ficha ≥ 3 itens, SEO) e
  fila nova "Incompletos". Miniatura maior (48 px) com ícone de vídeo quando houver.
- **Seleção em massa**: publicar/ocultar, mudar linha/vertical, aplicar ficha padrão,
  exportar CSV dos selecionados. Cada ação em lote passa por `supabase.from('produtos').update().in('id', …)` com confirmação e contagem.
- Botão **"+ Novo produto"**.
- Atalhos: `/` foca a busca, `Enter` abre o primeiro, `j/k` navega.

### 4.5 Painel administrativo — navegação e estrutura

- `src/pages/Admin/AdminLayout.tsx` (barra lateral + cabeçalho + `<Outlet/>`) e rotas
  aninhadas em `App.tsx`: `/admin` (início), `/admin/pedidos`, `/admin/produtos/*`,
  `/admin/clientes`, `/admin/usuarios`, `/admin/blog`, … Redirecionar `?tab=` antigo se
  existir em algum link. `Dashboard.tsx` vira `AdminHome.tsx` (só métricas/analytics).
- Menu **agrupado e colapsável** (persistir no `localStorage`):
  *Loja* — Produtos · Pedidos & Pagamentos · Logística · Integração ERP · Afiliados & Cupons;
  *Conteúdo* — Blog · Motor SEO IA · Páginas promocionais · Catálogo PDF;
  *Marketing* — Agência NZ · Agenda Social · Leads;
  *Clientes* — Clientes & Revendedores · Garantias;
  *Sistema* — Usuários · Configurações.
  Badges de pendência continuam (clientes aguardando, garantias, promo).
- Cabeçalho: **busca global** (`Ctrl+K`): produto (nome/SKU/código), pedido (nº), cliente
  (e-mail/nome) → navega. Breadcrumb `Loja › Produtos › Bentley PINK`.
- **Celular:** gaveta lateral com rótulos (botão ☰ no cabeçalho), tabelas com rolagem
  horizontal já existente, editor em coluna única (preview vira aba).
- Limpeza: apagar `AdminProducts.tsx`; verificar `web_catalog_products` — se
  `SHOP_ITEMS`/`dbSnapshot` ainda for a primeira pintura da loja, manter; senão remover os
  48 kB do bundle e a tabela fica só documentada como legado.
- Trava de scroll reutilizável (`useScrollLock`) para qualquer modal que sobrar (Logística,
  Blog) — o problema do fundo rolando não é só do editor de produto.

### 4.6 Vitrine — consumir a mídia nova

- `adapters/erp.ts`: `midias` → `item.media: {tipo, url, poster, alt, largura, altura}[]`;
  `image`/`gallery` derivados dela (com o fallback genérico de hoje).
- `LojaProduct.tsx`: galeria com **deslizar** no celular (scroll-snap), **lightbox** com
  zoom (pinch) — sem lib, ou `yet-another-react-lightbox` se a implementação nativa não
  ficar boa; vídeo curto `playsInline muted loop` com poster e botão de som; vídeo externo
  em `<iframe>` lazy; `<img width height srcset sizes alt>` para acabar com o CLS.
- `ShopCard.tsx`: capa com `width/height`, badge ▶ quando há vídeo.
- `api/render.ts`: `og:image` = capa da mídia (já é `imagem`, continua); `og:video` quando houver.

### 4.7 Verificação e entrega

- `npm run midia:test` (puro), `npm run checkout:test`, `npm run conta:test`, `npm run frete:test`,
  lint, build, `tsc -p api`.
- Smoke em produção (scratchpad, admin temporário): cria produto manual de teste → sobe 2
  imagens (uma PNG grande, confere que virou WebP ≤ 400 kB e com largura/altura) + 1 vídeo
  curto (poster gerado) + 1 link YouTube → reordena → define capa → `produtos.imagem/galeria`
  refletem (trigger) → `/api/nz/catalogo` traz `midias` sem campo `preco` → página `/loja/<slug>`
  renderiza galeria e vídeo → apaga tudo (bucket inclusive). Teste de segurança: `anon`
  tentando `upload` em `site-assets` e `produto-midia` → recusado.
- Playwright (iPhone 13 + 1360 px): lista, editor (3 abas), preview, lightbox na loja,
  menu do admin no celular.
- Docs: este arquivo com status; `docs/MIDIA_PRODUTOS.md` (a seção 5 em versão para a
  equipe); memória do projeto.

### 4.8 Opcional — tirar as imagens estáticas do repositório

Script `scripts/migrar-imagens-para-storage.mjs`: para cada `produto_midia` com
`origem = 'estatico'`, lê o arquivo em `public/`, converte com `sharp` (WebP 1600 px),
sobe para `produto-midia`, atualiza `url` e `largura/altura`, e no fim apaga os arquivos
de `public/assets/images/{decor,sh,shop,nzwrap,metamark}` que não são referenciados por
mais nada (checar com `grep -r` nos `.tsx/.ts/.css/.md`). Estimativa: repositório perde
~230 MB; primeira carga da loja cai de ~1 MB por foto para ~250 kB.

### 4.9 Ordem e commits sugeridos

1. `fix(storage): fecha upload anonimo no site-assets e limita warranties` (4.1, parte 1 — **primeiro de tudo**)
2. `feat(midia): bucket produto-midia, tabela produto_midia, espelho em produtos e importacao das 1.028 imagens` (4.1)
3. `feat(midia): processamento no navegador, upload com progresso, GaleriaEditor e orientacoes` (4.2)
4. `feat(admin): editor de produto como pagina, com abas, preview, ficha/badges/aplicacoes e criar/duplicar/apagar` (4.3)
5. `feat(admin): lista de produtos paginada, completude, acoes em massa` (4.4)
6. `feat(admin): rotas por aba, menu agrupado, busca global, gaveta no celular; remove AdminProducts` (4.5)
7. `feat(loja): galeria com lightbox e swipe, video curto e externo, img com dimensoes` (4.6)
8. `docs: plano marcado como implantado` (4.7) · 4.8 só com "pode" do João.

---

## 5. Orientações de mídia (vão para a aba Mídia e para `docs/MIDIA_PRODUTOS.md`)

| Mídia | Proporção / tamanho | Formato e peso | O que mostrar |
|---|---|---|---|
| **Capa** (card e topo da página) | **1:1**, mínimo 1000×1000, ideal 1200×1200 | WebP (o painel converte), ≤ 300 kB | O material em si: rolo, amostra ou aplicação bem enquadrada; fundo neutro; a cor real sob luz branca; sem texto, sem logo de terceiro, sem marca d'água |
| **Galeria** (2 a 8 fotos) | **4:3** ou 3:2, mínimo 1200 px no lado maior, ideal 1600 | WebP, ≤ 400 kB | Aplicação em carro/parede/vitrine, detalhe de textura, comparação de acabamento; 1 foto por ângulo; ordem: aplicação geral → detalhe → ambiente |
| **Padrões (Decor/Etherna)** | capa 1:1 da textura plana + 1 foto de ambiente | idem | Textura em escala real (mostrar a repetição), ambiente iluminado |
| **Vídeo curto** | 9:16 (Reels) ou 16:9; 1080p; **≤ 20 s**; ≤ 25 MB | MP4 (H.264) ou WebM; áudio opcional (toca mudo) | Aplicação, brilho em movimento, resistência (água/risco). O painel gera o quadro de capa |
| **Vídeo externo** | qualquer | link YouTube / Vimeo / Instagram | Não gasta storage; usar para vídeos longos |
| **Alt (texto alternativo)** | 6–14 palavras | — | "Rolo de SH Wrapping Bentley Pink metálico brilhante" — acessibilidade e Google Imagens |

Não fazer: foto de catálogo do fornecedor com logo; print de tela; foto com dedo/sombra do
celular; cor editada além do real (o cliente compara com a amostra física).

---

## 6. Riscos e limites

- **Storage Free** (se for o caso): 1 GB. 1.000 fotos WebP de 300 kB = 300 MB; vídeos de
  15 MB × 30 = 450 MB. Mostrar o uso do bucket na aba Mídia e avisar a 80%.
- Converter no navegador depende do dispositivo: no celular antigo, uma PNG de 20 MB pode
  travar a aba; limitar entrada a 25 MB e processar um por vez.
- O trigger de espelho mantém `imagem/galeria` coerentes, mas **scripts antigos**
  (`migrar-catalogo-editorial.mjs`, seeds) que escrevem `galeria` direto passam a ser
  sobrescritos na próxima edição de mídia — documentar e, se rodarem de novo, gravar em
  `produto_midia`.
- Mudar `/admin` para rotas quebra links salvos? Não existem (era uma URL só). O
  `ProtectedRoute` continua no layout.
- Vídeo com `autoplay muted` é ignorado em modo economia de bateria no iOS — o poster
  cobre.
- Apagar produto: a FK de `pedido_itens` protege (só manual/pendente sem itens); o resto
  é ocultar.
