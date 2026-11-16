import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { join, extname } from 'node:path';

/** utmgen to osobna statyczna aplikacja (nie część builda Astro) – serwujemy ją z katalogu przez page.route. */
const ROOT = join(process.cwd(), 'utmgen');
const ORIGIN = 'http://utmgen.test';
const TYPES: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2' };

async function open(page: Page) {
  await page.route(`${ORIGIN}/**`, (route) => {
    let path = new URL(route.request().url()).pathname.replace(/^\/utmgen\//, '/');
    if (path.endsWith('/')) path += 'index.html';
    try {
      route.fulfill({ body: readFileSync(join(ROOT, path)), contentType: TYPES[extname(path)] || 'application/octet-stream' });
    } catch {
      route.fulfill({ status: 404, body: '' });
    }
  });
  await page.goto(`${ORIGIN}/utmgen/`);
}

const TARGET = 'https://przystanzmianyzawodowej.pl/webinar/';

test('domyślnie dzisiejsza data jako kampania', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-16T10:00:00+01:00'));
  await open(page);
  await expect(page.locator('#campaign')).toHaveValue('261116');
  await expect(page.locator('#campaign-date')).toHaveValue('2026-11-16');
  await page.fill('#target', TARGET);
  await expect(page.locator('#single-link')).toContainText('utm_campaign=261116');
});

test('noindex, porządki nazwy i jeden link', async ({ page }) => {
  await open(page);
  await page.fill('#campaign', '');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page.locator('#single-result')).toContainText('Uzupełnij adres strony i nazwę kampanii');

  await page.fill('#target', TARGET);
  await page.fill('#campaign', 'Zostać Zmienić');
  await expect(page.locator('#campaign-notes')).toContainText('Zapiszemy jako: zostac-zmienic');
  await expect(page.locator('#campaign-notes')).toContainText('widoczne w linku');
  await page.locator('#campaign-date').fill('2026-12-03');
  await expect(page.locator('#campaign')).toHaveValue('261203');
  await expect(page.locator('#campaign-notes')).toBeEmpty();
  await page.selectOption('#channel', 'facebook');
  await page.selectOption('#placement', 'grupa');
  await expect(page.locator('#content')).toBeHidden(); // materiał domyślnie zwinięty
  await page.locator('#content-details summary').click();
  await expect(page.locator('#content')).toHaveValue('');
  await expect(page.locator('#content')).toHaveAttribute('placeholder', /link-rejestracja, grafika-z-kubkiem/);
  await page.fill('#content', 'Post 1');
  await expect(page.locator('#single-link')).toHaveText(
    `${TARGET}?utm_source=facebook&utm_medium=group&utm_campaign=261203&utm_content=post-1`,
  );
});

test('partner wymaga nazwy', async ({ page }) => {
  await open(page);
  await page.fill('#target', TARGET);
  await page.fill('#campaign', '261203');
  await page.selectOption('#channel', 'partner');
  await expect(page.locator('#partner-field')).toBeVisible();
  await expect(page.locator('#single-result')).toContainText('Wpisz nazwę partnera');
  await page.fill('#partner', 'Ela');
  await expect(page.locator('#single-link')).toContainText('utm_source=partner-ela&utm_medium=referral');
});

test('komplet: domyślnie wszystkie social media, eksport CSV', async ({ page }) => {
  await open(page);
  await page.fill('#target', TARGET);
  await page.fill('#campaign', '261203');
  await page.getByRole('tab', { name: 'Komplet dla wydarzenia' }).click();
  // Facebook 4 + Instagram 3 + LinkedIn 3 + WhatsApp 3 + YouTube 1 + TikTok 1
  await expect(page.locator('.rows li')).toHaveCount(15);
  await page.getByRole('button', { name: 'Wyczyść' }).click();
  await expect(page.locator('#set-result')).toContainText('Zaznacz co najmniej jedno miejsce');
  await page.getByRole('button', { name: 'Wszystko' }).click();
  await expect(page.locator('#partner-set-field')).toBeVisible();
  await expect(page.locator('#set-result')).toContainText('Partner pominięty');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Pobierz plik (CSV)' }).click()]);
  expect(download.suggestedFilename()).toBe('utm-261203.csv');
});

test('pomoc po najechaniu i ustawienia kanałów', async ({ page, isMobile }) => {
  await open(page);
  const help = page.getByRole('button', { name: 'Pomoc: kampania' });
  if (isMobile) await help.click();
  else await help.hover();
  await expect(page.locator('#tip-campaign')).toBeVisible();
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Ustawienia kanałów' }).click();
  await page.getByRole('button', { name: '+ Dodaj kanał' }).click();
  const last = page.locator('.ed-channel').last();
  await last.locator('[data-f="label"]').fill('Podcast');
  await last.locator('[data-f="source"]').fill('Mój Podcast');
  await last.locator('[data-f="source"]').blur();
  await expect(last.locator('[data-f="source"]')).toHaveValue('moj-podcast');
  await page.getByRole('button', { name: 'Zamknij' }).click();
  await expect(page.locator('#channel option', { hasText: 'Podcast' })).toHaveCount(1);
  // zapamiętane po odświeżeniu
  await page.reload();
  await expect(page.locator('#channel option', { hasText: 'Podcast' })).toHaveCount(1);
});

test('axe: brak błędów dostępności', async ({ page }) => {
  await open(page);
  await page.fill('#target', TARGET);
  await page.fill('#campaign', '261203');
  const r = await new AxeBuilder({ page }).analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
});

test('reklamy FB i IG osobno; linki pogrupowane w platformy; ukrywanie kanałów', async ({ page }) => {
  await open(page);
  await page.fill('#target', TARGET);
  await page.fill('#campaign', '261203');
  await expect(page.locator('#channel option', { hasText: 'Reklamy Facebook' })).toHaveCount(1);
  await expect(page.locator('#channel option', { hasText: 'Reklamy Instagram' })).toHaveCount(1);
  await expect(page.locator('#channel option', { hasText: 'Meta' })).toHaveCount(0);
  await page.selectOption('#channel', 'instagram-ads');
  await expect(page.locator('#single-link')).toContainText('utm_source=instagram&utm_medium=paid');

  await page.getByRole('tab', { name: 'Komplet dla wydarzenia' }).click();
  await expect(page.locator('.platform')).toHaveCount(6);
  await expect(page.locator('.platform h3').first()).toContainText('Facebook');
  await expect(page.locator('.platform').first().locator('.rows li')).toHaveCount(4);

  // ukrycie TikToka i Messengera w ustawieniach
  await page.getByRole('button', { name: 'Ustawienia kanałów' }).click();
  const tiktok = page.locator('.ed-channel').filter({ has: page.locator('[data-f="label"][value="TikTok"]') });
  await tiktok.locator('[data-f="visible"]').uncheck();
  const fb = page.locator('.ed-channel').first();
  await fb.locator('li', { has: page.locator('[data-p="label"][value="Messenger"]') }).locator('[data-p="visible"]').uncheck();
  await page.getByRole('button', { name: 'Zamknij' }).click();
  await expect(page.locator('.platform')).toHaveCount(5);
  await expect(page.locator('.platform').first().locator('.rows li')).toHaveCount(3);
  await expect(page.locator('#picker')).not.toContainText('TikTok');
  await page.getByRole('tab', { name: 'Jeden link' }).click();
  await expect(page.locator('#channel option', { hasText: 'TikTok' })).toHaveCount(0);
  // nadal w ustawieniach (nie usunięty)
  await page.getByRole('button', { name: 'Ustawienia kanałów' }).click();
  await expect(page.locator('[data-f="label"][value="TikTok"]')).toHaveCount(1);
});

test('migracja: stare „Reklamy Meta” → Facebook i Instagram', async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('utmgen.channels.v1', JSON.stringify([
        { id: 'facebook', label: 'Facebook', source: 'facebook', group: 'social', placements: [{ id: 'post', label: 'Post', medium: 'social' }] },
        { id: 'meta-ads', label: 'Reklamy Meta (FB/IG)', source: 'meta', group: 'other', placements: [{ id: 'reklama', label: 'Reklama', medium: 'paid' }] },
      ]));
      sessionStorage.setItem('seeded', '1');
    }
  });
  await open(page);
  const labels = await page.locator('#channel option').allTextContents();
  expect(labels).toEqual(['Facebook', 'Reklamy Facebook', 'Reklamy Instagram']);
});
