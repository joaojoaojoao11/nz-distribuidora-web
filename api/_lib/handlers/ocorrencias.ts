// POST /api/nz/ocorrencias — "informar um problema" na página do produto.
//
// SEM LOGIN, de propósito. Quem mais vê a foto errada é o instalador no pátio e
// o vendedor com o cliente ao lado; exigir cadastro para avisar "esta cor não é
// essa" garantiria que ninguém avisasse. Quando há sessão, ela é aproveitada
// (o relato ganha dono e o contato já vem preenchido), mas nunca é exigida.
//
// Como isso não vira porta aberta:
//
//   · A escrita é do SERVIDOR. A tabela `ocorrencias` não tem policy de insert
//     para `authenticated`, e o bucket de imagens é PRIVADO — o anônimo não
//     toca no Storage, quem grava é o service role aqui.
//   · Honeypot: robô preenche todo campo que encontra. Campo `site` preenchido
//     responde 200 e não grava — dizer "erro" ensinaria o robô a tentar de novo.
//   · Cinco por hora por IP, e o IP nunca é gravado em claro: só o sha256 com
//     salt, que serve para contar e não para identificar.
//   · A imagem chega em base64 já reduzida pelo navegador (src/lib/imagem/reduzir.ts).
//     O teto aqui é a última linha de defesa, não a primeira.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import { resolverPapelDetalhado, type Db } from '../papel.js';
import { abrirOcorrencia } from '../ocorrencias.js';

const MOTIVOS: Record<string, string> = {
  preco: 'Preço não aparece ou está errado',
  foto: 'Foto errada ou faltando',
  estoque: 'Estoque / disponibilidade',
  descricao: 'Descrição ou ficha técnica',
  outro: 'Outro',
};

const MIN_MENSAGEM = 10;
const MAX_MENSAGEM = 1000;
const MAX_CONTATO = 120;
/** Depois do base64→binário. O navegador já entrega ~1,5 MB. */
const MAX_IMAGEM_BYTES = 2_000_000;
const TIPOS_IMAGEM: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
/** Freio de spam: por hora, por IP. */
const MAX_POR_HORA = 5;

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

  const body = (typeof req.body === 'string' ? safeJson(req.body) : req.body) || {};
  if (body.op !== undefined && body.op !== 'informar') {
    res.status(400).json({ error: 'op-desconhecida', disponiveis: ['informar'] });
    return;
  }

  // Honeypot. Um humano nunca vê este campo; um robô preenche tudo.
  if (typeof body.site === 'string' && body.site.trim()) {
    res.status(200).json({ ok: true });
    return;
  }

  const slug = typeof body.slug === 'string' ? body.slug.trim().toLowerCase().slice(0, 200) : '';
  const motivo = typeof body.motivo === 'string' && body.motivo in MOTIVOS ? body.motivo : '';
  const mensagem = typeof body.mensagem === 'string' ? body.mensagem.trim() : '';
  const contato = typeof body.contato === 'string' ? body.contato.trim().slice(0, MAX_CONTATO) : '';

  if (!slug) {
    res.status(400).json({ error: 'sem-produto' });
    return;
  }
  if (!motivo) {
    res.status(400).json({ error: 'motivo-invalido', disponiveis: Object.keys(MOTIVOS) });
    return;
  }
  if (mensagem.length < MIN_MENSAGEM) {
    res.status(400).json({ error: 'mensagem-curta', minimo: MIN_MENSAGEM });
    return;
  }
  if (mensagem.length > MAX_MENSAGEM) {
    res.status(400).json({ error: 'mensagem-longa', maximo: MAX_MENSAGEM });
    return;
  }

  const site = createClient(siteUrl, siteKey);

  // O produto tem que existir: um relato preso a um slug inventado seria uma
  // linha que ninguém consegue abrir na Central.
  const { data: produtoData } = await site
    .from('produtos')
    .select('slug, nome, erp_sku')
    .eq('slug', slug)
    .maybeSingle();
  const produto = produtoData as { slug: string; nome: string | null; erp_sku: string | null } | null;
  if (!produto) {
    res.status(404).json({ error: 'produto-nao-encontrado' });
    return;
  }

  const ipHash = hashIp(req);
  if (await excedeuLimite(site, ipHash)) {
    res.status(429).json({ error: 'muitos-envios', porHora: MAX_POR_HORA });
    return;
  }

  // Sessão é bônus, não requisito.
  const { userId } = await resolverPapelDetalhado(site, req.headers.authorization);
  let contatoFinal = contato;
  if (!contatoFinal && userId) {
    const { data } = await site.from('user_profiles').select('email').eq('id', userId).maybeSingle();
    contatoFinal = (data as { email?: string } | null)?.email ?? '';
  }

  let imagemPath: string | null = null;
  if (body.imagem && typeof body.imagem === 'object') {
    const resultado = await guardarImagem(site, body.imagem as Record<string, unknown>, slug);
    if ('erro' in resultado) {
      res.status(400).json({ error: resultado.erro });
      return;
    }
    // Caminho vazio = o upload falhou mas o relato continua valendo.
    imagemPath = resultado.caminho || null;
  }

  const aberta = await abrirOcorrencia(site, {
    categoria: 'problema',
    tipo: 'problema-produto',
    titulo: `${produto.nome ?? slug} — ${MOTIVOS[motivo]}`,
    detalhe: { motivo },
    produtoSlug: slug,
    erpSku: produto.erp_sku,
    // Sem chave de dedupe: cada relato é um relato. Duas pessoas reclamando da
    // mesma foto são duas informações, não uma repetida.
    userId,
    contato: contatoFinal || null,
    mensagem,
    imagemPath,
    url: typeof body.url === 'string' ? body.url.slice(0, 500) : null,
    userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null,
    ipHash,
  });

  if (aberta === 'falhou') {
    res.status(500).json({ error: 'nao-consegui-registrar' });
    return;
  }
  res.status(200).json({ ok: true });
}

// ------------------------------------------------------------------ util

async function guardarImagem(
  site: Db,
  imagem: Record<string, unknown>,
  slug: string
): Promise<{ caminho: string } | { erro: string }> {
  const tipo = typeof imagem.tipo === 'string' ? imagem.tipo : '';
  const ext = TIPOS_IMAGEM[tipo];
  if (!ext) return { erro: 'imagem-tipo-invalido' };

  const base64 = typeof imagem.base64 === 'string' ? imagem.base64 : '';
  if (!base64) return { erro: 'imagem-vazia' };

  let bytes: Buffer;
  try {
    bytes = Buffer.from(base64, 'base64');
  } catch {
    return { erro: 'imagem-invalida' };
  }
  if (!bytes.length) return { erro: 'imagem-vazia' };
  if (bytes.length > MAX_IMAGEM_BYTES) return { erro: 'imagem-grande-demais' };

  // Caminho por ano só para a pasta não virar um diretório com 10 mil arquivos.
  const nome = `${new Date().getFullYear()}/${slug.slice(0, 60)}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await site.storage.from('ocorrencias').upload(nome, bytes, { contentType: tipo, upsert: false });
  if (error) {
    console.warn('[ocorrencias] upload falhou:', error.message);
    // A imagem é acessório: o texto do relato vale mesmo sem ela.
    return { caminho: '' };
  }
  return { caminho: nome };
}

/**
 * sha256(ip + salt). Serve para contar envios da mesma origem, não para saber
 * quem é: sem o salt (que só existe no servidor) o hash não volta a ser IP.
 */
function hashIp(req: VercelRequest): string {
  const bruto = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(bruto) ? bruto[0] : bruto || '').split(',')[0].trim() || 'desconhecido';
  const sal = process.env.OCORRENCIAS_SALT || process.env.CRON_SECRET || 'nz';
  return createHash('sha256').update(`${ip}|${sal}`).digest('hex');
}

async function excedeuLimite(site: Db, ipHash: string): Promise<boolean> {
  const desde = new Date(Date.now() - 3600_000).toISOString();
  const { count, error } = await site
    .from('ocorrencias')
    .select('id', { count: 'exact', head: true })
    .eq('tipo', 'problema-produto')
    .eq('ip_hash', ipHash)
    .gte('criado_em', desde);
  // Falha ao contar não pode bloquear quem quer avisar de um problema real.
  if (error) return false;
  return (count ?? 0) >= MAX_POR_HORA;
}

function safeJson(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
