// Máscaras e normalizações de formulário.
// Consolidado a partir do que já existia espalhado no projeto:
//   - formatPhone: FindInstaller.tsx
//   - buscarCep:   WarrantyRegistration.tsx (handleCepChange)
// As páginas antigas ainda têm as cópias locais; migrar depois do Festival.

/** (00) 00000-0000 — celular BR, corta em 11 dígitos. */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/** Telefone mascarado -> E.164 (+5511999998888). Retorna '' se não tiver 10/11 dígitos. */
export function toE164(masked: string): string {
  const digits = masked.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 11) return '';
  return `+55${digits}`;
}

export function isValidPhone(masked: string): boolean {
  return toE164(masked) !== '';
}

/**
 * Aceita "@nome", "nome", "instagram.com/nome/", "https://www.instagram.com/nome?igsh=..."
 * e devolve sempre "nome" em minúsculas.
 */
export function normalizeInstagram(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^(www\.)?instagram\.com\//i, '')
    .split(/[/?#]/)[0]
    .replace(/^@+/, '')
    .toLowerCase();
}

export function isValidInstagram(value: string): boolean {
  const handle = normalizeInstagram(value);
  return /^[a-z0-9._]{2,30}$/.test(handle);
}

/** 00000-000 */
export function formatCep(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export interface EnderecoViaCep {
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export type CepResult =
  | { ok: true; data: EnderecoViaCep }
  | { ok: false; reason: 'invalido' | 'nao_encontrado' | 'rede' };

/**
 * ViaCEP. Diferente do handleCepChange original, devolve o motivo da falha
 * em vez de só console.error — a página precisa avisar o usuário quando o
 * autopreenchimento não veio (autódromo, 4G ruim).
 */
export async function buscarCep(cep: string): Promise<CepResult> {
  const digits = cep.replace(/\D/g, '');
  if (digits.length !== 8) return { ok: false, reason: 'invalido' };

  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    if (!res.ok) return { ok: false, reason: 'rede' };
    const data = await res.json();
    if (data.erro) return { ok: false, reason: 'nao_encontrado' };
    return {
      ok: true,
      data: {
        logradouro: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        uf: data.uf || '',
      },
    };
  } catch {
    return { ok: false, reason: 'rede' };
  }
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}
