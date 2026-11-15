import type { APIRoute } from 'astro';
import { eventConfig } from '../../config/event.config';
import { parseSessions } from '../../lib/eventState';

/**
 * Konfiguracja dla public/api/subscribe.php – jedno źródło prawdy (event.config.ts).
 * Same identyfikatory grup (nie są tajne); klucz API MailerLite nigdy nie trafia do builda.
 */
export const GET: APIRoute = () => {
  const ml = eventConfig.mailerlite;
  const origin = new URL(eventConfig.site.url).origin;
  return new Response(
    JSON.stringify({
      eventId: eventConfig.id,
      eventName: ml.eventName,
      sessions: parseSessions(eventConfig.sessions).map((s) => ({ start: s.start, end: s.end })),
      groups: ml.groups,
      interactionGroupPrefix: ml.interactionGroupPrefix,
      firstEventField: ml.firstEventField,
      allowedOrigins: [origin, `https://www.${new URL(origin).hostname}`],
    }),
    { headers: { 'content-type': 'application/json' } },
  );
};
