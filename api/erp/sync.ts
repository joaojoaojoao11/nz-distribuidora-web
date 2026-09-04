// POST/GET /api/erp/sync — sincroniza o catálogo ativo e o estoque do NZERP.
//
// Dois clients Supabase, um por projeto, ambos com chave SÓ NO SERVIDOR:
//   leitura : NZERP  (ipehorttsrvjynnhyzhu), views catalogo_estoque_site
//   escrita : site   (uibjmvkvbthzypgozpcs), tabela erp_stock_mirror
//
// Por que esta abordagem e não outra (apurado na doc oficial do Supabase):
//   · postgres_fdw  — foreign table não suporta RLS, a senha fica em texto no
//     catálogo, e a conectividade outbound do Supabase só funciona por IPv6,
//     comportamento não documentado.
//   · replicação lógica — exige PG 17.4+, conexão direta e instância XL; sem
//     doc oficial para Supabase→Supabase.
//   · Pipelines — não tem destino Postgres. Read Replicas são do mesmo projeto.
//   · leitura direta do ERP no browser — barrada: o NZERP tem policies
//     `FOR ALL TO public`, então a chave dele abre custo, margem, financeiro,
//     CRM e RH.
//
// Aqui as chaves nunca saem do servidor, o retry é nosso e a falha é visível
// em erp_sync_log.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Db = SupabaseClient<any, any, any>;
/* eslint-enable @typescript-eslint/no-explicit-any */

interface ErpRow {
  sku: string;
  nome: string | null;
  categoria: string | null;
  marca: string | null;
  ativo: boolean;
  largura_m: number | null;
  metragem_padrao: number | null;
  estoque_minimo: number | null;
  updated_at: string | null;
  saldo_ml: number | null;
  rolos_fechados: number | null;
  rolos_abertos: number | null;
}

const PAGE = 1000;

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
  let gatilho: 'cron' | 'manual' | 'webhook' = 'manual';

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
      if ((profile as { role?: string } | null)?.role === 'admin') authorized = true;
    }
  }

  if (!authorized) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (typeof req.body === 'object' && req.body && (req.body as { gatilho?: string }).gatilho === 'webhook') {
    gatilho = 'webhook';
  }

  const { data: config } = await site
    .from('erp_config')
    .select('sync_ativo')
    .eq('id', 1)
    .maybeSingle();
  if ((config as { sync_ativo?: boolean } | null)?.sync_ativo === false) {
    res.status(200).json({ pulado: true, motivo: 'sync desativado em erp_config' });
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
    const rows = await lerCatalogoErp(erp);
    const { atualizados, desativados } = await espelhar(site, rows);

    if (logId) {
      await site
        .from('erp_sync_log')
        .update({
          concluido_em: new Date().toISOString(),
          lidos: rows.length,
          atualizados,
          desativados,
        })
        .eq('id', logId);
    }

    res.status(200).json({ ok: true, lidos: rows.length, atualizados, desativados, gatilho });
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
async function lerCatalogoErp(erp: Db): Promise<ErpRow[]> {
  const out: ErpRow[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await erp
      .from('catalogo_estoque_site')
      .select(
        'sku, nome, categoria, marca, ativo, largura_m, metragem_padrao, estoque_minimo, updated_at, saldo_ml, rolos_fechados, rolos_abertos'
      )
      .order('sku', { ascending: true })
      .range(from, from + PAGE - 1);

    if (error) throw new Error(`leitura do ERP: ${error.message}`);
    const page = (data ?? []) as unknown as ErpRow[];
    out.push(...page);
    if (page.length < PAGE) break;
  }
  return out;
}

async function espelhar(
  site: Db,
  rows: ErpRow[]
): Promise<{ atualizados: number; desativados: number }> {
  const agora = new Date().toISOString();

  const payload = rows.map((r) => ({
    erp_sku: r.sku,
    nome: r.nome,
    categoria: r.categoria,
    marca: r.marca,
    ativo: r.ativo,
    saldo_ml: Number(r.saldo_ml ?? 0),
    rolos_fechados: Number(r.rolos_fechados ?? 0),
    rolos_abertos: Number(r.rolos_abertos ?? 0),
    largura_m: r.largura_m,
    metragem_padrao: r.metragem_padrao,
    estoque_minimo: r.estoque_minimo,
    erp_updated_at: r.updated_at,
    sincronizado_em: agora,
  }));

  for (let i = 0; i < payload.length; i += 500) {
    const lote = payload.slice(i, i + 500);
    const { error } = await site.from('erp_stock_mirror').upsert(lote, { onConflict: 'erp_sku' });
    if (error) throw new Error(`escrita no espelho: ${error.message}`);
  }

  // Reconciliação: um produto retirado do catálogo ativo do ERP não some
  // sozinho do espelho. Sem este passo o site continuaria anunciando estoque de
  // item descontinuado.
  const { data: desativadosData, error: desErr } = await site
    .from('erp_stock_mirror')
    .update({ ativo: false, saldo_ml: 0, rolos_fechados: 0, rolos_abertos: 0, sincronizado_em: agora })
    .lt('sincronizado_em', agora)
    .eq('ativo', true)
    .select('erp_sku');

  if (desErr) throw new Error(`reconciliação: ${desErr.message}`);

  return { atualizados: payload.length, desativados: (desativadosData ?? []).length };
}
