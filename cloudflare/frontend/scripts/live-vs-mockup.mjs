import { chromium } from 'playwright';
import fs from 'node:fs';
const OUT='/private/tmp/heirloom-shots/live'; fs.mkdirSync(OUT,{recursive:true});
const ROUTES=[['pwa','/loom/pwa'],['threshold','/loom'],['pricing','/pricing'],['marketing','/loom/marketing'],['home','/'],['login','/login']];
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:430,height:932},serviceWorkers:'block',deviceScaleFactor:2});
for(const [name,path] of ROUTES){
  const p=await ctx.newPage(); const errs=[];
  p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
  const r=await p.goto('https://heirloom.blue'+path,{waitUntil:'networkidle',timeout:45000}).catch(e=>({_e:e.message}));
  await p.waitForTimeout(2200);
  await p.screenshot({path:`${OUT}/${name}.png`,fullPage:false});
  const h1=await p.evaluate(()=>document.querySelector('h1,h2')?.innerText?.slice(0,60)||'');
  console.log(`${name.padEnd(10)} status=${r?.status?.()??r?._e} h1="${h1}" errs=${errs.length}`);
  await p.close();
}
await b.close(); console.log('→',OUT);
