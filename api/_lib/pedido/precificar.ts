// Precificação e montagem do pedido — compartilhado por /api/nz/pedido
// (orçamento sem pagamento) e /api/nz/checkout (pagamento online).
//
// Regra única: o cliente manda itens (slug, qtd, unidade); TODO valor sai daqui,
// do espelho do NZERP (erp_produtos). Nunca do corpo da requisição.
//
// Unidade no ERP: metro linear ('MT'). Rolo fechado = metragem_padrao metros ao
// preço de atacado por metro (preco_rolo ÷ metragem); fracionado = metros ao
// preco_metro. É a régua do simulador da tabela de preço do NZERP.
//
// Unidade 'un' (desde 17/10/2026, Coleção NZPPF 2026): SKU com unidade 'UN' no
// ERP vende por PEÇA — quantidade inteira, preço = preco_rolo, e vai ao ERP como
// `unit: 'UN'`. A coerência é obrigatória nos dois sentidos: SKU 'UN' só compra
// como 'un', e 'un' só vale para SKU 'UN' (antes, uma camiseta passava como
// "0,5 metro").

import type { Db, Papel } from '../papel.js';
import { faltandoNoCadastro } from '../conta/completude.js';
import { r2 } from './dinheiro.js';
import { carregarRegras, precoParaAcesso, type Regras } from '../precos/regraAcesso.js';
import { lerPromoMoto, precoMetroPromo, type PromoMoto } from '../promoMotoDados.js';
import { estaAgendado, vendePorUnidade } from '../loja/visibilidade.js';

export type UnidadePedido = 'rolo' | 'metro' | 'un';

export interface ItemPedido {
  slug: string;
  qtd: number;
  unidade: UnidadePedido;
  lpns?: string[];
}

export interface Produto {
  id: string;
  slug: string;
  nome: string;
  codigo: string | null;
  erp_sku: string | null;
  tipo_vinculo: string;
  linha_key: string | null;
  shipping_profile_id: string | null;
  /** Publicação agendada: até esta data só o admin precifica (prévia). */
  publicar_em?: string | null;
}

export interface Espelho {
  sku: string;
  nome: string | null;
  ativo: boolean;
  metragem_padrao: number | null;
  preco_rolo: number | null;
  preco_metro: number | null;
  /** VAREJO do ERP — base do cliente final quando a regra do tipo pede. */
  preco_rolo_varejo?: number | null;
  preco_metro_varejo?: number | null;
  saldo_ml: number;
  /** 'ML' | 'M2' | 'UN' — 'UN' vende por peça. */
  unidade?: string | null;
}

export interface Perfil {
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  email: string | null;
  cpf_cnpj: string | null;
  ie: string | null;
  indicado_por: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  asaas_customer_id: string | null;
  asaas_customer_env: string | null;
  /** Cobrança do cartão, quando o titular usa outro endereço. */
  cobranca_igual_entrega?: boolean | null;
  cobranca_cep?: string | null;
  cobranca_numero?: string | null;
}

export interface Linha {
  produto: Produto;
  e: Espelho;
  item: ItemPedido;
  /** R$ por metro linear (é o que vai ao ERP); na unidade 'un', R$ por peça. */
  unitPrice: number;
  /** Metros lineares totais da linha; na unidade 'un', o número de peças. */
  qtyMt: number;
  total: number;
  /** R$ por rolo fechado (ou por peça) JÁ no preço do tipo de acesso — é o que pedido_itens guarda. */
  precoRolo?: number | null;
}

export const MAX_ITENS = 40;
/** Teto de peças por item (por tamanho) num pedido — decisão de 17/10/2026. */
export const MAX_UN = 10;

// Mora em dinheiro.ts desde que as seleções passaram a precisar da mesma régua.
export { r2 };

/** Sanitiza a lista vinda do cliente. Devolve [] se nada prestar. */
export function normalizarItens(bruto: unknown): ItemPedido[] {
  const lista = Array.isArray(bruto) ? (bruto as unknown[]) : [];
  return lista
    .map((x) => x as Partial<ItemPedido>)
    .filter(
      (x) =>
        typeof x.slug === 'string' &&
        typeof x.qtd === 'number' &&
        x.qtd > 0 &&
        (x.unidade === 'rolo' || x.unidade === 'metro' || x.unidade === 'un')
    )
    .map((x) => ({
      slug: String(x.slug).trim().toLowerCase(),
      // Peça é inteira (no mínimo 1); rolo e metro seguem como sempre.
      qtd:
        x.unidade === 'un'
          ? Math.min(Math.max(1, Math.round(Number(x.qtd))), MAX_UN)
          : Math.min(r2(Number(x.qtd)), x.unidade === 'rolo' ? 50 : 500),
      unidade: x.unidade as UnidadePedido,
      lpns: Array.isArray(x.lpns) ? (x.lpns as unknown[]).filter((l): l is string => typeof l === 'string').slice(0, 20) : [],
    }))
    .slice(0, MAX_ITENS);
}

export async function carregarPerfil(site: Db, userId: string): Promise<{ perfil: Perfil | null; faltando: string[] }> {
  const { data } = await site
    .from('user_profiles')
    .select(
      'full_name, company_name, phone, email, cpf_cnpj, ie, indicado_por, address_street, address_number, address_complement, address_neighborhood, address_city, address_state, address_zip, asaas_customer_id, asaas_customer_env, cobranca_igual_entrega, cobranca_cep, cobranca_numero'
    )
    .eq('id', userId)
    .maybeSingle();
  const perfil = (data as Perfil | null) ?? null;
  // A lista mora em conta/completude.ts: o carrinho e o painel mostram o mesmo
  // checklist antes de o usuário chegar no pagamento.
  return { perfil, faltando: faltandoNoCadastro(perfil) };
}

/**
 * slug → produto → SKU físico → preço de tabela. Itens sem tudo isso voltam em `invalidos`.
 *
 * `admin`: a prévia antes do lançamento — só o admin precifica produto com
 * `publicar_em` no futuro — e compra pela base (atacado), sem percentual.
 * `papel`: o tipo de acesso de quem compra; decide o percentual
 * (precos/regraAcesso.ts — a MESMA função da vitrine). Sem papel = cliente final.
 */
export async function precificar(
  site: Db,
  itens: ItemPedido[],
  opts: { admin?: boolean; papel?: Papel } = {}
): Promise<{ linhas: Linha[]; invalidos: string[]; subtotal: number }> {
  const slugs = [...new Set(itens.map((i) => i.slug))];
  const { data: produtosData } = await site
    .from('produtos')
    // `*` e não a lista: `publicar_em` nasceu em 17/10/2026 e nomear coluna que
    // ainda não existe derruba a consulta inteira (mesma nota de prazo.ts).
    .select('*')
    .in('slug', slugs);
  const produtos = (produtosData ?? []) as Produto[];
  const skus = [...new Set(produtos.map((p) => p.erp_sku).filter((s): s is string => !!s))];
  const { data: espelhoData } = skus.length
    ? await site.from('erp_produtos').select('sku, nome, ativo, metragem_padrao, preco_rolo, preco_metro, preco_rolo_varejo, preco_metro_varejo, saldo_ml, unidade').in('sku', skus)
    : { data: [] };
  const espelho = new Map(((espelhoData ?? []) as unknown as Espelho[]).map((e) => [e.sku, e]));

  // Tipo de acesso: o mesmo percentual da vitrine. Admin compra pela base.
  const regras: Regras | null = opts.admin ? null : await carregarRegras(site);
  const papel: Papel = opts.papel ?? 'client';
  const positivo = (v: unknown): number | null => (Number(v) > 0 ? Number(v) : null);
  // `unidade` leva junto a visibilidade do tipo: linha oculta, "não compra
  // rolo fechado" ou "não compra fracionado" viram item inválido, igual à vitrine.
  const precoRoloDe = (p: Produto, e: Espelho): number | null =>
    regras ? precoParaAcesso(regras, papel, { atacado: positivo(e.preco_rolo), varejo: positivo(e.preco_rolo_varejo) }, p.linha_key, null, 'rolo', p.slug) : positivo(e.preco_rolo);
  const precoMetroDe = (p: Produto, e: Espelho, saida: number | null): number | null =>
    regras ? precoParaAcesso(regras, papel, { atacado: positivo(e.preco_metro), varejo: positivo(e.preco_metro_varejo) }, p.linha_key, saida, 'metro', p.slug) : (saida ?? positivo(e.preco_metro));

  // Promoção Moto: o metro das cores com pedaço sai pelo preço de saída — a
  // MESMA regra que o card mostra (/api/nz/precos). Só no fracionado.
  let promo: PromoMoto | null = null;
  if (itens.some((i) => i.unidade === 'metro')) {
    try {
      promo = await lerPromoMoto(site);
    } catch {
      promo = null;
    }
  }

  const linhas: Linha[] = [];
  const invalidos: string[] = [];
  for (const item of itens) {
    const p = produtos.find((x) => x.slug === item.slug);
    const e = p?.erp_sku ? espelho.get(p.erp_sku) : undefined;
    if (!p || !e || !e.ativo) {
      invalidos.push(item.slug);
      continue;
    }
    // Agendado (ex.: a coleção antes das 18h do lançamento): só a prévia do admin.
    if (!opts.admin && estaAgendado(p.publicar_em)) {
      invalidos.push(item.slug);
      continue;
    }
    // Peça × metro: a unidade do pedido tem de bater com a do ERP.
    const porPeca = vendePorUnidade(e.unidade);
    if (porPeca !== (item.unidade === 'un')) {
      invalidos.push(item.slug);
      continue;
    }
    const metragem = Number(e.metragem_padrao) || 0;
    if (item.unidade === 'un') {
      // O Tiny (NZERP, tinyService) converte UN dividindo a quantidade pela
      // metragem do SKU: com metragem diferente de 1 a quantidade sairia errada
      // na nota. As camisetas têm 1; o resto fica de fora até alguém olhar.
      const peca = precoRoloDe(p, e);
      if (peca == null || (e.metragem_padrao != null && Number(e.metragem_padrao) !== 1)) {
        invalidos.push(item.slug);
        continue;
      }
      const unitPrice = r2(peca);
      linhas.push({ produto: p, e, item, unitPrice, qtyMt: item.qtd, total: r2(unitPrice * item.qtd), precoRolo: unitPrice });
    } else if (item.unidade === 'rolo') {
      // `> 0`, nao `!= null`: preco zero e' cadastro incompleto do ERP e nao
      // pode virar linha de pedido. Mesma regra do /api/nz/precos.
      const rolo = precoRoloDe(p, e);
      if (rolo == null || metragem <= 0) {
        invalidos.push(item.slug);
        continue;
      }
      const unitPrice = r2(rolo / metragem);
      const qtyMt = r2(item.qtd * metragem);
      linhas.push({ produto: p, e, item, unitPrice, qtyMt, total: r2(unitPrice * qtyMt), precoRolo: rolo });
    } else {
      if (!(Number(e.preco_metro) > 0)) {
        invalidos.push(item.slug);
        continue;
      }
      const saida = promo ? precoMetroPromo(promo, e.sku, Number(e.preco_metro)) : null;
      const unitPrice = precoMetroDe(p, e, saida);
      if (unitPrice == null) {
        invalidos.push(item.slug);
        continue;
      }
      linhas.push({ produto: p, e, item, unitPrice, qtyMt: item.qtd, total: r2(unitPrice * item.qtd) });
    }
  }
  const subtotal = r2(linhas.reduce((s, l) => s + l.total, 0));
  return { linhas, invalidos, subtotal };
}

export interface CupomResolvido {
  codigo: string | null;
  desconto: number;
  afiliadoUserId: string | null;
  /** Só quando o cliente mandou um código e ele não serve. */
  invalido: boolean;
}

/** Valida o cupom e calcula o desconto. Ninguém usa o próprio cupom de afiliado. */
export async function resolverCupom(site: Db, codigoBruto: string, subtotal: number, userId: string): Promise<CupomResolvido> {
  const codigo = codigoBruto.trim().toUpperCase();
  if (!codigo) return { codigo: null, desconto: 0, afiliadoUserId: null, invalido: false };
  const { data: c } = await site
    .from('cupons')
    .select('codigo, tipo, desconto_pct, desconto_valor, afiliado_user_id, ativo, valido_de, valido_ate, limite_usos, usos')
    .eq('codigo', codigo)
    .maybeSingle();
  const cupom = c as {
    codigo: string;
    desconto_pct: number | null;
    desconto_valor: number | null;
    afiliado_user_id: string | null;
    ativo: boolean;
    valido_de: string | null;
    valido_ate: string | null;
    limite_usos: number | null;
    usos: number;
  } | null;
  const agora = Date.now();
  const ok =
    cupom &&
    cupom.ativo &&
    (!cupom.valido_de || Date.parse(cupom.valido_de) <= agora) &&
    (!cupom.valido_ate || Date.parse(cupom.valido_ate) >= agora) &&
    (cupom.limite_usos == null || cupom.usos < cupom.limite_usos) &&
    cupom.afiliado_user_id !== userId;
  if (!ok) return { codigo: null, desconto: 0, afiliadoUserId: null, invalido: true };
  let desconto = 0;
  if (cupom.desconto_pct) desconto = r2(subtotal * (Number(cupom.desconto_pct) / 100));
  else if (cupom.desconto_valor) desconto = Math.min(subtotal, Number(cupom.desconto_valor));
  return { codigo: cupom.codigo, desconto, afiliadoUserId: cupom.afiliado_user_id, invalido: false };
}

/** cupom (já tratado) > indicado_por no cadastro > último clique do visitante. */
export async function resolverAfiliado(site: Db, userId: string, indicadoPor: string | null, visitante: string): Promise<string | null> {
  const valido = async (id: string | null): Promise<string | null> => {
    if (!id || id === userId) return null;
    const { data } = await site.from('afiliados').select('user_id, ativo').eq('user_id', id).maybeSingle();
    const a = data as { user_id: string; ativo: boolean } | null;
    return a && a.ativo ? a.user_id : null;
  };
  const porCadastro = await valido(indicadoPor);
  if (porCadastro) return porCadastro;

  if (visitante) {
    const { data: cfg } = await site.from('loja_config').select('dias_atribuicao').eq('id', 1).maybeSingle();
    const dias = Number((cfg as { dias_atribuicao?: number } | null)?.dias_atribuicao ?? 30);
    const { data } = await site.from('atribuicoes').select('afiliado_user_id, ultimo_clique_em').eq('visitante_id', visitante).maybeSingle();
    const at = data as { afiliado_user_id: string; ultimo_clique_em: string } | null;
    if (at && Date.now() - Date.parse(at.ultimo_clique_em) <= dias * 86400000) {
      return valido(at.afiliado_user_id);
    }
  }
  return null;
}

export async function codigoDoAfiliado(site: Db, afiliadoUserId: string | null): Promise<string | null> {
  if (!afiliadoUserId) return null;
  const { data } = await site.from('afiliados').select('codigo').eq('user_id', afiliadoUserId).maybeSingle();
  return (data as { codigo?: string } | null)?.codigo ?? null;
}

export function enderecoJson(perfil: Perfil) {
  return {
    rua: perfil.address_street,
    numero: perfil.address_number,
    complemento: perfil.address_complement,
    bairro: perfil.address_neighborhood,
    cidade: perfil.address_city,
    uf: perfil.address_state,
    cep: perfil.address_zip,
  };
}

export function enderecoCompleto(perfil: Perfil): string {
  return [
    `${perfil.address_street}, ${perfil.address_number ?? 's/n'}${perfil.address_complement ? ` - ${perfil.address_complement}` : ''}`,
    perfil.address_neighborhood,
    `${perfil.address_city}/${perfil.address_state}`,
    `CEP ${perfil.address_zip}`,
  ]
    .filter(Boolean)
    .join(' · ');
}

export interface FreteErp {
  tipo: 'CIF' | 'FOB' | 'RETIRADA';
  valor: number;
  transportadora?: string | null;
  prazoDias?: number | null;
}

/** Corpo da RPC site_criar_pedido, igual para os dois caminhos. */
export function montarPayloadErp(args: {
  pedidoId: string;
  /** Dono da conta no site — o ERP grava em clients.site_user_id. */
  siteUserId?: string | null;
  perfil: Perfil;
  linhas: Linha[];
  total: number;
  notas: string;
  cupom: string | null;
  afiliadoCodigo: string | null;
  frete: FreteErp;
}) {
  const { perfil, linhas } = args;
  return {
    site_pedido_id: args.pedidoId,
    site_user_id: args.siteUserId ?? null,
    nome: perfil.full_name,
    empresa: perfil.company_name ?? '',
    cpf_cnpj: perfil.cpf_cnpj,
    ie: perfil.ie ?? '',
    email: perfil.email ?? '',
    telefone: perfil.phone,
    endereco: perfil.address_street,
    numero: perfil.address_number ?? '',
    complemento: perfil.address_complement ?? '',
    bairro: perfil.address_neighborhood ?? '',
    cidade: perfil.address_city,
    uf: perfil.address_state,
    cep: perfil.address_zip,
    endereco_completo: enderecoCompleto(perfil),
    items: linhas.map((l) => ({
      sku: l.e.sku,
      name: `${l.e.nome ?? l.produto.nome}${l.item.unidade === 'rolo' ? ` (${l.item.qtd} rolo${l.item.qtd > 1 ? 's' : ''} fechado${l.item.qtd > 1 ? 's' : ''})` : ''}`,
      qty: l.qtyMt,
      // Peça vai como UN (o nome do ERP já traz o tamanho); o resto, metro linear.
      unit: l.item.unidade === 'un' ? 'UN' : 'MT',
      unitPrice: l.unitPrice,
      total: l.total,
      availabilityTag: Number(l.e.saldo_ml) > 0.01 ? 'ESTOQUE' : 'DROP',
    })),
    total: args.total,
    shipping_type: args.frete.tipo === 'RETIRADA' ? 'FOB' : args.frete.tipo,
    shipping_cost: args.frete.valor,
    notes: args.notas,
    cupom: args.cupom ?? '',
    afiliado_codigo: args.afiliadoCodigo ?? '',
  };
}

/**
 * Peça vendida sem estoque (pré-venda da coleção): a expedição precisa saber
 * que o item ainda vai ser produzido, e quantos dias de produção o prazo
 * prometido ao cliente já inclui (perfil de embalagem, Admin → Logística).
 * Vai nas notas do orçamento no NZERP.
 */
export function notaPreVenda(linhas: Linha[], diasProducao = 0): string | null {
  const semEstoque = linhas.filter((l) => l.item.unidade === 'un' && !(Number(l.e.saldo_ml) > 0.01));
  if (!semEstoque.length) return null;
  const itens = semEstoque.map((l) => `${l.e.sku} ×${l.item.qtd}`).join(', ');
  const producao = diasProducao > 0 ? ` O prazo informado ao cliente inclui ${diasProducao} dias úteis de produção.` : '';
  return `PRÉ-VENDA (sem estoque na compra): ${itens}.${producao}`;
}

/** Linhas de pedido_itens a partir das linhas precificadas. */
export function itensParaGravar(pedidoId: string, linhas: Linha[]) {
  return linhas.map((l) => ({
    pedido_id: pedidoId,
    produto_id: l.produto.id,
    erp_sku: l.e.sku,
    qtd: l.item.qtd,
    unidade: l.item.unidade,
    // O preço DO TIPO DE ACESSO (o que foi cobrado), não o atacado cru.
    preco_unit_estimado: l.item.unidade === 'rolo' ? (l.precoRolo ?? Number(l.e.preco_rolo)) : l.unitPrice,
    lpns_solicitados: l.item.lpns ?? [],
  }));
}

export function safeJson(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
