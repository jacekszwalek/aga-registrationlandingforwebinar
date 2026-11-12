/** Komunikaty formularza – osobny moduł, żeby JS w przeglądarce nie dociągał całej treści strony. */
export const formMessages = {
  emailRequired: 'Wpisz adres e-mail, na który wyślę link.',
  emailInvalid: 'Sprawdź adres e-mail – wygląda na niepełny (np. imie@domena.pl).',
  nameTooLong: 'Imię może mieć najwyżej 60 znaków.',
  network: 'Nie udało się połączyć. Twoje dane są zachowane – spróbuj ponownie za chwilę.',
} as const;
