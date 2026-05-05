import {
  productLines,
  benchmarkLines,
  exclusiveDifferentials,
  catalogMeta,
  type ProductLine,
} from './data/catalogData';

/**
 * Registry de campos editáveis pelo PageEditor.
 *
 * COBERTURA TOTAL: cada texto visível em cada página do catálogo está
 * registrado aqui como um campo editável. O PageEditor lista todos esses
 * campos no formulário e o componente de página consome o override
 * via `useEditableText` / `useElementHidden` (ou via <EditableText>).
 *
 * Convenções de naming dos fieldKeys:
 *   - Texto único:                  "intro", "tagline", "quote"
 *   - Linha de um título multi-linha: "h2.l1", "h2.l2", "title.l3"
 *   - Item indexado:                "block.0.title", "arch.2.desc",
 *                                   "highlight.1.value"
 *   - Metadados/footer:             "footer.left", "qr.label", "qr.url"
 *
 * Quando uma página nova precisar de campo novo, basta adicionar a
 * entrada aqui E uma chamada de hook no componente — o (pageId, key)
 * é o contrato.
 */

export type EditableFieldType = 'text-short' | 'text-long' | 'element';

export interface EditableField {
  key: string;
  label: string;
  type: EditableFieldType;
  /** Texto default (texts) ou descrição curta do elemento (type='element'). */
  defaultValue: string;
  /** Quando true, o PageEditor não oferece a opção de ocultar (texto crítico). */
  noHide?: boolean;
}

export interface EditablePage {
  pageId: string;
  /** Rótulo curto exibido no topo do editor. */
  label: string;
  fields: EditableField[];
}

/**
 * Helper que retorna os campos do rodapé (renderizado pelo CatalogPage).
 * Adicionar a TODA página que tem footer visível — capa/contracapa/carta
 * usam `hideFooter` então pulam.
 *
 *   • footer.brand   → texto "NZPPF  •  www.nzgroup.com.br"
 *   • footer.pageNum → numeração "01 / 14" (vazio = auto, computa em render)
 *   • footer         → toggle de ocultar/mostrar o rodapé inteiro (sem texto editável)
 */
function footerFields(): EditableField[] {
  return [
    {
      key: 'footer.brand',
      label: 'Footer — Brand · URL',
      type: 'text-short',
      defaultValue: `${catalogMeta.brand}  •  ${catalogMeta.url}`,
    },
    {
      key: 'footer.pageNum',
      label: 'Footer — Numeração (vazio = auto)',
      type: 'text-short',
      defaultValue: '',
    },
  ];
}

/* ────────── COVER ────────── */

function coverPage(): EditablePage {
  return {
    pageId: 'cover',
    label: 'Capa Editorial',
    fields: [
      { key: 'logo', label: 'Logo NZPPF (canto superior esquerdo)', type: 'element', defaultValue: 'Logo SVG · ajuste tamanho ou oculte' },
      { key: 'edition', label: 'Edição (canto superior, multilinha)', type: 'text-short', defaultValue: 'CATÁLOGO\nOFICIAL\n2026' },
      { key: 'headline.l1', label: 'Headline — Linha 1', type: 'text-short', defaultValue: 'PROTEÇÃO' },
      { key: 'headline.l2', label: 'Headline — Linha 2', type: 'text-short', defaultValue: 'FEITA PARA' },
      { key: 'headline.l3', label: 'Headline — Linha 3 (dourada)', type: 'text-short', defaultValue: 'O MUNDO REAL.' },
      { key: 'footer.left', label: 'Footer esquerda — linha 1', type: 'text-short', defaultValue: 'FILMES PPF AUTOMOTIVOS' },
      { key: 'footer.left2', label: 'Footer esquerda — linha 2', type: 'text-short', defaultValue: '6 LINHAS · ATÉ 12 ANOS DE GARANTIA' },
      { key: 'footer.url', label: 'Footer URL', type: 'text-short', defaultValue: catalogMeta.url },
    ],
  };
}

/* ────────── MANIFEST ────────── */

function manifestPage(): EditablePage {
  return {
    pageId: 'manifest',
    label: 'Manifesto NZPPF',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', type: 'text-short', defaultValue: 'MANIFESTO  ·  NZPPF' },
      { key: 'title.l1', label: 'Título — Linha 1', type: 'text-short', defaultValue: 'NASCEU' },
      { key: 'title.l2', label: 'Título — Linha 2 (dourada)', type: 'text-short', defaultValue: 'NA PRÁTICA.' },
      { key: 'paragraph.0', label: 'Parágrafo 1', type: 'text-long', defaultValue: 'A maioria nasce em laboratório. NZ PPF nasceu na rua.' },
      { key: 'paragraph.1', label: 'Parágrafo 2', type: 'text-long', defaultValue: 'Validado em carro real. Sob calor real. Sem suposições.' },
      { key: 'paragraph.2', label: 'Parágrafo 3', type: 'text-long', defaultValue: 'Por isso entrega exatamente o que promete — proteção que você não vê, acabamento que você sente.' },
      { key: 'signature', label: 'Assinatura', type: 'text-short', defaultValue: `${catalogMeta.company}  —  ${catalogMeta.url}` },
      { key: 'qr.label', label: 'QR — Rótulo', type: 'text-short', defaultValue: 'LEIA O MANIFESTO' },
      { key: 'qr.url', label: 'QR — URL exibida', type: 'text-short', defaultValue: 'nzgroup.com.br/manifesto' },
      ...footerFields(),
    ],
  };
}

/* ────────── LINES OVERVIEW ────────── */

function linesOverviewPage(): EditablePage {
  const fields: EditableField[] = [
    { key: 'pageSection', label: 'Eyebrow (canto superior)', type: 'text-short', defaultValue: '03  ·  AS LINHAS' },
    { key: 'h2.l1', label: 'Título — Linha 1', type: 'text-short', defaultValue: 'SEIS LINHAS' },
    { key: 'h2.l2', label: 'Título — Linha 2 (dourada)', type: 'text-short', defaultValue: 'UMA FILOSOFIA.' },
    { key: 'badge', label: 'Badge canto superior', type: 'text-short', defaultValue: 'NZPPF / 2026' },
    { key: 'intro', label: 'Parágrafo de introdução', type: 'text-long', defaultValue: 'Da proteção essencial ao acabamento absoluto: cada linha foi projetada para um perfil de uso e necessidade específicos.' },
  ];
  // Cada um dos 6 cards do grid 2x3 é editável individualmente.
  for (const line of productLines) {
    const slug = line.slug;
    const cleanTitle = line.title.replace(/^NZ ?PPF /, '');
    fields.push(
      { key: `card.${slug}.title`, label: `Card "${line.shortName}" — Título`, type: 'text-short', defaultValue: cleanTitle },
      { key: `card.${slug}.subtitle`, label: `Card "${line.shortName}" — Subtítulo`, type: 'text-short', defaultValue: line.subtitle },
      { key: `card.${slug}.warranty`, label: `Card "${line.shortName}" — Garantia`, type: 'text-short', defaultValue: line.warranty },
      { key: `card.${slug}.thickness`, label: `Card "${line.shortName}" — Espessura`, type: 'text-short', defaultValue: `${line.thickness} TPU` },
    );
  }
  fields.push(...footerFields());
  return { pageId: 'lines-overview', label: 'Visão Geral das 6 Linhas', fields };
}

/* ────────── PRODUCT DETAIL ────────── */

function productPage(p: ProductLine, index: number): EditablePage {
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const titleParts = p.title.replace(/^NZ ?PPF /, '').split(/\s+/);
  // Linhas com `finishes` cadastrados movem a Estrutura do PPF para a
  // página dedicada (FinishesPage). Apenas Windshield, que não tem
  // acabamentos, mantém os campos de arquitetura aqui.
  const hasFinishes = !!p.finishes;

  const fields: EditableField[] = [
    { key: 'eyebrow', label: 'Eyebrow', type: 'text-short', defaultValue: `${pad2(4 + index)}  ·  LINHA NZPPF` },
    { key: 'titleBrand', label: 'Título — "NZ PPF"', type: 'text-short', defaultValue: 'NZ PPF' },
  ];
  titleParts.forEach((word, i) => {
    fields.push({
      key: `titleLine.${i}`,
      label: `Título — Palavra ${i + 1} ${i === titleParts.length - 1 ? '(colorida)' : ''}`,
      type: 'text-short',
      defaultValue: word,
    });
  });
  fields.push(
    { key: 'subtitle', label: 'Subtítulo (specs)', type: 'text-short', defaultValue: p.subtitle },
    { key: 'sectionTitle', label: 'Título da seção', type: 'text-short', defaultValue: p.sectionTitle, noHide: true },
  );
  p.bodyParagraphs.forEach((paragraph, i) => {
    fields.push({
      key: `body.${i}`,
      label: i === 0 ? 'Corpo — Parágrafo 1 (intro)' : `Corpo — Parágrafo ${i + 1}`,
      type: 'text-long',
      defaultValue: paragraph,
    });
  });
  p.highlights.forEach((h, i) => {
    fields.push(
      { key: `highlight.${i}.label`, label: `Chip ${i + 1} — Label (${h.label})`, type: 'text-short', defaultValue: h.label },
      { key: `highlight.${i}.value`, label: `Chip ${i + 1} — Valor`, type: 'text-short', defaultValue: h.value },
    );
  });
  // Estrutura do PPF — só aparece aqui se NÃO houver página de acabamentos.
  if (!hasFinishes) {
    fields.push({ key: 'archHeader', label: 'Header "ESTRUTURA DO PPF"', type: 'text-short', defaultValue: 'ESTRUTURA DO PPF' });
    p.architecture.forEach((arch, i) => {
      fields.push(
        { key: `arch.${i}.title`, label: `Estrutura ${arch.num} — Título`, type: 'text-short', defaultValue: arch.title },
        { key: `arch.${i}.desc`, label: `Estrutura ${arch.num} — Descrição`, type: 'text-short', defaultValue: arch.desc },
      );
    });
  }
  // Seção de fechamento (acima do QR) — eyebrow + frase aspiracional.
  if (p.closingTagline) {
    fields.push({
      key: 'closingTagline',
      label: 'Fechamento — Eyebrow',
      type: 'text-short',
      defaultValue: p.closingTagline,
    });
  }
  if (p.closingLine) {
    fields.push({
      key: 'closingLine',
      label: 'Fechamento — Frase de marca',
      type: 'text-long',
      defaultValue: p.closingLine,
    });
  }
  fields.push(
    { key: 'qr.label', label: 'QR — Rótulo', type: 'text-short', defaultValue: 'VEJA NO SITE' },
    { key: 'qr.url', label: 'QR — URL exibida', type: 'text-short', defaultValue: `nzgroup.com.br/${p.slug}` },
    ...footerFields(),
  );
  return { pageId: `product:${p.slug}`, label: p.title, fields };
}

/* ────────── FINISHES (modo Completo) ────────── */

function finishesPage(p: ProductLine, index: number): EditablePage | null {
  if (!p.finishes) return null;
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const fields: EditableField[] = [
    { key: 'pageSection', label: 'Eyebrow (canto superior)', type: 'text-short', defaultValue: `${pad2(index + 1)}  ·  ESTRUTURA + ACABAMENTOS` },
    { key: 'h2.l1', label: 'Título — Linha 1', type: 'text-short', defaultValue: 'ESTRUTURA &' },
    { key: 'h2.l2', label: 'Título — Linha 2 (colorida)', type: 'text-short', defaultValue: `ACABAMENTOS ${p.shortName}` },
    { key: 'badge', label: 'Badge canto superior', type: 'text-short', defaultValue: 'NZPPF / 2026' },
    // Estrutura do PPF (movido do ProductDetailPage). 4 cards com ícone +
    // título + descrição. Esses fieldKeys são compartilhados com a página
    // de detalhe (que ainda lê eles em Windshield) — por design, cada
    // página tem o próprio escopo de overrides via pageId distinto, então
    // editar aqui não afeta o detalhe.
    { key: 'estruturaHeader', label: 'Header "ESTRUTURA DO PPF"', type: 'text-short', defaultValue: 'ESTRUTURA DO PPF' },
  ];
  p.architecture.forEach((arch, i) => {
    fields.push(
      { key: `arch.${i}.title`, label: `Estrutura ${arch.num} — Título`, type: 'text-short', defaultValue: arch.title },
      { key: `arch.${i}.desc`, label: `Estrutura ${arch.num} — Descrição`, type: 'text-short', defaultValue: arch.desc },
    );
  });
  fields.push(
    { key: 'acabamentosHeader', label: 'Header "ACABAMENTOS"', type: 'text-short', defaultValue: 'ACABAMENTOS' },
    { key: 'tagline', label: 'Tagline editorial dos acabamentos', type: 'text-short', defaultValue: p.finishes.tagline },
  );
  p.finishes.items.forEach((item, i) => {
    fields.push(
      { key: `item.${i}.name`, label: `${item.name} — Nome`, type: 'text-short', defaultValue: item.name },
      { key: `item.${i}.anchor`, label: `${item.name} — Frase âncora`, type: 'text-short', defaultValue: item.anchor },
      { key: `item.${i}.desc`, label: `${item.name} — Descrição`, type: 'text-long', defaultValue: item.desc },
    );
  });
  fields.push(...footerFields());
  return { pageId: `finishes:${p.slug}`, label: `Estrutura + Acabamentos ${p.shortName}`, fields };
}

/* ────────── BENCHMARK ────────── */

function benchmarkPage(): EditablePage {
  const fields: EditableField[] = [
    { key: 'pageSection', label: 'Eyebrow', type: 'text-short', defaultValue: '10  ·  COMPARATIVO' },
    { key: 'h2.l1', label: 'Título — Linha 1', type: 'text-short', defaultValue: 'PERFORMANCE' },
    { key: 'h2.l2', label: 'Título — Linha 2 (dourada)', type: 'text-short', defaultValue: 'COMPARADA.' },
    { key: 'badge', label: 'Badge canto superior', type: 'text-short', defaultValue: 'BENCHMARK INTERNO' },
    { key: 'intro', label: 'Introdução', type: 'text-long', defaultValue: 'Métricas internas, escala 0–100. 100 = topo de cada categoria.' },
  ];
  // Labels de métricas — compartilhadas entre os 4 cards do grid.
  const sharedMetrics = benchmarkLines[0]?.metrics ?? [];
  sharedMetrics.forEach((m, i) => {
    fields.push({
      key: `metric.${i}.label`,
      label: `Métrica ${i + 1} — Label (${m.label})`,
      type: 'text-short',
      defaultValue: m.label,
    });
  });
  // Para cada um dos 4 cards (CORE, FLOW, PRIME, LUXURY)
  benchmarkLines.forEach((line) => {
    fields.push(
      { key: `line.${line.id}.name`, label: `Card "${line.name}" — Nome`, type: 'text-short', defaultValue: line.name },
      { key: `line.${line.id}.spec`, label: `Card "${line.name}" — Spec`, type: 'text-short', defaultValue: `${line.thickness} · ${line.warranty}` },
      { key: `line.${line.id}.highlight`, label: `Card "${line.name}" — Quote final`, type: 'text-long', defaultValue: line.highlight },
    );
  });
  fields.push(
    { key: 'qr.label', label: 'QR — Rótulo', type: 'text-short', defaultValue: 'FICHA TÉCNICA COMPLETA' },
    { key: 'qr.url', label: 'QR — URL exibida', type: 'text-short', defaultValue: 'nzgroup.com.br/comparativo' },
    ...footerFields(),
  );
  return { pageId: 'benchmark', label: 'Comparativo de Performance', fields };
}

/* ────────── DIFFERENTIALS ────────── */

function differentialsPage(): EditablePage {
  const fields: EditableField[] = [
    { key: 'pageSection', label: 'Eyebrow', type: 'text-short', defaultValue: '11  ·  DIFERENCIAIS' },
    { key: 'h2.l1', label: 'Título — Linha 1', type: 'text-short', defaultValue: 'DIFERENCIAIS' },
    { key: 'h2.l2', label: 'Título — Linha 2 (dourada)', type: 'text-short', defaultValue: 'EXCLUSIVOS' },
    { key: 'badge', label: 'Badge canto superior', type: 'text-short', defaultValue: 'NZPPF · ENGINEERED' },
    { key: 'intro', label: 'Introdução', type: 'text-long', defaultValue: 'O que torna um filme NZ PPF reconhecível mesmo sem rótulo: quatro decisões de engenharia presentes em todas as linhas — do Core ao Luxury.' },
  ];
  exclusiveDifferentials.forEach((d, i) => {
    const chipText = (d.line || '')
      .replace(/^PRESENTE EM:\s*/i, '')
      .replace(/^EXCLUSIVO DA LINHA:\s*/i, 'EXCLUSIVO · ')
      .replace(/^PRESENTE EM\s+/i, '')
      .trim();
    fields.push(
      { key: `diff.${i}.title`, label: `Card ${i + 1} — Título (${d.title})`, type: 'text-short', defaultValue: d.title },
      { key: `diff.${i}.chip`, label: `Card ${i + 1} — Chip cobertura`, type: 'text-short', defaultValue: chipText },
      { key: `diff.${i}.desc`, label: `Card ${i + 1} — Descrição`, type: 'text-long', defaultValue: d.desc },
    );
  });
  fields.push(
    { key: 'qr.label', label: 'QR — Rótulo', type: 'text-short', defaultValue: 'DETALHAMENTO TÉCNICO' },
    { key: 'qr.url', label: 'QR — URL exibida', type: 'text-short', defaultValue: 'nzgroup.com.br/diferenciais' },
    ...footerFields(),
  );
  return { pageId: 'differentials', label: 'Diferenciais Exclusivos', fields };
}

/* ────────── GUARANTEE ────────── */

function guaranteePage(): EditablePage {
  const COVERAGE = [
    { title: 'AMARELAMENTO',     desc: 'Perda de transparência por UV ou tempo. Cobertura total dentro do prazo.' },
    { title: 'DESCOLAMENTO',     desc: 'Reaplicação sem custo se a borda soltar antes do fim da garantia.' },
    { title: 'TRINCAS E MANCHAS', desc: 'Defeito de fabricação coberto integralmente. Sem perícia.' },
    { title: 'DESLAMINAÇÃO',     desc: 'Separação entre camadas resulta em substituição completa do filme.' },
  ];
  const TIERS = [
    { years: '12', name: 'LUXURY GLOSS' },
    { years: '10', name: 'PRIME GLOSS' },
    { years: '10', name: 'HEADLIGHT' },
    { years: '4',  name: 'FLOW GLOSS' },
    { years: '3',  name: 'CORE GLOSS' },
    { years: '2',  name: 'WINDSHIELD' },
  ];
  const COMMITMENTS = [
    { title: 'TRANSFERÍVEL',     desc: 'Acompanha o veículo. Se vender o carro, a garantia segue junto.' },
    { title: 'RASTREÁVEL',       desc: 'Cada aplicação tem código único registrado e auditável.' },
    { title: 'SEM LETRAS MIÚDAS', desc: 'O que está no contrato vale. O que não está, não está.' },
  ];

  const fields: EditableField[] = [
    { key: 'pageSection', label: 'Eyebrow', type: 'text-short', defaultValue: '12  ·  GARANTIA OFICIAL' },
    { key: 'h2.l1', label: 'Título — Linha 1', type: 'text-short', defaultValue: 'NOSSA' },
    { key: 'h2.l2', label: 'Título — Linha 2 (dourada)', type: 'text-short', defaultValue: 'GARANTIA.' },
    { key: 'badge', label: 'Badge canto superior', type: 'text-short', defaultValue: 'COBERTURA OFICIAL NZ' },
    { key: 'intro', label: 'Introdução', type: 'text-long', defaultValue: 'Garantia que vive na rua, não no papel. Cada NZPPF é registrado com código único — proteção que segue o carro, não o cliente.' },
    { key: 'coverageHeader', label: 'Cobertura — Header', type: 'text-short', defaultValue: 'O QUE COBRIMOS' },
  ];
  COVERAGE.forEach((c, i) => {
    fields.push(
      { key: `coverage.${i}.title`, label: `Cobertura ${i + 1} — Título`, type: 'text-short', defaultValue: c.title },
      { key: `coverage.${i}.desc`,  label: `Cobertura ${i + 1} — Descrição`, type: 'text-long', defaultValue: c.desc },
    );
  });
  fields.push(
    { key: 'warrantyHeader', label: 'Prazos — Header', type: 'text-short', defaultValue: 'PRAZO POR LINHA' },
  );
  TIERS.forEach((t, i) => {
    fields.push(
      { key: `tier.${i}.years`, label: `Prazo ${i + 1} — Anos`, type: 'text-short', defaultValue: t.years },
      { key: `tier.${i}.name`,  label: `Prazo ${i + 1} — Linha`, type: 'text-short', defaultValue: t.name },
    );
  });
  fields.push(
    { key: 'commitmentHeader', label: 'Compromisso — Header', type: 'text-short', defaultValue: 'NOSSO COMPROMISSO' },
  );
  COMMITMENTS.forEach((c, i) => {
    fields.push(
      { key: `commitment.${i}.title`, label: `Compromisso ${i + 1} — Título`, type: 'text-short', defaultValue: c.title },
      { key: `commitment.${i}.desc`,  label: `Compromisso ${i + 1} — Descrição`, type: 'text-long', defaultValue: c.desc },
    );
  });
  fields.push(
    { key: 'pullQuote', label: 'Pull quote (rodapé)', type: 'text-long', defaultValue: 'Garantia não é promessa. É contrato.' },
    { key: 'qr.label', label: 'QR — Rótulo', type: 'text-short', defaultValue: 'DETALHAMENTO TÉCNICO' },
    { key: 'qr.url',   label: 'QR — URL exibida', type: 'text-short', defaultValue: 'nzgroup.com.br/garantia' },
    ...footerFields(),
  );
  return { pageId: 'guarantee', label: 'Garantia Oficial', fields };
}

/* ────────── CLOSING ────────── */

function closingPage(): EditablePage {
  return {
    pageId: 'closing',
    label: 'Posicionamento de Marca',
    fields: [
      { key: 'pageSection', label: 'Eyebrow', type: 'text-short', defaultValue: '13  ·  POSICIONAMENTO' },
      { key: 'h2.l1', label: 'Título — Linha 1', type: 'text-short', defaultValue: 'NOSSOS' },
      { key: 'h2.l2', label: 'Título — Linha 2 (dourada)', type: 'text-short', defaultValue: 'DIFERENCIAIS' },
      { key: 'badge', label: 'Badge canto superior', type: 'text-short', defaultValue: 'POR QUE NZPPF' },
      { key: 'quote', label: 'Pull quote', type: 'text-long', defaultValue: 'Nossos diferenciais vão além de entregar um produto de qualidade — isso é obrigação.' },
      { key: 'quote.author', label: 'Quote — Autor', type: 'text-short', defaultValue: '— NZ Group' },
      { key: 'block.0.title', label: 'Bloco 1 — Título', type: 'text-short', defaultValue: 'O QUE NOS SEPARA' },
      { key: 'block.0.body', label: 'Bloco 1 — Descrição', type: 'text-long', defaultValue: 'Domínio sobre a química. Resina, adesivo e coating alinhados.' },
      { key: 'block.1.title', label: 'Bloco 2 — Título', type: 'text-short', defaultValue: 'NOSSO COMPROMISSO' },
      { key: 'block.1.body', label: 'Bloco 2 — Descrição', type: 'text-long', defaultValue: 'Cada cliente é um sonho protegido. Não negociamos integridade no preço.' },
      { key: 'block.2.title', label: 'Bloco 3 — Título', type: 'text-short', defaultValue: 'NOSSAS MATÉRIAS-PRIMAS' },
      { key: 'block.2.body', label: 'Bloco 3 — Descrição', type: 'text-long', defaultValue: 'Compounds rastreáveis com ficha técnica. Sem "quase isso, quase aquilo".' },
      { key: 'block.3.title', label: 'Bloco 4 — Título', type: 'text-short', defaultValue: 'ATENDIMENTO 360°' },
      { key: 'block.3.body', label: 'Bloco 4 — Descrição', type: 'text-long', defaultValue: 'Aplicador qualificado próximo, suporte oficial sempre que precisar.' },
      ...footerFields(),
    ],
  };
}

/* ────────── BACK COVER ────────── */

function backCoverPage(): EditablePage {
  return {
    pageId: 'backcover',
    label: 'Contra-capa · QR',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', type: 'text-short', defaultValue: 'VISITE O SITE OFICIAL' },
      { key: 'tagline.l1', label: 'Tagline — Linha 1', type: 'text-short', defaultValue: 'SUA OBRA-PRIMA' },
      { key: 'tagline.l2', label: 'Tagline — Linha 2 (com PPF dourado)', type: 'text-short', defaultValue: 'MERECE O PPF' },
      { key: 'tagline.l3', label: 'Tagline — Linha 3', type: 'text-short', defaultValue: 'QUE FOI FEITO PRA ELA.' },
      { key: 'warranty.badge', label: 'Selo de garantia', type: 'text-short', defaultValue: 'ATÉ 12 ANOS DE GARANTIA' },
      { key: 'cta.label', label: 'CTA — Rótulo', type: 'text-short', defaultValue: 'ESCANEIE PARA EXPLORAR' },
      { key: 'cta.url', label: 'CTA — URL exibida', type: 'text-short', defaultValue: catalogMeta.url },
      { key: 'footer.company', label: 'Footer — Empresa', type: 'text-short', defaultValue: catalogMeta.company },
      { key: 'footer.edition', label: 'Footer — Edição', type: 'text-short', defaultValue: 'CATÁLOGO NZPPF · EDIÇÃO 2026' },
    ],
  };
}

/* ────────── CEO LETTER ────────── */

function ceoLetterPage(): EditablePage {
  return {
    pageId: 'ceoletter',
    label: 'Palavra Final',
    fields: [
      { key: 'wordmark', label: 'Wordmark superior', type: 'text-short', defaultValue: 'NZPPF' },
      { key: 'h2.l1', label: 'Título — Linha 1', type: 'text-short', defaultValue: 'UMA' },
      { key: 'h2.l2', label: 'Título — Linha 2 (dourada)', type: 'text-short', defaultValue: 'PALAVRA FINAL.' },
      { key: 'pullQuote', label: 'Pull quote', type: 'text-long', defaultValue: 'É como a película do celular — só que protege o seu carro inteiro.' },
      { key: 'paragraph.0', label: 'Parágrafo 1', type: 'text-long', defaultValue: 'NZPPF nasceu de uma recusa: vender quase isso como se fosse aquilo. Película que defendemos em qualquer pista.' },
      { key: 'paragraph.1', label: 'Parágrafo 2', type: 'text-long', defaultValue: 'Cada linha aqui passou pelo mesmo crivo: resiste à pergunta de um cliente exigente? Cobre o que promete?' },
      { key: 'paragraph.2', label: 'Parágrafo 3', type: 'text-long', defaultValue: 'As garantias que assinamos não vivem no papel. Vivem na rua, no carro do cliente. Obrigado por chegar até aqui.' },
      { key: 'tagline', label: 'Tagline final', type: 'text-short', defaultValue: catalogMeta.tagline },
      { key: 'footer', label: 'Footer (edição + URL)', type: 'text-short', defaultValue: `EDIÇÃO MMXXVI  ·  ${catalogMeta.url}` },
    ],
  };
}

/* ────────── Coleta final ────────── */

export function getAllEditablePages(): EditablePage[] {
  const pages: EditablePage[] = [
    coverPage(),
    manifestPage(),
    linesOverviewPage(),
  ];
  productLines.forEach((product, i) => {
    pages.push(productPage(product, i));
    const finishes = finishesPage(product, i);
    if (finishes) pages.push(finishes);
  });
  pages.push(
    benchmarkPage(),
    differentialsPage(),
    guaranteePage(),
    closingPage(),
    backCoverPage(),
    ceoLetterPage(),
  );
  return pages;
}

export function getEditablePageById(pageId: string): EditablePage | undefined {
  return getAllEditablePages().find((p) => p.pageId === pageId);
}
