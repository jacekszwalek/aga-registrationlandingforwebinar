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
   * Konwencja (od 15.11.2026): RRRR-MM-DD-krotka-nazwa, np. 2026-12-03-zostac-zmienic-wlasna-droga.
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
     * 'api' – POST do public/api/subscribe.php na hostingu (PHP + API MailerLite; klucz poza repo) – wydanie.
     */
    mode: 'mock' | 'mailerlite' | 'api';
  };
  /** Licznik etapów bez cookies (src/scripts/funnel.ts → public/api/track.php). */
  funnel: { enabled: boolean };
  mailerlite: {
    /** Publiczny numer konta MailerLite (widoczny w kodzie osadzenia formularza). */
    accountId: string;
    /** ID formularzy MailerLite: przed/w trakcie webinaru → rejestracja, po webinarze → nagranie. */
    forms: { registration: string | null; recording: string | null };
    /** ID grupy „Zgoda marketingowa” – tylko przy zaznaczonym checkboxie (tryb 'mailerlite'). */
    newsletterGroupId: string | null;
    /** Nazwa wydarzenia w MailerLite (wpisywana w pole „Pierwsze wydarzenie” nowych kontaktów). */
    eventName: string;
    /** Klucz pola „Pierwsze wydarzenie” – ustawiane tylko kontaktom nowym w bazie. */
    firstEventField: string;
    /** Grupa roczna „Interakcja RRRR” – skrypt sam znajduje albo tworzy grupę na bieżący rok. */
    interactionGroupPrefix: string;
    groups: {
      /** Grupa wydarzenia – zapis przed webinarem i w trakcie. */
      registration: string;
      /** Grupa wydarzenia – zapis po webinarze (po nagranie). */
      recording: string;
      /** „Zgoda marketingowa” – tylko po zaznaczeniu checkboxa. */
      consent: string;
      /** „Uczestnicy wydarzeń” – stała grupa zbiorcza (historia). */
      participants: string;
      /** Grupa rodzaju wydarzenia, np. „Webinar”. */
      eventType: string;
    };
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
    /** Strona główna Przystani – link pod logo (z UTM-ami). */
    homeUrl: string;
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

/** Build wydania na subdomenę (PUBLIC_RELEASE=1): bez przełącznika wersji i parametrów podglądu. */
const RELEASE = import.meta.env?.PUBLIC_RELEASE === '1';

export const eventConfig: EventConfig = {
  name: 'Bezpłatny webinar Przystani Zmiany Zawodowej',
  id: '2026-12-03-zostac-zmienic-wlasna-droga',
  timeZone: 'Europe/Warsaw',
  // Jedno spotkanie, 90 minut (potwierdzone 15.11.2026).
  sessions: [{ start: '2026-12-03T19:00:00+01:00', end: '2026-12-03T20:30:00+01:00' }],
  platform: TODO_MARK,
  recording: { available: true, url: null },
  headlineVariant: 'A',
  allowPreviewParams: !RELEASE,
  // Wydanie (przystanzmianyzawodowej.pl/webinar/): zapis przez api/subscribe.php. Podgląd i testy: mock.
  form: { mode: RELEASE ? 'api' : 'mock' },
  // Licznik etapów bez cookies (api/track.php, panel /webinar/licznik/) – tylko w wydaniu.
  funnel: { enabled: RELEASE },
  mailerlite: {
    accountId: '1427944',
    // Tryb 'api' nie używa formularzy MailerLite (zapis przez API). Konwencja: docs/mailerlite-standard.md.
    forms: { registration: null, recording: null },
    newsletterGroupId: '204236857906562074',
    eventName: '2026-12-03 - Zostać, zmienić pracę czy pójść własną drogą?',
    firstEventField: 'pierwsze_wydarzenie',
    interactionGroupPrefix: 'Interakcja ',
    groups: {
      registration: '203786228197229581', // 2026-12-03 - Zostać, zmienić pracę czy pójść własną drogą? - rejestracja
      recording: '204219029769946640', // 2026-12-03 - Zostać, zmienić pracę czy pójść własną drogą? - nagranie
      consent: '204236857906562074', // Zgoda marketingowa
      participants: '204236858271466618', // Uczestnicy wydarzeń
      eventType: '204236859214136535', // Webinar
    },
  },
  analytics: {
    enabled: true,
    // Analityka od 15.11.2026 także na podglądzie GitHub Pages (do czasu startu subdomeny) – w GA4 filtr po hostName.
    // przystanzmianyzawodowej.pl/webinar/ = produkcja; subdomena tylko przekierowuje (301), github.io = podgląd.
    productionHosts: ['przystanzmianyzawodowej.pl', 'webinar.przystanzmianyzawodowej.pl', 'jacekszwalek.github.io'],
    ga4Id: 'G-GV74S860P0',
    metaPixelId: '2031514730971566',
    clarityId: 'ze0k15awef',
    clarityOnPreview: true,
  },
  site: {
    url: 'https://przystanzmianyzawodowej.pl/webinar/',
    indexable: false,
    homeUrl: 'https://przystanzmianyzawodowej.pl/',
    privacyPolicyUrl: 'https://przystanzmianyzawodowej.pl/polityka-prywatnosci/',
    termsUrl: 'https://przystanzmianyzawodowej.pl/regulamin-newslettera/',
    // Calendly – bez ?month=, żeby kalendarz zawsze otwierał bieżący miesiąc (UTM-y Calendly zapisuje przy rezerwacji).
    consultationUrl: 'https://calendly.com/baranowska-agnieszka92/rozmowa',
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
