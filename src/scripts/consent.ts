import { eventConfig } from '../config/event.config';

const KEY = 'pzz_consent_v1';
type Decision = 'granted' | 'denied';

function read(): Decision | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
}

function write(v: Decision): void {
  try {
    localStorage.setItem(KEY, v);
  } catch {
    /* tryb prywatny – decyzja obowiązuje do końca wizyty */
  }
}

function injectScript(src: string): void {
  const s = document.createElement('script');
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

let loaded = false;
/** Ładuje skrypty stron trzecich – wyłącznie po zgodzie i tylko gdy analityka jest włączona w konfiguracji. */
function loadThirdParty(): void {
  if (loaded || !eventConfig.analytics.enabled) return;
  loaded = true;
  const { ga4Id, metaPixelId, clarityId } = eventConfig.analytics;
  injectScript(`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`);
  window.gtag?.('js', new Date());
  window.gtag?.('config', ga4Id);

  // Meta Pixel – standardowy loader w wersji bez inline eval.
  const fbq = function (...args: unknown[]) {
    (fbq as unknown as { queue: unknown[] }).queue.push(args);
  } as unknown as Window['fbq'] & { queue: unknown[]; loaded: boolean; version: string; callMethod?: unknown };
  fbq.queue = [];
  fbq.loaded = true;
  fbq.version = '2.0';
  window.fbq = fbq;
  injectScript('https://connect.facebook.net/en_US/fbevents.js');
  window.fbq?.('init', metaPixelId);
  window.fbq?.('track', 'PageView');

  if (clarityId) injectScript(`https://www.clarity.ms/tag/${clarityId}`);
  document.dispatchEvent(new CustomEvent('pzz:analytics-ready'));
}

function apply(v: Decision): void {
  const g = v === 'granted' ? 'granted' : 'denied';
  window.gtag?.('consent', 'update', {
    ad_storage: g,
    ad_user_data: g,
    ad_personalization: g,
    analytics_storage: g,
  });
  if (v === 'granted') loadThirdParty();
  document.dispatchEvent(new CustomEvent('pzz:consent', { detail: v }));
}

export function hasConsent(): boolean {
  return read() === 'granted';
}

export function initConsent(): void {
  const banner = document.querySelector<HTMLElement>('[data-consent-banner]');
  if (!banner) return;
  const root = document.documentElement;
  const ro = new ResizeObserver(() => {
    root.style.setProperty('--consent-h', banner.hidden ? '0px' : `${banner.offsetHeight}px`);
  });

  const show = () => {
    banner.hidden = false;
    ro.observe(banner);
    root.style.setProperty('--consent-h', `${banner.offsetHeight}px`);
  };
  const hide = () => {
    banner.hidden = true;
    ro.disconnect();
    root.style.setProperty('--consent-h', '0px');
  };

  const existing = read();
  if (existing) apply(existing);
  else show();

  banner.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-consent]');
    if (!btn) return;
    const v = btn.dataset.consent as Decision;
    write(v);
    apply(v);
    hide();
  });

  document.querySelectorAll('[data-consent-open]').forEach((el) =>
    el.addEventListener('click', () => {
      show();
      banner.querySelector<HTMLButtonElement>('[data-consent="denied"]')?.focus();
    }),
  );
}
