#!/usr/bin/env node
/**
 * check-routes — static link-integrity check.
 *
 * Catches the class of bug where a <Link to=…>, <Navigate to=…>, navigate(…),
 * or internal <a href=…> points at a path that no <Route> declares — i.e. a
 * link that silently lands on the catch-all NotFound (the /inherit → 404 bug).
 *
 * It parses every `path="…"` out of src/App.tsx to build the set of real
 * routes, then scans all of src/** for internal navigation targets and asserts
 * each one matches a declared route. Dynamic segments (`:id`) and template
 * placeholders (`${…}`) are matched positionally. Query strings and hashes are
 * ignored. The catch-all `*` route is NOT counted as a match (landing there is
 * the bug). Exits non-zero on any dead link.
 *
 * Run: `node scripts/check-routes.mjs` (wired as `npm run check:routes`).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const APP = join(SRC, 'App.tsx');

// ── 1. Declared routes ──────────────────────────────────────────────────────
const appSrc = readFileSync(APP, 'utf8');
const routes = [...appSrc.matchAll(/path=["']([^"']+)["']/g)].map((m) => m[1]);
const hasCatchAll = routes.includes('*');
const realRoutes = routes.filter((r) => r !== '*');

// A route matches a target when, segment for segment, each route segment is
// either identical to the target segment or a `:param` (matches anything).
function segments(path) {
  return path.replace(/^\//, '').replace(/\/$/, '').split('/').filter(Boolean);
}
const routeSegs = realRoutes.map(segments);

function matchesARoute(target) {
  const t = segments(target);
  return routeSegs.some((r) => {
    if (r.length !== t.length) return false;
    return r.every((seg, i) => seg.startsWith(':') || seg === t[i]);
  }) || (target === '/' && realRoutes.includes('/'));
}

// ── 2. Collect navigation targets across src/** ───────────────────────────────
function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (/\.(tsx?|jsx?)$/.test(name)) out.push(p);
  }
  return out;
}

// Normalise a raw target: drop query/hash, turn `${…}` into a positional
// placeholder that matches a `:param` segment.
function normalise(raw) {
  let s = raw.split('?')[0].split('#')[0];
  s = s.replace(/\$\{[^}]*\}/g, ':dyn');
  return s;
}

const PATTERNS = [
  /\bto=["']([^"'`]+)["']/g,                 // <Link to="/x"> / <Navigate to="/x">
  /\bto=\{`([^`]+)`\}/g,                       // <Link to={`/x/${id}`}>
  /\bnavigate\(\s*["'`]([^"'`)]+)["'`]/g,      // navigate('/x') / navigate(`/x/${id}`)
  /\bhref=["']([^"'`]+)["']/g,                 // internal <a href="/x">
];

const SKIP = (t) =>
  !t.startsWith('/') ||          // relative / external / mailto / tel / #
  t.startsWith('//') ||          // protocol-relative external
  t.startsWith('/api/') ||       // API calls, not client routes
  t.startsWith('/assets/') ||    // static assets
  /\.[a-z0-9]{2,5}$/i.test(t.split('?')[0]); // file (.png, .js, .webmanifest…)

const dead = [];
for (const file of walk(SRC)) {
  if (file === APP) continue; // App.tsx itself declares the routes
  const text = readFileSync(file, 'utf8');
  for (const re of PATTERNS) {
    for (const m of text.matchAll(re)) {
      const raw = m[1];
      if (SKIP(raw)) continue;
      const target = normalise(raw);
      if (!matchesARoute(target)) {
        dead.push({ file: file.replace(ROOT + '/', ''), raw, target });
      }
    }
  }
}

// ── 3. Report ─────────────────────────────────────────────────────────────────
if (!hasCatchAll) {
  console.warn('⚠  No catch-all "*" route found in App.tsx — dead links would hard-error.');
}

if (dead.length === 0) {
  console.log(`✓ link-integrity: ${realRoutes.length} routes, every internal link resolves.`);
  process.exit(0);
}

console.error(`✗ link-integrity: ${dead.length} internal link(s) point at no declared route:\n`);
for (const d of dead) {
  console.error(`  ${d.file}\n    "${d.raw}"  →  ${d.target}  (no matching <Route>)`);
}
console.error('\nEither add the route to App.tsx or fix the link target.');
process.exit(1);
