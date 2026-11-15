// Sprawdza build wydania: każda ścieżka bezwzględna w HTML/CSS/JS musi zaczynać się od BASE (np. /webinar/).
// Chroni przed 404 na /_astro/* po przeniesieniu strony do podkatalogu.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const base = process.argv[2] || '/webinar/';
const root = 'dist';
const bad = [];
const walk = (d) => readdirSync(d).forEach((f) => {
  const p = join(d, f);
  if (statSync(p).isDirectory()) return walk(p);
  if (!/\.(html|css|js)$/.test(f)) return;
  const s = readFileSync(p, 'utf8');
  // atrybuty href/src/srcset/action/content i url() w CSS
  const re = /(?:\b(?:href|src|action|srcset|poster)=["']|url\(["']?)(\/[^"')\s,]*)/g;
  for (const m of s.matchAll(re)) {
    const u = m[1];
    if (u.startsWith('//') || u.startsWith(base)) continue;
    bad.push(`${p}: ${u}`);
  }
});
walk(root);
if (bad.length) {
  console.error(`Ścieżki poza ${base}:\n` + [...new Set(bad)].slice(0, 50).join('\n'));
  process.exit(1);
}
console.log(`OK – wszystkie ścieżki bezwzględne w ${root}/ zaczynają się od ${base}`);
