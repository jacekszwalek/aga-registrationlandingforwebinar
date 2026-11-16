# MailerLite – standard dla wydarzeń (instrukcja)

Obowiązuje od 15.11.2026. Uzasadnienie decyzji: [`mailerlite-ustalenia.md`](mailerlite-ustalenia.md), raport: [`mailerlite-raport-wdrozenia.md`](mailerlite-raport-wdrozenia.md).

## Zasada w jednym zdaniu
Maile o wydarzeniu – do wszystkich zapisanych na nie; newsletter, oferty i zaproszenia na **kolejne** wydarzenia – **wyłącznie** do grupy „Zgoda marketingowa”, do której trafia się tylko przez samodzielnie zaznaczony checkbox.

## Grupy

| Grupa | Rodzaj | Kto w niej jest | Do czego |
|---|---|---|---|
| `Zgoda marketingowa` | stała | osoby, które zaznaczyły checkbox newslettera | **jedyny** adresat kampanii marketingowych |
| `Uczestnicy wydarzeń` | stała, zbiorcza | każdy zapisany na jakiekolwiek wydarzenie | historia; zostaje po usunięciu grup wydarzeń |
| `Interakcja RRRR` (np. `Interakcja 2026`) | roczna | każdy, kto w danym roku zapisał się na wydarzenie | aktywność w danym roku; skrypt sam tworzy grupę na nowy rok |
| `Webinar` (rodzaj wydarzenia) | stała | zapisani na webinary | segmentacja wg rodzaju (kolejne rodzaje: np. `Spotkanie`, `Warsztat`) |
| `RRRR-MM-DD - tytuł - rejestracja` | na wydarzenie | zapisani przed/w trakcie | automatyzacja podziękowania, kampanie: przypomnienia, link, nagranie |
| `RRRR-MM-DD - tytuł - nagranie` | na wydarzenie | zapisani po wydarzeniu | automatyzacja z linkiem do nagrania |
| `ARCHIWUM - …` | archiwalne | stare listy | **nie wysyłać do nich kampanii** |

## Pola na karcie kontaktu

| Pole | Klucz | Jak się zapisuje |
|---|---|---|
| Imię | `name` | przy każdym zapisie (ostatnio wpisane) |
| Webinar source | `webinar_source` | UTM-y z linku, np. `utm_medium=social\|utm_source=facebook`; nadpisywane przy każdym zapisie (puste nie kasuje starego) |
| Pierwsze wydarzenie | `pierwsze_wydarzenie` | **tylko** u kontaktów nowych w bazie; u istniejących nigdy nie jest nadpisywane |

## Jak działa zapis z landingu (tryb `api`)
Formularz na stronie → `https://przystanzmianyzawodowej.pl/webinar/api/subscribe.php` → API MailerLite:
1. sprawdza, czy adres jest już w bazie;
2. zapisuje imię, `webinar_source`, a nowym kontaktom `pierwsze_wydarzenie`;
3. dodaje grupy: wydarzenia (rejestracja, a po końcu webinaru – nagranie), „Uczestnicy wydarzeń”, „Interakcja RRRR”, „Webinar”; „Zgoda marketingowa” – tylko z zaznaczonym checkboxem;
4. **bez maila potwierdzającego** (double opt-in wyłączony); zapisuje datę i IP zapisu (dowód zgody);
5. kontakt wypisany lub niepotwierdzony, który sam zapisuje się ponownie, wraca jako aktywny (inaczej nie dostałby linku) – marketing i tak tylko z „Zgodą marketingową”.

Zabezpieczenia: tylko żądania ze strony (nagłówek Origin), limit 6 zapisów / 10 min z IP, pole-pułapka na boty, walidacja e-maila i imienia.

**Klucz API** (jednorazowo): MailerLite → *Integrations → API → Generate new token* (nazwa np. `landing-webinar-zapisy`) → w cPanelu *Menedżer plików* w **katalogu domowym** (nie w `public_html`!) plik `integrations-keys/.mailerlite-api-key` z samym tokenem, uprawnienia `600` (stan od 15.11.2026; skrypt sprawdza też `~/.mailerlite-api-key`). Skrypt czyta też zmienną `MAILERLITE_API_KEY`, jeśli hosting ją ustawia. Nigdy w repozytorium.

## Nowe wydarzenie – krok po kroku
1. **Identyfikator**: `RRRR-MM-DD-krotka-nazwa` (np. `2027-03-12-…`) i nazwa do MailerLite: `RRRR-MM-DD - pełny tytuł`.
2. **MailerLite → Subscribers → Groups**: utwórz `RRRR-MM-DD - tytuł - rejestracja` i `RRRR-MM-DD - tytuł - nagranie`. Jeśli to nowy rodzaj wydarzenia – także grupę rodzaju (np. `Warsztat`). „Interakcja RRRR” powstanie sama.
3. **Landing – `src/config/event.config.ts`**: `id`, `sessions`, `mailerlite.eventName`, `mailerlite.groups.registration/recording` (ID z adresu grupy w panelu), ewentualnie `groups.eventType`. Reszta (zgoda, uczestnicy, pole) bez zmian.
4. **Automatyzacje** (MailerLite → Automations): (a) wyzwalacz „dołącza do grupy … - rejestracja” → mail z podziękowaniem; (b) „dołącza do grupy … - nagranie” → mail z linkiem do nagrania. Bez reklam. Wzory: `docs/maile/A1.html`, `A2.html`.
5. **Kampanie do grupy „… - rejestracja”** (zaplanowane z wyprzedzeniem – grupa liczona w chwili wysyłki, więc obejmie też spóźnialskich): dzień przed (K1), rano w dniu (K2, z linkiem), 15 min przed (K3, z linkiem), dzień po (K4, nagranie). Wzory: `docs/maile/K1–K4.html`.
6. **Linki do promocji**: generator https://przystanzmianyzawodowej.pl/utmgen/ (`utm_campaign` = **data wydarzenia RRMMDD**, np. `261203` – nie ujawnia w linku, czego dotyczy kampania).
7. **Test przed promocją**: zapis na swój adres → w MailerLite sprawdź grupy i pola → dostałeś podziękowanie? → usuń testowy kontakt.
8. **Po wydarzeniu**: K4 z nagraniem; landing sam przełącza się na zapis po nagranie (grupa „nagranie”).
9. **Ok. 2 miesiące po wydarzeniu**: porządki – niżej.

## Usuwanie grup wydarzeń (ok. 2 miesiące po wydarzeniu)
**Kiedy:** gdy wszystkie maile o wydarzeniu wyszły, nagranie nie jest już promowane, a automatyzacje tego wydarzenia są wyłączone – zwykle ~2 miesiące po dacie.

**Co sprawdzić przed usunięciem:**
1. *Automations*: żadna **włączona** automatyzacja nie używa tej grupy jako wyzwalacza ani warunku (otwórz automatyzację wydarzenia → wyłącz ją).
2. *Campaigns*: brak zaplanowanych kampanii do tej grupy.
3. *Subscribers → Segments*: żaden segment nie korzysta z tej grupy.
4. Każda osoba z grupy wydarzenia jest też w „Uczestnicy wydarzeń” (filtr: w grupie wydarzenia **i nie** w „Uczestnicy wydarzeń” → wynik powinien być pusty; jeśli nie – dodaj je do „Uczestnicy wydarzeń”).
5. **Eksport**: *Groups → grupa → Export* (CSV) i zapisz na Dysku Google w folderze „MailerLite – archiwum wydarzeń” (nazwa pliku = nazwa grupy). To jedyna kopia listy „kto był na tym konkretnym wydarzeniu” i z jakiego źródła (`webinar_source` z dnia eksportu).

**Jak usunąć:** *Subscribers → Groups* → przy grupie menu „…” → *Delete* → potwierdź. Usunięcie grupy **nie usuwa kontaktów** – znika tylko naklejka.

**Gdzie zostaje historia:** grupa „Uczestnicy wydarzeń” (że ktoś był na wydarzeniu), „Interakcja RRRR” (w którym roku), grupa rodzaju („Webinar”), pole „Pierwsze wydarzenie” (od czego zaczęła), plik CSV z eksportu (dokładna lista uczestników) oraz GA4 (źródła ruchu).

## Czego nie robić
- Nie wysyłaj kampanii do grup `ARCHIWUM - …`, „Uczestnicy wydarzeń”, „Interakcja …” ani „Webinar” – to nie są listy zgód.
- Nie usuwaj formularzy MailerLite, które zbierały zapisy (lista osób z formularza) – zmieniaj nazwę na `ARCHIWUM - …`.
- Nie dodawaj nikogo ręcznie do „Zgoda marketingowa” bez dowodu zgody (checkbox, data, źródło).
- Nie wysyłaj maili z prośbą o zgodę osobom bez zgody.
