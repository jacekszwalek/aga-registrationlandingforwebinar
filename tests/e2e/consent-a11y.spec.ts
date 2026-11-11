import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { dismissConsent, openAt, type State } from './helpers';

test.describe('zgody', () => {
  test('zero żądań do domen trzecich przed zgodą', async ({ page }) => {
    const foreign: string[] = [];
    page.on('request', (r) => {
      const host = new URL(r.url()).hostname;
      if (!['localhost', '127.0.0.1'].includes(host) && !r.url().startsWith('data:')) foreign.push(r.url());
    });
    await openAt(page, 'before');
    await page.waitForLoadState('networkidle');
    await page.mouse.wheel(0, 3000);
    await page.locator('#hero-email').fill('a@example.pl');
    await expect(page.locator('[data-consent-banner]')).toBeVisible();
    expect(foreign).toEqual([]);
  });

  test('baner nie zasłania przycisku formularza', async ({ page }) => {
    await openAt(page, 'before');
    const banner = page.locator('[data-consent-banner]');
    await expect(banner).toBeVisible();
    for (const id of ['hero', 'bottom']) {
      const btn = page.locator(`#zapis-${id} button[type="submit"]`);
      await btn.scrollIntoViewIfNeeded();
      const b = (await btn.boundingBox())!;
      const c = (await banner.boundingBox())!;
      expect(b.y + b.height, `przycisk ${id} kończy się nad banerem`).toBeLessThanOrEqual(c.y);
      // Przycisk faktycznie przyjmuje kliknięcie (nic go nie przykrywa).
      await btn.click({ trial: true });
    }
  });

  test('decyzja jest zapamiętana, obie opcje są równorzędne', async ({ page }) => {
    await openAt(page, 'before');
    await page.getByRole('button', { name: 'Odrzucam' }).click();
    await expect(page.locator('[data-consent-banner]')).toBeHidden();
    await page.reload();
    await expect(page.locator('[data-consent-banner]')).toBeHidden();
    await page.getByRole('button', { name: 'Ustawienia cookies' }).click();
    await expect(page.locator('[data-consent-banner]')).toBeVisible();
  });

  test('Consent Mode v2: domyślnie odmowa', async ({ page }) => {
    await openAt(page, 'before');
    const def = await page.evaluate(() =>
      (window as unknown as { dataLayer: IArguments[] }).dataLayer.map((a) => Array.from(a)).find((a) => a[0] === 'consent'),
    );
    expect(def?.[1]).toBe('default');
    expect(def?.[2]).toMatchObject({ ad_storage: 'denied', analytics_storage: 'denied', ad_user_data: 'denied' });
  });

  test('konwersja na /dziekuje/ tylko po zgodzie', async ({ page }) => {
    await page.addInitScript(() =>
      sessionStorage.setItem('pzz_signup', JSON.stringify({ newsletter: false, state: 'before', lead: true })),
    );
    await openAt(page, 'before', '/dziekuje/');
    const leads = () => page.evaluate(() => (window.__events ?? []).filter((e) => e.name === 'generate_lead').length);
    expect(await leads()).toBe(0);
    await page.getByRole('button', { name: 'Akceptuję' }).click();
    expect(await leads()).toBe(1);
    await page.reload();
    expect(await leads()).toBe(0); // nie liczy się drugi raz
  });
});

test.describe('dostępność (axe, WCAG 2.2 AA)', () => {
  const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
  for (const state of ['before', 'during', 'after'] as State[]) {
    test(`landing – ${state}`, async ({ page }) => {
      await openAt(page, state);
      await page.locator('details').first().click();
      const r = await new AxeBuilder({ page }).withTags(tags).analyze();
      expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([]);
    });
  }
  test('landing – stan błędów formularza', async ({ page }) => {
    await dismissConsent(page);
    await openAt(page, 'before');
    await page.locator('#zapis-hero button[type="submit"]').click();
    const r = await new AxeBuilder({ page }).withTags(tags).analyze();
    expect(r.violations.map((v) => v.id)).toEqual([]);
  });
  test('/dziekuje/', async ({ page }) => {
    await openAt(page, 'before', '/dziekuje/');
    const r = await new AxeBuilder({ page }).withTags(tags).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([]);
  });
});
