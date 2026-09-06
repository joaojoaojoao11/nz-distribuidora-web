// O que o pedido precisa ter no cadastro — um lugar só.
//
// Antes esta regra vivia dentro de precificar.ts e só aparecia para o usuário
// quando ele tentava pagar ("cadastro-incompleto"). Agora o carrinho e o painel
// perguntam antes, e a mesma lista serve de checklist na tela.
//
// A mesma condição está no trigger `nz_marcar_cadastro_completo` (migration
// 2026-09-08). Mudou aqui, muda lá.

export interface PerfilMinimo {
  full_name?: string | null;
  cpf_cnpj?: string | null;
  phone?: string | null;
  address_street?: string | null;
  address_number?: string | null;
  address_city?: string | null;
  address_state?: string | null;
  address_zip?: string | null;
}

/** chave técnica → rótulo que o usuário lê. */
export const ROTULO_CAMPO: Record<string, string> = {
  nome: 'nome completo',
  cpf_cnpj: 'CPF ou CNPJ',
  telefone: 'WhatsApp',
  endereco: 'rua',
  numero: 'número',
  cidade: 'cidade',
  uf: 'UF',
  cep: 'CEP',
};

const cheio = (v: unknown): boolean => typeof v === 'string' && v.trim() !== '';

export function faltandoNoCadastro(perfil: PerfilMinimo | null | undefined): string[] {
  const faltando: string[] = [];
  if (!cheio(perfil?.full_name)) faltando.push('nome');
  if (!cheio(perfil?.cpf_cnpj)) faltando.push('cpf_cnpj');
  if (!cheio(perfil?.phone)) faltando.push('telefone');
  if (!cheio(perfil?.address_street)) faltando.push('endereco');
  if (!cheio(perfil?.address_number)) faltando.push('numero');
  if (!cheio(perfil?.address_city)) faltando.push('cidade');
  if (!cheio(perfil?.address_state)) faltando.push('uf');
  if ((perfil?.address_zip ?? '').replace(/\D/g, '').length !== 8) faltando.push('cep');
  return faltando;
}

export function completude(perfil: PerfilMinimo | null | undefined): { completo: boolean; faltando: string[]; rotulos: string[] } {
  const faltando = faltandoNoCadastro(perfil);
  return { completo: faltando.length === 0, faltando, rotulos: faltando.map((f) => ROTULO_CAMPO[f] ?? f) };
}
