import { eventConfig } from '../config/event.config';
import { withBase } from '../lib/paths';
import { extractUtm } from '../lib/utm';
import { buildPayload } from '../lib/funnel';

/**
 * Licznik etapów bez cookies: wysyła zdarzenia do naszego serwera (api/track.php) niezależnie od zgody
 * na cookies – bez danych osobowych i bez zapisywania czegokolwiek w przeglądarce. Tylko w wydaniu.
 * Panel: /webinar/licznik-webinar/ (docs/licznik.md).
 */
const enabled = eventConfig.funnel.enabled && typeof navigator !== 'undefined';
const pageId = Math.random().toString(36).slice(2, 12);

function utm(): Record<string, string> {
  const fromUrl = extractUtm(location.search);
  if (Object.keys(fromUrl).length) return fromUrl;
  try {
    // Zapisane przez formularz przy wejściu (sessionStorage, tylko ta karta) – na /dziekuje/ nie ma UTM-ów w adresie.
    return JSON.parse(sessionStorage.getItem('pzz_utm') || '{}');
  } catch {
    return {};
  }
}

export function funnel(event: string, params: Record<string, unknown> = {}): void {
  if (!enabled) return;
  const payload = buildPayload({
    event,
    pageId,
    pathname: location.pathname,
    base: import.meta.env.BASE_URL,
    ua: navigator.userAgent,
    width: window.innerWidth,
    state: document.documentElement.dataset.state,
    utm: utm(),
    params,
  });
  if (!payload) return;
  const url = withBase('api/track.php');
  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon?.(url, new Blob([body], { type: 'text/plain' }))) return;
  } catch {
    /* przechodzimy do fetch */
  }
  fetch(url, { method: 'POST', body, keepalive: true, headers: { 'content-type': 'text/plain' } }).catch(() => {});
}

// Wejście na stronę – raz na wczytanie (moduł ładuje się raz).
if (enabled) funnel('page_view');
