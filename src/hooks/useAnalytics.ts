import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';

const generateSessionId = (): string => {
  const stored = sessionStorage.getItem('nz_session_id');
  if (stored) return stored;
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  sessionStorage.setItem('nz_session_id', id);
  return id;
};

let lastClickTime = 0;

type Geo = { country?: string; city?: string; latitude?: number; longitude?: number };

const CHAVE_GEO = 'nz_geo';
let geoCache: Geo | null = null;
let geoEmVoo: Promise<Geo> | null = null;

/**
 * De onde o visitante está acessando.
 *
 * Antes isto chamava `https://ip-api.com/json/` direto do navegador. O plano
 * gratuito do ip-api **não atende HTTPS**: devolvia 403 em toda visita, e o
 * mapa do painel ficou 17.004 eventos sem um único ponto. Agora quem responde é
 * `/api/nz/geo`, lendo os cabeçalhos que a Vercel já manda de graça — sem
 * chave, sem terceiro e sem expor o IP do visitante para fora.
 *
 * Uma chamada por sessão: o resultado fica em `sessionStorage`, então nem
 * recarregar a página repete. Falhou, fica sem geo — analytics nunca pode
 * atrapalhar o site.
 */
async function fetchGeo(): Promise<Geo> {
  if (geoCache) return geoCache;
  try {
    const guardado = sessionStorage.getItem(CHAVE_GEO);
    if (guardado) {
      geoCache = JSON.parse(guardado) as Geo;
      return geoCache;
    }
  } catch { /* sessionStorage bloqueado: segue sem cache */ }

  // Duas páginas abrindo juntas não devem virar duas chamadas.
  geoEmVoo ??= (async () => {
    try {
      const res = await fetch('/api/nz/geo', { signal: AbortSignal.timeout(3000) });
      if (!res.ok) return {};
      const d = (await res.json()) as { disponivel?: boolean; country?: string | null; city?: string | null; latitude?: number | null; longitude?: number | null };
      if (!d.disponivel) return {};
      const geo: Geo = {
        country: d.country ?? undefined,
        city: d.city ?? undefined,
        latitude: d.latitude ?? undefined,
        longitude: d.longitude ?? undefined,
      };
      try {
        sessionStorage.setItem(CHAVE_GEO, JSON.stringify(geo));
      } catch { /* idem */ }
      return geo;
    } catch {
      return {};
    }
  })();

  geoCache = await geoEmVoo;
  geoEmVoo = null;
  return geoCache;
}

export function useAnalytics() {
  const sessionId = useRef(generateSessionId());
  // `useRef(Date.now())` chamaria uma função impura durante o render, o que o
  // React 19 proíbe: o valor mudaria a cada redesenho antes de o ref pegar.
  // O inicializador do useState roda uma vez só.
  const [inicioDaSessao] = useState(() => Date.now());
  const sessionStart = useRef(inicioDaSessao);
  const pagesViewed = useRef(new Set<string>());

  const trackEvent = useCallback(async (
    eventType: string,
    page: string,
    extra: Record<string, unknown> = {}
  ) => {
    try {
      await supabase.from('analytics_events').insert({
        session_id: sessionId.current,
        event_type: eventType,
        page,
        referrer: document.referrer || null,
        screen_width: window.innerWidth,
        screen_height: window.innerHeight,
        ...extra,
      });
    } catch {
      // silent fail — analytics should never break the site
    }
  }, []);

  useEffect(() => {
    const page = window.location.pathname;
    pagesViewed.current.add(page);

    // Track page view with geo data
    (async () => {
      const geo = await fetchGeo();
      trackEvent('page_view', page, geo);
    })();

    // Track clicks
    const handleClick = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastClickTime < 1000) return; // throttle 1s
      lastClickTime = now;

      const target = e.target as HTMLElement;
      const x_percent = Math.round((e.clientX / window.innerWidth) * 10000) / 100;
      const y_percent = Math.round(((e.clientY + window.scrollY) / document.documentElement.scrollHeight) * 10000) / 100;

      trackEvent('click', page, {
        x_percent,
        y_percent,
        element_tag: `${target.tagName}.${target.className?.toString().split(' ')[0] || ''}`.slice(0, 100),
      });
    };

    // Track scroll depth
    let maxScroll = 0;
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const depth = Math.round((scrollTop / docHeight) * 100);
      const milestone = Math.floor(depth / 25) * 25;
      if (milestone > maxScroll && milestone <= 100) {
        maxScroll = milestone;
        trackEvent('scroll', page, { scroll_depth: milestone });
      }
    };

    // Track session end
    const handleUnload = () => {
      const duration = Math.round((Date.now() - sessionStart.current) / 1000);
      const data = JSON.stringify({
        session_id: sessionId.current,
        event_type: 'session_end',
        page,
        session_duration: duration,
        pages_viewed: pagesViewed.current.size,
        screen_width: window.innerWidth,
        screen_height: window.innerHeight,
      });
      // Use fetch with keepalive for reliability on page unload (sendBeacon can't set headers)
      const url = `${supabaseUrl}/rest/v1/analytics_events`;
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${supabaseAnonKey}` },
        body: data,
        keepalive: true,
      }).catch(() => {});
    };

    document.addEventListener('click', handleClick);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      document.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [trackEvent]);
}
