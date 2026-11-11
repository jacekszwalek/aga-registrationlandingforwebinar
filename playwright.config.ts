import { defineConfig, devices } from '@playwright/test';

/**
 * Na CI (CI=true) projekty iPhone 13 i Desktop WebKit używają prawdziwego WebKita.
 * Lokalnie, gdy WebKit nie jest zainstalowany (PW_NO_WEBKIT=1), te same profile
 * urządzeń uruchamiane są na Chromium – rozmiar ekranu, dotyk i UA się zgadzają,
 * silnik renderujący nie.
 */
const noWebkit = process.env.PW_NO_WEBKIT === '1';
const webkitOr = (cfg: Record<string, unknown>) => (noWebkit ? { ...cfg, browserName: 'chromium' as const, defaultBrowserType: 'chromium' } : cfg);

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4321',
    locale: 'pl-PL',
    timezoneId: 'Europe/Warsaw',
    trace: 'off',
  },
  projects: [
    { name: 'iphone-13', use: webkitOr({ ...devices['iPhone 13'] }) },
    { name: 'pixel-7', use: { ...devices['Pixel 7'] } },
    { name: 'desktop-chrome', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'desktop-webkit', use: webkitOr({ ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } }) },
  ],
  webServer: {
    command: 'npx astro preview --port 4321',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
