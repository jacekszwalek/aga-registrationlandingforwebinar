import { describe, expect, it } from 'vitest';
import { appKind, botSignals, buildPayload, deviceKind, pageKind } from '../../src/lib/funnel';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148';

describe('licznik etapów bez cookies', () => {
  it('rozpoznaje rodzaj strony pod base /webinar/', () => {
    expect(pageKind('/webinar/', '/webinar/')).toBe('landing');
    expect(pageKind('/webinar/index.html', '/webinar/')).toBe('landing');
    expect(pageKind('/webinar/dziekuje/', '/webinar/')).toBe('dziekuje');
    expect(pageKind('/webinar/archived/v2/', '/webinar/')).toBe('archiwum');
    expect(pageKind('/', '/')).toBe('landing');
    expect(pageKind('/podglad/', '/')).toBe('inna');
  });

  it('rozpoznaje przeglądarki aplikacji Meta i urządzenie', () => {
    expect(appKind(`${IPHONE} [FBAN/FBIOS;FBAV/450.0]`)).toBe('facebook');
    expect(appKind(`${IPHONE} Instagram 350.0`)).toBe('instagram');
    expect(appKind(IPHONE)).toBe('inna');
    expect(deviceKind(IPHONE, 390)).toBe('mobile');
    expect(deviceKind('Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 1400)).toBe('desktop');
  });

  it('wysyła tylko dozwolone zdarzenia, bez danych osobowych i z oczyszczonymi wartościami', () => {
    const base = { pageId: 'abc123', pathname: '/webinar/', base: '/webinar/', ua: IPHONE, width: 390, state: 'before' };
    expect(buildPayload({ ...base, event: 'cokolwiek', utm: {} })).toBeNull();
    const p = buildPayload({
      ...base,
      event: 'form_error',
      utm: { utm_source: 'facebook', utm_medium: 'paid', utm_campaign: '261203', utm_content: 'Grafika A<script>' },
      params: { field: 'email', reason: 'invalid', email: 'osoba@example.com' },
    });
    expect(p).toEqual({ e: 'form_error', v: 'abc123', p: 'landing', st: 'before', s: 'facebook', m: 'paid', c: '261203', ct: 'grafikaascript', d: 'mobile', a: 'inna', f: 'email', r: 'invalid' });
    expect(JSON.stringify(p)).not.toContain('example.com');
  });

  it('sygnały automatu – tylko flagi tak/nie', () => {
    expect(botSignals({ webdriver: false, ua: IPHONE, languages: ['pl-PL'], screenW: 390, innerW: 390 })).toBe('');
    expect(botSignals({ webdriver: true, ua: 'Mozilla/5.0 HeadlessChrome/140', languages: [], screenW: 0, innerW: 0 })).toBe('wd.hl.nl.sz');
    const p = buildPayload({ event: 'page_view', pageId: 'a', pathname: '/', base: '/', ua: IPHONE, width: 390, utm: {}, params: { bot: 'wd' } });
    expect(p?.bt).toBe('wd');
  });
});
