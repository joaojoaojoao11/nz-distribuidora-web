// Papel do usuário, resolvido NO SERVIDOR a partir do JWT.
//
// Estava dentro de handlers/estoque.ts até a cotação de frete precisar da mesma
// regra: o VALOR do frete só aparece para admin. Papel é decisão de segurança —
// duas cópias divergem no dia em que uma delas muda, e a que ficar para trás
// vira o furo. Uma implementação só, importada pelos dois endpoints.
//
// Nunca confia em campo do corpo nem em claim do token: um cliente pode forjar
// as duas coisas. O papel sai de user_profiles, consultado com service role.

import type { SupabaseClient } from '@supabase/supabase-js';

// O projeto não tem tipos gerados do banco. Generics soltos evitam que a
// inferência do supabase-js colapse os parâmetros em `never` ao passar o client
// entre funções.
/* eslint-disable @typescript-eslint/no-explicit-any */
export type Db = SupabaseClient<any, any, any>;
/* eslint-enable @typescript-eslint/no-explicit-any */

export type Papel = 'anonimo' | 'client' | 'reseller' | 'admin';

export interface PapelDetalhado {
  papel: Papel;
  /** `is_approved` do perfil. Admin conta como aprovado. Anônimo, false. */
  aprovado: boolean;
  userId: string | null;
}

/**
 * Versão completa: além do papel, diz se o cadastro foi aprovado. O preço
 * (api/nz/precos) exige aprovação para cliente E lojista; o estoque e o frete
 * só olham o papel.
 */
export async function resolverPapelDetalhado(site: Db, authHeader: string | undefined): Promise<PapelDetalhado> {
  const anonimo: PapelDetalhado = { papel: 'anonimo', aprovado: false, userId: null };
  if (!authHeader?.startsWith('Bearer ')) return anonimo;

  try {
    const {
      data: { user },
    } = await site.auth.getUser(authHeader.slice(7));
    if (!user) return anonimo;

    const { data } = await site
      .from('user_profiles')
      .select('role, is_approved')
      .eq('id', user.id)
      .maybeSingle();

    const profile = data as { role?: string; is_approved?: boolean } | null;
    if (!profile) return anonimo;
    if (profile.role === 'admin' || profile.role === 'superadmin') {
      return { papel: 'admin', aprovado: true, userId: user.id };
    }
    const aprovado = Boolean(profile.is_approved);
    // Lojista não aprovado é tratado como cliente final: a aprovação é o que
    // libera o dado comercial.
    if (profile.role === 'reseller' && aprovado) return { papel: 'reseller', aprovado, userId: user.id };
    return { papel: 'client', aprovado, userId: user.id };
  } catch {
    // Falha ao validar o token (rede, Supabase fora) é ausência de permissão,
    // nunca elevação: cai para anônimo em vez de derrubar a requisição.
    return anonimo;
  }
}

export async function resolverPapel(site: Db, authHeader: string | undefined): Promise<Papel> {
  return (await resolverPapelDetalhado(site, authHeader)).papel;
}
