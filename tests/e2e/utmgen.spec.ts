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

test('noindex, porządki nazwy i jeden link', async ({ page }) => {
  await open(page);
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
