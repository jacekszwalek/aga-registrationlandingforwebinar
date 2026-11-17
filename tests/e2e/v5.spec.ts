import AxeBuilder from '@axe-core/playwright';
import { devices, expect, test, type Page } from '@playwright/test';
import { dismissConsent, isAllowedLink, isMobile, openAt, visibleText, type State } from './helpers';

const V5 = '/archived/v5/';
const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const submit = (page: Page) => page.locator('#zapis-hero button[type="submit"]');
const openForm = async (page: Page) => {
  await page.locator('.hero5__cta').click();
  await expect(page.locator('dialog[data-form-dialog]')).toBeVisible();
};
const lastPayload = (page: Page) => page.evaluate(() => JSON.parse(sessionStorage.getItem('pzz_mock_last_payload') || 'null'));

test.describe('v5 – pierwszy ekran', () => {
  test('termin, tytuł, opis i treść briefu', async ({ page }) => {
    await openAt(page, 'before', V5);
    // Surowy tekst (bez normalizacji białych znaków) – sprawdza twarde spacje.
    expect(await page.locator('.hero5__over').first().evaluate((e) => e.textContent!.trim().replace(/\s*\n\s*/g, ' '))).toBe('3\u00a0grudnia\u00a02026 · 19:00 · 90\u00a0min · online');
    expect((await visibleText(page.locator('h1'))).toLowerCase()).toBe('zostać, zmienić pracę czy pójść własną drogą?');
    await expect(page.locator('.hero5__sub').first()).toContainText('Pokażę Ci, jak uporządkować swoje pomysły i możliwości');
    await expect(page.locator('.hero5 img')).toHaveCount(0); // bez zdjęcia pod nagłówkiem
  });

  test('pierwszy ekran jak v3: pigułka, termin, tytuł, opis i przycisk; formularz w okienku', async ({ page }) => {
    await openAt(page, 'before', V5);
    const vh = page.viewportSize()!.height;
    for (const sel of ['.pill', 'h1', '.hero5__sub >> nth=0', '.hero5__cta']) {
      const box = (await page.locator(sel).boundingBox())!;
      expect(box.y + box.height, sel).toBeLessThanOrEqual(vh);
    }
    await expect(page.locator('dialog[data-form-dialog]')).toBeHidden();
    await expect(page.locator('.hero5 img')).toHaveCount(0);
  });

  test('typografia hero identyczna jak w v3', async ({ page }) => {
    const styles = async (path: string, prefix: string) => {
      await openAt(page, 'before', path);
      return page.evaluate((p) => {
        const s = (sel: string) => { const c = getComputedStyle(document.querySelector(sel)!); return [c.fontSize, c.lineHeight, c.fontFamily, c.textTransform].join('|'); };
        return { pill: s('.pill'), over: s(`.${p}__over`), h1: s('h1'), sub: s(`.${p}__sub`), cta: s(`.${p}__cta`) };
      }, prefix);
    };
    const v3 = await styles('/archived/v3/', 'hero3');
    const v5 = await styles(V5, 'hero5');
    expect(v5).toEqual(v3);
  });
});

test.describe('v5 – iPhone 15', () => {
  const { viewport, userAgent, deviceScaleFactor, isMobile: mobile, hasTouch } = devices['iPhone 15'];
  test.use({ viewport, userAgent, deviceScaleFactor, isMobile: mobile, hasTouch });
  test('przycisk zapisu mieści się w 393 × 659', async ({ page }) => {
    await openAt(page, 'before', V5);
    const box = (await page.locator('.hero5__cta').boundingBox())!;
    expect(box.y + box.height).toBeLessThanOrEqual(659);
  });
});

test.describe('v5 – formularz', () => {
  test.beforeEach(async ({ page }) => {
    await dismissConsent(page);
    await page.clock.install({ time: new Date('2026-11-20T12:00:00+01:00') });
  });

  test('imię i e-mail są wymagane; fokus startuje w imieniu', async ({ page }) => {
    await page.goto(V5);
    await openForm(page);
    await expect(page.locator('#hero-name')).toBeFocused();
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
    await openForm(page);
    await page.locator('#hero-name').fill('Anna');
    await page.locator('#hero-email').fill('anna@example.pl');
    await page.locator('label[for="hero-newsletter"]').click();
    await submit(page).click();
    await page.clock.runFor(1000);
    await page.waitForURL('**/archived/v5/dziekuje/');
    expect(await lastPayload(page)).toMatchObject({ name: 'Anna', email: 'anna@example.pl', newsletter: true, webinar_source: 'utm_medium=social|utm_source=facebook' });
    const events = await page.evaluate(() => sessionStorage.getItem('pzz_signup'));
    expect(events).toBeTruthy();
  });

  test('kłódka rozwija informację z linkami do polityki i regulaminu newslettera', async ({ page }) => {
    await page.goto(V5);
    await openForm(page);
    const privacy = page.locator('.fdialog__privacy');
    await expect(privacy.locator('p')).toBeHidden();
    await privacy.locator('summary').click();
    await expect(privacy.getByRole('link', { name: 'Polityce prywatności' })).toBeVisible();
    await expect(privacy.getByRole('link', { name: 'Regulaminie newslettera' })).toHaveAttribute('href', 'https://przystanzmianyzawodowej.pl/regulamin-newslettera/');
  });
});

test.describe('v5 – treść', () => {
  test.beforeEach(async ({ page }) => dismissConsent(page));

  test('w miejscu zdjęcia: karta z podsumowaniem i prowadzącą w kółku, bez pełnego bio', async ({ page }) => {
    await openAt(page, 'before', V5);
    await expect(page.locator('.frame5 .event5__card')).toBeVisible();
    await expect(page.locator('.frame5 .stripe')).toBeAttached();
    const card = page.locator('.event5__card');
    for (const t of ['3\u00a0grudnia\u00a02026, czwartek, 19:00', 'Online, 90\u00a0min', 'Arkusz do pracy', 'Nagranie dla zapisanych']) await expect(card).toContainText(t);
    await expect(card).toContainText('Prowadzi Agnieszka Baranowska – psycholog i coach');
    await expect(card.locator('.event5__photo img')).toHaveCount(1);
    expect(await card.locator('.event5__photo').evaluate((e) => getComputedStyle(e).borderRadius)).toBe('50%');
    await expect(page.getByText('Więcej o Agnieszce')).toHaveCount(0);
  });

  test('sekcje: 5 punktów, 3 kroki, opinie, 6 pytań, licznik', async ({ page }) => {
    await openAt(page, 'before', V5);
    await expect(page.locator('.pains5__list li')).toHaveCount(5);
    await expect(page.locator('.struct5__steps li')).toHaveCount(3);
    expect(await page.locator('.struct5__num').allInnerTexts()).toEqual(['01', '02', '03']);
    await expect(page.locator('.quotes5__more')).toBeAttached();
    await expect(page.locator('.faq5 details')).toHaveCount(6);
    expect(await visibleText(page.locator('[data-countdown] [data-unit="days"]'))).toBe('13');
  });

  test('przyciski w karcie i w pasie z licznikiem otwierają okno z formularzem', async ({ page }) => {
    await openAt(page, 'before', V5);
    await page.locator('.final5 [data-open-form]').click();
    await expect(page.locator('dialog[data-form-dialog]')).toBeVisible();
    await expect(page.locator('#hero-name')).toBeFocused();
  });

  test('zdarzenia mają webinar_id i wersję strony (rozdzielenie od poprzednich webinarów)', async ({ page }) => {
    await openAt(page, 'before', V5);
    await openForm(page);
    const ev = await page.evaluate(() => (window.__events ?? []).find((e) => e.name === 'form_open'));
    expect(ev).toMatchObject({ webinar_id: '2026-12-03-zostac-zmienic-wlasna-droga', landing_version: 'v5' });
  });

  test('stan after', async ({ page }) => {
    await openAt(page, 'after', V5);
    expect((await visibleText(page.locator('h1'))).toLowerCase()).toBe('obejrzyj nagranie webinaru');
    expect((await visibleText(page.locator('.hero5__cta'))).toLowerCase()).toBe('wyślij mi nagranie');
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
  test('axe – okno formularza z błędami', async ({ page }) => {
    await dismissConsent(page);
    await openAt(page, 'before', V5);
    await openForm(page);
    await submit(page).click();
    await page.locator('dialog details').evaluate((d) => d.setAttribute('open', ''));
    const r = await new AxeBuilder({ page }).withTags(tags).analyze();
    expect(r.violations.map((v) => v.id)).toEqual([]);
  });
  test('axe – /v5/dziekuje/', async ({ page }) => {
    await openAt(page, 'before', '/archived/v5/dziekuje/');
    const r = await new AxeBuilder({ page }).withTags(tags).analyze();
    expect(r.violations.map((v) => v.id)).toEqual([]);
  });
});

test.describe('analityka po zgodzie', () => {
  test('podgląd: tylko Clarity (ze0k15awef) z tagami; GA4 i Pixel wyłącznie na produkcji', async ({ page }) => {
    const requests: string[] = [];
    await page.route(/clarity\.ms|googletagmanager\.com|facebook\.net/, (r) => {
      requests.push(r.request().url());
      return r.fulfill({ status: 200, contentType: 'text/javascript', body: '' });
    });
    await openAt(page, 'before', V5);
    await page.evaluate(() => window.scrollBy(0, 400));
    expect(requests).toEqual([]);
    await page.getByRole('button', { name: 'Akceptuję' }).click();
    await expect.poll(() => requests).toEqual(['https://www.clarity.ms/tag/ze0k15awef']);
    const queue = await page.evaluate(() => ((window as unknown as { clarity: { q: unknown[][] } }).clarity.q ?? []).map((a) => a.join(':')));
    expect(queue).toEqual(expect.arrayContaining(['consent', 'set:landing_version:v5', 'set:environment:localhost']));
    // Zdarzenia lejka trafiają też do Clarity.
    await page.locator('.hero5__cta').click();
    const after = await page.evaluate(() => ((window as unknown as { clarity: { q: unknown[][] } }).clarity.q ?? []).map((a) => a.join(':')));
    expect(after).toEqual(expect.arrayContaining(['event:form_open', 'event:form_start', 'set:webinar_id:2026-12-03-zostac-zmienic-wlasna-droga']));
  });
});

test('archiwum: stare wersje pod /archived/vN/ działają i mają noindex', async ({ page }) => {
  for (const v of ['v1', 'v2', 'v3', 'v4', 'v5']) {
    const res = await page.goto(`/archived/${v}/`);
    expect(res?.status(), v).toBe(200);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    expect((await page.request.get(`/archived/${v}/dziekuje/`)).status()).toBe(200);
  }
  expect((await page.request.get('/v1/')).status()).toBe(404);
});

test('podgląd linku: og:image 1200×630 z adresu produkcyjnego i karta Twittera', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://przystanzmianyzawodowej.pl/webinar/og-image.png');
  await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1200');
  await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute('content', '630');
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute('content', /3 grudnia 2026/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  const img = await request.get('/og-image.png');
  expect(img.ok()).toBe(true);
  expect(img.headers()['content-type']).toContain('image/png');
});

test('Open Graph: krótki tytuł z datą; strona podziękowania udostępnia stronę zapisu', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'Zostać, zmienić pracę czy pójść własną drogą? Bezpłatny webinar 3 grudnia 2026');
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://przystanzmianyzawodowej.pl/webinar/');
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', /3 grudnia 2026, 19:00, 90 min/);
  await page.goto('/dziekuje/');
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /Bezpłatny webinar 3 grudnia 2026/);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://przystanzmianyzawodowej.pl/webinar/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://przystanzmianyzawodowej.pl/webinar/dziekuje/');
});

test('og:logo i logo organizacji (Schema.org)', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.locator('meta[property="og:logo"]')).toHaveAttribute('content', 'https://przystanzmianyzawodowej.pl/webinar/logo.png');
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
  expect(ld).toMatchObject({ '@type': 'Organization', name: 'Przystań Zmiany Zawodowej', logo: 'https://przystanzmianyzawodowej.pl/webinar/logo.png' });
  expect((await request.get('/logo.png')).ok()).toBe(true);
});

test('stopka bez danych administratora, z linkiem do polityki prywatności', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('footer')).not.toContainText('NIP');
  await expect(page.locator('footer a', { hasText: 'Polityka prywatności' })).toBeVisible();
});

test('logo bez UTM-ów (?ref=), konsultacja z oryginalnymi UTM-ami osoby', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.site-header__logo')).toHaveAttribute('href', 'https://przystanzmianyzawodowej.pl/?ref=landing-webinar-logo');
  // wejście bez UTM-ów → oznaczenie landingu
  await page.goto('/dziekuje/');
  const consult = page.getByRole('link', { name: 'Umawiam konsultację' });
  await expect(consult).toHaveAttribute('href', /utm_source=landing-webinar&utm_medium=referral&utm_campaign=261203&utm_term=landing-webinar-konsultacja$/);
  // osoba przyszła z Facebooka → jej UTM-y zostają, dochodzi tylko utm_term
  await page.evaluate(() => sessionStorage.setItem('pzz_utm', JSON.stringify({ utm_source: 'facebook', utm_medium: 'group', utm_campaign: '261203' })));
  await page.reload();
  await expect(consult).toHaveAttribute(
    'href',
    'https://calendly.com/baranowska-agnieszka92/rozmowa?utm_source=facebook&utm_medium=group&utm_campaign=261203&utm_term=landing-webinar-konsultacja',
  );
});

test('/dziekuje/: po zapisie do newslettera przycisk „Zapisano” i nieaktywny', async ({ page }) => {
  await page.goto('/dziekuje/');
  const btn = page.locator('[data-newsletter-cta]');
  await btn.click();
  await expect(page.locator('[data-newsletter-done]')).toBeVisible();
  await expect(btn).toHaveText('Zapisano');
  await expect(btn).toBeDisabled();
});

test('/dziekuje/: przy newsletterze informacja o administratorze danych', async ({ page }) => {
  await page.goto('/dziekuje/');
  const priv = page.locator('[data-newsletter-block] .ty__privacy');
  await priv.locator('summary').click();
  await expect(priv).toContainText('Administratorem Twoich danych jest Agnieszka Baranowska');
  await expect(priv.getByRole('link', { name: 'Polityce prywatności' })).toBeVisible();
  await expect(priv.getByRole('link', { name: 'Regulaminie newslettera' })).toBeVisible();
});

test('/dziekuje/: pogrubione „folderów Oferty i Spam”', async ({ page }) => {
  await page.goto('/dziekuje/');
  await expect(page.locator('.ty__lead strong')).toHaveText('folderów Oferty i Spam');
  await expect(page.locator('.ty__lead')).not.toContainText('**');
});
