/**
 * Treść v3 (kompozycja Tailwind) i v4 (kompozycja Unbounce).
 * Każdy punkt pochodzi z programu i sekcji „Co wyniesiesz” na /wyzwanie2/ – przeredagowany
 * pod jedno spotkanie, bez nowych faktów.
 */
export const learnItems = [
  {
    lead: 'Schemat, który Cię blokuje',
    text: 'poznasz mechanizm Dorosłej Najlepszej Uczennicy i sprawdzisz, jak przekonania wpływają na Twoje emocje i działania.',
  },
  {
    lead: 'Twoja mapa talentów',
    text: 'przyjrzysz się naturalnym predyspozycjom, wyuczonym kompetencjom i zainteresowaniom.',
  },
  {
    lead: 'Mocne strony na kolejny etap',
    text: 'oddzielisz umiejętności, które masz, od tych, z których naprawdę chcesz korzystać.',
  },
  {
    lead: 'Działanie zamiast pozornej produktywności',
    text: 'zobaczysz, czym różni się ruch, który tylko zajmuje czas, od takiego, który przybliża Cię do zmiany.',
  },
  {
    lead: 'Jeden konkretny krok',
    text: 'zaplanujesz działanie, dzięki któremu sprawdzisz interesujący Cię kierunek bez rzucania obecnej pracy.',
  },
  {
    lead: 'Nagranie bez limitu czasu',
    text: 'jeśli nie zdążysz na żywo, link do nagrania wyślę Ci mailem.',
  },
] as const;

export const copyV3 = {
  pill: 'Webinar',
  overline: 'Bezpłatne spotkanie online z psycholożką i coachką ICF',
  cta: 'Zapisuję się bezpłatnie',
  ctaAfter: 'Wyślij mi nagranie',
  photoCaption: 'Agnieszka Baranowska',
  learnHeading: 'Na tym webinarze dowiesz się…',
  plan: {
    heading: 'Prosty plan na świadomą zmianę pracy',
    ticks: ['Bez rezygnowania ze stabilności', 'Bez zaczynania od zera', 'Bez presji, że już musisz wiedzieć'],
  },
  host: {
    kicker: 'Prowadzi psycholożka i coachka ICF',
    bio: 'Certyfikowana coachka ICF i założycielka Przystani Zmiany Zawodowej. Przez ponad 8 lat pracowała m.in. w McKinsey, Boeingu, Capgemini i COI – zna od środka świat deadline’ów, projektów i wysokich oczekiwań. Sama jest Dorosłą Najlepszą Uczennicą, która świadomie pokierowała swoją karierą.',
    companies: ['McKinsey', 'Boeing', 'Capgemini', 'COI'],
  },
  final: {
    before: 'Pierwszy krok do świadomej zmiany – w 60 minut',
    during: 'Webinar trwa – dołącz teraz',
    after: 'Obejrzyj nagranie webinaru',
  },
} as const;

export const copyV4 = {
  lead: 'Bezpłatny webinar online prowadzi Agnieszka Baranowska – psycholożka i coachka ICF, wcześniej m.in. w McKinsey, Boeingu i Capgemini.',
  leadAfter: 'Webinar już się odbył – zostaw e-mail, a wyślę Ci nagranie. Obejrzysz je, kiedy chcesz, bez limitu czasu.',
  formLabel: 'Twój e-mail',
  submit: 'Zapisuję się!',
  submitAfter: 'Wyślij mi nagranie',
  note: 'Nie możesz być na żywo? Zapisz się mimo to – nagranie wyślę Ci mailem.',
  learnHeading: 'Co będziesz wiedzieć po webinarze',
  tiles: { online: '60 min online', free: '0 zł', recording: 'Nagranie' },
} as const;
