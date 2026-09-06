// Cliente HTTP do Asaas — só no servidor.
//
// A chave (`ASAAS_API_KEY`) fica em variável de ambiente da Vercel, nunca com
// prefixo VITE_, nunca no banco. Autenticação é o cabeçalho `access_token`
// (não é Bearer). GET vai SEM Content-Type — com ele o Asaas responde 403.
//
// Ambiente: `ASAAS_ENV=sandbox` aponta para api-sandbox e usa
// `ASAAS_SANDBOX_API_KEY`. Conta, clientes e cobranças do sandbox não existem
// na produção; por isso o id do cliente é guardado junto com o ambiente.
//
// Nada aqui grava ou loga dado de cartão. O corpo de uma cobrança com cartão
// passa por esta função e vai embora; quem chama não guarda o objeto.

export type AsaasEnv = 'production' | 'sandbox';

const BASES: Record<AsaasEnv, string> = {
  production: 'https://api.asaas.com/v3',
  sandbox: 'https://api-sandbox.asaas.com/v3',
};

const TIMEOUT_MS = 15_000;

export function asaasEnv(): AsaasEnv {
  return process.env.ASAAS_ENV === 'sandbox' ? 'sandbox' : 'production';
}

function apiKey(): string {
  return (asaasEnv() === 'sandbox' ? process.env.ASAAS_SANDBOX_API_KEY : process.env.ASAAS_API_KEY) || '';
}

export function asaasConfigurado(): boolean {
  return Boolean(apiKey());
}

export class AsaasError extends Error {
  status: number;
  code: string | null;
  body: unknown;
  constructor(status: number, message: string, body: unknown, code: string | null = null) {
    super(message);
    this.name = 'AsaasError';
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

interface AsaasErroCorpo {
  errors?: { code?: string; description?: string }[];
  message?: string;
}

/**
 * fetch com timeout real, tratamento de 429 (uma espera pelo RateLimit-Reset)
 * e erro tipado. `body` é serializado aqui para o Content-Type só existir
 * quando há corpo.
 */
export async function asaasFetch<T = unknown>(
  path: string,
  init: { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; body?: unknown } = {},
  tentativa = 0
): Promise<T> {
  const key = apiKey();
  if (!key) throw new AsaasError(500, 'Asaas não configurado (ASAAS_API_KEY ausente)', null, 'nao-configurado');

  const headers: Record<string, string> = {
    access_token: key,
    Accept: 'application/json',
    'User-Agent': 'NZSTORE (nzgroup.com.br)',
  };
  let corpo: string | undefined;
  if (init.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    corpo = JSON.stringify(init.body);
  }

  let res: Response;
  try {
    res = await fetch(`${BASES[asaasEnv()]}${path}`, {
      method: init.method ?? 'GET',
      headers,
      body: corpo,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const msg = err instanceof Error && err.name === 'TimeoutError' ? 'Asaas não respondeu a tempo' : `Asaas inacessível: ${err instanceof Error ? err.message : String(err)}`;
    throw new AsaasError(0, msg, null, 'rede');
  }

  if (res.status === 429 && tentativa < 1) {
    const reset = Number(res.headers.get('RateLimit-Reset') || '2');
    await new Promise((r) => setTimeout(r, Math.min(Math.max(reset, 1), 8) * 1000));
    return asaasFetch<T>(path, init, tentativa + 1);
  }

  const texto = await res.text();
  let json: unknown = null;
  try {
    json = texto ? JSON.parse(texto) : null;
  } catch {
    json = { raw: texto.slice(0, 500) };
  }

  if (!res.ok) {
    const e = (json ?? {}) as AsaasErroCorpo;
    const primeiro = e.errors?.[0];
    const msg =
      res.status === 401 || res.status === 403
        ? 'Chave do Asaas inválida, expirada ou sem permissão'
        : primeiro?.description || e.message || `Asaas HTTP ${res.status}`;
    throw new AsaasError(res.status, msg, json, primeiro?.code ?? null);
  }
  return json as T;
}

// ----------------------------------------------------------------- tipos

export interface AsaasCustomer {
  id: string;
  name: string;
  cpfCnpj: string;
  email?: string;
  deleted?: boolean;
}

export type AsaasBillingType = 'PIX' | 'BOLETO' | 'CREDIT_CARD';

export interface AsaasPayment {
  id: string;
  customer: string;
  billingType: string;
  status: string;
  value: number;
  netValue?: number | null;
  dueDate: string;
  externalReference?: string | null;
  invoiceUrl?: string | null;
  bankSlipUrl?: string | null;
  transactionReceiptUrl?: string | null;
  nossoNumero?: string | null;
  pixTransaction?: string | null;
  installmentNumber?: number | null;
  paymentDate?: string | null;
  confirmedDate?: string | null;
  clientPaymentDate?: string | null;
  deleted?: boolean;
  creditCard?: { creditCardNumber?: string; creditCardBrand?: string; creditCardToken?: string } | null;
}

export interface AsaasPixQr {
  encodedImage: string;
  payload: string;
  expirationDate: string;
}

export interface AsaasLinhaDigitavel {
  identificationField: string;
  nossoNumero: string;
  barCode: string;
}

// ------------------------------------------------------------- clientes

export async function buscarClientePorDocumento(cpfCnpj: string): Promise<AsaasCustomer | null> {
  const digitos = cpfCnpj.replace(/\D/g, '');
  if (!digitos) return null;
  const r = await asaasFetch<{ data?: AsaasCustomer[] }>(`/customers?cpfCnpj=${digitos}&limit=1`);
  const c = r.data?.find((x) => !x.deleted) ?? null;
  return c;
}

export interface NovoCliente {
  name: string;
  cpfCnpj: string;
  email?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
  externalReference?: string;
  company?: string;
}

export async function criarCliente(dados: NovoCliente): Promise<AsaasCustomer> {
  return asaasFetch<AsaasCustomer>('/customers', { method: 'POST', body: { ...dados, notificationDisabled: false } });
}

// ------------------------------------------------------------ cobranças

export async function criarCobranca(payload: Record<string, unknown>): Promise<AsaasPayment> {
  return asaasFetch<AsaasPayment>('/payments', { method: 'POST', body: payload });
}

export async function consultarCobranca(id: string): Promise<AsaasPayment> {
  return asaasFetch<AsaasPayment>(`/payments/${encodeURIComponent(id)}`);
}

export async function removerCobranca(id: string): Promise<void> {
  await asaasFetch(`/payments/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function qrCodePix(id: string): Promise<AsaasPixQr> {
  return asaasFetch<AsaasPixQr>(`/payments/${encodeURIComponent(id)}/pixQrCode`);
}

export async function linhaDigitavel(id: string): Promise<AsaasLinhaDigitavel> {
  return asaasFetch<AsaasLinhaDigitavel>(`/payments/${encodeURIComponent(id)}/identificationField`);
}

export async function estornarCobranca(id: string, valor?: number, descricao?: string): Promise<AsaasPayment> {
  const body: Record<string, unknown> = {};
  if (valor != null) body.value = valor;
  if (descricao) body.description = descricao;
  return asaasFetch<AsaasPayment>(`/payments/${encodeURIComponent(id)}/refund`, { method: 'POST', body });
}

/** Só no sandbox: simula o pagamento de uma cobrança e dispara os webhooks. */
export async function sandboxConfirmar(id: string): Promise<AsaasPayment> {
  if (asaasEnv() !== 'sandbox') throw new AsaasError(400, 'Só existe no sandbox', null, 'ambiente');
  return asaasFetch<AsaasPayment>(`/sandbox/payment/${encodeURIComponent(id)}/confirm`, { method: 'POST', body: {} });
}

// ------------------------------------------------------------- webhooks

export interface AsaasWebhook {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  interrupted: boolean;
  events: string[];
  sendType?: string;
}

export async function listarWebhooks(): Promise<AsaasWebhook[]> {
  const r = await asaasFetch<{ data?: AsaasWebhook[] }>('/webhooks');
  return r.data ?? [];
}

export async function criarWebhook(dados: { name: string; url: string; email: string; authToken: string; events: string[] }): Promise<AsaasWebhook> {
  return asaasFetch<AsaasWebhook>('/webhooks', {
    method: 'POST',
    body: { ...dados, enabled: true, interrupted: false, apiVersion: 3, sendType: 'SEQUENTIALLY' },
  });
}

export async function atualizarWebhook(id: string, patch: Record<string, unknown>): Promise<AsaasWebhook> {
  return asaasFetch<AsaasWebhook>(`/webhooks/${encodeURIComponent(id)}`, { method: 'PUT', body: patch });
}

// ------------------------------------------------------------ utilidade

/**
 * O que pode ser guardado de uma cobrança. Remove o token do cartão — com a
 * nossa chave ele permite cobrar de novo o cartão do cliente, então não fica
 * em tabela nenhuma.
 */
export function sanitizarPagamento(p: AsaasPayment | Record<string, unknown>): Record<string, unknown> {
  const copia: Record<string, unknown> = { ...(p as Record<string, unknown>) };
  const cc = copia.creditCard as Record<string, unknown> | null | undefined;
  if (cc && typeof cc === 'object') {
    copia.creditCard = { creditCardNumber: cc.creditCardNumber ?? null, creditCardBrand: cc.creditCardBrand ?? null };
  }
  return copia;
}

/** Data de hoje em São Paulo, no formato que o Asaas usa (YYYY-MM-DD). */
export function hojeBr(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

/** Soma N dias úteis (sábado e domingo fora; feriado não entra) a uma data YYYY-MM-DD. */
export function somarDiasUteis(iso: string, dias: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  let restam = Math.max(0, Math.floor(dias));
  while (restam > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) restam--;
  }
  return d.toISOString().slice(0, 10);
}

/** Primeiro IP de x-forwarded-for — o do comprador, que o antifraude exige. */
export function ipDoCliente(headers: Record<string, string | string[] | undefined>): string {
  const xff = headers['x-forwarded-for'];
  const bruto = Array.isArray(xff) ? xff[0] : xff;
  const primeiro = (bruto ?? '').split(',')[0]?.trim();
  if (primeiro) return primeiro;
  const real = headers['x-real-ip'];
  return (Array.isArray(real) ? real[0] : real) || '';
}
