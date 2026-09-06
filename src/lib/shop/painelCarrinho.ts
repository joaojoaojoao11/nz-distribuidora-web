// Estado do painel lateral do carrinho — separado de `carrinho.ts` de
// propósito: aquilo é o que o cliente comprou (vai para localStorage e para o
// pedido), isto é só o que está aberto na tela.
//
// Existe como store externo porque quem manda abrir é o bloco de compra da
// página do produto e quem desenha é a Navbar, que é irmã dela na árvore.

import { useSyncExternalStore } from 'react';

export interface PainelAberto {
  /** Item que acabou de entrar, para o painel destacá-lo. */
  destaque: { slug: string; unidade: 'rolo' | 'metro' } | null;
}

let estado: PainelAberto | null = null;
const ouvintes = new Set<() => void>();

function publicar(novo: PainelAberto | null) {
  estado = novo;
  for (const cb of ouvintes) cb();
}

export function abrirPainelCarrinho(destaque: PainelAberto['destaque'] = null) {
  publicar({ destaque });
}

export function fecharPainelCarrinho() {
  publicar(null);
}

const subscribe = (cb: () => void) => {
  ouvintes.add(cb);
  return () => {
    ouvintes.delete(cb);
  };
};

export function usePainelCarrinho(): PainelAberto | null {
  return useSyncExternalStore(subscribe, () => estado, () => null);
}
