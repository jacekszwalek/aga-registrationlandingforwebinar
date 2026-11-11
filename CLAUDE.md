# CLAUDE.md

Squeeze page zapisu na bezpłatny webinar Przystani Zmiany Zawodowej. Astro (statyczny output) + TypeScript + czysty CSS.
Etap: **prototyp** – formularz w trybie mock, integracje to TODO (patrz `docs/todo.md`).

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
- `src/config/copy.ts` – cała treść strony
- `src/lib/` – czyste funkcje (stan wydarzenia, kalendarz/.ics, UTM, formatowanie) z testami
- `src/scripts/` – JS w przeglądarce: formularz, licznik, przyklejony przycisk, zgody, zdarzenia
- `src/components/`, `src/pages/` (`index`, `dziekuje`, `webinar.ics`)
- Stany `before|during|after`: `<html data-state>` ustawiany w `<head>`; elementy mają `data-show="before during"`.

## Zasady
- Nazwa wydarzenia to **webinar**. Nigdy „wyzwanie” – w treści, adresach, metadanych ani w kodzie.
- **Nie dodawaj nawigacji ani linków wychodzących.** Dozwolone: kotwice do formularza, linki prawne (polityka, regulamin), na `/dziekuje/` kalendarz Google i `.ics`. Test `landing.spec.ts` to pilnuje.
- Copy: per „Ty”, forma żeńska, ciepło i konkretnie. Nie wymyślaj opinii, liczb ani faktów o prowadzącej.
- Kontrast: przyciski = biały na `--pink-700` (hover `--pink-800`); biały na `--pink-600` tylko w dużych nagłówkach; `--pink-500` nigdy jako tło pod tekst; bez pomarańczowego. Tekst: `--ink`/`--text`.
- Żadnych skryptów stron trzecich przed zgodą (test w `consent-a11y.spec.ts`). Pola formularza ≥16 px, cele dotykowe ≥44 px.
- Brakujące dane oznaczaj wyłącznie `[DO UZUPEŁNIENIA]` (`TODO_MARK`) i dopisz do `docs/todo.md`.
- Ścieżki zawsze przez `withBase()` z `src/lib/paths.ts` – strona działa też pod podkatalogiem GitHub Pages.
- Sekrety (np. `MAILERLITE_API_KEY`) tylko w zmiennych środowiskowych hostingu – nigdy w repo.

## Git
- Gałąź robocza: `feat/landing-v1` (kolejne: `feat/…`, `fix/…`), PR do `main`.
- Conventional Commits, małe commity (`feat:`, `fix:`, `test:`, `docs:`, `build:`, `ci:`, `chore:`).
