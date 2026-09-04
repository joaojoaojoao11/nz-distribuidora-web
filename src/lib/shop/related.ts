// Itens relacionados na página de produto.
//
// Cascata: mesma cor primária → mesmo padrão → mesma linha → mesma marca →
// mesma vertical. A cascata existe para garantir que SEMPRE haja 8 sugestões:
// um item sem cor e sem padrão (uma linha Avery) ainda cai na marca, e a loja
// nunca mostra uma seção "Relacionados" vazia ou com 2 cards perdidos.

import { SHOP_ITEMS } from './catalog';
import type { ShopItem } from './types';

export function relatedItems(item: ShopItem, limit = 8): ShopItem[] {
  const out: ShopItem[] = [];
  const seen = new Set<string>([item.slug]);

  const push = (candidates: ShopItem[]) => {
    for (const c of candidates) {
      if (out.length >= limit) return;
      if (seen.has(c.slug)) continue;
      seen.add(c.slug);
      out.push(c);
    }
  };

  const primaryColor = item.colorFamilies[0];

  // 1. Mesma cor primária E mesmo acabamento — o vizinho mais próximo.
  if (primaryColor && item.finishes.length) {
    push(
      SHOP_ITEMS.filter(
        (c) =>
          c.colorFamilies[0] === primaryColor &&
          c.finishes.some((f) => item.finishes.includes(f))
      )
    );
  }

  // 2. Mesma cor primária, qualquer acabamento.
  if (primaryColor) {
    push(SHOP_ITEMS.filter((c) => c.colorFamilies[0] === primaryColor));
  }

  // 3. Mesma família de padrão.
  if (item.patternFamily) {
    push(SHOP_ITEMS.filter((c) => c.patternFamily === item.patternFamily));
  }

  // 4. Mesma linha comercial.
  push(SHOP_ITEMS.filter((c) => c.lineKey === item.lineKey));

  // 5. Mesma marca, depois mesma vertical.
  push(SHOP_ITEMS.filter((c) => c.brand === item.brand));
  push(SHOP_ITEMS.filter((c) => c.vertical === item.vertical));

  // 6. Último degrau: qualquer item com imagem. Sem isso as 6 linhas NZPPF
  // ficam com 5 sugestões, porque a vertical PPF inteira tem 6 itens e a
  // cascata acabava aqui. Um bloco "Relacionados" com 5 cards fica torto no
  // grid de 4 colunas.
  push(SHOP_ITEMS.filter((c) => c.image !== null));

  return out;
}
