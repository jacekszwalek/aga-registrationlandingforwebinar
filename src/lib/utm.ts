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
 * Link z landingu do własnej strony (logo → strona główna): BEZ UTM-ów, żeby GA4 nie nadpisał
 * prawdziwego źródła wizyty (np. facebook). Miejsce kliknięcia oznacza zwykły parametr ?ref=.
 */
export function refLink(url: string, ref: string): string {
  const u = new URL(url);
  u.searchParams.set('ref', ref);
  return u.toString();
}

/** RRMMDD z identyfikatora wydarzenia (2026-12-03-… → 261203). */
export function campaignFromEventId(eventId: string): string {
  const m = /^(\d{2})(\d{2})-(\d{2})-(\d{2})/.exec(eventId);
  return m ? `${m[2]}${m[3]}${m[4]}` : '';
}

/**
 * Link do konsultacji (Calendly) z ORYGINALNYMI UTM-ami osoby (np. utm_source=facebook z linku,
 * z którego trafiła na landing) – nic nie jest nadpisywane. Miejsce kliknięcia: utm_term.
 * Gdy osoba weszła bez UTM-ów: utm_source=landing-webinar, utm_medium=referral, utm_campaign=RRMMDD.
 */
export function consultationLink(url: string, eventId: string, original: Record<string, string> = {}): string {
  const u = new URL(url);
  const keep = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
  if (original.utm_source) {
    for (const k of keep) if (original[k]) u.searchParams.set(k, original[k]);
  } else {
    u.searchParams.set('utm_source', 'landing-webinar');
    u.searchParams.set('utm_medium', 'referral');
    const c = campaignFromEventId(eventId);
    if (c) u.searchParams.set('utm_campaign', c);
  }
  u.searchParams.set('utm_term', 'landing-webinar-konsultacja');
  return u.toString();
}
