import { eventConfig } from '../config/event.config';
import { withBase } from '../lib/paths';
import { extractUtm } from '../lib/utm';
import { botSignals, buildPayload } from '../lib/funnel';

/**
 * Licznik etapów bez cookies: wysyła zdarzenia do naszego serwera (api/track.php) niezależnie od zgody
 * na cookies – bez danych osobowych i bez zapisywania czegokolwiek w przeglądarce. Tylko w wydaniu.
 * Panel: /webinar/licznik/ (docs/licznik.md).
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

/**
 * Wejście na stronę – raz na wczytanie, ale dopiero gdy strona jest WIDOCZNA.
 * Instagram i Facebook wczytują stronę z reklamy w tle (preload), zanim ktoś kliknie –
 * takie wczytanie liczymy osobno (page_preload), a page_view dopiero po pokazaniu strony.
 * „engaged” = pierwszy dotyk, kliknięcie, klawisz albo przewinięcie (człowiek, nie wczytanie w tle).
 */
function start(): void {
  const bot = botSignals({
    webdriver: navigator.webdriver,
    ua: navigator.userAgent,
    languages: navigator.languages,
    screenW: screen.width,
    innerW: window.innerWidth,
  });
  const hidden = document.visibilityState === 'hidden' || (document as Document & { prerendering?: boolean }).prerendering === true;
  if (!hidden) funnel('page_view', { bot });
  else {
    funnel('page_preload', { bot });
    const onShow = () => {
      if (document.visibilityState !== 'visible') return;
      document.removeEventListener('visibilitychange', onShow);
      document.removeEventListener('prerenderingchange', onShow);
      funnel('page_view', { bot });
    };
    document.addEventListener('visibilitychange', onShow);
    document.addEventListener('prerenderingchange', onShow);
  }
  let engaged = false;
  const onEngage = () => {
    if (engaged || document.visibilityState !== 'visible') return;
    engaged = true;
    funnel('engaged');
    ['pointerdown', 'touchstart', 'keydown', 'scroll'].forEach((t) => window.removeEventListener(t, onEngage));
  };
  ['pointerdown', 'touchstart', 'keydown', 'scroll'].forEach((t) => window.addEventListener(t, onEngage, { passive: true }));

  // Czas, przez który strona była WIDOCZNA (karta w tle się nie liczy): 10 s i 30 s.
  let visibleMs = 0;
  const timer = window.setInterval(() => {
    if (document.visibilityState !== 'visible') return;
    visibleMs += 1000;
    if (visibleMs === 10_000) funnel('stay_10s');
    if (visibleMs === 30_000) {
      funnel('stay_30s');
      window.clearInterval(timer);
    }
  }, 1000);
}
if (enabled) start();
