// O NZERP mostra o acesso do cliente ao site (plano de login por CPF/CNPJ, Fase 3).
//
// Para cada conta do site ligada a um cliente do ERP (user_profiles.erp_client_id),
// espelha em clients.site_acesso ('bloqueada' | 'liberada') e
// clients.site_ultimo_acesso. A única escrita é a RPC estreita
// site_marcar_acesso, que só mexe nessas colunas e só no cliente cujo
// site_user_id é o mesmo usuário (nunca em outro cliente). O ERP só mostra.
//
// Quando roda: no pós-cadastro (uma vez por sessão, logo depois do login), na
// aprovação/revogação e no sync diário (todas as contas, para não ficar nada
// para trás). Nunca derruba quem chamou.

import type { Db } from '../papel.js';
import { clienteErp } from '../pedido/despachoErp.js';

interface PerfilAcesso {
  id: string;
  erp_client_id: string | null;
  is_approved: boolean | null;
  ultimo_acesso_em: string | null;
  role: string | null;
}

const LOTE = 300;

export async function espelharAcessoNoErp(site: Db, userIds?: string[]): Promise<{ lidos: number; atualizados: number; erro?: string }> {
  const erp = await clienteErp();
  if (!erp) return { lidos: 0, atualizados: 0, erro: 'sem-erp' };
  let q = site.from('user_profiles').select('id, erp_client_id, is_approved, ultimo_acesso_em, role').not('erp_client_id', 'is', null).not('role', 'in', '(admin,superadmin)');
  if (userIds?.length) q = q.in('id', userIds);
  const { data, error } = await q.range(0, 4999);
  if (error) return { lidos: 0, atualizados: 0, erro: error.message };
  const perfis = (data ?? []) as PerfilAcesso[];
  let atualizados = 0;
  for (let i = 0; i < perfis.length; i += LOTE) {
    const itens = perfis.slice(i, i + LOTE).map((p) => ({
      client_id: p.erp_client_id,
      site_user_id: p.id,
      situacao: p.is_approved ? 'liberada' : 'bloqueada',
      ultimo_acesso: p.ultimo_acesso_em ?? '',
    }));
    const { data: r, error: e } = await erp.rpc('site_marcar_acesso', { p_itens: itens });
    if (e) return { lidos: perfis.length, atualizados, erro: e.message };
    atualizados += Number((r as { atualizados?: number } | null)?.atualizados ?? 0);
  }
  return { lidos: perfis.length, atualizados };
}
