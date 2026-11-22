# Licznik etapów bez cookies

**Panel:** https://przystanzmianyzawodowej.pl/webinar/licznik/ (hasło – zna je Agnieszka i Jacek; nie zapisujemy go w repo).

## Po co
GA4, Clarity i Meta Pixel działają dopiero po zgodzie na cookies, a większość osób z reklam jej nie daje – dlatego nie widzieliśmy, gdzie ludzie odpadają. Licznik mierzy lejek dla **wszystkich** wejść, bez zgody, bo nie zbiera danych osobowych i niczego nie zapisuje w przeglądarce.

## Co jest zapisywane
Jedna linia na zdarzenie w `~/webinar-stats/events.jsonl` (katalog domowy konta, poza `public_html`):
czas, zdarzenie, losowy identyfikator wczytania strony (tylko w pamięci karty), rodzaj strony (landing/dziekuje), stan wydarzenia,
`utm_source/medium/campaign/content`, `mobile/desktop`, aplikacja (Facebook/Instagram/przeglądarka), przy błędach – pole i powód.
**Nie** zapisujemy: IP, user-agenta, e-maila, imienia, cookies, localStorage. Boty (podglądy linków, crawlery) są pomijane.

Zdarzenia: `page_view` (tylko gdy strona jest widoczna), `page_preload` (wczytanie w tle przez aplikację Instagram/Facebook, bez pokazania), `engaged` (pierwszy dotyk, kliknięcie, klawisz lub przewinięcie), `stay_10s` / `stay_30s` (strona widoczna 10 / 30 s), `scroll_50`, `scroll_90`, `sticky_cta_click`, `form_open`, `form_start`, `form_submit_attempt`,
`form_error` (`name/email · required/invalid`, `network · network` lub `network · http-NNN`), `signup` (serwer przyjął zapis),
`generate_lead`, `newsletter_signup`, `add_to_calendar`, `consultation_click`, `logo_click`, `share_click`.

## Jak to działa
- `src/lib/funnel.ts` (czyste funkcje, testy `tests/unit/funnel.test.ts`), `src/scripts/funnel.ts` – `navigator.sendBeacon` do `api/track.php`; wywoływane z `track()` (`src/scripts/track.ts`) i po udanym zapisie w `form.ts`. Włączone tylko w wydaniu (`eventConfig.funnel.enabled`).
- `public/api/track.php` – sprawdza Origin, filtruje boty, limit 300 zdarzeń / 10 min na adres, biała lista zdarzeń, czyszczenie wartości; plik maks. 30 MB.
- `public/licznik/index.php` – panel: lejek, tabele wg źródła, materiału (`utm_content`), urządzenia/aplikacji, dni, błędy, ostatnie zdarzenia; filtry daty, kampanii i źródła.
- `public/api/_stats.php` – wspólne funkcje (bez dostępu z zewnątrz).

## Hasło
Sprawdzane przez `password_verify`; w repo jest tylko skrót bcrypt (`DEFAULT_HASH` w `index.php`). Zmiana hasła bez wdrożenia: na hostingu utwórz plik `~/integrations-keys/.licznik-webinar-hash` z wynikiem `php -r 'echo password_hash("NOWE_HASLO", PASSWORD_BCRYPT);'`. Zmiana hasła wylogowuje wszystkich. Logowanie: ciasteczko tylko dla panelu (30 dni, HttpOnly, Secure, SameSite=Strict), limit 10 prób / 15 min.

## Uwagi
- Liczby to wczytania strony, nie osoby (odświeżenie = nowe wejście). Źródłem prawdy o zapisach jest MailerLite.
- Polityka prywatności: warto dopisać zdanie o anonimowym liczniku statystyk bez cookies (do weryfikacji prawnej – `docs/todo.md`).
- Zerowanie danych: usuń plik `~/webinar-stats/events.jsonl` w Menedżerze plików cPanelu.

## Wczytania w tle (Instagram/Facebook)
Aplikacje Meta wczytują stronę z reklamy z wyprzedzeniem, zanim osoba kliknie (preload) – skrypty wykonują się, choć nikt strony nie widzi. Do 22.11.2026 liczyły się one jako wejścia (np. 264 wejścia z Instagrama, z czego 6 przewinięć). Teraz `page_view` wysyłamy dopiero, gdy strona jest widoczna, a miarą „prawdziwych” wejść jest `engaged`.

## Człowiek czy bot – ocena wejść
Każde wczytanie landingu dostaje jedną ocenę (liczy się najmocniejszy sygnał):
1. **bot** – flagi automatu w polu `bt` (tylko tak/nie, bez odcisku przeglądarki): `wd` = `navigator.webdriver`, `hl` = „Headless” w user-agencie, `nl` = brak języków, `sz` = zerowy ekran/okno;
2. **nie człowiek** – `page_preload` bez `page_view` (aplikacja wczytała stronę w tle, nikt jej nie zobaczył);
3. **pewny człowiek** – dotyk, klik, klawisz lub przewinięcie (`engaged`, `scroll_50`, `form_open`…);
4. **raczej człowiek** – strona widoczna ≥ 10 s bez dotyku;
5. **szybkie wyjście albo bot** – reszta.
Panel pokazuje rozkład ocen i tabelę według źródła/aplikacji; w dzienniku każde zdarzenie ma ocenę swojego wejścia. Sygnały zbierane od 22.11.2026.

## Dziennik zdarzeń
Filtr typu zdarzenia (z liczbą wystąpień), 50 / 100 / 500 wpisów na stronę, przyciski „Nowsze” / „Starsze”; filtry daty, kampanii i źródła obowiązują też dziennik.
