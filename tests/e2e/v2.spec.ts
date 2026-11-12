import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { dismissConsent, isAllowedLink, isMobile, openAt, visibleText, type State } from './helpers';

const V2 = '/v2/';
const lastPayload = (page: Page) => page.evaluate(() => JSON.parse(sessionStorage.getItem('pzz_mock_last_payload') || 'null'));
const submit = (page: Page) => page.locator('#zapis-hero button[type="submit"]');

test.describe('v2 – wejście i pierwszy ekran', () => {
  test('adres główny przekierowuje do v2 z zachowaniem UTM-ów', async ({ page }) => {
    await page.goto('/?utm_source=linkedin&utm_medium=social');
    await page.waitForURL('**/v2/?utm_source=linkedin&utm_medium=social');
  });

  test('H1 i przycisk zapisu na pierwszym ekranie – także na telefonie', async ({ page }) => {
    await openAt(page, 'before', V2);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toBeInViewport();
    const box = (await submit(page).boundingBox())!;
    expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize()!.height);
    // Konkrety wydarzenia w różowej karcie zamiast dużego portretu.
    const card = page.locator('aside.event');
    await expect(card).toBeVisible();
    await expect(card).toContainText('Online, 60 minut');
    await expect(card).toContainText('Nagranie dla zapisanych');
  });

  test('strona jest krótka: najwyżej 3,5 ekranu na desktopie', async ({ page }, info) => {
    test.skip(isMobile(info), 'tylko desktop');
    await openAt(page, 'before', V2);
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(h).toBeLessThanOrEqual(page.viewportSize()!.height * 3.5);
  });

  test('waga strony przed zgodą ≤ 300 KB i zero domen trzecich', async ({ page }) => {
    let bytes = 0;
    const foreign: string[] = [];
    page.on('response', async (r) => {
      if (!r.url().startsWith('http://localhost')) foreign.push(r.url());
      try {
        bytes += (await r.body()).length;
      } catch {
        /* przekierowania nie mają treści */
      }
    });
    await openAt(page, 'before', V2);
    await page.waitForLoadState('networkidle');
    expect(foreign).toEqual([]);
    expect(bytes).toBeLessThanOrEqual(300 * 1024);
  });
});

test.describe('v2 – trzy stany', () => {
  test.beforeEach(async ({ page }) => dismissConsent(page));

  test('before: licznik i data tekstem', async ({ page }) => {
    await openAt(page, 'before', V2);
    expect(await visibleText(page.locator('h1'))).toMatch(/jak zmienić pracę/i);
    expect(await visibleText(page.locator('[data-countdown] [data-unit="days"]'))).toBe('13');
    expect(await visibleText(page.locator('[data-countdown] time'))).toBe('3 grudnia 2026, 19:00');
    await expect(page.locator('.live')).toBeHidden();
  });

  test('during: baner „Trwa”, bez licznika', async ({ page }) => {
    await openAt(page, 'during', V2);
    await expect(page.locator('.live')).toBeVisible();
    await expect(page.locator('[data-countdown]')).toBeHidden();
  });

  test('after: nagranie zamiast zapisu na żywo', async ({ page }) => {
    await openAt(page, 'after', V2);
    // Nagłówki v2 mają text-transform: uppercase (innerText to uwzględnia).
    expect((await visibleText(page.locator('h1'))).toLowerCase()).toBe('obejrzyj nagranie webinaru');
    expect((await visibleText(submit(page))).toLowerCase()).toBe('wyślij mi nagranie');
    await expect(page.locator('#zapis-hero')).toContainText('Dam Ci też znać o kolejnym webinarze');
    await expect(page.locator('[data-countdown]')).toBeHidden();
    await expect(page.locator('#quotes-title')).toBeAttached();
  });
});

test.describe('v2 – formularz', () => {
  test.beforeEach(async ({ page }) => {
    await dismissConsent(page);
    await page.clock.install({ time: new Date('2026-11-20T12:00:00+01:00') });
  });

  test('tylko e-mail i niezaznaczona zgoda na newsletter', async ({ page }) => {
    await page.goto(V2);
    const form = page.locator('#zapis-hero');
    await expect(form.locator('input:not([type="hidden"]):not([name="website"])')).toHaveCount(2);
    await expect(page.locator('#hero-newsletter')).not.toBeChecked();
    await expect(page.locator('#hero-email')).toHaveAttribute('autocomplete', 'email');
  });

  test('walidacja z błędem powiązanym przez aria-describedby', async ({ page }) => {
    await page.goto(V2);
    await submit(page).click();
    await expect(page.locator('#hero-email-error')).toHaveText('Wpisz adres e-mail, na który wyślę link.');
    await expect(page.locator('#hero-email')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#hero-email')).toBeFocused();
  });

  test('sukces: UTM-y w danych i przekierowanie na /v2/dziekuje/', async ({ page }) => {
    await page.goto(`${V2}?utm_source=facebook&utm_medium=social&utm_campaign=webinar-2026-12`);
    await page.locator('#hero-email').fill('anna@example.pl');
    await submit(page).click();
    await page.clock.runFor(1000);
    await page.waitForURL('**/v2/dziekuje/');
    expect(await lastPayload(page)).toMatchObject({
      email: 'anna@example.pl',
      name: '',
      newsletter: false,
      state: 'before',
      webinar_source: 'utm_campaign=webinar-2026-12|utm_medium=social|utm_source=facebook',
    });
    expect((await visibleText(page.locator('h1'))).toLowerCase()).toBe('jesteś zapisana!');
    await expect(page.locator('[data-newsletter-block]')).toBeVisible();
  });

  test('błąd sieci: komunikat i zachowany e-mail', async ({ page }) => {
    await page.goto(`${V2}?mock=fail`);
    await page.locator('#hero-email').fill('ewa@example.pl');
    await submit(page).click();
    await page.clock.runFor(1000);
    await expect(page.locator('#zapis-hero .form-error')).toContainText('Nie udało się połączyć');
    await expect(page.locator('#hero-email')).toHaveValue('ewa@example.pl');
  });

  test('honeypot: nic nie jest wysyłane', async ({ page }) => {
    await page.goto(V2);
    await page.locator('#hero-email').fill('bot@example.pl');
    await page.locator('#hero-website').fill('spam', { force: true });
    await submit(page).click();
    await page.waitForURL('**/v2/dziekuje/');
    expect(await lastPayload(page)).toBeNull();
  });
});

test.describe('v2 – rozwijane treści i CTA', () => {
  test.beforeEach(async ({ page }) => dismissConsent(page));

  test('szczegóły są zwinięte i rozwijają się', async ({ page }) => {
    await openAt(page, 'before', V2);
    const program = page.locator('details', { hasText: 'Zobacz program spotkania' });
    await expect(program).not.toHaveAttribute('open', '');
    await program.locator('summary').click();
    await expect(program.getByText('Co Cię blokuje')).toBeVisible();
  });

  test('końcowe CTA przewija do formularza i ustawia fokus w e-mailu', async ({ page }) => {
    await openAt(page, 'before', V2);
    await page.locator('.final a[data-scroll-to-form]').click();
    await expect(page.locator('#hero-email')).toBeFocused();
    await expect(page.locator('#zapis-hero')).toBeInViewport();
  });

  test('przyklejony przycisk na telefonie', async ({ page }, info) => {
    test.skip(!isMobile(info), 'tylko mobile');
    await openAt(page, 'before', V2);
    const sticky = page.locator('[data-sticky-cta]');
    await expect(sticky).toBeHidden();
    await page.locator('#outcomes-title').scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, 300));
    await expect(sticky).toBeVisible();
    await sticky.locator('button').click();
    await expect(page.locator('#hero-email')).toBeFocused();
  });

  test('jeden cel: brak linków poza kotwicami, prawnymi i przełącznikiem wersji', async ({ page }) => {
    await openAt(page, 'during', V2);
    const hrefs = await page.locator('a[href]').evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
    expect(hrefs.filter((h) => !isAllowedLink(h))).toEqual([]);
  });

  test('przełącznik wersji zachowuje parametry adresu', async ({ page }) => {
    await page.goto(`${V2}?state=after&utm_source=x`);
    await expect(page.locator('.vswitch a[aria-current="page"]')).toHaveText('v2');
    await page.locator('.vswitch a', { hasText: 'v1' }).click();
    await page.waitForURL('**/v1/?state=after&utm_source=x');
    expect(await visibleText(page.locator('h1'))).toBe('Obejrzyj nagranie webinaru');
  });
});

test.describe('v2 – zgody', () => {
  test('baner nie zasłania przycisku zapisu', async ({ page }) => {
    await openAt(page, 'before', V2);
    const banner = page.locator('[data-consent-banner]');
    await expect(banner).toBeVisible();
    await submit(page).scrollIntoViewIfNeeded();
    const b = (await submit(page).boundingBox())!;
    const c = (await banner.boundingBox())!;
    expect(b.y + b.height).toBeLessThanOrEqual(c.y);
  });
});

test.describe('v2 – dostępność (axe, WCAG 2.2 AA)', () => {
  const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
  for (const state of ['before', 'during', 'after'] as State[]) {
    test(`landing – ${state} (z rozwiniętymi blokami)`, async ({ page }) => {
      await openAt(page, state, V2);
      await page.locator('details').evaluateAll((ds) => ds.forEach((d) => d.setAttribute('open', '')));
      const r = await new AxeBuilder({ page }).withTags(tags).analyze();
      expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([]);
    });
  }
  test('błędy formularza', async ({ page }) => {
    await dismissConsent(page);
    await openAt(page, 'before', V2);
    await submit(page).click();
    const r = await new AxeBuilder({ page }).withTags(tags).analyze();
    expect(r.violations.map((v) => v.id)).toEqual([]);
  });
  test('/v2/dziekuje/', async ({ page }) => {
    await openAt(page, 'before', '/v2/dziekuje/');
    const r = await new AxeBuilder({ page }).withTags(tags).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([]);
  });
});

test('v2 – klauzula danych schowana warstwowo, link do polityki w środku', async ({ page }) => {
  await dismissConsent(page);
  await openAt(page, 'before', V2);
  const privacy = page.locator('#zapis-hero details.signup__privacy');
  await expect(privacy.locator('p')).toBeHidden();
  await privacy.locator('summary').click();
  await expect(privacy.getByRole('link', { name: 'Polityce prywatności' })).toBeVisible();
});
