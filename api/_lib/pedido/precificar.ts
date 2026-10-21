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
  opts: { admin?: boolean; papel?: Papel; faixaId?: number | null } = {}
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
  // A faixa de preço da pessoa (Gold, Platinum, individual…): a mesma da vitrine.
  const faixaId = opts.faixaId ?? null;
  const positivo = (v: unknown): number | null => (Number(v) > 0 ? Number(v) : null);
  // `unidade` leva junto a visibilidade do tipo: linha oculta, "não compra
  // rolo fechado" ou "não compra fracionado" viram item inválido, igual à vitrine.
  const precoRoloDe = (p: Produto, e: Espelho): number | null =>
    regras ? precoParaAcesso(regras, papel, { atacado: positivo(e.preco_rolo), varejo: positivo(e.preco_rolo_varejo) }, p.linha_key, null, 'rolo', p.slug, faixaId) : positivo(e.preco_rolo);
  const precoMetroDe = (p: Produto, e: Espelho, saida: number | null): number | null =>
    regras ? precoParaAcesso(regras, papel, { atacado: positivo(e.preco_metro), varejo: positivo(e.preco_metro_varejo) }, p.linha_key, saida, 'metro', p.slug, faixaId) : (saida ?? positivo(e.preco_metro));

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
  /** afiliado | campanha | super | nominal — quem chama decide o que fazer (ex.: filiar). */
  tipo?: string | null;
  /** Por que não serviu (para a tela explicar). */
  motivo?: string | null;
}

export interface CupomRow {
  codigo: string;
  tipo: string;
  desconto_pct: number | null;
  desconto_valor: number | null;
  afiliado_user_id: string | null;
  dono_user_id: string | null;
  ativo: boolean;
  valido_de: string | null;
  valido_ate: string | null;
  limite_usos: number | null;
  usos: number;
  so_conta_nova: boolean | null;
  usos_por_cliente: number | null;
}

export const COLUNAS_CUPOM = 'codigo, tipo, desconto_pct, desconto_valor, afiliado_user_id, dono_user_id, ativo, valido_de, valido_ate, limite_usos, usos, so_conta_nova, usos_por_cliente';

/**
 * Por que este cupom NÃO vale para esta pessoa (nulo = vale). A mesma régua do
 * checkout, do orçamento e do "conferir código" (op validar):
 *   · inativo, fora do prazo, esgotado (usos + reservas);
 *   · nominal: só o dono; afiliado e super: nunca o próprio dono;
 *   · "só conta nova": quem já tem compra paga/faturada não usa;
 *   · limite por cliente (super cupom = 1 compra por indicado).
 * `userId` nulo = ninguém logado: as regras pessoais ficam como "nominal"/"login".
 */
export async function motivoCupomInvalido(site: Db, cupom: CupomRow | null, userId: string | null): Promise<string | null> {
  if (!cupom || !cupom.ativo) return 'inexistente';
  const agora = Date.now();
  if (cupom.valido_de && Date.parse(cupom.valido_de) > agora) return 'ainda-nao-vale';
  if (cupom.valido_ate && Date.parse(cupom.valido_ate) < agora) return 'expirado';
  if (cupom.limite_usos != null && Number(cupom.usos) + (await usosReservados(site, cupom.codigo)) >= cupom.limite_usos) return 'esgotado';
  if (cupom.tipo === 'nominal' || (cupom.tipo === 'campanha' && cupom.dono_user_id)) {
    if (!userId) return 'login';
    if (cupom.dono_user_id !== userId) return 'nominal';
  }
  if (cupom.tipo === 'super' && userId && cupom.dono_user_id === userId) return 'proprio';
  if (cupom.tipo === 'afiliado') {
    if (userId && cupom.afiliado_user_id === userId) return 'proprio';
    // Afiliado ainda pendente, suspenso ou desligado: o cupom dele não entra
    // (achado do teste de 21/10/2026 — o motor só paga afiliado aprovado e ativo,
    // então aceitar o cupom antes filiaria o cliente a quem não recebe nada).
    const { data: a } = await site.from('afiliados').select('status, ativo').eq('user_id', cupom.afiliado_user_id ?? '').maybeSingle();
    const af = a as { status?: string; ativo?: boolean } | null;
    if (!af || af.status !== 'aprovado' || af.ativo === false) return 'afiliado-inativo';
  }
  if (userId && cupom.so_conta_nova) {
    const { jaComprou } = await import('../incentivos/cupomUsos.js');
    if (await jaComprou(site, userId)) return 'so-conta-nova';
  }
  if (userId && cupom.usos_por_cliente != null) {
    const { usosDoCliente, reservasDoCliente } = await import('../incentivos/cupomUsos.js');
    const [u, r] = await Promise.all([usosDoCliente(site, cupom.codigo, userId), reservasDoCliente(site, cupom.codigo, userId)]);
    if (u + r >= cupom.usos_por_cliente) return 'ja-usou';
  }
  return null;
}

/** Desconto (%) de um cupom de afiliado: o do afiliado, senão o da configuração (D27). */
export async function descontoDoAfiliado(site: Db, afiliadoUserId: string | null): Promise<number> {
  if (!afiliadoUserId) return 0;
  const { data: a } = await site.from('afiliados').select('desconto_cupom_pct').eq('user_id', afiliadoUserId).maybeSingle();
  const proprio = (a as { desconto_cupom_pct?: number | null } | null)?.desconto_cupom_pct;
  if (proprio != null) return Number(proprio);
  const { data: c } = await site.from('loja_config').select('desconto_cupom_afiliado_pct').eq('id', 1).maybeSingle();
  return Number((c as { desconto_cupom_afiliado_pct?: number | null } | null)?.desconto_cupom_afiliado_pct ?? 0);
}

/** Desconto (%) do super cupom: o do cupom, senão o da configuração. */
export async function descontoDoSuper(site: Db, cupom: CupomRow): Promise<number> {
  if (cupom.desconto_pct != null) return Number(cupom.desconto_pct);
  const { data: c } = await site.from('loja_config').select('pct_desconto_indicado, super_cupom_ativo').eq('id', 1).maybeSingle();
  const cfg = c as { pct_desconto_indicado?: number | null; super_cupom_ativo?: boolean } | null;
  if (cfg?.super_cupom_ativo === false) return 0;
  return Number(cfg?.pct_desconto_indicado ?? 5);
}

/**
 * Pedidos que já "seguram" um uso do cupom sem tê-lo consumido: checkout com
 * cobrança em aberto e orçamento esperando o ERP faturar. Contam contra o
 * limite de usos (reserva), para o cupom não passar do limite enquanto esses
 * pedidos não se resolvem. Cancelado, recusado, expirado, vencido, estornado
 * ou já consumido não contam. (B5 do plano de indicação, 21/10/2026.)
 */
export async function usosReservados(site: Db, codigo: string): Promise<number> {
  const { count } = await site
    .from('pedidos')
    .select('id', { count: 'exact', head: true })
    .eq('cupom', codigo)
    .is('cupom_consumido_em', null)
    .neq('status', 'CANCELADO')
    .or('pagamento_status.is.null,pagamento_status.not.in.(recusado,expirado,vencido,estornado,cancelado)');
  return Number(count ?? 0);
}

/**
 * Valida o cupom e calcula o desconto. Ninguém usa o próprio cupom de afiliado;
 * cupom com dono (`dono_user_id`, nominal) só vale para o dono (B3). O limite
 * de usos conta os consumidos (`usos`) mais os reservados por pedidos em
 * aberto (B5).
 */
export async function resolverCupom(site: Db, codigoBruto: string, subtotal: number, userId: string): Promise<CupomResolvido> {
  const codigo = codigoBruto.trim().toUpperCase();
  if (!codigo) return { codigo: null, desconto: 0, afiliadoUserId: null, invalido: false };
  const { data: c } = await site.from('cupons').select(COLUNAS_CUPOM).eq('codigo', codigo).maybeSingle();
  const cupom = (c as CupomRow | null) ?? null;
  const motivo = await motivoCupomInvalido(site, cupom, userId);
  if (motivo || !cupom) return { codigo: null, desconto: 0, afiliadoUserId: null, invalido: true, motivo: motivo ?? 'inexistente' };
  let desconto = 0;
  if (cupom.tipo === 'super') {
    desconto = r2(subtotal * ((await descontoDoSuper(site, cupom)) / 100));
  } else if (cupom.tipo === 'afiliado' && cupom.desconto_pct == null && cupom.desconto_valor == null) {
    desconto = r2(subtotal * ((await descontoDoAfiliado(site, cupom.afiliado_user_id)) / 100));
  } else if (cupom.desconto_pct) desconto = r2(subtotal * (Number(cupom.desconto_pct) / 100));
  else if (cupom.desconto_valor) desconto = Math.min(subtotal, Number(cupom.desconto_valor));
  // Super cupom e nominal não atribuem afiliado: o super cupom paga o dono
  // (cashback, no faturamento) e o nominal é só desconto.
  return { codigo: cupom.codigo, desconto, afiliadoUserId: cupom.tipo === 'afiliado' ? cupom.afiliado_user_id : null, invalido: false, tipo: cupom.tipo };
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

/**
 * Rateia o desconto do cupom pelos itens, proporcional ao total de cada linha,
 * em centavos. A soma fecha EXATAMENTE no desconto: o resto do arredondamento
 * vai para a última linha que ainda comporta. Nenhuma linha fica negativa.
 *
 * É o que o NZERP grava em `quotes.items[].desconto` e leva para a NF-e como
 * `vDesc` por item (B7 do plano de indicação, 21/10/2026). Sem desconto, a
 * lista volta toda em zero e o payload sai igual ao de sempre.
 */
export function ratearDesconto(totais: number[], desconto: number): number[] {
  const d = Math.max(0, r2(Number(desconto) || 0));
  const base = totais.map((t) => Math.max(0, Number(t) || 0));
  const soma = r2(base.reduce((s, t) => s + t, 0));
  if (d <= 0 || soma <= 0) return base.map(() => 0);
  const alvo = Math.min(d, soma);
  const cents = Math.round(alvo * 100);
  // Parte proporcional, truncada para baixo em centavos.
  const partes = base.map((t) => Math.floor((cents * t) / soma));
  let resto = cents - partes.reduce((s, p) => s + p, 0);
  // O que sobrou (sempre < nº de linhas) vai da última para a primeira,
  // um centavo por vez, só em linha que ainda tem espaço.
  for (let i = base.length - 1; resto > 0 && i >= 0; i--) {
    const cabe = Math.round(base[i] * 100) - partes[i];
    if (cabe <= 0) continue;
    const leva = Math.min(cabe, resto);
    partes[i] += leva;
    resto -= leva;
  }
  return partes.map((p) => p / 100);
}

/** Corpo da RPC site_criar_pedido, igual para os dois caminhos. */
export function montarPayloadErp(args: {
  pedidoId: string;
  /** Dono da conta no site — o ERP grava em clients.site_user_id. */
  siteUserId?: string | null;
  perfil: Perfil;
  linhas: Linha[];
  /** O que o cliente paga: itens − desconto + frete. */
  total: number;
  notas: string;
  cupom: string | null;
  afiliadoCodigo: string | null;
  frete: FreteErp;
  /** Desconto do cupom, em R$, sobre os itens (nunca sobre o frete). */
  desconto?: number;
  /** Nome da faixa de preço da pessoa (Gold, Platinum…) — o ERP espelha em clients.faixa_preco_site. */
  faixaNome?: string | null;
  /** Saldo da carteira usado no pedido (Fase 3). O ERP grava em quotes.cashback_usado. */
  cashbackUsado?: number;
}) {
  const { perfil, linhas } = args;
  const descontoTotal = r2(Math.max(0, Number(args.desconto) || 0));
  const descontos = ratearDesconto(
    linhas.map((l) => l.total),
    descontoTotal
  );
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
    items: linhas.map((l, i) => ({
      sku: l.e.sku,
      name: `${l.e.nome ?? l.produto.nome}${l.item.unidade === 'rolo' ? ` (${l.item.qtd} rolo${l.item.qtd > 1 ? 's' : ''} fechado${l.item.qtd > 1 ? 's' : ''})` : ''}`,
      qty: l.qtyMt,
      // Peça vai como UN (o nome do ERP já traz o tamanho); o resto, metro linear.
      unit: l.item.unidade === 'un' ? 'UN' : 'MT',
      unitPrice: l.unitPrice,
      // Preço cheio: o desconto vai à parte, por item, para a NF sair com vDesc.
      total: l.total,
      availabilityTag: Number(l.e.saldo_ml) > 0.01 ? 'ESTOQUE' : 'DROP',
      // Só quando há cupom — o pedido sem cupom sai igual ao de sempre.
      ...(descontos[i] > 0 ? { desconto: descontos[i] } : {}),
    })),
    total: args.total,
    shipping_type: args.frete.tipo === 'RETIRADA' ? 'FOB' : args.frete.tipo,
    shipping_cost: args.frete.valor,
    notes: args.notas,
    cupom: args.cupom ?? '',
    afiliado_codigo: args.afiliadoCodigo ?? '',
    // Total do desconto do cupom (a soma dos `items[].desconto`). O NZERP
    // (site_criar_pedido v3) grava em quotes.desconto_cupom e confere a soma.
    desconto_cupom: descontoTotal,
    // Faixa de preço (Fase 1): só o nome, para o consultor ver no CRM do ERP.
    faixa_site: args.faixaNome ?? '',
    // Saldo da carteira usado (Fase 3): o total continua sendo o do pedido; o
    // Asaas cobra total − cashback_usado. Só vai quando há (pedido sem saldo sai igual).
    ...(Number(args.cashbackUsado) > 0 ? { cashback_usado: r2(Number(args.cashbackUsado)) } : {}),
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
