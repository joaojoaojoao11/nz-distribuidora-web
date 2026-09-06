// POST /api/nz/pedido — o pedido do site vira um orçamento no NZERP, SEM
// pagamento (o vendedor fecha). É o caminho do lojista que negocia; o
// pagamento online vive em handlers/checkout.ts, sobre o mesmo módulo de
// precificação (_lib/pedido/precificar.ts).
//
// Fluxo:
//   1. exige logado E aprovado (é quem vê preço);
//   2. o cadastro precisa estar completo — documento, telefone, endereço —
//      porque é o que o ERP usa para achar/criar o cliente e faturar;
//   3. itens são revalidados no servidor: slug → produto → SKU FÍSICO (alias
//      resolvido) → preço de tabela do canal. O cliente nunca manda preço;
//   4. cupom e afiliado são resolvidos aqui (cupom > indicado_por > último
//      clique), nunca em benefício do próprio usuário;
//   5. grava `pedidos` + `pedido_itens` como RASCUNHO, chama a RPC
//      site_criar_pedido no ERP (service role) e, com a resposta, passa a
//      ABERTO com o número do orçamento. Se o ERP falhar, o rascunho fica e o
//      cliente vê "tente de novo" — nada é perdido nem duplicado (a RPC é
//      idempotente por site_pedido_id).

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { resolverPapelDetalhado } from '../papel.js';
import {
  carregarPerfil,
  codigoDoAfiliado,
  enderecoJson,
  itensParaGravar,
  montarPayloadErp,
  normalizarItens,
  precificar,
  resolverAfiliado,
  resolverCupom,
  safeJson,
} from '../pedido/precificar.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  const siteUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const siteKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const erpUrl = process.env.ERP_SUPABASE_URL;
  const erpKey = process.env.ERP_SUPABASE_SERVICE_ROLE_KEY;
  if (!siteUrl || !siteKey || !erpUrl || !erpKey) {
    res.status(500).json({ error: 'ENV ausente', hasSiteUrl: !!siteUrl, hasSiteKey: !!siteKey, hasErpUrl: !!erpUrl, hasErpKey: !!erpKey });
    return;
  }
  const site = createClient(siteUrl, siteKey);

  const { papel, aprovado, userId } = await resolverPapelDetalhado(site, req.headers.authorization);
  if (papel === 'anonimo' || !userId) {
    res.status(401).json({ error: 'login-necessario' });
    return;
  }
  if (!aprovado) {
    res.status(403).json({ error: 'aguardando-aprovacao' });
    return;
  }

  const body = (typeof req.body === 'string' ? safeJson(req.body) : req.body) || {};
  const itens = normalizarItens(body.itens);
  if (!itens.length) {
    res.status(400).json({ error: 'sem-itens' });
    return;
  }
  const observacoes = typeof body.observacoes === 'string' ? body.observacoes.trim().slice(0, 1000) : '';
  const visitante = typeof body.visitante === 'string' ? body.visitante.trim().slice(0, 80) : '';
  const frete = body.frete && typeof body.frete === 'object' ? (body.frete as Record<string, unknown>) : null;

  const { perfil, faltando } = await carregarPerfil(site, userId);
  if (!perfil || faltando.length) {
    res.status(400).json({ error: 'cadastro-incompleto', faltando });
    return;
  }

  const { linhas, invalidos, subtotal } = await precificar(site, itens);
  if (invalidos.length) {
    res.status(400).json({ error: 'itens-invalidos', invalidos });
    return;
  }

  const cupom = await resolverCupom(site, typeof body.cupom === 'string' ? body.cupom : '', subtotal, userId);
  if (cupom.invalido) {
    res.status(400).json({ error: 'cupom-invalido' });
    return;
  }
  let afiliadoUserId = cupom.afiliadoUserId;
  if (!afiliadoUserId) afiliadoUserId = await resolverAfiliado(site, userId, perfil.indicado_por, visitante);
  const afiliadoCodigo = await codigoDoAfiliado(site, afiliadoUserId);

  const totalEstimado = Math.max(0, Math.round((subtotal - cupom.desconto) * 100) / 100);

  // -------------------------------------------------- grava rascunho
  const { data: pedidoRow, error: pedErr } = await site
    .from('pedidos')
    .insert({
      user_id: userId,
      status: 'RASCUNHO',
      cupom: cupom.codigo,
      afiliado_user_id: afiliadoUserId,
      frete,
      endereco: enderecoJson(perfil),
      observacoes: observacoes || null,
      total_estimado: totalEstimado,
      desconto: cupom.desconto,
    })
    .select('id, numero')
    .single();
  if (pedErr || !pedidoRow) {
    res.status(500).json({ error: 'nao-gravou-pedido', message: pedErr?.message });
    return;
  }
  const pedido = pedidoRow as { id: string; numero: number };

  const { error: itensErr } = await site.from('pedido_itens').insert(itensParaGravar(pedido.id, linhas));
  if (itensErr) {
    await site.from('pedidos').delete().eq('id', pedido.id);
    res.status(500).json({ error: 'nao-gravou-itens', message: itensErr.message });
    return;
  }

  // ----------------------------------------------------- envia ao ERP
  const notas = [
    `Pedido #${pedido.numero} feito no site nzgroup.com.br por ${perfil.email ?? ''}.`,
    cupom.codigo ? `Cupom ${cupom.codigo}${cupom.desconto ? ` (desconto estimado R$ ${cupom.desconto.toFixed(2)})` : ''}.` : null,
    afiliadoCodigo ? `Indicado por ${afiliadoCodigo}.` : null,
    frete && typeof frete.prazoDias === 'number' ? `Frete estimado no site: ${frete.transportadora ?? ''} ${frete.prazoDias} dias úteis${typeof frete.valor === 'number' ? ` R$ ${Number(frete.valor).toFixed(2)}` : ''}.` : null,
    ...linhas.filter((l) => l.item.lpns?.length).map((l) => `${l.e.sku}: rolos pedidos ${l.item.lpns!.join(', ')}.`),
    observacoes ? `Obs. do cliente: ${observacoes}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const payload = montarPayloadErp({
    pedidoId: pedido.id,
    perfil,
    linhas,
    total: totalEstimado,
    notas,
    cupom: cupom.codigo,
    afiliadoCodigo,
    frete: { tipo: 'FOB', valor: 0 },
  });
  await site.from('pedidos').update({ erp_payload: payload }).eq('id', pedido.id);

  const erp = createClient(erpUrl, erpKey);
  const { data: rpc, error: rpcErr } = await erp.rpc('site_criar_pedido', { p: payload });
  if (rpcErr) {
    await site.from('pedidos').update({ observacoes: `${observacoes ? observacoes + '\n' : ''}[erro ao enviar ao ERP: ${rpcErr.message}]` }).eq('id', pedido.id);
    res.status(502).json({ error: 'erp-indisponivel', numero: pedido.numero, message: rpcErr.message });
    return;
  }
  const r = rpc as { quote_id: string; quote_number: number };

  await site
    .from('pedidos')
    .update({ status: 'ABERTO', erp_quote_id: r.quote_id, erp_quote_number: r.quote_number, enviado_em: new Date().toISOString(), status_atualizado_em: new Date().toISOString() })
    .eq('id', pedido.id);
  if (cupom.codigo) await site.rpc('cupom_consumir', { p_codigo: cupom.codigo });

  res.status(200).json({ ok: true, numero: pedido.numero, erpQuoteNumber: r.quote_number, totalEstimado, desconto: cupom.desconto, afiliado: afiliadoCodigo });
}
