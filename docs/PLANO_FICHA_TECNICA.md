# Ficha técnica e conteúdo de produto na LOJA

> Pedido do João (2026-09-07): *"trabalhar a parte de ficha técnica e infos
> extras dentro das páginas dos produtos, basta por linha ter uma ficha técnica
> similar, disponíveis no geral nos sites mães. No nosso site mesmo tem muita
> coisa pronta, basta organizar certinho, linha por linha, e disponibilizar
> essas informações, como texto de venda, ficha técnica, e ficha técnica
> baixável."*
>
> Este documento é o plano. **Nada foi alterado no código ainda.** Todos os
> números abaixo foram medidos no banco de produção em 07/09/2026, não
> estimados.

---

## 0. O que a medição mostrou

```
1.292 produtos cadastrados · 1.246 publicados
  505 têm alguma ficha técnica          (39%)
  284 têm texto de venda                (22%)
  787 estão publicados com ficha VAZIA  (63% do que está no ar)
```

E o que existe está guardado de um jeito que trabalha contra a gente:

| Linha | Produtos com ficha | Fichas **distintas** | Leitura |
|---|---:|---:|---|
| Etherna | 159 | **4** | a mesma ficha da linha, copiada 159 vezes — e já divergiu em 4 versões |
| SH Decor | 55 | **5** | mesmo caso |
| MD-80 | 4 | **1** | mesmo caso |
| Metamark 7 | 92 | 92 | correto: cada cor tem hex/RGB/CMYK/Pantone próprios |
| Oracal 651 | 62 | 62 | correto |

Isso é o diagnóstico inteiro em duas linhas: **a Etherna tem uma ficha só, e ela
está gravada 159 vezes.** Corrigir "durabilidade externa: 4 anos" hoje são 159
UPDATEs — e ninguém consegue afirmar que as 159 estão iguais, porque não estão.

---

## 1. O erro estrutural: dois tipos de dado na mesma coluna

`produtos.ficha` (jsonb) carrega hoje, misturados:

**Ficha da LINHA** — igual para todas as cores do mesmo filme.
Espessura, material base, adesivo, liner, durabilidade, temperatura de
aplicação e de serviço, classificação de fogo, laminação recomendada,
certificações, origem. É isto que os sites-mãe publicam, e é o que o João
descreveu: *"por linha ter uma ficha técnica similar"*.

**Ficha da VARIANTE** — muda de cor para cor.
Código/SKU, hex, RGB, CMYK, Pantone®, acabamento, largura real do rolo,
metragem, nível de estoque.

São coisas de natureza diferente: uma é escrita uma vez por ano quando o
fabricante revisa o TDS; a outra nasce junto com cada SKU. Guardadas na mesma
coluna, a primeira vira cópia e a segunda vira digitação.

---

## 2. O modelo: quatro camadas, uma herança

```
┌─ D. AUTOMÁTICO DO ERP ─────────── largura, metragem, área, unidade, estoque
├─ C. FICHA DA LINHA ────────────── espessura, adesivo, durabilidade, TDS…
├─ B. FICHA DA SUB-FAMÍLIA ──────── só onde a linha comercial agrupa filmes ≠
└─ A. FICHA DA VARIANTE ─────────── código, hex, RGB, CMYK, Pantone, acabamento
                                     ↑ mais específico ganha
```

Regra de precedência, do mais forte ao mais fraco: **A > D > B > C**.
Variante manual vence tudo (é a exceção conferida à mão). Depois vem o dado do
ERP, porque "largura 1,52 m" medida no SKU é mais verdadeira que "larguras
disponíveis: 1,22 m e 1,52 m" escrita na linha. Colisão de rótulo resolve por
`label` normalizado — a linha nunca duplica uma linha que a variante já trouxe.

### Camada C — tabela nova `linhas`

Não existe hoje. O conteúdo de linha vive espalhado em arquivos `.ts` e copiado
dentro dos produtos. Proposta:

```sql
create table public.linhas (
  linha_key      text primary key,     -- 'etherna', 'md80', …
  label          text not null,
  marca_key      text,
  ficha          jsonb not null default '[]',   -- [{label, value}]
  chamada        text,        -- 1 frase: card, meta description
  descricao      text,        -- 1 parágrafo: topo da página do produto
  texto_venda    text,        -- bloco longo: "Sobre a linha", markdown
  aplicacoes     text[],
  cuidados       text,        -- aplicação, limpeza, remoção
  tds_url        text,        -- PDF do fabricante, quando existir
  fonte_url      text,        -- de onde vieram os números
  conferido_em   date,
  conferido_por  uuid references auth.users(id),
  atualizado_em  timestamptz not null default now()
);
```

Os três últimos campos não são burocracia. A ficha técnica é o documento que o
aplicador imprime e segue: `fonte_url` + `conferido_em` é o que permite,
daqui a um ano, responder "de onde saiu esse 190 micras?" sem abrir o site do
fabricante de novo. O `metamarkMd80.ts` já faz exatamente isso num comentário
— e foi assim que se descobriu que o briefing interno trazia SKUs errados
("MD-V80" não existe no catálogo Metamark). Este plano só generaliza uma
disciplina que já provou valor no repositório.

### Camada B — sub-família, e por que ela é obrigatória

`linha_key` foi criada para resolver **perfil de embalagem no frete**, não
ficha técnica. Em duas linhas ela é grossa demais:

| Linha | Produtos | O que tem dentro |
|---|---:|---|
| `avery` | 288 | AAT (258) = Ad Color · UWF (23) = wrap film · AVCV (1) |
| `speed-wrapping` | 241 | **20 famílias** pelo prefixo: SPWESG (37), SPWEMT (25), SPWEDG (23), SPWEMG (17), SPWEMA (17), SPWEFG (15), SPWEGL, SPWEHM, SPWECH, SPWECC, SPWEMR… |
| `diversos` | 139 | VINYLFROG (76), NZ (50), MACTAC (11), POKER (1), **"Teste" (1)** |

Uma ficha só para as 241 Speed Wrapping seria falsa: cromado, fosco e forjado
não têm a mesma espessura nem a mesma durabilidade. O prefixo do SKU já
carrega a família — mas **derivar sozinho não basta**: o prefixo é pista, a
família é decisão. A proposta é uma tabela irmã `linha_familias`
(`linha_key`, `familia_key`, `prefixos text[]`, mesmos campos de conteúdo),
preenchida com curadoria e revisada no painel.

Estimativa: as 18 linhas viram **≈ 45 fichas** — ainda 45 documentos para
cobrir 1.292 produtos.

### Camada D — o que nunca deve ser digitado

Os 1.206 SKUs do ERP têm largura e metragem preenchidas, 100%. Viram linhas de
ficha automáticas:

```
Largura            1,52 m
Metragem do rolo   17 m
Área do rolo       25,84 m²
Venda              por metro linear
```

**Armadilha real, encontrada na medição:** quando `unidade = 'M2'`, o campo
`metragem_padrao` guarda **área, não comprimento**. Há 64 SKUs com
`1,52 × 22,86 M2` — 22,86 é m², não metros (1,524 × 15 = 22,86). Renderizar
"metragem do rolo: 22,86 m" seria publicar um número errado em 174 produtos.
A conversão precisa olhar `unidade` antes de escolher o rótulo.

### Herança de alias

25 produtos são `tipo_vinculo = 'alias'` (NZWRAP apontando para SH Wrapping).
Alias herda a ficha da linha do pai e mantém a sua própria variante. O campo
`alias_de` já existe; falta só o merge usar.

---

## 3. Linha por linha — o que já está pronto no repositório

Esta é a parte do pedido *"no nosso site mesmo tem muita coisa pronta"*. Está,
e é bastante:

| # | Linha | Prod. | Ficha hoje | Onde o conteúdo já existe | Falta |
|--:|---|--:|--:|---|---|
| 1 | **Avery Dennison** | 288 | 6 | `src/pages/Sign/averyLines.ts` — 6 famílias com `specs`, `longDescription`, `applications`, `features`, `subLines` | ligar às 288; separar AAT/UWF |
| 2 | **Speed Wrapping** | 241 | 0 | — (só as fotos ECH/EOX) | **origem**: confirmar se há TDS do fabricante |
| 3 | **Etherna Decor** | 168 | 159 | `src/pages/Decor/ethernaProducts.ts` (8.139 linhas) + `Mostruario_Completo_Fevereiro_2026 etherna.pdf` | extrair a ficha da linha das 159 cópias |
| 4 | **Diversos** | 139 | 0 | — | **triagem antes de ficha** (§9, Fase 0) |
| 5 | **Metamark 7** | 99 | 92 | `src/lib/data/metamark7Colors.ts` — hex/RGB/CMYK/Pantone por cor | ficha da linha (só a variante existe) |
| 6 | **Oracal 651** | 69 | 62 | **`public/assets/docs/oracal-651-tds.pdf` — TDS oficial já hospedado** | transcrever o TDS para a ficha da linha |
| 7 | **SH Decor** | 56 | 55 | `src/pages/Decor/shDecorProducts.ts` (2.871 linhas) + `catalogo-2025 i shdecor.pdf` | extrair a ficha da linha |
| 8 | **SH Wrapping** | 39 | 30 | `src/lib/data/shWrappingAssets.ts` + banco | ficha da linha completa (as 30 têm 3–4 campos) |
| 9 | **NZWRAP Import** | 38 | 0 | — | origem |
| 10 | **MetaCast MCX** | 37 | 37 | `src/lib/data/metamarkMcxColors.ts` + `generated/mcxChipHex.ts` | ficha da linha (MetaGlide®/MetaSure™ está só como badge) |
| 11 | **NZWRAP Premium** | 30 | 30 | `src/lib/data/nzwrapColors.ts` | ficha da linha — **marca própria, a ficha somos nós** |
| 12 | **Oracal 670RA** | 25 | 24 | banco | ficha da linha (TDS ORAFOL) |
| 13 | **NZPPF** | 24 | 6 | **6 arquivos** `src/pages/Ppf/*Data.ts` com `tabelaTecnica` completa por sub-linha | ligar os 18 SKUs do ERP às 6 sub-linhas editoriais |
| 14 | **NZ Farol** | 13 | 0 | `src/pages/Ppf/headlightData.ts` + página `/ppf/headlight` | só ligar — o conteúdo existe |
| 15 | **NAR PPF** | 11 | 0 | — | origem |
| 16 | **Avery AD Pro** | 9 | 0 | — (PPF da Avery, fora do `averyLines.ts`) | origem |
| 17 | **Metamark MD-80** | 4 | 4 | `src/pages/Sign/metamarkMd80.ts` — **16 linhas conferidas em 12/08/2026** | é o padrão-ouro; só mover para a tabela |
| 18 | **SHNext** | 2 | 0 | — | origem |

**Somando: 11 linhas com conteúdo já escrito cobrem 839 produtos (65%).**
As 7 sem nada cobrem 453 (35%) — e dessas, 5 são importações espelhadas do ERP
cujo "site mãe" pode simplesmente não existir em português.

O caso 13/14 merece nome: a NZPPF tem seis páginas editoriais ricas
(`/ppf/luxury-gloss`, `prime`, `flow`, `core`, `windshield`, `headlight`) com
tabela técnica, diferenciais e portfólio em PDF — e os 24 produtos da loja com
o mesmo nome mostram ficha vazia. **Não falta conteúdo; falta a ponte.**

---

## 4. Cor por cor — o que é variante

Cinco campos, e a fonte de cada um:

| Campo | De onde vem | Cobertura hoje |
|---|---|---|
| Código / SKU | ERP | 1.206 |
| Hex | catálogo do fabricante ou chip da imagem | M7, MCX, Oracal, SH, NZWRAP |
| RGB · CMYK · Pantone® | só Metamark publica | 92 (M7) |
| Acabamento | `acabamento_label` + `acabamentos[]` | parcial |
| Largura · metragem | ERP, automático | 1.206 |

Dois cuidados que a medição expôs:

**Hex é referência, não amostra.** A página já diz isso (`colorNote`), e a
ficha baixável precisa repetir: cor em tela não fecha aprovação. Onde
`colorConfidence = 'inferida'` (hex tirado da foto), a linha da ficha tem que
sair marcada — hoje só o chip da página avisa.

**Nome de cor não é chave.** `nz-farol` tem três SKUs chamados "Light Gray"
(NZPJ8, NZPJ4, NZPCA06) que se distinguem pela largura. Na ficha, a largura
precisa aparecer alta na ordem, ou o cliente pede o rolo errado.

---

## 5. Texto de venda — três blocos, uma regra

| Bloco | Tamanho | Onde | Nível |
|---|---|---|---|
| Chamada | 1 frase (≤ 155 car.) | card, `<meta description>`, WhatsApp | variante |
| Descrição | 1 parágrafo | topo da página, ao lado da foto | variante quando houver, senão linha |
| Sobre a linha | 3–6 parágrafos | abaixo da ficha, recolhível | linha |

Hoje `descricao` existe em 284 produtos e o campo "Sobre a linha" não existe.
A Etherna e a SH Decor já têm descrição por cor (159 e 55, todas distintas) —
essas ficam. As linhas onde nenhuma cor tem texto (M7, MCX, Oracal, NZWRAP,
Speed Wrapping) recebem o texto **da linha**, e cada cor herda. Escrever 99
textos diferentes para 99 tons do mesmo filme seria produzir 99 variações do
nada.

### A regra que vale para os três blocos

Número só entra com origem. Isso não é preciosismo: a ficha baixável é um
documento que circula por WhatsApp, chega ao concorrente e é comparada com o
TDS do fabricante.

**Um ponto que precisa de decisão sua antes da Fase 2:** o
`luxuryGlossData.ts` traz um `benchmarkData` com números precisos comparando
"NZ" contra "mercado" (retenção de brilho 99,5 vs 95,0; auto-cura 99,0 vs 96,5;
etc.) e um "+32% de brilho". Não há no repositório nenhuma referência a ensaio,
laboratório ou data que sustente esses valores. Numa página de marketing isso
já é discutível; dentro de um **PDF chamado "ficha técnica"**, com a marca NZ no
cabeçalho, vira declaração técnica — e é exatamente o terreno do CDC art. 37.
Duas saídas honestas: anexar a origem do ensaio, ou manter esses números fora
do PDF e da ficha, deixando-os na página como comunicação. Não vou levar esses
valores para a ficha baixável sem você me dizer de onde vieram.

---

## 6. Ficha técnica baixável

Duas fontes, e as duas cabem:

**a) TDS do fabricante** — quando existe, é o documento com mais autoridade.
Já temos um (`oracal-651-tds.pdf`) e ele já é linkado em duas páginas. Vira
`linhas.tds_url` e aparece como link secundário: *"TDS oficial ORAFOL (PDF)"*.

**b) Ficha NZ gerada** — uma página A4 montada a partir dos mesmos dados que a
tela mostra, para os 1.292. É o caminho principal, por três motivos: cobre
todo o catálogo, nunca diverge da página (mesma fonte), e sai com a marca NZ
na mão do cliente.

O repositório **já tem a máquina**: `src/pages/Ppf/generatePpfPortfolioPdf.ts`
(jsPDF + html2canvas, A4 a ~300 DPI, montagem página a página para segurar
memória) roda em produção para o portfólio NZPPF. A ficha de produto é o caso
fácil dela: uma página só.

Layout proposto (1 página):

```
┌──────────────────────────────────────────────┐
│ NZ GROUP · FICHA TÉCNICA        07/09/2026   │
├──────────────────────────────────────────────┤
│  [foto/swatch]   Nome do produto             │
│                  Código · Linha · Marca      │
├──────────────────────────────────────────────┤
│  ESTE PRODUTO          │  A LINHA            │
│  Código      NZP08     │  Espessura   190µ   │
│  Acabamento  Gloss     │  Base    TPU alif.  │
│  Largura     1,52 m    │  Garantia   12 anos │
│  Metragem    15 m      │  …                  │
├──────────────────────────────────────────────┤
│  Aplicação e cuidados                        │
│  Fonte: <fabricante> · conferido em <data>   │
│  [QR → nzgroup.com.br/loja/<slug>]  wa.me/…  │
│  Cor em tela é referência. Valores sob consulta. │
└──────────────────────────────────────────────┘
```

Três decisões embutidas:
- **Gerado no navegador**, não numa função serverless. A Vercel Hobby está com
  as 12 funções ocupadas; e o PDF só faz sentido sob clique.
- **Sem preço, nunca.** Nem "sob consulta" com número ao lado. A ficha circula.
- **Data de geração no cabeçalho** + `conferido em` no rodapé: são datas
  diferentes e as duas importam.

---

## 7. Painel administrativo

Uma aba nova em Admin → Produtos: **Linhas** (18 cartões, ou 45 com
sub-famílias). O editor de ficha da linha reaproveita literalmente o componente
que já existe no `AdminProdutoEditor.tsx` (`fichaAdd`/`fichaSet`/`fichaMover`)
— mesma UI, outro alvo.

Três coisas que o cartão da linha precisa mostrar:

1. **"Esta ficha aparece em 288 produtos"** — antes de salvar. É o que
   transforma uma edição descuidada em uma decisão consciente.
2. **Extrair da variante → linha**: botão que lê as fichas dos produtos da
   linha, mostra as linhas idênticas em ≥ 80% deles e oferece promovê-las para
   a linha, removendo as cópias. É o migrador da Etherna e da SH Decor, feito
   com conferência humana em vez de script cego.
3. **Conferência**: `fonte_url`, `conferido_em`, quem conferiu. Ficha sem fonte
   sai com um aviso discreto no painel — não no site.

E um relatório simples: **cobertura por linha**, a mesma tabela do §3 gerada ao
vivo. É como se acompanha o avanço sem perguntar.

---

## 8. Como fica a página do produto

O `LojaProduct.tsx` já tem a regra certa (*"cada bloco devolve `null` quando o
dado não existe"*). A ficha passa a ser dois grupos dentro do mesmo `<dl>`:

```
FICHA TÉCNICA
  Código           NZP08            ← variante
  Acabamento       Clear Gloss
  Largura          1,52 m           ← ERP
  Metragem         15 m
  ─────────────────────────────────
  NZPPF Luxury Gloss · vale para toda a linha    ← linha, discreto
  Espessura        190 micras
  Material base    TPU alifático
  Garantia         12 anos
  …
  ↓ Ver ficha completa (16 itens)   ← acima de 8, o resto vem recolhido

[ Baixar ficha técnica (PDF) ]  [ TDS oficial ORAFOL ↗ ]

SOBRE A LINHA          ← texto de venda longo, recolhido, só se existir
APLICAÇÃO E CUIDADOS   ← só se existir
```

Nenhum bloco novo aparece vazio, e a ordem da página não muda: ficha →
avaliações → relacionados. No celular o `<dl>` vira lista empilhada, como já é.

---

## 9. Fases

**Fase 0 — triagem (antes de qualquer ficha).**
Os 139 de "diversos" incluem um produto chamado **"Teste"** e uma **"Mochila
Pulverizadora"**, os dois publicados. Ferramenta não tem ficha de filme;
"Teste" não devia estar no ar. Separar: ferramentas/acessórios (categoria
própria, ficha diferente), filmes de marca terceira (VINYLFROG 76, MACTAC 11 →
linhas próprias), lixo (despublicar). Sem isso, qualquer contagem de cobertura
fica mentindo. *Cobertura: −5 produtos que não deviam contar.*

**Fase 1 — estrutura.** Migração (`linhas`, `linha_familias`), merge das quatro
camadas no adapter, precedência, herança de alias, ERP automático (com o
cuidado do M2), UI da página, aba do painel. Não publica nenhuma ficha nova:
destrava as outras. *Cobertura: +1.206 produtos ganham largura/metragem
automáticas.*

**Fase 2 — as linhas que já têm conteúdo.** Mover o que existe no repositório
para a tabela, na ordem de alavancagem: Avery (288) → Etherna (168) → M7 (99)
→ Oracal 651 (69, transcrevendo o TDS já hospedado) → SH Decor (56) → SH
Wrapping (39) → MCX (37) → NZWRAP (30) → Oracal 670 (25) → NZPPF (24) → NZ
Farol (13) → MD-80 (4). *Cobertura acumulada: 852 produtos (66%).*

**Fase 3 — texto de venda.** Chamada + descrição + "sobre a linha" para as
linhas sem texto. É trabalho de escrita, não de código, e pode andar em
paralelo com a Fase 4.

**Fase 4 — ficha baixável.** Gerador de uma página, botão na página do produto
e no painel (para o vendedor mandar por WhatsApp), TDS do fabricante quando
houver.

**Fase 5 — as linhas sem origem.** Speed Wrapping (241), NZWRAP Import (38),
NAR (11), AD Pro (9), SHNext (2). Aqui a regra é dura: **sem TDS, a ficha só
traz o que é medível** — largura, metragem, acabamento, aplicação. Nada de
espessura ou durabilidade "por analogia". Uma ficha curta e verdadeira vale
mais que uma completa e inventada, e é o mesmo critério que aplicamos às
avaliações.

---

## 10. O que eu preciso decidir com você

| # | Decisão | Minha recomendação |
|--:|---|---|
| 1 | Ficha por linha (18) ou por sub-família (≈45)? | **Sub-família** onde o prefixo do SKU mostra filmes diferentes (Avery, Speed Wrapping, diversos); linha simples no resto |
| 2 | O `benchmarkData` da NZPPF tem ensaio de origem? | Se não tiver: fica na página como comunicação, **fora** da ficha e do PDF |
| 3 | Temos TDS de Speed Wrapping / NZWRAP Import / NAR? | Se não: ficha curta só com o medível (Fase 5) |
| 4 | Os 139 de "diversos" — quais são revenda e quais são ferramenta? | Preciso da sua lista; despublicar "Teste" eu faço já |
| 5 | Quem assina a conferência de cada ficha? | Um nome por linha, gravado em `conferido_por` |

Nenhuma delas bloqueia a Fase 1 — a estrutura pode começar hoje.

---

## 11. Riscos

- **Ficha errada é pior que ficha vazia.** Temperatura de aplicação errada
  estraga a aplicação de um capô. Por isso `fonte_url` + `conferido_em` são
  obrigatórios, e por isso a Fase 5 é conservadora.
- **A extração Etherna/SH Decor precisa de olho humano.** São 4 e 5 versões
  divergentes da mesma ficha; promover a versão errada propaga o erro para 159
  produtos de uma vez. Daí o botão mostrar a divergência antes de aplicar.
- **PDF no navegador é pesado em celular antigo.** O portfólio NZPPF já
  contorna com montagem página a página; com uma página só o risco é baixo,
  mas o botão precisa de estado "gerando…".
- **O ERP é somente leitura.** Nada deste plano escreve lá. `largura_m` e
  `metragem_padrao` são lidos; se estiverem errados no ERP, corrigem-se no ERP.
- **Sem preço, custo ou margem em nenhuma camada** — a ficha baixável é
  justamente o artefato que mais circula fora.
