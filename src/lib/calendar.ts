import type { ParsedSession } from './eventState';

export interface CalendarEvent {
  title: string;
  description: string;
  location: string;
  url: string;
  sessions: ParsedSession[];
  /** Stały identyfikator, żeby ponowny import nie dublował wydarzenia. */
  uidPrefix: string;
}

/** 20261203T180000Z */
export function toUtcStamp(ms: number): string {
  return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** Escape tekstu wg RFC 5545 (sekcja 3.3.11). */
export function escapeIcsText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Zawija linie dłuższe niż 75 oktetów (RFC 5545, sekcja 3.1), nie dzieląc znaków UTF-8. */
export function foldIcsLine(line: string): string {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = '';
  let bytes = 0;
  for (const ch of line) {
    const len = encoder.encode(ch).length;
    const limit = parts.length === 0 ? 75 : 74; // linie kontynuacji zaczynają się od spacji
    if (bytes + len > limit) {
      parts.push(current);
      current = '';
      bytes = 0;
    }
    current += ch;
    bytes += len;
  }
  parts.push(current);
  return parts.join('\r\n ');
}

export function buildIcs(event: CalendarEvent, now: number = Date.now()): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Przystan Zmiany Zawodowej//Webinar//PL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];
  event.sessions.forEach((s, i) => {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${event.uidPrefix}-${i + 1}@przystanzmianyzawodowej.pl`,
      `DTSTAMP:${toUtcStamp(now)}`,
      `DTSTART:${toUtcStamp(s.start)}`,
      `DTEND:${toUtcStamp(s.end)}`,
      `SUMMARY:${escapeIcsText(event.title)}`,
      `DESCRIPTION:${escapeIcsText(event.description)}`,
      `LOCATION:${escapeIcsText(event.location)}`,
      `URL:${event.url}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT30M',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeIcsText(event.title)}`,
      'END:VALARM',
      'END:VEVENT',
    );
  });
  lines.push('END:VCALENDAR');
  return lines.map(foldIcsLine).join('\r\n') + '\r\n';
}

/** Link „Dodaj do Kalendarza Google” dla jednej sesji. */
export function googleCalendarUrl(event: CalendarEvent, session: ParsedSession): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${toUtcStamp(session.start)}/${toUtcStamp(session.end)}`,
    details: `${event.description}\n\n${event.url}`,
    location: event.location,
    ctz: 'Europe/Warsaw',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
