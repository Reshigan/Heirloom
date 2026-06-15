import { chromium } from 'playwright';
import fs from 'node:fs';
const OUT='/private/tmp/heirloom-shots/authed'; fs.mkdirSync(OUT,{recursive:true});
const BASE='http://localhost:5173';
const USER={id:'u_demo',email:'ada@heirloom.test',firstName:'Ada',lastName:'Vance',avatarUrl:null,emailVerified:true,twoFactorEnabled:false,preferredCurrency:'USD',defaultThreadId:'t_demo'};
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:430,height:932},deviceScaleFactor:2,serviceWorkers:'block'});
// seed auth before any script runs
await ctx.addInitScript(([u])=>{
  localStorage.setItem('token','faketoken');
  localStorage.setItem('refreshToken','fakeref');
  localStorage.setItem('heirloom-auth', JSON.stringify({state:{user:u,isAuthenticated:true},version:0}));
},[USER]);
// mock every API call
await ctx.route(/api\.heirloom\.blue/, async route=>{
  const url=route.request().url();
  const path=new URL(url).pathname;
  let body={};
  if(/\/auth\/me/.test(path)) body=USER;
  else if(/threads?$/.test(path)) body=[{id:'t_demo',name:'The Vance Thread',memberCount:4}];
  else if(/(memories|entries|feed|timeline|weft|letters|voice|notifications|search)/.test(path)) body={items:[],data:[],results:[],memories:[],entries:[]};
  else if(/(family|members|people|kin|tree)/.test(path)) body={members:[],people:[],data:[]};
  else body={};
  await route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(body)});
});
const routes=[['pwa','/loom/pwa'],['weft','/loom/weft'],['read','/loom/read'],['voice','/loom/voice'],['kin','/loom/kin'],['family','/family'],['settings','/settings'],['compose','/compose'],['inbox','/inbox'],['search','/search']];
for(const [n,r] of routes){
  const p=await ctx.newPage();
  const errs=[]; p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,90));});
  await p.goto(BASE+r,{waitUntil:'networkidle',timeout:30000}).catch(e=>console.log(n,'nav',e.message));
  await p.waitForTimeout(2200);
  await p.screenshot({path:`${OUT}/${n}.png`});
  const h=await p.evaluate(()=>document.querySelector('h1,h2')?.innerText?.slice(0,46)||'');
  console.log(`${n.padEnd(9)} url=${p.url().replace(BASE,'')} h="${h}" errs=${errs.length}`);
  await p.close();
}
await b.close(); console.log('→',OUT);
