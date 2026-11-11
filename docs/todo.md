# TODO – brakujące dane i integracje

Stan na 11.11.2026. Prototyp działa bez tych elementów; w kodzie i na stronie oznaczone `[DO UZUPEŁNIENIA]`.

## Dane do potwierdzenia
| # | Co | Gdzie w kodzie | Status |
|---|---|---|---|
| 1 | Termin i format: jedno spotkanie 3.12.2026, 19:00–20:00 | `event.config.ts` → `sessions` | założenie, do potwierdzenia |
| 2 | Platforma webinaru (Zoom/Meet/…) i sposób dołączenia w stanie `during` | `event.config.ts` → `platform`, `copy.during` | TODO |
| 3 | Odpowiedź FAQ „Czy będzie oferta sprzedażowa?” | `copy.ts` → `faq` | TODO |
| 4 | Zdjęcia Agnieszki w wysokiej rozdzielczości (hero pionowe 4:5, bio 1:1) | `PhotoPlaceholder` → `<Picture>` AVIF/WebP | TODO |
| 5 | **Zgoda autorek** opinii (Agnieszka – Handlowiec, Wiola – PM, Klaudia Rozmarynowska) na publikację na tym landingu; cytaty dosłowne z /wyzwanie2/ | `copy.ts` → `testimonials` | TODO – wymagana zgoda |
| 6 | URL regulaminu (webinaru? newslettera?) | `event.config.ts` → `site.termsUrl` | TODO |
| 7 | Link do bezpłatnej konsultacji | `event.config.ts` → `site.consultationUrl` | TBC |
| 8 | Dane administratora w stopce i klauzuli (obecnie ze stopki strony macierzystej, tylko na potrzeby mockupu) | `event.config.ts` → `controller` | TBC przy wydaniu |
| 9 | Weryfikacja prawna treści zgód, klauzuli i banera cookies | `copy.ts` | TODO przed wydaniem |
| 10 | Microsoft Clarity – czy używamy; jeśli tak, ID | `event.config.ts` → `analytics.clarityId` | decyzja |
| 11 | Test A/B nagłówka: przełącznik w konfiguracji (jest) czy podział 50/50 na brzegu (funkcja Cloudflare) | `headlineVariant` | decyzja |

## Integracje (kolejne etapy)
- **MailerLite**: identyfikatory grup (rejestracja, nagranie, newsletter), pole `webinar_source`, ustawienie double opt-in; funkcja `/api/subscribe` (walidacja, honeypot, grupy wg stanu, newsletter tylko przy zgodzie); przełączenie `form.mode` na `'api'`; zapis do newslettera z `/dziekuje/`.
- **Hosting**: konto Cloudflare Pages, podpięcie repo (preview dla PR), zmienna `MAILERLITE_API_KEY`, rekord DNS w webd.pl (patrz README).
- **Analityka**: `analytics.enabled = true` dopiero na produkcji (GA4 `G-GV74S860P0`, Meta Pixel `2031514730971566`); weryfikacja zdarzeń w GA4 DebugView i Meta Events Manager.
- **Meta**: obraz OG 1200×630 (nagłówek, data, zdjęcie) – po otrzymaniu zdjęć.
- **Lighthouse CI**: asercje budżetu w GitHub Actions (wydajność ≥95, LCP <2,5 s, CLS <0,1, TBT <200 ms, a11y 100, ≤300 KB).
- **Przeglądarki w aplikacjach**: testy z UA Facebooka i LinkedIna.
- **Przed wydaniem**: `allowPreviewParams = false` (wyłącza `?state=`, `?v=`, `?mock=fail`).
