# Landing rejestracyjny – webinar Przystani Zmiany Zawodowej

Squeeze page zapisu na bezpłatny webinar (docelowo `webinar.przystanzmianyzawodowej.pl`).
**Stan: prototyp/mockup** – formularz niczego nie wysyła, integracje opisane w [`docs/todo.md`](docs/todo.md).

## Uruchomienie
Wymagany Node 22+.
```bash
npm install
npm run dev          # http://localhost:4321
```
Podgląd stanów w prototypie: `/?state=before`, `/?state=during`, `/?state=after`, wariant nagłówka `/?v=b`, symulacja błędu sieci `/?mock=fail`.

Testy:
```bash
npm run test:unit
npm run build && PW_NO_WEBKIT=1 npm run test:e2e   # lokalnie bez WebKita
npm run serve & npm run screenshots                # zrzuty do docs/screenshots/
```

## Podgląd prototypu (GitHub Pages)
https://jacekszwalek.github.io/aga-registrationlandingforwebinar/

Każdy push do `main` uruchamia workflow `pages.yml`: build z `BASE_PATH=/aga-registrationlandingforwebinar` i publikacja na gałęzi `gh-pages`. Jednorazowo w repo: *Settings → Pages → Build and deployment → Source: Deploy from a branch → `gh-pages` / `(root)`*. Strona ma `noindex` (`site.indexable = false`).

## Zmiana terminu
Edytuj **tylko** `src/config/event.config.ts` → `sessions` (ISO z przesunięciem: `+01:00` zimą, `+02:00` latem). Data w nadtytule, szczegółach, liczniku, `.ics` i Kalendarzu Google wylicza się sama; strona sama przełącza stany `before → during → after`.

## Po webinarze: nagranie
Link do niepublicznego filmu YouTube **nie trafia na stronę**. Wpisz go w automatyzacji MailerLite dla grupy „nagranie” (i ewentualnie w `recording.url` dla porządku). Strona w stanie `after` zbiera zapisy na nagranie.

## Wdrożenie (TODO – Cloudflare Pages)
1. Załóż konto Cloudflare, *Workers & Pages → Create → Pages → Connect to Git*, wybierz to repo.
2. Build: `npm run build`, katalog wyjściowy: `dist`, zmienna `NODE_VERSION=22`.
3. Każdy PR dostaje adres preview `*.pages.dev`.
4. *Settings → Variables and Secrets*: dodaj `MAILERLITE_API_KEY` jako **Secret** (Production i Preview). Klucz wygenerujesz w MailerLite: *Integrations → API*. Nie wpisuj go do repo ani do plików `.env`.
5. *Custom domains → Set up a domain*: `webinar.przystanzmianyzawodowej.pl`.

### Rekord DNS w webd.pl
W panelu webd.pl, w strefie DNS domeny `przystanzmianyzawodowej.pl`, dodaj:

| Typ | Nazwa | Wartość | TTL |
|---|---|---|---|
| CNAME | `webinar` | `<nazwa-projektu>.pages.dev` | 3600 |

Wartość podaje Cloudflare w kroku 5. Po propagacji (zwykle do godziny) Cloudflare sam wystawi certyfikat HTTPS. Nie zmieniaj rekordów domeny głównej.

## MailerLite (TODO)
Trzy grupy: rejestracja, nagranie, newsletter. Ich ID wpisz w `event.config.ts → mailerlite.groups`, a `form.mode` zmień na `'api'`. Pole `webinar_source` (tekst) dostaje UTM-y w formacie `utm_campaign=…|utm_medium=…|utm_source=…`.

> **Uwaga prawna:** treść zgody na newsletter, klauzuli informacyjnej i banera cookies wymaga weryfikacji prawnej przed publikacją.

## Oznaczanie linków (UTM) – propozycja
Strona przekazuje każdy parametr `utm_*`, więc schemat można zmieniać bez zmian w kodzie.

| Kanał | Przykład |
|---|---|
| Facebook – post | `?utm_source=facebook&utm_medium=social&utm_campaign=webinar-2026-12&utm_content=post-1` |
| Facebook – grupa | `?utm_source=facebook&utm_medium=group&utm_campaign=webinar-2026-12&utm_content=nazwa-grupy` |
| LinkedIn – post | `?utm_source=linkedin&utm_medium=social&utm_campaign=webinar-2026-12&utm_content=post-1` |
| Newsletter | `?utm_source=mailerlite&utm_medium=email&utm_campaign=webinar-2026-12` |
| Polecenie (automatycznie z /dziekuje/) | `?utm_source=referral&utm_medium=share` |

Zasady: małe litery, myślniki zamiast spacji, `utm_content` rozróżnia konkretne posty.

## Checklista przed każdą edycją
- [ ] Zmieniam termin tylko w `event.config.ts`, treść tylko w `copy.ts`.
- [ ] Słowo „wyzwanie” nie pojawia się nigdzie.
- [ ] Nie dodaję nawigacji ani linków wychodzących.
- [ ] Nowe kolory spełniają kontrast AA (test axe).
- [ ] `npm run build && npm run test:unit && PW_NO_WEBKIT=1 npm run test:e2e` przechodzą.
- [ ] Przed wydaniem: `allowPreviewParams = false`, `analytics.enabled = true`, brak `[DO UZUPEŁNIENIA]` na stronie.
