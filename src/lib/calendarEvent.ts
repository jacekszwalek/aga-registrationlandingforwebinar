import { eventConfig } from '../config/event.config';
import type { CalendarEvent } from './calendar';
import { parseSessions } from './eventState';

/** Wydarzenie kalendarza zbudowane wyłącznie z konfiguracji. */
export function calendarEventFromConfig(): CalendarEvent {
  return {
    title: eventConfig.name,
    description: 'Bezpłatny webinar z Agnieszką Baranowską. Link do spotkania wyślę Ci mailem przed startem.',
    location: 'Online – link w mailu',
    url: eventConfig.site.url,
    sessions: parseSessions(eventConfig.sessions),
    uidPrefix: `webinar-${eventConfig.sessions[0].start.slice(0, 10)}`,
  };
}
