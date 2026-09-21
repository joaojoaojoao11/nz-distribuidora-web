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
| Gloss solid | não | espelho nítido | reflete o entorno com bordas definidas |
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

Quando o fabricante já escolheu um carro na brochure, é uma boa escolha — foi o
caso do Golf na Capri Bronze e do M4 na Bavarian Blue. E quando a cor reproduz
uma tinta OEM, use o carro daquela marca: Green Hell Magno foi feita para o
AMG GT R.

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

**Foto de cena com fundo da mesma cor não se corrige.** As da Bavarian Blue foram
publicadas sem correção por isso. A capa é a referência de cor do produto; a foto
de cena tem variação de luz esperada.

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
