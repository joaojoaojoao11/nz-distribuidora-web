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
import { somenteDigitos } from './documento.js';
import { clienteErp } from '../pedido/despachoErp.js';

// ------------------------------------------------------------ listas brancas
// Mexer aqui é decisão de segurança, não de layout. Cada coluna abaixo foi
// olhada uma a uma contra o schema do ERP.

/** Orçamento: o que o cliente pediu e em que pé está. Sem vendedor, sem notas internas. */
export const COLUNAS_QUOTE = 'id, quote_number, status, subtotal, total, shipping_type, shipping_cost, items, created_at, updated_at, tiny_order_number, origem, site_pedido_id';

/** Nota fiscal: número, chave e data. Sem percentual, sem vendedor, sem observações. */
export const COLUNAS_FATURAMENTO = 'id, quote_id, nf_numero, nf_chave, valor_nf, data_faturamento, status, tiny_order_number';

/**
 * Título: o que vence, quando e se foi pago — e os links de boleto que o
 * próprio cliente já recebeu por e-mail. Fora: status_cobranca, cartório,
 * cessão, remessa, encargo de recompra, histórico e observações.
 */
export const COLUNAS_TITULO =
  'id, numero_documento, valor, valor_pago, vencimento, data_emissao, data_pagamento, status, parcela_numero, parcela_total, nf_numero, quote_number, asaas_invoice_url, asaas_bank_slip_url, forma_pagamento';

/** Cliente: só o que serve para o cabeçalho "sua conta na NZ". Nunca `limite_de_credito`. */
export const COLUNAS_CLIENTE = 'id, nome, name, fantasia, cpf_cnpj, cidade, estado, created_at';

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
}

export interface PedidoErpPublico {
  origem: 'nzerp';
  quoteId: string;
  numero: number | null;
  status: string;
  total: number | null;
  frete: number | null;
  criadoEm: string | null;
  atualizadoEm: string | null;
  pedidoTiny: string | null;
  doSite: boolean;
  itens: ItemHistorico[];
  notas: { numero: string | null; chave: string | null; valor: number | null; em: string | null }[];
}

export interface TituloPublico {
  id: string;
  documento: string | null;
  valor: number | null;
  valorPago: number | null;
  vencimento: string | null;
  emissao: string | null;
  pagoEm: string | null;
  status: string;
  statusRotulo: string;
  vencido: boolean;
  parcela: string | null;
  notaFiscal: string | null;
  orcamento: string | null;
  boletoUrl: string | null;
  faturaUrl: string | null;
  forma: string | null;
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

/** Um item do orçamento, campo a campo — `items` é jsonb livre, não dá para confiar no formato. */
function itemPublico(bruto: unknown): ItemHistorico {
  const i = (bruto ?? {}) as Record<string, unknown>;
  const num = (v: unknown) => (v == null || v === '' || Number.isNaN(Number(v)) ? null : Number(v));
  return {
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
 * A chave é o documento. `quotes.cpf_cnpj` e `clients.cpf_cnpj` vêm os dois do
 * Tiny e estão formatados igual, mas a busca inclui a versão só-dígitos porque
 * um cadastro feito à mão pode ter fugido do padrão.
 */
export async function pedidosDoCliente(site: Db, userId: string, limite = 50): Promise<PedidoErpPublico[]> {
  const cliente = await clienteDoUsuario(site, userId);
  if (!cliente?.documento) return [];
  const erp = await clienteErp();
  if (!erp) return [];

  const chaves = [...new Set([cliente.documento, somenteDigitos(cliente.documento)].filter(Boolean))] as string[];
  const { data } = await erp
    .from('quotes')
    .select(COLUNAS_QUOTE)
    .in('cpf_cnpj', chaves)
    // Orçamento que NASCEU no site já está na lista do site, com status
    // espelhado e com os botões (comprar de novo, cancelar). Trazer de novo
    // daqui seria o mesmo pedido duas vezes na tela do cliente.
    .is('site_pedido_id', null)
    .order('created_at', { ascending: false })
    .limit(limite);
  const quotes = (data ?? []) as Record<string, unknown>[];
  if (!quotes.length) return [];

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
    criadoEm: (q.created_at as string) ?? null,
    atualizadoEm: (q.updated_at as string) ?? null,
    pedidoTiny: (q.tiny_order_number as string) ?? null,
    doSite: q.origem === 'SITE' || Boolean(q.site_pedido_id),
    itens: Array.isArray(q.items) ? (q.items as unknown[]).map(itemPublico) : [],
    notas: notasPorQuote.get(String(q.id)) ?? [],
  }));
}

/**
 * As parcelas do cliente. Só os títulos que a atribuição deu a ELE — título
 * sem dono não aparece para ninguém (`erp_titulo_dono`, fase 4).
 *
 * Vencido aparece, com data e valor, e ponto: nenhuma palavra de cobrança sai
 * daqui. Quem cobra é a NZ, pelo canal dela.
 */
export async function titulosDoCliente(site: Db, userId: string, limite = 100): Promise<TituloPublico[]> {
  const { data: perfil } = await site.from('user_profiles').select('erp_client_id').eq('id', userId).maybeSingle();
  const clientId = (perfil as { erp_client_id?: string | null } | null)?.erp_client_id;
  if (!clientId) return [];

  const { data: donos } = await site.from('erp_titulo_dono').select('titulo_id').eq('erp_client_id', clientId).limit(limite * 3);
  const ids = ((donos ?? []) as { titulo_id: string }[]).map((d) => d.titulo_id);
  if (!ids.length) return [];

  const erp = await clienteErp();
  if (!erp) return [];
  const { data } = await erp.from('contas_receber').select(COLUNAS_TITULO).in('id', ids).is('deleted_at', null).order('vencimento', { ascending: false }).limit(limite);

  const hoje = new Date().toISOString().slice(0, 10);
  return ((data ?? []) as Record<string, unknown>[]).map((t) => {
    const status = String(t.status ?? '');
    const vencimento = (t.vencimento as string) ?? null;
    return {
      id: String(t.id),
      documento: (t.numero_documento as string) ?? null,
      valor: t.valor == null ? null : Number(t.valor),
      valorPago: t.valor_pago == null ? null : Number(t.valor_pago),
      vencimento,
      emissao: (t.data_emissao as string) ?? null,
      pagoEm: (t.data_pagamento as string) ?? null,
      status,
      statusRotulo: STATUS_TITULO[status] ?? status,
      vencido: status !== 'pago' && status !== 'cancelado' && Boolean(vencimento) && vencimento! < hoje,
      parcela: t.parcela_total && Number(t.parcela_total) > 1 ? `${t.parcela_numero ?? 1}/${t.parcela_total}` : null,
      notaFiscal: (t.nf_numero as string) ?? null,
      orcamento: (t.quote_number as string) ?? null,
      boletoUrl: (t.asaas_bank_slip_url as string) ?? null,
      faturaUrl: (t.asaas_invoice_url as string) ?? null,
      forma: (t.forma_pagamento as string) ?? null,
    };
  });
}
