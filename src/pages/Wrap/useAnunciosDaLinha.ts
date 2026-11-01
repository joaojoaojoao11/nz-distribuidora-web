// Os anúncios de uma linha na NZSTORE, para a vitrine da página da linha
// (VitrineDaLinha) e para os contadores do herói das páginas Decor.

import { useMemo } from 'react';
import { useCatalogoEstado, useShopCatalog } from '../../lib/shop/store';
import type { LineKey, ShopItem } from '../../lib/shop/types';

export const normalizar = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/**
 * Grupo do filtro, tirado do subtítulo do anúncio: "Metamark 7 Series · Azuis"
 * → "Azuis"; nas linhas Decor o subtítulo já é o grupo ("Madeira"). Subtítulo
 * igual ao nome da linha não é grupo: o anúncio só aparece em TODAS.
 */
export function grupoDoAnuncio(item: ShopItem, lineLabel: string): string | null {
  const sub = item.subtitle?.trim();
  if (!sub) return null;
  const partes = sub.split(' · ');
  if (partes.length > 1) return partes[partes.length - 1].trim() || null;
  const n = normalizar(sub);
  if (n === normalizar(lineLabel) || (item.line && n === normalizar(item.line))) return null;
  return sub;
}

/** Os anúncios da linha na ordem do código, quantos grupos eles têm e se o banco já respondeu. */
export function useAnunciosDaLinha(lineKey: LineKey, lineLabel = '') {
  const catalogo = useShopCatalog();
  const estado = useCatalogoEstado();
  const itens = useMemo(
    () =>
      catalogo
        .filter((i) => i.lineKey === lineKey)
        .sort((a, b) => (a.code ?? a.name).localeCompare(b.code ?? b.name, 'pt-BR', { numeric: true })),
    [catalogo, lineKey],
  );
  const familias = useMemo(
    () => new Set(itens.map((i) => grupoDoAnuncio(i, lineLabel)).filter(Boolean)).size,
    [itens, lineLabel],
  );
  return { itens, familias, pronto: estado === 'banco' || estado === 'falhou' };
}
