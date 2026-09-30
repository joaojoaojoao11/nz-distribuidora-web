# Status das cores Speed Wrapping — fotos da loja

Controle da Cledna. Atualizar a cada passo. Fonte da verdade da cor é o **catálogo físico**
(foto na pasta da cor no Drive `CORES SPEEDWRAP`); o site da Speed só serve para achar o que falta.

Passos: **Amostra** (fotos do catálogo no Drive) → **Leitura** (`ler-amostra.py`) →
**Piloto** (1 frontal, aprovado pelo João) → **Fotos + capa** → **No site** (publicado e
conferido no ar).

`scripts/drive-cores.mjs status` mostra quais pastas do Drive já têm foto.

**Marcação no Drive** (o conector não muda a cor da pasta; o João escolheu marcar no nome,
30/09): ` 🟢` no fim do nome = amostra do catálogo na pasta · ` ✅` = fotos e capa 100% no
site. O código fica no começo, então a ordem não muda.

## Em andamento

| Cor | Nome no catálogo físico | Amostra | Leitura | Piloto | Fotos + capa | No site |
|---|---|---|---|---|---|---|
| EDG-020 | METALLIC LIQUID METAL RUBY RED PET | ✅ 30/09 | ✅ 30/09 — H 349 · S ~100 (teto) · V 54 | ✅ 30/09 — B aprovado (McLaren Artura, pátio de hangar; H349 S79 V42) | ✅ 30/09 — aprovadas as 3 fotos + capa 1 (H353 S95 V56, primeira capa metálica) | ✅ 30/09 — commit `9c19481`, 5 mídias no banco, conferido no ar (capa + 4 fotos carregam); pasta do Drive marcada ✅ |

| EDG-025 | METALLIC PAINT METALLIC SOLAR GOLD PET (NZERP: METALLIC SOLAR GOLD PET — vale o NZERP) | ✅ 30/09 | ✅ 30/09 — `#7F7148` H 45 · S 43 · V 50, sd(S) 2,4 confiável | ✅ 30/09 — B aprovado (Jaguar F-Type R, crista de barragem; H37 S54 V31) | ⏳ 30/09 geradas + corrigidas localmente (família `dourado`, `sat_min_cena` 0,40; tudo fecha em H 45 · S 43) — prévia em `_AMOSTRAS/EDG-025/`, aguardando ok para publicar | — |

## Amostra no Drive, ainda não iniciadas (30/09)

EDG-016, EDG-018, EDG-019, EDG-021, EDG-027, EGF-006, EGF-017, EGF-018,
EMT-022, EMT-023, EMT-025.

**Refotografar** (cartão deitado, na sombra, folha branca ao lado) — leitura instável por
reflexo do céu/sol no cartão segurado na mão: EDG-018 sd(S) 29,5 · EDG-019 16,7 ·
EDG-021 41 · EDG-027 8,7 · EMT-025 26. EDG-016 (prata): o `ler-amostra.py` não tem família
neutra — ajustar antes de ler.

## Concluídas (fotos de carro + capa nova no ar)

EDG-020 Liquid Metal Ruby Red (30/09, McLaren Artura — primeira EDG e primeira capa metálica).
ESG-030 a ESG-041 (set/2026) — detalhes em `FOTOS_DE_COR_AUTOMOTIVA.md` e
`CAPAS_SPEED_WRAPPING.md`.
