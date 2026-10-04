// O e-mail da conta foi PROVADO (clique no link de confirmação)?
//
// Enquanto `mailer_autoconfirm` estiver ligado no Supabase, `email_confirmed_at`
// é preenchido no cadastro sem ninguém provar nada, então não vale como prova.
// A data abaixo é o instante em que o autoconfirm foi desligado (Fase 2 de
// PLANO_AUTH_SITE_NZGROUP): só confirmação feita a partir dela conta.
// Enquanto estiver no futuro distante, NINGUÉM é considerado verificado — falha
// fechada de propósito.
import type { Db } from '../papel.js';

export const VIRADA_CONFIRMACAO = new Date('2999-01-01T00:00:00Z');

export async function emailVerificado(site: Db, userId: string): Promise<boolean> {
  try {
    const { data } = await site.auth.admin.getUserById(userId);
    const em = data?.user?.email_confirmed_at;
    return Boolean(em) && new Date(em as string) >= VIRADA_CONFIRMACAO;
  } catch {
    return false;
  }
}
