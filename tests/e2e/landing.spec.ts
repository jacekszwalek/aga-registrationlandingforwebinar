import { expect, test } from '@playwright/test';
import { dismissConsent, isMobile, openAt } from './helpers';

test.describe('pierwszy ekran', () => {
  test('H1 widoczny, przycisk formularza osiągalny', async ({ page }, info) => {
    await openAt(page, 'before');
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toBeInViewport();
    const vh = page.viewportSize()!.height;
    const box = await page.locator('#zapis-hero button[type="submit"]').boundingBox();
    // Mobile: najwyżej jedno przewinięcie; desktop: bez przewijania.
    const limit = isMobile(info) ? vh * 2 : vh;
    expect(box!.y + box!.height).toBeLessThanOrEqual(limit);
  });

  test('desktop: dwie kolumny w hero', async ({ page }, info) => {
    test.skip(isMobile(info), 'tylko desktop');
    await openAt(page, 'before');
    const form = await page.locator('#zapis-hero').boundingBox();
    const photo = await page.locator('.hero__media').boundingBox();
    expect(photo!.x).toBeGreaterThan(form!.x + form!.width);
  });
});

test.describe('trzy stany strony', () => {
  test.beforeEach(async ({ page }) => dismissConsent(page));

  test('before: wariant A nagłówka, licznik i data tekstem', async ({ page }) => {
    await openAt(page, 'before');
    await expect(page.locator('html')).toHaveAttribute('data-state', 'before');
    await expect(page.locator('h1')).toHaveText(/Jak zmienić pracę świadomie/);
    await expect(page.locator('[data-countdown]')).toBeVisible();
    await expect(page.locator('[data-countdown] time')).toHaveText(/3 grudnia 2026, 19:00/);
    await expect(page.locator('[data-countdown] [data-unit="days"]')).toHaveText('13');
    await expect(page.locator('.live')).toBeHidden();
    await expect(page.locator('#zapis-hero button[type="submit"]')).toHaveText('Zapisuję się bezpłatnie');
  });

  test('during: baner „Trwa”, formularz aktywny, bez licznika', async ({ page }) => {
    await openAt(page, 'during');
    await expect(page.locator('html')).toHaveAttribute('data-state', 'during');
    await expect(page.locator('.live')).toBeVisible();
    await expect(page.locator('.live')).toContainText('Webinar trwa – dołącz teraz');
    await expect(page.locator('[data-countdown]')).toBeHidden();
    await expect(page.locator('#zapis-hero input[name="email"]')).toBeEnabled();
  });

  test('after: nagłówek nagrania, przycisk „Wyślij mi nagranie”, opinie zostają', async ({ page }) => {
    await openAt(page, 'after');
    await expect(page.locator('html')).toHaveAttribute('data-state', 'after');
    await expect(page.locator('h1')).toHaveText('Obejrzyj nagranie webinaru');
    await expect(page.locator('#zapis-hero button[type="submit"]')).toHaveText('Wyślij mi nagranie');
    await expect(page.locator('#zapis-hero')).toContainText('Dam Ci też znać o kolejnym webinarze');
    await expect(page.locator('[data-countdown]')).toBeHidden();
    await expect(page.locator('#testimonials-title')).toBeVisible();
  });

  test('granice: 19:00 to już during, 20:00 to już after', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-12-03T19:00:00+01:00') });
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-state', 'during');
    await page.clock.setSystemTime(new Date('2026-12-03T20:00:00+01:00'));
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-state', 'after');
  });

  test('wariant B nagłówka (podgląd ?v=b)', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-11-20T12:00:00+01:00') });
    await page.goto('/?v=b');
    await expect(page.locator('h1')).toHaveText(/Utknęłaś zawodowo\?/);
  });
});

test.describe('przyklejony przycisk', () => {
  test('pojawia się po opuszczeniu hero, przewija do formularza i ustawia fokus w e-mailu', async ({ page }, info) => {
    test.skip(!isMobile(info), 'tylko mobile');
    await dismissConsent(page);
    await openAt(page, 'before');
    const sticky = page.locator('[data-sticky-cta]');
    await expect(sticky).toBeHidden();
    await page.locator('#pains-title').scrollIntoViewIfNeeded();
    await page.mouse.wheel(0, 400);
    await expect(sticky).toBeVisible();
    await sticky.locator('button').click();
    await expect(page.locator('#hero-email')).toBeFocused();
    await expect(page.locator('#zapis-hero')).toBeInViewport();
    await expect(sticky).toBeHidden();
    const events = await page.evaluate(() => (window.__events ?? []).map((e) => e.name));
    expect(events).toContain('sticky_cta_click');
  });
});

test.describe('jeden cel – brak linków wychodzących', () => {
  test('landing: tylko kotwice do formularza i linki prawne', async ({ page }) => {
    await openAt(page, 'during');
    const hrefs = await page.locator('a[href]').evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
    const allowed = (h: string) =>
      h.startsWith('#zapis-') || h === 'https://przystanzmianyzawodowej.pl/polityka-prywatnosci/';
    expect(hrefs.filter((h) => !allowed(h))).toEqual([]);
    await expect(page.locator('nav')).toHaveCount(1); // tylko nawigacja „Informacje prawne” w stopce
    await expect(page.locator('header a')).toHaveCount(0);
  });
});

test('plik .ics generowany z konfiguracji', async ({ request }) => {
  const res = await request.get('/webinar.ics');
  expect(res.ok()).toBe(true);
  expect(res.headers()['content-type']).toContain('text/calendar');
  const body = await res.text();
  expect(body).toContain('DTSTART:20261203T180000Z');
  expect(body).toContain('DTEND:20261203T190000Z');
});
