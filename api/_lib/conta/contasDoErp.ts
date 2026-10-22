// Central do cliente, Fase A (21/10/2026): contas do site criadas a partir da
// base do NZERP. Para cada cliente da view `clientes_site` (qualificado no CRM
// ou com pedido entregue) que ainda não tem conta:
//   · existe conta no site com o mesmo e-mail, VERIFICADO → só VINCULA; achada
//     pelo documento com outro e-mail, ou com e-mail não provado → candidato
//     para a equipe confirmar (varredura 22/10);
//   · senão cria a conta BLOQUEADA: sem senha, não aprovada, origem `erp`,
//     lojista (CNPJ) ou cliente final (CPF — ver tipoDaContaErp), com
//     nome/documento/endereço do ERP, já vinculada dos dois lados;
//   · não deu (sem e-mail, e-mail de outra conta, documento inválido…) →
//     `erp_clientes_pendentes`, a fila do admin, com o motivo.
// Ninguém entra sem o link de convite (ou "esqueci minha senha"), e ninguém
// vê preço antes de o consultor aprovar. Idempotente: rodar de novo não cria.

import type { Db } from '../papel.js';
import { clienteErp } from '../pedido/despachoErp.js';
import { normalizarEmail, somenteDigitos, validarCpfCnpj } from './documento.js';
import { emailVerificado } from './emailVerificado.js';

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
  /** Parou pelo orçamento de tempo: ficaram clientes para a próxima rodada. */
  parouPorTempo?: boolean;
}

/**
 * Tipo da conta pelo documento do ERP. CPF é cliente final: o site exige CNPJ
 * de lojista no checkout e em Meus dados, e o documento de conta ligada ao ERP
 * fica travado — um "lojista com CPF" nunca conseguiria comprar nem salvar.
 * CNPJ (ou sem documento ainda) nasce lojista. O consultor ajusta na aprovação.
 */
export function tipoDaContaErp(doc: string): 'client' | 'lojista' {
  return doc.length === 11 ? 'client' : 'lojista';
}

/** Lê todos os perfis em páginas de 1000 (o PostgREST corta em 1000 sem avisar). */
async function todosOsPerfis(site: Db): Promise<{ id: string; email: string | null; cpf_cnpj: string | null; erp_client_id: string | null; role: string }[]> {
  const todos: { id: string; email: string | null; cpf_cnpj: string | null; erp_client_id: string | null; role: string }[] = [];
  for (let de = 0; de < 100_000; de += 1000) {
    const { data, error } = await site.from('user_profiles').select('id, email, cpf_cnpj, erp_client_id, role').order('id').range(de, de + 999);
    if (error) throw new Error('user_profiles: ' + error.message);
    const pagina = (data ?? []) as typeof todos;
    todos.push(...pagina);
    if (pagina.length < 1000) break;
  }
  return todos;
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
  await site
    .from('user_profiles')
    .update({ erp_client_id: c.id, erp_candidato_id: null, erp_candidato_em: null, erp_candidato_motivo: null })
    .eq('id', siteUserId)
    .is('erp_client_id', null);
  return true;
}

/**
 * Tira da fila quem já se resolveu por outro caminho (o cliente se cadastrou e
 * a equipe confirmou o vínculo, por exemplo): o ERP já aponta uma conta.
 * Sem isto a fila do admin guardava motivo velho para sempre.
 */
export async function limparFilaResolvida(site: Db, erp: Db, apenas?: string[]): Promise<void> {
  let qFila = site.from('erp_clientes_pendentes').select('erp_client_id').limit(1000);
  if (apenas?.length) qFila = qFila.in('erp_client_id', apenas);
  const { data: fila } = await qFila;
  const ids = ((fila ?? []) as { erp_client_id: string }[]).map((f) => f.erp_client_id);
  for (let i = 0; i < ids.length; i += 200) {
    const { data: resolvidos } = await erp.from('clientes_site').select('id').in('id', ids.slice(i, i + 200)).not('site_user_id', 'is', null);
    const prontos = ((resolvidos ?? []) as { id: string }[]).map((x) => x.id);
    if (prontos.length) await site.from('erp_clientes_pendentes').delete().in('erp_client_id', prontos);
  }
}

/**
 * Roda no sync diário e no botão do admin. `limite` por rodada e `prazoMs`
 * (orçamento de tempo): a função da Vercel morre aos 60 s e cada conta leva
 * perto de 1 s — sem orçamento, a 1ª rodada (~380 contas) seria cortada no
 * meio e os passos seguintes do sync não rodariam. O que ficar sai na próxima.
 */
export async function criarContasDoErp(site: Db, limite = 300, apenas?: string[], prazoMs = Infinity): Promise<ResultadoContasErp> {
  const inicio = Date.now();
  const r: ResultadoContasErp = { lidos: 0, criadas: 0, vinculadas: 0, pendentes: 0, erros: [] };
  const erp = await clienteErp();
  if (!erp) {
    r.erros.push('sem-erp');
    return r;
  }
  if (!apenas?.length) await limparFilaResolvida(site, erp).catch(() => undefined);
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

  // Contas que já existem no site, por documento e por e-mail (lidas em páginas).
  type Perfil = { id: string; email: string | null; cpf_cnpj: string | null; erp_client_id: string | null; role: string };
  const perfis: Perfil[] = await todosOsPerfis(site);
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
    if (Date.now() - inicio > prazoMs) {
      r.parouPorTempo = true;
      break;
    }
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
        if (existente.role === 'admin' || existente.role === 'superadmin') {
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
        // Conta que alguém abriu no site: só vira deste cliente com prova — o
        // MESMO e-mail do ERP, verificado (varredura 22/10). Achar pelo CNPJ com
        // outro e-mail, ou por um e-mail que ninguém provou, só deixa o
        // candidato para a equipe confirmar na tela de clientes.
        const mesmoEmail = normalizarEmail(existente.email) === email;
        if (!existente.erp_client_id && !(mesmoEmail && (await emailVerificado(site, existente.id)))) {
          await site
            .from('user_profiles')
            .update({ erp_candidato_id: c.id, erp_candidato_em: new Date().toISOString(), erp_candidato_motivo: mesmoEmail ? 'email' : 'documento' })
            .eq('id', existente.id)
            .is('erp_client_id', null);
          await marcarPendente(site, c, mesmoEmail ? 'já tem conta no site, e-mail ainda não verificado — confirmar o vínculo em Clientes' : 'já tem conta no site com o mesmo documento e outro e-mail — confirmar o vínculo em Clientes');
          r.pendentes++;
          continue;
        }
        if (await vincular(site, erp, existente.id, c)) {
          existente.erp_client_id = c.id;
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
      const tipo = tipoDaContaErp(doc);
      const { data: novo, error: eCria } = await site.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          full_name: c.nome ?? c.fantasia ?? email,
          role: tipo,
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
      await site.from('user_profiles').update({ origem: 'erp', role: tipo, is_approved: false, erp_client_id: c.id }).eq('id', novo.user.id);
      await vincular(site, erp, novo.user.id, c);
      porEmail.set(email, { id: novo.user.id, email, cpf_cnpj: doc, erp_client_id: c.id, role: tipo });
      if (doc) porDoc.set(doc, { id: novo.user.id, email, cpf_cnpj: doc, erp_client_id: c.id, role: tipo });
      await tirarDaFila(site, c.id);
      r.criadas++;
    } catch (e) {
      r.erros.push(`${c.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return r;
}
