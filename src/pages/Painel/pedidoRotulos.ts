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
  SOLICITADO: 'Solicitado — o vendedor vai montar o orçamento',
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

/**
 * O cliente pode cancelar sozinho?
 *
 * A régua é a MESMA da função `site_cancelar_pedido` no ERP — o servidor é quem
 * decide de verdade; aqui é só para não oferecer um botão que vai ser recusado.
 * SOLICITADO é a exceção que confirma: esse pedido nem chegou ao ERP, então
 * quem cancela é só o site.
 * De APROVADO em diante houve separação, nota ou coleta: desfazer é decisão de
 * vendedor. E pago nunca: aí é estorno, não cancelamento.
 */
const CANCELAVEIS = new Set(['RASCUNHO', 'SOLICITADO', 'ABERTO', 'AGUARDANDO', 'DADOS_INCOMPLETOS', 'NAO_APROVADO']);

export function podeCancelar(pedido: { status: string; pagamento_status: string | null }): boolean {
  if (pedido.pagamento_status === 'pago') return false;
  return CANCELAVEIS.has(pedido.status);
}

/** Como o chip de pagamento deve ser pintado. */
export function tomDoPagamento(status: string | null | undefined): 'ok' | 'pendente' | 'ruim' | null {
  if (!status || status === 'nenhum') return null;
  if (status === 'pago') return 'ok';
  if (status === 'aguardando' || status === 'em_analise') return 'pendente';
  return 'ruim';
}
