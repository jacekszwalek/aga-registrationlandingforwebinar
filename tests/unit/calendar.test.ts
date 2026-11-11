import { describe, expect, it } from 'vitest';
import { buildIcs, escapeIcsText, foldIcsLine, googleCalendarUrl, toUtcStamp, type CalendarEvent } from '../../src/lib/calendar';
import { parseSessions } from '../../src/lib/eventState';

const event: CalendarEvent = {
  title: 'Bezpłatny webinar Przystani Zmiany Zawodowej',
  description: 'Link wyślę mailem; do zobaczenia, Agnieszka',
  location: 'Online – link w mailu',
  url: 'https://webinar.przystanzmianyzawodowej.pl',
  sessions: parseSessions([{ start: '2026-12-03T19:00:00+01:00', end: '2026-12-03T20:00:00+01:00' }]),
  uidPrefix: 'webinar-2026-12-03',
};
const NOW = Date.parse('2026-11-11T10:00:00Z');

describe('toUtcStamp', () => {
  it('19:00 w Warszawie (CET) to 18:00 UTC', () => {
    expect(toUtcStamp(event.sessions[0].start)).toBe('20261203T180000Z');
  });
});

describe('buildIcs', () => {
  const ics = buildIcs(event, NOW);
  it('ma poprawną strukturę i CRLF', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics.replace(/\r\n/g, '')).not.toMatch(/\n/);
  });
  it('zawiera czasy w UTC i stabilny UID', () => {
    expect(ics).toContain('DTSTART:20261203T180000Z');
    expect(ics).toContain('DTEND:20261203T190000Z');
    expect(ics).toContain('UID:webinar-2026-12-03-1@przystanzmianyzawodowej.pl');
    expect(ics).toContain('DTSTAMP:20261111T100000Z');
  });
  it('escapuje przecinki i średniki', () => {
    expect(ics).toContain('DESCRIPTION:Link wyślę mailem\\; do zobaczenia\\, Agnieszka');
  });
  it('żadna linia nie przekracza 75 oktetów', () => {
    for (const line of ics.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  });
  it('generuje VEVENT dla każdej sesji', () => {
    const multi = { ...event, sessions: parseSessions([
      { start: '2026-12-03T19:00:00+01:00', end: '2026-12-03T20:00:00+01:00' },
      { start: '2026-12-04T19:00:00+01:00', end: '2026-12-04T20:00:00+01:00' },
    ]) };
    expect(buildIcs(multi, NOW).match(/BEGIN:VEVENT/g)).toHaveLength(2);
  });
});

describe('foldIcsLine / escapeIcsText', () => {
  it('nie dzieli znaków wielobajtowych', () => {
    const folded = foldIcsLine('SUMMARY:' + 'ż'.repeat(80));
    expect(folded.split('\r\n ').join('')).toBe('SUMMARY:' + 'ż'.repeat(80));
  });
  it('escapuje backslash i nowe linie', () => {
    expect(escapeIcsText('a\\b\nc')).toBe('a\\\\b\\nc');
  });
});

describe('googleCalendarUrl', () => {
  const url = new URL(googleCalendarUrl(event, event.sessions[0]));
  it('wskazuje na szablon wydarzenia Google', () => {
    expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/render');
    expect(url.searchParams.get('action')).toBe('TEMPLATE');
  });
  it('ma daty w UTC i strefę Europe/Warsaw', () => {
    expect(url.searchParams.get('dates')).toBe('20261203T180000Z/20261203T190000Z');
    expect(url.searchParams.get('ctz')).toBe('Europe/Warsaw');
    expect(url.searchParams.get('text')).toBe(event.title);
  });
});
