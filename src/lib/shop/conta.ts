// Cliente das ações de conta (/api/nz/conta) e da equipe (/api/nz/equipe),
// mais as máscaras que o cadastro, o painel e o checkout compartilham.

import { supabase } from '../supabase';

export class ContaError extends Error {
  codigo: string;
  extra: Record<string, unknown>;
  constructor(codigo: string, extra: Record<string, unknown> = {}) {
    super(codigo);
    this.name = 'ContaError';
    this.codigo = codigo;
    this.extra = extra;
  }
}

async function chamar<T>(acao: string, body: Record<string, unknown>): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const r = await fetch(`/api/nz/${acao}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  const j = (await r.json().catch(() => ({}))) as Record<string, unknown>;
  if (!r.ok) throw new ContaError(typeof j.error === 'string' ? j.error : `http-${r.status}`, j);
  return j as T;
}

export const chamarConta = <T,>(body: Record<string, unknown>) => chamar<T>('conta', body);
export const chamarEquipe = <T,>(body: Record<string, unknown>) => chamar<T>('equipe', body);

export interface Completude {
  completo: boolean;
  faltando: string[];
  rotulos: string[];
  aprovado: boolean;
  vinculadoErp: boolean;
}

export interface DadosDoErp {
  jaCliente: boolean;
  dados: Record<string, string> | null;
  aviso: string | null;
}

// ------------------------------------------------------------------ máscaras

/** (11) 99999-9999 — aceita fixo de 10 dígitos também. */
export function formatarTelefone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function telefoneOk(v: string): boolean {
  const d = v.replace(/\D/g, '');
  return d.length === 10 || d.length === 11;
}

export const UFS = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT',
  'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
] as const;

/** Mensagem curta para os erros que o usuário pode ver no cadastro/login. */
export const ERRO_CONTA: Record<string, string> = {
  'login-necessario': 'Entre na sua conta para continuar.',
  'documento-invalido': 'CPF/CNPJ inválido — confira os dígitos.',
  'muitas-consultas': 'Muitas consultas seguidas. Espere um minuto.',
  'perfil-nao-encontrado': 'Não encontrei seu cadastro.',
  'apenas-admin': 'Só administradores podem fazer isso.',
  'usuario-erp-nao-encontrado': 'Este usuário não existe mais no NZERP.',
  'sem-usuario-no-erp': 'Esta pessoa não tem usuário ativo no NZERP.',
  'nao-pode-se-desativar': 'Você não pode remover o seu próprio acesso.',
  'convite-nao-enviado': 'Não consegui enviar o e-mail de convite. Use o link para copiar.',
  'link-nao-gerado': 'Não consegui gerar o link de convite.',
};

export function textoDoErroConta(e: unknown): string {
  if (e instanceof ContaError) {
    const detalhe = typeof e.extra.detalhe === 'string' ? ` (${e.extra.detalhe})` : '';
    return (ERRO_CONTA[e.codigo] ?? 'Não consegui completar a ação. Tente de novo.') + detalhe;
  }
  return 'Falha de conexão. Tente de novo.';
}

/** Mensagens do Supabase Auth em português. */
export function textoDoErroAuth(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (m.includes('already registered') || m.includes('already been registered')) return 'Este e-mail já tem conta. Tente entrar ou recuperar a senha.';
  if (m.includes('password should be at least')) return 'A senha precisa de pelo menos 8 caracteres.';
  if (m.includes('email rate limit') || m.includes('over_email_send_rate_limit')) return 'Muitos e-mails em pouco tempo. Espere alguns minutos.';
  if (m.includes('for security purposes')) return 'Espere alguns segundos antes de tentar de novo.';
  if (m.includes('unable to validate email') || m.includes('invalid email')) return 'E-mail inválido.';
  if (m.includes('failed to fetch') || m.includes('networkerror')) return 'Erro de conexão. Verifique sua internet.';
  if (m.includes('user already registered')) return 'Este e-mail já tem conta.';
  if (m.includes('token has expired') || m.includes('invalid or has expired')) return 'Este link expirou. Peça um novo.';
  return msg;
}

// --------------------------------------------------- checklist no cliente
export interface PerfilChecklist {
  full_name?: string | null;
  cpf_cnpj?: string | null;
  phone?: string | null;
  address_street?: string | null;
  address_number?: string | null;
  address_city?: string | null;
  address_state?: string | null;
  address_zip?: string | null;
}

/**
 * Mesma regra de api/_lib/conta/completude.ts e do trigger
 * `nz_marcar_cadastro_completo`. Aqui só para mostrar o que falta enquanto o
 * usuário digita; quem decide é o servidor.
 */
export function faltasDoCadastro(p: PerfilChecklist | null | undefined): string[] {
  const cheio = (v: unknown) => typeof v === 'string' && v.trim() !== '';
  const faltas: string[] = [];
  if (!cheio(p?.full_name)) faltas.push('nome completo');
  if (!cheio(p?.cpf_cnpj)) faltas.push('CPF ou CNPJ');
  if (!cheio(p?.phone)) faltas.push('WhatsApp');
  if (!cheio(p?.address_street)) faltas.push('rua');
  if (!cheio(p?.address_number)) faltas.push('número');
  if (!cheio(p?.address_city)) faltas.push('cidade');
  if (!cheio(p?.address_state)) faltas.push('UF');
  if ((p?.address_zip ?? '').replace(/\D/g, '').length !== 8) faltas.push('CEP');
  return faltas;
}
