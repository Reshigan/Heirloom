// scripts/check-listener-rotation.mjs
// Pure-logic check for nextIndex: never 0-offset, always in range, never repeats.
function nextIndex(last, total, seed) {
  if (total <= 1) return 0;
  const offset = 1 + Math.floor(seed * (total - 1));
  return ((last < 0 ? 0 : last) + offset) % total;
}
const total = 52;
let last = -1;
let ok = true;
for (let t = 0; t < 100000; t++) {
  const seed = Math.random();
  const i = nextIndex(last, total, seed);
  if (i < 0 || i >= total) { ok = false; console.error('out of range', i); break; }
  if (i === last) { ok = false; console.error('repeated', i); break; }
  last = i;
}
console.log(ok ? 'PASS: no repeats, all in range' : 'FAIL');
process.exit(ok ? 0 : 1);
