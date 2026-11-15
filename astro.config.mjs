import { defineConfig } from 'astro/config';

// Produkcja: https://przystanzmianyzawodowej.pl/webinar/ – build:release ustawia BASE_PATH=/webinar/.
// Domyślnie (dev, testy) base = '/'.
// GitHub Pages (podgląd prototypu): SITE_URL=https://jacekszwalek.github.io BASE_PATH=/aga-registrationlandingforwebinar
export default defineConfig({
  site: process.env.SITE_URL || 'https://przystanzmianyzawodowej.pl',
  base: process.env.BASE_PATH || '/',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always' },
  compressHTML: true,
  devToolbar: { enabled: false },
});
