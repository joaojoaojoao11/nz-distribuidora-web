// POST /api/nz/selecoes — a lista que o vendedor monta e manda para o cliente.
//
// Quatro operações num handler só (o roteador /api/nz/[acao] é uma função da
// Vercel; ver o cabeçalho de api/nz/[acao].ts para o porquê):
//
//   criar    — admin. Congela a lista, sorteia o token, define a validade.
//   abrir    — PÚBLICO. É o que a página /loja/s/<token> chama.
//   renovar  — admin. Soma 24 h ao mesmo link (o cliente já recebeu aquele).
//   encerrar — admin. Mata o link antes da hora.
//
// A LINHA QUE NÃO PODE SER CRUZADA: `abrir` é a única resposta que vai para
// gente sem login, e ela devolve exatamente o que um estranho pode ver — token,
// título, slugs, se mostra preço, quando expira. NUNCA `acrescimo_pct` (o
// cliente veria de quanto foi o aumento) e NUNCA `criado_por`. O preço em si
// não sai daqui: sai de /api/nz/precos, que recebe o token e faz a mesma
// checagem de validade.
//
// `Cache-Control: no-store` em tudo: uma seleção expira, e uma CDN não sabe
// disso.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';
import { resolverPapelDetalhado, type Db } from '../papel.js';
import { SITE_URL } from './conta.js';

/** Teto de itens numa seleção. Espelha MAX_SELECAO no cliente e o check do banco. */
const MAX_SLUGS = 300;
const MAX_TITULO = 80;
/** 12 caracteres base64url = 72 bits. Curto para o WhatsApp, impossível de adivinhar. */
const TOKEN_BYTES = 9;
const VALIDADE_PADRAO_H = 24;

export interface SelecaoRow {
  id: string;
  token: string;
  criado_por: string;
  titulo: string | null;
  slugs: string[];
  mostrar_preco: boolean;
  acrescimo_pct: number;
  expira_em: string;
  encerrada_em: string | null;
}

/**
 * Uma seleção só vale enquanto está dentro do prazo e não foi encerrada. A
 * mesma pergunta é feita aqui e em /api/nz/precos — se as duas divergirem, uma
 * delas mostra preço num link morto.
 */
export function selecaoAtiva(s: { expira_em: string; encerrada_em: string | null } | null | undefined): boolean {
  if (!s || s.encerrada_em) return false;
  return new Date(s.expira_em).getTime() > Date.now();
}

/** Busca por token. Usado aqui e pelo handler de preços. */
export async function lerSelecaoPorToken(site: Db, token: string): Promise<SelecaoRow | null> {
  const limpo = typeof token === 'string' ? token.trim().slice(0, 32) : '';
  if (!limpo) return null;
  const { data } = await site
    .from('selecoes')
    .select('id, token, criado_por, titulo, slugs, mostrar_preco, acrescimo_pct, expira_em, encerrada_em')
    .eq('token', limpo)
    .maybeSingle();
  return (data as SelecaoRow | null) ?? null;
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

  // `abrir` é a porta pública — não pede token de sessão nem resolve papel para
  // quem não tem. Só olhamos o papel para não contar a visita do próprio
  // vendedor conferindo o link.
  if (op === 'abrir') {
    await opAbrir(site, body, req, res);
    return;
  }

  const { papel, userId } = await resolverPapelDetalhado(site, req.headers.authorization);
  if (papel !== 'admin' || !userId) {
    res.status(403).json({ error: 'so-admin' });
    return;
  }

  try {
    if (op === 'criar') await opCriar(site, userId, body, res);
    else if (op === 'renovar') await opRenovar(site, body, res);
    else if (op === 'encerrar') await opEncerrar(site, body, res);
    else res.status(400).json({ error: 'op-desconhecida', disponiveis: ['criar', 'abrir', 'renovar', 'encerrar'] });
  } catch (err) {
    console.error('[selecoes]', op, err instanceof Error ? err.message : err);
    if (!res.headersSent) res.status(500).json({ error: 'erro-interno' });
  }
}

// ==================================================================== criar

async function opCriar(site: Db, userId: string, body: Record<string, unknown>, res: VercelResponse) {
  const brutos = Array.isArray(body.slugs) ? (body.slugs as unknown[]) : [];
  const pedidos = [
    ...new Set(
      brutos
        .filter((s): s is string => typeof s === 'string')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    ),
  ];

  if (!pedidos.length) {
    res.status(400).json({ error: 'sem-itens' });
    return;
  }
  if (pedidos.length > MAX_SLUGS) {
    res.status(400).json({ error: 'itens-demais', max: MAX_SLUGS, enviados: pedidos.length });
    return;
  }

  // Slug que não existe no cadastro viraria um buraco na lista do cliente: o
  // card simplesmente não apareceria e ninguém saberia por quê. Melhor devolver
  // quais caíram fora e deixar o vendedor decidir.
  const { data: existentesData, error: erroProdutos } = await site.from('produtos').select('slug').in('slug', pedidos);
  if (erroProdutos) throw new Error(`leitura de produtos: ${erroProdutos.message}`);
  const existentes = new Set(((existentesData ?? []) as { slug: string }[]).map((p) => p.slug));

  // A ORDEM é a que o vendedor montou, não a do banco: ele curou a lista.
  const slugs = pedidos.filter((s) => existentes.has(s));
  const ignorados = pedidos.filter((s) => !existentes.has(s));
  if (!slugs.length) {
    res.status(400).json({ error: 'nenhum-slug-valido', ignorados });
    return;
  }

  const mostrarPreco = body.mostrarPreco === true;
  // Sem preço na tela, acréscimo não significa nada — gravar um número aí só
  // criaria a dúvida "por que este link tem 10% se não mostra preço?".
  const acrescimoPct = mostrarPreco ? normalizarPct(body.acrescimoPct) : 0;
  if (acrescimoPct === null) {
    res.status(400).json({ error: 'acrescimo-invalido', faixa: '0 a 100' });
    return;
  }

  const titulo = typeof body.titulo === 'string' ? body.titulo.trim().slice(0, MAX_TITULO) || null : null;

  const { data: cfg } = await site.from('loja_config').select('selecao_validade_horas').eq('id', 1).maybeSingle();
  const horas = Number((cfg as { selecao_validade_horas?: number } | null)?.selecao_validade_horas ?? VALIDADE_PADRAO_H);
  const expiraEm = new Date(Date.now() + Math.max(1, horas) * 3600_000).toISOString();

  // Colisão de token é improvável (72 bits), mas o unique do banco é quem
  // garante — e três tentativas cobrem o caso absurdo sem laço infinito.
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    const token = randomBytes(TOKEN_BYTES).toString('base64url');
    const { data, error } = await site
      .from('selecoes')
      .insert([
        {
          token,
          criado_por: userId,
          titulo,
          slugs,
          mostrar_preco: mostrarPreco,
          acrescimo_pct: acrescimoPct,
          expira_em: expiraEm,
        },
      ])
      .select('id, token, expira_em')
      .single();

    if (!error && data) {
      const row = data as { id: string; token: string; expira_em: string };
      res.status(200).json({
        id: row.id,
        token: row.token,
        url: `${SITE_URL}/loja/s/${row.token}`,
        expiraEm: row.expira_em,
        itens: slugs.length,
        ignorados,
      });
      return;
    }
    if (error && error.code !== '23505') throw new Error(`criação da seleção: ${error.message}`);
  }
  res.status(500).json({ error: 'token-colidiu' });
}

// ==================================================================== abrir

async function opAbrir(site: Db, body: Record<string, unknown>, req: VercelRequest, res: VercelResponse) {
  const token = typeof body.token === 'string' ? body.token.trim().slice(0, 32) : '';
  if (!token) {
    res.status(400).json({ error: 'sem-token' });
    return;
  }

  const s = await lerSelecaoPorToken(site, token);
  if (!s) {
    res.status(404).json({ error: 'nao-encontrada' });
    return;
  }

  // Expirada ou encerrada: o título ainda vai (o cliente reconhece do que se
  // tratava), mas a LISTA não. Um link morto não é uma vitrine.
  if (!selecaoAtiva(s)) {
    res.status(200).json({ token: s.token, titulo: s.titulo, expirada: true, expiraEm: s.expira_em });
    return;
  }

  // A contagem é do cliente, não da equipe: o vendedor conferindo o próprio
  // link não pode inflar o número que ele usa para saber se o cliente abriu.
  // O incremento é atômico no banco (RPC): ler e regravar aqui perderia
  // contagem com duas pessoas abrindo no mesmo segundo.
  const { papel } = await resolverPapelDetalhado(site, req.headers.authorization);
  if (papel !== 'admin') {
    const { error } = await site.rpc('selecao_registrar_visita', { p_token: s.token });
    // Métrica falhar não pode impedir o cliente de ver a seleção.
    if (error) console.warn('[selecoes] visita:', error.message);
  }

  res.status(200).json({
    token: s.token,
    titulo: s.titulo,
    slugs: s.slugs,
    mostrarPreco: s.mostrar_preco,
    expiraEm: s.expira_em,
    expirada: false,
    // `acrescimo_pct` e `criado_por` NÃO saem daqui. Ver o cabeçalho.
  });
}

// ================================================================== renovar

async function opRenovar(site: Db, body: Record<string, unknown>, res: VercelResponse) {
  const id = typeof body.id === 'string' ? body.id : '';
  if (!id) {
    res.status(400).json({ error: 'sem-id' });
    return;
  }

  const { data: cfg } = await site.from('loja_config').select('selecao_validade_horas').eq('id', 1).maybeSingle();
  const horas = Number((cfg as { selecao_validade_horas?: number } | null)?.selecao_validade_horas ?? VALIDADE_PADRAO_H);

  // O MESMO link volta a valer: renovar existe justamente porque o cliente já
  // tem aquele endereço na conversa. Gerar outro obrigaria a mandar de novo.
  // `encerrada_em: null` faz renovar desfazer um encerramento, de propósito.
  const { data, error } = await site
    .from('selecoes')
    .update({
      expira_em: new Date(Date.now() + Math.max(1, horas) * 3600_000).toISOString(),
      renovada_em: new Date().toISOString(),
      encerrada_em: null,
    })
    .eq('id', id)
    .select('id, token, expira_em')
    .maybeSingle();

  if (error) throw new Error(`renovação: ${error.message}`);
  if (!data) {
    res.status(404).json({ error: 'nao-encontrada' });
    return;
  }
  const row = data as { token: string; expira_em: string };
  res.status(200).json({ expiraEm: row.expira_em, url: `${SITE_URL}/loja/s/${row.token}` });
}

// ================================================================= encerrar

async function opEncerrar(site: Db, body: Record<string, unknown>, res: VercelResponse) {
  const id = typeof body.id === 'string' ? body.id : '';
  if (!id) {
    res.status(400).json({ error: 'sem-id' });
    return;
  }
  const { data, error } = await site
    .from('selecoes')
    .update({ encerrada_em: new Date().toISOString() })
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error) throw new Error(`encerramento: ${error.message}`);
  if (!data) {
    res.status(404).json({ error: 'nao-encontrada' });
    return;
  }
  res.status(200).json({ ok: true });
}

// ==================================================================== util

/** Devolve null quando o valor não serve — nunca "conserta" silenciosamente. */
function normalizarPct(bruto: unknown): number | null {
  if (bruto == null || bruto === '') return 0;
  const n = Number(bruto);
  if (!Number.isFinite(n) || n < 0 || n > 100) return null;
  return Math.round(n * 100) / 100;
}

function safeJson(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
