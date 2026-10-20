// Contas que nunca confirmaram o e-mail somem depois de 48 h.
//
// Desde 20/10/2026 o cadastro não vale até o clique no e-mail. Uma conta
// criada e nunca confirmada é lixo — ou pior, é um pré-registro com o e-mail
// de outra pessoa (achado 3 de PLANO_AUTH_SITE_NZGROUP: quem registra antes o
// e-mail da vítima poderia sequestrar a conta no dia em que ela entrasse).
// O cron diário (handlers/sync.ts) apaga essas contas e deixa o rastro em
// equipe_log. Só contas criadas DEPOIS da virada: antes dela todo mundo era
// confirmado automaticamente, então não há o que apagar.

import type { Db } from '../papel.js';
import { VIRADA_CONFIRMACAO } from './emailVerificado.js';

export interface UsuarioAuth {
  id: string;
  email?: string | null;
  email_confirmed_at?: string | null;
  created_at: string;
  last_sign_in_at?: string | null;
}

export const HORAS_PARA_APAGAR = 48;

/** Regra pura: criada depois da virada, há mais de N horas, nunca confirmada, nunca entrou. */
export function paraApagar(usuarios: readonly UsuarioAuth[], agora: number = Date.now(), horas = HORAS_PARA_APAGAR, virada: Date = VIRADA_CONFIRMACAO): UsuarioAuth[] {
  const limite = agora - horas * 3_600_000;
  return usuarios.filter((u) => {
    if (u.email_confirmed_at || u.last_sign_in_at) return false;
    const criada = new Date(u.created_at).getTime();
    if (!Number.isFinite(criada)) return false;
    return criada >= virada.getTime() && criada < limite;
  });
}

export async function limparNaoConfirmados(site: Db): Promise<{ apagados: number; vistos: number; erros: string[] }> {
  const r = { apagados: 0, vistos: 0, erros: [] as string[] };
  const candidatos: UsuarioAuth[] = [];
  // listUsers pagina: 200 por página, até 10 páginas (2.000 contas) — bem acima do que o site tem.
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await site.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      r.erros.push(`listUsers p${page}: ${error.message}`);
      break;
    }
    const lista = (data?.users ?? []) as UsuarioAuth[];
    r.vistos += lista.length;
    candidatos.push(...paraApagar(lista));
    if (lista.length < 200) break;
  }
  for (const u of candidatos) {
    try {
      await site.from('user_profiles').delete().eq('id', u.id);
      const { error } = await site.auth.admin.deleteUser(u.id);
      if (error) throw new Error(error.message);
      r.apagados++;
      await site.from('equipe_log').insert({ acao: 'apagar-nao-confirmada', alvo_email: u.email ?? null, detalhe: { criada_em: u.created_at, horas: HORAS_PARA_APAGAR }, quem: null });
    } catch (err) {
      r.erros.push(`${u.email ?? u.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return r;
}
