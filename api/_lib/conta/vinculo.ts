// Vínculo entre a conta do site e o cliente do NZERP.
//
// A NZ tem 389 clientes no ERP e quase nenhum tem conta no site. Quando um
// deles se cadastra, o site reconhece pelo CNPJ/CPF: preenche o endereço e —
// se for lojista com o MESMO e-mail do ERP e situação Ativo — libera o preço de
// revenda na hora, em vez de deixar o cara esperando aprovação manual de um
// cliente que a NZ já atende há anos.
//
// O "mesmo e-mail" é o que segura a porta: sem ele, quem soubesse o CNPJ de um
// cliente da NZ ganharia tabela de revenda. Sem e-mail igual, o cadastro segue
// para aprovação manual com o aviso na lista do admin.

import type { Db } from '../papel.js';
import { clienteErpPorDocumento, clienteErpPorEmail, type ClienteErp } from './erpClientes.js';
import { normalizarEmail, somenteDigitos } from './documento.js';

export interface PerfilVinculo {
  id: string;
  role: string;
  email: string | null;
  cpf_cnpj: string | null;
  is_approved: boolean;
  erp_client_id: string | null;
  // Só para saber o que ainda está vazio; nunca sobrescrevemos o que o usuário
  // escreveu.
  company_name?: string | null;
  ie?: string | null;
  phone?: string | null;
  address_zip?: string | null;
  address_street?: string | null;
  address_number?: string | null;
  address_complement?: string | null;
  address_neighborhood?: string | null;
  address_city?: string | null;
  address_state?: string | null;
}

export interface ResultadoVinculo {
  erpClientId: string | null;
  jaCliente: boolean;
  aprovouAgora: boolean;
  /** Campos do cadastro que vieram prontos do ERP. */
  preencheu: string[];
  motivo: string | null;
}

export async function registrarLog(site: Db, acao: string, alvoEmail: string | null, detalhe: unknown, quem?: string | null): Promise<void> {
  await site
    .from('equipe_log')
    .insert({ acao, alvo_email: alvoEmail, detalhe: detalhe ?? null, quem: quem ?? null })
    .then(
      () => undefined,
      () => undefined
    );
}

/**
 * Acha o cliente do ERP correspondente e grava `erp_client_id`. Aplica a
 * aprovação automática do lojista (D4 do plano). Idempotente: se o perfil já
 * está vinculado, não faz nada.
 */
export async function vincularComErp(site: Db, perfil: PerfilVinculo): Promise<ResultadoVinculo> {
  const vazio: ResultadoVinculo = {
    erpClientId: perfil.erp_client_id,
    jaCliente: Boolean(perfil.erp_client_id),
    aprovouAgora: false,
    preencheu: [],
    motivo: null,
  };
  if (perfil.erp_client_id) return vazio;

  const emailSite = normalizarEmail(perfil.email);
  let cliente: ClienteErp | null = null;
  if (perfil.cpf_cnpj) cliente = await clienteErpPorDocumento(perfil.cpf_cnpj);
  if (!cliente && emailSite) cliente = await clienteErpPorEmail(emailSite);
  if (!cliente) return vazio;

  const mesmoEmail = Boolean(emailSite) && normalizarEmail(cliente.email) === emailSite;
  const patch: Record<string, unknown> = { erp_client_id: cliente.id };

  // A NZ já tem o endereço deste cliente há anos: aproveita o que está vazio no
  // site. Só com e-mail conferindo — senão seria entregar dado de terceiro a
  // quem digitou o documento certo.
  const preencheu: string[] = [];
  if (mesmoEmail) {
    const doErp: Record<string, string | null> = {
      company_name: cliente.fantasia || cliente.nome,
      ie: cliente.ie,
      phone: cliente.telefone,
      address_zip: (cliente.cep ?? '').replace(/\D/g, '') || null,
      address_street: cliente.endereco,
      address_number: cliente.numero,
      address_complement: cliente.complemento,
      address_neighborhood: cliente.bairro,
      address_city: cliente.cidade,
      address_state: (cliente.uf ?? '').toUpperCase().slice(0, 2) || null,
    };
    for (const [campo, valor] of Object.entries(doErp)) {
      const atual = (perfil as unknown as Record<string, unknown>)[campo];
      const vazioNoSite = typeof atual !== 'string' || atual.trim() === '';
      if (vazioNoSite && typeof valor === 'string' && valor.trim()) {
        patch[campo] = valor.trim();
        preencheu.push(campo);
      }
    }
  }

  // Lojista reconhecido: aprova. Cliente final já nasce aprovado.
  const aprovar = perfil.role === 'reseller' && !perfil.is_approved && cliente.ativo && mesmoEmail;
  if (aprovar) {
    patch.is_approved = true;
    patch.aprovado_em = new Date().toISOString();
    patch.aprovado_motivo = `cliente ${cliente.nome ?? ''} já cadastrado no NZERP (documento e e-mail conferem)`.trim();
  }

  await site.from('user_profiles').update(patch).eq('id', perfil.id);
  await registrarLog(site, aprovar ? 'vinculo-erp-aprovou' : 'vinculo-erp', emailSite || null, {
    erp_client_id: cliente.id,
    mesmo_email: mesmoEmail,
    situacao_ativa: cliente.ativo,
    preencheu,
  });

  return {
    erpClientId: cliente.id,
    jaCliente: true,
    aprovouAgora: aprovar,
    preencheu,
    motivo: aprovar ? (patch.aprovado_motivo as string) : mesmoEmail ? null : 'documento já existe no NZERP com outro e-mail — confirmar com o cliente',
  };
}

/**
 * Pré-preenchimento do cadastro a partir do ERP. Só devolve dados quando o
 * e-mail da sessão bate com o do cliente no ERP — caso contrário responde
 * apenas "já é cliente", sem revelar nome, endereço ou telefone de terceiro.
 */
export async function consultarDocumento(doc: unknown, emailSessao: string): Promise<{ jaCliente: boolean; dados: Record<string, string> | null; aviso: string | null }> {
  const d = somenteDigitos(doc);
  if (d.length !== 11 && d.length !== 14) return { jaCliente: false, dados: null, aviso: null };
  const cliente = await clienteErpPorDocumento(d);
  if (!cliente) return { jaCliente: false, dados: null, aviso: null };

  const mesmoEmail = normalizarEmail(cliente.email) === normalizarEmail(emailSessao);
  if (!mesmoEmail) {
    return { jaCliente: true, dados: null, aviso: 'Este documento já está cadastrado na NZ com outro e-mail. Seu cadastro segue para conferência da equipe.' };
  }
  return {
    jaCliente: true,
    aviso: null,
    dados: {
      company_name: cliente.fantasia || cliente.nome || '',
      full_name: cliente.nome || '',
      ie: cliente.ie || '',
      phone: cliente.telefone || '',
      address_zip: somenteDigitos(cliente.cep),
      address_street: cliente.endereco || '',
      address_number: cliente.numero || '',
      address_complement: cliente.complemento || '',
      address_neighborhood: cliente.bairro || '',
      address_city: cliente.cidade || '',
      address_state: (cliente.uf || '').toUpperCase().slice(0, 2),
    },
  };
}
