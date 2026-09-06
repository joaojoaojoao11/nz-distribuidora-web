// Frete do CARRINHO inteiro, para o checkout.
//
// A página de produto cota um perfil de embalagem por vez (handlers/prazo.ts).
// No checkout há vários produtos, de linhas diferentes, cada um com o seu
// perfil (rolo Etherna de 130 cm, rolo MCX de 161 cm…). A conta aqui:
//
//   1. cada item vira volumes: rolo fechado = `qtd` volumes do perfil da linha;
//      metros fracionados = 1 volume do mesmo perfil (o corte viaja no mesmo
//      tubo; sai um pouco caro para 1 m, mas nunca barato demais);
//   2. volumes agrupam por perfil; cada grupo é cotado com a rotina que já
//      existe (com cache) — uma chamada por transportadora por perfil;
//   3. uma opção (transportadora + serviço) só é oferecida se atende TODOS os
//      grupos: o valor é a soma, o prazo é o maior.
//
// Quem chama decide se o valor sai para o cliente: aqui é o checkout, e o
// comprador precisa do valor para pagar. A vitrine continua sem valor.

import type { Db } from '../papel.js';
import { cotar, type Carrier, type CotacaoInterna, type ShippingProfile } from '../handlers/prazo.js';
import type { Linha } from '../pedido/precificar.js';

export interface OpcaoFrete {
  /** Identificador estável: `${carrier}|${servico}` ou 'retirada'. */
  id: string;
  nome: string;
  dias: number;
  valor: number;
  transportadora?: string;
  servico?: string;
  retirada?: boolean;
}

export interface ConfigFrete {
  retirada_ativa: boolean;
  retirada_endereco: string;
  frete_gratis_acima: number | null;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Perfil de embalagem de uma linha do pedido: override do produto → padrão da linha → qualquer da linha. */
async function perfilDaLinha(site: Db, l: Linha, cache: Map<string, ShippingProfile | null>): Promise<ShippingProfile | null> {
  const chave = l.produto.shipping_profile_id ? `p:${l.produto.shipping_profile_id}` : `l:${l.produto.linha_key ?? ''}`;
  if (cache.has(chave)) return cache.get(chave)!;

  let perfil: ShippingProfile | null = null;
  if (l.produto.shipping_profile_id) {
    const { data } = await site.from('shipping_profiles').select('*').eq('id', l.produto.shipping_profile_id).eq('ativo', true).maybeSingle();
    perfil = (data as ShippingProfile | null) ?? null;
  }
  if (!perfil && l.produto.linha_key) {
    const { data: linhas } = await site.from('shipping_profile_lines').select('profile_id, is_default').eq('line_key', l.produto.linha_key);
    const lista = (linhas ?? []) as { profile_id: string; is_default: boolean }[];
    const escolhida = lista.find((x) => x.is_default) ?? lista[0];
    if (escolhida) {
      const { data } = await site.from('shipping_profiles').select('*').eq('id', escolhida.profile_id).eq('ativo', true).maybeSingle();
      perfil = (data as ShippingProfile | null) ?? null;
    }
  }
  cache.set(chave, perfil);
  return perfil;
}

export interface ResultadoFreteCarrinho {
  opcoes: OpcaoFrete[];
  /** Itens sem perfil de embalagem — o carrinho não pode ser cotado. */
  semPerfil: string[];
  motivos: string[];
}

export async function cotarCarrinho(site: Db, linhas: Linha[], cep: string, subtotal: number, cfg: ConfigFrete): Promise<ResultadoFreteCarrinho> {
  const opcoes: OpcaoFrete[] = [];
  if (cfg.retirada_ativa) {
    opcoes.push({ id: 'retirada', nome: 'Retirar em São Paulo', dias: 0, valor: 0, retirada: true });
  }

  // ---------------------------------------------------- volumes por perfil
  const cachePerfis = new Map<string, ShippingProfile | null>();
  const grupos = new Map<string, { perfil: ShippingProfile; qtd: number }>();
  const semPerfil: string[] = [];
  for (const l of linhas) {
    const perfil = await perfilDaLinha(site, l, cachePerfis);
    if (!perfil) {
      semPerfil.push(l.produto.slug);
      continue;
    }
    const volumes = l.item.unidade === 'rolo' ? Math.ceil(l.item.qtd) : 1;
    const g = grupos.get(perfil.id) ?? { perfil, qtd: 0 };
    g.qtd += volumes;
    grupos.set(perfil.id, g);
  }
  if (semPerfil.length || !grupos.size || !/^\d{8}$/.test(cep)) {
    return { opcoes, semPerfil, motivos: [] };
  }

  const { data: carriersData } = await site
    .from('shipping_carriers')
    .select('slug, nome, cep_origem, dias_manuseio, modalidade, ordem, config')
    .eq('ativo', true)
    .order('ordem', { ascending: true });
  const carriers = (carriersData ?? []) as unknown as Carrier[];
  const motivos: string[] = [];

  // ---------------------------------------------- cota cada grupo, combina
  // `porGrupo[i]` = mapa opcaoId → cotação daquele grupo.
  const porGrupo: Map<string, CotacaoInterna>[] = [];
  for (const g of grupos.values()) {
    const qtd = Math.min(g.qtd, 50);
    const resultados = await Promise.allSettled(carriers.map((c) => cotar(site, c, g.perfil, cep, qtd)));
    const mapa = new Map<string, CotacaoInterna>();
    for (const r of resultados) {
      if (r.status === 'rejected') {
        motivos.push(String(r.reason?.message ?? r.reason));
        continue;
      }
      for (const c of r.value) {
        if (c.valor == null) continue;
        mapa.set(`${c.carrier}|${c.servico ?? ''}`, c);
      }
    }
    porGrupo.push(mapa);
  }

  const primeiro = porGrupo[0] ?? new Map<string, CotacaoInterna>();
  for (const [id, c0] of primeiro) {
    let valor = 0;
    let dias = 0;
    let completo = true;
    for (const mapa of porGrupo) {
      const c = mapa.get(id);
      if (!c || c.valor == null) {
        completo = false;
        break;
      }
      valor += c.valor;
      dias = Math.max(dias, c.dias);
    }
    if (!completo) continue;
    const gratis = cfg.frete_gratis_acima != null && subtotal >= cfg.frete_gratis_acima;
    opcoes.push({
      id,
      nome: c0.nome,
      dias,
      valor: gratis ? 0 : r2(valor),
      transportadora: c0.transportadora,
      servico: c0.servico,
    });
  }

  // Retirada primeiro; depois do mais barato ao mais caro, e no empate o mais rápido.
  opcoes.sort((a, b) => Number(Boolean(b.retirada)) - Number(Boolean(a.retirada)) || a.valor - b.valor || a.dias - b.dias);
  return { opcoes, semPerfil, motivos };
}
