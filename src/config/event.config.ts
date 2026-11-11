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
    /** 'mock' – nic nie jest wysyłane; 'api' – POST do /api/subscribe (etap integracji). */
    mode: 'mock' | 'api';
  };
  mailerlite: {
    groups: { registration: string; recording: string; newsletter: string };
  };
  analytics: {
    /** Dopóki false, żadne skrypty analityczne nie są ładowane nawet po zgodzie. */
    enabled: boolean;
    ga4Id: string;
    metaPixelId: string;
    clarityId: string | null;
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
  timeZone: 'Europe/Warsaw',
  // TODO: termin i format (jedno spotkanie) do potwierdzenia.
  sessions: [{ start: '2026-12-03T19:00:00+01:00', end: '2026-12-03T20:00:00+01:00' }],
  platform: TODO_MARK,
  recording: { available: true, url: null },
  headlineVariant: 'A',
  allowPreviewParams: true,
  form: { mode: 'mock' },
  mailerlite: {
    groups: { registration: TODO_MARK, recording: TODO_MARK, newsletter: TODO_MARK },
  },
  analytics: {
    enabled: false,
    ga4Id: 'G-GV74S860P0',
    metaPixelId: '2031514730971566',
    clarityId: null,
  },
  site: {
    url: 'https://webinar.przystanzmianyzawodowej.pl',
    indexable: false,
    privacyPolicyUrl: 'https://przystanzmianyzawodowej.pl/polityka-prywatnosci/',
    termsUrl: null,
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
