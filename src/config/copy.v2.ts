/**
 * Treść wersji v2 – krótka squeeze page (wzór: Unbounce, Tailwind, Bandzoogle).
 * Szczegóły schowane w rozwijanych blokach. Źródło faktów: /wyzwanie2/ i /o-mnie/
 * (jak w copy.ts); nic nowego nie zostało dopisane.
 */
import { copy } from './copy';

export const copyV2 = {
  hero: {
    eyebrowPrefix: 'Bezpłatny webinar',
    headline: copy.hero.headline,
    subtitle:
      'Spotkanie online z psycholożką i coachką ICF. Zobaczysz, co ogranicza Twoje zawodowe wybory, i wyjdziesz z planem jednego konkretnego działania.',
    host: 'Prowadzi Agnieszka Baranowska – psycholożka i coachka ICF, wcześniej m.in. w McKinsey, Boeingu i Capgemini.',
    facts: { online: 'Online, 60 minut', free: '0 zł', recording: 'Nagranie dla zapisanych' },
  },
  after: {
    eyebrow: 'Nagranie webinaru · bezpłatnie',
    headline: copy.after.headline,
    subtitle: 'Zostaw e-mail, a wyślę Ci link do nagrania. Obejrzysz je, kiedy chcesz – bez limitu czasu.',
  },
  form: {
    emailLabel: 'Twój e-mail',
    emailPlaceholder: 'imie@domena.pl',
    submit: { before: 'Zapisuję się', during: 'Zapisuję się', after: 'Wyślij mi nagranie' },
  },
  outcomes: {
    heading: 'Z webinaru wyjdziesz z…',
    items: [
      'rozpoznanym schematem myślenia, który ogranicza Twoje zawodowe wybory',
      'nazwanymi mocnymi stronami, które naprawdę chcesz wykorzystywać',
      'planem jednego konkretnego działania – bez rzucania obecnej pracy',
    ],
    programSummary: 'Zobacz program spotkania',
    forWhoSummary: 'Czy to webinar dla Ciebie?',
    notFor: 'To nie jest webinar dla Ciebie, jeśli szukasz gotowej recepty albo listy zawodów, które ktoś wybierze za Ciebie.',
  },
  host: {
    heading: 'Kto poprowadzi?',
    lead: 'Psycholożka, certyfikowana coachka ICF i założycielka Przystani Zmiany Zawodowej. Przez ponad 8 lat pracowała m.in. w McKinsey, Boeingu, Capgemini i COI.',
    moreSummary: 'Więcej o Agnieszce',
    more: [
      'Sama jest Dorosłą Najlepszą Uczennicą, która świadomie pokierowała swoją karierą.',
      'Dziś pomaga ambitnym kobietom świadomie zdecydować, co dalej zawodowo – bez rzucania wszystkiego.',
    ],
  },
  testimonials: {
    heading: 'Opinie klientek',
    moreSummary: 'Pokaż więcej opinii',
  },
  faq: { heading: 'Pytania' },
  final: {
    before: 'Zarezerwuj miejsce',
    during: 'Webinar trwa – dołącz',
    after: 'Obejrzyj nagranie',
    cta: { before: 'Zapisuję się bezpłatnie', during: 'Zapisuję się i dołączam', after: 'Wyślij mi nagranie' },
  },
} as const;
