import { useEffect, useRef, useCallback } from 'react';
import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';

const generateSessionId = (): string => {
  const stored = sessionStorage.getItem('nz_session_id');
  if (stored) return stored;
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  sessionStorage.setItem('nz_session_id', id);
  return id;
};

const getFingerprint = (): string => {
  const nav = navigator;
  const raw = `${nav.userAgent}|${screen.width}x${screen.height}|${nav.language}|${new Date().getTimezoneOffset()}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(i);
    hash |= 0;
  }
  return `fp_${Math.abs(hash).toString(36)}`;
};

let lastClickTime = 0;
let geoCache: { country?: string; city?: string; latitude?: number; longitude?: number } | null = null;

async function fetchGeo() {
  if (geoCache) return geoCache;
  try {
    const res = await fetch('https://ip-api.com/json/?fields=status,country,city,lat,lon', { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    if (data.status === 'success') {
      geoCache = { country: data.country, city: data.city, latitude: data.lat, longitude: data.lon };
    }
  } catch { /* silent */ }
  return geoCache || {};
}

export function useAnalytics() {
  const sessionId = useRef(generateSessionId());
  const sessionStart = useRef(Date.now());
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
