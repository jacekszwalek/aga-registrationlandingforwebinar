# Skracacz linków

Krótkie linki z UTM-ami na domenie Przystani – wszystko w generatorze UTM **https://przystanzmianyzawodowej.pl/utmgen/**:
przycisk **„Skróć”** przy gotowym linku i lista **„Krótkie linki”** w górnym pasku (bezpośrednio: `/utmgen/#krotkie-linki`).
Logowanie tym samym hasłem co licznik webinaru (zapamiętane na 30 dni).

## Jak wygląda krótki link
Ścieżka strony docelowej + `l/` + kod:

| Strona docelowa | Krótki link |
|---|---|
| `https://przystanzmianyzawodowej.pl/webinar/` | `https://przystanzmianyzawodowej.pl/webinar/l/k3x9` |
| `https://przystanzmianyzawodowej.pl/webinar/dziekuje/` | `https://przystanzmianyzawodowej.pl/webinar/dziekuje/l/m7q2` |
| `https://przystanzmianyzawodowej.pl/bezplatne-szkolenie/` | `https://przystanzmianyzawodowej.pl/bezplatne-szkolenie/l/p4t8` ¹ |
| inna domena (np. Calendly) | `https://przystanzmianyzawodowej.pl/l/x2v7` ¹ |

¹ działa dzięki regule w `public_html/.htaccess` (dodana 23.11.2026, niżej).

Adres bez „/” na końcu (np. `…/webinar?utm_…`) jest poprawiany na `…/webinar/?utm_…`, więc krótki link ma postać `…/webinar/l/kod`. Linki utworzone wcześniej pod `/l/kod` dalej działają i prowadzą na poprawiony adres.

- **Kod**: losowy, 4 znaki bez mylących się `0/o/1/l/i` (ok. 800 tys. kombinacji; potem automatycznie 5 znaków) albo własny, np. `linkedin-261203` (3–40 znaków: małe litery, cyfry, „-”).
- **Bez duplikatów**: ten sam pełny adres = ten sam krótki link.
- Serwer sprawdza, czy ścieżka przed `/l/` pasuje do linku – `/inna-strona/l/k3x9` nie zadziała.
- **Nieznany kod** (albo usunięty link) → przekierowanie na stronę nadrzędną, czyli adres przed `/l/` (np. `/webinar/`).

## Kliknięcia i archiwum
- Kliknięcia liczone po stronie serwera: bez cookies, bez IP; boty i podglądy linków (Facebook, LinkedIn, WhatsApp…) się nie liczą.
- **Aktywne** – kliknięte lub utworzone w ostatnich 30 dniach; **uśpione** – 30–180 dni bez kliknięcia; **zarchiwizowane** – 180+ dni bez kliknięcia (automatycznie). Zarchiwizowane znikają z bieżącej listy, ale **nadal działają**.
- Lista w generatorze sortuje od najdłużej nieklikanych; filtry: bieżące (domyślnie, bez zarchiwizowanych), aktywne, uśpione, zarchiwizowane, wszystkie; wyszukiwarka, kopiowanie.
- **Usuwanie ręczne** – każdy link (przy linku z kliknięciami generator ostrzega); usunięty adres prowadzi na stronę nadrzędną.

## Reguła dla całej domeny (jednorazowo)
Linki pod `/webinar/…` działają dzięki regule w `deploy/htaccess-root` (wdrażana automatycznie). Dla pozostałych stron domeny i linków do innych domen w **`public_html/.htaccess`** (na samej górze, przed `# BEGIN LSCACHE` i `# BEGIN WordPress`) jest reguła – **z przekierowaniem `R=302`**, bo LiteSpeed na hostingu nie przekazuje wewnętrznie do podkatalogu `webinar/` z własnym `.htaccess`:
```
# Krótkie linki (skracacz z generatora UTM)
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteRule ^(.*/)?l/([A-Za-z0-9-]+)/?$ /webinar/l/index.php?c=$2&p=/$1 [R=302,L]
</IfModule>
```
Sprawdzenie: `https://przystanzmianyzawodowej.pl/l/test` powinien przekierować na stronę główną.

## Technicznie
- `public/api/_links.php` – logika (zapis `~/utm-links/links.json` poza `public_html`, blokada pliku, zapis atomowy); testy `tests/php/links.test.php` (CI).
- `public/l/index.php` – przekierowanie 302 + licznik kliknięć.
- `public/licznik/api.php` – API dla generatora (status, logowanie, skracanie, lista, usuwanie; tylko z naszej domeny).
- `public/licznik/linki/` – tylko przekierowanie na `/utmgen/#krotkie-linki` (stary adres); `public/api/_auth.php` – wspólne logowanie z licznikiem.
- `utmgen/app.js` – przycisk „Skróć”, lista „Krótkie linki”, okno logowania, pamięć krótkich linków w przeglądarce (`utmgen.short.v1`). Na podglądzie GitHub Pages API nie ma, więc przycisk się nie pokazuje.
