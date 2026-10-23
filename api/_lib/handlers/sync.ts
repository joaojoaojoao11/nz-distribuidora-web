// POST/GET /api/nz/sync — espelha catálogo, PREÇO DE VENDA e estoque do NZERP.
//
// Dois clients Supabase, um por projeto, ambos com chave SÓ NO SERVIDOR:
//   leitura : NZERP (ipehorttsrvjynnhyzhu) — views catalogo_site, precos_site,
//             estoque_site (2NZERPUPDATE30/supabase/migrations/20260906_site_views.sql)
//   escrita : site  (uibjmvkvbthzypgozpcs) — erp_produtos e produtos
//
// O que ele faz, nesta ordem:
//   1. lê as três views inteiras (paginadas: PostgREST ignora limit > 1000);
//   2. upsert em erp_produtos — TODOS os SKUs, ativos e inativos. É AQUI que o
//      preço de venda do site é escolhido: o ERP manda dois pares por SKU e o
//      site usa o ATACADO (ver `precoDeVenda` mais abaixo);
//   3. marca `removido_no_erp` quem sumiu da view (apagado no ERP);
//   4. cria em `produtos` uma linha 'erp-auto' para todo SKU que ainda não tem
//      produto no site — é o "todo produto do NZERP tem cadastro no site";
//   5. espelha status dos pedidos do site;
//   6. no cron (não no webhook): manutenção do checkout, equipe e a atribuição
//      dos títulos do contas a receber — esta última lê o NZERP e grava só no
//      banco do site (`erp_titulo_dono`);
//   7. registra na Central (`ocorrencias`) o que a equipe precisa saber: SKU
//      ativo sem preço de atacado, SKU novo, SKU que sumiu do ERP e preço que
//      deu um salto. Falhar aqui NUNCA derruba o espelho — o sync existe para
//      espelhar; avisar é o bônus.
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
import { criarContasDoErp } from '../conta/contasDoErp.js';
import { atribuirTitulos } from '../conta/atribuirTitulos.js';
import { limparNaoConfirmados } from '../conta/limparNaoConfirmados.js';
import { limparTentativasLogin } from '../conta/loginDocumento.js';
import { espelharAcessoNoErp } from '../conta/acessoNoErp.js';
import { abrirOcorrencia, chavesAbertas, resolverPorChave, resolverVariasChaves } from '../ocorrencias.js';
import { carregarConfigIncentivos } from '../incentivos/config.js';
import { estornarPedido, processarPedidoFaturado } from '../incentivos/motor.js';
import { aplicarDevolucaoParcial, liberarAposEntrega, manutencaoCarteira } from '../incentivos/carteira.js';
import { devolverSaldoDoPedido } from '../incentivos/saldoCheckout.js';
import { sincronizarSaques } from '../incentivos/saque.js';
import { registrarUsoCupom } from '../incentivos/cupomUsos.js';

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

/**
 * O que a view `precos_site` do ERP entrega. Os NOMES ENGANAM e é preciso ler
 * com o vocabulário do ERP na mão (2NZERPUPDATE30/components/PricingEngineering.tsx):
 *
 *   preco_rolo      = pricing_engineering.preco_venda_ideal_atacado  → "Preço V" = VAREJO
 *   preco_rolo_min  = pricing_engineering.preco_venda_min_atacado    → "Preço A" = ATACADO
 *
 * Ou seja: o campo que se chama "min" é o preço praticado, e o que não tem
 * sufixo é a tabela publicada. O caderno de preços registra a decisão: "a
 * tabela publicada é o varejo; o preço praticado é o atacado — no atacado, o
 * antigo preço de varejo virou o mínimo".
 */
interface PrecoRow {
  sku: string;
  /** VAREJO do rolo (ideal_atacado). */
  preco_rolo: number | null;
  /** ATACADO do rolo (min_atacado) — é o que o site cobra. */
  preco_rolo_min: number | null;
  /** VAREJO do metro (ideal_fracionado). */
  preco_metro: number | null;
  /** ATACADO do metro (min_fracionado) — é o que o site cobra. */
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
  // A função morre aos 60 s (vercel.json). O job de contas do ERP usa só o que sobrar até 45 s.
  const inicioSync = Date.now();
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

    const resultado = await espelhar(site, { catalogo, precos, estoque }, dry, gatilho === 'webhook');
    const pedidos = await espelharPedidos(site, erp, dry);
    // Checkout: eventos do Asaas com erro, Pix expirado, ERP atrasado. Só no
    // cron e no botão — o webhook do ERP bate aqui a cada 5 min e não precisa.
    const checkout = !dry && gatilho !== 'webhook' ? await manutencaoCheckout(site).catch((e) => ({ erro: e instanceof Error ? e.message : String(e) })) : null;
    // Quem entrou/saiu do NZERP ganha/perde acesso administrativo ao site.
    const equipe = !dry && gatilho !== 'webhook' ? await sincronizarEquipe(site, null).catch((e) => ({ erro: e instanceof Error ? e.message : String(e) })) : null;
    // De quem é cada título do contas a receber. Lê o ERP, grava só no site.
    // Uma vez por dia basta: título novo nasce com nota, e nota não é de minuto.
    const titulos = !dry && gatilho !== 'webhook' ? await atribuirTitulos(site).catch((e) => ({ erro: e instanceof Error ? e.message : String(e) })) : null;
    // Conta criada há mais de 48 h que nunca confirmou o e-mail: some (20/10/2026).
    const limpeza = !dry && gatilho !== 'webhook' ? await limparNaoConfirmados(site).catch((e) => ({ erro: e instanceof Error ? e.message : String(e) })) : null;
    // Devoluções parciais do NZERP descontam a comissão ANTES da liberação do
    // dia (#10, 23/10/2026): crédito a liberar perde o valor devolvido.
    const devolucoes = !dry && gatilho !== 'webhook' ? await aplicarDevolucoes(site, erp).catch((e) => ({ erro: e instanceof Error ? e.message : String(e) })) : null;
    // Carteira (Fase 2): libera o que venceu a carência/período e expira o
    // saldo antigo (D11). Uma vez por dia basta.
    const carteira = !dry && gatilho !== 'webhook' ? await manutencaoCarteira(site, (await carregarConfigIncentivos(site)).mesesValidade).catch((e) => ({ erro: e instanceof Error ? e.message : String(e) })) : null;
    // Saques (Fase 4): remanda ao NZERP o que ficou pendente e espelha os
    // títulos pagos/cancelados (cancelado devolve o saldo à carteira).
    const saques = !dry && gatilho !== 'webhook' ? await sincronizarSaques(site, erp).catch((e) => ({ erro: e instanceof Error ? e.message : String(e) })) : null;
    // Login com CPF/CNPJ: tentativas com mais de 30 dias saem (o rastro só serve aos limites).
    const tentativasLogin = !dry && gatilho !== 'webhook' ? await limparTentativasLogin(site).catch((e) => ({ erro: e instanceof Error ? e.message : String(e) })) : null;
    // Central do cliente (Fase A): cliente da base do ERP ganha conta bloqueada
    // no site, já vinculada. Roda DEPOIS dos passos de dinheiro (carteira,
    // saques, títulos) e com orçamento de tempo: cada conta leva ~1 s, e a 1ª
    // rodada (~380) estouraria os 60 s da função — o que não couber sai amanhã.
    const prazoContas = Math.max(0, 45_000 - (Date.now() - inicioSync));
    const contasErp = !dry && gatilho !== 'webhook' && prazoContas > 3000 ? await criarContasDoErp(site, 300, undefined, prazoContas).catch((e) => ({ erro: e instanceof Error ? e.message : String(e) })) : null;
    // Login por CPF/CNPJ, Fase 3: a ficha do NZERP com o acesso ao site de todas as contas ligadas
    // (depois do job de contas do ERP, para pegar as que nasceram hoje).
    const acessoNoErp = !dry && gatilho !== 'webhook' ? await espelharAcessoNoErp(site).catch((e) => ({ erro: e instanceof Error ? e.message : String(e) })) : null;

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

    // Sync inteiro passou: se havia uma queixa de sync caído, ela morre aqui.
    if (!dry) await resolverPorChave(site, 'sync-erro', `sync ${gatilho} concluído`);

    res.status(200).json({ ok: true, dry, gatilho, lidos: catalogo.length, precos: precos.length, comEstoque: estoque.length, ...resultado, pedidos, checkout, equipe, contasErp, titulos, limpeza, devolucoes, carteira, saques, tentativasLogin, acessoNoErp });
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : String(err);
    console.error('[erp-sync] falhou:', mensagem);
    if (logId) {
      await site
        .from('erp_sync_log')
        .update({ concluido_em: new Date().toISOString(), erro: mensagem })
        .eq('id', logId);
    }
    // O log já registrava a falha, mas ninguém lia. Uma ocorrência só enquanto
    // durar o problema: a chave fixa 'sync-erro' impede a enxurrada de um ERP
    // fora do ar batendo aqui a cada 5 minutos.
    if (!dry) {
      await abrirOcorrencia(site, {
        categoria: 'erro',
        tipo: 'sync-erro',
        titulo: 'Sync com o NZERP falhou',
        detalhe: { mensagem, gatilho, logId: logId ?? null },
        chaveDedupe: 'sync-erro',
      });
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
  /** O que foi para a Central. `null` quando o registro falhou (não é fatal). */
  central?: ContagemCentral | null;
}

/**
 * O preço que o SITE mostra e cobra: o ATACADO do ERP.
 *
 * Zero ou nulo no atacado significa que o SKU não passou pelo
 * pricing_engineering — não é promoção nem preço de graça. Nesse caso caímos na
 * tabela de varejo (é melhor cobrar caro do que cobrar errado) e a Central
 * recebe uma ocorrência `preco-zerado` para alguém corrigir no ERP.
 */
function precoDeVenda(atacado: number | null | undefined, varejo: number | null | undefined): number | null {
  return Number(atacado) > 0 ? Number(atacado) : (varejo ?? null);
}

/** O que estava no espelho antes deste sync — base do "preço mudou". */
interface Anterior {
  sku: string;
  preco_rolo: number | null;
  preco_metro: number | null;
  preco_rolo_varejo: number | null;
}

async function espelhar(
  site: Db,
  dados: { catalogo: CatalogoRow[]; precos: PrecoRow[]; estoque: EstoqueRow[] },
  dry: boolean,
  /** true no webhook: registra só o que está quebrado, não as mudanças. */
  somenteErros: boolean
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
      // O site mostra e cobra ATACADO (decisão do João, 2026-09-08). Ver
      // `precoDeVenda` e o comentário de PrecoRow: o "min" do ERP é o praticado.
      preco_rolo: precoDeVenda(p?.preco_rolo_min, p?.preco_rolo),
      preco_metro: precoDeVenda(p?.preco_metro_min, p?.preco_metro),
      // Mantidos com o mesmo significado de sempre (o atacado cru do ERP), para
      // não quebrar nada que ainda leia essas colunas.
      preco_rolo_min: p?.preco_rolo_min ?? null,
      preco_metro_min: p?.preco_metro_min ?? null,
      // A tabela publicada. Só o papel admin recebe estes dois.
      preco_rolo_varejo: p?.preco_rolo ?? null,
      preco_metro_varejo: p?.preco_metro ?? null,
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

  // O "antes" tem que ser lido ANTES do upsert — depois dele o valor antigo já
  // não existe em lugar nenhum. Só serve para a ocorrência "preço mudou".
  const antes = new Map<string, Anterior>();
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await site
      .from('erp_produtos')
      .select('sku, preco_rolo, preco_metro, preco_rolo_varejo')
      .order('sku', { ascending: true })
      .range(from, from + PAGE - 1);
    // Falha aqui não pode derrubar o espelho: sem o "antes" só perdemos o aviso.
    if (error) {
      console.warn('[erp-sync] não consegui ler o estado anterior:', error.message);
      break;
    }
    for (const r of (data ?? []) as unknown as Anterior[]) antes.set(r.sku, r);
    if ((data ?? []).length < PAGE) break;
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

  // O que a equipe precisa saber. Depois de tudo escrito e sem poder derrubar
  // nada: se o aviso falhar, o espelho já aconteceu.
  const central = await registrarOcorrencias(site, {
    linhas,
    antes,
    precoPorSku,
    paraCriar: paraCriar.map((p) => ({ sku: p.erp_sku, slug: p.slug, linha_key: p.linha_key, vertical: p.vertical })),
    removidos: ((removidosData ?? []) as { sku: string }[]).map((r) => r.sku),
    somenteErros,
  }).catch((e) => {
    console.warn('[erp-sync] central:', e instanceof Error ? e.message : e);
    return null;
  });

  return {
    atualizados: linhas.length,
    removidos: (removidosData ?? []).length,
    produtosCriados: paraCriar.length,
    inativos: linhas.length - ativos,
    ativos,
    central,
  };
}

// ------------------------------------------------------------- ocorrências

interface LinhaEspelho {
  sku: string;
  nome: string | null;
  ativo: boolean;
  preco_rolo: number | null;
  preco_metro: number | null;
  preco_rolo_varejo: number | null;
  preco_metro_varejo: number | null;
}

interface ContagemCentral {
  precoZerado: number;
  precoResolvido: number;
  skuNovo: number;
  skuRemovido: number;
  precoMudou: number;
}

/**
 * Traduz o resultado do sync para a Central (/admin/central).
 *
 * Duas assimetrias de propósito:
 *
 *   · ERROS (preço zerado) valem em qualquer gatilho — é o que deixa a loja
 *     errada agora.
 *   · MUDANÇAS (SKU novo/removido, preço que saltou) só no cron e no botão. O
 *     webhook do ERP bate a cada 5 minutos; avisar "SKU novo" 288 vezes por dia
 *     transformaria a Central em ruído, e o cadastro em massa já chega em lote.
 *
 * Nada aqui pode lançar: o chamador embrulha em catch, mas cada operação já é
 * tolerante por si (ver api/_lib/ocorrencias.ts).
 */
async function registrarOcorrencias(
  site: Db,
  args: {
    linhas: LinhaEspelho[];
    antes: Map<string, Anterior>;
    precoPorSku: Map<string, PrecoRow>;
    paraCriar: { sku: string; slug: string; linha_key: string; vertical: string }[];
    removidos: string[];
    /** true no webhook: só o que está quebrado agora. */
    somenteErros: boolean;
  }
): Promise<ContagemCentral> {
  const c: ContagemCentral = { precoZerado: 0, precoResolvido: 0, skuNovo: 0, skuRemovido: 0, precoMudou: 0 };

  // --- erro: SKU ativo que o ERP não precificou.
  const jaAbertas = await chavesAbertas(site, 'preco-zerado:');
  const resolver: string[] = [];

  for (const l of args.linhas) {
    if (!l.ativo) continue;
    const p = args.precoPorSku.get(l.sku);
    const semAtacadoRolo = !(Number(p?.preco_rolo_min) > 0);
    const semAtacadoMetro = !(Number(p?.preco_metro_min) > 0);
    const chave = `preco-zerado:${l.sku}`;

    if (!semAtacadoRolo && !semAtacadoMetro) {
      // O atacado chegou: a queixa deixou de ser verdade.
      if (jaAbertas.has(chave)) resolver.push(chave);
      continue;
    }
    if (jaAbertas.has(chave)) continue;

    // Sem atacado E sem varejo: o produto aparece na loja sem preço NENHUM, que
    // é bem pior do que aparecer caro. `> 0` e não `!= null` porque o ERP grava
    // zero, não nulo, quando o SKU não passou pelo pricing — a mesma régua de
    // /api/nz/precos, que transforma zero em ausente para o card não anunciar
    // "R$ 0,00".
    const semPreco = !(Number(l.preco_rolo) > 0) && !(Number(l.preco_metro) > 0);
    const aberta = await abrirOcorrencia(site, {
      categoria: 'erro',
      tipo: 'preco-zerado',
      titulo: `Atacado zerado: ${l.sku}${l.nome ? ` — ${l.nome}` : ''}`,
      detalhe: {
        roloAtacado: p?.preco_rolo_min ?? null,
        metroAtacado: p?.preco_metro_min ?? null,
        roloVarejo: l.preco_rolo_varejo,
        metroVarejo: l.preco_metro_varejo,
        usandoVarejo: !semPreco,
        semPreco,
      },
      erpSku: l.sku,
      chaveDedupe: chave,
    });
    if (aberta === 'aberta') c.precoZerado++;
  }
  c.precoResolvido = await resolverVariasChaves(site, resolver, 'o ERP precificou o atacado');

  if (args.somenteErros) return c;

  // --- mudança: SKU novo. Um cadastro em massa no ERP pode trazer dezenas;
  // a tela tem "marcar todas como vistas" para isso.
  for (const p of args.paraCriar) {
    const nome = args.linhas.find((l) => l.sku === p.sku)?.nome;
    const r = await abrirOcorrencia(site, {
      categoria: 'mudanca',
      tipo: 'sku-novo',
      titulo: `SKU novo no ERP: ${p.sku}${nome ? ` — ${nome}` : ''}`,
      detalhe: { slug: p.slug, linha_key: p.linha_key, vertical: p.vertical },
      erpSku: p.sku,
      produtoSlug: p.slug,
      chaveDedupe: `sku-novo:${p.sku}`,
    });
    if (r === 'aberta') c.skuNovo++;
  }

  // --- mudança: SKU que sumiu do ERP. O produto sai da loja pela view.
  for (const sku of args.removidos) {
    const r = await abrirOcorrencia(site, {
      categoria: 'mudanca',
      tipo: 'sku-removido',
      titulo: `SKU sumiu do ERP: ${sku}`,
      detalhe: { efeito: 'o produto sai da loja pela view loja_catalogo' },
      erpSku: sku,
      chaveDedupe: `sku-removido:${sku}`,
    });
    if (r === 'aberta') c.skuRemovido++;
  }

  // --- mudança: preço que deu um salto.
  const { data: cfg } = await site.from('loja_config').select('alerta_variacao_preco_pct').eq('id', 1).maybeSingle();
  const limiar = Number((cfg as { alerta_variacao_preco_pct?: number } | null)?.alerta_variacao_preco_pct ?? 20);

  for (const l of args.linhas) {
    const a = args.antes.get(l.sku);
    // Linha nova não tem "antes". E — importante — a PRIMEIRA rodada depois da
    // migração de atacado troca varejo por atacado em TODO SKU: sem esta
    // guarda, seriam ~1.200 ocorrências de uma vez, todas falsas. `preco_rolo_varejo`
    // nulo é exatamente a marca de "esta linha é anterior à migração".
    if (!a || a.preco_rolo_varejo == null) continue;

    for (const campo of ['preco_rolo', 'preco_metro'] as const) {
      const antigo = Number(a[campo]);
      const novo = Number(l[campo]);
      if (!(antigo > 0) || !(novo > 0)) continue;
      const variacao = ((novo - antigo) / antigo) * 100;
      if (Math.abs(variacao) < limiar) continue;

      const r = await abrirOcorrencia(site, {
        categoria: 'mudanca',
        tipo: 'preco-mudou',
        titulo: `Preço mudou ${variacao > 0 ? '+' : ''}${variacao.toFixed(0)} %: ${l.sku}${l.nome ? ` — ${l.nome}` : ''}`,
        detalhe: {
          campo: campo === 'preco_rolo' ? 'rolo fechado' : 'metro linear',
          antes: antigo,
          depois: novo,
          variacaoPct: Math.round(variacao * 10) / 10,
        },
        erpSku: l.sku,
        chaveDedupe: `preco-mudou:${l.sku}`,
      });
      if (r === 'aberta') c.precoMudou++;
      // Uma ocorrência por SKU: se rolo e metro subiram juntos, é o mesmo fato.
      break;
    }
  }

  return c;
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
  /** Frete cobrado do cliente (ERP ≥ 21/10/2026); nulo em ERP sem a coluna na view. */
  shipping_cost?: number | null;
}

const FATURADO_OU_ALEM = new Set(['FATURADO', 'FATURADO_PARCIAL', 'PREPARANDO_ENVIO', 'PRONTO_ENVIO', 'ENVIADO', 'ENTREGUE']);
const CANCELADOS = new Set(['CANCELADO', 'NAO_APROVADO']);

async function espelharPedidos(site: Db, erp: Db, dry: boolean): Promise<{ lidos: number; atualizados: number; comissoes: number }> {
  let lidos: PedidoErp[] = [];
  try {
    // `shipping_cost` entrou na view em 21/10/2026 (B6): a base da comissão é
    // itens − desconto, SEM frete. Num ERP sem a coluna, a leitura cai para a
    // lista antiga e a base volta a ser o total (comportamento de antes).
    try {
      lidos = await lerTudo<PedidoErp>(erp, 'pedidos_site', 'id, quote_number, status, total, site_pedido_id, tiny_order_number, updated_at, shipping_cost', 'id');
    } catch {
      lidos = await lerTudo<PedidoErp>(erp, 'pedidos_site', 'id, quote_number, status, total, site_pedido_id, tiny_order_number, updated_at', 'id');
    }
  } catch (err) {
    // A view nasce na Fase 7; um ERP sem ela não pode derrubar o sync do catálogo.
    console.warn('[erp-sync] pedidos_site indisponível:', err instanceof Error ? err.message : err);
    return { lidos: 0, atualizados: 0, comissoes: 0 };
  }
  if (!lidos.length || dry) return { lidos: lidos.length, atualizados: 0, comissoes: 0 };

  const ids = lidos.map((p) => p.site_pedido_id);
  type Local = { id: string; user_id: string | null; status: string; total_erp: number | null; afiliado_user_id: string | null; erp_quote_id: string | null; cupom: string | null; cupom_consumido_em: string | null; incentivos_processados_em: string | null; incentivos_estornados_em: string | null; saldo_usado: number | null; saldo_movimento_id: number | null; saldo_devolvido_em: string | null; entregue_em: string | null };
  const locais = new Map<string, Local>();
  // Em lotes de 150 (varredura 22/10): todos os ids num `in` só passam do
  // tamanho de URL que o PostgREST aceita lá pelos 400 pedidos — a leitura
  // voltava vazia e, sem erro nenhum, cancelamentos e comissões paravam.
  for (let i = 0; i < ids.length; i += 150) {
    const { data: locaisData, error: eLocais } = await site
      .from('pedidos')
      .select('id, user_id, status, total_erp, afiliado_user_id, erp_quote_id, cupom, cupom_consumido_em, incentivos_processados_em, incentivos_estornados_em, saldo_usado, saldo_movimento_id, saldo_devolvido_em, entregue_em')
      .in('id', ids.slice(i, i + 150));
    if (eLocais) {
      // Leitura parcial não pode decidir estorno nem comissão: para aqui, o
      // resto do sync segue, e a próxima rodada tenta de novo.
      console.warn('[erp-sync] pedidos do site não vieram:', eLocais.message);
      return { lidos: lidos.length, atualizados: 0, comissoes: 0 };
    }
    for (const p of (locaisData ?? []) as Local[]) locais.set(p.id, p);
  }

  const cfgIncentivos = await carregarConfigIncentivos(site);

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

    // Orçamento com cupom (sem pagamento online): o uso do cupom é consumido
    // quando o ERP fatura — uma vez só, pela marca `cupom_consumido_em` (B5).
    if (local.cupom && !local.cupom_consumido_em && FATURADO_OU_ALEM.has(p.status)) {
      const { data: marcado } = await site
        .from('pedidos')
        .update({ cupom_consumido_em: agora })
        .eq('id', p.site_pedido_id)
        .is('cupom_consumido_em', null)
        .select('id');
      if ((marcado ?? []).length) {
        await site.rpc('cupom_consumir', { p_codigo: local.cupom });
        await registrarUsoCupom(site, local.cupom, local.user_id, p.site_pedido_id);
      }
    }

    // Fase 3: pedido cancelado no ERP devolve à carteira o saldo usado nele
    // (a parte do Asaas é estornada pelo admin). Uma vez só.
    if (CANCELADOS.has(p.status) && Number(local.saldo_usado ?? 0) > 0 && local.saldo_movimento_id != null && !local.saldo_devolvido_em) {
      await devolverSaldoDoPedido(site, p.site_pedido_id, `pedido ${p.status} no ERP`).catch((e) => {
        console.warn('[erp-sync] devolução do saldo falhou no pedido', p.site_pedido_id, e instanceof Error ? e.message : e);
        return false;
      });
    }

    // Incentivos (Fase 2, 21/10/2026): super cupom, ativação e recorrência do
    // afiliado nascem na CARTEIRA quando o ERP fatura — o motor decide quem
    // ganha o quê (api/_lib/incentivos/motor.ts). A tabela `comissoes` antiga
    // parou de receber linhas; o que estava lá fica como histórico.
    if (FATURADO_OU_ALEM.has(p.status) && !local.incentivos_processados_em) {
      try {
        const r = await processarPedidoFaturado(site, { pedidoId: p.site_pedido_id, totalErp: Number(p.total ?? 0), freteErp: Number(p.shipping_cost ?? 0), faturadoEm: p.updated_at ? new Date(p.updated_at) : new Date() }, cfgIncentivos);
        comissoes += r.creditos.length;
        if (r.cortes.length) console.warn('[erp-sync] trava de margem cortou:', r.cortes.join(' | '));
      } catch (e) {
        console.warn('[erp-sync] motor de incentivos falhou no pedido', p.site_pedido_id, e instanceof Error ? e.message : e);
      }
    } else if (CANCELADOS.has(p.status) && local.incentivos_processados_em && !local.incentivos_estornados_em) {
      try {
        await estornarPedido(site, p.site_pedido_id, `pedido ${p.status} no ERP`, cfgIncentivos);
      } catch (e) {
        console.warn('[erp-sync] estorno de incentivos falhou no pedido', p.site_pedido_id, e instanceof Error ? e.message : e);
      }
      await site
        .from('comissoes')
        .update({ status: 'cancelada', observacao: `pedido ${p.status} no ERP` })
        .eq('pedido_id', p.site_pedido_id)
        .in('status', ['pendente', 'apurada']);
    }

    // Entregue (#10, 23/10/2026): a carência do crédito de indicação conta da
    // ENTREGA — antes contava do faturamento, e o indicador recebia antes do
    // prazo de devolução acabar. Uma vez por pedido (entregue_em). Roda depois
    // do motor: crédito que nasceu agora mesmo já sai com a data certa.
    if (p.status === 'ENTREGUE' && !local.entregue_em) {
      const entregueEm = p.updated_at ? new Date(p.updated_at) : new Date();
      const { data: marcou } = await site.from('pedidos').update({ entregue_em: entregueEm.toISOString() }).eq('id', p.site_pedido_id).is('entregue_em', null).select('id');
      if ((marcou ?? []).length) {
        await liberarAposEntrega(site, p.site_pedido_id, entregueEm, cfgIncentivos.diasLiberacao).catch((e) => {
          console.warn('[erp-sync] liberação após a entrega falhou no pedido', p.site_pedido_id, e instanceof Error ? e.message : e);
          return 0;
        });
      }
    }
  }

  return { lidos: lidos.length, atualizados, comissoes };
}

/**
 * Devoluções PARCIAIS concluídas no NZERP (#10, 23/10/2026; view
 * `devolucoes_site`): a comissão sobre o valor devolvido sai do crédito do
 * pedido. Devolução total o espelho de pedidos já trata (o orçamento vira
 * CANCELADO). O que já estava liberado vira ocorrência para a equipe.
 */
async function aplicarDevolucoes(site: Db, erp: Db): Promise<{ aplicadas: number; descontado: number; paraEquipe: number }> {
  const r = { aplicadas: 0, descontado: 0, paraEquipe: 0 };
  const { data, error } = await erp.from('devolucoes_site').select('id, site_pedido_id, status, valor_material').eq('status', 'CONCLUIDO').limit(500);
  if (error) throw new Error('devolucoes_site: ' + error.message);
  const lista = (data ?? []) as { id: string; site_pedido_id: string; valor_material: number }[];
  if (!lista.length) return r;
  const { data: feitas } = await site.from('carteira_devolucoes').select('cancelamento_id').in('cancelamento_id', lista.map((d) => String(d.id)));
  const jaFeitas = new Set(((feitas ?? []) as { cancelamento_id: string }[]).map((f) => f.cancelamento_id));
  for (const d of lista) {
    if (jaFeitas.has(String(d.id))) continue;
    // Só depois de o motor ter criado os créditos do pedido; antes, espera a próxima rodada.
    const { data: ped } = await site.from('pedidos').select('numero, incentivos_processados_em').eq('id', d.site_pedido_id).maybeSingle();
    const pedido = ped as { numero: number | null; incentivos_processados_em: string | null } | null;
    if (!pedido?.incentivos_processados_em) continue;
    const feito = await aplicarDevolucaoParcial(site, { id: String(d.id), pedidoId: d.site_pedido_id, valorMaterial: Number(d.valor_material) });
    if (!feito) continue;
    r.aplicadas++;
    r.descontado = Math.round((r.descontado + feito.descontado) * 100) / 100;
    r.paraEquipe = Math.round((r.paraEquipe + feito.paraEquipe) * 100) / 100;
    if (feito.paraEquipe > 0) {
      await abrirOcorrencia(site, {
        categoria: 'problema',
        tipo: 'carteira',
        titulo: `Devolução parcial no pedido #${pedido.numero ?? '?'}: comissão já liberada (${feito.paraEquipe.toFixed(2).replace('.', ',')})`,
        detalhe: { pedidoId: d.site_pedido_id, devolucaoErp: String(d.id), valorMaterial: Number(d.valor_material), creditos: feito.creditos, oQueFazer: 'O crédito já estava disponível (pode ter sido usado ou sacado). Se for o caso, lançar um ajuste negativo na carteira do afiliado/indicador.' },
        chaveDedupe: `devolucao-parcial:${d.id}`,
      });
    }
  }
  return r;
}
