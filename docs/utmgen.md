# Generator linków UTM – `/utmgen/`

Narzędzie pracy dla Agnieszki: **https://przystanzmianyzawodowej.pl/utmgen/** (podgląd: GitHub Pages `…/aga-registrationlandingforwebinar/utmgen/`).
Statyczna strona bez serwera i bez analityki, `noindex` (meta + nagłówek `X-Robots-Tag`), nielinkowana.

## Co robi (projekt B – dwa panele, od 16.11.2026)
- **Lewy panel**: adres strony, kampania (**data wydarzenia RRMMDD**, np. `261203`; startuje z dzisiejszą datą, kalendarz obok), lista **miejsc** do zaznaczenia (pogrupowana: social media / inne kanały → kanał → miejsca, z `utm_medium` po prawej), skróty „Social media / Wszystko / Wyczyść”, zwinięty **Materiał (`utm_content`)** – domyślnie pusty (podpowiedź `link-rejestracja`, `grafika-z-kubkiem`).
- **Prawy panel – Gotowe linki** (na żywo): linki pogrupowane według platform, „Kopiuj” przy każdym, „Kopiuj N” dla platformy, „Kopiuj wszystkie” (do arkusza w kolumnach) i **CSV** (Excel, średnik, polskie znaki). Jeden link = jedno zaznaczone miejsce.
- Na telefonie panele są jeden pod drugim, a przycisk „Gotowe: N linków ↓” przewija do wyników.
- **Dlaczego data jako kampania:** parametry linku widzi każdy, kto w niego kliknie; data nie zdradza, czego dotyczy kampania. Dwa wydarzenia tego samego dnia: `261203-2`. Generator ostrzega, gdy w nazwie są słowa, i sprawdza poprawność daty.
- **Porządki automatyczne**: małe litery, bez polskich znaków, myślniki zamiast spacji; stare `utm_*` w wklejonym linku są zastępowane, inne parametry i `#kotwica` zostają.
- **Pomoc**: znak „?” przy każdym polu (najechanie, fokus albo dotknięcie).
- **Kanały ⚙**: dodawanie/zmiana/usuwanie kanałów i miejsc; **„Pokazuj”** – tymczasowe ukrycie kanału lub miejsca bez usuwania; zapis w przeglądarce; „Zapisz kopię ustawień” / „Wczytaj kopię” (JSON) i „Przywróć domyślne”. Zapis ustawień na serwerze – odłożony (wymaga hasła na `/utmgen/`).

## Kanały domyślne (`utmgen/channels.js`)
Social media: Facebook (post, grupa, wydarzenie, Messenger), Instagram (bio, stories, DM), LinkedIn (post/komentarz, profil, wiadomość), WhatsApp (grupa, kanał, wiadomość), YouTube (opis/komentarz), TikTok (bio).
Inne: newsletter (`mailerlite/email`), stopka maila, strona www, partner (`partner-{nazwa}/referral`), kod QR (`qr/offline`), reklamy Facebook (`facebook/paid`), reklamy Instagram (`instagram/paid`) – od 16.11.2026 zamiast wspólnego „Meta”, LinkedIn (`linkedin/paid`), Google (`google/cpc`).
Miejsca o tym samym `utm_medium` połączono (profil i strona FB → „Post”; post i komentarz LinkedIn; opis i komentarz YouTube), żeby komplet nie zawierał identycznych linków.

## Wdrożenie (jednorazowo – TY)
1. **cPanel → Konta FTP → Dodaj konto**: login np. `deploy-utmgen`, katalog **`public_html/utmgen`**, silne hasło.
2. **GitHub → Settings → Secrets and variables → Actions**: `UTMGEN_FTP_USERNAME` (pełny login, np. `deploy-utmgen@…`), `UTMGEN_FTP_PASSWORD`. Serwer bierze się z istniejącego `FTP_SERVER`.
3. *Actions → Wdrożenie generatora UTM → Run workflow* (później wdraża się samo po zmianach w `utmgen/`).
4. W WordPressie nie twórz strony o slugu `utmgen`.

## Pliki
`utmgen/index.html`, `app.js` (interfejs), `utm.js` (logika – testy `tests/unit/utmgen.test.ts`), `channels.js`, `style.css`, `fonts/`, `logo.png`, `.htaccess`. Testy e2e: `tests/e2e/utmgen.spec.ts`.
