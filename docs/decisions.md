# Decyzje

## v2 – krótka squeeze page (11.11.2026)
v1 realizowała pełną strukturę briefu i wyszła na ok. 4,7 ekranu desktopu – za dużo treści na ruch z social mediów. v2 opiera się na rekomendacjach Unbounce i przykładach Tailwind / Bandzoogle / Unbounce:
- **Formularz z jednym polem (e-mail)** na pierwszym ekranie także na telefonie; imię usunięte (było opcjonalne). Zgoda na newsletter zostaje osobno.
- **Treść rozwijana zamiast długich sekcji**: program, „dla kogo”, pełne bio, kolejne opinie i FAQ są w `<details>` – widać tylko 3 rezultaty, krótkie bio, jedną opinię i CTA.
- **Jeden formularz**: końcowe CTA i przyklejony przycisk przewijają do formularza w hero i ustawiają fokus (zamiast drugiego formularza).
- **Wygląd strony-matki** (`docs/research/design-vector.md`): WIELKIE LITERY w nagłówkach, prostokątne przyciski, różowy pas pod hero, różowa karta opinii, szary blok CTA, różowa stopka. Tła pod biały tekst w `#c43175` zamiast `#DA4391` (kontrast).
- **Szybkość na mobile**: duże zdjęcie tylko od 1024 px (na telefonie awatar), jeden formularz, JS formularza nie ładuje treści strony (`formMessages.ts`). Lighthouse mobile (lokalnie): v2 – wydajność 100, LCP 1,5 s, CLS 0,021, TBT 0 ms, 108 KB; v1 – 85, LCP 1,8 s, CLS 0,275.
- Wysokość: 2566 px przy 1440×900 (2,85 ekranu); na iPhonie 13 przycisk zapisu kończy się na 527 px z 664 px.

### Iteracja 2 (12.11.2026)
- **Karta wydarzenia zamiast dużego portretu**: prawa kolumna hero to różowa karta (`--pink-700`) z terminem, formą, ceną i nagraniem oraz małym okrągłym zdjęciem prowadzącej. Konkrety są wyróżnione i widoczne obok formularza.
- **Zgody w mniejszej formie**: zgoda na newsletter zostaje dosłowna (treść prawna), a klauzula informacyjna jest warstwowa – jedna linijka „Twoje dane są bezpieczne – kto je przetwarza?” rozwija pełny tekst z linkami.
- **Więcej przestrzeni**: sekcje 64–112 px, większe odstępy w listach i między kolumnami, interlinia 1,7. Desktop: 2815 px (3,1 ekranu). Na telefonie górny ekran zostaje zwarty, bo przycisk zapisu musi być widoczny nad banerem cookies (test to wykrył).
- Lighthouse mobile (lokalnie): wydajność 99, LCP 1,6 s, CLS 0,001, 110 KB, dostępność 100.

## v1

**Astro, statyczny output, bez frameworka UI.** Strona to jeden cel i kilka sekcji; komponenty `.astro` renderują HTML przy buildzie, a JS dostają tylko formularz, licznik, przyklejony przycisk, zgody i zdarzenia (~10 KB). To główna różnica wobec obecnego landingu (~75 skryptów WP/WooCommerce).

**Stan wydarzenia w `<html data-state>`, wszystkie warianty w HTML.** Build liczy stan, a mały skrypt inline w `<head>` koryguje go przed pierwszym renderem, więc strona przełącza się sama o 19:00 i 20:00 bez ponownego wdrożenia i bez skoku układu. CSS ukrywa elementy innych stanów (`data-show`). Lista sesji obsługuje wydarzenia kilkudniowe; przerwa między sesjami to `before` z licznikiem do najbliższej.

**Daty wyłącznie ISO z jawnym przesunięciem.** `parseSessions` odrzuca datę bez strefy, więc wynik nie zależy od strefy serwera ani przeglądarki. Testy jednostkowe działają w strefie `America/New_York`, żeby to wymusić.

**Fonty.** Nagłówki: LT Flode Neue Medium (licencja webowa potwierdzona, plik z serwera marki, preload). Tekst: Poppins 400/600, licencja OFL, self-hosted, podzbiory latin i latin-ext. Adobe Fonts nie jest ładowane – zero żądań do domen trzecich.

**Formularz: e-mail i opcjonalne imię, checkbox newslettera domyślnie odznaczony.** W prototypie `form.mode = 'mock'` – nic nie jest wysyłane, sukces przekierowuje na `/dziekuje/`. Honeypot udaje sukces, ale nic nie zapisuje i nie liczy leada. Błędy przy polach są powiązane `aria-describedby`, a wpisane dane nie znikają po błędzie.

**Zgody: własny lekki baner zamiast CookieYes.** Subdomena nie dzieli zgód z domeną główną. Google Consent Mode v2 z domyślną odmową; GA4, Pixel i Clarity są wstrzykiwane dopiero po zgodzie i tylko przy `analytics.enabled`. Na mobile baner jest dolnym paskiem, a strona dostaje dolny margines równy jego wysokości, więc nie zasłania przycisków formularza (test).

**Konwersja na `/dziekuje/` jeden raz, po zgodzie.** Flaga `lead` w `sessionStorage` jest zużywana przy pierwszym zdarzeniu; jeśli zgoda przyjdzie na stronie podziękowania, lead liczy się wtedy.

**Układ: zamiennik zdjęcia ze stałymi proporcjami.** Podmiana na `<Picture>` (AVIF/WebP, `fetchpriority="high"` w hero) nie zmieni układu. Na mobile kadr w hero jest szeroki i niski (2:1), żeby przycisk formularza był najwyżej jedno przewinięcie niżej.

**Długość strony.** Brief zakłada 3–4 ekrany na desktopie; przy pełnym zestawie sekcji wychodzi ok. 4,7 ekranu (4243 px przy 1440×900). Szczegóły i licznik połączono z powtórzonym formularzem, a FAQ ma dwie kolumny. Dalsze skrócenie wymaga decyzji o treści (np. połączenie sekcji „Prowadząca” z opiniami albo usunięcie drugiego zdjęcia).

**WebKit lokalnie.** Kontener deweloperski nie ma WebKita, więc z `PW_NO_WEBKIT=1` profile iPhone 13 i Desktop WebKit działają na Chromium z emulacją urządzenia. CI instaluje i używa prawdziwego WebKita.

**Podgląd stanów w prototypie.** `?state=before|during|after`, `?v=a|b` i `?mock=fail` działają tylko przy `allowPreviewParams = true` – do wyłączenia przed wydaniem.
