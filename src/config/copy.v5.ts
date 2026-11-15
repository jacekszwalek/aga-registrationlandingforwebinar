/**
 * Treść v5 – dostarczona 15.11.2026 (tytuł, opis, sekcje „Czujesz, że…”, struktura JA / MOŻLIWOŚCI / WYBÓR, FAQ).
 * Układ jak v2, wygląd jak v3. Opinie: copy.testimonials (bez zmian).
 */
export const copyV5 = {
  hero: {
    headline: 'Zostać, zmienić pracę czy pójść własną drogą?',
    description:
      'Pokażę Ci, jak uporządkować swoje pomysły i możliwości, by świadomie wybrać kierunek zawodowy, w którym wykorzystasz swój potencjał i znajdziesz więcej sensu.',
    afterHeadline: 'Obejrzyj nagranie webinaru',
    afterDescription:
      'Zostaw imię i e-mail, a wyślę Ci link do nagrania. Obejrzysz je, kiedy chcesz – bez limitu czasu.',
  },
  /** Podgląd linku (Facebook, LinkedIn, WhatsApp): krótki tytuł z datą + opis. */
  share: {
    title: 'Zostać, zmienić pracę czy pójść własną drogą? Bezpłatny webinar 3 grudnia 2026',
    description:
      'Bezpłatny webinar online z Agnieszką Baranowską – 3 grudnia 2026, 19:00, 90 min. Uporządkuj pomysły i świadomie wybierz kierunek zawodowy.',
  },
  form: {
    nameLabel: 'Imię',
    emailLabel: 'E-mail',
    submit: 'Zapisuję się bezpłatnie',
    submitAfter: 'Wyślij mi nagranie',
  },
  facts: {
    online: 'Online, 90\u00a0min',
    worksheet: 'Arkusz do pracy',
    recording: 'Nagranie dla zapisanych',
  },
  host:
    'Prowadzi Agnieszka Baranowska – psycholog i coach, wcześniej m.in. w McKinsey, Boeingu, Capgemini i COI. Pracuje z klientkami nad budowaniem satysfakcjonującego życia zawodowego.',
  pains: {
    heading: 'Czujesz, że zawodowo chcesz czegoś więcej, ale…',
    items: [
      'Masz kilka pomysłów na siebie albo nie masz żadnego, który naprawdę Cię przekonuje.',
      'Wiesz, że masz duży potencjał, ale nie czujesz, że w pełni go wykorzystujesz.',
      'Chcesz robić coś, co daje Ci sens i satysfakcję, ale nie wiesz jeszcze, co to mogłoby być.',
      'Obserwujesz innych, szukasz możliwości, analizujesz, ale ciągle wracasz do punktu wyjścia.',
      'Odkładasz decyzję, licząc, że w końcu pojawi się odpowiedź.',
    ],
  },
  structure: {
    intro:
      'Podczas webinaru poznasz prostą strukturę, która pomoże Ci przejść od wielu myśli i pomysłów do bardziej świadomego spojrzenia na swoją przyszłość zawodową.',
    steps: [
      { num: '01', title: 'Ja', text: 'Co potrafię? Co jest dla mnie ważne? Czego chcę więcej w swoim życiu zawodowym?' },
      { num: '02', title: 'Możliwości', text: 'Jakie mam opcje? Gdzie mogę wykorzystać swój potencjał i robić coś, co ma dla mnie sens?' },
      { num: '03', title: 'Wybór', text: 'Co jest dla mnie właściwe? Co warto sprawdzić, zanim podejmę decyzję?' },
    ],
    closing: 'Pokażę Ci, jak pracować z tą strukturą, żeby uporządkować swoje myśli, możliwości i wątpliwości.',
  },
  faq: {
    heading: 'Najczęstsze pytania',
    items: [
      { q: 'Czy webinar jest bezpłatny?', a: 'Tak, udział w webinarze jest całkowicie bezpłatny. Wystarczy, że zapiszesz się przez formularz.' },
      {
        q: 'Czy muszę włączać kamerę lub mikrofon?',
        a: 'Nie, wystarczy, że dołączysz i będziesz słuchać. Webinar poprowadzę w formie prezentacji, a przez cały czas będziesz mogła zadawać pytania i dzielić się swoimi przemyśleniami na czacie.',
      },
      {
        q: 'Co jeśli nie mogę uczestniczyć na żywo?',
        a: 'Każda zapisana osoba otrzyma dostęp do nagrania webinaru. Możesz więc obejrzeć spotkanie w dogodnym dla siebie czasie.',
      },
      {
        q: 'Czy ten webinar jest dla mnie, jeśli nie wiem jeszcze, co chcę robić zawodowo?',
        a: 'Tak. Nie musisz mieć gotowego pomysłu. Pokażę Ci, jak uporządkować swoje myśli i możliwości, żeby świadomie przyjrzeć się dalszej drodze zawodowej.',
      },
      {
        q: 'Czy webinar jest dla mnie, jeśli nie planuję zmieniać pracy?',
        a: 'Tak. Nie chodzi o samą zmianę pracy, ale o znalezienie kierunku, w którym lepiej wykorzystasz swój potencjał i będziesz czuła więcej sensu oraz satysfakcji.',
      },
      {
        q: 'Czy to webinar o szukaniu pracy i rekrutacji?',
        a: 'Nie. Nie będziemy zajmować się pisaniem CV ani przygotowaniem do rozmów rekrutacyjnych. Skupimy się na świadomym wyborze kierunku zawodowego, zgodnego z Twoim potencjałem i tym, co jest dla Ciebie ważne.',
      },
    ],
  },
  final: {
    before: 'Zarezerwuj miejsce',
    during: 'Webinar trwa – dołącz',
    after: 'Obejrzyj nagranie',
    cta: { before: 'Zapisuję się bezpłatnie', during: 'Zapisuję się i dołączam', after: 'Wyślij mi nagranie' },
  },
} as const;
