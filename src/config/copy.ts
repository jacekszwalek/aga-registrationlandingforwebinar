/**
 * Cała treść strony w jednym miejscu. Źródło: obecna strona /wyzwanie2/ i /o-mnie/,
 * skrócona do jednego spotkania. Nie dopisuj faktów, liczb ani opinii spoza źródeł.
 * Daty i godziny nie są tu wpisywane – generuje je event.config.ts.
 */
import { TODO_MARK } from './event.config';
import { formMessages } from './formMessages';

export const copy = {
  meta: {
    title: 'Bezpłatny webinar: jak zmienić pracę świadomie | Przystań Zmiany Zawodowej',
    description:
      'Bezpłatny webinar online z psycholożką i coachką ICF Agnieszką Baranowską. Zobacz, co ogranicza Twoje zawodowe wybory, i wyjdź z planem jednego konkretnego działania.',
  },

  hero: {
    overlinePrefix: 'Bezpłatny webinar',
    headline: {
      A: 'Jak zmienić pracę świadomie – bez rzucania wszystkiego i zaczynania od zera',
      B: 'Utknęłaś zawodowo? Na tym webinarze odkryjesz, co Cię blokuje i jaki jest Twój następny krok',
    },
    subtitle:
      'Bezpłatne spotkanie online z psycholożką i coachką ICF. Zobaczysz, co ogranicza Twoje zawodowe wybory, i wyjdziesz z planem jednego konkretnego działania.',
    host: 'Prowadzi Agnieszka Baranowska – psycholożka i coachka ICF, wcześniej m.in. w McKinsey, Boeingu i Capgemini.',
  },

  during: {
    banner: 'Webinar trwa – dołącz teraz',
    bannerText: 'Zapisz się, a link do spotkania wyślę Ci od razu mailem.',
    bannerCta: 'Dołączam',
  },

  after: {
    overline: 'Nagranie webinaru · bezpłatnie',
    headline: 'Obejrzyj nagranie webinaru',
    subtitle:
      'Zostaw e-mail, a wyślę Ci link do nagrania. Obejrzysz je w dowolnym momencie – bez limitu czasu.',
    newsletterLine: 'Dam Ci też znać o kolejnym webinarze.',
  },

  form: {
    nameLabel: 'Imię',
    nameHint: '(opcjonalnie)',
    emailLabel: 'E-mail',
    submit: { before: 'Zapisuję się bezpłatnie', during: 'Zapisuję się bezpłatnie', after: 'Wyślij mi nagranie' },
    loading: 'Zapisuję…',
    microcopy: {
      before: '0 zł · Link i przypomnienie wyślę Ci mailem · Nagranie dostaniesz po webinarze',
      during: '0 zł · Link wyślę Ci od razu mailem · Nagranie dostaniesz po webinarze',
      after: '0 zł · Link do nagrania wyślę Ci mailem',
    },
    newsletter:
      'Tak, chcę też dostawać newsletter Przystani Zmiany Zawodowej z poradami o rozwoju zawodowym oraz informacjami o wydarzeniach, kursach i ofertach. Mogę wycofać zgodę w każdej chwili.',
    errors: formMessages,
    repeatHeading: { before: 'Zarezerwuj miejsce na webinarze', during: 'Dołącz do webinaru', after: 'Wyślij mi nagranie' },
  },

  pains: {
    heading: 'Brzmi znajomo?',
    items: [
      {
        title: 'Masz doświadczenie, ale nie wiesz, co dalej.',
        text: 'Przez lata zdobywałaś kompetencje i dobrze radziłaś sobie w pracy. Dziś chcesz czegoś więcej, ale nie wiesz jeszcze, w którą stronę pójść.',
      },
      {
        title: 'Myślisz o zmianie, ale żadna opcja Cię nie przekonuje.',
        text: 'Przeglądasz oferty, rozważasz inną branżę albo własny biznes. Nie chcesz podejmować kolejnej przypadkowej decyzji.',
      },
      {
        title: 'Potrafisz dużo, ale niekoniecznie chcesz dalej robić to samo.',
        text: 'Umiejętności, które dały Ci sukces, nie muszą wyznaczać kolejnego etapu Twojej kariery.',
      },
    ],
  },

  outcomes: {
    heading: 'Czego się dowiesz',
    items: [
      {
        title: 'Co Cię blokuje',
        text: 'Poznasz mechanizm Dorosłej Najlepszej Uczennicy i sprawdzisz, jak przekonania wpływają na Twoje decyzje.',
        result: 'Rozpoznasz schemat myślenia, który ogranicza Twoje wybory.',
      },
      {
        title: 'Na czym chcesz budować',
        text: 'Oddzielisz to, w czym jesteś dobra, od tego, co naprawdę chcesz robić.',
        result: 'Nazwiesz mocne strony, które chcesz wykorzystywać zawodowo.',
      },
      {
        title: 'Jaki jest Twój następny krok',
        text: 'Zobaczysz, czym różni się działanie „dla poczucia produktywności” od takiego, które przybliża Cię do zmiany.',
        result: 'Zaplanujesz jedno konkretne działanie – bez rzucania obecnej pracy.',
      },
    ],
    closing: 'Nie musisz mieć gotowego planu na kolejne dziesięć lat. Wystarczy, że zaczniesz świadomie decydować, co dalej.',
  },

  host: {
    heading: 'Kto poprowadzi webinar?',
    name: 'Agnieszka Baranowska',
    role: 'Psycholożka, certyfikowana coachka ICF, założycielka Przystani Zmiany Zawodowej',
    paragraphs: [
      'Przez ponad 8 lat pracowałam m.in. w McKinsey, Boeingu, Capgemini i COI – znam od środka świat deadline’ów, projektów i wysokich oczekiwań.',
      'Sama jestem Dorosłą Najlepszą Uczennicą, która świadomie pokierowała swoją karierą.',
      'Dziś pomagam ambitnym kobietom świadomie zdecydować, co dalej zawodowo – bez rzucania wszystkiego.',
    ],
    photoPlaceholder: `Zdjęcie Agnieszki ${TODO_MARK}`,
  },

  testimonials: {
    heading: 'Co mówią kobiety, z którymi pracowałam',
    note: 'Opinie dotyczą konsultacji i warsztatów indywidualnych.',
    // Cytaty dosłowne z /wyzwanie2/. TODO: potwierdzić zgodę autorek na publikację na tej stronie.
    items: [
      {
        quote:
          'Wiele się zmieniło od naszej rozmowy. Narodził się pomysł i plan działania!!! Wygląda na to, że sama krótka rozmowa z Tobą coś we mnie poruszyła :-)',
        author: 'Agnieszka',
        role: 'Handlowiec',
      },
      {
        quote:
          'Rozmowa bardzo mi się podobała, ponieważ mogłam sobie przeanalizować obecną sytuację, dzięki pytaniom, które od Ciebie dostałam. Całość przebiegła w miłej atmosferze.',
        author: 'Wiola',
        role: 'Project Manager',
      },
      {
        quote:
          'Bardzo polecam współpracę z Agnieszką. Skorzystałam z konsultacji, która pomogła mi uporządkować moje myśli i cele zawodowe, a także zrozumieć kim jestem jako profesjonalista.',
        author: 'Klaudia Rozmarynowska',
        role: 'Senior Talent Acquisition Partner, HR Partner',
      },
    ],
  },

  details: {
    heading: 'Szczegóły',
    countdownLabel: 'Do startu zostało',
    recording: 'Nagranie dla zapisanych bez limitu czasu',
    live: 'Na żywo online',
  },

  faq: {
    heading: 'Najczęstsze pytania',
    items: [
      {
        q: 'Czy muszę włączać kamerę?',
        a: 'Nie. Możesz słuchać i notować – kamera i mikrofon są opcjonalne.',
      },
      {
        q: 'Co, jeśli nie zdążę na żywo?',
        a: 'Zapisz się mimo to. Po webinarze wyślę Ci mailem link do nagrania – bez limitu czasu.',
      },
      { q: 'Czy webinar jest płatny?', a: 'Nie. Udział i nagranie są bezpłatne.' },
      {
        q: 'Dla kogo ten webinar nie jest?',
        a: 'Jeśli oczekujesz gotowej recepty na zmianę zawodową albo listy zawodów, które ktoś wybierze za Ciebie. Tutaj pracujesz nad własnymi odpowiedziami i decyzjami.',
      },
      { q: 'Czy na webinarze będzie oferta sprzedażowa?', a: TODO_MARK },
    ],
  },

  privacy: {
    clause:
      'Administratorem Twoich danych jest {controller}. Przetwarzam je, aby zorganizować webinar: wysłać Ci link, przypomnienie i nagranie.',
  },

  thankYou: {
    metaTitle: 'Jesteś zapisana! | Przystań Zmiany Zawodowej',
    headline: { before: 'Jesteś zapisana!', after: 'Nagranie jest w drodze na Twoją skrzynkę' },
    inbox:
      'Sprawdź skrzynkę – wysłałam Ci wiadomość z potwierdzeniem. Jeśli jej nie widzisz, zajrzyj do folderów Oferty i Spam.',
    calendarHeading: 'Zapisz termin w kalendarzu',
    google: 'Dodaj do Kalendarza Google',
    ics: 'Pobierz plik .ics',
    recording: 'Nagranie wyślę Ci mailem po webinarze.',
    newsletterHeading: 'Chcesz dostawać więcej takich treści?',
    newsletterText:
      'W newsletterze dzielę się poradami o rozwoju zawodowym i daję znać o kolejnych wydarzeniach. Możesz wypisać się w każdej chwili.',
    newsletterCta: 'Zapisz mnie do newslettera',
    newsletterDone: 'Dziękuję! Dopisałam Cię do newslettera.',
    shareHeading: 'Znasz kogoś, kto też utknął? Wyślij jej link',
    shareCta: 'Udostępnij link',
    copyCta: 'Skopiuj link',
    copied: 'Link skopiowany',
    consultationHeading: 'Nie chcesz czekać? Umów bezpłatną konsultację',
  },

  consent: {
    text: 'Używam plików cookies do analityki i mierzenia skuteczności reklam – tylko za Twoją zgodą.',
    accept: 'Akceptuję',
    reject: 'Odrzucam',
    policy: 'Polityka prywatności',
  },

  sticky: 'Zapisuję się bezpłatnie',
  stickyAfter: 'Wyślij mi nagranie',
} as const;
