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

Sequência:

```
node scripts/publicar-cor.mjs <slug>            # baixa tudo e aplica a marca
node scripts/publicar-cor.mjs <slug> --so-capa  # refaz SÓ a capa, preserva as fotos corrigidas
node scripts/publicar-cor.mjs <slug> --commit   # commita, sobe, espera o deploy e grava no banco
```

**Corrigir a cor entre o download e o commit.** O `--so-capa` rebaixa a capa crua,
então a correção precisa ser refeita depois dele.

**Cache do navegador.** O nome do arquivo não muda, então quem já abriu a página
continua vendo a capa antiga. Ctrl+F5 ou janela anônima. Não é bug de deploy —
conferir sempre pelo arquivo no ar antes de mexer em qualquer coisa.

---

## Cores fechadas neste padrão

| Cor | Leitura | Acabamento | Capa final |
|---|---|---|---|
| ESG-030 Super Gloss Gem Red | `#98144E` · H 334 · S 87 · V 60 | super gloss sólido | `#981451` |
