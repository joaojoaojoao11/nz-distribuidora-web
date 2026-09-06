// POST /api/nz/pedido — o pedido do site vira um orçamento no NZERP.
//
// Fluxo (Fase 7):
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
//
// Unidade no ERP: tudo em metro linear ('MT'), como o vendedor lança. Rolo
// fechado = metragem_padrao metros ao preço de atacado por metro
// (preco_rolo ÷ metragem) — exatamente a régua do simulador da tabela de
// preço do NZERP. Fracionado = metros ao preco_metro.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { resolverPapelDetalhado, type Db } from '../papel.js';

interface ItemPedido {
  slug: string;
  qtd: number;
  unidade: 'rolo' | 'metro';
  lpns?: string[];
}

interface Produto {
  id: string;
  slug: string;
  nome: string;
  codigo: string | null;
  erp_sku: string | null;
  tipo_vinculo: string;
}

interface Espelho {
  sku: string;
  nome: string | null;
  ativo: boolean;
  metragem_padrao: number | null;
  preco_rolo: number | null;
  preco_metro: number | null;
  saldo_ml: number;
}

interface Perfil {
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  email: string | null;
  cpf_cnpj: string | null;
  ie: string | null;
  indicado_por: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
}

const MAX_ITENS = 40;

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
  const itensBrutos = Array.isArray(body.itens) ? (body.itens as unknown[]) : [];
  const itens: ItemPedido[] = itensBrutos
    .map((x) => x as Partial<ItemPedido>)
    .filter((x) => typeof x.slug === 'string' && typeof x.qtd === 'number' && x.qtd > 0 && (x.unidade === 'rolo' || x.unidade === 'metro'))
    .map((x) => ({
      slug: String(x.slug).trim().toLowerCase(),
      qtd: Math.min(Math.round(Number(x.qtd) * 100) / 100, x.unidade === 'rolo' ? 50 : 500),
      unidade: x.unidade as 'rolo' | 'metro',
      lpns: Array.isArray(x.lpns) ? (x.lpns as unknown[]).filter((l): l is string => typeof l === 'string').slice(0, 20) : [],
    }))
    .slice(0, MAX_ITENS);
  if (!itens.length) {
    res.status(400).json({ error: 'sem-itens' });
    return;
  }
  const cupomCodigo = typeof body.cupom === 'string' ? body.cupom.trim().toUpperCase() : '';
  const observacoes = typeof body.observacoes === 'string' ? body.observacoes.trim().slice(0, 1000) : '';
  const visitante = typeof body.visitante === 'string' ? body.visitante.trim().slice(0, 80) : '';
  const frete = body.frete && typeof body.frete === 'object' ? (body.frete as Record<string, unknown>) : null;

  // ------------------------------------------------------------ perfil
  const { data: perfilData } = await site
    .from('user_profiles')
    .select('full_name, company_name, phone, email, cpf_cnpj, ie, indicado_por, address_street, address_number, address_complement, address_neighborhood, address_city, address_state, address_zip')
    .eq('id', userId)
    .maybeSingle();
  const perfil = perfilData as Perfil | null;
  const faltando: string[] = [];
  if (!perfil?.full_name) faltando.push('nome');
  if (!perfil?.cpf_cnpj) faltando.push('cpf_cnpj');
  if (!perfil?.phone) faltando.push('telefone');
  if (!perfil?.address_street) faltando.push('endereco');
  if (!perfil?.address_city) faltando.push('cidade');
  if (!perfil?.address_state) faltando.push('uf');
  if (!perfil?.address_zip) faltando.push('cep');
  if (!perfil || faltando.length) {
    res.status(400).json({ error: 'cadastro-incompleto', faltando });
    return;
  }

  // ------------------------------------------------------------- itens
  const slugs = [...new Set(itens.map((i) => i.slug))];
  const { data: produtosData } = await site.from('produtos').select('id, slug, nome, codigo, erp_sku, tipo_vinculo').in('slug', slugs);
  const produtos = (produtosData ?? []) as Produto[];
  const skus = [...new Set(produtos.map((p) => p.erp_sku).filter((s): s is string => !!s))];
  const { data: espelhoData } = skus.length
    ? await site.from('erp_produtos').select('sku, nome, ativo, metragem_padrao, preco_rolo, preco_metro, saldo_ml').in('sku', skus)
    : { data: [] };
  const espelho = new Map(((espelhoData ?? []) as unknown as Espelho[]).map((e) => [e.sku, e]));

  const linhas: { produto: Produto; e: Espelho; item: ItemPedido; unitPrice: number; qtyMt: number; total: number }[] = [];
  const invalidos: string[] = [];
  for (const item of itens) {
    const p = produtos.find((x) => x.slug === item.slug);
    const e = p?.erp_sku ? espelho.get(p.erp_sku) : undefined;
    if (!p || !e || !e.ativo) {
      invalidos.push(item.slug);
      continue;
    }
    const metragem = Number(e.metragem_padrao) || 0;
    if (item.unidade === 'rolo') {
      if (e.preco_rolo == null || metragem <= 0) {
        invalidos.push(item.slug);
        continue;
      }
      const unitPrice = Math.round((Number(e.preco_rolo) / metragem) * 100) / 100;
      const qtyMt = Math.round(item.qtd * metragem * 100) / 100;
      linhas.push({ produto: p, e, item, unitPrice, qtyMt, total: Math.round(unitPrice * qtyMt * 100) / 100 });
    } else {
      if (e.preco_metro == null) {
        invalidos.push(item.slug);
        continue;
      }
      const unitPrice = Number(e.preco_metro);
      linhas.push({ produto: p, e, item, unitPrice, qtyMt: item.qtd, total: Math.round(unitPrice * item.qtd * 100) / 100 });
    }
  }
  if (invalidos.length) {
    res.status(400).json({ error: 'itens-invalidos', invalidos });
    return;
  }

  const subtotal = Math.round(linhas.reduce((s, l) => s + l.total, 0) * 100) / 100;

  // ------------------------------------------------- cupom e afiliado
  let desconto = 0;
  let afiliadoUserId: string | null = null;
  let afiliadoCodigo: string | null = null;
  let cupomValido: string | null = null;

  if (cupomCodigo) {
    const { data: c } = await site
      .from('cupons')
      .select('codigo, tipo, desconto_pct, desconto_valor, afiliado_user_id, ativo, valido_de, valido_ate, limite_usos, usos')
      .eq('codigo', cupomCodigo)
      .maybeSingle();
    const cupom = c as { codigo: string; desconto_pct: number | null; desconto_valor: number | null; afiliado_user_id: string | null; ativo: boolean; valido_de: string | null; valido_ate: string | null; limite_usos: number | null; usos: number } | null;
    const agora = Date.now();
    const ok =
      cupom &&
      cupom.ativo &&
      (!cupom.valido_de || Date.parse(cupom.valido_de) <= agora) &&
      (!cupom.valido_ate || Date.parse(cupom.valido_ate) >= agora) &&
      (cupom.limite_usos == null || cupom.usos < cupom.limite_usos) &&
      // Ninguém usa o próprio cupom de afiliado.
      cupom.afiliado_user_id !== userId;
    if (!ok) {
      res.status(400).json({ error: 'cupom-invalido' });
      return;
    }
    cupomValido = cupom.codigo;
    if (cupom.desconto_pct) desconto = Math.round(subtotal * (Number(cupom.desconto_pct) / 100) * 100) / 100;
    else if (cupom.desconto_valor) desconto = Math.min(subtotal, Number(cupom.desconto_valor));
    if (cupom.afiliado_user_id) {
      afiliadoUserId = cupom.afiliado_user_id;
      afiliadoCodigo = cupom.codigo;
    }
  }

  if (!afiliadoUserId) {
    afiliadoUserId = await resolverAfiliado(site, userId, perfil.indicado_por, visitante);
    if (afiliadoUserId) {
      const { data: af } = await site.from('afiliados').select('codigo').eq('user_id', afiliadoUserId).maybeSingle();
      afiliadoCodigo = (af as { codigo?: string } | null)?.codigo ?? null;
    }
  }

  const totalEstimado = Math.max(0, Math.round((subtotal - desconto) * 100) / 100);

  // -------------------------------------------------- grava rascunho
  const enderecoCompleto = [
    `${perfil.address_street}, ${perfil.address_number ?? 's/n'}${perfil.address_complement ? ` - ${perfil.address_complement}` : ''}`,
    perfil.address_neighborhood,
    `${perfil.address_city}/${perfil.address_state}`,
    `CEP ${perfil.address_zip}`,
  ]
    .filter(Boolean)
    .join(' · ');

  const { data: pedidoRow, error: pedErr } = await site
    .from('pedidos')
    .insert({
      user_id: userId,
      status: 'RASCUNHO',
      cupom: cupomValido,
      afiliado_user_id: afiliadoUserId,
      frete,
      endereco: {
        rua: perfil.address_street,
        numero: perfil.address_number,
        complemento: perfil.address_complement,
        bairro: perfil.address_neighborhood,
        cidade: perfil.address_city,
        uf: perfil.address_state,
        cep: perfil.address_zip,
      },
      observacoes: observacoes || null,
      total_estimado: totalEstimado,
    })
    .select('id, numero')
    .single();
  if (pedErr || !pedidoRow) {
    res.status(500).json({ error: 'nao-gravou-pedido', message: pedErr?.message });
    return;
  }
  const pedido = pedidoRow as { id: string; numero: number };

  const { error: itensErr } = await site.from('pedido_itens').insert(
    linhas.map((l) => ({
      pedido_id: pedido.id,
      produto_id: l.produto.id,
      erp_sku: l.e.sku,
      qtd: l.item.qtd,
      unidade: l.item.unidade,
      preco_unit_estimado: l.item.unidade === 'rolo' ? Number(l.e.preco_rolo) : l.unitPrice,
      lpns_solicitados: l.item.lpns ?? [],
    }))
  );
  if (itensErr) {
    await site.from('pedidos').delete().eq('id', pedido.id);
    res.status(500).json({ error: 'nao-gravou-itens', message: itensErr.message });
    return;
  }

  // ----------------------------------------------------- envia ao ERP
  const notas = [
    `Pedido #${pedido.numero} feito no site nzgroup.com.br por ${perfil.email ?? ''}.`,
    cupomValido ? `Cupom ${cupomValido}${desconto ? ` (desconto estimado R$ ${desconto.toFixed(2)})` : ''}.` : null,
    afiliadoCodigo ? `Indicado por ${afiliadoCodigo}.` : null,
    frete && typeof frete.prazoDias === 'number' ? `Frete estimado no site: ${frete.transportadora ?? ''} ${frete.prazoDias} dias úteis${typeof frete.valor === 'number' ? ` R$ ${Number(frete.valor).toFixed(2)}` : ''}.` : null,
    ...linhas.filter((l) => l.item.lpns?.length).map((l) => `${l.e.sku}: rolos pedidos ${l.item.lpns!.join(', ')}.`),
    observacoes ? `Obs. do cliente: ${observacoes}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const payload = {
    site_pedido_id: pedido.id,
    nome: perfil.full_name,
    empresa: perfil.company_name ?? '',
    cpf_cnpj: perfil.cpf_cnpj,
    ie: perfil.ie ?? '',
    email: perfil.email ?? '',
    telefone: perfil.phone,
    endereco: perfil.address_street,
    numero: perfil.address_number ?? '',
    complemento: perfil.address_complement ?? '',
    bairro: perfil.address_neighborhood ?? '',
    cidade: perfil.address_city,
    uf: perfil.address_state,
    cep: perfil.address_zip,
    endereco_completo: enderecoCompleto,
    items: linhas.map((l) => ({
      sku: l.e.sku,
      name: `${l.e.nome ?? l.produto.nome}${l.item.unidade === 'rolo' ? ` (${l.item.qtd} rolo${l.item.qtd > 1 ? 's' : ''} fechado${l.item.qtd > 1 ? 's' : ''})` : ''}`,
      qty: l.qtyMt,
      unit: 'MT',
      unitPrice: l.unitPrice,
      total: l.total,
      availabilityTag: Number(l.e.saldo_ml) > 0.01 ? 'ESTOQUE' : 'DROP',
    })),
    total: totalEstimado,
    shipping_type: 'FOB',
    shipping_cost: 0,
    notes: notas,
    cupom: cupomValido ?? '',
    afiliado_codigo: afiliadoCodigo ?? '',
  };

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
  if (cupomValido) {
    const { data: cu } = await site.from('cupons').select('usos').eq('codigo', cupomValido).maybeSingle();
    await site.from('cupons').update({ usos: Number((cu as { usos?: number } | null)?.usos ?? 0) + 1 }).eq('codigo', cupomValido);
  }

  res.status(200).json({ ok: true, numero: pedido.numero, erpQuoteNumber: r.quote_number, totalEstimado, desconto, afiliado: afiliadoCodigo });
}

/** cupom (já tratado) > indicado_por no cadastro > último clique do visitante. */
async function resolverAfiliado(site: Db, userId: string, indicadoPor: string | null, visitante: string): Promise<string | null> {
  const valido = async (id: string | null): Promise<string | null> => {
    if (!id || id === userId) return null;
    const { data } = await site.from('afiliados').select('user_id, ativo').eq('user_id', id).maybeSingle();
    const a = data as { user_id: string; ativo: boolean } | null;
    return a && a.ativo ? a.user_id : null;
  };
  const porCadastro = await valido(indicadoPor);
  if (porCadastro) return porCadastro;

  if (visitante) {
    const { data: cfg } = await site.from('loja_config').select('dias_atribuicao').eq('id', 1).maybeSingle();
    const dias = Number((cfg as { dias_atribuicao?: number } | null)?.dias_atribuicao ?? 30);
    const { data } = await site.from('atribuicoes').select('afiliado_user_id, ultimo_clique_em').eq('visitante_id', visitante).maybeSingle();
    const at = data as { afiliado_user_id: string; ultimo_clique_em: string } | null;
    if (at && Date.now() - Date.parse(at.ultimo_clique_em) <= dias * 86400000) {
      return valido(at.afiliado_user_id);
    }
  }
  return null;
}

function safeJson(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
