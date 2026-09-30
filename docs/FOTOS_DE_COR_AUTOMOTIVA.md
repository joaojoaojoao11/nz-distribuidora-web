# Fotos de cor para adesivo automotivo — como fazer

Manual técnico do padrão **NZ RealColor Wrap™**. A definição, a promessa pública
e o texto da página institucional estão em
[`NZ_REALCOLOR_WRAP.md`](./NZ_REALCOLOR_WRAP.md); aqui fica o como fazer.

Guia do processo usado para produzir as fotos de aplicação e as capas de rolo das
cores de envelopamento. Escrito a partir das nove primeiras cores da MetaCast MCX
(setembro de 2026), mas vale para qualquer linha automotiva: NZWRAP, SH Wrapping,
Avery, Orafol.

Tudo aqui é medido. Onde houver número, ele saiu de uma medição real, e onde uma
regra nasceu de um erro, o erro está registrado — é o que impede de repeti-lo.

---

## A ideia central

**Geração de imagem serve para enquadramento, luz e acabamento. Cor se fecha por
aritmética.**

Isso custou caro para aprender. Nas três primeiras cores foram gastas várias
rodadas de geração tentando fazer o modelo acertar um hex, e em todas elas a
correção final acabou sendo matemática de qualquer jeito. O modelo tem atratores
de cor que não cedem a prompt nenhum: o verde trava em 122° quando se pede 108°,
o cinza-esverdeado escorrega 30° para o azul, o violeta acinzentado puxa para
rosa.

Então o prompt pede composição, luz e comportamento de acabamento — e a cor é
levada ao alvo depois, com `scripts/recolorir-capa.py`, que acerta o hex exato
numa passada e mede antes e depois.

---

## O processo, em sete passos

1. **Leitura de cor.** Medir o chip oficial, a capa publicada e a foto da
   brochure, declarar o hex canônico com tolerância, e caracterizar o acabamento
   com número.
2. **Propor carro e cenário na mesma mensagem da leitura.** Aprovação vem antes
   da geração, não depois — senão descobre-se o problema com quatro imagens
   prontas.
3. **Gerar UMA foto piloto.** Nunca o lote inteiro.
4. **Medir o piloto contra a leitura** e mostrar os números junto da imagem.
5. **Aprovado o enquadramento, gerar as outras três** com ângulos variados e o
   mesmo carro.
6. **Corrigir a cor localmente** e medir de novo.
7. **Publicar** com `scripts/publicar-cor.mjs`.

O gate de aprovação é sempre do enquadramento e da luz, nunca da cor — a cor
ainda vai ser corrigida.

---

## A leitura de cor

### O bug que invalidava as leituras: a janela escolhida à mão

Durante três cores eu medi a amostra assim: máscara por faixa de matiz, saturação
e valor, mediana dentro dela. O problema é que **os limiares eram escolhidos por
mim, por cor, e nunca registrados**. Na ESG-030 usei valor de 0,35 a 0,85; na
ESG-031, de 0,45 a 0,92.

Rodando as MESMAS fotos da ESG-030 com a janela da ESG-031, a leitura sai de
**S 87 · V 60** para **S 67 · V 78**. Vinte pontos, só de mover o limiar.

Não era medição. Era medição mais uma decisão minha invisível.

### A leitura sem parâmetro livre

O procedimento novo não tem nenhum limiar escolhido à mão:

1. **Balanço de branco.** Estima o iluminante pelos neutros da cena — mesa, papel,
   apoio do notebook — e normaliza. Foto de celular sob luz de escritório tem
   dominante quente, e sem isso o matiz sai deslocado de 2 a 7 graus.
2. **Acha o cartão** como o maior blob cromático, e recua 31 px da borda.
3. **Fica só na parte PLANA**: gradiente de luminância no percentil 40 mais baixo.
   Isso exclui sozinho a dobra do cartão, a borda do reflexo e o degradê da curva
   — que é justamente o que os limiares à mão tentavam excluir, e erravam.
4. **Corta especular e sombra por percentil DAQUELA região** (25 a 96), nunca por
   valor absoluto. Assim a janela se adapta a cada foto em vez de impor um número.
5. Mediana de H, S e V; e **a dispersão entre as fotos vira parte da leitura**.

Isso tudo está em **`scripts/ler-amostra.py`**, que é o único jeito certo de ler
uma amostra. Roda o pipeline inteiro, mais o teste multiescala de acabamento:

```
python3 scripts/ler-amostra.py foto1.jpg foto2.jpg foto3.jpg
```

Ele imprime a leitura, a dispersão e avisa sozinho quando a amostra precisa ser
refotografada. **Ler uma amostra a olho, ou com janela escolhida na mão, é o erro
que esta seção existe para impedir.**

**A dispersão é o dado mais útil que faltava.** Ela diz quando a amostra não é
confiável:

| Cor | Leitura nova | sd(S) entre fotos | Veredito |
|---|---|---|---|
| ESG-031 Plum Magenta | H331 S52 V72 | 1,4 | confiável |
| ESG-032 Morganite | H348 S63 V78 | 1,8 | confiável |
| ESG-034 Ceramic China Blue | H210 S46 V68 | 2,4 | confiável |
| ESG-035 Racing Green | H89 S46 V50 | 1,2 | confiável |
| ESG-036 Armor Green | H76 S13 V62 | 1,1 | confiável |
| ESG-040 Oolong Milk Tea Pink | H331 S28 V86 | 0,2 | confiável (2 de 4 — 2 com sombra descartadas) |
| ESG-041 Cement Grey | H213 S39 V67 | 2,3 | confiável (2 de 4 — 2 com sombra descartadas); piloto aprovado mais escuro, alvo V55 |
| ESG-037 Khaki Grey | H98 S10 V78 | 1,4 | confiável (3 de 5 fotos — 2 com sombra de mão descartadas) |
| EDG-020 Liquid Metal Ruby Red | H349 S100 V54 | 0,5 | matiz confiável (sd(H) 1,9); S no teto (câmera estourou), V 42–72 — cartão na mão, no sol; alvo = piloto B aprovado |
| EDG-025 Metallic Solar Gold | H45 S43 V50 | 2,4 | confiável (4 de 4, cartão na mão mas sem reflexo direto) |
| EMT-022 Titanium Metal Grey | H207 S12 V55 (após balanço de branco pelo cartão branco da foto) | 3,3 (3 de 4) | `ler-amostra` deu S 26: era o céu azul refletindo no acetinado; o cartão branco atrás leu H237 S9 |
| EDG-027 Metallic Midnight Purple | H255 S31 V43 | 2,5 (3 de 4) | confiável; WA0139 descartada (S 50, reflexo) |
| EDG-021 / EMT-025 (azuis, 30/09) | — | 41 / 26 | **não confiável**: reflexo do céu no cartão segurado na mão — refotografar deitado, na sombra |
| **ESG-030 Gem Red** | H333 S68 V76 | **7,7** | **não confiável** |

A ESG-030 foi fotografada com o cartão bem dobrado e o reflexo da janela cruzando
a face: as quatro fotos discordam entre si em quase 8 pontos, então nenhuma serve.
O valor publicado dela (#98144E) veio de uma janela apertada que eu escolhi, e não
se reproduz. **Vale refotografar essa amostra.**

### Como fotografar a amostra, para a leitura valer

Custo zero, e elimina três fontes de erro de uma vez:

- **Cartão DEITADO e PLANO** sobre a mesa, não segurado e dobrado na mão. A dobra
  cria degradê de luz que nenhum estimador separa bem da cor.
- **Na sombra aberta**, longe de janela. O que estraga é o reflexo especular da
  janela cruzando a face brilhante.
- **Uma folha de papel branco no quadro**, ao lado do cartão. É a referência de
  branco que ancora o balanço.
- **Três a quatro fotos**, girando o cartão 90° entre elas. Se a dispersão passar
  de 3 pontos, a luz estava ruim e vale refazer.

---

### Quais fontes existem e quanto vale cada uma

| Fonte | Confiança | Cuidado |
|---|---|---|
| Chip oficial CHAPADO | alta | é valor de especificação, não foto |
| Chip oficial FOTO | média | iluminado no estúdio, pode vir claro demais |
| Amostra física medida | máxima | quando existir, ganha de tudo |
| Capa publicada | baixa | viés sistemático de escurecer |
| Foto da brochure | só para acabamento e carro | **nunca para matiz** |

**Dezoito dos 37 chips da Metamark são preenchimento chapado, não foto.** Dá para
separar medindo o desvio de luminância no recorte central: desvio zero é cor
chapada, desvio acima de 1 é fotografia. Os chapados são especificação — não
podem ter saído mal iluminados. Os de foto podem: o chip da Carbon Steel marca
V 46,3 enquanto a amostra física daquela cor mede V 25,5. Vinte e um pontos.

**Foto de brochure quase sempre tem gradação de cor.** Na Capri Bronze as rodas
estavam azul-petróleo e o farol ciano — teal-and-orange clássico —, e o matiz
lido ali dava 52 a 67 contra 29 do chip. Serve para ver o acabamento e para
escolher o carro, que costuma ser o que o fabricante escolheu.

### Quando o nome engana

O nome da cor é marketing, não especificação.

- **Army Olive** mede H 134, verde militar frio. Não é oliva drab. A própria
  Metamark chama de "matt military green".
- **Plum Crazy** empresta o nome da FC7 da Mopar, um roxo vivo de 1970. O filme
  tem 35% de saturação contra os 70+ da tinta — é um violeta acinzentado.
- **Carbon Green** é mais grafite que verde: H 185, S 12,5%.

**Só procure tinta OEM equivalente nas cores marcadas como Inspire Colours™.** Na
MCX são onze e estão no dado: MCX-22, 26, 35, 38, 51, 52, 60, 62, 63, 96 e 97. A
Speed Green tem Green Hell Magno por trás; a Carbon Green, que é cor de casa, não
tem equivalente nenhum e procurar é perda de tempo.

### Valor perceptual em material com flake

Em cor com flake grosso a distribuição de luminância é bimodal — base escura mais
faíscas claras — e mediana e média divergem. O valor que importa é o que o olho
vê a um metro do carro. Para achá-lo, aplique desfoque progressivo no chip e veja
onde as duas convergem. Na Carbon Green convergem em V 52,5.

Decomponha também base e flake, que é o que faz a cor se comportar:

| | base entre flakes | faíscas |
|---|---|---|
| MCX-65 Carbon Green | S 14,8 · V 44,7 | S 7,7 · V 81,0 |

O flake é alumínio quase incolor sobre base colorida. Por isso a cor **clareia e
dessatura** sob luz: não é o pigmento mudando, é a faísca branca cobrindo. Sem
isso no prompt, a foto sai menta-azulada.

---

## Acabamentos, com assinatura medida

Cinco acabamentos, e cada um tem um comportamento que precisa aparecer na foto.

| Acabamento | Flake | Reflexo | Como se descreve |
|---|---|---|---|
| Gloss solid | não | formas GRANDES de borda macia | ver o perfil SUPER GLOSS SÓLIDO abaixo |
| Gloss metallic | sim | espelho nítido | flake sob verniz espelhado |
| **Satin solid** | **não** | **nenhum** | faixa LARGA e macia de luz, sem imagem espelhada |
| **Satin metallic** | **sim, grosso** | **nenhum** | flake visível E faixa macia, nunca espelho |
| **Matt metallic** | **sim** | **nenhum** | luz espalha, flake acende sob luz rasa |

Medições de referência, em granulação absoluta na foto da brochure:

| Cor | Acabamento | Granulação |
|---|---|---|
| MCX-12 Gotham Black | satin solid | 2,2 |
| MCX-10 Jet Black | gloss solid | 2,6 |
| MCX-99 Obsidian Black | gloss metallic | 5,1 |

Granulação até ~3 é sólido sem flake. Acima de 5, tem flake.

---

## Perfil SUPER GLOSS SÓLIDO

Padrão fechado e aprovado na Speed Wrapping ESG-030. **Vale para toda cor de
brilho sem pigmento metálico** — a linha ESG inteira, a EGB, e qualquer gloss
sólido de outras marcas.

### O que caracteriza

Filme de **liner PET**: a face cura contra uma folha plástica lisa em vez de papel,
então não guarda casca de laranja. A superfície é opticamente plana. O pigmento é
**sólido, opaco e homogêneo** — sem flake, sem pérola, sem candy translúcido.

### Como ele se comporta na imagem

A confusão que custou três rodadas: **superfície lisa não significa reflexo
detalhado.** O que reflete no carro é o céu, que é uma fonte enorme e difusa — e
fonte enorme reflete como *gradiente*, não como imagem. Então:

- O painel é um **campo cremoso e uniforme**, como tinta automotiva sólida recém
  aplicada ou porcelana vitrificada.
- O brilho aparece em **formas GRANDES e de borda MACIA**: gradientes amplos
  varrendo porta e capô, reflexo escuro e desfocado do entorno empoçando na
  lateral, e **um filete especular limpo e contínuo** na linha do ombro.
- Só objeto de borda dura — quina de prédio, linha do horizonte — reflete nítido,
  e aparece como duas ou três formas definidas. Nunca como textura espalhada.
- Ampliando qualquer centímetro da pintura: liso, sem feição, sem grão.

### Assinatura numérica

Multiescala da variação de alta frequência ÷ luminância média, medida numa janela
100% material, longe de borda e de especular:

| Fonte | 3 px | 5 px | 9 px | 17 px | razão 3/17 |
|---|---|---|---|---|---|
| Charger gloss sólido (referência de campo) | 3,90% | 5,22% | 6,09% | 7,84% | **0,50** |
| ESG-030, amostra física em luz difusa | 1,82% | 2,84% | 4,17% | 5,43% | 0,34 |
| ESG-030, foto aprovada | 6,52% | 8,68% | 10,71% | 13,01% | **0,50** |

**A razão 3/17 é o critério, não o nível absoluto.** Perto de 0,50 e monotônica
crescente = gradiente, ou seja, sólido. Se a energia em 3 px subir a ponto de a
curva achatar, tem partícula e a foto virou metálica.

Especular: 0% de pixels acima de 235 de luminância. Gloss sólido em luz macia não
estoura — o realce é largo e suave, não um pico branco.

### Texto de prompt, pronto

> The bodywork must look like FRESHLY SPRAYED SOLID AUTOMOTIVE PAINT, or like
> smooth glazed porcelain. Across every panel the color is a CREAMY, BUTTERY,
> PERFECTLY UNIFORM FIELD. There is absolutely NO micro-texture of any kind: no
> grain, no speckle, no sparkle, no glitter, no shimmer, no metallic flake, no
> aluminium particles, no pearl, no candy, no iridescence, no noise. If you zoom
> into any square inch of the paint, it must be a completely smooth, featureless
> expanse of color. Any granularity anywhere — especially inside the highlights —
> is wrong.
>
> The gloss shows itself NOT as fine detail but as LARGE, SOFT, BROAD tonal
> shapes: big smooth gradients sweeping across the panels, soft blurry dark
> reflections pooling on the flanks, and one long clean unbroken specular
> highlight running down the shoulder line. The reflections are BIG and
> SOFT-EDGED, the way a wide sky reflects in wet paint — not a busy, detailed,
> high-frequency mirror image. Only a very few hard edges appear, where a building
> edge or the horizon line reflects. The panel surface is perfectly flat and
> glass-smooth with NO orange peel, no ripple, no waviness.

**Luz:** fonte grande e macia — céu claro levemente velado, luminoso e generoso,
nunca sol pontual duro. Exposição clara, para a cor saturada não morrer. Sem
golden hour, sem nublado pesado, sem reflexo cintilante.

**Nunca escreva no prompt** "espelho nítido", "reflexo de borda afiada", "mirror
reflections with razor-sharp edges". É o caminho mais curto para um falso metálico:
o modelo enche o painel de estrutura fina, e estrutura fina espalhada é o que o
olho lê como flake.

### Contraste com os outros perfis de brilho

| | Super gloss PET sólido | ORACAL 670RA brilhante | Gloss metallic |
|---|---|---|---|
| Face | lisa, sem casca de laranja | **ondulada**, orange peel de calandrado | lisa |
| Borda do reflexo | macia e ampla | **quebrada e ondulada** | macia e ampla |
| Partícula | nenhuma | nenhuma | flake |
| Razão 3/17 | ~0,50 | maior (a ondulação é sinal fino) | maior |

---

### A armadilha do flake, que custou uma rodada

**Granulação se mede em superfície com luz DIRECIONAL, nunca em chip de luz
difusa — e quanto mais escura a base, mais o chip difuso subestima o metálico.**

Medindo granulação *relativa* (variação de alta frequência ÷ luminância média,
que compara cor clara com escura) nas duas fontes de cada cor:

| Cor | Chip (difusa) | Capa (direcional) | Razão |
|---|---|---|---|
| MCX-97 Carbon Steel (V 45) | 8,4% | 8,9% | 1,1 |
| MCX-65 Carbon Green (V 51) | 9,4% | 11,1% | 1,2 |
| **MCX-73 Capri Bronze (V 25)** | **3,2%** | **14,7%** | **4,6** |

Flake só acende sob luz direcional. Base escura sob luz chapada não dá ao flake o
que refletir. Na Capri Bronze isso levou a escrever no prompt que as partículas
eram minúsculas e não deviam parecer purpurina — e a foto saiu praticamente
chapada, com 4,5% de granulação relativa contra 14,7% da capa.

Especular também é número: no chip da Carbon Green só 0,031% dos pixels passam de
235 de luminância. Satin não estoura. Gloss teria pico branco saturado.

### O teste multiescala: como saber se tem flake, de verdade

Granulação num número só é ambígua. Um gradiente de luz e um campo de partículas
podem dar o mesmo desvio-padrão — e foi assim que a ESG-030 quase virou metálica
por engano. O que separa os dois é **em qual escala a energia está**.

Flake é um sinal de 1 a 3 pixels. Gradiente de luz é um sinal de dezenas de
pixels. Então meça a variação de alta frequência em quatro janelas — 3, 5, 9 e 17
px — sempre dentro de uma janela 100% material, longe de borda e de especular:

- **Sólido:** valor baixo em 3 px e **crescendo sempre** com a escala. Toda a
  energia está no gradiente; não há nada de pequeno.
- **Metálico:** valor **alto já em 3 px**, e a curva **achata**. A partícula é o
  sinal, e ela é pequena.

Na amostra física da ESG-030 Gem Red, medida na janela limpa das quatro fotos:

| Escala | 3 px | 5 px | 9 px | 17 px |
|---|---|---|---|---|
| ESG-030 (amostra) | 1,8% | 2,8% | 4,2% | 5,4% |

Monotônica e baixa na ponta fina: **sólido, sem nenhum flake**. O zoom 1:1 na
amostra confirmou — pigmento perfeitamente homogêneo, sem uma única faísca.

### O erro que esse teste evitou, e a regra que fica

Eu tinha lido a ESG-030 como metálica. A granulação relativa dela dava 3,4–4,0%,
que pela nossa própria escala é sólido — mas eu descartei o próprio número porque
achei na internet que a ESSMO vende uma "PET Super Gloss **Metallic** Gem Red", e
assumi que era o mesmo filme.

Não era. É outro fabricante, com nome parecido, para uma cor parecida.

> **Regra: nome de catálogo de terceiro não derruba medição da amostra física.**
> A hierarquia de fontes vale para o acabamento também, não só para a cor. Amostra
> física medida > ficha do próprio fabricante > nome comercial de um concorrente.
> Se o número e o nome brigarem, quem manda é o número — e a conferência é o teste
> multiescala mais um zoom 1:1, não uma busca.

Vale também para a linha inteira: a metadata da ESG que já estava registrada em
`src/lib/data/speedWrappingLines.ts` descrevia "superfície resinada lisa, ultra
gloss mirror wet-look", sem uma palavra sobre metálico. O dado de casa estava
certo desde o começo.

### Pedir "espelho nítido" produz falso metálico

Mesmo depois de eu escrever no prompt "sólido, sem flake, sem purpurina, sem
pérola" seis vezes, a foto continuava parecendo metálica. O problema não estava na
negação do flake — estava na descrição do brilho.

Eu vinha pedindo *"reflexos de espelho com bordas nítidas em toda a lataria"*. O
modelo obedece: enche o painel de estrutura de alta frequência. E estrutura de alta
frequência espalhada pela lataria **é exatamente o que o olho lê como flake**.

Super gloss real não é isso. Numa foto de referência de Charger envelopado em
gloss sólido bege, o painel é um campo **cremoso e uniforme**, com poucas formas
**grandes e de borda macia** — a sombra do teto, o reflexo escuro da porta, e um
único filete especular correndo pela linha do ombro. O céu é uma fonte enorme e
difusa: ele reflete como *gradiente*, não como imagem. Só objeto de borda dura
— quina de prédio, linha do horizonte — reflete nítido, e aparece como duas ou três
formas definidas, nunca como textura.

Multiescala na janela limpa, para calibrar:

| | 3 px | 5 px | 9 px | 17 px | 3/17 |
|---|---|---|---|---|---|
| Referência Charger (gloss sólido) | 3,90% | 5,22% | 6,09% | 7,84% | 0,50 |
| ESG-030, foto aprovada | 6,52% | 8,68% | 10,71% | 13,01% | 0,50 |

A **razão 3px/17px é idêntica** — mesma forma de curva, logo mesma natureza de
superfície: gradiente, não partícula. O nível absoluto maior é só cena de estúdio
com reflexo mais contrastado. **A forma da curva diz o acabamento; o nível diz a
dureza da luz.**

### Lista de negações custa saturação

Padrão medido em três cores seguidas da Speed Wrapping. Quando o prompt carrega
uma fila de guardas de matiz — "NÃO salmão, NÃO coral, NÃO pêssego, NÃO tijolo,
NÃO violeta, NÃO lilás, NÃO lavanda" — o matiz até fica onde se pediu, mas a
**saturação despenca de 15 a 20 pontos**. O modelo parece resolver "não é nenhum
desses" puxando a cor para o cinza, que é o único ponto que não é vizinho de
ninguém.

| Cor | Prompt | ΔH | ΔS |
|---|---|---|---|
| ESG-031 Plum Magenta | com "muted, restrained chroma" | +9,4 | **−21,2** |
| ESG-032 Morganite | com sete negações de matiz | −1,3 | **−18,9** |
| ESG-032 Morganite | cromaticidade em positivo | −11,9 | **−0,7** |

**A regra:** descreva a cromaticidade em POSITIVO e com referência concreta
— "melancia madura", "gomo de toranja", "letreiro de néon coral" — e guarde as
negações para uma ou duas, as que realmente importam. Se o matiz escapar, ele
volta por rotação, que é a correção mais barata que o `recolorir-capa.py` faz: não
estoura nada. Saturação faltando é o caro, porque levantar 20 pontos estoura a
sombra.

**Escolha da base:** entre duas gerações, prefira a que acertou a SATURAÇÃO,
mesmo com o matiz 10 ou 12 graus fora. Nunca o contrário.

### Negar a cor NO CENÁRIO derruba a saturação DA PEÇA

Variante da mesma armadilha, e a mais cara de descobrir porque a frase parece
inofensiva. Para evitar cast de cenário eu escrevia um bloco assim:

> *"Critical: NO GREEN anywhere in the frame except the car itself — no grass,
> no lawn, no hedges, no trees, no foliage, no ivy, no green signage."*

A exceção explícita **"except the car itself" não protege nada**. Na ESG-035
Racing Green o prompt travou em **S 27 contra alvo 46** por três gerações
seguidas, com tudo o mais certo. Trocando aquele bloco por uma frase curta e
positiva dentro da descrição do cenário — *"fine pale gravel underfoot, no
plants or foliage of any kind"* — a saturação subiu para **36 e 42 no mesmo
prompt**, sem mexer em mais nada.

| Prompt | ΔH | ΔS |
|---|---|---|
| ESG-035, bloco "NO GREEN anywhere" | −7,7 | **−19,1** |
| ESG-035, mesma coisa sem o bloco | −2,0 | **−4,4** |

**A regra:** o cenário se descreve pelo que ele É — saibro claro, pedra calcária,
concreto cinza-frio —, não pelo que ele não tem. Se precisar excluir vegetação,
escreva "sem plantas nem folhagem", que é uma categoria de objeto, e **nunca
repita o nome da cor do carro numa negação**. O modelo não separa "verde do
cenário" de "verde da peça": ele lê a palavra e puxa tudo para o cinza.

### Cor no teto: a câmera não mede e a correção não serve (ESG-038 Lava Orange)

**A amostra não é medível pelo celular.** Vermelho-laranja de saturação máxima
estoura o sensor: nas fotos da ESG-038 o canal verde ficou em ~0,5% do vermelho,
ou seja, o celular arredondou para vermelho puro e a nuance de laranja sumiu.
Nenhuma janela de medida recupera isso. Pedir **exposição mais baixa** na hora da
foto (tocar no cartão e arrastar o sol para baixo) e luz do dia. Sem isso, o alvo
vem do **piloto aprovado a olho contra o cartão** — foi o caso aqui (variante B,
`#F31403`).

**A correção do `--tudo` não serve para cor no teto.** A máscara corta valor
acima de 0,80 para proteger o especular, e numa cor com V 95 isso deixa o próprio
filme de fora (máscara de 1% na capa). A gama de saturação para ir de 93 a 99
estoura 6 a 14% dos pixels. Solução: **manifesto sem `leitura`** — o comando pula
a correção — e aceitar as imagens como nascem, desde que batam o piloto. Na
ESG-038 as cinco ficaram a ±3° de matiz do piloto, todas com S 99.

### Cor clara bate no teto de valor da correção (ESG-040, V 86)

A máscara do `--tudo` corta valor acima de 0,80 para proteger o especular. Numa
cor pastel com V 86 o próprio filme fica acima disso: a capa saiu com máscara
de 0% e o comando aplicaria uma gama de valor sobre sombra. Solução: campo
**`val_max`** no manifesto (0,95 aqui). E o macro nasceu em H 349, na borda da
família `rosa` (termina em 350) — máscara vazia. Família nova **`malva`
(300–5)**, que cruza 0° e por isso pega o vermelho do logo: usar com
**`marca_depois`**, nunca com `logo`.

### Sombra sobre o cartão entra na leitura

Na ESG-037 duas das cinco fotos tinham a sombra da mão cobrindo metade do
cartão, sob luz de lâmpada e com a madeira da mesa refletindo. A sombra é plana,
então passa no filtro de "região plana" e entra na medida: essas duas leram
H 75 · V 55, as outras três H 98 · V 78. Juntas, sd(H) 12. **Descarte a foto
com sombra sobre o cartão** — não é dispersão da amostra, é outra luz.

### Cor quase cinza: três armadilhas de uma vez (ESG-036 Armor Green, S 13)

**1. O leitor de amostra perde o cartão.** O `ler-amostra.py` achava o cartão
como a região mais saturada da foto. Numa cor com S 13, a pele da mão e o
reflexo azulado do teclado são mais saturados que o cartão: a primeira leitura
saiu `#6D5D82`, roxo, com dispersão de matiz 69. Use **`--familia`** para
localizar o cartão (a faixa só localiza; a janela de medida continua sem ajuste
manual):

```
python3 scripts/ler-amostra.py --familia verde foto1.jpg foto2.jpg ...
```

**2. O balanço de branco comia a cor.** A referência de branco era "todo pixel
com saturação abaixo de 0,12" — e o cartão inteiro passava nesse filtro. O
balanço tratava a amostra como branco e apagava a própria cor (S 13 caía para
8). Corrigido: o neutro agora é S abaixo de 0,06 e **fora do cartão**. A
ESG-035 lida de novo com o script corrigido dá `#648044` contra `#637F44`
aprovado — as cores já fechadas não se mexem.

**3. A correção do `--tudo` não enxergava o filme.** O `recolorir` exige S acima
de 0,18 para entrar na máscara, e H 76 cai na borda das famílias `verde` e
`amarelo`. Duas mudanças: família nova **`salvia` (50–115)** e o campo
**`sat_min`** no manifesto (0,05 para esta cor). Sem isso a máscara sai vazia e
o comando para.

**E o carro.** Cor quase neutra em carro de painéis retos lê como **fosco**,
mesmo pedindo brilho com todas as letras: o G 63 saiu acetinado três vezes. Não
há contraste de cor para ajudar, então quem mostra o brilho é a CURVA — o
gradiente de claro para escuro rolando pela lataria. **Para cor de saturação
baixa, escolha carro de superfícies curvas.** O Audi RS e-tron GT resolveu na
primeira.

### Satin metallic: negar reflexo demais vira fosco (EMT-022, 30/09)

O primeiro piloto da EMT-022 pedia "NO mirror reflections anywhere" e céu nublado, num
Huracán facetado: saiu fosco chapado, e o João apontou que "nas curvas faltou o
acetinado" — o tom parecia outro. No cartão, o satin metallic faz uma **faixa de brilho
larga e luminosa que corre na curva**, de prata quase perolado a grafite, com o flake
dando um brilho sedoso dentro dela. O que resolveu: descrever o satin como "entre gloss e
matte, como titânio escovado ou cetim — claramente lustroso, não fosco chapado", a faixa
de brilho em positivo (larga, borda macia, nunca espelho), **sol baixo velado de lado**
(não nublado) e **carro de curvas** (Aston Martin DB12). A regra do "carro de curvas para
cor de saturação baixa" vale também para satin.

**Cor quase neutra em cenário neutro não passa pela correção.** Com S ~8 no carro, a
correção por faixa de matiz não pega nada e a família `neutro` seleciona o sal e o céu
junto. Publicada sem `leitura`, com a capa escolhida por medida (S 8 · V 59 contra S 12 ·
V 55 do cartão).

### "Pale" e "muted" não são sinônimos — mexem em eixos diferentes

A mesma armadilha da lista de negações, por outro caminho: adjetivos de baixa
cromaticidade não são intercambiáveis, e escolher o errado joga o VALOR junto.

| Palavra | Saturação | Valor |
|---|---|---|
| **muted**, **dusty**, **mellow**, **restrained** | desce | **desce também** |
| **pale**, **powdery**, **airy**, **porcelain** | desce | **sobe** |

Numa cor clara e pouco saturada — a ESG-034 Ceramic China Blue lê S 46 · V 68 —
pedir "muted blue" entrega a saturação certa e o valor 12 pontos no chão, e aí o
que falta é brilho, que é caro de levantar. **"Pale porcelain blue" entrega os
dois no lugar.** Para cor escura e pouco saturada vale o inverso: "muted" é a
palavra, "pale" clareia o que não devia.

Regra prática: olhe o V da leitura antes de escolher o adjetivo. **V acima de
~60 pede a família do "pale"; V abaixo disso pede a do "muted".** E continue
escrevendo matiz, croma e brilho como três instruções numeradas e independentes
— o adjetivo é reforço, não é a instrução.

> **Como pedir gloss sólido:** "tinta automotiva sólida recém-aplicada", "campo de
> cor cremoso e perfeitamente uniforme", "o brilho aparece como formas GRANDES e de
> borda MACIA, gradientes amplos, mais um filete especular limpo na linha do ombro
> — não como imagem espelhada detalhada", "ao dar zoom em qualquer centímetro da
> pintura tem que ser liso e sem feição". E luz: **fonte grande e macia**, céu claro
> levemente velado, não sol pontual duro.

---

## Luz e cenário, por tipo de cor

Cada regra abaixo nasceu de uma foto que deu errado.

**Cor escura (V abaixo de 30) — nublado DIRECIONAL, nunca chapado.**
Sob nublado pleno ela achata e o acabamento some. Vale para Carbon Steel (V 25,5),
Gotham Black (V 16), Army Olive (V 25,5), Capri Bronze (V 29). Nas fotos da
MCX-97, as de ambiente coberto acertaram o valor e as de céu aberto clarearam
seis pontos.

**Cor média e saturada — CÉU ABERTO, cobertura mata.**
O primeiro teste da Speed Green foi num box de pit: 213 células de sombra contra
28 de lataria, zero células iluminadas. O carro sumiu.

**Cor de baixa saturação — cenário NEUTRO, sem nada colorido por perto.**
Abaixo de uns 15% de saturação a cor pega cast de qualquer superfície. Na Gotham
Black o concreto devolveu um rebote amarelado e os painéis de baixo saíram em
H 26 enquanto os de cima liam H 210. A correção foi escrever no prompt que o piso
é cinza frio.

**Cor quente — longe de tijolo, madeira e ferrugem.** Um bronze a H 29 vira
laranja com pouco cast, e é o eixo em que ele não pode escorregar.

**Carro verde — sem vegetação no quadro.** Verde sobre verde não deixa a cor ser
lida. Na Army Olive o cenário foi pátio de pedra justamente por isso.

**Cuidado com fundo que divide matiz com o carro.** Na Bavarian Blue, mar e céu
estavam na mesma faixa do azul do carro: as fotos não puderam ser corrigidas
depois, porque qualquer rotação de matiz mexeria no mar junto. Se der para
escolher, escolha cenário fora da faixa de matiz da cor — isso preserva a opção
de corrigir.

### Contraste entre painéis

Salto grande de valor entre painéis vizinhos faz o carro parecer duas cores.
Régua dos conjuntos aprovados: salto de 8 a 34 pontos entre painel alto e baixo é
normal em foto externa. Acima disso, incomoda.

Dois defeitos concretos, opostos:

- **Capô lavado** (Bavarian Blue): mandei o capô 40 pontos acima do flanco e ele
  saiu claro E dessaturado, lendo como outra cor. A origem do erro foi tirar a
  "amplitude tonal enorme" da foto de brochure — que é o softbox do estúdio, não
  o material. Metálico fosco sob nublado abre o capô 10 a 12 pontos, não 40.
- **Parachoque escuro** (Plum Crazy): 37 a 40 pontos abaixo do para-lama logo
  acima. Três tentativas de prompt não moveram isso. Quem resolveu foi a correção
  de saturação: com a cor cheia, os dois painéis voltaram a ler como o mesmo
  material.

---

## O que pedir na foto

Quatro fotos por cor, mesmo carro, ângulos diferentes:

1. frontal três quartos, posição baixa
2. traseira três quartos, posição baixa
3. perfil puro, flanco perpendicular à câmera
4. macro do acabamento, com friso preto brilhante no quadro para dar comparação

O macro é onde o acabamento se prova. Coloque sempre um elemento gloss no canto:
sem referência, não dá para o olho julgar se a lataria é fosca ou acetinada.

**Verossimilhança.** Poeira nas saias, pó de freio, marcas de água seca, cascalho,
uma digital perto da maçaneta. Enquadramento levemente descentrado, vinheta leve,
grão de sensor. Reflexo só no vidro e nos frisos. Sem pessoa, sem texto, sem
marca d'água, sem adesivo de patrocínio.

**Carros já usados** — vale variar, e variar de marca:

| Cor | Carro | Cenário |
|---|---|---|
| MCX-96 Urban Steel | Nissan GT-R | Japão, Daikoku e Tatsumi |
| MCX-97 Carbon Steel | Audi RS6 Avant | pátio industrial alemão |
| MCX-63 Speed Green | Mercedes-AMG GT R | paddock de autódromo |
| MCX-12 Gotham Black | BMW M5 F90 | último piso de estacionamento |
| MCX-54 Bavarian Blue | BMW M4 G82 | mirante costeiro no Algarve |
| MCX-87 Plum Crazy | Dodge Challenger SRT | pista de arrancada |
| MCX-66 Army Olive | Land Rover Defender 110 | pátio de pedra rural |
| MCX-65 Carbon Green | Porsche 911 992 | mirante de estrada de montanha |
| MCX-73 Capri Bronze | VW Golf R Mk8 | pátio de serviço industrial |
| ESG-030 Gem Red | Toyota GR Supra A90 | pátio de concreto com prédio de vidro |
| ESG-031 Plum Magenta | Honda Civic Type R FL5 | cais de porto de carga, guindastes pórtico |
| ESG-032 Morganite Gem Red | Nissan GT-R R35 | pátio de concreto, muro board-marked |
| ESG-033 Python Green | Porsche 718 Cayman GT4 | mirante de rocha escura, carro à esquerda |
| ESG-034 Ceramic China Blue | Lexus LC 500 | esplanada brutalista de concreto, céu branco |
| ESG-035 Racing Green | Aston Martin Vantage | pátio de saibro de casarão de pedra calcária |
| ESG-036 Armor Green | Audi RS e-tron GT | chão de pedreira de granito cinza-frio |
| ESG-037 Khaki Grey | Ferrari Roma | pátio modernista de ardósia escura |
| ESG-038 Porsche Lava Orange | Porsche 911 GT3 RS | mirante de estrada de montanha, asfalto e rocha cinza |
| ESG-039 Strawberry Red | Alfa Romeo Giulia Quadrifoglio | estacionamento de cobertura, concreto claro, céu aberto |
| ESG-040 Oolong Milk Tea Pink | Bentley Continental GT | pátio de galeria minimalista, granilite claro e aço grafite |
| ESG-041 Cement Grey | Maserati MC20 | praça de arenito claro em cânion, paredes ocre |
| EDG-020 Liquid Metal Ruby Red | McLaren Artura | pátio de hangar de aeroporto executivo, concreto claro e aço cinza-frio |
| EDG-025 Metallic Solar Gold | Jaguar F-Type R coupé | estrada na crista de barragem de concreto, represa azul-acinzentada e montanhas |
| EMT-022 Satin Metallic Titanium Metal Grey | Aston Martin DB12 | deserto de sal, crosta branca rachada, sol baixo velado |
| EDG-027 Metallic Midnight Purple | Nissan Skyline GT-R R34 (rodas bronze 6 raios) | estrada costeira japonesa, mureta de concreto, mar verde-acinzentado |

Quando o fabricante já escolheu um carro na brochure, é uma boa escolha — foi o
caso do Golf na Capri Bronze e do M4 na Bavarian Blue. E quando a cor reproduz
uma tinta OEM, use o carro daquela marca: Green Hell Magno foi feita para o
AMG GT R.

> **O cenário genérico é uma regressão, e ela acontece sozinha.** Nas primeiras
> cores da Speed Wrapping eu fui escrevendo "clean concrete forecourt, neutral
> grey surfaces" em todas, porque é o pedido mais seguro para não contaminar a
> cor. O resultado é catálogo de renderização, não de fotografia: sem contexto,
> sem lugar, todas as cores no mesmo vazio. O padrão é **cenário com caráter**
> — paddock, mirante, cais, pátio de pedra — escolhido para ficar fora da faixa
> de matiz da cor, mais os detalhes de verossimilhança da seção acima. Neutro é
> a exceção, para cor de baixa saturação, não a regra.

---

## Medição

`scripts/medir-cor.py` compara foto contra leitura. `scripts/recolorir-capa.py`
corrige e mede antes e depois.

### Armadilhas, todas encontradas na prática

**Matiz não significa nada abaixo de ~10% de saturação.** Num preto a 5%, um
nível de canal move o matiz dezenas de graus. As duas ferramentas suprimem o ΔH
nesse caso.

**Recorte fixo não funciona entre enquadramentos diferentes.** O carro ocupa
posições diferentes e o recorte cai em roda ou sombra. Use célula com máscara por
matiz, ou defina o recorte pelo próprio conteúdo.

**Cenário que divide matiz contamina a medida.** Na Army Olive, céu cinza-azulado
e musgo na parede deram H 154 a 169 enquanto o painel real estava em 126 a 132. O
sinal de alerta é a medida discordar do matiz de origem que o corretor reporta:
as duas usam a mesma faixa, então divergência grande é contaminação. Use
`--janela` e, na dúvida, amostre um recorte só de lataria.

**Amplitude larga sozinha não é defeito.** O primeiro alerta escrito disparava
por amplitude de valor e acusou as quatro fotos aprovadas da Speed Green. O que
denuncia capô lavado é a **saturação desabar onde o valor sobe**.

---

## Correção de cor

Regras do `recolorir-capa.py` aprendidas em uso:

**Matiz é circular.** A diferença tem de vir pelo caminho curto, senão numa capa
vermelha os pixels logo acima de 0° são jogados para o outro lado da roda e
aparece um anel verde em volta do label.

**O label tem que ser protegido, e o corte é 55% de saturação.** A 30%, numa capa
roxa parte do próprio filme entra na faixa do magenta, o maior blob une label e
lataria e a elipse cobre o rolo inteiro.

**Cor fraca se corrige por VALOR, não por matiz.** Abaixo de uns 15% de saturação
a máscara por matiz deixa remendo. Use `--familia neutro`, que seleciona por faixa
de valor — foi o que salvou a capa da Army Olive.

**Em foto, use `--janela`.** Sem ela a máscara pega o céu junto do carro. Na
Carbon Green uma rotação de 34° deixou o céu verde.

**Em foto de cena, use `--manter-valor`.** A mediana fica abaixo da leitura porque
metade da lataria está em sombra; levantar isso clareia o carro à toa.

**Gama de valor fora de 0,6 a 1,6 banda o JPEG.** Na foto de detalhe da Plum
Crazy, corrigir V de 68 para 46 exigiu gama 2,0 e o painel saiu com blocos
visíveis, com estouro zero. Nesse caso **regere, não corrija**.

**Cenário de concreto claro contamina cor quente de baixa saturação — `sat_min_cena`.**
Na EDG-025 Solar Gold (H 45, S 43) o concreto da barragem tem um tom quente de H 35–45 com
S 0,15–0,25: cai na mesma faixa de matiz e a correção pintou mureta e asfalto de amarelo.
Quem separa é a saturação — o carro fica em S 0,35–0,60. O campo `sat_min_cena` no
manifesto (0,40 aqui) sobe o corte só nas fotos de cena; a capa segue com o padrão.
**Sempre olhar a prévia corrigida antes do `--commit`**: o número "fechou" não enxerga o
cenário.

**Família na borda da faixa: criar família nova, não forçar.** A geração da EDG-025 nasce em
H 37–41, na rampa de saída de `laranja` (34–48) e de entrada de `amarelo` (35–49); em H 41 as
duas dão 0,5 e a capa saiu com máscara vazia. Família nova **`dourado` (22–62)**, longe do
vermelho do logo — vale com `logo`. Mesmo caso na EDG-027 Midnight Purple (H 255): nasce
na rampa de `roxo` (250–264) e de `azul` (251–265) → família **`violeta` (225–285)**.
**Antes de gerar, olhe onde o matiz da leitura cai nas FAIXAS de `scripts/lib/cor.mjs`:** se
estiver a menos de 14° de uma borda, já use (ou crie) a família centrada nele.

**O carro tem que ser o mesmo nas 4 fotos — até a roda.** Na EDG-027 o piloto veio com roda
bronze de 6 raios e a traseira/perfil com 10 raios. Depois que o piloto é aprovado, escreva
no prompt das outras fotos o detalhe marcante do carro do piloto (roda, cor da pinça, asa).

**Foto de cena com fundo da mesma cor não se corrige.** As da Bavarian Blue foram
publicadas sem correção por isso. A capa é a referência de cor do produto; a foto
de cena tem variação de luz esperada.

### Quando a capa está longe demais: use outra capa da linha como doadora

A capa da ESG-030 estava em V 10,6 · S 50 — quase preta, porque foi gerada
seguindo o nome cadastrado no banco, "black gem red". A leitura é V 60 · S 87.
Levar V de 10,6 a 60 pede gama 0,27, muito além do que o JPEG aguenta.

Regerar não é a única saída. Como **todas as capas da linha saem do mesmo
template**, qualquer uma serve de doadora: escolha a que estiver mais perto do
alvo em saturação e valor, e rotacione o matiz.

Três regras para escolher:

1. **Menor distância em S e V.** Matiz o script rotaciona sem custo; S e V é que
   custam gama. Para a ESG-030 a doadora foi a **ESG-011 Miami Blue** (S 66,4 ·
   V 55,7): S +20,6 e V +4,3. O resultado bateu em `#98144C` contra o alvo
   `#98144E`.
2. **Matiz longe do logo.** A máscara é por faixa de matiz. Doadora azul ou verde
   garante que o logo vermelho da Speed Wrapping fique intocado, mesmo quando o
   alvo é um magenta vizinho do vermelho.
3. **Matiz com folga dentro da faixa.** A ESG-007 Acid Green (S 91,5, quase
   perfeita) foi descartada: H 73,3 cai na borda da rampa da faixa `verde`
   (72–200) e a máscara saiu vazia. Fique a 20° das bordas.

**Passe de neutralização depois.** O realce especular tem saturação baixa e fica
fora da máscara, então ele **carrega o matiz da doadora**: a capa magenta saiu com
brilho ciano. A correção é um segundo passe — isolar o rolo como "tudo que não é o
fundo branco do estúdio" (fechamento morfológico + maior componente + preenchimento
de furos), e dentro dele zerar a cromaticidade de qualquer pixel que ainda esteja
na faixa de matiz da doadora, preservando a luminância. O realce volta a ser branco
neutro, que é o certo para gloss.

Cuidado: o realce corta o rolo de ponta a ponta, então **não é um furo** — um
`binary_fill_holes` na máscara cromática não o alcança. Tem de vir pelo negativo do
fundo.

---

## Publicação

`scripts/publicar-cor.mjs`, com o que subir declarado em
`scripts/data/publicacao.json`.

```
node scripts/publicar-cor.mjs <slug>              baixa, converte e grava
node scripts/publicar-cor.mjs <slug> --apenas 5   refaz só a foto 5
node scripts/publicar-cor.mjs <slug> --commit     commita, sobe, espera o
                                                  deploy e registra no banco
```

São dois passos de propósito: entre eles entra a correção de cor.

**Baixe a versão leve.** O Higgsfield publica um `_min.webp` na mesma resolução do
PNG, com 0,43 MB contra 9,62 MB. Medido: depois do resize para 1600px o PSNR é
38,1 dB e a mediana RGB muda em uma unidade. Por cor, 38 MB viram 1,7 MB.

**A ordem importa e agora é automática.** A loja lê a galeria do banco, não do
código: linha inserida antes do deploy aponta para arquivo que não existe e o
anúncio mostra miniatura quebrada. O script espera as imagens responderem em
produção antes de escrever no banco.

**Duas superfícies, dois caminhos.** A loja (`/loja`) lê `loja_catalogo`, filtrada
por `publicado AND NOT oculto_manual`. A página do catálogo (`/wrap/metamark-mcx`)
monta a grade do código e mostra a linha inteira. Ocultar da loja é um UPDATE;
ocultar do catálogo é mudança de código e deploy.

---

## Tabela de leituras fechadas

| Cor | Hex | H | S | V | Acabamento |
|---|---|---|---|---|---|
| MCX-96 Urban Steel | `#75797A` | 192 | 4,1 | 48 | matt metallic |
| MCX-97 Carbon Steel | `#41413F` | 60 | 3,1 | 25,5 | matt metallic |
| MCX-63 Speed Green | `#548C46` | 108 | 50 | 55 | matt metallic |
| MCX-12 Gotham Black | `#272729` | 240 | 5 | 16 | satin solid |
| MCX-54 Bavarian Blue | `#2B67A8` | 211 | 74 | 66 | matt metallic |
| MCX-87 Plum Crazy | `#684D76` | 280 | 35 | 46 | matt metallic |
| MCX-66 Army Olive | `#344137` | 134 | 20 | 25,5 | satin solid |
| MCX-65 Carbon Green | `#758586` | 185 | 12,5 | 52,5 | satin metallic |
| MCX-73 Capri Bronze | `#4A3E32` | 29 | 32 | 29 | matt metallic |

Sem amostra física, a tolerância declarada é ±5 no valor.
