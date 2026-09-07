// POST /api/nz/checkout — pagamento online do pedido (Pix, boleto, cartão) via Asaas.
//
// Ops (campo `op` do corpo), todas exigem login e cadastro aprovado:
//   resumo         itens + cupom + cep → subtotal, desconto, opções de frete
//                  (COM valor: é o checkout), parcelas e o que falta no cadastro.
//   pagar          fecha o pedido: reprecifica, recota o frete escolhido, grava
//                  pedido + itens, cria a cobrança no Asaas, manda ao NZERP.
//   status         estado do pedido e do pagamento (a página faz polling).
//   novo-pagamento pedido com Pix expirado / cartão recusado / boleto vencido
//                  ganha outra cobrança, possivelmente de outra forma.
//
// Segurança:
//   · valor nunca vem do cliente — subtotal, desconto e frete são recalculados
//     no `pagar`, mesmo que o `resumo` tenha acabado de mostrar;
//   · dados de cartão entram aqui, vão ao Asaas e morrem; não são gravados,
//     não são logados; a resposta é no-store;
//   · 3 tentativas de cartão por usuário a cada 15 min e 10 por IP por hora
//     (checkout_tentativas) — contra teste de cartão roubado;
//   · checkout desligado (loja_config.checkout_ativo) só o admin usa, para
//     testar antes de abrir.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { resolverPapelDetalhado, type Db } from '../papel.js';
import { asaasConfigurado, asaasEnv, consultarCobranca, criarWebhook, estornarCobranca, ipDoCliente, listarWebhooks, removerCobranca } from '../asaas/cliente.js';
import { manutencaoCheckout } from '../asaas/manutencao.js';
import {
  aplicarStatus,
  carregarConfig,
  criarPagamento,
  expirarSeVencido,
  garantirClienteAsaas,
  pagamentoPublico,
  parcelasDisponiveis,
  sincronizarComAsaas,
  type ConfigCheckout,
  type DadosCartao,
  type PagamentoRow,
} from '../asaas/pagamento.js';
import { despacharAoErp, dispensarDoErp } from '../pedido/despachoErp.js';
import { cotarCarrinho, type OpcaoFrete } from '../frete/carrinho.js';
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
  type Linha,
  type Perfil,
} from '../pedido/precificar.js';

const FORMAS = new Set(['PIX', 'BOLETO', 'CREDIT_CARD']);
const r2 = (n: number) => Math.round(n * 100) / 100;

const FORMA_LABEL: Record<string, string> = { PIX: 'Pix', BOLETO: 'boleto', CREDIT_CARD: 'cartão de crédito' };

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
  const op = typeof body.op === 'string' ? body.op : '';
  const cfg = await carregarConfig(site);

  if (op === 'status') {
    await opStatus(site, userId, papel === 'admin', body, res);
    return;
  }
  if (op === 'cancelar') {
    await opCancelar(site, userId, papel === 'admin', body, res);
    return;
  }
  if (op === 'estornar' || op === 'webhook' || op === 'manutencao' || op === 'saude' || op === 'remover-cobranca' || op === 'enviar-erp' || op === 'fila-erp') {
    if (papel !== 'admin') {
      res.status(403).json({ error: 'so-admin' });
      return;
    }
    try {
      await opsAdmin(site, op, body, res);
    } catch (err) {
      console.error('[checkout] admin op falhou:', op, err instanceof Error ? err.message : err);
      if (!res.headersSent) res.status(502).json({ error: 'asaas-falhou', message: err instanceof Error ? err.message : String(err) });
    }
    return;
  }

  if (!cfg.checkout_ativo && papel !== 'admin') {
    res.status(403).json({ error: 'checkout-desligado' });
    return;
  }
  if (!asaasConfigurado()) {
    res.status(503).json({ error: 'pagamento-indisponivel', hasAsaasKey: false });
    return;
  }

  try {
    if (op === 'resumo') await opResumo(site, userId, body, cfg, res);
    else if (op === 'pagar') await opPagar(site, userId, body, cfg, req, res);
    else if (op === 'novo-pagamento') await opNovoPagamento(site, userId, body, cfg, req, res);
    else res.status(400).json({ error: 'op-desconhecida', disponiveis: ['resumo', 'pagar', 'status', 'novo-pagamento'] });
  } catch (err) {
    console.error('[checkout] erro:', op, err instanceof Error ? err.message : err);
    if (!res.headersSent) res.status(500).json({ error: 'erro-interno' });
  }
}

// ================================================================ resumo

async function opResumo(site: Db, userId: string, body: Record<string, unknown>, cfg: ConfigCheckout, res: VercelResponse) {
  const itens = normalizarItens(body.itens);
  if (!itens.length) {
    res.status(400).json({ error: 'sem-itens' });
    return;
  }
  const { perfil, faltando } = await carregarPerfil(site, userId);
  const { linhas, invalidos, subtotal } = await precificar(site, itens);
  const cupom = await resolverCupom(site, typeof body.cupom === 'string' ? body.cupom : '', subtotal, userId);
  const cepBruto = typeof body.cep === 'string' ? body.cep : perfil?.address_zip ?? '';
  const cep = cepBruto.replace(/\D/g, '');

  const frete = linhas.length ? await cotarCarrinho(site, linhas, cep, subtotal - cupom.desconto, cfg) : { opcoes: [], semPerfil: [], motivos: [] };
  const totalSemFrete = r2(Math.max(0, subtotal - cupom.desconto));

  res.status(200).json({
    checkoutAtivo: cfg.checkout_ativo,
    itens: linhas.map((l) => ({ slug: l.produto.slug, nome: l.produto.nome, unidade: l.item.unidade, qtd: l.item.qtd, unit: l.item.unidade === 'rolo' ? Number(l.e.preco_rolo) : l.unitPrice, total: l.total, metragem: l.e.metragem_padrao })),
    invalidos,
    subtotal,
    desconto: cupom.desconto,
    cupom: { codigo: cupom.codigo, invalido: cupom.invalido },
    fretes: frete.opcoes,
    freteSemPerfil: frete.semPerfil,
    parcelas: parcelasDisponiveis(totalSemFrete, cfg).map((p) => ({ n: p.n, valor: p.valor })),
    config: {
      pixExpiraMin: cfg.pix_expira_min,
      boletoVencimentoDias: cfg.boleto_vencimento_dias,
      boletoMinimo: cfg.boleto_minimo,
      cartaoMaxParcelas: cfg.cartao_max_parcelas,
      cartaoParcelaMinima: cfg.cartao_parcela_minima,
      retiradaEndereco: cfg.retirada_endereco,
      pedidoMinimo: cfg.pedido_minimo,
      freteGratisAcima: cfg.frete_gratis_acima,
    },
    faltando,
    endereco: perfil ? enderecoJson(perfil) : null,
  });
}

// ================================================================= pagar

interface Escolha {
  forma: 'PIX' | 'BOLETO' | 'CREDIT_CARD';
  parcelas: number;
  cartao?: DadosCartao;
}

function lerEscolha(body: Record<string, unknown>): Escolha | { erro: string } {
  const forma = typeof body.forma === 'string' ? body.forma : '';
  if (!FORMAS.has(forma)) return { erro: 'forma-invalida' };
  const parcelas = forma === 'CREDIT_CARD' ? Math.max(1, Math.floor(Number(body.parcelas ?? 1)) || 1) : 1;
  let cartao: DadosCartao | undefined;
  if (forma === 'CREDIT_CARD') {
    const c = body.cartao && typeof body.cartao === 'object' ? (body.cartao as Record<string, unknown>) : null;
    const numero = String(c?.numero ?? '').replace(/\D/g, '');
    const nome = String(c?.nome ?? '').trim().slice(0, 80);
    const mes = String(c?.mes ?? '').replace(/\D/g, '').padStart(2, '0');
    let ano = String(c?.ano ?? '').replace(/\D/g, '');
    if (ano.length === 2) ano = `20${ano}`;
    const cvv = String(c?.cvv ?? '').replace(/\D/g, '');
    const cpf = String(c?.cpf ?? '').replace(/\D/g, '');
    if (numero.length < 13 || numero.length > 19 || !nome || !/^(0[1-9]|1[0-2])$/.test(mes) || ano.length !== 4 || cvv.length < 3 || cvv.length > 4 || ![11, 14].includes(cpf.length)) {
      return { erro: 'cartao-invalido' };
    }
    cartao = { numero, nome, mes, ano, cvv, cpf };
  }
  return { forma: forma as Escolha['forma'], parcelas, cartao };
}

async function limiteCartao(site: Db, userId: string, ip: string): Promise<boolean> {
  const quinze = new Date(Date.now() - 15 * 60_000).toISOString();
  const hora = new Date(Date.now() - 60 * 60_000).toISOString();
  const [{ count: porUser }, { count: porIp }] = await Promise.all([
    site.from('checkout_tentativas').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('forma', 'CREDIT_CARD').gte('criado_em', quinze),
    site.from('checkout_tentativas').select('id', { count: 'exact', head: true }).eq('ip', ip).eq('forma', 'CREDIT_CARD').gte('criado_em', hora),
  ]);
  return Number(porUser ?? 0) >= 3 || Number(porIp ?? 0) >= 10;
}

async function opPagar(site: Db, userId: string, body: Record<string, unknown>, cfg: ConfigCheckout, req: VercelRequest, res: VercelResponse) {
  const itens = normalizarItens(body.itens);
  if (!itens.length) {
    res.status(400).json({ error: 'sem-itens' });
    return;
  }
  const escolha = lerEscolha(body);
  if ('erro' in escolha) {
    res.status(400).json({ error: escolha.erro });
    return;
  }
  if (body.aceite !== true) {
    res.status(400).json({ error: 'aceite-necessario' });
    return;
  }
  const ip = ipDoCliente(req.headers as Record<string, string | string[] | undefined>);

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

  // ---------------------------------------------------------------- frete
  const freteId = typeof body.freteId === 'string' ? body.freteId : '';
  const cep = (perfil.address_zip ?? '').replace(/\D/g, '');
  const cotacao = await cotarCarrinho(site, linhas, cep, subtotal - cupom.desconto, cfg);
  const frete = cotacao.opcoes.find((o) => o.id === freteId);
  if (!frete) {
    res.status(409).json({ error: 'frete-indisponivel', fretes: cotacao.opcoes, semPerfil: cotacao.semPerfil });
    return;
  }

  const total = r2(Math.max(0, subtotal - cupom.desconto) + frete.valor);
  if (total < Math.max(0.01, cfg.pedido_minimo)) {
    res.status(400).json({ error: 'pedido-minimo', minimo: cfg.pedido_minimo });
    return;
  }
  if (escolha.forma === 'BOLETO' && total < cfg.boleto_minimo) {
    res.status(400).json({ error: 'boleto-minimo', minimo: cfg.boleto_minimo });
    return;
  }
  if (escolha.forma === 'CREDIT_CARD') {
    const ok = parcelasDisponiveis(total, cfg).some((p) => p.n === escolha.parcelas);
    if (!ok) {
      res.status(400).json({ error: 'parcelas-invalidas' });
      return;
    }
    if (await limiteCartao(site, userId, ip)) {
      res.status(429).json({ error: 'muitas-tentativas' });
      return;
    }
  }

  // ------------------------------------------------------------- afiliado
  let afiliadoUserId = cupom.afiliadoUserId;
  if (!afiliadoUserId) {
    afiliadoUserId = await resolverAfiliado(site, userId, perfil.indicado_por, typeof body.visitante === 'string' ? body.visitante.slice(0, 80) : '');
  }
  const afiliadoCodigo = await codigoDoAfiliado(site, afiliadoUserId);
  const observacoes = typeof body.observacoes === 'string' ? body.observacoes.trim().slice(0, 1000) : '';

  // ------------------------------------------------------ cliente no Asaas
  let asaasCustomerId: string;
  try {
    asaasCustomerId = await garantirClienteAsaas(site, userId, perfil);
  } catch (err) {
    console.error('[checkout] cliente Asaas:', err instanceof Error ? err.message : err);
    res.status(502).json({ error: 'pagamento-indisponivel', message: err instanceof Error ? err.message : 'Asaas indisponível' });
    return;
  }

  // --------------------------------------------------------- grava pedido
  const { data: pedidoRow, error: pedErr } = await site
    .from('pedidos')
    .insert({
      user_id: userId,
      status: 'RASCUNHO',
      pagamento_status: 'aguardando',
      forma_pagamento: escolha.forma,
      cupom: cupom.codigo,
      afiliado_user_id: afiliadoUserId,
      frete: { id: frete.id, nome: frete.nome, dias: frete.dias, valor: frete.valor, retirada: Boolean(frete.retirada), transportadora: frete.transportadora ?? null, servico: frete.servico ?? null },
      valor_frete: frete.valor,
      desconto: cupom.desconto,
      total_estimado: r2(subtotal - cupom.desconto),
      total_final: total,
      endereco: enderecoJson(perfil),
      observacoes: observacoes || null,
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

  // ------------------------------------------------------------ cobrança
  if (escolha.forma === 'CREDIT_CARD') {
    await site.from('checkout_tentativas').insert({ user_id: userId, ip, forma: 'CREDIT_CARD', resultado: 'tentativa' });
  }
  const cobranca = await criarPagamento(site, {
    pedido,
    perfil,
    asaasCustomerId,
    forma: escolha.forma,
    total,
    parcelas: escolha.parcelas,
    cartao: escolha.cartao,
    ip,
    cfg,
  });
  if (!cobranca.ok) {
    await site.from('pedidos').delete().eq('id', pedido.id);
    if (cobranca.erro === 'cartao-recusado') {
      await site.from('checkout_tentativas').insert({ user_id: userId, ip, forma: 'CREDIT_CARD', resultado: 'recusado' });
      res.status(402).json({ error: 'cartao-recusado', message: cobranca.mensagem });
    } else {
      res.status(502).json({ error: 'pagamento-indisponivel', message: cobranca.mensagem });
    }
    return;
  }
  if (escolha.forma === 'CREDIT_CARD') {
    await site.from('checkout_tentativas').insert({ user_id: userId, ip, forma: 'CREDIT_CARD', resultado: cobranca.pagamento.status });
  }

  // ------------------------------------------------------------------ ERP
  const notas = [
    `Pedido #${pedido.numero} feito no site nzgroup.com.br por ${perfil.email ?? ''}.`,
    `PAGAMENTO ONLINE (Asaas): ${FORMA_LABEL[escolha.forma]}${escolha.parcelas > 1 ? ` em ${escolha.parcelas}x` : ''} — ${cobranca.pagamento.status === 'pago' ? 'PAGO' : 'aguardando pagamento'}. Total R$ ${total.toFixed(2)}.`,
    frete.retirada ? 'Entrega: RETIRADA em São Paulo.' : `Frete: ${frete.nome} — ${frete.dias} dias úteis — R$ ${frete.valor.toFixed(2)} (cobrado do cliente).`,
    cupom.codigo ? `Cupom ${cupom.codigo}${cupom.desconto ? ` (desconto R$ ${cupom.desconto.toFixed(2)})` : ''}.` : null,
    afiliadoCodigo ? `Indicado por ${afiliadoCodigo}.` : null,
    ...linhas.filter((l) => l.item.lpns?.length).map((l) => `${l.e.sku}: rolos pedidos ${l.item.lpns!.join(', ')}.`),
    observacoes ? `Obs. do cliente: ${observacoes}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const payloadErp = montarPayloadErp({
    pedidoId: pedido.id,
    siteUserId: userId,
    perfil,
    linhas,
    total,
    notas,
    cupom: cupom.codigo,
    afiliadoCodigo,
    frete: { tipo: frete.retirada ? 'RETIRADA' : 'CIF', valor: frete.valor, transportadora: frete.nome, prazoDias: frete.dias },
  });
  await site.from('pedidos').update({ erp_payload: payloadErp }).eq('id', pedido.id);

  // O ERP só é chamado se a cobrança JÁ nasceu paga (cartão aprovado na hora).
  // Pix e boleto saem daqui com `nao-pago`, de propósito: o orçamento nasce no
  // webhook, quando o dinheiro entra. O payload fica guardado esperando.
  let erpQuoteNumber: number | null = null;
  let erpErro: string | null = null;
  try {
    const d = await despacharAoErp(site, pedido.id, 'pago');
    erpQuoteNumber = d.quoteNumber ?? null;
    if (!d.ok && d.estado === 'erro') erpErro = d.message ?? 'erp-falhou';
  } catch (err) {
    // A cobrança já existe: o pedido NÃO pode falhar por causa do ERP. O cron
    // (e o próximo `status`) reenviam com o payload guardado.
    erpErro = err instanceof Error ? err.message : String(err);
  }
  if (erpErro) console.warn('[checkout] ERP não recebeu o pedido agora:', erpErro);

  res.status(200).json({
    ok: true,
    numero: pedido.numero,
    total,
    subtotal,
    desconto: cupom.desconto,
    frete: { id: frete.id, nome: frete.nome, dias: frete.dias, valor: frete.valor, retirada: Boolean(frete.retirada) },
    erpQuoteNumber,
    erpPendente: Boolean(erpErro),
    pagamento: pagamentoPublico(cobranca.pagamento),
  });
}

// ================================================================ status

async function carregarPedidoDoUsuario(site: Db, userId: string, admin: boolean, numero: number) {
  let q = site
    .from('pedidos')
    .select('id, numero, user_id, status, pagamento_status, forma_pagamento, cupom, frete, endereco, observacoes, valor_frete, desconto, total_estimado, total_final, total_erp, erp_quote_number, erp_quote_id, erp_payload, erp_pago_em, pago_em, criado_em')
    .eq('numero', numero);
  if (!admin) q = q.eq('user_id', userId);
  const { data } = await q.maybeSingle();
  return data as {
    id: string;
    numero: number;
    user_id: string;
    status: string;
    pagamento_status: string;
    forma_pagamento: string | null;
    cupom: string | null;
    frete: Record<string, unknown> | null;
    endereco: Record<string, unknown> | null;
    observacoes: string | null;
    valor_frete: number;
    desconto: number;
    total_estimado: number | null;
    total_final: number | null;
    total_erp: number | null;
    erp_quote_number: number | null;
    erp_quote_id: string | null;
    erp_payload: unknown;
    erp_pago_em: string | null;
    pago_em: string | null;
    criado_em: string;
  } | null;
}

async function opStatus(site: Db, userId: string, admin: boolean, body: Record<string, unknown>, res: VercelResponse) {
  const numero = Math.floor(Number(body.numero));
  if (!Number.isFinite(numero) || numero <= 0) {
    res.status(400).json({ error: 'numero-invalido' });
    return;
  }
  const pedido = await carregarPedidoDoUsuario(site, userId, admin, numero);
  if (!pedido) {
    res.status(404).json({ error: 'pedido-nao-encontrado' });
    return;
  }

  const { data: pagsData } = await site.from('pagamentos').select('*').eq('pedido_id', pedido.id).order('criado_em', { ascending: false });
  let pagamentos = (pagsData ?? []) as PagamentoRow[];
  if (pagamentos.length) {
    // O mais recente é o que vale; os outros ficam no histórico.
    let atual = pagamentos[0];
    atual = await expirarSeVencido(site, atual);
    atual = await sincronizarComAsaas(site, atual);
    pagamentos = [atual, ...pagamentos.slice(1)];
    pedido.pagamento_status = atual.status === 'pago' || pedido.pagamento_status === 'pago' ? 'pago' : atual.status;
  }

  // ERP ficou para trás (estava fora quando o pagamento entrou)? Tenta agora,
  // em silêncio. Só para pedido PAGO: é a regra do projeto.
  if (pedido.pagamento_status === 'pago' && (!pedido.erp_quote_id || !pedido.erp_pago_em)) {
    await despacharAoErp(site, pedido.id, 'pago').catch(() => undefined);
    const de = await carregarPedidoDoUsuario(site, userId, admin, numero);
    if (de) {
      pedido.erp_quote_number = de.erp_quote_number;
      pedido.status = de.status;
    }
  }

  const { data: itensData } = await site
    .from('pedido_itens')
    .select('qtd, unidade, preco_unit_estimado, erp_sku, produtos(slug, nome, codigo, imagem, hex)')
    .eq('pedido_id', pedido.id);
  type ItemRow = { qtd: number; unidade: string; preco_unit_estimado: number | null; erp_sku: string; produtos: { slug: string; nome: string; codigo: string | null; imagem: string | null; hex: string | null } | null };
  const itens = ((itensData ?? []) as unknown as ItemRow[]).map((i) => ({
    slug: i.produtos?.slug ?? null,
    nome: i.produtos?.nome ?? i.erp_sku,
    codigo: i.produtos?.codigo ?? null,
    imagem: i.produtos?.imagem ?? null,
    hex: i.produtos?.hex ?? null,
    qtd: Number(i.qtd),
    unidade: i.unidade,
    unit: i.preco_unit_estimado != null ? Number(i.preco_unit_estimado) : null,
  }));

  res.status(200).json({
    pedido: {
      numero: pedido.numero,
      status: pedido.status,
      pagamentoStatus: pedido.pagamento_status,
      forma: pedido.forma_pagamento,
      cupom: pedido.cupom,
      frete: pedido.frete,
      endereco: pedido.endereco,
      valorFrete: Number(pedido.valor_frete ?? 0),
      desconto: Number(pedido.desconto ?? 0),
      total: pedido.total_final != null ? Number(pedido.total_final) : pedido.total_estimado != null ? Number(pedido.total_estimado) : null,
      erpQuoteNumber: pedido.erp_quote_number,
      pagoEm: pedido.pago_em,
      criadoEm: pedido.criado_em,
      itens,
    },
    pagamento: pagamentos.length ? pagamentoPublico(pagamentos[0]) : null,
    historico: pagamentos.slice(1).map(pagamentoPublico),
    agora: new Date().toISOString(),
  });
}

// ======================================================== novo-pagamento

async function opNovoPagamento(site: Db, userId: string, body: Record<string, unknown>, cfg: ConfigCheckout, req: VercelRequest, res: VercelResponse) {
  const numero = Math.floor(Number(body.numero));
  const pedido = await carregarPedidoDoUsuario(site, userId, false, numero);
  if (!pedido) {
    res.status(404).json({ error: 'pedido-nao-encontrado' });
    return;
  }
  if (!['expirado', 'recusado', 'vencido', 'cancelado'].includes(pedido.pagamento_status) || pedido.total_final == null) {
    res.status(409).json({ error: 'pedido-nao-aceita-novo-pagamento', pagamentoStatus: pedido.pagamento_status });
    return;
  }
  const escolha = lerEscolha(body);
  if ('erro' in escolha) {
    res.status(400).json({ error: escolha.erro });
    return;
  }
  const total = Number(pedido.total_final);
  const ip = ipDoCliente(req.headers as Record<string, string | string[] | undefined>);
  if (escolha.forma === 'BOLETO' && total < cfg.boleto_minimo) {
    res.status(400).json({ error: 'boleto-minimo', minimo: cfg.boleto_minimo });
    return;
  }
  if (escolha.forma === 'CREDIT_CARD') {
    if (!parcelasDisponiveis(total, cfg).some((p) => p.n === escolha.parcelas)) {
      res.status(400).json({ error: 'parcelas-invalidas' });
      return;
    }
    if (await limiteCartao(site, userId, ip)) {
      res.status(429).json({ error: 'muitas-tentativas' });
      return;
    }
  }
  const { perfil, faltando } = await carregarPerfil(site, userId);
  if (!perfil || faltando.length) {
    res.status(400).json({ error: 'cadastro-incompleto', faltando });
    return;
  }
  const asaasCustomerId = await garantirClienteAsaas(site, userId, perfil);

  if (escolha.forma === 'CREDIT_CARD') await site.from('checkout_tentativas').insert({ user_id: userId, ip, forma: 'CREDIT_CARD', resultado: 'tentativa' });
  const cobranca = await criarPagamento(site, { pedido: { id: pedido.id, numero: pedido.numero }, perfil, asaasCustomerId, forma: escolha.forma, total, parcelas: escolha.parcelas, cartao: escolha.cartao, ip, cfg });
  if (!cobranca.ok) {
    if (cobranca.erro === 'cartao-recusado') {
      await site.from('checkout_tentativas').insert({ user_id: userId, ip, forma: 'CREDIT_CARD', resultado: 'recusado' });
      res.status(402).json({ error: 'cartao-recusado', message: cobranca.mensagem });
    } else res.status(502).json({ error: 'pagamento-indisponivel', message: cobranca.mensagem });
    return;
  }
  await site.from('pedidos').update({ forma_pagamento: escolha.forma, pagamento_status: cobranca.pagamento.status }).eq('id', pedido.id);
  res.status(200).json({ ok: true, numero: pedido.numero, pagamento: pagamentoPublico(cobranca.pagamento) });
}

// =============================================================== cancelar

/**
 * Cancela o pagamento EM ABERTO de um pedido (Pix/boleto aguardando): remove a
 * cobrança no Asaas e marca cancelado. O dono pode (desistiu antes de pagar);
 * o admin também. Pagamento pago não passa por aqui — é estorno.
 */
/**
 * Cancelar um pedido que o cliente ainda não pagou.
 *
 * Duas coisas, nesta ordem, porque a segunda depende da primeira: derrubar a
 * cobrança em aberto no Asaas (senão o Pix continuaria pagável depois de
 * cancelado) e cancelar o ORÇAMENTO NO ERP.
 *
 * Por que o ERP e não só a linha do site: quem manda no status do pedido é o
 * orçamento lá, e o sync espelha esse status a cada 5 minutos. Um "cancelado"
 * gravado só aqui voltaria a ABERTO sozinho no ciclo seguinte.
 *
 * O ERP recusa cancelar o que já entrou na operação (APROVADO em diante) — a
 * essa altura houve separação, nota ou coleta, e desfazer é decisão de vendedor.
 */
async function opCancelar(site: Db, userId: string, admin: boolean, body: Record<string, unknown>, res: VercelResponse) {
  const numero = Math.floor(Number(body.numero));
  const motivo = typeof body.motivo === 'string' ? body.motivo.slice(0, 300) : '';
  const pedido = await carregarPedidoDoUsuario(site, userId, admin, numero);
  if (!pedido) {
    res.status(404).json({ error: 'pedido-nao-encontrado' });
    return;
  }
  if (pedido.pagamento_status === 'pago') {
    res.status(409).json({ error: 'ja-pago' });
    return;
  }

  // ------------------------------------------------- 1. cobranças em aberto
  const { data } = await site
    .from('pagamentos')
    .select('*')
    .eq('pedido_id', pedido.id)
    .in('status', ['aguardando'])
    .order('criado_em', { ascending: false });
  const abertos = (data ?? []) as PagamentoRow[];
  for (const p of abertos) {
    if (p.asaas_payment_id) {
      try {
        const atual = await consultarCobranca(p.asaas_payment_id);
        if (['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH'].includes(atual.status)) {
          // Pagou no meio do caminho: não cancela nada, marca pago.
          await aplicarStatus(site, p, 'pago', 'cancelar-mas-pago', atual);
          res.status(409).json({ error: 'ja-pago' });
          return;
        }
        if (!atual.deleted) await removerCobranca(p.asaas_payment_id);
      } catch (err) {
        res.status(502).json({ error: 'asaas-falhou', message: err instanceof Error ? err.message : String(err) });
        return;
      }
    }
    await aplicarStatus(site, p, 'cancelado', admin ? 'cancelado-admin' : 'cancelado-cliente');
  }

  // Pedido só de orçamento (sem cobrança) também pode ser cancelado — é o caso
  // mais comum enquanto o pagamento online está desligado.
  if (!body.pedidoTambem && abertos.length === 0) {
    res.status(409).json({ error: 'sem-pagamento-em-aberto', pagamentoStatus: pedido.pagamento_status });
    return;
  }
  if (!body.pedidoTambem) {
    res.status(200).json({ ok: true, cancelados: abertos.length });
    return;
  }

  // ------------------------------------------------------- 2. pedido no ERP
  const erpUrl = process.env.ERP_SUPABASE_URL;
  const erpKey = process.env.ERP_SUPABASE_SERVICE_ROLE_KEY;
  if (!erpUrl || !erpKey) {
    res.status(503).json({ error: 'erp-indisponivel', cobrancasCanceladas: abertos.length });
    return;
  }
  const erp = createClient(erpUrl, erpKey);
  const { data: rpc, error: rpcErr } = await erp.rpc('site_cancelar_pedido', {
    p_site_pedido_id: pedido.id,
    p_motivo: motivo,
  });
  if (rpcErr) {
    res.status(502).json({ error: 'erp-indisponivel', message: rpcErr.message, cobrancasCanceladas: abertos.length });
    return;
  }
  const r = (rpc ?? {}) as { ok?: boolean; motivo?: string; status?: string };
  if (!r.ok) {
    // 'fase-avancada' = o vendedor já mexeu; 'nao-encontrado' = o orçamento
    // nunca chegou ao ERP (envio falhou), e aí o site pode cancelar sozinho.
    if (r.motivo === 'nao-encontrado') {
      await site
        .from('pedidos')
        .update({ status: 'CANCELADO', status_atualizado_em: new Date().toISOString() })
        .eq('id', pedido.id);
      // Nunca chegou ao ERP e não vai mais: sai da fila do cron.
      await dispensarDoErp(site, pedido.id);
      res.status(200).json({ ok: true, cancelados: abertos.length, pedido: 'CANCELADO', semErp: true });
      return;
    }
    res.status(409).json({ error: r.motivo ?? 'nao-cancelavel', status: r.status, cobrancasCanceladas: abertos.length });
    return;
  }

  await site
    .from('pedidos')
    .update({ status: 'CANCELADO', status_atualizado_em: new Date().toISOString() })
    .eq('id', pedido.id);
  await dispensarDoErp(site, pedido.id);
  res.status(200).json({ ok: true, cancelados: abertos.length, pedido: 'CANCELADO' });
}

// ================================================================= admin

const WEBHOOK_NOME = 'NZSTORE';
const WEBHOOK_URL = 'https://www.nzgroup.com.br/api/nz/asaas';
const WEBHOOK_EVENTOS = [
  'PAYMENT_CREATED',
  'PAYMENT_AWAITING_RISK_ANALYSIS',
  'PAYMENT_APPROVED_BY_RISK_ANALYSIS',
  'PAYMENT_REPROVED_BY_RISK_ANALYSIS',
  'PAYMENT_AUTHORIZED',
  'PAYMENT_UPDATED',
  'PAYMENT_CONFIRMED',
  'PAYMENT_RECEIVED',
  'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED',
  'PAYMENT_OVERDUE',
  'PAYMENT_DELETED',
  'PAYMENT_RESTORED',
  'PAYMENT_REFUNDED',
  'PAYMENT_PARTIALLY_REFUNDED',
  'PAYMENT_REFUND_IN_PROGRESS',
  'PAYMENT_CHARGEBACK_REQUESTED',
  'PAYMENT_CHARGEBACK_DISPUTE',
  'PAYMENT_AWAITING_CHARGEBACK_REVERSAL',
  'PAYMENT_BANK_SLIP_CANCELLED',
];

async function opsAdmin(site: Db, op: string, body: Record<string, unknown>, res: VercelResponse) {
  if (op === 'saude') {
    // Nunca devolve a chave nem o token: só se existem e se o webhook está de pé.
    const webhooks = await listarWebhooks().catch((e: Error) => ({ erro: e.message }));
    const lista = Array.isArray(webhooks) ? webhooks : [];
    const nosso = lista.find((w) => w.url === WEBHOOK_URL);
    const { data: ultimo } = await site.from('asaas_eventos').select('id, evento, recebido_em, processado_em, erro').order('recebido_em', { ascending: false }).limit(1).maybeSingle();
    const { count: comErro } = await site.from('asaas_eventos').select('id', { count: 'exact', head: true }).not('erro', 'is', null);
    res.status(200).json({
      ambiente: asaasEnv(),
      hasAsaasKey: asaasConfigurado(),
      hasWebhookToken: Boolean(process.env.ASAAS_WEBHOOK_TOKEN),
      chaveOk: Array.isArray(webhooks),
      chaveErro: Array.isArray(webhooks) ? null : (webhooks as { erro: string }).erro,
      webhook: nosso ? { id: nosso.id, enabled: nosso.enabled, interrupted: nosso.interrupted, eventos: nosso.events.length } : null,
      outrosWebhooks: lista.filter((w) => w.url !== WEBHOOK_URL).map((w) => ({ name: w.name, url: w.url, enabled: w.enabled, interrupted: w.interrupted })),
      ultimoEvento: ultimo ?? null,
      eventosComErro: Number(comErro ?? 0),
    });
    return;
  }

  if (op === 'webhook') {
    const token = process.env.ASAAS_WEBHOOK_TOKEN;
    if (!token) {
      res.status(500).json({ error: 'ENV ausente', hasWebhookToken: false });
      return;
    }
    const existentes = await listarWebhooks();
    const nosso = existentes.find((w) => w.url === WEBHOOK_URL);
    if (nosso) {
      res.status(200).json({ ok: true, criado: false, webhook: { id: nosso.id, enabled: nosso.enabled, interrupted: nosso.interrupted, eventos: nosso.events.length } });
      return;
    }
    const criado = await criarWebhook({ name: WEBHOOK_NOME, url: WEBHOOK_URL, email: 'joaovitor@nzdistribuidora.com.br', authToken: token, events: WEBHOOK_EVENTOS });
    res.status(200).json({ ok: true, criado: true, webhook: { id: criado.id, enabled: criado.enabled, interrupted: criado.interrupted, eventos: criado.events?.length ?? WEBHOOK_EVENTOS.length } });
    return;
  }

  if (op === 'remover-cobranca') {
    // Cobrança órfã no Asaas (teste, pedido apagado): só remove se a loja não a
    // conhece como paga.
    const id = typeof body.asaasPaymentId === 'string' ? body.asaasPaymentId.trim() : '';
    if (!/^pay_[a-z0-9]+$/i.test(id)) {
      res.status(400).json({ error: 'id-invalido' });
      return;
    }
    const { data: conhecida } = await site.from('pagamentos').select('status').eq('asaas_payment_id', id).maybeSingle();
    if ((conhecida as { status?: string } | null)?.status === 'pago') {
      res.status(409).json({ error: 'cobranca-paga-use-estorno' });
      return;
    }
    const atual = await consultarCobranca(id);
    if (['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH'].includes(atual.status)) {
      res.status(409).json({ error: 'cobranca-paga-no-asaas', status: atual.status });
      return;
    }
    if (!atual.deleted) await removerCobranca(id);
    if (conhecida) await site.from('pagamentos').update({ status: 'cancelado', ultimo_evento: 'removida-admin', atualizado_em: new Date().toISOString() }).eq('asaas_payment_id', id);
    res.status(200).json({ ok: true, removida: !atual.deleted, statusAntes: atual.status, valor: atual.value });
    return;
  }

  if (op === 'manutencao') {
    const r = await manutencaoCheckout(site);
    res.status(200).json({ ok: true, ...r });
    return;
  }

  // A fila do vendedor: o que está esperando para ir ao NZERP e por quê.
  if (op === 'fila-erp') {
    const { data } = await site
      .from('pedidos')
      .select('id, numero, status, pagamento_status, total_estimado, total_final, criado_em, erp_envio, erp_envio_em, erp_envio_erro, erp_quote_number, user_id')
      .neq('erp_envio', 'enviado')
      .neq('erp_envio', 'dispensado')
      .not('erp_payload', 'is', null)
      .neq('status', 'CANCELADO')
      .order('criado_em', { ascending: false })
      .limit(100);
    const linhas = (data ?? []) as { user_id: string | null }[];
    const ids = [...new Set(linhas.map((l) => l.user_id).filter(Boolean))] as string[];
    const { data: perfis } = ids.length
      ? await site.from('user_profiles').select('id, full_name, company_name, email').in('id', ids)
      : { data: [] };
    const porId = new Map((perfis ?? []).map((p) => [(p as { id: string }).id, p as { full_name?: string; company_name?: string; email?: string }]));
    res.status(200).json({
      ok: true,
      pedidos: (data ?? []).map((p) => {
        const d = p as Record<string, unknown>;
        const u = d.user_id ? porId.get(String(d.user_id)) : undefined;
        return {
          id: d.id,
          numero: d.numero,
          status: d.status,
          pagamentoStatus: d.pagamento_status,
          total: d.total_final ?? d.total_estimado,
          criadoEm: d.criado_em,
          erpEnvio: d.erp_envio,
          erpEnvioEm: d.erp_envio_em,
          erpErro: d.erp_envio_erro,
          cliente: u?.company_name || u?.full_name || u?.email || null,
        };
      }),
    });
    return;
  }

  // "Enviar ao NZERP": o vendedor assume um pedido que não foi pago online
  // (SOLICITADO) ou um pago que ficou para trás. É a única porta por onde um
  // pedido não pago chega ao ERP, e ela tem nome e dono.
  if (op === 'enviar-erp') {
    const numero = Math.floor(Number(body.numero));
    if (!Number.isFinite(numero) || numero <= 0) {
      res.status(400).json({ error: 'numero-invalido' });
      return;
    }
    const { data: ped } = await site.from('pedidos').select('id, numero, status, erp_quote_number').eq('numero', numero).maybeSingle();
    const pedido = ped as { id: string; numero: number; status: string; erp_quote_number: number | null } | null;
    if (!pedido) {
      res.status(404).json({ error: 'pedido-nao-encontrado' });
      return;
    }
    const d = await despacharAoErp(site, pedido.id, 'admin');
    if (!d.ok) {
      const CODIGO: Partial<Record<typeof d.estado, number>> = { 'sem-erp': 503, erro: 502 };
      const codigo = CODIGO[d.estado] ?? 409;
      res.status(codigo).json({ error: d.estado, message: d.message });
      return;
    }
    res.status(200).json({ ok: true, estado: d.estado, erpQuoteNumber: d.quoteNumber, pagamentoConfirmado: d.pagamentoConfirmado });
    return;
  }

  if (op === 'estornar') {
    const numero = Math.floor(Number(body.numero));
    const valor = body.valor != null ? Number(body.valor) : undefined;
    const { data: ped } = await site.from('pedidos').select('id, numero').eq('numero', numero).maybeSingle();
    const pedido = ped as { id: string; numero: number } | null;
    if (!pedido) {
      res.status(404).json({ error: 'pedido-nao-encontrado' });
      return;
    }
    const { data: pg } = await site.from('pagamentos').select('*').eq('pedido_id', pedido.id).eq('status', 'pago').order('atualizado_em', { ascending: false }).limit(1).maybeSingle();
    const pagamento = pg as PagamentoRow | null;
    if (!pagamento?.asaas_payment_id) {
      res.status(409).json({ error: 'sem-pagamento-pago' });
      return;
    }
    if (pagamento.forma === 'BOLETO') {
      res.status(409).json({ error: 'boleto-nao-estorna-pela-api' });
      return;
    }
    if (valor != null && (!Number.isFinite(valor) || valor <= 0 || valor > Number(pagamento.valor) - Number(pagamento.estornado_valor ?? 0) + 0.001)) {
      res.status(400).json({ error: 'valor-invalido' });
      return;
    }
    const r = await estornarCobranca(pagamento.asaas_payment_id, valor, `Estorno do pedido #${pedido.numero} pelo painel`);
    const total = valor == null || Math.abs(valor - Number(pagamento.valor)) < 0.01;
    if (total) await aplicarStatus(site, pagamento, 'estornado', 'estorno-admin', r);
    else await site.from('pagamentos').update({ estornado_valor: Number(pagamento.estornado_valor ?? 0) + valor, ultimo_evento: 'estorno-parcial-admin', status_asaas: r.status, atualizado_em: new Date().toISOString() }).eq('id', pagamento.id);
    await site.from('asaas_eventos').insert({ id: `admin-estorno-${pagamento.id}-${Date.now()}`, evento: total ? 'ADMIN_ESTORNO' : 'ADMIN_ESTORNO_PARCIAL', asaas_payment_id: pagamento.asaas_payment_id, pedido_id: pedido.id, processado_em: new Date().toISOString(), payload: { valor: valor ?? pagamento.valor, status: r.status } });
    res.status(200).json({ ok: true, total, statusAsaas: r.status });
    return;
  }
}

export type { OpcaoFrete, Linha, Perfil };
