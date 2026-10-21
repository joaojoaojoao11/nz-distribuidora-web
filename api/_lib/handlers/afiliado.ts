// POST /api/nz/afiliado — link de indicação, cupom e comissões.
//
// Modelo (migrations/2026-09-06_loja_ecommerce.sql):
//   afiliados    — um código por usuário logado (NZ-XXXXX), percentual opcional
//   cupons       — código de desconto; o de afiliado é criado junto com ele
//   atribuicoes  — último clique em ?ref=, por visitante (cookie/localStorage)
//   comissoes    — geradas quando o pedido vinculado chega a FATURADO no ERP
//
// Operações (campo `op` no corpo):
//   clique       { codigo, visitante }    público — registra o último clique; devolve a janela (dias)
//   validar      { codigo }               público — cupom/afiliado existe e está ativo? Cupom com
//                                         dono (nominal) só vale para o dono logado (B3, 21/10/2026)
//   meu          {}                       logado  — devolve (criando se preciso) meu código
//   meus-cupons  {}                       logado  — cupons de que sou afiliado ou dono (B4)
//   comissoes    {}                       logado  — minhas comissões
//
// Tudo que escreve passa por aqui com service role; anon não tem policy
// nenhuma nessas tabelas. Um visitante não consegue atribuir clique a
// afiliado inexistente nem inflar cupom: o código é validado antes.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { resolverPapelDetalhado } from '../papel.js';
import { COLUNAS_CUPOM, motivoCupomInvalido, resolverCupom, type CupomRow } from '../pedido/precificar.js';

const CODIGO_RE = /^[A-Z0-9][A-Z0-9-]{2,23}$/;

function normalizarCodigo(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const c = raw.trim().toUpperCase();
  return CODIGO_RE.test(c) ? c : null;
}

/** NZ- + 5 caracteres sem ambiguidade (sem 0/O, 1/I). */
function gerarCodigo(): string {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = 'NZ-';
  for (let i = 0; i < 5; i++) s += alfabeto[Math.floor(Math.random() * alfabeto.length)];
  return s;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  const siteUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const siteKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!siteUrl || !siteKey) {
    res.status(500).json({ error: 'ENV ausente', hasSiteUrl: !!siteUrl, hasSiteKey: !!siteKey });
    return;
  }
  const site = createClient(siteUrl, siteKey);

  const body = (typeof req.body === 'string' ? safeJson(req.body) : req.body) || {};
  const op = typeof body.op === 'string' ? body.op : '';

  // ------------------------------------------------------------ público
  if (op === 'validar') {
    const codigo = normalizarCodigo(body.codigo);
    if (!codigo) {
      res.status(200).json({ valido: false });
      return;
    }
    // A MESMA régua do checkout (precificar.ts): inativo, prazo, esgotado,
    // nominal só para o dono, ninguém usa o próprio, "só conta nova" e limite
    // por cliente (super cupom). Quem não está logado só fica sabendo que o
    // cupom é pessoal — o resumo do checkout confere de novo.
    const { data: cupom } = await site.from('cupons').select(COLUNAS_CUPOM).eq('codigo', codigo).maybeSingle();
    const c = (cupom as CupomRow | null) ?? null;
    const quem = await resolverPapelDetalhado(site, req.headers.authorization);
    const motivo = await motivoCupomInvalido(site, c, quem.userId);
    if (motivo || !c) {
      res.status(200).json({ valido: false, motivo: motivo === 'inexistente' ? undefined : motivo });
      return;
    }
    // O desconto que a tela mostra é o mesmo que o checkout cobra.
    const r = quem.userId ? await resolverCupom(site, c.codigo, 100, quem.userId) : null;
    res.status(200).json({ valido: true, codigo: c.codigo, tipo: c.tipo, descontoPct: r ? r.desconto : c.desconto_pct, descontoValor: c.desconto_valor });
    return;
  }

  if (op === 'clique') {
    const codigo = normalizarCodigo(body.codigo);
    const visitante = typeof body.visitante === 'string' ? body.visitante.trim().slice(0, 80) : '';
    if (!codigo || !/^[a-zA-Z0-9_-]{8,80}$/.test(visitante)) {
      res.status(200).json({ ok: false });
      return;
    }
    const { data: af } = await site.from('afiliados').select('user_id, ativo').eq('codigo', codigo).maybeSingle();
    const a = af as { user_id: string; ativo: boolean } | null;
    if (!a || !a.ativo) {
      res.status(200).json({ ok: false });
      return;
    }
    // Último clique vence. A janela (dias) vem de loja_config.dias_atribuicao e
    // volta na resposta, para o navegador guardar o mesmo prazo (B6, 21/10/2026).
    const { error } = await site.from('atribuicoes').upsert(
      { visitante_id: visitante, afiliado_user_id: a.user_id, ultimo_clique_em: new Date().toISOString() },
      { onConflict: 'visitante_id' }
    );
    const { data: cfgClique } = await site.from('loja_config').select('dias_atribuicao').eq('id', 1).maybeSingle();
    const dias = Number((cfgClique as { dias_atribuicao?: number } | null)?.dias_atribuicao ?? 30) || 30;
    res.status(200).json({ ok: !error, dias });
    return;
  }

  // ------------------------------------------------------------- logado
  const { papel, userId, aprovado } = await resolverPapelDetalhado(site, req.headers.authorization);
  if (papel === 'anonimo' || !userId) {
    res.status(401).json({ error: 'login-necessario' });
    return;
  }

  if (op === 'meu') {
    type Af = { codigo: string; percentual: number | null; ativo: boolean; criado_em: string };
    const { data: existente } = await site
      .from('afiliados')
      .select('codigo, percentual, ativo, criado_em')
      .eq('user_id', userId)
      .maybeSingle();
    const af: Af | null = (existente as Af | null) ?? null;

    // Desde 21/10/2026 (D6) ninguém vira afiliado sozinho: o pedido de adesão
    // é a op `quero-ser-afiliado` de /api/nz/incentivos, e a NZ aprova em
    // Admin → Afiliados. Sem afiliado, a resposta diz isso em vez de criar um.
    if (!af) {
      res.status(200).json({ codigo: null, ativo: false, afiliado: false, aprovado });
      return;
    }

    const { data: cfg } = await site.from('loja_config').select('percentual_afiliado_padrao, dias_atribuicao').eq('id', 1).maybeSingle();
    const c = cfg as { percentual_afiliado_padrao: number; dias_atribuicao: number } | null;
    const { data: cupom } = await site.from('cupons').select('desconto_pct, desconto_valor, ativo').eq('codigo', af.codigo).maybeSingle();

    res.status(200).json({
      codigo: af.codigo,
      ativo: af.ativo,
      percentual: af.percentual ?? c?.percentual_afiliado_padrao ?? 0,
      diasAtribuicao: c?.dias_atribuicao ?? 30,
      cupom: cupom ?? null,
      aprovado,
    });
    return;
  }

  if (op === 'meus-cupons') {
    // "Meus cupons" lia `cupons` direto do navegador, mas a política da tabela é
    // só de admin: para todo mundo a lista vinha vazia (B4). Aqui, com service
    // role, saem os cupons de que a pessoa é afiliada ou dona.
    const { data } = await site
      .from('cupons')
      .select('codigo, tipo, desconto_pct, desconto_valor, ativo, valido_ate, usos, limite_usos, dono_user_id, afiliado_user_id')
      .or(`afiliado_user_id.eq.${userId},dono_user_id.eq.${userId}`)
      .order('criado_em', { ascending: false })
      .limit(100);
    const lista = ((data ?? []) as { codigo: string; tipo: string; desconto_pct: number | null; desconto_valor: number | null; ativo: boolean; valido_ate: string | null; usos: number | null; limite_usos: number | null; dono_user_id: string | null; afiliado_user_id: string | null }[]).map((c) => ({
      codigo: c.codigo,
      tipo: c.tipo,
      desconto_pct: c.desconto_pct,
      desconto_valor: c.desconto_valor,
      ativo: c.ativo,
      valido_ate: c.valido_ate,
      usos: c.usos,
      limite_usos: c.limite_usos,
      // O de afiliado é para DISTRIBUIR (quem usa é o indicado); o nominal é para USAR.
      papel: c.dono_user_id === userId ? 'dono' : 'afiliado',
    }));
    res.status(200).json({ cupons: lista });
    return;
  }

  if (op === 'comissoes') {
    const { data } = await site
      .from('comissoes')
      .select('id, pedido_id, base_valor, percentual, valor, status, evento_erp, apurada_em, paga_em, criado_em, pedidos(numero, status)')
      .eq('afiliado_user_id', userId)
      .order('criado_em', { ascending: false })
      .limit(200);
    const lista = (data ?? []) as { valor: number; status: string }[];
    const total = (status: string) => lista.filter((c) => c.status === status).reduce((s, c) => s + Number(c.valor), 0);
    res.status(200).json({ comissoes: data ?? [], totais: { pendente: total('pendente'), apurada: total('apurada'), paga: total('paga') } });
    return;
  }

  res.status(400).json({ error: 'op-desconhecida', disponiveis: ['clique', 'validar', 'meu', 'meus-cupons', 'comissoes'] });
}

function safeJson(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
