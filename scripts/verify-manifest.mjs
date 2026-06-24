// Asserts the PWA manifest matches The Deep. Run: node scripts/verify-manifest.mjs
import { readFileSync } from 'node:fs';
const m = JSON.parse(readFileSync(new URL('../cloudflare/frontend/public/manifest.webmanifest', import.meta.url), 'utf8'));
let f = 0;
const ok = (c, msg) => { if (!c) { console.error('FAIL:', msg); f++; } };
ok(m.background_color === '#070d14', 'background_color deep');
ok(m.theme_color === '#070d14', 'theme_color deep');
ok(!/thousand-year thread/i.test(m.name), 'name no longer "thousand-year thread"');
ok(/heirloom/i.test(m.name), 'name mentions Heirloom');
ok(m.icons.every((i) => /v=20260624deep/.test(i.src)), 'icons cache-busted');
ok(m.icons.some((i) => i.purpose === 'maskable'), 'maskable icon present');
ok((m.shortcuts ?? []).flatMap((s) => s.icons ?? []).every((i) => /v=20260624deep/.test(i.src)), 'shortcut icons cache-busted');
if (f) { console.error(`${f} manifest check(s) failed.`); process.exit(1); }
console.log('Manifest matches The Deep.');
