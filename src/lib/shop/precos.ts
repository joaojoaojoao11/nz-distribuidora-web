// Preços da LOJA no cliente — cache por sessão e requisições em lote.
//
// O preço NÃO vem no catálogo público: sai de /api/nz/precos, que lê o papel
// no servidor. Este módulo junta os slugs que a tela precisa (uma página de
// resultados tem até 60 cards) numa requisição só, guarda o resultado em
// memória enquanto a sessão durar, e avisa os componentes por
// useSyncExternalStore. Trocar de usuário (login/logout) zera o cache — um
// preço de admin não pode sobreviver a um logout.

import { useEffect, useSyncExternalStore } from 'react';
import { supabase } from '../supabase';

export interface PrecoItem {
  disponivel: boolean;
  rolo?: number | null;
  metro?: number | null;
  metragemPadrao?: number | null;
  larguraM?: number | null;
  unidade?: string;
  promocao?: boolean;
  atualizadoEm?: string;
  /** Só chegam para admin. */
  roloMin?: number | null;
  metroMin?: number | null;
  erpSku?: string;
}

export type EstadoPrecos = 'anonimo' | 'aguardando-aprovacao' | 'ok' | 'erro' | 'carregando';

interface Store {
  estado: EstadoPrecos;
  papel: string | null;
  itens: Map<string, PrecoItem>;
}

let store: Store = { estado: 'carregando', papel: null, itens: new Map() };
let usuarioAtual: string | null | undefined; // undefined = ainda não checado
const pendentes = new Set<string>();
const emVoo = new Set<string>();
let timer: ReturnType<typeof setTimeout> | null = null;
const ouvintes = new Set<() => void>();

function publicar(patch: Partial<Store>) {
  store = { ...store, ...patch };
  for (const cb of ouvintes) cb();
}

function limpar() {
  store = { estado: 'carregando', papel: null, itens: new Map() };
  pendentes.clear();
  emVoo.clear();
  for (const cb of ouvintes) cb();
}

// Sessão mudou → cache morre. Registrado uma vez por aba.
let assinouAuth = false;
function assinarAuth() {
  if (assinouAuth || typeof window === 'undefined') return;
  assinouAuth = true;
  supabase.auth.onAuthStateChange((_evento, sessao) => {
    const id = sessao?.user?.id ?? null;
    if (usuarioAtual !== undefined && id !== usuarioAtual) limpar();
    usuarioAtual = id;
  });
}

async function despachar() {
  timer = null;
  const lote = [...pendentes].filter((s) => !emVoo.has(s) && !store.itens.has(s)).slice(0, 80);
  pendentes.clear();
  if (!lote.length) return;
  for (const s of lote) emVoo.add(s);

  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    usuarioAtual = data.session?.user?.id ?? null;
    if (!token) {
      publicar({ estado: 'anonimo', papel: 'anonimo' });
      return;
    }
    const res = await fetch('/api/nz/precos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ slugs: lote }),
    });
    if (res.status === 401) {
      publicar({ estado: 'anonimo', papel: 'anonimo' });
      return;
    }
    if (res.status === 403) {
      publicar({ estado: 'aguardando-aprovacao' });
      return;
    }
    if (!res.ok) {
      publicar({ estado: 'erro' });
      return;
    }
    const json = (await res.json()) as { papel: string; itens: Record<string, PrecoItem> };
    const itens = new Map(store.itens);
    for (const [slug, item] of Object.entries(json.itens)) itens.set(slug, item);
    publicar({ estado: 'ok', papel: json.papel, itens });
  } catch {
    publicar({ estado: 'erro' });
  } finally {
    for (const s of lote) emVoo.delete(s);
    if (pendentes.size) agendar();
  }
}

function agendar() {
  if (timer) return;
  timer = setTimeout(despachar, 40);
}

export function pedirPrecos(slugs: readonly string[]) {
  assinarAuth();
  let novo = false;
  for (const s of slugs) {
    if (!store.itens.has(s) && !emVoo.has(s)) {
      pendentes.add(s);
      novo = true;
    }
  }
  if (novo) agendar();
}

const subscribe = (cb: () => void) => {
  ouvintes.add(cb);
  return () => {
    ouvintes.delete(cb);
  };
};

/** Estado global (anônimo / aguardando / ok) + o item de um slug. */
export function usePreco(slug: string): { estado: EstadoPrecos; papel: string | null; item: PrecoItem | undefined } {
  const s = useSyncExternalStore(subscribe, () => store, () => store);
  useEffect(() => {
    pedirPrecos([slug]);
  }, [slug]);
  return { estado: s.estado, papel: s.papel, item: s.itens.get(slug) };
}

/** Pede em lote (uma página de cards). Os cards leem com usePreco. */
export function usePrecosLote(slugs: readonly string[]) {
  const chave = slugs.join('|');
  useEffect(() => {
    if (chave) pedirPrecos(chave.split('|'));
  }, [chave]);
}

export const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
