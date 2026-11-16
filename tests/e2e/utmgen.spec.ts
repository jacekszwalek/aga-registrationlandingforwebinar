import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { join, extname } from 'node:path';

/** utmgen to osobna statyczna aplikacja (nie część builda Astro) – serwujemy ją z katalogu przez page.route. */
const ROOT = join(process.cwd(), 'utmgen');
const ORIGIN = 'http://utmgen.test';
const TYPES: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2' };

async function open(page: Page, opts: { fresh?: boolean } = {}) {
  // Testy startują z pustym wyborem miejsc (pierwsza wizyta ma domyślnie Facebook – Post; sprawdza to osobny test).
  if (!opts.fresh) {
    await page.addInitScript(() => {
      if (!sessionStorage.getItem('seed-sel')) {
        localStorage.setItem('utmgen.state.v1', JSON.stringify({ selected: [] }));
        sessionStorage.setItem('seed-sel', '1');
      }
    });
  }
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

const tab = (page: Page, name: 'Social media' | 'Inne kanały') => page.locator('#places-label').locator('xpath=ancestor::div[contains(@class,"f")][1]').locator('.seg label', { hasText: name }).click();
const pick = (page: Page, value: string) => page.locator(`#picker input[value="${value}"]`);

test('kampania: pole puste, bieżąca data tylko jako podpowiedź w tle', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-16T10:00:00+01:00'));
  await open(page);
  await expect(page.locator('#campaign')).toHaveValue('');
  await expect(page.locator('#campaign')).toHaveAttribute('placeholder', 'np. 261116');
  await expect(page.locator('#campaign-date')).toHaveValue('');
  await expect(page.locator('#tip-campaign')).not.toContainText('startuje z dzisiejszą datą');
  await page.locator('#campaign-date').fill('2026-12-03');
  await expect(page.locator('#campaign')).toHaveValue('261203');
});

test('noindex, porządki nazwy i jeden link (jedno miejsce)', async ({ page }) => {
  await open(page);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await page.fill('#target', TARGET);
  await page.fill('#campaign', 'Zostać Zmienić');
  await expect(page.locator('#campaign')).toHaveValue('zostac-zmienic'); // zamienione w locie
  await expect(page.locator('#campaign-fix')).toContainText('[spacja]');
  await expect(page.locator('#campaign-notes')).toContainText('Sugerowany format to RRMMDD');
  await expect(page.locator('#campaign-notes')).toContainText('dowolną nazwę spoza tej konwencji');
  await page.locator('#campaign-date').fill('2026-12-03');
  await expect(page.locator('#campaign')).toHaveValue('261203');
  await expect(page.locator('#campaign-notes')).toBeEmpty();
  await expect(page.locator('#result')).toContainText('Zaznacz po lewej');
  await expect(page.locator('#acts')).toBeHidden(); // bez linków nie ma „Kopiuj wszystkie” ani CSV
  // Materiał jest zaraz pod kampanią, przed miejscami
  const order = await page.evaluate(() => ['campaign', 'content-details', 'places-label'].map((id) => document.getElementById(id)!.getBoundingClientRect().top));
  expect(order[0]).toBeLessThan(order[1]);
  expect(order[1]).toBeLessThan(order[2]);

  await pick(page, 'facebook:grupa').check();
  await expect(page.locator('#content')).toBeHidden(); // materiał domyślnie zwinięty
  await page.locator('#content-details summary').click();
  await expect(page.locator('#content')).toHaveValue('');
  await expect(page.locator('#content')).toHaveAttribute('placeholder', /link-rejestracja, grafika-z-kubkiem/);
  await page.fill('#content', 'Post 1');
  await page.fill('#campaign', '261203');
  await expect(page.locator('#campaign-date')).toHaveValue('2026-12-03');
  await expect(page.locator('.ln')).toHaveCount(1);
  await expect(page.locator('.ln-u')).toHaveText(`${TARGET}?utm_source=facebook&utm_medium=group&utm_campaign=261203&utm_content=post-1`);
  await expect(page.locator('#res-meta')).toContainText('1 link · kampania 261203 · materiał post-1');
  // cały link widoczny (bez ucinania „…”)
  const cut = await page.locator('.ln-u').evaluate((el) => el.scrollWidth > el.clientWidth + 1);
  expect(cut).toBe(false);
});

test('nowa osoba: zaznaczone tylko Facebook – Post; wyczyszczony wybór zostaje pusty po odświeżeniu', async ({ page }) => {
  await open(page, { fresh: true });
  const checked = await page.locator('#picker input[type="checkbox"][value]:checked').evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value));
  expect(checked).toEqual(['facebook:post']);
  await page.getByRole('button', { name: 'Odznacz wszystkie' }).click();
  await page.reload();
  await expect(page.locator('#picker input[type="checkbox"][value]:checked')).toHaveCount(0);
});

test('checkbox przy platformie zaznacza i odznacza wszystkie jej miejsca', async ({ page }) => {
  await open(page);
  await page.fill('#target', TARGET);
  await page.fill('#campaign', '261203');
  const fb = page.locator('#picker input[data-channel="facebook"]');
  await fb.check();
  await expect(page.locator('.ln')).toHaveCount(4);
  await pick(page, 'facebook:messenger').uncheck();
  await expect(fb).not.toBeChecked();
  expect(await fb.evaluate((el: HTMLInputElement) => el.indeterminate)).toBe(true);
  await pick(page, 'facebook:messenger').check();
  await expect(fb).toBeChecked();
  await fb.uncheck();
  await expect(page.locator('.ln')).toHaveCount(0);
  await expect(pick(page, 'facebook:grupa')).not.toBeChecked();
  // kanał z jednym miejscem (TikTok) nie ma osobnego checkboxa
  await expect(page.locator('#picker input[data-channel="tiktok"]')).toHaveCount(0);
});

test('rodzaj kampanii: jednorazowe (data) i cykliczne/stałe (nazwa) – dymek i podpowiedź dla wybranego', async ({ page, isMobile }) => {
  await page.clock.setFixedTime(new Date('2026-11-16T10:00:00+01:00'));
  await open(page);
  await page.fill('#target', TARGET);
  await pick(page, 'facebook:grupa').check();
  const rules = page.locator('#campaign-rules');
  const tip = page.locator('#tip-campaign');
  await expect(page.locator('input[name="ctype"][value="event"]')).toBeChecked();
  await expect(page.locator('#campaign')).toHaveValue('');
  await page.fill('#campaign', '261203');
  await expect(rules).toContainText('dwa wydarzenia jednego dnia: 261203-2');
  await expect(rules).toContainText('krótszy link, jednoznacznie wskazuje kampanię');
  // jeden wspólny dymek dla obu rodzajów
  await expect(tip).toContainText('Dwa wydarzenia tego samego dnia');
  await expect(tip).toContainText('Data zamiast opisu skraca długość linku');
  await expect(tip).toContainText('ebook-najlepsza-uczennica');

  await page.locator('.seg label', { hasText: 'Cykliczne' }).click();
  await expect(page.locator('#campaign-date')).toBeHidden();
  await expect(page.locator('#campaign')).toHaveValue('');
  await expect(page.locator('#campaign')).toHaveAttribute('placeholder', 'np. ebook-najlepsza-uczennica');
  await expect(rules).toHaveText('Nazwa lub tytuł · stałe przez cały czas trwania kampanii · małe litery i myślniki · będzie widoczna w linku');
  await expect(rules).not.toContainText('poprawimy');
  await expect(tip).toContainText('zawsze tej samej nazwy');
  await expect(tip).toContainText('261203-2');
  await page.fill('#campaign', 'ebook-najlepsza-uczennica');
  await expect(page.locator('.ln-u')).toContainText('utm_campaign=ebook-najlepsza-uczennica');

  // powrót do daty i ponownie do nazwy – nazwa zapamiętana
  await page.locator('.seg label', { hasText: 'Wydarzenie jednorazowe' }).click();
  await expect(page.locator('#campaign')).toHaveValue('261203'); // data z kalendarza wraca
  await page.locator('.seg label', { hasText: 'Cykliczne' }).click();
  await expect(page.locator('#campaign')).toHaveValue('ebook-najlepsza-uczennica');
  await page.reload();
  await expect(page.locator('input[name="ctype"][value="name"]')).toBeChecked();
  await expect(page.locator('#campaign')).toHaveValue('ebook-najlepsza-uczennica');
  void isMobile;
});

test('kampania: niedozwolone znaki zamieniane w locie z komunikatem', async ({ page }) => {
  await open(page);
  await page.locator('.seg label', { hasText: 'Cykliczne' }).click();
  const c = page.locator('#campaign');
  await c.pressSequentially('Ebook ');
  await expect(c).toHaveValue('ebook-');
  await expect(page.locator('#campaign-fix')).toContainText('[spacja] → „-”');
  await c.pressSequentially('Ż');
  await expect(c).toHaveValue('ebook-z');
  await expect(page.locator('#campaign-fix')).toContainText('„Ż” → „z”');
  await c.pressSequentially('#1');
  await expect(c).toHaveValue('ebook-z1');
  await expect(page.locator('#campaign-fix')).toContainText('„#” → usunięty');
});

test('partner wymaga nazwy', async ({ page }) => {
  await open(page);
  await page.fill('#target', TARGET);
  await page.fill('#campaign', '261203');
  await expect(page.locator('#partner-field')).toBeHidden();
  await tab(page, 'Inne kanały');
  await expect(page.locator('#partner-field')).toBeHidden();
  await pick(page, 'partner:polecenie').check();
  await expect(page.locator('#partner-field')).toBeVisible();
  // pole jest tuż pod pozycją „Partner / polecenie”
  const gap = await page.evaluate(() => {
    const item = document.querySelector('input[value="partner:polecenie"]')!.closest('label')!.getBoundingClientRect();
    const field = document.getElementById('partner-field')!.getBoundingClientRect();
    return field.top - item.bottom;
  });
  expect(gap).toBeGreaterThanOrEqual(0);
  expect(gap).toBeLessThan(20);
  // dymek na dole strony mieści się w oknie (otwiera się nad przyciskiem)
  await page.setViewportSize({ width: 420, height: 500 });
  const helpBtn = page.getByRole('button', { name: 'Pomoc: partner' });
  await helpBtn.scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    const b = document.querySelector('[aria-describedby="tip-partner"]')!;
    window.scrollBy(0, b.getBoundingClientRect().bottom - window.innerHeight + 20);
  });
  await helpBtn.click();
  const tip = page.locator('#tip-partner');
  await expect(tip).toContainText('komuś innemu');
  const box = (await tip.boundingBox())!;
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(500);
  await expect(page.locator('#result')).toContainText('Wpisz nazwę partnera');
  await page.fill('#partner', 'Ela');
  await expect(page.locator('.ln-u')).toContainText('utm_source=partner-ela&utm_medium=referral');
});

test('social media: linki pogrupowane w platformy, reklamy FB i IG osobno, CSV', async ({ page }) => {
  await open(page);
  await page.fill('#target', TARGET);
  await page.fill('#campaign', '261203');
  await page.getByRole('button', { name: 'Zaznacz wszystkie' }).click();
  await expect(page.locator('#cnt-social')).toHaveText(' (15)');
  // Facebook 4 + Instagram 3 + LinkedIn 3 + WhatsApp 3 + YouTube 1 + TikTok 1
  await expect(page.locator('.ln')).toHaveCount(15);
  await expect(page.locator('.plat')).toHaveCount(6);
  await expect(page.locator('.plat h3').first()).toHaveText('Facebook');
  await expect(page.locator('.plat').first().locator('.ln')).toHaveCount(4);
  await expect(page.locator('#res-meta')).toContainText('15 linków');

  // zakładka „Inne kanały”: social media znikają z listy, ale ich linki zostają w wynikach
  await tab(page, 'Inne kanały');
  await expect(page.locator('#picker')).not.toContainText('TikTok');
  await expect(page.locator('#picker')).toContainText('Reklamy Facebook');
  await expect(page.locator('#picker')).toContainText('Reklamy Instagram');
  await expect(page.locator('#picker')).not.toContainText('Meta');
  await pick(page, 'instagram-ads:reklama').check();
  await expect(page.locator('#cnt-other')).toHaveText(' (1)');
  await expect(page.locator('.ln')).toHaveCount(16);
  // „Odznacz wszystkie” działa tylko w otwartej zakładce
  await tab(page, 'Social media');
  await page.getByRole('button', { name: 'Odznacz wszystkie' }).click();
  await expect(page.locator('#cnt-social')).toHaveText('');
  await expect(page.locator('.ln')).toHaveCount(1);
  // wybrana zakładka zapamiętana
  await tab(page, 'Inne kanały');
  await page.reload();
  await expect(page.locator('input[name="pgroup"][value="other"]')).toBeChecked();
  await page.fill('#target', TARGET);
  await page.fill('#campaign', '261203');
  await expect(page.locator('.ln-u')).toContainText('utm_source=instagram&utm_medium=paid');

  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'CSV' }).click()]);
  expect(download.suggestedFilename()).toBe('utm-261203.csv');
});

test('pomoc i ustawienia: dodanie kanału, ukrywanie bez usuwania', async ({ page, isMobile }) => {
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
  const tiktok = page.locator('.ed-channel').filter({ has: page.locator('[data-f="label"][value="TikTok"]') });
  await tiktok.locator('[data-f="visible"]').uncheck();
  // przycisk zamknięcia widoczny także po przewinięciu listy kanałów
  await page.locator('.ed-channel').last().scrollIntoViewIfNeeded();
  await expect(page.getByRole('button', { name: 'Zamknij' })).toBeInViewport();
  await page.getByRole('button', { name: 'Zamknij' }).click();
  await expect(page.locator('#picker')).toContainText('Podcast');
  await expect(page.locator('#picker')).not.toContainText('TikTok');
  await page.reload();
  await expect(page.locator('#picker')).toContainText('Podcast');
  await expect(page.locator('#picker')).not.toContainText('TikTok');
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
  expect(await page.locator('.pick-name').allTextContents()).toEqual(['Facebook']);
  await tab(page, 'Inne kanały');
  expect(await page.locator('.pick-name').allTextContents()).toEqual(['Reklamy Facebook', 'Reklamy Instagram']);
});

test('axe: brak błędów dostępności', async ({ page }) => {
  await open(page);
  await page.fill('#target', TARGET);
  await page.fill('#campaign', '261203');
  await page.getByRole('button', { name: 'Zaznacz wszystkie' }).click();
  const r = await new AxeBuilder({ page }).analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
});
