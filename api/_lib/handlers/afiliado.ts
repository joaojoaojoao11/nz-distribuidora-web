// POST /api/nz/afiliado — link de indicação, cupom e comissões.
//
// Modelo (migrations/2026-09-06_loja_ecommerce.sql):
//   afiliados    — um código por usuário logado (NZ-XXXXX), percentual opcional
//   cupons       — código de desconto; o de afiliado é criado junto com ele
//   atribuicoes  — último clique em ?ref=, por visitante (cookie/localStorage)
//   comissoes    — geradas quando o pedido vinculado chega a FATURADO no ERP
//
// Operações (campo `op` no corpo):
//   clique     { codigo, visitante }      público — registra o último clique
//   validar    { codigo }                 público — cupom/afiliado existe e está ativo?
//   meu        {}                         logado  — devolve (criando se preciso) meu código
//   comissoes  {}                         logado  — minhas comissões
//
// Tudo que escreve passa por aqui com service role; anon não tem policy
// nenhuma nessas tabelas. Um visitante não consegue atribuir clique a
// afiliado inexistente nem inflar cupom: o código é validado antes.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { resolverPapelDetalhado } from '../papel.js';

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
    const { data: cupom } = await site
      .from('cupons')
      .select('codigo, tipo, desconto_pct, desconto_valor, ativo, valido_de, valido_ate, limite_usos, usos')
      .eq('codigo', codigo)
      .maybeSingle();
    const c = cupom as
      | { codigo: string; tipo: string; desconto_pct: number | null; desconto_valor: number | null; ativo: boolean; valido_de: string | null; valido_ate: string | null; limite_usos: number | null; usos: number }
      | null;
    if (!c || !c.ativo) {
      res.status(200).json({ valido: false });
      return;
    }
    const agora = Date.now();
    if (c.valido_de && Date.parse(c.valido_de) > agora) {
      res.status(200).json({ valido: false, motivo: 'ainda-nao-vale' });
      return;
    }
    if (c.valido_ate && Date.parse(c.valido_ate) < agora) {
      res.status(200).json({ valido: false, motivo: 'expirado' });
      return;
    }
    if (c.limite_usos != null && c.usos >= c.limite_usos) {
      res.status(200).json({ valido: false, motivo: 'esgotado' });
      return;
    }
    res.status(200).json({ valido: true, codigo: c.codigo, tipo: c.tipo, descontoPct: c.desconto_pct, descontoValor: c.desconto_valor });
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
    // Último clique vence (regra decidida: 30 dias, último clique).
    const { error } = await site.from('atribuicoes').upsert(
      { visitante_id: visitante, afiliado_user_id: a.user_id, ultimo_clique_em: new Date().toISOString() },
      { onConflict: 'visitante_id' }
    );
    res.status(200).json({ ok: !error });
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
    let af: Af | null = (existente as Af | null) ?? null;

    if (!af) {
      // Decisão: qualquer logado pode ser afiliado. A aprovação do cadastro
      // não é pré-requisito para indicar — é para comprar com preço.
      for (let tentativa = 0; tentativa < 5 && !af; tentativa++) {
        const codigo = gerarCodigo();
        const { data, error } = await site
          .from('afiliados')
          .insert({ user_id: userId, codigo })
          .select('codigo, percentual, ativo, criado_em')
          .single();
        if (!error && data) af = data as unknown as Af;
      }
      if (af) {
        await site.from('cupons').upsert(
          { codigo: af.codigo, tipo: 'afiliado', afiliado_user_id: userId, ativo: true },
          { onConflict: 'codigo' }
        );
      }
    }
    if (!af) {
      res.status(500).json({ error: 'nao-consegui-gerar-codigo' });
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

  res.status(400).json({ error: 'op-desconhecida', disponiveis: ['clique', 'validar', 'meu', 'comissoes'] });
}

function safeJson(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
