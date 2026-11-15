# MailerLite – audyt zgód i plan porządkowania (15.11.2026)

Handoff do sesji z dostępem do panelu MailerLite (Chrome). Konto `1427944`. Stan sprawdzony przez API (tylko odczyt) i publiczny kod formularzy. **Nic jeszcze nie zostało zmienione.** Każdą zmianę pokazać użytkownikowi przed zapisaniem.

## Ustalenia
- 664 kontakty: 387 aktywnych, 166 niepotwierdzonych (nie dostaną maili), 105 wypisanych, 6 odbitych; 80 bez grupy.
- **Formularze wyzwania listopadowego (7)**: checkbox „Chcę otrzymywać newsletter…” nie ma nazwy pola (`<input type="checkbox">` bez `name`), więc zaznaczenie **nigdy nie trafiło do MailerLite**. Treść: „Zapisując się, otrzymasz wiadomości organizacyjne dotyczące wyzwania”. → Wyłącznie maile o wyzwaniu, bez marketingu.
- **E-book, spotkanie 30.06, Webinar 27.02, „Bezpłatne szkolenie”, „Nagranie do nowych”**: brak checkboxa; „Zapis oznacza zgodę na otrzymywanie… innych treści i usług” – zgoda „w pakiecie” (warunkowa, słaba wg art. 7 ust. 4 RODO). „Bezpłatne szkolenie” i „Nagranie do nowych” dopisywały wprost do grupy „Przystań Zmiany Zawodowej”, więc ta grupa nie jest czystą listą zgód.
- **Mocna zgoda** (formularze „Zaproszenie do NL” `171507572909541083` i „Przystań Zmiany Zawodowej” `165601991758710416`): **8 osób**, 5 aktywnych.
- **Automatyzacja „Ebook”** (`189158933833713297`, włączona, 3 osoby w kolejce): dzień 1 link do e-booka (OK); dzień 2 „Bezpłatne wyzwanie online: 3-5.11.2026!” – **zaproszenie na wydarzenie, które już było**, marketing bez zgody; potem „Dłużej tak nie mogę, ale przecież nie mogę wszystkiego rzucić.” – do sprawdzenia, czy sprzedażowy.
- „Reklama - Webinar - 1:1 - styczeń” wysyła tylko link do nagrania – OK (myląca nazwa).
- Ostatnie zapisy: formularz e-booka 11.11.2026, META wyzwania (na /wyzwanie2/) 05.11.2026, „Przystań” 03.11.2026; reszta dawno nieużywana.

## Plan (bloki do akceptacji)
**A – pilne:** w automatyzacji „Ebook” usunąć/wyłączyć krok z zaproszeniem na wyzwanie i mail „Dłużej tak nie mogę…” (albo warunek: tylko dla grupy „Zgoda marketingowa”). Zostaje mail z e-bookiem.

**B – grupy:** utworzyć „Zgoda marketingowa” i dodać 8 osób z formularzy wyżej; zmiana nazw:

| Obecna | Nowa |
|---|---|
| Przystań Zmiany Zawodowej (`165601664184616321`) | ARCHIWUM - newsletter do 2026-11 (zgody niepewne) |
| Wyzwanie 3-5.11.2026 | 2026-11-03 - Wyzwanie - rejestracja |
| Spotkanie 18.06 | 2026-06-30 - Spotkanie informacyjne - rejestracja |
| Nowi | 2026-02-27 - Webinar - rejestracja |
| Ebook | E-book - pobranie |
| Uczestnicy | ARCHIWUM - Uczestnicy (źródło nieznane) |
| 2026-12-03-zostac-zmienic-wlasna-droga – rejestracja / – nagranie | 2026-12-03 - Zostać, zmienić pracę czy pójść własną drogą? - rejestracja / - nagranie |

Formularze minionych wydarzeń: prefiks „ARCHIWUM - ”.

**C – formularz e-booka (edytor):** tekst → „Zapisując się, otrzymasz e-booka i wiadomości z nim związane.”; dodać checkbox newslettera jako wybór grupy (interest group) „Zgoda marketingowa” – niezaznaczony, nieobowiązkowy; zapis testowy i sprawdzenie grup.

**D – landing grudniowy (repo):** `event.config.ts → mailerlite.newsletterGroupId` przepiąć z `165601664184616321` na ID grupy „Zgoda marketingowa”.

**Decyzja:** formularz wyzwania na /wyzwanie2/ zdjąć czy zostawić.

## Zasady na przyszłość (każde wydarzenie)
1. Dwie grupy: `RRRR-MM-DD - tytuł - rejestracja` i `- nagranie`.
2. Formularz: „Zapisując się, otrzymasz wiadomości dotyczące tego wydarzenia” + osobny, niezaznaczony checkbox = grupa „Zgoda marketingowa”.
3. Automatyzacja na wejście do grupy rejestracji: podziękowanie, link, przypomnienia, nagranie – bez reklam.
4. Kampanie marketingowe i zaproszenia na kolejne wydarzenia – **tylko** do grupy „Zgoda marketingowa”.
5. Po wydarzeniu: formularz oznaczyć „ARCHIWUM - ”, grupy zostają jako historia.

Na koniec: usunąć token API „audyt-claude-2026-11” (MailerLite → Integrations → API) i sekret w ustawieniach środowiska sesji chmurowej.
