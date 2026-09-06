// Rótulos de pedido e pagamento, em português de cliente.
//
// Vieram do arquivão do painel; agora três telas usam (Início, Pedidos e
// Pagamentos) e não podem divergir — "FATURADO" tem que dizer a mesma coisa nas
// três. Os códigos crus são os do NZERP e do Asaas; nenhum deles aparece na
// tela sem passar por aqui.

export interface PedidoResumo {
  id: string;
  numero: number;
  status: string;
  pagamento_status: string | null;
  total_estimado: number | null;
  total_final: number | null;
  criado_em: string;
}

export const STATUS_LABEL: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  ABERTO: 'Enviado — aguardando o vendedor',
  AGUARDANDO: 'Aguardando',
  APROVADO: 'Aprovado',
  FATURADO: 'Faturado',
  FATURADO_PARCIAL: 'Faturado parcialmente',
  PREPARANDO_ENVIO: 'Preparando envio',
  PRONTO_ENVIO: 'Pronto para envio',
  ENVIADO: 'Enviado',
  ENTREGUE: 'Entregue',
  NAO_ENTREGUE: 'Não entregue',
  DADOS_INCOMPLETOS: 'Dados incompletos',
  NAO_APROVADO: 'Não aprovado',
  CANCELADO: 'Cancelado',
};

export const PAGAMENTO_LABEL: Record<string, string> = {
  aguardando: 'Aguardando pagamento',
  em_analise: 'Pagamento em análise',
  pago: 'Pago',
  recusado: 'Cartão recusado',
  expirado: 'Pix expirado',
  vencido: 'Boleto vencido',
  estornado: 'Estornado',
  cancelado: 'Pagamento cancelado',
};

export const FORMA_LABEL: Record<string, string> = {
  PIX: 'Pix',
  BOLETO: 'Boleto',
  CREDIT_CARD: 'Cartão de crédito',
  CARTAO: 'Cartão de crédito',
};

/** Um pedido ainda mexe? Serve para "em andamento" e para o "comprar de novo". */
export const ENCERRADO = ['FATURADO', 'ENTREGUE', 'CANCELADO', 'NAO_APROVADO', 'NAO_ENTREGUE'];

/** Como o chip de pagamento deve ser pintado. */
export function tomDoPagamento(status: string | null | undefined): 'ok' | 'pendente' | 'ruim' | null {
  if (!status || status === 'nenhum') return null;
  if (status === 'pago') return 'ok';
  if (status === 'aguardando' || status === 'em_analise') return 'pendente';
  return 'ruim';
}
