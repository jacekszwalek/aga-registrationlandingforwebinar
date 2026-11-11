import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://webinar.przystanzmianyzawodowej.pl',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always' },
  compressHTML: true,
  devToolbar: { enabled: false },
});
