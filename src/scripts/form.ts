import { copy } from '../config/copy';
import { eventConfig } from '../config/event.config';
import { extractUtm, serializeUtm } from '../lib/utm';
import { withBase } from '../lib/paths';
import { track, trackOnce } from './track';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const UTM_KEY = 'pzz_utm';
export const SIGNUP_KEY = 'pzz_signup';

export interface SignupPayload {
  email: string;
  name: string;
  newsletter: boolean;
  state: string;
  headline_variant: string;
  webinar_source: string;
  utm: Record<string, string>;
  form: string;
}

declare global {
  interface Window {
    __lastPayload?: SignupPayload;
  }
}

/** UTM-y z pierwszego wejścia w tej sesji – przetrwają np. odświeżenie strony bez parametrów. */
function currentUtm(): Record<string, string> {
  const fromUrl = extractUtm(location.search);
  try {
    if (Object.keys(fromUrl).length) sessionStorage.setItem(UTM_KEY, JSON.stringify(fromUrl));
    return Object.keys(fromUrl).length ? fromUrl : JSON.parse(sessionStorage.getItem(UTM_KEY) || '{}');
  } catch {
    return fromUrl;
  }
}

function setFieldError(form: HTMLFormElement, field: string, message: string | null): void {
  const input = form.querySelector<HTMLInputElement>(`[name="${field}"]`);
  const err = input && document.getElementById(input.getAttribute('aria-describedby') || '');
  if (!input || !err) return;
  if (message) {
    input.setAttribute('aria-invalid', 'true');
    err.textContent = message;
    err.hidden = false;
  } else {
    input.removeAttribute('aria-invalid');
    err.textContent = '';
    err.hidden = true;
  }
}

function validate(form: HTMLFormElement): Array<{ field: string; reason: string; message: string }> {
  const e = copy.form.errors;
  const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim();
  const name = (form.elements.namedItem('name') as HTMLInputElement).value.trim();
  const errors: Array<{ field: string; reason: string; message: string }> = [];
  if (!email) errors.push({ field: 'email', reason: 'required', message: e.emailRequired });
  else if (!EMAIL_RE.test(email)) errors.push({ field: 'email', reason: 'invalid', message: e.emailInvalid });
  if (name.length > 60) errors.push({ field: 'name', reason: 'too_long', message: e.nameTooLong });
  return errors;
}

function setLoading(form: HTMLFormElement, loading: boolean): void {
  const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  btn.setAttribute('aria-busy', String(loading));
  btn.querySelector<HTMLElement>('.btn__loading')!.hidden = !loading;
  btn.querySelectorAll<HTMLElement>('.btn__label').forEach((l) => l.classList.toggle('visually-hidden', loading));
}

async function send(payload: SignupPayload): Promise<void> {
  if (eventConfig.form.mode === 'mock') {
    // Prototyp: nic nie jest wysyłane. ?mock=fail symuluje błąd sieci (podgląd stanu błędu).
    // Ostatni payload zostaje w sessionStorage tej karty – tylko w trybie mock, do testów i podglądu.
    try {
      sessionStorage.setItem('pzz_mock_last_payload', JSON.stringify(payload));
    } catch {
      /* brak sessionStorage */
    }
    await new Promise((r) => setTimeout(r, 600));
    const fail = eventConfig.allowPreviewParams && new URLSearchParams(location.search).get('mock') === 'fail';
    if (fail) throw new Error('mock network error');
    return;
  }
  const res = await fetch(withBase('api/subscribe'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

function bindForm(form: HTMLFormElement): void {
  const formId = form.dataset.formId || 'unknown';
  const formError = form.querySelector<HTMLElement>('.form-error')!;
  let busy = false;

  form.addEventListener('focusin', () => trackOnce('form_start', { form: formId }));
  form.addEventListener('input', (ev) => {
    const t = ev.target as HTMLInputElement;
    if (t.getAttribute('aria-invalid') === 'true' && !validate(form).some((x) => x.field === t.name)) {
      setFieldError(form, t.name, null);
    }
  });

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (busy) return;
    track('form_submit_attempt', { form: formId });
    formError.hidden = true;

    const errors = validate(form);
    ['email', 'name'].forEach((f) => setFieldError(form, f, errors.find((x) => x.field === f)?.message ?? null));
    if (errors.length) {
      errors.forEach((x) => track('form_error', { form: formId, field: x.field, reason: x.reason }));
      form.querySelector<HTMLInputElement>(`[name="${errors[0].field}"]`)?.focus();
      return;
    }

    const data = new FormData(form);
    const d = document.documentElement;
    const utm = currentUtm();
    const payload: SignupPayload = {
      email: String(data.get('email')).trim(),
      name: String(data.get('name') || '').trim(),
      newsletter: data.get('newsletter') === 'yes',
      state: d.dataset.state || 'before',
      headline_variant: d.dataset.variant || 'A',
      webinar_source: serializeUtm(utm),
      utm,
      form: formId,
    };

    // Honeypot wypełniony: udajemy sukces, ale niczego nie wysyłamy.
    const honeypot = String(data.get('website') || '');
    busy = true;
    setLoading(form, true);
    try {
      if (!honeypot) {
        window.__lastPayload = payload;
        await send(payload);
      }
      try {
        sessionStorage.setItem(SIGNUP_KEY, JSON.stringify({ newsletter: payload.newsletter, state: payload.state, lead: !honeypot }));
      } catch {
        /* brak sessionStorage – strona podziękowania pokaże wariant domyślny */
      }
      location.assign(withBase('dziekuje/'));
    } catch {
      track('form_error', { form: formId, field: 'network', reason: 'network' });
      formError.textContent = copy.form.errors.network;
      formError.hidden = false;
      busy = false;
      setLoading(form, false);
    }
  });
}

export function initForms(): void {
  currentUtm();
  document.querySelectorAll<HTMLFormElement>('form.signup-form').forEach(bindForm);
}
