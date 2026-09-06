// CPF/CNPJ no servidor. Espelha src/lib/documento.ts (o front valida para dar
// erro na hora; o servidor valida de novo porque o front é sugestão).

export function somenteDigitos(s: unknown): string {
  return typeof s === 'string' ? s.replace(/\D/g, '') : '';
}

export type TipoDocumento = 'cpf' | 'cnpj' | null;

export function tipoDocumento(raw: unknown): TipoDocumento {
  const d = somenteDigitos(raw);
  if (d.length === 11) return 'cpf';
  if (d.length === 14) return 'cnpj';
  return null;
}

function digitosIguais(d: string): boolean {
  return /^(\d)\1+$/.test(d);
}

export function validarCpf(raw: unknown): boolean {
  const d = somenteDigitos(raw);
  if (d.length !== 11 || digitosIguais(d)) return false;
  for (const [ate, pos] of [
    [9, 10],
    [10, 11],
  ] as const) {
    let soma = 0;
    for (let i = 0; i < ate; i++) soma += Number(d[i]) * (pos - i);
    const resto = (soma * 10) % 11 % 10;
    if (resto !== Number(d[ate])) return false;
  }
  return true;
}

export function validarCnpj(raw: unknown): boolean {
  const d = somenteDigitos(raw);
  if (d.length !== 14 || digitosIguais(d)) return false;
  for (const pesos of [
    [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  ]) {
    let soma = 0;
    for (let i = 0; i < pesos.length; i++) soma += Number(d[i]) * pesos[i];
    const resto = soma % 11;
    const dv = resto < 2 ? 0 : 11 - resto;
    if (dv !== Number(d[pesos.length])) return false;
  }
  return true;
}

export function validarCpfCnpj(raw: unknown): boolean {
  const t = tipoDocumento(raw);
  if (t === 'cpf') return validarCpf(raw);
  if (t === 'cnpj') return validarCnpj(raw);
  return false;
}

/** E-mail em minúsculas e sem espaço — a chave de comparação com o ERP. */
export function normalizarEmail(raw: unknown): string {
  return typeof raw === 'string' ? raw.trim().toLowerCase() : '';
}
