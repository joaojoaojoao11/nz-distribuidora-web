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

// `lojista` (lojista/aplicador) existe desde 20/10/2026; `reseller` é o
// REVENDEDOR. Os dois são empresa e, aprovados, veem estoque detalhado e o
// preço do seu tipo (precos/regraAcesso.ts).
export type Papel = 'anonimo' | 'client' | 'lojista' | 'reseller' | 'admin';

export interface PapelDetalhado {
  papel: Papel;
  /** `is_approved` do perfil. Admin conta como aprovado. Anônimo, false. */
  aprovado: boolean;
  userId: string | null;
  /**
   * Faixa de preço dentro do tipo (faixas_preco.id), dada pelo consultor na
   * aprovação. Nulo = Padrão do tipo. Só vale para aprovado que não é admin
   * (precos/regraAcesso.ts). Fase 1 do plano de indicação, 21/10/2026.
   */
  faixaId: number | null;
}

/**
 * Versão completa: além do papel, diz se o cadastro foi aprovado. O preço
 * (api/nz/precos) exige aprovação para cliente E lojista; o estoque e o frete
 * só olham o papel.
 */
export async function resolverPapelDetalhado(site: Db, authHeader: string | undefined): Promise<PapelDetalhado> {
  const anonimo: PapelDetalhado = { papel: 'anonimo', aprovado: false, userId: null, faixaId: null };
  if (!authHeader?.startsWith('Bearer ')) return anonimo;

  try {
    const {
      data: { user },
    } = await site.auth.getUser(authHeader.slice(7));
    if (!user) return anonimo;

    const { data } = await site
      .from('user_profiles')
      .select('role, is_approved, faixa_id')
      .eq('id', user.id)
      .maybeSingle();

    const profile = data as { role?: string; is_approved?: boolean; faixa_id?: number | null } | null;
    if (!profile) return anonimo;
    // Só 'admin': o front (AuthContext, ProtectedRoute) não conhece outro papel
    // de administração, e um papel aceito só aqui entraria na API sem painel.
    if (profile.role === 'admin') {
      return { papel: 'admin', aprovado: true, userId: user.id, faixaId: null };
    }
    const aprovado = Boolean(profile.is_approved);
    const faixaId = aprovado && Number(profile.faixa_id) > 0 ? Number(profile.faixa_id) : null;
    // Lojista/revendedor não aprovado é tratado como cliente final: a
    // aprovação é o que libera o dado comercial.
    if ((profile.role === 'reseller' || profile.role === 'lojista') && aprovado) return { papel: profile.role, aprovado, userId: user.id, faixaId };
    return { papel: 'client', aprovado, userId: user.id, faixaId };
  } catch {
    // Falha ao validar o token (rede, Supabase fora) é ausência de permissão,
    // nunca elevação: cai para anônimo em vez de derrubar a requisição.
    return anonimo;
  }
}

export async function resolverPapel(site: Db, authHeader: string | undefined): Promise<Papel> {
  return (await resolverPapelDetalhado(site, authHeader)).papel;
}
