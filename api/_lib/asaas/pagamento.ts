// Regras do pagamento online — usadas pelo checkout, pelo webhook e pelo cron.
//
// Uma cobrança no Asaas = uma linha em `pagamentos`. O pedido guarda um resumo
// (`pagamento_status`, `forma_pagamento`) para as listas; a verdade fina está
// na linha do pagamento. Transições:
//
//   aguardando → pago         (PIX/BOLETO: PAYMENT_RECEIVED; cartão: CONFIRMED)
//   aguardando → em_analise   (cartão: AWAITING_RISK_ANALYSIS) → pago | recusado
//   aguardando → expirado     (Pix passou do prazo nosso; a cobrança é removida)
//   aguardando → vencido      (boleto: PAYMENT_OVERDUE)
//   aguardando → cancelado    (PAYMENT_DELETED)
//   pago       → estornado    (PAYMENT_REFUNDED; parcial mantém pago e soma o valor)
//
// "pago" só é escrito por `marcarPago`, que é idempotente e é quem avisa o ERP
// e consome o cupom. Nunca há dado de cartão neste módulo.

import type { Db } from '../papel.js';
import { despacharAoErp } from '../pedido/despachoErp.js';
import {
  asaasEnv,
  AsaasError,
  buscarClientePorDocumento,
  consultarCobranca,
  criarCliente,
  criarCobranca,
  hojeBr,
  linhaDigitavel,
  qrCodePix,
  removerCobranca,
  sanitizarPagamento,
  somarDiasUteis,
  type AsaasBillingType,
  type AsaasPayment,
} from './cliente.js';
import type { Perfil } from '../pedido/precificar.js';

export type StatusPagamento = 'aguardando' | 'em_analise' | 'pago' | 'recusado' | 'expirado' | 'vencido' | 'estornado' | 'cancelado';

export interface ConfigCheckout {
  checkout_ativo: boolean;
  pix_expira_min: number;
  boleto_vencimento_dias: number;
  boleto_multa_pct: number;
  boleto_juros_mes_pct: number;
  boleto_minimo: number;
  cartao_max_parcelas: number;
  cartao_parcela_minima: number;
  retirada_ativa: boolean;
  retirada_endereco: string;
  pedido_minimo: number;
  frete_gratis_acima: number | null;
}

export async function carregarConfig(site: Db): Promise<ConfigCheckout> {
  const { data } = await site.from('loja_config').select('*').eq('id', 1).maybeSingle();
  const c = (data ?? {}) as Partial<ConfigCheckout>;
  return {
    checkout_ativo: Boolean(c.checkout_ativo),
    pix_expira_min: Number(c.pix_expira_min ?? 30),
    boleto_vencimento_dias: Number(c.boleto_vencimento_dias ?? 3),
    boleto_multa_pct: Number(c.boleto_multa_pct ?? 2),
    boleto_juros_mes_pct: Number(c.boleto_juros_mes_pct ?? 1),
    boleto_minimo: Number(c.boleto_minimo ?? 0),
    cartao_max_parcelas: Math.max(1, Number(c.cartao_max_parcelas ?? 6)),
    cartao_parcela_minima: Number(c.cartao_parcela_minima ?? 100),
    retirada_ativa: c.retirada_ativa !== false,
    retirada_endereco: String(c.retirada_endereco ?? ''),
    pedido_minimo: Number(c.pedido_minimo ?? 0),
    frete_gratis_acima: c.frete_gratis_acima == null ? null : Number(c.frete_gratis_acima),
  };
}

/** Parcelas possíveis para um total: 1..max, respeitando a parcela mínima. */
export function parcelasDisponiveis(total: number, cfg: ConfigCheckout): { n: number; valor: number }[] {
  const lista: { n: number; valor: number }[] = [];
  for (let n = 1; n <= cfg.cartao_max_parcelas; n++) {
    const valor = Math.round((total / n) * 100) / 100;
    if (n > 1 && valor < cfg.cartao_parcela_minima) break;
    lista.push({ n, valor });
  }
  return lista;
}

export interface PagamentoRow {
  id: string;
  pedido_id: string;
  ambiente: string;
  asaas_payment_id: string | null;
  asaas_customer_id: string | null;
  forma: AsaasBillingType;
  status: StatusPagamento;
  status_asaas: string | null;
  valor: number;
  valor_liquido: number | null;
  parcelas: number;
  vencimento: string | null;
  expira_em: string | null;
  pix_payload: string | null;
  pix_qr_base64: string | null;
  boleto_url: string | null;
  linha_digitavel: string | null;
  nosso_numero: string | null;
  cartao_bandeira: string | null;
  cartao_final: string | null;
  invoice_url: string | null;
  recibo_url: string | null;
  pago_em: string | null;
  estornado_valor: number;
  ultimo_evento: string | null;
  ultima_consulta_em: string | null;
  criado_em: string;
}

/** O que o cliente vê de um pagamento. Montado campo a campo, nunca por spread. */
export function pagamentoPublico(p: PagamentoRow) {
  return {
    id: p.id,
    forma: p.forma,
    status: p.status,
    valor: Number(p.valor),
    parcelas: p.parcelas,
    vencimento: p.vencimento,
    expiraEm: p.expira_em,
    pix: p.forma === 'PIX' && p.pix_payload ? { payload: p.pix_payload, qrBase64: p.pix_qr_base64 } : null,
    boleto: p.forma === 'BOLETO' ? { url: p.boleto_url, linhaDigitavel: p.linha_digitavel } : null,
    cartao: p.forma === 'CREDIT_CARD' ? { bandeira: p.cartao_bandeira, final: p.cartao_final } : null,
    invoiceUrl: p.invoice_url,
    reciboUrl: p.recibo_url,
    pagoEm: p.pago_em,
    estornadoValor: Number(p.estornado_valor ?? 0),
    criadoEm: p.criado_em,
  };
}

// ------------------------------------------------------------- cliente

/** Cliente no Asaas: reaproveita pelo perfil, senão busca por CPF/CNPJ, senão cria. */
export async function garantirClienteAsaas(site: Db, userId: string, perfil: Perfil): Promise<string> {
  const env = asaasEnv();
  if (perfil.asaas_customer_id && perfil.asaas_customer_env === env) return perfil.asaas_customer_id;

  const doc = (perfil.cpf_cnpj ?? '').replace(/\D/g, '');
  let id: string | null = null;
  const existente = await buscarClientePorDocumento(doc);
  if (existente) id = existente.id;
  else {
    const criado = await criarCliente({
      name: perfil.company_name || perfil.full_name || 'Cliente NZSTORE',
      cpfCnpj: doc,
      email: perfil.email ?? undefined,
      mobilePhone: (perfil.phone ?? '').replace(/\D/g, '') || undefined,
      address: perfil.address_street ?? undefined,
      addressNumber: perfil.address_number ?? undefined,
      complement: perfil.address_complement ?? undefined,
      province: perfil.address_neighborhood ?? undefined,
      postalCode: (perfil.address_zip ?? '').replace(/\D/g, '') || undefined,
      externalReference: `site:${userId}`,
      company: perfil.company_name ?? undefined,
    });
    id = criado.id;
  }
  await site.from('user_profiles').update({ asaas_customer_id: id, asaas_customer_env: env }).eq('id', userId);
  return id;
}

// ------------------------------------------------------------ cobrança

export interface DadosCartao {
  numero: string;
  nome: string;
  mes: string;
  ano: string;
  cvv: string;
  cpf: string;
}

export interface CriarPagamentoArgs {
  pedido: { id: string; numero: number };
  perfil: Perfil;
  asaasCustomerId: string;
  forma: AsaasBillingType;
  total: number;
  parcelas: number;
  cartao?: DadosCartao;
  ip: string;
  cfg: ConfigCheckout;
}

export type ResultadoCobranca = { ok: true; pagamento: PagamentoRow } | { ok: false; erro: 'cartao-recusado' | 'asaas-indisponivel'; mensagem: string };

/**
 * Cria a cobrança no Asaas e a linha em `pagamentos`. Para cartão a resposta já
 * diz aprovado/recusado; para Pix busca o QR; para boleto a linha digitável.
 * O objeto `cartao` é usado uma vez e não é guardado nem logado.
 */
export async function criarPagamento(site: Db, a: CriarPagamentoArgs): Promise<ResultadoCobranca> {
  const hoje = hojeBr();
  const corpo: Record<string, unknown> = {
    customer: a.asaasCustomerId,
    billingType: a.forma,
    dueDate: hoje,
    description: `Pedido NZ #${a.pedido.numero} — nzgroup.com.br`,
    externalReference: a.pedido.id,
  };
  let vencimento = hoje;
  let expiraEm: string | null = null;

  if (a.forma === 'PIX') {
    corpo.value = a.total;
    expiraEm = new Date(Date.now() + a.cfg.pix_expira_min * 60_000).toISOString();
  } else if (a.forma === 'BOLETO') {
    vencimento = somarDiasUteis(hoje, a.cfg.boleto_vencimento_dias);
    corpo.value = a.total;
    corpo.dueDate = vencimento;
    if (a.cfg.boleto_multa_pct > 0) corpo.fine = { value: a.cfg.boleto_multa_pct, type: 'PERCENTAGE' };
    if (a.cfg.boleto_juros_mes_pct > 0) corpo.interest = { value: a.cfg.boleto_juros_mes_pct };
    corpo.daysAfterDueDateToRegistrationCancellation = 7;
  } else {
    if (!a.cartao) return { ok: false, erro: 'cartao-recusado', mensagem: 'Dados do cartão ausentes.' };
    if (a.parcelas > 1) {
      corpo.installmentCount = a.parcelas;
      corpo.totalValue = a.total;
    } else {
      corpo.value = a.total;
    }
    corpo.creditCard = {
      holderName: a.cartao.nome,
      number: a.cartao.numero,
      expiryMonth: a.cartao.mes,
      expiryYear: a.cartao.ano,
      ccv: a.cartao.cvv,
    };
    // O emissor confere o endereço do TITULAR, que nem sempre é o da entrega
    // (presente, obra, endereço da empresa). Quando o cliente marcou "cobrança
    // diferente" no cadastro, é esse CEP/número que vai — e só ele; o resto do
    // endereço o Asaas não pede.
    const cobrancaPropria = a.perfil.cobranca_igual_entrega === false && Boolean(a.perfil.cobranca_cep);
    corpo.creditCardHolderInfo = {
      name: a.cartao.nome,
      email: a.perfil.email ?? '',
      cpfCnpj: a.cartao.cpf,
      postalCode: ((cobrancaPropria ? a.perfil.cobranca_cep : a.perfil.address_zip) ?? '').replace(/\D/g, ''),
      addressNumber: (cobrancaPropria ? a.perfil.cobranca_numero : a.perfil.address_number) || 's/n',
      addressComplement: cobrancaPropria ? undefined : a.perfil.address_complement ?? undefined,
      phone: (a.perfil.phone ?? '').replace(/\D/g, ''),
      mobilePhone: (a.perfil.phone ?? '').replace(/\D/g, ''),
    };
    corpo.remoteIp = a.ip;
  }

  let criado: AsaasPayment;
  try {
    criado = await criarCobranca(corpo);
  } catch (err) {
    if (err instanceof AsaasError && err.status === 400 && a.forma === 'CREDIT_CARD') {
      return { ok: false, erro: 'cartao-recusado', mensagem: err.message };
    }
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[checkout] cobrança falhou:', a.forma, msg);
    return { ok: false, erro: 'asaas-indisponivel', mensagem: msg };
  } finally {
    // Nada do cartão sobrevive a esta função.
    delete corpo.creditCard;
    delete corpo.creditCardHolderInfo;
  }

  const linha: Record<string, unknown> = {
    pedido_id: a.pedido.id,
    ambiente: asaasEnv(),
    asaas_payment_id: criado.id,
    asaas_customer_id: a.asaasCustomerId,
    forma: a.forma,
    status: 'aguardando',
    status_asaas: criado.status,
    valor: a.total,
    valor_liquido: criado.netValue ?? null,
    parcelas: a.parcelas,
    vencimento,
    expira_em: expiraEm,
    invoice_url: criado.invoiceUrl ?? null,
    recibo_url: criado.transactionReceiptUrl ?? null,
    nosso_numero: criado.nossoNumero ?? null,
    boleto_url: criado.bankSlipUrl ?? null,
    cartao_bandeira: criado.creditCard?.creditCardBrand ?? null,
    cartao_final: criado.creditCard?.creditCardNumber ?? null,
    ultimo_evento: 'criado',
  };

  if (a.forma === 'PIX') {
    try {
      const qr = await qrCodePix(criado.id);
      linha.pix_payload = qr.payload;
      linha.pix_qr_base64 = qr.encodedImage;
    } catch (err) {
      console.warn('[checkout] QR Pix não veio; a página tenta de novo:', err instanceof Error ? err.message : err);
    }
  } else if (a.forma === 'BOLETO') {
    try {
      const ld = await linhaDigitavel(criado.id);
      linha.linha_digitavel = ld.identificationField;
      linha.nosso_numero = ld.nossoNumero;
    } catch (err) {
      console.warn('[checkout] linha digitável não veio:', err instanceof Error ? err.message : err);
    }
  }

  const { data, error } = await site.from('pagamentos').insert(linha).select('*').single();
  if (error || !data) {
    // A cobrança existe no Asaas mas não ficou registrada: melhor remover lá do
    // que deixar o cliente pagar algo que o site não conhece.
    console.error('[checkout] não gravou pagamento:', error?.message);
    await removerCobranca(criado.id).catch(() => undefined);
    return { ok: false, erro: 'asaas-indisponivel', mensagem: 'Falha ao registrar o pagamento.' };
  }
  let pagamento = data as PagamentoRow;

  // Cartão: o Asaas responde na hora.
  const statusCartao = statusDoAsaas(criado.status, a.forma);
  if (a.forma === 'CREDIT_CARD' && statusCartao === 'pago') {
    pagamento = (await marcarPago(site, pagamento, 'resposta-sincrona', criado)) ?? pagamento;
  } else if (a.forma === 'CREDIT_CARD' && statusCartao === 'em_analise') {
    await site.from('pagamentos').update({ status: 'em_analise', atualizado_em: new Date().toISOString() }).eq('id', pagamento.id);
    await site.from('pedidos').update({ pagamento_status: 'em_analise' }).eq('id', a.pedido.id);
    pagamento = { ...pagamento, status: 'em_analise' };
  }
  return { ok: true, pagamento };
}

/** Status do Asaas → nosso. `null` = não muda nada. */
export function statusDoAsaas(status: string, forma: string): StatusPagamento | null {
  switch (status) {
    case 'CONFIRMED':
    case 'RECEIVED':
    case 'RECEIVED_IN_CASH':
      return 'pago';
    case 'AWAITING_RISK_ANALYSIS':
      return 'em_analise';
    case 'OVERDUE':
      return forma === 'BOLETO' ? 'vencido' : 'expirado';
    case 'REFUNDED':
      return 'estornado';
    case 'PENDING':
      return 'aguardando';
    default:
      return null;
  }
}

/** Evento do webhook → nosso status. */
export function statusDoEvento(evento: string, forma: string): StatusPagamento | null {
  switch (evento) {
    case 'PAYMENT_CONFIRMED':
    case 'PAYMENT_RECEIVED':
    case 'PAYMENT_APPROVED_BY_RISK_ANALYSIS':
      return 'pago';
    case 'PAYMENT_AWAITING_RISK_ANALYSIS':
      return 'em_analise';
    case 'PAYMENT_REPROVED_BY_RISK_ANALYSIS':
    case 'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED':
      return 'recusado';
    case 'PAYMENT_OVERDUE':
      return forma === 'BOLETO' ? 'vencido' : 'expirado';
    case 'PAYMENT_DELETED':
    case 'PAYMENT_BANK_SLIP_CANCELLED':
      return 'cancelado';
    case 'PAYMENT_REFUNDED':
      return 'estornado';
    default:
      return null;
  }
}

const FINAIS: StatusPagamento[] = ['pago', 'estornado'];

/**
 * Aplica um status novo a um pagamento respeitando a ordem: um pagamento pago
 * não volta a "aguardando" por um evento atrasado, e "estornado" é terminal.
 */
export async function aplicarStatus(site: Db, p: PagamentoRow, novo: StatusPagamento, evento: string, dados?: AsaasPayment): Promise<PagamentoRow> {
  if (p.status === novo) {
    await site.from('pagamentos').update({ ultimo_evento: evento, status_asaas: dados?.status ?? p.status_asaas, atualizado_em: new Date().toISOString() }).eq('id', p.id);
    return p;
  }
  if (novo === 'pago') return (await marcarPago(site, p, evento, dados)) ?? p;
  if (p.status === 'estornado') return p;
  if (p.status === 'pago' && novo !== 'estornado') return p;
  if (FINAIS.includes(p.status) && novo === 'aguardando') return p;

  const patch: Record<string, unknown> = {
    status: novo,
    status_asaas: dados?.status ?? p.status_asaas,
    ultimo_evento: evento,
    atualizado_em: new Date().toISOString(),
  };
  if (novo === 'estornado') patch.estornado_valor = Number(p.valor);
  await site.from('pagamentos').update(patch).eq('id', p.id);
  await site.from('pedidos').update({ pagamento_status: novo }).eq('id', p.pedido_id);
  return { ...p, ...(patch as Partial<PagamentoRow>) };
}

/** Pago: idempotente. Grava, avisa o ERP, consome o cupom. */
export async function marcarPago(site: Db, p: PagamentoRow, evento: string, dados?: AsaasPayment): Promise<PagamentoRow | null> {
  if (p.status === 'pago' || p.status === 'estornado') return p;
  const agora = new Date().toISOString();
  const pagoEm = dados?.confirmedDate || dados?.paymentDate || dados?.clientPaymentDate || agora;
  const patch = {
    status: 'pago' as const,
    status_asaas: dados?.status ?? 'CONFIRMED',
    valor_liquido: dados?.netValue ?? p.valor_liquido,
    recibo_url: dados?.transactionReceiptUrl ?? p.recibo_url,
    cartao_bandeira: dados?.creditCard?.creditCardBrand ?? p.cartao_bandeira,
    cartao_final: dados?.creditCard?.creditCardNumber ?? p.cartao_final,
    pago_em: pagoEm.length === 10 ? `${pagoEm}T12:00:00-03:00` : pagoEm,
    ultimo_evento: evento,
    atualizado_em: agora,
  };
  const { error } = await site.from('pagamentos').update(patch).eq('id', p.id).neq('status', 'pago');
  if (error) {
    console.error('[pagamento] marcarPago falhou:', error.message);
    return null;
  }

  const { data: pedidoData } = await site.from('pedidos').select('id, cupom, pagamento_status, erp_quote_id').eq('id', p.pedido_id).maybeSingle();
  const pedido = pedidoData as { id: string; cupom: string | null; pagamento_status: string; erp_quote_id: string | null } | null;
  if (pedido && pedido.pagamento_status !== 'pago') {
    await site.from('pedidos').update({ pagamento_status: 'pago', pago_em: patch.pago_em, forma_pagamento: p.forma }).eq('id', pedido.id);
    if (pedido.cupom) await site.rpc('cupom_consumir', { p_codigo: pedido.cupom });
  }
  // Só AGORA o ERP fica sabendo: o pagamento foi aprovado. Se falhar, o cron
  // tenta de novo — o pedido não pode quebrar por causa disso.
  const d = await despacharAoErp(site, p.pedido_id, 'pago');
  if (!d.ok && d.estado === 'erro') console.warn('[pagamento] ERP não avisado (cron tenta de novo):', d.message);
  return { ...p, ...patch };
}

/**
 * Pix que passou do nosso prazo: remove a cobrança no Asaas (para o cliente não
 * pagar um Pix que a loja já considera morto) e marca expirado.
 */
export async function expirarSeVencido(site: Db, p: PagamentoRow): Promise<PagamentoRow> {
  if (p.status !== 'aguardando' || p.forma !== 'PIX' || !p.expira_em) return p;
  if (new Date(p.expira_em).getTime() > Date.now()) return p;
  if (p.asaas_payment_id) {
    try {
      // Se pagou no último segundo, o Asaas diz e a gente respeita.
      const atual = await consultarCobranca(p.asaas_payment_id);
      const s = statusDoAsaas(atual.status, p.forma);
      if (s === 'pago') return (await marcarPago(site, p, 'consulta-expiracao', atual)) ?? p;
      await removerCobranca(p.asaas_payment_id);
    } catch (err) {
      console.warn('[pagamento] remover Pix expirado:', err instanceof Error ? err.message : err);
    }
  }
  return aplicarStatus(site, p, 'expirado', 'expiracao');
}

/**
 * Consulta o Asaas quando o webhook pode ter se perdido: só se a última
 * consulta tem mais de `minSeg` segundos, para a página de pedido em polling
 * não virar uma metralhadora contra a API.
 */
export async function sincronizarComAsaas(site: Db, p: PagamentoRow, minSeg = 20): Promise<PagamentoRow> {
  if (!p.asaas_payment_id) return p;
  if (!['aguardando', 'em_analise'].includes(p.status)) return p;
  const ultima = p.ultima_consulta_em ? new Date(p.ultima_consulta_em).getTime() : 0;
  if (Date.now() - ultima < minSeg * 1000) return p;
  await site.from('pagamentos').update({ ultima_consulta_em: new Date().toISOString() }).eq('id', p.id);
  try {
    const atual = await consultarCobranca(p.asaas_payment_id);
    const s = statusDoAsaas(atual.status, p.forma);
    let pag = p;
    if (atual.deleted) pag = await aplicarStatus(site, p, 'cancelado', 'consulta', atual);
    else if (s && s !== p.status) pag = await aplicarStatus(site, p, s, 'consulta', atual);
    // Pix sem QR (falhou na criação): tenta de novo.
    if (pag.forma === 'PIX' && !pag.pix_payload && pag.status === 'aguardando') {
      const qr = await qrCodePix(p.asaas_payment_id).catch(() => null);
      if (qr) {
        await site.from('pagamentos').update({ pix_payload: qr.payload, pix_qr_base64: qr.encodedImage }).eq('id', p.id);
        pag = { ...pag, pix_payload: qr.payload, pix_qr_base64: qr.encodedImage };
      }
    }
    return pag;
  } catch (err) {
    console.warn('[pagamento] consulta ao Asaas falhou:', err instanceof Error ? err.message : err);
    return p;
  }
}

export { sanitizarPagamento };
