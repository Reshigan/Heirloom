import { chromium } from 'playwright';
const OUT='/private/tmp/heirloom-shots';
const b = await chromium.launch();
// SW ALLOWED + persistent-ish: mimic a real returning browser.
const ctx = await b.newContext({ viewport:{width:430,height:932}, serviceWorkers:'allow' });
const p = await ctx.newPage();
await p.goto('https://heirloom.blue/', { waitUntil:'networkidle', timeout:45000 });
// wait for SW to register + control
await p.waitForTimeout(3000);
const sw1 = await p.evaluate(async()=>{ const r=await navigator.serviceWorker.getRegistration(); return { active: r?.active?.scriptURL||null, controller: !!navigator.serviceWorker.controller }; });
console.log('after first load:', JSON.stringify(sw1));
// reload — as a returning visitor would
await p.reload({ waitUntil:'networkidle' });
await p.waitForTimeout(2500);
const info = await p.evaluate(()=>({
  bundle: [...document.querySelectorAll('script[src]')].map(s=>s.src).find(s=>/assets\/index-/.test(s))?.split('/').pop()||'?',
  h1: document.querySelector('h1')?.textContent?.trim().slice(0,60)||'(none)',
  controller: !!navigator.serviceWorker.controller,
}));
console.log('after reload (SW-controlled):', JSON.stringify(info));
await p.screenshot({ path: OUT+'/sw-controlled-home.png' });
await b.close();
