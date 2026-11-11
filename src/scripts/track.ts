/**
 * Jedno wejście dla zdarzeń analitycznych. Zdarzenia trafiają do kolejki dataLayer
 * (Consent Mode v2 – GA4 przetworzy je dopiero po zgodzie) oraz do window.__events,
 * z którego korzystają testy. Pixel istnieje dopiero po zgodzie.
 */
type Params = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    __events?: Array<{ name: string } & Params>;
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
    __pzzSessions?: Array<[number, number]>;
  }
}

const META_EVENTS: Record<string, string> = { generate_lead: 'Lead' };

export function context(): Params {
  const d = document.documentElement;
  return { event_state: d.dataset.state, headline_variant: d.dataset.variant };
}

export function track(name: string, params: Params = {}): void {
  const payload = { ...context(), ...params };
  (window.__events ??= []).push({ name, ...payload });
  window.gtag?.('event', name, payload);
  const meta = META_EVENTS[name];
  if (meta) window.fbq?.('track', meta, payload);
  else window.fbq?.('trackCustom', name, payload);
}

export function trackOnce(name: string, params: Params = {}): void {
  const key = `__once_${name}`;
  const w = window as unknown as Record<string, boolean>;
  if (w[key]) return;
  w[key] = true;
  track(name, params);
}
