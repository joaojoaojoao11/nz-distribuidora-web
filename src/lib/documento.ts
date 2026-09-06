// CPF / CNPJ — validação pelos dígitos verificadores e formatação.
//
// Só o que o cadastro precisa: dizer se o número é válido antes de gravar, e
// exibir com pontuação. Nada de consulta externa.

export function somenteDigitos(s: string): string {
  return (s ?? '').replace(/\D/g, '');
}

function dvMod11(base: string, pesos: number[]): number {
  const soma = base.split('').reduce((acc, d, i) => acc + Number(d) * pesos[i]!, 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function validarCpf(raw: string): boolean {
  const d = somenteDigitos(raw);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const dv1 = dvMod11(d.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const dv2 = dvMod11(d.slice(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d[9] === String(dv1) && d[10] === String(dv2);
}

export function validarCnpj(raw: string): boolean {
  const d = somenteDigitos(raw);
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const dv1 = dvMod11(d.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const dv2 = dvMod11(d.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d[12] === String(dv1) && d[13] === String(dv2);
}

export type TipoDocumento = 'cpf' | 'cnpj' | null;

export function tipoDocumento(raw: string): TipoDocumento {
  const d = somenteDigitos(raw);
  if (d.length === 11) return 'cpf';
  if (d.length === 14) return 'cnpj';
  return null;
}

export function validarCpfCnpj(raw: string): boolean {
  const t = tipoDocumento(raw);
  if (t === 'cpf') return validarCpf(raw);
  if (t === 'cnpj') return validarCnpj(raw);
  return false;
}

export function formatarCpfCnpj(raw: string): string {
  const d = somenteDigitos(raw);
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  return raw;
}
