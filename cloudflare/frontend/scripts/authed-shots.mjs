import { chromium } from 'playwright';
import fs from 'node:fs';
const OUT='/private/tmp/heirloom-shots/authed'; fs.mkdirSync(OUT,{recursive:true});
const stamp=process.env.STAMP||'x';
const email=`qa-${stamp}@heirloom-test.dev`;
const pw='Thread!'+stamp+'Aa9';
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:430,height:932},serviceWorkers:'block',deviceScaleFactor:2});
const p=await ctx.newPage();
const errs=[]; p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,120));});
await p.goto('https://heirloom.blue/signup',{waitUntil:'networkidle',timeout:45000});
await p.waitForTimeout(1200);
const fill=async(id,v)=>{const el=await p.$(`#${id}`); if(el){await el.fill(v);return true;} return false;};
await fill('s-thread','The QA Test Thread');
await fill('s-first','Ada'); await fill('s-last','Tester');
await fill('s-birth','1990');
await fill('s-email',email);
await fill('s-pw',pw); await fill('s-pw2',pw);
console.log('filled signup', email);
await p.screenshot({path:`${OUT}/00-signup-filled.png`});
// submit
await p.click('button[type="submit"]').catch(()=>{});
await p.waitForTimeout(4000);
console.log('after submit url=',p.url(),'errs=',errs.length, errs.slice(0,3));
const routes=[['pwa','/loom/pwa'],['weft','/loom/weft'],['read','/loom/read'],['voice','/loom/voice'],['kin','/loom/kin'],['family','/family'],['settings','/settings'],['compose','/compose']];
for(const [n,r] of routes){
  await p.goto('https://heirloom.blue'+r,{waitUntil:'networkidle',timeout:40000}).catch(e=>console.log(n,'nav',e.message));
  await p.waitForTimeout(2200);
  await p.screenshot({path:`${OUT}/${n}.png`});
  const h=await p.evaluate(()=>document.querySelector('h1,h2')?.innerText?.slice(0,50)||'');
  console.log(`${n.padEnd(9)} url=${p.url().replace('https://heirloom.blue','')} h="${h}"`);
}
await b.close(); console.log('→',OUT,'\nTEST ACCOUNT:',email);
