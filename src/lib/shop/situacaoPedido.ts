// Situação do pedido para o admin: UMA frase, em português, que cruza o
// pagamento (Asaas), o orçamento (espelho do NZERP) e o envio ao ERP.
//
// Até 20/10/2026 a lista do admin mostrava um chip de pagamento e o status cru
// do ERP lado a lado, e cabia ao vendedor deduzir "pago mas o ERP não sabe" ou
// "orçamento parado esperando eu clicar". Aqui essa dedução é feita uma vez,
// com teste (`npm run pedidos:test`), e vale para a lista, o detalhe e o
// contador do menu — os três não podem divergir.
//
// Filas são o jeito de trabalhar a lista: o que precisa de um clique meu, o
// que está pago e espera separação, o que depende do cliente, o que já anda
// sozinho no ERP, o que acabou e o que não deu certo.

export type Tom = 'ok' | 'atencao' | 'erro' | 'info' | 'neutro';
export type Fila = 'acao' | 'novos' | 'cliente' | 'andamento' | 'concluido' | 'parado';

export interface PedidoSituacao {
  /** Espelho do NZERP (RASCUNHO, SOLICITADO, ABERTO, APROVADO, FATURADO…). */
  status: string;
  /** nenhum · aguardando · em_analise · pago · recusado · expirado · vencido · estornado · cancelado */
  pagamento_status: string | null;
  forma_pagamento: string | null;
  erp_envio: string | null;
  erp_envio_erro?: string | null;
  erp_pago_em: string | null;
  erp_quote_number: number | null;
  /** Da cobrança atual (Pix). */
  expira_em?: string | null;
  /** Da cobrança atual (boleto), YYYY-MM-DD. */
  vencimento?: string | null;
}

export interface Situacao {
  rotulo: string;
  detalhe: string | null;
  tom: Tom;
  fila: Fila;
  /** Botão que resolve a situação, quando existe um. */
  acao: 'enviar-erp' | null;
}

export const FILAS: { id: Fila; rotulo: string; descricao: string }[] = [
  { id: 'acao', rotulo: 'Precisa de ação', descricao: 'Pago que o NZERP não recebeu, orçamento esperando o vendedor, dados incompletos.' },
  { id: 'novos', rotulo: 'Pagos · a separar', descricao: 'Pagamento confirmado e orçamento aprovado no NZERP, ainda não faturado.' },
  { id: 'cliente', rotulo: 'Aguardando cliente', descricao: 'Pix ou boleto em aberto, cartão em análise.' },
  { id: 'andamento', rotulo: 'Em andamento', descricao: 'Faturado, preparando ou enviado — anda no NZERP.' },
  { id: 'concluido', rotulo: 'Concluídos', descricao: 'Entregues.' },
  { id: 'parado', rotulo: 'Não concluídos', descricao: 'Cancelados, estornados, recusados, expirados, vencidos.' },
];

const ERP_ROTULO: Record<string, string> = {
  FATURADO: 'faturado',
  FATURADO_PARCIAL: 'faturado em parte',
  PREPARANDO_ENVIO: 'preparando envio',
  PRONTO_ENVIO: 'pronto para envio',
  ENVIADO: 'enviado',
  ENTREGUE: 'entregue',
};
const ERP_EM_OPERACAO = new Set(['FATURADO', 'FATURADO_PARCIAL', 'PREPARANDO_ENVIO', 'PRONTO_ENVIO', 'ENVIADO']);

const hora = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const dia = (ymd: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(ymd);
  return m ? `${m[3]}/${m[2]}` : ymd;
};

export function situacaoDoPedido(p: PedidoSituacao, agora: number = Date.now()): Situacao {
  const pg = p.pagamento_status || 'nenhum';
  const s = (rotulo: string, tom: Tom, fila: Fila, detalhe: string | null = null, acao: Situacao['acao'] = null): Situacao => ({ rotulo, detalhe, tom, fila, acao });

  // ------------------------------------------------------------ encerrados
  if (p.status === 'CANCELADO') {
    if (pg === 'pago') return s('Cancelado · estava pago', 'atencao', 'parado', 'conferir se houve estorno');
    return s('Cancelado', 'neutro', 'parado');
  }
  if (pg === 'estornado') return s('Estornado', 'neutro', 'parado');

  // ------------------------------------------------------------------ pago
  if (pg === 'pago') {
    if (!p.erp_quote_number || p.erp_envio !== 'enviado') {
      return s('Pago · NZERP não recebeu', 'erro', 'acao', p.erp_envio_erro || 'o orçamento ainda não foi criado', 'enviar-erp');
    }
    if (!p.erp_pago_em) return s('Pago · NZERP não avisado', 'erro', 'acao', 'o orçamento existe, mas não sabe do pagamento', 'enviar-erp');
    if (p.status === 'ENTREGUE') return s('Pago · entregue', 'ok', 'concluido');
    if (ERP_EM_OPERACAO.has(p.status)) return s(`Pago · ${ERP_ROTULO[p.status] ?? p.status.toLowerCase()}`, 'ok', 'andamento');
    if (p.status === 'NAO_ENTREGUE') return s('Pago · não entregue', 'erro', 'acao', 'a transportadora devolveu');
    if (p.status === 'NAO_APROVADO') return s('Pago · reprovado no NZERP', 'erro', 'acao', 'o vendedor reprovou um pedido pago');
    return s('Pago · a separar', 'ok', 'novos', `orçamento ${p.erp_quote_number} aprovado no NZERP`);
  }

  // ---------------------------------------------------- pagamento em aberto
  if (pg === 'aguardando') {
    if (p.forma_pagamento === 'PIX') {
      const venceu = p.expira_em ? new Date(p.expira_em).getTime() < agora : false;
      return s('Aguardando Pix', 'atencao', 'cliente', p.expira_em ? (venceu ? 'prazo venceu, vai expirar' : `expira às ${hora(p.expira_em)}`) : null);
    }
    if (p.forma_pagamento === 'BOLETO') return s('Aguardando boleto', 'atencao', 'cliente', p.vencimento ? `vence ${dia(p.vencimento)}` : null);
    return s('Aguardando cartão', 'atencao', 'cliente');
  }
  if (pg === 'em_analise') return s('Cartão em análise', 'atencao', 'cliente', 'análise antifraude do Asaas');

  // --------------------------------------------------- pagamento não concluído
  if (pg === 'recusado') return s('Cartão recusado', 'erro', 'parado', 'o cliente pode pagar de outra forma');
  if (pg === 'expirado') return s('Pix expirado', 'erro', 'parado', 'o cliente pode gerar outro');
  if (pg === 'vencido') return s('Boleto vencido', 'erro', 'parado', 'o cliente pode gerar outro');
  if (pg === 'cancelado') return s('Pagamento cancelado', 'neutro', 'parado');

  // ------------------------------------------- orçamento (sem pagamento online)
  if (p.status === 'SOLICITADO') return s('Orçamento · aguardando vendedor', 'info', 'acao', 'enviar ao NZERP para virar orçamento', 'enviar-erp');
  if (p.status === 'RASCUNHO') return s('Rascunho', 'neutro', 'parado', 'nunca foi fechado');
  if (p.status === 'DADOS_INCOMPLETOS') return s('Orçamento · dados incompletos', 'atencao', 'acao', 'o NZERP pede dados do cliente');
  if (p.status === 'NAO_APROVADO') return s('Orçamento · não aprovado', 'neutro', 'parado');
  if (p.status === 'NAO_ENTREGUE') return s('Orçamento · não entregue', 'erro', 'acao', 'a transportadora devolveu');
  if (p.status === 'ENTREGUE') return s('Orçamento · entregue', 'ok', 'concluido');
  if (ERP_EM_OPERACAO.has(p.status)) return s(`Orçamento · ${ERP_ROTULO[p.status] ?? p.status.toLowerCase()}`, 'ok', 'andamento');
  if (p.status === 'APROVADO') return s('Orçamento · aprovado no NZERP', 'info', 'andamento', 'o vendedor fatura');
  return s('Orçamento · no NZERP', 'info', 'andamento', 'o vendedor fecha com o cliente');
}

/** Conta quantos pedidos caem em cada fila. */
export function contarFilas(pedidos: readonly PedidoSituacao[], agora: number = Date.now()): Record<Fila, number> {
  const c: Record<Fila, number> = { acao: 0, novos: 0, cliente: 0, andamento: 0, concluido: 0, parado: 0 };
  for (const p of pedidos) c[situacaoDoPedido(p, agora).fila]++;
  return c;
}

/** O que o contador do menu mostra: o que pede um clique e o que está pago esperando. */
export function pedeAtencao(p: PedidoSituacao, agora: number = Date.now()): boolean {
  const f = situacaoDoPedido(p, agora).fila;
  return f === 'acao' || f === 'novos';
}
