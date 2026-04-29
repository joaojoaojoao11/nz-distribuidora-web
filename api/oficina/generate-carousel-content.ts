import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';

/**
 * POST /api/oficina/generate-carousel-content
 *
 * Body:
 *   { brand, productShortName, productSubtitle?, tone, layouts: string[], extraInstructions? }
 *
 * Response (200): { slides: Array<{ headline, subline, cta }> }
 * Response (4xx/5xx): { error: string }
 *
 * Gera copy (headline/subline/CTA) por slide pra um carrossel Instagram NZ,
 * usando tool use pra forçar saída estruturada com 1 entrada por slide.
 */

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';

const VALID_LAYOUTS = [
  'hero-bottom-cta',
  'centered-quote',
  'split-photo',
  'full-bleed-headline',
  'stat-driven',
  'announce-badge',
];

const VALID_TONES = ['tecnico', 'aspiracional', 'promocional'];

const MIN_SLIDES = 3;
const MAX_SLIDES = 10;

const SYSTEM_PROMPT = `Você é redator publicitário sênior da Agência NZ — sistema de marketing da NZ Group, distribuidora premium de PPF (Paint Protection Film) e vinis Oracal.

Sua tarefa: gerar copy (headline, subline, CTA) pra cada slide de um carrossel de Instagram, dado: marca, linha/produto, tom e a sequência de layouts dos slides.

# Voz da marca
Premium, direta, confiante. Fala com o dono do veículo. Sem jargão exagerado, sem exclamações, sem emoji. Curto, com peso. Em PT-BR.

# Estilo de copy por layout
- announce-badge (tipicamente capa): headline impacto que anuncia + subline curto. Pode mencionar o nome da linha.
- hero-bottom-cta (tipicamente fechamento): headline central forte + CTA de ação clara.
- centered-quote: headline tipo manifesto + subline curto identificando marca/produto.
- split-photo: headline curto (1-3 palavras) + subline descritivo curto.
- full-bleed-headline: headline GIGANTE de 1-3 palavras + CTA único e forte.
- stat-driven: headline pode ficar VAZIA (string ""); o subline contextualiza um número que aparece como destaque visual em outro lugar.

# Tons
- tecnico: specs, materiais, garantias, dados. Voz de engenheiro premium.
- aspiracional: sensação, presença, lifestyle. Voz cinematográfica.
- promocional: ação, oportunidade, prazo. Voz direta de venda.

# Regras de formato
- Headline: use \\n pra quebrar linha (1-2 linhas, no máximo 4 palavras por linha). Pode ser vazia em stat-driven.
- Subline: 1 frase curta (5-14 palavras).
- CTA: 1-3 palavras (ex "Ver linha", "Onde comprar", "Ficha técnica", "Reservar").

# Coerência narrativa
O carrossel inteiro é UMA história sequencial: capa engaja, slides do meio aprofundam (varie o ângulo: benefício, prova, técnica, sensação), fechamento convoca à ação. Não repita a mesma headline em slides diferentes. Construa progressão.

# Restrições
- NÃO use placeholders tipo {shortName} — escreva o nome da linha literalmente quando for relevante mencioná-la.
- NÃO crie copy que dependa de imagens específicas — o copy precisa fazer sentido sozinho.

# CONFERÊNCIA DE FATOS (ANTI-ALUCINAÇÃO)
Se o usuário enviar um bloco "FATOS REAIS DA LINHA", use SOMENTE esses números/specs/garantias na copy. NÃO invente espessura, percentuais, nomes de tecnologia ou tempo de garantia. Se um fato não está no bloco, omita ao invés de chutar. Quando for citar um veículo associado à linha, use SOMENTE marcas/modelos do bloco "Carros típicos do segmento" — fora dessa lista, prefira não nomear veículo nenhum.

Você SEMPRE responde via tool use chamando "generate_carousel_copy", devolvendo exatamente um item por slide na ordem recebida.`;

const carouselCopyTool = {
  name: 'generate_carousel_copy',
  description:
    'Gera copy para todos os slides do carrossel, na mesma ordem dos layouts recebidos.',
  input_schema: {
    type: 'object' as const,
    properties: {
      slides: {
        type: 'array',
        description: 'Array com 1 objeto por slide, na ordem.',
        items: {
          type: 'object',
          properties: {
            headline: {
              type: 'string',
              description:
                'Headline do slide. Use \\n pra quebra de linha. Pode ser vazia em stat-driven.',
            },
            subline: {
              type: 'string',
              description: 'Frase curta de apoio (5-14 palavras).',
            },
            cta: {
              type: 'string',
              description: 'Call-to-action de 1-3 palavras.',
            },
          },
          required: ['headline', 'subline', 'cta'],
        },
      },
    },
    required: ['slides'],
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).json({});
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY não configurada no servidor.' });
    return;
  }

  const body = (req.body || {}) as {
    brand?: unknown;
    productShortName?: unknown;
    productSubtitle?: unknown;
    tone?: unknown;
    layouts?: unknown;
    extraInstructions?: unknown;
    factsContext?: unknown;
    carBrands?: unknown;
    segmentLabel?: unknown;
  };

  const brand = typeof body.brand === 'string' ? body.brand.trim() : '';
  const productShortName =
    typeof body.productShortName === 'string' ? body.productShortName.trim() : '';
  const productSubtitle =
    typeof body.productSubtitle === 'string' ? body.productSubtitle.trim() : '';
  const tone = typeof body.tone === 'string' ? body.tone.trim() : '';
  const layoutsRaw = Array.isArray(body.layouts)
    ? body.layouts.filter((l): l is string => typeof l === 'string')
    : [];
  const extraInstructions =
    typeof body.extraInstructions === 'string'
      ? body.extraInstructions.trim().slice(0, 500)
      : '';
  const factsContext =
    typeof body.factsContext === 'string' ? body.factsContext.trim().slice(0, 1500) : '';
  const carBrands =
    typeof body.carBrands === 'string' ? body.carBrands.trim().slice(0, 300) : '';
  const segmentLabel =
    typeof body.segmentLabel === 'string' ? body.segmentLabel.trim().slice(0, 300) : '';

  if (!brand) {
    res.status(400).json({ error: 'Campo "brand" obrigatório.' });
    return;
  }
  if (!productShortName) {
    res.status(400).json({ error: 'Campo "productShortName" obrigatório.' });
    return;
  }
  if (!VALID_TONES.includes(tone)) {
    res.status(400).json({ error: `Tom inválido: ${tone}` });
    return;
  }
  if (layoutsRaw.length < MIN_SLIDES || layoutsRaw.length > MAX_SLIDES) {
    res.status(400).json({
      error: `Número de slides inválido (${layoutsRaw.length}). Esperado ${MIN_SLIDES}-${MAX_SLIDES}.`,
    });
    return;
  }
  for (const l of layoutsRaw) {
    if (!VALID_LAYOUTS.includes(l)) {
      res.status(400).json({ error: `Layout inválido: ${l}` });
      return;
    }
  }

  // Bloco "FATOS DA LINHA" é tratado pelo system prompt como referência
  // imutável — Claude foi instruído a NÃO inventar specs e usar só o que
  // está aqui. carBrands/segmentLabel orientam menções a veículos quando
  // fizer sentido na copy.
  const factsBlock = [
    factsContext ? `FATOS REAIS DA LINHA (use SOMENTE estes — não invente specs):\n${factsContext}` : '',
    segmentLabel ? `Segmento de cliente desta linha: ${segmentLabel}` : '',
    carBrands ? `Carros típicos do segmento (cite só se fizer sentido): ${carBrands}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const userPrompt = [
    `Marca: ${brand}`,
    `Linha/produto: ${productShortName}${productSubtitle ? ` — ${productSubtitle}` : ''}`,
    `Tom: ${tone}`,
    `Quantidade de slides: ${layoutsRaw.length}`,
    '',
    factsBlock,
    factsBlock ? '' : null,
    'Sequência de slides (gere copy pra cada um, na ordem):',
    ...layoutsRaw.map((l, i) => `Slide ${i + 1} → layout="${l}"`),
    extraInstructions ? `\nInstruções extras do usuário: ${extraInstructions}` : '',
  ]
    .filter((s) => s !== null && s !== '')
    .join('\n');

  const anthropic = new Anthropic({ apiKey });

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      tools: [carouselCopyTool],
      tool_choice: { type: 'tool', name: 'generate_carousel_copy' },
      messages: [{ role: 'user', content: userPrompt }],
    });

    const toolUseBlock = response.content.find((b) => b.type === 'tool_use');
    if (!toolUseBlock || toolUseBlock.type !== 'tool_use') {
      res.status(500).json({ error: 'IA não retornou tool_use esperado.' });
      return;
    }

    const data = toolUseBlock.input as {
      slides?: Array<{ headline?: unknown; subline?: unknown; cta?: unknown }>;
    };
    if (!Array.isArray(data.slides) || data.slides.length !== layoutsRaw.length) {
      res.status(500).json({
        error: `Resposta da IA com tamanho inesperado (${data.slides?.length ?? 0}/${layoutsRaw.length}).`,
      });
      return;
    }

    const slides = data.slides.map((s) => ({
      headline: typeof s.headline === 'string' ? s.headline : '',
      subline: typeof s.subline === 'string' ? s.subline : '',
      cta: typeof s.cta === 'string' ? s.cta : '',
    }));

    res.status(200).json({ slides });
  } catch (err) {
    console.error('[oficina/generate-carousel-content] Erro:', err);
    const msg = err instanceof Error ? err.message : 'Erro desconhecido ao chamar IA.';
    res.status(500).json({ error: msg });
  }
}
