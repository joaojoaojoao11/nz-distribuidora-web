import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * GET /api/agenda/fetch-ical?url=<encoded-url>
 *
 * Proxy server-side pra URLs .ics de calendários externos. Existe porque
 * provedores como Google Calendar não servem o .ics com CORS aberto pra
 * browsers, mas funciona perfeitamente fetched via servidor.
 *
 * Validação anti-SSRF: só aceita hosts conhecidos de iCal (calendar.google.com,
 * outlook.*, etc). Bloqueia qualquer outra URL.
 *
 * Auth: o usuário já precisa estar autenticado no admin pra abrir o
 * FeedManager (RLS na tabela calendar_feeds), então confiamos no contexto.
 * Não exigimos token aqui pra simplificar — o pior que alguém pode fazer
 * é fetchar URLs públicas/próprias do Google Calendar via nossa rota.
 */

const ALLOWED_HOSTS = new Set([
  'calendar.google.com',
  'www.google.com',
  'outlook.live.com',
  'outlook.office.com',
  'outlook.office365.com',
  'p01-calendarws.icloud.com',
  'p02-calendarws.icloud.com',
  'p03-calendarws.icloud.com',
  'p04-calendarws.icloud.com',
  'p05-calendarws.icloud.com',
  'p06-calendarws.icloud.com',
  'p07-calendarws.icloud.com',
  'p08-calendarws.icloud.com',
  'p09-calendarws.icloud.com',
  'p10-calendarws.icloud.com',
  'p100-caldav.icloud.com',
]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).json({});
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  const target = req.query.url;
  if (typeof target !== 'string' || !target.trim()) {
    res.status(400).json({ error: 'Parâmetro "url" ausente.' });
    return;
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    res.status(400).json({ error: 'URL inválida.' });
    return;
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    res.status(400).json({ error: `Protocolo "${parsed.protocol}" não permitido.` });
    return;
  }

  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    res.status(400).json({
      error: `Host "${parsed.hostname}" não está na lista de calendários suportados (Google, Outlook, iCloud).`,
    });
    return;
  }

  try {
    const r = await fetch(target, { redirect: 'follow' });
    if (!r.ok) {
      res.status(502).json({ error: `Origem respondeu HTTP ${r.status}.` });
      return;
    }
    const text = await r.text();
    // Devolve o conteúdo bruto pra ser parseado client-side (mesma lógica
    // do hook useCalendarFeeds), evitando duplicar o parser no servidor.
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Cache-Control', 'private, max-age=60');
    res.status(200).send(text);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro de fetch.';
    res.status(500).json({ error: msg });
  }
}
