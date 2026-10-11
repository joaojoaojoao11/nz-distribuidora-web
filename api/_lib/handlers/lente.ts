// POST /api/nz/lente — a parte "entendimento" da busca por imagem.
//
// A busca por COR acontece inteira no navegador (src/lib/shop/color/paleta.ts)
// e não passa por aqui. Este endpoint responde o que pixel nenhum diz: o
// acabamento (fosco × brilhante × metálico), o padrão (carbono, madeira) e a
// família de cor lidos por um modelo de visão, no vocabulário da loja
// (../lenteTaxonomia.ts). O cliente aplica isso como filtro junto com o hex.
//
// Como isso não vira porta aberta nem conta estourada:
//
//   · Flag `loja_config.lente_ia_ativa`, que começa DESLIGADA. Desligada, 204 —
//     e a Lente segue só com a cor, sem a pessoa perceber.
//   · Vinte consultas por hora por IP, e o IP nunca é gravado em claro: só o
//     sha256 com sal (mesmo esquema do handler de ocorrências).
//   · A imagem chega reduzida (≤ 768 px, JPEG) e NUNCA é gravada: vai ao
//     modelo, volta a leitura, e acabou. Não há storage nem log do conteúdo.
//   · Structured output com JSON Schema de enums fechados: o modelo não tem
//     como inventar um id que a loja não conhece — e o servidor valida de novo.
//
// Modelo: ANTHROPIC_MODEL_LENTE, padrão claude-opus-5-5. O teste
// `npm run lente:ia:test` mede precisão, latência e custo por modelo.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import Anthropic from '@anthropic-ai/sdk';
import type { Db } from '../papel.js';
import {
  ACABAMENTOS,
  CONFIANCAS,
  FAMILIAS,
  PADROES,
  SCHEMA_LEITURA,
  SISTEMA,
  SUBFAMILIAS,
  TONS,
  type LeituraBruta,
} from '../lenteTaxonomia.js';

const MODELO_PADRAO = 'claude-opus-5-5';
/** Base64 de ~1,25 MB. O navegador manda ~100–200 KB; isto é a última linha. */
const MAX_BASE64 = 1_700_000;
const MAX_POR_HORA = 20;
const TIPOS = new Set(['image/jpeg', 'image/png', 'image/webp']);
type Mime = 'image/jpeg' | 'image/png' | 'image/webp';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  const siteUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const siteKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!siteUrl || !siteKey) {
    res.status(500).json({ error: 'ENV ausente', hasSiteUrl: !!siteUrl, hasSiteKey: !!siteKey });
    return;
  }
  const site: Db = createClient(siteUrl, siteKey);

  // Flag antes de qualquer trabalho: desligada, nem o corpo é lido.
  const { data: cfg } = await site.from('loja_config').select('lente_ia_ativa').eq('id', 1).maybeSingle();
  if (!(cfg as { lente_ia_ativa?: boolean } | null)?.lente_ia_ativa) {
    res.status(204).end();
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: 'lente-sem-chave' });
    return;
  }

  const body = (typeof req.body === 'string' ? safeJson(req.body) : req.body) || {};
  const mime = typeof body.mime === 'string' && TIPOS.has(body.mime) ? (body.mime as Mime) : null;
  const imagem = typeof body.imagem === 'string' ? body.imagem.replace(/^data:[^,]+,/, '').trim() : '';
  if (!mime) {
    res.status(400).json({ error: 'imagem-tipo-invalido', aceitos: [...TIPOS] });
    return;
  }
  if (!imagem) {
    res.status(400).json({ error: 'imagem-vazia' });
    return;
  }
  if (imagem.length > MAX_BASE64) {
    res.status(400).json({ error: 'imagem-grande-demais' });
    return;
  }

  const ipHash = hashIp(req);
  if (await excedeuLimite(site, ipHash)) {
    res.status(429).json({ error: 'muitas-consultas', porHora: MAX_POR_HORA });
    return;
  }
  // Conta antes de chamar: uma chamada que falha também custou.
  await site.from('lente_uso').insert({ ip_hash: ipHash });

  const modelo = process.env.ANTHROPIC_MODEL_LENTE || MODELO_PADRAO;
  const anthropic = new Anthropic({ apiKey, timeout: 25_000, maxRetries: 1 });

  try {
    const resposta = await anthropic.messages.create({
      model: modelo,
      max_tokens: 600,
      system: [{ type: 'text', text: SISTEMA, cache_control: { type: 'ephemeral' } }],
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mime, data: imagem } },
            { type: 'text', text: 'Classifique este material.' },
          ],
        },
      ],
      output_config: {
        // Classificação num vocabulário fechado: não é tarefa de raciocínio longo.
        effort: 'low',
        format: { type: 'json_schema', schema: SCHEMA_LEITURA as unknown as Record<string, unknown> },
      },
    });

    if (resposta.stop_reason === 'refusal') {
      res.status(502).json({ error: 'sem-leitura' });
      return;
    }
    const bloco = resposta.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
    const leitura = sanear(safeJson(bloco?.text ?? ''));
    if (!leitura) {
      res.status(502).json({ error: 'sem-leitura' });
      return;
    }

    // Só números no log: nunca a imagem, nunca a leitura.
    console.info(
      `[lente] ${modelo} in=${resposta.usage.input_tokens} out=${resposta.usage.output_tokens} cache=${resposta.usage.cache_read_input_tokens ?? 0}`
    );
    res.status(200).json({
      ...leitura,
      modelo,
      uso: { entrada: resposta.usage.input_tokens, saida: resposta.usage.output_tokens },
    });
  } catch (e) {
    if (e instanceof Anthropic.APIError) {
      console.error('[lente] API', e.status, e.message);
      res.status(502).json({ error: 'lente-indisponivel', status: e.status ?? null });
      return;
    }
    console.error('[lente]', e instanceof Error ? e.message : e);
    res.status(502).json({ error: 'lente-indisponivel' });
  }
}

// ------------------------------------------------------------------ util

interface Leitura {
  hexDominante: string | null;
  familias: string[];
  subfamilias: string[];
  tom: string | null;
  acabamentos: string[];
  familiaPadrao: string | null;
  transparente: boolean;
  descricao: string;
  confianca: string;
}

function dentro<T extends readonly string[]>(lista: T, v: unknown): v is T[number] {
  return typeof v === 'string' && (lista as readonly string[]).includes(v);
}

function somenteDe<T extends readonly string[]>(lista: T, v: unknown): string[] {
  return Array.isArray(v) ? [...new Set(v.filter((x) => dentro(lista, x)))] : [];
}

/**
 * O schema já restringe; isto é o cinto. Devolve null se nem a forma básica
 * veio — aí o cliente segue só com a cor.
 */
function sanear(bruto: Partial<LeituraBruta> | Record<string, unknown>): Leitura | null {
  if (!bruto || typeof bruto !== 'object') return null;
  const b = bruto as Partial<LeituraBruta>;
  const hex = typeof b.hex_dominante === 'string' ? b.hex_dominante.trim().toLowerCase() : '';
  const familias = somenteDe(FAMILIAS, b.familias).slice(0, 2);
  const leitura: Leitura = {
    hexDominante: /^#[0-9a-f]{6}$/.test(hex) ? hex : null,
    familias,
    subfamilias: somenteDe(SUBFAMILIAS, b.subfamilias).slice(0, 2),
    tom: dentro(TONS, b.tom) ? b.tom : null,
    acabamentos: somenteDe(ACABAMENTOS, b.acabamentos).slice(0, 3),
    familiaPadrao: dentro(PADROES, b.familia_padrao) ? b.familia_padrao : null,
    transparente: b.transparente === true,
    descricao: typeof b.descricao_curta === 'string' ? b.descricao_curta.trim().slice(0, 140) : '',
    confianca: dentro(CONFIANCAS, b.confianca) ? b.confianca : 'media',
  };
  if (!leitura.hexDominante && !leitura.familias.length && !leitura.acabamentos.length) return null;
  return leitura;
}

/** sha256(ip + salt): conta, não identifica. Mesmo sal do handler de ocorrências. */
function hashIp(req: VercelRequest): string {
  const bruto = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(bruto) ? bruto[0] : bruto || '').split(',')[0].trim() || 'desconhecido';
  const sal = process.env.OCORRENCIAS_SALT || process.env.CRON_SECRET || 'nz';
  return createHash('sha256').update(`${ip}|${sal}`).digest('hex');
}

async function excedeuLimite(site: Db, ipHash: string): Promise<boolean> {
  const desde = new Date(Date.now() - 3600_000).toISOString();
  const { count, error } = await site
    .from('lente_uso')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('criado_em', desde);
  // Aqui a falha ao contar BLOQUEIA: é a conta da API que está do outro lado.
  if (error) return true;
  return (count ?? 0) >= MAX_POR_HORA;
}

function safeJson(raw: string): Record<string, unknown> {
  try {
    const v = JSON.parse(raw);
    return v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
