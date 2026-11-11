import type { EventSession } from '../config/event.config';

export type EventState = 'before' | 'during' | 'after';

export interface ParsedSession {
  start: number;
  end: number;
}

export interface EventStatus {
  state: EventState;
  /** Najbliższa sesja, która jeszcze się nie zaczęła (dla licznika); null w trakcie i po wydarzeniu. */
  nextSession: ParsedSession | null;
  /** Sesja trwająca teraz (tylko w stanie „during”). */
  currentSession: ParsedSession | null;
}

const OFFSET_RE = /(Z|[+-]\d{2}:\d{2})$/;

/** Waliduje i sortuje sesje. Wymaga jawnej strefy w ISO, żeby wynik nie zależał od strefy maszyny. */
export function parseSessions(sessions: EventSession[]): ParsedSession[] {
  if (sessions.length === 0) throw new Error('Konfiguracja musi zawierać co najmniej jedną sesję.');
  return sessions
    .map((s, i) => {
      if (!OFFSET_RE.test(s.start) || !OFFSET_RE.test(s.end)) {
        throw new Error(`Sesja ${i + 1}: podaj datę ISO z przesunięciem strefy (np. +01:00).`);
      }
      const start = Date.parse(s.start);
      const end = Date.parse(s.end);
      if (Number.isNaN(start) || Number.isNaN(end)) throw new Error(`Sesja ${i + 1}: niepoprawna data.`);
      if (end <= start) throw new Error(`Sesja ${i + 1}: koniec musi być po starcie.`);
      return { start, end };
    })
    .sort((a, b) => a.start - b.start);
}

/**
 * Stan strony w chwili `now`:
 * - during – trwa któraś z sesji (start włącznie, koniec wyłącznie),
 * - before – przed pierwszą sesją albo w przerwie między sesjami wydarzenia kilkudniowego,
 * - after – po końcu ostatniej sesji.
 */
export function getEventStatus(now: number, sessions: ParsedSession[]): EventStatus {
  const current = sessions.find((s) => now >= s.start && now < s.end) ?? null;
  if (current) return { state: 'during', nextSession: null, currentSession: current };
  const next = sessions.find((s) => now < s.start) ?? null;
  if (next) return { state: 'before', nextSession: next, currentSession: null };
  return { state: 'after', nextSession: null, currentSession: null };
}

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function getCountdown(now: number, target: number): Countdown {
  let rest = Math.max(0, Math.floor((target - now) / 1000));
  const days = Math.floor(rest / 86400);
  rest -= days * 86400;
  const hours = Math.floor(rest / 3600);
  rest -= hours * 3600;
  const minutes = Math.floor(rest / 60);
  return { days, hours, minutes, seconds: rest - minutes * 60 };
}
