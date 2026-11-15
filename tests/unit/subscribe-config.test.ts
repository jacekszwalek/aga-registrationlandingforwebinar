import { describe, it, expect } from 'vitest';
import { GET } from '../../src/pages/api/event.json';
import { eventConfig } from '../../src/config/event.config';

describe('api/event.json – konfiguracja dla subscribe.php', () => {
  it('ma wszystkie grupy, pole i dozwolone źródła; bez klucza API', async () => {
    const res = await (GET as unknown as () => Response)();
    const text = await res.text();
    const cfg = JSON.parse(text);
    expect(Object.keys(cfg.groups).sort()).toEqual(['consent', 'eventType', 'participants', 'recording', 'registration']);
    for (const id of Object.values(cfg.groups)) expect(id).toMatch(/^\d{15,}$/);
    expect(cfg.groups.consent).toBe(eventConfig.mailerlite.newsletterGroupId);
    expect(cfg.firstEventField).toBe('pierwsze_wydarzenie');
    expect(cfg.interactionGroupPrefix).toBe('Interakcja ');
    expect(cfg.eventName.startsWith('2026-12-03 - ')).toBe(true);
    expect(cfg.allowedOrigins).toContain('https://przystanzmianyzawodowej.pl');
    expect(cfg.sessions[0].end).toBeGreaterThan(cfg.sessions[0].start);
    expect(text).not.toMatch(/api[_-]?key|bearer|token/i);
  });
});
