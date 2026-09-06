// POST/GET /api/nz/sync — espelha catálogo, PREÇO DE VENDA e estoque do NZERP.
//
// Dois clients Supabase, um por projeto, ambos com chave SÓ NO SERVIDOR:
//   leitura : NZERP (ipehorttsrvjynnhyzhu) — views catalogo_site, precos_site,
//             estoque_site (2NZERPUPDATE30/supabase/migrations/20260906_site_views.sql)
//   escrita : site  (uibjmvkvbthzypgozpcs) — erp_produtos e produtos
//
// O que ele faz, nesta ordem:
//   1. lê as três views inteiras (paginadas: PostgREST ignora limit > 1000);
//   2. upsert em erp_produtos — TODOS os SKUs, ativos e inativos;
//   3. marca `removido_no_erp` quem sumiu da view (apagado no ERP);
//   4. cria em `produtos` uma linha 'erp-auto' para todo SKU que ainda não tem
//      produto no site — é o "todo produto do NZERP tem cadastro no site";
//   5. espelha status dos pedidos (Fase 7; hoje é no-op sem pedidos enviados).
//
// Upsert completo e idempotente de ~1.200 linhas: não depende de updated_at,
// não tem estado. Rodar duas vezes seguidas dá o mesmo resultado.
//
// `?dry=1` faz tudo em memória e devolve o que MUDARIA, sem escrever — é o
// teste antes de aplicar, e registra no log com gatilho 'dry-run'.
//
// CADÊNCIA: o cron da Vercel roda uma vez por dia (limite do plano Hobby). O
// frescor durante o dia vem do ERP: pg_cron a cada 5 min + trigger por
// statement em master_catalog/pricing_engineering/inventory, ambos batendo em
// /api/nz/webhook, que delega para cá.
//
// Por que esta abordagem e não outra (apurado na doc oficial do Supabase):
//   · postgres_fdw  — foreign table não suporta RLS, a senha fica em texto no
//     catálogo, e a conectividade outbound do Supabase só funciona por IPv6.
//   · replicação lógica — exige PG 17.4+, conexão direta e instância XL.
//   · leitura direta do ERP no browser — barrada: o NZERP tem policies
//     `FOR ALL TO public`, então a chave dele abre custo, margem, financeiro.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { produtoAutoDeSku } from '../../../src/lib/shop/erp/mapa.js';
import { manutencaoCheckout } from '../asaas/manutencao.js';
import { sincronizarEquipe } from './equipe.js';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Db = SupabaseClient<any, any, any>;
/* eslint-enable @typescript-eslint/no-explicit-any */

interface CatalogoRow {
  sku: string;
  nome: string | null;
  categoria: string | null;
  marca: string | null;
  ativo: boolean;
  largura_m: number | null;
  metragem_padrao: number | null;
  unidade: string | null;
  estoque_minimo: number | null;
  id_tiny: string | number | null;
  updated_at: string | null;
}

interface PrecoRow {
  sku: string;
  preco_rolo: number | null;
  preco_rolo_min: number | null;
  preco_metro: number | null;
  preco_metro_min: number | null;
  promocao: boolean | null;
  updated_at: string | null;
}

interface EstoqueRow {
  sku: string;
  saldo_ml: number | null;
  rolos_fechados: number | null;
  rolos_abertos: number | null;
  ultima_movimentacao: string | null;
}

const PAGE = 1000;
const LOTE = 500;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const siteUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const siteKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const erpUrl = process.env.ERP_SUPABASE_URL;
  const erpKey = process.env.ERP_SUPABASE_SERVICE_ROLE_KEY || process.env.ERP_SUPABASE_ANON_KEY;

  if (!siteUrl || !siteKey || !erpUrl || !erpKey) {
    // Diagnóstico booleano — nunca ecoa o valor do segredo.
    res.status(500).json({
      error: 'ENV ausente',
      hasSiteUrl: !!siteUrl,
      hasSiteKey: !!siteKey,
      hasErpUrl: !!erpUrl,
      hasErpKey: !!erpKey,
    });
    return;
  }

  const site = createClient(siteUrl, siteKey);

  // --- auth: segredo do cron OU JWT de admin. Mesmo padrão do cron/ai-writer.
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  let authorized = false;
  let gatilho: 'cron' | 'manual' | 'webhook' | 'dry-run' = 'manual';

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    authorized = true;
    gatilho = 'cron';
  } else if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const {
      data: { user },
    } = await site.auth.getUser(token);
    if (user) {
      const { data: profile } = await site
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      const role = (profile as { role?: string } | null)?.role;
      if (role === 'admin' || role === 'superadmin') authorized = true;
    }
  }

  if (!authorized) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const body = (typeof req.body === 'object' && req.body ? req.body : {}) as { gatilho?: string };
  if (body.gatilho === 'webhook') gatilho = 'webhook';

  const dry = req.query.dry === '1' || req.query.dry === 'true';
  if (dry) gatilho = 'dry-run';

  const { data: config } = await site
    .from('loja_config')
    .select('sync_ativo')
    .eq('id', 1)
    .maybeSingle();
  if (!dry && (config as { sync_ativo?: boolean } | null)?.sync_ativo === false) {
    res.status(200).json({ pulado: true, motivo: 'sync desativado em loja_config' });
    return;
  }

  const { data: logRow } = await site
    .from('erp_sync_log')
    .insert([{ gatilho }])
    .select('id')
    .single();
  const logId = (logRow as { id?: string } | null)?.id;

  const erp = createClient(erpUrl, erpKey);

  try {
    const [catalogo, precos, estoque] = await Promise.all([
      lerTudo<CatalogoRow>(erp, 'catalogo_site', 'sku, nome, categoria, marca, ativo, largura_m, metragem_padrao, unidade, estoque_minimo, id_tiny, updated_at'),
      lerTudo<PrecoRow>(erp, 'precos_site', 'sku, preco_rolo, preco_rolo_min, preco_metro, preco_metro_min, promocao, updated_at'),
      lerTudo<EstoqueRow>(erp, 'estoque_site', 'sku, saldo_ml, rolos_fechados, rolos_abertos, ultima_movimentacao'),
    ]);

    const resultado = await espelhar(site, { catalogo, precos, estoque }, dry);
    const pedidos = await espelharPedidos(site, erp, dry);
    // Checkout: eventos do Asaas com erro, Pix expirado, ERP atrasado. Só no
    // cron e no botão — o webhook do ERP bate aqui a cada 5 min e não precisa.
    const checkout = !dry && gatilho !== 'webhook' ? await manutencaoCheckout(site).catch((e) => ({ erro: e instanceof Error ? e.message : String(e) })) : null;
    // Quem entrou/saiu do NZERP ganha/perde acesso administrativo ao site.
    const equipe = !dry && gatilho !== 'webhook' ? await sincronizarEquipe(site, null).catch((e) => ({ erro: e instanceof Error ? e.message : String(e) })) : null;

    if (logId) {
      await site
        .from('erp_sync_log')
        .update({
          concluido_em: new Date().toISOString(),
          lidos: catalogo.length,
          atualizados: resultado.atualizados,
          desativados: resultado.removidos,
          produtos_criados: resultado.produtosCriados,
          pedidos_atualizados: pedidos.atualizados,
        })
        .eq('id', logId);
    }

    res.status(200).json({ ok: true, dry, gatilho, lidos: catalogo.length, precos: precos.length, comEstoque: estoque.length, ...resultado, pedidos, checkout, equipe });
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : String(err);
    console.error('[erp-sync] falhou:', mensagem);
    if (logId) {
      await site
        .from('erp_sync_log')
        .update({ concluido_em: new Date().toISOString(), erro: mensagem })
        .eq('id', logId);
    }
    res.status(502).json({ error: 'sync-falhou', message: mensagem });
  }
}

/** PostgREST ignora .limit() acima de 1000: paginar é obrigatório. */
async function lerTudo<T>(db: Db, view: string, colunas: string, ordem = 'sku'): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db
      .from(view)
      .select(colunas)
      .order(ordem, { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`leitura de ${view} no ERP: ${error.message}`);
    const page = (data ?? []) as unknown as T[];
    out.push(...page);
    if (page.length < PAGE) break;
  }
  return out;
}

interface Resultado {
  atualizados: number;
  removidos: number;
  produtosCriados: number;
  /** Só no dry-run: amostra do que seria criado. */
  amostraCriados?: { slug: string; erp_sku: string; nome: string; linha_key: string; vertical: string }[];
  inativos: number;
  ativos: number;
}

async function espelhar(
  site: Db,
  dados: { catalogo: CatalogoRow[]; precos: PrecoRow[]; estoque: EstoqueRow[] },
  dry: boolean
): Promise<Resultado> {
  const agora = new Date().toISOString();
  const precoPorSku = new Map(dados.precos.map((p) => [p.sku, p]));
  const estoquePorSku = new Map(dados.estoque.map((e) => [e.sku, e]));

  const linhas = dados.catalogo.map((c) => {
    const p = precoPorSku.get(c.sku);
    const e = estoquePorSku.get(c.sku);
    return {
      sku: c.sku,
      nome: c.nome,
      marca: c.marca,
      categoria: c.categoria,
      ativo: Boolean(c.ativo),
      removido_no_erp: false,
      largura_m: c.largura_m,
      metragem_padrao: c.metragem_padrao,
      unidade: c.unidade ?? 'ML',
      estoque_minimo: c.estoque_minimo,
      id_tiny: c.id_tiny == null ? null : String(c.id_tiny),
      preco_rolo: p?.preco_rolo ?? null,
      preco_metro: p?.preco_metro ?? null,
      preco_rolo_min: p?.preco_rolo_min ?? null,
      preco_metro_min: p?.preco_metro_min ?? null,
      promocao: Boolean(p?.promocao),
      preco_atualizado_em: p?.updated_at ?? null,
      saldo_ml: Number(e?.saldo_ml ?? 0),
      rolos_fechados: Number(e?.rolos_fechados ?? 0),
      rolos_abertos: Number(e?.rolos_abertos ?? 0),
      estoque_atualizado_em: e?.ultima_movimentacao ?? null,
      erp_updated_at: c.updated_at,
      sincronizado_em: agora,
    };
  });

  const ativos = linhas.filter((l) => l.ativo).length;

  // Quem já tem produto no site? (qualquer tipo, qualquer origem)
  const skusComProduto = new Set<string>();
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await site
      .from('produtos')
      .select('erp_sku')
      .not('erp_sku', 'is', null)
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`leitura de produtos: ${error.message}`);
    for (const r of (data ?? []) as { erp_sku: string }[]) skusComProduto.add(r.erp_sku);
    if ((data ?? []).length < PAGE) break;
  }

  const paraCriar = linhas
    .filter((l) => !skusComProduto.has(l.sku))
    .map((l) => produtoAutoDeSku({ sku: l.sku, nome: l.nome, marca: l.marca, categoria: l.categoria }));

  if (dry) {
    return {
      atualizados: linhas.length,
      removidos: 0,
      produtosCriados: paraCriar.length,
      amostraCriados: paraCriar.slice(0, 25).map((p) => ({
        slug: p.slug,
        erp_sku: p.erp_sku,
        nome: p.nome,
        linha_key: p.linha_key,
        vertical: p.vertical,
      })),
      inativos: linhas.length - ativos,
      ativos,
    };
  }

  for (let i = 0; i < linhas.length; i += LOTE) {
    const { error } = await site.from('erp_produtos').upsert(linhas.slice(i, i + LOTE), { onConflict: 'sku' });
    if (error) throw new Error(`escrita em erp_produtos: ${error.message}`);
  }

  // Reconciliação: SKU apagado no ERP não some sozinho do espelho. Marcar
  // como removido (e inativo) faz o produto sumir da loja pela view.
  const { data: removidosData, error: remErr } = await site
    .from('erp_produtos')
    .update({ ativo: false, removido_no_erp: true, saldo_ml: 0, rolos_fechados: 0, rolos_abertos: 0, sincronizado_em: agora })
    .lt('sincronizado_em', agora)
    .eq('removido_no_erp', false)
    .select('sku');
  if (remErr) throw new Error(`reconciliação: ${remErr.message}`);

  // Cadastro automático. Slug termina no SKU, então não colide com nada;
  // onConflict cobre a corrida entre dois syncs simultâneos.
  for (let i = 0; i < paraCriar.length; i += LOTE) {
    const { error } = await site
      .from('produtos')
      .upsert(paraCriar.slice(i, i + LOTE), { onConflict: 'slug', ignoreDuplicates: true });
    if (error) throw new Error(`criação de produtos erp-auto: ${error.message}`);
  }

  return {
    atualizados: linhas.length,
    removidos: (removidosData ?? []).length,
    produtosCriados: paraCriar.length,
    inativos: linhas.length - ativos,
    ativos,
  };
}

// ---------------------------------------------------------------- pedidos
//
// O caminho de volta: status do orçamento no ERP → `pedidos` do site. E é aqui
// que a comissão do afiliado nasce, quando o pedido chega a FATURADO (ou
// além — o Tiny pode pular direto para ENVIADO/ENTREGUE). Uma comissão por
// (pedido, afiliado), garantida pelo unique da tabela; CANCELADO/NAO_APROVADO
// cancela a comissão que ainda não foi paga.

interface PedidoErp {
  id: string;
  quote_number: number | null;
  status: string;
  total: number | null;
  site_pedido_id: string;
  tiny_order_number: string | null;
  updated_at: string | null;
}

const FATURADO_OU_ALEM = new Set(['FATURADO', 'FATURADO_PARCIAL', 'PREPARANDO_ENVIO', 'PRONTO_ENVIO', 'ENVIADO', 'ENTREGUE']);
const CANCELADOS = new Set(['CANCELADO', 'NAO_APROVADO']);

async function espelharPedidos(site: Db, erp: Db, dry: boolean): Promise<{ lidos: number; atualizados: number; comissoes: number }> {
  let lidos: PedidoErp[] = [];
  try {
    lidos = await lerTudo<PedidoErp>(erp, 'pedidos_site', 'id, quote_number, status, total, site_pedido_id, tiny_order_number, updated_at', 'id');
  } catch (err) {
    // A view nasce na Fase 7; um ERP sem ela não pode derrubar o sync do catálogo.
    console.warn('[erp-sync] pedidos_site indisponível:', err instanceof Error ? err.message : err);
    return { lidos: 0, atualizados: 0, comissoes: 0 };
  }
  if (!lidos.length || dry) return { lidos: lidos.length, atualizados: 0, comissoes: 0 };

  const ids = lidos.map((p) => p.site_pedido_id);
  const { data: locaisData } = await site
    .from('pedidos')
    .select('id, status, total_erp, afiliado_user_id, erp_quote_id')
    .in('id', ids);
  const locais = new Map(((locaisData ?? []) as { id: string; status: string; total_erp: number | null; afiliado_user_id: string | null; erp_quote_id: string | null }[]).map((p) => [p.id, p]));

  const { data: cfg } = await site.from('loja_config').select('percentual_afiliado_padrao').eq('id', 1).maybeSingle();
  const pctPadrao = Number((cfg as { percentual_afiliado_padrao?: number } | null)?.percentual_afiliado_padrao ?? 0);

  let atualizados = 0;
  let comissoes = 0;
  const agora = new Date().toISOString();

  for (const p of lidos) {
    const local = locais.get(p.site_pedido_id);
    if (!local) continue;
    const mudou = local.status !== p.status || Number(local.total_erp ?? -1) !== Number(p.total ?? -1) || local.erp_quote_id !== p.id;
    if (mudou) {
      const { error } = await site
        .from('pedidos')
        .update({ status: p.status, total_erp: p.total, erp_quote_id: p.id, erp_quote_number: p.quote_number, status_atualizado_em: agora })
        .eq('id', p.site_pedido_id);
      if (!error) atualizados++;
    }

    if (!local.afiliado_user_id) continue;

    if (FATURADO_OU_ALEM.has(p.status)) {
      const { data: af } = await site.from('afiliados').select('percentual, ativo').eq('user_id', local.afiliado_user_id).maybeSingle();
      const a = af as { percentual: number | null; ativo: boolean } | null;
      const pct = Number(a?.percentual ?? pctPadrao);
      const base = Number(p.total ?? 0);
      if (!a || !a.ativo || pct <= 0 || base <= 0) continue;
      const valor = Math.round(base * (pct / 100) * 100) / 100;
      // ignoreDuplicates: já existe → não recalcula (o valor pago é o apurado).
      const { data: criada } = await site
        .from('comissoes')
        .upsert(
          { pedido_id: p.site_pedido_id, afiliado_user_id: local.afiliado_user_id, base_valor: base, percentual: pct, valor, status: 'apurada', evento_erp: p.status, apurada_em: agora },
          { onConflict: 'pedido_id,afiliado_user_id', ignoreDuplicates: true }
        )
        .select('id');
      if ((criada ?? []).length) comissoes++;
    } else if (CANCELADOS.has(p.status)) {
      await site
        .from('comissoes')
        .update({ status: 'cancelada', observacao: `pedido ${p.status} no ERP` })
        .eq('pedido_id', p.site_pedido_id)
        .in('status', ['pendente', 'apurada']);
    }
  }

  return { lidos: lidos.length, atualizados, comissoes };
}
