// Tipos de acesso do site, com o nome que aparece na tela.
//
// Quatro desde 20/10/2026: administrador, revendedor (`reseller`), lojista /
// aplicador (`lojista`, novo) e cliente final (`client`). O tipo decide o preço
// que a pessoa vê (Admin → Preços por acesso) e o que o cadastro pede (CNPJ
// para lojista e revendedor). Admin nunca nasce pelo cadastro.

export type TipoAcesso = 'client' | 'lojista' | 'reseller' | 'admin';

export const TIPO_LABEL: Record<TipoAcesso, string> = {
  client: 'Cliente final',
  lojista: 'Lojista / aplicador',
  reseller: 'Revendedor',
  admin: 'Administrador',
};

/** Os três que se cadastram pelo site (e que a tela de preços conhece). */
export const TIPOS_CLIENTE: readonly Exclude<TipoAcesso, 'admin'>[] = ['client', 'lojista', 'reseller'];

export const TIPO_DESCRICAO: Record<Exclude<TipoAcesso, 'admin'>, string> = {
  client: 'Compra para você. A NZ confere o cadastro e libera o acesso aos preços — costuma levar até 1 dia útil.',
  lojista: 'Aplicador ou loja: compra com CNPJ. A NZ confere o cadastro e libera a tabela de lojista — até 1 dia útil.',
  reseller: 'Revende NZ: compra com CNPJ na tabela de revenda. A NZ confere o cadastro — até 1 dia útil.',
};

/** Lojista e revendedor são empresa: CNPJ e razão social obrigatórios. */
export const ehEmpresa = (role: string | null | undefined): boolean => role === 'lojista' || role === 'reseller';

export const rotuloTipo = (role: string | null | undefined): string => TIPO_LABEL[(role ?? 'client') as TipoAcesso] ?? TIPO_LABEL.client;
