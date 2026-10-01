# Capas de rolo Speed Wrapping — padrão

Fechado e aprovado na **ESG-030 Super Gloss Gem Red** (set/2026). Vale para todas
as cores da marca, em todas as linhas: ESG, EMA, EGL, EGB, EMR.

Método de cor em [`FOTOS_DE_COR_AUTOMOTIVA.md`](./FOTOS_DE_COR_AUTOMOTIVA.md).
Perfil de acabamento por linha, na seção "Acabamentos" do mesmo manual.

---

## O que estava errado no primeiro lote

Duas coisas, e as duas valem para conferir qualquer capa antiga antes de reusar:

1. **Tubete preto.** O tubete da Speed Wrapping é **BRANCO**. O lote original saiu
   com tubete preto, que não existe no produto.
2. **Cor tirada do nome cadastrado, não da amostra.** A ESG-030 está cadastrada
   como "black gem red" e a capa saiu quase preta (V 10,6) quando a amostra física
   lê V 60. **Nome de cadastro não é fonte de cor.**

---

## REGRA PRIMEIRA: capa nova se GERA com a capa aprovada como IMAGEM DE REFERÊNCIA

**Leia isto antes de qualquer outra coisa desta página.**

A capa de uma cor nova é gerada passando a capa aprovada da ESG-034 como
**imagem de referência** na geração (image-to-image), e não descrevendo a
proporção em texto. A referência prende a geometria; o prompt só troca a cor.

Referência de geometria: a geração crua (sem logo) da ESG-034,
job `a811cd95-a307-424c-967a-a291f6c2c028`.
Referência de acabamento: a geração crua da ESG-033,
job `d1170724-55b1-4765-855b-c54191e6640e` — verde, super gloss, brilho forte.

Na geração:

- `model: gpt_image_2`, `quality: high` — **não** o `low` padrão. As capas em
  `low` saíam granuladas e com brilho fraco.
- `medias`: as duas referências acima, com `role: image`.
- Prompt em três blocos: **IMAGEM 1 define a GEOMETRIA** (copiar exatamente:
  posição, tamanho, ângulo, ponta cortada, tubete branco e sua largura, aro
  estriado, canto superior esquerdo vazio, fundo, luz, sombra); **IMAGEM 2 define
  o ACABAMENTO** (super gloss molhado, filete especular branco forte, contraste
  entre crista e aba de baixo); **a COR não é de nenhuma das duas** — hex da
  leitura, descrita em positivo.
- Sem logo na geração. O logo entra por composição no `--tudo`.

Resultado na ESG-035: silhueta 93% igual à da ESG-034 (IoU), brilho no nível da
ESG-033 aprovada, superfície lisa. A saturação sai uns 10 pontos baixa (S 35
contra 46) — é normal e o `--tudo` fecha sozinho em duas passadas, sem estouro.

### O que NÃO fazer — as duas tentativas que falharam na ESG-035

1. **Gerar só com texto e números de proporção.** Seis gerações, tubete errado
   em todas (36%, 32%, 37%, 34%, 22%, 3%). Proporção não se acerta por descrição.
2. **Recolorir a capa aprovada de outra cor** (azul → verde, com
   `scripts/capa-de-doadora.py` / `neutralizar-especular.py`). A geometria fica
   certa, mas a mudança grande de matiz e de valor destrói o acabamento: o brilho
   fica com o matiz da doadora, o cilindro achata, o campo de cor granula a cada
   reencode. **Reprovado pelo João em três rodadas seguidas** — "piorou". Esses
   dois scripts ficam no repositório só como registro; não usar para capa nova.

Recolorir continua válido para **ajuste fino da mesma capa** (a correção de
poucos pontos que o `--tudo` já faz). O que não funciona é trocar a cor inteira.

---

## Composição

Quadrado, **1:1**. Fundo branco de estúdio, sem gradiente de cenário, com sombra
de contato suave sob o cilindro.

O rolo atravessa o quadro **na diagonal**:

- **Ponta cortada à frente, no canto inferior esquerdo**, grande, mostrando a face
  aberta como uma elipse larga.
- **Cilindro recuando para o canto superior direito**, saindo do quadro pela borda
  direita.
- Câmera **um pouco acima** do rolo.
- **Canto superior esquerdo vazio** — é onde a marca entra depois.

Essa é a diagramação do template original e está aprovada. Não mexer.

## A ponta cortada — é o que faz parecer rolo de verdade

Foi o que faltava nas capas antigas. Três elementos, do lado de fora para dentro:

1. **Banda concêntrica estreita** com as estrias finas das centenas de voltas do
   material enrolado, **um pouco mais clara e mais fosca** que a face brilhante.
2. **Tubete BRANCO** — tubo de papelão branco, com **espessura de parede visível**.
3. **Furo interno em sombra suave**, não em preto chapado.

### As proporções, em número

O modelo erra isso sozinho, e erra para os dois lados. Na ESG-033 a primeira capa
saiu com a banda de material ocupando quase um terço do raio: o rolo parecia ter o
dobro de filme enrolado e destoava do resto da linha. Na tentativa de corrigir,
a banda sumiu e sobrou um tubo pelado.

Medido nas capas aprovadas:

| | proporção |
|---|---|
| Diâmetro da ponta cortada | **~42% da altura da imagem** |
| Tubete branco (diâmetro externo) | **~65% do diâmetro do rolo** |
| Banda de material enrolado | **~18% do raio** — aro fino, e visível |

Escreva os três no prompt, com os números. E escreva também os dois erros pelo
nome, porque o modelo cai neles: *"uma rosca grossa de material com tubete pequeno
está errado; um tubo pelado sem aro estriado também"*. O certo é **tubo branco
grande com um aro fino e finamente estriado em volta**.

> **Aviso sobre estes números.** Eles são a melhor descrição que consegui, mas
> **não funcionam.** Na ESG-035, seis gerações seguidas com estes números no
> prompt erraram o tubete para os dois lados — 36%, 32%, 37%, 34%, 22%, 3%. O
> "65% do diâmetro do rolo" em particular é alto demais e produz furo gigante;
> baixar para "metade, com furo interno em 40%" melhorou mas continuou instável.
> **A proporção não se acerta por descrição. Se acerta passando a capa aprovada
> como imagem de referência, como descrito no topo desta página.** Esta seção
> fica como descrição do padrão, não como receita de prompt.

## Superfície

Segue o perfil de acabamento da linha. Para a ESG (super gloss sólido): campo de
cor cremoso e uniforme, **um único filete especular branco, largo e de borda macia,
correndo o comprimento do cilindro pela parte de cima**, com gradiente descendo
para um tom mais fundo na aba de baixo. Sem casca de laranja. Sem flake.

## Marca — nunca pedir ao modelo

Capa gerada sai **sem logotipo**: pedir a marca na geração devolve letra torta e
nome errado. O logotipo oficial entra por **composição**, a partir do recorte com
canal alfa em `scripts/data/marca-speed-wrapping.png` — extraído uma vez de uma
capa aprovada, então é pixel a pixel igual em toda a linha.

Parâmetros no manifesto, em fração do lado da capa:

```json
"logo": {
  "arquivo": "scripts/data/marca-speed-wrapping.png",
  "largura": 0.26,
  "esquerda": 0.025,
  "topo": 0.025
}
```

**0,26 é o tamanho certo, e isso custou uma rodada.** A primeira tentativa usou
0,525 — a marca cobria 96% da largura, passava por cima do rolo e ficava enorme no
site. A 0,26 ela ocupa 37% da largura medida no vermelho, fecha em 17% da altura, e
o material só começa na metade do quadro. Folga confortável.

## Cor

Alvo é sempre a **leitura da amostra física**, medida na janela limpa de filme.
Depois de gerar, fechar por aritmética:

```
python3 scripts/recolorir-capa.py \
  --entrada public/assets/images/shop/speed-wrapping/{slug}.webp \
  --alvo '#98144E' --familia rosa --no-lugar
```

A máscara é por faixa de matiz, então **a marca fica fora dela sozinha**: o
vermelho do logotipo lê matiz ~1° e nenhuma faixa cromática do filme chega lá.
Conferido na ESG-030 — depois de duas passadas de correção o vermelho seguia em
1,3°. Não precisa de proteção especial.

Costuma pedir **duas passadas**: a primeira encosta, a segunda fecha. O webp é
lossy e a releitura muda um pouco.

**Resultado de referência (ESG-030):** alvo `#98144E` · H 333,6 · S 86,8 · V 59,6 →
final `#981451` · H 334,0 · S 87,0 · V 59,5. Desvio de 0,4 no matiz e 0,2 na
saturação, sem estouro.

## Quando a capa antiga dá para aproveitar

Se o desvio couber na gama, recolorir sai mais barato que gerar. Se não couber
— a ESG-030 precisava de V 10,6 → 60 —, há duas saídas:

- **Gerar de novo**, seguindo tudo acima. É o caminho quando a capa antiga também
  tem defeito estrutural, como o tubete preto.
- **Usar outra capa da linha como doadora**, se a composição dela estiver boa. Como
  todas saem do mesmo template, qualquer uma serve: escolha a mais próxima em
  saturação e valor, prefira matiz longe do vermelho do logo, e fique a 20° das
  bordas da faixa de matiz. Detalhe em `FOTOS_DE_COR_AUTOMOTIVA.md`, seção
  "Quando a capa está longe demais".

---

## Prompt de capa, pronto

Trocar o bloco de COR e o de SUPERFÍCIE conforme a cor e a linha.

> Photorealistic studio product photograph of a single large roll of automotive
> vinyl wrap film, on a pure white seamless background.
>
> COMPOSITION — the roll lies diagonally across the frame: the CUT END faces the
> lower-left, large in the foreground, and the cylinder recedes toward the
> upper-right, running out of frame at the right edge. The cut end is a wide
> ellipse. The upper-left corner of the image is EMPTY white space. Camera
> slightly above the roll. Soft contact shadow under the cylinder on the white
> floor.
>
> THE FILM COLOR: *(descrição + hex da leitura da amostra)*
>
> THE FILM SURFACE: *(perfil de acabamento da linha — para a ESG, o texto de
> SUPER GLOSS SÓLIDO do manual)*. The gloss appears as ONE long, broad,
> soft-edged white specular highlight running the length of the cylinder along its
> upper side, with a smooth gradient falling off to a deeper shade on the lower
> flank.
>
> THE CUT END — this is what makes it look real, render it carefully: the spiral
> edge of the tightly wound film is visible as a narrow concentric band around the
> opening, showing the fine layered striations of hundreds of wraps of material,
> slightly lighter and more matte than the glossy outer face. Inside that band
> sits the CORE TUBE, and the core is WHITE — a clean white cardboard tube with a
> visible wall thickness, its inner bore in soft shadow. The core must be WHITE,
> not black, not dark.
>
> DETAILS: absolutely NO text, NO logo, NO letters, NO branding, NO label, NO
> watermark anywhere in the image. Clean white studio background, even soft
> lighting from above and slightly to the left, gentle falloff. Photorealistic
> commercial product photography, sharp focus across the roll, high resolution.

Gerar **2 variações** e escolher: a posição do rolo varia um pouco entre elas, e
interessa a que deixa mais folga no canto superior esquerdo.

---

## Publicação

Entrada no manifesto `scripts/data/publicacao.json`. A Speed Wrapping guarda as
imagens em caminho próprio, então os três campos de destino são obrigatórios:

```json
"destino":      "public/assets/images/shop/speed-wrapping/aplicacao",
"url_base":     "/assets/images/shop/speed-wrapping/aplicacao",
"destino_capa": "public/assets/images/shop/speed-wrapping",
"familia":      "rosa",
"capa":         "<url da geração aprovada>",
"logo":         { ... }
```

### Um comando só

```
node scripts/publicar-cor.mjs <slug> --tudo
```

Baixa as cinco imagens, **corrige a cor sozinho** contra a `leitura`, estampa a
marca, commita, sobe, espera o deploy da Vercel e grava no banco.

O freio está na correção: se mais de **2% do filme estourar**, o comando para
antes do commit e o disco fica como estava. Estouro acima disso significa que a
imagem está longe demais do alvo e precisa ser **regerada**, não corrigida.

Nas fotos de cena ele aplica `--manter-valor` sozinho, porque metade da lataria
está em sombra e levantar o valor até a leitura clarearia o carro à toa. E faz
duas passadas em cada arquivo: a primeira encosta, a segunda fecha — o arquivo é
lossy e a releitura muda um pouco.

**A correção roda em JS, não em Python.** A primeira versão do `--tudo` chamava o
`recolorir-capa.py` por spawn e morreu na máquina de produção, que não tem
numpy/scipy/pillow — com as imagens já baixadas e nada commitado. A matemática
agora mora em `scripts/lib/cor.mjs`, sobre o buffer cru do sharp que o script já
usava. Zero dependência nova.

O `recolorir-capa.py` continua sendo a referência documentada e a ferramenta de
inspeção manual. **Quem mexer em um tem que mexer no outro.** A conferência é
rodar os dois na mesma imagem e comparar: na ESG-032 os dois fecharam em
H 347,6 · S 63,0 · V 78,4 na capa, com diferença de pixel de 1,3 a 2,3 em 255 —
resíduo do desfoque de caixa contra gaussiana na borda da máscara.

### Comandos avulsos

```
node scripts/publicar-cor.mjs <slug>            # só baixa
node scripts/publicar-cor.mjs <slug> --corrigir # baixa e corrige, sem subir
node scripts/publicar-cor.mjs <slug> --so-capa  # refaz SÓ a capa, preserva as fotos
node scripts/publicar-cor.mjs <slug> --commit   # commita, sobe, espera o deploy e grava
```

**O `--so-capa` rebaixa a capa crua**, então a correção precisa ser refeita depois
dele — ou use `--so-capa --corrigir`.

**Cache do navegador.** O nome do arquivo não muda, então quem já abriu a página
continua vendo a capa antiga. Ctrl+F5 ou janela anônima. Não é bug de deploy —
conferir sempre pelo arquivo no ar antes de mexer em qualquer coisa.

---

## Cores fechadas neste padrão

| Cor | Leitura | Acabamento | Capa final |
|---|---|---|---|
| ESG-030 Super Gloss Gem Red | `#98144E` · H 334 · S 87 · V 60 | super gloss sólido | `#981451` |
| ESG-034 Ceramic China Blue | `#5D85AD` · H 210 · S 46 · V 68 | super gloss sólido | geração já em H 210,4 · S 46,9 |
| ESG-035 Racing Green | `#637F44` · H 89 · S 46 · V 50 | super gloss sólido | gerada com ESG-034 (geometria) + ESG-033 (acabamento) como referência; `--tudo` fecha a saturação |
| ESG-036 Armor Green | `#999E8A` · H 76 · S 13 · V 62 | super gloss sólido | gerada com ESG-034 + ESG-033 de referência; silhueta 92% igual; `--tudo` fecha com `familia: salvia`, `sat_min: 0.05` |
| ESG-037 Khaki Grey | `#B9C6B2` · H 98 · S 10 · V 78 | super gloss sólido | gerada com ESG-034 + ESG-033 de referência; silhueta 89% igual; `familia: verde`, `sat_min: 0.05` |
| ESG-038 Porsche Lava Orange | `#F31403` (do piloto aprovado) · H 4 · S 99 · V 95 | super gloss sólido | gerada com ESG-034 + ESG-033 de referência; silhueta 97% igual; **sem correção** (cor no teto) |
| ESG-039 Strawberry Red | `#D91122` (do piloto aprovado) · H 356 · S 99 | super gloss sólido | referência ESG-034 + ESG-033; silhueta 92% igual; **sem correção** (cor no teto) |
| ESG-040 Oolong Milk Tea Pink | `#DB9FBC` · H 331 · S 28 · V 86 | super gloss sólido | referência ESG-034 + ESG-033; silhueta 95% igual; `familia: malva`, `val_max: 0.95`, `marca_depois` |
| EDG-020 Liquid Metal Ruby Red | `#8B0019` (amostra no teto; alvo = piloto aprovado) · H 349 | **gloss metallic** (liquid metal, pigmento ultrafino) | **primeira capa metálica**: referência ESG-034 (geometria) + ESG-033 (brilho) + parágrafo "THE FILM IS METALLIC, unlike image 2" (texto em `publicacao.json` → `prompts.capa_bloco_cor`); silhueta 89%; capa final H 353 · S 95 · V 56; **sem correção** (cor no teto) |
| EDG-025 Metallic Solar Gold | `#7F7148` · H 45 · S 43 · V 50 | gloss metallic (flake fino visível) | mesmo método metálico da EDG-020; silhueta 89%; geração H 41 → `--tudo` fecha em H 44,6 · S 43,1 · V 49,8 com a família nova `dourado` |
| EMT-022 Satin Metallic Titanium Metal Grey | `#7B848C` · H 207 · S 12 · V 55 | **satin metallic** | **só a ESG-034 como referência (geometria)** — a ESG-033 é super gloss e puxaria para brilho molhado; acetinado descrito em texto ("SATIN METALLIC, halfway between gloss and matte... broad soft glowing sheen band, never a crisp mirror-white specular line"); silhueta 84%; capa H 218 · S 8 · V 59; **sem correção** (quase neutra) |
| EDG-027 Metallic Midnight Purple | `#554C6E` · H 255 · S 31 · V 43 | gloss metallic (flake fino violeta) | método metálico da EDG-020; silhueta 89%; geração V 29 → `--tudo` fecha em H 255,9 · S 31,0 · V 43,1 com a família nova `violeta` |
| EDG-019 Metallic Liquid Metal Austin Gold | `#BF8426` (= piloto A aprovado) · H 37 · S 80 · V 75 | gloss metallic (liquid metal) | método metálico da EDG-020; silhueta 88%; fecha em H 36,8 · S 81,2 · V 74,5 (família `laranja`) |
| EMT-025 Satin Metallic Matt Deep Blue | `#233F8C` · H 224 · S 75 · V 55 | satin metallic | método satin da EMT-022 (só ESG-034); silhueta 90%; fecha em H 224,0 · S 75,2 · V 54,9 |
| EDG-016 Metallic Liquid Metal Space Silver | `#73767A` · S ~5 · V 48 (cor própria do cartão) | gloss metallic (liquid metal, prata chumbo) | método metálico da EDG-020 + "It is not chrome and not a mirror: the roll has its own lead-grey colour"; capa 2 (V 45, S 7); sem correção (quase neutra) |
| EDG-018 Metallic Liquid Metal Agate Green | `#077A2D` (= piloto B) · H 140 · S 94 · V 48 | gloss metallic (liquid metal) | método metálico da EDG-020; gerada em H 148 (a mais viva das duas) → `--corrigir` fecha em H 139,9 · S 94,2 · V 47,8 (família `verde`) |
| EDG-021 Metallic Liquid Blue Berry | `#1446B3` · H 221 · S 89 · V 70 | gloss metallic (liquid metal) | método metálico da EDG-020; nasceu em H 219 · S 98; sem correção (fotos e capa já em H 218–221) |
| EMT-023 Satin Metallic Matt Sakura Pink | `#D9BEC1` · H 354 · S 12 · V 85 | satin metallic (pérola) | método satin da EMT-022 (só ESG-034) + "must clearly read as a pale pink, not white and not grey"; saiu H 353 · S 10 · V 82; sem correção (quase neutra) |
| EDG-023 Metallic Ruby Gold | `#73374D` · H 338 · S 52 · V 45 | gloss metallic (flop dourado) | método metálico da EDG-020 + "golden-bronze glint at the very edge of the curve"; capa 2 (H 349, com o bronze embaixo) → `--corrigir` fecha em H 338,1 · S 52,1 · V 45,1 (família `malva` + `marca_depois`) |
| EMG-021 Satin Metallic Glossy Agate Green | `#0F6655` · H 168 · S 85 · V 40 | gloss metallic | método metálico; capa 1 (H 180 · S 87) → fecha em H 168,2 · S 85,2 · V 40,0 (família `verde`) |
| EMT-024 Satin Metallic Matt Pearl Pink | `#E68CC4` · H 323 · S 39 · V 90 | satin metallic (pérola) | método satin (só ESG-034); capa 2 → fecha em H 322,7 · S 39,2 · V 90,2 com a família nova `orquidea` + `val_max` 0,95 |
| EGF-012 Gloss Forged Carbon Purple | padrão (lascas `#5A2D8C` / base `#1A1024`) | gloss forjado | **primeira capa de padrão**: ESG-034 (só geometria, "do NOT copy its blue colour") + recorte do cartão como IMAGE 2 ("defines the PATTERN… wrap this exact pattern around the outer surface of the roll"); capa 1 (lascas mais densas); sem correção |
| EDG-026 Metallic Paint Metallic Sonoma Green | `#434D2C` · H 78 · S 43 · V 30 | gloss metallic (flake dourado) | método metálico; capa 2 → `--corrigir` fecha em H 78,0 · S 42,2 · V 30,2 (família nova `musgo`) |
| EMG-022 Satin Metallic Glossy Prunus Sakura Pink | `#EDB8BA` · H 357 · S 22 · V 93 | gloss pérola | ESG-034 + ESG-033 + "PEARL METALLIC, unlike image 2"; capa 1 (H 357 · S 17 · V 87); sem correção |
| EGF-010 Gloss Forged Carbon Gold | padrão (lascas `#B07A2A` / base `#1A120A`) | gloss forjado | ESG-034 (geometria) + recorte do cartão (`7325eda7`); capa 2 (lascas mais densas); sem correção |
| EGF-013 Matte Forged Carbon Purple | padrão fosco (lascas `#5A3A80` / base `#161020`) | **matte** forjado | ESG-034 (geometria, "do NOT copy its glossy surface") + recorte do cartão (`fed54336`) + "MATTE… no crisp specular band"; capa 2; sem correção |
| EGF-006 Gloss Forged Carbon Silver | padrão (lascas prata sobre preto) | gloss forjado | ESG-034 (geometria) + recorte do cartão (`f9657486`); capa 2 (mais prata visível); sem correção |
| EGF-017 Shadow Black | padrão (camuflagem brilho × acetinado) | gloss/satin | ESG-034 + recorte do cartão (`d0cfb72b`) + "soft white highlight that shines on the glossy blotches and stays muted on the satin ones"; capa 2 |
| EGF-018 Forged Carbon | padrão (estilhaços cinza sobre preto) | gloss forjado | ESG-034 + recorte do cartão (`5980816d`); capa 2 (estilhaços mais nítidos) |
| ESG-004 Super Gloss Ferrari Red | `#E31E14` · H 3 · S 91 · V 89 | super gloss sólido | ESG-034 + ESG-033 + "SOLID colour, exactly like image 2"; capa 2 (H 5 · S 92 · V 89); sem correção (cor no teto) |
| ESG-011 Super Gloss Miami Blue | `#05A9CD` · H 191 · S 97 · V 81 | super gloss sólido | ESG-034 + ESG-033 + "SOLID colour, exactly like image 2"; capa 2 (H 189 · S 97 · V 80); sem correção |
| ESG-016 Super Gloss Sunflower Yellow | `#F2A705` · H 41 · S 98 · V 95 | super gloss sólido | idem; capa 1 (H 41 · S 99 · V 93); sem correção |
| ESG-025 Super Gloss Lavender | `#A996EA` · H 253 · S 36 · V 92 | super gloss sólido | idem; capa 2 → `--corrigir` fecha em H 253,6 · S 36,1 · V 91,8 (família `violeta`, `val_max` 0,95) |
| EMA-007 Matt Army Green | `#5A7351` · H 105 · S 29 · V 45 | **matt** (fosco) | **primeira capa fosca lisa**: só ESG-034 (geometria) + "TRUE MATTE… NO specular band"; capa 2 → fecha em H 104,2 · S 29,6 · V 45,1 (família nova `militar`) |

**A ESG-034 é a referência de geometria da linha** (job `a811cd95…`), e a
**ESG-033 é a referência de acabamento** (job `d1170724…`). Passar as duas como
imagem de referência em toda capa nova.
