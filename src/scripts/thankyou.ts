/** Strona podziękowania (v1 i v2): konwersja po zgodzie, kalendarz, newsletter, udostępnianie. */
import { initConsent, hasConsent } from './consent';
import { track } from './track';
import { referralUrl } from '../lib/utm';
import { withBase } from '../lib/paths';

initConsent();

// Konwersja: tylko raz na zapis i tylko po zgodzie na cookies.
const fireLead = () => {
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

// Newsletter (prototyp: bez wysyłki – TODO integracja MailerLite).
document.querySelector('[data-newsletter-cta]')?.addEventListener('click', (e) => {
  (e.currentTarget as HTMLButtonElement).hidden = true;
  document.querySelector<HTMLElement>('[data-newsletter-done]')!.hidden = false;
  track('newsletter_signup', { source: 'thank_you' });
});

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
