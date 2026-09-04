// POST /api/logistica/prazo — prazo de entrega por transportadora.
//
// Endpoint PÚBLICO (a página de produto chama sem login), mas nada parecido
// com os handlers de api/oficina/*, que são POST aberto com CORS '*' e sem
// autenticação. Aqui: mesma origem, CEP validado por regex, rate limit por IP,
// timeout por transportadora e cache de 7 dias.
//
// REGRA CENTRAL: devolve PRAZO, nunca VALOR. As APIs de cotação retornam preço
// junto; o valor é descartado aqui, no servidor, antes de montar a resposta.
// Nenhum campo de preço trafega até o browser nem entra no cache.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getAdapter } from '../_lib/carriers/index.js';
import { CarrierError } from '../_lib/carriers/types.js';

const CEP_RE = /^[0-9]{8}$/;
const CACHE_DIAS = 7;

/** Rate limit em memória. Some a cada cold start — é uma barreira, não uma trava. */
const RATE_LIMIT = new Map<string, { count: number; resetAt: number }>();
const RATE_JANELA_MS = 60_000;
const RATE_MAX = 20;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = RATE_LIMIT.get(ip);
  if (!entry || now > entry.resetAt) {
    RATE_LIMIT.set(ip, { count: 1, resetAt: now + RATE_JANELA_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_MAX;
}

interface ShippingProfile {
  id: string;
  nome: string;
  peso_kg: number;
  comprimento_cm: number;
  largura_cm: number;
  altura_cm: number;
}

interface Carrier {
  slug: string;
  nome: string;
  cep_origem: string;
  dias_manuseio: number;
  ordem: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    // Diagnóstico sem vazar o segredo — mesmo padrão do cron/ai-writer.
    res.status(500).json({
      error: 'ENV ausente',
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceRoleKey: !!serviceKey,
    });
    return;
  }

  const ip =
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() || 'desconhecido';
  if (rateLimited(ip)) {
    res.status(429).json({ error: 'Muitas consultas. Tente em um minuto.' });
    return;
  }

  const body = (typeof req.body === 'string' ? safeJson(req.body) : req.body) || {};
  const cep = String(body.cep ?? '').replace(/\D/g, '');
  const lineKey = typeof body.lineKey === 'string' ? body.lineKey : '';
  const profileId = typeof body.profileId === 'string' ? body.profileId : null;
  const productSlug = typeof body.slug === 'string' ? body.slug : null;

  if (!CEP_RE.test(cep)) {
    res.status(400).json({ error: 'CEP inválido. Informe 8 dígitos.' });
    return;
  }
  if (!lineKey && !profileId) {
    res.status(400).json({ error: 'Informe lineKey ou profileId.' });
    return;
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const profile = await resolveProfile(supabase, { profileId, lineKey, productSlug });
    if (!profile) {
      // Sem perfil cadastrado a página simplesmente não mostra o bloco — é
      // melhor não mostrar prazo do que mostrar um prazo inventado.
      res.status(404).json({ error: 'sem-perfil', message: 'Produto sem perfil de embalagem.' });
      return;
    }

    const { data: carriers } = await supabase
      .from('shipping_carriers')
      .select('slug, nome, cep_origem, dias_manuseio, ordem')
      .eq('ativo', true)
      .order('ordem', { ascending: true });

    if (!carriers?.length) {
      res.status(503).json({ error: 'sem-transportadora', message: 'Nenhuma transportadora ativa.' });
      return;
    }

    const resultados = await Promise.allSettled(
      (carriers as Carrier[]).map((c) => cotar(supabase, c, profile, cep))
    );

    const prazos = resultados
      .filter(
        (r): r is PromiseFulfilledResult<{ carrier: string; nome: string; dias: number; modalidade?: string }> =>
          r.status === 'fulfilled'
      )
      .map((r) => r.value);

    for (const r of resultados) {
      if (r.status === 'rejected') {
        console.warn('[logistica] cotação falhou:', r.reason?.message ?? r.reason);
      }
    }

    if (!prazos.length) {
      res.status(502).json({ error: 'consulta-falhou', message: 'Não conseguimos consultar agora.' });
      return;
    }

    // Formatos alternativos da linha, para o seletor. Vêm daqui e não do
    // snapshot de build porque um perfil novo tem que aparecer sem rebuild.
    const formatos = lineKey ? await formatosDaLinha(supabase, lineKey) : [];

    // Resposta deliberadamente enxuta: prazo, nome e modalidade. Nenhum campo
    // de valor, nenhum `raw`, nenhuma dimensão ou peso.
    res.status(200).json({
      prazos: prazos.sort((a, b) => a.dias - b.dias),
      formato: { id: profile.id, nome: profile.nome },
      formatos,
      atualizadoEm: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[logistica] erro:', err);
    res.status(500).json({ error: 'erro-interno' });
  }
}

function safeJson(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

// O projeto não tem tipos gerados do banco, então o client vem sem schema.
// Generics soltos aqui evitam que a inferência do supabase-js colapse os
// parâmetros em `never` ao passar o client entre funções.
/* eslint-disable @typescript-eslint/no-explicit-any */
type Db = SupabaseClient<any, any, any>;
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Cascata de resolução do perfil de embalagem:
 *   1. profileId explícito (o usuário escolheu o formato no seletor)
 *   2. override do produto em web_catalog_products.shipping_profile_id
 *   3. perfil padrão da linha
 *   4. qualquer perfil da linha
 */
async function resolveProfile(
  supabase: Db,
  opts: { profileId: string | null; lineKey: string; productSlug: string | null }
): Promise<ShippingProfile | null> {
  const columns = 'id, nome, peso_kg, comprimento_cm, largura_cm, altura_cm';

  if (opts.profileId) {
    const { data } = await supabase
      .from('shipping_profiles')
      .select(columns)
      .eq('id', opts.profileId)
      .eq('ativo', true)
      .maybeSingle();
    if (data) return data as unknown as ShippingProfile;
  }

  if (opts.productSlug) {
    const { data: produto } = await supabase
      .from('web_catalog_products')
      .select('shipping_profile_id')
      .eq('slug', opts.productSlug)
      .maybeSingle();
    const override = (produto as { shipping_profile_id?: string } | null)?.shipping_profile_id;
    if (override) {
      const { data } = await supabase
        .from('shipping_profiles')
        .select(columns)
        .eq('id', override)
        .eq('ativo', true)
        .maybeSingle();
      if (data) return data as unknown as ShippingProfile;
    }
  }

  if (!opts.lineKey) return null;

  const { data: linhas } = await supabase
    .from('shipping_profile_lines')
    .select('profile_id, is_default')
    .eq('line_key', opts.lineKey);

  if (!linhas?.length) return null;

  const escolhida =
    (linhas as { profile_id: string; is_default: boolean }[]).find((l) => l.is_default) ??
    (linhas as { profile_id: string }[])[0];

  const { data } = await supabase
    .from('shipping_profiles')
    .select(columns)
    .eq('id', escolhida.profile_id)
    .eq('ativo', true)
    .maybeSingle();

  return (data as unknown as ShippingProfile) ?? null;
}

/**
 * Formatos de envio de uma linha. Devolve só id e nome — peso e dimensão são
 * informação comercial e não saem do servidor.
 */
async function formatosDaLinha(
  supabase: Db,
  lineKey: string
): Promise<{ id: string; nome: string }[]> {
  const { data } = await supabase
    .from('shipping_profile_lines')
    .select('profile_id, is_default, shipping_profiles(id, nome, ativo)')
    .eq('line_key', lineKey);

  type Row = {
    is_default: boolean;
    shipping_profiles: { id: string; nome: string; ativo: boolean } | null;
  };

  return ((data ?? []) as unknown as Row[])
    .filter((r) => r.shipping_profiles?.ativo)
    .sort((a, b) => Number(b.is_default) - Number(a.is_default))
    .map((r) => ({ id: r.shipping_profiles!.id, nome: r.shipping_profiles!.nome }));
}

async function cotar(
  supabase: Db,
  carrier: Carrier,
  profile: ShippingProfile,
  cep: string
): Promise<{ carrier: string; nome: string; dias: number; modalidade?: string }> {
  // Cache primeiro: prazo por CEP muda muito pouco.
  const { data: cached } = await supabase
    .from('shipping_quote_cache')
    .select('prazo_dias, expires_at')
    .eq('carrier_slug', carrier.slug)
    .eq('profile_id', profile.id)
    .eq('cep_destino', cep)
    .maybeSingle();

  const hit = cached as { prazo_dias: number; expires_at: string } | null;
  if (hit && new Date(hit.expires_at) > new Date()) {
    return {
      carrier: carrier.slug,
      nome: carrier.nome,
      dias: hit.prazo_dias + carrier.dias_manuseio,
    };
  }

  const adapter = getAdapter(carrier.slug);
  if (!adapter) throw new CarrierError(carrier.slug, 'Adapter não encontrado');
  if (!adapter.isConfigured()) throw new CarrierError(carrier.slug, 'Credencial não configurada');

  const cotacao = await adapter.quoteDeadline({
    cepOrigem: carrier.cep_origem,
    cepDestino: cep,
    pesoKg: Number(profile.peso_kg),
    comprimentoCm: Number(profile.comprimento_cm),
    larguraCm: Number(profile.largura_cm),
    alturaCm: Number(profile.altura_cm),
  });

  const expiresAt = new Date(Date.now() + CACHE_DIAS * 86_400_000).toISOString();
  // `raw` guardado só para diagnóstico no painel; nunca sai por este endpoint.
  await supabase.from('shipping_quote_cache').upsert(
    {
      carrier_slug: carrier.slug,
      profile_id: profile.id,
      cep_destino: cep,
      prazo_dias: cotacao.dias,
      raw: cotacao.raw,
      expires_at: expiresAt,
    },
    { onConflict: 'carrier_slug,profile_id,cep_destino' }
  );

  return {
    carrier: carrier.slug,
    nome: carrier.nome,
    dias: cotacao.dias + carrier.dias_manuseio,
    modalidade: cotacao.modalidade,
  };
}
