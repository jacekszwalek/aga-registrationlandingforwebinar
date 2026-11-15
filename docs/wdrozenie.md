# Wdrożenie: subdomena, MailerLite, GA4, Clarity

Stan na 15.11.2026. Kod jest gotowy na każdy z kroków; brakuje danych i ustawień w panelach (oznaczone **TY**).

## Architektura
- **Produkcja**: `https://webinar.przystanzmianyzawodowej.pl` – pliki na hostingu **webd.pl** w `public_html/webinar`. Strona główna = v5, `/dziekuje/`, `/webinar.ics` (bez wersji v1–v4 i przełącznika).
- **Wdrażanie automatyczne**: każdy push do `main` → GitHub Actions (`.github/workflows/deploy-webd.yml`) buduje wydanie (`npm run build:release`) i wysyła je przez **FTPS** do `public_html/webinar`. Wgrywa tylko zmienione pliki.
- **Podgląd** wszystkich wersji (v1–v5 z przełącznikiem): GitHub Pages `https://jacekszwalek.github.io/aga-registrationlandingforwebinar/` (`pages.yml`).
- Zapis: formularz wysyła dane **prosto do nowego formularza MailerLite** (konto `1427944`) – bez serwera i klucza API.
- Analityka po zgodzie na cookies: GA4, Meta Pixel, Clarity.

## 1. Subdomena na webd.pl + automatyczne wdrażanie (TY, jednorazowo)
1. **cPanel → Domeny → Utwórz nową domenę**: `webinar.przystanzmianyzawodowej.pl`, **odznacz** „Share document root”, katalog główny: `public_html/webinar`. cPanel sam doda rekord DNS (strefa jest na webd).
2. **cPanel → SSL/TLS Status**: zaznacz `webinar.przystanzmianyzawodowej.pl` → *Run AutoSSL* (darmowy certyfikat; zwykle kilka minut).
3. **cPanel → Konta FTP → Dodaj konto FTP**: login np. `deploy-webinar`, katalog **`public_html/webinar`** (konto ma dostęp tylko do tego katalogu), silne hasło z generatora. Zanotuj pełny login (np. `deploy-webinar@przystanzmianyzawodowej.pl`) i serwer FTP z sekcji *Configure FTP Client* (np. `wn06.webd.pl` albo `ftp.przystanzmianyzawodowej.pl`).
4. **GitHub → repo → Settings → Secrets and variables → Actions → New repository secret** – trzy sekrety (hasła nie wklejaj na czacie):
   - `FTP_SERVER` – serwer FTP z kroku 3,
   - `FTP_USERNAME` – pełny login FTP,
   - `FTP_PASSWORD` – hasło konta FTP.
5. Daj znać – zmerguję PR i uruchomię pierwsze wdrożenie (albo: *Actions → Wdrożenie na webd → Run workflow*). Każda kolejna zmiana w `main` wdraża się sama.

Dopóki sekretów nie ma, workflow kończy się komunikatem „Ustaw sekrety FTP…” i niczego nie wysyła.

## 2. MailerLite – nowe formularze (TY, panel MailerLite)
**Nowe, osobne formularze i grupy** dla webinaru 3.12.2026 – nie używaj formularza poprzedniego webinaru (`QntRwj` z /wyzwanie2/), żeby zapisy, statystyki formularza i automatyzacje się nie mieszały. W nazwach dodaj datę (np. „Webinar 2026-12-03 – rejestracja”).
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
2. *Administracja → Definicje niestandardowe*: wymiary o zakresie zdarzenia `webinar_id` (rozdziela ten webinar od poprzednich), `landing_version`, `headline_variant`, `event_state`, `form`, `field`, `reason`.
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
