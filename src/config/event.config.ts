/**
 * Jedyne miejsce, w którym zmienia się termin, wariant nagłówka i integracje.
 * Wartości oznaczone TODO_MARK są celowymi placeholderami prototypu –
 * lista wszystkich znajduje się w docs/todo.md.
 */

export const TODO_MARK = '[DO UZUPEŁNIENIA]';

export type HeadlineVariant = 'A' | 'B';

export interface EventSession {
  /** ISO 8601 z jawnym przesunięciem strefy, np. 2026-12-03T19:00:00+01:00 */
  start: string;
  end: string;
}

export interface EventConfig {
  /** Nazwa wydarzenia – zawsze „webinar”, nigdy „wyzwanie”. */
  name: string;
  /**
   * Identyfikator TEGO webinaru – trafia do każdego zdarzenia GA4/Clarity/Meta (parametr webinar_id)
   * i do nazw formularzy/grup MailerLite, żeby dane nie mieszały się z poprzednimi edycjami.
   */
  id: string;
  timeZone: 'Europe/Warsaw';
  sessions: EventSession[];
  /** Platforma, na której odbywa się webinar (np. Zoom) – TODO. */
  platform: string;
  recording: {
    available: boolean;
    /** Link do niepublicznego filmu – nie trafia na stronę, wysyła go MailerLite. */
    url: string | null;
  };
  headlineVariant: HeadlineVariant;
  /** Pozwala podejrzeć stany i warianty parametrami ?state= i ?v= (tylko prototyp). */
  allowPreviewParams: boolean;
  form: {
    /**
     * 'mock' – nic nie jest wysyłane (prototyp);
     * 'mailerlite' – zapis prosto do formularza MailerLite (bez serwera i bez klucza API, działa na GitHub Pages);
     * 'api' – POST do własnej funkcji /api/subscribe (wariant z serwerem, np. Cloudflare).
     */
    mode: 'mock' | 'mailerlite' | 'api';
  };
  mailerlite: {
    /** Publiczny numer konta MailerLite (widoczny w kodzie osadzenia formularza). */
    accountId: string;
    /** ID formularzy MailerLite: przed/w trakcie webinaru → rejestracja, po webinarze → nagranie. */
    forms: { registration: string | null; recording: string | null };
    /** ID grupy newslettera (pole wyboru grupy w formularzu MailerLite) – wysyłane tylko przy zaznaczonej zgodzie. */
    newsletterGroupId: string | null;
    groups: { registration: string; recording: string; newsletter: string };
  };
  analytics: {
    /** Wyłącznik awaryjny: false = żadnych skryptów analitycznych, nawet po zgodzie. */
    enabled: boolean;
    /** GA4 i Meta Pixel ładują się (po zgodzie) tylko na tych domenach – podgląd nie zaśmieca danych produkcyjnych. */
    productionHosts: string[];
    ga4Id: string;
    metaPixelId: string;
    clarityId: string | null;
    /** Clarity także na podglądzie (GitHub Pages), żeby od razu sprawdzić nagrania i mapy kliknięć. */
    clarityOnPreview: boolean;
  };
  site: {
    url: string;
    /** false = noindex na wszystkich stronach (prototyp, podgląd na GitHub Pages). */
    indexable: boolean;
    privacyPolicyUrl: string;
    termsUrl: string | null;
    consultationUrl: string | null;
  };
  controller: {
    name: string;
    brand: string;
    nip: string;
    seat: string;
    email: string;
  };
}

export const eventConfig: EventConfig = {
  name: 'Bezpłatny webinar Przystani Zmiany Zawodowej',
  id: 'webinar-2026-12-03',
  timeZone: 'Europe/Warsaw',
  // Jedno spotkanie, 90 minut (potwierdzone 15.11.2026).
  sessions: [{ start: '2026-12-03T19:00:00+01:00', end: '2026-12-03T20:30:00+01:00' }],
  platform: TODO_MARK,
  recording: { available: true, url: null },
  headlineVariant: 'A',
  allowPreviewParams: true,
  form: { mode: 'mock' },
  mailerlite: {
    accountId: '1427944',
    // TODO: ID nowych formularzy MailerLite (panel MailerLite → Forms → Embedded forms) – patrz docs/wdrozenie.md.
    forms: { registration: null, recording: null },
    newsletterGroupId: null,
    groups: { registration: TODO_MARK, recording: TODO_MARK, newsletter: TODO_MARK },
  },
  analytics: {
    enabled: true,
    productionHosts: ['webinar.przystanzmianyzawodowej.pl'],
    ga4Id: 'G-GV74S860P0',
    metaPixelId: '2031514730971566',
    clarityId: 'ze0k15awef',
    clarityOnPreview: true,
  },
  site: {
    url: 'https://webinar.przystanzmianyzawodowej.pl',
    indexable: false,
    privacyPolicyUrl: 'https://przystanzmianyzawodowej.pl/polityka-prywatnosci/',
    termsUrl: 'https://przystanzmianyzawodowej.pl/regulamin-newslettera/',
    consultationUrl: null,
  },
  // Dane ze stopki strony macierzystej – tylko na potrzeby prototypu, do potwierdzenia przy wydaniu.
  controller: {
    name: 'Agnieszka Baranowska',
    brand: 'Przystań Zmiany Zawodowej',
    nip: '7162735439',
    seat: 'Kostrzyn (woj. wielkopolskie), działalność prowadzona online',
    email: 'przystan.zmiany.zawodowej@gmail.com',
  },
};
