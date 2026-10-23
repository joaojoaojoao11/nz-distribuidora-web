// CPF / CNPJ — validação pelos dígitos verificadores e formatação.
//
// Só o que o cadastro precisa: dizer se o número é válido antes de gravar, e
// exibir com pontuação. Nada de consulta externa.
//
// CNPJ com letras (Receita, desde julho de 2026): as 12 primeiras posições
// podem ser letras maiúsculas ou números; os 2 verificadores continuam números.
// O cálculo é o mesmo de sempre, com o valor de cada posição = código − 48
// (número vale ele mesmo; A = 17 … Z = 42). Ex.: 12.ABC.345/01DE-35.
// Documento guardado: sem pontuação e em maiúsculas (normalizarDocumento) — o
// que já existe (só números) fica igual.

/** Só os números — para telefone, CEP etc. NÃO use para documento (tira as letras do CNPJ). */
export function somenteDigitos(s: string): string {
  return (s ?? '').replace(/\D/g, '');
}

/** CPF/CNPJ como o sistema guarda: sem pontuação, letras em maiúsculas. */
export function normalizarDocumento(s: string): string {
  return (s ?? '').toUpperCase().replace(/[^0-9A-Z]/g, '');
}

const CPF = /^\d{11}$/;
const CNPJ = /^[0-9A-Z]{12}\d{2}$/;

function dvMod11(base: string, pesos: number[]): number {
  const soma = base.split('').reduce((acc, c, i) => acc + (c.charCodeAt(0) - 48) * pesos[i]!, 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function validarCpf(raw: string): boolean {
  const d = normalizarDocumento(raw);
  if (!CPF.test(d) || /^(\d)\1{10}$/.test(d)) return false;
  const dv1 = dvMod11(d.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const dv2 = dvMod11(d.slice(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d[9] === String(dv1) && d[10] === String(dv2);
}

export function validarCnpj(raw: string): boolean {
  const d = normalizarDocumento(raw);
  if (!CNPJ.test(d) || /^(.)\1{13}$/.test(d)) return false;
  const dv1 = dvMod11(d.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const dv2 = dvMod11(d.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d[12] === String(dv1) && d[13] === String(dv2);
}

export type TipoDocumento = 'cpf' | 'cnpj' | null;

export function tipoDocumento(raw: string): TipoDocumento {
  const d = normalizarDocumento(raw);
  if (CPF.test(d)) return 'cpf';
  if (CNPJ.test(d)) return 'cnpj';
  return null;
}

export function validarCpfCnpj(raw: string): boolean {
  const t = tipoDocumento(raw);
  if (t === 'cpf') return validarCpf(raw);
  if (t === 'cnpj') return validarCnpj(raw);
  return false;
}

export function formatarCpfCnpj(raw: string): string {
  const d = normalizarDocumento(raw);
  if (CPF.test(d)) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  if (CNPJ.test(d)) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  return raw;
}

const juntarPartes = (partes: string[], seps: string[]) => partes.reduce((acc, p, i) => (p ? acc + (i ? seps[i - 1] : '') + p : acc), '');

/**
 * Campo de CPF/CNPJ enquanto a pessoa digita: aceita letras (CNPJ novo), passa
 * para maiúsculas e põe a pontuação. Até 11 posições só de números é CPF
 * (000.000.000-00); com letra ou a partir da 12ª posição vira CNPJ
 * (00.000.000/0000-00). Para em 14.
 */
export function digitandoDocumento(v: string): string {
  const d = normalizarDocumento(v).slice(0, 14);
  if (d.length <= 11 && /^\d*$/.test(d)) return juntarPartes([d.slice(0, 3), d.slice(3, 6), d.slice(6, 9), d.slice(9, 11)], ['.', '.', '-']);
  return juntarPartes([d.slice(0, 2), d.slice(2, 5), d.slice(5, 8), d.slice(8, 12), d.slice(12, 14)], ['.', '.', '/', '-']);
}
