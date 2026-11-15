# TODO – brakujące dane i integracje

## Stan na 15.11.2026 (handoff z sesji Cowork)

**Wdrożone:** subdomena `webinar.przystanzmianyzawodowej.pl` na webd (`public_html/webinar`), automatyczne wdrażanie FTPS z GitHub Actions, GA4 (kluczowe zdarzenie `generate_lead`, wymiary `webinar_id` i `landing_version`), Clarity (adres strony), og:image i tagi Open Graph.

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

**Po utworzeniu formularzy – zmiany w `event.config.ts`** (celowo jeszcze niezrobione): `mailerlite.forms.registration`, `mailerlite.forms.recording`, `mailerlite.newsletterGroupId = '165601664184616321'`, `mailerlite.groups.*` (nazwy), `form.mode = 'mailerlite'`, potem testowy zapis na produkcji. **Do tego czasu formularz na stronie nic nie zapisuje – bez reklam.**

### SSL – nierozwiązane (blokuje start)
- Subdomena ma certyfikat **self-signed** z cPanelu (ważny do 15.11.2027) → przeglądarki pokazują ostrzeżenie.
- Domena główna ma **płatny Positive SSL (Sectigo)** od webd, tylko `przystanzmianyzawodowej.pl` + `www` (abonament do 03.08.2027).
- Pakiet hostingu `agieness` = **Mini**; darmowy AutoSSL webd jest dopiero od pakietu **Large** – dlatego w cPanelu nie ma „Run AutoSSL”.
- Opcje (decyzja TY):
  1. zgłoszenie do supportu webd (treść gotowa, niewysłana) – zapytać o darmowy Let's Encrypt dla subdomeny na pakiecie Mini;
  2. pakiet Large – ok. 329,90 zł/rok (AutoSSL dla wszystkich (sub)domen);
  3. osobny płatny certyfikat dla subdomeny;
  4. ręczny Let's Encrypt co 90 dni – niezalecane (łatwo przegapić odnowienie).
  - Do rozważenia technicznie (bez kosztów, ale zmienia hosting/DNS): (a) subdomena jako CNAME do GitHub Pages – darmowy, automatycznie odnawiany certyfikat, pliki poza webd; (b) Cloudflare (darmowy plan) jako proxy – wymaga przeniesienia DNS całej domeny.
- Logowanie do cPanelu: „Logowanie za pośrednictwem WebdID” (poprzednia sesja wygasła).

## Dane do potwierdzenia
| # | Co | Gdzie w kodzie | Status |
|---|---|---|---|
| 1 | Termin: 3.12.2026, 19:00–20:30 (90 min), jedno spotkanie | `event.config.ts` → `sessions` | potwierdzone 15.11.2026 |
| 2 | Platforma webinaru (Zoom/Meet/…) i sposób dołączenia w stanie `during` | `event.config.ts` → `platform`, `copy.during` | TODO |
| 3 | Odpowiedź FAQ „Czy będzie oferta sprzedażowa?” | `copy.ts` → `faq` | TODO |
| 4 | Zdjęcia Agnieszki – jest jedno (1500×2000), kadry w `src/assets/photos/`; przydałoby się zdjęcie z przezroczystym tłem do v4 i większa rozdzielczość | `HostPhoto.astro` | częściowo |
| 5 | **Zgoda autorek** opinii (Agnieszka – Handlowiec, Wiola – PM, Klaudia Rozmarynowska) na publikację na tym landingu; cytaty dosłowne z /wyzwanie2/ | `copy.ts` → `testimonials` | TODO – wymagana zgoda |
| 6 | Regulamin: regulamin newslettera https://przystanzmianyzawodowej.pl/regulamin-newslettera/ | `event.config.ts` → `site.termsUrl` | zrobione |
| 7 | Link do bezpłatnej konsultacji | `event.config.ts` → `site.consultationUrl` | TBC |
| 8 | Dane administratora w stopce i klauzuli (obecnie ze stopki strony macierzystej, tylko na potrzeby mockupu) | `event.config.ts` → `controller` | TBC przy wydaniu |
| 9 | Weryfikacja prawna treści zgód, klauzuli i banera cookies | `copy.ts` | TODO przed wydaniem |
| 10 | Microsoft Clarity `ze0k15awef` – wdrożone (po zgodzie); w panelu Clarity wpisać adres strony | `event.config.ts` → `analytics.clarityId` | zrobione |
| 11 | Test A/B nagłówka: przełącznik w konfiguracji (jest) czy podział 50/50 na brzegu (funkcja Cloudflare) | `headlineVariant` | decyzja |

- Skrócenie treści zgody na newsletter (np. „Chcę też dostawać newsletter z poradami, wydarzeniami i ofertami. Mogę wycofać zgodę w każdej chwili.”) – tylko po akceptacji prawnej.
- Wersje: stroną główną jest v5; v1–v5 w archiwum `/archived/vN/` (noindex, tylko z adresu).
- v1: CLS 0,275 w Lighthouse mobile (przekracza budżet 0,1) – do poprawy, jeśli v1 zostanie.

**Instrukcja wdrożenia krok po kroku (subdomena, MailerLite, GA4, Clarity): [`docs/wdrozenie.md`](wdrozenie.md).**

## Integracje (kolejne etapy)
- **MailerLite**: patrz „Stan na 15.11.2026” – formularze, wpisanie ID, `form.mode = 'mailerlite'` (bez serwera i klucza API), decyzja o double opt-in, automatyzacje maili, zapis do newslettera z `/dziekuje/`.
- **Hosting**: zrobione – webd.pl (`public_html/webinar`) + wdrażanie FTPS z GitHub Actions; brakuje tylko zaufanego certyfikatu SSL (wyżej).
- **Analityka**: włączona po zgodzie na cookies (GA4 `G-GV74S860P0`, Meta Pixel `2031514730971566`, Clarity `ze0k15awef`); do zrobienia: weryfikacja zdarzeń w GA4 DebugView i Meta Events Manager po starcie zapisów.
- **Lighthouse CI**: asercje budżetu w GitHub Actions (wydajność ≥95, LCP <2,5 s, CLS <0,1, TBT <200 ms, a11y 100, ≤300 KB).
- **Przeglądarki w aplikacjach**: testy z UA Facebooka i LinkedIna.
- **Przed wydaniem**: `allowPreviewParams = false` (wyłącza `?state=`, `?v=`, `?mock=fail`).
