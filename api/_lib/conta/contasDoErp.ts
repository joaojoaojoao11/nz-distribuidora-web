// Central do cliente, Fase A (21/10/2026): contas do site criadas a partir da
// base do NZERP. Para cada cliente da view `clientes_site` (qualificado no CRM
// ou com pedido entregue) que ainda não tem conta:
//   · existe conta no site com o mesmo documento ou e-mail → só VINCULA;
//   · senão cria a conta BLOQUEADA: sem senha, lojista, não aprovada, origem
//     `erp`, com nome/documento/endereço do ERP, já vinculada dos dois lados;
//   · não deu (sem e-mail, e-mail de outra conta, documento inválido…) →
//     `erp_clientes_pendentes`, a fila do admin, com o motivo.
// Ninguém entra sem o link de convite (ou "esqueci minha senha"), e ninguém
// vê preço antes de o consultor aprovar. Idempotente: rodar de novo não cria.

import type { Db } from '../papel.js';
import { clienteErp } from '../pedido/despachoErp.js';
import { normalizarEmail, somenteDigitos, validarCpfCnpj } from './documento.js';

export interface ClienteSite {
  id: string;
  nome: string | null;
  fantasia: string | null;
  email: string | null;
  cpf_cnpj: string | null;
  telefone: string | null;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  inscricao_estadual: string | null;
  tipo_pessoa: string | null;
  site_user_id: string | null;
  ativo: boolean;
  qualificado: boolean;
  pedidos_entregues: number;
  ultimo_pedido_em: string | null;
}

export interface ResultadoContasErp {
  lidos: number;
  criadas: number;
  vinculadas: number;
  pendentes: number;
  erros: string[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function marcarPendente(site: Db, c: ClienteSite, motivo: string): Promise<void> {
  await site.from('erp_clientes_pendentes').upsert({ erp_client_id: c.id, nome: c.nome, email: c.email, cpf_cnpj: c.cpf_cnpj, motivo, atualizado_em: new Date().toISOString() }, { onConflict: 'erp_client_id' });
}

async function tirarDaFila(site: Db, erpClientId: string): Promise<void> {
  await site.from('erp_clientes_pendentes').delete().eq('erp_client_id', erpClientId);
}

/** Grava o vínculo nos dois lados. Devolve false se o ERP já apontava para OUTRA conta. */
async function vincular(site: Db, erp: Db, siteUserId: string, c: ClienteSite): Promise<boolean> {
  const { data, error } = await erp.rpc('site_marcar_vinculo', { p_client_id: c.id, p_site_user_id: siteUserId });
  if (error) throw new Error('site_marcar_vinculo: ' + error.message);
  const r = data as { ok?: boolean; motivo?: string } | null;
  if (!r?.ok) return false;
  await site.from('user_profiles').update({ erp_client_id: c.id }).eq('id', siteUserId).is('erp_client_id', null);
  return true;
}

/**
 * Roda no sync diário e no botão do admin. `limite` por rodada para não
 * estourar o tempo da função; o que ficar sai na próxima.
 */
export async function criarContasDoErp(site: Db, limite = 300, apenas?: string[]): Promise<ResultadoContasErp> {
  const r: ResultadoContasErp = { lidos: 0, criadas: 0, vinculadas: 0, pendentes: 0, erros: [] };
  const erp = await clienteErp();
  if (!erp) {
    r.erros.push('sem-erp');
    return r;
  }
  // `apenas`: só estes clientes do ERP (teste real com dados apagados depois).
  let q = erp.from('clientes_site').select('*').is('site_user_id', null).order('created_at').limit(limite);
  if (apenas?.length) q = q.in('id', apenas);
  const { data, error } = await q;
  if (error) {
    r.erros.push('clientes_site: ' + error.message);
    return r;
  }
  const clientes = (data ?? []) as ClienteSite[];
  r.lidos = clientes.length;
  if (!clientes.length) return r;

  // Contas que já existem no site, por documento e por e-mail (uma leitura só).
  const { data: perfisData } = await site.from('user_profiles').select('id, email, cpf_cnpj, erp_client_id, role');
  type Perfil = { id: string; email: string | null; cpf_cnpj: string | null; erp_client_id: string | null; role: string };
  const perfis = (perfisData ?? []) as Perfil[];
  const porDoc = new Map<string, Perfil>();
  const porEmail = new Map<string, Perfil>();
  for (const p of perfis) {
    const d = somenteDigitos(p.cpf_cnpj);
    if (d && !porDoc.has(d)) porDoc.set(d, p);
    const e = normalizarEmail(p.email);
    if (e && !porEmail.has(e)) porEmail.set(e, p);
  }
  const vistos = new Set<string>();

  for (const c of clientes) {
    try {
      const doc = somenteDigitos(c.cpf_cnpj);
      const email = normalizarEmail(c.email);
      if (!email) {
        await marcarPendente(site, c, 'sem e-mail no ERP');
        r.pendentes++;
        continue;
      }
      if (!EMAIL_RE.test(email)) {
        await marcarPendente(site, c, `e-mail inválido no ERP (${email})`);
        r.pendentes++;
        continue;
      }
      if (doc && !validarCpfCnpj(doc)) {
        await marcarPendente(site, c, 'CPF/CNPJ inválido no ERP');
        r.pendentes++;
        continue;
      }
      const chave = doc || email;
      if (vistos.has(chave)) {
        await marcarPendente(site, c, 'cliente duplicado no ERP (mesmo documento ou e-mail)');
        r.pendentes++;
        continue;
      }
      vistos.add(chave);

      // Já tem conta no site? Vincula, não cria.
      const existente = (doc && porDoc.get(doc)) || porEmail.get(email) || null;
      if (existente) {
        if (existente.role === 'admin') {
          await marcarPendente(site, c, 'o e-mail é de uma conta de administrador');
          r.pendentes++;
          continue;
        }
        const docExistente = somenteDigitos(existente.cpf_cnpj);
        if (doc && docExistente && docExistente !== doc) {
          await marcarPendente(site, c, 'o e-mail já é de outra conta do site, com outro documento');
          r.pendentes++;
          continue;
        }
        if (existente.erp_client_id && existente.erp_client_id !== c.id) {
          await marcarPendente(site, c, 'a conta do site já está vinculada a outro cliente do ERP');
          r.pendentes++;
          continue;
        }
        if (await vincular(site, erp, existente.id, c)) {
          r.vinculadas++;
          await tirarDaFila(site, c.id);
        } else {
          await marcarPendente(site, c, 'o ERP já aponta para outra conta');
          r.pendentes++;
        }
        continue;
      }

      // Cria a conta bloqueada, sem senha. O trigger do banco monta o perfil a
      // partir dos metadados; depois acertamos origem/tipo/vínculo.
      const { data: novo, error: eCria } = await site.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          full_name: c.nome ?? c.fantasia ?? email,
          role: 'lojista',
          cpf_cnpj: doc,
          company_name: c.fantasia ?? '',
          phone: somenteDigitos(c.telefone) || '',
          ie: c.inscricao_estadual ?? '',
          address_zip: somenteDigitos(c.cep) || '',
          address_street: c.endereco ?? '',
          address_number: c.numero ?? '',
          address_complement: c.complemento ?? '',
          address_neighborhood: c.bairro ?? '',
          address_city: c.cidade ?? '',
          address_state: c.uf ?? '',
        },
      });
      if (eCria || !novo?.user) {
        await marcarPendente(site, c, 'não criou a conta: ' + (eCria?.message ?? 'sem usuário'));
        r.pendentes++;
        continue;
      }
      await site.from('user_profiles').update({ origem: 'erp', role: 'lojista', is_approved: false, erp_client_id: c.id }).eq('id', novo.user.id);
      await vincular(site, erp, novo.user.id, c);
      porEmail.set(email, { id: novo.user.id, email, cpf_cnpj: doc, erp_client_id: c.id, role: 'lojista' });
      if (doc) porDoc.set(doc, { id: novo.user.id, email, cpf_cnpj: doc, erp_client_id: c.id, role: 'lojista' });
      await tirarDaFila(site, c.id);
      r.criadas++;
    } catch (e) {
      r.erros.push(`${c.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return r;
}
