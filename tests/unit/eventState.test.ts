import { describe, expect, it } from 'vitest';
import { getCountdown, getEventStatus, parseSessions } from '../../src/lib/eventState';

const single = parseSessions([{ start: '2026-12-03T19:00:00+01:00', end: '2026-12-03T20:00:00+01:00' }]);
const at = (iso: string) => Date.parse(iso);

describe('getEventStatus – jedna sesja', () => {
  it('before: przed startem', () => {
    expect(getEventStatus(at('2026-11-11T12:00:00+01:00'), single).state).toBe('before');
  });
  it('before: sekundę przed startem', () => {
    expect(getEventStatus(at('2026-12-03T18:59:59+01:00'), single).state).toBe('before');
  });
  it('during: dokładnie w chwili startu (start włącznie)', () => {
    expect(getEventStatus(at('2026-12-03T19:00:00+01:00'), single).state).toBe('during');
  });
  it('during: sekundę przed końcem', () => {
    expect(getEventStatus(at('2026-12-03T19:59:59+01:00'), single).state).toBe('during');
  });
  it('after: dokładnie w chwili końca (koniec wyłącznie)', () => {
    expect(getEventStatus(at('2026-12-03T20:00:00+01:00'), single).state).toBe('after');
  });
  it('strefa czasowa: 18:00 UTC to 19:00 w Warszawie (zima)', () => {
    expect(getEventStatus(at('2026-12-03T18:00:00Z'), single).state).toBe('during');
    expect(getEventStatus(at('2026-12-03T17:59:59Z'), single).state).toBe('before');
  });
  it('zwraca najbliższą sesję dla licznika', () => {
    expect(getEventStatus(at('2026-11-30T10:00:00+01:00'), single).nextSession?.start).toBe(single[0].start);
  });
});

describe('getEventStatus – wydarzenie kilkudniowe', () => {
  const multi = parseSessions([
    { start: '2026-12-04T19:00:00+01:00', end: '2026-12-04T20:00:00+01:00' },
    { start: '2026-12-03T19:00:00+01:00', end: '2026-12-03T20:00:00+01:00' },
  ]);
  it('sortuje sesje', () => {
    expect(multi[0].start).toBeLessThan(multi[1].start);
  });
  it('przerwa między sesjami to before z licznikiem do kolejnej sesji', () => {
    const s = getEventStatus(at('2026-12-04T09:00:00+01:00'), multi);
    expect(s.state).toBe('before');
    expect(s.nextSession?.start).toBe(multi[1].start);
  });
  it('after dopiero po ostatniej sesji', () => {
    expect(getEventStatus(at('2026-12-04T20:00:00+01:00'), multi).state).toBe('after');
  });
  it('przejście na czas letni nie psuje obliczeń (sesja w marcu)', () => {
    const dst = parseSessions([{ start: '2027-03-28T19:00:00+02:00', end: '2027-03-28T20:00:00+02:00' }]);
    expect(getEventStatus(at('2027-03-28T17:30:00Z'), dst).state).toBe('during');
  });
});

describe('parseSessions – walidacja', () => {
  it('odrzuca datę bez strefy', () => {
    expect(() => parseSessions([{ start: '2026-12-03T19:00:00', end: '2026-12-03T20:00:00+01:00' }])).toThrow(/strefy/);
  });
  it('odrzuca koniec przed startem', () => {
    expect(() => parseSessions([{ start: '2026-12-03T20:00:00+01:00', end: '2026-12-03T19:00:00+01:00' }])).toThrow(/koniec/);
  });
  it('odrzuca pustą listę', () => {
    expect(() => parseSessions([])).toThrow();
  });
});

describe('getCountdown', () => {
  it('rozbija różnicę na dni, godziny, minuty, sekundy', () => {
    const now = at('2026-12-01T17:58:30+01:00');
    expect(getCountdown(now, single[0].start)).toEqual({ days: 2, hours: 1, minutes: 1, seconds: 30 });
  });
  it('nie schodzi poniżej zera', () => {
    expect(getCountdown(single[0].start + 1000, single[0].start)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  });
});
