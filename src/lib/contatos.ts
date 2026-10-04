// Fonte única dos contatos de WhatsApp do site (João, 04/10/2026).
// - NZDECOR (páginas /decor e itens decor da loja) → direto para a Daniela.
// - Todo o resto → janela "Central de Vendas" com Vendas 1, 2 e 3 (ContatoVendas).
// Trocou um número? Muda só aqui.

export type Contato = {
  nome: string;
  telefone: string; // DDI + DDD + número, só dígitos
  exibicao: string;
};

export const VENDAS: Contato[] = [
  { nome: 'Vendas 1', telefone: '5511953037391', exibicao: '(11) 95303-7391' },
  { nome: 'Vendas 2', telefone: '5511916777565', exibicao: '(11) 91677-7565' },
  { nome: 'Vendas 3', telefone: '5511918907565', exibicao: '(11) 91890-7565' },
];

export const DECOR: Contato = { nome: 'Daniela · NZDECOR', telefone: '5511920707565', exibicao: '(11) 92070-7565' };

export const MENSAGEM_PADRAO = 'Olá! Vim pelo site da NZ e gostaria de mais informações.';

export function linkWhatsApp(contato: Contato, mensagem?: string): string {
  const texto = mensagem ? `?text=${encodeURIComponent(mensagem)}` : '';
  return `https://wa.me/${contato.telefone}${texto}`;
}

/** Páginas da NZDECOR: o contato global (botão flutuante, menu, rodapé) vai direto para a Daniela. */
export function ehRotaDecor(pathname: string): boolean {
  return pathname === '/decor' || pathname.startsWith('/decor/');
}
