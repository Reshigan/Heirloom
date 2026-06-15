import { chromium } from 'playwright';
import fs from 'node:fs';
const OUT='/private/tmp/heirloom-shots'; fs.mkdirSync(OUT,{recursive:true});
const ROUTES=[['desktop-home','/'],['desktop-pricing','/pricing'],['desktop-login','/login']];
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});
for(const [n,p] of ROUTES){
  const pg=await ctx.newPage();
  const r=await pg.goto('https://heirloom.blue'+p,{waitUntil:'networkidle',timeout:45000});
  await pg.waitForTimeout(2000);
  const bundle=await pg.evaluate(()=>[...document.querySelectorAll('script[src]')].map(s=>s.src).find(s=>/assets\/index-/.test(s))?.split('/').pop()||'?');
  await pg.screenshot({path:`${OUT}/${n}.png`,fullPage:false});
  console.log(n,'status='+r.status(),'bundle='+bundle);
  await pg.close();
}
await b.close();
