// Precificação e montagem do pedido — compartilhado por /api/nz/pedido
// (orçamento sem pagamento) e /api/nz/checkout (pagamento online).
//
// Regra única: o cliente manda itens (slug, qtd, unidade); TODO valor sai daqui,
// do espelho do NZERP (erp_produtos). Nunca do corpo da requisição.
//
// Unidade no ERP: metro linear ('MT'). Rolo fechado = metragem_padrao metros ao
// preço de atacado por metro (preco_rolo ÷ metragem); fracionado = metros ao
// preco_metro. É a régua do simulador da tabela de preço do NZERP.

import type { Db } from '../papel.js';
import { faltandoNoCadastro } from '../conta/completude.js';

export interface ItemPedido {
  slug: string;
  qtd: number;
  unidade: 'rolo' | 'metro';
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
}

export interface Espelho {
  sku: string;
  nome: string | null;
  ativo: boolean;
  metragem_padrao: number | null;
  preco_rolo: number | null;
  preco_metro: number | null;
  saldo_ml: number;
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
}

export interface Linha {
  produto: Produto;
  e: Espelho;
  item: ItemPedido;
  /** R$ por metro linear (é o que vai ao ERP). */
  unitPrice: number;
  /** Metros lineares totais da linha. */
  qtyMt: number;
  total: number;
}

export const MAX_ITENS = 40;

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Sanitiza a lista vinda do cliente. Devolve [] se nada prestar. */
export function normalizarItens(bruto: unknown): ItemPedido[] {
  const lista = Array.isArray(bruto) ? (bruto as unknown[]) : [];
  return lista
    .map((x) => x as Partial<ItemPedido>)
    .filter((x) => typeof x.slug === 'string' && typeof x.qtd === 'number' && x.qtd > 0 && (x.unidade === 'rolo' || x.unidade === 'metro'))
    .map((x) => ({
      slug: String(x.slug).trim().toLowerCase(),
      qtd: Math.min(r2(Number(x.qtd)), x.unidade === 'rolo' ? 50 : 500),
      unidade: x.unidade as 'rolo' | 'metro',
      lpns: Array.isArray(x.lpns) ? (x.lpns as unknown[]).filter((l): l is string => typeof l === 'string').slice(0, 20) : [],
    }))
    .slice(0, MAX_ITENS);
}

export async function carregarPerfil(site: Db, userId: string): Promise<{ perfil: Perfil | null; faltando: string[] }> {
  const { data } = await site
    .from('user_profiles')
    .select(
      'full_name, company_name, phone, email, cpf_cnpj, ie, indicado_por, address_street, address_number, address_complement, address_neighborhood, address_city, address_state, address_zip, asaas_customer_id, asaas_customer_env'
    )
    .eq('id', userId)
    .maybeSingle();
  const perfil = (data as Perfil | null) ?? null;
  // A lista mora em conta/completude.ts: o carrinho e o painel mostram o mesmo
  // checklist antes de o usuário chegar no pagamento.
  return { perfil, faltando: faltandoNoCadastro(perfil) };
}

/** slug → produto → SKU físico → preço de tabela. Itens sem tudo isso voltam em `invalidos`. */
export async function precificar(site: Db, itens: ItemPedido[]): Promise<{ linhas: Linha[]; invalidos: string[]; subtotal: number }> {
  const slugs = [...new Set(itens.map((i) => i.slug))];
  const { data: produtosData } = await site
    .from('produtos')
    .select('id, slug, nome, codigo, erp_sku, tipo_vinculo, linha_key, shipping_profile_id')
    .in('slug', slugs);
  const produtos = (produtosData ?? []) as Produto[];
  const skus = [...new Set(produtos.map((p) => p.erp_sku).filter((s): s is string => !!s))];
  const { data: espelhoData } = skus.length
    ? await site.from('erp_produtos').select('sku, nome, ativo, metragem_padrao, preco_rolo, preco_metro, saldo_ml').in('sku', skus)
    : { data: [] };
  const espelho = new Map(((espelhoData ?? []) as unknown as Espelho[]).map((e) => [e.sku, e]));

  const linhas: Linha[] = [];
  const invalidos: string[] = [];
  for (const item of itens) {
    const p = produtos.find((x) => x.slug === item.slug);
    const e = p?.erp_sku ? espelho.get(p.erp_sku) : undefined;
    if (!p || !e || !e.ativo) {
      invalidos.push(item.slug);
      continue;
    }
    const metragem = Number(e.metragem_padrao) || 0;
    if (item.unidade === 'rolo') {
      if (e.preco_rolo == null || metragem <= 0) {
        invalidos.push(item.slug);
        continue;
      }
      const unitPrice = r2(Number(e.preco_rolo) / metragem);
      const qtyMt = r2(item.qtd * metragem);
      linhas.push({ produto: p, e, item, unitPrice, qtyMt, total: r2(unitPrice * qtyMt) });
    } else {
      if (e.preco_metro == null) {
        invalidos.push(item.slug);
        continue;
      }
      const unitPrice = Number(e.preco_metro);
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
      unit: 'MT',
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

/** Linhas de pedido_itens a partir das linhas precificadas. */
export function itensParaGravar(pedidoId: string, linhas: Linha[]) {
  return linhas.map((l) => ({
    pedido_id: pedidoId,
    produto_id: l.produto.id,
    erp_sku: l.e.sku,
    qtd: l.item.qtd,
    unidade: l.item.unidade,
    preco_unit_estimado: l.item.unidade === 'rolo' ? Number(l.e.preco_rolo) : l.unitPrice,
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
