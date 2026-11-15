import AxeBuilder from '@axe-core/playwright';
import { devices, expect, test, type Page } from '@playwright/test';
import { dismissConsent, isAllowedLink, isMobile, openAt, visibleText, type State } from './helpers';

const V5 = '/v5/';
const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const submit = (page: Page) => page.locator('#zapis-hero button[type="submit"]');
const lastPayload = (page: Page) => page.evaluate(() => JSON.parse(sessionStorage.getItem('pzz_mock_last_payload') || 'null'));

test.describe('v5 – pierwszy ekran', () => {
  test('termin, tytuł, opis i treść briefu', async ({ page }) => {
    await openAt(page, 'before', V5);
    // Surowy tekst (bez normalizacji białych znaków) – sprawdza twarde spacje.
    expect(await page.locator('.hero5__over').first().evaluate((e) => e.textContent!.trim().replace(/\s*\n\s*/g, ' '))).toBe('3\u00a0grudnia\u00a02026 · 19:00 · 90\u00a0min · online');
    expect((await visibleText(page.locator('h1'))).toLowerCase()).toBe('zostać, zmienić pracę czy pójść własną drogą?');
    await expect(page.locator('.hero5__desc').first()).toContainText('Pokażę Ci, jak uporządkować swoje pomysły i możliwości');
    await expect(page.locator('.hero5 img')).toHaveCount(0); // bez zdjęcia pod nagłówkiem
  });

  test('na telefonie cały formularz z kłódką widoczny bez przewijania', async ({ page }, info) => {
    test.skip(!isMobile(info), 'tylko mobile');
    await openAt(page, 'before', V5);
    const vh = page.viewportSize()!.height;
    for (const sel of ['h1', '.hero5__desc >> nth=0', '#hero-name', '#hero-email', '#zapis-hero button[type="submit"]', '.f5__check', '.f5__privacy summary']) {
      const box = (await page.locator(sel).boundingBox())!;
      expect(box.y + box.height, sel).toBeLessThanOrEqual(vh);
    }
    // Baner cookies nie przykrywa pierwszego ekranu – pojawia się po przewinięciu.
    await expect(page.locator('[data-consent-banner]')).toBeHidden();
    await page.evaluate(() => window.scrollBy(0, 400));
    await expect(page.locator('[data-consent-banner]')).toBeVisible();
  });
});

test.describe('v5 – iPhone 15', () => {
  const { viewport, userAgent, deviceScaleFactor, isMobile: mobile, hasTouch } = devices['iPhone 15'];
  test.use({ viewport, userAgent, deviceScaleFactor, isMobile: mobile, hasTouch });
  test('wszystko z pierwszego ekranu mieści się w 393 × 659', async ({ page }) => {
    await openAt(page, 'before', V5);
    const box = (await page.locator('.f5__privacy summary').boundingBox())!;
    expect(box.y + box.height).toBeLessThanOrEqual(659);
  });
});

test.describe('v5 – formularz', () => {
  test.beforeEach(async ({ page }) => {
    await dismissConsent(page);
    await page.clock.install({ time: new Date('2026-11-20T12:00:00+01:00') });
  });

  test('imię i e-mail są wymagane', async ({ page }) => {
    await page.goto(V5);
    await submit(page).click();
    await expect(page.locator('#hero-name-error')).toHaveText('Wpisz swoje imię – tak się do Ciebie zwrócę w mailu.');
    await expect(page.locator('#hero-email-error')).toBeVisible();
    await expect(page.locator('#hero-name')).toBeFocused();
    await page.locator('#hero-name').fill('Anna');
    await submit(page).click();
    await expect(page.locator('#hero-name-error')).toBeHidden();
    await expect(page.locator('#hero-email')).toBeFocused();
  });

  test('zapis: imię, UTM-y, newsletter i przekierowanie na /v5/dziekuje/', async ({ page }) => {
    await page.goto(`${V5}?utm_source=facebook&utm_medium=social`);
    await page.locator('#hero-name').fill('Anna');
    await page.locator('#hero-email').fill('anna@example.pl');
    await page.locator('label[for="hero-newsletter"]').click();
    await submit(page).click();
    await page.clock.runFor(1000);
    await page.waitForURL('**/v5/dziekuje/');
    expect(await lastPayload(page)).toMatchObject({ name: 'Anna', email: 'anna@example.pl', newsletter: true, webinar_source: 'utm_medium=social|utm_source=facebook' });
  });

  test('kłódka rozwija informację z linkami do polityki i regulaminu newslettera', async ({ page }) => {
    await page.goto(V5);
    const privacy = page.locator('.f5__privacy');
    await expect(privacy.locator('p')).toBeHidden();
    await privacy.locator('summary').click();
    await expect(privacy.getByRole('link', { name: 'Polityce prywatności' })).toBeVisible();
    await expect(privacy.getByRole('link', { name: 'Regulaminie newslettera' })).toHaveAttribute('href', 'https://przystanzmianyzawodowej.pl/regulamin-newslettera/');
  });
});

test.describe('v5 – treść', () => {
  test.beforeEach(async ({ page }) => dismissConsent(page));

  test('karta wydarzenia, prowadząca w kółku, bez pełnego bio', async ({ page }) => {
    await openAt(page, 'before', V5);
    const card = page.locator('.event5__card');
    for (const t of ['3\u00a0grudnia\u00a02026, czwartek, 19:00', 'Online, 90\u00a0min', 'Arkusz do pracy', 'Nagranie dla zapisanych']) await expect(card).toContainText(t);
    await expect(card).toContainText('Prowadzi Agnieszka Baranowska – psycholog i coach');
    await expect(card.locator('.event5__photo img')).toHaveCount(1);
    expect(await card.locator('.event5__photo').evaluate((e) => getComputedStyle(e).borderRadius)).toBe('50%');
    await expect(page.getByText('Więcej o Agnieszce')).toHaveCount(0);
  });

  test('sekcje: 5 punktów, 3 kroki, opinie, 7 pytań, licznik', async ({ page }) => {
    await openAt(page, 'before', V5);
    await expect(page.locator('.pains5__list li')).toHaveCount(5);
    await expect(page.locator('.struct5__steps li')).toHaveCount(3);
    expect(await page.locator('.struct5__num').allInnerTexts()).toEqual(['01', '02', '03']);
    await expect(page.locator('.quotes5__more')).toBeAttached();
    await expect(page.locator('.faq5 details')).toHaveCount(7);
    expect(await visibleText(page.locator('[data-countdown] [data-unit="days"]'))).toBe('13');
  });

  test('przycisk w pasie z licznikiem wraca do formularza z fokusem w imieniu lub e-mailu', async ({ page }) => {
    await openAt(page, 'before', V5);
    await page.locator('.final5 a[data-scroll-to-form]').click();
    await expect(page.locator('#hero-email')).toBeFocused();
    await expect(page.locator('#zapis-hero')).toBeInViewport();
  });

  test('stan after', async ({ page }) => {
    await openAt(page, 'after', V5);
    expect((await visibleText(page.locator('h1'))).toLowerCase()).toBe('obejrzyj nagranie webinaru');
    expect((await visibleText(submit(page))).toLowerCase()).toBe('wyślij mi nagranie');
    await expect(page.locator('[data-countdown]')).toBeHidden();
  });

  test('linki i brak domen trzecich', async ({ page }) => {
    const foreign: string[] = [];
    page.on('request', (r) => !r.url().startsWith('http://localhost') && !r.url().startsWith('data:') && foreign.push(r.url()));
    await openAt(page, 'during', V5);
    await page.waitForLoadState('networkidle');
    const hrefs = await page.locator('a[href]').evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
    expect(hrefs.filter((h) => !isAllowedLink(h))).toEqual([]);
    expect(foreign).toEqual([]);
  });
});

test.describe('v5 – dostępność', () => {
  for (const state of ['before', 'during', 'after'] as State[]) {
    test(`axe – ${state}`, async ({ page }) => {
      await openAt(page, state, V5);
      await page.locator('details').evaluateAll((ds) => ds.forEach((d) => d.setAttribute('open', '')));
      const r = await new AxeBuilder({ page }).withTags(tags).analyze();
      expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([]);
    });
  }
  test('axe – błędy formularza na różowym tle', async ({ page }) => {
    await dismissConsent(page);
    await openAt(page, 'before', V5);
    await submit(page).click();
    const r = await new AxeBuilder({ page }).withTags(tags).analyze();
    expect(r.violations.map((v) => v.id)).toEqual([]);
  });
  test('axe – /v5/dziekuje/', async ({ page }) => {
    await openAt(page, 'before', '/v5/dziekuje/');
    const r = await new AxeBuilder({ page }).withTags(tags).analyze();
    expect(r.violations.map((v) => v.id)).toEqual([]);
  });
});
