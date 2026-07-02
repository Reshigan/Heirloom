// Stamp the built service worker's cache name with the commit (or time), so
// EVERY deploy changes sw.js byte-wise and installed PWAs pick up the new
// shell on their next open. Runs as part of `npm run build`.
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const file = new URL('../dist/sw.js', import.meta.url).pathname;
let sha = '';
try { sha = execSync('git rev-parse --short HEAD').toString().trim(); } catch { /* no git */ }
const stamp = sha || String(Date.now());
let sw = readFileSync(file, 'utf-8');
sw = sw.replace(/const CACHE = 'heirloom-[^']*';/, `const CACHE = 'heirloom-${stamp}';`);
writeFileSync(file, sw);
console.log(`sw.js cache stamped: heirloom-${stamp}`);
