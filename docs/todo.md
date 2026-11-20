# TODO – brakujące dane i integracje

## Stan na 15.11.2026 (handoff z sesji Cowork)

**Wdrożone:** landing pod **`https://przystanzmianyzawodowej.pl/webinar/`** (webd, `public_html/webinar`, base `/webinar/`; subdomena przekierowuje 301), automatyczne wdrażanie FTPS z GitHub Actions, GA4 (kluczowe zdarzenie `generate_lead`, wymiary `webinar_id` i `landing_version`), Clarity (adres strony), og:image i tagi Open Graph.

### MailerLite – wdrożone 15.11.2026 (czeka na klucz API na serwerze)
Struktura grup, zgody i zapis przez API: [`mailerlite-standard.md`](mailerlite-standard.md); co zrobiono i **pełna lista TODO** (klucz API, automatyzacje A1/A2, link ClickMeeting, e-book, przekierowanie /wyzwanie2/): [`mailerlite-raport-wdrozenia.md`](mailerlite-raport-wdrozenia.md). **Do wgrania klucza API formularz na stronie nic nie zapisuje – bez reklam.**

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

## Do rozważenia
### Nagłówek „Jesteś zapisana!” na `/dziekuje/` – osoby, które nie są kobietami (17.11.2026, decyzja: na razie bez zmian)
Problem: nagłówek ma formę żeńską. Webinar jest głównie dla kobiet, ale zapisać się może każdy; nie chcemy pytać o płeć.

- **Odrzucone: warunek „imię kończy się na -a”.** Myli się w obie strony: kobiety bez „-a” (Margaret, Ingrid, Karin, Nicole, Beatrycze, Miriam, Noemi, pseudonimy, inicjały) i mężczyźni z „-a” (Kuba, Barnaba, Kosma, Jarema). „Zapisana/zapisany” z ukośnikiem brzmi urzędowo.
- **Opcje:**

| Opcja | Przykład | Plusy | Minusy |
|---|---|---|---|
| A. Neutralnie z imieniem (rekomendacja) | „**Dziękuję, Margaret!** Twoje miejsce na webinarze jest zarezerwowane.” | osobiste, ciepłe, bez zgadywania | dłuższe |
| B. Neutralnie bez imienia | „**Gotowe – miejsce jest Twoje!**” / „**Do zobaczenia 3 grudnia!**” | krótkie | mniej osobiste |
| C. Zostawić formę żeńską (stan obecny) | „Jesteś zapisana!” | spójne z marką | mężczyzna dostaje formę żeńską |
| D. Warunek „-a” | – | – | błędy w obie strony |

- **Formy neutralne po polsku:** rzeczownik lub czas teraźniejszy zamiast czasownika w przeszłym / przymiotnika – „Twoje miejsce jest zarezerwowane”, „Masz miejsce na webinarze”, „Zapis potwierdzony”.
- **Proponowany zakres, jeśli wdrożymy:** tylko `/dziekuje/` (wariant A, a gdy imienia brak – B); reszta landingu zostaje w formie żeńskiej (świadoma zasada marki w CLAUDE.md). Temat maila A1 „{$name}, jesteś zapisana!” → „{$name}, Twoje miejsce jest zarezerwowane – widzimy się 3 grudnia o 19:00”.
- **Technicznie:** imię jest znane tylko w karcie, w której był zapis (`sessionStorage`) – trzeba je zapamiętywać przy każdym zapisie (dziś tylko bez zgody na newsletter); przy wejściu z linku – wariant B.

## Integracje (kolejne etapy)
- **MailerLite**: tryb `api` (`public/api/subscribe.php`) – TODO w [`mailerlite-raport-wdrozenia.md`](mailerlite-raport-wdrozenia.md).
- **Hosting**: zrobione – `https://przystanzmianyzawodowej.pl/webinar/` (webd.pl, `public_html/webinar`) + wdrażanie FTPS z GitHub Actions.
- **Analityka**: włączona po zgodzie na cookies (GA4 `G-GV74S860P0`, Meta Pixel `2031514730971566`, Clarity `ze0k15awef`); do zrobienia: weryfikacja zdarzeń w GA4 DebugView i Meta Events Manager po starcie zapisów.
- **Lighthouse CI**: asercje budżetu w GitHub Actions (wydajność ≥95, LCP <2,5 s, CLS <0,1, TBT <200 ms, a11y 100, ≤300 KB).
- **Przeglądarki w aplikacjach**: testy z UA Facebooka i LinkedIna.
- **Przed wydaniem**: `allowPreviewParams = false` (wyłącza `?state=`, `?v=`, `?mock=fail`).

- [ ] Polityka prywatności: dopisać anonimowy licznik statystyk bez cookies (`docs/licznik.md`) – do weryfikacji prawnej.
- [ ] (opcjonalnie) Reguła w `public_html/.htaccess` dla krótkiego adresu `/licznik-webinar` (`docs/licznik.md`).
