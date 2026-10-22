// Entrar com CPF/CNPJ + senha (plano de login por documento, 22/10/2026).
//
// O desenho, e por que é assim:
//   · O Supabase só entende e-mail + senha. O servidor acha a conta pelo
//     documento e confere a senha NO BANCO (login_conferir_documento, bcrypt do
//     Auth). Só com a senha certa devolve o e-mail da própria conta; o
//     navegador então entra como sempre, pelo IP do cliente.
//   · Não fazemos o login do Supabase pelo servidor: o limite dele é por IP de
//     origem e ignora X-Forwarded-For (testado em 22/10). Todo login por
//     documento sairia do IP da Vercel, e alguém errando senha de propósito
//     travaria a entrada de todo mundo.
//   · Como a conferência no banco não passa pelo limite do Supabase, o limite
//     é NOSSO: 5 senhas erradas por documento em 15 min e 20 tentativas por IP
//     por hora (D5). Cada tentativa vai para login_tentativas com um HMAC do
//     documento — o número nunca é gravado.
//   · Resposta igual para documento sem conta, senha errada, admin e conta sem
//     senha (D2/D3); o banco iguala o tempo com um bcrypt de mentira.

import { createHmac } from 'node:crypto';
import type { Db } from '../papel.js';
import { somenteDigitos, validarCpfCnpj } from './documento.js';

export const LIMITE_SENHA_POR_DOC = 5;
export const JANELA_DOC_MIN = 15;
export const LIMITE_POR_IP = 20;
export const JANELA_IP_MIN = 60;
/** Tentativas guardadas por 30 dias; o sync diário apaga o resto. */
export const DIAS_GUARDAR_TENTATIVAS = 30;

export type ResultadoConferencia = 'ok' | 'senha' | 'sem-conta' | 'sem-senha' | 'admin' | 'bloqueada' | 'invalido';
export type ResultadoTentativa = ResultadoConferencia | 'limite';

/** HMAC do documento (só dígitos) — a chave do limite por documento, sem guardar o número. */
export function chaveDoc(doc: string): string {
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  return createHmac('sha256', `nz-login-doc-v1:${chave}`).update(somenteDigitos(doc)).digest('hex');
}

/** Passou do limite? Por documento conta só senha errada; por IP conta tudo. */
export async function passouDoLimite(site: Db, chave: string, ip: string | null): Promise<boolean> {
  const desdeDoc = new Date(Date.now() - JANELA_DOC_MIN * 60_000).toISOString();
  const desdeIp = new Date(Date.now() - JANELA_IP_MIN * 60_000).toISOString();
  const [{ count: porDoc }, { count: porIp }] = await Promise.all([
    site.from('login_tentativas').select('id', { count: 'exact', head: true }).eq('chave_doc', chave).eq('resultado', 'senha').gte('criado_em', desdeDoc),
    ip
      ? site.from('login_tentativas').select('id', { count: 'exact', head: true }).eq('ip', ip).gte('criado_em', desdeIp)
      : Promise.resolve({ count: 0 }),
  ]);
  return Number(porDoc ?? 0) >= LIMITE_SENHA_POR_DOC || Number(porIp ?? 0) >= LIMITE_POR_IP;
}

export async function registrarTentativaLogin(site: Db, chave: string | null, ip: string | null, resultado: ResultadoTentativa): Promise<void> {
  await site
    .from('login_tentativas')
    .insert({ chave_doc: chave, ip, resultado })
    .then(
      () => undefined,
      () => undefined
    );
}

/** Confere documento + senha no banco. E-mail só volta com `resultado: 'ok'`. */
export async function conferirSenhaDocumento(site: Db, doc: string, senha: string): Promise<{ resultado: ResultadoConferencia; email: string | null }> {
  if (!validarCpfCnpj(doc) || !senha) return { resultado: 'invalido', email: null };
  const { data, error } = await site.rpc('login_conferir_documento', { p_doc: somenteDigitos(doc), p_senha: senha });
  if (error) throw new Error(`login_conferir_documento: ${error.message}`);
  const linha = (Array.isArray(data) ? data[0] : data) as { email: string | null; resultado: ResultadoConferencia } | null;
  const resultado = linha?.resultado ?? 'sem-conta';
  return { resultado, email: resultado === 'ok' ? (linha?.email ?? null) : null };
}

/** Limpeza do sync diário: tentativas com mais de 30 dias. */
export async function limparTentativasLogin(site: Db): Promise<{ apagadas: number }> {
  const corte = new Date(Date.now() - DIAS_GUARDAR_TENTATIVAS * 86_400_000).toISOString();
  const { count, error } = await site.from('login_tentativas').delete({ count: 'exact' }).lt('criado_em', corte);
  if (error) throw new Error(error.message);
  return { apagadas: Number(count ?? 0) };
}
