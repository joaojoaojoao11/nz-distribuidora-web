// Carrinho da LOJA — no navegador, por usuário.
//
// Guarda só o que identifica o item: slug, quantidade, unidade (rolo fechado
// ou metro) e, para o admin, os LPNs escolhidos. Nada de preço: o preço é
// recalculado no servidor na hora de enviar o pedido (api/nz/pedido) e
// exibido pelo mesmo endpoint de preços da loja.
//
// Persistência em localStorage, chaveada pelo usuário: trocar de conta não
// carrega o carrinho do outro.

import { useSyncExternalStore } from 'react';

export type UnidadeCarrinho = 'rolo' | 'metro';

export interface ItemCarrinho {
  slug: string;
  nome: string;
  codigo: string | null;
  imagem: string | null;
  hex: string | null;
  qtd: number;
  unidade: UnidadeCarrinho;
  lpns: string[];
}

const CHAVE = 'nz:carrinho';

let itens: ItemCarrinho[] = carregar();
const ouvintes = new Set<() => void>();

function carregar(): ItemCarrinho[] {
  try {
    const raw = window.localStorage.getItem(CHAVE);
    if (!raw) return [];
    const lista = JSON.parse(raw) as ItemCarrinho[];
    return Array.isArray(lista) ? lista.filter((i) => i && typeof i.slug === 'string' && i.qtd > 0) : [];
  } catch {
    return [];
  }
}

function publicar(novos: ItemCarrinho[]) {
  itens = novos;
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(novos));
  } catch {
    /* storage bloqueado: fica em memória */
  }
  for (const cb of ouvintes) cb();
}

const chave = (slug: string, unidade: UnidadeCarrinho) => `${slug}|${unidade}`;

export function adicionarAoCarrinho(item: Omit<ItemCarrinho, 'qtd' | 'lpns'> & { qtd?: number; lpns?: string[] }) {
  const k = chave(item.slug, item.unidade);
  const existente = itens.find((i) => chave(i.slug, i.unidade) === k);
  const qtd = Math.max(0.5, Number(item.qtd ?? 1));
  if (existente) {
    publicar(
      itens.map((i) =>
        chave(i.slug, i.unidade) === k
          ? { ...i, qtd: Math.round((i.qtd + qtd) * 100) / 100, lpns: [...new Set([...i.lpns, ...(item.lpns ?? [])])] }
          : i
      )
    );
  } else {
    publicar([...itens, { ...item, qtd, lpns: item.lpns ?? [] }]);
  }
}

export function alterarQuantidade(slug: string, unidade: UnidadeCarrinho, qtd: number) {
  if (qtd <= 0) {
    removerDoCarrinho(slug, unidade);
    return;
  }
  publicar(itens.map((i) => (chave(i.slug, i.unidade) === chave(slug, unidade) ? { ...i, qtd: Math.round(qtd * 100) / 100 } : i)));
}

export function removerDoCarrinho(slug: string, unidade: UnidadeCarrinho) {
  publicar(itens.filter((i) => chave(i.slug, i.unidade) !== chave(slug, unidade)));
}

export function limparCarrinho() {
  publicar([]);
}

const subscribe = (cb: () => void) => {
  ouvintes.add(cb);
  return () => {
    ouvintes.delete(cb);
  };
};

export function useCarrinho(): ItemCarrinho[] {
  return useSyncExternalStore(subscribe, () => itens, () => itens);
}

export function totalItensCarrinho(lista: readonly ItemCarrinho[] = itens): number {
  return lista.length;
}
