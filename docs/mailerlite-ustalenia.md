# MailerLite – ustalenia robocze (do ADR, raportu i instrukcji)

Notatki z rozmowy 15.11.2026. Na koniec prac powstaną z nich: **macierz decyzji (ADR/ADL) z uzasadnieniem, raport końcowy i instrukcja tworzenia kolejnych wydarzeń i formularzy.** Audyt i plan: [`mailerlite-audyt.md`](mailerlite-audyt.md), raport PDF: [`mailerlite-raport.pdf`](mailerlite-raport.pdf).

## ⚠️ WAŻNE

1. **Nie usuwaj formularzy – archiwizuj je.** Formularz w MailerLite przechowuje listę osób, które się przez niego zapisały. Usunięcie formularza = utrata listy uczestników danego wydarzenia. Po wydarzeniu zmień tylko nazwę na `ARCHIWUM - …` (i zdejmij go ze stron).
2. **Uczestników konkretnego wydarzenia bierzesz z formularza.** *Forms → formularz → subskrybenci* (w panelu) albo API `GET /forms/{id}/subscribers`. Dlatego: **jedno wydarzenie = jeden formularz** (źródło ruchu rozróżniamy polem `webinar_source`, nie osobnymi formularzami jak przy wyzwaniu META/IG/LI…). Do sprawdzenia w panelu: czy segment da się ustawić warunkiem „zapisał się przez formularz X”.

## Decyzje 15.11.2026 (zapis decyzji – ADL)

| # | Decyzja | Odrzucone alternatywy | Uzasadnienie | Konsekwencje |
|---|---|---|---|---|
| D1 | Jedna stała grupa „Zgoda marketingowa” jako jedyny adresat marketingu | pole „zgoda tak/nie”; osobne konto do maili o wydarzeniach | grupy tylko się dokleja – zgoda nie znika przy kolejnym zapisie; jedna reguła | lista startuje od 8 osób |
| D2 | Grupa na każde wydarzenie + stałe: „Uczestnicy wydarzeń”, „Interakcja RRRR”, rodzaj („Webinar”) | tylko grupy typ/rok + formularz na wydarzenie; jedna grupa czyszczona przed wydarzeniem | szybka wysyłka do zapisanych na konkretne wydarzenie; niezawodny wyzwalacz automatyzacji | grup przybywa → usuwanie po ~2 mies. (procedura w standardzie) |
| D3 | Zgody „w pakiecie” (525 zapisów) = brak zgody (wariant ostrożny) | dopisanie po konsultacji prawnej | art. 7 ust. 4 RODO – zgoda warunkowa jest słaba | mniejszy zasięg kampanii; zgoda wraca przy kolejnym zapisie z checkboxem |
| D4 | Bez double opt-in w zapisach na wydarzenia | DOI jak dotąd | 25% kontaktów (166) nigdy nie potwierdziło; przy wyzwaniu 37% (42/113) nie dostało linków; DOI nie jest wymagany prawem w PL | zapisujemy datę i IP zapisu; możliwe literówki w adresach |
| D5 | Zapis z landingu przez API MailerLite (PHP na hostingu), nie formularz MailerLite | formularz osadzony (jsonp) | API nie wyłączy DOI formularza; formularz nadpisuje pola – nie da się ustawić „Pierwszego wydarzenia” tylko nowym | klucz API w pliku poza `public_html`; historia uczestników w grupach + eksport CSV przed usunięciem grupy |
| D6 | „Pierwsze wydarzenie” tylko u nowych kontaktów; nigdy nie nadpisywane | pole „ostatnie wydarzenie” | stała informacja „od czego zaczęła” | stare kontakty mają pole puste (uzupełnienie historyczne – TODO) |
| D7 | Ponowny zapis wypisanej/niepotwierdzonej osoby przywraca status aktywny | zostawić wypisaną | świadomy, nowy zapis na wydarzenie – inaczej nie dostanie linku | marketing nadal tylko z „Zgodą marketingową” |
| D8 | Nic nie usuwamy – nazwy „ARCHIWUM - …” | usuwanie starych grup/formularzy | historia zapisów i statystyki | starsze grupy zostają w panelu |

## Ustalenia i pytania z rozmowy

- **Zgoda marketingowa** = jedna stała grupa „Zgoda marketingowa”; trafia się do niej tylko przez samodzielnie zaznaczony checkbox (blok wyboru grup). Grupy tylko się dokleja → zgoda nie znika przy kolejnym zapisie bez zaznaczenia. Wycofanie = „wypisz się” (działa na całe konto).
- **Osoba zapisana tylko na wydarzenie** dostaje wyłącznie grupę/naklejkę wydarzenia (lub typu wydarzenia) – bez grupy zgody; dostaje tylko maile o tym wydarzeniu.
- **Jeden formularz może dopisywać do wielu grup**: grupy stałe (każdy zapis) + grupy do wyboru (checkbox). MailerLite przyjmuje z formularza tylko grupy w nim ustawione – sprawdzić testowym zapisem przy podpinaniu landingu.
- **Mnożenie się grup** – rozważane warianty:
  - grupa na każde wydarzenie (najprostsze filtrowanie, grup przybywa; ewentualnie coroczne porządki: grupa „ARCHIWUM RRRR - uczestnicy wydarzeń”);
  - grupa zbiorcza „Uczestnicy wydarzeń” jako stała grupa każdego formularza;
  - **wariant preferowany przez użytkownika (do potwierdzenia):** grupy tylko wg typu i roku (`Webinar 2026`, `E-book`…) + **osobny formularz na każde wydarzenie** jako zapis uczestników + automatyzacja z wyzwalaczem **„wypełnił formularz”** (wyzwalacz „dołączył do grupy” nie zadziała, gdy osoba już jest w grupie roku).
  - Odrzucone: pole na każde wydarzenie (mnożą się pola, limit pól); jedno pole z listą wydarzeń (formularz nadpisuje, nie dopisuje); jedna stała grupa „Webinar – rejestracja” czyszczona przed wydarzeniem (ryzyko, że ktoś nie dostanie linku).
- **Pola** w MailerLite przechowują jedną wartość; każdy zapis ją nadpisuje. Filtrowanie po polu: segmenty (warunek „równa się / zawiera”).
- **`webinar_source`** – pole „skąd przyszła osoba przy ostatnim zapisie” (szczegóły w rozmowie; propozycja formatu niżej, niewdrożona):
  - dziś landing wpisuje same UTM-y, np. `utm_medium=social|utm_source=facebook` (puste przy wejściu bez UTM);
  - propozycja: `id-wydarzenia|utm_…` np. `2026-12-03-zostac-zmienic-wlasna-droga|utm_medium=social|utm_source=facebook`, bez UTM: `…|direct`;
  - wartość jest nadpisywana przy każdym zapisie → po wydarzeniu eksportować listę z formularza (CSV), żeby zachować źródła.

## Do zrobienia na koniec
- [x] Macierz decyzji (ADL) – wyżej.
- [x] Raport: [`mailerlite-raport-wdrozenia.md`](mailerlite-raport-wdrozenia.md) (z listą TODO).
- [x] Instrukcja: [`mailerlite-standard.md`](mailerlite-standard.md).
- [ ] Usunięcie tokenu API „audyt-claude-2026-11” (MailerLite i sekret środowiska sesji).
