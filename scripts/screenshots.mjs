// Zrzuty referencyjne: 3 stany × mobile/desktop + strona podziękowania.
// Wymaga działającego serwera: npm run build && npm run serve
import { chromium, devices } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:4321';
const OUT = 'docs/screenshots';
const TIMES = { before: '2026-11-20T12:00:00+01:00', during: '2026-12-03T19:30:00+01:00', after: '2026-12-04T09:00:00+01:00' };
const VIEWPORTS = {
  mobile: { ...devices['iPhone 13'], defaultBrowserType: undefined },
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
};

const browser = await chromium.launch();
for (const [vp, opts] of Object.entries(VIEWPORTS)) {
  for (const [state, time] of Object.entries(TIMES)) {
    for (const [name, path] of [['landing', '/'], ['dziekuje', '/dziekuje/']]) {
      if (name === 'dziekuje' && state === 'during') continue;
      const ctx = await browser.newContext({ ...opts, locale: 'pl-PL', timezoneId: 'Europe/Warsaw' });
      const page = await ctx.newPage();
      await page.clock.install({ time: new Date(time) });
      // Zrzuty bez banera cookies (pokazany osobno w *-consent.png).
      await page.addInitScript(([st]) => {
        localStorage.setItem('pzz_consent_v1', 'denied');
        sessionStorage.setItem('pzz_signup', JSON.stringify({ newsletter: false, state: st, lead: false }));
      }, [state]);
      await page.goto(BASE + path);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: `${OUT}/${name}-${state}-${vp}.png`, fullPage: true });
      if (name === 'landing') await page.screenshot({ path: `${OUT}/${name}-${state}-${vp}-fold.png` });
      await ctx.close();
    }
  }
  const ctx = await browser.newContext({ ...opts, locale: 'pl-PL' });
  const page = await ctx.newPage();
  await page.clock.install({ time: new Date(TIMES.before) });
  await page.goto(BASE + '/');
  await page.screenshot({ path: `${OUT}/landing-before-${vp}-consent.png` });
  await ctx.close();
}
await browser.close();
console.log('Zrzuty zapisane w', OUT);
