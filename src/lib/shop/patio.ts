// Mapa do pátio no cliente — quais slugs têm rolo fechado e quais têm ponta.
//
// É o que faz as duas bolinhas do card virarem FILTRO. As bolinhas em si
// chegam junto do preço, página por página; o filtro precisa da resposta para
// o catálogo inteiro, e é isso que /api/nz/patio entrega (ver o handler).
//
// Uma busca por sessão, guardada em memória. O catálogo não muda de minuto a
// minuto — o sync com o ERP é diário — e recarregar a cada troca de filtro
// custaria uma requisição por clique.
//
// SÓ ADMIN. Quem decide é o servidor (403 para os demais); aqui a flag `ativo`
// serve para não bater na porta à toa, não como segurança.

import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import type { MapaPatio } from './types';

let cache: MapaPatio | null = null;
let promessa: Promise<MapaPatio | null> | null = null;
/** Quem carregou o cache. Trocar de usuário tem que zerar. */
let donoDoCache: string | null | undefined;
let assinouAuth = false;

interface Resposta {
  fechados?: string[];
  abertos?: string[];
}

async function buscar(): Promise<MapaPatio | null> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return null;

  const res = await fetch('/api/nz/patio', {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  // 403 (não é admin) e 503 (API fora, `npm run dev`) caem no mesmo lugar: sem
  // mapa, o grupo de filtros não aparece e nada é cortado.
  if (!res.ok) return null;

  const json = (await res.json()) as Resposta;
  donoDoCache = data.session?.user?.id ?? null;
  return {
    fechados: new Set(json.fechados ?? []),
    abertos: new Set(json.abertos ?? []),
  };
}

export function limparPatio() {
  cache = null;
  promessa = null;
  donoDoCache = undefined;
}

/**
 * Sessão mudou → o mapa morre. Mesma regra do cache de preços: um dado de
 * admin não pode sobreviver ao logout que tirou o admin de cena.
 */
function assinarAuth() {
  if (assinouAuth || typeof window === 'undefined') return;
  assinouAuth = true;
  supabase.auth.onAuthStateChange((_evento, sessao) => {
    const id = sessao?.user?.id ?? null;
    if (donoDoCache !== undefined && id !== donoDoCache) limparPatio();
  });
}

/**
 * O mapa, ou `null` enquanto não houver um (carregando, não é admin, API fora).
 * `null` é o estado normal para todo mundo que não é admin — quem chama trata
 * a ausência ignorando o filtro, nunca zerando a lista.
 */
export function usePatio(ativo: boolean): MapaPatio | null {
  const [mapa, setMapa] = useState<MapaPatio | null>(cache);

  useEffect(() => {
    if (!ativo) return;
    let vivo = true;
    assinarAuth();

    if (!promessa) {
      promessa = buscar()
        .then((m) => {
          cache = m;
          return m;
        })
        .catch(() => null);
    }
    void promessa.then((m) => {
      if (vivo) setMapa(m);
    });

    return () => {
      vivo = false;
    };
  }, [ativo]);

  return ativo ? mapa : null;
}
