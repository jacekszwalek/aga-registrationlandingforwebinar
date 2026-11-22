# Landing webinaru – Przystań Zmiany Zawodowej

Squeeze page zapisu na bezpłatne webinary Przystani Zmiany Zawodowej (Agnieszka Baranowska) oraz generator linków UTM.

| Co | Adres |
|---|---|
| **Landing (produkcja)** | https://przystanzmianyzawodowej.pl/webinar/ |
| Strona podziękowania | https://przystanzmianyzawodowej.pl/webinar/dziekuje/ |
| Licznik etapów (hasło) | https://przystanzmianyzawodowej.pl/webinar/licznik/ ([`docs/licznik.md`](docs/licznik.md)) |
| Krótkie linki (hasło) | https://przystanzmianyzawodowej.pl/webinar/licznik/linki/ ([`docs/skracacz.md`](docs/skracacz.md)) |
| **Generator linków UTM** | https://przystanzmianyzawodowej.pl/utmgen/ (narzędzie wewnętrzne, `noindex`) |
| Podgląd (GitHub Pages) | https://jacekszwalek.github.io/aga-registrationlandingforwebinar/ (+ `/utmgen/`) |

Bieżące wydarzenie: webinar **„Zostać, zmienić pracę czy pójść własną drogą?”** – 3 grudnia 2026, 19:00–20:30, online.

## Stan (16.11.2026)
- Landing działa na produkcji; **zapis przez API MailerLite** jest włączony i przetestowany (skrypt `api/subscribe.php`).
- MailerLite uporządkowany: grupa „Zgoda marketingowa”, grupy wydarzeń, standard nazw – [`docs/mailerlite-standard.md`](docs/mailerlite-standard.md).
- Przed startem promocji zostało: automatyzacja z podziękowaniem, link ClickMeeting w mailach i zaplanowanie przypomnień – lista: [`docs/mailerlite-raport-wdrozenia.md`](docs/mailerlite-raport-wdrozenia.md) (TODO).
- Strona ma `noindex` (`site.indexable = false`) do czasu startu promocji.

## Technologia
Astro (statyczny output) + TypeScript + czysty CSS; zapis do MailerLite przez PHP na hostingu webd.pl; generator UTM to osobna statyczna aplikacja (czysty JS) w `utmgen/`.

## Uruchomienie
Wymagany Node 22+.
```bash
npm install
npm run dev          # http://localhost:4321
```
Podgląd stanów (tylko poza wydaniem): `/?state=before`, `/?state=during`, `/?state=after`, wariant nagłówka `/?v=b`, symulacja błędu sieci `/?mock=fail`. Poza wydaniem formularz działa w trybie `mock` (nic nie wysyła).

Testy:
```bash
npm run test:unit                                   # Vitest
npm run build && PW_NO_WEBKIT=1 npm run test:e2e   # Playwright, lokalnie bez WebKita
npm run serve & npm run screenshots                 # zrzuty do docs/screenshots/
```

## Struktura
- `src/config/event.config.ts` – **termin**, identyfikator wydarzenia, grupy MailerLite, analityka, adresy. Termin zmieniaj tylko tutaj.
- `src/config/copy*.ts` – treści (`copy.v5.ts` – strona główna), `formMessages.ts` – komunikaty formularza.
- `src/pages/` – strona główna (v5), `dziekuje/`, `webinar.ics`, `api/event.json` (konfiguracja dla skryptu zapisu), archiwum `archived/v1–v5/`, `podglad/`.
- `public/api/subscribe.php` – zapis do MailerLite (grupy, pola, bez maila potwierdzającego).
- `public/api/track.php` + `public/licznik/` – licznik etapów bez cookies i panel z hasłem ([`docs/licznik.md`](docs/licznik.md)).
- `utmgen/` – generator linków UTM ([`docs/utmgen.md`](docs/utmgen.md)).
- `deploy/` – `.htaccess` wydania (HTTPS, cache, przekierowanie starej subdomeny).
- `docs/` – wdrożenie, MailerLite (audyt, standard, raport, decyzje), szablony maili, TODO.

## Wersje landingu
Stroną główną jest **v5** (treść z 15.11.2026, formularz w oknie, imię wymagane). Wcześniejsze wersje są w archiwum pod `/archived/v1/` … `/archived/v5/` – tylko z adresu, z `noindex`. Na podglądzie GitHub Pages działa przełącznik wersji i podgląd mobilny w ramce iPhone'a (`/podglad/`).

## Wdrożenie
- **Landing**: każdy push do `main` → `.github/workflows/deploy-webd.yml`: `npm run build:release` (base `/webinar/`, tryb formularza `api`, kontrola ścieżek `scripts/check-base.mjs`) → FTPS do `public_html/webinar` na webd.pl. Stara subdomena `webinar.przystanzmianyzawodowej.pl` przekierowuje 301 na podstronę.
- **Generator UTM**: zmiany w `utmgen/` → `deploy-utmgen.yml` → FTPS do `public_html/utmgen` (osobne konto FTP).
- **Podgląd**: `pages.yml` → gałąź `gh-pages` (wszystkie wersje + `/utmgen/`).
- **CI**: `ci.yml` – testy jednostkowe, `php -l`, build, testy e2e.
- Sekrety (FTP, klucz MailerLite) tylko w GitHub Secrets i na hostingu – nigdy w repozytorium. Klucz API MailerLite: `~/integrations-keys/.mailerlite-api-key` (katalog domowy konta, poza `public_html`).
- Szczegóły: [`docs/wdrozenie.md`](docs/wdrozenie.md).

## Zapis do MailerLite
Formularz → `api/subscribe.php` → API MailerLite. Każdy zapis trafia do grup: wydarzenia (rejestracja, a po webinarze – nagranie), „Uczestnicy wydarzeń”, „Interakcja RRRR”, „Webinar”; do „Zgoda marketingowa” – **tylko** po zaznaczeniu checkboxa. Pola: imię, `webinar_source` (UTM-y), „Pierwsze wydarzenie” (tylko nowe kontakty). Bez maila potwierdzającego; zapisywana data i IP.

Zasady (kto dostaje jakie maile, nowe wydarzenie krok po kroku, porządki w grupach): [`docs/mailerlite-standard.md`](docs/mailerlite-standard.md). Decyzje: [`docs/mailerlite-ustalenia.md`](docs/mailerlite-ustalenia.md). Szablony maili: `docs/maile/`.

> **Uwaga prawna:** treść zgody na newsletter, klauzuli informacyjnej i banera cookies wymaga weryfikacji prawnej.

## Nowe wydarzenie – w skrócie
1. MailerLite: grupy `RRRR-MM-DD - tytuł - rejestracja` i `… - nagranie`.
2. `event.config.ts`: `id`, `sessions`, `mailerlite.eventName`, `mailerlite.groups.registration/recording`; treść w `copy.v5.ts`.
3. Automatyzacja z podziękowaniem i kampanie (przypomnienia, link, nagranie) do grupy wydarzenia.
4. Linki do promocji z generatora UTM.
5. Testowy zapis na swój adres → sprawdzenie grup i pól → usunięcie testowego kontaktu.

Pełna instrukcja: [`docs/mailerlite-standard.md`](docs/mailerlite-standard.md#nowe-wydarzenie--krok-po-kroku).

## Po webinarze: nagranie
Link do niepublicznego filmu **nie trafia na stronę** – wysyła go MailerLite (kampania do grupy rejestracji i automatyzacja dla grupy „nagranie”). Strona po zakończeniu webinaru sama przełącza się na zapis po nagranie.

## Linki UTM
Twórz je w generatorze https://przystanzmianyzawodowej.pl/utmgen/ ([`docs/utmgen.md`](docs/utmgen.md)): zaznaczasz miejsca (kanały i ich rodzaje), a linki powstają od razu, pogrupowane według platform, z kopiowaniem i eksportem CSV.

Zasady:
- `utm_campaign`: **wydarzenie jednorazowe** – data rozpoczęcia RRMMDD (np. `261203`; drugie tego dnia `261203-2`) – skraca link i jednoznacznie wskazuje kampanię; **wydarzenie cykliczne lub stała kampania** – nazwa, zawsze ta sama (np. `ebook-najlepsza-uczennica`);
- `utm_source` / `utm_medium` – z listy kanałów generatora (np. `facebook` / `group`), małe litery i myślniki;
- `utm_content` – opcjonalnie, do porównania materiałów (np. `grafika-z-kubkiem`); nie wpisuj nic, co zdradza treść reklamy;
- partnerzy: `utm_source=partner-nazwa`, `utm_medium=referral`; polecenia z `/dziekuje/` dodają się same (`utm_source=referral`).

| Przykład | Link |
|---|---|
| Facebook – grupa | `?utm_source=facebook&utm_medium=group&utm_campaign=261203` |
| Instagram – bio | `?utm_source=instagram&utm_medium=bio&utm_campaign=261203` |
| Reklama na Instagramie | `?utm_source=instagram&utm_medium=paid&utm_campaign=261203&utm_content=grafika-a` |
| Newsletter | `?utm_source=mailerlite&utm_medium=email&utm_campaign=261203` |
| E-book (stała kampania) | `?utm_source=facebook&utm_medium=social&utm_campaign=ebook-najlepsza-uczennica` |

## Zmiana terminu
Edytuj **tylko** `src/config/event.config.ts` → `sessions` (ISO z przesunięciem: `+01:00` zimą, `+02:00` latem). Data na stronie, licznik, `.ics` i Kalendarz Google wyliczają się same; strona sama przełącza stany `before → during → after`.

## Checklista przed każdą zmianą
- [ ] Termin tylko w `event.config.ts`, treść tylko w plikach `copy*.ts`.
- [ ] Na landingu nie ma słowa „wyzwanie”, nawigacji ani linków wychodzących (poza prawnymi).
- [ ] Kolory spełniają kontrast AA (testy axe).
- [ ] `npm run build && npm run test:unit && PW_NO_WEBKIT=1 npm run test:e2e` przechodzą.
- [ ] Przed startem promocji: `site.indexable = true`, brak `[DO UZUPEŁNIENIA]` na stronie, testowy zapis przeszedł.

## Dokumentacja
| Plik | Zawartość |
|---|---|
| [`docs/todo.md`](docs/todo.md) | brakujące dane i zadania |
| [`docs/wdrozenie.md`](docs/wdrozenie.md) | hosting, wdrażanie, GA4, Clarity, MailerLite |
| [`docs/mailerlite-standard.md`](docs/mailerlite-standard.md) | zasady grup, zgód i nowych wydarzeń |
| [`docs/mailerlite-raport-wdrozenia.md`](docs/mailerlite-raport-wdrozenia.md) | co zrobiono w MailerLite, lista TODO |
| [`docs/mailerlite-ustalenia.md`](docs/mailerlite-ustalenia.md) | decyzje (ADL) i ważne notatki |
| [`docs/mailerlite-raport.pdf`](docs/mailerlite-raport.pdf) | audyt MailerLite (stan zastany) |
| [`docs/utmgen.md`](docs/utmgen.md) | generator linków UTM |
| [`docs/licznik.md`](docs/licznik.md) | licznik etapów bez cookies |
| [`docs/skracacz.md`](docs/skracacz.md) | skracacz linków (generator UTM) |
| [`docs/decisions.md`](docs/decisions.md) | decyzje projektowe landingu |
