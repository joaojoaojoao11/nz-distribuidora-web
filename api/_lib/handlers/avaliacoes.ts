// POST /api/nz/avaliacoes — avaliação de produto, pontos e cashback.
//
// Ops (campo `op`):
//   listar           público — avaliações aprovadas de um produto + resumo
//   resumo           público — média e contagem de vários produtos (a vitrine)
//   posso-avaliar    logado  — o que comprei e ainda não avaliei
//   enviar           logado  — grava a avaliação como PENDENTE
//   minhas           logado  — minhas avaliações, inclusive pendentes
//   pontos           logado  — saldo, extrato, campanhas e meus cupons
//   resgatar         logado  — troca pontos por cupom de crédito
//   moderar          admin   — aprova (e credita) ou recusa
//   responder        admin   — resposta oficial da loja
//   fila             admin   — o que está esperando moderação
//   campanhas-admin  admin   — cria, edita e desliga campanha
//
// Por que TUDO passa pelo servidor: a tabela `avaliacoes` não tem política de
// escrita nenhuma (migration 2026-09-07). Ninguém insere pelo navegador. Aqui é
// onde se confere que a pessoa comprou aquele produto — sem essa conferência o
// selo "compra verificada" seria só um desenho.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { resolverPapelDetalhado, type Db } from '../papel.js';
import {
  campanhasAtivas,
  creditarPontosDaAvaliacao,
  extratoDePontos,
  podeAvaliar,
  produtosQuePodeAvaliar,
  resgatar,
  saldoDePontos,
  PONTOS,
} from '../loja/avaliacoes.js';

/** O que o público vê de uma avaliação. Campo a campo, nunca por spread. */
const COLUNAS_PUBLICAS = 'id, produto_slug, nota, titulo, texto, foto_url, autor_nome, autor_cidade, aplicador, incentivada, resposta_loja, resposta_em, criado_em';

function safeJson(s: string): Record<string, unknown> {
  try {
    return JSON.parse(s) as Record<string, unknown>;
  } catch {
    return {};
  }
}

const texto = (v: unknown, max: number): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** "João Vitor dos Santos" → "João V." — o público não precisa do resto. */
function nomeCurto(completo: string | null | undefined, email: string | null | undefined): string {
  const limpo = (completo ?? '').trim().replace(/\s+/g, ' ');
  if (limpo) {
    const [primeiro, ...resto] = limpo.split(' ');
    const inicial = resto.length ? ` ${resto[resto.length - 1][0].toUpperCase()}.` : '';
    return `${primeiro}${inicial}`;
  }
  const antes = (email ?? '').split('@')[0];
  return antes ? antes.slice(0, 18) : 'Cliente NZ';
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

  // ------------------------------------------------------------- público
  if (op === 'listar') {
    const slug = texto(body.slug, 120);
    if (!slug) {
      res.status(400).json({ error: 'sem-slug' });
      return;
    }
    const [{ data: lista }, { data: resumo }] = await Promise.all([
      site.from('avaliacoes').select(COLUNAS_PUBLICAS).eq('produto_slug', slug).eq('status', 'aprovada').order('criado_em', { ascending: false }).limit(50),
      site.from('avaliacoes_resumo').select('*').eq('produto_slug', slug).maybeSingle(),
    ]);
    res.status(200).json({ avaliacoes: lista ?? [], resumo: resumo ?? null });
    return;
  }

  if (op === 'resumo') {
    const slugs = Array.isArray(body.slugs) ? (body.slugs as unknown[]).filter((s): s is string => typeof s === 'string').slice(0, 200) : [];
    if (!slugs.length) {
      res.status(200).json({ resumos: {} });
      return;
    }
    const { data } = await site.from('avaliacoes_resumo').select('produto_slug, total, media').in('produto_slug', slugs);
    const resumos: Record<string, { total: number; media: number }> = {};
    for (const r of (data ?? []) as { produto_slug: string; total: number; media: string }[]) {
      resumos[r.produto_slug] = { total: Number(r.total), media: Number(r.media) };
    }
    res.status(200).json({ resumos });
    return;
  }

  // -------------------------------------------------------------- logado
  const { papel, userId } = await resolverPapelDetalhado(site, req.headers.authorization);
  if (papel === 'anonimo' || !userId) {
    res.status(401).json({ error: 'login-necessario' });
    return;
  }
  const admin = papel === 'admin';

  try {
    if (op === 'posso-avaliar') {
      res.status(200).json({ produtos: await produtosQuePodeAvaliar(site, userId), regras: PONTOS });
      return;
    }

    if (op === 'minhas') {
      const { data } = await site
        .from('avaliacoes')
        .select('id, produto_slug, nota, titulo, texto, foto_url, status, motivo_recusa, resposta_loja, criado_em')
        .eq('user_id', userId)
        .order('criado_em', { ascending: false })
        .limit(100);
      res.status(200).json({ avaliacoes: data ?? [] });
      return;
    }

    if (op === 'enviar') {
      const slug = texto(body.slug, 120);
      const nota = Math.round(Number(body.nota));
      const corpo = texto(body.texto, 3000);
      const titulo = texto(body.titulo, 120) || null;
      const foto = texto(body.fotoUrl, 500) || null;

      if (!Number.isFinite(nota) || nota < 1 || nota > 5) {
        res.status(400).json({ error: 'nota-invalida' });
        return;
      }
      if (corpo.length < 20) {
        res.status(400).json({ error: 'texto-curto', minimo: 20 });
        return;
      }
      // A trava que dá sentido ao selo: comprou este produto?
      const compra = await podeAvaliar(site, userId, slug);
      if (!compra) {
        res.status(403).json({ error: 'nao-comprou' });
        return;
      }

      const { data: perfil } = await site.from('user_profiles').select('full_name, company_name, email, address_city, address_state, role').eq('id', userId).maybeSingle();
      const p = (perfil ?? {}) as { full_name?: string; company_name?: string; email?: string; address_city?: string; address_state?: string; role?: string };
      const cidade = p.address_city ? `${p.address_city}${p.address_state ? `/${p.address_state}` : ''}` : null;

      const { data: nova, error } = await site
        .from('avaliacoes')
        .insert({
          produto_slug: slug,
          user_id: userId,
          pedido_id: compra.pedidoId,
          erp_quote_id: compra.erpQuoteId,
          nota,
          titulo,
          texto: corpo,
          foto_url: foto,
          autor_nome: nomeCurto(p.company_name || p.full_name, p.email),
          autor_cidade: cidade,
          aplicador: p.role === 'reseller',
          // Ganha ponto por avaliar, então a página TEM que dizer.
          incentivada: true,
          status: 'pendente',
        })
        .select('id')
        .single();

      if (error) {
        // 23505 = já avaliou este produto.
        const jaTem = String(error.code).includes('23505');
        res.status(jaTem ? 409 : 500).json({ error: jaTem ? 'ja-avaliou' : 'nao-gravou', message: jaTem ? undefined : error.message });
        return;
      }
      res.status(200).json({
        ok: true,
        id: (nova as { id: string }).id,
        status: 'pendente',
        pontosPrevistos: PONTOS.base + (foto ? PONTOS.foto : 0) + (corpo.length >= PONTOS.minimoTextoLongo ? PONTOS.textoLongo : 0),
      });
      return;
    }

    if (op === 'pontos') {
      const [saldo, extrato, campanhas] = await Promise.all([
        saldoDePontos(site, userId),
        extratoDePontos(site, userId),
        campanhasAtivas(site),
      ]);
      const { data: cupons } = await site
        .from('cupons')
        .select('codigo, desconto_valor, valido_ate, usos, limite_usos, ativo')
        .eq('dono_user_id', userId)
        .order('criado_em', { ascending: false })
        .limit(50);
      res.status(200).json({ saldo, extrato, campanhas, cupons: cupons ?? [], regras: PONTOS });
      return;
    }

    if (op === 'resgatar') {
      const campanhaId = texto(body.campanhaId, 60);
      if (!campanhaId) {
        res.status(400).json({ error: 'sem-campanha' });
        return;
      }
      const r = await resgatar(site, userId, campanhaId);
      res.status(r.ok ? 200 : 409).json(r);
      return;
    }

    // --------------------------------------------------------------- admin
    if (op === 'fila' || op === 'moderar' || op === 'responder' || op === 'campanhas-admin') {
      if (!admin) {
        res.status(403).json({ error: 'apenas-admin' });
        return;
      }
      await opsAdmin(site, op, body, userId, res);
      return;
    }

    res.status(400).json({ error: 'op-desconhecida' });
  } catch (err) {
    console.error('[avaliacoes] erro:', op, err instanceof Error ? err.message : err);
    if (!res.headersSent) res.status(500).json({ error: 'erro-interno' });
  }
}

// ================================================================= admin

async function opsAdmin(site: Db, op: string, body: Record<string, unknown>, adminId: string, res: VercelResponse) {
  if (op === 'fila') {
    const status = texto(body.status, 20) || 'pendente';
    const { data } = await site
      .from('avaliacoes')
      .select('id, produto_slug, user_id, nota, titulo, texto, foto_url, autor_nome, autor_cidade, aplicador, incentivada, status, motivo_recusa, resposta_loja, criado_em')
      .eq('status', status)
      .order('criado_em', { ascending: true })
      .limit(200);
    const { count: pendentes } = await site.from('avaliacoes').select('id', { count: 'exact', head: true }).eq('status', 'pendente');
    res.status(200).json({ avaliacoes: data ?? [], pendentes: Number(pendentes ?? 0) });
    return;
  }

  if (op === 'moderar') {
    const id = texto(body.id, 60);
    const aprovar = body.aprovar === true;
    const motivo = texto(body.motivo, 300) || null;
    if (!id) {
      res.status(400).json({ error: 'sem-id' });
      return;
    }
    const { data: atual } = await site.from('avaliacoes').select('id, user_id, texto, foto_url, produto_slug, status').eq('id', id).maybeSingle();
    const av = atual as { id: string; user_id: string; texto: string; foto_url: string | null; produto_slug: string; status: string } | null;
    if (!av) {
      res.status(404).json({ error: 'nao-encontrada' });
      return;
    }

    await site
      .from('avaliacoes')
      .update({
        status: aprovar ? 'aprovada' : 'recusada',
        motivo_recusa: aprovar ? null : motivo,
        moderado_por: adminId,
        moderado_em: new Date().toISOString(),
      })
      .eq('id', id);

    // O ponto entra na APROVAÇÃO, e não olha a nota — nem aqui nem em
    // `pontosDaAvaliacao`. Recusa não credita, e reaprovar não paga de novo
    // (índice único em pontos_movimentos).
    let pontos = 0;
    if (aprovar) pontos = await creditarPontosDaAvaliacao(site, av);
    res.status(200).json({ ok: true, status: aprovar ? 'aprovada' : 'recusada', pontosCreditados: pontos });
    return;
  }

  if (op === 'responder') {
    const id = texto(body.id, 60);
    const resposta = texto(body.resposta, 2000);
    if (!id) {
      res.status(400).json({ error: 'sem-id' });
      return;
    }
    await site
      .from('avaliacoes')
      .update({ resposta_loja: resposta || null, resposta_em: resposta ? new Date().toISOString() : null })
      .eq('id', id);
    res.status(200).json({ ok: true });
    return;
  }

  if (op === 'campanhas-admin') {
    const acao = texto(body.acao, 20);
    if (acao === 'listar') {
      const { data } = await site.from('campanhas_cashback').select('*').order('criado_em', { ascending: false }).limit(100);
      res.status(200).json({ campanhas: data ?? [] });
      return;
    }
    if (acao === 'salvar') {
      const c = (body.campanha ?? {}) as Record<string, unknown>;
      const linha = {
        nome: texto(c.nome, 120),
        descricao: texto(c.descricao, 400) || null,
        pontos: Math.max(1, Math.round(Number(c.pontos) || 0)),
        valor: Math.max(0.01, Number(c.valor) || 0),
        validade_dias: Math.max(1, Math.round(Number(c.validadeDias) || 90)),
        ativo: c.ativo !== false,
        limite_por_usuario: c.limitePorUsuario == null || c.limitePorUsuario === '' ? null : Math.round(Number(c.limitePorUsuario)),
        limite_total: c.limiteTotal == null || c.limiteTotal === '' ? null : Math.round(Number(c.limiteTotal)),
      };
      if (!linha.nome) {
        res.status(400).json({ error: 'sem-nome' });
        return;
      }
      const id = texto(c.id, 60);
      const { error } = id
        ? await site.from('campanhas_cashback').update(linha).eq('id', id)
        : await site.from('campanhas_cashback').insert(linha);
      res.status(error ? 500 : 200).json(error ? { error: 'nao-salvou', message: error.message } : { ok: true });
      return;
    }
    res.status(400).json({ error: 'acao-desconhecida' });
    return;
  }
}
