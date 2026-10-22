// O campo "E-mail, CPF ou CNPJ" da tela Entrar (plano de login por documento, Fase 1).
// Puro e sem Supabase, para o autoteste (scripts/test-login-identificador.mjs).

import { somenteDigitos } from './documento';

// ------------------------------------------- entrar com e-mail, CPF ou CNPJ

export type TipoIdentificador = 'email' | 'documento' | 'invalido';

/** O que a pessoa digitou no campo "E-mail, CPF ou CNPJ": tem @ é e-mail; 11 ou 14 dígitos é documento. */
export function tipoIdentificador(valor: string): TipoIdentificador {
  const v = valor.trim();
  if (v.includes('@')) return 'email';
  if (/^[\d.\-/\s]+$/.test(v)) {
    const d = somenteDigitos(v);
    if (d.length === 11 || d.length === 14) return 'documento';
  }
  return 'invalido';
}

const juntar = (partes: string[], seps: string[]) => partes.reduce((acc, p, i) => (p ? acc + (i ? seps[i - 1] : '') + p : acc), '');

/** Máscara parcial: até 11 dígitos é CPF (000.000.000-00); do 12º em diante vira CNPJ (00.000.000/0000-00). */
export function mascaraDocumentoParcial(digitos: string): string {
  const d = digitos.slice(0, 14);
  if (d.length <= 11) return juntar([d.slice(0, 3), d.slice(3, 6), d.slice(6, 9), d.slice(9, 11)], ['.', '.', '-']);
  return juntar([d.slice(0, 2), d.slice(2, 5), d.slice(5, 8), d.slice(8, 12), d.slice(12, 14)], ['.', '.', '/', '-']);
}

/**
 * O campo "E-mail, CPF ou CNPJ" enquanto a pessoa digita: só números ganham a
 * máscara do documento; apareceu letra ou @, é e-mail e a máscara sai do
 * caminho. Apagar um separador apaga o dígito antes dele (senão a máscara
 * devolvia o separador e a tecla parecia não funcionar).
 */
export function digitarIdentificador(anterior: string, novo: string): string {
  const soDoc = (s: string) => /^[\d.\-/\s]*$/.test(s);
  if (!soDoc(novo)) return soDoc(anterior) && /[.\-/]/.test(anterior) ? novo.replace(/[.\-/\s]/g, '') : novo;
  let d = somenteDigitos(novo);
  if (novo.length < anterior.length && d === somenteDigitos(anterior)) d = d.slice(0, -1);
  return mascaraDocumentoParcial(d);
}
