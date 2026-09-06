// Consulta à base de clientes do NZERP — só no servidor, só o que o site pode
// mostrar.
//
// A tabela `clients` do ERP tem limite de crédito, lista de preço, vendedor e
// observações internas. NADA disso sai daqui: a lista de colunas do `select` é
// explícita e o objeto devolvido é montado campo a campo. Se alguém acrescentar
// coluna sensível na tabela, ela não vaza por acidente.
//
// As colunas em inglês (`name`, `document`, `phone`, `address`…) são legado de
// import: o ERP e a RPC site_criar_pedido usam as em português.

import { somenteDigitos, normalizarEmail } from './documento.js';

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
}

const COLUNAS =
  'id, nome, fantasia, cpf_cnpj, tipo_pessoa, email, telefone, celular, cep, endereco, numero, complemento, bairro, cidade, estado, inscricao_estadual, situacao';

interface LinhaErp {
  id: string;
  nome: string | null;
  fantasia: string | null;
  cpf_cnpj: string | null;
  tipo_pessoa: string | null;
  email: string | null;
  telefone: string | null;
  celular: string | null;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  inscricao_estadual: string | null;
  situacao: string | null;
}

function publico(l: LinhaErp): ClienteErp {
  return {
    id: l.id,
    nome: l.nome,
    fantasia: l.fantasia,
    tipoPessoa: l.tipo_pessoa === 'F' || l.tipo_pessoa === 'J' ? l.tipo_pessoa : null,
    email: l.email,
    // O ERP guarda fixo e celular; para o site, o que der para chamar no WhatsApp.
    telefone: l.celular || l.telefone,
    cep: l.cep,
    endereco: l.endereco,
    numero: l.numero,
    complemento: l.complemento,
    bairro: l.bairro,
    cidade: l.cidade,
    uf: l.estado,
    ie: l.inscricao_estadual,
    ativo: (l.situacao ?? '').toLowerCase() === 'ativo',
  };
}

export function erpConfigurado(): boolean {
  return Boolean(process.env.ERP_SUPABASE_URL && process.env.ERP_SUPABASE_SERVICE_ROLE_KEY);
}

type ErpDb = { from: (t: string) => any }; // eslint-disable-line @typescript-eslint/no-explicit-any

async function abrirErp(): Promise<ErpDb | null> {
  const url = process.env.ERP_SUPABASE_URL;
  const key = process.env.ERP_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(url, key) as unknown as ErpDb;
}

/**
 * Cliente do ERP pelo documento (só dígitos, como o ERP guarda com máscara ou
 * sem — por isso o filtro é feito em memória sobre os candidatos do prefixo).
 */
export async function clienteErpPorDocumento(doc: unknown): Promise<ClienteErp | null> {
  const d = somenteDigitos(doc);
  if (d.length !== 11 && d.length !== 14) return null;
  const erp = await abrirErp();
  if (!erp) return null;
  // `cpf_cnpj` vem com e sem máscara na base; compara por dígitos.
  const { data } = await erp.from('clients').select(COLUNAS).ilike('cpf_cnpj', `%${d.slice(-6)}%`).limit(50);
  const linhas = (data ?? []) as LinhaErp[];
  const achado = linhas.find((l) => somenteDigitos(l.cpf_cnpj) === d);
  return achado ? publico(achado) : null;
}

export async function clienteErpPorEmail(email: unknown): Promise<ClienteErp | null> {
  const e = normalizarEmail(email);
  if (!e || !e.includes('@')) return null;
  const erp = await abrirErp();
  if (!erp) return null;
  const { data } = await erp.from('clients').select(COLUNAS).ilike('email', e).limit(5);
  const linhas = (data ?? []) as LinhaErp[];
  const achado = linhas.find((l) => normalizarEmail(l.email) === e);
  return achado ? publico(achado) : null;
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
  // `users_safe` é a view sem `password`. Nunca ler `public.users` daqui.
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
