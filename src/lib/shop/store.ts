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
import { SHOP_ITEMS } from './catalog';
import { lojaRowsToShopItems, type LojaCatalogoRow } from './adapters/erp';
import type { ShopItem } from './types';

type Estado = 'estatico' | 'carregando' | 'banco' | 'falhou';

let itens: ShopItem[] = SHOP_ITEMS;
let porSlug: ReadonlyMap<string, ShopItem> = new Map(SHOP_ITEMS.map((i) => [i.slug, i]));
let porLegacy: ReadonlyMap<string, ShopItem> = new Map(
  SHOP_ITEMS.flatMap((i) => (i.legacyPath ? [[i.legacyPath.toLowerCase(), i] as const] : []))
);
let estado: Estado = 'estatico';
let promessa: Promise<void> | null = null;
const ouvintes = new Set<() => void>();

function publicar(novos: ShopItem[], novoEstado: Estado) {
  itens = novos;
  porSlug = new Map(novos.map((i) => [i.slug, i]));
  porLegacy = new Map(novos.flatMap((i) => (i.legacyPath ? [[i.legacyPath.toLowerCase(), i] as const] : [])));
  estado = novoEstado;
  for (const cb of ouvintes) cb();
}

/** Busca o catálogo do banco uma vez. Idempotente. */
export function carregarCatalogo(): Promise<void> {
  if (promessa) return promessa;
  if (typeof window === 'undefined') return Promise.resolve();
  estado = 'carregando';
  promessa = (async () => {
    try {
      const res = await fetch('/api/nz/catalogo', { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { itens?: LojaCatalogoRow[] };
      if (!Array.isArray(json.itens) || json.itens.length === 0) throw new Error('catálogo vazio');
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

export function catalogoAtual(): ShopItem[] {
  return itens;
}

export function getShopItem(slug: string): ShopItem | undefined {
  return porSlug.get(slug.toLowerCase());
}

export function getShopItemByLegacyPath(path: string): ShopItem | undefined {
  return porLegacy.get(path.toLowerCase());
}

/** Força nova carga (depois de um "Sincronizar agora" no admin, por exemplo). */
export function recarregarCatalogo(): Promise<void> {
  promessa = null;
  return carregarCatalogo();
}
