# MailerLite – raport z wdrożenia decyzji (15.11.2026)

Decyzje użytkownika z 15.11.2026 (punkty 1–7) i ich wykonanie. Audyt wyjściowy: [`mailerlite-raport.pdf`](mailerlite-raport.pdf). Standard na przyszłość: [`mailerlite-standard.md`](mailerlite-standard.md). Wszystkie zmiany przez API zapisane w logu sesji; żadna grupa ani kontakt (poza moimi kontaktami testowymi) nie zostały usunięte.

## Dane, które uzasadniają decyzje
- **166 osób (25% kontaktów) nigdy nie kliknęło linku potwierdzającego** (double opt-in) – nie dostały żadnego maila. Przy wyzwaniu listopadowym **42 ze 113 (37%)**: zapisały się, ale nie dostały linków do spotkań. → Double opt-in w formularzach wydarzeń wyłączony (w Polsce nie jest wymagany prawnie; zapisujemy datę i IP zapisu jako dowód).
- Checkbox newslettera w 7 formularzach wyzwania nie miał nazwy pola – zaznaczenie nigdy nie trafiło do MailerLite.
- 5 formularzy łączyło zapis ze zgodą na marketing („zgoda w pakiecie”, 525 zapisów) – wariant ostrożny: traktujemy jak brak zgody.
- Mocną, odrębną zgodę miało 8 osób (formularze „Zaproszenie do NL” i „Przystań Zmiany Zawodowej”).

## 1. Automatyzacja „Ebook” – wykonane (Ty w panelu, ja weryfikacja)
- Stan po zmianie (API): automatyzacja włączona, **jeden krok: mail „🌹 Gotowe! Twój przewodnik już na Ciebie czeka!”** (usunięto też opóźnienie 1 dnia – e-book wychodzi od razu). ✅
- Historia (dane z API): 105 osób przeszło całą automatyzację; **38 dostało zaproszenie na wyzwanie i mail „Dłużej tak nie mogę…”** (35 przed startem wyzwania, **3 już po starcie** – 3.11 po 19:00); 63 dostały wcześniej zaproszenie „Pogadajmy na żywo – spotkanie”.
- „3 osoby w kolejce” to w rzeczywistości **zawieszone wpisy z lipca i września** (status „step-deleted” – usunięto krok, zanim do niego doszły). Nic im już nie wyjdzie. Do sprawdzenia, czy dostały e-booka (TODO).

## 2. Struktura grup – wariant (a)
Grupa na każde wydarzenie + stałe grupy „Uczestnicy wydarzeń”, „Interakcja RRRR”, rodzaju („Webinar”) i „Zgoda marketingowa”. Usuwanie grup wydarzeń po ok. 2 miesiącach – procedura w [`mailerlite-standard.md`](mailerlite-standard.md#usuwanie-grup-wydarzeń-ok-2-miesiące-po-wydarzeniu).

## 3. Zgody „w pakiecie” – wariant ostrożny
Te osoby **nie** są w „Zgodzie marketingowej”. Zgodę odzyskują same, zaznaczając checkbox przy kolejnym zapisie.

## 4. Blok B – wykonane przez API
**Nowe grupy**

| Grupa | ID |
|---|---|
| Zgoda marketingowa | `204236857906562074` |
| Uczestnicy wydarzeń | `204236858271466618` |
| Interakcja 2026 | `204236858915292301` |
| Webinar | `204236859214136535` |

**„Zgoda marketingowa”**: dodano 8 osób z formularzy „Zaproszenie do NL” i „Przystań Zmiany Zawodowej”; statusy bez zmian (5 aktywnych, 2 niepotwierdzone, 1 wypisana – wypisana nadal nic nie dostanie).

**Nowe pole**: „Pierwsze wydarzenie” (`pierwsze_wydarzenie`, tekst).

**Zmiany nazw grup**

| Było | Jest |
|---|---|
| Przystań Zmiany Zawodowej | ARCHIWUM - newsletter do 2026-11 (zgody niepewne) |
| Wyzwanie 3-5.11.2026 | 2026-11-03 - Wyzwanie - rejestracja |
| Spotkanie 18.06 | 2026-06-30 - Spotkanie informacyjne - rejestracja |
| Nowi | 2026-02-27 - Webinar - rejestracja |
| Ebook | E-book - pobranie |
| Uczestnicy | ARCHIWUM - Uczestnicy (źródło nieznane) |
| 2026-12-03-zostac-zmienic-wlasna-droga – rejestracja | 2026-12-03 - Zostać, zmienić pracę czy pójść własną drogą? - rejestracja |
| 2026-12-03-zostac-zmienic-wlasna-droga – nagranie | 2026-12-03 - Zostać, zmienić pracę czy pójść własną drogą? - nagranie |

**Prefiks „ARCHIWUM - ” w nazwach 13 formularzy**: 7 × „Formularz na zapis na wyzwanie listopad - …” (Ela, FB wydarzenie, NL, Ebook, IG, LI, META), 3 × „Formularz na zapis na spotkanie 30.06 - …” (LI, IG, EBOOK), „Webinar 27.02”, „Nagranie do nowych”, „Bezpłatne szkolenie”.
Bez zmian (nadal w użyciu lub nie dotyczą wydarzeń): „Formularz na pobranie ebooka - strona www”, „Przystań Zmiany Zawodowej”, „Zaproszenie do NL”, „Proces 1:1 – formularz wstępny”.
Zmiana nazwy nie wpływa na kontakty, automatyzacje ani osadzone formularze.

## 5. Formularz e-booka – czeka na Ciebie
Zmiana w edytorze (nowy tekst + niezaznaczony checkbox → „Zgoda marketingowa”). Po zmianie zweryfikuję przez API (grupy formularza) i publiczny kod formularza (czy checkbox ma przypiętą grupę).

## 6. Przekierowanie /wyzwanie2/ → /webinar/ – czeka na Ciebie
Nie mam dostępu do `public_html/.htaccess` (konta FTP widzą tylko `public_html/webinar` i `public_html/utmgen`). Instrukcja w TODO niżej; po zmianie sprawdzę curl-em kod 301. Stan dziś: `/wyzwanie2/` → **200** (strona działa, formularz zbiera zapisy).

## 7. Zapis na webinar 3.12
**Zamiast formularza MailerLite – zapis przez API** (skrypt `public/api/subscribe.php` na hostingu), bo:
- formularza MailerLite **nie da się przez API przełączyć na zapis bez potwierdzenia** (double opt-in) – tylko w panelu;
- formularz zawsze nadpisuje wysłane pole, więc nie umie ustawić „Pierwszego wydarzenia” **tylko nowym** kontaktom.

Skrypt robi dokładnie to, co w decyzji: grupy (wydarzenia, Uczestnicy wydarzeń, Interakcja RRRR, Webinar, Zgoda – tylko z checkboxem), imię, `webinar_source`, „Pierwsze wydarzenie” tylko u nowych, bez maila potwierdzającego. Szczegóły: [`mailerlite-standard.md`](mailerlite-standard.md#jak-działa-zapis-z-landingu-tryb-api).

**Testy (lokalnie, prawdziwe API MailerLite, kontakty `claude-test-…@example.com`, potem usunięte):**

| Scenariusz | Wynik |
|---|---|
| Nowy kontakt bez zgody | aktywny; grupy: rejestracja, Uczestnicy wydarzeń, Interakcja 2026, Webinar; imię, źródło, Pierwsze wydarzenie ✅ |
| Ten sam ponownie, ze zgodą | + Zgoda marketingowa; Pierwsze wydarzenie bez zmian ✅ |
| Istniejący kontakt (bez pola) | grupy dodane, Pierwsze wydarzenie **nie** ustawione ✅ |
| Kontakt wypisany zapisuje się ponownie | wraca jako aktywny (żeby dostał link) ✅ |
| Zapis po końcu webinaru | grupa „nagranie” zamiast „rejestracja” ✅ |
| Pełny przepływ w przeglądarce (landing → /dziekuje/) | zapis z UTM-ami z linku, przekierowanie, brak błędów ✅ |
| Obcy Origin / brak Origin / zły e-mail / brak imienia / pole-pułapka | 403 / 403 / 422 / 422 / 200 bez zapisu ✅ |

Formularz MailerLite utworzony przez API na próbę (pusty, nieużyty) – usunięty. **Na produkcji skrypt ruszy, gdy wgrasz klucz API** (TODO). Do tego czasu landing zostaje w trybie bez zapisu (mock) – PR czeka na klucz.

**Komunikacja** (na wzór poprzednich wydarzeń: podziękowanie automatycznie, reszta kampaniami do grupy):

| | Kiedy | Temat | Stan |
|---|---|---|---|
| A1 | automatyzacja: dołącza do „… - rejestracja” | {$name}, jesteś zapisana! Widzimy się 3 grudnia o 19:00 | treść gotowa (`docs/maile/A1.html`) – automatyzację tworzysz w panelu |
| K1 | 2.12, ~10:00 | Jutro o 19:00 spotykamy się na webinarze | **szkic kampanii w MailerLite** |
| K2 | 3.12, ~8:00 | Dziś o 19:00 – Twój link do webinaru | **szkic**; link ClickMeeting `[DO UZUPEŁNIENIA]` |
| K3 | 3.12, 18:45 | Zaczynamy za 15 minut – dołącz tutaj | **szkic**; link `[DO UZUPEŁNIENIA]` |
| K4 | 4.12, ~12:00 | Nagranie webinaru „…” | **szkic**; link do nagrania `[DO UZUPEŁNIENIA]` |
| A2 | automatyzacja: dołącza do „… - nagranie” | {$name}, oto nagranie webinaru | treść gotowa (`docs/maile/A2.html`) |

Szkice nie są zaplanowane ani wysłane. Automatyzacji z mailami nie da się zbudować przez API (treść maili tylko w edytorze) – instrukcja w TODO.

## TODO – pozostałe zadania

### Pilne – przed startem promocji webinaru 3.12
1. **Klucz API na serwerze** – MailerLite → *Integrations → API → Generate new token* „landing-webinar-zapisy” → cPanel → *Menedżer plików* → katalog domowy (poziom wyżej niż `public_html`) → *+ Plik* `.mailerlite-api-key` → wklej sam token → zapisz → uprawnienia `600`. Daj znać – zmerguję PR, zrobię testowy zapis na produkcji i usunę testowy kontakt.
2. **Automatyzacja A1** – *Automations → Create → From scratch* → nazwa „2026-12-03 - Zostać… - podziękowanie” → wyzwalacz *When subscriber joins a group* → grupa „2026-12-03 - … - rejestracja” → krok *Email* → temat i treść z `docs/maile/A1.html` (nadawca: Przystań Zmiany Zawodowej, kontakt@przystanzmianyzawodowej.pl) → *Publish*.
3. **Automatyzacja A2** – jak wyżej, grupa „… - nagranie”, treść `A2.html`; link do nagrania uzupełnić przed 4.12 (włączyć dopiero z linkiem).
4. **Link ClickMeeting** – wpisać w K2 i K3 (przycisk i tekst), potem **zaplanować** K1–K3 (*Campaigns → Drafts*).
5. **Test**: zapis na swój adres na https://przystanzmianyzawodowej.pl/webinar/ → przychodzi A1? → kontakt ma grupy i pola? → usuń testowy kontakt.

### E-book
6. **3 zawieszone wpisy w automatyzacji „Ebook”** (z lipca i września): *Automations → Ebook → Activity* → sprawdź, czy dostały mail „Gotowe! Twój przewodnik…”. Jeśli nie – wyślij im ręcznie tylko ten mail (to realizacja ich zamówienia, nie marketing). Jeśli tak – nic nie rób.
7. **38 osób, które dostały zaproszenie na wyzwanie** (w tym 3 już po starcie): **nie wysyłaj przeprosin ani „sprostowań”** – kolejny mail bez zgody pogłębiłby problem. Te osoby nie dostaną więcej reklam, bo nie są w „Zgodzie marketingowej”.
8. **Jak dalej komunikować się z osobami z e-booka bez ważnej zgody**: tylko maile związane z e-bookiem, o który prosiły (np. jeśli e-book się zaktualizuje – wysyłka nowej wersji). Zaproszenia na webinary, newsletter i oferty – **nie**. Kanały, by same do nas wróciły: link do webinaru na stronie e-booka i w samym e-booku (PDF), posty w social media z linkiem z generatora UTM. Kto zapisze się na webinar i zaznaczy checkbox – trafia do „Zgody marketingowej”.
9. **Formularz e-booka** (blok C): *Forms → „Formularz na pobranie ebooka - strona www” → Edit*: tekst „Zapisując się, otrzymasz e-booka i wiadomości z nim związane.”; blok *Interest groups* z jedną pozycją „Zgoda marketingowa”, etykieta „Chcę otrzymywać newsletter Przystani Zmiany Zawodowej…”, **niezaznaczony**, **nieobowiązkowy**; wyłącz double opt-in (*Settings*); zapisz i opublikuj → daj znać, zweryfikuję przez API.
10. Rozważ: e-book pobierany także przez skrypt API (jak webinar) – wtedy grupy „Interakcja RRRR” i „Pierwsze wydarzenie” zadziałają też dla e-booka.

### Strona i porządki
11. **Przekierowanie /wyzwanie2/** – cPanel → *Menedżer plików* → `public_html/.htaccess` (pokaż ukryte pliki) → **nad** linią `# BEGIN WordPress` dopisz:
    ```
    # Przekierowania ręczne (poza blokiem WordPressa)
    <IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^wyzwanie2/?$ https://przystanzmianyzawodowej.pl/webinar/ [R=301,L]
    </IfModule>
    ```
    Nie zmieniaj niczego między `# BEGIN WordPress` a `# END WordPress`. Parametry UTM z linku przechodzą dalej. Daj znać – sprawdzę curl-em 301. Upewnij się też, że reklamy Meta na wyzwanie są wyłączone.
12. **Strona WordPress „wyzwanie2”** – po przekierowaniu można ją zostawić w szkicach (przekierowanie i tak działa przed WordPressem).
13. **Historyczne uzupełnienie grup** (opcjonalnie, do decyzji): dodać uczestników minionych wydarzeń (wyzwanie, spotkanie, webinar 27.02, szkolenie 4.12.2025) do „Uczestnicy wydarzeń”, „Webinar”/„Spotkanie” i ewentualnie „Interakcja 2025/2026” oraz wpisać im „Pierwsze wydarzenie” na podstawie najwcześniejszej grupy.
14. **Usunięcie tokenu audytowego** „audyt-claude-2026-11” (MailerLite → *Integrations → API*) i sekretu `connect.mailerlite.com` w ustawieniach środowiska tej sesji – po zakończeniu prac.
15. **Polityka prywatności** – dopisać, że zapis na webinar oznacza maile organizacyjne o tym wydarzeniu, a newsletter wymaga osobnej zgody (weryfikacja prawna).
