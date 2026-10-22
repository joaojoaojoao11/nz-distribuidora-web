// O histórico que o cliente já tinha na NZ antes do site — pedidos de balcão,
// notas fiscais e parcelas.
//
// Três telas querem isto (Início, Pedidos e Pagamentos) e a consulta atravessa
// duas bases. Então é UMA chamada por sessão, guardada aqui: quem chegar
// enquanto ela está no ar espera a mesma promessa, e quem chegar depois pega o
// resultado pronto. Trocar de usuário zera.
//
// O servidor é quem decide o que sai (api/_lib/conta/erpHistorico.ts, com lista
// branca de colunas). Aqui não há regra de segurança nenhuma — só cache.

import { supabase } from '../supabase';

export interface ItemErp {
  sku: string | null;
  nome: string | null;
  qtd: number | null;
  unidade: string | null;
  valorUnitario: number | null;
  total: number | null;
  /** O produto na loja (pelo SKU do ERP), para "comprar de novo". Nulo = fora do catálogo. */
  slug: string | null;
  disponivel: boolean;
  imagem: string | null;
  hex: string | null;
  codigo: string | null;
}

export interface PedidoErp {
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
  itens: ItemErp[];
  notas: { numero: string | null; chave: string | null; valor: number | null; em: string | null }[];
}

export type BlocoTitulo = 'vencido' | 'a_vencer' | 'pago';

export interface TituloErp {
  id: string;
  documento: string | null;
  valor: number | null;
  valorPago: number | null;
  /** O que falta pagar (valor − liquidado). */
  saldo: number | null;
  vencimento: string | null;
  emissao: string | null;
  pagoEm: string | null;
  status: string;
  statusRotulo: string;
  vencido: boolean;
  bloco: BlocoTitulo;
  parcela: string | null;
  notaFiscal: string | null;
  orcamento: string | null;
  boletoUrl: string | null;
  faturaUrl: string | null;
  pixPayload: string | null;
  pixExpira: string | null;
  linhaDigitavel: string | null;
  forma: string | null;
  /** Tem cobrança viva no Asaas: "Pagar" abre `faturaUrl`. */
  cobrancaViva: boolean;
  /** Em acordo/cedido: "combinado com a NZ", sem botão. */
  combinado: boolean;
  /** O site pode pedir a emissão da cobrança ("Gerar Pix/boleto"). */
  pagavel: boolean;
}

export interface HistoricoErp {
  vinculado: boolean;
  cliente: { id: string; nome: string | null; fantasia: string | null; documento: string | null; cidade: string | null; estado: string | null; clienteDesde: string | null } | null;
  pedidos: PedidoErp[];
  titulos: TituloErp[];
}

const VAZIO: HistoricoErp = { vinculado: false, cliente: null, pedidos: [], titulos: [] };

let emCache: { userId: string; dados: Promise<HistoricoErp> } | null = null;

export async function carregarHistoricoErp(userId: string | null | undefined, opcoes?: { fresco?: boolean }): Promise<HistoricoErp> {
  if (!userId) return VAZIO;
  // `fresco`: a aba Pagamentos consulta de novo ao voltar o foco — o cliente
  // pode ter acabado de pagar no Asaas em outra aba.
  if (!opcoes?.fresco && emCache?.userId === userId) return emCache.dados;

  const dados = (async () => {
    const { data: sessao } = await supabase.auth.getSession();
    const token = sessao.session?.access_token;
    if (!token) return VAZIO;
    const r = await fetch('/api/nz/conta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ op: 'historico-erp' }),
    });
    if (!r.ok) return VAZIO;
    return (await r.json()) as HistoricoErp;
  })().catch(() => VAZIO);

  emCache = { userId, dados };
  return dados;
}

/** Depois de um pedido novo ou de um cancelamento, o cache mente. */
export function esquecerHistoricoErp(): void {
  emCache = null;
}

export type ResultadoPagar = { ok: true; titulo: TituloErp; emitiu: boolean } | { ok: false; erro: string; mensagem: string };

/**
 * "Pagar" / "Gerar Pix/boleto" num título da NZ. O servidor confere que o
 * título é do cliente; se já tem cobrança viva devolve os links, senão pede ao
 * ERP a emissão. A mensagem de erro já vem pronta para a tela.
 */
export async function pagarTitulo(tituloId: string): Promise<ResultadoPagar> {
  const { data: sessao } = await supabase.auth.getSession();
  const token = sessao.session?.access_token;
  if (!token) return { ok: false, erro: 'sem-sessao', mensagem: 'Entre de novo para continuar.' };
  try {
    const r = await fetch('/api/nz/conta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ op: 'pagar-titulo', tituloId }),
    });
    const j = (await r.json().catch(() => null)) as { ok?: boolean; titulo?: TituloErp; emitiu?: boolean; error?: string; mensagem?: string } | null;
    if (!r.ok || !j?.ok || !j.titulo) {
      return { ok: false, erro: j?.error ?? 'falha', mensagem: j?.mensagem ?? 'Não foi possível gerar a cobrança agora. Tente de novo em instantes.' };
    }
    esquecerHistoricoErp();
    return { ok: true, titulo: j.titulo, emitiu: Boolean(j.emitiu) };
  } catch {
    return { ok: false, erro: 'rede', mensagem: 'Sem conexão. Tente de novo.' };
  }
}
