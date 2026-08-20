import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';

/**
 * POST /api/oficina/generate-field
 *
 * Regenera UM ÚNICO campo de UM slide do carrossel — varinha mágica de
 * diversificação rápida. A IA respeita os fatos da linha, o tom e os
 * outros campos já preenchidos no mesmo slide pra manter coerência.
 *
 * Body:
 *   {
 *     fieldKey: 'headline' | 'subline' | 'cta' | 'badge' | 'stat' |
 *               'statLabel' | 'eyebrow',
 *     layout, tone, brand,
 *     productShortName, productSubtitle?,
 *     factsContext?, carBrands?, segmentLabel?,
 *     currentValue?,                    // pra que a IA NÃO repita igualzinho
 *     slideIdx, totalSlides,            // posição na narrativa
 *     otherFields: { headline?, subline?, cta?, ... } // pra coerência
 *   }
 *
 * Response (200): { value: string }
 * Response (4xx/5xx): { error: string }
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
const VALID_FIELDS = ['headline', 'subline', 'cta', 'badge', 'stat', 'statLabel', 'eyebrow'];

const FIELD_RULES: Record<string, string> = {
  headline:
    'Headline principal do slide. 1-2 linhas (use \\n pra quebra), no máximo 4 palavras por linha. Pode ser vazia em layout stat-driven.',
  subline:
    'Frase curta de apoio. 5-14 palavras. Sem ponto final se possível. Não repete o headline.',
  cta:
    'Call-to-action. 1-3 palavras (ex "Ver linha", "Onde comprar", "Reservar", "Ficha técnica", "Conhecer"). Verbo no infinitivo ou imperativo.',
  badge:
    'Badge curto em ALL CAPS. 2-4 palavras (ex "NOVO LANÇAMENTO", "EDIÇÃO 2026", "BLACK FRIDAY", "AGORA NA REDE"). Sempre em maiúsculas.',
  stat:
    'Número ou medida em destaque. CURTO (1-3 palavras). Ex "12 ANOS", "190μ", "+32%", "100%", "10 ANOS". DEVE vir do bloco de fatos da linha quando for spec — nunca invente número.',
  statLabel:
    'Rótulo do stat em ALL CAPS. 2-5 palavras. Ex "DE GARANTIA REAL", "DE BRILHO A MAIS", "DE PROTEÇÃO", "DE DURABILIDADE".',
  eyebrow:
    'Subtítulo da linha em formato spec-like. Ex "TPU 185μ · Hidrofóbico · 7 anos". Use ponto-mediano " · " pra separar 2-4 specs verificáveis.',
};

const SYSTEM_PROMPT = `Você é redator publicitário sênior da Agência NZ — sistema de marketing da NZ Group, fabricante premium de PPF e vinis Oracal.

Sua tarefa: REESCREVER UM ÚNICO CAMPO de um slide de carrossel Instagram. Não retoca outros campos, só o pedido — mas mantendo coerência com o resto do slide e do carrossel.

# Voz da marca
Premium, direta, confiante. PT-BR. Sem jargão exagerado, sem exclamações, sem emoji.

# CONFERÊNCIA DE FATOS (anti-alucinação)
Quando o usuário enviar bloco "FATOS REAIS DA LINHA", use SOMENTE esses números/specs/garantias. NÃO invente espessura, percentual, garantia ou nomes de tecnologia. Se for citar veículo, use APENAS marcas/modelos do segmento listado — fora dessa lista, não nomeie veículo nenhum.

# REGRA DO CAMPO
A regra específica do campo a regenerar virá no prompt do usuário (\`Regra desse campo:\`). Siga-a rigorosamente.

# COERÊNCIA E DIVERSIFICAÇÃO
- O usuário envia os outros campos JÁ ESCRITOS do mesmo slide. Sua versão precisa fazer sentido junto deles, sem repetir.
- O usuário pode mandar a "Versão atual" do campo. Sua nova versão DEVE ser semanticamente diferente — outra angulação, outra abertura, outra escolha lexical. Não é só sinônimo, é variar o ângulo.

Você SEMPRE responde via tool use chamando "generate_field" com a string nova no campo \`value\`.`;

const fieldTool = {
  name: 'generate_field',
  description: 'Devolve a nova versão do campo seguindo a regra e o contexto do slide.',
  input_schema: {
    type: 'object' as const,
    properties: {
      value: {
        type: 'string',
        description:
          'Nova versão do campo. Pra headline use \\n pra quebra de linha quando útil. Pode ser string vazia em casos específicos (ex headline em stat-driven).',
      },
    },
    required: ['value'],
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

  const body = (req.body || {}) as Record<string, unknown>;
  const fieldKey = String(body.fieldKey || '').trim();
  const layout = String(body.layout || '').trim();
  const tone = String(body.tone || '').trim();
  const brand = String(body.brand || '').trim();
  const productShortName = String(body.productShortName || '').trim();
  const productSubtitle = String(body.productSubtitle || '').trim();
  const factsContext = String(body.factsContext || '').trim().slice(0, 1500);
  const carBrands = String(body.carBrands || '').trim().slice(0, 300);
  const segmentLabel = String(body.segmentLabel || '').trim().slice(0, 300);
  const currentValue = String(body.currentValue || '').slice(0, 500);
  const slideIdx = Number(body.slideIdx) || 0;
  const totalSlides = Number(body.totalSlides) || 1;
  const otherFieldsRaw = (body.otherFields && typeof body.otherFields === 'object'
    ? (body.otherFields as Record<string, unknown>)
    : {}) as Record<string, unknown>;

  if (!VALID_FIELDS.includes(fieldKey)) {
    res.status(400).json({ error: `fieldKey inválido: ${fieldKey}` });
    return;
  }
  if (!VALID_LAYOUTS.includes(layout)) {
    res.status(400).json({ error: `layout inválido: ${layout}` });
    return;
  }
  if (!VALID_TONES.includes(tone)) {
    res.status(400).json({ error: `tone inválido: ${tone}` });
    return;
  }
  if (!brand || !productShortName) {
    res.status(400).json({ error: 'brand e productShortName são obrigatórios.' });
    return;
  }

  const otherEntries: string[] = [];
  for (const [k, v] of Object.entries(otherFieldsRaw)) {
    if (k === fieldKey) continue;
    const s = typeof v === 'string' ? v.trim() : '';
    if (s) otherEntries.push(`  ${k}: "${s.slice(0, 200)}"`);
  }

  const userPrompt = [
    `Marca: ${brand}`,
    `Linha: ${productShortName}${productSubtitle ? ` — ${productSubtitle}` : ''}`,
    `Tom: ${tone}`,
    `Slide ${slideIdx + 1} de ${totalSlides}, layout: ${layout}`,
    factsContext ? `\nFATOS REAIS DA LINHA (use SOMENTE estes — não invente specs):\n${factsContext}` : '',
    segmentLabel ? `Segmento de cliente: ${segmentLabel}` : '',
    carBrands ? `Carros típicos do segmento (cite só se fizer sentido): ${carBrands}` : '',
    `\n--- CAMPO A REGENERAR ---`,
    `Campo: ${fieldKey}`,
    `Regra desse campo: ${FIELD_RULES[fieldKey]}`,
    currentValue
      ? `Versão atual (NÃO repita exatamente — DIVERSIFIQUE o ângulo): "${currentValue}"`
      : '',
    otherEntries.length > 0
      ? `\nOutros campos do mesmo slide já escritos (mantenha coerência sem repetir):\n${otherEntries.join('\n')}`
      : '',
    `\nGere uma nova versão respeitando rigorosamente a regra do campo.`,
  ]
    .filter(Boolean)
    .join('\n');

  const anthropic = new Anthropic({ apiKey });

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      tools: [fieldTool],
      tool_choice: { type: 'tool', name: 'generate_field' },
      messages: [{ role: 'user', content: userPrompt }],
    });

    const block = response.content.find((b) => b.type === 'tool_use');
    if (!block || block.type !== 'tool_use') {
      res.status(500).json({ error: 'IA não retornou tool_use esperado.' });
      return;
    }
    const value = (block.input as { value?: unknown }).value;
    if (typeof value !== 'string') {
      res.status(500).json({ error: 'IA retornou value inválido.' });
      return;
    }
    res.status(200).json({ value });
  } catch (err) {
    console.error('[oficina/generate-field] Erro:', err);
    const msg = err instanceof Error ? err.message : 'Erro desconhecido ao chamar IA.';
    res.status(500).json({ error: msg });
  }
}
