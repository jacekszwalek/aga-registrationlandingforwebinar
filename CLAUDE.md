# CLAUDE.md

Squeeze page zapisu na bezpłatny webinar Przystani Zmiany Zawodowej. Astro (statyczny output) + TypeScript + czysty CSS.
Etap: **prototyp** – formularz w trybie mock, integracje to TODO (patrz `docs/todo.md`).
Cztery wersje: **v1** (`/v1/`, pełny landing z briefu), **v2** (`/v2/`, krótka squeeze page w stylu strony-matki – domyślna), **v3** (`/v3/`, kompozycja Tailwind, formularz w `<dialog>`), **v4** (`/v4/`, kompozycja Unbounce). `/` przekierowuje do `/v2/` z zachowaniem query stringu.

## Komendy
- `npm run dev` – serwer deweloperski
- `npm run build` – `astro check` + build do `dist/`
- `npm run serve` – serwer statyczny `dist/` na :4321 (używany też przez Playwright; `astro preview` w Astro 7 przechodzi w tło)
- `npm run build:pages` – build pod GitHub Pages (`/aga-registrationlandingforwebinar/`)
- `npm run test:unit` – Vitest (`tests/unit`)
- `PW_NO_WEBKIT=1 npm run test:e2e` – Playwright lokalnie bez WebKita; na CI bez zmiennej
- `npm run screenshots` – zrzuty referencyjne do `docs/screenshots/` (wymaga `npm run serve`)

## Struktura
- `src/config/event.config.ts` – termin (sesje ISO z przesunięciem strefy), wariant H1, grupy MailerLite, analityka, linki. **Termin zmieniaj tylko tutaj.**
- `src/config/copy.ts` – treść (v1 + wspólna), `copy.v2.ts` – skrócona treść v2, `formMessages.ts` – komunikaty formularza
- `src/lib/` – czyste funkcje (stan wydarzenia, kalendarz/.ics, UTM, formatowanie) z testami
- `src/scripts/` – JS w przeglądarce: formularz, licznik, przyklejony przycisk, zgody, zdarzenia
- `src/components/` – wspólne (Header z przełącznikiem wersji, ConsentBanner, StickyCta, DuringBanner, PhotoPlaceholder); `components/v1/` … `components/v4/`
- `src/pages/` – `index` (przekierowanie), `v1/`, `v2/` (każda z `dziekuje/`), `webinar.ics`
- `src/config/copy.v34.ts` – treść v3/v4
- `src/styles/` – `foundation.css` (fonty, tokeny, stany), `v1.css`, `v2.css` (baza marki), `v3.css`/`v4.css` (importują v2.css) (wektor wyglądu: `docs/research/design-vector.md`)
- Stany `before|during|after`: `<html data-state>` ustawiany w `<head>`; elementy mają `data-show="before during"`.

## Zasady
- Nazwa wydarzenia to **webinar**. Nigdy „wyzwanie” – w treści, adresach, metadanych ani w kodzie.
- **Nie dodawaj nawigacji ani linków wychodzących.** Dozwolone: kotwice do formularza, linki prawne (polityka, regulamin), przełącznik wersji prototypu, na `/dziekuje/` kalendarz Google i `.ics`. Pilnują tego testy (`isAllowedLink` w `tests/e2e/helpers.ts`).
- Copy: per „Ty”, forma żeńska, ciepło i konkretnie. Nie wymyślaj opinii, liczb ani faktów o prowadzącej.
- Kontrast: przyciski = biały na `--pink-700` (hover `--pink-800`); biały na `--pink-600` tylko w dużych nagłówkach; `--pink-500` nigdy jako tło pod tekst; bez pomarańczowego. Tekst: `--ink`/`--text`.
- v2: nagłówki WIELKIMI LITERAMI w LT Flode Neue, przyciski prostokątne (radius 4 px) – jak strona-matka. Treść ponad hero chowaj w `<details class="more">`.
- Żadnych skryptów stron trzecich przed zgodą (testy `v1-consent-a11y.spec.ts`, `v2.spec.ts`). Pola formularza ≥16 px, cele dotykowe ≥44 px.
- Brakujące dane oznaczaj wyłącznie `[DO UZUPEŁNIENIA]` (`TODO_MARK`) i dopisz do `docs/todo.md`.
- Ścieżki zawsze przez `withBase()` z `src/lib/paths.ts` – strona działa też pod podkatalogiem GitHub Pages.
- Sekrety (np. `MAILERLITE_API_KEY`) tylko w zmiennych środowiskowych hostingu – nigdy w repo.

## Git
- Gałąź robocza: `feat/landing-v1` (kolejne: `feat/…`, `fix/…`), PR do `main`.
- Conventional Commits, małe commity (`feat:`, `fix:`, `test:`, `docs:`, `build:`, `ci:`, `chore:`).
