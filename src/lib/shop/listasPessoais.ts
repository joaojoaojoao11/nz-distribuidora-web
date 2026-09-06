// Favoritos e "vistos recentemente" — no navegador, por usuário.
//
// Por que não é tabela: `analytics_events` guarda a SESSÃO, não o usuário, e
// não serve para dizer "o que VOCÊ viu". Uma tabela nova serviria, mas isto
// aqui é preferência de leitura, não dado de negócio: some se o cliente limpar
// o navegador e ninguém perde dinheiro. Se um dia esse dado interessar no
// admin (o que cada cliente olha), aí sim vira tabela.
//
// A chave por usuário segue a mesma regra do carrinho (`carrinho.ts`): visitante
// sem sufixo, logado com `:<uid>`, e o que o visitante juntou é levado para a
// conta no login. As duas são as únicas cópias dessa lógica no projeto —
// mexeu numa, confira a outra.

import { useSyncExternalStore } from 'react';
import { supabase } from '../supabase';

/** O que guardamos de um produto para conseguir desenhar o card sem o catálogo. */
export interface ProdutoLembrado {
  slug: string;
  nome: string;
  codigo: string | null;
  imagem: string | null;
  hex: string | null;
  /** epoch ms — favorito usa como "guardado em", visto como "aberto em". */
  em: number;
}

const BASE_FAV = 'nz:favoritos';
const BASE_VIS = 'nz:vistos';
/** Vistos é um rastro, não um arquivo: mais que isso vira lista morta. */
const MAX_VISTOS = 24;

type Lista = ProdutoLembrado[];

interface Caixa {
  base: string;
  chave: string;
  itens: Lista;
  limite: number;
}

const caixas: Record<'fav' | 'vis', Caixa> = {
  fav: { base: BASE_FAV, chave: BASE_FAV, itens: [], limite: 500 },
  vis: { base: BASE_VIS, chave: BASE_VIS, itens: [], limite: MAX_VISTOS },
};

const ouvintes = new Set<() => void>();
const avisar = () => {
  for (const cb of ouvintes) cb();
};

function ler(chave: string): Lista {
  try {
    const raw = window.localStorage.getItem(chave);
    if (!raw) return [];
    const lista = JSON.parse(raw) as Lista;
    return Array.isArray(lista) ? lista.filter((i) => i && typeof i.slug === 'string') : [];
  } catch {
    return [];
  }
}

function gravar(chave: string, lista: Lista) {
  try {
    window.localStorage.setItem(chave, JSON.stringify(lista));
  } catch {
    /* storage bloqueado: vive só nesta aba */
  }
}

function publicar(c: Caixa, lista: Lista) {
  c.itens = lista.slice(0, c.limite);
  gravar(c.chave, c.itens);
  avisar();
}

for (const c of Object.values(caixas)) c.itens = ler(c.chave);

// Sessão manda na chave, igual ao carrinho. INITIAL_SESSION dispara no
// carregamento da aba, então a troca acontece sozinha.
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((_evento, sessao) => {
    const uid = sessao?.user?.id ?? null;
    for (const c of Object.values(caixas)) {
      const nova = uid ? `${c.base}:${uid}` : c.base;
      if (nova === c.chave) continue;
      const doVisitante = c.chave === c.base ? c.itens : [];
      c.chave = nova;
      const guardado = ler(nova);
      if (nova !== c.base && doVisitante.length) {
        // Funde sem duplicar slug, o mais recente primeiro.
        const vistos = new Set<string>();
        const juntos: Lista = [];
        for (const i of [...doVisitante, ...guardado].sort((a, b) => b.em - a.em)) {
          if (vistos.has(i.slug)) continue;
          vistos.add(i.slug);
          juntos.push(i);
        }
        c.itens = juntos.slice(0, c.limite);
        gravar(nova, c.itens);
        gravar(c.base, []);
      } else {
        c.itens = guardado;
      }
    }
    avisar();
  });
}

const subscribe = (cb: () => void) => {
  ouvintes.add(cb);
  return () => {
    ouvintes.delete(cb);
  };
};

// ------------------------------------------------------------------ favoritos

export function ehFavorito(slug: string): boolean {
  return caixas.fav.itens.some((i) => i.slug === slug);
}

export function alternarFavorito(p: Omit<ProdutoLembrado, 'em'>): boolean {
  const c = caixas.fav;
  if (c.itens.some((i) => i.slug === p.slug)) {
    publicar(c, c.itens.filter((i) => i.slug !== p.slug));
    return false;
  }
  publicar(c, [{ ...p, em: Date.now() }, ...c.itens]);
  return true;
}

export function removerFavorito(slug: string) {
  publicar(caixas.fav, caixas.fav.itens.filter((i) => i.slug !== slug));
}

export function useFavoritos(): Lista {
  return useSyncExternalStore(subscribe, () => caixas.fav.itens, () => caixas.fav.itens);
}

/** Só o booleano — evita redesenhar o botão do card quando outro item muda. */
export function useEhFavorito(slug: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => caixas.fav.itens.some((i) => i.slug === slug),
    () => false
  );
}

// --------------------------------------------------------------------- vistos

export function registrarVisto(p: Omit<ProdutoLembrado, 'em'>) {
  const c = caixas.vis;
  const semEle = c.itens.filter((i) => i.slug !== p.slug);
  // Reabrir o mesmo produto não pode empurrar os outros para fora da lista.
  publicar(c, [{ ...p, em: Date.now() }, ...semEle]);
}

export function limparVistos() {
  publicar(caixas.vis, []);
}

export function useVistos(): Lista {
  return useSyncExternalStore(subscribe, () => caixas.vis.itens, () => caixas.vis.itens);
}
