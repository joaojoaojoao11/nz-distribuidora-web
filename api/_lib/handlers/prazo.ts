// POST /api/nz/prazo — cotação de entrega por transportadora.
//
// Endpoint PÚBLICO (a página de produto chama sem login), mas nada parecido
// com os handlers de api/oficina/*, que são POST aberto com CORS '*' e sem
// autenticação. Aqui: mesma origem, CEP validado por regex, rate limit por IP,
// timeout por transportadora e cache de 7 dias.
//
// REGRA CENTRAL — quem vê o quê:
//   qualquer visitante  → PRAZO em dias úteis. Nada além disso.
//   admin autenticado   → prazo + VALOR do frete.
// As APIs de cotação devolvem prazo e preço no mesmo payload; o valor é
// removido AQUI, no servidor, antes de montar a resposta. O papel vem de
// user_profiles via JWT (../papel.ts), nunca de um campo do corpo. Fail-closed:
// sem header, token inválido ou papel diferente de admin, nenhum valor sai.
//
// O peso enviado à transportadora é o MAIOR entre real e cubado, multiplicado
// pela quantidade que o visitante escolheu (carriers/cubagem.ts).

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { getAdapter } from '../carriers/index.js';
import { fatorCubagem, pesoTaxavel } from '../carriers/cubagem.js';
import { CarrierError } from '../carriers/types.js';
import { resolverPapel, type Db } from '../papel.js';

const CEP_RE = /^[0-9]{8}$/;
const CACHE_DIAS = 7;

/** Teto de volumes por cotação. Acima disso é pedido comercial, não vitrine. */
const QTD_MAX = 50;

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
  valor_declarado?: number;
}

interface Carrier {
  slug: string;
  nome: string;
  cep_origem: string;
  dias_manuseio: number;
  modalidade: string | null;
  ordem: number;
  config: unknown;
}

/** Cotação como o servidor a conhece — com valor. O que sai daqui é filtrado. */
interface CotacaoInterna {
  carrier: string;
  nome: string;
  dias: number;
  modalidade?: string;
  valor: number | null;
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
  const qtd = normalizarQtd(body.qtd);

  if (!CEP_RE.test(cep)) {
    res.status(400).json({ error: 'CEP inválido. Informe 8 dígitos.' });
    return;
  }
  if (!lineKey && !profileId) {
    res.status(400).json({ error: 'Informe lineKey ou profileId.' });
    return;
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // Header é opcional: o endpoint continua público. Ter ou não sessão só muda
  // se o valor do frete entra na resposta.
  const papel = await resolverPapel(supabase, req.headers.authorization);
  const podeVerValor = papel === 'admin';

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
      .select('slug, nome, cep_origem, dias_manuseio, modalidade, ordem, config')
      .eq('ativo', true)
      .order('ordem', { ascending: true });

    if (!carriers?.length) {
      res.status(503).json({ error: 'sem-transportadora', message: 'Nenhuma transportadora ativa.' });
      return;
    }

    const resultados = await Promise.allSettled(
      (carriers as unknown as Carrier[]).map((c) => cotar(supabase, c, profile, cep, qtd))
    );

    const cotacoes = resultados
      .filter((r): r is PromiseFulfilledResult<CotacaoInterna> => r.status === 'fulfilled')
      .map((r) => r.value);

    for (const r of resultados) {
      if (r.status === 'rejected') {
        console.warn('[logistica] cotação falhou:', r.reason?.message ?? r.reason);
      }
    }

    if (!cotacoes.length) {
      res.status(502).json({ error: 'consulta-falhou', message: 'Não conseguimos consultar agora.' });
      return;
    }

    // Formatos alternativos da linha, para o seletor. Vêm daqui e não do
    // snapshot de build porque um perfil novo tem que aparecer sem rebuild.
    const formatos = lineKey ? await formatosDaLinha(supabase, lineKey) : [];

    // Objeto montado campo a campo, nunca por spread do interno: é a garantia
    // de que um campo novo no servidor não vaza para o público por descuido.
    const prazos = cotacoes
      .sort((a, b) => a.dias - b.dias)
      .map((c) => {
        const publico: Record<string, unknown> = {
          carrier: c.carrier,
          nome: c.nome,
          dias: c.dias,
        };
        if (c.modalidade) publico.modalidade = c.modalidade;
        if (podeVerValor && c.valor != null) publico.valor = c.valor;
        return publico;
      });

    res.status(200).json({
      prazos,
      formato: { id: profile.id, nome: profile.nome },
      formatos,
      quantidade: qtd,
      // O front usa isto só para explicar de onde vem o valor exibido; o dado
      // sensível já foi filtrado acima.
      papel,
      atualizadoEm: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[logistica] erro:', err);
    res.status(500).json({ error: 'erro-interno' });
  }
}

/** Quantidade de volumes: inteiro entre 1 e QTD_MAX, com 1 como padrão seguro. */
function normalizarQtd(bruto: unknown): number {
  const n = Math.floor(Number(bruto));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, QTD_MAX);
}

function safeJson(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Cascata de resolução do perfil de embalagem:
 *   1. profileId explícito (o usuário escolheu o formato no seletor)
 *   2. override do produto em web_catalog_products.shipping_profile_id
 *   3. perfil padrão da linha
 *   4. qualquer perfil da linha
 *
 * Seleciona tudo de propósito: valor_declarado só existe depois da migration de
 * 2026-09-04, e nomear a coluna faria o PostgREST recusar a consulta inteira na
 * janela entre o deploy e a aplicação do SQL.
 */
async function resolveProfile(
  supabase: Db,
  opts: { profileId: string | null; lineKey: string; productSlug: string | null }
): Promise<ShippingProfile | null> {
  if (opts.profileId) {
    const { data } = await supabase
      .from('shipping_profiles')
      .select('*')
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
        .select('*')
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
    .select('*')
    .eq('id', escolhida.profile_id)
    .eq('ativo', true)
    .maybeSingle();

  return (data as unknown as ShippingProfile) ?? null;
}

/**
 * Formatos de envio de uma linha. Devolve só id e nome — peso, dimensão e valor
 * declarado são informação comercial e não saem do servidor.
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
  cep: string,
  qtd: number
): Promise<CotacaoInterna> {
  // Cache primeiro: prazo e valor por CEP mudam muito pouco. A quantidade entra
  // na chave — a cotação de 1 volume não vale para 10.
  const { data: cached } = await supabase
    .from('shipping_quote_cache')
    .select('prazo_dias, valor_frete, expires_at')
    .eq('carrier_slug', carrier.slug)
    .eq('profile_id', profile.id)
    .eq('cep_destino', cep)
    .eq('quantidade', qtd)
    .maybeSingle();

  const hit = cached as { prazo_dias: number; valor_frete: number | null; expires_at: string } | null;
  if (hit && new Date(hit.expires_at) > new Date()) {
    return {
      carrier: carrier.slug,
      nome: carrier.nome,
      dias: hit.prazo_dias + carrier.dias_manuseio,
      // O cache não guarda a modalidade; a da transportadora é a mesma coisa,
      // e sem isso a resposta mudava de formato entre o primeiro visitante
      // (com modalidade) e todos os seguintes (sem).
      modalidade: carrier.modalidade ?? undefined,
      valor: hit.valor_frete != null ? Number(hit.valor_frete) : null,
    };
  }

  const adapter = getAdapter(carrier.slug);
  if (!adapter) throw new CarrierError(carrier.slug, 'Adapter não encontrado');
  if (!adapter.isConfigured()) throw new CarrierError(carrier.slug, 'Credencial não configurada');

  const peso = pesoTaxavel(profile, qtd, fatorCubagem(carrier.config));
  const valorDeclarado = Number(profile.valor_declarado ?? 100) * qtd;

  const cotacao = await adapter.quoteDeadline({
    cepOrigem: carrier.cep_origem,
    cepDestino: cep,
    pesoKg: peso.pesoKg,
    quantidade: qtd,
    comprimentoCm: Number(profile.comprimento_cm),
    larguraCm: Number(profile.largura_cm),
    alturaCm: Number(profile.altura_cm),
    valorDeclarado,
  });

  const expiresAt = new Date(Date.now() + CACHE_DIAS * 86_400_000).toISOString();
  // `raw` guardado só para diagnóstico no painel; nunca sai por este endpoint.
  // Falha de escrita não derruba a cotação: cache é otimização, não requisito —
  // e essa é justamente a janela em que a migration pode não ter sido aplicada.
  const { error: cacheErr } = await supabase.from('shipping_quote_cache').upsert(
    {
      carrier_slug: carrier.slug,
      profile_id: profile.id,
      cep_destino: cep,
      quantidade: qtd,
      prazo_dias: cotacao.dias,
      valor_frete: cotacao.valorTotal,
      raw: cotacao.raw,
      expires_at: expiresAt,
    },
    { onConflict: 'carrier_slug,profile_id,cep_destino,quantidade' }
  );
  if (cacheErr) console.warn('[logistica] cache não gravado:', cacheErr.message);

  return {
    carrier: carrier.slug,
    nome: carrier.nome,
    dias: cotacao.dias + carrier.dias_manuseio,
    modalidade: cotacao.modalidade,
    valor: cotacao.valorTotal,
  };
}
