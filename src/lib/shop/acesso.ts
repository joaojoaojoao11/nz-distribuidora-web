// O que o tipo de acesso de quem está logado VÊ na loja (acesso_config).
//
// O catálogo é público e vem da CDN, igual para todo mundo; quem decide o que
// cada tipo vê é o servidor (preço, estoque, pedido). Este módulo só evita
// mostrar na tela o que o servidor vai negar: a Loja tira da lista os
// produtos de linhas ocultas e esconde o botão da promoção quando o tipo não
// a vê. Anônimo e admin veem tudo (anônimo sem preço, como sempre).
//
// Uma leitura por tipo, por aba; `useSyncExternalStore` para a lista não
// piscar entre "tudo" e "filtrado" a cada render.

import { useEffect, useSyncExternalStore } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../supabase';

export interface AcessoConfig {
  linhasOcultas: Set<string>;
  veRolo: boolean;
  veMetro: boolean;
  veEstoque: boolean;
  vePromocao: boolean;
  pagamentoOnline: boolean;
}

export const ACESSO_TUDO: AcessoConfig = Object.freeze({ linhasOcultas: new Set<string>(), veRolo: true, veMetro: true, veEstoque: false, vePromocao: true, pagamentoOnline: true });

const cache = new Map<string, AcessoConfig>();
const pendentes = new Set<string>();
const ouvintes = new Set<() => void>();

function avisar() {
  for (const o of ouvintes) o();
}

function subscribe(o: () => void) {
  ouvintes.add(o);
  return () => {
    ouvintes.delete(o);
  };
}

async function carregar(papel: string): Promise<void> {
  if (cache.has(papel) || pendentes.has(papel)) return;
  pendentes.add(papel);
  try {
    const { data } = await supabase.from('acesso_config').select('linhas_ocultas, ve_rolo, ve_metro, ve_estoque, ve_promocao, pagamento_online').eq('papel', papel).maybeSingle();
    const r = data as { linhas_ocultas?: string[] | null; ve_rolo?: boolean; ve_metro?: boolean; ve_estoque?: boolean; ve_promocao?: boolean; pagamento_online?: boolean } | null;
    cache.set(
      papel,
      r
        ? { linhasOcultas: new Set(r.linhas_ocultas ?? []), veRolo: r.ve_rolo !== false, veMetro: r.ve_metro !== false, veEstoque: r.ve_estoque === true, vePromocao: r.ve_promocao !== false, pagamentoOnline: r.pagamento_online !== false }
        : ACESSO_TUDO
    );
  } catch {
    cache.set(papel, ACESSO_TUDO);
  } finally {
    pendentes.delete(papel);
    avisar();
  }
}

/** Admin e anônimo: tudo. Cliente/lojista/revendedor: a regra do tipo (ou tudo, enquanto carrega). */
export function useAcessoConfig(): AcessoConfig {
  const { profile, isAdmin } = useAuth();
  const papel = profile && !isAdmin ? profile.role : null;
  useEffect(() => {
    if (papel) void carregar(papel);
  }, [papel]);
  return useSyncExternalStore(subscribe, () => (papel ? cache.get(papel) ?? ACESSO_TUDO : ACESSO_TUDO));
}

/** Depois de salvar no admin: a próxima leitura busca de novo. */
export function esquecerAcessoConfig(): void {
  cache.clear();
  avisar();
}
