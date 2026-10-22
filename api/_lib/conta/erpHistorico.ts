// O histórico que o cliente tem no NZERP, lido do jeito mais chato possível.
//
// Este é o ÚNICO módulo autorizado a ler `quotes`, `faturamento` e
// `contas_receber` em nome de um cliente. Regras que valem aqui e em lugar
// nenhum mais:
//
//   · **Lista branca de colunas, escrita como constante.** Nunca `select('*')`.
//     O ERP tem custo, margem, limite de crédito, vendedor, histórico de
//     cobrança, cartório e cessão nas mesmas tabelas. Um `*` distraído vira
//     vazamento. `scripts/test-erp-historico.mjs` quebra se aparecer um.
//   · **Nada sai sem dono.** Toda consulta parte do `erp_client_id` gravado no
//     perfil do usuário logado. Sem vínculo, a resposta é vazia — nunca "tudo".
//   · **Somente leitura.** Nenhuma escrita no ERP, em hipótese alguma.
//
// Decisões que o João aprovou (docs/PLANO_CONEXAO_NZERP.md §7):
//   3. título vencido APARECE, com data e valor, sem uma palavra de cobrança;
//   4. limite de crédito NÃO aparece — a coluna nem é lida.

import type { Db } from '../papel.js';
import { somenteDigitos, validarCpfCnpj } from './documento.js';
import { clienteErp } from '../pedido/despachoErp.js';

// ------------------------------------------------------------ listas brancas
// Mexer aqui é decisão de segurança, não de layout. Cada coluna abaixo foi
// olhada uma a uma contra o schema do ERP.

/** Orçamento: o que o cliente pediu e em que pé está. Sem vendedor, sem notas internas. `opportunity_id` só para achar os pedidos do cliente; `shipping_carrier_name` é a transportadora que ele mesmo escolheu. */
export const COLUNAS_QUOTE = 'id, quote_number, status, subtotal, total, shipping_type, shipping_cost, shipping_carrier_name, items, created_at, updated_at, tiny_order_number, origem, site_pedido_id, opportunity_id';

/**
 * O que o cliente VÊ (Central do cliente, D5): o que passou de aprovado, mais
 * cancelados recentes. Orçamento em aberto é negociação do vendedor e não entra.
 */
export const STATUS_VISIVEIS = ['APROVADO', 'FATURADO', 'FATURADO_PARCIAL', 'PREPARANDO_ENVIO', 'PRONTO_ENVIO', 'ENVIADO', 'ENTREGUE', 'NAO_ENTREGUE'];
export const DIAS_CANCELADO_VISIVEL = 90;

/** Nota fiscal: número, chave e data. Sem percentual, sem vendedor, sem observações. */
export const COLUNAS_FATURAMENTO = 'id, quote_id, nf_numero, nf_chave, valor_nf, data_faturamento, status, tiny_order_number';

/**
 * Título, lido da view `titulos_cliente_site` do ERP (Central do cliente,
 * Fase C): o que vence, quando, se foi pago, e os links/Pix da cobrança no
 * Asaas. `client_id` e `cliente_documento` servem só para achar o dono e NUNCA
 * saem daqui (ver tituloPublico). Fora: status_cobranca, cartório, cessão,
 * remessa, encargo de recompra, histórico e observações — a view resume o que
 * a regra precisa deles em dois booleanos, `combinado` e `pagavel`.
 */
export const COLUNAS_TITULO =
  'id, client_id, cliente_documento, numero_documento, parcela_numero, parcela_total, vencimento, data_emissao, data_pagamento, valor, valor_pago, valor_liquidado, saldo, status, forma_pagamento, quote_number, nf_numero, cobranca_viva, asaas_invoice_url, asaas_bank_slip_url, asaas_pix_payload, asaas_pix_expiracao, asaas_linha_digitavel, combinado, pagavel';

/** Pago aparece por 12 meses (D6); mais velho que isso é histórico do ERP, não da tela. */
export const DIAS_PAGO_VISIVEL = 365;

/** Cliente: só o que serve para o cabeçalho "sua conta na NZ". Nunca `limite_de_credito`. */
export const COLUNAS_CLIENTE = 'id, nome, name, fantasia, cpf_cnpj, cidade, estado, created_at';

/** Oportunidade do CRM: só o id, para achar os orçamentos do cliente. Nada do funil, do vendedor ou das notas. */
export const COLUNAS_OPORTUNIDADE = 'id';

const STATUS_TITULO: Record<string, string> = {
  pago: 'Pago',
  pendente: 'Em aberto',
  registrado: 'Em aberto',
  parcial: 'Pago em parte',
  cancelado: 'Cancelado',
};

export interface ItemHistorico {
  sku: string | null;
  nome: string | null;
  qtd: number | null;
  unidade: string | null;
  valorUnitario: number | null;
  total: number | null;
  /** O produto na loja (pelo SKU do ERP), para "comprar de novo". Nulo = não está no catálogo. */
  slug: string | null;
  disponivel: boolean;
  imagem: string | null;
  hex: string | null;
  codigo: string | null;
}

export interface PedidoErpPublico {
  origem: 'nzerp';
  quoteId: string;
  numero: number | null;
  status: string;
  total: number | null;
  frete: number | null;
  transportadora: string | null;
  criadoEm: string | null;
  atualizadoEm: string | null;
  pedidoTiny: string | null;
  doSite: boolean;
  itens: ItemHistorico[];
  notas: { numero: string | null; chave: string | null; valor: number | null; em: string | null }[];
}

export type BlocoTitulo = 'vencido' | 'a_vencer' | 'pago';

export interface TituloPublico {
  id: string;
  documento: string | null;
  valor: number | null;
  valorPago: number | null;
  /** O que falta pagar (valor − liquidado). Em título pago em parte é o que a cobrança pede. */
  saldo: number | null;
  vencimento: string | null;
  emissao: string | null;
  pagoEm: string | null;
  status: string;
  statusRotulo: string;
  vencido: boolean;
  /** Em qual dos três blocos da aba Pagamentos ele entra (D6). */
  bloco: BlocoTitulo;
  parcela: string | null;
  notaFiscal: string | null;
  orcamento: string | null;
  boletoUrl: string | null;
  faturaUrl: string | null;
  /** Pix copia-e-cola da cobrança viva, só enquanto não expirou. */
  pixPayload: string | null;
  pixExpira: string | null;
  linhaDigitavel: string | null;
  forma: string | null;
  /** Tem cobrança viva no Asaas: "Pagar" abre `faturaUrl`. */
  cobrancaViva: boolean;
  /** Em acordo, cedido ou em antecipação: "combinado com a NZ", sem botão (D7). */
  combinado: boolean;
  /** O site pode pedir ao ERP a emissão da cobrança (em aberto, sem acordo, pedido não cancelado). */
  pagavel: boolean;
}

export interface ClienteErpPublico {
  id: string;
  nome: string | null;
  fantasia: string | null;
  documento: string | null;
  cidade: string | null;
  estado: string | null;
  clienteDesde: string | null;
}

/** Produto da loja por SKU do ERP (para "comprar de novo"). */
interface ProdutoLoja {
  slug: string;
  nome: string | null;
  codigo: string | null;
  imagem: string | null;
  hex: string | null;
  disponivel: boolean;
}

async function produtosPorSku(site: Db, skus: string[]): Promise<Map<string, ProdutoLoja>> {
  const lista = [...new Set(skus.filter(Boolean))];
  if (!lista.length) return new Map();
  const { data } = await site.from('produtos').select('erp_sku, slug, nome, codigo, imagem, hex, publicado, oculto_manual').in('erp_sku', lista);
  const m = new Map<string, ProdutoLoja>();
  for (const p of (data ?? []) as { erp_sku: string; slug: string; nome: string | null; codigo: string | null; imagem: string | null; hex: string | null; publicado: boolean; oculto_manual: boolean | null }[]) {
    if (!m.has(p.erp_sku)) m.set(p.erp_sku, { slug: p.slug, nome: p.nome, codigo: p.codigo, imagem: p.imagem, hex: p.hex, disponivel: Boolean(p.publicado) && !p.oculto_manual });
  }
  return m;
}

/** Um item do orçamento, campo a campo — `items` é jsonb livre, não dá para confiar no formato. */
function itemPublico(bruto: unknown, produtos: Map<string, ProdutoLoja>): ItemHistorico {
  const i = (bruto ?? {}) as Record<string, unknown>;
  const num = (v: unknown) => (v == null || v === '' || Number.isNaN(Number(v)) ? null : Number(v));
  const sku = typeof i.sku === 'string' ? i.sku : null;
  const prod = sku ? produtos.get(sku) ?? null : null;
  return {
    slug: prod?.slug ?? null,
    disponivel: Boolean(prod?.disponivel),
    imagem: prod?.imagem ?? null,
    hex: prod?.hex ?? null,
    codigo: prod?.codigo ?? null,
    sku: typeof i.sku === 'string' ? i.sku : null,
    nome: typeof i.name === 'string' ? i.name : typeof i.nome === 'string' ? i.nome : null,
    qtd: num(i.qty ?? i.quantidade),
    unidade: typeof i.unit === 'string' ? i.unit : null,
    valorUnitario: num(i.unitPrice ?? i.preco_unitario),
    total: num(i.total),
  };
}

/** O cliente do ERP ligado a esta conta, ou `null` se não há vínculo. */
export async function clienteDoUsuario(site: Db, userId: string): Promise<ClienteErpPublico | null> {
  const { data: perfil } = await site.from('user_profiles').select('erp_client_id').eq('id', userId).maybeSingle();
  const clientId = (perfil as { erp_client_id?: string | null } | null)?.erp_client_id;
  if (!clientId) return null;
  const erp = await clienteErp();
  if (!erp) return null;
  const { data } = await erp.from('clients').select(COLUNAS_CLIENTE).eq('id', clientId).maybeSingle();
  const c = data as Record<string, unknown> | null;
  if (!c) return null;
  return {
    id: String(c.id),
    nome: (c.nome as string) ?? (c.name as string) ?? null,
    fantasia: (c.fantasia as string) ?? null,
    documento: (c.cpf_cnpj as string) ?? null,
    cidade: (c.cidade as string) ?? null,
    estado: (c.estado as string) ?? null,
    clienteDesde: (c.created_at as string) ?? null,
  };
}

/**
 * Os pedidos que o cliente tem no NZERP — os de balcão, de telefone, de
 * vendedor, e também os que nasceram no site (esses vêm marcados).
 *
 * Duas chaves (Central do cliente, Fase B): a OPORTUNIDADE do CRM ligada ao
 * cliente (é como o ERP amarra o orçamento ao cadastro) e o documento, para
 * orçamento antigo sem oportunidade. `quotes.cpf_cnpj` e `clients.cpf_cnpj`
 * vêm os dois do Tiny e estão formatados igual, mas a busca inclui a versão
 * só-dígitos porque um cadastro feito à mão pode ter fugido do padrão.
 *
 * O que sai (D5): o que passou de aprovado, mais cancelados dos últimos 90
 * dias. Orçamento em aberto não — ainda é negociação do vendedor.
 */
export async function pedidosDoCliente(site: Db, userId: string, limite = 50): Promise<PedidoErpPublico[]> {
  const cliente = await clienteDoUsuario(site, userId);
  if (!cliente) return [];
  const erp = await clienteErp();
  if (!erp) return [];

  const { data: opps } = await erp.from('crm_opportunities').select(COLUNAS_OPORTUNIDADE).eq('client_id', cliente.id).limit(200);
  const oppIds = ((opps ?? []) as { id: string }[]).map((o) => o.id);
  // Documento só vale como chave se for um CPF/CNPJ de verdade (varredura 22/10):
  // cadastro com "000.000.000-00" ou lixo puxaria os orçamentos de todo mundo
  // que tem o mesmo lixo no ERP.
  const chaves = cliente.documento && validarCpfCnpj(cliente.documento) ? ([...new Set([cliente.documento, somenteDigitos(cliente.documento)].filter(Boolean))] as string[]) : [];
  if (!oppIds.length && !chaves.length) return [];
  const partes: string[] = [];
  if (oppIds.length) partes.push(`opportunity_id.in.(${oppIds.join(',')})`);
  if (chaves.length) partes.push(`cpf_cnpj.in.(${chaves.map((c) => `"${c.replace(/"/g, '')}"`).join(',')})`);

  const corte = new Date(Date.now() - DIAS_CANCELADO_VISIVEL * 86_400_000).toISOString();
  const { data } = await erp
    .from('quotes')
    .select(COLUNAS_QUOTE)
    .or(partes.join(','))
    // Orçamento que NASCEU no site já está na lista do site, com status
    // espelhado e com os botões (comprar de novo, cancelar). Trazer de novo
    // daqui seria o mesmo pedido duas vezes na tela do cliente.
    .is('site_pedido_id', null)
    .or(`status.in.(${STATUS_VISIVEIS.join(',')}),and(status.eq.CANCELADO,updated_at.gte.${corte})`)
    .order('created_at', { ascending: false })
    .range(0, limite - 1);
  const quotes = (data ?? []) as Record<string, unknown>[];
  if (!quotes.length) return [];

  const skus = quotes.flatMap((q) => (Array.isArray(q.items) ? (q.items as Record<string, unknown>[]).map((i) => (typeof i?.sku === 'string' ? i.sku : '')) : []));
  const produtos = await produtosPorSku(site, skus);

  const ids = quotes.map((q) => String(q.id));
  const { data: notasData } = await erp.from('faturamento').select(COLUNAS_FATURAMENTO).in('quote_id', ids);
  const notasPorQuote = new Map<string, { numero: string | null; chave: string | null; valor: number | null; em: string | null }[]>();
  for (const n of (notasData ?? []) as Record<string, unknown>[]) {
    const qid = String(n.quote_id);
    const lista = notasPorQuote.get(qid) ?? [];
    lista.push({
      numero: (n.nf_numero as string) ?? null,
      chave: (n.nf_chave as string) ?? null,
      valor: n.valor_nf == null ? null : Number(n.valor_nf),
      em: (n.data_faturamento as string) ?? null,
    });
    notasPorQuote.set(qid, lista);
  }

  return quotes.map((q) => ({
    origem: 'nzerp' as const,
    quoteId: String(q.id),
    numero: q.quote_number == null ? null : Number(q.quote_number),
    status: String(q.status ?? ''),
    total: q.total == null ? null : Number(q.total),
    frete: q.shipping_cost == null ? null : Number(q.shipping_cost),
    transportadora: (q.shipping_carrier_name as string) ?? null,
    criadoEm: (q.created_at as string) ?? null,
    atualizadoEm: (q.updated_at as string) ?? null,
    pedidoTiny: (q.tiny_order_number as string) ?? null,
    doSite: q.origem === 'SITE' || Boolean(q.site_pedido_id),
    itens: Array.isArray(q.items) ? (q.items as unknown[]).map((i) => itemPublico(i, produtos)) : [],
    notas: notasPorQuote.get(String(q.id)) ?? [],
  }));
}

/** Hoje em Brasília (AAAA-MM-DD): vencimento é data local, não UTC — às 22h de BRT ainda não venceu. */
const hojeBR = (agora: Date) => agora.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });

/**
 * A linha da view vira o que o cliente vê. Pura, para o autoteste: nada de
 * `client_id`/`cliente_documento` na saída, Pix só enquanto vale, bloco pelo
 * status e pelo vencimento (D6).
 */
export function tituloPublico(t: Record<string, unknown>, agora: Date): TituloPublico {
  const hoje = hojeBR(agora);
  const status = String(t.status ?? '');
  const vencimento = (t.vencimento as string) ?? null;
  const pago = status === 'pago';
  const vencido = !pago && Boolean(vencimento) && vencimento! < hoje;
  const cobrancaViva = Boolean(t.cobranca_viva);
  const pixExpira = (t.asaas_pix_expiracao as string) ?? null;
  const pixVivo = cobrancaViva && Boolean(t.asaas_pix_payload) && (!pixExpira || new Date(pixExpira).getTime() > agora.getTime());
  const num = (v: unknown) => (v == null ? null : Number(v));
  return {
    id: String(t.id),
    documento: (t.numero_documento as string) ?? null,
    valor: num(t.valor),
    valorPago: num(t.valor_pago),
    saldo: num(t.saldo),
    vencimento,
    emissao: (t.data_emissao as string) ?? null,
    pagoEm: (t.data_pagamento as string) ?? null,
    status,
    statusRotulo: STATUS_TITULO[status] ?? status,
    vencido,
    bloco: pago ? 'pago' : vencido ? 'vencido' : 'a_vencer',
    parcela: t.parcela_total && Number(t.parcela_total) > 1 ? `${t.parcela_numero ?? 1}/${t.parcela_total}` : null,
    notaFiscal: (t.nf_numero as string) ?? null,
    orcamento: (t.quote_number as string) ?? null,
    boletoUrl: cobrancaViva || pago ? ((t.asaas_bank_slip_url as string) ?? null) : null,
    faturaUrl: cobrancaViva || pago ? ((t.asaas_invoice_url as string) ?? null) : null,
    pixPayload: pixVivo ? String(t.asaas_pix_payload) : null,
    pixExpira: pixVivo ? pixExpira : null,
    linhaDigitavel: cobrancaViva ? ((t.asaas_linha_digitavel as string) ?? null) : null,
    forma: (t.forma_pagamento as string) ?? null,
    cobrancaViva,
    combinado: Boolean(t.combinado),
    pagavel: Boolean(t.pagavel),
  };
}

interface ChavesDoCliente {
  erp: NonNullable<Awaited<ReturnType<typeof clienteErp>>>;
  clientId: string;
  /** Dígitos do CPF/CNPJ do cliente no ERP — a segunda chave do dono do título. */
  doc: string | null;
  /** Títulos que o admin atribuiu à mão (`erp_titulo_dono.chave = 'manual'`): valem sempre. */
  manuais: string[];
}

/**
 * De quem é o título (D8): pelo vínculo `clients.site_user_id` ↔
 * `user_profiles.erp_client_id`, casando o título pelo orçamento (view:
 * `client_id`) ou pelo documento. A atribuição por NOME (`erp_titulo_dono`)
 * deixa de valer para quem está vinculado; só a manual do admin continua.
 */
async function chavesDoCliente(site: Db, userId: string): Promise<ChavesDoCliente | null> {
  const { data: perfil } = await site.from('user_profiles').select('erp_client_id').eq('id', userId).maybeSingle();
  const clientId = (perfil as { erp_client_id?: string | null } | null)?.erp_client_id;
  if (!clientId) return null;
  const erp = await clienteErp();
  if (!erp) return null;
  const { data: cli } = await erp.from('clients').select(COLUNAS_CLIENTE).eq('id', clientId).maybeSingle();
  const doc = somenteDigitos((cli as { cpf_cnpj?: string | null } | null)?.cpf_cnpj) || null;
  const { data: donos } = await site.from('erp_titulo_dono').select('titulo_id').eq('erp_client_id', clientId).eq('chave', 'manual').limit(200);
  const manuais = ((donos ?? []) as { titulo_id: string }[]).map((d) => d.titulo_id).filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  return { erp, clientId, doc: doc && validarCpfCnpj(doc) ? doc : null, manuais };
}

/**
 * Título que só é deste cliente pela atribuição manual (não pelo orçamento nem
 * pelo documento) aparece, mas sem "Gerar Pix/boleto": o ERP confere o dono só
 * pelas duas chaves fortes e recusaria a emissão com "título de outro cliente".
 */
function soPorAtribuicaoManual(t: Record<string, unknown>, ch: ChavesDoCliente): boolean {
  return t.client_id !== ch.clientId && !(ch.doc && t.cliente_documento === ch.doc);
}

function tituloDoDono(t: Record<string, unknown>, ch: ChavesDoCliente, agora: Date): TituloPublico {
  const p = tituloPublico(t, agora);
  return soPorAtribuicaoManual(t, ch) ? { ...p, pagavel: false } : p;
}

/** O filtro PostgREST "é deste cliente": orçamento OU documento OU atribuição manual. */
function filtroDono(ch: ChavesDoCliente): string {
  const partes = [`client_id.eq.${ch.clientId}`];
  if (ch.doc) partes.push(`cliente_documento.eq.${ch.doc}`);
  if (ch.manuais.length) partes.push(`id.in.(${ch.manuais.join(',')})`);
  return partes.join(',');
}

/**
 * As parcelas do cliente na NZ: em aberto (a vencer e vencidas) e as pagas
 * nos últimos 12 meses. Vencido aparece, com data e valor, e ponto: nenhuma
 * palavra de cobrança sai daqui. Quem cobra é a NZ, pelo canal dela (D9).
 */
export async function titulosDoCliente(site: Db, userId: string, limite = 200): Promise<TituloPublico[]> {
  const ch = await chavesDoCliente(site, userId);
  if (!ch) return [];
  const agora = new Date();
  const corte = new Date(agora.getTime() - DIAS_PAGO_VISIVEL * 86_400_000).toISOString().slice(0, 10);
  const { data } = await ch.erp
    .from('titulos_cliente_site')
    .select(COLUNAS_TITULO)
    .or(filtroDono(ch))
    .or(`status.neq.pago,data_pagamento.gte.${corte}`)
    .order('vencimento', { ascending: false })
    .limit(limite);
  return ((data ?? []) as Record<string, unknown>[]).map((t) => tituloDoDono(t, ch, agora));
}

/** Um título só, e só se for deste cliente — é o que "Pagar" confere antes de falar com o ERP. */
export async function tituloDoCliente(site: Db, userId: string, tituloId: string): Promise<TituloPublico | null> {
  if (!/^[0-9a-f-]{36}$/i.test(tituloId)) return null;
  const ch = await chavesDoCliente(site, userId);
  if (!ch) return null;
  const { data } = await ch.erp.from('titulos_cliente_site').select(COLUNAS_TITULO).eq('id', tituloId).or(filtroDono(ch)).limit(1).maybeSingle();
  return data ? tituloDoDono(data as Record<string, unknown>, ch, new Date()) : null;
}
