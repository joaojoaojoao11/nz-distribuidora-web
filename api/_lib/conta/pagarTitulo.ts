// "Pagar pelo Asaas" na aba Pagamentos (Central do cliente, Fase C — D7).
//
// O cliente clica em um título dele. Três desfechos, nesta ordem:
//   · já tem cobrança viva no Asaas → devolve o título com os links (nada é
//     emitido de novo);
//   · não tem cobrança, está em aberto e ainda não venceu → pede ao NZERP que
//     emita (api/asaas/emit, origem 'site', segredo compartilhado). O ERP
//     confere de novo o dono e as regras dele (R12: cobrança nova não nasce
//     vencida; R21: pedido cancelado não ganha cobrança);
//   · vencido sem cobrança, em acordo, cedido ou qualquer outra situação →
//     não há o que o site faça sozinho: a tela manda falar com a NZ.
//
// O site não escreve no ERP: a emissão é o fluxo do próprio ERP, com o mesmo
// carimbo e o mesmo webhook de baixa de sempre. Toda tentativa fica em
// equipe_log (acao pagar-titulo), com o motivo cru do ERP para o admin — o cliente recebe só
// a frase curta.

import { createHmac } from 'node:crypto';
import type { Db } from '../papel.js';
import { registrarLog } from './vinculo.js';
import { tituloDoCliente, type TituloPublico } from './erpHistorico.js';

/**
 * O segredo que o ERP confere em api/asaas/emit (origem 'site'). Derivado da
 * chave de serviço do ERP, que os dois projetos já têm (aqui ela é
 * ERP_SUPABASE_SERVICE_ROLE_KEY; lá, SUPABASE_SERVICE_ROLE_KEY): HMAC-SHA256
 * com um rótulo fixo — o mesmo padrão do hook de e-mail (auth/webhook.ts). Por
 * que derivar: a Vercel não deixa criar variável nova pelo MCP, e quem tem a
 * chave de serviço já manda no banco do ERP de qualquer jeito.
 * `SITE_ERP_SEGREDO`, se existir nos dois projetos, tem prioridade.
 * O rótulo TEM que ser igual ao de api/asaas/emit.ts no NZERP.
 */
export const ROTULO_SEGREDO_SITE_ERP = 'nz-site-erp-emit-v1';

export function segredoSiteErp(): string {
  const explicito = process.env.SITE_ERP_SEGREDO ?? '';
  if (explicito) return explicito;
  const chave = process.env.ERP_SUPABASE_SERVICE_ROLE_KEY ?? '';
  return chave ? createHmac('sha256', chave).update(ROTULO_SEGREDO_SITE_ERP).digest('hex') : '';
}

/**
 * Endereço do NZERP. Fica FORA do repositório (o repo do site é público e as
 * rotas /api do ERP não pedem login): env NZERP_API_URL ou, sem ela,
 * loja_config.nzerp_api_url — tabela que só o admin e o servidor leem.
 */
async function urlDoErp(site: Db): Promise<string> {
  const env = (process.env.NZERP_API_URL ?? '').trim();
  if (env) return env.replace(/\/+$/, '');
  const { data } = await site.from('loja_config').select('nzerp_api_url').eq('id', 1).maybeSingle();
  return String((data as { nzerp_api_url?: string | null } | null)?.nzerp_api_url ?? '').trim().replace(/\/+$/, '');
}

export type ErroPagar = 'nao-encontrado' | 'combinado' | 'vencido' | 'nao-pagavel' | 'pedido-cancelado' | 'sem-erp' | 'erp-recusou';

export type ResultadoPagar = { ok: true; titulo: TituloPublico; emitiu: boolean } | { ok: false; status: number; erro: ErroPagar; mensagem: string };

const MENSAGENS: Record<ErroPagar, string> = {
  'nao-encontrado': 'Não achamos esse título na sua conta. Atualize a página e tente de novo.',
  combinado: 'Esse título está combinado com a NZ. Para pagar, fale com a gente.',
  vencido: 'Esse vencimento já passou. Fale com a NZ para combinar o pagamento.',
  'nao-pagavel': 'Esse título não pode ser pago pelo site. Fale com a NZ.',
  'pedido-cancelado': 'O pedido desse título foi cancelado. Fale com a NZ se tiver dúvida.',
  'sem-erp': 'A geração de cobrança está indisponível agora. Tente de novo em instantes.',
  'erp-recusou': 'Não foi possível gerar a cobrança agora. Tente de novo em instantes ou fale com a NZ.',
};

const falha = (status: number, erro: ErroPagar): ResultadoPagar => ({ ok: false, status, erro, mensagem: MENSAGENS[erro] });

/** 25 s: a emissão sincroniza o cliente no Asaas e cria a cobrança; mais que isso é o ERP fora do ar. */
const PRAZO_ERP_MS = 25_000;

export async function pagarTitulo(site: Db, userId: string, tituloId: string): Promise<ResultadoPagar> {
  const atual = await tituloDoCliente(site, userId, tituloId);
  if (!atual) return falha(404, 'nao-encontrado');
  if (atual.combinado) return falha(409, 'combinado');
  if (atual.cobrancaViva) return { ok: true, titulo: atual, emitiu: false };
  if (!atual.pagavel) return falha(409, 'nao-pagavel');
  if (atual.vencido) return falha(409, 'vencido');

  const base = await urlDoErp(site);
  const segredo = segredoSiteErp();
  const { data: perfil } = await site.from('user_profiles').select('email').eq('id', userId).maybeSingle();
  const email = (perfil as { email?: string | null } | null)?.email ?? null;
  if (!base || !segredo) {
    await registrarLog(site, 'pagar-titulo', email, { tituloId, resultado: 'sem-erp', temUrl: Boolean(base), temSegredo: Boolean(segredo) }, userId);
    return falha(503, 'sem-erp');
  }

  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), PRAZO_ERP_MS);
  let resposta: { ok?: boolean; error?: string; vencido?: boolean; pedidoCancelado?: boolean; paymentId?: string; alreadyEmitted?: boolean } | null = null;
  let http = 0;
  try {
    const r = await fetch(`${base}/api/asaas/emit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contaReceberId: tituloId, origem: 'site', segredo, siteUserId: userId, siteEmail: email }),
      signal: controle.signal,
    });
    http = r.status;
    resposta = (await r.json().catch(() => null)) as typeof resposta;
  } catch (e) {
    await registrarLog(site, 'pagar-titulo', email, { tituloId, resultado: 'erp-fora', erro: e instanceof Error ? e.message : String(e) }, userId);
    return falha(503, 'erp-recusou');
  } finally {
    clearTimeout(timer);
  }

  if (!resposta?.ok) {
    const erro: ErroPagar = resposta?.vencido ? 'vencido' : resposta?.pedidoCancelado ? 'pedido-cancelado' : 'erp-recusou';
    await registrarLog(site, 'pagar-titulo', email, { tituloId, resultado: erro, http, erpDisse: resposta?.error ?? null }, userId);
    return falha(http >= 400 && http < 600 ? http : 502, erro);
  }

  const emitiu = !resposta.alreadyEmitted;
  await registrarLog(site, 'pagar-titulo', email, { tituloId, resultado: 'ok', emitiu, paymentId: resposta.paymentId ?? null }, userId);
  const depois = await tituloDoCliente(site, userId, tituloId);
  return { ok: true, titulo: depois ?? atual, emitiu };
}
