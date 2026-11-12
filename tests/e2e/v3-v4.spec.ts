import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { dismissConsent, isAllowedLink, isMobile, openAt, visibleText, type State } from './helpers';

const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const lastPayload = (page: Page) => page.evaluate(() => JSON.parse(sessionStorage.getItem('pzz_mock_last_payload') || 'null'));
const axe = async (page: Page) => {
  const r = await new AxeBuilder({ page }).withTags(tags).analyze();
  return r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`);
};

// ---------------------------------------------------------------- v3 (Tailwind)
test.describe('v3 – kompozycja Tailwind, formularz w oknie', () => {
  const V3 = '/v3/';

  test('wyśrodkowane hero na różowym pasie, przycisk na pierwszym ekranie, logo na białym tle', async ({ page }) => {
    await openAt(page, 'before', V3);
    const h1 = page.locator('h1');
    await expect(h1).toBeInViewport();
    expect(await h1.evaluate((e) => getComputedStyle(e).textAlign)).toBe('center');
    const cta = page.locator('.hero3 [data-open-form]');
    const box = (await cta.boundingBox())!;
    expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize()!.height);
    expect(await page.locator('.site-header').evaluate((e) => getComputedStyle(e).backgroundColor)).toBe('rgb(255, 255, 255)');
    await expect(page.locator('dialog[data-form-dialog]')).not.toHaveAttribute('open', '');
  });

  test('każdy przycisk otwiera okno z formularzem i fokusem w e-mailu; Esc zamyka', async ({ page }) => {
    await dismissConsent(page);
    await openAt(page, 'before', V3);
    for (const sel of ['.hero3 [data-open-form]', '.plan3 [data-open-form]', '.final3 [data-open-form]']) {
      await page.locator(sel).click();
      await expect(page.locator('dialog[data-form-dialog]')).toBeVisible();
      await expect(page.locator('#hero-email')).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(page.locator('dialog[data-form-dialog]')).toBeHidden();
    }
    const events = await page.evaluate(() => (window.__events ?? []).filter((e) => e.name === 'form_open').length);
    expect(events).toBe(3);
  });

  test('zapis z okna: UTM-y i przekierowanie na /v3/dziekuje/', async ({ page }) => {
    await dismissConsent(page);
    await page.clock.install({ time: new Date('2026-11-20T12:00:00+01:00') });
    await page.goto(`${V3}?utm_source=facebook&utm_medium=social`);
    await page.locator('.hero3 [data-open-form]').click();
    await page.locator('dialog button[type="submit"]').click();
    await expect(page.locator('#hero-email-error')).toBeVisible();
    await page.locator('#hero-email').fill('anna@example.pl');
    await page.locator('dialog button[type="submit"]').click();
    await page.clock.runFor(1000);
    await page.waitForURL('**/v3/dziekuje/');
    expect(await lastPayload(page)).toMatchObject({ email: 'anna@example.pl', newsletter: false, webinar_source: 'utm_medium=social|utm_source=facebook' });
  });

  test('stany: during – baner, after – nagranie', async ({ page }) => {
    await dismissConsent(page);
    await openAt(page, 'during', V3);
    await expect(page.locator('.live')).toBeVisible();
    await page.locator('.live a').click();
    await expect(page.locator('dialog[data-form-dialog]')).toBeVisible();
    await openAt(page, 'after', V3);
    expect((await visibleText(page.locator('h1'))).toLowerCase()).toBe('obejrzyj nagranie webinaru');
    expect((await visibleText(page.locator('.hero3 [data-open-form]'))).toLowerCase()).toBe('wyślij mi nagranie');
    await expect(page.locator('[data-countdown]')).toBeHidden();
  });

  test('przyklejony przycisk otwiera okno (mobile)', async ({ page }, info) => {
    test.skip(!isMobile(info), 'tylko mobile');
    await dismissConsent(page);
    await openAt(page, 'before', V3);
    await page.locator('#learn-title').scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, 600));
    await expect(page.locator('[data-sticky-cta]')).toBeVisible();
    await page.locator('[data-sticky-cta] button').click();
    await expect(page.locator('#hero-email')).toBeFocused();
  });

  test('linki i brak domen trzecich przed zgodą', async ({ page }) => {
    const foreign: string[] = [];
    page.on('request', (r) => !r.url().startsWith('http://localhost') && !r.url().startsWith('data:') && foreign.push(r.url()));
    await openAt(page, 'during', V3);
    await page.waitForLoadState('networkidle');
    const hrefs = await page.locator('a[href]').evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
    expect(hrefs.filter((h) => !isAllowedLink(h))).toEqual([]);
    expect(foreign).toEqual([]);
  });

  for (const state of ['before', 'during', 'after'] as State[]) {
    test(`axe – ${state}`, async ({ page }) => {
      await openAt(page, state, V3);
      expect(await axe(page)).toEqual([]);
    });
  }
  test('axe – otwarte okno formularza z błędem', async ({ page }) => {
    await dismissConsent(page);
    await openAt(page, 'before', V3);
    await page.locator('.hero3 [data-open-form]').click();
    await page.locator('dialog button[type="submit"]').click();
    await page.locator('dialog details').evaluate((d) => d.setAttribute('open', ''));
    expect(await axe(page)).toEqual([]);
  });
  test('axe – /v3/dziekuje/', async ({ page }) => {
    await openAt(page, 'before', '/v3/dziekuje/');
    expect(await axe(page)).toEqual([]);
  });
});

// ---------------------------------------------------------------- v4 (Unbounce)
test.describe('v4 – kompozycja Unbounce', () => {
  const V4 = '/v4/';

  test('formularz na pierwszym ekranie, nagłówek bez wielkich liter, logo widoczne', async ({ page }) => {
    await dismissConsent(page);
    await openAt(page, 'before', V4);
    const btn = (await page.locator('#zapis-hero button[type="submit"]').boundingBox())!;
    expect(btn.y + btn.height).toBeLessThanOrEqual(page.viewportSize()!.height);
    expect(await page.locator('h1').evaluate((e) => getComputedStyle(e).textTransform)).toBe('none');
    await expect(page.locator('.site-header img')).toBeVisible();
  });

  test('kafelki faktów z licznikiem; na desktopie scena ze zdjęciem', async ({ page }, info) => {
    await openAt(page, 'before', V4);
    await expect(page.locator('.tile')).toHaveCount(4);
    expect(await visibleText(page.locator('.tile--count [data-unit="days"]'))).toBe('13');
    if (isMobile(info)) await expect(page.locator('.stage__person')).toBeHidden();
    else await expect(page.locator('.stage__person')).toBeVisible();
  });

  test('checklista 2 × 3 pod wyśrodkowanym nagłówkiem', async ({ page }, info) => {
    await openAt(page, 'before', V4);
    await expect(page.locator('.learn4__list li')).toHaveCount(6);
    expect(await page.locator('#learn-title').evaluate((e) => getComputedStyle(e).textAlign)).toBe('center');
    if (!isMobile(info)) {
      const cols = await page.locator('.learn4__list').evaluate((e) => getComputedStyle(e).gridTemplateColumns.split(' ').length);
      expect(cols).toBe(2);
    }
  });

  test('zapis: przekierowanie na /v4/dziekuje/', async ({ page }) => {
    await dismissConsent(page);
    await page.clock.install({ time: new Date('2026-11-20T12:00:00+01:00') });
    await page.goto(`${V4}?utm_source=linkedin`);
    await page.locator('#hero-email').fill('ola@example.pl');
    await page.locator('#zapis-hero button[type="submit"]').click();
    await page.clock.runFor(1000);
    await page.waitForURL('**/v4/dziekuje/');
    expect(await lastPayload(page)).toMatchObject({ email: 'ola@example.pl', webinar_source: 'utm_source=linkedin' });
  });

  test('stan after', async ({ page }) => {
    await openAt(page, 'after', V4);
    expect(await visibleText(page.locator('h1'))).toBe('Obejrzyj nagranie webinaru');
    expect((await visibleText(page.locator('#zapis-hero button[type="submit"]'))).toLowerCase()).toBe('wyślij mi nagranie');
    await expect(page.locator('#zapis-hero')).toContainText('Dam Ci też znać o kolejnym webinarze');
  });

  test('baner zgód nie zasłania przycisku', async ({ page }) => {
    await openAt(page, 'before', V4);
    const banner = page.locator('[data-consent-banner]');
    await expect(banner).toBeVisible();
    const b = (await page.locator('#zapis-hero button[type="submit"]').boundingBox())!;
    const c = (await banner.boundingBox())!;
    expect(b.y + b.height).toBeLessThanOrEqual(c.y);
  });

  test('linki i brak domen trzecich przed zgodą', async ({ page }) => {
    const foreign: string[] = [];
    page.on('request', (r) => !r.url().startsWith('http://localhost') && !r.url().startsWith('data:') && foreign.push(r.url()));
    await openAt(page, 'during', V4);
    await page.waitForLoadState('networkidle');
    const hrefs = await page.locator('a[href]').evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
    expect(hrefs.filter((h) => !isAllowedLink(h))).toEqual([]);
    expect(foreign).toEqual([]);
  });

  for (const state of ['before', 'during', 'after'] as State[]) {
    test(`axe – ${state}`, async ({ page }) => {
      await openAt(page, state, V4);
      await page.locator('details').evaluateAll((ds) => ds.forEach((d) => d.setAttribute('open', '')));
      expect(await axe(page)).toEqual([]);
    });
  }
  test('axe – /v4/dziekuje/', async ({ page }) => {
    await openAt(page, 'before', '/v4/dziekuje/');
    expect(await axe(page)).toEqual([]);
  });
});
