import { createContext, useContext } from 'react';
import { MENSAGEM_PADRAO, VENDAS, linkWhatsApp } from '../../lib/contatos';

export type ContatoVendasCtx = { abrir: (mensagem?: string) => void };

// Fora do provider (não deveria acontecer): cai no Vendas 1.
export const ContatoCtx = createContext<ContatoVendasCtx>({
  abrir: (msg) => window.open(linkWhatsApp(VENDAS[0], msg ?? MENSAGEM_PADRAO), '_blank'),
});

/** abrir(mensagem): Central de Vendas (Vendas 1, 2 e 3); nas páginas /decor, direto para a Daniela. */
export function useContatoVendas(): ContatoVendasCtx {
  return useContext(ContatoCtx);
}
