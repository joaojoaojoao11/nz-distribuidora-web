# BRIEFING GRÁFICA — Catálogo NZPPF 2026

> Documento técnico para envio à gráfica responsável pela impressão
> do **Catálogo Oficial NZPPF — Edição 2026** (formato A5, 20 páginas).
>
> **Tiragem prevista:** 200 cópias/mês (2.400/ano) em offset.

---

## 1. Resumo executivo

Catálogo institucional de produto premium, formato A5 (148 × 210 mm),
20 páginas no modo COMPLETO COM ACABAMENTOS, capa + contracapa
inclusas. Encadernação proposta: **lombada quadrada hotmelt**. Acabamento
proposto: **laminação BOPP fosco + verniz UV localizado** em logos,
títulos das 6 linhas e elementos dourados.

O PDF entregue foi gerado por pipeline interno (React + html2canvas
+ jsPDF) com geometria correta de impressão (sangria, crop marks,
margem de segurança), mas sem conversão CMYK nativa. **A conversão
RGB→CMYK e validação PDF/X-4 ficam a cargo da gráfica** — ver seção
4 (Avisos importantes).

---

## 2. Arquivos entregues

A gráfica recebe três versões do mesmo conteúdo, geradas pela ferramenta
interna acessível em `/admin/agencia-nz/catalog`:

| Arquivo | Uso | Conteúdo |
|---|---|---|
| `NZPPF_Catalogo_2026_A5_PRINT.pdf` | **Produção** | A5 + sangria 3mm + crop marks + registration marks |
| `NZPPF_Catalogo_2026_A5_PROOF.pdf` | **Aprovação** | Idêntica à PRINT + legenda vermelha "PROOF · NÃO PARA PRODUÇÃO" na sangria do topo (some quando cortada) |
| `NZPPF_Catalogo_2026_A5_DIGITAL.pdf` | **Envio digital** | A5 trim apenas, sem sangria/marcas, hyperlinks ativos sobre QR codes |

> **Use o PRINT como arquivo-base de produção.** O PROOF serve para
> revisão visual (mostra exatamente o que será cortado). O DIGITAL é
> apenas para envio por e-mail/WhatsApp aos clientes.

---

## 3. Especificações técnicas

### 3.1 Geometria

| Item | Valor |
|---|---|
| Trim final (A5) | **148 × 210 mm** |
| Sangria (bleed) | **3 mm** em cada lado |
| Página total no PDF (PRINT/PROOF) | **154 × 216 mm** |
| Margem de segurança | **10 mm** do trim em todos os lados |
| Resolução | **300 DPI** (pixel canvas 1819 × 2551) |
| Páginas | **20** (modo COMPLETO COM ACABAMENTOS) |
| Orientação | Retrato |

### 3.2 Marcas

- **Crop marks:** L-shapes pretas (linha 0.1mm), 2mm de comprimento,
  posicionadas a 1mm do canto do trim, dentro da sangria
- **Registration marks:** cruzes pretas no centro de cada borda,
  dentro da sangria (1mm de braço, no meio do bleed = 1.5mm da borda)

> Observação: as marcas estão em RGB preto. Em CMYK process, ao
> converter, podem ficar como K100 (não-registration). Se a gráfica
> precisa de marcas em registration black (C100 M100 Y100 K100),
> adicionar via imposition software ao receber.

### 3.3 Tipografia

| Categoria | Tamanho impresso | Família | Notas |
|---|---|---|---|
| Display (títulos) | 30–80 pt | Outfit (geometric sans) | Headlines de capa em 184 pt |
| Corpo (parágrafos) | 10–12 pt | Inter, Cormorant Garamond | weight 500 (medium) sobre fundo preto pra compensar dot gain |
| Legendas (CAIXA ALTA com tracking) | 7–9 pt | Inter | Eyebrows, captions, footer |
| Microtexto | 7 pt mínimo | Inter | Numeração de página, edição |

Hifenização configurada em `lang="pt-BR"` com `hyphens: auto` em
parágrafos longos. `widows: 2; orphans: 2;` declarados (não têm
efeito no pipeline atual mas serão honrados em FASE 2 com Puppeteer).

---

## 4. Avisos importantes para a gráfica

> ⚠️ **Estes pontos exigem ação no lado da gráfica** porque o
> pipeline atual (Caminho C — html2canvas + jsPDF) tem limitações
> que serão resolvidas na FASE 2 do projeto interno.

### 4.1 Conversão de cores RGB → CMYK
O PDF é entregue em **sRGB**. A gráfica deve converter para CMYK
usando o perfil **Coated FOGRA39** (papel couché brilho/fosco
europeu) ou **Coated FOGRA51** (alternativa moderna ISO 12647-2:2013).

- Pretos sólidos das páginas internas (`#060606`) devem virar
  **rich black C60 M40 Y40 K100** (não K100 puro — risco de mostrar
  furo do papel em áreas grandes)
- Texto pequeno preto (≤10pt) deve ser convertido para **K100 puro**
  com **overprint** ativado, evitando registro entre placas
- Áreas grandes douradas (#D4AF37) — ver seção 5 (Pantone)

### 4.2 Validação PDF/X-4
O PDF entregue **não é PDF/X-4 compliant**. A gráfica deve:
1. Pré-flight no Acrobat ou veraPDF
2. Resolver inconsistências (transparências, cores spot, fonts)
3. Re-emitir como PDF/X-4:2010 antes de enviar pra RIP

### 4.3 Tipografia rasterizada
A tipografia foi rasterizada em JPEG (não vetorial). **Não há fontes
embutidas no PDF** — toda a tipografia é parte da imagem. Vantagem:
zero risco de substituição de fonte na RIP. Desvantagem: tipografia
em texto pequeno (10pt) pode mostrar artefatos de JPEG. Compressão
usada é **JPEG quality 0.94** (~94%) para PRINT/PROOF — perdas
mínimas mas presentes.

### 4.4 TAC (Total Area Coverage)
Após a conversão CMYK, validar que **TAC máximo ≤ 300%** em offset
sobre couché. Áreas pretas profundas das páginas internas têm risco
de extrapolar TAC se convertidas sem cuidado. Reduzir gradient overlay
se necessário.

### 4.5 Resolução das imagens
A auditoria interna identificou **imagens abaixo de 300 DPI no
tamanho final**:

| Imagem | DPI atual | Onde |
|---|---|---|
| `luxury_lambo.png` | 120 DPI | Capa hero (154×216mm) |
| `nzppf_prime_hero.png` | 120 DPI | Product hero Prime |
| `flow_haval.png` | 120 DPI | Product hero Flow |
| `core_catalog_car.png` | 120 DPI | Product hero Core |
| `nzppf_headlight_light_black.png` | 127 DPI | Hero Headlight |
| `nzppf_windshield_diff_impacto.png` | 90 DPI | Hero Windshield |
| `backgroud.png` | 235 DPI | Fundo das páginas |

> Estas imagens **podem mostrar leve perda de nitidez na impressão**.
> Se a gráfica julgar inaceitável, solicitar versões em ≥ 2048px na
> menor dimensão (NZ Group re-exporta dos arquivos fonte).

---

## 5. Cores de marca · sugestão Pantone

> ⚠️ **As sugestões abaixo são pontos de partida — devem ser validadas
> com a gráfica usando guia Pantone físico antes de fechar a tiragem.**
> O dourado em particular costuma exigir Pantone **metálico** para
> ter o brilho percebido em tela.

| Linha NZPPF | RGB / Hex | Sugestão Pantone | Observações |
|---|---|---|---|
| **Dourado NZPPF** | `#D4AF37` | **Pantone 871 C** (metálico) ou Pantone 7563 C | 871 C é metálico real, recomendado para a marca; 7563 C é alternativa não-metálica em CMYK process |
| **Azul Prime** | `#4A90D9` | **Pantone 2925 C** (validar) | Próximo do azul claro corporativo |
| **Vermelho Flow** | `#D11E1E` | **Pantone 1795 C** ou **186 C** | Vermelho saturado, validar com guia |
| **Verde Core** | `#4A7C59` | **Pantone 5535 C** (validar) | Verde escuro/musgo, calibrar |
| **Prata Windshield** | `#C0C0C0` | CMYK process (sem Pantone necessário) | Cinza neutro |
| **Dourado claro (chips, anchors)** | `#E8C264` | Derivado do principal | Aplicar em CMYK process |

**Recomendação de tinta dourada:**
Para dar a percepção premium da marca, considerar tinta **metálica
real** (Pantone 871 C) impressa em **5ª passagem** sobre a base CMYK
em logos NZPPF, números de linha, dividers e seal "ATÉ 12 ANOS DE
GARANTIA". Custa mais mas eleva o resultado.

---

## 6. Acabamento recomendado

### 6.1 Papel

| Componente | Gramatura | Tipo |
|---|---|---|
| **Capa + contracapa** | **250g** | Couché fosco |
| **Miolo (páginas internas)** | **150g** | Couché fosco |

> Couché fosco preferido sobre brilho — combina melhor com a paleta
> escura e o styling editorial (não compete com a marca dourada).
> Se a gráfica recomendar couché L1 ou L2 ISO 12647-2, qualquer um serve.

### 6.2 Laminação

**BOPP fosco** na capa e contracapa (4/0 + laminação 1/0).

> BOPP fosco protege contra arranhões e dá toque premium "soft-touch".
> Não confundir com soft-touch/celophane brilhante — queremos **fosco**.

### 6.3 Verniz UV localizado

Verniz UV localizado (spot UV) sobre laminação fosca em:

- **Logos NZPPF** (capa, contracapa, abertura de cada linha de produto)
- **Títulos das 6 linhas** (LUXURY, PRIME, FLOW, CORE, HEADLIGHT, WINDSHIELD)
- **Elementos dourados em destaque** (selos, badges "ATÉ 12 ANOS DE GARANTIA")
- **Ícones de diferenciais** (página 16) e selos de garantia (página 17)
- **Headlines da capa** ("PROTEÇÃO FEITA PARA O MUNDO REAL")

> A máscara de verniz UV deve vir como **PDF separado** com canal
> Spot "Verniz UV" marcando os elementos. Esse PDF será gerado pela
> NZ Group na FASE 2 (atualmente não automatizado — solicitar à
> gráfica que crie a máscara seguindo os elementos listados acima
> ou aguardar a versão automatizada).

### 6.4 Encadernação

**Lombada quadrada hotmelt** (cola PUR ou EVA premium).

- 20 páginas + capa = volume típico de catálogo institucional
- Lombada de aproximadamente 2-3mm dependendo da gramatura final
- Nome do projeto na lombada (opcional): "NZPPF · CATÁLOGO 2026"

> Como alternativa de menor custo: **grampo canoa duplo** (saddle
> stitch). Funciona com 20 páginas mas perde o aspecto premium da
> lombada quadrada. Recomendamos lombada quadrada para a tiragem
> oficial.

---

## 7. Prova de cor e aprovação

### 7.1 Tipo de prova

**Cromalin** (prova analógica calibrada) ou **prova digital
calibrada** (Epson SureColor com perfil ICC do papel final).

> Dada a importância das cores de marca (especialmente o dourado),
> **recomendamos cromalin ao menos para 2 páginas críticas**: a capa
> e uma página de produto representativa (sugestão: página 4 — Luxury
> Gloss).

### 7.2 Fluxo de aprovação

1. NZ Group envia os 3 PDFs (PRINT, PROOF, DIGITAL)
2. Gráfica converte para CMYK (FOGRA39) e valida PDF/X-4
3. Gráfica imprime cromalin/prova digital de 1-2 páginas críticas
4. NZ Group aprova ou solicita ajustes (cor, tipografia, posição)
5. Após aprovação, gráfica imprime tiragem completa
6. NZ Group recebe **2 amostras físicas** antes do envio do lote completo

---

## 8. Tiragem

| Item | Valor |
|---|---|
| **Tiragem mínima inicial** | 200 cópias |
| **Cadência prevista** | 200/mês = 2.400/ano |
| **Compromisso 12 meses** | Reservar capacidade para tiragens recorrentes |

> A previsão de 2.400/ano permite negociar **preço unitário melhor**
> em contrato anual. Solicitar à gráfica proposta com:
> - Lote único (todos os 2.400 de uma vez, com armazenagem)
> - 12 lotes de 200/mês (entregas mensais)
>
> Comparar custo total e custo de WIP/armazenagem.

---

## 9. Checklist de validação pré-impressão

A gráfica deve confirmar antes de enviar para RIP:

### Pré-flight do PDF PRINT
- [ ] Dimensões: page = 154 × 216 mm ✓
- [ ] Sangria: TrimBox e BleedBox configurados (3mm)
  - **Atenção:** o PDF entregue pode não ter TrimBox/BleedBox
    explícitos. Se necessário, a gráfica adiciona via Acrobat.
- [ ] Resolução: ≥ 300 DPI nas imagens (ver tabela na seção 4.5 para
      exceções)
- [ ] Fontes: zero (tipografia rasterizada — não há fonts a verificar)
- [ ] Cor: converter sRGB → CMYK FOGRA39
- [ ] TAC: ≤ 300%
- [ ] Crop marks visíveis em todas as 20 páginas

### Validação dos QR codes
- [ ] **Testar leitura de cada QR após impressão de prova**
- [ ] Cada produto tem QR para `nzgroup.com.br/ppf/{slug}`
- [ ] Capa de garantia tem QR genérico
- [ ] Contracapa tem QR principal `nzgroup.com.br`
- [ ] EC nível H (30%) — sobrevive a smudges

### Validação do dourado
- [ ] Comparar cromalin com Pantone 871 C físico (ou alternativa
      escolhida)
- [ ] Confirmar que o dourado lê como **dourado**, não amarelo-mostarda
- [ ] Validar que o verniz UV localizado registra com a tinta dourada
      (sem deslocamento)

---

## 10. Contato técnico

**NZ Group · Departamento de Marketing**
- Email: [a preencher]
- WhatsApp: [a preencher]
- Responsável técnico do catálogo: [a preencher]

Para dúvidas sobre o pipeline de geração do PDF (limitações Caminho C,
roadmap FASE 2 com Puppeteer + Ghostscript), referenciar este
repositório:
- `nz-distribuidora-web/src/components/Catalog/` — componentes React
- `nz-distribuidora-web/src/components/Catalog/generateCatalogPdf.ts` — gerador PDF
- `nz-distribuidora-web/scripts/audit-catalog-images.mjs` — auditoria DPI

---

## 11. Roadmap FASE 2 (informativo)

A NZ Group está migrando o pipeline de geração para uma stack
gráfica completa que vai eliminar várias das limitações listadas
em §4 deste briefing:

- **Puppeteer + CSS Paged Media:** texto vetorial, fontes embutidas,
  TrimBox/BleedBox nativos
- **Ghostscript + perfil ICC:** conversão automática RGB → CMYK
  FOGRA39, validação PDF/X-4
- **Cores spot Pantone:** dourado 871 C como spot color real (não
  process)
- **Máscara de verniz UV:** PDF separado com canal Spot "Verniz UV"
  gerado automaticamente
- **veraPDF na CI:** rejeição automática de PDF não-X-4

Quando a FASE 2 estiver pronta, a gráfica receberá PDFs prontos para
RIP sem nenhuma das ressalvas da seção 4 deste documento. ETA: 2-3
semanas após aprovação interna.

---

*Documento gerado pela ferramenta interna `/admin/agencia-nz/catalog`.
Última atualização: ETAPA 10 do checklist gráfico — Caminho C / FASE 1.*
