import type { Page, TestInfo } from '@playwright/test';

export const TIMES = {
  before: '2026-11-20T12:00:00+01:00',
  during: '2026-12-03T19:30:00+01:00',
  after: '2026-12-04T09:00:00+01:00',
} as const;

export type State = keyof typeof TIMES;

/** Zamraża czas przed załadowaniem strony – stan liczy skrypt w <head>. */
export async function openAt(page: Page, state: State, path = '/') {
  await page.clock.install({ time: new Date(TIMES[state]) });
  await page.goto(path);
}

/** Zapisuje decyzję o cookies, żeby baner nie przeszkadzał w testach niezwiązanych ze zgodą. */
export async function dismissConsent(page: Page, decision: 'granted' | 'denied' = 'denied') {
  await page.addInitScript((d) => localStorage.setItem('pzz_consent_v1', d), decision);
}

export const isMobile = (info: TestInfo) => ['iphone-13', 'pixel-7'].includes(info.project.name);
