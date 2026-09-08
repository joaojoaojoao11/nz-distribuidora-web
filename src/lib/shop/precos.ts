// Preços da LOJA no cliente — cache por sessão e requisições em lote.
//
// O preço NÃO vem no catálogo público: sai de /api/nz/precos, que lê o papel
// no servidor. Este módulo junta os slugs que a tela precisa (uma página de
// resultados tem até 60 cards) numa requisição só, guarda o resultado em
// memória enquanto a sessão durar, e avisa os componentes por
// useSyncExternalStore. Trocar de usuário (login/logout) zera o cache — um
// preço de admin não pode sobreviver a um logout.
//
// O que chega em `rolo`/`metro` é o preço de ATACADO (decisão de 2026-09-08);
// quem escolhe isso é o sync, não este módulo. Aqui nunca se calcula preço:
// desenha-se o que o servidor mandou.

import { useEffect, useMemo, useSyncExternalStore } from 'react';
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
  /**
   * Só chegam para admin. `rolo`/`metro` acima são o ATACADO (o que se cobra);
   * estes dois são a tabela de VAREJO, para o admin saber de quanto está
   * descontando. `usandoVarejo` avisa que o ERP não precificou o atacado e o
   * preço mostrado é a própria tabela — a Central tem a ocorrência.
   */
  roloVarejo?: number | null;
  metroVarejo?: number | null;
  usandoVarejo?: boolean;
  erpSku?: string;
  /** Contagem de rolos no pátio — as bolinhas do card. Só admin. */
  estoque?: { rolosFechados: number; rolosAbertos: number };

  /**
   * O preço acima é o desta seleção, com o acréscimo já aplicado no servidor.
   * O percentual em si só vem para admin (`acrescimoPct` e `base`).
   */
  viaSelecao?: boolean;
  acrescimoPct?: number;
  base?: { rolo: number | null; metro: number | null };
  /** Pediram o preço de um slug que não está na seleção que abriu a porta. */
  foraDaSelecao?: boolean;
}

export type EstadoPrecos = 'anonimo' | 'aguardando-aprovacao' | 'ok' | 'erro' | 'carregando';

/**
 * CONTEXTO. O mesmo slug tem preços diferentes conforme a porta por onde se
 * entra: pela loja, é o atacado; por um link de seleção com acréscimo, é o
 * atacado mais o percentual daquela seleção. E o estado global também muda —
 * um anônimo NÃO tem preço na loja, mas TEM dentro de uma seleção que mostra
 * preço.
 *
 * Por isso o cache é chaveado por (seleção, slug) e o estado é por seleção. O
 * contexto vazio ('') é a loja normal.
 */
const chaveDoContexto = (selecao?: string) => selecao ?? '';
export const chavePreco = (slug: string, selecao?: string) => `${chaveDoContexto(selecao)}|${slug}`;

interface Contexto {
  estado: EstadoPrecos;
  papel: string | null;
  pendentes: Set<string>;
  emVoo: Set<string>;
  timer: ReturnType<typeof setTimeout> | null;
}

interface Store {
  /** Estado por contexto de seleção. */
  contextos: Map<string, Contexto>;
  /** Preços de todos os contextos, chaveados por `chavePreco`. */
  itens: Map<string, PrecoItem>;
}

const novoContexto = (): Contexto => ({
  estado: 'carregando',
  papel: null,
  pendentes: new Set(),
  emVoo: new Set(),
  timer: null,
});

let store: Store = { contextos: new Map(), itens: new Map() };
let usuarioAtual: string | null | undefined; // undefined = ainda não checado
const ouvintes = new Set<() => void>();

/** O contexto vive fora do objeto imutável: ele guarda timers e filas. */
function contextoDe(selecao?: string): Contexto {
  const k = chaveDoContexto(selecao);
  let c = store.contextos.get(k);
  if (!c) {
    c = novoContexto();
    store.contextos.set(k, c);
  }
  return c;
}

/** Troca a identidade do store para o useSyncExternalStore perceber. */
function avisar() {
  store = { contextos: store.contextos, itens: store.itens };
  for (const cb of ouvintes) cb();
}

function marcarEstado(selecao: string | undefined, estado: EstadoPrecos, papel?: string | null) {
  const c = contextoDe(selecao);
  c.estado = estado;
  if (papel !== undefined) c.papel = papel;
  avisar();
}

function limpar() {
  for (const c of store.contextos.values()) if (c.timer) clearTimeout(c.timer);
  store = { contextos: new Map(), itens: new Map() };
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

async function despachar(selecao?: string) {
  const c = contextoDe(selecao);
  c.timer = null;
  const lote = [...c.pendentes]
    .filter((s) => !c.emVoo.has(s) && !store.itens.has(chavePreco(s, selecao)))
    .slice(0, 80);
  c.pendentes.clear();
  if (!lote.length) return;
  for (const s of lote) c.emVoo.add(s);

  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    usuarioAtual = data.session?.user?.id ?? null;

    // Sem sessão E sem seleção não há o que perguntar: o servidor responderia
    // 401. Com seleção, a requisição VAI mesmo sem token — é exatamente o caso
    // do cliente que recebeu o link e não tem cadastro.
    if (!token && !selecao) {
      marcarEstado(selecao, 'anonimo', 'anonimo');
      return;
    }

    const res = await fetch('/api/nz/precos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(selecao ? { slugs: lote, selecao } : { slugs: lote }),
    });
    if (res.status === 401) {
      marcarEstado(selecao, 'anonimo', 'anonimo');
      return;
    }
    if (res.status === 403) {
      marcarEstado(selecao, 'aguardando-aprovacao');
      return;
    }
    if (!res.ok) {
      marcarEstado(selecao, 'erro');
      return;
    }
    const json = (await res.json()) as { papel: string; itens: Record<string, PrecoItem> };
    for (const [slug, item] of Object.entries(json.itens)) store.itens.set(chavePreco(slug, selecao), item);
    marcarEstado(selecao, 'ok', json.papel);
  } catch {
    marcarEstado(selecao, 'erro');
  } finally {
    for (const s of lote) c.emVoo.delete(s);
    if (c.pendentes.size) agendar(selecao);
  }
}

function agendar(selecao?: string) {
  const c = contextoDe(selecao);
  if (c.timer) return;
  c.timer = setTimeout(() => void despachar(selecao), 40);
}

export function pedirPrecos(slugs: readonly string[], selecao?: string) {
  assinarAuth();
  const c = contextoDe(selecao);
  let novo = false;
  for (const s of slugs) {
    if (!store.itens.has(chavePreco(s, selecao)) && !c.emVoo.has(s)) {
      c.pendentes.add(s);
      novo = true;
    }
  }
  if (novo) agendar(selecao);
}

const subscribe = (cb: () => void) => {
  ouvintes.add(cb);
  return () => {
    ouvintes.delete(cb);
  };
};

/**
 * Estado do contexto + o item de um slug.
 *
 * `selecao` é o token de `/loja/s/<token>`. Passar o token errado (ou esquecer
 * de passar) não vaza nada — só mostra o preço da loja no lugar do preço da
 * seleção. Quem decide o que cada papel pode ver é o servidor.
 */
export function usePreco(
  slug: string,
  selecao?: string
): { estado: EstadoPrecos; papel: string | null; item: PrecoItem | undefined } {
  const s = useSyncExternalStore(subscribe, () => store, () => store);
  useEffect(() => {
    pedirPrecos([slug], selecao);
  }, [slug, selecao]);
  const c = s.contextos.get(chaveDoContexto(selecao));
  return {
    estado: c?.estado ?? 'carregando',
    papel: c?.papel ?? null,
    item: s.itens.get(chavePreco(slug, selecao)),
  };
}

/**
 * Os preços já carregados NO CONTEXTO pedido, chaveados por slug — para somar
 * um carrinho sem hook em loop.
 *
 * Devolve o mapa recortado, e não o cache cru, de propósito: assim quem chama
 * continua escrevendo `mapa.get(slug)` e quem esquecer de passar a seleção lê o
 * contexto da loja em vez de pescar, por acidente, o preço de uma seleção com
 * acréscimo que outra tela carregou.
 */
export function usePrecosMapa(selecao?: string): {
  estado: EstadoPrecos;
  itens: ReadonlyMap<string, PrecoItem>;
} {
  const s = useSyncExternalStore(subscribe, () => store, () => store);
  const ctx = chaveDoContexto(selecao);
  // `s` troca de identidade a cada resposta, então o recorte só é refeito
  // quando algo realmente chegou.
  const itens = useMemo(() => {
    const prefixo = `${ctx}|`;
    const m = new Map<string, PrecoItem>();
    for (const [chave, item] of s.itens) {
      if (chave.startsWith(prefixo)) m.set(chave.slice(prefixo.length), item);
    }
    return m;
  }, [s, ctx]);
  return { estado: s.contextos.get(ctx)?.estado ?? 'carregando', itens };
}

/** Pede em lote (uma página de cards). Os cards leem com usePreco. */
export function usePrecosLote(slugs: readonly string[], selecao?: string) {
  const chave = slugs.join('|');
  useEffect(() => {
    if (chave) pedirPrecos(chave.split('|'), selecao);
  }, [chave, selecao]);
}

export const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
