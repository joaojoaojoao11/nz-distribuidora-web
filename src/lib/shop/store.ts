// Store do catálogo da LOJA — o que a interface lê.
//
// Antes o catálogo era uma constante compilada no bundle (SHOP_ITEMS). Agora
// ele vive no banco (produtos ⨝ erp_produtos) e chega por /api/nz/catalogo,
// um JSON cacheado na CDN. Este módulo faz a ponte sem mudar o resto: a loja
// continua recebendo um array pronto de ShopItem.
//
// Estratégia de carga:
//   1. começa com o snapshot estático (primeira pintura sem esperar rede);
//   2. dispara UMA busca do JSON quando o primeiro componente usar o hook;
//   3. ao chegar, substitui o array inteiro — quem estava pendente/inativo no
//      ERP some, quem só existe no ERP aparece.
// Se a rede falhar (ou em `npm run dev`, onde a API não existe), fica o
// estático — a loja nunca fica vazia por causa do sync.

import { useSyncExternalStore } from 'react';
import { supabase } from '../supabase';
import { SHOP_ITEMS } from './catalog';
import { lojaRowToShopItem, lojaRowsToShopItems, type LojaCatalogoRow } from './adapters/erp';
import { indexarLinhas, INDICE_VAZIO, type IndiceDeLinhas, type LojaLinhaRow } from './linhas';
import type { ShopItem } from './types';

type Estado = 'estatico' | 'carregando' | 'banco' | 'falhou';

let itens: ShopItem[] = SHOP_ITEMS;
let porSlug: ReadonlyMap<string, ShopItem> = new Map(SHOP_ITEMS.map((i) => [i.slug, i]));
let porLegacy: ReadonlyMap<string, ShopItem> = new Map(
  SHOP_ITEMS.flatMap((i) => (i.legacyPath ? [[i.legacyPath.toLowerCase(), i] as const] : []))
);
// Fichas de linha e sub-familia, do mesmo JSON do catalogo. Comeca vazio: sem
// API (npm run dev, rede caida) a pagina do produto mostra so a ficha da
// variante, que e o comportamento de antes.
let indiceLinhas: IndiceDeLinhas = INDICE_VAZIO;
let estado: Estado = 'estatico';
/**
 * Quem edita nunca pode ver a versao velha.
 *
 * A resposta do catalogo fica cacheada na borda (ver o handler). Para o
 * visitante isso e' otimo; para quem acabou de trocar a capa de um produto e
 * abriu a loja na aba do lado, e' a foto antiga de volta — e a conclusao e'
 * "nao salvou". Com admin logado, toda carga vai direto na origem.
 *
 * Nao e' seguranca: o `?nocache=1` e publico e nao revela nada que o catalogo
 * ja nao mostre. E so' quem paga o preco de pular o cache.
 */
let modoAdmin = false;
let promessa: Promise<void> | null = null;
const ouvintes = new Set<() => void>();

function publicar(novos: ShopItem[], novoEstado: Estado) {
  itens = novos;
  porSlug = new Map(novos.map((i) => [i.slug, i]));
  porLegacy = new Map(novos.flatMap((i) => (i.legacyPath ? [[i.legacyPath.toLowerCase(), i] as const] : [])));
  estado = novoEstado;
  for (const cb of ouvintes) cb();
}

/**
 * Relê UM produto direto do banco e troca a versão que está na tela.
 *
 * POR QUE ISTO EXISTE. O catálogo inteiro (`/api/nz/catalogo`) é uma resposta
 * grande e cacheada na borda da Vercel — é o que faz a loja abrir rápido, e é
 * também o que fazia uma foto apagada continuar aparecendo por minutos. Não há
 * purge de borda para função comum no plano Hobby, então esperar o cache vencer
 * era a única saída: rápido, mas nunca *garantido*.
 *
 * A página do produto não precisa do catálogo inteiro para se corrigir: precisa
 * de UMA linha. Esta função vai direto ao PostgREST do Supabase, que não passa
 * pela CDN e responde o estado do banco naquele instante. A lista continua
 * vindo do JSON cacheado; quem abre um produto vê a verdade.
 *
 * Falha em silêncio de propósito: sem rede, ou com o Supabase fora, a página
 * segue com o que o catálogo trouxe. É melhoria, não dependência.
 */
export async function atualizarItemDoBanco(slug: string): Promise<void> {
  if (typeof window === 'undefined' || !slug) return;
  try {
    const { data, error } = await supabase
      .from('loja_catalogo')
      .select('*')
      .eq('slug', slug.toLowerCase())
      .maybeSingle();
    if (error || !data) return;

    const novo = lojaRowToShopItem(data as unknown as LojaCatalogoRow);
    const anterior = porSlug.get(novo.slug);
    // `alias_de` é um id; resolvê-lo em slug exige o catálogo inteiro, que esta
    // consulta de uma linha não tem. Preserva o que já havia.
    if (anterior?.aliasDeSlug) novo.aliasDeSlug = anterior.aliasDeSlug;
    // Nada mudou: não republica, senão toda página de produto re-renderiza à toa.
    if (anterior && JSON.stringify(anterior) === JSON.stringify(novo)) return;

    const lista = anterior
      ? itens.map((i) => (i.slug === novo.slug ? novo : i))
      : [...itens, novo];
    // O estado descreve a CARGA do catálogo inteiro, não esta linha. Trocá-lo
    // aqui faria a página do produto achar que o catálogo chegou e mandar para
    // /loja um slug que ela ainda não conhece.
    publicar(lista, estado);
  } catch {
    // Ver a nota acima: silêncio é o comportamento correto aqui.
  }
}

/** Liga o modo "sempre da origem". Chamado pelo AuthContext quando há admin. */
export function definirModoAdmin(ativo: boolean) {
  if (modoAdmin === ativo) return;
  modoAdmin = ativo;
  // Virou admin com o catálogo da borda já carregado: recarrega, senão ele
  // continua olhando a cópia velha pelo resto da sessão.
  if (ativo && promessa) void recarregarCatalogo();
}

/**
 * Busca o catálogo do banco uma vez. Idempotente.
 *
 * `semCache` pede a versão de origem (`?nocache=1`), pulando a CDN. É o que o
 * painel usa depois de salvar: a resposta normal fica até 5 min fresca na borda
 * e ainda pode ser servida "stale" depois disso, então quem acabou de apagar uma
 * foto recarregava a página e via a foto de volta — parecia que não tinha
 * salvado. Visitante continua na versão cacheada; só quem editou fura a fila.
 */
export function carregarCatalogo(semCache = false): Promise<void> {
  if (promessa) return promessa;
  if (typeof window === 'undefined') return Promise.resolve();
  estado = 'carregando';
  promessa = (async () => {
    try {
      const direto = semCache || modoAdmin;
      const url = direto ? `/api/nz/catalogo?nocache=1&t=${Date.now()}` : '/api/nz/catalogo';
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        // Sem isto o cache do NAVEGADOR (max-age=30) responde antes da rede.
        cache: direto ? 'no-store' : 'default',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { itens?: LojaCatalogoRow[]; linhas?: LojaLinhaRow[] };
      if (!Array.isArray(json.itens) || json.itens.length === 0) throw new Error('catálogo vazio');
      if (Array.isArray(json.linhas)) indiceLinhas = indexarLinhas(json.linhas);
      publicar(lojaRowsToShopItems(json.itens), 'banco');
    } catch (err) {
      if (import.meta.env.DEV) console.info('[shop] catálogo do banco indisponível, usando o estático:', err);
      publicar(itens, 'falhou');
    }
  })();
  return promessa;
}

const subscribe = (cb: () => void) => {
  ouvintes.add(cb);
  if (!promessa) void carregarCatalogo();
  return () => {
    ouvintes.delete(cb);
  };
};

/** O catálogo atual (estático até o banco responder). */
export function useShopCatalog(): ShopItem[] {
  return useSyncExternalStore(subscribe, () => itens, () => itens);
}

/** 'banco' quando o JSON já chegou; 'falhou' quando ficou no estático de vez. */
export function useCatalogoEstado(): Estado {
  return useSyncExternalStore(subscribe, () => estado, () => estado);
}

/** As fichas de linha e sub-familia que ja chegaram. Vazio antes da carga. */
export function useLinhas(): IndiceDeLinhas {
  return useSyncExternalStore(subscribe, () => indiceLinhas, () => indiceLinhas);
}

export function catalogoAtual(): ShopItem[] {
  return itens;
}

export function getShopItem(slug: string): ShopItem | undefined {
  return porSlug.get(slug.toLowerCase());
}

export function getShopItemByLegacyPath(path: string): ShopItem | undefined {
  return porLegacy.get(path.toLowerCase());
}

/**
 * Força nova carga, pulando CDN e cache do navegador. É o que o painel chama
 * depois de salvar — ver a nota em `carregarCatalogo`.
 */
export function recarregarCatalogo(): Promise<void> {
  promessa = null;
  return carregarCatalogo(true);
}
