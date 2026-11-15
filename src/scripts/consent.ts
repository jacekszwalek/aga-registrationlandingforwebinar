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

const isProduction = () => eventConfig.analytics.productionHosts.includes(location.hostname);

/** Microsoft Clarity – oficjalny loader (kolejka + skrypt) z tagami do filtrowania nagrań. */
function loadClarity(id: string): void {
  type Q = ((...args: unknown[]) => void) & { q?: unknown[] };
  const w = window as unknown as { clarity?: Q };
  w.clarity =
    w.clarity ||
    (function (...args: unknown[]) {
      (w.clarity!.q = w.clarity!.q || []).push(args);
    } as Q);
  injectScript(`https://www.clarity.ms/tag/${id}`);
  const d = document.documentElement;
  const version = (location.pathname.match(/\/(v\d)\//) || [])[1] ?? 'root';
  w.clarity('consent'); // zgoda została już udzielona – inaczej skrypt by się nie załadował
  w.clarity('set', 'webinar_id', eventConfig.id);
  w.clarity('set', 'landing_version', version);
  w.clarity('set', 'event_state', d.dataset.state || '');
  w.clarity('set', 'headline_variant', d.dataset.variant || '');
  w.clarity('set', 'environment', isProduction() ? 'production' : 'preview');
}

/**
 * Ładuje skrypty stron trzecich – wyłącznie po zgodzie.
 * GA4 i Meta Pixel tylko na domenie produkcyjnej (podgląd nie zaśmieca danych),
 * Clarity także na podglądzie, jeśli clarityOnPreview = true.
 */
function loadThirdParty(): void {
  const a = eventConfig.analytics;
  if (loaded || !a.enabled) return;
  loaded = true;

  if (isProduction()) {
    injectScript(`https://www.googletagmanager.com/gtag/js?id=${a.ga4Id}`);
    window.gtag?.('js', new Date());
    window.gtag?.('config', a.ga4Id);

    // Meta Pixel – standardowy loader w wersji bez inline eval.
    const fbq = function (...args: unknown[]) {
      (fbq as unknown as { queue: unknown[] }).queue.push(args);
    } as unknown as Window['fbq'] & { queue: unknown[]; loaded: boolean; version: string; callMethod?: unknown };
    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = '2.0';
    window.fbq = fbq;
    injectScript('https://connect.facebook.net/en_US/fbevents.js');
    window.fbq?.('init', a.metaPixelId);
    window.fbq?.('track', 'PageView');
  }

  if (a.clarityId && (isProduction() || a.clarityOnPreview)) loadClarity(a.clarityId);
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
  else if (banner.hasAttribute('data-consent-defer')) {
    // v5: pierwszy ekran telefonu należy do formularza – baner pojawia się po pierwszym przewinięciu.
    // Do tego czasu nic się nie ładuje (domyślna odmowa), więc zgoda nie jest pomijana.
    const onScroll = () => {
      if (window.scrollY < 80) return;
      window.removeEventListener('scroll', onScroll);
      show();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  } else show();

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
