/**
 * Ścieżki zależne od `base` (GitHub Pages serwuje stronę pod /aga-registrationlandingforwebinar/,
 * docelowa subdomena pod /). Używaj zawsze zamiast ścieżek zaczynających się od „/”.
 */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
  return `${base}/${path.replace(/^\/+/, '')}`;
}
