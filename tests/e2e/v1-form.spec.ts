import { expect, test, type Page } from '@playwright/test';
import { dismissConsent, visibleText } from './helpers';

const lastPayload = (page: Page) =>
  page.evaluate(() => JSON.parse(sessionStorage.getItem('pzz_mock_last_payload') || 'null'));

test.beforeEach(async ({ page }) => {
  await dismissConsent(page);
  await page.clock.install({ time: new Date('2026-11-20T12:00:00+01:00') });
});

test('checkbox newslettera domyślnie niezaznaczony, imię to input, nie textarea', async ({ page }) => {
  await page.goto('/v1/');
  await expect(page.locator('#hero-newsletter')).not.toBeChecked();
  await expect(page.locator('#bottom-newsletter')).not.toBeChecked();
  await expect(page.locator('textarea')).toHaveCount(0);
  await expect(page.locator('#hero-name')).toHaveAttribute('autocomplete', 'given-name');
  await expect(page.locator('#hero-email')).toHaveAttribute('type', 'email');
  await expect(page.locator('#hero-email')).toHaveAttribute('autocomplete', 'email');
});

test('walidacja: pusty i błędny e-mail, błędy powiązane aria-describedby', async ({ page }) => {
  await page.goto('/v1/');
  const email = page.locator('#hero-email');
  const error = page.locator('#hero-email-error');
  await page.locator('#zapis-hero button[type="submit"]').click();
  await expect(error).toHaveText('Wpisz adres e-mail, na który wyślę link.');
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await expect(email).toHaveAttribute('aria-describedby', 'hero-email-error');
  await expect(email).toBeFocused();

  await email.fill('anna@');
  await page.locator('#zapis-hero button[type="submit"]').click();
  await expect(error).toContainText('Sprawdź adres e-mail');

  await email.fill('anna@example.pl');
  await expect(error).toBeHidden();
  await expect(email).not.toHaveAttribute('aria-invalid', 'true');

  const events = await page.evaluate(() => (window.__events ?? []).map((e) => e.name));
  expect(events).toEqual(expect.arrayContaining(['form_start', 'form_submit_attempt', 'form_error']));
});

test('sukces: stan ładowania, UTM-y w danych, przekierowanie na /dziekuje/', async ({ page }) => {
  await page.goto('/v1/?utm_source=facebook&utm_medium=social&utm_campaign=webinar-2026-12&utm_content=post_a&fbclid=xyz');
  await page.locator('#hero-name').fill('Anna');
  await page.locator('#hero-email').fill('anna@example.pl');
  const button = page.locator('#zapis-hero button[type="submit"]');
  await button.click();
  await expect(button).toHaveAttribute('aria-busy', 'true');
  await page.clock.runFor(1000);
  await page.waitForURL('**/dziekuje/');
  const payload = await lastPayload(page);
  expect(payload).toMatchObject({
    email: 'anna@example.pl',
    name: 'Anna',
    newsletter: false,
    state: 'before',
    headline_variant: 'A',
    webinar_source: 'utm_campaign=webinar-2026-12|utm_content=post_a|utm_medium=social|utm_source=facebook',
    utm: { utm_source: 'facebook', utm_medium: 'social', utm_campaign: 'webinar-2026-12', utm_content: 'post_a' },
  });
  expect(await visibleText(page.locator('h1'))).toBe('Jesteś zapisana!');
  // Bez zaznaczonej zgody – zaproszenie do newslettera widoczne.
  await expect(page.locator('[data-newsletter-block]')).toBeVisible();
});

test('zaznaczony newsletter: brak bloku zaproszenia na /dziekuje/', async ({ page }) => {
  await page.goto('/v1/');
  await page.locator('#bottom-email').fill('ola@example.pl');
  await page.locator('label[for="bottom-newsletter"]').click();
  await page.locator('#zapis-bottom button[type="submit"]').click();
  await page.clock.runFor(1000);
  await page.waitForURL('**/dziekuje/');
  expect((await lastPayload(page)).newsletter).toBe(true);
  await expect(page.locator('[data-newsletter-block]')).toBeHidden();
});

test('błąd sieci: komunikat, dane zachowane, można ponowić', async ({ page }) => {
  await page.goto('/v1/?mock=fail');
  await page.locator('#hero-name').fill('Ewa');
  await page.locator('#hero-email').fill('ewa@example.pl');
  await page.locator('#zapis-hero button[type="submit"]').click();
  await page.clock.runFor(1000);
  await expect(page.locator('#zapis-hero .form-error')).toContainText('Nie udało się połączyć');
  await expect(page).toHaveURL(/\/\?mock=fail$/);
  await expect(page.locator('#hero-email')).toHaveValue('ewa@example.pl');
  await expect(page.locator('#hero-name')).toHaveValue('Ewa');
  await expect(page.locator('#zapis-hero button[type="submit"]')).toHaveAttribute('aria-busy', 'false');
});

test('honeypot: bot „widzi” sukces, ale nic nie jest wysyłane ani liczone jako lead', async ({ page }) => {
  await page.goto('/v1/');
  await page.locator('#hero-email').fill('bot@example.pl');
  await page.locator('#hero-website').fill('http://spam.example', { force: true });
  await page.locator('#zapis-hero button[type="submit"]').click();
  await page.waitForURL('**/dziekuje/');
  expect(await lastPayload(page)).toBeNull();
  const signup = await page.evaluate(() => JSON.parse(sessionStorage.getItem('pzz_signup') || 'null'));
  expect(signup.lead).toBe(false);
});

test('stan after: zapis na nagranie i wersja strony podziękowania', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-12-05T10:00:00+01:00'));
  await page.goto('/v1/');
  await page.locator('#hero-email').fill('kasia@example.pl');
  await page.locator('#zapis-hero button[type="submit"]').click();
  await page.clock.runFor(1000);
  await page.waitForURL('**/dziekuje/');
  expect((await lastPayload(page)).state).toBe('after');
  expect(await visibleText(page.locator('h1'))).toBe('Nagranie jest w drodze na Twoją skrzynkę');
  await expect(page.locator('[data-calendar]').first()).toBeHidden();
});
