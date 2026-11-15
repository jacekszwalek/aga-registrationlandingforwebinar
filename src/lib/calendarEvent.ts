import { eventConfig } from '../config/event.config';
import type { CalendarEvent } from './calendar';
import { parseSessions } from './eventState';

/** Wydarzenie kalendarza zbudowane wyłącznie z konfiguracji. */
export function calendarEventFromConfig(): CalendarEvent {
  return {
    title: eventConfig.name,
    description: 'Bezpłatny webinar z Agnieszką Baranowską. Link do spotkania wyślę Ci mailem przed startem.',
    location: 'Online, link w mailu',
    url: eventConfig.site.url,
    sessions: parseSessions(eventConfig.sessions),
    // Stały UID z identyfikatora webinaru – ponowny import nie dubluje wydarzenia.
    uidPrefix: eventConfig.id,
  };
}
