/**
 * Logika generatora linków UTM – czyste funkcje (bez DOM), testowane w tests/unit/utmgen.test.ts.
 */

/** Kolejność parametrów w gotowym linku. */
export const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

/** Zalecana maksymalna długość nazwy kampanii (dłuższe działają, ale źle się czytają w raportach). */
export const CAMPAIGN_MAX = 50;

const PL = { ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z' };

/**
 * Porządki zgodne z dobrymi praktykami UTM: małe litery, bez polskich znaków,
 * myślniki zamiast spacji i podkreśleń, tylko [a-z0-9-].
 */
export function slugify(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (c) => PL[c])
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[\s_.,/\\|+]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Wklejony adres → obiekt URL. Bez protokołu dopisuje https://.
 * Zwraca też listę parametrów utm_*, które były w linku (zostaną zastąpione).
 */
export function parseTarget(input) {
  const raw = String(input ?? '').trim();
  if (!raw) return { ok: false, error: 'empty' };
  // Inny protokół niż http(s), np. mailto: – to nie jest adres strony.
  if (/^[a-z][a-z0-9+-]*:(?!\d)/i.test(raw) && !/^https?:\/\//i.test(raw)) return { ok: false, error: 'invalid' };
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
  let url;
  try {
    url = new URL(withScheme);
  } catch {
    return { ok: false, error: 'invalid' };
  }
  if (!/^https?:$/.test(url.protocol) || !url.hostname.includes('.') || url.username) return { ok: false, error: 'invalid' };
  const existingUtm = [...url.searchParams.keys()].filter((k) => /^utm_/i.test(k));
  return { ok: true, url, existingUtm, insecure: url.protocol === 'http:' };
}

/**
 * Gotowy link: usuwa stare utm_*, zostawia inne parametry i #kotwicę,
 * dopisuje UTM-y w stałej kolejności. Puste wartości są pomijane.
 */
export function buildLink(target, params) {
  const url = new URL(target.toString());
  for (const key of [...url.searchParams.keys()]) {
    if (/^utm_/i.test(key)) url.searchParams.delete(key);
  }
  for (const key of UTM_KEYS) {
    const value = params[key.replace('utm_', '')];
    if (value) url.searchParams.set(key, value);
  }
  return url.toString();
}

/** Data wydarzenia (RRRR-MM-DD z pola daty) → nazwa kampanii RRMMDD, np. 2026-12-03 → 261203. */
export function campaignFromDate(isoDate) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate ?? ''));
  return m ? `${m[1].slice(2)}${m[2]}${m[3]}` : '';
}

/** Dzisiejsza data (czas lokalny przeglądarki) jako RRMMDD i RRRR-MM-DD – domyślna kampania. */
export function todayCampaign(now = new Date()) {
  const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return { campaign: campaignFromDate(iso), iso };
}

/** Czy RRMMDD to prawdziwa data (np. 261231 tak, 261332 nie). */
function isValidYymmdd(v) {
  const y = 2000 + Number(v.slice(0, 2));
  const mo = Number(v.slice(2, 4));
  const d = Number(v.slice(4, 6));
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

/**
 * Podpowiedzi do nazwy kampanii (po porządkach), zależnie od rodzaju:
 * 'event' – wydarzenie jednorazowe: data rozpoczęcia RRMMDD (np. 261203; drugie tego dnia: 261203-2);
 * 'name'  – wydarzenie cykliczne lub stała kampania: nazwa/tytuł, np. ebook-najlepsza-uczennica.
 */
export function campaignNotes(rawValue, type = 'event') {
  const raw = String(rawValue ?? '');
  const value = slugify(raw);
  const notes = [];
  if (!value) return notes;
  if (value !== raw.trim()) notes.push({ level: 'info', code: 'cleaned', text: `Zapiszemy jako: ${value}` });
  const isDate = /^\d{6}(-\d{1,2})?$/.test(value);
  if (type === 'name') {
    if (isDate) notes.push({ level: 'tip', code: 'looksdate', text: 'To wygląda na datę – dla wydarzenia jednorazowego wybierz „Wydarzenie jednorazowe”.' });
    else if (!/[a-z]/.test(value)) notes.push({ level: 'tip', code: 'noname', text: 'Wpisz nazwę lub tytuł, np. ebook-najlepsza-uczennica.' });
  } else if (/[a-z]/.test(value)) {
    notes.push({ level: 'warn', code: 'name', text: 'Dla wydarzenia jednorazowego wpisz datę rozpoczęcia RRMMDD, np. 261203. Nazwa? Wybierz „Cykliczne lub stała kampania”.' });
  } else if (!isDate) {
    notes.push({ level: 'tip', code: 'format', text: 'Format: RRMMDD – data rozpoczęcia, np. 261203 (3 grudnia 2026).' });
  } else if (!isValidYymmdd(value.slice(0, 6))) {
    notes.push({ level: 'warn', code: 'baddate', text: 'To nie jest poprawna data RRMMDD – sprawdź miesiąc i dzień.' });
  }
  if (value.length > CAMPAIGN_MAX) {
    notes.push({ level: 'warn', code: 'long', text: `Ma ${value.length} znaków – skróć do ${CAMPAIGN_MAX}, żeby była czytelna w raportach.` });
  }
  return notes;
}

/** Źródło kanału; kanał z szablonem (np. partner-{nazwa}) wymaga nazwy. */
export function resolveSource(channel, name) {
  if (!channel.source.includes('{nazwa}')) return slugify(channel.source);
  const n = slugify(name);
  return n ? slugify(channel.source.replace('{nazwa}', n)) : '';
}

function csvCell(value) {
  const s = String(value ?? '');
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV dla Excela/Arkuszy (średnik – polskie ustawienia Excela, BOM dla polskich znaków). */
export function toCsv(rows) {
  const header = ['Kanał', 'Miejsce', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'Link'];
  const lines = [header, ...rows.map((r) => [r.channel, r.placement, r.source, r.medium, r.campaign, r.content, r.link])];
  return '﻿' + lines.map((l) => l.map(csvCell).join(';')).join('\r\n') + '\r\n';
}

/** Tekst do schowka: kolumny oddzielone tabulatorem – wklejony do arkusza trafia w osobne komórki. */
export function toTsv(rows) {
  return rows.map((r) => [r.channel, r.placement, r.link].join('\t')).join('\n');
}
