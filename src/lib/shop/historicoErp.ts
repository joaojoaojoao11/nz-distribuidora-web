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
}

export interface PedidoErp {
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
  itens: ItemErp[];
  notas: { numero: string | null; chave: string | null; valor: number | null; em: string | null }[];
}

export interface TituloErp {
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

export interface HistoricoErp {
  vinculado: boolean;
  cliente: { id: string; nome: string | null; fantasia: string | null; documento: string | null; cidade: string | null; estado: string | null; clienteDesde: string | null } | null;
  pedidos: PedidoErp[];
  titulos: TituloErp[];
}

const VAZIO: HistoricoErp = { vinculado: false, cliente: null, pedidos: [], titulos: [] };

let emCache: { userId: string; dados: Promise<HistoricoErp> } | null = null;

export async function carregarHistoricoErp(userId: string | null | undefined): Promise<HistoricoErp> {
  if (!userId) return VAZIO;
  if (emCache?.userId === userId) return emCache.dados;

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
