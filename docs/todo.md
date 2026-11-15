# TODO – brakujące dane i integracje

## Stan na 15.11.2026 (handoff z sesji Cowork)

**Wdrożone:** landing pod **`https://przystanzmianyzawodowej.pl/webinar/`** (webd, `public_html/webinar`, base `/webinar/`; subdomena przekierowuje 301), automatyczne wdrażanie FTPS z GitHub Actions, GA4 (kluczowe zdarzenie `generate_lead`, wymiary `webinar_id` i `landing_version`), Clarity (adres strony), og:image i tagi Open Graph.

### MailerLite – częściowo, wstrzymane
| Element | Stan | ID |
|---|---|---|
| Konto | bez zmian | `1427944` |
| Grupa rejestracji | jest (dawna „GRUDNIOWY WEBINAR”, obecnie „2026-12-03-zostac-zmienic-wlasna-droga – rejestracja”) – **do przemianowania** na nową konwencję | `203786228197229581` |
| Grupa nagrania | jest („2026-12-03-zostac-zmienic-wlasna-droga – nagranie”) – **do przemianowania** | `204219029769946640` |
| Grupa newslettera | „Przystań Zmiany Zawodowej” | `165601664184616321` |
| Pole `webinar_source` | istniało wcześniej (`{$webinar_source}`) | – |
| Formularz rejestracji (przed/w trakcie) | **nie utworzony** (kreator otwarty, niezapisany) | – |
| Formularz nagrania (po webinarze) | **nie utworzony** | – |

**Konwencja nazw w MailerLite** (zwykły dywiz):
- grupy: `2026-12-03 - Zostać, zmienić pracę czy pójść własną drogą? - rejestracja` / `… - nagranie`
- formularze: `2026-12-03 - Zostać, zmienić pracę czy pójść własną drogą? - formularz rejestracji` / `… - formularz nagrania`
- `webinar_id` / `webinar_source` zostają techniczne: `2026-12-03-zostac-zmienic-wlasna-droga`.

**Po utworzeniu formularzy – zmiany w `event.config.ts`** (celowo jeszcze niezrobione): `mailerlite.forms.registration`, `mailerlite.forms.recording`, `mailerlite.newsletterGroupId = '165601664184616321'`, `mailerlite.groups.*` (nazwy), `form.mode = 'mailerlite'`, potem testowy zapis na `https://przystanzmianyzawodowej.pl/webinar/`. **Do tego czasu formularz na stronie nic nie zapisuje – bez reklam.**

### SSL – rozwiązane przeniesieniem na podstronę
- Subdomena miała tylko self-signed (pakiet Mini bez AutoSSL), więc landing przeniesiono na `https://przystanzmianyzawodowej.pl/webinar/` – ważny Positive SSL (Sectigo) domeny głównej (abonament do 03.08.2027, klucz do 18.02.2027 – **przypilnować odnowienia**).
- Zgłoszenie do supportu webd – niepotrzebne (niewysłane).
- Po wdrożeniu: sprawdzić, czy `https://webinar.przystanzmianyzawodowej.pl` / `http://…` przekierowuje 301 na podstronę (reguła w `deploy/htaccess-root`; w cPanelu nic nie ustawiać). Nie publikować adresu subdomeny.
- W WordPressie nie tworzyć strony/wpisu o slugu `webinar`.

## Dane do potwierdzenia
| # | Co | Gdzie w kodzie | Status |
|---|---|---|---|
| 1 | Termin: 3.12.2026, 19:00–20:30 (90 min), jedno spotkanie | `event.config.ts` → `sessions` | potwierdzone 15.11.2026 |
| 2 | Platforma webinaru (Zoom/Meet/…) i sposób dołączenia w stanie `during` | `event.config.ts` → `platform`, `copy.during` | TODO |
| 3 | Odpowiedź FAQ „Czy będzie oferta sprzedażowa?” | `copy.ts` → `faq` | TODO |
| 4 | Zdjęcia Agnieszki – jest jedno (1500×2000), kadry w `src/assets/photos/`; przydałoby się zdjęcie z przezroczystym tłem do v4 i większa rozdzielczość | `HostPhoto.astro` | częściowo |
| 5 | **Zgoda autorek** opinii (Maria – od 15.11.2026, pierwsza; Agnieszka – Handlowiec, Klaudia Rozmarynowska; opinia Wioli usunięta 15.11.2026) na publikację na tym landingu; cytaty dosłowne | `copy.ts` → `testimonials` | TODO – wymagana zgoda |
| 6 | Regulamin: regulamin newslettera https://przystanzmianyzawodowej.pl/regulamin-newslettera/ | `event.config.ts` → `site.termsUrl` | zrobione |
| 7 | Link do bezpłatnej konsultacji | `event.config.ts` → `site.consultationUrl` | TBC |
| 8 | Dane administratora w klauzuli przy formularzu (stopka od 15.11.2026 tylko z linkiem do polityki prywatności; dane jak w polityce) | `event.config.ts` → `controller` | TBC przy wydaniu |
| 9 | Weryfikacja prawna treści zgód, klauzuli i banera cookies | `copy.ts` | TODO przed wydaniem |
| 10 | Microsoft Clarity `ze0k15awef` – wdrożone (po zgodzie); w panelu Clarity wpisać adres strony | `event.config.ts` → `analytics.clarityId` | zrobione |
| 11 | Test A/B nagłówka: przełącznik w konfiguracji (jest) czy podział 50/50 na brzegu (funkcja Cloudflare) | `headlineVariant` | decyzja |

- Skrócenie treści zgody na newsletter (np. „Chcę też dostawać newsletter z poradami, wydarzeniami i ofertami. Mogę wycofać zgodę w każdej chwili.”) – tylko po akceptacji prawnej.
- Wersje: stroną główną jest v5; v1–v5 w archiwum `/archived/vN/` (noindex, tylko z adresu).
- v1: CLS 0,275 w Lighthouse mobile (przekracza budżet 0,1) – do poprawy, jeśli v1 zostanie.

**Instrukcja wdrożenia krok po kroku (hosting, MailerLite, GA4, Clarity): [`docs/wdrozenie.md`](wdrozenie.md).**

## Integracje (kolejne etapy)
- **MailerLite**: patrz „Stan na 15.11.2026” – formularze, wpisanie ID, `form.mode = 'mailerlite'` (bez serwera i klucza API), decyzja o double opt-in, automatyzacje maili, zapis do newslettera z `/dziekuje/`.
- **Hosting**: zrobione – `https://przystanzmianyzawodowej.pl/webinar/` (webd.pl, `public_html/webinar`) + wdrażanie FTPS z GitHub Actions.
- **Analityka**: włączona po zgodzie na cookies (GA4 `G-GV74S860P0`, Meta Pixel `2031514730971566`, Clarity `ze0k15awef`); do zrobienia: weryfikacja zdarzeń w GA4 DebugView i Meta Events Manager po starcie zapisów.
- **Lighthouse CI**: asercje budżetu w GitHub Actions (wydajność ≥95, LCP <2,5 s, CLS <0,1, TBT <200 ms, a11y 100, ≤300 KB).
- **Przeglądarki w aplikacjach**: testy z UA Facebooka i LinkedIna.
- **Przed wydaniem**: `allowPreviewParams = false` (wyłącza `?state=`, `?v=`, `?mock=fail`).
