// Cliente do checkout (/api/nz/checkout) — tipos e chamadas, do lado do navegador.
//
// Nada aqui calcula valor: subtotal, desconto, frete e parcelas vêm do servidor
// e são exibidos como chegam. Dados de cartão passam por `pagar` uma vez e não
// ficam em estado global nem em storage.

import { supabase } from '../supabase';
import { validarCpfCnpj } from '../documento';

export type Forma = 'PIX' | 'BOLETO' | 'CREDIT_CARD';
export type StatusPagamento = 'aguardando' | 'em_analise' | 'pago' | 'recusado' | 'expirado' | 'vencido' | 'estornado' | 'cancelado' | 'nenhum';

export interface OpcaoFrete {
  id: string;
  nome: string;
  dias: number;
  valor: number;
  transportadora?: string;
  servico?: string;
  retirada?: boolean;
}

export interface Resumo {
  checkoutAtivo: boolean;
  itens: { slug: string; nome: string; unidade: 'rolo' | 'metro'; qtd: number; unit: number; total: number; metragem: number | null }[];
  invalidos: string[];
  subtotal: number;
  desconto: number;
  cupom: { codigo: string | null; invalido: boolean };
  fretes: OpcaoFrete[];
  freteSemPerfil: string[];
  parcelas: { n: number; valor: number }[];
  config: {
    pixExpiraMin: number;
    boletoVencimentoDias: number;
    boletoMinimo: number;
    cartaoMaxParcelas: number;
    cartaoParcelaMinima: number;
    retiradaEndereco: string;
    pedidoMinimo: number;
    freteGratisAcima: number | null;
  };
  faltando: string[];
  endereco: { rua: string | null; numero: string | null; complemento: string | null; bairro: string | null; cidade: string | null; uf: string | null; cep: string | null } | null;
}

export interface PagamentoPublico {
  id: string;
  forma: Forma;
  status: StatusPagamento;
  valor: number;
  parcelas: number;
  vencimento: string | null;
  expiraEm: string | null;
  pix: { payload: string; qrBase64: string | null } | null;
  boleto: { url: string | null; linhaDigitavel: string | null } | null;
  cartao: { bandeira: string | null; final: string | null } | null;
  invoiceUrl: string | null;
  reciboUrl: string | null;
  pagoEm: string | null;
  estornadoValor: number;
  criadoEm: string;
}

export interface PedidoStatus {
  pedido: {
    numero: number;
    status: string;
    pagamentoStatus: StatusPagamento;
    forma: Forma | null;
    cupom: string | null;
    frete: { id?: string; nome?: string; dias?: number; valor?: number; retirada?: boolean } | null;
    endereco: { rua?: string; numero?: string; complemento?: string; bairro?: string; cidade?: string; uf?: string; cep?: string } | null;
    valorFrete: number;
    desconto: number;
    total: number | null;
    erpQuoteNumber: number | null;
    pagoEm: string | null;
    criadoEm: string;
    itens: { slug: string | null; nome: string; codigo: string | null; imagem: string | null; hex: string | null; qtd: number; unidade: string; unit: number | null }[];
  };
  pagamento: PagamentoPublico | null;
  historico: PagamentoPublico[];
  agora: string;
}

export interface DadosCartaoForm {
  numero: string;
  nome: string;
  validade: string; // MM/AA
  cvv: string;
  cpf: string;
}

export class CheckoutError extends Error {
  codigo: string;
  extra: Record<string, unknown>;
  constructor(codigo: string, extra: Record<string, unknown> = {}) {
    super(codigo);
    this.codigo = codigo;
    this.extra = extra;
  }
}

async function token(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const t = data.session?.access_token;
  if (!t) throw new CheckoutError('login-necessario');
  return t;
}

export async function chamarCheckout<T>(body: Record<string, unknown>): Promise<T> {
  const r = await fetch('/api/nz/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await token()}` },
    body: JSON.stringify(body),
  });
  const j = (await r.json().catch(() => ({}))) as Record<string, unknown>;
  if (!r.ok) throw new CheckoutError(typeof j.error === 'string' ? j.error : `http-${r.status}`, j);
  return j as T;
}

/** Corpo do cartão no formato do servidor. */
export function cartaoParaEnvio(c: DadosCartaoForm) {
  const [mes = '', ano = ''] = c.validade.split('/');
  return { numero: c.numero.replace(/\D/g, ''), nome: c.nome.trim(), mes: mes.trim(), ano: ano.trim(), cvv: c.cvv.replace(/\D/g, ''), cpf: c.cpf.replace(/\D/g, '') };
}

// --------------------------------------------------------------- textos

export const ERRO_TEXTO: Record<string, string> = {
  'login-necessario': 'Sua sessão expirou. Entre de novo.',
  'aguardando-aprovacao': 'Seu cadastro ainda está em análise.',
  'checkout-desligado': 'O pagamento online ainda não está aberto. Envie o pedido pelo carrinho.',
  'pagamento-indisponivel': 'O sistema de pagamento não respondeu. Tente de novo em instantes.',
  'sem-itens': 'O carrinho está vazio.',
  'itens-invalidos': 'Alguns itens não estão mais disponíveis.',
  'cupom-invalido': 'Cupom inválido ou já usado.',
  'cadastro-incompleto': 'Complete o endereço e o CPF/CNPJ antes de pagar.',
  'frete-indisponivel': 'A opção de entrega mudou. Escolha de novo.',
  'pedido-minimo': 'O pedido não atinge o valor mínimo.',
  'boleto-minimo': 'Boleto só a partir do valor mínimo. Escolha Pix ou cartão.',
  'parcelas-invalidas': 'Número de parcelas indisponível para este valor.',
  'muitas-tentativas': 'Muitas tentativas de cartão. Aguarde 15 minutos ou pague com Pix.',
  'cartao-recusado': 'Cartão recusado. Confira os dados ou tente outro cartão.',
  'cartao-invalido': 'Confira o número, a validade e o CVV do cartão.',
  'aceite-necessario': 'É preciso aceitar os termos para continuar.',
  'forma-invalida': 'Escolha a forma de pagamento.',
  'pedido-nao-encontrado': 'Pedido não encontrado.',
  'pedido-nao-aceita-novo-pagamento': 'Este pedido não aceita um novo pagamento.',
  'erro-interno': 'Algo deu errado do nosso lado. Tente de novo.',
};

export function textoDoErro(e: unknown): string {
  if (e instanceof CheckoutError) return ERRO_TEXTO[e.codigo] ?? (typeof e.extra.message === 'string' ? e.extra.message : 'Não foi possível concluir.');
  if (e instanceof Error) return e.message;
  return 'Falha de rede.';
}

export const STATUS_PAGAMENTO_LABEL: Record<StatusPagamento, string> = {
  nenhum: 'Sem pagamento online',
  aguardando: 'Aguardando pagamento',
  em_analise: 'Em análise',
  pago: 'Pago',
  recusado: 'Recusado',
  expirado: 'Expirado',
  vencido: 'Vencido',
  estornado: 'Estornado',
  cancelado: 'Cancelado',
};

export const FORMA_LABEL: Record<Forma, string> = { PIX: 'Pix', BOLETO: 'Boleto', CREDIT_CARD: 'Cartão de crédito' };

// ------------------------------------------------------------- máscaras

export function formatarCep(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export function formatarNumeroCartao(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 19);
  return d.replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function formatarValidade(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

export function bandeiraDoNumero(numero: string): string | null {
  const d = numero.replace(/\D/g, '');
  if (/^4/.test(d)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(d)) return 'Mastercard';
  if (/^3[47]/.test(d)) return 'Amex';
  if (/^(4011|4312|4389|4514|4576|5041|5066|5067|509|6277|6362|6363|650|6516|6550)/.test(d)) return 'Elo';
  if (/^606282/.test(d)) return 'Hipercard';
  if (/^(30|36|38)/.test(d)) return 'Diners';
  return null;
}

/** Luhn — barra erro de digitação antes de ir ao servidor. */
export function luhnOk(numero: string): boolean {
  const d = numero.replace(/\D/g, '');
  if (d.length < 13) return false;
  let soma = 0;
  let dobra = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let n = Number(d[i]);
    if (dobra) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    soma += n;
    dobra = !dobra;
  }
  return soma % 10 === 0;
}

export function validadeOk(v: string): boolean {
  const m = /^(\d{2})\/(\d{2})$/.exec(v);
  if (!m) return false;
  const mes = Number(m[1]);
  const ano = 2000 + Number(m[2]);
  if (mes < 1 || mes > 12) return false;
  const agora = new Date();
  return ano > agora.getFullYear() || (ano === agora.getFullYear() && mes >= agora.getMonth() + 1);
}

export const CARTAO_VAZIO: DadosCartaoForm = { numero: '', nome: '', validade: '', cvv: '', cpf: '' };

/** Erros do cartão por campo; vazio = pronto para enviar. */
export function errosDoCartao(c: DadosCartaoForm): Partial<Record<keyof DadosCartaoForm, string>> {
  const e: Partial<Record<keyof DadosCartaoForm, string>> = {};
  if (!luhnOk(c.numero)) e.numero = 'Número inválido';
  if (c.nome.trim().length < 3) e.nome = 'Nome como está no cartão';
  if (!validadeOk(c.validade)) e.validade = 'MM/AA';
  if (!/^\d{3,4}$/.test(c.cvv)) e.cvv = '3 ou 4 dígitos';
  if (!validarCpfCnpj(c.cpf)) e.cpf = 'CPF/CNPJ do titular';
  return e;
}

export async function buscarCep(cep: string, signal?: AbortSignal): Promise<{ logradouro: string; bairro: string; localidade: string; uf: string } | null> {
  const d = cep.replace(/\D/g, '');
  if (d.length !== 8) return null;
  try {
    const r = await fetch(`https://viacep.com.br/ws/${d}/json/`, { signal });
    if (!r.ok) return null;
    const j = (await r.json()) as { erro?: boolean | string; logradouro?: string; bairro?: string; localidade?: string; uf?: string };
    if (j.erro || !j.localidade) return null;
    return { logradouro: j.logradouro ?? '', bairro: j.bairro ?? '', localidade: j.localidade, uf: j.uf ?? '' };
  } catch {
    return null;
  }
}

export async function copiar(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}
