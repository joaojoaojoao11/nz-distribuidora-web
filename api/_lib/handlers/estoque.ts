// POST /api/nz/estoque — disponibilidade de um produto, por papel do usuário.
//
// ESTE ENDPOINT EXISTE POR UMA RESTRIÇÃO DURA: o catálogo da LOJA é um arquivo
// .ts no bundle público, que qualquer visitante baixa e lê. Nada restrito pode
// entrar nele. Dado por papel só pode vir de um request autenticado, com o
// papel lido NO SERVIDOR — nunca do que o cliente diz que é.
//
// Os três níveis, definidos com o cliente:
//   anônimo / client   → só disponibilidade qualitativa. Nenhum número.
//   reseller aprovado  → saldo em metros e rolos, com quebra fechado × aberto.
//   admin              → tudo acima + LPNs, localização física e filial.
//
// NENHUM papel vê preço, custo ou margem. Essas colunas nem são transferidas do
// ERP: as views em migrations/erp/ já as excluem na origem.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Db = SupabaseClient<any, any, any>;
/* eslint-enable @typescript-eslint/no-explicit-any */

type Papel = 'anonimo' | 'client' | 'reseller' | 'admin';

type Disponibilidade = 'em-estoque' | 'ultimas-unidades' | 'sob-encomenda';

interface Espelho {
  erp_sku: string;
  nome: string | null;
  ativo: boolean;
  saldo_ml: number;
  rolos_fechados: number;
  rolos_abertos: number;
  largura_m: number | null;
  metragem_padrao: number | null;
  estoque_minimo: number | null;
  sincronizado_em: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

  const body = (typeof req.body === 'string' ? safeJson(req.body) : req.body) || {};
  const slug = typeof body.slug === 'string' ? body.slug : '';
  if (!slug) {
    res.status(400).json({ error: 'Informe slug.' });
    return;
  }

  const site = createClient(siteUrl, siteKey);
  const papel = await resolverPapel(site, req.headers.authorization);

  // Mapa de SKU: sem correspondência conferida, não há estoque a mostrar.
  const { data: mapa } = await site
    .from('erp_sku_map')
    .select('erp_sku')
    .eq('shop_slug', slug)
    .maybeSingle();

  const erpSku = (mapa as { erp_sku?: string } | null)?.erp_sku;
  if (!erpSku) {
    res.status(200).json({ mapeado: false, papel });
    return;
  }

  const { data: espelhoData } = await site
    .from('erp_stock_mirror')
    .select(
      'erp_sku, nome, ativo, saldo_ml, rolos_fechados, rolos_abertos, largura_m, metragem_padrao, estoque_minimo, sincronizado_em'
    )
    .eq('erp_sku', erpSku)
    .maybeSingle();

  const espelho = espelhoData as unknown as Espelho | null;
  if (!espelho) {
    res.status(200).json({ mapeado: true, semDados: true, papel });
    return;
  }

  const { data: cfg } = await site
    .from('erp_config')
    .select('limite_ultimas_unidades_ml')
    .eq('id', 1)
    .maybeSingle();
  const limiteGlobal = Number(
    (cfg as { limite_ultimas_unidades_ml?: number } | null)?.limite_ultimas_unidades_ml ?? 30
  );

  const disponibilidade = classificar(espelho, limiteGlobal);

  // --- nível 1: todo mundo. Só o badge qualitativo.
  const resposta: Record<string, unknown> = {
    mapeado: true,
    papel,
    disponibilidade,
    atualizadoEm: espelho.sincronizado_em,
  };

  // --- nível 2: lojista aprovado e admin.
  if (papel === 'reseller' || papel === 'admin') {
    resposta.saldo = {
      metrosLineares: Number(espelho.saldo_ml),
      rolosFechados: espelho.rolos_fechados,
      rolosAbertos: espelho.rolos_abertos,
      larguraM: espelho.largura_m,
      metragemPadrao: espelho.metragem_padrao,
    };
  }

  // --- nível 3: admin. Detalhe por rolo, lido AO VIVO no ERP.
  if (papel === 'admin') {
    resposta.lpns = await lerLpns(erpSku);
    resposta.estoqueMinimo = espelho.estoque_minimo;
  }

  res.status(200).json(resposta);
}

function safeJson(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Lê o papel NO BANCO a partir do JWT. Nunca confia num campo do corpo nem numa
 * claim do token: um cliente pode forjar as duas coisas.
 */
async function resolverPapel(site: Db, authHeader: string | undefined): Promise<Papel> {
  if (!authHeader?.startsWith('Bearer ')) return 'anonimo';

  const {
    data: { user },
  } = await site.auth.getUser(authHeader.slice(7));
  if (!user) return 'anonimo';

  const { data } = await site
    .from('user_profiles')
    .select('role, is_approved')
    .eq('id', user.id)
    .maybeSingle();

  const profile = data as { role?: string; is_approved?: boolean } | null;
  if (!profile) return 'anonimo';
  if (profile.role === 'admin') return 'admin';
  // Lojista não aprovado é tratado como cliente final: a aprovação é o que
  // libera o dado comercial.
  if (profile.role === 'reseller' && profile.is_approved) return 'reseller';
  return 'client';
}

function classificar(espelho: Espelho, limiteGlobal: number): Disponibilidade {
  if (!espelho.ativo || espelho.saldo_ml <= 0) return 'sob-encomenda';
  // O ERP mantém estoque_minimo por SKU — quando existe, é um limiar melhor
  // que o global, porque já reflete o giro daquele item.
  const limite = espelho.estoque_minimo && espelho.estoque_minimo > 0
    ? Number(espelho.estoque_minimo)
    : limiteGlobal;
  return espelho.saldo_ml <= limite ? 'ultimas-unidades' : 'em-estoque';
}

/** Detalhe por LPN direto do ERP. Só chamado para admin. */
async function lerLpns(erpSku: string) {
  const erpUrl = process.env.ERP_SUPABASE_URL;
  const erpKey = process.env.ERP_SUPABASE_SERVICE_ROLE_KEY || process.env.ERP_SUPABASE_ANON_KEY;
  if (!erpUrl || !erpKey) return { erro: 'ERP não configurado' };

  try {
    const erp = createClient(erpUrl, erpKey);
    const { data, error } = await erp
      .from('estoque_lpn_site')
      .select('lpn, quant_ml, status_rolo, lote, coluna, prateleira, caixa, empresa_id, ultima_atualizacao')
      .eq('sku', erpSku)
      .order('quant_ml', { ascending: false })
      .limit(200);

    if (error) return { erro: error.message };
    return data ?? [];
  } catch (err) {
    return { erro: err instanceof Error ? err.message : String(err) };
  }
}
