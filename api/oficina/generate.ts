import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';

/**
 * POST /api/oficina/generate
 *
 * Body: { prompt: string }
 * Response (200): { motor: MotorSpec }
 * Response (400): { error: string }
 * Response (500): { error: string }
 *
 * Usa tool use da Anthropic API para forçar saída estruturada.
 * O schema do tool é a definição canônica de MotorSpec — Claude
 * obrigatoriamente devolve um JSON válido conforme o schema.
 */

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';

const SYSTEM_PROMPT = `Você é o designer de motores da Agência NZ — sistema interno de automação de marketing da NZ Group, fabricante premium de PPF (Paint Protection Film).

Quando o usuário descreve um material de marketing que quer gerar, você produz um MotorSpec (JSON) que o sistema registra e executa. Você SEMPRE responde via tool use chamando "create_motor_spec".

# Tipos de motor disponíveis

APENAS social-image. Outros tipos (PDF, slide, banner web) ainda não são suportados. Se o usuário pedir algo fora, você cria um social-image temático sobre o assunto.

# Anatomia de um social-image

Output: imagem PNG em UM dos formatos suportados.

Formatos:
- 'feed-1x1' (1080×1080) — post de feed Instagram, padrão para publicações regulares.
- 'story-9x16' (1080×1920) — stories Instagram / Reels capa, vertical longo.

Layouts (escolha o que melhor encaixa no objetivo):
- 'hero-bottom-cta' — wordmark topo + headline central + CTA destacado no rodapé. Padrão multi-uso, bom pra apresentação de linha.
- 'centered-quote' — pull quote grande centralizado com aspas decorativas. Bom pra manifesto, frase de marca, pensamento.
- 'split-photo' — metade imagem do produto, metade conteúdo. Bom pra apresentar produto com texto técnico ao lado.
- 'full-bleed-headline' — só imagem com headline GIGANTE sobreposto, mínimo de texto. Bom pra impacto visual, lançamento, palavra única.
- 'stat-driven' — número/stat em destaque massivo (ex "12 ANOS", "+32%"). Bom pra prova social, garantia, comparativo.
- 'announce-badge' — badge dourado proeminente (ex "NOVO LANÇAMENTO", "BLACK FRIDAY") + headline + subline. Bom pra anúncios sazonais, lançamentos, promo.

Tons:
- 'tecnico' — fala em specs, materiais, garantias.
- 'aspiracional' — fala em sensação, presença, lifestyle.
- 'promocional' — fala em ação, oportunidade, prazo.

Inputs configuráveis no motor:
- defaultFormat, defaultLayout, defaultProductSlug, defaultTone
- accent: cor hex override do dourado padrão (ex '#E8BF4A' brilhante, '#000000' stealth)
- copyTemplates: dict com chave '\${layout}-\${tone}' → { headline, subline, cta, stat?, statLabel?, badge? }
- hashtags: array (a hashtag da linha é adicionada automaticamente)
- lockedInputs: ['format' | 'layout' | 'productSlug' | 'tone'] — trava o input pra esse motor sempre usar a mesma combinação

# Heurísticas de decisão

- Pediu "stories" ou "vertical" → defaultFormat = 'story-9x16'
- Pediu "anúncio", "lançamento", "novidade" → considere layout 'announce-badge'
- Pediu "frase", "manifesto", "filosofia" → considere layout 'centered-quote'
- Pediu "destaque [número/garantia/percentual]" → layout 'stat-driven' (preencha copy.stat e copy.statLabel)
- Pediu "produto + descrição lado a lado" → layout 'split-photo'
- Pediu impacto puro, palavra única → layout 'full-bleed-headline'
- Default genérico → layout 'hero-bottom-cta'

# Linhas NZPPF — contexto

- LUXURY GLOSS: TPU Alifático 190µ, +32% brilho, 12 anos. Slug 'luxury-gloss', accent #D4AF37.
- PRIME GLOSS: TPU 100% Virgem 190µ, 10 anos. Slug 'prime-gloss', accent #4A9EFF.
- FLOW GLOSS: TPU Técnico 175µ, 4 anos. Slug 'flow-gloss', accent #E74C3C.
- CORE GLOSS: Híbrido 80/20 TPU+PVC, 3 anos. Slug 'core-gloss', accent #5A9B7A.
- HEADLIGHT: TPU Pigmentado, 10 anos. Slug 'headlight', accent #D4A840.
- WINDSHIELD: TPU 190µ, 2 anos. Slug 'windshield'.

# Voz da marca

Premium, direta, confiante. Fala com o dono do veículo. Tagline: "PROTEÇÃO FEITA PARA O MUNDO REAL".
Evite: jargão técnico em blocos emocionais, exclamações, emoji no copy (emoji só em metadata.icon).

# Regras de saída

- metadata.id: prefixo "user-" + slug curto (ex "user-stories-blackfriday-luxury", "user-stat-12anos-luxury").
- metadata.source = "user", status = "live", category = "social", estimatedTime = "~5s".
- metadata.icon: emoji que comunique o conceito.
- metadata.title: 4-6 palavras claras.
- config.type = "social-image" SEMPRE.
- copyTemplates: forneça pelo menos a combinação correspondente ao defaultLayout+defaultTone. Use {shortName} para interpolar nome da linha em runtime.
- Para layouts especiais (stat-driven, announce-badge), preencha os campos extras do copy: stat/statLabel ou badge.
- Não invente productSlugs além dos 6 listados.
- Não crie motor type fora de 'social-image' nesta fase.

Faça suposições razoáveis se o pedido for vago. Não recuse, não peça clarificação.`;

const motorSpecTool = {
  name: 'create_motor_spec',
  description:
    'Cria um novo MotorSpec para registrar um gerador de material de marketing na Agência NZ. Sempre use esta função para responder.',
  input_schema: {
    type: 'object' as const,
    properties: {
      metadata: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Slug único, prefixo "user-".' },
          title: { type: 'string', description: '4-6 palavras.' },
          subtitle: { type: 'string', description: '2-4 palavras descrevendo o uso.' },
          description: { type: 'string', description: '1-2 frases.' },
          icon: { type: 'string', description: '1 emoji.' },
          category: { type: 'string', enum: ['social'] },
          status: { type: 'string', enum: ['live'] },
          source: { type: 'string', enum: ['user'] },
          estimatedTime: { type: 'string', enum: ['~5s'] },
          createdAt: { type: 'string', description: 'ISO timestamp.' },
        },
        required: [
          'id',
          'title',
          'subtitle',
          'description',
          'icon',
          'category',
          'status',
          'source',
          'estimatedTime',
          'createdAt',
        ],
      },
      config: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['social-image'] },
          defaultFormat: { type: 'string', enum: ['feed-1x1', 'story-9x16'] },
          defaultLayout: {
            type: 'string',
            enum: [
              'hero-bottom-cta',
              'centered-quote',
              'split-photo',
              'full-bleed-headline',
              'stat-driven',
              'announce-badge',
            ],
          },
          defaultProductSlug: {
            type: 'string',
            enum: [
              'luxury-gloss',
              'prime-gloss',
              'flow-gloss',
              'core-gloss',
              'headlight',
              'windshield',
            ],
          },
          defaultTone: { type: 'string', enum: ['tecnico', 'aspiracional', 'promocional'] },
          accent: { type: 'string', description: 'Hex color override (ex #D4AF37).' },
          copyTemplates: {
            type: 'object',
            description:
              'Dict com chave "${layout}-${tone}". Cada valor tem headline (use \\n para quebra), subline, cta, e opcional stat/statLabel (layout stat-driven) ou badge (layout announce-badge). Use {shortName} para interpolar nome da linha.',
            additionalProperties: {
              type: 'object',
              properties: {
                headline: { type: 'string' },
                subline: { type: 'string' },
                cta: { type: 'string' },
                stat: { type: 'string', description: 'Apenas pra layout stat-driven.' },
                statLabel: { type: 'string', description: 'Apenas pra layout stat-driven.' },
                badge: { type: 'string', description: 'Apenas pra layout announce-badge.' },
              },
              required: ['headline', 'subline', 'cta'],
            },
          },
          hashtags: {
            type: 'array',
            items: { type: 'string', description: 'Hashtag começando com #.' },
          },
          lockedInputs: {
            type: 'array',
            items: { type: 'string', enum: ['format', 'layout', 'productSlug', 'tone'] },
          },
        },
        required: ['type'],
      },
    },
    required: ['metadata', 'config'],
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS / preflight básico (mesma origem em prod, mas ajuda em dev)
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

  const body = (req.body || {}) as { prompt?: unknown };
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt) {
    res.status(400).json({ error: 'Prompt vazio.' });
    return;
  }

  if (prompt.length > 2000) {
    res.status(400).json({ error: 'Prompt muito longo (máx. 2000 caracteres).' });
    return;
  }

  const anthropic = new Anthropic({ apiKey });

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      tools: [motorSpecTool],
      tool_choice: { type: 'tool', name: 'create_motor_spec' },
      messages: [{ role: 'user', content: prompt }],
    });

    const toolUseBlock = response.content.find((b) => b.type === 'tool_use');
    if (!toolUseBlock || toolUseBlock.type !== 'tool_use') {
      res.status(500).json({ error: 'IA não retornou tool_use esperado.' });
      return;
    }

    const motor = toolUseBlock.input;
    const validation = validateMotorSpec(motor);
    if (!validation.ok) {
      res.status(500).json({ error: `Spec inválida: ${validation.reason}` });
      return;
    }

    res.status(200).json({ motor });
  } catch (err) {
    console.error('[oficina/generate] Erro:', err);
    const msg = err instanceof Error ? err.message : 'Erro desconhecido ao chamar IA.';
    res.status(500).json({ error: msg });
  }
}

/* ─── Validação defensiva da spec retornada pela IA ─── */

function validateMotorSpec(spec: unknown): { ok: true } | { ok: false; reason: string } {
  if (!spec || typeof spec !== 'object') return { ok: false, reason: 'spec não é objeto' };
  const s = spec as { metadata?: unknown; config?: unknown };
  if (!s.metadata || !s.config) return { ok: false, reason: 'falta metadata ou config' };

  const m = s.metadata as Record<string, unknown>;
  if (typeof m.id !== 'string' || !m.id.startsWith('user-')) {
    return { ok: false, reason: 'metadata.id deve começar com "user-"' };
  }
  if (m.source !== 'user') return { ok: false, reason: 'metadata.source deve ser "user"' };
  if (m.status !== 'live') return { ok: false, reason: 'metadata.status deve ser "live"' };

  const c = s.config as Record<string, unknown>;
  if (c.type !== 'social-image') {
    return { ok: false, reason: `config.type "${String(c.type)}" não suportado nesta fase` };
  }

  const validFormats = ['feed-1x1', 'story-9x16'];
  if (c.defaultFormat && !validFormats.includes(c.defaultFormat as string)) {
    return { ok: false, reason: `format inválido: ${String(c.defaultFormat)}` };
  }

  const validLayouts = [
    'hero-bottom-cta',
    'centered-quote',
    'split-photo',
    'full-bleed-headline',
    'stat-driven',
    'announce-badge',
  ];
  if (c.defaultLayout && !validLayouts.includes(c.defaultLayout as string)) {
    return { ok: false, reason: `layout inválido: ${String(c.defaultLayout)}` };
  }

  const validProducts = [
    'luxury-gloss',
    'prime-gloss',
    'flow-gloss',
    'core-gloss',
    'headlight',
    'windshield',
  ];
  if (c.defaultProductSlug && !validProducts.includes(c.defaultProductSlug as string)) {
    return { ok: false, reason: `productSlug inválido: ${String(c.defaultProductSlug)}` };
  }

  return { ok: true };
}
