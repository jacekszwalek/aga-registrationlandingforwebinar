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
