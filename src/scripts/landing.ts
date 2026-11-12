import { getCountdown } from '../lib/eventState';
import { plural } from '../lib/format';
import { initConsent } from './consent';
import { initForms } from './form';
import { track, trackOnce } from './track';

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** v3: formularz w oknie dialogowym (wzór Tailwind – przycisk otwiera formularz). */
function formDialog(): HTMLDialogElement | null {
  return document.querySelector<HTMLDialogElement>('dialog[data-form-dialog]');
}

function openFormDialog(source: string): boolean {
  const d = formDialog();
  if (!d) return false;
  if (!d.open) {
    d.showModal();
    track('form_open', { source });
  }
  d.querySelector<HTMLInputElement>('input[name="email"]')?.focus();
  return true;
}

function initFormDialog(): void {
  const d = formDialog();
  if (!d) return;
  document.querySelectorAll<HTMLElement>('[data-open-form]').forEach((b) =>
    b.addEventListener('click', () => openFormDialog(b.dataset.openForm || 'cta')),
  );
  d.querySelector('[data-close-form]')?.addEventListener('click', () => d.close());
  // Klik w tło zamyka okno.
  d.addEventListener('click', (e) => {
    if (e.target === d) d.close();
  });
}

function focusEmail(form: HTMLFormElement): void {
  if (openFormDialog('scroll')) return;
  form.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'center' });
  form.querySelector<HTMLInputElement>('input[name="email"]')?.focus({ preventScroll: true });
}

function initCountdown(): void {
  const el = document.querySelector<HTMLElement>('[data-countdown]');
  const sessions = window.__pzzSessions ?? [];
  if (!el) return;
  const units = ['days', 'hours', 'minutes', 'seconds'] as const;
  const forms: Record<(typeof units)[number], [string, string, string]> = {
    days: ['dzień', 'dni', 'dni'],
    hours: ['godz.', 'godz.', 'godz.'],
    minutes: ['min', 'min', 'min'],
    seconds: ['sek.', 'sek.', 'sek.'],
  };
  const tick = () => {
    const now = Date.now();
    const next = sessions.find(([start]) => now < start);
    if (!next) return;
    const c = getCountdown(now, next[0]);
    for (const u of units) {
      // Niektóre wersje pokazują tylko część jednostek (np. same dni).
      const unit = el.querySelector(`[data-unit="${u}"]`);
      const label = el.querySelector(`[data-label="${u}"]`);
      if (unit) unit.textContent = String(c[u]).padStart(u === 'days' ? 1 : 2, '0');
      if (label) label.textContent = plural(c[u], ...forms[u]);
    }
  };
  tick();
  setInterval(tick, 1000);
}

function initSticky(): void {
  const bar = document.querySelector<HTMLElement>('[data-sticky-cta]');
  const hero = document.querySelector<HTMLFormElement>('#zapis-hero');
  // Kotwica: element, po którego minięciu pojawia się przycisk (domyślnie formularz w hero).
  const anchor = document.querySelector<HTMLElement>('[data-sticky-anchor]') ?? hero;
  // Przycisk chowa się, gdy widać formularz albo inne CTA (np. końcowy blok v2).
  const forms = [...document.querySelectorAll<HTMLElement>('form[data-form-id], [data-sticky-hide], [data-sticky-anchor]')];
  if (!bar || !hero || !anchor) return;
  const visible = new Set<Element>();
  let heroAbove = false;
  const update = () => {
    bar.hidden = !(heroAbove && visible.size === 0);
  };
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) visible.add(e.target);
      else visible.delete(e.target);
      if (e.target === anchor) heroAbove = !e.isIntersecting && e.boundingClientRect.top < 0;
    }
    update();
  });
  forms.forEach((f) => io.observe(f));
  bar.querySelector('[data-sticky-button]')?.addEventListener('click', () => {
    track('sticky_cta_click');
    focusEmail(hero);
  });
}

function initScrollDepth(): void {
  const check = () => {
    const doc = document.documentElement;
    const ratio = (window.scrollY + window.innerHeight) / doc.scrollHeight;
    if (ratio >= 0.5) trackOnce('scroll_50');
    if (ratio >= 0.9) trackOnce('scroll_90');
  };
  window.addEventListener('scroll', check, { passive: true });
}

function initAnchors(): void {
  document.querySelectorAll<HTMLAnchorElement>('[data-scroll-to-form]').forEach((a) =>
    a.addEventListener('click', (e) => {
      const target = document.querySelector<HTMLFormElement>(a.getAttribute('href') || '#zapis-hero');
      if (!target) return;
      e.preventDefault();
      focusEmail(target);
    }),
  );
}

initConsent();
initForms();
initFormDialog();
initCountdown();
initSticky();
initScrollDepth();
initAnchors();
