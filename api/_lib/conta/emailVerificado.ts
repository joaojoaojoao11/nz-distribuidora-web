// O e-mail da conta foi PROVADO (clique no link de confirmação)?
//
// Enquanto `mailer_autoconfirm` estiver ligado no Supabase, `email_confirmed_at`
// é preenchido no cadastro sem ninguém provar nada, então não vale como prova.
// A data abaixo é o instante em que o autoconfirm foi desligado (Fase 2 de
// PLANO_AUTH_SITE_NZGROUP): só confirmação feita a partir dela conta.
// Enquanto estiver no futuro distante, NINGUÉM é considerado verificado — falha
// fechada de propósito.
import type { Db } from '../papel.js';

// 20/10/2026 20:40 UTC (17:40 em São Paulo): o autoconfirm foi desligado e o
// Send Email Hook passou a mandar o e-mail de confirmação pelo Resend
// (api/auth-email.ts). Confirmação anterior a isso era automática, não prova.
export const VIRADA_CONFIRMACAO = new Date('2026-10-20T20:40:00Z');

export async function emailVerificado(site: Db, userId: string): Promise<boolean> {
  try {
    const { data } = await site.auth.admin.getUserById(userId);
    const em = data?.user?.email_confirmed_at;
    return Boolean(em) && new Date(em as string) >= VIRADA_CONFIRMACAO;
  } catch {
    return false;
  }
}
