/**
 * Zapis do formularza MailerLite bez serwera: ten sam publiczny endpoint, którego używa
 * oficjalne osadzenie formularza MailerLite (konto + ID formularza są jawne, klucz API niepotrzebny).
 * Formularz w MailerLite decyduje, do jakiej grupy trafia osoba i czy wysyła maila potwierdzającego.
 */
export interface MailerLiteTarget {
  accountId: string;
  formId: string;
}

export interface MailerLiteSubscriber {
  email: string;
  name: string;
  /** UTM-y z adresu, np. „utm_medium=social|utm_source=facebook” (pole niestandardowe w MailerLite). */
  webinarSource: string;
  /** ID grupy newslettera – tylko przy zaznaczonej zgodzie. */
  newsletterGroupId: string | null;
}

export function mailerLiteEndpoint({ accountId, formId }: MailerLiteTarget): string {
  if (!/^\d+$/.test(accountId) || !/^\d+$/.test(formId)) throw new Error('Nieprawidłowe ID konta lub formularza MailerLite.');
  return `https://assets.mailerlite.com/jsonp/${accountId}/forms/${formId}/subscribe`;
}

export function mailerLiteBody(s: MailerLiteSubscriber): URLSearchParams {
  const body = new URLSearchParams();
  body.set('fields[email]', s.email);
  if (s.name) body.set('fields[name]', s.name);
  if (s.webinarSource) body.set('fields[webinar_source]', s.webinarSource);
  if (s.newsletterGroupId) body.append('groups[]', s.newsletterGroupId);
  body.set('ml-submit', '1');
  body.set('anticsrf', 'true');
  return body;
}
