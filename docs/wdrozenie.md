# Wdrożenie: subdomena, MailerLite, GA4, Clarity

Stan na 15.11.2026. Kod jest gotowy na każdy z kroków; brakuje danych i ustawień w panelach (oznaczone **TY**).

## Architektura (bez serwera i bez WordPressa)
- Strona: statyczny build Astro na **GitHub Pages** z własną domeną `webinar.przystanzmianyzawodowej.pl` (bez Cloudflare).
- Zapis: formularz na stronie wysyła dane **prosto do formularza MailerLite** (publiczny endpoint osadzonych formularzy, konto `1427944`). Nie potrzeba klucza API, funkcji serverless ani zmian w wp-admin. Grupę, mail potwierdzający i automatyzacje ustawia się w MailerLite.
- Analityka po zgodzie na cookies: Clarity (już działa), GA4 i Meta Pixel (włączą się same na subdomenie).

## 1. Subdomena (GitHub Pages)
1. **TY – DNS w webd.pl**, strefa `przystanzmianyzawodowej.pl`, nowy rekord:

   | Typ | Nazwa | Wartość | TTL |
   |---|---|---|---|
   | CNAME | `webinar` | `jacekszwalek.github.io.` | 3600 |

   Nie ruszaj pozostałych rekordów (strona główna i poczta zostają bez zmian).
2. **TY – GitHub**: repo → *Settings → Pages → Custom domain* → `webinar.przystanzmianyzawodowej.pl` → *Save*. Gdy pojawi się „DNS check successful”, zaznacz *Enforce HTTPS* (certyfikat wystawia się do ok. godziny).
3. **JA – zaraz po kroku 2**: build bez podkatalogu (`BASE_PATH=/`), plik `CNAME`, wybór wersji na stronie głównej, wyłączenie przełącznika wersji i parametrów podglądu, `indexable = true`. Uwaga: od kroku 2 adres `jacekszwalek.github.io/aga-registrationlandingforwebinar/` przekierowuje na subdomenę, więc krok 3 robimy od razu.
4. Opcjonalnie (zalecane): *GitHub → Settings (konto) → Pages → Add a domain* i rekord TXT, który GitHub poda – weryfikacja domeny chroni przed przejęciem subdomeny.

## 2. MailerLite – nowe formularze (TY, panel MailerLite)
1. *Subscribers → Groups*: utwórz `Webinar 3.12.2026 – rejestracja` i `Webinar 3.12.2026 – nagranie`; sprawdź, która grupa to newsletter.
2. *Subscribers → Fields*: dodaj pole tekstowe `webinar_source` (trafią tam UTM-y, np. `utm_medium=social|utm_source=facebook`).
3. *Forms → Embedded forms → Create form* „Webinar 3.12 – rejestracja”:
   - grupa: `Webinar 3.12.2026 – rejestracja`;
   - pola: Email (wymagane), Name (wymagane), `webinar_source` (może być ukryte – wygląd formularza MailerLite nie ma znaczenia, używamy własnego);
   - blok **Interest groups / wybór grup** z jedną pozycją: grupa newslettera (dzięki temu zgoda z checkboxa dopisze osobę do newslettera tylko po zaznaczeniu);
   - double opt-in: decyzja – włączony = mail z potwierdzeniem przed zapisem (mniej zapisów, czystsza lista);
   - zapisz i opublikuj.
4. Drugi formularz „Webinar 3.12 – nagranie” – to samo, grupa `… – nagranie` (używany automatycznie po webinarze).
5. **Przekaż mi**: numeryczne ID obu formularzy i ID grupy newslettera. ID formularza jest w kodzie osadzenia *HTML* (`…/jsonp/1427944/forms/<ID>/subscribe`) albo w adresie edytora formularza. To dane publiczne, nie hasła.
6. *Automations*: po dołączeniu do grupy „rejestracja” – mail z linkiem do spotkania, przypomnienie dzień wcześniej i godzinę przed; dla „nagranie” i po webinarze – mail z linkiem do niepublicznego filmu YouTube.

Po podaniu ID ustawię `form.mode = 'mailerlite'` i zrobię testowy zapis na podglądzie.

## 3. GA4 (`G-GV74S860P0`, ta sama usługa co strona główna)
Subdomena dzieli domenę z `przystanzmianyzawodowej.pl`, więc GA4 rozpozna te same osoby – bez konfiguracji cross-domain. Skrypt ładuje się tylko na `webinar.przystanzmianyzawodowej.pl` i dopiero po zgodzie (Consent Mode v2, domyślnie odmowa).

Zdarzenia wysyłane ze strony: `page_view`, `scroll_50`, `scroll_90`, `form_start`, `form_submit_attempt`, `form_error` (pole i powód), `generate_lead` (na `/dziekuje/`), `add_to_calendar`, `share_click`, `sticky_cta_click`, `newsletter_signup`, `form_open` (v3). Każde ma parametry `headline_variant` i `event_state`.

**TY – w GA4:**
1. *Administracja → Wyświetlanie danych → Zdarzenia*: oznacz `generate_lead` jako **kluczowe zdarzenie**.
2. *Administracja → Definicje niestandardowe*: wymiary o zakresie zdarzenia `headline_variant`, `event_state`, `form`, `field`, `reason`.
3. *Eksploracje → Eksploracja ścieżki (lejek)*, kroki: `page_view` (adres zawiera `webinar.`) → `form_start` → `form_submit_attempt` → `generate_lead`; podział wg `session_source` / `utm_*` (z linków) i `headline_variant`.
4. Opcjonalnie: filtr ruchu wewnętrznego (Twoje IP).

Meta Pixel `2031514730971566` dostaje `PageView` i `Lead` (na `/dziekuje/`) – sprawdź w Menedżerze zdarzeń po starcie.

## 4. Microsoft Clarity (`ze0k15awef`) – zrobione
- Kod z Twojego fragmentu jest w stronie (oficjalny loader), ale **ładuje się dopiero po kliknięciu „Akceptuję”** w banerze cookies – zgodnie z RODO.
- Działa już na podglądzie (GitHub Pages) i zadziała na subdomenie. Nagrania mają tagi `landing_version` (v1–v5), `event_state`, `headline_variant`, `environment` (preview/production), a kroki lejka są wysyłane jako zdarzenia Clarity (`form_start`, `generate_lead` itd.) – w Clarity da się filtrować nagrania po nich.
- **TY – w Clarity:** *Settings → Overview*: wpisz adres `https://webinar.przystanzmianyzawodowej.pl`. Opcjonalnie *Settings → Setup → Google Analytics*: połącz z GA4. Żeby zobaczyć pierwsze dane: wejdź na podgląd v5, przewiń, kliknij „Akceptuję” – nagrania pojawiają się w panelu po ok. 1–2 godzinach.
- Uwaga prawna: Clarity zapisuje nagrania sesji – dopisz go (obok GA4 i Meta) w polityce prywatności i w treści banera cookies.

## 5. Co jeszcze trzeba uzupełnić
| Co | Kto | Gdzie trafi |
|---|---|---|
| Rekord CNAME w webd.pl + domena w GitHub Pages | TY | sekcja 1 |
| Która wersja (v5?) ma być stroną główną | TY – decyzja | `src/pages/index.astro` |
| ID formularzy MailerLite (rejestracja, nagranie) i grupy newslettera | TY | `event.config.ts → mailerlite` |
| Double opt-in tak/nie, automatyzacje maili | TY – MailerLite | panel MailerLite |
| Platforma webinaru i link do spotkania (do maili) | TY | MailerLite / `event.config.ts → platform` |
| GA4: kluczowe zdarzenie, wymiary, lejek | TY | panel GA4 |
| Clarity: adres strony | TY | panel Clarity |
| Polityka prywatności i baner cookies: dopisać Clarity | TY (+ weryfikacja prawna) | strona główna / `copy.ts → consent` |
| Zgoda autorek opinii, link do konsultacji, dane administratora | TY | `docs/todo.md` |
| Odpowiedź na FAQ o ofercie sprzedażowej (v1–v4) | TY | `copy.ts → faq` |
