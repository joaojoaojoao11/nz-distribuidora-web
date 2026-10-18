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
//
// VARIANTES (17/10/2026, coleção de camisetas). Cada tamanho é um produto com
// SKU próprio; o M é a VITRINE e os outros apontam para ela (`paiSlug`). A
// lista que a loja desenha (`useShopCatalog`, `catalogoAtual`) é só a dos
// LISTÁVEIS — sem os tamanhos —, então busca, facetas, relacionados e Lente
// mostram uma camiseta por clã sem nenhum filtro espalhado. `getShopItem`
// continua achando qualquer slug, e `variantesDe` monta o seletor.
//
// PRÉVIA DO ADMIN. Produto com `publicar_em` no futuro não está na view
// pública; para o admin ele vem da RPC `loja_catalogo_previa` (que confere
// `nz_is_admin()` no banco) e entra na lista com `agendadoPara`.

import { useSyncExternalStore } from 'react';
import { supabase } from '../supabase';
import { SHOP_ITEMS } from './catalog';
import { lojaRowToShopItem, lojaRowsToShopItems, type LojaCatalogoRow } from './adapters/erp';
import { indexarLinhas, INDICE_VAZIO, type IndiceDeLinhas, type LojaLinhaRow } from './linhas';
import type { ShopItem } from './types';

type Estado = 'estatico' | 'carregando' | 'banco' | 'falhou';

let itens: ShopItem[] = SHOP_ITEMS;
/** `itens` sem os tamanhos filhos: é o que toda lista da loja desenha. */
let listaveis: ShopItem[] = SHOP_ITEMS;
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

/** Itens agendados que só o admin vê (prévia). Vazio para todo o resto. */
let agendados: ShopItem[] = [];
type EstadoPrevia = 'nada' | 'carregando' | 'pronta';
let estadoPrevia: EstadoPrevia = 'nada';

function publicar(novos: ShopItem[], novoEstado: Estado) {
  // A prévia entra por cima de qualquer lista que chegar (catálogo novo, uma
  // linha relida): o slug agendado não existe na view pública.
  const slugsPrevia = new Set(agendados.map((a) => a.slug));
  const lista = agendados.length ? [...novos.filter((i) => !slugsPrevia.has(i.slug)), ...agendados] : novos;
  itens = lista;
  listaveis = lista.filter((i) => !i.paiSlug);
  porSlug = new Map(lista.map((i) => [i.slug, i]));
  porLegacy = new Map(lista.flatMap((i) => (i.legacyPath ? [[i.legacyPath.toLowerCase(), i] as const] : [])));
  estado = novoEstado;
  for (const cb of ouvintes) cb();
}

/**
 * Busca o que está AGENDADO (só admin). A trava é no banco: para quem não é
 * admin a RPC devolve vazio. Falha em silêncio — prévia é conveniência.
 */
async function carregarPrevia(): Promise<void> {
  if (!modoAdmin || typeof window === 'undefined') return;
  estadoPrevia = 'carregando';
  try {
    const { data, error } = await supabase.rpc('loja_catalogo_previa');
    agendados = !error && Array.isArray(data) ? lojaRowsToShopItems(data as unknown as LojaCatalogoRow[]) : [];
  } catch {
    agendados = [];
  }
  estadoPrevia = 'pronta';
  publicar(itens.filter((i) => !i.agendadoPara), estado);
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
    if (error) return;
    // Não está na vitrine pública: para o admin, pode ser um agendado.
    if (!data) {
      if (modoAdmin && estadoPrevia !== 'pronta') await carregarPrevia();
      return;
    }

    const row = data as unknown as LojaCatalogoRow;
    const novos = [lojaRowToShopItem(row)];
    // Vitrine de peça com tamanhos: os tamanhos vêm junto, numa consulta só.
    // É o que faz o seletor funcionar às 18:00 em ponto do lançamento, quando
    // a lista (cacheada na borda) ainda pode não ter os filhos.
    if (row.kind === 'vestuario' && !row.pai_slug) {
      const { data: filhos } = await supabase.from('loja_catalogo').select('*').eq('pai_id', row.id);
      for (const f of (filhos ?? []) as unknown as LojaCatalogoRow[]) novos.push(lojaRowToShopItem(f));
    }
    for (const novo of novos) {
      // `alias_de` é um id; resolvê-lo em slug exige o catálogo inteiro, que esta
      // consulta de uma linha não tem. Preserva o que já havia.
      const anterior = porSlug.get(novo.slug);
      if (anterior?.aliasDeSlug) novo.aliasDeSlug = anterior.aliasDeSlug;
    }
    // Nada mudou: não republica, senão toda página de produto re-renderiza à toa.
    if (novos.every((n) => JSON.stringify(porSlug.get(n.slug)) === JSON.stringify(n))) return;

    const porNovo = new Map(novos.map((n) => [n.slug, n]));
    const lista = [...itens.map((i) => porNovo.get(i.slug) ?? i), ...novos.filter((n) => !porSlug.has(n.slug))];
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
  // Saiu o admin: a prévia sai junto.
  if (!ativo) {
    agendados = [];
    estadoPrevia = 'nada';
    publicar(itens.filter((i) => !i.agendadoPara), estado);
    return;
  }
  // Virou admin com o catálogo da borda já carregado: recarrega, senão ele
  // continua olhando a cópia velha pelo resto da sessão. (A recarga traz a
  // prévia junto.)
  if (promessa) void recarregarCatalogo();
  else void carregarPrevia();
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
      // Admin: a prévia chega ANTES do estado final, senão a página de um
      // produto agendado acharia que o catálogo chegou sem ele e voltaria para /loja.
      if (modoAdmin) await carregarPrevia();
      publicar(lojaRowsToShopItems(json.itens), 'banco');
    } catch (err) {
      if (import.meta.env.DEV) console.info('[shop] catálogo do banco indisponível, usando o estático:', err);
      // Sem API (npm run dev): a prévia vai direto ao Supabase e funciona igual.
      if (modoAdmin) await carregarPrevia();
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

/** O catálogo atual (estático até o banco responder), sem os tamanhos filhos. */
export function useShopCatalog(): ShopItem[] {
  return useSyncExternalStore(subscribe, () => listaveis, () => listaveis);
}

/** 'pronta' quando a prévia do admin já chegou (ou 'nada' fora do modo admin). */
export function useEstadoPrevia(): EstadoPrevia {
  return useSyncExternalStore(subscribe, () => estadoPrevia, () => estadoPrevia);
}

/** 'banco' quando o JSON já chegou; 'falhou' quando ficou no estático de vez. */
export function useCatalogoEstado(): Estado {
  return useSyncExternalStore(subscribe, () => estado, () => estado);
}

/** As fichas de linha e sub-familia que ja chegaram. Vazio antes da carga. */
export function useLinhas(): IndiceDeLinhas {
  return useSyncExternalStore(subscribe, () => indiceLinhas, () => indiceLinhas);
}

/** Lista da loja sem os tamanhos filhos (relacionados, busca). */
export function catalogoAtual(): ShopItem[] {
  return listaveis;
}

const ORDEM_TAMANHO = ['PP', 'P', 'M', 'G', 'GG', 'XGG'];

/**
 * A vitrine e os tamanhos dela, na ordem PP < P < M < G < GG < XGG. Um item
 * sem tamanhos devolve só ele. Recebe o slug da VITRINE.
 */
export function variantesDe(slugVitrine: string): ShopItem[] {
  const alvo = slugVitrine.toLowerCase();
  const grupo = itens.filter((i) => i.slug === alvo || i.paiSlug === alvo);
  const pos = (v: string | null | undefined) => {
    const k = ORDEM_TAMANHO.indexOf((v ?? '').toUpperCase());
    return k < 0 ? ORDEM_TAMANHO.length : k;
  };
  return grupo.sort((a, b) => pos(a.variante) - pos(b.variante) || a.slug.localeCompare(b.slug));
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
