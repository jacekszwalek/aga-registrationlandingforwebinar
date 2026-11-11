# Research – stan wyjściowy (11.11.2026)

Zrzuty Playwright (Chromium, deviceScaleFactor 1) w dwóch rozmiarach:
390×844 (mobile, `isMobile`) i 1440×900 (desktop). Dla każdej strony:
`*-fold.png` (pierwszy ekran) i `*-full.png` (cała strona).

| Strona | Wys. desktop | H1 | Uwagi |
|---|---|---|---|
| `/` | 7680 px | „ZMIENIAJ ŻYCIE ZAWODOWE ŚWIADOMIE” | 18 linków w nagłówku, 16 w stopce |
| `/wyzwanie2/` | 6673 px (mobile ~10 465 px) | „INNE SPOJRZENIE NA TWOJĄ KARIERĘ” | formularz MailerLite `data-form="QntRwj"` |
| `/wyzwanie/` | 1347 px | brak H1 | „Przykro mi! Wyzwanie zakończone” – ślepa uliczka |
| `/dziekuje/` | 1347 px | brak H1 | „Dziękuję za zapis! Widzimy się na webinarze :)” – brak następnego kroku |
| `/o-mnie/` | 5232 px | brak H1 | źródło bio |

## Wnioski

1. **Pierwszy ekran nie sprzedaje zapisu.** Na obu szerokościach pierwszy ekran
   to nawigacja i dekoracyjne zdjęcie (kubek, sweter) z ogólnym hasłem.
   Obietnica, termin i formularz zaczynają się dopiero niżej. Na mobile po
   pierwszym ekranie widać sam akapit tekstu. Zdjęcia prowadzącej w hero nie ma.
2. **Uwagę rozprasza 34 linki** (menu, konto, koszyk, „Kontakt” jako główny
   przycisk w nagłówku), a na desktopie strona ma ~7,4 ekranu wysokości.
3. **Ciężki stos:** ~75 skryptów (WooCommerce, React z WP, jQuery UI, Tutor LMS,
   Przelewy24) ładowanych na landingu. Do tego CookieYes, Meta Pixel
   `2031514730971566` i **GA4 `G-GV74S860P0`**, który już działa na stronie
   macierzystej. Nie ma `og:image`, więc podgląd linku w FB i LinkedIn jest
   przypadkowy.
4. **Typografia:** Poppins 400/700 przez Adobe Fonts (kit `xrm5jik`). Poppins
   ma licencję OFL, więc można go legalnie hostować lokalnie. Nagłówki są
   w **LT Flode Neue Medium**, self-hostowanym na WordPressie
   (`ltflodeneue-medium-webfont.woff2`). To krój komercyjny i licencja na
   web jest nieznana.
5. **Strony po zapisie i po wydarzeniu marnują ruch.** `/wyzwanie/` nie zbiera
   zapisów (nawet na nagranie), a `/dziekuje/` nie daje kalendarza, prośby
   o sprawdzenie skrzynki ani następnego kroku.
6. **Treść jest dobra i nadaje się do skrócenia:** „Brzmi znajomo?” (3 punkty),
   rezultaty dnia 1–3, „Dla kogo / nie dla kogo”, bio i 9 opinii z dopiskiem
   „zweryfikowane i opublikowane za zgodą autorek”. Opinie dotyczą konsultacji
   i współpracy, nie samego wydarzenia.

Uwaga metodologiczna: środowisko, w którym robiono zrzuty, nie ma dostępu do
`assets.mailerlite.com`, więc osadzony formularz się nie wyrenderował (pusta
lewa kolumna na desktopie). Opis formularza (textarea zamiast pola „Imię”,
pomarańczowy przycisk) pochodzi z briefu.
