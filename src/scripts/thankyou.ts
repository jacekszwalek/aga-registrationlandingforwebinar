/** Strona podziękowania (v1 i v2): konwersja po zgodzie, kalendarz, newsletter, udostępnianie. */
import { initConsent, hasConsent } from './consent';
import { eventConfig } from '../config/event.config';
import { track } from './track';
import { referralUrl, consultationLink } from '../lib/utm';
import { withBase } from '../lib/paths';

initConsent();

// Dopóki formularz działa w trybie mock (nic nie zapisuje), na produkcji nie liczymy konwersji –
// inaczej GA4 i Meta dostałyby fałszywe „Lead”.
const fakeLead = eventConfig.form.mode === 'mock' && eventConfig.analytics.productionHosts.includes(location.hostname);

// Konwersja: tylko raz na zapis i tylko po zgodzie na cookies.
const fireLead = () => {
  if (fakeLead) return;
  try {
    const s = JSON.parse(sessionStorage.getItem('pzz_signup') || 'null');
    if (!s?.lead) return;
    sessionStorage.setItem('pzz_signup', JSON.stringify({ ...s, lead: false }));
  } catch {
    return;
  }
  track('generate_lead');
};
if (hasConsent()) fireLead();
else document.addEventListener('pzz:consent', (e) => (e as CustomEvent).detail === 'granted' && fireLead());

document.querySelectorAll<HTMLAnchorElement>('[data-calendar]').forEach((a) =>
  a.addEventListener('click', () => track('add_to_calendar', { calendar: a.dataset.calendar })),
);

// Newsletter: osoba, która przy zapisie nie zaznaczyła zgody, może dopisać się tutaj (odrębna, świadoma zgoda).
// Tryb 'api': imię i e-mail z tej karty (sessionStorage) idą do api/subscribe.php z newsletter: true → grupa „Zgoda marketingowa”.
// Bez zapisanych danych (np. wejście z linku) blok jest ukryty – nie mamy kogo dopisać.
type Contact = { email: string; name: string; webinar_source?: string };
const readSignup = (): { contact?: Contact | null } | null => {
  try {
    return JSON.parse(sessionStorage.getItem('pzz_signup') || 'null');
  } catch {
    return null;
  }
};
const nlBlock = document.querySelector<HTMLElement>('[data-newsletter-block]');
const nlBtn = document.querySelector<HTMLButtonElement>('[data-newsletter-cta]');
const nlDone = document.querySelector<HTMLElement>('[data-newsletter-done]');
const nlError = document.querySelector<HTMLElement>('[data-newsletter-error]');
const contact = readSignup()?.contact;
if (eventConfig.form.mode === 'api' && !contact && nlBlock) nlBlock.hidden = true;

nlBtn?.addEventListener('click', async () => {
  if (nlError) nlError.hidden = true;
  if (eventConfig.form.mode === 'api') {
    if (!contact) return;
    const label = nlBtn.textContent;
    nlBtn.disabled = true;
    nlBtn.textContent = nlBtn.dataset.saving || label;
    try {
      const res = await fetch(withBase('api/subscribe.php'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...contact, newsletter: true, state: document.documentElement.dataset.state || 'before', form: 'thank_you_newsletter' }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean } | null;
      if (!res.ok || !data?.ok) throw new Error(`HTTP ${res.status}`);
      try {
        const s = readSignup();
        sessionStorage.setItem('pzz_signup', JSON.stringify({ ...s, newsletter: true, contact: null }));
      } catch {
        /* brak sessionStorage */
      }
    } catch {
      nlBtn.disabled = false;
      nlBtn.textContent = label;
      if (nlError) nlError.hidden = false;
      track('form_error', { form: 'thank_you_newsletter', field: 'network', reason: 'network' });
      return;
    }
  }
  // Po potwierdzonym zapisie przycisk zostaje, ale z etykietą „Zapisano” i nieaktywny (tryb mock: tylko komunikat).
  nlBtn.disabled = true;
  nlBtn.textContent = nlBtn.dataset.saved || 'Zapisano';
  if (nlDone) nlDone.hidden = false;
  track('newsletter_signup', { source: 'thank_you' });
});

// Konsultacja (Calendly): przekazujemy ORYGINALNE UTM-y osoby (z linku, z którego przyszła na landing),
// żeby nie nadpisać źródła; miejsce kliknięcia oznacza utm_term.
const consult = document.querySelector<HTMLAnchorElement>('[data-consultation]');
if (consult && eventConfig.site.consultationUrl) {
  try {
    const original = JSON.parse(sessionStorage.getItem('pzz_utm') || '{}') as Record<string, string>;
    consult.href = consultationLink(eventConfig.site.consultationUrl, eventConfig.id, original);
  } catch {
    /* brak sessionStorage – zostaje link domyślny */
  }
  consult.addEventListener('click', () => track('consultation_click', { place: 'thank_you' }));
}
document.querySelector('.site-header__logo')?.addEventListener('click', () => track('logo_click', { place: 'thank_you' }));

const shareUrl = referralUrl(location.origin + withBase(''));
const shareBtn = document.querySelector<HTMLButtonElement>('[data-share]')!;
if (typeof navigator.share === 'function') shareBtn.hidden = false;
shareBtn.addEventListener('click', async () => {
  track('share_click', { method: 'web_share' });
  try {
    await navigator.share({ title: document.title, text: 'Bezpłatny webinar o świadomej zmianie pracy', url: shareUrl });
  } catch {
    /* anulowane przez użytkowniczkę */
  }
});
document.querySelector('[data-copy]')?.addEventListener('click', async () => {
  track('share_click', { method: 'copy' });
  try {
    await navigator.clipboard.writeText(shareUrl);
  } catch {
    const ta = Object.assign(document.createElement('textarea'), { value: shareUrl });
    document.body.append(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  document.querySelector<HTMLElement>('[data-copied]')!.hidden = false;
});
