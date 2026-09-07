// Avaliação de produto, pontos e cashback — as regras, sem HTTP.
//
// Três coisas que este módulo existe para garantir:
//
//   1. **Só avalia quem comprou.** A elegibilidade sai da compra, dos dois
//      lados: `pedidos` do site e `quotes` do NZERP (que é de onde vem a maior
//      parte — 253 clientes compraram lá contra 3 aqui). Quem não comprou não
//      recebe nem o formulário.
//
//   2. **O ponto NÃO olha a nota.** Pagar por nota alta é o que transforma um
//      programa de incentivo legal em publicidade enganosa. `pontosDaAvaliacao`
//      recebe a avaliação inteira e não lê `nota` — de propósito, e há teste
//      que reprova se ler.
//
//   3. **O saldo é a soma da razão.** Nunca uma coluna de saldo: coluna diverge
//      no primeiro erro e ninguém descobre de onde veio.

import type { Db } from '../papel.js';
import { pedidosDoCliente } from '../conta/erpHistorico.js';

// ------------------------------------------------------------ regras de ponto
/**
 * Quanto vale uma avaliação aprovada.
 *
 * O que ganha ponto é ESFORÇO (foto, texto que ajuda quem vai comprar), nunca
 * elogio. Uma avaliação de 1 estrela com foto e texto longo paga exatamente o
 * mesmo que uma de 5 estrelas igual.
 */
export const PONTOS = {
  /** Por avaliação aprovada, qualquer que seja a nota. */
  base: 40,
  /** Mandou foto da aplicação. */
  foto: 30,
  /** Texto que realmente descreve o uso. */
  textoLongo: 20,
  /** A partir de quantos caracteres o texto conta como longo. */
  minimoTextoLongo: 240,
} as const;

export interface AvaliacaoParaPontos {
  texto: string;
  foto_url?: string | null;
}

/**
 * Pontos de uma avaliação aprovada.
 *
 * NÃO recebe a nota, e isso é intencional: se um dia alguém quiser condicionar
 * o prêmio ao elogio, vai ter que mudar a assinatura desta função — e aí é uma
 * decisão consciente, não um deslize.
 */
export function pontosDaAvaliacao(a: AvaliacaoParaPontos): number {
  let p = PONTOS.base;
  if (a.foto_url) p += PONTOS.foto;
  if ((a.texto ?? '').trim().length >= PONTOS.minimoTextoLongo) p += PONTOS.textoLongo;
  return p;
}

// ------------------------------------------------------------------- saldo
export async function saldoDePontos(site: Db, userId: string): Promise<number> {
  const { data } = await site.from('pontos_movimentos').select('pontos').eq('user_id', userId).limit(1000);
  return ((data ?? []) as { pontos: number }[]).reduce((t, m) => t + Number(m.pontos), 0);
}

export interface Movimento {
  id: number;
  pontos: number;
  motivo: string;
  descricao: string | null;
  criado_em: string;
}

export async function extratoDePontos(site: Db, userId: string, limite = 60): Promise<Movimento[]> {
  const { data } = await site
    .from('pontos_movimentos')
    .select('id, pontos, motivo, descricao, criado_em')
    .eq('user_id', userId)
    .order('criado_em', { ascending: false })
    .limit(limite);
  return (data ?? []) as Movimento[];
}

// ------------------------------------------------------------ elegibilidade
export interface ProdutoAvaliavel {
  slug: string;
  nome: string;
  imagem: string | null;
  origem: 'site' | 'nzerp';
  pedidoId: string | null;
  erpQuoteId: string | null;
  quando: string | null;
  pontos: number;
}

/** Só compra que virou dinheiro dá direito de avaliar. */
const STATUS_ERP_COMPRADO = new Set(['ENTREGUE', 'ENVIADO', 'APROVADO', 'FATURADO', 'FATURADO_PARCIAL', 'PREPARANDO_ENVIO', 'PRONTO_ENVIO']);

/**
 * O que este usuário comprou e ainda não avaliou.
 *
 * Junta os dois lados e tira o que já foi avaliado. Devolve o slug do produto
 * no site, porque é ele que a avaliação referencia — SKU do ERP é traduzido
 * por `produtos.erp_sku`.
 */
export async function produtosQuePodeAvaliar(site: Db, userId: string): Promise<ProdutoAvaliavel[]> {
  const achados = new Map<string, ProdutoAvaliavel>();

  // ------------------------------------------------------- compras no site
  const { data: pedidosData } = await site
    .from('pedidos')
    .select('id, criado_em, status, pagamento_status')
    .eq('user_id', userId)
    .eq('pagamento_status', 'pago')
    .neq('status', 'CANCELADO')
    .order('criado_em', { ascending: false })
    .limit(200);
  const pedidos = (pedidosData ?? []) as { id: string; criado_em: string }[];

  if (pedidos.length) {
    const { data: itensData } = await site
      .from('pedido_itens')
      .select('pedido_id, produto_id, erp_sku')
      .in('pedido_id', pedidos.map((p) => p.id))
      .limit(1000);
    const itens = (itensData ?? []) as { pedido_id: string; produto_id: string | null; erp_sku: string | null }[];
    const ids = [...new Set(itens.map((i) => i.produto_id).filter(Boolean))] as string[];
    const { data: prods } = ids.length
      ? await site.from('produtos').select('id, slug, nome, imagem').in('id', ids)
      : { data: [] };
    const porId = new Map(((prods ?? []) as { id: string; slug: string; nome: string; imagem: string | null }[]).map((p) => [p.id, p]));
    const quandoDoPedido = new Map(pedidos.map((p) => [p.id, p.criado_em]));

    for (const it of itens) {
      const prod = it.produto_id ? porId.get(it.produto_id) : undefined;
      if (!prod || achados.has(prod.slug)) continue;
      achados.set(prod.slug, {
        slug: prod.slug,
        nome: prod.nome,
        imagem: prod.imagem,
        origem: 'site',
        pedidoId: it.pedido_id,
        erpQuoteId: null,
        quando: quandoDoPedido.get(it.pedido_id) ?? null,
        pontos: PONTOS.base,
      });
    }
  }

  // -------------------------------------------------------- compras no ERP
  // É de onde vem quase tudo: o site é novo, o balcão não.
  const doErp = await pedidosDoCliente(site, userId, 100).catch(() => []);
  const skus = [...new Set(doErp.flatMap((p) => (STATUS_ERP_COMPRADO.has(p.status) ? p.itens.map((i) => i.sku) : [])).filter(Boolean))] as string[];
  if (skus.length) {
    const { data: prods } = await site.from('produtos').select('slug, nome, imagem, erp_sku').in('erp_sku', skus).eq('publicado', true).limit(500);
    const porSku = new Map(((prods ?? []) as { slug: string; nome: string; imagem: string | null; erp_sku: string }[]).map((p) => [p.erp_sku, p]));
    for (const pedido of doErp) {
      if (!STATUS_ERP_COMPRADO.has(pedido.status)) continue;
      for (const item of pedido.itens) {
        const prod = item.sku ? porSku.get(item.sku) : undefined;
        if (!prod || achados.has(prod.slug)) continue;
        achados.set(prod.slug, {
          slug: prod.slug,
          nome: prod.nome,
          imagem: prod.imagem,
          origem: 'nzerp',
          pedidoId: null,
          erpQuoteId: pedido.quoteId,
          quando: pedido.criadoEm,
          pontos: PONTOS.base,
        });
      }
    }
  }

  // ------------------------------------------------ tira o que já avaliou
  const { data: jaData } = await site.from('avaliacoes').select('produto_slug').eq('user_id', userId).limit(1000);
  for (const j of (jaData ?? []) as { produto_slug: string }[]) achados.delete(j.produto_slug);

  return [...achados.values()].sort((a, b) => String(b.quando ?? '').localeCompare(String(a.quando ?? '')));
}

/** Esta pessoa comprou ESTE produto? É a trava do envio. */
export async function podeAvaliar(site: Db, userId: string, slug: string): Promise<ProdutoAvaliavel | null> {
  return (await produtosQuePodeAvaliar(site, userId)).find((p) => p.slug === slug) ?? null;
}

// ------------------------------------------------------- crédito de pontos
/**
 * Credita os pontos de uma avaliação aprovada. Idempotente: o índice único em
 * `(referencia) where motivo='avaliacao'` garante que reaprovar não paga duas
 * vezes, mesmo se dois admins clicarem juntos.
 */
export async function creditarPontosDaAvaliacao(
  site: Db,
  avaliacao: { id: string; user_id: string; texto: string; foto_url: string | null; produto_slug: string }
): Promise<number> {
  const pontos = pontosDaAvaliacao(avaliacao);
  const { error } = await site.from('pontos_movimentos').insert({
    user_id: avaliacao.user_id,
    pontos,
    motivo: 'avaliacao',
    referencia: avaliacao.id,
    descricao: `Avaliação de ${avaliacao.produto_slug}`,
  });
  // 23505 = já creditado. Não é erro: é a trava fazendo o trabalho dela.
  if (error && !String(error.code) .includes('23505')) throw new Error(`creditar pontos: ${error.message}`);
  return error ? 0 : pontos;
}

// ---------------------------------------------------------------- resgate
export interface Campanha {
  id: string;
  nome: string;
  descricao: string | null;
  pontos: number;
  valor: number;
  validade_dias: number;
  limite_por_usuario: number | null;
  limite_total: number | null;
  resgatados: number;
}

export async function campanhasAtivas(site: Db): Promise<Campanha[]> {
  const hoje = new Date().toISOString().slice(0, 10);
  const { data } = await site
    .from('campanhas_cashback')
    .select('id, nome, descricao, pontos, valor, validade_dias, limite_por_usuario, limite_total, resgatados, inicio, fim')
    .eq('ativo', true)
    .order('pontos', { ascending: true })
    .limit(50);
  // A janela é filtrada aqui e não no PostgREST porque `inicio`/`fim` podem ser
  // nulos e a combinação de `or` com nulo fica ilegível.
  return ((data ?? []) as (Campanha & { inicio: string | null; fim: string | null })[])
    .filter((c) => (!c.inicio || c.inicio <= hoje) && (!c.fim || c.fim >= hoje))
    .map((c) => ({
      id: c.id,
      nome: c.nome,
      descricao: c.descricao,
      pontos: Number(c.pontos),
      valor: Number(c.valor),
      validade_dias: Number(c.validade_dias),
      limite_por_usuario: c.limite_por_usuario,
      limite_total: c.limite_total,
      resgatados: Number(c.resgatados),
    }));
}

export type FalhaResgate = 'campanha-inativa' | 'pontos-insuficientes' | 'limite-do-usuario' | 'limite-da-campanha' | 'erro';

export interface ResgateFeito {
  ok: true;
  cupom: string;
  valor: number;
  pontos: number;
  validoAte: string;
  saldo: number;
}

/** Código curto, legível e sem caracteres que se confundem (0/O, 1/I). */
function codigoDeCupom(): string {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 8; i++) s += letras[Math.floor(Math.random() * letras.length)];
  return `NZ${s}`;
}

/**
 * Troca pontos por crédito.
 *
 * O crédito sai como **cupom de valor nominal ao cliente** (`cupons.dono_user_id`),
 * não como dinheiro na conta: a chave do Asaas foi guardada de propósito SEM
 * permissão de saque, então transferência não é possível — nem deveria ser
 * disparada por clique de cliente. Ver docs/PLANO_PROVA_SOCIAL.md.
 */
export async function resgatar(site: Db, userId: string, campanhaId: string): Promise<ResgateFeito | { ok: false; motivo: FalhaResgate; message?: string }> {
  const campanha = (await campanhasAtivas(site)).find((c) => c.id === campanhaId);
  if (!campanha) return { ok: false, motivo: 'campanha-inativa' };

  if (campanha.limite_total != null && campanha.resgatados >= campanha.limite_total) {
    return { ok: false, motivo: 'limite-da-campanha' };
  }

  if (campanha.limite_por_usuario != null) {
    const { count } = await site
      .from('resgates')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('campanha_id', campanhaId);
    if (Number(count ?? 0) >= campanha.limite_por_usuario) return { ok: false, motivo: 'limite-do-usuario' };
  }

  const saldo = await saldoDePontos(site, userId);
  if (saldo < campanha.pontos) return { ok: false, motivo: 'pontos-insuficientes' };

  // O débito vem ANTES do cupom. Se o cupom falhar, estorna — o contrário
  // deixaria crédito no mundo sem ninguém ter pago por ele.
  const { data: debito, error: erroDebito } = await site
    .from('pontos_movimentos')
    .insert({ user_id: userId, pontos: -campanha.pontos, motivo: 'resgate', referencia: campanhaId, descricao: `Resgate: ${campanha.nome}` })
    .select('id')
    .single();
  if (erroDebito) return { ok: false, motivo: 'erro', message: erroDebito.message };

  const desfazer = async (msg: string) => {
    await site.from('pontos_movimentos').insert({
      user_id: userId,
      pontos: campanha.pontos,
      motivo: 'estorno',
      referencia: String((debito as { id: number }).id),
      descricao: `Estorno: ${campanha.nome}`,
    });
    return { ok: false as const, motivo: 'erro' as const, message: msg };
  };

  const validoAte = new Date(Date.now() + campanha.validade_dias * 86400_000).toISOString().slice(0, 10);
  let codigo = '';
  let erroCupom: string | null = null;
  // Colisão de código é improvável (32^8) mas não impossível; três tentativas.
  for (let i = 0; i < 3; i++) {
    codigo = codigoDeCupom();
    const { error } = await site.from('cupons').insert({
      codigo,
      tipo: 'cashback',
      desconto_valor: campanha.valor,
      dono_user_id: userId,
      valido_ate: validoAte,
      limite_usos: 1,
      ativo: true,
    });
    if (!error) {
      erroCupom = null;
      break;
    }
    erroCupom = error.message;
    if (!String(error.code).includes('23505')) break;
  }
  if (erroCupom) return desfazer(`cupom: ${erroCupom}`);

  const { error: erroResgate } = await site.from('resgates').insert({
    user_id: userId,
    campanha_id: campanhaId,
    pontos: campanha.pontos,
    valor: campanha.valor,
    cupom_codigo: codigo,
  });
  if (erroResgate) return desfazer(`resgate: ${erroResgate.message}`);

  await site.from('campanhas_cashback').update({ resgatados: campanha.resgatados + 1 }).eq('id', campanhaId);

  return { ok: true, cupom: codigo, valor: Number(campanha.valor), pontos: campanha.pontos, validoAte, saldo: saldo - campanha.pontos };
}
