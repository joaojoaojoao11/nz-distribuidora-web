import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';

/**
 * POST /api/oficina/generate-caption
 *
 * Gera o TEXTO DA LEGENDA (caption) que vai abaixo do post no Instagram.
 * Diferente do copy IN-image dos slides, a caption é storytelling — pode
 * ser mais longa, com line breaks, hooks e hashtags ao final.
 *
 * Body:
 *   {
 *     brand, productShortName, productSubtitle?, tone,
 *     factsContext?, carBrands?, segmentLabel?,
 *     slides: [{ layout, headline, subline, cta }, ...],
 *     hashtags: string[]
 *   }
 *
 * Response (200): { caption: string }
 * Response (4xx/5xx): { error: string }
 */

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';

const VALID_TONES = ['tecnico', 'aspiracional', 'promocional'];

const SYSTEM_PROMPT = `Você é redator publicitário sênior da Agência NZ — sistema de marketing da NZ Group, fabricante premium de PPF e vinis Oracal.

Sua tarefa: escrever a CAPTION (legenda) que aparece abaixo de um carrossel no Instagram. Diferente do copy IN-image, a caption é narrativa — tem mais espaço, pode usar parágrafos curtos, e termina com hashtags.

# Voz da marca
Premium, direta, confiante. PT-BR. Sem jargão exagerado, sem exclamações desnecessárias, sem emoji.

# Estrutura ideal da caption
1. Hook (1ª linha) — frase curta que prende atenção. NÃO repita literal o headline da capa, mas conversa com a ideia.
2. Storytelling curto (2-4 linhas) — desdobra benefício, sensação, prova ou contexto. Use \\n\\n entre parágrafos.
3. CTA explícito (1 linha) — convida a ação ("Fale com nosso aplicador autorizado.", "Conheça em nzgroup.com.br.", etc).
4. Linha em branco e depois as hashtags fornecidas, todas juntas.

# CONFERÊNCIA DE FATOS
Quando o usuário enviar bloco "FATOS REAIS DA LINHA", use SOMENTE esses números/specs/garantias. NÃO invente. Quando citar veículos, use APENAS marcas/modelos do segmento listado.

# Limites
- 600-1100 caracteres no total (incluindo hashtags) é o sweet spot do Instagram.
- Use line breaks (\\n) generosamente — texto em bloco compacto não é lido.
- Hashtags vêm exatamente como recebidas, juntas ao final, separadas por espaço, em UMA linha.

Você SEMPRE responde via tool use chamando "generate_caption".`;

const captionTool = {
  name: 'generate_caption',
  description: 'Devolve a caption final pronta pra colar no Instagram.',
  input_schema: {
    type: 'object' as const,
    properties: {
      caption: {
        type: 'string',
        description:
          'Texto completo da caption, com line breaks (\\n) e hashtags ao final.',
      },
    },
    required: ['caption'],
  },
};

interface SlideCopy {
  layout?: unknown;
  headline?: unknown;
  subline?: unknown;
  cta?: unknown;
}

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

  const body = (req.body || {}) as Record<string, unknown>;
  const brand = String(body.brand || '').trim();
  const productShortName = String(body.productShortName || '').trim();
  const productSubtitle = String(body.productSubtitle || '').trim();
  const tone = String(body.tone || '').trim();
  const factsContext = String(body.factsContext || '').trim().slice(0, 1500);
  const carBrands = String(body.carBrands || '').trim().slice(0, 300);
  const segmentLabel = String(body.segmentLabel || '').trim().slice(0, 300);
  const hashtagsRaw = Array.isArray(body.hashtags)
    ? (body.hashtags as unknown[])
        .filter((h): h is string => typeof h === 'string')
        .map((h) => h.trim())
        .filter(Boolean)
    : [];
  const slidesRaw = Array.isArray(body.slides) ? (body.slides as unknown[]) : [];

  if (!brand || !productShortName) {
    res.status(400).json({ error: 'brand e productShortName são obrigatórios.' });
    return;
  }
  if (!VALID_TONES.includes(tone)) {
    res.status(400).json({ error: `tone inválido: ${tone}` });
    return;
  }
  if (slidesRaw.length === 0) {
    res.status(400).json({ error: 'slides vazio.' });
    return;
  }

  const slides = slidesRaw.slice(0, 10).map((s, i) => {
    const sl = (s || {}) as SlideCopy;
    const headline = typeof sl.headline === 'string' ? sl.headline.replace(/\n/g, ' ') : '';
    const subline = typeof sl.subline === 'string' ? sl.subline : '';
    const cta = typeof sl.cta === 'string' ? sl.cta : '';
    const layout = typeof sl.layout === 'string' ? sl.layout : '';
    return `Slide ${i + 1} (${layout}): "${headline}" / "${subline}" / CTA "${cta}"`;
  });

  const userPrompt = [
    `Marca: ${brand}`,
    `Linha: ${productShortName}${productSubtitle ? ` — ${productSubtitle}` : ''}`,
    `Tom: ${tone}`,
    factsContext ? `\nFATOS REAIS DA LINHA (use SOMENTE estes):\n${factsContext}` : '',
    segmentLabel ? `Segmento: ${segmentLabel}` : '',
    carBrands ? `Carros típicos do segmento: ${carBrands}` : '',
    `\nConteúdo dos slides do carrossel (na ordem):`,
    ...slides,
    hashtagsRaw.length > 0
      ? `\nHashtags pra colocar no final (use exatamente, juntas em uma linha): ${hashtagsRaw.join(' ')}`
      : '',
    `\nGere a caption final.`,
  ]
    .filter(Boolean)
    .join('\n');

  const anthropic = new Anthropic({ apiKey });

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: [captionTool],
      tool_choice: { type: 'tool', name: 'generate_caption' },
      messages: [{ role: 'user', content: userPrompt }],
    });

    const block = response.content.find((b) => b.type === 'tool_use');
    if (!block || block.type !== 'tool_use') {
      res.status(500).json({ error: 'IA não retornou tool_use esperado.' });
      return;
    }
    const caption = (block.input as { caption?: unknown }).caption;
    if (typeof caption !== 'string') {
      res.status(500).json({ error: 'IA retornou caption inválida.' });
      return;
    }
    res.status(200).json({ caption });
  } catch (err) {
    console.error('[oficina/generate-caption] Erro:', err);
    const msg = err instanceof Error ? err.message : 'Erro desconhecido ao chamar IA.';
    res.status(500).json({ error: msg });
  }
}
