// O único caminho por onde um pedido do site vira orçamento no NZERP.
//
// Duas regras mandam aqui, e as duas vieram do João:
//
//   1. **Só vai quando o pagamento é aprovado.** Antes o orçamento nascia junto
//      com a cobrança, então um Pix gerado e nunca pago virava orçamento igual.
//      Quem manda um pedido não pago é o admin, de propósito, pelo botão
//      "Enviar ao NZERP" (motivo `admin`).
//
//   2. **O NZERP é somente leitura para este projeto.** A trava contra
//      duplicidade não pode ser um índice único lá dentro; é o
//      compare-and-swap em `pedidos.erp_envio`, aqui embaixo. Quem não
//      conseguir mudar nenhuma linha desiste em silêncio — é outro processo
//      (webhook, cron ou a tela) fazendo o mesmo trabalho neste instante.
//
// A idempotência por `site_pedido_id` que já existe dentro de
// `site_criar_pedido` continua valendo: é a segunda rede, não a primeira.

import type { Db } from '../papel.js';

/** 5 min sem terminar = o processo morreu; o pedido volta para a fila. */
const PRAZO_ENVIANDO_MS = 5 * 60_000;

export type MotivoDespacho = 'pago' | 'admin';

export type EstadoDespacho =
  | 'enviado' // criou o orçamento agora
  | 'ja-enviado' // já tinha orçamento; nada a fazer (ou só confirmou o pagamento)
  | 'nao-pago' // a regra nova: sem pagamento aprovado não vai
  | 'sem-payload' // rascunho que nunca chegou a ser precificado
  | 'outro-processo' // a trava está com outro; ele termina
  | 'cancelado'
  | 'sem-erp' // ENV do ERP ausente (ambiente de teste)
  | 'erro';

export interface ResultadoDespacho {
  ok: boolean;
  estado: EstadoDespacho;
  quoteId?: string | null;
  quoteNumber?: number | null;
  pagamentoConfirmado?: boolean;
  message?: string;
}

interface PedidoDespacho {
  id: string;
  numero: number;
  user_id: string | null;
  status: string;
  erp_quote_id: string | null;
  erp_quote_number: number | null;
  erp_envio: string;
  erp_payload: Record<string, unknown> | null;
  pagamento_status: string;
  erp_pago_em: string | null;
  forma_pagamento: string | null;
  total_final: number | null;
  valor_frete: number;
  pago_em: string | null;
}

const CAMPOS =
  'id, numero, user_id, status, erp_quote_id, erp_quote_number, erp_envio, erp_payload, pagamento_status, erp_pago_em, forma_pagamento, total_final, valor_frete, pago_em';

/**
 * Guarda no perfil qual cliente do ERP corresponde a esta conta. O índice único
 * de `user_profiles.erp_client_id` pode recusar (dois logins disputando o mesmo
 * cliente) — nesse caso o pedido segue e o conflito vira trabalho de admin.
 */
async function guardarClienteErp(site: Db, userId: string | null, clientId: string | null | undefined): Promise<void> {
  if (!userId || !clientId) return;
  const { error } = await site.from('user_profiles').update({ erp_client_id: clientId }).eq('id', userId).is('erp_client_id', null);
  if (error) console.warn('[erp] vínculo não gravado (cliente já ligado a outra conta?):', error.message);
}

/** Cliente do ERP com service role, ou `null` se o ambiente não tem as chaves. */
export async function clienteErp() {
  const url = process.env.ERP_SUPABASE_URL;
  const key = process.env.ERP_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(url, key);
}

/**
 * Pega a trava do pedido. Devolve `true` só para quem conseguiu — é este quem
 * pode falar com o ERP. É um UPDATE condicional, uma instrução só: dois
 * processos simultâneos, um ganha.
 */
async function pegarTrava(site: Db, pedidoId: string): Promise<boolean> {
  const agora = new Date();
  const limite = new Date(agora.getTime() - PRAZO_ENVIANDO_MS).toISOString();
  const { data } = await site
    .from('pedidos')
    .update({ erp_envio: 'enviando', erp_envio_em: agora.toISOString() })
    .eq('id', pedidoId)
    .or(`erp_envio.eq.pendente,and(erp_envio.eq.enviando,erp_envio_em.lt.${limite})`)
    .select('id');
  return Array.isArray(data) && data.length > 0;
}

export async function despacharAoErp(site: Db, pedidoId: string, motivo: MotivoDespacho = 'pago'): Promise<ResultadoDespacho> {
  const erp = await clienteErp();
  if (!erp) return { ok: false, estado: 'sem-erp' };

  const { data } = await site.from('pedidos').select(CAMPOS).eq('id', pedidoId).maybeSingle();
  const ped = data as PedidoDespacho | null;
  if (!ped) return { ok: false, estado: 'erro', message: 'pedido-nao-encontrado' };
  if (ped.status === 'CANCELADO') return { ok: false, estado: 'cancelado' };

  let criouAgora = false;

  // ------------------------------------------------------- criar o orçamento
  if (!ped.erp_quote_id) {
    if (!ped.erp_payload) return { ok: false, estado: 'sem-payload' };
    // A REGRA: sem pagamento aprovado, o ERP não fica sabendo. Só o admin passa
    // por cima, e só de propósito.
    if (motivo !== 'admin' && ped.pagamento_status !== 'pago') {
      return { ok: false, estado: 'nao-pago' };
    }

    if (!(await pegarTrava(site, ped.id))) {
      // Ou outro processo está enviando agora, ou já terminou entre a leitura e
      // aqui. Reler é barato e evita responder "erro" para um pedido que foi.
      const { data: depois } = await site.from('pedidos').select('erp_envio, erp_quote_id, erp_quote_number').eq('id', ped.id).maybeSingle();
      const d = depois as { erp_envio: string; erp_quote_id: string | null; erp_quote_number: number | null } | null;
      if (d?.erp_quote_id) {
        ped.erp_quote_id = d.erp_quote_id;
        ped.erp_quote_number = d.erp_quote_number;
      } else {
        return { ok: false, estado: 'outro-processo' };
      }
    }

    if (!ped.erp_quote_id) {
      const { data: rpc, error } = await erp.rpc('site_criar_pedido', { p: ped.erp_payload });
      if (error) {
        await site.from('pedidos').update({ erp_envio: 'pendente', erp_envio_erro: error.message.slice(0, 400) }).eq('id', ped.id);
        return { ok: false, estado: 'erro', message: `site_criar_pedido: ${error.message}` };
      }
      const r = rpc as { quote_id: string; quote_number: number; client_id?: string | null };
      const agora = new Date().toISOString();
      await site
        .from('pedidos')
        .update({
          status: 'ABERTO',
          erp_quote_id: r.quote_id,
          erp_quote_number: r.quote_number,
          erp_envio: 'enviado',
          erp_envio_em: agora,
          erp_envio_erro: null,
          enviado_em: agora,
          status_atualizado_em: agora,
        })
        .eq('id', ped.id);
      ped.erp_quote_id = r.quote_id;
      ped.erp_quote_number = r.quote_number;
      criouAgora = true;
      await guardarClienteErp(site, ped.user_id, r.client_id);
    }
  } else if (ped.erp_envio !== 'enviado') {
    // Tem orçamento mas a coluna ficou para trás (pedido antigo, ou queda no
    // meio do caminho): acerta sem incomodar o ERP.
    await site.from('pedidos').update({ erp_envio: 'enviado', erp_envio_erro: null }).eq('id', ped.id);
  }

  // ------------------------------------------------------ confirmar o pago
  let pagamentoConfirmado = false;
  if (ped.pagamento_status === 'pago' && !ped.erp_pago_em && ped.erp_quote_id) {
    const { data: pg } = await site
      .from('pagamentos')
      .select('asaas_payment_id, forma, parcelas, valor, valor_liquido, cartao_bandeira, cartao_final, pago_em')
      .eq('pedido_id', ped.id)
      .eq('status', 'pago')
      .order('atualizado_em', { ascending: false })
      .limit(1)
      .maybeSingle();
    const p = pg as {
      asaas_payment_id?: string;
      parcelas?: number;
      valor_liquido?: number;
      cartao_bandeira?: string;
      cartao_final?: string;
    } | null;
    const { error } = await erp.rpc('site_confirmar_pagamento', {
      p: {
        site_pedido_id: ped.id,
        site_numero: ped.numero,
        forma: ped.forma_pagamento,
        parcelas: p?.parcelas ?? 1,
        valor: ped.total_final,
        valor_frete: ped.valor_frete,
        valor_liquido: p?.valor_liquido ?? null,
        asaas_payment_id: p?.asaas_payment_id ?? null,
        cartao: p ? `${p.cartao_bandeira ?? ''} ${p.cartao_final ?? ''}`.trim() : '',
        pago_em: ped.pago_em,
      },
    });
    if (error) {
      return { ok: false, estado: 'erro', message: `site_confirmar_pagamento: ${error.message}`, quoteId: ped.erp_quote_id, quoteNumber: ped.erp_quote_number };
    }
    await site.from('pedidos').update({ erp_pago_em: new Date().toISOString() }).eq('id', ped.id);
    pagamentoConfirmado = true;
  }

  return {
    ok: true,
    estado: criouAgora ? 'enviado' : 'ja-enviado',
    quoteId: ped.erp_quote_id,
    quoteNumber: ped.erp_quote_number,
    pagamentoConfirmado,
  };
}

/**
 * Pedido que não vai mais ao ERP (cancelado antes de pagar): tira da fila para
 * o cron não ficar tentando.
 */
export async function dispensarDoErp(site: Db, pedidoId: string): Promise<void> {
  await site.from('pedidos').update({ erp_envio: 'dispensado' }).eq('id', pedidoId).in('erp_envio', ['pendente', 'enviando']);
}
