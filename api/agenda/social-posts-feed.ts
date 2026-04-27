import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'node:crypto';

/**
 * GET /api/agenda/social-posts-feed?token=<secret>
 *
 * Feed iCal (RFC 5545) que expõe posts da tabela social_posts como
 * eventos all-day. Pensado pra ser subscribed pelo Google Calendar
 * via "Outras agendas → Adicionar pelo URL". Read-only do lado do Google.
 *
 * Auth: query param `token` comparado em tempo constante com env var
 * AGENDA_FEED_TOKEN. Token via query porque Google Calendar não envia
 * headers customizados ao subscribe de URL.
 *
 * Cache-Control: max-age=300 protege contra refresh stampede caso
 * múltiplos clientes consultem; o Google cacheia subscribed feeds com
 * TTL próprio (6-24h) — não há como acelerar isso.
 *
 * Geração do AGENDA_FEED_TOKEN:
 *   openssl rand -hex 32
 * Configurar em .env (local) e em Vercel → Settings → Environment Variables
 * (Production, Preview, Development).
 */

type Account = 'nzppf' | 'nzgroup' | 'joaowrap';
type Status = 'backlog' | 'em_producao' | 'pronto' | 'agendado' | 'postado';

type Post = {
  id: string;
  account: Account;
  title: string;
  caption: string | null;
  notes: string | null;
  status: Status;
  format: string | null;
  pillar: string | null;
  scheduled_for: string; // 'YYYY-MM-DD'
  updated_at: string;    // ISO timestamptz
};

/* ─── Helpers de serialização RFC 5545 ─── */

/**
 * Escape de valor de texto pro padrão RFC 5545 §3.3.11:
 * - `\` → `\\`  (precisa vir primeiro pra não duplicar escapes posteriores)
 * - `;` → `\;`
 * - `,` → `\,`
 * - `\r` removido (CR sozinho não faz parte do conteúdo lógico)
 * - `\n` literal → `\n` escapado (literalmente as duas chars `\` e `n`)
 */
function escapeText(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r/g, '')
    .replace(/\n/g, '\\n');
}

/**
 * Line folding RFC 5545 §3.1: linha lógica com até 75 octets.
 * Continuações começam com 1 espaço.
 *
 * Conta BYTES (UTF-8), não chars — caracteres acentuados em caption
 * podem fazer a linha estourar antes do esperado em chars.
 *
 * Retorna a linha já com `\r\n ` entre as continuações. O caller depois
 * junta as linhas lógicas com `\r\n` adicional, produzindo um arquivo
 * RFC-conforme.
 */
function foldLine(line: string): string {
  const enc = new TextEncoder();
  const dec = new TextDecoder('utf-8');
  const bytes = enc.encode(line);
  if (bytes.length <= 75) return line;

  const segments: string[] = [];
  let cursor = 0;
  while (cursor < bytes.length) {
    const remaining = bytes.length - cursor;
    // Primeira linha: 75 octets. Continuações: 74 (1 octet pro espaço de prefixo).
    const limit = segments.length === 0 ? 75 : 74;
    let take = Math.min(limit, remaining);

    // Não cortar no meio de um caractere multi-byte UTF-8: recuar enquanto
    // o byte em `cursor + take` for um continuation byte (10xxxxxx).
    if (cursor + take < bytes.length) {
      while (take > 0 && (bytes[cursor + take] & 0xc0) === 0x80) {
        take--;
      }
    }

    segments.push(dec.decode(bytes.slice(cursor, cursor + take)));
    cursor += take;
  }
  return segments.join('\r\n ');
}

/** 'YYYY-MM-DD' → 'YYYYMMDD'. Sem parsear pra Date pra evitar timezone shift. */
function toDateOnly(dateStr: string): string {
  return dateStr.replace(/-/g, '');
}

/** ISO timestamp → 'YYYYMMDDTHHMMSSZ' UTC. */
function toUTCStamp(iso: string): string {
  return new Date(iso)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

/* ─── Gerador iCal (puro) ─── */

function buildICal(posts: Post[]): string {
  const lines: string[] = [];
  const push = (line: string) => { lines.push(foldLine(line)); };

  push('BEGIN:VCALENDAR');
  push('VERSION:2.0');
  push('PRODID:-//NZ Distribuidora//Agenda Social Posts//PT-BR');
  push('CALSCALE:GREGORIAN');
  push('METHOD:PUBLISH');
  push('X-WR-CALNAME:NZ Agenda Social');
  push('X-WR-TIMEZONE:America/Sao_Paulo');

  for (const p of posts) {
    const summary = `[${p.account}] ${p.title}`;

    const descChunks: string[] = [];
    if (p.caption && p.caption.trim()) descChunks.push(p.caption.trim());
    if (p.notes && p.notes.trim()) descChunks.push(p.notes.trim());
    const meta = [
      `Formato: ${p.format ?? '—'}`,
      `Pilar: ${p.pillar ?? '—'}`,
      `Status: ${p.status}`,
    ].join('\n');
    descChunks.push(meta);
    const description = descChunks.join('\n\n');

    push('BEGIN:VEVENT');
    push(`UID:nz-social-${p.id}@nz-distribuidora-web.vercel.app`);
    push(`DTSTAMP:${toUTCStamp(p.updated_at)}`);
    push(`DTSTART;VALUE=DATE:${toDateOnly(p.scheduled_for)}`);
    push(`SUMMARY:${escapeText(summary)}`);
    push(`DESCRIPTION:${escapeText(description)}`);
    push(`CATEGORIES:${escapeText(p.account)},${escapeText(p.status)}`);
    push('END:VEVENT');
  }

  push('END:VCALENDAR');
  // Toda linha lógica termina em CRLF; adiciona CRLF final pra fechar o arquivo.
  return lines.join('\r\n') + '\r\n';
}

/* ─── Auth helper: comparação em tempo constante ─── */

function tokensEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  // timingSafeEqual lança se os buffers tiverem tamanhos diferentes.
  // Já curto-circuita aqui pra evitar isso (e também é o que diferencia
  // tokens distintos por tamanho — sem leak).
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/* ─── Handler ─── */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }

  const expectedToken = process.env.AGENDA_FEED_TOKEN;
  if (!expectedToken) {
    res.status(500).json({ error: 'AGENDA_FEED_TOKEN não configurado' });
    return;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    res.status(500).json({
      error: 'ENV ausente',
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceRoleKey: !!serviceKey,
    });
    return;
  }

  const tokenParam = req.query.token;
  const token = typeof tokenParam === 'string' ? tokenParam : '';
  if (!token) {
    res.status(401).json({ error: 'Token ausente' });
    return;
  }
  if (!tokensEqual(token, expectedToken)) {
    res.status(401).json({ error: 'Token inválido' });
    return;
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const { data, error } = await supabase
    .from('social_posts')
    .select('id, account, title, caption, notes, status, format, pillar, scheduled_for, updated_at')
    .not('scheduled_for', 'is', null)
    .order('scheduled_for', { ascending: true });

  if (error) {
    res.status(500).json({
      error: 'Falha ao consultar social_posts',
      details: error.message,
    });
    return;
  }

  const body = buildICal((data || []) as Post[]);

  // Usar res.writeHead() (Node http nativo) em vez de .status().send().
  // O wrapper @vercel/node força 'application/json' em .send(string), e
  // setHeader+end também caiu nessa armadilha em produção. writeHead
  // escreve status+headers atomicamente, sem wrapper interferir.
  // Google Calendar precisa de 'text/calendar' senão ignora o feed.
  res.writeHead(200, {
    'Content-Type': 'text/calendar; charset=utf-8',
    'Cache-Control': 'public, max-age=300, s-maxage=300',
  });
  res.end(body);
}
