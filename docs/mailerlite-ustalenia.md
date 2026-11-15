# MailerLite – ustalenia robocze (do ADR, raportu i instrukcji)

Notatki z rozmowy 15.11.2026. Na koniec prac powstaną z nich: **macierz decyzji (ADR/ADL) z uzasadnieniem, raport końcowy i instrukcja tworzenia kolejnych wydarzeń i formularzy.** Audyt i plan: [`mailerlite-audyt.md`](mailerlite-audyt.md), raport PDF: [`mailerlite-raport.pdf`](mailerlite-raport.pdf).

## ⚠️ WAŻNE

1. **Nie usuwaj formularzy – archiwizuj je.** Formularz w MailerLite przechowuje listę osób, które się przez niego zapisały. Usunięcie formularza = utrata listy uczestników danego wydarzenia. Po wydarzeniu zmień tylko nazwę na `ARCHIWUM - …` (i zdejmij go ze stron).
2. **Uczestników konkretnego wydarzenia bierzesz z formularza.** *Forms → formularz → subskrybenci* (w panelu) albo API `GET /forms/{id}/subscribers`. Dlatego: **jedno wydarzenie = jeden formularz** (źródło ruchu rozróżniamy polem `webinar_source`, nie osobnymi formularzami jak przy wyzwaniu META/IG/LI…). Do sprawdzenia w panelu: czy segment da się ustawić warunkiem „zapisał się przez formularz X”.

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
- [ ] Macierz decyzji (ADR/ADL): decyzja, alternatywy, uzasadnienie, konsekwencje.
- [ ] Raport końcowy.
- [ ] Instrukcja: nowe wydarzenie → grupy, formularz, checkbox zgody, automatyzacja, podpięcie landingu, test, archiwizacja.
- [ ] Usunięcie tokenu API „audyt-claude-2026-11” (MailerLite i sekret środowiska sesji).
