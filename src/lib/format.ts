import type { ParsedSession } from './eventState';

const TZ = 'Europe/Warsaw';

/** „3 grudnia 2026” */
export function formatDate(ms: number): string {
  return new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ }).format(ms);
}

/** „19:00” */
export function formatTime(ms: number): string {
  return new Intl.DateTimeFormat('pl-PL', { hour: '2-digit', minute: '2-digit', timeZone: TZ }).format(ms);
}

/** „19:00–20:00” */
export function formatTimeRange(s: ParsedSession): string {
  return `${formatTime(s.start)}–${formatTime(s.end)}`;
}

export function durationMinutes(s: ParsedSession): number {
  return Math.round((s.end - s.start) / 60000);
}

/** Liczebnik w języku polskim: 1 dzień, 2 dni, 5 dni / 1 godzina, 2 godziny, 5 godzin. */
export function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  const d = n % 10;
  const t = n % 100;
  if (d >= 2 && d <= 4 && (t < 12 || t > 14)) return few;
  return many;
}
