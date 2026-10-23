// CPF/CNPJ no servidor. Espelha src/lib/documento.ts (o front valida para dar
// erro na hora; o servidor valida de novo porque o front é sugestão).
//
// CNPJ com letras (Receita, desde julho de 2026): 12 posições de letras
// maiúsculas ou números + 2 verificadores numéricos; no cálculo, cada posição
// vale código − 48. Documento guardado: sem pontuação, em maiúsculas
// (normalizarDocumento) — o que já existe (só números) fica igual.

/** Só os números — para telefone, CEP etc. NÃO use para documento (tira as letras do CNPJ). */
export function somenteDigitos(s: unknown): string {
  return typeof s === 'string' ? s.replace(/\D/g, '') : '';
}

/** CPF/CNPJ como o sistema guarda: sem pontuação, letras em maiúsculas. */
export function normalizarDocumento(s: unknown): string {
  return typeof s === 'string' ? s.toUpperCase().replace(/[^0-9A-Z]/g, '') : '';
}

const CPF = /^\d{11}$/;
const CNPJ = /^[0-9A-Z]{12}\d{2}$/;

export type TipoDocumento = 'cpf' | 'cnpj' | null;

export function tipoDocumento(raw: unknown): TipoDocumento {
  const d = normalizarDocumento(raw);
  if (CPF.test(d)) return 'cpf';
  if (CNPJ.test(d)) return 'cnpj';
  return null;
}

function digitosIguais(d: string): boolean {
  return /^(.)\1+$/.test(d);
}

export function validarCpf(raw: unknown): boolean {
  const d = normalizarDocumento(raw);
  if (!CPF.test(d) || digitosIguais(d)) return false;
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
  const d = normalizarDocumento(raw);
  if (!CNPJ.test(d) || digitosIguais(d)) return false;
  for (const pesos of [
    [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  ]) {
    let soma = 0;
    for (let i = 0; i < pesos.length; i++) soma += (d.charCodeAt(i) - 48) * pesos[i];
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

/** O documento como o NZERP costuma gravar (metade da base tem máscara, metade não). */
export function documentoComMascara(d: string): string {
  if (CPF.test(d)) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  if (CNPJ.test(d)) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  return d;
}
