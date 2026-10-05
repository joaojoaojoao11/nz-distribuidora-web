# ORACAL 670RA — mapeamento de tons e acabamentos

Leitura das 24 cores da linha, feita antes de qualquer geração de imagem, sob o
padrão [NZ RealColor Wrap™](./NZ_REALCOLOR_WRAP.md). Método em
[`FOTOS_DE_COR_AUTOMOTIVA.md`](./FOTOS_DE_COR_AUTOMOTIVA.md).

---

## O que esta linha é, e por que isso muda a foto

**ORACAL 670RA é PVC polimérico calandrado de 70 micras** — a mesma base do
ORACAL 651, redesenhada para envelopamento completo: 1,52 m de largura, adesivo
RapidAir® e durabilidade de até 5 anos.

Isso é o oposto da MetaCast MCX, que é cast premium. E explica o orange peel.

Filme **cast** é vertido líquido sobre um liner e cura plano: tensão interna
baixa, face quase perfeita, aparência paint-like. Filme **calandrado** é
extrudado e espremido entre rolos até a espessura, guarda tensão interna e a face
nunca fica perfeitamente plana. O **orange peel** — a ondulação fina, tipo casca
de laranja — é artefato de fabricação, não defeito de aplicação, e só aparece no
brilho, porque é o reflexo que denuncia a superfície.

**Consequência para a imagem:** no brilhante da 670RA o reflexo existe, mas com a
borda ONDULADA E QUEBRADA, nunca uma faixa limpa de espelho. Na MCX o brilho é
espelho; aqui não é. É o traço visual que identifica a linha.

---

## ATUALIZAÇÃO 05/10/2026 — a verdade de tom são as fotos reais da Sign House

O "hex oficial via 651" desta página (seções abaixo) **errou 15 das 24 cores**. O Drive da Sign House
tem fotos reais de carros envelopados com a 670RA, uma pasta por cor (`Fotos e Vídeos`, id
`1rvbWyT_fKEFU892U8Dj3KlSXB-IsrL_2`), e o João definiu: **essas fotos são a verdade absoluta de tom, para
capas e carros**. Valores em produção (`produtos.hex` e `web_catalog_products.hex_code`; backup do anterior em
`NZ-AGENTES/CLEDNA/casos/670ra/backup_hex_antes_tons_2026-10-05.json`):

| Cor | Tom real | Antes (via 651) | Observação |
|---|---|---|---|
| 030G Dark Red | `#B82126` | `#900E16` | vermelho cheio (Golf GTI), não vinho |
| 031G Red | `#DC352C` | `#B0000D` | vermelho vivo |
| 032G Light Red | `#DB0A0D` | `#C91100` | só a capa mudou |
| 035G Pastel Orange | `#EB851E` | `#FC6C00` | tangerina, puxa para o amarelo |
| 040M Violet | `#8A51BF` | `#5D2C68` | violeta claro, não ameixa |
| 053G Light Blue | `#2DA2E0` | `#0089C3` | azul-celeste |
| 055G Mint | `#54CBC1` | `#5FCDB7` | só a capa mudou |
| 056G Ice Blue | `#75B2E0` | `#3DA1D2` | azul-bebê |
| 060M Dark Green | `#3D6652` | `#004028` | verde da BMW M5, não verde-garrafa |
| 064G Yellow Green | `#49C42F` | `#289901` | verde-limão |
| 066G Turquoise | `#2FB8D6` | `#00818C` | turquesa claro, não petróleo |
| 073G / 073M Dark Grey | `#777B7F` | `#4B4C4C` | cinza médio, não grafite |
| 076G / 076M Telegrey | `#B4B6B3` | `#818689` | cinza claro |
| 084M Sky Blue | `#2E99E6` | `#0075BB` | azul-céu (Polo GTS) |
| 562G Deep Sea Blue | `#284B9E` | `#131E3A` | azul-royal (GLA), não marinho |

Ficaram no valor via 651 porque batem com as fotos: 010G, 021G, 025G, 047G, 070G, 070M e 072G.
010G, 025G, 047G, 070G e 076G não têm pasta com foto usável.

**Fosco:** o perfil abaixo dizia "sem imagem espelhada, luz difusa", e o prompt que saiu disso gerou
lataria aveludada. Fosco real tem **brilho baixo e largo nas curvas** voltadas para a luz (ver
`FOTOS_DE_COR_AUTOMOTIVA.md`, lição "ORACAL 670RA: foto real manda no tom, e fosco não é veludo").

**Estado:** 24 cores com capa e 3 fotos de carro (macro na 031G e na 060M), mais 37 fotos reais de 18 cores
na galeria (`public/assets/images/shop/oracal-670ra/reais/`). Manifesto em `scripts/data/publicacao.json`;
casos e scripts em `NZ-AGENTES/CLEDNA/casos/670ra/` e `scripts/670ra/`.

---

## A descoberta que precede tudo: o hex do banco está errado

O campo `hex` das 24 cores da 670RA **não são os valores da Orafol**. São
aproximação de quem cadastrou, com viés para valores idealizados — preto puro,
branco puro, saturação 100%.

Os valores corretos já estavam no nosso próprio banco, nos registros do **ORACAL
651**, que usa a mesma numeração de cor da Orafol. Conferidos contra quatro
referências externas independentes, batendo exato:

| Cor | Referência externa | Nosso 651 | Nosso 670RA |
|---|---|---|---|
| 070 Black | `#0D0E11` | `#0D0E11` ✓ | `#000000` ✗ |
| 025 Brimstone Yellow | `#F2E210` | `#F2E210` ✓ | `#ECFA00` ✗ |
| 076 Telegrey | `#818689` | `#818689` ✓ | `#6D7275` ✗ |
| 562 Deep Sea Blue | `#131E3A` | `#131E3A` ✓ | `#001A3D` ✗ |

**As 24 divergem.** Enquanto não for corrigido, a amostra de cor que o cliente vê
na página de produto está errada — e isso vale para a compra, não só para a foto.

> **Premissa declarada:** a numeração de cor da Orafol identifica o pigmento e é
> mantida entre as linhas, então o valor do 651 vale para a 670RA de mesmo
> número. É razoável e é a melhor fonte disponível, mas **não substitui medir a
> amostra física** — se o leque estiver à mão, vale conferir.

---

## Mapeamento das 24 cores

`OFICIAL` é o alvo. `capa` é o que a capa de rolo publicada hoje mostra, e o
desvio mede o erro atual.

| Cor | Nº | Oficial | H | S | V | Capa hoje | ΔS | ΔV | Acab. |
|---|---|---|---|---|---|---|---|---|---|
| White G | 010 | `#E6E9EE` | 218 | 3,4 | 93,3 | `#BEB3BA` | +2,3 | −18,8 | brilho |
| Yellow G | 021 | `#FEC500` | 47 | 100 | 99,6 | `#ECB203` | −1,2 | −7,1 | brilho |
| Brimstone Yellow G | 025 | `#F2E210` | 56 | 93,4 | 94,9 | `#CBCB3E` | **−25,0** | −14,9 | brilho |
| Dark Red G | 030 | `#900E16` | 356 | 90,3 | 56,5 | `#503038` | **−53,9** | **−25,1** | brilho |
| Red G | 031 | `#B0000D` | 356 | 100 | 69,0 | `#B63031` | **−27,9** | +2,4 | brilho |
| Light Red G | 032 | `#C91100` | 5 | 100 | 78,8 | `#CA493F` | **−31,3** | +0,4 | brilho |
| Pastel Orange G | 035 | `#FC6C00` | 26 | 100 | 98,8 | `#CC6D20` | −14,4 | −18,8 | brilho |
| Violet M | 040 | `#5D2C68` | 289 | 57,7 | 40,8 | `#573D65` | −19,0 | −0,4 | fosco |
| Orange Red G | 047 | `#D33100` | 14 | 100 | 82,7 | `#9F3630` | **−32,2** | −20,4 | brilho |
| Light Blue G | 053 | `#0089C3` | 198 | 100 | 76,5 | `#058AB8` | −2,9 | −4,3 | brilho |
| Mint G | 055 | `#5FCDB7` | 168 | 53,7 | 80,4 | `#73B6AE` | −11,1 | −8,2 | brilho |
| Ice Blue G | 056 | `#3DA1D2` | 200 | 71,0 | 82,4 | `#8DA9C6` | **−35,7** | −4,7 | brilho |
| Dark Green M | 060 | `#004028` | 158 | 100 | 25,1 | `#39554D` | **−69,0** | +8,6 | fosco |
| Yellow Green G | 064 | `#289901` | 105 | 99,3 | 60,0 | `#7B9C24` | −20,2 | +2,7 | brilho |
| Turquoise G | 066 | `#00818C` | 185 | 100 | 54,9 | `#1A626C` | −23,4 | −12,5 | brilho |
| Black G | 070 | `#0D0E11` | — | — | 6,7 | `#353035` | — | +15,3 | brilho |
| Black M | 070 | `#0D0E11` | — | — | 6,7 | `#3D393E` | — | +18,0 | fosco |
| Light Grey G | 072 | `#BFC2C0` | — | 1,5 | 76,1 | `#A49DA0` | +1,8 | −11,8 | brilho |
| Dark Grey G | 073 | `#4B4C4C` | — | 1,3 | 29,8 | `#403D42` | +7,0 | −3,5 | brilho |
| Dark Grey M | 073 | `#4B4C4C` | — | 1,3 | 29,8 | `#514E53` | +5,6 | +3,1 | fosco |
| Telegrey G | 076 | `#818689` | 202 | 5,8 | 53,7 | `#68696E` | +0,1 | −10,6 | brilho |
| Telegrey M | 076 | `#818689` | 202 | 5,8 | 53,7 | `#7F7D81` | −1,0 | −2,0 | fosco |
| Sky Blue M | 084 | `#0075BB` | 202 | 100 | 73,3 | `#5B85A9` | **−52,1** | −6,3 | fosco |
| Deep Sea Blue G | 562 | `#131E3A` | 223 | 67,2 | 22,7 | `#323446` | **−36,2** | +5,5 | brilho |

Matiz suprimido nas neutras: abaixo de ~10% de saturação ele não significa nada.

### O padrão do erro

**A saturação é a falha sistemática.** Vinte das 24 capas estão abaixo do alvo, e
oito delas por mais de 25 pontos. As neutras estão certas — White +2,3, Light Grey
+1,8, Telegrey +0,1 — justamente porque não têm saturação a perder.

É o mesmo viés das capas MCX, mas mais grave, porque esta linha tem cores
saturadas de sinalização. **Nenhuma capa de cor cromática desta linha serve como
referência de cor hoje.**

---

## Os dois acabamentos

Só dois perfis para as 24 — 18 brilhantes e 6 foscas —, ao contrário da MCX, que
tem um acabamento por cor. Isso simplifica: caracterizados uma vez, valem para
todas.

### Como separar brilho de fosco por medição

A métrica de especular usada na MCX — percentual de pixels acima de 235 de
luminância — **não funciona aqui** e deu zero em todas as 24, brilhantes e foscas
iguais. Num filme escuro o reflexo é claro em relação ao material mas nunca chega
perto do branco.

O que separa é **quanto o brilho sobe acima do corpo do filme**, medido como
p95 − p50 de luminância dentro do rolo:

| Par | Brilho | Fosco |
|---|---|---|
| Black | 51 | 47 |
| Dark Grey | 47 | 39 |
| Telegrey | 32 | 24 |

### Perfil BRILHANTE (18 cores)

- Reflexo do entorno presente e legível, **mas com a borda ondulada e quebrada** —
  orange peel. Nunca espelho limpo de cast premium.
- O realce sobe bem acima do corpo, e a transição entre realce e corpo é rápida.
- Sem flake, sem perolizado: sólido puro.

### Perfil FOSCO (6 cores)

- Sem imagem espelhada. Luz espalha difusa.
- Corpo do filme lê **mais claro** que o brilhante de mesma cor, porque o fosco
  devolve luz difusamente em vez de mandá-la embora no ângulo especular. Medido
  nas três duplas que existem: Black M lê +3 acima do G, Dark Grey M +6,
  Telegrey M +11.
- Realce existe, largo e macio, mas menor: 24 a 47 contra 32 a 51 do brilho.
- Sem flake.

**Regra para a foto da fosca:** o corpo é alguns pontos mais claro que o hex
oficial, não mais escuro. É o inverso da intuição.

---

## O que precisa acontecer antes de gerar imagem

1. **Corrigir o `hex` das 24 no banco** para os valores oficiais. É o que o
   cliente vê como amostra de cor hoje, e está errado nas 24.
2. **Refazer as 24 capas de rolo**, ou corrigir por aritmética onde o desvio
   permitir. Oito passam de 25 pontos de saturação, e correção desse tamanho
   costuma estourar — essas provavelmente precisam ser regeradas.
3. **Só então as fotos de aplicação**, duas por cor, carro variando por cor.

---

## Plano de foto

Duas por cor, 48 no total: frontal três quartos e perfil, mesmo carro por cor,
carro variando entre cores. A macro de acabamento não precisa ser refeita 24
vezes — como o acabamento é idêntico dentro de cada perfil, duas macros servem a
linha inteira: uma do brilho com orange peel, uma do fosco.

O que o prompt precisa carregar, e que não existia na MCX:

> O reflexo do entorno aparece no filme, mas a borda do reflexo é ONDULADA e
> LEVEMENTE QUEBRADA, como a superfície de uma casca de laranja vista de longe —
> não é o espelho perfeito de uma pintura de fábrica. É vinil calandrado de
> envelopamento, não cast premium.

E o posicionamento da linha é outro: 670RA é vinil de custo-benefício para frota,
comercial e projeto de volume. O carro e o cenário devem refletir isso, não
exotismo — utilitário, hatch, sedã de frota, van, pickup de trabalho.
