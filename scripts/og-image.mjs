// Generuje public/og-image.png (1200×630) – podgląd linku na Facebooku/LinkedInie.
// Tytuł i data w środkowym kwadracie 630×630 – nie znikają, gdy WhatsApp/Messenger kadrują do 1:1.
// Uruchom ponownie po zmianie tytułu lub terminu: node scripts/og-image.mjs
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';

const b64 = (p) => readFileSync(p).toString('base64');
const font = b64('src/assets/fonts/ltflodeneue-medium.woff2');
const poppins = b64('src/assets/fonts/poppins-latin-ext-600-normal.woff2');
const poppinsLatin = b64('src/assets/fonts/poppins-latin-600-normal.woff2');
const logo = b64('src/assets/logo.png');
const poppins400 = b64('src/assets/fonts/poppins-latin-ext-400-normal.woff2');
const poppins400Latin = b64('src/assets/fonts/poppins-latin-400-normal.woff2');

const html = `<!doctype html><html lang="pl"><head><meta charset="utf-8"><style>
@font-face{font-family:Flode;src:url(data:font/woff2;base64,${font}) format('woff2')}
@font-face{font-family:Pop;font-weight:600;src:url(data:font/woff2;base64,${poppinsLatin}) format('woff2');unicode-range:U+0000-00FF}
@font-face{font-family:Pop;font-weight:600;src:url(data:font/woff2;base64,${poppins}) format('woff2');unicode-range:U+0100-02BA}
@font-face{font-family:Pop;font-weight:400;src:url(data:font/woff2;base64,${poppins400Latin}) format('woff2');unicode-range:U+0000-00FF}
@font-face{font-family:Pop;font-weight:400;src:url(data:font/woff2;base64,${poppins400}) format('woff2');unicode-range:U+0100-02BA}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;overflow:hidden;font-family:Pop,sans-serif;background:#fff;position:relative;text-align:center}
/* Dekoracje tylko na bokach (poza środkowym kwadratem 630×630, który zostaje przy kadrowaniu do 1:1) */
.side{position:absolute;top:0;width:250px;height:630px;background:#fcf0f6}
.side--l{left:0}.side--r{right:0}
.c{position:absolute;border-radius:50%}
.c1{left:-90px;top:-80px;width:300px;height:300px;background:#f4d3e6}
.c2{left:40px;top:430px;width:220px;height:220px;background:#f7c4de}
.c3{right:-70px;top:-60px;width:240px;height:240px;background:#f7c4de}
.c4{right:-110px;top:380px;width:330px;height:330px;background:#f4d3e6}
/* Środkowy kwadrat: wszystko, co najważniejsze */
.safe{position:absolute;left:285px;top:0;width:630px;height:630px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 20px}
.logo{height:62px;margin-bottom:22px}
.pill{background:#c43175;color:#fff;border-radius:4px;padding:8px 20px;font:600 22px/1.2 Pop;letter-spacing:.12em;text-transform:uppercase;margin-bottom:22px}
h1{font:500 64px/1 Flode,sans-serif;color:#951d5b;text-transform:uppercase;margin-bottom:26px}
.date{font:600 38px/1.15 Pop;color:#2b081a}
.date i{font-style:normal;color:#c43175;padding:0 8px}
.meta{margin-top:8px;font:600 26px/1.3 Pop;color:#c43175}
.url{position:absolute;left:0;right:0;bottom:18px;font:600 18px/1 Pop;color:#951d5b}
</style></head><body>
<div class="side side--l"></div><div class="side side--r"></div>
<div class="c c1"></div><div class="c c2"></div><div class="c c3"></div><div class="c c4"></div>
<div class="safe">
  <img class="logo" src="data:image/png;base64,${logo}" alt="">
  <div class="pill">Bezpłatny webinar</div>
  <h1>Zostać,<br>zmienić pracę<br>czy pójść<br>własną drogą?</h1>
  <p class="date">3 grudnia 2026<i>·</i>19:00</p>
  <p class="meta">online · 90&nbsp;min</p>
</div>
<p class="url">przystanzmianyzawodowej.pl/webinar</p>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
const png = await page.screenshot({ type: 'png' });
writeFileSync('public/og-image.png', png);
await browser.close();
console.log('public/og-image.png', png.length, 'B');
