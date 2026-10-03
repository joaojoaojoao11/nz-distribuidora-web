// Promoção Moto (/loja?promo=moto) no cliente: quais cores entram e as fotos de
// moto de cada uma. Vem de /api/nz/promo-moto (ver o handler), que é público e
// fica 5 minutos na CDN — aqui é uma busca por sessão, guardada em memória.
// O preço do METRO da promoção vem aqui também, público (o rolo segue no
// /api/nz/precos, por papel).

import { useEffect, useState } from 'react';

export interface ItemPromoMoto {
  /** As fotos de moto da cor, na ordem da galeria (3/4, perfil, tanque). */
  fotos: string[];
  /** Preço de saída do metro (o que o checkout cobra). */
  metro?: number | null;
  /** A tabela do metro, riscada no card. `null` = sem desconto. */
  metroCheio?: number | null;
}

export type MapaPromoMoto = ReadonlyMap<string, ItemPromoMoto>;

let cache: MapaPromoMoto | null = null;
let promessa: Promise<MapaPromoMoto | null> | null = null;

async function buscar(): Promise<MapaPromoMoto | null> {
  const res = await fetch('/api/nz/promo-moto', { headers: { Accept: 'application/json' } });
  // 503 no `npm run dev` (a API não roda no Vite) e erro de rede caem aqui: sem
  // mapa, a promoção mostra o aviso de "carregando/indisponível", nunca a loja
  // inteira como se fosse promoção.
  if (!res.ok) return null;
  const json = (await res.json()) as { itens?: Record<string, ItemPromoMoto> };
  return new Map(Object.entries(json.itens ?? {}));
}

/** `undefined` = ainda carregando; `null` = indisponível; mapa = pronto. */
export function usePromoMoto(ativo: boolean): MapaPromoMoto | null | undefined {
  const [mapa, setMapa] = useState<MapaPromoMoto | null | undefined>(cache ?? undefined);

  useEffect(() => {
    if (!ativo || cache) return;
    let vivo = true;
    if (!promessa) {
      promessa = buscar()
        .then((m) => {
          cache = m;
          return m;
        })
        .catch(() => null)
        .finally(() => {
          // Falhou: deixa tentar de novo na próxima vez que a promoção abrir.
          if (!cache) promessa = null;
        });
    }
    void promessa.then((m) => {
      if (vivo) setMapa(m);
    });
    return () => {
      vivo = false;
    };
  }, [ativo]);

  return ativo ? mapa : undefined;
}
