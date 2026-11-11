// Minimalny serwer statyczny dla testów e2e (dist/, opcjonalny BASE_PATH).
// `astro preview` w Astro 7 przechodzi w tło bez TTY, czego Playwright nie obsługuje.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const root = join(process.cwd(), 'dist');
const port = Number(process.env.PORT || 4321);
const base = (process.env.BASE_PATH || '').replace(/\/+$/, '');
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.ics': 'text/calendar; charset=utf-8', '.txt': 'text/plain',
};

createServer((req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (base && !path.startsWith(base + '/')) return void res.writeHead(404).end('Not found');
  path = path.slice(base.length);
  let file = normalize(join(root, path));
  if (!file.startsWith(root)) return void res.writeHead(403).end();
  try {
    if (statSync(file).isDirectory()) file = join(file, 'index.html');
    statSync(file);
  } catch {
    return void res.writeHead(404).end('Not found');
  }
  res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
  createReadStream(file).pipe(res);
}).listen(port, () => console.log(`Serving dist/ at http://localhost:${port}${base}/`));
