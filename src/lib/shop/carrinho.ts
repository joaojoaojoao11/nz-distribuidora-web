// Carrinho da LOJA — no navegador, por usuário.
//
// Guarda só o que identifica o item: slug, quantidade, unidade (rolo fechado,
// metro ou peça — ver unidade.ts) e, para o admin, os LPNs escolhidos. Nada de preço: o preço é
// recalculado no servidor na hora de enviar o pedido (api/nz/pedido) e
// exibido pelo mesmo endpoint de preços da loja.
//
// Persistência em localStorage CHAVEADA PELO USUÁRIO (`nz:carrinho:<uid>`):
// no computador do balcão, trocar de conta não mostra o carrinho do outro. O
// visitante usa a chave sem sufixo, e o que ele montou antes de entrar é
// migrado para a chave dele no login — ninguém perde carrinho por logar.
//
// A cópia DURÁVEL (para o cliente reencontrar noutro aparelho e para a NZ saber
// quem desistiu) fica em `carrinhoServidor.ts`, que assina esta store. Aqui não
// entra rede: somar um item não pode esperar o servidor.

import { useSyncExternalStore } from 'react';
import { supabase } from '../supabase';
import { ajustarQtd, contaNoCracha, MAX_UN, type UnidadeVenda } from './unidade';

export type UnidadeCarrinho = UnidadeVenda;

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

const BASE = 'nz:carrinho';
const chaveDe = (uid: string | null) => (uid ? `${BASE}:${uid}` : BASE);

let chaveAtual = BASE;
let itens: ItemCarrinho[] = ler(chaveAtual);
const ouvintes = new Set<() => void>();

function ler(chave: string): ItemCarrinho[] {
  try {
    const raw = window.localStorage.getItem(chave);
    if (!raw) return [];
    const lista = JSON.parse(raw) as ItemCarrinho[];
    return Array.isArray(lista) ? lista.filter((i) => i && typeof i.slug === 'string' && i.qtd > 0) : [];
  } catch {
    return [];
  }
}

function gravar(chave: string, lista: ItemCarrinho[]) {
  try {
    window.localStorage.setItem(chave, JSON.stringify(lista));
  } catch {
    /* storage bloqueado: fica em memória */
  }
}

function avisar() {
  for (const cb of ouvintes) cb();
}

function publicar(novos: ItemCarrinho[]) {
  itens = novos;
  gravar(chaveAtual, novos);
  avisar();
}

const chave = (slug: string, unidade: UnidadeCarrinho) => `${slug}|${unidade}`;

/** Soma de quantidades: peça é inteira e tem teto (MAX_UN); o resto, 2 casas. */
function somar(unidade: UnidadeCarrinho, a: number, b: number): number {
  return unidade === 'un' ? Math.min(MAX_UN, Math.round(a + b)) : Math.round((a + b) * 100) / 100;
}

/** Junta duas listas somando a quantidade dos itens iguais (slug + unidade). */
function fundir(a: readonly ItemCarrinho[], b: readonly ItemCarrinho[]): ItemCarrinho[] {
  const mapa = new Map<string, ItemCarrinho>();
  for (const i of [...a, ...b]) {
    const k = chave(i.slug, i.unidade);
    const ja = mapa.get(k);
    mapa.set(
      k,
      ja
        ? { ...ja, qtd: somar(ja.unidade, ja.qtd, i.qtd), lpns: [...new Set([...ja.lpns, ...i.lpns])] }
        : { ...i }
    );
  }
  return [...mapa.values()];
}

// A sessão manda na chave. `onAuthStateChange` dispara INITIAL_SESSION no
// carregamento da aba, então a troca para a chave do dono acontece sozinha —
// não precisa de getSession() aqui. Assinado no carregamento do módulo, não
// no primeiro useCarrinho: `adicionarAoCarrinho` pode ser chamado por uma tela
// que não desenha lista nenhuma, e aí a chave ainda seria a de visitante.
function assinarAuth() {
  if (typeof window === 'undefined') return;
  supabase.auth.onAuthStateChange((_evento, sessao) => {
    const nova = chaveDe(sessao?.user?.id ?? null);
    if (nova === chaveAtual) return;
    const doVisitante = chaveAtual === BASE ? itens : [];
    chaveAtual = nova;
    const guardado = ler(nova);
    // Entrou com itens montados como visitante: leva junto e esvazia a chave
    // anônima, senão o próximo visitante nesse computador herdaria a lista.
    if (nova !== BASE && doVisitante.length) {
      itens = fundir(guardado, doVisitante);
      gravar(nova, itens);
      gravar(BASE, []);
    } else {
      itens = guardado;
    }
    avisar();
  });
}

assinarAuth();

export function adicionarAoCarrinho(item: Omit<ItemCarrinho, 'qtd' | 'lpns'> & { qtd?: number; lpns?: string[] }) {
  const k = chave(item.slug, item.unidade);
  const existente = itens.find((i) => chave(i.slug, i.unidade) === k);
  const qtd = item.unidade === 'un' ? ajustarQtd('un', Number(item.qtd ?? 1)) : Math.max(0.5, Number(item.qtd ?? 1));
  if (existente) {
    publicar(
      itens.map((i) =>
        chave(i.slug, i.unidade) === k
          ? { ...i, qtd: somar(i.unidade, i.qtd, qtd), lpns: [...new Set([...i.lpns, ...(item.lpns ?? [])])] }
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
  const nova = unidade === 'un' ? ajustarQtd('un', qtd) : Math.round(qtd * 100) / 100;
  publicar(itens.map((i) => (chave(i.slug, i.unidade) === chave(slug, unidade) ? { ...i, qtd: nova } : i)));
}

export function removerDoCarrinho(slug: string, unidade: UnidadeCarrinho) {
  publicar(itens.filter((i) => chave(i.slug, i.unidade) !== chave(slug, unidade)));
}

export function limparCarrinho() {
  publicar([]);
}

/** Troca a lista inteira — usado pela sincronia com o servidor. */
export function substituirCarrinho(lista: readonly ItemCarrinho[]) {
  publicar(lista.map((i) => ({ ...i })));
}

/** Junta uma lista de fora (a do servidor) com a que está na tela. */
export function fundirNoCarrinho(outra: readonly ItemCarrinho[]) {
  publicar(fundir(itens, outra));
}

/** Leitura fora de componente (a sincronia precisa do estado no momento certo). */
export function itensDoCarrinho(): readonly ItemCarrinho[] {
  return itens;
}

/** Assinar mudanças fora de componente. Devolve a função de cancelar. */
export function assinarCarrinho(cb: () => void): () => void {
  ouvintes.add(cb);
  return () => {
    ouvintes.delete(cb);
  };
}

/** Há alguém logado? A chave com sufixo é a evidência. */
export function carrinhoEhDeUsuario(): boolean {
  return chaveAtual !== BASE;
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

/**
 * Quantos itens o cliente entende que tem no carrinho: cada rolo e cada peça
 * contam um (3 rolos = 3, 2 camisetas = 2), e uma linha de metro conta um só —
 * "12,5" no crachá seria ruído. Antes isto devolvia o número de LINHAS, então
 * 5 rolos mostravam "1".
 */
export function totalItensCarrinho(lista: readonly ItemCarrinho[] = itens): number {
  let n = 0;
  for (const i of lista) n += contaNoCracha(i.unidade, i.qtd);
  return n;
}
