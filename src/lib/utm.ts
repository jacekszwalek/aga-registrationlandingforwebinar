/** Wszystkie parametry utm_* z adresu – bez zaszytej listy kanałów. */
export function extractUtm(search: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of new URLSearchParams(search)) {
    if (/^utm_[a-z0-9_]{1,40}$/i.test(key) && value) out[key.toLowerCase()] = value.slice(0, 200);
  }
  return out;
}

/** Zwięzły zapis do pola MailerLite `webinar_source`, np. „utm_source=facebook|utm_medium=social”. */
export function serializeUtm(utm: Record<string, string>): string {
  return Object.keys(utm)
    .sort()
    .map((k) => `${k}=${utm[k]}`)
    .join('|')
    .slice(0, 255);
}

/** Link polecający: bieżący adres bez UTM-ów, z utm_source=referral. */
export function referralUrl(base: string): string {
  const url = new URL(base);
  url.search = '';
  url.hash = '';
  url.searchParams.set('utm_source', 'referral');
  url.searchParams.set('utm_medium', 'share');
  return url.toString();
}

/**
 * Link z landingu do strony głównej Przystani (logo, konsultacja) z UTM-ami:
 * utm_source=landing-webinar, utm_medium=referral, utm_campaign=RRMMDD (data wydarzenia z id), utm_content=miejsce.
 */
export function landingLink(url: string, eventId: string, content: string): string {
  const u = new URL(url);
  const m = /^(\d{2})(\d{2})-(\d{2})-(\d{2})/.exec(eventId);
  u.searchParams.set('utm_source', 'landing-webinar');
  u.searchParams.set('utm_medium', 'referral');
  if (m) u.searchParams.set('utm_campaign', `${m[2]}${m[3]}${m[4]}`);
  u.searchParams.set('utm_content', content);
  return u.toString();
}
