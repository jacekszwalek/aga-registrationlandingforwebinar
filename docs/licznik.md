# Licznik etapów bez cookies

**Panel:** https://przystanzmianyzawodowej.pl/webinar/licznik-webinar/ (hasło – zna je Agnieszka i Jacek; nie zapisujemy go w repo).

## Po co
GA4, Clarity i Meta Pixel działają dopiero po zgodzie na cookies, a większość osób z reklam jej nie daje – dlatego nie widzieliśmy, gdzie ludzie odpadają. Licznik mierzy lejek dla **wszystkich** wejść, bez zgody, bo nie zbiera danych osobowych i niczego nie zapisuje w przeglądarce.

## Co jest zapisywane
Jedna linia na zdarzenie w `~/webinar-stats/events.jsonl` (katalog domowy konta, poza `public_html`):
czas, zdarzenie, losowy identyfikator wczytania strony (tylko w pamięci karty), rodzaj strony (landing/dziekuje), stan wydarzenia,
`utm_source/medium/campaign/content`, `mobile/desktop`, aplikacja (Facebook/Instagram/przeglądarka), przy błędach – pole i powód.
**Nie** zapisujemy: IP, user-agenta, e-maila, imienia, cookies, localStorage. Boty (podglądy linków, crawlery) są pomijane.

Zdarzenia: `page_view`, `scroll_50`, `scroll_90`, `sticky_cta_click`, `form_open`, `form_start`, `form_submit_attempt`,
`form_error` (`name/email · required/invalid`, `network · network` lub `network · http-NNN`), `signup` (serwer przyjął zapis),
`generate_lead`, `newsletter_signup`, `add_to_calendar`, `consultation_click`, `logo_click`, `share_click`.

## Jak to działa
- `src/lib/funnel.ts` (czyste funkcje, testy `tests/unit/funnel.test.ts`), `src/scripts/funnel.ts` – `navigator.sendBeacon` do `api/track.php`; wywoływane z `track()` (`src/scripts/track.ts`) i po udanym zapisie w `form.ts`. Włączone tylko w wydaniu (`eventConfig.funnel.enabled`).
- `public/api/track.php` – sprawdza Origin, filtruje boty, limit 300 zdarzeń / 10 min na adres, biała lista zdarzeń, czyszczenie wartości; plik maks. 30 MB.
- `public/licznik-webinar/index.php` – panel: lejek, tabele wg źródła, materiału (`utm_content`), urządzenia/aplikacji, dni, błędy, ostatnie zdarzenia; filtry daty, kampanii i źródła.
- `public/api/_stats.php` – wspólne funkcje (bez dostępu z zewnątrz).

## Hasło
Sprawdzane przez `password_verify`; w repo jest tylko skrót bcrypt (`DEFAULT_HASH` w `index.php`). Zmiana hasła bez wdrożenia: na hostingu utwórz plik `~/integrations-keys/.licznik-webinar-hash` z wynikiem `php -r 'echo password_hash("NOWE_HASLO", PASSWORD_BCRYPT);'`. Zmiana hasła wylogowuje wszystkich. Logowanie: ciasteczko tylko dla panelu (30 dni, HttpOnly, Secure, SameSite=Strict), limit 10 prób / 15 min.

## Adres bez /webinar/ (opcjonalnie)
Konto FTP wdrożenia widzi tylko `public_html/webinar`, więc panel jest pod `/webinar/licznik-webinar/`. Krótszy adres `https://przystanzmianyzawodowej.pl/licznik-webinar` wymaga jednej reguły w `public_html/.htaccess` (WordPress), **przed** blokiem `# BEGIN WordPress`:
```
RewriteEngine On
RewriteRule ^licznik-webinar/?$ /webinar/licznik-webinar/ [R=302,L]
```

## Uwagi
- Liczby to wczytania strony, nie osoby (odświeżenie = nowe wejście). Źródłem prawdy o zapisach jest MailerLite.
- Polityka prywatności: warto dopisać zdanie o anonimowym liczniku statystyk bez cookies (do weryfikacji prawnej – `docs/todo.md`).
- Zerowanie danych: usuń plik `~/webinar-stats/events.jsonl` w Menedżerze plików cPanelu.
