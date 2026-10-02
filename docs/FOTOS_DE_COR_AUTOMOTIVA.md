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
| EDG-019 Liquid Metal Austin Gold | H41–43 · S no teto | — | câmera estourou (S 99); alvo = piloto A aprovado (H 37, mais âmbar que o cartão — escolha do João) |
| EMT-025 Satin Metallic Matt Deep Blue | H224 S75 V55 (**medido à mão**) | 4,6 | `ler-amostra` deu S 10–18: o asfalto azulado entrou na detecção do cartão. Quando a leitura contradiz o que se vê, medir o miolo do cartão à mão |
| EDG-016 Liquid Metal Space Silver | V 53 (mediana, foto plana WA0127) · S ~5 → alvo `#73767A` | — | **cartão quase espelho**: topo = céu (V 75–95), base = chão (V 12–30); a média leu prata claro e o piloto saiu V 75 (reprovado). A cor própria está na foto em que o cartão fica mais plano |
| EDG-018 Liquid Metal Agate Green | H132–137 · S no teto · V 44–50 (à mão) | — | câmera estourou (S 97–99); alvo = piloto B aprovado (H 140 · S 94) |
| EDG-021 Liquid Blue Berry | H219–222 · S 86–99 · V 47–82 (à mão) | 1,4 (H) | matiz confiável; S quase no teto; alvo = piloto B (H 220) |
| EMT-023 Satin Metallic Matt Sakura Pink | S 12–23, instável (à mão) | — | rosa quase branco; alvo = piloto B (H 3 · S 14) |
| EDG-023 Metallic Ruby Gold | H334–345 · S ~52 · V 35–55 (à mão) → `#73374D` | — | `ler-amostra` pegou asfalto/mão; flop rosa-framboesa no destaque e **dourado-bronze na curva escura** |
| EMG-021 Satin Metallic Glossy Agate Green | H172–182 · S 73–93 · V 28–52 (à mão) → `#0F6655` | — | apesar do "satin" no nome, o cartão é brilhante |
| EMT-024 Satin Metallic Matt Pearl Pink | H318–327 · S ~50 · V 77–95 (à mão) → `#E68CC4` (swatch) | — | a medida dava S 50; no swatch ao lado do cartão o fiel foi S 39 · V 90 |
| EGF-012 Gloss Forged Carbon Purple | lascas H 268–284 (`#5A2D8C`) sobre base `#1A1024` | — | padrão, não cor lisa: a referência é o recorte do cartão (textura), não um hex |
| EDG-026 Metallic Paint Metallic Sonoma Green | H94–96 cru → **H88–93 · S 52–59 · V 28–31 com balanço de branco pelo asfalto** | — | o asfalto azulado puxava o verde para o azul; alvo final `#434D2C` (H 78 · S 43), o que fecha a olho com o cartão |
| EMG-022 Satin Metallic Glossy Prunus Sakura Pink | H354–358 · S 21–30 · V 73–89 (à mão) → swatch `#EDB8BA` | — | rosa-salmão pastel; cartão brilhante perolado |
| EGF-010 Gloss Forged Carbon Gold | lascas H 30–36 (`#B07A2A`/`#8A5E1E`) sobre base `#1A120A` | — | padrão: referência é o recorte do cartão |
| EGF-013 Matte Forged Carbon Purple | lascas H 266–284 (`#5A3A80`) sobre base `#161020`, fosco | — | padrão: referência é o recorte do cartão |
| EGF-006 Gloss Forged Carbon Silver | lascas prata-grafite sobre preto | — | padrão: referência é o recorte do cartão; nome corrigido no Tiny/site (era "Carbon Gloss 5D") |
| EGF-017 Shadow Black | camuflagem preto brilhante × cinza-grafite acetinado | — | não é forjado: o padrão aparece pela diferença de brilho |
| EGF-018 Forged Carbon | estilhaços angulosos cinza/grafite sobre preto | — | forjado em estilhaços, não em retângulos |
| ESG-004 Super Gloss Ferrari Red | H 356–1 · S 84–97 · V ~88 (à mão) → `#E31E14` | — | cor no teto: sem correção |
| ESG-011 Super Gloss Miami Blue | H 188–194 · S 87–99 · V 80–86 → `#05A9CD` | — | cor no teto: sem correção |
| ESG-016 Super Gloss Sunflower Yellow | face plana H 39,7 · S 99 · V 89 → **`#E39702`** (âmbar/manga; a 1ª leitura `#F2A705` pegou o reflexo) | — | refeita em 01/10 com prompt "deep amber / marigold / mango, NOT canary"; sem correção (a família `dourado` tinge o cenário) |
| ESG-025 Super Gloss Lavender | H 250–257 · S 38–41 · V 89–92 → `#A996EA` (swatch) | — | asfalto neutro; corrigida com `violeta` + `val_max` 0,95 |
| EMA-007 Matt Army Green | H 104–108 · S 25–32 · V 43–48 (balanço de branco) → `#5A7351` | — | primeira EMA (fosco); gerador entrega oliva acinzentado H ~84 |
| ESG-001 Super Gloss Piano Black | V 4–5 na face sem reflexo → `#0A0A0C` | — | preto neutro: matiz sem sentido nesse valor; medir só entre os reflexos |
| ESG-027 Super Gloss Nardo Grey | V 47 · S 2–8 (2 fotos limpas) → `#747577` | — | o balanço pelo asfalto quente puxou para roxo: fechar neutro conferindo a pastilha ao lado do cartão |
| EMA-008 Matt Tiffany | H 170–171 · S 49–69 → `#48D8C2` | — | fosco segurado contra o céu ganha véu branco (S cai ~20): usar a foto de luz mais limpa |
| EMA-015 Matt Red | H 355–357 · S 81–90 · V 76–93 → `#DD1C2A` | — | sem correção |
| ESG-002 Super Gloss Piano White | V 89-91 · S 7-9 → branco neutro → `#ECEEF1` | — | sem correção |
| ESG-003 Super Gloss Porsche Rouge Red | H 354-357 · S 74-85 · V 84-89 → `#DE2834` | — | sem correção |
| ESG-005 Super Gloss Viper Green | H 103-111 · S 75-81 · V 79-84 → `#49D12E` | — | corrigida: verde só na capa (nasceu H 95) |
| ESG-009 Super Gloss Sapphire | H 218 · S 98-100 · V 89-92 → `#0256E6` | — | sem correção |
| ESG-012 Super Gloss Ice Cream Blue | H 197-200 · S 98 · V 83-91 → `#049EE0` | — | corrigida: azul (nasceu H 202-207) |
| ESG-014 Super Gloss Tiffany | H 176-180 · S 44 · V 81-85 → `#76D6D3` | — | sem correção |
| ESG-015 Super Gloss Shark Blue | H 215-219 · S 90-94 · V 86-99 → `#1366EB` | — | sem correção |
| ESG-017 Super Gloss Maize Yellow | H 47-51 · S 91-95 · V 91-98 → `#F5D314` | — | sem correção |
| ESG-019 Super Gloss Bright Orange | H 14-17 · S 79-89 · V 91-100 → `#F75823` | — | sem correção |
| ESG-021 Super Gloss Beetroot Red | H 343-346 · S 79-89 · V 83-94 → `#E32454` | — | sem correção |
| ESG-023 Super Gloss Peach Pink | H 343-344 · S 43-50 · V 84-100 (rosa-chiclete, não pêssego) → `#F291AD` | — | sem correção |
| ESG-026 Super Gloss Mist Blue | H 214-224 · S 26-36 · V 74-90 → `#A1BAE6` | — | corrigida: azul + val_max 0,95 (traseira/macro nasceram lilás, H 225-227) |
| ESG-028 Super Gloss Brooklyn Grey | V 75-81 · S 4-7, levemente frio → `#C2C6CC` | — | sem correção |
| EMA-003 Matt Orange | H 12-15 · S 75-85 · V 84-97 → `#F2673D` | — | sem correção |
| EMA-004 Matt Yellow | H 38-42 · S 99 · V 81-100 → `#F7A602` | — | sem correção |
| EMA-006 Matt Apple Green | H 98-102 · S 79-82 · V 72-75 (cartão plano) → `#59BF2A` | — | corrigida: verde (nasceu H 90-93; vidro dos prédios intacto) |
| EMA-009 Matt Purple | H 255-260 · S 48-68 · V 49-62 → `#53369E` | — | corrigida: violeta só na capa (nasceu H 247) |
| EMA-011 Matt Medium Blue | H 212-217 · S 73-92 · V 71-83 → `#1C66C7` | — | sem correção |
| EMA-013 Matt Pink | H 327-331 · S 43-51 · V 86-95 → `#E87BB3` | — | corrigida: orquidea (nasceu H 335-342; lanternas continuam vermelhas) |
| EMA-017 Matt Cement Gray | caixa no cartão: H 204-207 · S 19-21 → cinza azulado → `#7A8892` | — | sem correção |
| EDG-001 Metallic Agate Grey | H 229-291 · S 11-17 · V 26-34 (alvo a olho no cartão) → `#2A2B30` | — | sem correção |
| EDG-002 Metallic Soul Red | H 351-353 · S 75-94 · V 71-87 → `#C5253C` | — | sem correção |
| EDG-003 Metallic Mountain Green | H 186-211 · S 13-27 · V 41-73 (alvo a olho no cartão) → `#2F3D3A` | — | corrigida: `verde` |
| EDG-004 Metallic Isle Of Man Green | H 158-163 · S 53-62 · V 53-62 (alvo a olho no cartão) → `#1E8C62` | — | corrigida: `verde` |
| EDG-005 Metallic Indigo Blue Flip Purple Green | H 163-178 · S 25-30 · V 61-70 (alvo a olho no cartão) → `#5F9A8C` | — | corrigida: `verde` |
| EDG-006 Metallic Porshe Urban Green | H 140-154 · S 13-21 · V 63-69 (alvo a olho no cartão) → `#86A897` | — | sem correção |
| EDG-007 Metallic Ice Crystal Blue | H 206-214 · S 31-40 · V 48-75 → `#7B99B6` | — | sem correção |
| EDG-008 Metallic Lamborghini Blue Blast Purple | H 253-264 · S 65-80 · V 65-78 → `#512AB1` | — | sem correção |
| EDG-009 Metallic Violet | H 246-256 · S 38-43 · V 58-78 (alvo a olho no cartão) → `#7D6FC4` | — | sem correção |
| EDG-010 Metallic Gentian Blue | H 221-229 · S 37-67 · V 42-58 (alvo a olho no cartão) → `#1D2858` | — | sem correção |
| EDG-011 Metallic Grey | H 213-229 · S 4-9 · V 69-84 → `#B3B7C0` | — | sem correção |
| EDG-012 Metallic Brown Grey | H 23-28 · S 10 · V 48-68 (alvo a olho no cartão) → `#7E756D` | — | sem correção |
| EDG-013 Metallic Byron Bay Blue | H 205-213 · S 26-34 · V 53-69 (alvo a olho no cartão) → `#5A7590` | — | sem correção |
| EDG-014 Metallic Champane | H 29-39 · S 10-15 · V 70-80 → `#C8BEAF` | — | sem correção |
| EDG-015 Metallic Passion Pink | H 319-325 · S 16-20 · V 76-84 (alvo a olho no cartão) → `#C29AB3` | — | sem correção |
| EMA-005 Matt Lemon Green | H 67-73 · S 64-75 · V 80-88 → `#BED842` | — | sem correção |
| EMA-010 Matt Light Blue | H 198-202 · S 76-99 · V 83-91 → `#179DE0` | — | sem correção |
| EMA-012 Matt Pearl Blue | H 211-218 · S 68-86 · V 65-88 → `#1F60B7` | — | corrigida: `azul` só na capa |
| EMA-014 Matt Rose Red | H 336-338 · S 68-85 · V 83-92 → `#E8357B` | — | corrigida: `orquidea` |
| EMG-001 Satin Metallic Glossy White | H 188-215 · S 4-9 · V 81-90 (alvo a olho no cartão) → `#E3E7EA` | — | sem correção |
| EMG-002 Satin Metallic Glossy Black | cor quase preta, a olho (alvo a olho no cartão) → `#0E0E10` | — | sem correção |
| EMG-003 Satin Metallic Glossy Coal Grey | H 213-256 · S 1-3 · V 37-39 (alvo a olho no cartão) → `#3C3D41` | — | sem correção |
| EMG-004 Satin Metallic Glossy Grey | H 334-345 · S 9-13 · V 36-60 (alvo a olho no cartão) → `#8C8D92` | — | sem correção |
| EMG-005 Satin Metallic Glossy Fire Red | H 355-359 · S 84-92 · V 68-87 → `#C1161E` | — | sem correção |
| EMG-006 Satin Metallic Glossy Orange | H 4-10 · S 84-89 · V 75-87 (alvo a olho no cartão) → `#EE4A1F` | — | sem correção |
| EMG-007 Satin Metallic Glossy Maple Leaf Yellow | H 35-37 · S 96-99 · V 81-94 → `#E68C03` | — | sem correção |
| EMG-008 Satin Metallic Glossy Champagne | H 23-28 · S 21-27 · V 81-87 → `#D3B6A1` | — | sem correção |
| EMG-009 Satin Metallic Glossy Roes Pink | H 348-351 · S 78-90 · V 85-96 → `#E72345` | — | sem correção |
| EMG-010 Satin Metallic Glossy Grape Purple | H 289-305 · S 50-57 · V 37-41 (alvo a olho no cartão) → `#4E2280` | — | sem correção |
| EMG-011 Satin Metallic Glossy Royal Green | H 172-183 · S 39-48 · V 34-67 (alvo a olho no cartão) → `#1A4A44` | — | corrigida: `verde` |
| EMG-012 Satin Metallic Glossy Emerald | H 172-175 · S 41-67 · V 35-81 (alvo a olho no cartão) → `#237A6A` | — | corrigida: `verde` |
| EMG-013 Satin Metallic Glossy Blueberry | H 239-247 · S 65-80 · V 24-48 (alvo a olho no cartão) → `#1A1C96` | — | sem correção |
| EMG-014 Satin Metallic Glossy Sapphire | H 217-224 · S 94-99 · V 51-81 (alvo a olho no cartão) → `#0A50D8` | — | sem correção |
| EMG-015 Satin Metallic Glossy Magic Blue | H 195-198 · S 95-99 · V 74-81 → `#0391C7` | — | sem correção |
| EMG-017 Satin Metallic Glossy Mistblue | H 221-224 · S 26-37 · V 51-73 (alvo a olho no cartão) → `#8A9DBD` | — | sem correção |
| EMT-001 Satin Metallic Matt White | H 89-168 · S 0-4 · V 80-87 → `#CED3CF` | — | sem correção |
| EMT-002 Satin Metallic Matt Black | cor quase preta, a olho (alvo a olho no cartão) → `#1A1A1C` | — | sem correção |
| EMT-003 Satin Metallic Matt Carbon Grey | H 250-261 · S 9-12 · V 43-62 (alvo a olho no cartão) → `#7D8088` | — | sem correção |
| EMT-004 Satin Metallic Matt Titanium Grey | H 253-277 · S 8-9 · V 39-60 (alvo a olho no cartão) → `#A2A5AC` | — | sem correção |
| EMT-005 Satin Metallic Matt Coal Grey | H 209-253 · S 2-6 · V 29-36 → `#4E4F52` | — | sem correção |
| EMT-006 Satin Metallic Matt Grey | H 3-345 · S 7-15 · V 57-64 (alvo a olho no cartão) → `#8F8986` | — | sem correção |
| EMT-007 Satin Metallic Matt Fire Red | H 356-358 · S 74-89 · V 66-86 → `#BD2028` | — | sem correção |
| EMT-008 Satin Metallic Matt Orange | H 9-12 · S 69-91 · V 61-87 (alvo a olho no cartão) → `#E2471F` | — | sem correção |
| EMT-009 Satin Metallic Matt Maple Leaf Yellow | H 38-41 · S 98-99 · V 80-89 (alvo a olho no cartão) → `#EEA302` | — | sem correção |
| EMT-010 Satin Metallic Matt Rose Gold | H 8-11 · S 24-32 · V 80-90 (alvo a olho no cartão) → `#DDB2A8` | — | sem correção |
| EMT-011 Satin Metallic Matt Grape Purple | H 260-266 · S 33-44 · V 52-73 (alvo a olho no cartão) → `#8A70C2` | — | sem correção |
| EMT-012 Satin Metallic Matt Royal Green | H 155-163 · S 30-32 · V 42-46 (alvo a olho no cartão) → `#2A5A48` | — | corrigida: `verde` |
| EMT-013 Satin Metallic Matt Emerald | H 173-177 · S 47-60 · V 33-63 (alvo a olho no cartão) → `#2B776B` | — | corrigida: `verde` |
| EMT-014 Satin Metallic Matt New Grass Green | H 60-68 · S 74-84 · V 74-87 (alvo a olho no cartão) → `#CDE02A` | — | sem correção |
| EMT-015 Satin Metallic Matt Lime | H 65-67 · S 72-76 · V 58-69 (alvo a olho no cartão) → `#B2CC3E` | — | sem correção |
| EMT-016 Satin Metallic Matt Lake Green | H 168-172 · S 53-81 · V 77-81 (alvo a olho no cartão) → `#5ED4C0` | — | corrigida: `verde` |
| EMT-017 Satin Metallic Matt Sea Blue | H 201-207 · S 58-71 · V 68-82 → `#4793C8` | — | sem correção |
| EMT-018 Satin Metallic Matt Lake Blue | H 197 · S 58 · V 73 → `#4F9BBA` | — | sem correção |
| EMT-019 Satin Metallic Matt Sky Blue | H 193-200 · S 48-70 · V 84-93 → `#62BBDD` | — | corrigida: `azul` |
| EMT-020 Satin Metallic Matt Mist Blue | H 213-221 · S 33-37 · V 79-87 → `#8BA8D5` | — | sem correção |
| ESG-006 Super Gloss Apple Green | H 78-82 · S 64-83 · V 85-91 → `#AEE245` | — | sem correção |
| ESG-007 Super Gloss Acid Green | H 58-64 · S 68-91 · V 84-89 → `#D4D837` | — | sem correção |
| ESG-008 Super Gloss Light Lime Green | H 114-134 · S 19-32 · V 60-88 → `#9CD2A1` | — | sem correção |
| ESG-010 Super Gloss Denim Blue | H 206-212 · S 34-52 · V 89-95 (alvo a olho no cartão) → `#A3C8EC` | — | sem correção |
| ESG-013 Super Gloss Sky Blue | H 190-196 · S 64-84 · V 88-90 → `#43BEE1` | — | sem correção |
| ESG-018 Super Gloss Lemon Yellow | H 52-56 · S 83-92 · V 92-95 (alvo a olho no cartão) → `#F0E024` | — | sem correção |
| ESG-020 Super Gloss Mclaren Orange | H 27-32 · S 94-99 · V 100 → `#FF8007` | — | sem correção |
| ESG-022 Super Gloss Coral Orange | H 1-3 · S 65-72 · V 87-95 → `#E74E47` | — | sem correção |
| ESG-024 Super Gloss Rouge Pink | H 352-353 · S 31-33 · V 89-96 → `#EBA0A9` | — | sem correção |
| ESG-029 Super Gloss Volcano Grey | H 182-286 · S 1-5 · V 77-82 → `#C4C5CB` | — | sem correção |
| ECG-001 Candy Gold Green | sombra/meio/luz à mão → `#5BD21E` (candy com pérola dourada) | — | sem correção |
| ECG-002 Candy Gold Violet | sombra/meio/luz à mão → `#7440D0` (candy com pérola dourada) | — | sem correção |
| ECG-003 Candy Gold Lemon Yellow | sombra/meio/luz à mão → `#B6D30A` (candy com pérola dourada) | — | sem correção |
| ECG-004 Candy Gold Sky Blue | sombra/meio/luz à mão → `#3FAAE6` (candy com pérola dourada) | — | sem correção |
| ECG-005 Candy Gold Racing Orange | sombra/meio/luz à mão → `#F25A0A` (candy com pérola dourada) | — | sem correção |
| ECG-006 Candy Gold Pink Purple | sombra/meio/luz à mão → `#EC8496` (candy com pérola dourada) | — | sem correção |
| ECG-007 Candy Gold Blue Chameleon | sombra/meio/luz à mão → `#3FCFCF` (candy com pérola dourada) | — | sem correção |
| ECH-001 Chrome Matte Gold | sombra/meio/luz à mão → `#D2BA0C` (cromo fosco (acetinado)) | — | sem correção |
| ECH-002 Chrome Matte Orange | sombra/meio/luz à mão → `#D0561A` (cromo fosco (acetinado)) | — | sem correção |
| ECH-003 Chrome Matte Red | sombra/meio/luz à mão → `#D23238` (cromo fosco (acetinado)) | — | sem correção |
| ECH-004 Chrome Matte Rose Red | sombra/meio/luz à mão → `#D22A62` (cromo fosco (acetinado)) | — | sem correção |
| ECH-005 Chrome Matte Brown | sombra/meio/luz à mão → `#A65E3A` (cromo fosco (acetinado)) | — | sem correção |
| ECH-006 Chrome Matte Tiffany | sombra/meio/luz à mão → `#0CB38E` (cromo fosco (acetinado)) | — | sem correção |
| ECH-008 Chrome Matte Light Blue | sombra/meio/luz à mão → `#3A8CDC` (cromo fosco (acetinado)) | — | sem correção |
| ECH-009 Chrome Matte Green | sombra/meio/luz à mão → `#30BE2C` (cromo fosco (acetinado)) | — | sem correção |
| ECH-010 Chrome Matte Purple | sombra/meio/luz à mão → `#6B30D8` (cromo fosco (acetinado)) | — | sem correção |
| ECH-011 Chrome Matte Black | sombra/meio/luz à mão → `#34353A` (cromo fosco (acetinado)) | — | sem correção |
| EFG-001 Magic Flip Grey Green | sombra/meio/luz à mão → `#BEC2C6` (pérola com virada de cor / fosco com glitter) | — | sem correção |
| EFG-002 Magic Flip Grey Purple | sombra/meio/luz à mão → `#BFC1CA` (pérola com virada de cor / fosco com glitter) | — | sem correção |
| EFG-003 Magic Flip Volcano Grey | sombra/meio/luz à mão → `#BDBDC2` (pérola com virada de cor / fosco com glitter) | — | sem correção |
| EFG-004 Magic Flip Grey Blue | sombra/meio/luz à mão → `#C8CDD6` (pérola com virada de cor / fosco com glitter) | — | sem correção |
| EFG-005 Magic Crystal White Green | sombra/meio/luz à mão → `#E6E8EC` (pérola com virada de cor / fosco com glitter) | — | sem correção |
| EFG-006 Magic Crystal White Gold | sombra/meio/luz à mão → `#E6E7EA` (pérola com virada de cor / fosco com glitter) | — | sem correção |
| EFG-007 Magic Crystal White Red | sombra/meio/luz à mão → `#E8E9EC` (pérola com virada de cor / fosco com glitter) | — | sem correção |
| EFG-008 Magic Crystal White Blue | sombra/meio/luz à mão → `#E6E9EC` (pérola com virada de cor / fosco com glitter) | — | sem correção |
| EFG-009 Magic Racing Tiffany | sombra/meio/luz à mão → `#7DDDBF` (pérola com virada de cor / fosco com glitter) | — | sem correção |
| EFG-010 Magic Flip Glacial Frost Blue | sombra/meio/luz à mão → `#A48CEC` (pérola com virada de cor / fosco com glitter) | — | sem correção |
| EFG-011 Magic Blue White Gold | sombra/meio/luz à mão → `#C9D3E6` (pérola com virada de cor / fosco com glitter) | — | sem correção |
| EFG-012 Magic Blue White Green | sombra/meio/luz à mão → `#A9C4E8` (pérola com virada de cor / fosco com glitter) | — | sem correção |
| EFG-013 Magic Matte Grey Blue | sombra/meio/luz à mão → `#788D90` (pérola com virada de cor / fosco com glitter) | — | sem correção |
| EFG-014 Magic Matte Grey Red | sombra/meio/luz à mão → `#7C8996` (pérola com virada de cor / fosco com glitter) | — | sem correção |
| EFG-015 Magic Matte Grey Purple | sombra/meio/luz à mão → `#98A2B4` (pérola com virada de cor / fosco com glitter) | — | sem correção |
| EGH-001 Phontom Shadow Black Purple | sombra/meio/luz à mão → `#2F2B3A` (phantom (quase preto com cor escondida)) | — | sem correção |
| EGH-002 Phontom Shadow Jazz Blue | sombra/meio/luz à mão → `#34344E` (phantom (quase preto com cor escondida)) | — | sem correção |
| EGH-003 Phontom Shadow Olive Green | sombra/meio/luz à mão → `#2F342F` (phantom (quase preto com cor escondida)) | — | sem correção |
| EGH-004 Phontom Shadow Black Blue | sombra/meio/luz à mão → `#2D313B` (phantom (quase preto com cor escondida)) | — | sem correção |
| EGH-005 Phontom Shadow Black Gold | sombra/meio/luz à mão → `#2E2F33` (phantom (quase preto com cor escondida)) | — | sem correção |
| EGL-001 Chrome Gloss Silver | sombra/meio/luz à mão → `#A9ABAD` (candy gloss metálico (nome comercial "Chrome Gloss")) | — | sem correção |
| EGL-002 Chrome Gloss Grey | sombra/meio/luz à mão → `#696469` (candy gloss metálico (nome comercial "Chrome Gloss")) | — | sem correção |
| EGL-003 Chrome Gloss Red | sombra/meio/luz à mão → `#94081E` (candy gloss metálico (nome comercial "Chrome Gloss")) | — | sem correção |
| EGL-004 Chrome Gloss Rose Red | sombra/meio/luz à mão → `#991D44` (candy gloss metálico (nome comercial "Chrome Gloss")) | — | sem correção |
| EGL-005 Chrome Gloss Pink | sombra/meio/luz à mão → `#944A80` (candy gloss metálico (nome comercial "Chrome Gloss")) | — | sem correção |
| EGL-007 Chrome Gloss Orange | sombra/meio/luz à mão → `#A63C14` (candy gloss metálico (nome comercial "Chrome Gloss")) | — | sem correção |
| EGL-008 Chrome Gloss Gold | sombra/meio/luz à mão → `#B38D07` (candy gloss metálico (nome comercial "Chrome Gloss")) | — | sem correção |
| EGL-009 Chrome Gloss Green | sombra/meio/luz à mão → `#078C12` (candy gloss metálico (nome comercial "Chrome Gloss")) | — | sem correção |
| EGL-010 Chrome Gloss Tiffany | sombra/meio/luz à mão → `#06A08A` (candy gloss metálico (nome comercial "Chrome Gloss")) | — | sem correção |
| EGL-011 Chrome Gloss Blue | sombra/meio/luz à mão → `#0B2C94` (candy gloss metálico (nome comercial "Chrome Gloss")) | — | sem correção |
| EGL-012 Chrome Gloss Light Blue | sombra/meio/luz à mão → `#057CA1` (candy gloss metálico (nome comercial "Chrome Gloss")) | — | sem correção |
| EHM-001 Chrome Metallic Gold | sombra/meio/luz à mão → `#DCC40C` (cromo metálico acetinado) | — | sem correção |
| EHM-002 Chrome Metallic Rose Red | sombra/meio/luz à mão → `#DC2A58` (cromo metálico acetinado) | — | sem correção |
| EHM-003 Chrome Metallic Red | sombra/meio/luz à mão → `#D23A34` (cromo metálico acetinado) | — | sem correção |
| EHM-004 Chrome Metallic Orange | sombra/meio/luz à mão → `#E05A18` (cromo metálico acetinado) | — | sem correção |
| EHM-005 Chrome Metallic Light Blue | sombra/meio/luz à mão → `#2A7EDC` (cromo metálico acetinado) | — | sem correção |
| EHM-006 Chrome Metallic King Blue | sombra/meio/luz à mão → `#2747D0` (cromo metálico acetinado) | — | sem correção |
| EOX-001 Oxide Chrome Silver | sombra/meio/luz à mão → `#D4D7DB` (oxide (cromo fosco metálico)) | — | sem correção |
| EOX-002 Oxide Red | sombra/meio/luz à mão → `#942C35` (oxide (cromo fosco metálico)) | — | sem correção |
| EOX-003 Oxide Ghost Venom Green | sombra/meio/luz à mão → `#1E3A32` (oxide (cromo fosco metálico)) | — | sem correção |
| EOX-004 Oxide Dusk Purple | sombra/meio/luz à mão → `#6430D2` (oxide (cromo fosco metálico)) | — | sem correção |
| ERW-001 Rainbow Grey | sombra/meio/luz à mão → `#5E5F66` (glitter holográfico arco-íris) | — | sem correção |
| ERW-002 Rainbow Silver | sombra/meio/luz à mão → `#9A9BA2` (glitter holográfico arco-íris) | — | sem correção |
| ERW-003 Rainbow White | sombra/meio/luz à mão → `#E4E7EE` (glitter holográfico arco-íris) | — | sem correção |
| ERW-004 Rainbow Matte Grey | sombra/meio/luz à mão → `#4E5058` (glitter holográfico arco-íris) | — | sem correção |
| ERW-005 Rainbow Matte Silver | sombra/meio/luz à mão → `#9EA1A8` (glitter holográfico arco-íris) | — | sem correção |
| ERW-006 Rainbow Matte White | sombra/meio/luz à mão → `#DADCE2` (glitter holográfico arco-íris) | — | sem correção |
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

### Prata/chumbo: "liquid metal" vira cromo, e a média do cartão engana (EDG-016, 01/10)

Duas reprovações seguidas na mesma cor. **1º par: cromado.** O prompt dizia "liquid-metal…
like molten mercury… reflect the dark surroundings"; em cor colorida isso dá brilho molhado,
mas em prata o modelo entende **espelho** — o carro saiu cromo. **2º par: prata claro (V 75).**
Trocar para "metallic PAINT, not chrome" resolveu o cromo, mas o tom ainda veio da média do
cartão, e o cartão liquid metal é quase espelho: o topo reflete o céu (V 75–95) e a base o
chão (V 12–30). O João: "prata chumbo, quase um cinza". A cor própria estava na foto em que o
cartão fica mais plano (degradê com mediana V 53) → alvo `#73767A`, conferido com swatch ao
lado do cartão antes de gerar.

Regras que ficam: (1) em prata/cinza metálico **nunca** "molten mercury", "mirror",
"reflect the surroundings" — escrever "lead-grey colour of its own; reflections only broad,
soft-edged bands of sky, never a detailed mirror image"; (2) cartão espelhado: **ler a cor
pela foto mais plana**, não pela média de todas; (3) dizer o valor em palavras de nível
("medium-dark, about 48 percent… must read as a darker lead-grey silver, almost a grey — not a
light silver").

**Mesmo carro até a roda, de novo (EDG-016, EDG-021).** Ângulo traseiro puxa outra roda: a
SLS veio com roda fina de 10 raios duas vezes. Resolveu um bloco `WHEELS` próprio descrevendo
a roda do piloto ("chunky… five wide spokes, each split into two parallel bars… NOT thin
multi-spoke"). O Chiron veio com friso C prata e roda clara; resolveu "C-shaped side line
wrapped in the same blue as the body: no polished aluminium, chrome or silver trim".
Conferir roda e friso de cada foto contra o piloto antes da prévia.

### Padrão que não é forjado: descrever o padrão do cartão, não "carbono" (EGF-017, 01/10)

A EGF-017 Shadow Black está na linha de carbono, mas o desenho é uma **camuflagem tom sobre tom**
(manchas de preto brilhante × cinza-grafite acetinado). O prompt descreve exatamente isso ("large,
rounded, organic blotches; some deep glossy black, the others dark graphite-grey with a softer satin
sheen") junto com o recorte do cartão; o macro mostra a borda entre uma mancha brilhante e uma
acetinada, que é o que vende o produto. Regra: na linha EGF, olhar o cartão antes de escrever —
forjado retangular, forjado em estilhaço (EGF-018) e camuflagem pedem descrições diferentes.

### Forjado fosco com flake metálico: não é gloss (EGF-018, 01/10)

A EGF-018 Forged Carbon foi publicada com "high-gloss clear coat over everything" e o João reprovou:
**o material é fosco**. No cartão, a base entre os estilhaços é preta fosca, aveludada, sem reflexo;
só os estilhaços têm um **flake metálico** que acende em cinza-prateado onde bate a luz — o mesmo
brilho das manchas acetinadas da EGF-017, que tinha saído certo. O que enganou: no cartão segurado
contra o sol os estilhaços refletem forte e parecem verniz. Regra: em carbono, separar **a base**
(fosca ou brilhante?) do **flake das lascas** (metálico ou liso?) e escrever as duas coisas no prompt;
o recorte de textura tem que mostrar a base fosca (EGF-018 v2: `3f26a272`). Na dúvida, perguntar
ao João o acabamento antes do piloto.

### Acabamentos especiais: candy, cromo, flip, phantom, oxide, rainbow (lote 10, 02/10)

64 cores de 8 linhas que nunca tinham sido fotografadas. Antes do lote, **um teste de receita por
família** (1 cor, 2 variações). Mesmo assim o João reprovou 22 pilotos — tudo por leitura errada do
acabamento ou do tom, nenhum por erro de carro. O que ficou:

- **O nome comercial engana. Vale o cartão.** A linha EGL se chama "Chrome Gloss", mas o cartão é
  **candy gloss metálico** (cor profunda, flake visível, reflexo de tinta) — não espelho. Pedir
  "chrome/mirror" fez espelho colorido e o João reprovou a linha inteira. Receita aprovada:
  "candy gloss metallic... It is NOT chrome and NOT a mirror - reflections are the sharp reflections
  of glossy paint, and the colour itself has depth, like looking into coloured glass. The metallic
  flake sparkles visibly in the sun as fine grain."
- **Oxide (EOX) é cromo fosco metálico, não filme escuro.** O texto "a very dark satin metallic film"
  escureceu o prata (virou grafite) e o vermelho (virou vinho). O que funcionou: "a brushed, satin-matte
  METAL, like red anodised aluminium... full of a very fine metallic grain... broad, bright, silky
  sheen band".
- **Ler o cartão em três níveis: sombra / meio / luz.** Em cromo, flip e candy uma média só não diz
  nada: o EGH-002 é índigo no meio e ciano-turquesa na luz; o EGL-007 vai de vermelho candy na sombra a
  laranja-dourado na luz. Escrever os três valores no prompt ("about 65 percent on the panels, glowing to
  about 95 percent in the highlights, falling to about 35 percent in shadow").
- **"Gold" vira ouro velho.** ECH-001 e EHM-001 são amarelo vivo com brilho dourado: pedir "bright
  lemon-gold yellow... never old gold, mustard, brass or ochre".
- **Leitura automática escurece neon e rosa claro** (ECG-001, ECG-003, ECG-006): conferir a olho no
  cartão e escrever "Must clearly read as X - never Y" para o erro provável.
- **O piloto aprovado como imagem de referência** nas fotos 3/4/5 resolveu a maior fonte de retrabalho
  dos lotes anteriores (traseira com outra roda, capota, peça ou tom): "a photograph of the EXACT car...
  Keep exactly the same car model and generation, the same wheels, the same trim colours and the same
  wrap film... Only the camera position changes". 0 de 192 fotos refeitas por carro.
- **Capa: duas receitas por cor** — 1 só texto (ESG-034 + ESG-033 nas brilhantes), 2 com o piloto como
  referência de cor e acabamento. Nenhuma ganha sempre; escolher por cor.
- **Correção de cor desligada** nesses acabamentos: reflexo de cromo, faísca de glitter e virada de cor
  caem fora da faixa da família e a máscara mancha.
- Com 13 frentes em paralelo o Higgsfield recusou ~16% dos envios ("Something went wrong"), sem cobrar.
  Reenviar só os recusados, 2 frentes por vez, com nova tentativa — passaram todos.

### Lote de 65 cores de uma vez (lote 9, 01/10)

Todas as cores com amostra no Drive num lote só. Rascunho conferido contra as regras de cenário,
130 pilotos (2 por cor), 327 imagens no resto (195 fotos + 130 capas + 2 frentes novas), enviadas
em 28 chamadas de 12 por 14 agentes em paralelo — tudo gerado em cerca de 5 minutos. Pilotos: 55 A,
10 B, **nenhum errado de cor ou acabamento**. O que apareceu, e a regra que fica:

- **Verde escuro e esmeralda puxam para petróleo** (H +10 a +30: EDG-004, EDG-005, EMG-011,
  EMG-012, EMT-012, EMT-013, EMT-016). Das 12 correções, 8 foram com a família `verde`. Em verde com
  matiz abaixo de ~175, já contar com a correção no manifesto.
- **Verde quase preto sai grafite neutro** (EDG-003, S 23 · V 24): a correção não salva, porque a
  máscara de verde fica vazia. Refazer pedindo "clearly GREEN in daylight, never neutral grey and
  never black" — saiu verde-garrafa e a correção fechou o resto.
- **A configuração do carro precisa estar no texto**: o BMW Z8 do piloto saiu conversível aberto e
  a traseira/perfil vieram com capota rígida; a Kombi do piloto saiu toda menta e a traseira/perfil
  vieram saia-e-blusa com teto branco. Escrever "roof DOWN, no hardtop" e "ONE single colour all
  over, NOT two-tone, no white roof".
- **Nome de versão vira letreiro**: "Wrangler Rubicon" pôs RUBICON no capô de um dos pilotos.
  Tirar a palavra do prompt e pedir "plain bonnet with no decals".
- Lista de preparo gerada no Windows sai com CRLF: o `\r` grudou no slug (cor "não está no
  manifesto") e na flag (`--corrigir` ignorada). Gerar com `newline='\n'` ou limpar o `\r` no laço.

### Lote de 20 cores de uma vez (lote 8, 01/10)

O João pediu um teste com 20 cores. Rascunho conferido contra as regras de cenário, 40 pilotos (2 por
cor) em 4 chamadas, 100 imagens no resto (60 fotos + 40 capas) em 9 chamadas. Resultado: **nenhum
piloto errado de cor ou acabamento**; as escolhas foram por detalhe (geração antiga do carro, faixa
no capô). No resto, 6 cores pediram correção e uma pediu refazer:

- **Capa que nasce fora e fotos certas** (ESG-005 verde, EMA-009 violeta): corrigir só a capa com
  `corrigir_apenas: "capa"` no manifesto — o céu azul das fotos fica perto da faixa de matiz e não
  deve ser tocado.
- **Pastel claro** (ESG-026, V 90): a correção precisa de `val_max 0,95`, senão a máscara perde o
  próprio filme.
- **Cinza azulado fosco** (EMA-017): traseira e perfil saíram cinza neutro (S < 1) e não há correção
  possível para cinza neutro (a família pegaria o cascalho junto) — refazer pedindo "clear blue cast,
  visible next to the neutral grey gravel".
- Os arquivos do Higgsfield saem com o mesmo carimbo de hora para o lote inteiro
  (`hf_AAAAMMDD_HHMMSS_<job>.png`): com um link por lote dá para baixar todos testando ±5 s.

### Rascunho conferido contra as regras antes do piloto (lote 7, 01/10)

O primeiro rascunho do lote 7 tinha quatro erros que o João pegou ao perguntar se estava bom; todos
estavam escritos neste manual: Nardo Grey (S ~2) num pasto verde (cor de baixa saturação pede cenário
neutro — o pasto refletiria no cinza e não daria para corrigir), Matt Red com nublado (cor saturada
pede céu aberto) num fiorde (casas vermelhas; e negar a cor no cenário atrai a cor), "Tiffany" no
prompt (o gerador conhece o azul Tiffany, S ~41, contra S ~65 do cartão) e preto sem rodas claras nem
nublado direcional. Revisado, o lote saiu sem nenhum piloto refeito. Regra: **antes de mandar o
rascunho, passar cada cor pela seção "Luz e cenário, por tipo de cor"**, conferir se o nome
comercial da cor puxa o gerador para outro tom e fixar as rodas no prompt.

Outros dois achados do lote: (1) o carro pode ganhar peça que o piloto não tem — o perfil do R8 veio
com aerofólio alto; escreva "NO rear wing" quando o piloto não tiver; (2) correção de fosco com
`manterValor` desligado deixa o carro chapado (perde a sombra); nas fotos ela roda sempre com o valor
mantido, e só a capa usa o modo sem valor.

### Amarelo-âmbar lido como limão (ESG-016, 01/10)

A ESG-016 Sunflower Yellow foi publicada amarelo-canário (H 42–45 · V 96–98) e o João reprovou com
uma foto do cartão **na frente da ESG-017** (limão, H 53): a face plana da ESG-016 dá H 39,7 · S 99 ·
V 89 → `#E39702`, um amarelo-âmbar puxado para manga. Dois erros somados:

1. **Leitura no reflexo.** A primeira leitura (`#F2A705`) pegou a parte do cartão que estava no
   brilho; ali o valor sobe e o matiz anda para o amarelo (H 45 no brilho × H 39,7 na face plana do
   mesmo cartão). Medir a **face plana bem iluminada**, nunca a faixa mais clara.
2. **O nome puxa o gerador.** "Sunflower" + V 95 ancorou no canário. Para âmbar, o prompt que
   acertou de primeira foi "a deep amber yellow, a warm marigold or mango yellow that leans clearly
   toward orange … NOT a bright canary yellow", com V ~88 → H 36–38 iluminado.

Correção não serviu: a família `dourado` (22–62) pegou as rochas calcárias e o pasto das Dolomitas
(com `manterValor` desligado, a paisagem inteira ficou laranja). Amarelo num cenário de pedra e pasto
quentes → **refazer com o prompt certo**, não corrigir. E a melhor referência de tom é o **irmão de
linha ao lado** no mesmo cartão: a diferença relativa entre os dois não depende do balanço de branco.
Fotos refeitas: frontal `9b244d73`, traseira `5a21a2de`, perfil `c6443c48`, macro `7129a767`, capa
`46c2d9be`.

### Verde-militar fosco: correção que mancha a porta ou tinge o cenário (EMA-007, 01/10)

O gerador entregou o Army Green como oliva acinzentado (H 84 · S 18; cartão H 105 · S 29). Corrigindo
com o `sat_min` padrão (0,18), as partes mais cinzentas da lataria (S 10–18) ficaram fora da máscara e
o **perfil saiu com manchas verdes na porta**. Baixando `sat_min` para 0,06 com a família `musgo`
(40–130), o **concreto amarelado e a torre ficaram verdes**. O que fechou: família nova `militar`
(65–130) — fora do concreto (H 40–60) e do cinza-azulado do hangar — com `sat_min`/`sat_min_cena`
0,06. Regra: em cor de saturação baixa, conferir na prévia **a lataria inteira (manchas)** e **o
cenário (vazamento)**, e estreitar a faixa de matiz antes de mexer no limite de saturação.

**Fosco de verdade (EMA):** "true MATTE: flat dead-matte like a military vehicle or matte rubberised
paint; NO clear coat, NO gloss, NO reflections, NO satin sheen band; light falls off softly like on
suede; the black trim and glass stay glossy". Saiu certo de primeira; capa só com a ESG-034
(geometria) e "NO specular band, only a soft diffuse lightening".

### Família de correção que cruza o vermelho pinta a lanterna (EMT-024, 01/10)

A `malva` (300–5) cruza 0 grau. Num carro rosa, ela corrige o rosa **e** puxa a lanterna
vermelha para magenta: no i8 da EMT-024 as lanternas saíram rosa-choque. Criada a família
`orquidea` (305–352): pega rosas entre H ~319 e ~338 com folga de rampa e deixa o vermelho
(H ≥ 355) de fora. Regra: em carro rosa/magenta, **olhar a lanterna traseira na prévia**; se a cor
nasce abaixo de ~338, usar `orquidea` (com `logo`, sem `marca_depois`). Acima disso (rubi, H 341–349,
EDG-023) não há faixa que separe da lanterna: a barra de luz fica levemente rosada; avisar o João.

### "Olive" ancora no cáqui: o gerador não acerta o verde-oliva (EDG-026, 01/10)

Seis pilotos da EDG-026 Sonoma Green, com "olive green", "army green", "clearly GREEN… not khaki" e
"deep moss green", saíram todos em **H 50–64**, um oliva-cáqui, contra **H 88–93** do cartão (com
balanço de branco). Trocar a palavra não resolve. O que fechou: aceitar o piloto mais verde e corrigir
na publicação com a família nova `musgo` (40–130), que pega a geração em H ~54 e leva até o alvo.
**Correção total para o hex do cartão (`#384C1E`, S 60) deixou o carro verde-limão** e transformou o
flake dourado em verde. O alvo que fechou a olho foi o meio do caminho, `#434D2C` (H 78 · S 43).
Regra: em verde-oliva/musgo, testar a correção no próprio piloto (`recolorir` de `scripts/lib/cor.mjs`)
e mostrar ao João o piloto **já corrigido** como opção B.

**Pastel perto do vermelho fica sem correção (EMG-022).** H 357–5 só cabe na família `vermelho`
(ou `malva`), que pega a lanterna; e cor com V > 0,80 fica fora da máscara padrão. Com o piloto a
~10° do alvo e S ~22, publicar sem correção.

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
| EDG-019 Metallic Liquid Metal Austin Gold | BMW M4 F82 (a cor "Austin Yellow" nasceu nele) | estrada aberta em pinheiral nevado |
| EMT-025 Satin Metallic Matt Deep Blue | Ford GT | praça de cidade antiga mediterrânea, paredes ocre e terracota |
| EDG-016 Metallic Liquid Metal Space Silver | Mercedes-Benz SLS AMG (rodas AMG twin 5-spoke grafite) | estrada em campo de lava negra, cones vulcânicos avermelhados |
| EDG-018 Metallic Liquid Metal Agate Green | Lamborghini Aventador SVJ (rodas forjadas pretas em Y) | estrada no deserto entre dunas douradas |
| EDG-021 Metallic Liquid Blue Berry | Bugatti Chiron (rodas grafite, pinça azul, C lateral na cor do carro) | estradinha entre vinhedos de outono, casa de pedra |
| EMT-023 Satin Metallic Matt Sakura Pink | Rolls-Royce Wraith (rodas prata 7 raios) | pátio de jardim zen, cascalho branco rastelado, madeira escura, lanternas de pedra |
| EDG-023 Metallic Ruby Gold | Porsche Taycan Turbo S (rodas pretas 5 raios duplos, aro usinado, pinça amarela) | píer de marina, deck de madeira cinza, iates brancos |
| EMG-021 Satin Metallic Glossy Agate Green | Lotus Emira (rodas grafite 10 raios, calota amarela) | estrada no deserto de rocha vermelha (Valley of Fire) |
| EMT-024 Satin Metallic Matt Pearl Pink | BMW i8 (rodas bicolores preto/usinado) | estacionamento à beira-mar em Malibu, muro de concreto, palmeiras |
| EGF-012 Gloss Forged Carbon Purple | Lamborghini Huracán STO cinza Nardo — **só capô, teto e retrovisores**, fotos de perto | pit lane de autódromo (desfocado) |
| EDG-026 Metallic Paint Metallic Sonoma Green | Lamborghini Urus (rodas pretas) | pedreira de mármore de Carrara |
| EMG-022 Satin Metallic Glossy Prunus Sakura Pink | Maserati GranTurismo (rodas grafite usinadas) | orla do Lago di Como, balaustrada de pedra |
| EGF-010 Gloss Forged Carbon Gold | Ferrari 296 GTB preta — só capô, teto e retrovisores, fotos de perto | estrada alpina (desfocada) |
| EGF-013 Matte Forged Carbon Purple | Porsche 911 GT3 (992) branco — só capô, teto e retrovisores, fotos de perto | rua de cidade, concreto claro (desfocada) |
| EGF-006 Gloss Forged Carbon Silver | Mercedes-AMG GT preto — closes de capô, teto e retrovisores | pátio de concreto claro (desfocado) |
| EGF-017 Shadow Black | BMW M4 (G82) branco — closes | rua de cidade, concreto claro (desfocada) |
| EGF-018 Forged Carbon | McLaren 720S laranja papaya — closes | paddock de autódromo (desfocado) |
| ESG-004 Super Gloss Ferrari Red | Ferrari F8 Tributo (rodas pretas em Y, pinça vermelha) | estrada na praia de areia preta da Islândia, rochas de basalto |
| ESG-011 Super Gloss Miami Blue | Porsche 911 GT3 Touring (rodas prata usinadas) | rua de vila branca andaluza, telhado de terracota |
| ESG-016 Super Gloss Sunflower Yellow | Chevrolet Corvette C8 (rodas grafite) | estrada de montanha nas Dolomitas |
| ESG-025 Super Gloss Lavender | Mercedes-AMG SL 63 (capota preta, pinça cobre) | estrada de ciprestes na Toscana, campos dourados |
| EMA-007 Matt Army Green | Mercedes-AMG G 63 (rodas pretas foscas) | pista de aeródromo de concreto, hangar e torre |
| ESG-001 Super Gloss Piano Black | BMW M8 Competition Gran Coupé (rodas bicolores prata/preto, pinça azul) | praça diante de prédio branco curvo (estilo Heydar Aliyev), piso cinza frio |
| ESG-027 Super Gloss Nardo Grey | Audi R8 V10 performance (rodas pretas em Y, **sem aerofólio**) | lajedo de calcário do Burren (Irlanda), sem vegetação, nublado branco |
| EMA-008 Matt Tiffany | BMW M2 G87 (rodas pretas forjadas) | ruela de kasbah em Aït Benhaddou, muros de taipa ocre, pouco céu |
| EMA-015 Matt Red | Ford Mustang Dark Horse (rodas pretas foscas) | Atlantic Ocean Road (Noruega), ponte curva, rocha cinza, mar azul, sem construção |
| ESG-002 Super Gloss Piano White | Range Rover (L460) | Giant's Causeway, basalto escuro, mar cinza |
| ESG-003 Super Gloss Porsche Rouge Red | Porsche 918 Spyder | Transfăgărășan (Romênia), céu aberto |
| ESG-005 Super Gloss Viper Green | Dodge Viper ACR | Stelvio acima da linha das árvores, paredões de neve |
| ESG-009 Super Gloss Sapphire | Ferrari SF90 Stradale | rua de Guanajuato, fachadas ocre/terracota, pouco céu |
| ESG-012 Super Gloss Ice Cream Blue | Alpine A110 | bosque de bétulas no outono, folhas douradas |
| ESG-014 Super Gloss Tiffany | BMW Z4 M40i (G29) | dunas de gesso de White Sands |
| ESG-015 Super Gloss Shark Blue | Subaru WRX STI (2015-21, rodas douradas) | rua residencial de Tóquio, pouco céu |
| ESG-017 Super Gloss Maize Yellow | Honda NSX (NC1) | Big Sur, falésias e Pacífico |
| ESG-019 Super Gloss Bright Orange | Nissan Z (RZ34) | Grimsel Pass, granito, neve velha, lago escuro |
| ESG-021 Super Gloss Beetroot Red | Mazda MX-5 RF (ND) | Torres del Paine, estepe bege, lago turquesa |
| ESG-023 Super Gloss Peach Pink | Mini Cooper S (F56) | rua de Paris, calcário creme |
| ESG-026 Super Gloss Mist Blue | Porsche Panamera Turbo | praça da Cidade Velha de Praga |
| ESG-028 Super Gloss Brooklyn Grey | BMW M3 Touring (G81) | praça de centro financeiro (estilo Canary Wharf) |
| EMA-003 Matt Orange | Ford Bronco 2 portas | F-road nas terras altas da Islândia, cascalho vulcânico |
| EMA-004 Matt Yellow | Chevrolet Camaro ZL1 (sem faixas) | estrada reta no Mojave, Joshua trees |
| EMA-006 Matt Apple Green | Toyota GR86 | avenida moderna de Dubai, sem plantas |
| EMA-009 Matt Purple | Tesla Model 3 (Highland) | Capitol Reef, arenito dourado, pouco céu |
| EMA-011 Matt Medium Blue | Hyundai Ioniq 5 N | pátio de galpões de tijolo em Manchester |
| EMA-013 Matt Pink | Audi TT RS (8S) | orla de Biarritz, muro de pedra, farol |
| EMA-017 Matt Cement Gray | Lamborghini Huracán Sterrato | leito seco de rio de cascalho nos Alpes |
| EDG-001 Metallic Agate Grey | Aston Martin DBS Superleggera | the deck beside the white cable-stayed Octavio Frias de Oliveira bridge in Sao Paulo, light grey concrete, white steel cables, city towers far behind |
| EDG-002 Metallic Soul Red | Mazda RX-7 (FD3S) | a lakeside road at Lake Kawaguchi with the snow-capped Mount Fuji behind |
| EDG-003 Metallic Mountain Green | Bentley Bentayga | the white curved concrete arches of Oscar Niemeyer's modernist buildings in Brasilia, pale paving |
| EDG-004 Metallic Isle Of Man Green | Lamborghini Countach LPI 800-4 | Deadvlei, Namibia |
| EDG-005 Metallic Indigo Blue Flip Purple Green | McLaren P1 | the beige tuff rock formations and fairy chimneys of Cappadocia, a dusty road |
| EDG-006 Metallic Porshe Urban Green | Porsche 356 Speedster (classic) | the gravel courtyard of a pale limestone chateau in the Loire Valley |
| EDG-007 Metallic Ice Crystal Blue | Rolls-Royce Spectre | a cobbled street in Edinburgh Old Town, dark grey sandstone buildings, only a strip of sky |
| EDG-008 Metallic Lamborghini Blue Blast Purple | Lamborghini Revuelto | the deep orange dunes of Sossusvlei, Namibia, filling most of the frame, only a strip of sky |
| EDG-009 Metallic Violet | BMW i4 M50 | Zabriskie Point, Death Valley |
| EDG-010 Metallic Gentian Blue | Mercedes-Maybach S 680 | Praca do Comercio in Lisbon |
| EDG-011 Metallic Grey | Audi RS7 Sportback (C8) | the Furka Pass in the Swiss Alps |
| EDG-012 Metallic Brown Grey | Audi RS Q8 | the Great Ocean Road above the Twelve Apostles |
| EDG-013 Metallic Byron Bay Blue | Range Rover Velar | beside the white Erasmus bridge in Rotterdam, grey concrete quay, steel and glass |
| EDG-014 Metallic Champane | Maserati Levante Trofeo | the white marble plaza of the Sheikh Zayed Grand Mosque in Abu Dhabi, white columns and domes |
| EDG-015 Metallic Passion Pink | Volkswagen Beetle (2012-2019) | a whitewashed lane in Oia, Santorini |
| EMA-005 Matt Lemon Green | McLaren 570S | the white sand dunes of Lencois Maranhenses, Brazil, with small blue lagoons |
| EMA-010 Matt Light Blue | Ford Focus RS (Mk3) | the rose-red sandstone cliffs of Petra, Jordan, in sunlight, filling most of the frame, only a strip of sky |
| EMA-012 Matt Pearl Blue | Kia Stinger GT | a road through the terraced vineyards of the Douro valley, schist walls, warm earth, only a strip of sky |
| EMA-014 Matt Rose Red | Chevrolet Corvette C7 Z06 | Glen Coe in the Scottish Highlands |
| EMG-001 Satin Metallic Glossy White | Rolls-Royce Ghost | the Trollstigen mountain road in Norway |
| EMG-002 Satin Metallic Glossy Black | Bugatti Veyron | the pale granite promenade of Marina Bay, Singapore, glass towers behind |
| EMG-003 Satin Metallic Glossy Coal Grey | BMW X6 M Competition | a pale stone plaza beside a curving titanium-clad museum in the style of the Guggenheim Bilbao |
| EMG-004 Satin Metallic Glossy Grey | Porsche Cayenne Turbo GT coupe | the old stone bridge over the gorge in Ronda, Spain, pale limestone cliffs |
| EMG-005 Satin Metallic Glossy Fire Red | Ferrari 812 Superfast | the Amalfi Coast road |
| EMG-006 Satin Metallic Glossy Orange | Ford F-150 Raptor R | the Icefields Parkway in the Canadian Rockies |
| EMG-007 Satin Metallic Glossy Maple Leaf Yellow | Ferrari 488 Pista | the Grossglockner High Alpine Road, Austria |
| EMG-008 Satin Metallic Glossy Champagne | Toyota Land Cruiser 300 | the stone promenade of Lake Lucerne, grey-green lake, mountains behind |
| EMG-009 Satin Metallic Glossy Roes Pink | Alfa Romeo 4C | Chapman's Peak Drive, Cape Town |
| EMG-010 Satin Metallic Glossy Grape Purple | Dodge Charger SRT Hellcat | Valle de la Luna, Atacama |
| EMG-011 Satin Metallic Glossy Royal Green | Jaguar F-Pace SVR | the cobbled road in front of the pale Georgian limestone Royal Crescent in Bath |
| EMG-012 Satin Metallic Glossy Emerald | Koenigsegg Jesko | the red sandstone buttes of Monument Valley, red earth road |
| EMG-013 Satin Metallic Glossy Blueberry | Pagani Huayra | a stone-paved lane in Gion, Kyoto, dark wooden machiya houses, only a strip of sky |
| EMG-014 Satin Metallic Glossy Sapphire | Nissan 370Z Nismo | a street of golden baroque limestone in Noto, Sicily, only a strip of sky |
| EMG-015 Satin Metallic Glossy Magic Blue | Hyundai Ioniq 6 | a cobbled colonial street in Ouro Preto, Brazil |
| EMG-017 Satin Metallic Glossy Mistblue | Polestar 1 | a Mayfair street in London |
| EMT-001 Satin Metallic Matt White | Tesla Model S Plaid | Teide National Park, Tenerife |
| EMT-002 Satin Metallic Matt Black | Mercedes-AMG ONE | the grey asphalt and white architecture of the Yas Marina circuit in Abu Dhabi |
| EMT-003 Satin Metallic Matt Carbon Grey | Koenigsegg Agera RS | beside the white saucer-shaped Niteroi Contemporary Art Museum (Niemeyer), Brazil, pale paving |
| EMT-004 Satin Metallic Matt Titanium Grey | Jaguar E-Type Series 1 coupe (classic) | a Cornish coastal road |
| EMT-005 Satin Metallic Matt Coal Grey | Lucid Air Sapphire | beside the silver curved panels of the Dongdaemun Design Plaza in Seoul, pale paving |
| EMT-006 Satin Metallic Matt Grey | Porsche Carrera GT | El Mirage dry lake bed |
| EMT-007 Satin Metallic Matt Fire Red | Ferrari LaFerrari | the terraced vineyards of Lavaux above Lake Geneva, stone walls |
| EMT-008 Satin Metallic Matt Orange | Lamborghini Miura (classic) | the Corniche road on the Cote d'Azur |
| EMT-009 Satin Metallic Matt Maple Leaf Yellow | Toyota 2000GT (classic) | the Quiraing ridge on the Isle of Skye |
| EMT-010 Satin Metallic Matt Rose Gold | Ferrari Portofino M | the pale limestone city walls of Dubrovnik, stone paving |
| EMT-011 Satin Metallic Matt Grape Purple | BMW Z8 (classic) | a Cotswolds village lane of honey limestone cottages |
| EMT-012 Satin Metallic Matt Royal Green | Aston Martin DB5 (classic) | the pale stone quay of Monaco harbour, white yachts |
| EMT-013 Satin Metallic Matt Emerald | Lotus Evija | the red sand and sandstone cliffs of Wadi Rum, Jordan |
| EMT-014 Satin Metallic Matt New Grass Green | Porsche 718 Boxster | the black lava fields and white houses of Lanzarote |
| EMT-015 Satin Metallic Matt Lime | Lexus LFA | the grey concrete towers and walkways of the Barbican estate in London |
| EMT-016 Satin Metallic Matt Lake Green | Alfa Romeo 33 Stradale (2023) | the white windmills and whitewashed walls of Mykonos |
| EMT-017 Satin Metallic Matt Sea Blue | Chevrolet Corvette C2 Sting Ray split-window coupe (1963) | the pale stone houses of the Sassi di Matera, only a strip of sky |
| EMT-018 Satin Metallic Matt Lake Blue | Porsche 959 (classic) | the orange dunes of Merzouga in the Sahara, only a strip of sky |
| EMT-019 Satin Metallic Matt Sky Blue | Fiat 500e (2020) | the terracotta and ochre porticoes of Bologna, stone paving, only a strip of sky |
| EMT-020 Satin Metallic Matt Mist Blue | Mercedes-Benz EQS | the white marble slopes of the Oslo Opera House, grey fjord water |
| ESG-006 Super Gloss Apple Green | Subaru BRZ | the pale clay badlands of Bardenas Reales, Spain |
| ESG-007 Super Gloss Acid Green | Lotus Exige Cup 430 | the ochre and black volcanic desert of Fuerteventura |
| ESG-008 Super Gloss Light Lime Green | Volkswagen T1 Samba bus (classic) with white roof, | the pale stone seaside promenade of Cascais, white sand |
| ESG-010 Super Gloss Denim Blue | Ford Mustang Fastback (1967) | a mid-century modern house in Palm Springs |
| ESG-013 Super Gloss Sky Blue | Toyota Supra (A80, Mk4) | a narrow street in Seville, ochre and white facades, only a strip of sky |
| ESG-018 Super Gloss Lemon Yellow | Honda S2000 | a coastal road on the Faroe Islands |
| ESG-020 Super Gloss Mclaren Orange | McLaren Senna | a public road beside the Nurburgring, green forest |
| ESG-022 Super Gloss Coral Orange | Mitsubishi Lancer Evolution X | Lake Tekapo, New Zealand |
| ESG-024 Super Gloss Rouge Pink | Jeep Wrangler two-door | the white streets of Sidi Bou Said, Tunisia |
| ESG-029 Super Gloss Volcano Grey | Mercedes-Benz SLR McLaren | a road on Mount Etna |
| ECG-001 Candy Gold Green | Porsche 911 Dakar | the pale grey hoodoos and clay badlands of Bisti, New Mexico, no plants |
| ECG-002 Candy Gold Violet | Lamborghini Huracan Tecnica | the Storseisundet bridge on the Atlantic Road in Norway, grey sea, dark rocks |
| ECG-003 Candy Gold Lemon Yellow | Lotus Esprit | the white salt pans and old windmills of Marsala, Sicily, no plants |
| ECG-004 Candy Gold Sky Blue | BMW M1 | a narrow street of pink sandstone facades in the old city of Jaipur, only a strip of sky |
| ECG-005 Candy Gold Racing Orange | Ferrari F40 | a road above Lake Powell, Arizona, cream and red sandstone, deep blue water, open sky |
| ECG-006 Candy Gold Pink Purple | Porsche 911 Turbo S | the whitewashed lanes and stone steps of Ostuni, Puglia |
| ECG-007 Candy Gold Blue Chameleon | Lancia Stratos HF | a red-earth road in the Australian outback with Uluru far behind, no plants near the car |
| ECH-001 Chrome Matte Gold | Lamborghini Diablo VT | the white chalk formations of the White Desert at Farafra, Egypt |
| ECH-002 Chrome Matte Orange | McLaren 600LT | the grey slate terraces of the Dinorwic quarry in Wales |
| ECH-003 Chrome Matte Red | Ferrari 599 GTO | the hairpins of the Klausen Pass in Switzerland, grey rock, open sky |
| ECH-004 Chrome Matte Rose Red | Mercedes-AMG CLE 53 Coupe | the stone esplanade of La Defense in Paris, Grande Arche behind |
| ECH-005 Chrome Matte Brown | Jaguar XJ220 | the gravel courtyard of a stone winery among vineyards in Napa Valley |
| ECH-006 Chrome Matte Tiffany | Pagani Utopia | a road beside the white travertine terraces of Pamukkale, Turkey, pale stone, no trees |
| ECH-008 Chrome Matte Light Blue | Porsche 911 GT2 RS | a narrow street of honey limestone in Valletta, Malta, only a strip of sky |
| ECH-009 Chrome Matte Green | Lamborghini Murcielago LP640 | the cream sand dunes around the Huacachina oasis in Peru, no palms near the car |
| ECH-010 Chrome Matte Purple | Koenigsegg Regera | the stone ramparts and narrow lane of the medieval city of Carcassonne, only a strip of sky |
| ECH-011 Chrome Matte Black | Cadillac CT5-V Blackwing | the white sculptural shell of the Ordos Museum in Inner Mongolia, pale paving |
| EFG-001 Magic Flip Grey Green | Audi RS 5 Sportback | the white concrete forecourt of the Sydney Opera House |
| EFG-002 Magic Flip Grey Purple | Rimac Nevera | the waterfront promenade of HafenCity in Hamburg with the Elbphilharmonie behind, grey paving, light grey sky |
| EFG-003 Magic Flip Volcano Grey | Lamborghini Gallardo | the grey volcanic ash plain below Mount Bromo, Java |
| EFG-004 Magic Flip Grey Blue | BMW i7 M70 | the pale granite forecourt of Parliament House in Canberra |
| EFG-005 Magic Crystal White Green | Bentley Bacalar | the dark brick industrial halls of the Zollverein colliery in Essen |
| EFG-006 Magic Crystal White Gold | Bentley Flying Spur | the dark basalt harbour wall and grey sea of Ponta Delgada, Azores |
| EFG-007 Magic Crystal White Red | Rolls-Royce Phantom | the grey stone old bridge Stari Most in Mostar, grey stone houses |
| EFG-008 Magic Crystal White Blue | Aston Martin DB11 | the dark slate road above the Geirangerfjord, grey rock walls |
| EFG-009 Magic Racing Tiffany | Alfa Romeo 8C Competizione | the sand-coloured square in front of the Koutoubia mosque in Marrakech, no palms near the car |
| EFG-010 Magic Flip Glacial Frost Blue | McLaren Elva | the grey granite road at Tunnel View in Yosemite, granite cliffs behind |
| EFG-011 Magic Blue White Gold | Maserati MC12 | the pale facades of Palace Square in Saint Petersburg, grey paving |
| EFG-012 Magic Blue White Green | Volvo P1800 | the art nouveau harbour front of Alesund, Norway, grey stone quay |
| EFG-013 Magic Matte Grey Blue | Aston Martin DBX707 | the car park above Reynisfjara black sand beach in Iceland, black basalt columns, grey sea |
| EFG-014 Magic Matte Grey Red | Range Rover Sport SV | the stone harbour of St Ives, Cornwall, grey granite quay |
| EFG-015 Magic Matte Grey Purple | Aston Martin Valhalla | the pass road at Passo Giau in the Dolomites, grey scree, no meadow near the car |
| EGH-001 Phontom Shadow Black Purple | McLaren Speedtail | the pale limestone quarry on the Isle of Portland, Dorset |
| EGH-002 Phontom Shadow Jazz Blue | Rolls-Royce Cullinan | the white curved structures and pale paving of the City of Arts and Sciences in Valencia |
| EGH-003 Phontom Shadow Olive Green | Ineos Grenadier | the pale chalk road at the cliffs of Etretat, Normandy, white cliffs and grey sea |
| EGH-004 Phontom Shadow Black Blue | Mercedes-Maybach GLS 600 | the white terraces and pale stone steps of the Bahai Gardens in Haifa, no lawn near the car |
| EGH-005 Phontom Shadow Black Gold | Ferrari 12Cilindri | the pale gravel forecourt and cream stone wings of the Palace of Versailles |
| EGL-001 Chrome Gloss Silver | Mercedes-Benz 300 SL Gullwing | a straight red-earth road in the Australian outback, flat horizon, big open sky |
| EGL-002 Chrome Gloss Grey | Aston Martin One-77 | a cypress-lined gravel road in the Val d Orcia, Tuscany, rolling hills, open sky |
| EGL-003 Chrome Gloss Red | Bugatti Divo | a wide coastal plateau at Cabo de Sao Vicente, Portugal, low scrub, the lighthouse far away, a big open sky |
| EGL-004 Chrome Gloss Rose Red | Ferrari Daytona SP3 | the beige sand dunes around the Liwa oasis road in Abu Dhabi, big open sky |
| EGL-005 Chrome Gloss Pink | Jaguar C-X75 | the beachfront promenade of Miami South Beach with a pastel lifeguard tower, big sky |
| EGL-007 Chrome Gloss Orange | Ford GT40 | a road through the black lava fields of the Snaefellsnes peninsula, Iceland, big open sky |
| EGL-008 Chrome Gloss Gold | Koenigsegg Gemera | the dark grey coast road of the Lofoten islands, grey mountains, big sky |
| EGL-009 Chrome Gloss Green | Zenvo TSR-S | the black sand flats of Myrdalssandur, Iceland, no vegetation, big open sky |
| EGL-010 Chrome Gloss Tiffany | Pagani Zonda | the pink granite rocks of the Ploumanac h coast in Brittany, no grass near the car, big sky |
| EGL-011 Chrome Gloss Blue | Hennessey Venom F5 | a square of ochre walls in the medina of Fez, only a strip of sky |
| EGL-012 Chrome Gloss Light Blue | SSC Tuatara | the ochre and red clay cliffs of Roussillon in Provence, only a little sky |
| EHM-001 Chrome Metallic Gold | Ferrari Testarossa | the slate-grey plateau at the North Cape, Norway, grey sea, open sky |
| EHM-002 Chrome Metallic Rose Red | Maserati Ghibli Trofeo | the grey stone causeway to Mont-Saint-Michel, tidal flats |
| EHM-003 Chrome Metallic Red | Ferrari Enzo | the hairpins of the Col de Turini in the French Alps, grey rock, open sky |
| EHM-004 Chrome Metallic Orange | Toyota GR Yaris | the grey shingle beach of Dungeness with the old black lighthouse |
| EHM-005 Chrome Metallic Light Blue | Audi RS 3 Sportback | a narrow stone lane of the old town of Toledo, Spain, only a strip of sky |
| EHM-006 Chrome Metallic King Blue | Ford Mustang GTD | the viewpoint road below the Millau Viaduct in France, pale limestone, open sky |
| EOX-001 Oxide Chrome Silver | Aston Martin Valkyrie | a road through the dark green pine forest of the Black Forest, Germany |
| EOX-002 Oxide Red | Lamborghini Sian FKP 37 | the cobbled market square of Bruges, grey brick facades with stepped gables |
| EOX-003 Oxide Ghost Venom Green | McLaren 765LT | a gravel road through the Painted Hills of Oregon, red and ochre clay hills, no trees |
| EOX-004 Oxide Dusk Purple | Czinger 21C | the ochre ramparts of the Amber Fort near Jaipur, only a strip of sky |
| ERW-001 Rainbow Grey | BMW XM | the top deck of a concrete rooftop car park in downtown Los Angeles with the skyline behind |
| ERW-002 Rainbow Silver | Cadillac Escalade-V | a plaza of the Lujiazui towers in Shanghai Pudong, grey paving |
| ERW-003 Rainbow White | Tesla Model X | the red rock buttes around Sedona, Arizona, red earth road |
| ERW-004 Rainbow Matte Grey | GMC Hummer EV | a desert road through the golden dunes outside Dubai, open sky |
| ERW-005 Rainbow Matte Silver | Rivian R1T | the red cliffs and slickrock of Canyonlands, Utah |
| ERW-006 Rainbow Matte White | Polestar 3 | a road through a dark green pine forest in the Pacific Northwest |

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

### Linha de carbono (EGF): aplicação parcial, fotos de perto (João, 01/10)

Película com desenho de carbono (carbono, carbono forjado, 3D/5D) é comprada para **detalhe**:
capô, teto, capas de retrovisor, spoiler. A foto da loja mostra isso, e de **perto**: o João
pediu fotos bem próximas das áreas aplicadas, não o carro inteiro. O carro inteiro deixa o desenho
pequeno demais e o gerador não reproduz o padrão nessa escala.

- **Referência da textura é obrigatória.** Só com texto, o forjado saiu granito com pinta dourada,
  depois manchas de onça (01/10). Recortar o miolo do cartão (sem mão, rótulo nem reflexo grande),
  subir no Higgsfield e passar como `medias` com "It defines the PATTERN of the film… keep the same
  chip shape, the same striations and the same chip size relative to the frame". EGF-012:
  `527fad28-5d24-4aef-9a5c-229c89c4807f`.
- Conjunto de fotos: close do capô (com a borda do filme encontrando a pintura), close do
  retrovisor + borda do teto, close do teto, macro da textura. Pintura do carro em cor neutra de
  contraste (cinza Nardo).
- Qualidade `high` nas fotos de textura.
- Correção de cor: não se aplica ao carro (a pintura não é a cor do produto); se precisar, só nas
  lascas.

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
