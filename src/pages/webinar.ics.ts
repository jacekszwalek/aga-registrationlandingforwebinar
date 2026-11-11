import type { APIRoute } from 'astro';
import { buildIcs } from '../lib/calendar';
import { calendarEventFromConfig } from '../lib/calendarEvent';

export const prerender = true;

export const GET: APIRoute = () =>
  new Response(buildIcs(calendarEventFromConfig()), {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8' },
  });
