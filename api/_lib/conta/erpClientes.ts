// Consulta à base de clientes do NZERP — só no servidor, só o que o site pode
// mostrar.
//
// A leitura passa pela RPC `site_consultar_cliente` (migration do ERP
// 20260908_site_clientes.sql), que devolve uma lista branca de campos. A tabela
// `clients` tem limite de crédito, lista de preço, vendedor e observações
// internas; com a RPC no meio, acrescentar coluna sensível lá não vaza nada
// aqui — não existe `select` do site para a tabela.

import { normalizarEmail, somenteDigitos } from './documento.js';

export interface ClienteErp {
  id: string;
  nome: string | null;
  fantasia: string | null;
  tipoPessoa: 'F' | 'J' | null;
  email: string | null;
  telefone: string | null;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  ie: string | null;
  ativo: boolean;
  siteUserId: string | null;
}

interface RespostaRpc {
  id: string;
  nome: string | null;
  fantasia: string | null;
  tipo_pessoa: string | null;
  email: string | null;
  telefone: string | null;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  inscricao_estadual: string | null;
  ativo: boolean;
  site_user_id: string | null;
}

/** Campo a campo: o que não está aqui não chega ao site nem por acidente. */
function publico(l: RespostaRpc): ClienteErp {
  return {
    id: l.id,
    nome: l.nome,
    fantasia: l.fantasia,
    tipoPessoa: l.tipo_pessoa === 'F' || l.tipo_pessoa === 'J' ? l.tipo_pessoa : null,
    email: l.email,
    telefone: l.telefone,
    cep: l.cep,
    endereco: l.endereco,
    numero: l.numero,
    complemento: l.complemento,
    bairro: l.bairro,
    cidade: l.cidade,
    uf: l.estado,
    ie: l.inscricao_estadual,
    ativo: Boolean(l.ativo),
    siteUserId: l.site_user_id,
  };
}

export function erpConfigurado(): boolean {
  return Boolean(process.env.ERP_SUPABASE_URL && process.env.ERP_SUPABASE_SERVICE_ROLE_KEY);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type ErpDb = { from: (t: string) => any; rpc: (n: string, a?: any) => any };
/* eslint-enable @typescript-eslint/no-explicit-any */

async function abrirErp(): Promise<ErpDb | null> {
  const url = process.env.ERP_SUPABASE_URL;
  const key = process.env.ERP_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(url, key) as unknown as ErpDb;
}

async function consultar(doc: string | null, email: string | null): Promise<ClienteErp | null> {
  const erp = await abrirErp();
  if (!erp) return null;
  const { data, error } = await erp.rpc('site_consultar_cliente', { p_doc: doc, p_email: email });
  if (error || !data) return null;
  return publico(data as RespostaRpc);
}

export async function clienteErpPorDocumento(doc: unknown): Promise<ClienteErp | null> {
  const d = somenteDigitos(doc);
  if (d.length !== 11 && d.length !== 14) return null;
  return consultar(d, null);
}

export async function clienteErpPorEmail(email: unknown): Promise<ClienteErp | null> {
  const e = normalizarEmail(email);
  if (!e.includes('@')) return null;
  return consultar(null, e);
}

/** Cria (ou completa) o cliente no ERP a partir do cadastro do site. */
export async function vincularClienteNoErp(siteUserId: string, dados: Record<string, unknown>): Promise<string | null> {
  const erp = await abrirErp();
  if (!erp) return null;
  const { data, error } = await erp.rpc('site_vincular_cliente', { p_site_user_id: siteUserId, p: dados });
  if (error || !data) return null;
  return (data as { client_id?: string }).client_id ?? null;
}

/** Colaboradores do NZERP (view sem a coluna de senha). */
export interface UsuarioErp {
  id: string;
  nome: string;
  email: string;
  papel: string | null;
  ativo: boolean;
  permissoes: string[];
}

export async function usuariosErp(): Promise<UsuarioErp[]> {
  const erp = await abrirErp();
  if (!erp) return [];
  // `users_safe` é a view sem `password`. Nunca ler `public.users` daqui: lá a
  // senha está em texto puro e o site não tem nada que ver com ela.
  const { data, error } = await erp.from('users_safe').select('id, name, email, role, active, permissions');
  if (error || !data) return [];
  return (data as { id: string; name: string | null; email: string | null; role: string | null; active: boolean | null; permissions: string[] | null }[])
    .filter((u) => normalizarEmail(u.email).includes('@'))
    .map((u) => ({
      id: u.id,
      nome: (u.name ?? '').trim(),
      email: normalizarEmail(u.email),
      papel: u.role,
      ativo: u.active !== false,
      permissoes: Array.isArray(u.permissions) ? u.permissions : [],
    }));
}
