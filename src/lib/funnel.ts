/**
 * Licznik etapów bez cookies (czyste funkcje – testy w tests/unit/funnel.test.ts).
 * Do serwera (api/track.php) trafia tylko nazwa zdarzenia, rodzaj strony, UTM-y wejścia,
 * typ urządzenia i aplikacji oraz losowy identyfikator TEGO wczytania strony (trzymany w pamięci,
 * nie w przeglądarce). Bez adresu IP, e-maila, imienia i ciasteczek.
 */
export interface FunnelPayload {
  e: string; // zdarzenie
  v: string; // identyfikator wczytania strony
  p: string; // landing | dziekuje | archiwum | inna
  st?: string; // stan wydarzenia (before/during/after)
  s?: string;
  m?: string;
  c?: string;
  ct?: string;
  d: 'mobile' | 'desktop';
  a: 'facebook' | 'instagram' | 'inna';
  f?: string; // pole (błędy formularza)
  r?: string; // powód (błędy formularza)
}

/** Ścieżka strony (bez base) → rodzaj strony. */
export function pageKind(pathname: string, base = '/'): string {
  const b = base.replace(/\/+$/, '');
  const rest = (pathname.startsWith(b) ? pathname.slice(b.length) : pathname).replace(/^\/+|\/+$/g, '').replace(/index\.html$/, '');
  if (rest === '') return 'landing';
  if (rest === 'dziekuje') return 'dziekuje';
  if (rest.startsWith('archived/')) return 'archiwum';
  return 'inna';
}

/** Przeglądarka wbudowana w aplikację (reklamy Meta otwierają się w niej). */
export function appKind(ua: string): FunnelPayload['a'] {
  if (/Instagram/i.test(ua)) return 'instagram';
  if (/FBAN|FBAV|FB_IAB|FBIOS|FB4A/i.test(ua)) return 'facebook';
  return 'inna';
}

export function deviceKind(ua: string, width: number): FunnelPayload['d'] {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(ua) || width < 768 ? 'mobile' : 'desktop';
}

const clean = (v: unknown, max = 60): string | undefined => {
  const s = String(v ?? '').toLowerCase().replace(/[^a-z0-9_.-]/g, '').slice(0, max);
  return s || undefined;
};

/** Zdarzenia, które liczymy (reszta zostaje tylko w GA4/Clarity po zgodzie). */
export const FUNNEL_EVENTS = [
  'page_view', 'scroll_50', 'scroll_90', 'sticky_cta_click', 'form_open', 'form_start',
  'form_submit_attempt', 'form_error', 'signup', 'generate_lead', 'newsletter_signup',
  'add_to_calendar', 'consultation_click', 'logo_click', 'share_click',
] as const;

export function buildPayload(input: {
  event: string;
  pageId: string;
  pathname: string;
  base: string;
  ua: string;
  width: number;
  state?: string;
  utm: Record<string, string>;
  params?: Record<string, unknown>;
}): FunnelPayload | null {
  if (!(FUNNEL_EVENTS as readonly string[]).includes(input.event)) return null;
  const p: FunnelPayload = {
    e: input.event,
    v: clean(input.pageId, 16) ?? 'x',
    p: pageKind(input.pathname, input.base),
    st: clean(input.state, 10),
    s: clean(input.utm.utm_source),
    m: clean(input.utm.utm_medium),
    c: clean(input.utm.utm_campaign),
    ct: clean(input.utm.utm_content),
    d: deviceKind(input.ua, input.width),
    a: appKind(input.ua),
    f: clean(input.params?.field, 20),
    r: clean(input.params?.reason, 30),
  };
  for (const k of Object.keys(p) as Array<keyof FunnelPayload>) if (p[k] === undefined) delete p[k];
  return p;
}
