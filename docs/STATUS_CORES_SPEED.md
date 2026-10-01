# Status das cores Speed Wrapping — fotos da loja

Controle da Cledna. Atualizar a cada passo. Fonte da verdade da cor é o **catálogo físico**
(foto na pasta da cor no Drive `CORES SPEEDWRAP`); o site da Speed só serve para achar o que falta.

Passos: **Amostra** (fotos do catálogo no Drive) → **Leitura** (`ler-amostra.py`) →
**Piloto** (1 frontal, aprovado pelo João) → **Fotos + capa** → **No site** (publicado e
conferido no ar).

`scripts/drive-cores.mjs status` mostra quais pastas do Drive já têm foto.

**Marcação no Drive** (o conector não muda a cor da pasta; o João escolheu marcar no nome,
30/09; **na frente do nome** desde 01/10, a pedido dele): `🟢 ` = amostra do catálogo na
pasta · `✅ ` = fotos e capa 100% no site. Ex.: `✅ EDG-020 LIQUID METAL RUBY RED`.

## Em andamento

| Cor | Nome no catálogo físico | Amostra | Leitura | Piloto | Fotos + capa | No site |
|---|---|---|---|---|---|---|
| EDG-020 | METALLIC LIQUID METAL RUBY RED PET | ✅ 30/09 | ✅ 30/09 — H 349 · S ~100 (teto) · V 54 | ✅ 30/09 — B aprovado (McLaren Artura, pátio de hangar; H349 S79 V42) | ✅ 30/09 — aprovadas as 3 fotos + capa 1 (H353 S95 V56, primeira capa metálica) | ✅ 30/09 — commit `9c19481`, 5 mídias no banco, conferido no ar (capa + 4 fotos carregam); pasta do Drive marcada ✅ |

| EDG-025 | METALLIC PAINT METALLIC SOLAR GOLD PET (NZERP: METALLIC SOLAR GOLD PET — vale o NZERP) | ✅ 30/09 | ✅ 30/09 — `#7F7148` H 45 · S 43 · V 50, sd(S) 2,4 confiável | ✅ 30/09 — B aprovado (Jaguar F-Type R, crista de barragem; H37 S54 V31) | ✅ 30/09 — aprovadas corrigidas (família `dourado`, `sat_min_cena` 0,40; tudo fecha em H 45 · S 43) | ✅ 30/09 — commit `e943eed` (+ `e63cab6` script), 5 mídias no banco, conferido no ar; pasta do Drive ✅ |

| EMT-022 | SATIN METALLIC MATT TITANIUM METAL GREY | ✅ 30/09 | ✅ 30/09 — `ler-amostra` deu H206 S26 (sd(S) 3,3, 3 de 4 fotos) mas era reflexo do céu azul; balanço de branco pelo cartão branco da foto WA0078 (cast H237 S9) → **`#7B848C` H 207 · S 12 · V 55** | ✅ 30/09 — 1º par (Huracán, nublado) saiu fosco demais; João pediu mais acetinado nas curvas; 2º par: **B2 Aston Martin DB12** aprovado (sol baixo velado, faixa de brilho descrita) | ✅ 30/09 — 3 fotos + capa 2 (H218 S8 V59, só ESG-034 de referência), sem correção (quase neutra); liberado pelo João para subir direto | ✅ 30/09 — commit `cf9b5a7`, 5 mídias, conferido no ar; pasta do Drive ✅ |

| EDG-027 | METALLIC PAINT METALLIC MIDNIGHT PLUPLE PET (erro de grafia no cartão; vale o NZERP: METALLIC MIDNIGHT PURPLE PET) | ✅ 30/09 | ✅ 30/09 — `#554C6E` H 255 · S 31 · V 43 (3 de 4 fotos; WA0139 com S 50 descartada), sd(S) 2,5 confiável | ✅ 30/09 — A aprovado (Nissan Skyline GT-R R34, estrada costeira japonesa; H257 S31) | ✅ 30/09 — aprovadas corrigidas + capa 1 (família `violeta`; tudo em H 256 · S 31, capa V 43) | ✅ 30/09 — commit `f4dc279`, 5 mídias, conferido no ar; pasta do Drive ✅ |

| EDG-019 | METALLIC LIQUID METAL AUSTIN GOLD PET | ✅ 30/09 | ✅ 01/10 — H 41–43 firme, **S no teto (99, câmera estourou)**, V 40–65 → sem `leitura`, alvo = piloto aprovado (método da EDG-020); WA0116 descartada | ✅ 01/10 — **A** aprovado pelo João (BMW M4 F82, pinheiral nevado; H37, mais âmbar) | ✅ 01/10 — aprovadas corrigidas (alvo = piloto A, família `laranja`; tudo em H 37 · S 80) | ✅ 01/10 — commit `7ed1292`, 5 mídias, conferido no ar; pasta ✅ |
| EMT-025 | SATIN METALLIC MATT DEEP BLUE | ✅ 30/09 | ✅ 01/10 — `ler-amostra` errou (S 10–18: asfalto azulado entrou no cartão); **medido à mão no miolo do cartão**: `#233F8C` H 224 · S 75 · V 55 (sd(H) 1,2) | ✅ 01/10 — A aprovado (Ford GT, praça mediterrânea ocre; H220 S74) | ✅ 01/10 — aprovadas corrigidas (família `azul`; tudo em H 224 · S 75, capa V 55) | ✅ 01/10 — commit `04a8118`, 5 mídias, conferido no ar; pasta ✅ |

| EDG-016 | METALLIC LIQUID METAL SPACE SILVER PET | ✅ 30/09 | ✅ 01/10 — cartão quase espelho (topo = céu V 75–95, base = chão V 12–30); cor própria na foto plana WA0127 = degradê com mediana V 53 → alvo **`#73767A`** (S ~5, V 48), conferido com swatch | ✅ 01/10 — 3º par; **F** aprovado (`21a79736`). 1º par reprovado (cromado: "liquid metal… molten mercury… reflect the surroundings"); 2º reprovado (prata claro V 75) | ✅ 01/10 — aprovadas pelo João; traseira refeita 2× até vir a roda AMG twin 5-spoke do piloto; macro refeito p/ ler high-gloss; capa 2 (V 45); sem correção (quase neutra) | ✅ 01/10 — commit `d53457a`, 5 mídias, conferido no ar; pasta ✅ |
| EDG-018 | METALLIC LIQUID METAL AGATE GREEN PET | ✅ 30/09 | ✅ 01/10 — à mão: H 132–137 (fotos limpas #0/#1), S 97–99 **no teto**, V 44–50; alvo = piloto | ✅ 01/10 — **B** aprovado (Aventador SVJ, dunas; `104395f7` H139 S93) | ✅ 01/10 — aprovadas corrigidas contra `#077A2D` (família `verde`; tudo em H 140 · S 94, capa V 48) | ✅ 01/10 — commit `49bcf03`, 5 mídias, conferido no ar; pasta ✅ |
| EDG-021 | METALLIC LIQUID BLUE BERRY PET | ✅ 30/09 | ✅ 01/10 — à mão: H 219–222 (sd 1,4), S 86–99 quase no teto, V 47–82; alvo = piloto | ✅ 01/10 — **B** aprovado (Chiron, vinhedo; `3a59579d` H221 S85) | ✅ 01/10 — aprovadas; traseira e perfil refeitos (1ª rodada com friso C prata e roda clara); sem correção (H 218–221) | ✅ 01/10 — commit `138a9ca`, 5 mídias, conferido no ar; pasta ✅ |
| EMT-023 | SATIN METALLIC MATT SAKURA PINK PET | ✅ 30/09 | ✅ 01/10 — à mão instável (rosa quase branco; S 12–23); alvo = piloto | ✅ 01/10 — **B** aprovado (Wraith, jardim zen; `73538848` H0 S15) | ✅ 01/10 — aprovadas; capa satin (só ESG-034); sem correção (quase neutra, S ~14) | ✅ 01/10 — commit `0ad2701` (deploy demorou; registro no banco na 2ª rodada), 5 mídias, conferido no ar; pasta ✅ |
| EDG-023 | METALLIC RUBY GOLD PET | ✅ 30/09 | ✅ 01/10 — `ler-amostra` errou (asfalto H 205 / mão); **à mão**: H 334–345, S ~52, V 35–55 (flop: destaque rosa-magenta, curva escura com reflexo **dourado/bronze** — o "Gold" do nome) → alvo **`#73374D`** (conferido com swatch) | ✅ 01/10 — **B** aprovado (`af172bfb`) | ✅ 01/10 — aprovadas, corrigidas contra `#73374D` (família `malva` + `marca_depois`; tudo em H 338 · S 52, capa V 45); barra de luz traseira levemente mais rosada (malva cruza o vermelho) | ✅ 01/10 — commit `2e648bb`, 5 mídias (capa registrada como imagem principal), conferido no ar; pasta ✅ |
| EMG-021 | SATIN METALLIC GLOSSY AGATE GREEN PET | ✅ 30/09 | ✅ 01/10 — `ler-amostra` errou; **à mão**: H 172–182, S 73–93, V 28–52 (verde-jade escuro, destaque verde vivo; cartão é brilhante, não acetinado) → alvo **`#0F6655`** | ✅ 01/10 — **A** aprovado (`1e674ce2`) | ✅ 01/10 — aprovadas, corrigidas contra `#0F6655` (família `verde`, `sat_min_cena` 0,45; tudo em H 168 · S 85, capa V 40) | ✅ 01/10 — commit `9d88696`, 5 mídias, conferido no ar; pasta ✅ |
| EMT-024 | SATIN METALLIC MATT PEARL PINK | ✅ 30/09 | ✅ 01/10 — `ler-amostra` errou; **à mão**: H 318–327, S ~50, V 77–95 → no swatch o mais fiel é **`#E68CC4`** (H 323 · S 39 · V 90) | ✅ 01/10 — **B** aprovado (`e1e69373`) | ✅ 01/10 — aprovadas, corrigidas contra `#E68CC4` com a família nova `orquidea` (305–352) — a `malva` deixava as lanternas do i8 rosa-magenta; tudo em H 323 · S 39, capa V 90 | ✅ 01/10 — commit `d050dff` (+ família `orquidea` nos 3 scripts), 5 mídias, conferido no ar; pasta ✅ |
| EGF-012 | GLOSS FORGED CARBON PURPLE PET | ✅ 30/09 | ✅ 01/10 — padrão forjado: lascas violeta H 268–284 (S ~55, V até 70–85 no brilho) sobre base quase preta → lascas **`#5A2D8C`** / base **`#1A1024`** | ✅ 01/10 — **A** (close do capô) aprovado; caminho de close aprovado | ✅ 01/10 — aprovadas: close do capô, retrovisor + teto, teto, macro (`high`, textura do cartão) + capa com o padrão (ESG-034 + textura); sem correção | ✅ 01/10 — commit `5a9a1e6`, 5 mídias, conferido no ar; pasta ✅ |
| EDG-026 | METALLIC PAINT METALLIC SONOMA GREEN PET | ✅ 30/09 | ✅ 01/10 — à mão: H 94–96 com cast azul do asfalto, S ~50, V 32–41; no swatch o fiel é verde-oliva escuro **`#415220`** (H ~82), flake dourado no brilho | ✅ 01/10 — **B** aprovado (`5e07555c` corrigido p/ `#434D2C`) | ⏳ 01/10 — prévia pronta, corrigida contra `#434D2C` (família nova `musgo`; tudo em H 78 · S 43, capa V 30); mármore intacto | — |
| EMG-022 | SATIN METALLIC GLOSSY PRUNUS SAKURA PINK PET | ✅ 30/09 | ✅ 01/10 — à mão: H 354–358, S 21–30, V 73–89 → swatch **`#EDB8BA`** (rosa-salmão pastel, H 357 · S 22 · V 93) | ✅ 01/10 — **B** aprovado (`63c3b945`) | ⏳ 01/10 — prévia pronta **sem correção** (fotos H 5–16 · S 20–25, capa H 357 · S 17; a família que cobre H 357–5 pegaria as lanternas e o V > 0,80 fica fora da máscara padrão); traseira um pouco mais pêssego | — |
| EGF-010 | GLOSS FORGED CARBON GOLD PET | ✅ 30/09 | ✅ 01/10 — lascas âmbar-ouro H 30–36 (S 60–70) **`#B07A2A`**/`#8A5E1E` sobre base marrom-preta `#1A120A`; brilhante | ✅ 01/10 — **B** aprovado (`1e2d6395`) | ⏳ 01/10 — prévia pronta: closes do capô, retrovisor + teto, teto, macro (`high`, textura `7325eda7`) + capa com o padrão; sem correção | — |
| EGF-013 | MATTE FORGED CARBON PURPLE PET | ✅ 30/09 | ✅ 01/10 — lascas violeta H 266–284 (S ~48) **`#5A3A80`** sobre base `#161020`; **fosco** | ✅ 01/10 — **B** aprovado (`1084225e`) | ⏳ 01/10 — prévia pronta: closes foscos (capô, retrovisor + teto, teto, macro; textura `fed54336`) + capa fosca com o padrão; sem correção | — |

**Cadastradas no NZERP em 01/10** (eram as "fora do NZERP" com amostra no Drive): nome lido no rótulo do
cartão; fiscal, custo, preço da Engenharia e medidas copiados do irmão de linha; criadas no Tiny pela
Matriz (categoria ENVELOPAMENTO, marca SPEED WRAPPING, origem 1) e o site criou a página sozinho no
sync. Prontas para foto:

| SKU | Nome (NZERP) | Irmão copiado | id Tiny |
|---|---|---|---|
| SPWEDG023 | EDG 023 METALLIC RUBY GOLD PET | SPWEDG027 | 437012348 |
| SPWEDG026 | EDG 026 METALLIC PAINT METALLIC SONOMA GREEN PET | SPWEDG027 | 437012380 |
| SPWEGF010 | EGF 010 GLOSS FORGED CARBON GOLD PET | SPWEGF006 | 437012389 |
| SPWEGF012 | EGF 012 GLOSS FORGED CARBON PURPLE PET | SPWEGF006 | 437012391 |
| SPWEGF013 | EGF 013 MATTE FORGED CARBON PURPLE PET | SPWEGF007 | 437012419 |
| SPWEMG021 | EMG 021 SATIN METALLIC GLOSSY AGATE GREEN PET | SPWEMG017 | 437012442 |
| SPWEMG022 | EMG 022 SATIN METALLIC GLOSSY PRUNUS SAKURA PINK PET | SPWEMG017 | 437012495 |
| SPWEMT024 | EMT 024 SATIN METALLIC MATT PEARL PINK | SPWEMT025 | 437012538 |

**Nome divergente NZERP × Tiny (achado 01/10, não mexido):** SPWEGF006 é "GLOSS FORGED CARBON SILVER
PET" no NZERP e "EGF 006 CARBON GLOSS 5D" no Tiny (a pasta do Drive segue o Tiny); SPWEGF007 é "MATTE
FORGED CARBON SILVER PET" no NZERP e "EGF 007 FROSTED BLACK PET" no Tiny. Conferir pelo cartão físico
antes de fotografar a EGF-006.

## Amostra no Drive, ainda não iniciadas (01/10)

EDG-026, EGF-006, EGF-010, EGF-013, EGF-017, EGF-018, EMG-022 (7 cores; conferir `drive-cores.mjs status` para novas pastas com foto).

**Refotografar** (cartão deitado, na sombra, folha branca ao lado) — leitura instável por
reflexo do céu/sol no cartão segurado na mão: EDG-018 sd(S) 29,5 · EDG-019 16,7 ·
EDG-021 41 · EDG-027 8,7 · EMT-025 26. EDG-016 (prata): o `ler-amostra.py` não tem família
neutra — ajustar antes de ler.

## Concluídas (fotos de carro + capa nova no ar)

EDG-023 Metallic Ruby Gold (Porsche Taycan), EMG-021 Satin Metallic Glossy Agate Green (Lotus Emira), EMT-024 Satin Metallic Matt Pearl Pink (BMW i8) e EGF-012 Gloss Forged Carbon Purple (Huracán STO, **primeira de padrão: só closes das áreas aplicadas**) — 01/10, 2º lote de 4, as quatro cadastradas no NZERP no mesmo dia.
EDG-016 Metallic Liquid Metal Space Silver (01/10, Mercedes-Benz SLS AMG — 3º piloto: prata chumbo, não cromo), EDG-018 Metallic Liquid Metal Agate Green (01/10, Lamborghini Aventador SVJ), EDG-021 Metallic Liquid Blue Berry (01/10, Bugatti Chiron) e EMT-023 Satin Metallic Matt Sakura Pink (01/10, Rolls-Royce Wraith) — primeiro lote de 4 feito junto.
EDG-019 Metallic Liquid Metal Austin Gold (01/10, BMW M4 F82) e EMT-025 Satin Metallic Matt Deep Blue (01/10, Ford GT) — primeiro par feito junto.
EDG-027 Metallic Midnight Purple (30/09, Nissan Skyline GT-R R34 — família nova `violeta`).
EMT-022 Satin Metallic Titanium Metal Grey (30/09, Aston Martin DB12 — primeira EMT e primeira capa satin).
EDG-025 Metallic Solar Gold (30/09, Jaguar F-Type R — família nova `dourado`, `sat_min_cena`).
EDG-020 Liquid Metal Ruby Red (30/09, McLaren Artura — primeira EDG e primeira capa metálica).
ESG-040: a correção `malva` deixou a lanterna traseira do Bentley rosa-vinho; o João decidiu **manter a foto** (01/10) — fica só como aprendizado (ver `FOTOS_DE_COR_AUTOMOTIVA.md`, família que cruza o vermelho).
ESG-030 a ESG-041 (set/2026) — detalhes em `FOTOS_DE_COR_AUTOMOTIVA.md` e
`CAPAS_SPEED_WRAPPING.md`.
