import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

/**
 * Tipos compartilhados pelo Plano e pelo Calendar overlay.
 * Mantidos num arquivo .ts (sem JSX) pra ser importável de qualquer lugar.
 */

export interface CalendarFeed {
  id: string;
  label: string;
  ics_url: string;
  color: string;
  enabled: boolean;
  created_at: string;
}

export interface ExternalEvent {
  /** YYYY-MM-DD — data de início. Hora ignorada na visualização (read-only MVP). */
  date: string;
  title: string;
  feedId: string;
  feedLabel: string;
  feedColor: string;
}

/* ─── Parser iCal mínimo ─── */

function unescapeICal(text: string): string {
  return text
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

/**
 * Une linhas folded (RFC 5545: linhas começando com space ou tab continuam
 * a anterior). Sem isso, SUMMARY ou DTSTART quebrados em múltiplas linhas
 * são parseados errado.
 */
function unfoldLines(text: string): string[] {
  const raw = text.split(/\r?\n/);
  const out: string[] = [];
  for (const line of raw) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && out.length > 0) {
      out[out.length - 1] += line.slice(1);
    } else {
      out.push(line);
    }
  }
  return out;
}

/** Extrai YYYY-MM-DD dos primeiros 8 dígitos da parte após o ":". */
function extractDate(line: string): string | null {
  const colonIdx = line.indexOf(':');
  if (colonIdx === -1) return null;
  const value = line.slice(colonIdx + 1).trim();
  const m = value.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

export function parseICal(text: string, feed: CalendarFeed): ExternalEvent[] {
  if (!text) return [];
  const lines = unfoldLines(text);

  const events: ExternalEvent[] = [];
  let inEvent = false;
  let summary = '';
  let date: string | null = null;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      summary = '';
      date = null;
      continue;
    }
    if (line === 'END:VEVENT') {
      if (inEvent && date && summary) {
        events.push({
          date,
          title: summary,
          feedId: feed.id,
          feedLabel: feed.label,
          feedColor: feed.color,
        });
      }
      inEvent = false;
      continue;
    }
    if (!inEvent) continue;
    if (line.startsWith('SUMMARY')) {
      const colonIdx = line.indexOf(':');
      if (colonIdx >= 0) summary = unescapeICal(line.slice(colonIdx + 1).trim());
    } else if (line.startsWith('DTSTART')) {
      date = extractDate(line);
    }
  }
  return events;
}

/* ─── Hook: carrega feeds do Supabase + fetcha .ics + agrupa por data ─── */

export interface CalendarFeedsState {
  feeds: CalendarFeed[];
  /** Map<YYYY-MM-DD, ExternalEvent[]> — todos os eventos enabled, agrupados por data. */
  events: Map<string, ExternalEvent[]>;
  loading: boolean;
  /** Erros por feed (chave = feedId). Útil pra exibir warning no FeedManager. */
  errors: Record<string, string>;
  reload: () => Promise<void>;
}

export function useCalendarFeeds(): CalendarFeedsState {
  const [feeds, setFeeds] = useState<CalendarFeed[]>([]);
  const [events, setEvents] = useState<Map<string, ExternalEvent[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reload = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('calendar_feeds')
      .select('*')
      .order('label', { ascending: true });

    if (error) {
      setLoading(false);
      // Tabela pode não existir ainda — não popula nada, deixa quieto.
      return;
    }

    const allFeeds = (data || []) as CalendarFeed[];
    setFeeds(allFeeds);

    const enabledFeeds = allFeeds.filter((f) => f.enabled);
    const eventsByDate = new Map<string, ExternalEvent[]>();
    const newErrors: Record<string, string> = {};

    await Promise.all(
      enabledFeeds.map(async (feed) => {
        try {
          const r = await fetch(feed.ics_url);
          if (!r.ok) {
            newErrors[feed.id] = `HTTP ${r.status}`;
            return;
          }
          const txt = await r.text();
          const evts = parseICal(txt, feed);
          for (const e of evts) {
            const arr = eventsByDate.get(e.date) || [];
            arr.push(e);
            eventsByDate.set(e.date, arr);
          }
        } catch (err) {
          newErrors[feed.id] = err instanceof Error ? err.message : 'Erro de fetch';
        }
      })
    );

    setEvents(eventsByDate);
    setErrors(newErrors);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { feeds, events, loading, errors, reload };
}
