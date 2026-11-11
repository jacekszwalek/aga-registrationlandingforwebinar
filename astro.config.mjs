import { defineConfig } from 'astro/config';

// Domyślnie: docelowa subdomena w katalogu głównym.
// GitHub Pages (podgląd prototypu): SITE_URL=https://jacekszwalek.github.io BASE_PATH=/aga-registrationlandingforwebinar
export default defineConfig({
  site: process.env.SITE_URL || 'https://webinar.przystanzmianyzawodowej.pl',
  base: process.env.BASE_PATH || '/',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always' },
  compressHTML: true,
  devToolbar: { enabled: false },
});
