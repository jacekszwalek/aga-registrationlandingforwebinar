import { describe, expect, it } from 'vitest';
import { extractUtm, referralUrl, serializeUtm } from '../../src/lib/utm';
import { formatDate, formatTimeRange, plural } from '../../src/lib/format';
import { parseSessions } from '../../src/lib/eventState';

describe('UTM', () => {
  it('bierze dowolne utm_*, ignoruje inne parametry', () => {
    expect(extractUtm('?utm_source=facebook&utm_medium=social&utm_content=post_3&utm_custom=x&fbclid=abc&v=b')).toEqual({
      utm_source: 'facebook',
      utm_medium: 'social',
      utm_content: 'post_3',
      utm_custom: 'x',
    });
  });
  it('serializuje stabilnie (posortowane klucze)', () => {
    expect(serializeUtm({ utm_source: 'linkedin', utm_campaign: 'webinar-2026-12' })).toBe(
      'utm_campaign=webinar-2026-12|utm_source=linkedin',
    );
  });
  it('pusty obiekt daje pusty napis', () => {
    expect(serializeUtm({})).toBe('');
  });
  it('link polecający ma utm_source=referral i nie przenosi cudzych UTM-ów', () => {
    const u = new URL(referralUrl('https://webinar.przystanzmianyzawodowej.pl/?utm_source=facebook#zapis'));
    expect(u.searchParams.get('utm_source')).toBe('referral');
    expect(u.hash).toBe('');
  });
});

describe('format', () => {
  const [s] = parseSessions([{ start: '2026-12-03T19:00:00+01:00', end: '2026-12-03T20:00:00+01:00' }]);
  it('formatuje datę i godziny w strefie Europe/Warsaw', () => {
    expect(formatDate(s.start)).toBe('3 grudnia 2026');
    expect(formatTimeRange(s)).toBe('19:00–20:00');
  });
  it('odmienia liczebniki', () => {
    expect([1, 2, 5, 12, 22, 25].map((n) => plural(n, 'dzień', 'dni', 'dni'))).toEqual(['dzień', 'dni', 'dni', 'dni', 'dni', 'dni']);
    expect([1, 3, 5, 13, 24].map((n) => plural(n, 'godzina', 'godziny', 'godzin'))).toEqual([
      'godzina',
      'godziny',
      'godzin',
      'godzin',
      'godziny',
    ]);
  });
});
